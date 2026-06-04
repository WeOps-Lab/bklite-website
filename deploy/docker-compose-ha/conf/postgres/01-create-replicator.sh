#!/bin/bash
# Postgres 初始化脚本：在主节点上创建复制角色
#
# 仅在容器首次启动且数据目录为空时被 postgres 镜像的 initdb 流程执行
# 备节点首次启动会通过 pg_basebackup 从主节点拉取数据，因此不会执行此脚本

set -e

if [ "${HA_ROLE:-primary}" != "primary" ]; then
    echo "[ha] HA_ROLE=$HA_ROLE，跳过 replicator 角色创建（仅主节点创建）"
    exit 0
fi

: "${PG_REPL_USER:?PG_REPL_USER 未设置}"
: "${PG_REPL_PASSWORD:?PG_REPL_PASSWORD 未设置}"

echo "[ha] 创建复制角色 $PG_REPL_USER ..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PG_REPL_USER}') THEN
            CREATE ROLE ${PG_REPL_USER} WITH REPLICATION LOGIN PASSWORD '${PG_REPL_PASSWORD}';
        ELSE
            ALTER ROLE ${PG_REPL_USER} WITH REPLICATION LOGIN PASSWORD '${PG_REPL_PASSWORD}';
        END IF;
    END
    \$\$;
EOSQL

echo "[ha] replicator 角色就绪"
