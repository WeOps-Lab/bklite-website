## Context

`bootstrap.sh` 的 `generate_tls_certs` 当前在 `openssl.conf` 的 `subjectAltName` 字段固定写：

```
subjectAltName = DNS:nats,DNS:localhost,IP:127.0.0.1,IP:${HOST_IP}
```

`HOST_IP` 在 `generate_ports_env` 阶段允许用户自由输入。当输入是域名（例如 `aaxcemon.hkairport.com`），OpenSSL 把 `IP:aaxcemon.hkairport.com` 解析失败抛 `bad ip address`，证书签发中断，整个部署失败。

被影响场景：内网/专有部署中习惯通过 FQDN 访问的环境，以及部分用户把 ingress 域名写进 `HOST_IP`、依赖 traefik 做域名分发的部署形态。

## Goals / Non-Goals

**Goals:**
- `HOST_IP` 是 IPv4 字面量时，行为与现状完全一致。
- `HOST_IP` 是域名时，自动写入 `DNS:` SAN，证书可成功签发。
- 域名场景下尽力解析出对应 IP 一并写入 SAN，使内部组件以 IP 互通时也能通过证书校验（NATS、server 之间常以容器网络/IP 通信）。
- 解析失败、形态非法时给出清晰错误，不静默退化为不可用证书。

**Non-Goals:**
- 不支持 IPv6 字面量（当前脚本其它环节也未支持，单独立项）。
- 不引入额外的外部依赖（如 `dig`、`getent` 之外的工具）；只用宿主机已具备的工具。
- 不重构既有的证书重签流程（这是另一个话题，见 `bootstrap.sh rotate-cert` 讨论）。
- 不修改证书的有效期、密钥强度等其它参数。

## Decisions

### Decision 1: 形态判别采用正则匹配 IPv4

匹配 `^([0-9]{1,3}\.){3}[0-9]{1,3}$` 视为 IPv4，否则视为域名。

**Rationale**: 形态判别只为决定 SAN 前缀，不需要严格语义校验——如果用户输入了一个非法的 IPv4（如 `999.1.1.1`），最终 OpenSSL 仍会拒绝，错误信息保留。简洁优于完备。

**Alternatives considered**:
- 用 `python -c "ipaddress.ip_address(...)"`：依赖 python，不一定在最小宿主上具备。
- 用 `getent ahosts`：会同时尝试解析域名，无法纯粹判别形态。

### Decision 2: 域名场景下解析 IP 写入额外 SAN，但解析失败不阻断签发

解析顺序：`getent hosts` → `host` → `nslookup`，任一成功取第一个 A 记录；全部失败则只写 `DNS:` SAN 并打印 WARNING。

**Rationale**: 内部组件以容器网络互联时通常用服务名，对外才用 `HOST_IP`。即便解析失败，DNS-only 的证书对浏览器和走 FQDN 的客户端足够；强制阻断会让没有 DNS 服务器的最小化部署不可用。

**Alternatives considered**:
- 强制要求能解析到 IP：会破坏纯内网无 DNS 部署。
- 只写 DNS、永不解析 IP：会让以容器内 IP 直连 traefik 的访问失败。

### Decision 3: 形态判别失败时报错退出，不降级

如果 `HOST_IP` 既不像 IPv4 也不像合法域名（含非法字符），直接 `die`，不尝试任何容错。

**Rationale**: 进入这个分支说明配置错误，继续生成只会得到不可用证书，让用户更早发现问题。

### Decision 4: 抽出 `build_san_entries` 辅助函数

将 SAN 拼接逻辑独立成函数，输入 `HOST_IP`，输出完整 `subjectAltName` 字符串。便于在 `dev` 版本脚本中复用，也便于后续单元化测试。

## Risks / Trade-offs

- **[Risk] 用户输入的域名包含通配符或特殊字符** → 形态校验把域名限制为 RFC 1123 主机名字符集（字母、数字、`-`、`.`），不合法直接 die。
- **[Risk] 容器内 alpine/openssl 镜像里 `getent` 行为差异** → 解析在宿主机执行（在 `docker run` 之前），不依赖容器环境。
- **[Risk] 解析到的 IP 与用户实际访问 IP 不同**（多网卡、split-DNS）→ WARNING 提示用户检查；用户可在 `port.env` 显式覆盖 `HOST_IP` 为目标 IP。
- **[Trade-off] 不做 IPv6 支持** → 用户群当前未提此需求，立项后续单独处理。

## Migration Plan

- 仅影响**首次签发**的代码路径；已有 `conf/certs/server.crt|key + ca.crt` 三件套的部署不会进入新逻辑，向后完全兼容。
- 想让现有部署用上新 SAN 规则的用户，需走"证书重签"流程（已在前序讨论中梳理），不在本变更范围。
- 无数据库 schema 变化、无配置文件结构变化，无回滚成本。
