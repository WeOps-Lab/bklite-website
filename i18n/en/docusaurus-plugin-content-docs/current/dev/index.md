---
sidebar_position: 1
title: Environment Setup
---

# Environment Setup

This guide helps you quickly set up a **BK-Lite** local development environment and start contributing to the project.

---

## Requirements

- Docker >= **20.10.23**
- Docker Compose >= **v2.27.0**

---

## Quick Start

### Start the Development Environment

Use the one-click script to start the development environment:

```bash
curl https://bklite.ai/install.dev | bash -s start --domain <your-domain>
```

After the script completes, a CloudIDE service will be started.

### Access CloudIDE

During script execution, you will be prompted to enter a code-server port. Once done, open your browser and visit:

```
http://<your-domain>:<your-port>
```

> All subsequent operations are performed within CloudIDE.

### Fork and Clone the Repository

In the CloudIDE terminal, execute:

1. Visit the [bk-lite repository](https://github.com/TencentBlueKing/bk-lite) and click the **Fork** button in the upper right corner
2. Clone your forked repository:

```bash
git clone https://github.com/<your-username>/bk-lite
cd bk-lite
```

3. Add the upstream repository (for syncing updates):

```bash
git remote add upstream https://github.com/TencentBlueKing/bk-lite
```

---

## Start Services

### Start the Backend

In the CloudIDE terminal, execute:

```bash
cd ./server
make bootstrap
make dev
```

| Command | Description |
|---------|-------------|
| `make bootstrap` | Install dependencies, initialize database, initialize application data |
| `make dev` | Start the backend service in development mode (port 8001) |

### Start the Frontend

Open a new terminal in CloudIDE and execute:

```bash
cd ./web
pnpm i
pnpm dev
```

| Command | Description |
|---------|-------------|
| `pnpm i` | Install frontend dependencies |
| `pnpm dev` | Start the frontend development server (port 3000) |

---

## Develop with OpenCode

[OpenCode](https://github.com/opencode-ai/opencode) is an AI-assisted development tool that can greatly improve development efficiency.

### Start OpenCode

Open a new terminal in CloudIDE and execute:

```bash
opencode
```

### Connect GitHub Copilot

In OpenCode, run the following command to connect your GitHub Copilot subscription:

```
/connect
```

Once connected, you can start developing right away!

---

## FAQ

**Dependency services fail to start?**

Make sure your Docker and Docker Compose versions meet the requirements.
