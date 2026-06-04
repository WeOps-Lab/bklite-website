## ADDED Requirements

### Requirement: MinIO 采用 Site Replication

主备 MinIO SHALL 使用官方 Site Replication 功能，双向异步复制对象、桶配置、IAM 与策略。

#### Scenario: 站点复制状态健康
- **WHEN** 在主节点执行 `mc admin replicate status local`
- **THEN** 输出 MUST 显示两个站点都存在且状态为 `Online`

#### Scenario: 新建对象双向同步
- **WHEN** 在主节点上传一个对象到任意 bucket
- **THEN** 不超过 60 秒后，该对象在备节点同一 bucket 内可读

### Requirement: 所有 bucket 启用 versioning

凡纳入 Site Replication 的 bucket MUST 启用 versioning。HA 部署 SHALL 在初始化时对现网的全部 bucket 执行 `mc version enable`。

#### Scenario: 现网 bucket 全部启用版本
- **WHEN** 检查 11 个现网 bucket（包括 `auto-generated-bucket-media-files`、`auto-generated-bucket-static-files`、`cmdb-config-file`、`demo`、`job-mgmt-private`、`log-alert-raw-data`、`mlflow-artifacts`、`monitor-alert-raw-data`、`munchkin-private`、`munchkin-public` 等）
- **THEN** 每个 bucket `mc version info` 返回 `Enabled`

#### Scenario: 新 bucket 自动版本
- **WHEN** 在 HA 模式下创建新的 bucket
- **THEN** 创建后立即设置 versioning 为 `Enabled`

### Requirement: 限制对象历史版本膨胀

部署 SHALL 给每个 bucket 配置 lifecycle policy，限制历史版本保留数量或保留期限。

#### Scenario: 默认 lifecycle 已配置
- **WHEN** 部署完成
- **THEN** 每个 bucket MUST 存在一条 lifecycle rule，对 noncurrent version 的保留期限 ≤ 7 天

### Requirement: 复制凭证集中管理

Site Replication 使用的 access key / secret SHALL 以 `MINIO_SR_TOKEN`（或类似命名）形式存放在 `ha.env`，不写入代码或 compose 文件。

#### Scenario: 凭证不在版本控制中
- **WHEN** 检索代码仓库
- **THEN** `MINIO_SR_TOKEN` 的实际值 MUST NOT 出现在 `deploy/` 任何被 git 跟踪的文件里

### Requirement: 备机切主能正常写入

切换后备节点 MinIO SHALL 能继续接受写入；如果原主节点恢复，写入 MUST 反向同步回原主。

#### Scenario: 备机切主后业务能写
- **WHEN** failover 完成，业务进程在备机启动并向 `minio` 写入对象
- **THEN** 写入成功；对象在备机本地立即可读

#### Scenario: 原主恢复后反向同步
- **WHEN** 原主节点恢复并重新上线
- **THEN** 切换期间在备机产生的对象在 60 秒内出现在原主节点

### Requirement: NATS Object Store 不通过 MinIO 同步

`OBJ_bklite` 是 NATS JetStream 的 Object Store，体量约 2.7 GB。它 SHALL 跟随 NATS 流复制传播，不通过 MinIO SR 同步。

#### Scenario: 容量预估
- **WHEN** 规划备机磁盘
- **THEN** NATS JetStream 存储目录 MUST 为 `OBJ_bklite` 预留 ≥ 5 GB
