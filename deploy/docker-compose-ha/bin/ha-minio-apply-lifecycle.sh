#!/bin/bash
# 给所有 bucket 配置 lifecycle policy，限制 noncurrent version 保留 ≤ 7 天
# 避免 versioning + Site Replication 后磁盘膨胀失控
#
# 主备各执行一次（lifecycle 配置本身也会被 SR 同步）

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env

log() { echo "[ha-minio-lifecycle] $*"; }

MC_IMAGE="${DOCKER_IMAGE_MC:-minio/mc:latest}"
NONCURRENT_DAYS="${HA_MINIO_NONCURRENT_DAYS:-7}"

run_mc() {
    docker run --rm --network=bklite-prod \
        -e MC_HOST_local="http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
        "$MC_IMAGE" "$@"
}

buckets=$(run_mc ls local --json | python3 -c "import sys, json
for line in sys.stdin:
    obj = json.loads(line)
    key = obj.get('key', '')
    if key:
        print(key.rstrip('/'))")

while IFS= read -r b; do
    [ -z "$b" ] && continue
    log "[apply] $b -> noncurrent expiration ${NONCURRENT_DAYS}d"
    run_mc ilm rule add "local/$b" \
        --noncurrent-expire-days "$NONCURRENT_DAYS" \
        --transition-days 0 2>/dev/null || \
    run_mc ilm rule add "local/$b" --noncurrent-expire-days "$NONCURRENT_DAYS"
done <<<"$buckets"

log "lifecycle 规则配置完成"
