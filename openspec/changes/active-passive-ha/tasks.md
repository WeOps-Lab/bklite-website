## 1. 前置准备

- [ ] 1.1 在测试环境拉起两台与现网等价的虚机，校准 docker-compose 部署能跑通  *(由运维执行)*
- [ ] 1.2 确认双向网络互通：5432 / 7422 / 9000 / 6379 / 6479 端口主备双向放行  *(由运维执行)*
- [ ] 1.3 与运维确认 DNS 提供商支持 TTL ≤ 60s，并准备好 A 记录变更通道  *(由运维执行)*
- [ ] 1.4 调研并列出现网所有 agent / 采集端清单，标注是否通过域名连接  *(由运维执行)*

## 2. 证书重签

- [x] 2.1 编写证书签发脚本，SAN 包含：`DNS:nats`、`DNS:localhost`、主备 hostname、主备 IP  → `bin/ha-gen-certs.sh`
- [ ] 2.2 使用现有 `Blueking Lite` CA 签发新 `server.crt` / `server.key`  *(在真实主机执行 `ha-gen-certs.sh`)*
- [ ] 2.3 在测试环境验证新证书：NATS 容器内 TLS 握手通过、`nats stream ls` 在 leafnode 间正常  *(由运维执行)*
- [x] 2.4 编写在线滚动证书更新步骤（先推 ca.crt，再换 server cert）  → 已写在 `Readme.md` 安装步骤第 2 节

## 3. 独立 HA 部署目录搭建

- [x] 3.1 创建 `deploy/docker-compose-ha/` 目录，从 `deploy/docker-compose/` 复制 `docker-compose.yaml`、`compose/`、`conf/`、`bin/`、`bootstrap.sh` 作为起点
- [x] 3.2 在新目录下增加 `ha.env.example`，含 `HA_ROLE`、`PEER_HOST`、`PG_REPL_PASSWORD`、`MINIO_SR_TOKEN`、`NATS_SERVER_NAME`、`NATS_INSTANCE_ID`、`VM_CONSUMER_DURABLE`、`VL_CONSUMER_DURABLE`
- [x] 3.3 改造新目录的 `bootstrap.sh`：在启动前 source `ha.env`、校验 `HA_ROLE` 取值合法，缺失或非法时退出报错
- [x] 3.4 在新目录的业务类服务（server / web / webhookd / nats-executor / stargazer / fusion-collector）compose 配置中加 `profiles: ["active"]`，备机启动不带 profile  → 在 `compose/ha.yaml`
- [x] 3.5 验证原 `deploy/docker-compose/` 目录所有文件未被修改（`git diff` 应为空）
- [ ] 3.6 验证单点部署入口仍可独立运行：`cd deploy/docker-compose && bash bootstrap.sh`  *(由运维执行)*
- [x] 3.7 文档化两种部署形态的入口选择与差异  → `docker-compose-ha/Readme.md` 末节

## 4. PostgreSQL 主备

- [x] 4.1 编写在主库创建 `replicator` 角色的 SQL 脚本，密码读自 `PG_REPL_PASSWORD`  → `conf/postgres/01-create-replicator.sh`
- [x] 4.2 在 `conf/postgres/` 增加 `pg_hba.conf` 模板，允许 `replicator` 通过 TLS 从备机 IP 连接  → `conf/postgres/pg_hba.conf`
- [x] 4.3 增加 entrypoint wrapper：当 `HA_ROLE=standby` 且 `PGDATA` 为空时执行 `pg_basebackup -R` 然后启动  → `conf/postgres/ha-entrypoint.sh`
- [ ] 4.4 在测试环境跑通首次 basebackup 流程，验证 standby 进入 `pg_is_in_recovery()=true`  *(由运维执行)*
- [ ] 4.5 验证写入主库后 60 秒内备库可见，且 `pg_stat_replication.state=streaming`  *(由运维执行)*
- [x] 4.6 编写 `bin/ha-status.sh` 的 PG 部分（延迟字节 + 秒数）

## 5. MinIO 站点复制

- [x] 5.1 编写一次性脚本：对所有 bucket 执行 `mc version enable`  → `bin/ha-minio-enable-versioning.sh`
- [ ] 5.2 在测试环境验证开启 versioning 后业务读写正常  *(由运维执行)*
- [x] 5.3 配置 Site Replication：在主节点用 `mc admin replicate add` 添加备节点  → `bin/ha-minio-setup-replication.sh`
- [ ] 5.4 验证：在主节点 PUT 对象后 60 秒内备节点能 GET  *(由运维执行)*
- [x] 5.5 配置 lifecycle policy 限制 noncurrent version 保留 ≤ 7 天  → `bin/ha-minio-apply-lifecycle.sh`
- [x] 5.6 编写 `bin/ha-status.sh` 的 MinIO 部分（调用 `mc admin replicate status`）

