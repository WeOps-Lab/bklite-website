## Why

`bootstrap.sh` 在生成自签名 TLS 证书时硬编码 `IP:${HOST_IP}` 作为 SAN 条目，当用户把 `HOST_IP` 配置成域名（例如内网部署里使用 FQDN 而非纯 IP）时，OpenSSL 会因 `bad ip address` 直接报错，整个部署流程中断。这阻止了用域名作为统一访问入口的部署形态。

## What Changes

- 在 `bootstrap.sh` 的 `generate_tls_certs` 中增加对 `HOST_IP` 的形态判别（IPv4 字面量 vs 域名），按形态生成对应的 `IP:` 或 `DNS:` SAN 条目。
- 当 `HOST_IP` 为域名时，尝试解析其对应 IP 并同时加入 SAN，使 sidecar / 内部组件以 IP 直连时也能通过证书校验。
- 生成失败时给出清晰的错误信息（区分"非法 IP"和"域名解析失败"两种情形）。
- `dev` 版本 `deploy/dev/bootstrap.sh` 同步保持一致行为。

## Capabilities

### New Capabilities
- `tls-cert-san`: 自签名 TLS 证书 SAN 条目的生成规则——根据 `HOST_IP` 形态决定使用 `IP:` 还是 `DNS:` 前缀，并在域名场景下同时纳入解析 IP。

### Modified Capabilities
<!-- 暂无 -->

## Impact

- **代码**：`deploy/docker-compose/bootstrap.sh`、`deploy/dev/bootstrap.sh` 中的 `generate_tls_certs` 函数。
- **行为**：仅影响首次签发证书的路径；已生成 `server.crt/server.key/ca.crt` 三件套的部署不触发，向后兼容。
- **依赖**：宿主机需要可用的 `getent` 或 `host`/`nslookup` 之一用于域名解析；解析不可用时降级为只写 DNS SAN 并告警。
- **文档**：部署文档需说明 `HOST_IP` 现在支持域名输入。
