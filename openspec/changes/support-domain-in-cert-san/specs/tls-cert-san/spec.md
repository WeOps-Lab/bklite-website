## ADDED Requirements

### Requirement: SAN 条目按 HOST_IP 形态生成

`bootstrap.sh` 在生成自签名服务器证书时，SHALL 根据 `HOST_IP` 的形态决定 SAN 前缀：IPv4 字面量使用 `IP:`，否则使用 `DNS:`。固定的 `DNS:nats`、`DNS:localhost`、`IP:127.0.0.1` 三条 SAN 条目 SHALL 始终保留。

#### Scenario: HOST_IP 是 IPv4 字面量

- **WHEN** `HOST_IP=192.168.1.10`
- **THEN** 生成的 `subjectAltName` 包含 `DNS:nats,DNS:localhost,IP:127.0.0.1,IP:192.168.1.10`
- **AND** 证书签发成功，与变更前行为一致

#### Scenario: HOST_IP 是域名

- **WHEN** `HOST_IP=aaxcemon.hkairport.com`
- **THEN** 生成的 `subjectAltName` 包含 `DNS:aaxcemon.hkairport.com`
- **AND** 不再出现 `IP:aaxcemon.hkairport.com` 这种非法条目
- **AND** 证书签发成功

### Requirement: 域名场景下尝试解析 IP 并加入 SAN

当 `HOST_IP` 为域名时，`bootstrap.sh` SHALL 在签发前依次尝试 `getent hosts`、`host`、`nslookup` 解析其 A 记录，解析成功则将首个 IP 作为 `IP:` 条目追加到 SAN；解析失败 SHALL 打印 WARNING 但不中断签发。

#### Scenario: 域名可解析

- **WHEN** `HOST_IP=aaxcemon.hkairport.com` 且宿主机能解析到 `172.24.210.9`
- **THEN** SAN 同时包含 `DNS:aaxcemon.hkairport.com` 与 `IP:172.24.210.9`

#### Scenario: 域名不可解析

- **WHEN** `HOST_IP=internal.example.local` 且宿主机所有解析途径均返回失败
- **THEN** SAN 仅包含 `DNS:internal.example.local`（不含 IP 条目）
- **AND** 控制台打印 WARNING 提示解析失败但继续签发

### Requirement: 非法 HOST_IP 形态时立即退出

当 `HOST_IP` 既不匹配 IPv4 字面量、也不符合 RFC 1123 主机名字符集（仅允许字母、数字、`-`、`.`，不以 `-` 开头或结尾），`bootstrap.sh` SHALL 输出 ERROR 并以非零状态退出，不进行任何证书生成。

#### Scenario: 非法字符

- **WHEN** `HOST_IP=host_with_underscore`（包含下划线）或 `HOST_IP=host space.com`（包含空格）
- **THEN** 脚本以 ERROR 退出，错误信息明确指出 `HOST_IP` 形态非法
- **AND** `conf/certs/` 目录下不产生任何新文件

#### Scenario: 形态合法但值域非法的 IPv4

- **WHEN** `HOST_IP=999.999.999.999`（匹配 IPv4 字面量正则，但每段超出 0-255）
- **THEN** 脚本不在形态层做值域校验，会按 IPv4 写入 `IP:999.999.999.999` 进入 SAN
- **AND** 由 OpenSSL 在签发阶段拒绝并报错，用户能直接看到 OpenSSL 的错误信息——形态层与值域校验责任分离，本规则只覆盖前者

### Requirement: 已存在证书时跳过形态判别

当 `conf/certs/server.crt`、`conf/certs/server.key`、`conf/certs/ca.crt` 三个文件均已存在时，`bootstrap.sh` SHALL 完全跳过 SAN 生成与证书签发流程，不读取也不校验 `HOST_IP` 的形态。

#### Scenario: 三件套齐全

- **WHEN** `conf/certs/` 已包含完整的 `ca.crt + server.crt + server.key`
- **THEN** `generate_tls_certs` 直接 return，不触碰 `HOST_IP` 检查
- **AND** 即使此时 `HOST_IP` 形态非法，也不会导致脚本中断

### Requirement: dev 脚本不受本变更影响

`deploy/dev/bootstrap.sh` 的 SAN 是固定的 `DNS:nats,DNS:localhost,IP:127.0.0.1`，不依赖 `HOST_IP` 输入，本身不存在域名签发的 bug。本变更 SHALL 不修改 dev 脚本，避免引入未被使用的辅助函数（死代码）。如果未来 dev 也需要支持 `HOST_IP` 注入，再单独立项。

#### Scenario: dev 脚本保持原状

- **WHEN** 检视 `deploy/dev/bootstrap.sh` 的 `generate_tls_certs`
- **THEN** SAN 仍是固定 `DNS:nats,DNS:localhost,IP:127.0.0.1`，不引入 `is_ipv4_literal` / `build_san_entries` 等辅助函数
