#!/bin/bash
# HA 回切：在原主节点上执行，把流量从临时主（原备）切回本节点
#
# 严格要求：先确保原主已作为 standby 跟上当前主（数据反向同步追平），再 promote
# 否则会丢失切换期间在临时主上产生的数据

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env
source ./db.env 2>/dev/null || true

# 独立运行时 DOCKER_IMAGE_NATS_CLI 未由 bootstrap 注入，按 REGISTRY_BASE 兜底
DOCKER_IMAGE_NATS_CLI="${DOCKER_IMAGE_NATS_CLI:-${REGISTRY_BASE}/natsio/nats-box:latest}"

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
# 前置：本节点到对端需配置 root 免密 SSH（双向）。bootstrap 不会自动配置，需运维准备。
PEER_SSH_USER="${PEER_SSH_USER:-root}"
STOP_CMD="cd $(pwd) && docker compose --profile active stop server web webhookd nats-executor stargazer fusion-collector telegraf"
if ssh -o ConnectTimeout=5 -o BatchMode=yes "$PEER_SSH_USER@$PEER_HOST" "true" 2>/dev/null; then
    ssh "$PEER_SSH_USER@$PEER_HOST" "$STOP_CMD" || die "远程停止当前主业务进程失败"
else
    # SSH 不通（如未配双向免密）：降级为人工执行，避免直接 die
    log "WARNING: 无法 SSH 到当前主 $PEER_HOST（请检查双向免密 SSH）"
    echo "请手动在当前主 $PEER_HOST 上执行以下命令停止其业务进程，完成后回车继续："
    echo "    $STOP_CMD"
    confirm "已在 $PEER_HOST 停止业务进程，继续 failback 吗？"
fi

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

# NATS 流接管：mirror immutable，删除后重建为源流（详见 ha-takeover-streams.sh）
bash ./bin/ha-takeover-streams.sh || log "WARNING: NATS 流接管出现问题"

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
