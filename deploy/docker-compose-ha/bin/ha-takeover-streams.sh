#!/bin/bash
# 切换接管：把本节点上的只读 mirror 流转为可写源流
#
# 背景：NATS JetStream 的 mirror 配置是 immutable 的，无法通过 `stream edit --no-mirror`
#       移除（服务端报 10055: stream mirror configuration can not be updated）。因此
#       failover/failback 接管 mirror 流的唯一办法是「删除 mirror 流后重建为源流」。
#
# 行为：
#   1. 对 HA_MIRROR_STREAMS 中每个流，若存在且为 mirror，则删除（本地已镜像的消息会丢失；
#      metrics 为短保留流可接受；OBJ_bklite 的对象数据本身由 MinIO 站点复制保护）
#   2. 调用 ha-ensure-source-streams.sh 重建 metrics 源流
#   3. OBJ_bklite / METRICS_ALL 由业务运行时按需重建，本脚本不重建
#
# 幂等：非 mirror 的流不动。

set -uo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env 2>/dev/null || true
DOCKER_IMAGE_NATS_CLI="${DOCKER_IMAGE_NATS_CLI:-${REGISTRY_BASE}/natsio/nats-box:latest}"

log() { echo "[ha-takeover] $*"; }

nats_cli() {
    docker run --rm --network=bklite-prod \
        -v "$PWD/conf/certs:/etc/certs:ro" \
        "$DOCKER_IMAGE_NATS_CLI" nats \
        -s tls://nats:4222 \
        --tlsca /etc/certs/ca.crt \
        --user "$NATS_ADMIN_USERNAME" --password "$NATS_ADMIN_PASSWORD" \
        "$@"
}

is_mirror() {
    nats_cli stream info "$1" --json 2>/dev/null | grep -q '"mirror"'
}

for stream in ${HA_MIRROR_STREAMS:-metrics OBJ_bklite METRICS_ALL}; do
    if nats_cli stream info "$stream" >/dev/null 2>&1; then
        if is_mirror "$stream"; then
            log "[$stream] 删除只读 mirror（mirror 配置不可改，只能删后重建）"
            nats_cli stream rm "$stream" -f >/dev/null 2>&1 \
                || log "WARNING: 删除 $stream 失败，请手动处理"
        else
            log "[$stream] 已是可写流，跳过"
        fi
    fi
done

# 重建 metrics 源流（OBJ_bklite / METRICS_ALL 由业务自建）
bash ./bin/ha-ensure-source-streams.sh
log "完成"
