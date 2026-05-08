## Context

仓库已有可用的多阶段 `Dockerfile`(node:18-alpine 构建 + nginx 运行),目前依赖人工本地 build & push,缺少自动化流程。仓库托管在 GitHub `WeOps-Lab` 组织下,天然适合用 GitHub Actions + ghcr.io 这一组合,无需引入额外 CI 平台或密钥管理。

约束:
- 镜像消费方暂时只跑在 x86 服务器,无 ARM 需求
- 不希望维护额外的 Docker Hub / Nexus 凭据
- 构建过程不能依赖内网 Nexus,workflow 运行在 GitHub 公网 runner 上

## Goals / Non-Goals

**Goals:**
- master 合入新代码后自动产出镜像,`latest` 始终代表 master HEAD
- 零额外 secret 维护成本
- 构建时间通过缓存控制在合理范围(目标:增量构建 < 3 分钟)

**Non-Goals:**
- 不支持多架构镜像(amd64 + arm64)
- 不在 PR 上做镜像构建验证
- 不打 commit sha / 语义化版本标签
- 不做镜像签名(cosign)、SBOM 生成、漏洞扫描
- 不自动清理历史 ghcr 镜像

## Decisions

### Decision 1: 镜像注册中心选用 ghcr.io
- **选项**: Docker Hub / ghcr.io / 阿里云 ACR / 自建 Harbor
- **选择**: ghcr.io
- **理由**:
  - 与 GitHub 仓库同源,使用 `GITHUB_TOKEN` 即可推送,无需在仓库 secret 中存第三方账号密码
  - Docker Hub 对组织/匿名拉取有限流,ghcr 限制更宽松
  - 私有化部署客户可以直接 `docker login ghcr.io` + PAT 拉取,无需额外开通服务

### Decision 2: 仅触发 push to master
- **选项**: push master / push master + tag / push master + PR
- **选择**: 仅 push master
- **理由**:
  - 用户明确确认只在 master 接收新代码时触发
  - PR 触发会引入"latest 指向未合入代码"的风险窗口期(参见 explore 阶段讨论)
  - 暂无发版需求,tag 触发可以将来按需追加

### Decision 3: 标签只打 latest,不追加 sha
- **选项**: 仅 latest / latest + sha-<short> / 仅 sha
- **选择**: 仅 latest
- **理由**:
  - 用户明确选择不要 sha 标签
  - 减少 ghcr 上的镜像数量,免去后续清理负担
  - **代价**: 失去精确回滚到某次构建的能力;若未来需要回滚,需手动重跑某个老 commit 的 workflow,或追加 sha 标签的需求出现时再扩展

### Decision 4: 单架构 linux/amd64
- **选项**: amd64 / amd64+arm64
- **选择**: amd64
- **理由**:
  - 用户确认部署目标只有 amd64
  - 多架构需要 QEMU 模拟构建 arm64,会把构建时长拉长 3-5 倍

### Decision 5: 缓存采用 type=gha
- **选项**: 无缓存 / type=gha / type=registry / type=inline
- **选择**: type=gha + mode=max
- **理由**:
  - 零配置,直接使用 GitHub Actions 内置 cache 后端
  - `mode=max` 缓存所有中间层,对依赖安装层(`pnpm install`)收益最大
  - registry 模式会污染 ghcr 镜像列表;inline 模式只缓存最后一层,效果差

### Decision 6: 不传 NEXUS_NODEJS_REPOSITY
- **理由**:
  - GitHub runner 在公网,可直接访问默认 npm registry
  - Dockerfile 已对该 ARG 做了空值兜底分支
  - 避免在 workflow 中暴露内网地址

### Decision 7: 使用官方 docker actions 组合
- 选用 `docker/login-action`、`docker/setup-buildx-action`、`docker/metadata-action`、`docker/build-push-action`
- **理由**: 官方维护、版本稳定、文档完善;`metadata-action` 即使当前只输出 latest,也保留了将来扩展 sha/semver 标签的低成本入口

## Risks / Trade-offs

- **[Risk] latest 漂移导致环境不一致** → 部署方拉取 latest 时不同时间会得到不同镜像。Mitigation: 部署方在生产环境应基于 digest(`@sha256:...`)固定版本,而不是依赖 latest;本 change 不解决该问题,仅提供能力。

- **[Risk] 无法精确回滚** → 不打 sha 标签意味着回滚必须重跑老 commit 的 workflow。Mitigation: 后续如有需求,在 `metadata-action` 的 tags 配置中追加一行 `type=sha,prefix=sha-` 即可。

- **[Risk] ghcr 镜像默认 private** → 首次推送后,任何拉取方都需先 `docker login ghcr.io`。Mitigation: 在 README/部署文档中增加登录说明;若后续需要 public,在 GitHub Packages 页面手动切换。

- **[Risk] GITHUB_TOKEN 权限不足导致推送失败** → 默认 token 在某些组织设置下 `packages: write` 可能被禁用。Mitigation: workflow 显式声明 `permissions:` 块;若仍失败,组织管理员需在 Settings → Actions → General 中放开 packages 写权限。

- **[Trade-off] 构建缓存的存储上限** → GitHub Actions cache 每个仓库 10GB 上限,LRU 淘汰。对单 workflow 影响很小,可以接受。

## Migration Plan

无历史镜像与历史 workflow 需要迁移。本 change 是从零新增。

回滚:删除 `.github/workflows/build-image.yml` 即可,无任何运行时副作用。已推送的 ghcr 镜像不会被自动删除,如需清理在 GitHub Packages 页面手动操作。
