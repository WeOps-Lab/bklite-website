#!/bin/bash
# HA 模式证书生成
#
# 与 bootstrap.sh 内置的 generate_tls_certs 不同，这里 SAN 同时包含主备两端
# 的 hostname 与 IP，且支持复用现有 Blueking Lite CA（如果检测到 ca.key）
#
# 用法：
#   bash bin/ha-gen-certs.sh
#
# 依赖 ha.env 中的：
#   HOST_IP / PEER_HOST / (可选 EXTRA_SAN_DNS=逗号分隔域名 / EXTRA_SAN_IP=逗号分隔 IP)

set -euo pipefail

cd "$(dirname "$0")/.."
source ./common.env
source ./ha.env
[ -f ./port.env ] && source ./port.env

log() { echo "[ha-gen-certs] $*"; }
die() { echo "[ha-gen-certs] FATAL: $*" >&2; exit 1; }

: "${HOST_IP:?HOST_IP 未设置（请先执行 bootstrap.sh 生成 port.env，或在 ha.env 显式设置）}"
: "${PEER_HOST:?PEER_HOST 未设置}"

DIR=./conf/certs
TRAEFIK_DIR=./conf/traefik/certs
OPENSSL_IMAGE="${DOCKER_IMAGE_OPENSSL:-alpine/openssl:3.5.4}"
SERVER_DAYS="${CERT_SERVER_DAYS:-825}"
CA_DAYS="${CERT_CA_DAYS:-3650}"

mkdir -p "$DIR"
ABS_DIR=$(cd "$DIR" && pwd)

# 拼接 SAN
build_san() {
    local san="DNS:nats,DNS:localhost,IP:127.0.0.1"
    add_dns() { san="$san,DNS:$1"; }
    add_ip()  { san="$san,IP:$1"; }

    # HOST_IP
    if [[ "$HOST_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
        add_ip "$HOST_IP"
    else
        add_dns "$HOST_IP"
    fi

    # PEER_HOST
    if [[ "$PEER_HOST" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
        add_ip "$PEER_HOST"
    else
        add_dns "$PEER_HOST"
    fi

    # 额外 SAN
    if [ -n "${EXTRA_SAN_DNS:-}" ]; then
        IFS=',' read -ra dnss <<<"$EXTRA_SAN_DNS"
        for d in "${dnss[@]}"; do add_dns "$d"; done
    fi
    if [ -n "${EXTRA_SAN_IP:-}" ]; then
        IFS=',' read -ra ips <<<"$EXTRA_SAN_IP"
        for i in "${ips[@]}"; do add_ip "$i"; done
    fi

    echo "$san"
}

SAN=$(build_san)
log "SAN: $SAN"

# CA：复用或新建
if [ -f "$DIR/ca.key" ] && [ -f "$DIR/ca.crt" ]; then
    log "检测到现有 CA（$DIR/ca.crt），复用"
else
    log "生成新的 CA"
    docker run --rm -v "$ABS_DIR:/certs" "$OPENSSL_IMAGE" \
        genrsa -out /certs/ca.key 2048
    docker run --rm -v "$ABS_DIR:/certs" "$OPENSSL_IMAGE" \
        req -x509 -new -nodes -key /certs/ca.key -sha256 -days "$CA_DAYS" \
        -subj "/CN=Blueking Lite" -out /certs/ca.crt
fi

log "生成 server 私钥"
docker run --rm -v "$ABS_DIR:/certs" "$OPENSSL_IMAGE" \
    genrsa -out /certs/server.key 2048

log "生成 openssl 配置"
cat > "$DIR/openssl.conf" <<EOF
[req]
distinguished_name = req
req_extensions = req_ext
prompt = no

[req_ext]
subjectAltName = $SAN

[v3_ext]
subjectAltName = $SAN
basicConstraints = CA:FALSE
keyUsage = digitalSignature,keyEncipherment,keyAgreement
# NATS leafnode 为双向 TLS（verify: true），备节点作为 leaf 会用此证书做客户端认证，
# 故必须同时包含 clientAuth，否则 leafnode TLS 握手报 "incompatible key usage"
extendedKeyUsage = serverAuth, clientAuth
EOF

log "生成 CSR + 签名"
docker run --rm -v "$ABS_DIR:/certs" "$OPENSSL_IMAGE" \
    req -new -key /certs/server.key -out /certs/server.csr \
    -config /certs/openssl.conf -subj "/CN=BluekingLite"
docker run --rm -v "$ABS_DIR:/certs" "$OPENSSL_IMAGE" \
    x509 -req -in /certs/server.csr \
    -CA /certs/ca.crt -CAkey /certs/ca.key -CAcreateserial \
    -days "$SERVER_DAYS" -sha256 -out /certs/server.crt \
    -extensions v3_ext -extfile /certs/openssl.conf

rm -f "$DIR/server.csr" "$DIR/openssl.conf"
log "完成：$DIR/server.crt （$(docker run --rm -v "$ABS_DIR:/certs" "$OPENSSL_IMAGE" x509 -noout -dates -in /certs/server.crt | tr '\n' ' ')）"

# 同步到 traefik
mkdir -p "$TRAEFIK_DIR"
cp -f "$DIR/server.crt" "$DIR/server.key" "$TRAEFIK_DIR/"
log "已复制到 traefik 证书目录"
log "下一步：scp 全部 conf/certs/* 到对端节点同路径，然后两端 docker compose restart nats traefik server web webhookd vector"
