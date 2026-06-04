## ADDED Requirements

### Requirement: 提供故障切换脚本

部署 SHALL 提供 `deploy/docker-compose-ha/bin/ha-failover.sh` 与 `ha-failback.sh`，封装固定的切换步骤序列。

#### Scenario: 脚本存在且可执行
- **WHEN** 检查 HA 部署目录
- **THEN** `bin/ha-failover.sh` 与 `bin/ha-failback.sh` MUST 存在且为可执行文件

#### Scenario: 脚本以 set -euo pipefail 启用严格模式
- **WHEN** 查看脚本头部
- **THEN** MUST 包含 `set -euo pipefail`，任一步骤失败时脚本退出非零

### Requirement: 切换步骤顺序固定

`ha-failover.sh` SHALL 按以下顺序执行，且任何一步失败 MUST 阻止后续步骤：

1. 健康预检（备机各 DB 就绪、复制延迟在阈值内）
2. 若主机可达，停止主机业务进程（`docker compose stop server web webhookd nats-executor stargazer fusion-collector`）
3. PostgreSQL：备机 `pg_promote()` 并等待 `pg_is_in_recovery()=false`
4. MinIO：在备机执行 SR 重配置，确保备机为写入主权方
5. Redis / FalkorDB：备机 `REPLICAOF NO ONE`
6. NATS：将关键流的 mirror 配置转为可写
7. 备机启动业务进程（`docker compose --profile active up -d`）
8. 健康自检（业务端口、NATS 流写入、PG 写入）
9. 提示运维更新 DNS 记录

#### Scenario: 健康预检失败时中止
- **WHEN** 步骤 1 检测到 PG 复制延迟 > 阈值
- **THEN** 脚本 MUST 退出非零，且 MUST NOT 执行步骤 2 及之后

#### Scenario: promote 失败时中止
- **WHEN** 步骤 3 `pg_promote` 超时
- **THEN** 脚本 MUST 退出非零，且 MUST NOT 启动业务进程

#### Scenario: 业务自检通过后才提示改 DNS
- **WHEN** 业务进程启动且步骤 8 健康检查通过
- **THEN** 脚本输出最后一步操作提示，包含具体的 DNS 记录目标 IP

### Requirement: 防止 split-brain

切换脚本 SHALL 在步骤 2 中显式停止主机业务进程；如果主机不可达，脚本 MUST 提示操作员确认主机已彻底失联后再继续。

#### Scenario: 主机可达时强制停服
- **WHEN** 步骤 2 检测到主机 SSH 可达
- **THEN** 脚本 MUST 通过 SSH 在主机执行 `docker compose stop server web webhookd nats-executor stargazer fusion-collector` 并验证容器进入 stopped 状态

#### Scenario: 主机不可达时交互确认
- **WHEN** 步骤 2 检测到主机 SSH 不可达
- **THEN** 脚本 MUST 暂停并要求人工确认 "主机已确认失联" 才能继续

### Requirement: 提供同步健康检查脚本

部署 SHALL 提供 `bin/ha-status.sh`，输出 PG / MinIO / Redis / FalkorDB / NATS 的复制状态摘要与延迟。

#### Scenario: 输出关键指标
- **WHEN** 在任一节点执行 `bin/ha-status.sh`
- **THEN** 输出 MUST 含以下字段：PG 复制延迟（字节与时间）、MinIO SR 状态、Redis `master_link_status`、FalkorDB `master_link_status`、NATS mirror lag（消息数差）

#### Scenario: 非零退出码表示异常
- **WHEN** 任一组件复制状态异常
- **THEN** 脚本以非零退出码退出，方便接入监控告警

### Requirement: 回切流程对称

`ha-failback.sh` SHALL 提供从备节点回到原主节点的对称流程，并 MUST 在执行前要求确认原主数据已通过反向同步追上。

#### Scenario: 回切前校验反向复制
- **WHEN** 执行回切脚本
- **THEN** 脚本 MUST 校验原主的 PG 已作为 standby 追上、MinIO SR 已反向同步、Redis/FalkorDB 已作为 replica 追上

#### Scenario: 校验未通过则中止回切
- **WHEN** 反向同步未追平（任一组件 lag 超阈值）
- **THEN** 脚本 MUST 中止，不执行 promote 与服务切换

### Requirement: Runbook 文档化

部署 SHALL 提供 markdown 格式的 HA 切换 runbook（位置 `deploy/docker-compose-ha/Readme.md` 或独立 `HA.md`），覆盖前置条件、切换步骤、回切步骤、常见故障处理。

#### Scenario: 文档章节齐备
- **WHEN** 查看 HA 文档
- **THEN** MUST 包含以下章节：前置条件 / 安装步骤 / 故障切换步骤 / 回切步骤 / 常见故障处理 / DNS 切换说明
