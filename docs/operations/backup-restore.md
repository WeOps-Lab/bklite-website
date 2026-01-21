---
sidebar_position: 3
---

# 备份与还原

本章节介绍 BK-Lite 关键组件的备份与还原操作，帮助运维人员制定数据保护策略。

## 备份优先级

根据数据重要性，建议按以下优先级进行备份：

| 优先级 | 组件 | 数据类型 | 备份频率建议 |
|--------|------|----------|-------------|
| **P0** | PostgreSQL | 业务核心数据 | 每日全量 + 实时归档 |
| **P0** | PGVector (metis) | AI 向量数据 | 每日全量 |
| **P1** | FalkorDB | CMDB 图数据 | 每日全量 |
| **P2** | MinIO | 文件/模型制品 | 每周全量 + 每日增量 |
| **P2** | VictoriaMetrics | 监控指标 | 按需（可重采集） |
| **P2** | VictoriaLogs | 日志数据 | 按需（可重采集） |
| **P3** | Redis | 缓存数据 | 可选（重启可恢复） |

---

## 前置准备

### 部署目录说明

BK-Lite 默认部署在 `/opt/bk-lite` 目录，所有 `docker compose` 命令都需要在此目录下执行：

```bash
# 进入部署目录
cd /opt/bk-lite

# 查看当前运行的服务
docker compose ps

# 加载环境变量（用于脚本中获取密码等配置）
source .env
```

:::tip 提示
以下所有命令均假设在 `/opt/bk-lite` 目录下执行。如果您使用自定义部署目录，请相应调整路径。
:::

### 创建备份目录

```bash
# 创建备份根目录
mkdir -p /data/backup/bklite/{postgres,pgvector,falkordb,victorialogs,minio}

# 设置权限
chmod 750 /data/backup/bklite
```

---

## PostgreSQL 备份与还原

PostgreSQL 存储系统核心业务数据，是**最重要**的备份对象。

### 数据库说明

| 数据库名 | 用途 | 备份必要性 |
|----------|------|-----------|
| `bklite` | 主业务数据（用户、配置、CMDB 等） | **必须** |
| `mlflow` | MLflow 实验追踪数据 | 建议 |

### 全量备份

```bash
# 备份所有数据库
docker compose exec -T postgres pg_dumpall -U postgres > /data/backup/bklite/postgres/full_$(date +%Y%m%d_%H%M%S).sql

# 或分库备份（推荐）
docker compose exec -T postgres pg_dump -U postgres -d bklite > /data/backup/bklite/postgres/bklite_$(date +%Y%m%d_%H%M%S).sql
docker compose exec -T postgres pg_dump -U postgres -d mlflow > /data/backup/bklite/postgres/mlflow_$(date +%Y%m%d_%H%M%S).sql
```

### 压缩备份（推荐生产使用）

```bash
# 使用自定义格式备份（支持并行还原）
docker compose exec -T postgres pg_dump -U postgres -Fc -d bklite > /data/backup/bklite/postgres/bklite_$(date +%Y%m%d_%H%M%S).dump
docker compose exec -T postgres pg_dump -U postgres -Fc -d mlflow > /data/backup/bklite/postgres/mlflow_$(date +%Y%m%d_%H%M%S).dump
```

### 还原数据库

:::danger 警告
还原操作将覆盖现有数据，请务必确认目标环境正确！
:::

```bash
# 从 SQL 文件还原
docker compose exec -T postgres psql -U postgres -d bklite < /data/backup/bklite/postgres/bklite_20240101_120000.sql

# 从 dump 文件还原（需要先创建空数据库）
cat /data/backup/bklite/postgres/bklite_20240101_120000.dump | docker compose exec -T postgres pg_restore -U postgres -d bklite -c
```

### 自动备份脚本

创建定时备份脚本 `/opt/bk-lite/scripts/backup_postgres.sh`：

```bash
#!/bin/bash
set -e

BACKUP_DIR="/data/backup/bklite/postgres"
KEEP_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BKLITE_DIR="/opt/bk-lite"

cd "${BKLITE_DIR}"

# 创建备份
echo "[$(date)] Starting PostgreSQL backup..."
docker compose exec -T postgres pg_dump -U postgres -Fc -d bklite > "${BACKUP_DIR}/bklite_${DATE}.dump"
docker compose exec -T postgres pg_dump -U postgres -Fc -d mlflow > "${BACKUP_DIR}/mlflow_${DATE}.dump"

# 清理过期备份
find "${BACKUP_DIR}" -name "*.dump" -mtime +${KEEP_DAYS} -delete
echo "[$(date)] PostgreSQL backup completed."
```

