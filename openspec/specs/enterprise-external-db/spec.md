# enterprise-external-db Specification

## Purpose

TBD - 定义企业版部署支持外部数据库（如达梦等非 PostgreSQL 数据库）的能力，包括识别配置、跳过内置 postgres 编排与初始化、校验连接参数、打包优化以及兼容性提示。

## Requirements

### Requirement: 企业版部署识别外部数据库配置

部署脚本 `bootstrap.sh` 在 `install` 命令执行时 SHALL 提供 `is_external_db` 判定能力：当且仅当 `ENTERPRISE_ENABLED=true` 且 `DB_ENGINE` 取值不等于默认值 `postgresql` 时，判定为外部数据库模式。

#### Scenario: 企业版且指定非默认驱动
- **WHEN** 用户先 `export DB_ENGINE=cw_cornerstone.db.dameng.backend` 再执行 `bootstrap.sh install --enterprise`
- **THEN** 部署流程判定为外部数据库模式

#### Scenario: 企业版但未指定驱动
- **WHEN** 用户执行 `bootstrap.sh install --enterprise` 且未设置 `DB_ENGINE`
- **THEN** 部署流程判定为内置数据库模式，按现有行为启动 postgres 容器

#### Scenario: 非企业版即使指定驱动
- **WHEN** 用户先 `export DB_ENGINE=cw_cornerstone.db.dameng.backend` 再执行 `bootstrap.sh install`（无 `--enterprise`）
- **THEN** 部署流程判定为内置数据库模式，按现有行为启动 postgres 容器

### Requirement: 外部数据库模式跳过内置 postgres 编排

在外部数据库模式下，部署脚本 SHALL NOT 把 `compose/postgres.yaml` 加入 `docker-compose config` 命令的 `-f` 参数列表，使最终生成的 `docker-compose.yaml` 不含 `postgres` service 与对应 volume。

#### Scenario: 外部数据库模式生成 compose 文件
- **WHEN** 部署流程判定为外部数据库模式并生成 `docker-compose.yaml`
- **THEN** 生成结果不包含 `postgres` service 定义和 `postgres` volume 定义

#### Scenario: 内置数据库模式生成 compose 文件
- **WHEN** 部署流程判定为内置数据库模式并生成 `docker-compose.yaml`
- **THEN** 生成结果包含 `postgres` service 定义、`postgres` volume 定义以及所有 `depends_on: postgres` 引用

### Requirement: 外部数据库模式跳过 initdb 脚本生成

在外部数据库模式下，部署脚本 SHALL NOT 调用 `generate_postgres_initdb` 函数，避免生成无意义的 `conf/postgres/initdb.sql` 文件。

#### Scenario: 外部数据库模式跳过 initdb
- **WHEN** 部署流程判定为外部数据库模式
- **THEN** `conf/postgres/initdb.sql` 不被本次执行重新生成

### Requirement: 外部数据库模式校验连接参数

在外部数据库模式下，部署脚本在启动容器前 SHALL 校验 `DB_HOST`、`DB_USER`、`DB_PASSWORD` 三个变量均非空，且 `DB_HOST` 不等于字符串 `postgres`。校验失败 SHALL 输出 ERROR 级别日志并以非零状态码退出。

#### Scenario: 外部数据库模式缺少 DB_HOST
- **WHEN** 用户在外部数据库模式下执行 `bootstrap.sh install --enterprise` 但未设置 `DB_HOST` 或 `DB_HOST=postgres`
- **THEN** 脚本输出 ERROR 日志说明缺少外部数据库连接配置并退出

#### Scenario: 外部数据库模式参数齐备
- **WHEN** 用户已正确设置 `DB_ENGINE`、`DB_HOST`（非 `postgres`）、`DB_USER`、`DB_PASSWORD`、`DB_PORT`
- **THEN** 校验通过，继续部署流程

### Requirement: 外部数据库模式打包跳过 postgres 镜像

`bootstrap.sh package --enterprise` 命令在判定为外部数据库模式时 SHALL 跳过 `DOCKER_IMAGE_POSTGRES` 镜像的 `docker pull` 与 `docker save`，且离线包 `bklite-offline.tar.gz` 不包含该镜像 tar 文件，但 SHALL 输出 INFO 日志说明跳过原因。

#### Scenario: 外部数据库模式打包
- **WHEN** 用户先 `export DB_ENGINE=...` 再执行 `bootstrap.sh package --enterprise`
- **THEN** 打包过程跳过 postgres 镜像并输出 `INFO` 日志说明跳过原因

#### Scenario: 内置数据库模式打包
- **WHEN** 用户执行 `bootstrap.sh package --enterprise` 但未设置 `DB_ENGINE`
- **THEN** 打包过程包含 postgres 镜像

### Requirement: 外部数据库模式输出 mlflow 兼容性警告

在外部数据库模式下，部署脚本 SHALL 在部署日志中输出 WARNING 级别消息，说明 `mlflow` 服务未适配外部数据库，可能不可用。

#### Scenario: 外部数据库模式输出 mlflow 警告
- **WHEN** 部署流程判定为外部数据库模式并进入 `do_install` 主流程
- **THEN** 日志中至少出现一次 WARNING 级别消息提示 mlflow 在外部数据库模式下不可用
