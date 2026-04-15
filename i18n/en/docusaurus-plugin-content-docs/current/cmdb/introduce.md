---
sidebar_position: 1
slug: /cmdb
---

# Product Introduction

## 1. Overview

BlueKing Lite CMDB is an **intelligent configuration management database** built for the cloud-native era. With a core architecture driven by **graph database-powered relationship modeling**, it helps enterprises build full-stack asset digital twins spanning from infrastructure to application services. Unlike the traditional "spreadsheet ledger" approach of conventional CMDBs, BlueKing Lite CMDB treats assets as **living data entities** -- continuously sensing environmental changes through automatic discovery, visually presenting system architecture through topology relationships, and proactively pushing critical changes through intelligent subscriptions -- upgrading asset management from "static recording" to "dynamic governance."

### Value Proposition

| Role | Core Pain Point | BlueKing Lite CMDB |
|------|----------------|---------------------|
| **Asset Administrator** | Inconsistent asset definitions, difficulty enforcing model standards | Visual modeling tools + model duplication, rapidly establish enterprise-level asset standards |
| **Operations Engineer** | Slow fault localization, difficulty assessing impact scope | Topology visualization + change tracking, pinpoint root causes in minutes |
| **Platform Architect** | Scattered hybrid cloud assets, inconsistent data | 20+ collection plugins + automatic discovery, unified management of K8s/cloud/virtualization/network devices |
| **Security Compliance Officer** | No audit trail for asset changes, difficult auditing | Full lifecycle change records + subscription notifications, meeting compliance audit requirements |

---

## 2. Core Advantages

### Graph Database Native Architecture

BlueKing Lite CMDB uses **FalkorDB graph database** as its underlying storage for asset relationships. Compared to traditional relational databases:

*   **Efficient multi-hop relationship queries**: Device-interface-connection-peer device, millisecond-level response for topology queries across 4+ layers
*   **Dynamic relationship modeling**: No need to predefine foreign keys; model relationships can be flexibly adjusted as business evolves
*   **Parameterized CQL query engine**: Built-in CQL injection protection with parameterized queries, balancing flexibility and security

### Intelligent Discovery and Continuous Synchronization

The platform includes **20+ professional collection plugins** covering six major domains: containers, cloud-native, virtualization, networking, databases, and middleware:

*   **K8s panoramic discovery**: Automatically identifies the 5-layer topology of cluster -> namespace -> workload -> Pod -> node
*   **Intelligent network device identification**: Precisely identifies device model, brand, and type based on SOID (sysObjectID) signature database
*   **Automatic relationship recovery**: Automatically infers and completes network device interface connections and virtual machine-to-host relationships

### Enterprise-Grade Security and Compliance

*   **Encrypted credential storage**: Task credentials are AES-encrypted before storage; API responses are uniformly masked
*   **Organization-level permission isolation**: Models, instances, and collection tasks are controlled by organization scope, enabling secure multi-team collaboration
*   **Full lifecycle auditing**: Complete audit trail for instance creation, modification, deletion, and relationship changes, with detailed change tracking

### Data Subscription and Proactive Notification

Breaking through the traditional CMDB's "passive query" model, supporting **proactive data subscriptions**:

*   **Three types of triggers**: Attribute changes, relationship changes, and expiration reminders
*   **Merge and noise reduction**: Multiple attribute changes to the same instance are consolidated into a single notification, preventing message flooding

### Lightweight Deployment and Rapid Expansion

*   **Model duplication acceleration**: One-click duplication of model attributes, field groups, and relationship configurations; standard model reuse in minutes
*   **Public option library**: Enumeration values such as status, level, and category are maintained uniformly across models, with automatic synchronization on changes
*   **Multi-language out of the box**: Built-in Chinese and English language packs

---

## 3. Typical Use Cases

### Scenario 1: Unified Hybrid Cloud Asset Management

**Challenge**: An enterprise simultaneously uses Alibaba Cloud, Tencent Cloud, private cloud K8s, and VMware, with assets scattered across various platform consoles and no unified view.

**BlueKing Lite CMDB Solution**:
1.  Configure cloud vendor collection tasks to automatically sync ECS, VPC, RDS, and other resources
2.  Configure K8s cluster access to automatically discover container resources and node relationships
3.  Configure VMware collection to sync virtualization assets
4.  Use "Asset View" for a cross-cloud asset overview, and "Full-Text Search" for instant instance lookup

**Benefits**: Asset inventory time reduced from days to minutes, with cross-cloud dependencies clearly visible.

### Scenario 2: Rapid Fault Localization and Impact Analysis

**Challenge**: A core service alert requires quickly determining "which downstream services are affected" and "whether there have been recent changes."