添加 crontab：

```bash
# 每天凌晨 2 点执行备份
0 2 * * * /opt/bk-lite/scripts/backup_postgres.sh >> /var/log/bklite_backup.log 2>&1
```

---

## PGVector 备份与还原

PGVector 作为 PostgreSQL 扩展运行，其数据存储在 `metis` 数据库中。

### 备份向量数据

```bash
cd /opt/bk-lite

# PGVector 运行在独立容器中，通过 postgres 容器连接
# 备份 metis 数据库（包含向量表）
docker compose exec -T postgres pg_dump -U postgres -Fc -d metis > /data/backup/bklite/pgvector/metis_$(date +%Y%m%d_%H%M%S).dump
```

### 还原向量数据

```bash
cd /opt/bk-lite

# 还原前确保 pgvector 扩展已安装
docker compose exec -T postgres psql -U postgres -d metis -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 还原数据
cat /data/backup/bklite/pgvector/metis_20240101_120000.dump | docker compose exec -T postgres pg_restore -U postgres -d metis -c
```

:::tip 提示
如果是新环境还原，需要先创建 `metis` 数据库：
```bash
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE metis;"
```
:::

---

## FalkorDB 备份与还原

FalkorDB 基于 Redis 协议，存储 CMDB 资产关系图谱。

:::info 说明
FalkorDB 在 Docker Compose 中映射端口为 `6479:6379`，即宿主机使用 6479 端口。
:::

### 备份方法

FalkorDB 支持两种备份方式：

#### 方式一：RDB 快照（推荐）

```bash
cd /opt/bk-lite
source .env

# 触发 RDB 持久化
docker compose exec falkordb redis-cli -a ${FALKORDB_PASSWORD} BGSAVE

# 等待备份完成（检查最后保存时间）
docker compose exec falkordb redis-cli -a ${FALKORDB_PASSWORD} LASTSAVE

# 复制 RDB 文件
docker compose cp falkordb:/var/lib/falkordb/data/dump.rdb /data/backup/bklite/falkordb/dump_$(date +%Y%m%d_%H%M%S).rdb
```

#### 方式二：数据卷备份

```bash
cd /opt/bk-lite

# 停止服务（可选，确保数据一致性）
docker compose stop falkordb

# 获取卷名称
VOLUME_NAME=$(docker volume ls --filter name=falkordb -q | head -1)

# 备份数据卷
docker run --rm -v ${VOLUME_NAME}:/source -v /data/backup/bklite/falkordb:/backup alpine \
  tar czf /backup/falkordb_volume_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .

# 重启服务
docker compose start falkordb
```

### 还原方法

#### 从 RDB 文件还原

```bash
cd /opt/bk-lite

# 停止 FalkorDB
docker compose stop falkordb

# 复制 RDB 文件到数据卷
docker compose cp /data/backup/bklite/falkordb/dump_20240101_120000.rdb falkordb:/var/lib/falkordb/data/dump.rdb

# 启动 FalkorDB（自动加载 RDB）
docker compose start falkordb
```

#### 从数据卷备份还原

```bash
cd /opt/bk-lite

# 停止服务
docker compose stop falkordb

# 获取卷名称
VOLUME_NAME=$(docker volume ls --filter name=falkordb -q | head -1)

# 清空并还原数据卷
docker run --rm -v ${VOLUME_NAME}:/target -v /data/backup/bklite/falkordb:/backup alpine \
  sh -c "rm -rf /target/* && tar xzf /backup/falkordb_volume_20240101_120000.tar.gz -C /target"

# 启动服务
docker compose start falkordb
```

---

## VictoriaLogs 备份与还原

VictoriaLogs 存储日志数据，端口 `9428`。日志数据通常可重新采集，但保留历史日志可能对审计和分析有价值。

:::info 说明
VictoriaLogs 数据存储在 `victoria-logs` 数据卷的 `/vlogs` 目录。
:::

### 备份方法

#### 方式一：在线快照（推荐）

VictoriaLogs 支持在线快照，无需停机：

