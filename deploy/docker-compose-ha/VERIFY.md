# HA 部署验证手册

按顺序执行下列验证点。前提：两台跨机房 Linux 主机（下称 **A** = primary、**B** = standby），都已能 `docker run` 且双向放行了 **5432 / 7422 / 9000 / 6379 / 6479** 端口。

> **重要前置**：阶段 7/8 的 `ha-failover.sh` / `ha-failback.sh` 需要两节点之间 **root 双向免密 SSH**（A→B 且 B→A，含彼此的 `known_hosts`）。bootstrap 不会自动配置，请运维提前准备；否则远程停对端业务的步骤会失败（脚本会降级为人工确认）。

> 安装步骤本身见 [Readme.md](./Readme.md)。本文件聚焦"装完之后怎么验证"。

## 阶段 1：部署前准备

### 1.1 两台机器各自拉代码

```bash
git clone <repo> /opt/bk-lite
cd /opt/bk-lite/deploy/docker-compose-ha
cp ha.env.example ha.env
```

### 1.2 编辑两份 `ha.env`

A 机器：

```bash
HA_ROLE=primary
PEER_HOST=<B 的 IP>
NATS_SERVER_NAME=nats-primary
NATS_INSTANCE_ID=primary
COMPOSE_PROJECT_NAME=bk-primary
# PG_REPL_PASSWORD / MINIO_SR_PASSWORD 自行生成，两端必须一致
PG_REPL_PASSWORD=$(openssl rand -hex 16)
MINIO_SR_PASSWORD=$(openssl rand -hex 16)
```

B 机器：把上面的 `primary` 全部改成 `standby`，`PEER_HOST` 改成 A 的 IP，**`PG_REPL_PASSWORD` 与 `MINIO_SR_PASSWORD` 复制 A 的值**。

### 1.3 在 A 上签证书并下发到 B

```bash
# A
cd /opt/bk-lite/deploy/docker-compose-ha
bash bin/ha-gen-certs.sh
scp -r conf/certs root@<B-IP>:/opt/bk-lite/deploy/docker-compose-ha/conf/
```

**验证点 V1（证书 SAN）**

```bash
docker run --rm -v $PWD/conf/certs:/c alpine/openssl:3.5.4 \
    x509 -in /c/server.crt -noout -text | grep -A1 "Subject Alternative Name"
```

期望输出含：`DNS:nats, DNS:localhost, IP:127.0.0.1, IP:<A-IP>, IP:<B-IP>`

---

## 阶段 2：主节点部署

```bash
# A
bash bootstrap.sh
```

**验证点 V2（部署成功）**

```bash
docker compose ps
```

期望：所有容器 `running` / `healthy`，**包含** `server / web / webhookd / nats-executor / stargazer / fusion-collector`（因为 A 是 primary，profile=active 自动激活）。

**验证点 V3（业务可访问）**

```bash
# web 路由规则是 Host(<HOST_IP>)，必须用本机 IP（或带正确 Host 头）访问，
# 直接 curl 127.0.0.1 的 Host 头不匹配会返回 404。
curl -k https://<A-IP>/
# 或：curl -k -H "Host: <A-IP>" https://127.0.0.1:443/
```

期望：返回 200 或登录页 HTML（`<title>BlueKing Lite</title>`）。

---

## 阶段 3：备节点部署

```bash
# B
bash bootstrap.sh
```

**验证点 V4（备节点 DB 起来、业务进程没起）**

```bash
docker compose ps
```

期望：列表里**有** `postgres / redis / falkordb / nats / minio / victoria-metrics / victoria-logs / vector / mlflow / pgvector / traefik`；**没有** `server / web / webhookd / stargazer / fusion-collector / nats-executor`（这些 profile=active 未激活）。

**验证点 V5（PG 备库进入 standby）**

