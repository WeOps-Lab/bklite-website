## ADDED Requirements

### Requirement: Redis 与 FalkorDB 异步主从复制

主备 Redis SHALL 使用原生 `replicaof` 异步主从复制；FalkorDB（基于 Redis）采用相同机制。

#### Scenario: Redis 备机配置为 replica
- **WHEN** 在备机 Redis 容器上执行 `redis-cli -a $REDIS_PASSWORD INFO replication`
- **THEN** 输出 MUST 包含 `role:slave` 与 `master_link_status:up`

#### Scenario: FalkorDB 备机配置为 replica
- **WHEN** 在备机 FalkorDB 容器上执行 `redis-cli -p 6379 -a $FALKORDB_PASSWORD INFO replication`
- **THEN** 输出 MUST 包含 `role:slave` 与 `master_link_status:up`

### Requirement: 复制密码与现有密码一致

为简化运维，复制使用的密码 SHALL 与现有 `REDIS_PASSWORD` / `FALKORDB_PASSWORD` 一致，通过 `masterauth` 参数传入。

#### Scenario: Redis masterauth 已设置
- **WHEN** 检查备机 Redis 配置
- **THEN** `masterauth` MUST 等于 `requirepass`

### Requirement: 切换通过 REPLICAOF NO ONE 完成

切换 SHALL 通过对备机 Redis / FalkorDB 执行 `REPLICAOF NO ONE` 完成提升。

#### Scenario: 备机提升为 master
- **WHEN** 切换脚本对备机 Redis 执行 `REPLICAOF NO ONE`
- **THEN** 后续 `INFO replication` 输出 `role:master`

### Requirement: 不引入 Sentinel

部署 SHALL NOT 引入 Redis Sentinel。手动切换流程涵盖角色变更。

#### Scenario: 容器清单中无 sentinel
- **WHEN** 检查 HA 模式下 `docker compose ps`
- **THEN** 容器列表中 MUST NOT 包含 sentinel 或 cluster proxy 类容器

### Requirement: 业务通过 service 名访问

业务进程 SHALL 通过 compose service 名（`redis`、`falkordb`）访问，不直连 IP。切换后业务依然指向本机 service。

#### Scenario: 业务 Redis 主机配置
- **WHEN** 检查 server 等业务容器环境变量中的 Redis 地址
- **THEN** 主机部分 MUST 为 `redis` 或 `falkordb`，不得为 IP
