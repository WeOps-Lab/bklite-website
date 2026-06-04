## ADDED Requirements

### Requirement: 主备角色由单一变量驱动

部署 SHALL 通过环境变量 `HA_ROLE` 区分节点角色，取值为 `primary` 或 `standby`。所有 compose 服务的启动行为 MUST 根据此变量分支。

#### Scenario: 主节点启动
- **WHEN** 节点 `.env` 中 `HA_ROLE=primary`
- **THEN** PostgreSQL 以普通模式启动；Redis / FalkorDB 以 master 启动；NATS 以 source 模式启动；业务进程（`COMPOSE_PROFILES=active`）正常启动

#### Scenario: 备节点启动
- **WHEN** 节点 `.env` 中 `HA_ROLE=standby`
- **THEN** PostgreSQL 以 standby 模式启动；Redis / FalkorDB 以 replica 启动；NATS 以 leafnode + mirror 模式启动；业务进程不启动（profile `active` 不激活）

#### Scenario: 角色未设置时拒绝启动
- **WHEN** `HA_ROLE` 既不是 `primary` 也不是 `standby`
- **THEN** bootstrap 脚本 MUST 直接退出并报错，不允许 docker compose 启动

### Requirement: 主备共用核心配置

在 HA 部署目录（`deploy/docker-compose-ha/`）下，主备两台机器 SHALL 共用同一份 `.env`、`common.env`、`db.env`、`port.env`、TLS 证书与 CA。差异化配置 MUST 仅存在于独立的 `ha.env` 文件中。

#### Scenario: 主备两端 .env 完全相同
- **WHEN** 比对主节点与备节点上 `deploy/docker-compose-ha/.env`、`common.env`、`db.env`、`port.env`
- **THEN** 这些文件内容完全相同

#### Scenario: ha.env 包含的差异项
- **WHEN** 读取 `ha.env`
- **THEN** 文件 MUST 至少包含以下字段：`HA_ROLE`、`PEER_HOST`、`PG_REPL_USER`/`PG_REPL_PASSWORD`、`MINIO_SR_USER`/`MINIO_SR_PASSWORD`、`NATS_SERVER_NAME`、`NATS_INSTANCE_ID`

### Requirement: 入口层使用 DNS 切换

服务对外入口 SHALL 通过域名访问；运维 SHALL 在故障切换时更新 DNS A 记录指向新主节点 IP。DNS TTL MUST ≤ 60 秒。

#### Scenario: 域名指向主节点
- **WHEN** 主节点正常服务
- **THEN** 业务域名 A 记录指向主节点公网/内网 IP

#### Scenario: 切换后域名指向备节点
- **WHEN** 运维执行 failover 流程的最后一步
- **THEN** 业务域名 A 记录更新为备节点 IP，TTL 保持 ≤ 60 秒

#### Scenario: 安装文档声明前置条件
- **WHEN** 用户阅读 HA 部署文档
- **THEN** 文档 MUST 明确指出："agent 与客户端在 DNS 切换后需要重启才能保证连接到新主节点"

### Requirement: 备机业务进程冷备

备机 SHALL 通过 docker compose `profiles` 控制业务类服务平时不启动。业务类服务 MUST 包含：`server`、`web`、`webhookd`、`nats-executor`、`stargazer`、`fusion-collector`。

#### Scenario: 备机启动时业务进程不在
- **WHEN** 备机执行 `docker compose up -d`（不指定 profile）
- **THEN** 上述业务类服务容器 MUST 不被创建；DB 类服务（postgres、minio、redis、falkordb、nats、victoria-metrics、victoria-logs、mlflow、pgvector、telegraf、vector、traefik）正常运行

#### Scenario: 切换后业务进程被拉起
- **WHEN** 备机执行 `docker compose --profile active up -d`
- **THEN** 业务类服务全部启动并就绪

### Requirement: 证书 SAN 覆盖主备端点

TLS 证书 SAN SHALL 同时包含主备两端的主机名与 IP；CA SHALL 沿用现有 `Blueking Lite` CA 以避免业务端信任链断裂。

#### Scenario: 证书 SAN 内容
- **WHEN** 检查生成的 `server.crt` 的 SAN 列表
- **THEN** 列表 MUST 至少包含：`DNS:nats`、`DNS:localhost`、主节点 hostname、备节点 hostname、主节点 IP、备节点 IP

#### Scenario: CA 不变
- **WHEN** 比较新签发证书的 issuer
- **THEN** Issuer CommonName MUST 等于 `Blueking Lite`

### Requirement: HA 部署目录独立于单点部署

HA 部署形态 SHALL 存放在独立目录 `deploy/docker-compose-ha/`，与现有 `deploy/docker-compose/` 平行；HA 目录拥有自己的 `bootstrap.sh`、`docker-compose.yaml`、`compose/`、`conf/`、`bin/`、`.env`。

#### Scenario: 目录结构存在
- **WHEN** 检查仓库
- **THEN** `deploy/docker-compose-ha/` 目录存在，且包含 `bootstrap.sh`、`docker-compose.yaml`、`compose/`、`conf/`、`bin/`、`ha.env.example`

#### Scenario: 单点目录完全不修改
- **WHEN** 本 change 实施前后对比 `deploy/docker-compose/` 内文件
- **THEN** 该目录下文件内容 MUST 无差异（除非有完全独立的、非 HA 相关的改动）

#### Scenario: 单点部署使用单点入口
- **WHEN** 现网用户运行 `cd deploy/docker-compose && bash bootstrap.sh`
- **THEN** 部署行为与本 change 前完全一致，不读取也不感知 HA 相关变量

#### Scenario: HA 部署使用 HA 入口
- **WHEN** 用户运行 `cd deploy/docker-compose-ha && bash bootstrap.sh`
- **THEN** HA 形态启动；`HA_ROLE` 必须事先在 `ha.env` 中设置好

#### Scenario: 两份 .env 互不联动
- **WHEN** 比较 `deploy/docker-compose/.env` 与 `deploy/docker-compose-ha/.env`
- **THEN** 两份 `.env` 是独立副本，修改其一不影响另一
