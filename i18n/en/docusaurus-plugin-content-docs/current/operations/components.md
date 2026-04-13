---
sidebar_position: 2
---

# Component Overview

This section introduces the core components of the BK-Lite platform and their key roles within the system.

## Architecture Overview

BK-Lite adopts a microservices architecture, orchestrated and deployed via Docker Compose. Components are categorized as follows:

| Category | Component | Role |
|----------|-----------|------|
| **Gateway** | Traefik | Reverse proxy, request routing, TLS termination |
| **Application** | Server, Web | Business logic, frontend interface |
| **Data** | PostgreSQL, PGVector, FalkorDB | Relational data, vector data, graph data |
| **Cache** | Redis | Caching, sessions, Celery Broker |
| **Messaging** | NATS | Message queue, event distribution |
| **Monitoring** | VictoriaMetrics, VictoriaLogs | Metrics storage, log storage |
| **Storage** | MinIO | Object storage |
| **Agent** | Telegraf, Vector, Beats series | Host metrics collection, log collection |
| **Collector** | Fusion-Collector, Stargazer, NATS-Executor, Webhookd | Unified collection, cloud resource collection, command execution |
| **AI** | vLLM (optional) | Model inference service (Embedding, Rerank, OCR) |

---

## Core Component Details

### Traefik (Reverse Proxy)

**Role**: Serves as the unified entry point for the system, handling request routing and TLS termination.

| Property | Value |
|----------|-------|
| Default Port | `443` (configurable) |
| Data Volume | No persistent data |
| Backup Priority | Low (stateless) |

**Key Configuration**:
- Automatically discovers Docker containers and generates routing rules
- Supports dynamic configuration hot-reloading
- Provides an optional Dashboard management interface

---

### PostgreSQL (Relational Database)

**Role**: Stores core business data including users, configurations, CMDB assets, and more.

| Property | Value |
|----------|-------|
| Default Port | `5432` |
| Data Volume | `postgres:/data/postgres` |
| Backup Priority | **Highest** |

**Database List**:
- `bklite` - Main business database
- `mlflow` - MLflow model tracking database

:::warning Important
PostgreSQL is the most critical data store in the system and must be prioritized for backup.
:::

---

### PGVector (Vector Database)

**Role**: Provides vector storage for OpsPilot AI capabilities, supporting semantic search and knowledge base Q&A.

| Property | Value |
|----------|-------|
| Default Port | Shares PostgreSQL port 5432 |
| Database Name | `metis` |
| Backup Priority | **High** |

**Use Cases**:
- Knowledge base document vectorization
- RAG (Retrieval-Augmented Generation) semantic search
- AI conversation context association

:::info Note
PGVector runs as a PostgreSQL extension, with data stored in a separate `metis` database.
:::

---

### FalkorDB (Graph Database)

**Role**: Stores CMDB asset relationship graphs, supporting complex topology queries.

| Property | Value |
|----------|-------|
| Default Port | `6479` (mapped to container port 6379) |
| Data Volume | `falkordb:/var/lib/falkordb/data` |
| Backup Priority | **High** |

**Use Cases**:
- CMDB asset relationships
- Service dependency topology
- Impact analysis and root cause identification

:::tip Technical Note
FalkorDB is based on the Redis protocol — you can use `redis-cli` for management operations.
:::

---

### Redis (Cache Database)

**Role**: Provides high-performance caching, session storage, and Celery task queue.

| Property | Value |
|----------|-------|
| Default Port | `6379` |
| Data Volume | `redis:/data` |
| Backup Priority | Medium |

**Usage Allocation**:
- DB 1: Application cache
- DB 3: Celery Broker / Result Backend

---

### NATS (Message Queue)

**Role**: High-performance messaging middleware responsible for asynchronous communication and event distribution between components.

| Property | Value |
|----------|-------|
| Default Port | `4222` (client), `7422` (cluster) |
| Data Volume | `nats:/nats` |
| Backup Priority | Low |

**Use Cases**:
- Monitoring metrics reporting channel
- Log data transport
- Node management command dispatch

---

### VictoriaMetrics (Time Series Database)

**Role**: Stores monitoring metrics data, providing high-performance time series queries.

| Property | Value |
|----------|-------|
| Default Port | `8428` |
| Data Volume | `victoria-metrics:/victoria-metrics-data` |
| Backup Priority | Medium |
| Default Retention | 168 hours (7 days) |

**Features**:
- Compatible with Prometheus query syntax
- Supports high-cardinality metrics
- Low resource footprint

---

### VictoriaLogs (Log Database)

**Role**: Stores and retrieves system logs, supporting full-text search.

| Property | Value |
|----------|-------|
| Default Port | `9428` |
| Data Volume | `victoria-logs:/vlogs` |
| Backup Priority | Medium |

---

### MinIO (Object Storage)

**Role**: Provides S3-compatible object storage for files and model artifacts.

| Property | Value |
|----------|-------|
| API Port | `9000` |
| Console Port | `9001` |
| Data Volume | `minio:/data` |
| Backup Priority | Medium |

**Stored Content**:
- MLflow model artifacts
- Knowledge base uploaded files
- System attachments

---

### MLflow (Model Management)

**Role**: Machine learning model version management and experiment tracking.

| Property | Value |
|----------|-------|
| Default Port | `15000` |
| Backend Store | PostgreSQL (`mlflow` database) |
| Artifact Store | MinIO (`mlflow-artifacts` bucket) |
| Backup Priority | Medium |

---

### Server (Backend Service)

**Role**: BK-Lite core business service, providing REST APIs.

| Property | Value |
|----------|-------|
| Internal Port | `8000` |
| External Path | `/api/v1/*` |
| Backup Priority | Low (stateless) |

