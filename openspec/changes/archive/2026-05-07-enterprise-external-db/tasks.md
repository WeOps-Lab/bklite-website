## 1. Compose 文件拆分

- [x] 1.1 创建 `deploy/docker-compose/compose/postgres.yaml`，迁入 postgres service 定义与 `postgres` named volume
- [x] 1.2 从 `deploy/docker-compose/compose/infra.yaml` 中删除 postgres service 定义与 `postgres` volume
- [x] 1.3 把 `infra.yaml` 中所有 `depends_on: postgres` 引用搬到 `postgres.yaml` 的 service override 段（同名 service 追加 depends_on），覆盖至少 mlflow 等已知引用方
- [x] 1.4 本地验证：`docker compose -f compose/infra.yaml -f compose/postgres.yaml -f ... config` 输出与改动前等价

## 2. bootstrap.sh 判定函数与校验

- [x] 2.1 在 `bootstrap.sh` 中新增 `is_external_db()` 函数：当 `ENTERPRISE_ENABLED=true` 且 `DB_ENGINE != postgresql` 时返回 0，否则返回非 0
- [x] 2.2 在 `do_install` 中，当 `is_external_db` 为真时，调用 `validate_external_db_env()` 校验 `DB_HOST`/`DB_USER`/`DB_PASSWORD` 非空且 `DB_HOST != postgres`，失败则 `die`
- [x] 2.3 在 `validate_external_db_env` 失败路径输出 ERROR 日志列出缺失变量

## 3. bootstrap.sh 编排路径调整

- [x] 3.1 修改 `do_install` 中的 `COMPOSE_CMD` 拼装逻辑：默认追加 `-f compose/postgres.yaml`，仅当 `is_external_db` 为真时不追加
- [x] 3.2 修改 `do_install` 在 `generate_postgres_initdb` 调用前增加 `is_external_db` 判断，外部模式跳过该调用
- [x] 3.3 在 `do_install` 进入主流程时若 `is_external_db` 为真，输出 `WARNING` 日志：「mlflow 服务未适配外部数据库，可能不可用」

## 4. bootstrap.sh 打包路径调整

- [x] 4.1 在 `do_package` 命令中识别 `--enterprise` 后，加载 `common.env`、`db.env` 以读取 `DB_ENGINE`，使 `is_external_db` 可用
- [x] 4.2 在 `do_package` 镜像循环中，当 `is_external_db` 为真时，跳过名字匹配 `POSTGRES` 的 `DOCKER_IMAGE_*` 镜像（与现有 `METIS`/`VLLM` 跳过模式一致）并输出 INFO 日志

## 5. 安装脚本同步

- [x] 5.1 运行 `pnpm` 项目根的 husky hook 或手动触发 `static/install.run` / `static/install.dev` 重新生成
- [x] 5.2 确认 `static/install.run` 与 `static/install.dev` 包含新增的 `compose/postgres.yaml` 内容

## 6. 验证

- [x] 6.1 场景：`bootstrap.sh install --enterprise`（不设 `DB_ENGINE`）—— postgres 容器应正常启动，行为与改动前等价
- [x] 6.2 场景：`bootstrap.sh install`（无 `--enterprise`，即使设 `DB_ENGINE`）—— postgres 容器应正常启动
- [x] 6.3 场景：`export DB_ENGINE=cw_cornerstone.db.dameng.backend DB_HOST=10.0.0.1 DB_USER=u DB_PASSWORD=p DB_PORT=5236; bootstrap.sh install --enterprise` —— 不启动 postgres 容器，应用容器使用外部数据库连接信息，输出 mlflow WARNING
- [x] 6.4 场景：`export DB_ENGINE=...; bootstrap.sh install --enterprise`（缺 `DB_HOST`）—— 校验失败，ERROR 退出，无容器被启动
- [x] 6.5 场景：`export DB_ENGINE=...; bootstrap.sh package --enterprise` —— 离线包不含 postgres 镜像 tar，images.sha256 中无 postgres 行
- [x] 6.6 场景：`bootstrap.sh package --enterprise`（不设 `DB_ENGINE`）—— 离线包包含 postgres 镜像

## 7. 文档

- [x] 7.1 在 `deploy/docker-compose/Readme.md` 中新增「企业版外部数据库模式」一节，说明所需环境变量、预创建数据库要求、mlflow 限制