```bash
# B
docker exec postgres psql -U postgres -c "SELECT pg_is_in_recovery();"
# 期望: t

docker exec postgres psql -U postgres -c \
  "SELECT now() - pg_last_xact_replay_timestamp() AS lag;"
# 期望: 几秒内
```

**验证点 V6（A 上看到备库连上来）**

```bash
# A
docker exec postgres psql -U postgres -c \
  "SELECT client_addr, state, sync_state FROM pg_stat_replication;"
# 期望: B 的 IP，state=streaming，sync_state=async
```

**验证点 V7（Redis / FalkorDB replica 状态）**

```bash
# B
docker exec $(docker compose ps -q redis) \
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning INFO replication \
    | grep -E "role|master_link_status"
# 期望: role:slave, master_link_status:up

docker exec $(docker compose ps -q falkordb) \
    redis-cli -a "$FALKORDB_PASSWORD" --no-auth-warning INFO replication \
    | grep -E "role|master_link_status"
# 期望: role:slave, master_link_status:up
```

**验证点 V8（NATS leafnode 已连接）**

`nats server report connections` 需要 system 账号权限，普通 `admin` 账号会报
`ensure the account used has system privileges`。改用日志判断 leafnode 是否稳定连接：

```bash
# A：应看到 "Leafnode connection created" 且无 "TLS Handshake Failure"
docker logs --since 2m $(docker compose ps -q nats) 2>&1 | grep -iE "leafnode|handshake"
# 期望: 有 "Leafnode connection created"，且无 "incompatible key usage" / "Handshake Failure"

# B：应能持续连上 A 的 7422 且无 "connection refused" / "Read Error"
docker logs --since 2m $(docker compose ps -q nats) 2>&1 | grep -iE "leafnode|refused"
```

**验证点 V9（NATS mirror 流存在）**

```bash
# B
docker run --rm --network=bklite-prod -v $PWD/conf/certs:/c \
  bk-lite.tencentcloudcr.com/bklite/weopsx/natsio/nats-box:latest \
  nats -s tls://admin:$NATS_ADMIN_PASSWORD@nats:4222 --tlsca /c/ca.crt stream ls
# 期望: 列表里有 metrics、OBJ_bklite、METRICS_ALL，stream info 显示 "Mirror: ... API Prefix"
```

> **已知限制**：`OBJ_bklite`（MinIO 对象存储事件流）源端若存在大量内部删除（messages 远小于 last seq），
> 跨 leafnode 的 external-API mirror 回填可能停滞（日志反复 `create mirror consumer: stream not found 10059`）。
> 对象**数据本身**由 MinIO 站点复制（V10/V11）保护，该事件流回填不完整不影响对象可用性，
> 但 failover 后事件流历史会缺失。需要 NATS 拓扑层面（gateway/supercluster）进一步优化。

---

## 阶段 4：MinIO 站点复制

```bash
# A
bash bin/ha-minio-enable-versioning.sh
ssh root@<B-IP> "cd /opt/bk-lite/deploy/docker-compose-ha && bash bin/ha-minio-enable-versioning.sh"

bash bin/ha-minio-setup-replication.sh   # 仅 A 执行

bash bin/ha-minio-apply-lifecycle.sh
ssh root@<B-IP> "cd /opt/bk-lite/deploy/docker-compose-ha && bash bin/ha-minio-apply-lifecycle.sh"
```

**验证点 V10（SR 双向 Online）**

```bash
# A
docker run --rm --network=bklite-prod \
  -e MC_HOST_local="http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@minio:9000" \
  minio/mc:latest admin replicate status local
# 期望: 两端都 Online
```

**验证点 V11（对象双向同步）**

```bash
# A 写一个对象
echo "ha-test-$(date +%s)" > /tmp/probe.txt
docker run --rm --network=bklite-prod -v /tmp:/tmp \
  -e MC_HOST_local="http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@minio:9000" \
  minio/mc:latest cp /tmp/probe.txt local/demo/probe.txt

sleep 30

# B 应该能读到
docker run --rm --network=bklite-prod \
  -e MC_HOST_local="http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@minio:9000" \
  minio/mc:latest cat local/demo/probe.txt
# 期望: 看到 ha-test-... 字符串
```

