#!/usr/bin/env bash
set -euo pipefail
# ANSI escape codes for colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

export INSTALL_PATH="/opt/bk-lite"

# Function to log messages with colored output
log() {
    local level="$1"
    local message="$2"
    local color=""

    case "$level" in
        "INFO")
            color="$BLUE"
            ;;
        "WARNING")
            color="$YELLOW"
            ;;
        "ERROR")
            color="$RED"
            ;;
        "SUCCESS")
            color="$GREEN"
            ;;
        *)
            color="$NC"
            ;;
    esac

    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message${NC}"
}

if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
    log "INFO" "检测到 docker-compose 命令，使用 docker-compose 进行卸载"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
    log "INFO" "检测到 docker compose 命令，使用 docker compose 进行卸载"
else
    log "ERROR" "未找到 docker-compose 或 docker compose 命令，请安装 docker-compose或将docker升级到最新版本"
    exit 1
fi

uninstall(){
    log "INFO" "开始卸载应用..."
    # 停止并删除容器
    cd $INSTALL_PATH
    $DOCKER_COMPOSE_CMD down --volumes
    log "INFO" "开始删除安装目录..."
    rm -rvf $INSTALL_PATH
    log "SUCCESS" "应用已成功卸载"
}

main(){
    log "INFO" "默认应用安装目录: $INSTALL_PATH"
    read -p $'\033[0;31m确认卸载bk-lite?此操作不可逆(yes/n): \033[0m' confirm < /dev/tty
    if [[ "$confirm" == "yes" ]]; then
        uninstall
    else
        log "INFO" "取消卸载操作"
    fi
}

main