# 使用compose部署bk-lite

## 部署要求

* docker >= 20.10.23
* docker-compose >=v2.27.0 

**如要体验ops-pilot相关特性，建议服务器单台内存>16GB**

## 快速体验

> install.run和bootstrap.sh是幂等的，多次运行不会对当前部署造成影响
> 一键部署
```bash
# bk-lite基础套餐
curl -sSL https://bklite.ai/install.run| bash -
# 带ops-ilot体验
curl -sSL https://bklite.ai/install.run| bash -s - --opspilot
```
> 快速卸载
```
curl -sSL https://bklite.ai/uninstall.sh| bash -
```

> 从源码部署
```bash
git clone https://github.com/TencentBlueKing/bk-lite.git
cd deploy/docker-compose
# bk-lite基础套餐
bash bootstrap.sh
# 带ops-ilot体验
bash bootstrap.sh --opspilot
```

## 企业版外部数据库模式

企业版客户如需使用自有数据库（如达梦等国产库），可通过环境变量切换驱动，部署流程将自动跳过内置 postgres 容器。

**触发条件**：`--enterprise` 启用 **且** `DB_ENGINE` 取值不等于默认值 `postgresql`。

**使用方式**：

```bash
# 1. 在外部数据库中预先创建 bklite 数据库
# 2. 导出连接信息后执行部署
export DB_ENGINE=cw_cornerstone.db.dameng.backend
export DB_HOST=10.0.0.1            # 不能等于 'postgres'
export DB_USER=bklite
export DB_PASSWORD=<password>
export DB_PORT=5236
bash bootstrap.sh install --enterprise
```

**已知限制**：

- 外部数据库模式下 `mlflow` 服务未适配，可能不可用——若需 mlflow，请保持内置 postgres 模式
- 此特性仅在 `--enterprise` 模式下生效；社区版即使设置 `DB_ENGINE` 也仍启动内置 postgres
- `bootstrap.sh package --enterprise` 在外部数据库模式下不会把 postgres 镜像打入离线包

> 手动卸载，在deploy/docker-compose或/opt/bk-lite目录下执行
```bash
#!/bin/bash
# 清除现有的容器，卷和网络
docker-compose down --volumes
# 当使用plugin形式安装compose时
docker compose down --volumes
# 清除生成的安装包，环境变量和compose文件
rm -rvf pkgs *.env docker-compose.yaml .env
```