---

## 阶段 5：综合健康检查

```bash
# A 和 B 各跑一次
bash bin/ha-status.sh
# 期望: 末尾输出 [ALL OK]，退出码 0
```

---

## 阶段 6：写入一致性验证

### 6.1 PG 数据同步

```bash
# A 写入
docker exec postgres psql -U postgres -d bklite -c \
  "CREATE TABLE IF NOT EXISTS _ha_probe(id serial primary key, ts timestamptz default now()); INSERT INTO _ha_probe DEFAULT VALUES RETURNING id, ts;"

sleep 5

# B 应能读到（read-only standby）
docker exec postgres psql -U postgres -d bklite -c "SELECT * FROM _ha_probe;"
# 期望: 看到刚才插入的那行
```

### 6.2 Redis 数据同步

```bash
# A
docker exec $(docker compose ps -q redis) \
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning SET ha_probe "$(date +%s)"

sleep 2

# B（read-only replica）
docker exec $(docker compose ps -q redis) \
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning GET ha_probe
# 期望: 看到刚才的时间戳
```

### 6.3 NATS 消息透传

```bash
# A 上启动 subscribe（后台）
docker run --rm --network=bklite-prod -v $PWD/conf/certs:/c \
  bk-lite.tencentcloudcr.com/bklite/weopsx/natsio/nats-box:latest \
  nats -s tls://admin:$NATS_ADMIN_PASSWORD@nats:4222 --tlsca /c/ca.crt \
  sub "vector" --count=1 &

# B 上 publish
docker run --rm --network=bklite-prod -v $PWD/conf/certs:/c \
  bk-lite.tencentcloudcr.com/bklite/weopsx/natsio/nats-box:latest \
  nats -s tls://admin:$NATS_ADMIN_PASSWORD@nats:4222 --tlsca /c/ca.crt \
  pub vector "from-B-$(date +%s)"

# 期望: A 上的 sub 收到消息（leafnode 透传）
```

---

## 阶段 7：故障切换演练（在维护窗口做）

### 7.1 模拟 A 故障

```bash
# A
docker compose --profile active stop server web webhookd nats-executor stargazer fusion-collector
```

不要停 DB，模拟"业务进程死了但 PG 仍可达"的常见故障形态。

### 7.2 在 B 上切换

```bash
# B
bash bin/ha-failover.sh
```

**验证切换**（脚本输出里逐项核对）：

| 步骤 | 期望输出 |
|---|---|
| 1/9 健康预检 | `[ALL OK]` 或仅 NATS mirror lag 报警（可接受） |
| 2/9 停主节点业务 | SSH 可达：日志显示远程 stop 完成 |
| 3/9 PG promote | `SELECT pg_promote(...)` 返回 t；`pg_is_in_recovery` 返回 f |
| 4/9 MinIO 状态 | SR 仍 Online |
| 5/9 Redis/FalkorDB | `INFO replication` 输出 `role:master` |
| 6/9 NATS mirror 转可写 | 每个流 `stream edit --no-mirror` 不报错 |
| 7/9 启动业务进程 | `docker compose --profile active up -d` 完成 |
| 8a 容器状态 | 所有业务容器 `[OK] xxx running` |
| 8b PG 写入 | `[OK] PG 可写` |
| 8c Traefik | `[OK] traefik :443 响应` |
| 8d NATS publish | `[OK] NATS 可 publish` |
| 9/9 DNS 提示 | 输出待操作 DNS 目标 IP |

### 7.3 DNS 改向 B 的 IP

```bash
# 在 DNS 提供商把 A 记录改成 B 的 IP，TTL ≤ 60s
# 然后从客户端测试：
curl -k https://<your-domain>/
```

### 7.4 灾难性测试（可选）

