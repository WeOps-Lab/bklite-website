---
sidebar_position: 4
---

# 安全加固手册

本手册面向使用 Docker Compose 部署的 **BK-Lite** 生产环境，提供一套可逐项落地的安全加固基线。建议在系统上线前、以及每次重大变更后，按本手册逐项核查并签字确认。

:::tip 适用范围
本手册基于 BK-Lite 官方 `install.run` / `bootstrap.sh` 单机一体化部署形态编写。若你使用企业版外部数据库或自定义编排，请结合实际拓扑调整。
:::

## 加固清单总览

| # | 加固项 | 风险等级 | 是否必做 |
|---|--------|----------|----------|
| 1 | [版本升级与镜像更新](#1-版本升级与镜像更新) | 中 | 建议 |
| 2 | [网络连接与访问入口检查](#2-网络连接与访问入口检查) | 中 | 建议 |
| 3 | [暴露面收敛（端口加固）](#3-暴露面收敛端口加固) | **高** | **必做** |
| 4 | [宿主机与依赖补丁更新](#4-宿主机与依赖补丁更新) | 中 | 建议 |
| 5 | [管理员账户加固](#5-管理员账户加固) | **高** | **必做** |
| 6 | [敏感凭据与密钥保护](#6-敏感凭据与密钥保护) | **高** | **必做** |
| 7 | [宿主机 SSH 访问加固](#7-宿主机-ssh-访问加固) | 高 | 建议 |
| 8 | [TLS/SSL 协议与证书加固](#8-tlsssl-协议与证书加固) | 高 | 建议 |
| 9 | [启用审计日志与告警](#9-启用审计日志与告警) | 中 | 建议 |
| 10 | [Docker 守护进程加固（daemon.json）](#docker-daemon) | 中 | 建议 |

> 下文所有命令默认在部署目录 `/opt/bk-lite` 下执行。

---

## 1. 版本升级与镜像更新

**目的**：及时获取上游安全修复，避免运行带有已知漏洞的旧版本组件。

BK-Lite 的安装脚本设计为**幂等**，重复执行即可拉取并切换到最新镜像，不会破坏已部署的数据与配置。

```bash
# 在线环境：重新执行安装脚本即可完成镜像更新
curl -sSL https://bklite.ai/install.run | bash -s -

# 查看当前运行镜像版本，确认更新生效
docker compose ps --format "table {{.Name}}\t{{.Image}}"
```

离线环境需先在联网机器上重新制作离线包，再分发到目标服务器后执行 `bootstrap.sh`，详见[系统部署指南](../deploy/docker-compose.md)。

**核查要点**：

- [ ] 建立定期检查上游版本的机制（建议每月一次）。
- [ ] 升级前先执行[备份](./backup-restore.md)，确保可回滚。
- [ ] 升级后核对各组件 `Status` 为 `healthy`。

---

## 2. 网络连接与访问入口检查

**目的**：确保用户只能通过受控的统一入口（Traefik + TLS）访问平台，避免出现未经预期的访问路径。

BK-Lite 的唯一对外访问入口是 **Traefik**，监听 `TRAEFIK_WEB_PORT`（默认 `443`）并强制 TLS。访问地址形如 `https://<HOST_IP>:<TRAEFIK_WEB_PORT>`。

```bash
# 确认对外入口与端口配置
cat port.env        # 查看 HOST_IP 与 TRAEFIK_WEB_PORT

# 验证入口可达且走 HTTPS
curl -kv https://<HOST_IP>:443 2>&1 | head -20
```

**核查要点**：

- [ ] `HOST_IP` 与对外发布的地址/域名一致；变更地址后需重签证书（清理 `conf/certs/` 后重跑脚本）。
- [ ] 业务用户一律通过 Traefik 入口访问，不直连任何后端服务端口。
- [ ] 如部署在公网，前置使用云厂商安全组 / 负载均衡，仅放通入口端口。

---

## 3. 暴露面收敛（端口加固）

:::danger 高危项 · 必做
默认部署会将多个**数据层与中间件端口直接绑定到宿主机 `0.0.0.0`**。若服务器具备公网 IP 或处于不受信网络，这些端口可能被直接访问，造成数据泄露或被接管。**这是本手册最重要的加固项。**
:::

**目的**：将攻击面收敛到仅有的必要入口，封堵无需对外的内部端口。

### 3.1 端口分类

| 端口 | 组件 | 用途 | 对外要求 |
|------|------|------|----------|
| `443`（`TRAEFIK_WEB_PORT`） | Traefik | Web/API 统一入口 | ✅ 必须开放 |
| `162/udp` | Fusion-Collector | SNMP Trap 接收 | ⚠️ 仅对**受管设备网段**开放 |
| `514/udp` | Fusion-Collector | Syslog 接收 | ⚠️ 仅对**受管设备网段**开放 |
| `1514` | Fusion-Collector | Beats 日志接收 | ⚠️ 仅对**受管节点网段**开放 |
| `5432` | PostgreSQL | 关系数据库 | ❌ 应封堵 |
| `6379` | Redis | 缓存/会话/Broker | ❌ 应封堵 |
| `6479` | FalkorDB | 图数据库 | ❌ 应封堵 |
| `4222` / `7422` | NATS | 消息/Leaf 节点 | ✅ 必须开放 |
| `8428` | VictoriaMetrics | 指标存储 | ❌ 应封堵 |
| `9428` | VictoriaLogs | 日志存储 | ❌ 应封堵 |
| `9000` / `9001` | MinIO | 对象存储 / 控制台 | ❌ 应封堵 |
| `15000` | MLflow | 实验跟踪 | ❌ 应封堵 |

> 标记为「❌ 应封堵」的端口是平台内部组件互相通信用的，业务访问无需经过它们。

### 3.2 使用宿主机防火墙收敛（推荐）

最小改动的做法是用宿主机防火墙：**默认拒绝入站**，仅放通入口端口，以及对受管网段开放采集端口。

:::warning 注意 Docker 与防火墙的关系
Docker 发布端口时会直接写入 `iptables` 的 `DOCKER` 链，可能**绕过 `ufw`/`firewalld` 的普通规则**。生产环境建议优先在**云安全组 / 网络 ACL / 上层防火墙**做收敛；若必须在主机侧处理，请使用 `DOCKER-USER` 链。
:::

以 `firewalld` 为例（按受管网段替换 `<管理网段>`）：

```bash
# 仅放通 Web 入口
firewall-cmd --permanent --add-port=443/tcp

# 采集端口仅对受管网段放通
firewall-cmd --permanent --zone=internal --add-source=<管理网段>/24
firewall-cmd --permanent --zone=internal --add-port=162/udp
firewall-cmd --permanent --zone=internal --add-port=514/udp
firewall-cmd --permanent --zone=internal --add-port=1514/tcp

firewall-cmd --reload
```

使用 `iptables DOCKER-USER` 链封堵内部端口的公网访问（示例，按需调整网卡/网段）：

```bash
# 仅允许内网来源访问数据端口，其余一律丢弃
for p in 5432 6379 6479 4222 7422 8428 9428 9000 9001 15000; do
  iptables -I DOCKER-USER -p tcp --dport $p ! -s 10.0.0.0/8 -j DROP
done
```

### 3.3 收紧端口绑定地址（可选，更彻底）

对于完全无需被其他主机访问的内部端口，可将其 `ports` 映射从 `0.0.0.0` 改为仅绑定本机回环地址。编辑 `compose/` 下对应文件，例如 `compose/postgres.yaml`：

```yaml
ports:
  - "127.0.0.1:5432:5432"   # 由 "5432:5432" 改为仅本机可访问
```

修改后重新生成并应用编排：

```bash
bash bootstrap.sh        # 重新生成 docker-compose.yaml 并应用
```

> 若你的采集探针、外部 BI 工具确实需要直连某端口，请勿一刀切封堵，改为按来源 IP 白名单放通。

**核查要点**：

- [ ] 用 `ss -tlnp` / 外部扫描确认仅入口端口对外可达。
- [ ] 采集端口仅对受管网段开放。
- [ ] 数据库/缓存/对象存储端口在公网不可达。

```bash
# 本机查看监听端口
ss -tlnp
# 从另一台机器验证内部端口不可达（应超时或拒绝）
nc -zv <HOST_IP> 5432
```

---

## 4. 宿主机与依赖补丁更新

**目的**：保持宿主机操作系统、Docker 引擎及内核处于受支持且已打补丁的状态。

```bash
# 操作系统补丁（按发行版选择）
sudo apt update && sudo apt upgrade -y        # Debian/Ubuntu
sudo dnf upgrade --refresh -y                 # RHEL/CentOS/Rocky

# 确认 Docker / Compose 版本满足并高于最低要求
docker --version          # 要求 >= 20.10.23
docker compose version    # 要求 >= v2.27.0
```

**核查要点**：

- [ ] 启用操作系统的安全补丁自动更新（如 `unattended-upgrades` / `dnf-automatic`）。
- [ ] 定期重启以使内核补丁生效（结合维护窗口）。
- [ ] 移除宿主机上无关的服务与软件，减少攻击面。

---

## 5. 管理员账户加固

:::danger 高危项 · 必做
全新部署后的初始管理员账号为 **用户名 `admin` / 密码 `password`**。**首次登录后必须立即修改**，否则等同于无密码暴露在网络上。
:::

**目的**：消除默认弱口令、遵循最小权限原则、强化登录认证。

### 5.1 立即修改默认口令

部署完成后，使用 `admin / password` 登录 `https://<HOST_IP>:<端口>`，第一时间在「控制台 → 个人设置」修改密码为高强度口令。

### 5.2 超级管理员最小化

参考平台内置的[安全最佳实践](../system/feature.md)：

- 超级管理员（Super Admin）拥有全量数据与接管权限，**仅向极少数审计/合规人员保留**，并配备更高随机度口令与更短的失效周期。
- 日常运维与配置使用**仅限业务范围的「平台管理员」**账号，避免误操作造成全局破坏。
- 在「系统管理 → 用户管理」中清理无用账号，核查每个账号的角色挂载是否符合最小权限。

### 5.3 开启登录安全策略

在「系统管理 → 安全管理 → 安全设置」中配置：

- [ ] **密码复杂度**：设置最小长度与复杂度要求。
- [ ] **账户锁定**：配置多次登录失败后锁定，抵御字典/爆破攻击。
- [ ] **OTP 双因子认证**：对管理员账号强制开启。
- [ ] **口令轮换**：设置定期更换与到期提醒。
- [ ] （可选）对接企业统一认证源，实现一致的身份策略与单点登录。

**核查要点**：

- [ ] `admin` 默认口令已修改。
- [ ] 超级管理员数量已收敛到必要的最少人数。
- [ ] 密码策略、账户锁定、OTP 已启用。

---

## 6. 敏感凭据与密钥保护

:::danger 高危项 · 必做
安装脚本生成的所有组件口令与密钥（PostgreSQL、Redis、NATS、MinIO、FalkorDB 密码及 `SECRET_KEY`、`NEXTAUTH_SECRET`）以**明文**保存在部署目录的 `common.env` 与 `db.env` 中。任何能读取这些文件的人即可获得后端完全控制权。
:::

**目的**：保护落盘的明文凭据，并提升弱密钥强度。

### 6.1 收紧凭据文件权限

```bash
cd /opt/bk-lite
# 仅 root 可读写
chmod 600 common.env db.env port.env .env 2>/dev/null
chown root:root common.env db.env port.env .env 2>/dev/null

# 证书私钥同样收紧
chmod 600 conf/certs/*.key conf/traefik/certs/*.key 2>/dev/null
```

### 6.2 核查与轮换密钥

```bash
# 检查是否存在弱/短密钥（NEXTAUTH_SECRET 默认仅 12 位，建议加长）
grep -E "SECRET|PASSWORD" common.env db.env
```

如需轮换某个口令：修改 `common.env` / `db.env` 中对应值，重新执行 `bash bootstrap.sh` 重建编排并重启相关服务。

:::warning
修改 `POSTGRES_PASSWORD` 等已初始化的数据库口令，需同步更新数据库内的实际口令，否则服务将无法连接。轮换前请务必先备份并在维护窗口操作。
:::

**核查要点**：

- [ ] `common.env` / `db.env` / `.env` 权限为 `600`，属主为 `root`。
- [ ] 证书私钥 `*.key` 权限为 `600`。
- [ ] 凭据文件未被纳入任何代码仓库或备份归档的明文区域。
- [ ] `NEXTAUTH_SECRET` 等较短密钥已评估并按需加长。

---

## 7. 宿主机 SSH 访问加固

**目的**：BK-Lite 作为服务器应用部署，宿主机 SSH 是主要的远程管理通道，需重点加固（而非禁用）。

编辑 `/etc/ssh/sshd_config`：

```bash
# 禁用密码登录，仅允许密钥
PasswordAuthentication no
PubkeyAuthentication yes

# 禁止 root 直接登录
PermitRootLogin no

# 关闭空口令与过时协议
PermitEmptyPasswords no
Protocol 2

# （可选）变更默认端口、限制登录用户
# Port 22022
# AllowUsers opsuser
```

```bash
# 校验配置并重载
sudo sshd -t && sudo systemctl reload sshd
```

**核查要点**：

- [ ] 仅允许密钥认证，禁用密码登录。
- [ ] 禁止 root 直接登录，使用普通账号 + `sudo`。
- [ ] 通过防火墙/安全组将 SSH 限制为运维跳板机/可信来源 IP。
- [ ] 启用登录失败防护（如 `fail2ban`）。

---

## 8. TLS/SSL 协议与证书加固

**目的**：默认部署使用**自签名证书**（服务器证书有效期 825 天，CA 3650 天），且未约束 TLS 版本与加密套件。生产环境应替换为受信任证书并收紧协议。

### 8.1 厘清两类证书的作用域（务必先读）

部署时由 `bootstrap.sh` 生成的自签名 CA 与服务器证书放在 `conf/certs/`（含 `ca.key`、`ca.crt`、`server.key`、`server.crt`），它被**两个完全不同的用途共用**：

| 证书用途 | 实际读取位置 | 影响范围 | 可否单独替换 |
|----------|--------------|----------|--------------|
| **Web/API（HTTPS）** | `conf/traefik/certs/`（`server.crt` 副本） | 浏览器、API 客户端 | ✅ 可单独替换 |
| **NATS（agent 信任链）** | `conf/certs/`（挂载到 NATS，含 `ca.crt`） | **所有已部署的采集器 / Agent** | ⚠️ 高影响，慎改 |

:::danger NATS 证书影响范围极大
所有采集器 / Agent 通过 `tls://` 连接 NATS，并**校验由原始自签名 CA（`conf/certs/ca.crt`）签发的服务器证书**（leafnodes 开启了 `verify: true`，Agent 侧固化了该 CA）。

**如果用「非原始 CA」签发的证书替换 `conf/certs/` 下的内容，所有已部署的 Agent 会因证书校验失败而全部断连、不可用。** 因此请把 HTTPS 证书与 NATS 证书分开处理：HTTPS 证书可随时单独替换；NATS 证书除非用原始 CA 重新签发，否则等同于一次需要重装全部 Agent 的破坏性变更。
:::

### 8.2 单独替换 HTTPS（Web/API）证书（安全，不影响 Agent）

把企业内部 CA 或公网 CA 签发的证书**只替换到 Traefik 的证书目录**，不要动 `conf/certs/`：

```bash
cd /opt/bk-lite
# 备份原 HTTPS 证书
cp -a conf/traefik/certs conf/traefik/certs.bak

# 仅替换 Traefik 使用的证书与私钥（保持文件名）
cp <你的证书>.crt conf/traefik/certs/server.crt
cp <你的私钥>.key conf/traefik/certs/server.key

chmod 600 conf/traefik/certs/server.key
docker compose restart traefik
```

> 此操作只影响浏览器/API 的 HTTPS 体验，**不触及 NATS 与 Agent 的信任链**，可放心进行。

### 8.3 替换 NATS 证书（高影响，仅在必要时）

`conf/certs/` 是 NATS 与 Agent 的共享信任根，**不要直接拷入外部 CA 的证书**。如确需更换，二选一：

- **用原始 CA 重新签发服务器证书（推荐）**：使用现有的 `conf/certs/ca.key` + `ca.crt` 重新签发 `server.crt`（例如延长有效期或更新 SAN），CA 不变 → Agent 信任链不受影响，无需重装 Agent。
- **整体更换 CA（破坏性）**：清理 `conf/certs/` 后重跑 `bootstrap.sh` 重新签发，**必须同步重装 / 重新纳管所有采集器与 Agent**，请在维护窗口并提前通知。

```bash
# 查看证书有效期（HTTPS 与 NATS 服务器证书相同）
openssl x509 -in conf/certs/server.crt -noout -dates -subject
```

### 8.4 收紧 TLS 协议版本与加密套件

编辑 `conf/traefik/dynamic.yml`，在 `tls:` 下新增 `options`，强制 TLS 1.2 及以上并使用强加密套件：

```yaml
tls:
  options:
    default:
      minVersion: VersionTLS12
      sniStrict: true
      cipherSuites:
        - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305
        - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
  certificates:
    - certFile: /etc/certs/server.crt
      keyFile: /etc/certs/server.key
  stores:
    default:
      defaultCertificate:
        certFile: /etc/certs/server.crt
        keyFile: /etc/certs/server.key
```

`dynamic.yml` 支持热加载（`providers.file.watch=true`），保存后即生效。可用以下命令验证：

```bash
# 应拒绝 TLS 1.0/1.1，接受 TLS 1.2+
nmap --script ssl-enum-ciphers -p 443 <HOST_IP>
```

**核查要点**：

- [ ] HTTPS（Web/API）证书已替换为受信任证书，且**仅改动 `conf/traefik/certs/`**（或将企业根 CA 下发到客户端信任库）。
- [ ] 未用非原始 CA 的证书直接覆盖 `conf/certs/`，Agent 连接正常未中断。
- [ ] 最低 TLS 版本为 1.2，禁用弱加密套件。
- [ ] 建立证书到期监控（HTTPS 与 NATS 服务器证书默认 825 天到期），避免到期中断。

---

## 9. 启用审计日志与告警

**目的**：确保安全事件可追溯、异常可及时感知。

### 9.1 平台内审计日志

BK-Lite「系统管理 → 安全管理」内置全局审计能力，且以只读形式保障防篡改：

- [ ] **登录日志**：核查登录来源与失败记录，识别异常地址。
- [ ] **操作日志**：追踪关键配置变更与高危操作。
- [ ] **异常错误日志**：排查程序级异常。
- [ ] 定期导出留存，满足合规审计要求。

### 9.2 配置告警通知

- [ ] 在「系统管理 → 通知渠道」配置企业微信/钉钉/飞书机器人或自定义 Webhook（敏感凭据由平台加密接管）。
- [ ] 在告警中心配置面向安全的告警策略（如登录失败激增、关键服务不可用）。

### 9.3 基础设施层日志

```bash
# 入口访问日志（Traefik 已启用 accesslog）
docker compose logs -f traefik

# 关键服务日志
docker compose logs -f server
```

**核查要点**：

- [ ] 登录/操作/异常日志均开启并定期审阅。
- [ ] 安全相关告警已配置并验证可送达。
- [ ] 宿主机与容器日志纳入留存策略。

---

## 10. Docker 守护进程加固（daemon.json） {#docker-daemon}

**目的**：BK-Lite 的所有组件都运行在 Docker 之上，守护进程（dockerd）的默认配置偏向易用而非安全。通过 `/etc/docker/daemon.json` 收紧引擎层基线，可同时缓解权限提升、日志撑爆磁盘、Docker API 暴露等风险。

### 10.1 推荐的 daemon.json

```json
{
  "live-restore": true,
  "no-new-privileges": true,
  "icc": false,
  "userland-proxy": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "5"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  },
  "storage-driver": "overlay2"
}
```

各项含义与对 BK-Lite 的影响：

| 配置 | 作用 | 说明 |
|------|------|------|
| `live-restore` | 守护进程重启/升级时容器保持运行 | 提升可用性，后续重启 dockerd 不再中断 BK-Lite 服务 |
| `no-new-privileges` | 全局禁止容器内进程提权（setuid 等） | 默认安全基线，**应用后务必验证各服务 `healthy`** |
| `icc` | 关闭默认 bridge 网络的容器互通 | BK-Lite 使用自定义 `prod` 网络，**不受影响**，可安全开启 |
| `userland-proxy` | 关闭用户态端口代理，改走 iptables | 与[第 3 节防火墙](#3-暴露面收敛端口加固)配合，端口转发更直接 |
| `log-driver` / `log-opts` | 限制单容器日志大小与滚动数量 | 防止容器日志写满磁盘（默认无上限） |
| `default-ulimits` | 提升文件句柄上限 | 避免高并发下因 `nofile` 不足导致连接失败 |
| `storage-driver` | 显式使用 `overlay2` | 现代内核推荐的稳定存储驱动 |

### 10.2 应用配置

```bash
# 创建/编辑配置文件
sudo mkdir -p /etc/docker
sudo vi /etc/docker/daemon.json     # 写入上述内容

# 校验 JSON 合法性
python3 -m json.tool /etc/docker/daemon.json >/dev/null && echo "JSON OK"

# 重启 Docker 使配置生效
sudo systemctl restart docker
```

:::warning 首次应用请在维护窗口操作
`live-restore` 只有在「已生效后」的下一次 dockerd 重启才会保留容器；**首次写入并重启 Docker 时容器仍会被重启**。请在维护窗口执行，并在重启后确认服务恢复。
:::

```bash
# 验证关键项已生效
docker info --format 'LiveRestore={{.LiveRestoreEnabled}}'
# 确认 BK-Lite 各服务恢复健康
cd /opt/bk-lite && docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

### 10.3 注意事项

- **不要开启 `userns-remap`**：它会改变挂载文件的属主映射，导致 Traefik 挂载的 `/var/run/docker.sock` 以及 root 属主的 `conf/` 配置与证书无法读取，BK-Lite 将启动失败。
- **不要将 Docker API 暴露到 TCP**：保持默认的 Unix Socket（`/var/run/docker.sock`），切勿在 `daemon.json` 中配置 `"hosts": ["tcp://0.0.0.0:2375"]`。如确需远程管理，必须启用 TLS 双向认证。
- 若开启 `no-new-privileges` 后某个服务无法启动，可在该服务的 compose 定义中单独通过 `security_opt` 放开，而非全局关闭。

**核查要点**：

- [ ] `/etc/docker/daemon.json` 已写入并通过 JSON 校验。
- [ ] `docker info` 显示 `LiveRestore=true`。
- [ ] 应用配置后所有 BK-Lite 服务 `healthy`。
- [ ] Docker API 未通过 TCP 对外暴露。

---

## 加固完成核查表

| 加固项 | 状态 | 负责人 | 完成日期 |
|--------|------|--------|----------|
| 1. 版本升级与镜像更新 | ☐ | | |
| 2. 网络连接与访问入口检查 | ☐ | | |
| 3. 暴露面收敛（端口加固） | ☐ | | |
| 4. 宿主机与依赖补丁更新 | ☐ | | |
| 5. 管理员账户加固 | ☐ | | |
| 6. 敏感凭据与密钥保护 | ☐ | | |
| 7. 宿主机 SSH 访问加固 | ☐ | | |
| 8. TLS/SSL 协议与证书加固 | ☐ | | |
| 9. 启用审计日志与告警 | ☐ | | |
| 10. Docker 守护进程加固 | ☐ | | |

## 获取帮助

- [运维手册首页](./index.md)
- [备份与还原](./backup-restore.md)
- [系统部署指南](../deploy/docker-compose.md)
- [GitHub Issues](https://github.com/TencentBlueKing/bk-lite/issues)
