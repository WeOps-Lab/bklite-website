## ADDED Requirements

### Requirement: 触发条件
The system SHALL only trigger the image build and publish workflow when new commits are pushed to the `master` branch.

#### Scenario: master 分支接收新提交
- **WHEN** 任意提交被 push 或合并到 `master` 分支
- **THEN** GitHub Actions 启动镜像构建与推送流程

#### Scenario: 非 master 分支提交
- **WHEN** 提交被 push 到非 `master` 分支(包括功能分支、tag)
- **THEN** workflow 不被触发,不执行任何构建

#### Scenario: Pull Request 事件
- **WHEN** 针对 `master` 分支的 Pull Request 被打开、更新或同步
- **THEN** workflow 不被触发,不执行构建

### Requirement: 镜像目标仓库
The system SHALL push built images to GitHub Container Registry under the current repository's owner namespace, with the image name matching the repository name in lowercase.

#### Scenario: 推送到 ghcr
- **WHEN** 构建完成
- **THEN** 镜像被推送到 `ghcr.io/<owner>/<repo>`,其中 `<owner>` 与 `<repo>` 来自 GitHub 上下文且全部转换为小写

### Requirement: 镜像标签策略
The system SHALL tag every successful master build with the `latest` tag.

#### Scenario: master 构建打 latest
- **WHEN** master 分支的构建成功并推送
- **THEN** 推送的镜像携带 `latest` 标签,且 `latest` 始终指向最新一次成功构建的镜像

#### Scenario: 不打其他标签
- **WHEN** master 分支构建成功
- **THEN** 镜像只携带 `latest` 标签,不附加 commit sha、分支名或时间戳等其他标签

### Requirement: 构建平台
The system SHALL build the image only for the `linux/amd64` platform.

#### Scenario: 单架构构建
- **WHEN** workflow 执行构建
- **THEN** 仅生成 `linux/amd64` 架构的镜像,不构建 `linux/arm64` 或其他架构

### Requirement: 构建参数
The system SHALL build the image without passing the `NEXUS_NODEJS_REPOSITY` build argument, so the build uses the default public npm registry.

#### Scenario: 默认 registry 构建
- **WHEN** workflow 调用 docker build
- **THEN** 不向 Dockerfile 注入 `NEXUS_NODEJS_REPOSITY`,Dockerfile 内部的条件分支走默认 npm registry

### Requirement: 镜像仓库认证
The system SHALL authenticate to ghcr.io using the workflow-scoped `GITHUB_TOKEN`, without requiring any user-managed secrets.

#### Scenario: 使用 GITHUB_TOKEN 登录
- **WHEN** workflow 执行登录步骤
- **THEN** 使用 `GITHUB_TOKEN` 作为密码登录 `ghcr.io`,登录用户为 `${{ github.actor }}`

#### Scenario: workflow 权限声明
- **WHEN** workflow 被定义
- **THEN** workflow 声明 `permissions.contents: read` 与 `permissions.packages: write`,以允许推送到 ghcr

### Requirement: 构建缓存
The system SHALL use GitHub Actions cache (`type=gha`) for Docker layer caching to accelerate subsequent builds.

#### Scenario: 启用 gha 缓存
- **WHEN** workflow 执行 docker buildx 构建
- **THEN** 构建配置 `cache-from: type=gha` 与 `cache-to: type=gha,mode=max`,以复用上一次构建的中间层

### Requirement: 构建失败处理
The system SHALL fail the workflow run when the image build or push fails, without retrying automatically.

#### Scenario: 构建步骤失败
- **WHEN** docker build 或 push 步骤返回非零退出码
- **THEN** workflow run 标记为失败,不进行自动重试,不生成或更新 `latest` 标签
