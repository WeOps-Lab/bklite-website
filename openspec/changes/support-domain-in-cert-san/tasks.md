## 1. 实现 SAN 生成辅助函数

- [x] 1.1 在 `deploy/docker-compose/bootstrap.sh` 新增 `is_ipv4_literal` 函数，使用正则 `^([0-9]{1,3}\.){3}[0-9]{1,3}$` 判别
- [x] 1.2 新增 `is_valid_hostname` 函数，按 RFC 1123 字符集校验（字母数字、`-`、`.`，不以 `-` 开头或结尾）
- [x] 1.3 新增 `resolve_host_ip` 函数，依次尝试 `getent hosts`、`host`、`nslookup`，返回首个 A 记录或空字符串
- [x] 1.4 新增 `build_san_entries` 函数，输入 `HOST_IP`，输出完整的 `subjectAltName` 字符串（包含固定三条 + 按形态生成的条目）

## 2. 改造 generate_tls_certs

- [x] 2.1 在 `generate_tls_certs` 中调用 `build_san_entries` 替换硬编码的 `san="DNS:nats,DNS:localhost,IP:127.0.0.1,IP:${HOST_IP}"`
- [x] 2.2 在调用前先做形态校验：非 IPv4 且非合法 hostname 时立即 `die` 并给出明确错误
- [x] 2.3 域名场景下解析 IP 失败时打印 WARNING 并继续（仅写 DNS SAN）
- [x] 2.4 保持已存在证书三件套时的跳过逻辑不变

## 3. dev 脚本评估（实现期发现：dev 无此 bug）

- [x] 3.1 ~~同步到 `deploy/dev/bootstrap.sh`~~ — 实现期发现 dev 的 SAN 不含 `HOST_IP`，本身无 bug；spec 已修订为"dev 保持原状"，跳过修改
- [x] 3.2 ~~验证 install.dev 重新生成~~ — 因 3.1 跳过，dev 脚本未变更，install.dev 不会触发重新生成；本任务无需执行

## 4. 验证

- [ ] 4.1 用 `HOST_IP=192.168.1.10` 跑一次完整 `bootstrap.sh`，确认证书生成与现有行为完全一致
- [ ] 4.2 用 `HOST_IP=aaxcemon.hkairport.com`（可解析）跑一次，确认 `openssl x509 -in server.crt -noout -text` 中 SAN 同时包含 DNS 和 IP 条目
- [ ] 4.3 用 `HOST_IP=internal.unresolvable.local`（不可解析）跑一次，确认 WARNING 输出且证书签发成功，SAN 仅含 DNS 条目
- [ ] 4.4 用 `HOST_IP=host_with_underscore` 跑一次，确认脚本以 ERROR 退出且 `conf/certs/` 无新文件残留
- [ ] 4.5 已存在 `conf/certs/{ca,server}.{crt,key}` 时，即便 `HOST_IP` 非法也能正常跳过证书阶段

## 5. 文档

- [x] 5.1 在部署文档（`docs/deploy/`）中说明 `HOST_IP` 现支持域名输入及对应行为
- [x] 5.2 在 `bootstrap.sh` 注释中标注 `build_san_entries` 函数的输入输出契约
