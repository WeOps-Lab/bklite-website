---
sidebar_position: 3
---

# Feature Guide

BlueKing Lite CMDB is built around four core scenarios: "Model Management -> Asset Management -> Discovery & Sync -> Subscription & Notification," providing full-stack asset configuration management capabilities. This document breaks down each feature by product navigation module.

---

## 1. Model Management

Model Management is the **data rule engine** of BlueKing Lite CMDB, determining how assets are defined, displayed, and related. All instance operations are governed by model constraints, serving as the foundation for ensuring asset data consistency.

> **UI Guide:**
>
> ![Model Management](https://static.cwoa.net/3bb26a49a5474c32a19ef44b252388b7.png)
>
> *   **Diagram explanation**: The Model Management page uses a three-level navigation layout. The left panel displays a category tree with drag-and-drop sorting; the center shows model cards with instance statistics and operation entry points; the right detail panel organizes configuration modules such as "Attributes," "Groups," and "Relationships" through tabs.

### 1.1 Model Categories and Model Definition

**Core Purpose**: Establish an organizational hierarchy for assets, enabling large-scale asset classification management.

#### Core Capabilities

*   **Category-based organization**: Supports building multi-level categories by business domain, resource type, or management boundary; category order supports drag-and-drop adjustment
*   **Standardized model definition**: Maintains attributes, relationships, and display rules at the model level, ensuring consistency across same-type assets
*   **Model duplication and reuse**: One-click duplication of an existing model's attributes, field groups, and relationship configurations, supporting cross-category reuse to significantly reduce standard model expansion time
*   **Organization scope isolation**: Models are bound to organization scope, enabling data boundary management when multiple teams share the platform

> **Typical Usage**
>
> Enterprises can first create top-level categories such as "Infrastructure," "Business Applications," and "Network Devices," then refine them with sub-models, such as "Physical Machines," "Virtual Machines," and "Container Nodes" under Infrastructure.

---

### 1.2 Attribute Management

**Core Purpose**: Define asset data structures, including field types, constraint rules, and display methods.

#### Core Capabilities

*   **Ten attribute types**: Supports string, integer, enumeration, datetime, user, organization, boolean, password, tag, and table, covering 99% of asset modeling scenarios
*   **Flexible enumeration rules**: Enumeration fields support "single-select/multi-select" modes, can reference the public option library for cross-model unification, or directly configure custom options
*   **Field-level constraints**: Three constraint levels -- required, unique, and editable -- ensure data quality; password-type fields are automatically encrypted for storage with masked API responses

#### Attribute Type Quick Reference

| Type | Use Case | Special Capability |
|------|----------|-------------------|
| **String** | Names, IPs, serial numbers, and other text | Supports regex validation |
| **Integer** | Port numbers, capacity sizes, and other numeric values | Supports range constraints |
| **Enumeration** | Status, environment, level, and other fixed options | Supports public option library references |
| **Datetime** | Creation time, expiration time, etc. | Supports both date and datetime precision |
| **User** | Owner, creator, and other personnel | Auto-links to user system, displays user names |
| **Organization** | Department, team, etc. | Auto-links to organization tree, supports hierarchical display |
| **Boolean** | Is core, is monitored, etc. | Toggle switch display |
| **Password** | Account passwords, keys, etc. | Encrypted storage, masked display throughout |
| **Tag** | Flexible categorization, multi-dimensional labeling | Supports key-value pair format, e.g., `env:prod` |
| **Table** | NIC lists, disk lists, and other complex structures | JSON storage, frontend table rendering |

---

### 1.3 Field Groups and Display Structure

**Core Purpose**: Optimize the data entry and viewing experience for complex models, avoiding long flat forms.

#### Core Capabilities

*   **Group-level organization**: Supports creating, editing, and deleting field groups to organize fields by business logic (e.g., "Basic Information," "Network Configuration," "Operations Attributes")
*   **Group ordering and collapse**: Controls group display order and sets default collapse/expand states to accommodate different reading preferences
*   **Cross-group attribute adjustment**: Supports moving attributes from one group to another, flexibly adjusting the display structure
*   **Instance-level rendering**: Field group configurations take effect immediately on instance creation, editing, and detail pages

---

### 1.4 Model Relationship Management

**Core Purpose**: Define the association rules between assets, serving as the foundation for topology and impact analysis.

#### Core Capabilities

*   **Six relationship types**: Belongs to, composed of, runs on, installed on, contains, and associated with, covering mainstream dependency scenarios
*   **Four mapping constraints**: Supports 1:1, 1:n, n:1, and n:n mapping relationships, preventing arbitrary associations from distorting structure
*   **Bidirectional structure expression**: Relationship definitions simultaneously constrain the association capabilities of source and target model instances
*   **Native graph relationship storage**: Model relationships are stored as graph edges in FalkorDB, natively supporting multi-hop topology queries

#### Relationship Type Use Cases

| Relationship Type | Direction | Typical Scenario | Example |
|-------------------|-----------|------------------|---------|
| **Belongs to** | Child -> Parent | Asset ownership | VM **belongs to** host |
| **Composed of** | Parent -> Child | Whole and parts | Host **is composed of** cluster |
| **Runs on** | App -> Resource | Deployment location | Service **runs on** container |
| **Installed on** | Software -> Hardware | Software deployment | MySQL **installed on** Linux host |
| **Contains** | Parent -> Child | Hierarchical containment | VPC **contains** subnet |
| **Associated with** | Bidirectional | Peer association | Switch A **associated with** Switch B |

---

## 2. Asset Management

Asset Management revolves around the **full instance lifecycle**, covering the complete chain of creation, modification, import/export, relationship maintenance, detail viewing, and change tracking.

### 2.1 Instance Creation and Maintenance

**Core Purpose**: Provides both single-item precise maintenance and batch efficient operation modes to accommodate different maintenance scenarios.

#### Core Capabilities

*   **Single-item precise maintenance**: Form-based entry following model definitions, real-time field-level validation feedback, suitable for fine-grained management of critical assets
*   **Batch deletion**: Supports batch deletion by selecting instances or by filter conditions, with secondary confirmation before execution
*   **Inline list editing**: Some fields support quick editing directly on the list page without entering the detail page
*   **Automatic organization inheritance**: Instances automatically inherit the model's default organization, with manual adjustment supported

> **UI Guide:**
>
> ![Asset List](https://static.cwoa.net/6c15745c0d35475ea243a7cb3561ec1a.png)
>
> *   **Diagram explanation**: The asset list page has a filter bar at the top supporting multi-condition combination filtering; the left panel shows a model navigation tree for quick switching; the center table displays instance data with adjustable column widths; the top-right corner provides import, export, and batch operation entry points.

---

### 2.2 Import and Export

**Core Purpose**: Enable data exchange between CMDB and external systems, supporting initial migration and periodic inventory.

#### Core Capabilities

*   **Excel batch import**: Auto-generates import templates with automatic field-to-model-attribute mapping, supporting data pre-validation and error prompts
*   **Field-level export control**: Allows selecting export fields on demand, supporting "export display fields only" or "export all fields"
*   **Relationship export and import**: Supports exporting instance relationships along with instances, preserving structural information
*   **Asynchronous large batch processing**: Large-volume import/export uses asynchronous tasks, supporting progress tracking and result downloads

---

### 2.3 Relationship Maintenance

**Core Purpose**: Establish real dependency connections at the instance level, supporting topology analysis and impact assessment.

#### Core Capabilities

*   **Model-based relationship creation**: Instance associations must be based on predefined model relationships, preventing arbitrary connections
*   **Association conflict detection**: Automatically validates mapping constraints (e.g., prompts when 1:n relationship limits are exceeded)
*   **Batch association operations**: Supports establishing the same type of association for multiple instances simultaneously
*   **Cascading removal capability**: Option to synchronously clean up related data when removing associations

---

### 2.4 Instance Details and Topology

**Core Purpose**: Provides a 360-degree view of a single instance, integrating attributes, relationships, and changes in one place.

#### Core Capabilities

*   **Multi-tab organization**: Basic information, relationships, and change records are displayed in separate tabs for clear information structure
*   **Topology visualization**: Real-time rendering based on the graph database, supporting layer-by-layer expansion, node extension, and path tracing
*   **Topology interactive operations**: Supports box selection, drag-and-drop, zoom, node click-through to details, and right-click context menus
*   **Impact scope analysis**: Centered on the target instance, traces dependencies upstream and views dependents downstream

> **UI Guide:**
>
> ![Asset Relationship Topology](https://static.cwoa.net/0ad2e33d02da46659f5c61e1835e694c.png)
>
> *   **Diagram explanation**: The topology view uses a force-directed graph layout, with different models identified by different colors and line thickness reflecting relationship strength. The left toolbar provides layout switching, hierarchy control, image export, and other functions.

---

## 3. Asset View and Full-Text Search

As asset scale grows, **quick location** becomes a core requirement. BlueKing Lite CMDB addresses this through dual entry points: "Global View + Precise Search."

### 3.1 Asset View

**Core Purpose**: Provides a macro overview of assets to help build global awareness.

#### Core Capabilities

*   **Category-level aggregate display**: Summarizes instance counts by model category in a card-based layout for quick overview
*   **Model-level statistics drill-through**: Click a category to expand the model list, showing the instance count for each model
*   **Keyword quick filtering**: Supports real-time filtering by model name to quickly narrow the browsing scope
*   **One-click drill-down to list**: Navigate directly from view cards to the corresponding model's instance list for seamless operations

---

### 3.2 Full-Text Search

**Core Purpose**: Provides cross-model precise search capabilities, supporting complex condition combinations.

#### Core Capabilities

*   **Multi-dimensional keyword matching**: Supports matching across multiple fields including instance name, IP, tags, and attribute values
*   **Model-level result aggregation**: Search results are first grouped and counted by model, then show specific instances, suitable for multi-model environments
*   **Case sensitivity toggle**: Supports exact match scenarios (e.g., case-sensitive identifiers)
*   **Local search history**: Automatically saves recent search records, supporting one-click recall
*   **Search result preview**: Hover over an instance to quickly preview key attributes without navigating to the detail page

> **UI Guide:**
>
> ![Full-Text Search](https://static.cwoa.net/939e5dc090204c37b5c739a9635f6ba1.png)
>
> *   **Diagram explanation**: The full-text search page has a search box and advanced filter entry at the top; the left panel shows model-level statistics (e.g., "Hosts: 12 results," "Databases: 5 results"); the right panel shows instance lists with pagination and sorting; click an instance title to enter the detail page.

---

## 4. Auto Discovery and Collection Tasks

Auto discovery is the core mechanism for maintaining **data freshness**, using 20+ professional plugins to automatically manage K8s, cloud resources, network devices, databases, and other objects.

### 4.1 Collection Objects and Scope

**Core Purpose**: Organize discovery capabilities in a collection object tree to lower the task configuration barrier.

#### Core Capabilities

*   **Six object domains**: Containers (K8s/Docker), virtualization (VMware), network devices (SNMP), databases, cloud platforms, and middleware
*   **Object-level plugin documentation**: Each collection object provides detailed configuration guides and prerequisites
*   **Adaptive driver types**: Protocol collection (Protocol) interfaces with API/SNMP; script collection (Job) executes via SSH/Agent

#### Supported Collection Objects

| Object Domain | Specific Objects | Driver Type | Relationship Recovery |
|---------------|-----------------|-------------|----------------------|
| **Container** | K8s cluster, Docker | Protocol | Cluster -> Namespace -> Workload -> Pod -> Node |
| **Virtualization** | VMware vCenter | Protocol | vCenter -> Cluster -> Host -> VM |
| **Network Devices** | Switches, routers | Protocol | Device -> Interface -> Connection |
| **Database** | MySQL, PostgreSQL, Redis, MongoDB | Protocol | Instance -> Database -> Table |
| **Cloud Platform** | Alibaba Cloud, Tencent Cloud | Protocol | VPC -> Subnet -> Instance -> Security Group |
| **Host** | Linux, Windows | Job | Host -> Process -> Port |
| **Middleware** | Nginx, Kafka, Zookeeper, etc. | Job | Instance |

---

### 4.2 Collection Task Configuration

**Core Purpose**: Provides flexible task orchestration capabilities to accommodate different network environments and security requirements.

#### Core Capabilities

*   **Periodic execution strategy**: Periodic scans to keep data fresh
*   **Multi-dimensional scope control**: Supports defining collection scope by access point, IP range, or instance list
*   **Secure credential management**: Accounts and passwords are encrypted for storage, supporting key pair authentication, with masked API responses
*   **Granular timeout control**: Supports separate configuration for global timeout and per-object timeout to adapt to heterogeneous network environments

---

### 4.3 Execution Results

**Core Purpose**: Provides transparent display of collection results.

#### Core Capabilities

*   **Five-dimensional result summary**: Each task outputs categorized statistics for "Added, Updated, Deleted, Associated, and Exceptions," enabling quick assessment of task impact
*   **Detail data traceability**: Supports viewing formatted structured data and raw collection data
*   **Automatic exception fallback**: Long-running tasks are automatically marked as exceptions, preventing task status from hanging

> **UI Guide:**
>
> ![Collection Task Details](https://static.cwoa.net/3037f896fd0e4d99b21ee9de1cdc95eb.png)
>
> *   **Diagram explanation**: The task detail page shows basic task information and execution status at the top; the center displays the five-dimensional result summary in card format with color-coded numbers (green for added, blue for updated, red for deleted, orange for exceptions); the bottom allows switching between "Instance Details," "Raw Data," and "Execution Logs."

---

### 4.4 Scenario-Specific Deep Discovery

BlueKing Lite CMDB goes beyond collecting object inventories to **recovering object relationships**.

#### K8s Resource Relationship Recovery

*   **Layered resource discovery**: Automatically identifies clusters, namespaces, Deployments, StatefulSets, DaemonSets, Pods, and Nodes
*   **Automatic hierarchy completion**: Namespaces belong to clusters, Pods run on Nodes, Pods belong to workloads
*   **Workload tracing**: Traces back to the parent workload type through ReplicaSets
*   **Service dependency mapping**: Collects Service-to-Pod Label Selector relationships

#### Network Device Topology Discovery

*   **SOID intelligent identification**: Maps device model, brand, and type based on sysObjectID (built-in common vendor signature database)
*   **Interface-level collection**: Collects interface name, IP, MAC, status, speed, and other detailed information
*   **Connection relationship inference**: Combines ARP tables, MAC address tables, and interface information to infer inter-interface connections
*   **Topology visualization**: Generates topology diagrams approximating real network structures

---

## 5. Public Option Library and Personal Settings

### 5.1 Public Option Library

**Core Purpose**: Unified management of enumeration options reused across models, reducing repetitive maintenance costs.

#### Core Capabilities

*   **Cross-model reuse**: Unified management of enumeration values for status, level, environment, type, etc., directly referenced by multiple model attributes
*   **Reference validation**: Automatically checks references before deleting an option library, preventing data anomalies from accidental deletion
*   **Real-time sync refresh**: When an option library is updated, model attributes referencing it are automatically synchronized for consistency
*   **Versioned management**: Option change history is traceable, supporting rollback to historical versions

---

### 5.2 Personal Settings

**Core Purpose**: Supports user-level personalization, allowing different roles to view assets from their most suitable perspective.

#### Core Capabilities

*   **Custom display fields**: Each user can save their preferred list display fields per model
*   **Saved frequent filters**: Supports saving frequently used filter conditions for one-click access
*   **Cross-device sync**: Personal settings are bound to user accounts and automatically restored when logging in from a different device
*   **Role-based views**: Asset administrators focus on structural integrity, operations engineers focus on status and responsible persons, each getting what they need

---

## 6. Data Subscription and Change Notifications

Data subscription upgrades the CMDB from "passive queries" to "proactive push" capabilities.

### 6.1 Subscription Rule Management

**Core Purpose**: Configure subscription rules per model to define "under what circumstances to notify whom."

#### Core Capabilities

*   **Dual-mode instance filtering**: Supports "dynamic filtering by conditions" or "directly specifying instances" to define the scope of interest
*   **Three trigger types**:
    *   **Attribute change**: Triggers when a specified field changes
    *   **Relationship change**: Triggers when associations are added, deleted, or their attributes change
    *   **Expiration reminder**: Triggers when a specified datetime field approaches its deadline (e.g., 30 days before certificate expiration)
*   **Organization-level rule isolation**: Subscription rules are managed by their owning organization; only members of the same organization can operate them

---

### 6.2 Trigger Detection and Event Merging

**Core Purpose**: Intelligent change detection, preventing message flooding.

#### Core Capabilities

*   **Incremental window detection**: Based on ChangeRecord incremental comparison, only detects new changes since the last check
*   **Event merge and noise reduction**: Multiple attribute changes to the same instance are merged into a single notification, with a summary showing all changed fields
*   **Snapshot mechanism**: Maintains rule snapshots to support before/after state comparison for precise change identification
*   **Deduplication key mechanism**: Expiration reminders use "instance + field + date" deduplication keys to avoid duplicate notifications

---

### 6.3 Notification Channels and Recipient Management

**Core Purpose**: Push subscription events to users' preferred work channels.

#### Core Capabilities

*   **Multi-channel notifications**: Supports in-app messages, WeCom (WeChat Work), DingTalk, email, and other notification channels
*   **Flexible recipient configuration**: Can specify specific users, user groups, or roles as recipients
*   **Custom notification templates**: Supports customizing notification content templates including instance information and change details
*   **Notification history query**: View notification delivery records and delivery status

---

## 7. Permission Rules and Change Records

### 7.1 Permission Rules

**Core Purpose**: Organization-based data isolation to ensure multi-team collaboration security.

#### Core Capabilities

*   **Organization-level visibility scope**: Visibility of models, instances, and collection tasks can be configured by organization scope
*   **Object-level operation permissions**: Supports fine-grained operation permission controls including create, edit, delete, and manage
*   **Default organization fallback**: Resources without a specified organization default to the default organization, facilitating platform initialization
*   **Permission inheritance**: Child organizations automatically inherit parent organization permission configurations, reducing repetitive setup

---

### 7.2 Change Records

**Core Purpose**: Full lifecycle auditing to meet compliance requirements and support fault tracing.

#### Core Capabilities

*   **Complete operation audit trail**: Records all operations including instance creation, modification, deletion, and relationship changes
*   **Change detail tracing**: View before/after value comparisons for each change, down to the field level
*   **Time range filtering**: Supports filtering change records by time period for auditing and troubleshooting
*   **Multi-dimensional filtering**: Can filter by operator, operation type, model, instance, and other dimensions
*   **Change export**: Supports exporting change records as audit reports

> **Note / Security Best Practices**
>
> For auto-discovery tasks, it is recommended to:
> 1. Use **Approval Before Write** mode in production environments to prevent erroneous collection from directly entering the ledger
> 2. Periodically review **Change Records**, paying attention to abnormal changes and unauthorized operations
> 3. **Periodically archive** change records for sensitive models to meet long-term audit requirements
