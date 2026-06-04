## Context

### 现网现状（10.10.41.149 / `weops-lite`）

单机 docker-compose 部署，project=`compose`，目录 `/opt/bk-lite`。容器清单与数据规模：

| 组件 | 容器 | 当前数据量 |
|---|---|---|
| postgres:15 | `postgres` | bklite 118 MB + mlflow 39 MB + test 16 MB ≈ 180 MB |
| minio (2024-05-01) | `compose-minio-1` | 19 GB / 11 buckets |
| nats:2.10.25 | `compose-nats-1` | metrics 流 100 MiB（活跃，秒级写入）、OBJ_bklite 2.7 GiB |
| redis:5.0.14 | `compose-redis-1` | — |
| falkordb | `compose-falkordb-1` | — |
| victoria-metrics v1.106.1 | — | 本地盘 |
| victoria-logs v1.49.0 | — | 本地盘 |
| 业务进程 | server / web / webhookd / nats-executor / stargazer / fusion-collector / telegraf / vector / mlflow / pgvector | 无状态或依赖前述组件 |

### 关键约束（来自 `/opt/bk-lite/.env` 与运行时探查）

- `wal_level=replica`、`max_wal_senders=10`：**PG 已具备做流复制的基础**，无需重启改参
- `archive_mode=off`：当前未做 WAL 归档
- NATS JetStream domain 已设为 `bklite`：有利于跨机房 leafnode
- NATS TLS 证书 SAN **仅覆盖 `nats, localhost`**：跨机房复制必然失败，必须重签
- 现网通过 `HOST_IP=10.10.41.149`、`DB_HOST=10.10.41.149` 这种 IP 直连方式暴露端口；切主后业务侧寻址不可直接复用
- metrics 流确认有实时数据流入，证实 "VM/VL 全部经 NATS" 的前提成立
- NATS 中存在 Object Store `OBJ_bklite`（2.7 GB），它跟着 JetStream 复制走，无需单独同步

### 用户给定约束

1. 入口：**DNS 切换**（已知 RTO 较慢，是当前唯一选项）
2. 备机业务进程**不启动**，仅 DB 类组件常驻
3. 故障切换**手动**触发
4. **跨机房**部署
5. VM/VL 数据 100% 经 NATS 进入

## Goals / Non-Goals

**Goals:**

- 任一机房整体宕机时，运维**手动**在 30 分钟内（受 DNS 约束）将服务切到对端
- 数据 RPO ≤ 1 分钟（异步复制下的常态）
- 主备共用同一份 `.env`，仅以 `HA_ROLE` 一个变量区分角色
- 同一套证书可被两端复用（重签后 SAN 包含双方）
- 切换流程脚本化、固定顺序、可重复执行
- 不引入新依赖组件（不引 Patroni、Sentinel、Consul、etcd 等仲裁组件）

**Non-Goals:**

- 不做自动故障检测和切换（无仲裁、无 split-brain 风险换来运维介入）
- 不做多活（active-active）。备机不接读、不接写
- 不追求零 RPO。任何写都允许 ≤ 1 分钟丢失
- 不做 PITR（point-in-time recovery）。仅保证主备同步，可作为兜底再上 wal-g/pgBackRest，由独立 change 处理
- 不解决客户端 DNS 缓存问题。这是部署前置条件，不在本 change 范围内
- 不改变 `enterprise-external-db` 模式（外接 RDS）的行为；本 change 只覆盖内置 PG 部署形态

## Decisions

### D1：入口层用 DNS，但写明 RTO 上限

**决策**：保留 DNS 切换；TTL ≤ 60s；接受 RTO 在 30 分钟量级。

**理由**：
- 跨机房不能用 keepalived VIP
- 引入云厂商 GSLB / 四层 LB 会破坏 "纯 docker-compose 自托管" 的现网假设
- 用户已明确选 DNS

**Alternative considered**：
- 云厂商 GSLB（如阿里云全局加速）：RTO 秒级，但要求接入云厂商，超出本 change 范围。**留作未来扩展**
- HAProxy 部署在第三个仲裁节点：RTO 秒级，但引入了第三个机房，违背 "2 机房主备" 的简化假设