**Dependencies**:
- PostgreSQL (business data)
- PGVector (vector data)
- FalkorDB (graph data)
- Redis (cache/queue)

---

### Web (Frontend Service)

**Role**: Next.js frontend application, providing the user interface.

| Property | Value |
|----------|-------|
| Internal Port | `3000` |
| External Path | `/` (default route) |
| Backup Priority | Low (stateless) |

---

## Collection and Agent Components

### Telegraf (Metrics Collection)

**Role**: Collects host and container metrics, reporting to VictoriaMetrics via NATS.

| Property | Value |
|----------|-------|
| Config File | `conf/telegraf/telegraf.conf` |
| Backup Priority | Low (stateless) |

---

### Vector (Log Collection)

**Role**: High-performance log collection and forwarding engine, sending log data to VictoriaLogs.

| Property | Value |
|----------|-------|
| Config File | `conf/vector/vector.yaml` |
| Backup Priority | Low (stateless) |

---

### Fusion-Collector (Unified Collector)

**Role**: BK-Lite's proprietary unified collector, supporting multiple data source collection, deployable on managed nodes.

| Property | Value |
|----------|-------|
| SNMP Trap Port | `162/udp` |
| Supported Platforms | Linux, Windows |
| Backup Priority | Low (stateless) |

**Collection Capabilities**:
- Host performance metrics (CPU, memory, disk, network)
- SNMP Trap reception
- Custom script collection

---

### Stargazer (Cloud Resource Collection)

**Role**: Cloud resource collection and monitoring agent service, supporting multi-cloud platform resource synchronization.

| Property | Value |
|----------|-------|
| Internal Port | `8083` |
| Tech Stack | Python + Sanic + ARQ |
| Backup Priority | Low (stateless) |

**Supported Cloud Platforms**:
- VMware vSphere
- Alibaba Cloud
- AWS
- Tencent Cloud
- Huawei Cloud

**Architecture**:
- **Server**: Receives collection requests, distributes tasks
- **Worker**: Executes specific collection tasks (based on ARQ task queue)

---

### NATS-Executor (Command Executor)

**Role**: NATS-based remote command execution agent, deployed on managed nodes to execute scripts and commands.

| Property | Value |
|----------|-------|
| Tech Stack | Go |
| Supported Platforms | Linux, Windows, macOS |
| Backup Priority | Low (stateless) |

**Features**:
- Cross-platform command execution (sh, bash, bat, PowerShell)
- Command execution timeout control
- File download and extraction
- Health checks

**NATS Subscription Topics**:
- `local.execute.{instance_id}` - Local command execution
- `health.check.{instance_id}` - Health check
- `download.local.{instance_id}` - File download
- `unzip.local.{instance_id}` - File extraction

---

### Webhookd (Webhook Service)

**Role**: Provides HTTP Webhook interfaces for triggering script execution and Docker Compose management.

| Property | Value |
|----------|-------|
| Internal Port | `8080` |
| Backup Priority | Low (stateless) |

**API Features**:
- Docker Compose service management (setup, start, stop, status, update)
- Infrastructure management script execution
- Kubernetes operation proxy
- MLOps training task triggering

---

## AI Inference Components (Optional)

:::info Note
The following components are only deployed when OpsPilot AI capabilities are enabled and require GPU support.
:::

### vLLM Model Service

**Role**: Provides high-performance LLM inference service, supporting Embedding, Rerank, and OCR models.

| Service | Model Type | Purpose |
|---------|-----------|---------|
| bce-embedding | Text Embedding | Document vectorization |
| bge-embedding | Text Embedding | Document vectorization (alternative) |
| bce-rerank | Reranking | Search result optimization |
| olmocr | OCR | Image text recognition |

**Hardware Requirements**:
- NVIDIA GPU (CUDA supported)
- VRAM >= 8GB (per model)
- Recommended server memory >= 16GB

---

## Data Volume Inventory

The following lists all Docker data volumes and their backup priorities:

| Data Volume | Component | Backup Priority | Description |
|-------------|-----------|----------------|-------------|
| `postgres` | PostgreSQL | **Highest** | Core business data |
| `falkordb` | FalkorDB | **High** | Graph database |
| `victoria-metrics` | VictoriaMetrics | Medium | Monitoring metrics |
| `victoria-logs` | VictoriaLogs | Medium | Log data |
| `minio` | MinIO | Medium | Object storage |
| `redis` | Redis | Medium | Cache data |
| `nats` | NATS | Low | Message queue |
| `neo4j` | (Reserved) | - | Not enabled |

---

## Network Architecture

All components run within the `bklite-prod` Docker network and communicate internally via container names.

```
┌─────────────────────────────────────────────────────────────┐
│                      External Access                         │
│                     https://<HOST_IP>                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │  Traefik  │ :443
                    └─────┬─────┘
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │    Web    │   │   Server  │   │  Others   │
    │   :3000   │   │   :8000   │   │           │
    └───────────┘   └─────┬─────┘   └───────────┘
                          │
    ┌──────────┬──────────┼──────────┬──────────┐
    │          │          │          │          │
┌───▼───┐ ┌───▼───┐ ┌────▼────┐ ┌───▼───┐ ┌───▼───┐
│ Redis │ │ NATS  │ │PostgreSQL│ │PGVector│ │FalkorDB│
│ :6379 │ │ :4222 │ │  :5432   │ │ :5432  │ │ :6479  │
└───────┘ └───────┘ └─────────┘ └────────┘ └────────┘
```

---

## Next Steps

- [Backup and Restore](./backup-restore.md) - Learn how to back up and restore critical data
