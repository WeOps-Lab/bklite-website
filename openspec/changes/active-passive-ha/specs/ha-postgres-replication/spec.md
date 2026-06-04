## ADDED Requirements

### Requirement: PostgreSQL 采用原生异步流复制

主备 PostgreSQL SHALL 使用 PostgreSQL 原生 physical streaming replication，模式 MUST 为异步。不引入 Patroni、repmgr 等第三方仲裁组件。

#### Scenario: 主库参数就位
- **WHEN** 检查主库参数
- **THEN** `wal_level` MUST ≥ `replica`，`max_wal_senders` MUST ≥ 5

#### Scenario: 复制为异步
- **WHEN** 在主库执行 `SHOW synchronous_standby_names`
- **THEN** 返回空字符串（即异步复制）

### Requirement: 主库提供专用复制账号

主库 SHALL 创建独立的 `replicator` 角色，仅授予 `REPLICATION` 权限，密码存储于 `ha.env` 的 `PG_REPL_PASSWORD`。

#### Scenario: 复制角色权限最小化
- **WHEN** 检查 `replicator` 角色的权限
- **THEN** 角色 MUST 拥有 `REPLICATION` 属性，且 MUST NOT 拥有 `SUPERUSER` 或 `CREATEDB`

#### Scenario: 复制账号写入 pg_hba.conf
- **WHEN** 检查 `pg_hba.conf`
- **THEN** MUST 存在一条条目允许 `replicator` 从备机 IP 通过 TLS 连接

### Requirement: 备库以 hot standby 启动

备库容器的 entrypoint SHALL 检测 `HA_ROLE=standby`；如果数据目录为空，MUST 先执行 `pg_basebackup -h <PEER_HOST> -U replicator -D <PGDATA> -R --wal-method=stream`；然后以 standby 模式启动。

#### Scenario: 首次启动初始化
- **WHEN** 备库首次启动且 `PGDATA` 为空
- **THEN** entrypoint 执行 `pg_basebackup` 拉取主库快照并自动生成 `standby.signal` 与 `primary_conninfo`

#### Scenario: 已初始化后启动
- **WHEN** 备库重启且 `PGDATA` 已存在且包含 `standby.signal`
- **THEN** entrypoint 直接启动 PostgreSQL，不再执行 basebackup

#### Scenario: 备库进入 standby 状态
- **WHEN** 备库启动完成
- **THEN** `pg_is_in_recovery()` MUST 返回 `true`

### Requirement: 复制健康可观测

部署 SHALL 提供查询复制状态的检查脚本，返回复制延迟（字节数与时间）。

#### Scenario: 主库视角检查
- **WHEN** 在主库执行 `SELECT * FROM pg_stat_replication`
- **THEN** 返回至少一条连接，`state` 为 `streaming`，`sync_state` 为 `async`

#### Scenario: 备库视角检查
- **WHEN** 在备库执行 `SELECT now() - pg_last_xact_replay_timestamp()`
- **THEN** 返回值 SHALL ≤ 60 秒（正常稳态）

### Requirement: 手动 promote 切换

切换 SHALL 通过调用 `pg_promote()` 完成；脚本 MUST 等待 `pg_is_in_recovery()` 返回 `false` 后才视为成功。

#### Scenario: promote 成功
- **WHEN** 在备库执行 `SELECT pg_promote(wait => true, wait_seconds => 60)`
- **THEN** 返回 `true`；后续查询 `pg_is_in_recovery()` 返回 `false`

#### Scenario: promote 失败时报错退出
- **WHEN** `pg_promote` 60 秒内未完成
- **THEN** 切换脚本 MUST 退出且非零退出码，不继续后续步骤

### Requirement: 业务侧不直连 IP

业务进程 SHALL 通过容器内部 service 名（`postgres`）访问数据库，不在配置中硬编码主备 IP。切换后业务依然连接本机 `postgres`。

#### Scenario: 业务 DB_HOST 配置
- **WHEN** 检查 server / mlflow 等容器内 `DB_HOST` 环境变量
- **THEN** 值 MUST 为 `postgres`（compose service 名），不得包含 IP 地址
