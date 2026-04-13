---
sidebar_position: 3
---

# Core Features

Node Management covers seven core management capabilities: **cloud regions, nodes, environments, variables, component library, controllers, and collection configuration**, supporting unified management of multi-cloud resources and collection components.


## 1. Cloud Region Management: Logical Grouping and Control of Node Resources
Cloud regions are the top-level logical grouping units for node resources, used to isolate node resources across different scenarios (e.g., production/testing) and enable domain-based resource management.

> ![2da93494-ea86-4a0e-8963-1e6eb257f787.png](https://static.cwoa.net/b437a8d41180484aac4dd7ed167655a5.png)

### Core Features
- **Region creation and information display**: Supports creating cloud regions, with each region displaying its name, description, and associated communication components (e.g., `stargazer`, `nats-executor`);
- **Region component status indicators**: Region cards visually indicate deployed communication components for quick awareness of the region's basic communication capabilities.


## 2. Node Management: Operational Control of Controller and Component Runtime Hosts
Nodes are the runtime entities (hosts/containers) for controllers and collection components, supporting full lifecycle operations including controller deployment and component hosting.

> ![37264bce-56ed-488e-b5f6-f2b55af5cf47.png](https://static.cwoa.net/b66c1f86506d426c979d3f7a3553b912.png)

### Core Features
- **Controller installation and status monitoring**: Supports batch installation of Linux/Windows controllers for nodes, with the list displaying controller runtime status and version information;
- **Full lifecycle hosted component operations**: Supports install, start, restart, and stop operations for components on nodes, with batch management of component runtime status;
- **Node information visualization**: Displays node IP, name, owning organization, and hosted component status (normal/abnormal/not started), providing a global view of node resources.


## 3. Environment Management: Infrastructure Components for Cloud Region Communication
Environments are the supporting component sets for communication between cloud regions and the platform (e.g., `stargazer`, `nats-executor`), ensuring communication connectivity between nodes within a region and the platform.

> ![7ceec2e2-54cc-4ce1-8661-4d1f186917ef.png](https://static.cwoa.net/65fc4c58c2544cd9baa022f51e9dc3a1.png)
>![14889dd0-f8c2-48cd-83ba-9afd01cb34e5.png](https://static.cwoa.net/182897d5e4ca492fa516c0b14b55080c.png)
### Core Features
- **Communication component status monitoring**: Real-time display of the runtime status of core communication components such as `stargazer` and `nats-executor` (e.g., "Normal");
- **Environment deployment configuration**: Supports two deployment methods -- "Container Deployment" (Community Edition) and "K8s Deployment" (Enterprise Edition). After entering the proxy IP, a deployment script can be generated to complete environment setup.


## 4. Variable Management: Dynamic Unified Configuration Management
Variables are used for dynamic value replacement in configuration files, enabling configuration reuse and unified control across multiple components, reducing repetitive configuration costs.

> ![9cfeb728-3a1f-49d5-94eb-10797fd2e5c3.png](https://static.cwoa.net/febf1f748e604908a27ee0e0d331d0e6.png)
>![705b1a9e-0f67-4d0e-ac32-4fbe1b900119.png](https://static.cwoa.net/c13654c9b5e24d5cbce01c54db28bb93.png)

### Core Features
- **Variable lifecycle operations**: Supports creating, editing, and deleting variables, with the list displaying variable names, values (sensitive information masked), and operation options;
- **Dynamic configuration replacement**: Variables can be referenced in component configuration files, enabling unified modification and batch application of configuration values, improving configuration management efficiency.


## 5. Component Library Management: Centralized Management of Multiple Collection Component Types
The component library is the resource pool for monitoring, logging, CMDB, and other collection components, supporting component creation, configuration, and version management to cover full-stack collection scenarios.

> ![f6f18374-818c-4ad7-89d2-cde80f5bca96.png](https://static.cwoa.net/3a0b4d36ac71446c85b3fa724e720685.png)
>![d92167a3-0353-4db3-a03c-df0b04f088ab.png](https://static.cwoa.net/372b612c2bb64ea28ad6cf8d97472dae.png)
> ![32694e19-3728-4b74-a49f-24662f1b87e1.png](https://static.cwoa.net/563dfaf530ae452fb98cd1bfda364f98.png)
> ![72c13ab6-aaf3-42a7-87f5-8077ea4f00c0.png](https://static.cwoa.net/3aba73c7d1ed4983b47e53b6e9040837.png)

### Core Features
- **Multi-type component classification management**:
  - Monitoring: Includes performance collection components such as Kafka Exporter, JVM JMX, Telegraf;
  - Logging: Includes log collection components such as Filebeat, Auditbeat;
  - CMDB: Includes components such as Telegraf (adapted for CMDB data collection);
- **Full component lifecycle management**:
  1. **Create component**: Configure component name, compatible operating system (Linux/Windows), execution path, and other basic information to create the component framework;
  2. **Upload component package**: Click the target component to enter its "Package Management" page, click the "Upload Package" button, and import the component package via "Click to Upload" or "Drag and Drop" in the upload dialog, then confirm to complete the upload.
     > ![node组件.png](https://static.cwoa.net/284e0b9ee6734c67b8ec1bdb0b5bcf0e.png)
     >![node上传组件包.png](https://static.cwoa.net/d1ae970c1a5e4a569bacca39e6cf3f63.png)
  3. **Version management**: Uploaded component packages are automatically included in the version management system, supporting retention, switching, and maintenance of multiple versions, enabling custom extension and iteration of components;
- **Component label indicators**: Each component is tagged with its compatible system (e.g., Linux/Windows) and component type (e.g., Exporter/Beat) for quick deployment scenario matching.


## 6. Controller Management: Core Automation Component for Heterogeneous Nodes
Controllers are the core management units on the node side, responsible for communication between nodes and the platform, as well as lifecycle management of collection components. This module supports **dedicated management of controllers for both Linux and Windows heterogeneous systems**, adapting to the operations needs of different operating system nodes.

> ![7212156e-cff6-43ee-bac8-f7294f71ebf2.png](https://static.cwoa.net/3c50a57ea78a407c84086c0be78705f1.png)

### Core Features
- **System-specific controller classification display and management**:
  - Controllers are split by operating system into "Linux Controller" and "Windows Controller," displayed in card format with basic information;
  - Each controller card is tagged with its compatible system (e.g., "Linux," "Windows") to clearly distinguish controller resources across systems and prevent cross-system misuse.

- **Transparent controller composition and core capabilities**:
  - Both controller types consist of `Sidecar` and `NATS Executor` dual components:
    - `Sidecar`: Responsible for node-side collection component process management (start/stop/restart);
    - `NATS Executor`: Responsible for message communication between nodes and the platform, receiving and executing task commands;
  - Core capabilities cover: lifecycle management of various collectors on nodes, automated deployment and dynamic coordination of node resources, and command/data transmission between the platform and nodes.

- **Full controller lifecycle management**:
  1. **Create controller**: Configure controller name, compatible operating system (Linux/Windows), deployment path, and other basic information to create the controller framework;
  2. **Upload controller package**: Click the target controller to enter its "Package Management" page, click the "Upload Package" button, and import the controller package via "Click to Upload" or "Drag and Drop" in the upload dialog, then confirm to complete the upload.
     > ![controller组件.png](https://static.cwoa.net/c8d8515250514a2eb1498d9fd1f298eb.png)
     >![controller上传组件包.png](https://static.cwoa.net/08603939f80042379695b45a99496aba.png)
  3. **Version management**: Uploaded controller packages are automatically included in the version management system, supporting retention, switching, and maintenance of multiple versions, enabling custom extension and iteration of controllers;

- **Scenario-specific adaptation support**:
  - Linux Controller: Dedicated to managing Linux system nodes, adapted for collection component operations in server, virtual machine, and other Linux environments;
  - Windows Controller: Dedicated to managing Windows system nodes, adapted for collection component operations in Windows server, terminal, and other environments.

## 7. Collection Configuration Management: Configuration Strategy Definition and Distribution Hub
Collection configuration management is the core capability for implementing batch rule deployment, supporting primary-secondary configuration splitting and node distribution to ensure multi-node collection components execute according to rules and remain controlled.

### Core Features
- **Primary and sub-configuration separation mechanism**:
  - **Primary configuration**: Defines the global base parameters for component operation; a single component has one active primary configuration per node;
  - **Sub-configuration**: Modular definitions for specific tasks (e.g., log collection rules for specific paths, filtering for specific metrics). Sub-configurations follow priority ordering for execution and support flexible creation, modification, and deletion.
- **Multi-dimensional configuration binding and batch application**:
  - Supports establishing flexible binding relationships such as "configuration - multiple nodes" or "node - multiple different component configurations";
  - Automatically renders the final configuration format (using node-level variables), distributes the modified configuration files in real time to the corresponding node controllers (Sidecar), completing seamless configuration handoff and updates.
