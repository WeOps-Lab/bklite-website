# BK-Lite HA 部署（主备 / Active-Standby）

本目录提供 BK-Lite 的跨机房主备部署形态，独立于 `../docker-compose/` 单点部署目录。
两个目录互不影响：单点用户运行 `../docker-compose/bootstrap.sh`，HA 用户运行本目录的 `bootstrap.sh`。

> 装完后验证步骤见 [VERIFY.md](./VERIFY.md)。

## 拓扑概要

```
            用户 ─▶ 域名 ─▶ DNS 解析
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       Primary 机房          Standby 机房
   ┌──────────────────┐   ┌──────────────────┐
   │ server     ▶ run │   │ server     ✗ stop│
   │ web        ▶ run │   │ web        ✗ stop│
   │ webhookd   ▶ run │   │ webhookd   ✗ stop│
   │ stargazer  ▶ run │   │ stargazer  ✗ stop│
   │ nats-exec  ▶ run │   │ nats-exec  ✗ stop│
   │ ──────────────── │   │ ──────────────── │
   │ postgres primary │ ──▶ postgres standby │  (streaming replication, async)
   │ minio  active    │ ◀─▶ minio  active    │  (site replication, 双向 async)
   │ redis  master    │ ──▶ redis  replica   │  (replicaof, async)
   │ falkordb master  │ ──▶ falkordb replica │  (replicaof, async)
   │ nats  (source)   │ ◀─▶ nats  (mirror)   │  (leafnode + mirror streams)
   │ vm/vl consume    │     vm/vl consume    │  (各自从本地 NATS 消费)
   └──────────────────┘   └──────────────────┘
```

切换由运维**手动**执行；通过域名 DNS A 记录更新指向新主节点。

## 已知前置约束

- **DNS 切换是入口方式**：受 DNS 缓存（递归 DNS / 应用层 / 浏览器）影响，RTO 在 **10~30 分钟量级**
- 所有 agent / 采集端 / 客户端**必须在切换后重启**才能保证连接到新主节点
- 异步复制 → **RPO 非零**（秒级数据丢失）
- MinIO 启用 versioning 后磁盘用量会增加（已配 lifecycle 限制版本保留 7 天）
- 主备网络必须双向放行：5432（PG）、7422（NATS leafnode）、9000（MinIO）、6379（Redis）、6479（FalkorDB）

## 安装步骤

### 0. 网络与运维准备（由运维完成）

- 准备两台主机，跨机房，双向放行上述端口
- 准备域名，TTL 设为 ≤ 60s
- 收集所有 agent / 客户端清单，预留切换通告渠道

### 1. 在两台主机上同时准备代码

```bash
# 两台主机分别执行
git clone <repo> bk-lite
cd bk-lite/deploy/docker-compose-ha
cp ha.env.example ha.env
```

按本节点角色编辑 `ha.env`：
- `HA_ROLE=primary` 或 `HA_ROLE=standby`
- `PEER_HOST=<对端 IP 或域名>`
- `PG_REPL_PASSWORD` / `MINIO_SR_PASSWORD`：主备**必须一致**
- `NATS_SERVER_NAME` / `NATS_INSTANCE_ID`：主备**必须不同**（`VECTOR_CONNECTION_NAME` 由 bootstrap 自动复用 `NATS_SERVER_NAME`）

### 2. 在主节点先签发证书

```bash
# 在 primary 节点
bash bin/ha-gen-certs.sh
# 然后把证书复制到 standby 节点同路径
scp -r conf/certs root@<standby-host>:$(pwd)/conf/
```

证书 SAN 已包含主备两端的 IP/hostname，主备直接共用。

### 3. 在主节点部署

```bash
# primary 节点
bash bootstrap.sh
```

完成后主节点 PG / MinIO / Redis / FalkorDB / NATS 全部就绪，业务进程也已启动。

### 4. 在备节点部署

```bash
# standby 节点
bash bootstrap.sh
```

备节点会：
- 启动 DB 类组件（业务进程 `profile=active` 不激活，因此不创建）
- PG 自动以 standby 模式启动并从主节点 `pg_basebackup`
- Redis / FalkorDB 以 `replicaof <primary>` 启动
- NATS 以 leafnode 模式连接主节点 NATS
- `bin/ha-init-mirror-streams.sh` 创建 mirror 流

### 5. 启用 MinIO 站点复制（仅一次）

