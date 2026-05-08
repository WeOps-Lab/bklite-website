## 1. 创建 workflow 文件

- [x] 1.1 创建目录 `.github/workflows/`
- [x] 1.2 新建 `.github/workflows/build-image.yml`,声明 workflow `name`(如 `Build and Push Image`)
- [x] 1.3 配置触发器 `on.push.branches: [master]`,不配置 `pull_request`、`tag` 或其他触发源
- [x] 1.4 在 workflow 顶层声明 `permissions: { contents: read, packages: write }`

## 2. 配置构建 job

- [x] 2.1 定义单个 job `build`,运行在 `ubuntu-latest`
- [x] 2.2 step: `actions/checkout@v4` 拉取仓库代码
- [x] 2.3 step: `docker/setup-buildx-action@v3` 启用 buildx
- [x] 2.4 step: `docker/login-action@v3` 登录 `ghcr.io`,username 用 `${{ github.actor }}`,password 用 `${{ secrets.GITHUB_TOKEN }}`

## 3. 配置镜像元数据与构建

- [x] 3.1 step: `docker/metadata-action@v5` 生成 tags,images 设为 `ghcr.io/${{ github.repository }}`,tags 配置仅包含 `type=raw,value=latest`(确保镜像名小写由 action 自动处理)
- [x] 3.2 step: `docker/build-push-action@v6` 执行构建与推送
  - `context: .`
  - `file: ./Dockerfile`
  - `platforms: linux/amd64`
  - `push: true`
  - `tags: ${{ steps.meta.outputs.tags }}`
  - `labels: ${{ steps.meta.outputs.labels }}`
  - `cache-from: type=gha`
  - `cache-to: type=gha,mode=max`
  - 不传 `build-args`(默认 npm registry)

## 4. 验证

- [x] 4.1 在本地用 `act` 或 GitHub 提供的 lint 工具(如 `actionlint`)校验 yaml 语法
- [ ] 4.2 提交到一个测试分支,合并到 master(或先临时改触发分支)观察首次运行结果  <!-- 待用户在 GitHub 实环境执行 -->
- [ ] 4.3 确认 workflow run 成功,镜像出现在 `https://github.com/orgs/WeOps-Lab/packages` 下,tag 为 `latest`  <!-- 待用户在 GitHub 实环境执行 -->
- [ ] 4.4 在本地执行 `docker login ghcr.io` + `docker pull ghcr.io/weops-lab/bklite-website:latest`,确认可拉取  <!-- 待用户在镜像推送后执行 -->
- [ ] 4.5 触发第二次构建,在日志中确认出现 `importing cache manifest` 等缓存命中提示  <!-- 待用户在第二次 push 后观察 -->


## 5. 文档与收尾

- [x] 5.1 在 `README.md` 或部署文档中增加一段:如何拉取 ghcr 镜像(包含 `docker login ghcr.io` 步骤,因镜像默认 private)
- [x] 5.2 删除/恢复测试期间的临时触发配置(若有)  <!-- N/A: 实现过程中未引入临时触发配置 -->