## 6. Redis 与 FalkorDB

- [x] 6.1 当 `HA_ROLE=standby` 时 Redis command 追加 `--replicaof <PEER_HOST> 6379 --masterauth $REDIS_PASSWORD`  → `compose/ha.yaml`
- [x] 6.2 当 `HA_ROLE=standby` 时 FalkorDB 通过环境变量 `REDIS_ARGS` 配置 `replicaof`  → `compose/ha.yaml`
- [ ] 6.3 在测试环境验证 `INFO replication` 输出 `role:slave` 且 `master_link_status:up`  *(由运维执行)*
- [x] 6.4 编写 `bin/ha-status.sh` 的 Redis / FalkorDB 部分

## 7. NATS 跨机房

- [x] 7.1 修改 `conf/nats/nats.conf` 模板：通过 bootstrap.sh 按 `HA_ROLE` 生成不同 `server_name` 与 leafnode 段
- [x] 7.2 当 `HA_ROLE=standby` 时，nats.conf 中加入 `leafnodes { remotes = [...] }` 指向主机 7422  → bootstrap.sh `generate_nats_config`
- [x] 7.3 准备初始化脚本：在备机启动后通过 `nats stream add --mirror=<source>` 给关键流配置 mirror  → `bin/ha-init-mirror-streams.sh`
- [x] 7.4 `nats-executor` 配置 `NATS_INSTANCE_ID` 来自 `ha.env`  → `compose/ha.yaml`
- [x] 7.5 vector 通过 `VECTOR_CONNECTION_NAME=${NATS_SERVER_NAME}` 区分主备订阅（VM/VL 通过 vector 间接消费）  → `compose/ha.yaml`
- [ ] 7.6 在测试环境验证：主机 publish 后 60 秒内备机 mirror 流消息计数追上  *(由运维执行)*
- [x] 7.7 编写 `bin/ha-status.sh` 的 NATS 部分（mirror lag）

## 8. 切换脚本

- [x] 8.1 编写 `bin/ha-failover.sh` 框架（含 `set -euo pipefail`、参数解析、日志）
- [x] 8.2 实现步骤 1：调用 `ha-status.sh` 做预检
- [x] 8.3 实现步骤 2：SSH 到主机停止业务进程；不可达时交互确认
- [x] 8.4 实现步骤 3：备机执行 `SELECT pg_promote(wait => true, wait_seconds => 60)` 并校验
- [x] 8.5 实现步骤 4：MinIO SR 状态确认（双向 SR 无需 promote）
- [x] 8.6 实现步骤 5：备机 Redis 与 FalkorDB `REPLICAOF NO ONE`
- [x] 8.7 实现步骤 6：备机 NATS mirror 流转为可写
- [x] 8.8 实现步骤 7：`docker compose --profile active up -d`
- [x] 8.9 实现步骤 8：业务容器状态检查
- [x] 8.10 实现步骤 9：打印待操作 DNS 变更指引
- [x] 8.11 编写 `bin/ha-failback.sh`，含反向同步追平交互确认
- [ ] 8.12 测试环境跑通完整 failover + failback 演练，记录耗时  *(由运维执行)*

## 9. 文档与发布

- [x] 9.1 编写 `deploy/docker-compose-ha/Readme.md`：前置条件 / 安装步骤 / 故障切换 / 回切 / 常见故障 / DNS 说明 / 与单点目录的关系
- [ ] 9.2 ~~在 `deploy/docker-compose/Readme.md` 增加一行指引~~  *(与 spec "单点目录完全不修改" 冲突，改为通过 docs 站点或仓库根 README 引导)*
- [ ] 9.3 在 docs 网站 `docs/deploy/` 增加 HA 安装与切换章节  *(独立 PR，避免本次 change 范围扩散)*
- [x] 9.4 整理已知限制清单（DNS 缓存、RPO 非零、versioning 空间膨胀）  → `Readme.md` "已知前置约束" 节

## 10. 验证与现网灰度  *(全部由运维执行)*

- [ ] 10.1 在测试环境完成至少一次 failover + 一次 failback，且数据校验通过
- [ ] 10.2 现网安排维护窗口，灰度部署备机（不影响主机服务）
- [ ] 10.3 现网执行 `ha-status.sh` 验证主备同步健康
- [ ] 10.4 现网安排切换演练（可选，受运维节奏决定）
- [ ] 10.5 复盘：RTO / RPO 实测、问题清单、后续优化项（如未来引入云 LB 替代 DNS）
