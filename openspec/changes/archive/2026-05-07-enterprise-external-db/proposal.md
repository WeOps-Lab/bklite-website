## Why

企业版客户通常已有标准化的数据库平台（如达梦等国产库），不允许使用部署脚本内置的 PostgreSQL 容器。当前 `bootstrap.sh` 即便用户在环境变量中指定了外部数据库，仍会强制启动内置 `postgres` 容器并执行建库脚本，造成端口占用、数据冗余以及与企业合规要求冲突。

## What Changes

- 在 `--enterprise` 模式下，当用户通过环境变量指定了非默认 `DB_ENGINE`（即不等于 `postgresql`）时，部署流程跳过内置 postgres 容器
- 把 `postgres` 服务从 `compose/infra.yaml` 抽离到独立的 `compose/postgres.yaml`，按条件追加到 `COMPOSE_CMD`
- 把现有引用 `depends_on: postgres` 的服务依赖也搬到 `postgres.yaml` 的 override 段，避免外接模式下因找不到 service 而启动失败
- 外接数据库模式下跳过 `generate_postgres_initdb`（用户负责自行准备 `bklite` 数据库）
- 外接数据库模式下，`do_package` 在打包离线镜像时跳过 PostgreSQL 镜像
- 外接数据库模式下，部署日志输出 WARNING 提示 `mlflow` 服务未适配外部数据库，可能不可用
- 非企业版（无 `--enterprise`）即便设置了 `DB_ENGINE`，仍按现有行为启动内置 postgres——本特性仅对企业版开放

## Capabilities

### New Capabilities
- `enterprise-external-db`: 企业版部署模式下识别外部数据库配置并跳过内置 postgres 容器编排与建库的能力

### Modified Capabilities

## Impact

- 影响文件：`deploy/docker-compose/bootstrap.sh`、`deploy/docker-compose/compose/infra.yaml`、新增 `deploy/docker-compose/compose/postgres.yaml`
- 影响命令：`bootstrap.sh install --enterprise`、`bootstrap.sh package --enterprise`
- 通过 `.husky/pre-commit` 触发的 `static/install.run` / `static/install.dev` 自动重新生成
- 用户契约变化：企业版用户现在需要在环境变量层面预先准备 `DB_ENGINE`、`DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_PORT`，并在外部数据库中预创建 `bklite` 数据库
- mlflow 行为：外接模式下 mlflow 容器仍指向 `postgres:5432`，将启动失败或不可用——已知限制，本次不修复
- 不引入新 CLI flag，复用现有 `DB_ENGINE` 环境变量作为判定信号
