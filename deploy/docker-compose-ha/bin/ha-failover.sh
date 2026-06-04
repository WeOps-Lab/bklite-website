#!/bin/bash
# HA 故障切换：在备节点上执行，把流量从主节点切到本节点
#
# 步骤序列（任一步失败则中止后续）：
#   1. 健康预检
#   2. 若主节点 SSH 可达：停止主节点业务进程；不可达：人工确认主节点已失联
#   3. PostgreSQL: pg_promote() 等待 recovery=false
#   4. MinIO: 确认 SR 状态可写
#   5. Redis / FalkorDB: REPLICAOF NO ONE
#   6. NATS: 把 mirror 流转为可写
#   7. 启动本节点业务进程 (--profile active up -d)
#   8. 业务健康自检
#   9. 提示更新 DNS

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env

log()  { echo "[failover] $*"; }
die()  { echo "[failover] FATAL: $*" >&2; exit 1; }
step() { echo; echo "===== $* ====="; }

[ "$HA_ROLE" = "standby" ] || die "ha-failover 必须在 standby 节点执行（当前 HA_ROLE=$HA_ROLE）"

PEER_SSH_USER="${PEER_SSH_USER:-root}"

confirm() {
    local msg="$1"
    read -r -p "$msg [yes/no] " answer
    [ "$answer" = "yes" ] || die "用户中止"
}

#=== 1. 预检 ===
step "1/9 健康预检"
if ! ./bin/ha-status.sh; then
    log "ha-status 返回非零，请确认问题后用 --force 重跑"
    if [ "${1:-}" != "--force" ]; then
        die "预检失败"
    fi
    log "[force] 忽略预检失败，继续"
fi

#=== 2. 停止主节点业务进程 ===
step "2/9 停止主节点业务进程"
if ssh -o ConnectTimeout=5 -o BatchMode=yes "$PEER_SSH_USER@$PEER_HOST" "true" 2>/dev/null; then
    log "主节点 SSH 可达，远程停止业务进程"
    ssh "$PEER_SSH_USER@$PEER_HOST" "cd $(pwd) && docker compose --profile active stop server web webhookd nats-executor stargazer fusion-collector || true"
else
    log "主节点 SSH 不可达"
    confirm "请确认主节点已彻底失联且不会自动恢复，确认继续切换吗？"
fi

#=== 3. PostgreSQL promote ===
step "3/9 PG promote"
docker exec postgres psql -U "$POSTGRES_USERNAME" -c \
    "SELECT pg_promote(wait => true, wait_seconds => 60);" >/dev/null || die "pg_promote 调用失败"
in_recovery=$(docker exec postgres psql -tA -U "$POSTGRES_USERNAME" -c "SELECT pg_is_in_recovery();")
[ "$in_recovery" = "f" ] || die "promote 后 pg_is_in_recovery 仍为 $in_recovery"
log "PG 已 promote 为 primary"

#=== 4. MinIO 状态确认 ===
step "4/9 MinIO 状态检查"
MC_IMAGE="${DOCKER_IMAGE_MC:-minio/mc:latest}"
docker run --rm --network=bklite-prod \
    -e MC_HOST_local="http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
    "$MC_IMAGE" admin replicate status local || log "WARNING: SR 状态查询失败"
log "MinIO 双向 SR 自动接管，无需 promote 动作"

#=== 5. Redis / FalkorDB ===
step "5/9 Redis / FalkorDB REPLICAOF NO ONE"
redis_cid=$(docker compose ps -q redis | head -1)
fdb_cid=$(docker compose ps -q falkordb | head -1)
[ -n "$redis_cid" ] || die "找不到 redis 容器"
[ -n "$fdb_cid" ]   || die "找不到 falkordb 容器"
docker exec "$redis_cid" redis-cli -a "$REDIS_PASSWORD" --no-auth-warning REPLICAOF NO ONE \
    || die "Redis REPLICAOF NO ONE 失败"
docker exec "$fdb_cid" redis-cli -a "$FALKORDB_PASSWORD" --no-auth-warning REPLICAOF NO ONE \
    || die "FalkorDB REPLICAOF NO ONE 失败"
log "Redis / FalkorDB 已转 master"

#=== 6. NATS mirror -> source ===
step "6/9 NATS 流接管"
nats_exec() {
    docker run --rm --network=bklite-prod \
        -v "$PWD/conf/certs:/etc/certs:ro" \
        "$DOCKER_IMAGE_NATS_CLI" nats \
        -s tls://nats:4222 \
        --tlsca /etc/certs/ca.crt \
        --user "$NATS_ADMIN_USERNAME" --password "$NATS_ADMIN_PASSWORD" \
        "$@"
}
for stream in ${HA_MIRROR_STREAMS:-metrics OBJ_bklite METRICS_ALL}; do
    if nats_exec stream info "$stream" >/dev/null 2>&1; then
        log "[$stream] 将 mirror 配置移除（变为可写流）"
        nats_exec stream edit "$stream" --no-mirror --defaults || \
            log "WARNING: $stream 移除 mirror 失败，可能需要手动 stream edit"
    fi
done

#=== 7. 启动业务进程 ===
step "7/9 启动业务进程 (--profile active)"
docker compose --profile active up -d
sleep 10

#=== 8. 业务自检 ===
step "8/9 业务健康自检"

# 8a. 容器状态
for c in server web webhookd nats-executor stargazer; do
    cid=$(docker compose ps -q "$c" 2>/dev/null | head -1)
    if [ -z "$cid" ]; then
        log "[WARN] $c 容器缺失"
        continue
    fi
    state=$(docker inspect -f '{{.State.Status}}' "$cid")
    [ "$state" = "running" ] && log "[OK] $c running" || log "[WARN] $c state=$state"
done

# 8b. PG 写入探活（用临时表，立即清理）
if docker exec postgres psql -U "$POSTGRES_USERNAME" -d "$DB_NAME" -c \
    "CREATE TEMP TABLE _ha_probe(x int); INSERT INTO _ha_probe VALUES (1);" >/dev/null 2>&1; then
    log "[OK] PG 可写"
else
    log "[WARN] PG 写入探活失败"
fi

# 8c. 业务 HTTPS 端口探活
if curl -ks -o /dev/null -w "%{http_code}" "https://127.0.0.1:${TRAEFIK_WEB_PORT:-443}/" | grep -qE "^(200|301|302|401|403|404)$"; then
    log "[OK] traefik :${TRAEFIK_WEB_PORT:-443} 响应"
else
    log "[WARN] traefik 端口未正常响应"
fi

# 8d. NATS publish 探活
if docker run --rm --network=bklite-prod \
    -v "$PWD/conf/certs:/etc/certs:ro" \
    "$DOCKER_IMAGE_NATS_CLI" nats \
    -s tls://nats:4222 --tlsca /etc/certs/ca.crt \
    --user "$NATS_ADMIN_USERNAME" --password "$NATS_ADMIN_PASSWORD" \
    pub "_ha_probe.$(date +%s)" "ok" >/dev/null 2>&1; then
    log "[OK] NATS 可 publish"
else
    log "[WARN] NATS publish 探活失败"
fi

#=== 9. DNS 操作提示 ===
step "9/9 DNS 切换操作"
cat <<EOF

本节点已接管服务。请立即在 DNS 提供商处更新 A 记录：

  域名: <your-bklite-domain>
  目标: $(hostname -I | awk '{print $1}')

TTL 应保持 <= 60s。注意通知所有 agent / 采集端按部署文档重启进程以丢弃旧 DNS 缓存。

切换完成。
EOF
