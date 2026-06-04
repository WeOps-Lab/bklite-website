#!/bin/bash
# 在 standby 节点初始化 NATS JetStream mirror 流
#
# 备节点 NATS 通过 leafnode 连接到主节点 NATS；备节点拥有自己独立的 JetStream domain
# （bklite_standby），此脚本在备节点本地为每个关键流创建 mirror，mirror 通过 external api
# "$JS.<主domain>.API" 跨 leafnode 引用主节点同名流，从而把主节点流的消息异步复制到备节点本地。
#
# 关键点：
#   - 主备 JetStream domain 必须不同（主 bklite / 备 bklite_standby），否则 mirror 自引用拉不到数据
#   - nats CLI 0.3.0 无 --mirror-domain flag，跨域 mirror 通过 --config JSON 的 mirror.external.api 指定
#
# 幂等：已存在的同名流跳过
#
# 排障：若 mirror 一直 Lag 不下降，检查 leafnode 是否连上（两端 nats 日志无 TLS handshake error）、
#       证书是否含 clientAuth、主备 domain 是否不同。

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
# 对端（mirror 源 = 当前主）的 JetStream domain，按对端节点 NATS_INSTANCE_ID 推导
HUB_DOMAIN="${HA_HUB_JS_DOMAIN:-bklite_${PEER_NATS_INSTANCE_ID:-primary}}"
# 独立运行（非 bootstrap 调用）时 DOCKER_IMAGE_NATS_CLI 可能未定义，按 REGISTRY_BASE 兜底
DOCKER_IMAGE_NATS_CLI="${DOCKER_IMAGE_NATS_CLI:-${REGISTRY_BASE}/natsio/nats-box:latest}"
MIRROR_DIR="$PWD/conf/nats/mirror"
mkdir -p "$MIRROR_DIR"

nats_cli() {
    docker run --rm --network=bklite-prod \
        -v "$PWD/conf/certs:/etc/certs:ro" \
        -v "$MIRROR_DIR:/mirror:ro" \
        "$DOCKER_IMAGE_NATS_CLI" nats \
        -s tls://nats:4222 \
        --tlsca /etc/certs/ca.crt \
        --user "$NATS_ADMIN_USERNAME" --password "$NATS_ADMIN_PASSWORD" \
        "$@"
}

for stream in $STREAMS; do
    if nats_cli stream info "$stream" >/dev/null 2>&1; then
        # 已存在：若已是 mirror 则跳过；若是普通流（如本节点曾为主时遗留的源流），
        # 则删除重建为 mirror，否则 mirror 初始化会被「已存在」跳过、永远不反向同步
        if nats_cli stream info "$stream" --json 2>/dev/null | grep -q '"mirror"'; then
            log "[skip] 流 $stream 已是 mirror"
            continue
        fi
        log "[reset] 流 $stream 存在但非 mirror（疑为旧源流），删除后重建为 mirror"
        nats_cli stream rm "$stream" -f >/dev/null 2>&1 || log "WARNING: 删除旧 $stream 失败"
    fi
    log "[create-mirror] $stream  (external api=\$JS.${HUB_DOMAIN}.API)"
    # 备节点本地 mirror 流名称沿用主节点流名，便于切换时直接接管
    cat > "$MIRROR_DIR/$stream.json" <<JSON
{
  "name": "$stream",
  "retention": "limits",
  "max_consumers": -1,
  "max_msgs": -1,
  "max_bytes": -1,
  "max_age": 0,
  "max_msgs_per_subject": -1,
  "max_msg_size": -1,
  "storage": "file",
  "discard": "old",
  "num_replicas": 1,
  "duplicate_window": 300000000000,
  "mirror": { "name": "$stream", "external": { "api": "\$JS.${HUB_DOMAIN}.API" } }
}
JSON
    nats_cli stream add "$stream" --config "/mirror/$stream.json" \
        || log "WARNING: 创建 mirror $stream 失败，可能是上游流尚未创建；待主节点就绪后重试"
done

log "完成。可用 'nats stream report' 或 'nats stream info <stream>' 查看 mirror 状态（应显示 Mirror: ... API Prefix）"
