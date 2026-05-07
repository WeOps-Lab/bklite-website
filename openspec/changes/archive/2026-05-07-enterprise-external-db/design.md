## Context

`deploy/docker-compose/bootstrap.sh` 是 BlueKing Lite 的部署入口，负责生成 `.env`、组装 docker-compose 文件并启动容器。当前流程对 PostgreSQL 强耦合：

- `compose/infra.yaml` 直接定义 `postgres` service 并被多个服务通过 `depends_on: postgres` 引用
- `bootstrap.sh:1153` 总是执行 `generate_postgres_initdb` 写出 `initdb.sql`
- `do_package` 总是把 `DOCKER_IMAGE_POSTGRES` 打入离线镜像包

数据库连接相关的环境变量 `DB_ENGINE / DB_HOST / DB_USER / DB_PASSWORD / DB_PORT / DB_NAME` 已经存在并默认指向内置 postgres 容器（`DB_HOST=postgres`、`DB_ENGINE=postgresql`）。应用层接外部库的能力已经具备，缺失的是编排层「不要起 postgres 容器」的开关。

企业版客户场景中，常见诉求是把 `DB_ENGINE` 切换为国产数据库驱动（如 `cw_cornerstone.db.dameng.backend`），并提供自有数据库实例。本次改动只针对 `--enterprise` 模式开放此能力。

## Goals / Non-Goals

**Goals:**
- 在 `--enterprise` 模式下识别用户已配置的非默认 `DB_ENGINE`，自动跳过内置 postgres 容器
- 跳过对应的初始化脚本生成与离线镜像打包
- 不破坏现有「企业版 + 内置 postgres」与「社区版」两条主流路径

**Non-Goals:**
- 不为社区版（无 `--enterprise`）开放外部数据库特性
- 不修复 `mlflow` 服务对外部数据库的兼容性（仅以 WARNING 提示，由用户自行处置）
- 不引入新的命令行 flag，复用现有环境变量
- 不提供从内置 postgres 到外部数据库的数据迁移工具

## Decisions

### 决策 1：判定信号采用 `DB_ENGINE != postgresql`

**选择**：在 `--enterprise` 启用的前提下，若 `DB_ENGINE` 非默认值（即不等于 `postgresql`），即视为外接数据库模式，跳过内置 postgres。

**理由**：
- 默认值 `postgresql` 已在 `ensure_db_env_vars()` 中固化，能稳定区分「未设置」与「显式覆盖」
- 不需要新增 CLI 参数，命令面保持简洁
- 用户在调用前 `export DB_ENGINE=...` 即生效，与现有约定一致

**替代方案**：
- 新增 `--external-db` flag —— 显式但增加 CLI 复杂度，被否
- 新增 `EXTERNAL_DB=true` 环境变量 —— 与 `DB_ENGINE` 重复，被否

### 决策 2：拆分 `compose/postgres.yaml` 而非使用 compose profiles

**选择**：把 postgres service 及其 volume 抽到独立的 `compose/postgres.yaml`，并把所有 `depends_on: postgres` 也搬入该文件作为 service override。`bootstrap.sh` 在外接模式下不追加 `-f compose/postgres.yaml`。

**理由**：
- 与现存做法一致——`vllm.yaml` 已采用「按需追加 -f」的模式（见 `bootstrap.sh:1137`）
- 避免 compose profiles 与 `depends_on` 互动时的边界问题（profile 内服务对 profile 外服务的依赖语义不直观）
- 移除 `infra.yaml` 中的 `depends_on: postgres` 后，外接模式下不会出现「依赖不存在 service」的报错

**替代方案**：
- compose profiles —— `depends_on` 与 profile 联动行为不够稳，被否
- 生成后用 `yq` 删除 postgres 段 —— 太脆弱，被否

### 决策 3：mlflow 不适配，仅警告

**选择**：外接模式下不修改 `mlflow` 的 `backend-store-uri`，仅在部署日志中打 WARNING 提示其可能不可用。

**理由**：
- 用户明确表示本次范围不含 mlflow
- mlflow 的外接库需要预创建独立 database 并保证驱动兼容，工作量超出本变更
- 留作后续独立 change 处理

### 决策 4：is_external_db 抽成函数

**选择**：把判定逻辑封装为 `is_external_db()`，集中复用，便于将来扩展（如新增 `EXTERNAL_DB` 显式开关时只改一处）。

```bash
is_external_db() {
    [[ "${ENTERPRISE_ENABLED:-false}" == "true" ]] && \
    [[ "${DB_ENGINE:-postgresql}" != "postgresql" ]]
}
```

## Risks / Trade-offs

- **[风险] `infra.yaml` 中 `depends_on: postgres` 移到 `postgres.yaml` 后，对原始结构的可读性有轻微损失**
  → 缓解：在 `postgres.yaml` 顶部以注释说明这是为了支持外接数据库模式；`tasks.md` 明确列出所有受影响 service

- **[风险] 用户在 `--enterprise` 模式下误改 `DB_ENGINE` 又未提供有效外部库连接信息，会导致应用层启动失败但 postgres 容器又未拉起**
  → 缓解：`do_install` 入口处校验：当 `is_external_db` 为真时，要求 `DB_HOST`、`DB_USER`、`DB_PASSWORD` 均为非空且 `DB_HOST != postgres`，否则报错退出

- **[风险] mlflow 容器在外接模式下会持续重启**
  → 缓解：外接模式下日志中输出明确 WARNING；如果造成困扰，下个变更再做适配。本次接受此已知限制

- **[风险] `do_package --enterprise` 时若同时设置 `DB_ENGINE`，离线包不含 postgres 镜像；但用户实际部署机若想切回内置 postgres 模式会缺镜像**
  → 缓解：判定逻辑与 install 一致；package 时打日志说明「外接模式离线包不含 postgres 镜像，如需内置请重新 package」

- **[Trade-off] 不引入显式 flag 意味着 CI/CD 调用方需要自己 `export DB_ENGINE`**
  → 接受：与现有 DB env 变量约定一致

## Migration Plan

本特性为新增能力，对现有部署无破坏性影响：

1. 现有「`--enterprise` 不设 `DB_ENGINE`」用户：行为完全不变，继续启动内置 postgres
2. 现有「无 `--enterprise`」用户：行为完全不变
3. 新接入「`--enterprise` + 外部库」用户：需要按文档预先：
   - `export DB_ENGINE=<驱动>`
   - `export DB_HOST=<外部 host>`
   - `export DB_USER / DB_PASSWORD / DB_PORT`
   - 在外部库中预创建 `bklite` 数据库

回滚策略：直接 `unset DB_ENGINE` 后重跑 `bootstrap.sh install --enterprise --clean` 即可回到内置 postgres 模式。

## Open Questions

无。所有澄清问题已在探索阶段确认。
