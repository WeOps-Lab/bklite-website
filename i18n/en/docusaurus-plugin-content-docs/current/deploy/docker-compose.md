# Deployment Guide (Docker Compose)

This guide helps you quickly deploy **BK-Lite** using Docker Compose, and introduces how to choose a lightweight or full AI environment configuration that best fits your hardware.

---

## 1. Requirements

- Docker >= **20.10.23**
- Docker Compose >= **v2.27.0**
- AI Edition: In addition to the base requirements, the AI Edition enables built-in VLLM OCR, Embedding, and Rerank models, which require an Nvidia GPU with **> 8 GB** of available VRAM


---

## 2. Online Installation (Quick Start)

### 2.1 Standard Edition (Includes OpsPilot, without VLLM)

The Standard Edition already includes the OpsPilot AI module but does not deploy VLLM. If you already have your own large language model or plan to connect to a public cloud LLM, you can still use AI capabilities with lower server hardware requirements:

```bash
curl -sSL https://bklite.ai/install.run | bash -s -
```

### 2.2 AI Edition (With Local LLM Environment)

The AI Edition is recommended for an out-of-the-box AI experience. This edition not only includes OpsPilot but also deploys VLLM with built-in OCR, Embedding, and Rerank models:

```bash
curl -sSL https://bklite.ai/install.run | bash -s - --opspilot --vllm
```

> Note: The installation script is **idempotent** — repeated execution will not disrupt an already deployed environment.

---

## 3. Offline Installation

When the target server cannot access the internet, first create an offline package on an **internet-connected** machine that meets the version requirements, then transfer it to the target server for installation.

### 3.1 Create Offline Package (On Internet-Connected Machine)
- Standard Edition (without local LLM):

```bash
curl -sSL https://bklite.ai/install.run | bash -s - package
```

- AI Edition (with local LLM):

```bash
curl -sSL https://bklite.ai/install.run | bash -s - package --opspilot --vllm
```

After execution, the offline installation content will be generated in the **/opt/bk-lite** directory.

### 3.2 Package and Distribute (On Internet-Connected Machine)

Copy the generated **bklite-offline.tar.gz** to the target server (offline environment).

### 3.3 Install on Target Server (On Offline Machine)
```bash
sudo mkdir -p /opt/bk-lite
sudo tar -xzvf bklite-offline.tar.gz -C /opt/bk-lite
cd /opt/bk-lite
export OFFLINE=true
bash bootstrap.sh            # Standard Edition
# or
# bash bootstrap.sh --opspilot --VLLM  # AI Edition (includes AI module with VLLM built-in OCR, Embedding, and Rerank models; requires Nvidia GPU with > 8 GB available VRAM)
```

---

## 4. Uninstallation

To completely uninstall the system:

```bash
curl -sSL https://bklite.ai/uninstall.sh | bash -s -
```

---

## FAQ

- **Can the installation be run multiple times?** Yes. The script is designed to be idempotent — repeated execution for repair or updates is safe.
- **Can I install without configuring a MIRROR?** Yes, but configuring one is recommended in China's network environment to improve download speed and stability.
- **Can I use AI features if my server hardware is insufficient?** Yes. We recommend installing the Standard Edition and connecting to your existing private models or various public cloud LLMs for full AI capabilities, without needing to deploy a local LLM inference service (VLLM).
