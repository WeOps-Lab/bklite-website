---
sidebar_position: 3
---

# Backup and Restore

This section covers backup and restore operations for BK-Lite's critical components, helping operations engineers develop a data protection strategy.

## Backup Priority

Based on data importance, the following backup priority is recommended:

| Priority | Component | Data Type | Recommended Frequency |
|----------|-----------|-----------|----------------------|
| **P0** | PostgreSQL | Core business data | Daily full + real-time archiving |
| **P0** | PGVector (metis) | AI vector data | Daily full |
| **P1** | FalkorDB | CMDB graph data | Daily full |
| **P2** | MinIO | Files/model artifacts | Weekly full + daily incremental |
| **P2** | VictoriaMetrics | Monitoring metrics | As needed (can be re-collected) |
| **P2** | VictoriaLogs | Log data | As needed (can be re-collected) |
| **P3** | Redis | Cache data | Optional (recoverable on restart) |

---

## Prerequisites

### Deployment Directory

BK-Lite is deployed by default in the `/opt/bk-lite` directory. All `docker compose` commands must be executed from this directory:

```bash
# Navigate to the deployment directory
cd /opt/bk-lite

# Check currently running services
docker compose ps

# Load environment variables (for obtaining passwords and other config in scripts)
source .env
```

:::tip Tip
All commands below assume execution from the `/opt/bk-lite` directory. If you use a custom deployment directory, adjust the paths accordingly.
:::

### Create Backup Directory

```bash
# Create backup root directory
mkdir -p /data/backup/bklite/{postgres,pgvector,falkordb,victorialogs,minio}

# Set permissions
chmod 750 /data/backup/bklite
```

---

## PostgreSQL Backup and Restore

PostgreSQL stores the system's core business data and is the **most important** backup target.

### Database Details

| Database | Purpose | Backup Necessity |
|----------|---------|-----------------|
| `bklite` | Main business data (users, configurations, CMDB, etc.) | **Required** |
| `mlflow` | MLflow experiment tracking data | Recommended |

### Full Backup

```bash
# Backup all databases
docker compose exec -T postgres pg_dumpall -U postgres > /data/backup/bklite/postgres/full_$(date +%Y%m%d_%H%M%S).sql

# Or backup individual databases (recommended)
docker compose exec -T postgres pg_dump -U postgres -d bklite > /data/backup/bklite/postgres/bklite_$(date +%Y%m%d_%H%M%S).sql
docker compose exec -T postgres pg_dump -U postgres -d mlflow > /data/backup/bklite/postgres/mlflow_$(date +%Y%m%d_%H%M%S).sql
```

### Compressed Backup (Recommended for Production)

```bash
# Backup in custom format (supports parallel restore)
docker compose exec -T postgres pg_dump -U postgres -Fc -d bklite > /data/backup/bklite/postgres/bklite_$(date +%Y%m%d_%H%M%S).dump
docker compose exec -T postgres pg_dump -U postgres -Fc -d mlflow > /data/backup/bklite/postgres/mlflow_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Database

:::danger Warning
The restore operation will overwrite existing data. Make sure the target environment is correct!
:::

```bash
# Restore from SQL file
docker compose exec -T postgres psql -U postgres -d bklite < /data/backup/bklite/postgres/bklite_20240101_120000.sql

# Restore from dump file (requires an empty database first)
cat /data/backup/bklite/postgres/bklite_20240101_120000.dump | docker compose exec -T postgres pg_restore -U postgres -d bklite -c
```

### Automated Backup Script

Create a scheduled backup script at `/opt/bk-lite/scripts/backup_postgres.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/data/backup/bklite/postgres"
KEEP_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BKLITE_DIR="/opt/bk-lite"

cd "${BKLITE_DIR}"

# Create backup
echo "[$(date)] Starting PostgreSQL backup..."
docker compose exec -T postgres pg_dump -U postgres -Fc -d bklite > "${BACKUP_DIR}/bklite_${DATE}.dump"
docker compose exec -T postgres pg_dump -U postgres -Fc -d mlflow > "${BACKUP_DIR}/mlflow_${DATE}.dump"

