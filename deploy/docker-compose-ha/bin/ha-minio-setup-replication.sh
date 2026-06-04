#!/bin/bash
# MinIO Site Replication 配置
#
# 仅需在主节点执行一次。脚本会：
#   1. 在本节点创建 SR 服务账号（MINIO_SR_USER / MINIO_SR_PASSWORD）
#   2. 调用 `mc admin replicate add` 把对端节点加入复制集群
#
# 前置：
#   - 主备 MinIO 都已经启动
#   - 主备所有 bucket 都已启用 versioning（运行 ha-minio-enable-versioning.sh）
#   - PEER_MINIO_ENDPOINT 在 ha.env 中正确配置且双向可达

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env

log() { echo "[ha-minio-sr] $*"; }
die() { echo "[ha-minio-sr] ERROR: $*" >&2; exit 1; }

if [ "$HA_ROLE" != "primary" ]; then
    die "本脚本只能在 primary 节点执行（当前 HA_ROLE=$HA_ROLE）"
fi

: "${PEER_MINIO_ENDPOINT:?PEER_MINIO_ENDPOINT 未设置}"
: "${MINIO_SR_USER:?MINIO_SR_USER 未设置}"
: "${MINIO_SR_PASSWORD:?MINIO_SR_PASSWORD 未设置}"

MC_IMAGE="${DOCKER_IMAGE_MC:-minio/mc:latest}"

run_mc() {
    docker run --rm --network=bklite-prod \
        -e MC_HOST_local="http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000" \
        -e MC_HOST_peer="${PEER_MINIO_ENDPOINT/http:\/\//http:\/\/${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@}" \
        "$MC_IMAGE" "$@"
}

ensure_user() {
    local alias="$1"
    local out
    if out=$(run_mc admin user info "$alias" "$MINIO_SR_USER" 2>&1); then
        log "[skip] $alias 账号 $MINIO_SR_USER 已存在"
        return 0
    fi
    if echo "$out" | grep -qiE "not exist|no such|not found|user does not exist"; then
        log "[create] $alias 账号 $MINIO_SR_USER"
        run_mc admin user add "$alias" "$MINIO_SR_USER" "$MINIO_SR_PASSWORD"
        run_mc admin policy attach "$alias" consoleAdmin --user "$MINIO_SR_USER"
    else
        die "查询 $alias 账号失败（既不是 not-found 也不是成功）：$out"
    fi
}

log "确保本节点存在 SR 服务账号 $MINIO_SR_USER ..."
ensure_user local

log "在对端节点确保同名 SR 服务账号..."
ensure_user peer

log "检查现有 Site Replication 状态..."
if run_mc admin replicate info local 2>/dev/null | grep -q 'SiteReplication is not enabled'; then
    log "[init] 添加站点复制（local + peer）"
    run_mc admin replicate add local peer
else
    log "[skip] Site Replication 已启用，跳过 add"
fi

log "当前 SR 拓扑："
run_mc admin replicate info local

log "完成。可用 'mc admin replicate status local' 查看复制状态。"