直接断 A 机器电源 → 在 B 上 `bash bin/ha-failover.sh`，脚本会因 SSH 不可达进入交互确认。

---

## 阶段 8：回切演练

**前置**：A 恢复后必须先以 standby 模式追上 B 的数据。

```bash
# A：临时把 ha.env 改成 HA_ROLE=standby
sed -i 's/^export HA_ROLE=.*/export HA_ROLE=standby/' ha.env

# 清空原 PG 数据让 entrypoint 重新 basebackup
docker compose stop postgres
docker volume rm bk-primary_postgres
docker compose up -d postgres redis falkordb nats minio
bash bin/ha-init-mirror-streams.sh

# 等同步追上
watch bash bin/ha-status.sh
```

回切：

```bash
# 把 A 的 ha.env 改回 HA_ROLE=primary，但**不要**重启容器
sed -i 's/^export HA_ROLE=.*/export HA_ROLE=primary/' ha.env
# 直接执行 failback（脚本会处理 promote + 启动业务）
bash bin/ha-failback.sh
```

脚本会先 `confirm` 让你确认追平、远程停 B 的业务进程、在 A promote、起业务、提示改 DNS 回 A。

---

## 阶段 9：清理探活数据

```bash
# A
docker exec postgres psql -U postgres -d bklite -c "DROP TABLE IF EXISTS _ha_probe;"
docker exec $(docker compose ps -q redis) \
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning DEL ha_probe
docker run --rm --network=bklite-prod \
  -e MC_HOST_local="http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@minio:9000" \
  minio/mc:latest rm local/demo/probe.txt
```

---

## 必须记录的指标

| 指标 | 怎么测 | 期望 |
|---|---|---|
| PG 复制延迟（字节） | A 上 `SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) FROM pg_stat_replication` | < 10 MB |
| PG 复制延迟（秒） | B 上 `SELECT now() - pg_last_xact_replay_timestamp()` | < 5 s |
| MinIO 对象同步延迟 | V11 的 sleep 时间内能否读到 | < 30 s |
| NATS mirror lag | A 与 B 上 `nats stream info <stream>` 的 messages 差 | < 100 |
| failover 总耗时 | `time bash bin/ha-failover.sh` | < 5 min |
| 客户端可见 RTO | 从切换开始到能访问域名 | 受 DNS 缓存约束 |
| failback 总耗时 | `time bash bin/ha-failback.sh` | < 5 min |

把这些数据连同环境信息（机房延迟、带宽）回填给研发，以便定位异常。

---

## 常见报错对照

| 现象 | 排查 |
|---|---|
| `pg_basebackup: could not connect to server` | 5432 防火墙；`pg_hba.conf` 是否含 `host replication replicator 0.0.0.0/0 md5`；`PG_REPL_PASSWORD` 主备是否一致 |
| `x509: certificate is valid for ... not ...` | 证书 SAN 不全；重跑 `ha-gen-certs.sh` 并下发到对端 |
| `mirror stream creation failed: stream not found` | 备机先跑了，主机还没创建上游流；等主机就绪后 `bash bin/ha-init-mirror-streams.sh` 重试 |
| `mc admin replicate add` 报 versioning 未启用 | 先跑 `ha-minio-enable-versioning.sh` |
| 备机 redis `master_link_status:down` | 6379 防火墙；`REDIS_PASSWORD` 不一致 |
| failover 步骤 8b PG 写入探活失败 | `pg_promote` 可能 60s 超时；查 `docker logs postgres` |
| 切换后业务 502 / 客户端连不上 | DNS 未生效；客户端进程未重启（强制 agent 重启） |
| `mc ilm rule add: unknown flag` | mc 版本旧；升级镜像或改用 `--noncurrentversion-expiration-days` |
| 新建 bucket 漏复制 | 重跑 `ha-minio-enable-versioning.sh`（versioning 启用后 SR 会自动重同步） |
