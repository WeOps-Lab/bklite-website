#!/bin/bash
# 在 standby 节点初始化 NATS JetStream mirror 流
#
# 备节点 NATS 通过 leafnode 连接到主节点 NATS；
# 此脚本调用 nats-box 在备节点本地 JetStream 上为每个关键流创建 mirror 配置，
# 让主节点流的消息异步复制到备节点本地。
#
# 幂等：已存在的 mirror 流跳过

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env

log() { echo "[ha-init-mirror] $*"; }

if [ "$HA_ROLE" != "standby" ]; then
    log "本脚本仅在 standby 节点有意义（当前 HA_ROLE=$HA_ROLE），跳过"
    exit 0
fi

STREAMS="${HA_MIRROR_STREAMS:-metrics OBJ_bklite METRICS_ALL}"

nats_exec() {
    docker run --rm --network=bklite-prod \
        -v "$PWD/conf/certs:/etc/certs:ro" \
        "$DOCKER_IMAGE_NATS_CLI" nats \
        -s tls://nats:4222 \
        --tlsca /etc/certs/ca.crt \
        --user "$NATS_ADMIN_USERNAME" --password "$NATS_ADMIN_PASSWORD" \
        "$@"
}

for stream in $STREAMS; do
    if nats_exec stream info "$stream" >/dev/null 2>&1; then
        log "[skip] 流 $stream 已存在"
        continue
    fi
    log "[create-mirror] $stream"
    # 备节点本地 mirror 流名称沿用主节点流名，便于切换时直接接管
    nats_exec stream add "$stream" \
        --mirror "$stream" \
        --storage=file --replicas=1 \
        --retention=limits --discard=old \
        --max-age=-1 --max-bytes=-1 --max-consumers=-1 \
        --max-msg-size=-1 --max-msgs=-1 --max-msgs-per-subject=-1 \
        --dupe-window=5m --no-allow-rollup --no-deny-delete --no-deny-purge \
        --defaults || log "WARNING: 创建 mirror $stream 失败，可能是上游流尚未创建；待主节点就绪后重试"
done

log "完成。可用 'nats stream report' 查看 mirror 状态"
