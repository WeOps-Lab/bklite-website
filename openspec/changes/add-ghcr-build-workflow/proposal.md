## Why

目前仓库已经有可用的 `Dockerfile`,但缺少自动化的镜像构建与发布流程。每次 master 分支合入新代码后,镜像需要人工构建并推送,效率低且容易遗漏,也无法保证下游环境(预览、私有化部署联调)能稳定拉到最新主干镜像。

## What Changes

- 新增 GitHub Actions workflow,在 `master` 分支接收新提交时自动构建并推送 Docker 镜像到 GitHub Container Registry (ghcr.io)
- 镜像仅构建 `linux/amd64` 单架构
- 镜像统一打 `latest` 标签,指向 master HEAD
- 使用 GitHub Actions 内置的 `GITHUB_TOKEN` 完成 ghcr 登录,无需额外维护 secret
- 启用 `type=gha` 构建缓存以加速后续构建
- 不传入 `NEXUS_NODEJS_REPOSITY` 构建参数,统一走默认 npm registry

## Capabilities

### New Capabilities
- `ci-image-publish`: 提供 master 主干镜像的自动化构建与发布到 ghcr 的能力,包括触发条件、镜像标签策略、构建平台、缓存策略与凭据管理

### Modified Capabilities
<!-- 无 -->

## Impact

- **新增文件**: `.github/workflows/build-image.yml`(以及首次创建 `.github/` 目录)
- **GitHub Packages**: 首次推送后会在 `WeOps-Lab` 组织下创建一个新的 ghcr 镜像仓库 `ghcr.io/weops-lab/bklite-website`,默认 private
- **Workflow 权限**: 需要为 workflow 声明 `contents: read` 与 `packages: write`
- **Dockerfile**: 不修改,沿用现有多阶段构建
- **依赖**: 仅使用官方 actions (`actions/checkout`, `docker/login-action`, `docker/setup-buildx-action`, `docker/metadata-action`, `docker/build-push-action`),无新增项目依赖
