# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Container Image

每次合入 `master` 分支后,GitHub Actions 会自动构建镜像并推送到 GitHub Container Registry,标签为 `latest`,仅构建 `linux/amd64`。

镜像默认私有,拉取前需要登录 ghcr。先在 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) 创建一个具有 `read:packages` 权限的 PAT,然后:

```bash
echo "$GHCR_PAT" | docker login ghcr.io -u <your-github-username> --password-stdin
docker pull ghcr.io/weops-lab/bklite-website:latest
```