**前置条件**（写入安装文档）：
- 所有 agent / 采集端在切换后**必须重启**才能确保识别新 IP
- 域名 TTL 必须 ≤ 60s
- 受影响时段在切换 runbook 中标注

### D2：HA 部署独立于单点部署

**决策**：新增独立目录 `deploy/docker-compose-ha/`，与现有 `deploy/docker-compose/` 平行。HA 模式有自己的 `bootstrap.sh`、`docker-compose.yaml`、`compose/*.yaml`、`conf/`、`bin/`。现有单点部署目录完全不修改。

**理由**：
- 单点和 HA 是两种**部署形态**，不是同一形态的开关。强行用 override 或 profile 切换会让 compose 文件含大量 `if HA_ROLE` 条件分支，可读性差
- 单点用户升级 BK-Lite 版本时，不会被 HA 改动牵连
- HA 演进（如未来加第三节点 / 接入云 LB / 引入仲裁）可以在独立目录里自由迭代
- 仓库结构清晰：用户只看自己关心的目录

**目录结构**：
```
deploy/
├── docker-compose/          # 现有单点部署（不动）
│   ├── bootstrap.sh
│   ├── docker-compose.yaml
│   ├── compose/
│   ├── conf/
│   └── bin/
└── docker-compose-ha/       # 新增 HA 部署
    ├── bootstrap.sh         # 校验 HA_ROLE 后按角色启动
    ├── docker-compose.yaml  # HA 形态的服务定义
    ├── compose/             # 按组件拆分的 yaml
    ├── conf/                # 含 nats leafnode、pg standby 模板等
    ├── bin/
    │   ├── ha-failover.sh
    │   ├── ha-failback.sh
    │   ├── ha-status.sh
    │   └── gen-certs.sh
    ├── ha.env.example
    └── Readme.md / HA.md
```

**复用策略**：HA 目录的 compose / conf 文件可以从单点目录**复制**作为起点，但落地后是独立副本，不通过软链或继承机制耦合。允许一次性的内容相似度高，不强制 DRY。

**备机 DB 常驻、业务进程冷备**：在 HA 模式的 compose 文件中，业务类（server/web/webhookd/nats-executor/stargazer/fusion-collector）标注 `profiles: ["active"]`；备机启动时不带 profile，业务进程不创建。VM/VL 用独立 durable consumer name（`vm-primary`/`vm-standby`），主备各自消费本地 NATS。

**Alternative considered**：
- 在 `deploy/docker-compose/` 内通过 override 文件（`-f compose/ha.yaml`）激活 HA：单点 compose 内会大量出现 HA-only 字段，污染单点用户视野
- 用 docker-compose profiles 同时支持 single/ha：单一 compose 文件复杂度暴涨，组件 entrypoint 都要含 if 分支

### D3：PostgreSQL 用原生异步流复制

**决策**：物理流复制（physical streaming replication）+ 异步模式 + 备机以 hot standby 启动 + 手动 `pg_promote()`。

**理由**：
- 现网 `wal_level=replica`、`max_wal_senders=10` 已满足前置条件
- 数据量 < 200 MB，初次 basebackup 快
- 跨机房只能用异步（避免拖垮主库写入）
- 不引入仲裁组件，与 "手动切换" 约束一致

**Alternative considered**：
- Patroni：自动 failover，但要 etcd/consul 仲裁，引入两个新组件
- 逻辑复制：跨大版本友好，但 DDL 不复制；监控复制状态更复杂
- pglogical / Bucardo：第三方，运维成本高

**实施差异化**：
- 主：正常启动
- 备：entrypoint 检测 `HA_ROLE=standby`，初次启动跑 `pg_basebackup -h <primary> -D /data/postgres -R`，写入 `standby.signal` + `primary_conninfo`
- 复制账号：在主库创建 `replicator` 角色，密码放入新的 `ha.env`

### D4：MinIO 用站点复制（Site Replication）

**决策**：用 MinIO 原生 Site Replication，双向异步复制，强制开启所有 bucket 的 versioning。

**理由**：
- 原生支持，无需引入 mc mirror 这种 cron 脚本
- 复制 IAM / 策略 / 桶配置，不只是对象
- 双向：备机切主后写入会反向复制回原主（如果原主恢复）
- 当前镜像版本 RELEASE.2024-05-01 支持 SR

