#!/bin/bash
# PostgreSQL 角色感知 entrypoint
#
# - HA_ROLE=primary：直接 exec 官方 docker-entrypoint.sh，行为与标准镜像一致
# - HA_ROLE=standby 且 PGDATA 为空：从对端 pg_basebackup 拉取，写入 standby.signal + primary_conninfo，
#   然后以 standby 启动
# - HA_ROLE=standby 且 PGDATA 已存在：直接以 standby 启动（不再 basebackup）
#
# 切换由 ha-failover.sh 调用 pg_promote() 完成，本脚本不处理切换逻辑

set -euo pipefail

log() { echo "[ha-pg] $*"; }

: "${HA_ROLE:?HA_ROLE 未设置}"
: "${PGDATA:?PGDATA 未设置}"

if [ "$HA_ROLE" = "primary" ]; then
    log "primary 模式，沿用官方 entrypoint"
    exec docker-entrypoint.sh "$@"
fi

# ===== standby 路径 =====
: "${PEER_HOST:?PEER_HOST 未设置}"
: "${PEER_PG_PORT:=5432}"
: "${PG_REPL_USER:?PG_REPL_USER 未设置}"
: "${PG_REPL_PASSWORD:?PG_REPL_PASSWORD 未设置}"

if [ -s "$PGDATA/PG_VERSION" ]; then
    log "standby 模式，PGDATA 已存在，直接启动"
else
    log "standby 模式，PGDATA 为空，从 $PEER_HOST:$PEER_PG_PORT 执行 pg_basebackup"
    mkdir -p "$PGDATA"
    chown -R postgres:postgres "$PGDATA" 2>/dev/null || true
    chmod 0700 "$PGDATA"

    export PGPASSWORD="$PG_REPL_PASSWORD"

    # 重试 30 次（每次 10 秒），等待主节点可达
    attempt=0
    until su postgres -c "pg_isready -h '$PEER_HOST' -p '$PEER_PG_PORT' -U '$PG_REPL_USER'" >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ "$attempt" -ge 30 ]; then
            log "ERROR: 等待主节点 $PEER_HOST:$PEER_PG_PORT 可达超时（5 分钟）"
            exit 1
        fi
        log "等待主节点可达... ($attempt/30)"
        sleep 10
    done

    su postgres -c "pg_basebackup \
        -h '$PEER_HOST' -p '$PEER_PG_PORT' \
        -U '$PG_REPL_USER' \
        -D '$PGDATA' \
        -X stream -P -R --wal-method=stream"

    log "pg_basebackup 完成；standby.signal 与 primary_conninfo 已由 -R 写入"
    unset PGPASSWORD
fi

log "以 standby 启动 postgres"
exec docker-entrypoint.sh "$@"
