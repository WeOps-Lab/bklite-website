---
sidebar_position: 1
---

# Operations Manual

Welcome to the BK-Lite Operations Manual. This manual provides system maintenance, troubleshooting, and best practice guides for operations engineers.

## Quick Navigation

| Section | Content | Use Case |
|---------|---------|----------|
| [Component Overview](./components.md) | System architecture, component roles, data volumes | Understanding the system landscape |
| [Backup and Restore](./backup-restore.md) | Data backup, disaster recovery | Data protection |

## Deployment Requirements

- Docker >= 20.10.23
- Docker Compose >= v2.27.0
- Memory >= 8GB (Standard) / >= 16GB (with OpsPilot)

## Common Commands

### Service Management

```bash
# Navigate to the deployment directory
cd /opt/bk-lite

# Check service status
docker compose ps

# View service logs
docker compose logs -f server
docker compose logs -f web

# Restart a single service
docker compose restart server

# Restart all services
docker compose restart
```

### Health Checks

```bash
# Check component status
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# Check database connection
docker exec postgres pg_isready -U postgres

# Check Redis connection
docker exec $(docker ps -qf "name=redis") redis-cli -a $REDIS_PASSWORD ping
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d bklite

# Connect to Redis
docker exec -it $(docker ps -qf "name=redis") redis-cli -a $REDIS_PASSWORD

# Connect to FalkorDB
docker exec -it $(docker ps -qf "name=falkordb") redis-cli -a $FALKORDB_PASSWORD
```

## Log Locations

| Component | How to View |
|-----------|-------------|
| Server Logs | `docker compose logs server` |
| Web Logs | `docker compose logs web` |
| Traefik Access Logs | `docker compose logs traefik` |
| PostgreSQL Logs | `docker compose logs postgres` |

## FAQ

### Service Fails to Start

1. Check port conflicts: `netstat -tlnp | grep -E '443|5432|6379'`
2. Check disk space: `df -h`
3. Check Docker logs: `docker compose logs <service_name>`

### Database Connection Failure

1. Verify PostgreSQL container is running: `docker compose ps postgres`
2. Check health status: `docker exec postgres pg_isready -U postgres`
3. View error logs: `docker compose logs postgres`

### Insufficient Memory

1. Check memory usage: `docker stats --no-stream`
2. Consider increasing server memory or reducing the number of services
3. If AI capabilities are not needed, remove OpsPilot-related components

## Getting Help

- [GitHub Issues](https://github.com/TencentBlueKing/bk-lite/issues)
- [DeepWiki Documentation](https://deepwiki.com/TencentBlueKing/bk-lite)
