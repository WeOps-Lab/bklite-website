# 系统部署指南（Docker Compose）

本指南帮助你使用 Docker Compose 快速部署 **BK‑Lite**，并为你介绍如何选择更适配硬件情况的轻量/完整 AI 环境配置。

---

## 1. 环境要求

- Docker >= **20.10.23**
- Docker Compose >= **v2.27.0**
- 智能版：在基础版之上，由于启用了 VLLM 内置的 OCR、Embedding 和 Rerank 模型，需要配备 Nvidia GPU，且可用显存 **> 8 GB**


---

## 2. 在线安装（快速开始）

### 2.1 基础版（默认含 OpsPilot，不部署 VLLM）

基础版已包含 OpsPilot AI 模块，但不部署 VLLM。如果你已有自己的大模型，或者计划对接公有云大模型，依然可以使用 AI 能力，且对服务器硬件的要求更低：

```bash
curl -sSL https://bklite.ai/install.run | bash -s -
```

### 2.2 智能版（附带本地模型环境）

推荐使用智能版获得开箱即用的 AI 体验。该版本不仅包含 OpsPilot，还会配套拉起 VLLM，内置部署相应的 OCR、Embedding 和 Rerank 模型 **（不含LLM大模型）**：

```bash
curl -sSL https://bklite.ai/install.run | bash -s - --opspilot --vllm
```

> 注：安装脚本支持 **幂等**，重复执行不会破坏已部署环境。

---

## 3. 离线安装

当目标服务器无法访问外网时，先在一台 **可联网** 且满足版本要求的机器上制作离线包，再拷贝到目标服务器进行安装。

### 3.1 制作离线包（联网机器执行）
- 基础版（不含本地大模型）：

```bash
curl -sSL https://bklite.ai/install.run | bash -s - package
```

- 智能版（附带本地大模型）：

```bash
curl -sSL https://bklite.ai/install.run | bash -s - package --opspilot --vllm
```

执行完成后，离线安装所需内容会生成在 **/opt/bk-lite** 目录。

### 3.2 打包与分发离线包（联网机器执行）

将生成的 **bklite-offline.tar.gz** 拷贝到目标服务器（离线环境）。

### 3.3 在目标服务器安装（离线机器执行）
```bash
sudo mkdir -p /opt/bk-lite
sudo tar -xzvf bklite-offline.tar.gz -C /opt/bk-lite
cd /opt/bk-lite
export OFFLINE=true
bash bootstrap.sh            # 基础版
# 或
# bash bootstrap.sh --opspilot --VLLM  # 智能版（含 AI 模块和VLLM内置的ocr、embedding和rerank模型，需要 Nvidia GPU，且可用显存 > 8 GB）
```

---

## 4. 卸载

如需完全卸载系统：

```bash
curl -sSL https://bklite.ai/uninstall.sh | bash -s -
```

---

## 常见问题

- **安装可以重复执行吗？** 可以。脚本为幂等设计，重复执行用于修复或更新都安全。
- **没有配置 MIRROR 可以安装吗？** 可以，但在国内网络环境下建议配置以提升下载速度与稳定性。
- **服务器硬件不够，能否使用 AI 功能？** 可以。建议安装基础版，只需对接已有私有模型或各类公有云大模型即可使用完整 AI 能力，无需在本地部署大模型推理服务（VLLM）。