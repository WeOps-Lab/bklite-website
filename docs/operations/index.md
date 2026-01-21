---
sidebar_position: 1
---

# 运维手册

欢迎使用 BK-Lite 运维手册。本手册为运维人员提供系统维护、故障排查和最佳实践指南。

## 快速导航

| 章节 | 内容 | 适用场景 |
|------|------|----------|
| [组件概览](./components.md) | 系统架构、组件职能、数据卷 | 了解系统全貌 |
| [备份与还原](./backup-restore.md) | 数据备份、灾难恢复 | 数据保护 |

## 部署要求

- Docker >= 20.10.23
- Docker Compose >= v2.27.0
- 内存 >= 8GB（基础套餐）/ >= 16GB（含 OpsPilot）

## 常用命令

### 服务管理

```bash
# 进入部署目录
cd /opt/bk-lite

# 查看服务状态
docker compose ps

# 查看服务日志
docker compose logs -f server
docker compose logs -f web

# 重启单个服务
docker compose restart server

# 重启所有服务
docker compose restart
```

### 健康检查

```bash
# 检查各组件状态
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

# 检查数据库连接
docker exec postgres pg_isready -U postgres

# 检查 Redis 连接
docker exec $(docker ps -qf "name=redis") redis-cli -a $REDIS_PASSWORD ping
```

### 数据库操作

```bash
# 进入 PostgreSQL
docker exec -it postgres psql -U postgres -d bklite

# 进入 Redis
docker exec -it $(docker ps -qf "name=redis") redis-cli -a $REDIS_PASSWORD

# 进入 FalkorDB
docker exec -it $(docker ps -qf "name=falkordb") redis-cli -a $FALKORDB_PASSWORD
```

## 日志位置

| 组件 | 查看方式 |
|------|----------|
| Server 日志 | `docker compose logs server` |
| Web 日志 | `docker compose logs web` |
| Traefik 访问日志 | `docker compose logs traefik` |
| PostgreSQL 日志 | `docker compose logs postgres` |

## 常见问题

### 服务启动失败

1. 检查端口占用：`netstat -tlnp | grep -E '443|5432|6379'`
2. 检查磁盘空间：`df -h`
3. 检查 Docker 日志：`docker compose logs <service_name>`

### 数据库连接失败

1. 确认 PostgreSQL 容器运行：`docker compose ps postgres`
2. 检查健康状态：`docker exec postgres pg_isready -U postgres`
3. 查看错误日志：`docker compose logs postgres`

### 内存不足

1. 检查内存使用：`docker stats --no-stream`
2. 考虑增加服务器内存或减少服务数量
3. 如不需要 AI 能力，可移除 OpsPilot 相关组件

## 获取帮助

- [GitHub Issues](https://github.com/TencentBlueKing/bk-lite/issues)
- [DeepWiki 文档](https://deepwiki.com/TencentBlueKing/bk-lite)