```bash
cd /opt/bk-lite

# 创建快照
docker compose exec victoria-logs wget -qO- 'http://localhost:9428/snapshot/create'

# 查看快照列表
docker compose exec victoria-logs ls -la /vlogs/snapshots/

# 复制快照目录
SNAPSHOT_NAME=$(docker compose exec victoria-logs ls /vlogs/snapshots/ | tail -1 | tr -d '\r')
docker compose cp victoria-logs:/vlogs/snapshots/${SNAPSHOT_NAME} /data/backup/bklite/victorialogs/snapshot_$(date +%Y%m%d_%H%M%S)
```

#### 方式二：数据卷备份

```bash
cd /opt/bk-lite

# 停止服务（确保数据一致性）
docker compose stop victoria-logs

# 获取卷名称
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# 备份数据卷
docker run --rm -v ${VOLUME_NAME}:/source -v /data/backup/bklite/victorialogs:/backup alpine \
  tar czf /backup/victorialogs_volume_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .

# 重启服务
docker compose start victoria-logs
```

### 还原方法

#### 从快照还原

```bash
cd /opt/bk-lite

# 停止服务
docker compose stop victoria-logs

# 获取卷名称
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# 清空数据目录并还原快照
docker run --rm -v ${VOLUME_NAME}:/vlogs -v /data/backup/bklite/victorialogs:/backup alpine \
  sh -c "rm -rf /vlogs/* && cp -r /backup/snapshot_20240101_120000/* /vlogs/"

# 启动服务
docker compose start victoria-logs
```

#### 从数据卷备份还原

```bash
cd /opt/bk-lite

# 停止服务
docker compose stop victoria-logs

# 获取卷名称
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# 清空并还原数据卷
docker run --rm -v ${VOLUME_NAME}:/target -v /data/backup/bklite/victorialogs:/backup alpine \
  sh -c "rm -rf /target/* && tar xzf /backup/victorialogs_volume_20240101_120000.tar.gz -C /target"

# 启动服务
docker compose start victoria-logs
```

---

## 完整备份脚本

创建一站式备份脚本 `/opt/bk-lite/scripts/backup_all.sh`：

```bash
#!/bin/bash
set -e

# 配置
BACKUP_ROOT="/data/backup/bklite"
BKLITE_DIR="/opt/bk-lite"
KEEP_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/bklite_backup.log"

# 进入部署目录并加载环境变量
cd "${BKLITE_DIR}"
source .env

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

log "========== 开始备份 =========="

# 确保备份目录存在
mkdir -p "${BACKUP_ROOT}"/{postgres,pgvector,falkordb,victorialogs}

# 1. PostgreSQL
log "备份 PostgreSQL..."
docker compose exec -T postgres pg_dump -U postgres -Fc -d bklite > "${BACKUP_ROOT}/postgres/bklite_${DATE}.dump"
docker compose exec -T postgres pg_dump -U postgres -Fc -d mlflow > "${BACKUP_ROOT}/postgres/mlflow_${DATE}.dump"
log "PostgreSQL 备份完成"

# 2. PGVector (metis)
log "备份 PGVector..."
docker compose exec -T postgres pg_dump -U postgres -Fc -d metis > "${BACKUP_ROOT}/pgvector/metis_${DATE}.dump"
log "PGVector 备份完成"

# 3. FalkorDB
log "备份 FalkorDB..."
docker compose exec falkordb redis-cli -a ${FALKORDB_PASSWORD} BGSAVE 2>/dev/null || true
sleep 5  # 等待 BGSAVE 完成
docker compose cp falkordb:/var/lib/falkordb/data/dump.rdb "${BACKUP_ROOT}/falkordb/dump_${DATE}.rdb"
log "FalkorDB 备份完成"

# 4. VictoriaLogs（可选）
log "备份 VictoriaLogs..."
docker compose exec victoria-logs wget -qO- 'http://localhost:9428/snapshot/create' || true
sleep 2
SNAPSHOT_NAME=$(docker compose exec victoria-logs ls /vlogs/snapshots/ 2>/dev/null | tail -1 | tr -d '\r')
if [ -n "${SNAPSHOT_NAME}" ]; then
    docker compose cp victoria-logs:/vlogs/snapshots/${SNAPSHOT_NAME} "${BACKUP_ROOT}/victorialogs/snapshot_${DATE}"
    log "VictoriaLogs 备份完成"
else
    log "VictoriaLogs 备份跳过（无快照）"
fi

# 5. 清理过期备份
log "清理 ${KEEP_DAYS} 天前的备份..."
find "${BACKUP_ROOT}" -type f \( -name "*.dump" -o -name "*.rdb" -o -name "*.tar.gz" \) -mtime +${KEEP_DAYS} -delete
find "${BACKUP_ROOT}" -type d -name "snapshot_*" -mtime +${KEEP_DAYS} -exec rm -rf {} + 2>/dev/null || true

log "========== 备份完成 =========="

# 输出备份文件列表
log "本次备份文件："
find "${BACKUP_ROOT}" -type f -mmin -10 -exec ls -lh {} \;
```