**Alternative considered**：
- `mc mirror --watch`：单向、不复制 IAM、需要外部进程托管
- 应用层双写：侵入业务代码

**前置改造**：
- 所有 bucket 必须开启 versioning（这是 SR 的硬要求）
- 一次性命令：`mc version enable <bucket>` 对 11 个 bucket 执行
- 注意：开启 versioning 后存储用量会增加（保留对象历史版本）；监控盘容量

### D5：Redis / FalkorDB 用原生 `replicaof`

**决策**：备机以 `replicaof <primary>` 启动，纯异步主从。

**理由**：
- 原生支持，配置一行
- 不引入 Sentinel（与 "手动切换" 一致）
- FalkorDB 基于 Redis，机制相同

**切换动作**：备机执行 `REPLICAOF NO ONE` 提升为主。

### D6：NATS 用 leafnode + stream mirror

**决策**：备机 NATS 通过 leafnode 连接到主机 NATS（端口 7422）；关键流（`metrics`、`OBJ_bklite`、`BK_ANS_EXEC_*`）在备机以 `mirror` 模式订阅；备机 VM/VL 用独立 durable consumer 消费本地 NATS。

**拓扑**：

```
       Primary 机房                            Standby 机房
  ┌───────────────────────┐               ┌───────────────────────┐
  │ server / executors ─▶ │  publish      │ server (停)            │
  │ NATS (source streams) │ ◀ leafnode ─▶ │ NATS (mirror streams) │
  │       │               │               │       │               │
  │       ▼ consume       │               │       ▼ consume       │
  │ VM / VL (active)      │               │ VM / VL (active)      │
  └───────────────────────┘               └───────────────────────┘
```

**Alternative considered**：
- JetStream cluster（3 节点 Raft）：要求奇数节点 + 第三方仲裁，违背 "2 机房主备" 假设
- 应用层双写到两个 NATS：侵入业务

**关键细节**：
- `server_name` 必须主备不同（NATS 集群唯一性要求）
- `nats-executor` 的 `NATS_INSTANCE_ID` 主备必须不同
- VM / VL durable consumer 名主备不同（避免抢消费）
- 重签证书 SAN 时务必加上跨机房 endpoint

### D7：共用 `.env` + `HA_ROLE` 差异化

**决策**：HA 目录下维持一份共用 `.env`（主备两台机器内容完全相同），新增独立 `ha.env` 文件仅放主备差异：`HA_ROLE`、`PEER_HOST`、`PG_REPL_USER`/`PG_REPL_PASSWORD`、`MINIO_SR_USER`/`MINIO_SR_PASSWORD`、`NATS_SERVER_NAME`、`NATS_INSTANCE_ID`。`vector` 在两端用不同 `connection_name`（直接复用 `NATS_SERVER_NAME`），用于区分 NATS 上的双订阅。

**理由**：
- 与用户 "共用环境变量" 的目标对齐
- 差异只在 `ha.env` 一处，便于审计
- 通过 entrypoint 脚本读 `HA_ROLE` 决定服务行为

**与单点 `.env` 的关系**：HA 目录的 `.env` 是独立副本，单点 `.env` 不影响 HA。两份 `.env` 之间没有联动机制；用户从单点升级到 HA 时，需要手动把单点 `.env` 的相关变量复制到 HA `.env`（部署文档提供清单）。

### D8：证书重签

**决策**：在新签发的证书中扩展 SAN：

```
DNS:nats
DNS:localhost
DNS:bk-primary.<domain>
DNS:bk-standby.<domain>
IP:<primary-internal-ip>
IP:<standby-internal-ip>
```

CA 沿用现有 `Blueking Lite` CA。

**滚动**：先签新证书 → 主备同时切换 → 验证 → 投入使用。

### D9：切换是手动 runbook，不引入仲裁

**决策**：提供 `bin/ha-failover.sh` 和 `bin/ha-failback.sh`，固定执行顺序：