# Clean up expired backups
find "${BACKUP_DIR}" -name "*.dump" -mtime +${KEEP_DAYS} -delete
echo "[$(date)] PostgreSQL backup completed."
```

Add to crontab:

```bash
# Execute backup daily at 2:00 AM
0 2 * * * /opt/bk-lite/scripts/backup_postgres.sh >> /var/log/bklite_backup.log 2>&1
```

---

## PGVector Backup and Restore

PGVector runs as a PostgreSQL extension, with its data stored in the `metis` database.

### Backup Vector Data

```bash
cd /opt/bk-lite

# PGVector runs in a separate container, connected via the postgres container
# Backup the metis database (contains vector tables)
docker compose exec -T postgres pg_dump -U postgres -Fc -d metis > /data/backup/bklite/pgvector/metis_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Vector Data

```bash
cd /opt/bk-lite

# Ensure the pgvector extension is installed before restoring
docker compose exec -T postgres psql -U postgres -d metis -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Restore data
cat /data/backup/bklite/pgvector/metis_20240101_120000.dump | docker compose exec -T postgres pg_restore -U postgres -d metis -c
```

:::tip Tip
If restoring to a new environment, you need to create the `metis` database first:
```bash
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE metis;"
```
:::

---

## FalkorDB Backup and Restore

FalkorDB is based on the Redis protocol and stores CMDB asset relationship graphs.

:::info Note
FalkorDB maps port `6479:6379` in Docker Compose, meaning the host uses port 6479.
:::

### Backup Methods

FalkorDB supports two backup methods:

#### Method 1: RDB Snapshot (Recommended)

```bash
cd /opt/bk-lite
source .env

# Trigger RDB persistence
docker compose exec falkordb redis-cli -a ${FALKORDB_PASSWORD} BGSAVE

# Wait for backup to complete (check last save time)
docker compose exec falkordb redis-cli -a ${FALKORDB_PASSWORD} LASTSAVE

# Copy RDB file
docker compose cp falkordb:/var/lib/falkordb/data/dump.rdb /data/backup/bklite/falkordb/dump_$(date +%Y%m%d_%H%M%S).rdb
```

#### Method 2: Data Volume Backup

```bash
cd /opt/bk-lite

# Stop service (optional, ensures data consistency)
docker compose stop falkordb

# Get volume name
VOLUME_NAME=$(docker volume ls --filter name=falkordb -q | head -1)

# Backup data volume
docker run --rm -v ${VOLUME_NAME}:/source -v /data/backup/bklite/falkordb:/backup alpine \
  tar czf /backup/falkordb_volume_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .

# Restart service
docker compose start falkordb
```

### Restore Methods

#### Restore from RDB File

```bash
cd /opt/bk-lite

# Stop FalkorDB
docker compose stop falkordb

# Copy RDB file to data volume
docker compose cp /data/backup/bklite/falkordb/dump_20240101_120000.rdb falkordb:/var/lib/falkordb/data/dump.rdb

# Start FalkorDB (automatically loads RDB)
docker compose start falkordb
```

#### Restore from Data Volume Backup

```bash
cd /opt/bk-lite

# Stop service
docker compose stop falkordb

# Get volume name
VOLUME_NAME=$(docker volume ls --filter name=falkordb -q | head -1)

# Clear and restore data volume
docker run --rm -v ${VOLUME_NAME}:/target -v /data/backup/bklite/falkordb:/backup alpine \
  sh -c "rm -rf /target/* && tar xzf /backup/falkordb_volume_20240101_120000.tar.gz -C /target"

# Start service
docker compose start falkordb
```

---

## VictoriaLogs Backup and Restore

VictoriaLogs stores log data on port `9428`. Log data can typically be re-collected, but retaining historical logs may be valuable for auditing and analysis.

:::info Note
VictoriaLogs data is stored in the `victoria-logs` data volume under the `/vlogs` directory.
:::

### Backup Methods

#### Method 1: Online Snapshot (Recommended)

VictoriaLogs supports online snapshots with no downtime required:

```bash
cd /opt/bk-lite

# Create snapshot
docker compose exec victoria-logs wget -qO- 'http://localhost:9428/snapshot/create'

# List snapshots
docker compose exec victoria-logs ls -la /vlogs/snapshots/

# Copy snapshot directory
SNAPSHOT_NAME=$(docker compose exec victoria-logs ls /vlogs/snapshots/ | tail -1 | tr -d '\r')
docker compose cp victoria-logs:/vlogs/snapshots/${SNAPSHOT_NAME} /data/backup/bklite/victorialogs/snapshot_$(date +%Y%m%d_%H%M%S)
```

