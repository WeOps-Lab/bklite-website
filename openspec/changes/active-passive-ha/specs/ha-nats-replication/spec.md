## ADDED Requirements

### Requirement: NATS 通过 leafnode 跨机房互联

主备 NATS SHALL 通过 leafnode 连接互联（端口 7422，TLS）。备机 NATS 作为 leaf 连接到主机 NATS。

#### Scenario: leafnode 连接建立
- **WHEN** 在主机 NATS 执行 `nats server report connections`
- **THEN** 输出 MUST 显示备机 NATS 作为 leaf node 已连接

#### Scenario: 备机 nats.conf 含 leafnode remotes
- **WHEN** 检查备机 `/etc/nats/nats.conf`
- **THEN** 文件 MUST 含 `leafnodes { remotes = [ { url: "tls://<PEER_HOST>:7422", ... } ] }`

### Requirement: 关键流通过 mirror 跨机房复制

主机上的关键 JetStream 流 SHALL 在备机以 `mirror` 形式订阅，至少包含：`metrics`、`OBJ_bklite`、`BK_ANS_EXEC_*` 系列、`METRICS_ALL`。

#### Scenario: metrics 流被镜像
- **WHEN** 在备机执行 `nats stream ls`
- **THEN** 输出 MUST 包含名为 `metrics` 的镜像流，并显示 `mirror of metrics`

#### Scenario: OBJ_bklite 被镜像
- **WHEN** 在备机执行 `nats stream info OBJ_bklite`
- **THEN** 输出 MUST 显示该流为 mirror，且消息数量与主机相差 ≤ 100

### Requirement: server_name 与 instance_id 主备唯一

NATS `server_name` 与 `nats-executor` 的 `NATS_INSTANCE_ID` SHALL 主备不同。

#### Scenario: server_name 不同
- **WHEN** 分别在主备执行 `nats server info`
- **THEN** 两端返回的 `server_name` 不同（例如 `nats-primary` vs `nats-standby`）

#### Scenario: NATS_INSTANCE_ID 不同
- **WHEN** 比较主备 `nats-executor` 容器的 `NATS_INSTANCE_ID` 环境变量
- **THEN** 取值不同（例如 `primary` 与 `standby`）

### Requirement: vector 在两端用不同 connection_name 消费本地 NATS

VictoriaLogs 的数据通路是 `collectors → NATS subject "vector" → vector → VL`。NATS leafnode 会把 core pub/sub 消息透明传播到对端，因此主备两端的 vector 都会收到全部消息。两端的 vector SHALL 使用**不同的** NATS `connection_name`，便于在 NATS 监控面板区分双订阅，并避免任何依赖 client name 的逻辑误将两端视为同一连接。

VictoriaMetrics 不直接订阅 NATS：现网 metrics 数据通过 JetStream `metrics` 流流转；备节点通过 mirror 流（见上一条 Requirement）拿到副本，VM 在切换后从本地 JetStream 拉取，本 change 不在 VM 上引入新的 durable consumer。

#### Scenario: 主机 vector connection_name
- **WHEN** 检查主机 NATS 监控页面 / `nats server report connections`
- **THEN** 列表中应出现一个 `connection_name` 等于 `${VECTOR_CONNECTION_NAME}` 主机取值（默认为 `NATS_SERVER_NAME`，例如 `nats-primary`）的 vector 客户端连接

#### Scenario: 备机 vector connection_name
- **WHEN** 检查备机 NATS 监控页面
- **THEN** 出现一个 `connection_name` 等于备机 `NATS_SERVER_NAME`（例如 `nats-standby`）的 vector 连接

#### Scenario: 两端 vector 并行消费不互斥
- **WHEN** 主备 vector 同时运行
- **THEN** 两端 vector 各自处理本地 NATS 上看到的 `vector` subject 消息，把数据写入各自本地的 VictoriaLogs；两端 VL 数据集应趋同（基于 leafnode 传播）

### Requirement: 证书覆盖 leafnode endpoint

NATS TLS 证书 SAN MUST 包含用于 leafnode 通信的主备 endpoint（hostname 与 IP）。

#### Scenario: SAN 校验通过
- **WHEN** 备机 NATS 通过 leafnode 连接主机 NATS
- **THEN** TLS 握手成功，不出现 `certificate is valid for ... not <peer>` 错误

### Requirement: 切换时 mirror 转 source

切换 SHALL 将备机上的 mirror 流转为可写流（删除 mirror 配置并由业务进程接管为新 source），且 SHALL 在原主恢复后通过反向 mirror 回补数据。

#### Scenario: 备机切主后流可写
- **WHEN** 切换脚本完成 NATS 角色变更
- **THEN** 业务进程在备机向 `metrics` 流 publish 消息可成功

#### Scenario: 原主恢复时反向 mirror
- **WHEN** 原主节点恢复并重启 NATS
- **THEN** 切换 runbook 引导操作员在原主创建反向 mirror，回补切换期间的新消息