### 定时任务配置

```bash
# 添加执行权限
chmod +x /opt/bk-lite/scripts/backup_all.sh

# 配置 crontab
crontab -e

# 添加以下内容（每天凌晨 2 点执行）
0 2 * * * /opt/bk-lite/scripts/backup_all.sh
```

---

## 灾难恢复流程

当需要在新环境恢复整个系统时，按以下顺序操作：

### 1. 部署基础环境

```bash
# 安装 BK-Lite（不初始化数据）
curl -sSL https://bklite.ai/install.run | bash -
```

### 2. 停止服务

```bash
cd /opt/bk-lite
docker compose stop server web
```

### 3. 还原数据库

```bash
cd /opt/bk-lite

# 还原 PostgreSQL
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS bklite;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE bklite;"
cat /path/to/bklite_backup.dump | docker compose exec -T postgres pg_restore -U postgres -d bklite

# 还原 MLflow 数据库
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS mlflow;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE mlflow;"
cat /path/to/mlflow_backup.dump | docker compose exec -T postgres pg_restore -U postgres -d mlflow

# 还原 PGVector (metis)
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS metis;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE metis;"
docker compose exec -T postgres psql -U postgres -d metis -c "CREATE EXTENSION IF NOT EXISTS vector;"
cat /path/to/metis_backup.dump | docker compose exec -T postgres pg_restore -U postgres -d metis
```

### 4. 还原 FalkorDB

```bash
cd /opt/bk-lite

docker compose stop falkordb
docker compose cp /path/to/dump_backup.rdb falkordb:/var/lib/falkordb/data/dump.rdb
docker compose start falkordb
```

### 5. 还原 VictoriaLogs（可选）

```bash
cd /opt/bk-lite

docker compose stop victoria-logs

# 获取卷名称
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# 还原快照
docker run --rm -v ${VOLUME_NAME}:/vlogs -v /path/to/backup:/backup alpine \
  sh -c "rm -rf /vlogs/* && cp -r /backup/snapshot_YYYYMMDD/* /vlogs/"

docker compose start victoria-logs
```

### 6. 启动服务

```bash
cd /opt/bk-lite

docker compose start server web

# 检查服务状态
docker compose ps
```

### 7. 验证恢复

- 登录 Web 界面验证用户数据
- 检查 CMDB 资产数据
- 验证知识库搜索功能
- 确认监控告警正常

---

## 常见问题

### Q: 备份文件太大怎么办？

A: 可以使用压缩和分卷：

```bash
# 压缩备份
gzip /data/backup/bklite/postgres/bklite_20240101.sql

# 分卷压缩（每卷 1GB）
split -b 1G /data/backup/bklite/postgres/bklite.dump bklite.dump.part_
```

### Q: 如何验证备份文件完整性？

A: 使用 checksum 验证：

```bash
# 生成校验和
sha256sum /data/backup/bklite/postgres/bklite_20240101.dump > /data/backup/bklite/postgres/bklite_20240101.dump.sha256

# 验证校验和
sha256sum -c /data/backup/bklite/postgres/bklite_20240101.dump.sha256
```

### Q: 能否在线备份？

A: PostgreSQL、FalkorDB 和 VictoriaLogs 都支持在线备份，不需要停止服务。但为了数据一致性，建议在业务低峰期执行。

### Q: 如何备份到远程存储？

A: 可以结合 rsync 或 rclone：

```bash
# 使用 rsync 同步到远程服务器
rsync -avz /data/backup/bklite/ user@backup-server:/backup/bklite/

# 使用 rclone 同步到 S3
rclone sync /data/backup/bklite/ s3:my-bucket/bklite-backup/
```

---

## 下一步

- [组件概览](./components.md) - 了解各组件详情