#### Method 2: Data Volume Backup

```bash
cd /opt/bk-lite

# Stop service (ensures data consistency)
docker compose stop victoria-logs

# Get volume name
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# Backup data volume
docker run --rm -v ${VOLUME_NAME}:/source -v /data/backup/bklite/victorialogs:/backup alpine \
  tar czf /backup/victorialogs_volume_$(date +%Y%m%d_%H%M%S).tar.gz -C /source .

# Restart service
docker compose start victoria-logs
```

### Restore Methods

#### Restore from Snapshot

```bash
cd /opt/bk-lite

# Stop service
docker compose stop victoria-logs

# Get volume name
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# Clear data directory and restore snapshot
docker run --rm -v ${VOLUME_NAME}:/vlogs -v /data/backup/bklite/victorialogs:/backup alpine \
  sh -c "rm -rf /vlogs/* && cp -r /backup/snapshot_20240101_120000/* /vlogs/"

# Start service
docker compose start victoria-logs
```

#### Restore from Data Volume Backup

```bash
cd /opt/bk-lite

# Stop service
docker compose stop victoria-logs

# Get volume name
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# Clear and restore data volume
docker run --rm -v ${VOLUME_NAME}:/target -v /data/backup/bklite/victorialogs:/backup alpine \
  sh -c "rm -rf /target/* && tar xzf /backup/victorialogs_volume_20240101_120000.tar.gz -C /target"

# Start service
docker compose start victoria-logs
```

---

## Complete Backup Script

Create an all-in-one backup script at `/opt/bk-lite/scripts/backup_all.sh`:

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_ROOT="/data/backup/bklite"
BKLITE_DIR="/opt/bk-lite"
KEEP_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/bklite_backup.log"

# Navigate to deployment directory and load environment variables
cd "${BKLITE_DIR}"
source .env

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

log "========== Starting Backup =========="

# Ensure backup directories exist
mkdir -p "${BACKUP_ROOT}"/{postgres,pgvector,falkordb,victorialogs}

# 1. PostgreSQL
log "Backing up PostgreSQL..."
docker compose exec -T postgres pg_dump -U postgres -Fc -d bklite > "${BACKUP_ROOT}/postgres/bklite_${DATE}.dump"
docker compose exec -T postgres pg_dump -U postgres -Fc -d mlflow > "${BACKUP_ROOT}/postgres/mlflow_${DATE}.dump"
log "PostgreSQL backup completed"

# 2. PGVector (metis)
log "Backing up PGVector..."
docker compose exec -T postgres pg_dump -U postgres -Fc -d metis > "${BACKUP_ROOT}/pgvector/metis_${DATE}.dump"
log "PGVector backup completed"

# 3. FalkorDB
log "Backing up FalkorDB..."
docker compose exec falkordb redis-cli -a ${FALKORDB_PASSWORD} BGSAVE 2>/dev/null || true
sleep 5  # Wait for BGSAVE to complete
docker compose cp falkordb:/var/lib/falkordb/data/dump.rdb "${BACKUP_ROOT}/falkordb/dump_${DATE}.rdb"
log "FalkorDB backup completed"

# 4. VictoriaLogs (optional)
log "Backing up VictoriaLogs..."
docker compose exec victoria-logs wget -qO- 'http://localhost:9428/snapshot/create' || true
sleep 2
SNAPSHOT_NAME=$(docker compose exec victoria-logs ls /vlogs/snapshots/ 2>/dev/null | tail -1 | tr -d '\r')
if [ -n "${SNAPSHOT_NAME}" ]; then
    docker compose cp victoria-logs:/vlogs/snapshots/${SNAPSHOT_NAME} "${BACKUP_ROOT}/victorialogs/snapshot_${DATE}"
    log "VictoriaLogs backup completed"
else
    log "VictoriaLogs backup skipped (no snapshot)"
fi