```bash
# 两端先启用 versioning
bash bin/ha-minio-enable-versioning.sh   # 在 primary 执行
ssh root@<standby> "cd $(pwd) && bash bin/ha-minio-enable-versioning.sh"

# 在 primary 节点配置 SR
bash bin/ha-minio-setup-replication.sh

# 两端各执行一次 lifecycle 规则配置
bash bin/ha-minio-apply-lifecycle.sh
ssh root@<standby> "cd $(pwd) && bash bin/ha-minio-apply-lifecycle.sh"
```

### 6. 设置业务域名 DNS

把业务域名 A 记录指向 primary 节点的入口 IP，TTL 设为 ≤ 60s。

### 7. 验证

```bash
# 主备各执行
bash bin/ha-status.sh
```

应输出所有组件 `[OK]`。

## 故障切换（Failover）

主节点失联或机房整体故障时，在备节点执行：

```bash
# 在 standby 节点
bash bin/ha-failover.sh
```

脚本会依次：
1. 健康预检
2. 远程停止原主业务进程（不可达时人工确认）
3. PG `pg_promote()`
4. 检查 MinIO SR 状态
5. Redis / FalkorDB `REPLICAOF NO ONE`
6. NATS mirror 流转为可写
7. 启动本节点业务进程
8. 业务健康自检
9. 提示更新 DNS

**最后一步**：到 DNS 提供商把 A 记录指向新主节点，并通知 agent / 客户端按节奏重启。

## 回切（Failback）

原主节点恢复后，先确保 PG / Redis / FalkorDB / NATS / MinIO 已作为 standby 反向追平当前主节点的数据（可用 `bin/ha-status.sh` 检查），然后在原主节点执行：

```bash
bash bin/ha-failback.sh
```

脚本要求**交互式确认**反向同步已完成，然后远程停止当前主的业务进程，在本节点 promote 并启动业务。

## 常见故障处理

| 现象 | 排查 |
|---|---|
| 备节点 PG 不能 basebackup | 检查 `PG_REPL_PASSWORD` 主备一致；检查主节点 `pg_hba.conf`；检查 5432 防火墙 |
| NATS leafnode 不上线 | 检查证书 SAN 是否包含主机名/IP；检查 7422 防火墙 |
| MinIO SR 报错 versioning 未启用 | 先跑 `bin/ha-minio-enable-versioning.sh` |
| Redis `master_link_status:down` | 检查 6379 防火墙；检查 `REDIS_PASSWORD` 主备一致 |
| 切换后业务 502 | DNS TTL 未生效，等待 TTL 过期或强制 agent 重启 |
| `ha-status.sh` 报 SR 未启用 | 主节点重跑 `bin/ha-minio-setup-replication.sh` |

## 文件清单

```
docker-compose-ha/
├── Readme.md                       # 本文档
├── ha.env.example                  # 角色与对端配置样例
├── bootstrap.sh                    # HA 部署入口（角色感知）
├── docker-compose.yaml             # 由 bootstrap.sh 生成
├── compose/
│   ├── infra.yaml                  # 同单点部署
│   ├── postgres.yaml               # 同单点部署
│   ├── server.yaml / web.yaml / ...
│   └── ha.yaml                     # ★ HA override：profiles + 角色感知 entrypoint
├── conf/
│   ├── postgres/
│   │   ├── 01-create-replicator.sh # 主库 initdb 时创建 replicator 账号
│   │   ├── ha-entrypoint.sh        # 角色感知 PG 启动逻辑
│   │   └── pg_hba.conf             # 放行复制连接
│   ├── nats/                       # 由 bootstrap.sh 按角色生成
│   ├── certs/                      # 由 bin/ha-gen-certs.sh 生成
│   └── vector/, telegraf/, traefik/
└── bin/
    ├── ha-gen-certs.sh             # 生成多 SAN 证书
    ├── ha-init-mirror-streams.sh   # 备节点初始化 mirror 流
    ├── ha-minio-enable-versioning.sh
    ├── ha-minio-setup-replication.sh
    ├── ha-minio-apply-lifecycle.sh
    ├── ha-status.sh                # 同步健康摘要
    ├── ha-failover.sh              # 主→备切换
    └── ha-failback.sh              # 备→主回切
```

## 与单点部署的关系

- 单点部署仍在 `../docker-compose/`，不受本目录任何修改影响
- 单点 → HA 不是 in-place 升级；需要重新部署并做一次数据迁移
- 两份 `.env` 互不联动；从单点拷贝过来的值仅作为参考