**BlueKing Lite CMDB Solution**:
1.  Enter the service name in "Full-Text Search" to locate the target instance
2.  Open the "Topology View" and expand upstream/downstream dependency chains layer by layer
3.  Check "Change Records" to confirm whether there were recent configuration adjustments or auto-discovery writes
4.  For ongoing monitoring, configure "Data Subscriptions" for automatic push notifications on future changes

**Benefits**: Mean Time to Recovery (MTTR) reduced by over 60%.

### Scenario 3: Asset Configuration Standardization

**Challenge**: Different business units maintain their own Excel ledgers with inconsistent field definitions and poor data quality.

**BlueKing Lite CMDB Solution**:
1.  Define enterprise-level asset standards in "Model Management" (fields, enumerations, constraints)
2.  Use "Model Duplication" to quickly replicate standard models for each business unit
3.  Use the "Public Option Library" to unify enumeration values for status, environment, responsible person, etc.
4.  Optimize display structure through "Field Groups" to improve data entry experience
5.  Migrate historical data quickly through "Batch Import"

**Benefits**: Improved asset data consistency and significantly enhanced cross-department collaboration efficiency.

### Scenario 4: Security Compliance and Audit Support

**Challenge**: Compliance regulations require traceable asset changes, but traditional methods lack effective tools.

**BlueKing Lite CMDB Solution**:
1.  Enable "Change Records" to automatically log all instance changes (operator, timestamp, before/after values)
2.  Configure "Data Subscriptions" for sensitive assets to notify the security team of critical changes in real time
3.  Enable "Approval Before Write" for collection tasks to prevent unauthorized data from entering the ledger
4.  Periodically export change records to meet compliance audit requirements

**Benefits**: Audit preparation time reduced from weeks to hours.

---

## 4. Feature Overview

| Feature Domain | Core Capabilities | Technical Highlights |
|----------------|-------------------|----------------------|
| **Model Management** | Category management, model definition, attribute configuration, field groups, relationship definition | Model duplication, public option library snapshot sync, automatic display field generation |
| **Asset Management** | Instance CRUD, batch import/export, relationship maintenance, topology display | Table-type field support, dual-view relationship list and topology, change tracking |
| **Asset View** | Category summary, model statistics, quick navigation | Card-based layout, real-time counting, search filtering |
| **Full-Text Search** | Cross-model search, group statistics, search history | Case sensitivity control, paginated loading, instance detail preview |
| **Auto Discovery** | Collection object tree, task management, result summary, approval-based write | 20+ plugins, credential encryption, structured summary, exception fallback |
| **Data Subscription** | Rule configuration, trigger management, recipients, notification channels | Three trigger types, event merging, snapshot mechanism |
| **Personal Settings** | Display fields, saved filter conditions | User-level personalization, cross-session persistence |

---

## 5. Why Choose BlueKing Lite CMDB

### Compared to Traditional CMDBs

| Dimension | Traditional CMDB | BlueKing Lite CMDB |
|-----------|-----------------|--------------|
| **Data Model** | Relational database, rigid table structure | Graph database, relationships as data, flexible extension |
| **Data Timeliness** | Relies on manual maintenance, data quickly becomes stale | Auto discovery with continuous sync, fresh and trustworthy data |
| **Relationship Expression** | Foreign key associations, limited query depth | Graph traversal queries, efficient multi-hop analysis |
| **Usage Model** | Passive queries, people search for data | Proactive subscriptions, data finds people |
| **Deployment Cost** | Long implementation cycles, extensive customization | Out-of-the-box, lightweight start |

### Compared to Open Source Solutions

| Dimension | Open Source CMDB | BlueKing Lite CMDB |
|-----------|-----------------|--------------|
| **Out-of-the-box Capability** | Requires secondary development of collection plugins | 20+ plugins ready to use |
| **Topology Display** | Basic display, limited interaction | Layered expansion, node extension, impact analysis |
| **Multi-tenancy** | Self-implemented | Built-in organization-level isolation |
| **Data Subscription** | None or requires additional development | Built-in three trigger types, event-driven |
| **Commercial Support** | Community support | Professional team support |

---

## 6. Quick Start Path

![Gemini_Generated_Image_37rj4737rj4737rj.png](https://static.cwoa.net/4f2d4a04a4d54742b61a6a57f7cf5d0a.png)

---

## 7. Technical Specifications

| Specification | Details |
|--------------|---------|
| **Supported Asset Types** | Hosts, containers, virtual machines, network devices, databases, middleware, cloud resources |
| **Collection Protocols** | SNMP, SSH, Kubernetes API, vSphere SDK, cloud vendor OpenAPI |
| **Graph Database** | FalkorDB (evolved from RedisGraph) |
| **Attribute Types** | String, integer, enumeration, datetime, user, organization, boolean, password, tag, table |
| **Relationship Types** | Belongs to, composed of, runs on, installed on, contains, associated with |
| **Subscription Triggers** | Attribute change, relationship change, expiration reminder |
| **Multi-language Support** | Chinese, English (extensible) |
