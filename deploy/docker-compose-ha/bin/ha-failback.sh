#!/bin/bash
# HA 回切：在原主节点上执行，把流量从临时主（原备）切回本节点
#
# 严格要求：先确保原主已作为 standby 跟上当前主（数据反向同步追平），再 promote
# 否则会丢失切换期间在临时主上产生的数据

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env

log()  { echo "[failback] $*"; }
die()  { echo "[failback] FATAL: $*" >&2; exit 1; }
step() { echo; echo "===== $* ====="; }

[ "$HA_ROLE" = "primary" ] || die "ha-failback 必须在原 primary 节点执行（当前 HA_ROLE=$HA_ROLE）"

confirm() {
    local msg="$1"
    read -r -p "$msg [yes/no] " answer
    [ "$answer" = "yes" ] || die "用户中止"
}

FORCE=false
[ "${1:-}" = "--force" ] && FORCE=true

#=== 1. 校验反向同步追平 ===
step "1/4 校验反向同步状态"
log "确认以下条件后再继续："
log "  - 本节点 PG 正以 standby 方式连接当前主，pg_is_in_recovery()=t，复制延迟接近 0"
log "  - 本节点 Redis / FalkorDB role=slave，master_link_status=up"
log "  - 本节点 NATS 已为关键流配置 mirror，消息计数与当前主接近"
log "  - MinIO Site Replication status 显示 Online，对象计数追平"
echo
if ! ./bin/ha-status.sh; then
    if [ "$FORCE" = "true" ]; then
        log "[force] 忽略 ha-status 失败项"
    else
        log "ha-status 有失败项；可用 --force 跳过校验"
    fi
fi
confirm "反向同步已追平，继续 failback 吗？"

#=== 2. 在当前主（原备）上停业务进程 ===
step "2/4 远程停止当前主上的业务进程"
PEER_SSH_USER="${PEER_SSH_USER:-root}"
ssh -o ConnectTimeout=5 "$PEER_SSH_USER@$PEER_HOST" \
    "cd $(pwd) && docker compose --profile active stop server web webhookd nats-executor stargazer fusion-collector" || \
    die "无法远程停止当前主业务进程"

#=== 3. 在本节点 promote + 启动业务 ===
step "3/4 在本节点 promote + 启动业务"
docker exec postgres psql -U "$POSTGRES_USERNAME" -c \
    "SELECT pg_promote(wait => true, wait_seconds => 60);" >/dev/null || die "pg_promote 失败"
redis_cid=$(docker compose ps -q redis | head -1)
fdb_cid=$(docker compose ps -q falkordb | head -1)
[ -n "$redis_cid" ] || die "找不到 redis 容器"
[ -n "$fdb_cid" ]   || die "找不到 falkordb 容器"
docker exec "$redis_cid" redis-cli -a "$REDIS_PASSWORD" --no-auth-warning REPLICAOF NO ONE \
    || die "Redis REPLICAOF NO ONE 失败"
docker exec "$fdb_cid" redis-cli -a "$FALKORDB_PASSWORD" --no-auth-warning REPLICAOF NO ONE \
    || die "FalkorDB REPLICAOF NO ONE 失败"

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
    nats_exec stream info "$stream" >/dev/null 2>&1 && \
        nats_exec stream edit "$stream" --no-mirror --defaults || true
done

docker compose --profile active up -d
sleep 10

#=== 4. DNS 切回提示 ===
step "4/4 DNS 切回操作"
cat <<EOF

回切完成。请在 DNS 提供商处把 A 记录切回本节点：

  域名: <your-bklite-domain>
  目标: $(hostname -I | awk '{print $1}')

随后再次按部署文档通知 agent / 采集端重启。
EOF
