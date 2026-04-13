---
sidebar_position: 1
slug: /analysis
---

# Product Introduction

## 1. Overview

**BlueKing Lite Operations Analytics** is a unified data visualization and operational decision-making workbench designed for lightweight operations scenarios. It integrates multi-source data scattered across CMDB, monitoring, alerting, logging, and business systems into a single analysis space. Through three types of analysis carriers — dashboards, topology diagrams, and architecture diagrams — it helps teams achieve a complete analysis loop from "seeing data" to "understanding relationships, discovering risks, and supporting decisions." Based on the namespace mechanism, Operations Analytics can also connect to NATS data endpoints in different regions. After multi-region BlueKing Lite instances are networked via NATS, the primary region can centrally aggregate and display data from each edge region, forming an analysis capability of "edge autonomy with central visibility."

Unlike traditional reporting tools, BlueKing Lite Operations Analytics focuses more on **long-term accumulation of analysis assets and team collaborative reuse**:

*   **Directory-based Management**: Supports organizing dashboards, topology diagrams, and architecture diagrams in a tree directory structure, allowing analysis results to be systematically accumulated by business domain, topic, and scenario
*   **Multi-source Data Fusion**: A single data source can be associated with multiple namespaces; the platform automatically fetches data in parallel and aggregates the results. Even if individual data sources encounter issues, the overall analysis remains unaffected
*   **Edge Autonomous Networking**: Namespaces can connect to NATS services in different regions. While each regional BlueKing Lite instance maintains local autonomy, the primary region can centrally retrieve and display cross-regional data
*   **Secure and Controlled Sharing**: Combined with fine-grained permission controls and organization-level data isolation, analysis assets can be shared across teams while maintaining controlled access within security boundaries


## 2. Core Advantages

*   **Unified Data Analysis Portal**: Through data source and namespace management capabilities, CMDB, monitoring, alerting, logging, and business APIs are unified into a single workbench, eliminating the fragmented experience of switching between multiple systems
*   **Three Analysis Carriers for Coordinated Expression**: Within the same analysis space, **dashboards** (metric trends), **topology diagrams** (relationship positioning), and **architecture diagrams** (resource structure) are simultaneously supported, covering the complete analysis chain from observation to decision-making
*   **Directory-based Asset Accumulation**: Supports multi-level directory organization of analysis assets, evolving ad-hoc reports into a long-term reusable team knowledge base, preventing analysis results from being scattered across individual pages
*   **Intelligent Data Aggregation Mechanism**: Multi-namespace parallel data fetching with automatic degradation for single-point failures; requests automatically carry user and team context to ensure consistent data permission semantics
*   **Edge Autonomy with Central Aggregation**: By binding namespaces to different regional NATS services, the primary region can centrally retrieve and display multi-regional data without disrupting independent operation of each edge region
*   **Enterprise-grade Secure Access**: Namespaces support TLS encrypted connections and AES-encrypted password storage, meeting enterprise data security and compliance requirements
*   **Out-of-the-box Built-in Capabilities**: The system comes with pre-configured data source tags for CMDB, alerting, monitoring, logging, business, etc., and commonly used data templates, lowering the barrier to first-time use

## 3. Core Capability Overview

### 1. Directory-based Analysis Workbench

Adopts a classic dual-pane layout with a directory tree on the left and content area on the right, providing unified management of four types of analysis objects: **directories, dashboards, topology diagrams, and architecture diagrams**. Supports building up to **3 levels** of directory structure organized by business system, operations topic, or governance objective, giving analysis content clear ownership relationships for team collaboration and asset reuse.

### 2. Dashboards for Metric Observation

Based on a grid free-layout combining multiple visualization components, supporting chart types including **line charts, bar charts, pie charts, and single-value charts**. Through a global time selector and common filter conditions, multiple components can be driven to refresh in sync, making it suitable for daily inspections, topic-based operations, and trend comparisons.

### 3. Topology Diagrams for Relationship Positioning

Provides a visual canvas for expressing object relationships, dependency chains, and node status. Supports multiple node types including **icon nodes, basic shapes, text nodes, single-value nodes, and chart nodes**, with configurable connections, labels, and styles. Node-level data binding and timed refresh are also supported, upgrading topology diagrams from static structural views to dynamic status observation canvases.

### 4. Architecture Diagrams for Resource Expression

Specifically designed for system architecture presentation, resource inventory, and change communication. Supports platform resources, CMDB icons, and multiple cloud resource icons, allowing views, colors, and structural layers to be organized on a single canvas, helping both technical and non-technical roles quickly build shared understanding.

### 5. Flexible Data Source and Namespace Management

*   **Data Source Management**: Define REST API data retrieval paths, parameter templates (supporting string, number, boolean, date, and time range types), available chart types, and data source tags
*   **Namespace Management**: Maintain connection addresses, accounts, TLS settings, and other connection information, with support for encrypted password storage and lifecycle management
*   **One-to-many Association**: A single data source can be associated with multiple namespaces, enabling unified analysis across environments and domains

> **Note:**
> Operations Analytics is best suited for the role of "unified observation, relationship expression, topic-based review, and decision support." For ultra-large-scale real-time computation or complex algorithmic modeling scenarios, it is recommended to use dedicated data platforms in conjunction.

## 4. Typical Use Cases

### 1. Operations Overview

Integrate resource changes, alert trends, service status, and key business metrics into a unified workbench. Use dashboards to centrally present key metrics and topology diagrams to display object relationships, helping on-duty personnel and management build consistent understanding within the same view and quickly grasp overall system health.

### 2. Fault Impact Scope Identification

When a core service experiences an anomaly, a single metric often cannot explain the impact scope. By combining single-value nodes and chart nodes in topology diagrams, responders can intuitively see anomalous nodes, upstream/downstream dependencies, and associated status changes, helping determine whether the fault is a localized fluctuation or a chain-level impact, thereby reducing MTTR.

### 3. Architecture Inventory and Change Communication

Consolidate architecture information scattered across documents, spreadsheets, and mind maps into maintainable architecture diagrams. This facilitates technical team reviews of resource relationships and enables reporting of system structure and change impact boundaries to non-development roles, improving cross-team collaboration efficiency.

### 4. Team Analysis Asset Accumulation

Through directory-based organization and permission controls, progressively accumulate routine inspection dashboards, topic analysis pages, and architecture comparison diagrams as team public assets, forming an inheritable, reusable, and continuously optimizable operations analysis system that prevents knowledge loss due to personnel changes.

## 5. Why Choose BlueKing Lite Operations Analytics

| Dimension | Traditional Reporting Tools | BlueKing Lite Operations Analytics |
|-----------|---------------------------|-----------------------------------|
| **Data Integration** | Single-source data display | Multi-namespace aggregation with permission context in requests |
| **Analysis Expression** | Single chart type | Dashboard + Topology + Architecture, covering diverse scenarios |
| **Asset Management** | Scattered across individual pages | Directory-based organization with 3-level hierarchy |
| **Collaborative Sharing** | Coarse-grained permission controls | Fine-grained operation permissions + organization-level data isolation |
| **Secure Access** | Basic connectivity | TLS encryption + encrypted password storage + enable/disable management |

For teams looking to quickly establish a unified operations analysis portal, or those with multiple data systems but lacking a unified expression method, BlueKing Lite Operations Analytics provides a **ready-to-use, continuously evolving** lightweight solution. It is not an isolated dashboard page, but rather an operations analysis workbench that can grow alongside your team.
