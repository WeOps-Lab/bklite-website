#!/bin/bash
# HA 同步健康检查
#
# 输出 PG / MinIO / Redis / FalkorDB / NATS 复制状态摘要
# 任一组件异常以非零退出码退出，便于接入监控

set -uo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env 2>/dev/null || { echo "ha.env 不存在，无法判断角色"; exit 2; }

# 独立运行时 DOCKER_IMAGE_NATS_CLI 未由 bootstrap 注入，按 REGISTRY_BASE 兜底，
# 否则下方 NATS 检查的 docker run 会因镜像名为空而失败、误报流"不存在"
DOCKER_IMAGE_NATS_CLI="${DOCKER_IMAGE_NATS_CLI:-${REGISTRY_BASE}/natsio/nats-box:latest}"

EXIT=0
fail() { echo "  [FAIL] $*"; EXIT=1; }
ok()   { echo "  [OK]   $*"; }
info() { echo "  $*"; }

section() { echo; echo "== $1 =="; }

#=== PostgreSQL ===
section "PostgreSQL"
if [ "$HA_ROLE" = "primary" ]; then
    info "本节点角色：primary"
    out=$(docker exec postgres psql -tA -U "$POSTGRES_USERNAME" -c \
        "SELECT client_addr, state, sync_state, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes FROM pg_stat_replication;" 2>&1) || \
        { fail "无法查询 pg_stat_replication: $out"; }
    if [ -n "$out" ]; then
        echo "$out" | while IFS='|' read -r addr state sync lag; do
            [ -z "$addr" ] && continue
            ok "replica: addr=$addr state=$state sync=$sync lag_bytes=$lag"
        done
    else
        fail "无任何 replica 连接"
    fi
else
    info "本节点角色：standby"
    in_recovery=$(docker exec postgres psql -tA -U "$POSTGRES_USERNAME" -c "SELECT pg_is_in_recovery();" 2>&1) || \
        { fail "无法查询 pg_is_in_recovery"; in_recovery=""; }
    if [ "$in_recovery" = "t" ]; then
        ok "处于 recovery 状态"
        lag_secs=$(docker exec postgres psql -tA -U "$POSTGRES_USERNAME" -c \
            "SELECT COALESCE(EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())), 0)::int;" 2>/dev/null || echo "?")
        ok "复制延迟（秒）: $lag_secs"
    else
        fail "未处于 recovery 状态（pg_is_in_recovery=$in_recovery）"
    fi
fi

#=== Redis ===
section "Redis"
redis_cid=$(docker compose ps -q redis 2>/dev/null | head -1)
if [ -z "$redis_cid" ]; then
    fail "未找到 redis 容器"
    redis_info=""
else
    redis_info=$(docker exec "$redis_cid" redis-cli -a "$REDIS_PASSWORD" --no-auth-warning INFO replication 2>/dev/null) || \
        { fail "无法获取 Redis 信息"; redis_info=""; }
fi
role=$(echo "$redis_info" | awk -F: '/^role:/{print $2}' | tr -d '\r')
link=$(echo "$redis_info" | awk -F: '/^master_link_status:/{print $2}' | tr -d '\r')
info "role=$role"
[ "$HA_ROLE" = "standby" ] && {
    [ "$link" = "up" ] && ok "master_link_status=up" || fail "master_link_status=$link"
}

#=== FalkorDB ===
section "FalkorDB"
fdb_cid=$(docker compose ps -q falkordb 2>/dev/null | head -1)
if [ -z "$fdb_cid" ]; then
    fail "未找到 falkordb 容器"
    fdb_info=""
else
    fdb_info=$(docker exec "$fdb_cid" redis-cli -a "$FALKORDB_PASSWORD" --no-auth-warning INFO replication 2>/dev/null) || \
        { fail "无法获取 FalkorDB 信息"; fdb_info=""; }
fi
role=$(echo "$fdb_info" | awk -F: '/^role:/{print $2}' | tr -d '\r')
link=$(echo "$fdb_info" | awk -F: '/^master_link_status:/{print $2}' | tr -d '\r')
info "role=$role"
[ "$HA_ROLE" = "standby" ] && {
    [ "$link" = "up" ] && ok "master_link_status=up" || fail "master_link_status=$link"
}

#=== MinIO Site Replication ===
section "MinIO Site Replication"
MC_IMAGE="${DOCKER_IMAGE_MC:-minio/mc:latest}"
sr_status=$(docker run --rm --network=bklite-prod \
    -e MC_HOST_local="http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
    "$MC_IMAGE" admin replicate status local 2>&1) || sr_status="$sr_status"
echo "$sr_status" | head -20
echo "$sr_status" | grep -q "Replication is disabled\|not enabled" && fail "SR 未启用"

#=== NATS ===
section "NATS JetStream"
nats_exec() {
    docker run --rm --network=bklite-prod \
        -v "$PWD/conf/certs:/etc/certs:ro" \
        "$DOCKER_IMAGE_NATS_CLI" nats \
        -s tls://nats:4222 \
        --tlsca /etc/certs/ca.crt \
        --user "$NATS_ADMIN_USERNAME" --password "$NATS_ADMIN_PASSWORD" \
        "$@" 2>&1
}
for stream in ${HA_MIRROR_STREAMS:-metrics OBJ_bklite METRICS_ALL}; do
    out=$(nats_exec stream info "$stream" --json 2>/dev/null) || { info "$stream: 不存在"; continue; }
    msgs=$(echo "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('state',{}).get('messages','?'))" 2>/dev/null || echo "?")
    is_mirror=$(echo "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if d.get('config',{}).get('mirror') else 'no')" 2>/dev/null || echo "?")
    ok "$stream: messages=$msgs mirror=$is_mirror"
done

echo
[ $EXIT -eq 0 ] && echo "[ALL OK]" || echo "[HAS FAILURES]"
exit $EXIT
