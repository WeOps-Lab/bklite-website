#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local level="$1"
    local message="$2"
    local color=""
    case "$level" in
        "INFO") color="$BLUE" ;;
        "WARNING") color="$YELLOW" ;;
        "ERROR") color="$RED" ;;
        "SUCCESS") color="$GREEN" ;;
        *) color="$NC" ;;
    esac
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message${NC}"
}

version_compare() {
    local version1="$1"
    local version2="$2"
    version1=$(echo "$version1" | sed 's/^v//')
    version2=$(echo "$version2" | sed 's/^v//')
    IFS='.' read -ra ver1_parts <<< "$version1"
    IFS='.' read -ra ver2_parts <<< "$version2"
    local max_parts=$(( ${#ver1_parts[@]} > ${#ver2_parts[@]} ? ${#ver1_parts[@]} : ${#ver2_parts[@]} ))
    for ((i=0; i<max_parts; i++)); do
        local part1=${ver1_parts[i]:-0}
        local part2=${ver2_parts[i]:-0}
        if [[ $part1 -gt $part2 ]]; then return 0; fi
        if [[ $part1 -lt $part2 ]]; then return 1; fi
    done
    return 0
}

check_docker_version() {
    local required_version="20.10.23"
    if ! command -v docker >/dev/null 2>&1; then
        log "ERROR" "未找到 docker 命令，请安装 Docker"
        exit 1
    fi
    local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if [ -z "$docker_version" ]; then
        log "ERROR" "无法获取 Docker 版本信息"
        exit 1
    fi
    log "INFO" "当前 Docker 版本: $docker_version"
    if version_compare "$docker_version" "$required_version"; then
        log "SUCCESS" "Docker 版本满足要求 (>= $required_version)"
    else
        log "ERROR" "Docker 版本过低，要求版本 >= $required_version"
        exit 1
    fi
}

check_docker_compose_version() {
    local required_version="2.27.0"
    local compose_version=""
    if command -v docker-compose >/dev/null 2>&1; then
        compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        compose_version=$(docker compose version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        DOCKER_COMPOSE_CMD="docker compose"
    else
        log "ERROR" "未找到 docker-compose 或 docker compose 命令"
        exit 1
    fi
    if [ -z "$compose_version" ]; then
        log "ERROR" "无法获取 Docker Compose 版本信息"
        exit 1
    fi
    log "INFO" "当前 Docker Compose 版本: $compose_version"
    if version_compare "$compose_version" "$required_version"; then
        log "SUCCESS" "Docker Compose 版本满足要求 (>= $required_version)"
    else
        log "ERROR" "Docker Compose 版本过低，要求版本 >= $required_version"
        exit 1
    fi
}

generate_password() {
    local length=$1
    cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c $length
}

add_mirror_prefix() {
    local image="$1"
    if [ -n "${MIRROR:-}" ]; then
        if [[ "$image" == *"/"* ]]; then
            echo "${MIRROR}/${image}"
        else
            echo "${MIRROR}/library/${image}"
        fi
    else
        echo "$image"
    fi
}

init_docker_images() {
    log "INFO" "初始化镜像变量，当前 MIRROR=${MIRROR:-}"
    export DOCKER_IMAGE_REDIS=$(add_mirror_prefix "redis:5.0.14")
    export DOCKER_IMAGE_NATS=$(add_mirror_prefix "nats:2.10.25")
    export DOCKER_IMAGE_NATS_CLI=$(add_mirror_prefix "natsio/nats-box:latest")
    export DOCKER_IMAGE_POSTGRES=$(add_mirror_prefix "postgres:15")
    export DOCKER_IMAGE_PGVECTOR=$(add_mirror_prefix "pgvector/pgvector:pg15")
    export DOCKER_IMAGE_FALKORDB=$(add_mirror_prefix "falkordb/falkordb:v4.12.4")
    export DOCKER_IMAGE_VICTORIA_METRICS=$(add_mirror_prefix "victoriametrics/victoria-metrics:v1.106.1")
    export DOCKER_IMAGE_VICTORIALOGS=$(add_mirror_prefix "victoriametrics/victoria-logs:v1.25.0")
    export DOCKER_IMAGE_VECTOR=$(add_mirror_prefix "timberio/vector:0.48.0-debian")
    export DOCKER_IMAGE_MINIO=$(add_mirror_prefix "minio/minio:RELEASE.2024-05-01T01-11-10Z-cpuv1")
    export DOCKER_IMAGE_MLFLOW=$(add_mirror_prefix "bklite/mlflow")
    export DOCKER_IMAGE_NATS_EXECUTOR=$(add_mirror_prefix "bklite/nats-executor")
    export DOCKER_IMAGE_TELEGRAF=$(add_mirror_prefix "bklite/telegraf:latest")
    export DOCKER_IMAGE_OPENSSL=$(add_mirror_prefix "alpine/openssl:3.5.4")
    export POSTGRES_USERNAME=postgres
    log "INFO" "Docker 镜像环境变量初始化完成"
}

show_usage() {
    echo "Usage: $0 <command> [--domain <name>] [options]"
    echo ""
    echo "Commands:"
    echo "  ls        列出所有 dev 环境实例"
    echo "  start     启动 dev 环境"
    echo "  stop      停止 dev 环境"
    echo "  destroy   销毁 dev 环境（删除容器和数据卷）"
    echo "  status    查看 dev 环境状态"
    echo ""
    echo "Required Options:"
    echo "  --domain <name>    dev 环境的唯一命名空间标识"
    echo ""
    echo "Optional:"
    echo "  --mirror <url>        镜像仓库地址"
    echo "  --web-port <port>     Web 服务端口 (交互式输入时可不指定)"
    echo "  --code-port <port>    Code-Server 端口 (交互式输入时可不指定)"
    echo ""
    echo "Examples:"
    echo "  $0 ls"
    echo "  $0 start --domain dev-test"
    echo "  $0 start --domain dev-test --web-port 3000 --code-port 8080"
    echo "  $0 stop --domain dev-test"
    echo "  $0 destroy --domain dev-test"
    echo "  $0 status --domain dev-test"
}

copy_conf_files() {
    local base_dir="$1"
    local script_dir="$2"
    local source_conf="${script_dir}/conf"
    
    log "INFO" "复制配置文件到 ${base_dir}/conf ..."
    
    mkdir -p "${base_dir}/conf/vector"
    mkdir -p "${base_dir}/conf/telegraf"
    mkdir -p "${base_dir}/conf/postgres"
    mkdir -p "${base_dir}/conf/nats"
    mkdir -p "${base_dir}/conf/certs"
    
    # 从打包的 conf 目录复制（pre-commit 时已从 docker-compose/conf 同步）
    if [ -f "${source_conf}/vector/vector.yaml" ]; then
        cp "${source_conf}/vector/vector.yaml" "${base_dir}/conf/vector/"
    fi
    
    if [ -f "${source_conf}/telegraf/telegraf.conf" ]; then
        cp "${source_conf}/telegraf/telegraf.conf" "${base_dir}/conf/telegraf/"
    fi
    
    if [ -f "${source_conf}/postgres/initdb.sql" ]; then
        cp "${source_conf}/postgres/initdb.sql" "${base_dir}/conf/postgres/"
    fi
}

generate_tls_certs() {
    local base_dir="$1"
    local dir="${base_dir}/conf/certs"
    local openssl_image=$DOCKER_IMAGE_OPENSSL

    if [ -f "$dir/server.crt" ] && [ -f "$dir/server.key" ] && [ -f "$dir/ca.crt" ]; then
        log "SUCCESS" "TLS 证书已存在，跳过生成步骤..."
        return
    fi
    
    log "INFO" "生成自签名 TLS 证书..."
    mkdir -p ${dir}
    local abs_dir=$(cd "$dir" && pwd)
    local san="DNS:nats,DNS:localhost,IP:127.0.0.1"
    local cn="BluekingLite-Dev"

    docker run --rm -v "${abs_dir}:/certs" "${openssl_image}" \
        genrsa -out "/certs/ca.key" 2048 2>/dev/null

    docker run --rm -v "${abs_dir}:/certs" "${openssl_image}" \
        req -x509 -new -nodes -key "/certs/ca.key" -sha256 -days 3650 \
        -subj "/CN=Blueking Lite Dev" -out "/certs/ca.crt" 2>/dev/null

    docker run --rm -v "${abs_dir}:/certs" "${openssl_image}" \
        genrsa -out "/certs/server.key" 2048 2>/dev/null

    cat > "${dir}/openssl.conf" << EOF
[req]
distinguished_name = req
req_extensions = req_ext
prompt = no

[req_ext]
subjectAltName = ${san}

[v3_ext]
subjectAltName = ${san}
basicConstraints = CA:FALSE
keyUsage = digitalSignature,keyEncipherment,keyAgreement
extendedKeyUsage = serverAuth
EOF

    docker run --rm -v "${abs_dir}:/certs" "${openssl_image}" \
        req -new -key "/certs/server.key" -out "/certs/server.csr" \
        -config "/certs/openssl.conf" -subj "/CN=${cn}" 2>/dev/null

    docker run --rm -v "${abs_dir}:/certs" "${openssl_image}" \
        x509 -req -in "/certs/server.csr" -CA "/certs/ca.crt" -CAkey "/certs/ca.key" \
        -CAcreateserial -days 825 -sha256 -out "/certs/server.crt" \
        -extensions v3_ext -extfile "/certs/openssl.conf" 2>/dev/null

    rm -f "${dir}/server.csr" "${dir}/openssl.conf"
    log "SUCCESS" "TLS 证书生成完成"
}

generate_nats_conf() {
    local base_dir="$1"
    local nats_admin_username="$2"
    local nats_admin_password="$3"
    local nats_monitor_username="$4"
    local nats_monitor_password="$5"
    local domain="$6"
    
    local conf_file="${base_dir}/conf/nats/nats.conf"
    
    if [ -f "$conf_file" ]; then
        log "WARNING" "nats.conf 已存在，跳过生成..."
        return
    fi
    
    log "INFO" "生成 nats.conf..."
    mkdir -p "${base_dir}/conf/nats"
    
    cat > "$conf_file" <<EOF
port: 4222

monitor_port: 8222

trace: false
debug: false
logtime: false

tls {
  cert_file: "/etc/nats/certs/server.crt"
  key_file: "/etc/nats/certs/server.key"
  ca_file: "/etc/nats/certs/ca.crt"
}
leafnodes {
    port: 7422
    tls {
        cert_file: "/etc/nats/certs/server.crt"
        key_file: "/etc/nats/certs/server.key"
        ca_file: "/etc/nats/certs/ca.crt"
        verify: true
    }
}
jetstream: enabled
jetstream {
  store_dir=/nats/storage
  domain=bklite-dev
}

server_name=nats-server-dev
authorization {  
  default_permissions = {
    publish =[]
    subscribe = []
  }
  users = [
    {
      user: "${nats_admin_username}"
      password: "${nats_admin_password}"
      permissions: {
        publish = [">"]
        subscribe = [">"]
      }
    },
    {
      user: "${nats_monitor_username}"
      password: "${nats_monitor_password}"
      permissions: {
        publish = ["metrics.>","vector"]
        subscribe = []
      }
    }
  ]
}
EOF
    log "SUCCESS" "nats.conf 生成完成"
}

generate_common_env() {
    local base_dir="$1"
    local domain="$2"
    local env_file="${base_dir}/common.env"
    
    if [ -f "$env_file" ]; then
        log "SUCCESS" "发现 common.env 配置文件，加载已保存的环境变量..."
        source "$env_file"
        MIRROR=${MIRROR:-""}
    else
        log "INFO" "生成随机环境变量..."
        export POSTGRES_PASSWORD=$(generate_password 32)
        export REDIS_PASSWORD=$(generate_password 32)
        export SECRET_KEY=$(generate_password 32)
        export NEXTAUTH_SECRET=$(generate_password 12)
        export NATS_ADMIN_USERNAME=admin
        export NATS_ADMIN_PASSWORD=$(generate_password 32)
        export NATS_MONITOR_USERNAME=monitor
        export NATS_MONITOR_PASSWORD=$(generate_password 32)
        export MINIO_ROOT_USER=minio
        export MINIO_ROOT_PASSWORD=$(generate_password 32)
        export FALKORDB_PASSWORD=$(generate_password 32)
        export CODESERVER_PASSWORD=$(generate_password 16)
        export OPENCODE_PASSWORD=$(generate_password 16)
        export MIRROR=${MIRROR:-""}
        export DOMAIN=$domain

        cat > "$env_file" <<EOF
export POSTGRES_PASSWORD=$POSTGRES_PASSWORD
export REDIS_PASSWORD=$REDIS_PASSWORD
export SECRET_KEY=$SECRET_KEY
export NEXTAUTH_SECRET=$NEXTAUTH_SECRET
export NATS_ADMIN_USERNAME=$NATS_ADMIN_USERNAME
export NATS_ADMIN_PASSWORD=$NATS_ADMIN_PASSWORD
export NATS_MONITOR_USERNAME=$NATS_MONITOR_USERNAME
export NATS_MONITOR_PASSWORD=$NATS_MONITOR_PASSWORD
export MINIO_ROOT_USER=$MINIO_ROOT_USER
export MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD
export FALKORDB_PASSWORD=$FALKORDB_PASSWORD
export CODESERVER_PASSWORD=$CODESERVER_PASSWORD
export OPENCODE_PASSWORD=$OPENCODE_PASSWORD
export MIRROR=$MIRROR
export DOMAIN=$DOMAIN
EOF
        log "SUCCESS" "环境变量已生成并保存到 $env_file"
    fi
}

generate_env_file() {
    local base_dir="$1"
    local domain="$2"
    
    log "INFO" "生成 .env 文件..."
    cat > "${base_dir}/.env" <<EOF
DOMAIN=${domain}
PORT=${WEB_PORT}
CODE_PORT=${CODE_PORT}

POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_USERNAME=${POSTGRES_USERNAME}
REDIS_PASSWORD=${REDIS_PASSWORD}
SECRET_KEY=${SECRET_KEY}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NATS_ADMIN_USERNAME=${NATS_ADMIN_USERNAME}
NATS_ADMIN_PASSWORD=${NATS_ADMIN_PASSWORD}
NATS_MONITOR_USERNAME=${NATS_MONITOR_USERNAME}
NATS_MONITOR_PASSWORD=${NATS_MONITOR_PASSWORD}
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
FALKORDB_PASSWORD=${FALKORDB_PASSWORD}

CODESERVER_PASSWORD=${CODESERVER_PASSWORD}
OPENCODE_PASSWORD=${OPENCODE_PASSWORD}

DOCKER_IMAGE_REDIS=${DOCKER_IMAGE_REDIS}
DOCKER_IMAGE_NATS=${DOCKER_IMAGE_NATS}
DOCKER_IMAGE_NATS_CLI=${DOCKER_IMAGE_NATS_CLI}
DOCKER_IMAGE_VICTORIA_METRICS=${DOCKER_IMAGE_VICTORIA_METRICS}
DOCKER_IMAGE_POSTGRES=${DOCKER_IMAGE_POSTGRES}
DOCKER_IMAGE_MINIO=${DOCKER_IMAGE_MINIO}
DOCKER_IMAGE_TELEGRAF=${DOCKER_IMAGE_TELEGRAF}
DOCKER_IMAGE_VICTORIALOGS=${DOCKER_IMAGE_VICTORIALOGS}
DOCKER_IMAGE_MLFLOW=${DOCKER_IMAGE_MLFLOW}
DOCKER_IMAGE_NATS_EXECUTOR=${DOCKER_IMAGE_NATS_EXECUTOR}
DOCKER_IMAGE_FALKORDB=${DOCKER_IMAGE_FALKORDB}
DOCKER_IMAGE_PGVECTOR=${DOCKER_IMAGE_PGVECTOR}
DOCKER_IMAGE_VECTOR=${DOCKER_IMAGE_VECTOR}

DEBUG=True
JWT_ALGORITHM=HS256
NATS_SERVERS=tls://${NATS_ADMIN_USERNAME}:${NATS_ADMIN_PASSWORD}@nats:4222
METIS_DB_URI=postgresql+psycopg://${POSTGRES_USERNAME}:${POSTGRES_PASSWORD}@pgvector:5432/metis
NATS_TLS_ENABLED=true
NATS_TLS_CA_FILE=/etc/certs/ca.crt
NATS_NAMESPACE=bklite
DB_ENGINE=postgresql
DB_NAME=bklite
DB_USER=postgres
DB_HOST=postgres
DB_PASSWORD=${POSTGRES_PASSWORD}
DB_PORT=5432
KNOWLEDGE_GRAPH_HOST=falkordb
KNOWLEDGE_GRAPH_PASSWORD=${FALKORDB_PASSWORD}
KNOWLEDGE_GRAPH_PORT=6379
ENABLE_CELERY=true
CELERY_WORKER_CONCURRENCY=1
REDIS_CACHE_URL=redis://:${REDIS_PASSWORD}@redis:6379/1
CELERY_BROKER_URL=redis://:${REDIS_PASSWORD}@redis:6379/3
CELERY_RESULT_BACKEND=redis://:${REDIS_PASSWORD}@redis:6379/3
VICTORIAMETRICS_HOST=http://victoria-metrics:8428
TOP_GROUP=Default
DEFAULT_GROUP_NAME=Guest
MINIO_ENDPOINT=minio:9000
MINIO_USE_HTTPS=0
MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
VICTORIALOGS_HOST=http://victoria-logs:9428
MLFLOW_TRACKER_URL=http://mlflow:15000
MLFLOW_ENABLE_SYSTEM_METRICS_LOGGING=true
MLFLOW_S3_ENDPOINT_URL=http://minio:9000
AWS_ACCESS_KEY_ID=${MINIO_ROOT_USER}
AWS_SECRET_ACCESS_KEY=${MINIO_ROOT_PASSWORD}
AWS_DEFAULT_REGION=us-east-1
FALKORDB_DATABASE=cmdb_graph
FALKORDB_REQUIREPASS=${FALKORDB_PASSWORD}
FALKORDB_HOST=falkordb
FALKORDB_PORT=6379
OPENAI_API_KEY=
OPENAI_API_BASE=

NEXTAUTH_URL=https://${domain}
NEXTAPI_URL=http://127.0.0.1:8001
EOF
    log "SUCCESS" ".env 文件生成完成"
}

create_jetstream() {
    local domain="$1"
    local base_dir="$2"
    
    log "INFO" "创建 JetStream..."
    
    local network_name="${domain}_dev"
    
    docker run --rm --network="${network_name}" \
        -v "${base_dir}/conf/certs:/etc/certs:ro" \
        $DOCKER_IMAGE_NATS_CLI nats -s tls://nats:4222 \
        --tlsca /etc/certs/ca.crt \
        --user $NATS_ADMIN_USERNAME --password $NATS_ADMIN_PASSWORD \
        stream add metrics --subjects=metrics.* --storage=file \
        --replicas=1 --retention=limits --discard=old \
        --max-age=20m --max-bytes=104857600 --max-consumers=-1 \
        --max-msg-size=-1 --max-msgs=-1 --max-msgs-per-subject=1000000 \
        --dupe-window=5m --no-allow-rollup --no-deny-delete --no-deny-purge 2>/dev/null || true
    
    log "SUCCESS" "JetStream 创建完成"
}

cmd_start() {
    local domain="$1"
    local base_dir="/opt/bk-lite/dev/${domain}"
    local script_dir="$(cd "$(dirname "$0")" && pwd)"
    
    log "INFO" "启动 dev 环境: ${domain}"
    log "INFO" "工作目录: ${base_dir}"
    
    mkdir -p "${base_dir}"
    
    if [ ! -f "${base_dir}/docker-compose.yaml" ]; then
        cp "${script_dir}/docker-compose.yaml" "${base_dir}/"
    fi
    
    copy_conf_files "${base_dir}" "${script_dir}"
    generate_common_env "${base_dir}" "${domain}"
    init_docker_images
    generate_tls_certs "${base_dir}"
    generate_nats_conf "${base_dir}" "${NATS_ADMIN_USERNAME}" "${NATS_ADMIN_PASSWORD}" \
        "${NATS_MONITOR_USERNAME}" "${NATS_MONITOR_PASSWORD}" "${domain}"
    generate_env_file "${base_dir}" "${domain}"
    
    cd "${base_dir}"
    
    log "INFO" "拉取镜像..."
    ${DOCKER_COMPOSE_CMD} pull || true
    
    log "INFO" "启动服务..."
    ${DOCKER_COMPOSE_CMD} up -d
    
    sleep 5
    create_jetstream "${domain}" "${base_dir}"
    
    log "SUCCESS" "dev 环境 ${domain} 启动成功"
    log "INFO" "工作目录: ${base_dir}"
    log "INFO" "查看状态: $0 status --domain ${domain}"
    echo ""
    echo "========================================"
    echo -e "${GREEN}Cloud-IDE 访问信息:${NC}"
    echo "========================================"
    echo -e "  Domain: ${BLUE}${domain}${NC}"
    echo -e "  Web Port: ${BLUE}${WEB_PORT}${NC}"
    echo -e "  Code Port: ${BLUE}${CODE_PORT}${NC}"
    echo -e "  Code-Server 密码: ${YELLOW}${CODESERVER_PASSWORD}${NC}"
    echo -e "  OpenCode 密码: ${YELLOW}${OPENCODE_PASSWORD}${NC}"
    echo "========================================"
}

cmd_ls() {
    local dev_root="/opt/bk-lite/dev"
    
    if [ ! -d "${dev_root}" ] || [ -z "$(ls -A ${dev_root} 2>/dev/null)" ]; then
        log "INFO" "暂无 dev 环境实例"
        return
    fi
    
    printf "\n%-20s %-12s %-12s %-10s %-20s %-20s\n" "DOMAIN" "WEB_PORT" "CODE_PORT" "STATUS" "CODESERVER_PWD" "OPENCODE_PWD"
    printf "%-20s %-12s %-12s %-10s %-20s %-20s\n" "------" "--------" "---------" "------" "--------------" "------------"
    
    for ns_dir in "${dev_root}"/*/; do
        [ -d "$ns_dir" ] || continue
        local ns=$(basename "$ns_dir")
        local env_file="${ns_dir}.env"
        local common_env_file="${ns_dir}common.env"
        local web_port="-"
        local code_port="-"
        local status="stopped"
        local codeserver_pwd="-"
        local opencode_pwd="-"
        
        if [ -f "$env_file" ]; then
            web_port=$(grep "^PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "-")
            code_port=$(grep "^CODE_PORT=" "$env_file" 2>/dev/null | cut -d'=' -f2 || echo "-")
        fi
        
        if [ -f "$common_env_file" ]; then
            codeserver_pwd=$(grep "^export CODESERVER_PASSWORD=" "$common_env_file" 2>/dev/null | cut -d'=' -f2 || echo "-")
            opencode_pwd=$(grep "^export OPENCODE_PASSWORD=" "$common_env_file" 2>/dev/null | cut -d'=' -f2 || echo "-")
        fi
        
        if ${DOCKER_COMPOSE_CMD} -f "${ns_dir}docker-compose.yaml" ps --status running 2>/dev/null | grep -q .; then
            status="running"
        fi
        
        printf "%-20s %-12s %-12s %-10s %-20s %-20s\n" "$ns" "${web_port:-"-"}" "${code_port:-"-"}" "$status" "${codeserver_pwd:-"-"}" "${opencode_pwd:-"-"}"
    done
    echo ""
}

cmd_stop() {
    local domain="$1"
    local base_dir="/opt/bk-lite/dev/${domain}"
    
    if [ ! -d "${base_dir}" ]; then
        log "ERROR" "dev 环境 ${domain} 不存在"
        exit 1
    fi
    
    log "INFO" "停止 dev 环境: ${domain}"
    cd "${base_dir}"
    ${DOCKER_COMPOSE_CMD} stop
    log "SUCCESS" "dev 环境 ${domain} 已停止"
}

cmd_destroy() {
    local domain="$1"
    local base_dir="/opt/bk-lite/dev/${domain}"
    
    if [ ! -d "${base_dir}" ]; then
        log "ERROR" "dev 环境 ${domain} 不存在"
        exit 1
    fi
    
    log "WARNING" "即将销毁 dev 环境: ${domain}"
    read -p "确认销毁? (y/N) " confirm < /dev/tty
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        log "INFO" "取消操作"
        exit 0
    fi
    
    cd "${base_dir}"
    ${DOCKER_COMPOSE_CMD} down -v
    cd /
    rm -rf "${base_dir}"
    log "SUCCESS" "dev 环境 ${domain} 已销毁"
}

cmd_status() {
    local domain="$1"
    local base_dir="/opt/bk-lite/dev/${domain}"
    
    if [ ! -d "${base_dir}" ]; then
        log "ERROR" "dev 环境 ${domain} 不存在"
        exit 1
    fi
    
    log "INFO" "dev 环境 ${domain} 状态:"
    cd "${base_dir}"
    ${DOCKER_COMPOSE_CMD} ps
}

main() {
    check_docker_version
    check_docker_compose_version
    
    if [ $# -lt 1 ]; then
        show_usage
        exit 1
    fi
    
    local cmd="$1"
    shift
    
    local domain=""
    local web_port=""
    local code_port=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --domain)
                domain="$2"
                shift 2
                ;;
            --mirror)
                export MIRROR="$2"
                shift 2
                ;;
            --web-port)
                web_port="$2"
                shift 2
                ;;
            --code-port)
                code_port="$2"
                shift 2
                ;;
            *)
                log "ERROR" "未知参数: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    if [ "$cmd" = "ls" ]; then
        cmd_ls
        exit 0
    fi
    
    if [ -z "$domain" ]; then
        log "ERROR" "必须指定 --domain 参数"
        show_usage
        exit 1
    fi
    
    case "$cmd" in
        start)
            if [ -z "$web_port" ]; then
                read -p "请输入 Web 服务端口 (默认: 3000): " web_port < /dev/tty
                web_port=${web_port:-3000}
            fi
            if [ -z "$code_port" ]; then
                read -p "请输入 Code-Server 端口 (默认: 8080): " code_port < /dev/tty
                code_port=${code_port:-8080}
            fi
            export WEB_PORT="$web_port"
            export CODE_PORT="$code_port"
            cmd_start "$domain"
            ;;
        stop)
            cmd_stop "$domain"
            ;;
        destroy)
            cmd_destroy "$domain"
            ;;
        status)
            cmd_status "$domain"
            ;;
        *)
            log "ERROR" "未知命令: $cmd"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
