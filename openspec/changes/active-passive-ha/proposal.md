## Why

当前 BK-Lite 的 docker-compose 部署是单机部署（参考 10.10.41.149 现网环境），所有有状态组件（PostgreSQL、MinIO、Redis、FalkorDB、NATS JetStream、VictoriaMetrics、VictoriaLogs）都只跑一份。一旦该主机宕机或机房断电，整个服务不可用且无法快速恢复。

我们需要一个**跨机房主备**部署形态：备机平时承担数据同步、不对外提供业务能力；主机故障时由运维**手动**切换流量到备机。目标 RPO ≤ 1 分钟，RTO ≤ 30 分钟（受 DNS 切换上限约束）。

## What Changes

- 新增主备（active-passive）部署形态，主备各跑一套完整组件，跨机房部署
- 入口层：使用 DNS 切换（受现网约束，已知 RTO 较慢，写明前置条件）
- 备机业务进程（`server`、`webhookd`、`nats-executor`、`web`、`stargazer`、`fusion-collector`）平时**不启动**，仅 DB 类组件常驻
- PostgreSQL 通过原生 streaming replication（异步）做主备同步
- MinIO 通过 Site Replication 做双向异步同步，所有 bucket 强制开启 versioning
- Redis、FalkorDB 通过 `replicaof` 做异步主从复制
- NATS JetStream 通过 leafnode + stream mirror 跨机房同步，VictoriaMetrics 与 VictoriaLogs 不做直接复制，而是各自从本地 NATS 消费数据（前提：metrics/logs 数据 100% 经 NATS 入站）
- 证书统一重签，SAN 覆盖主备两台主机的内网 IP 和复制端点
- 主备共用同一份 `.env`，仅引入 `HA_ROLE=primary|standby` 一个差异化变量；各组件通过 entrypoint 脚本按角色启动
- 提供手动切换 runbook 脚本，按 "promote PG → 切 MinIO 主权 → 启动备机业务进程 → 改 DNS" 固定顺序执行
- **HA 部署独立于现有单点部署**：新增独立目录 `deploy/docker-compose-ha/`，含自己的 `bootstrap.sh`、`docker-compose.yaml`、`bin/` 与 `conf/`。现有单点部署目录 `deploy/docker-compose/` 完全不动
- **BREAKING（仅 HA 模式）**：HA 模式下 MinIO 强制启用 bucket versioning；从单点迁移到 HA 需要一次数据迁移窗口

## Capabilities

### New Capabilities

- `ha-topology`: 主备拓扑定义、角色变量、入口切换策略、共享配置约束
- `ha-postgres-replication`: PostgreSQL 主备流复制部署、promote、回切的部署形态
- `ha-minio-replication`: MinIO 站点复制部署、bucket versioning 要求、切换流程
- `ha-keyvalue-replication`: Redis 与 FalkorDB 主从复制部署
- `ha-nats-replication`: NATS JetStream 跨机房 leafnode/mirror 部署，以及 VM/VL 通过本地 NATS 消费的拓扑
- `ha-failover-runbook`: 手动切换的固定步骤、健康检查、回切流程

### Modified Capabilities

无。现有 `enterprise-external-db` 与 `offline-image-consistency` 不涉及 HA 行为。

## Impact

**代码与配置（全部在新目录下，不影响单点部署）**：
- 新增 `deploy/docker-compose-ha/` 目录，结构与 `deploy/docker-compose/` 平行：
  - `bootstrap.sh`：HA 专用启动脚本，校验 `HA_ROLE` 并按角色分支
  - `docker-compose.yaml` + `compose/*.yaml`：HA 形态下的服务定义（含 profiles、role-aware entrypoint）
  - `conf/`：HA 专用配置（nats leafnode、pg standby 模板、minio SR 初始化脚本、redis/falkordb replicaof 配置）
  - `bin/ha-failover.sh`、`bin/ha-failback.sh`、`bin/ha-status.sh`：切换与健康检查脚本
  - `ha.env.example`：差异化变量样例
- 证书重签流程：新增脚本（位于 `deploy/docker-compose-ha/bin/gen-certs.sh`），SAN 增加主备主机
- 现有 `deploy/docker-compose/` 目录与 `bootstrap.sh` 完全不修改

**运维流程**：
- HA 模式有独立的安装入口与文档（`deploy/docker-compose-ha/Readme.md` 或 `HA.md`）
- 部署文档站点增加 HA 章节，与单点部署并列

**外部约束**：
- 要求主备之间双向网络互通（PG 5432、NATS 7422 leafnode、MinIO 9000、Redis 6379、FalkorDB 6479）
- 要求 DNS 服务支持低 TTL（≤ 60 秒）并允许快速更新记录
- 所有 agent / 客户端要能接受 DNS 切换或在切换后重启