# 5. Clean up expired backups
log "Cleaning up backups older than ${KEEP_DAYS} days..."
find "${BACKUP_ROOT}" -type f \( -name "*.dump" -o -name "*.rdb" -o -name "*.tar.gz" \) -mtime +${KEEP_DAYS} -delete
find "${BACKUP_ROOT}" -type d -name "snapshot_*" -mtime +${KEEP_DAYS} -exec rm -rf {} + 2>/dev/null || true

log "========== Backup Completed =========="

# List backup files
log "Backup files from this run:"
find "${BACKUP_ROOT}" -type f -mmin -10 -exec ls -lh {} \;
```

### Scheduled Task Configuration

```bash
# Add execute permission
chmod +x /opt/bk-lite/scripts/backup_all.sh

# Configure crontab
crontab -e

# Add the following (execute daily at 2:00 AM)
0 2 * * * /opt/bk-lite/scripts/backup_all.sh
```

---

## Disaster Recovery Procedure

When you need to restore the entire system in a new environment, follow these steps in order:

### 1. Deploy Base Environment

```bash
# Install BK-Lite (without data initialization)
curl -sSL https://bklite.ai/install.run | bash -
```

### 2. Stop Services

```bash
cd /opt/bk-lite
docker compose stop server web
```

### 3. Restore Databases

```bash
cd /opt/bk-lite

# Restore PostgreSQL
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS bklite;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE bklite;"
cat /path/to/bklite_backup.dump | docker compose exec -T postgres pg_restore -U postgres -d bklite

# Restore MLflow database
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS mlflow;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE mlflow;"
cat /path/to/mlflow_backup.dump | docker compose exec -T postgres pg_restore -U postgres -d mlflow

# Restore PGVector (metis)
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS metis;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE metis;"
docker compose exec -T postgres psql -U postgres -d metis -c "CREATE EXTENSION IF NOT EXISTS vector;"
cat /path/to/metis_backup.dump | docker compose exec -T postgres pg_restore -U postgres -d metis
```

### 4. Restore FalkorDB

```bash
cd /opt/bk-lite

docker compose stop falkordb
docker compose cp /path/to/dump_backup.rdb falkordb:/var/lib/falkordb/data/dump.rdb
docker compose start falkordb
```

### 5. Restore VictoriaLogs (Optional)

```bash
cd /opt/bk-lite

docker compose stop victoria-logs

# Get volume name
VOLUME_NAME=$(docker volume ls --filter name=victoria-logs -q | head -1)

# Restore snapshot
docker run --rm -v ${VOLUME_NAME}:/vlogs -v /path/to/backup:/backup alpine \
  sh -c "rm -rf /vlogs/* && cp -r /backup/snapshot_YYYYMMDD/* /vlogs/"

docker compose start victoria-logs
```

### 6. Start Services

```bash
cd /opt/bk-lite

docker compose start server web

# Check service status
docker compose ps
```

### 7. Verify Recovery

- Log in to the Web interface to verify user data
- Check CMDB asset data
- Verify knowledge base search functionality
- Confirm monitoring alerts are working properly

---

## FAQ

### Q: What if backup files are too large?

A: You can use compression and splitting:

```bash
# Compress backup
gzip /data/backup/bklite/postgres/bklite_20240101.sql

# Split and compress (1GB per volume)
split -b 1G /data/backup/bklite/postgres/bklite.dump bklite.dump.part_
```

### Q: How to verify backup file integrity?

A: Use checksum verification:

```bash
# Generate checksum
sha256sum /data/backup/bklite/postgres/bklite_20240101.dump > /data/backup/bklite/postgres/bklite_20240101.dump.sha256

# Verify checksum
sha256sum -c /data/backup/bklite/postgres/bklite_20240101.dump.sha256
```

### Q: Can backups be performed online?

A: PostgreSQL, FalkorDB, and VictoriaLogs all support online backups without stopping services. However, for data consistency, it is recommended to perform backups during off-peak hours.

### Q: How to back up to remote storage?

A: You can use rsync or rclone:

```bash
# Sync to remote server using rsync
rsync -avz /data/backup/bklite/ user@backup-server:/backup/bklite/

# Sync to S3 using rclone
rclone sync /data/backup/bklite/ s3:my-bucket/bklite-backup/
```

---

## Next Steps

- [Component Overview](./components.md) - Learn more about each component
