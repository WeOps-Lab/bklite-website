#!/bin/bash
# 确保主节点必需的「源」JetStream 流存在（当前仅 metrics）
#
# 用途：
#   - 主节点 bootstrap 时创建 metrics 流
#   - failover / failback 接管时，删除只读 mirror 后用本脚本把 metrics 重建为可写源流
#
# 注意：OBJ_bklite（MinIO 对象存储流 $O.bklite.*）与 METRICS_ALL 由业务运行时动态创建，
#       本脚本不负责，切换后由对应业务进程自行重建。
#
# 幂等：流已存在则跳过。

set -uo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env 2>/dev/null || true
DOCKER_IMAGE_NATS_CLI="${DOCKER_IMAGE_NATS_CLI:-${REGISTRY_BASE}/natsio/nats-box:latest}"

log() { echo "[ha-source-streams] $*"; }

nats_cli() {
    docker run --rm --network=bklite-prod \
        -v "$PWD/conf/certs:/etc/certs:ro" \
        "$DOCKER_IMAGE_NATS_CLI" nats \
        -s tls://nats:4222 \
        --tlsca /etc/certs/ca.crt \
        --user "$NATS_ADMIN_USERNAME" --password "$NATS_ADMIN_PASSWORD" \
        "$@"
}

if nats_cli stream info metrics >/dev/null 2>&1; then
    log "[skip] metrics 流已存在"
else
    log "[create] metrics 源流 (subjects=metrics.*)"
    nats_cli stream add metrics --subjects=metrics.* --storage=file \
        --replicas=1 --retention=limits --discard=old \
        --max-age=20m --max-bytes=104857600 --max-consumers=-1 \
        --max-msg-size=-1 --max-msgs=-1 --max-msgs-per-subject=1000000 \
        --dupe-window=5m --no-allow-rollup --no-deny-delete --no-deny-purge \
        || log "WARNING: metrics 流创建失败（可能已存在）"
fi
