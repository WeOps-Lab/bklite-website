#!/bin/bash
# 给本节点 MinIO 所有 bucket 启用 versioning
#
# Site Replication 要求所有参与复制的 bucket 都启用 versioning
# 此脚本是幂等的：已启用的 bucket 不会被重复设置
#
# 用法：在主、备节点分别执行一次

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env

log() { echo "[ha-minio-versioning] $*"; }

MC_IMAGE="${DOCKER_IMAGE_MC:-minio/mc:latest}"
MINIO_LOCAL_ENDPOINT="http://minio:9000"

run_mc() {
    docker run --rm --network=bklite-prod \
        -e MC_HOST_local="http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
        "$MC_IMAGE" "$@"
}

log "枚举本节点 MinIO bucket..."
buckets=$(run_mc ls local --json | python3 -c "import sys, json
for line in sys.stdin:
    obj = json.loads(line)
    key = obj.get('key', '')
    if key:
        print(key.rstrip('/'))")

if [ -z "$buckets" ]; then
    log "未发现任何 bucket"
    exit 0
fi

while IFS= read -r b; do
    [ -z "$b" ] && continue
    current=$(run_mc version info "local/$b" --json | python3 -c "import sys, json; print(json.loads(sys.stdin.read()).get('status', ''))")
    if [ "$current" = "Enabled" ]; then
        log "[skip] $b 已启用 versioning"
    else
        log "[enable] $b"
        run_mc version enable "local/$b"
    fi
done <<<"$buckets"

log "所有 bucket 处理完成"
