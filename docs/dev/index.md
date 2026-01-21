---
sidebar_position: 1
title: 环境搭建
---

# 环境搭建

本指南帮助你快速搭建 **BK-Lite** 本地开发环境，开始参与项目开发。

---

## 环境要求

- Docker >= **20.10.23**
- Docker Compose >= **v2.27.0**

---

## 快速开始

### 启动开发环境

使用一键脚本启动开发环境：

```bash
curl https://bklite.ai/install.dev | bash -s start --domain <your-domain>
```

脚本执行完成后，会启动一个 CloudIDE 服务。

### 访问 CloudIDE

脚本执行过程中会提示输入 code-server 端口，完成后打开浏览器访问：

```
http://<your-domain>:<your-port>
```

> 后续所有操作均在 CloudIDE 中进行。

### Fork 并克隆仓库

在 CloudIDE 终端中执行：

1. 访问 [bk-lite 仓库](https://github.com/TencentBlueKing/bk-lite)，点击右上角 **Fork** 按钮
2. 克隆你 Fork 的仓库：

```bash
git clone https://github.com/<your-username>/bk-lite
cd bk-lite
```

3. 添加上游仓库（用于同步更新）：

```bash
git remote add upstream https://github.com/TencentBlueKing/bk-lite
```

---

## 启动服务

### 启动后端

在 CloudIDE 终端中执行：

```bash
cd ./server
make bootstrap
make dev
```

| 命令 | 说明 |
|------|------|
| `make bootstrap` | 安装依赖、初始化数据库、初始化应用数据 |
| `make dev` | 以开发模式启动后端服务（端口 8001） |

### 启动前端

在 CloudIDE 中新开一个终端，执行：

```bash
cd ./web
pnpm i
pnpm dev
```

| 命令 | 说明 |
|------|------|
| `pnpm i` | 安装前端依赖 |
| `pnpm dev` | 启动前端开发服务器（端口 3000） |

---

## 使用 OpenCode 开发

[OpenCode](https://github.com/opencode-ai/opencode) 是一款 AI 辅助开发工具，可以极大提升开发效率。

### 启动 OpenCode

在 CloudIDE 中新开一个终端，执行：

```bash
opencode
```

### 连接 GitHub Copilot

在 OpenCode 中执行以下命令，连接你的 GitHub Copilot 订阅：

```
/connect
```

连接成功后，即可愉快地开始开发！

---

## 常见问题

**依赖服务启动失败？**

请确保 Docker 和 Docker Compose 版本满足要求。