```
failover (主→备):
  1. 校验备机健康（DB up、复制延迟 < 阈值）
  2. (可选) 在主机停止写入：docker stop server webhookd nats-executor stargazer fusion-collector web
  3. PG 备机 pg_promote
  4. MinIO 备机 mc admin replicate update --replicate-to-primary
  5. Redis / FalkorDB 备机 REPLICAOF NO ONE
  6. NATS 备机将 mirror 流改为 source
  7. 备机启动业务进程：docker compose --profile active up -d
  8. 改 DNS 指向备机 IP
  9. 健康检查

failback (备→主) 对称执行，但要先做反向同步 reseed
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解 |
|---|---|---|
| DNS 切换 RTO 慢，客户端缓存 | 实际切换可能持续数十分钟到数小时 | 写入安装前置条件；提供 agent 重启清单；推荐未来引入云 LB |
| 异步复制 → 切换瞬间 RPO 非零 | 秒级数据丢失 | 切换前若主机可达，先 `pg_switch_wal()` 强制刷盘；MinIO 调用 SR status 等待 lag 归零 |
| MinIO 启用 versioning 后空间膨胀 | 磁盘吃紧 | 在切换前给所有 bucket 配 lifecycle policy 限制版本保留数 |
| NATS 证书重签会中断现网 | 全网业务断秒级 | 在维护窗口内做；新旧证书都用同一 CA 签发，提前推送 ca.crt |
| 备机 NATS mirror 流追平延迟 | 切换瞬间 VM/VL 历史数据缺口 | 备机 VM/VL 全程消费本地 NATS，理论上数据已经在备机本地落盘 |
| split-brain：DNS 已改但原主未停 | 双写 PG/MinIO 造成数据冲突 | runbook 第 2 步**强制**先停主机业务进程；脚本检测并报错 |
| FalkorDB replicaof 不被官方文档突出宣传 | 兼容性不确定 | 部署前在测试环境验证；不行则回退到周期性快照 |
| docker-compose project 名 `compose` 太通用 | 主备共存于同一台机器调试时冲突 | HA 模式下使用 `bk-primary` / `bk-standby` 项目名 |
| 业务进程冷启动慢 | RTO 被业务启动时间拉长 | 备机预拉镜像；docker compose 启动并行；指标显示当前业务启动数十秒级，可接受 |

## Migration Plan

### 阶段 1：准备（不影响现网）

1. 在测试环境复刻现网
2. 重签证书，SAN 包含双方主机
3. 在主机给 11 个 bucket 启用 versioning（可在线执行，验证业务正常）
4. 在主机 PG 创建 `replicator` 复制角色
5. 准备备机机房网络打通（5432 / 7422 / 9000 / 6379 / 6479 双向）

### 阶段 2：部署备机（不影响现网）

1. 备机部署完整 compose 栈，`HA_ROLE=standby`，业务 profile 不启动
2. PG basebackup → standby 模式启动 → 等复制追上
3. MinIO 配置 SR → 等首次同步完成
4. Redis / FalkorDB 启动 `replicaof`
5. NATS 配置 leafnode + mirror 流
6. 验证所有同步状态健康（脚本一键检查）

### 阶段 3：切换演练（计划维护窗口）

1. 选定维护时段
2. 执行 `ha-failover.sh`，观察 RTO / RPO
3. 在备机运行业务一段时间（如 30 分钟）
4. 执行 `ha-failback.sh`，回到主机
5. 复盘指标、调整 runbook

### Rollback

- 若 SR 启用 / 复制配置导致问题，立即停止备机所有 DB 服务，主机继续单机运行
- 若证书重签后业务连接异常，回退到旧证书（保留至少 2 周）
- 若启用 versioning 后存储压力大，配置 lifecycle 立即生效，限制版本数为 1（等效关闭）

## Open Questions

1. **DNS 提供商**：现网域名托管在哪里？TTL 能否真做到 60s 以内？
2. **跨机房带宽**：备机机房的物理位置？跨机房延迟和带宽预算？影响 MinIO SR / PG WAL 流量
3. **agent 重启清单**：现网有多少类 agent / 采集端通过域名访问？切换时谁负责通知重启？
4. **FalkorDB replicaof 验证**：当前版本是否完全兼容 Redis `replicaof` 协议？需要在测试环境实测
5. **业务侧 DB_HOST 配置**：切换后业务进程的 `DB_HOST` 怎么改？方案是改成 `127.0.0.1` 还是统一通过另一个内部 DNS 记录？需要确认
6. **观测**：复制延迟、SR 状态、leafnode 健康，是否纳入现有 VM 监控？还是单独搞 Prometheus 拉 metrics？
