---
sidebar_position: 3
---

# Feature Guide

## 1. Analysis View

The Analysis View is the main workbench of Operations Analytics, adopting a **left directory tree + right content area** dual-pane layout, responsible for hosting directory management, analysis object switching, and specific content display. Compared to single-page reporting tools, BlueKing Lite Operations Analytics emphasizes "asset-oriented management," enabling teams to continuously accumulate reusable analysis assets around business scenarios.

### 1.1 Directory and Analysis Asset Management

#### Core Purpose

Directories serve as the organizational carrier for analysis assets, determining how teams accumulate content, share pages, and transform ad-hoc analyses into long-term reusable assets. The platform uses a tree directory to uniformly manage four types of objects: **directories, dashboards, topology diagrams, and architecture diagrams**, supporting multi-level structures for organization by business domain, topic, or responsibility scope.

#### Core Capabilities

*   **Unified Tree Organization**: Manage all four types of analysis objects in a single directory tree, preventing content from being scattered across isolated pages
*   **Three-level Hierarchy Constraint**: Directory hierarchy is limited to 3 levels, balancing flexibility and maintainability
*   **Same-parent Uniqueness**: Directory names must be unique within the same parent directory, preventing search difficulties caused by naming conflicts
*   **In-place Creation and Maintenance**: Supports creating, editing, and deleting directories and analysis objects directly in the directory tree, reducing page switching overhead
*   **Deletion Protection Mechanism**: Directories cannot be directly deleted when they contain child objects, preventing accidental destruction of accumulated analysis structures
*   **Unsaved Changes Reminder**: When switching analysis objects or leaving a page, the system prompts for confirmation of unsaved changes to prevent loss of editing work
*   **Enable/Disable Control**: Directories support status management; when disabled, they are not displayed in the directory tree, facilitating soft deletion and archiving

> **UI Guide:**
>
> It is recommended to add a screenshot of the "Directory Tree and Content Area" showing the left directory tree, right content area, and the switching relationship between dashboards, topology diagrams, and architecture diagrams.
>
> *   **Diagram explanation**: The directory tree is not simply a navigation bar, but the management entry point for analysis assets. Through directory hierarchy and permission configuration, team-level accumulation and controlled sharing of analysis results are achieved.

---

### 1.2 Dashboards

#### Core Purpose

Dashboards are the core carrier for **metric observation**, suitable for hosting resource overviews, trend comparisons, topic-based observations, and similar scenarios. Based on grid layout with free combination of multiple visualization components, dashboards are the most suitable display format in Operations Analytics for daily inspections and operational overviews.

#### Core Capabilities

*   **Grid-based Free Layout**: Supports drag-and-drop adjustment of component positions and sizes for flexible page structure organization
*   **Multiple Chart Types**:
    *   **Line Charts**: Suitable for trend observation and time-series comparison
    *   **Bar Charts**: Suitable for category comparison and ranking display
    *   **Pie Charts**: Suitable for proportion analysis and composition display
    *   **Single-value Charts**: Suitable for key metric and core status display
*   **Global Time-driven**: When a page contains time-type parameters, a top-level global time selector can uniformly drive multiple components to refresh in sync, facilitating cross-metric horizontal comparison
*   **Data Source Template Reuse**: When configuring components, parameter templates defined in data sources can be reused, automatically identifying fixed values, editable values, and other parameter types to reduce repetitive configuration overhead
*   **Common Filter Conditions**: Supports configuring page-level common filters that uniformly apply to multiple components on the page
*   **Save and Manual Refresh**: Supports persistent page configuration saving and manual refresh triggering, suitable for shift inspections and topic review scenarios

> **UI Guide:**
>
> It is recommended to add a screenshot of the "Dashboard Edit Page" showing the grid layout, component configuration panel, and global time selector area.
>
> *   **Diagram explanation**: The value of dashboards lies in organizing scattered metrics into a readable operational view. Through timeline alignment and layout arrangement, users can quickly build macro-level awareness of system status.

---

### 1.3 Topology Diagrams

#### Core Purpose

Topology diagrams are the core carrier for **relationship positioning**, used to express connection relationships, dependency chains, and status distribution between objects. When issues are not just reflected in numerical changes but also require understanding "where the problem is, who it relates to, and how large the impact scope is," topology diagrams are more helpful than pure numeric dashboards in building problem context for responders.

#### Core Capabilities

*   **Five Node Types for Flexible Arrangement**:
    *   **Icon Nodes**: Use preset icons to represent resource types
    *   **Basic Shapes**: Rectangles, circles, and other geometric shapes to represent abstract nodes
    *   **Text Nodes**: Plain text descriptions and annotations
    *   **Single-value Nodes**: Bind data sources to display key metric values with threshold-based coloring
    *   **Chart Nodes**: Embed mini charts within nodes to display trend changes
*   **Connection and Label Expression**: Supports configuring directed/undirected edges, edge labels, and line styles for describing upstream/downstream dependencies, network paths, or logical relationships
*   **Node-level Data Binding**: Single-value nodes and chart nodes can bind data sources, giving topology diagrams dynamic status expression capabilities
*   **Timed Auto-refresh**: Supports configuring refresh frequency (e.g., 30 seconds, 1 minute) to keep critical statuses continuously updated
*   **Editing Assistance Tools**:
    *   **Zoom and Fit Canvas**: Supports zoom in/out and one-click fit to visible area
    *   **Undo/Redo**: Editing operations can be rolled back, reducing the cost of mistakes
    *   **Minimap Navigation**: Canvas thumbnail assists with positioning, facilitating quick navigation in large diagrams
    *   **Context Menu**: Right-click menus on nodes and canvas provide shortcut operations

> **UI Guide:**
>
> It is recommended to add a screenshot of the "Topology Diagram Edit Page" showing the left node toolbar, center canvas area, and right property editing panel.
>
> *   **Diagram explanation**: The core value of topology diagrams is "structure and status visible on the same screen." Through the combination of nodes, connections, and data binding, information that would otherwise require multiple charts is condensed into a single canvas.

---

### 1.4 Architecture Diagrams

#### Core Purpose

Architecture diagrams are a dedicated carrier for **resource structure expression**, suitable for system architecture presentation, resource inventory, solution reviews, and structural comparisons before and after changes. Unlike topology diagrams that focus on dynamic relationships, architecture diagrams focus on clear expression of static resource structures.

#### Core Capabilities

*   **Multi-resource Icon System**:
    *   **Platform Resource Icons**: BlueKing Lite built-in platform component icons
    *   **CMDB Icon Library**: Resource icons linked with configuration management
    *   **Cloud Resource Icons**: Supports icons for AWS, Alibaba Cloud, Tencent Cloud, and other cloud resources
*   **Unified Canvas Arrangement**: Organize views, icons, colors, and structural layers on a single canvas, supporting layered display of different resource types
*   **Structure Cloning and Reuse**: Architecture diagram configurations can be saved as templates for quick copying and adaptation in similar scenarios
*   **Cross-role Communication Friendly**: Graphical expression lowers the understanding barrier, suitable for technical reviews, management reports, and other scenarios requiring multi-party collaboration
*   **Version-based Maintenance**: Architecture diagrams can be continuously maintained and updated as long-term assets, avoiding the need to redraw from scratch for each review

> **UI Guide:**
>
> It is recommended to add a screenshot of the "Architecture Diagram Edit Page" showing the icon library, canvas arrangement area, and property configuration panel.
>
> *   **Diagram explanation**: Architecture diagrams help teams transform "architecture in their minds" into "visible blueprints," serving as an effective communication tool for technical debt inventory, cloud migration planning, architecture reviews, and similar scenarios.

---

## 2. Settings Center

The Settings Center manages the underlying connectivity capabilities of Operations Analytics, determining what data pages can connect to, how they connect, and who can use them. It is not an ancillary configuration page, but rather the foundation for the usability and reusability of the entire analysis workbench.

### 2.1 Data Source Management

#### Core Purpose

Data source management addresses the questions of "where data comes from, how it is reused, and what display method is appropriate." It consolidates data retrieval paths, parameter templates, tag classification, chart types, and team ownership into a single configuration entry point, serving as a prerequisite for standardized analysis assets.

#### Core Capabilities

*   **Unified REST API Access**: By defining REST API paths, internal capabilities such as CMDB, monitoring, alerting, and logging are accessed in a consistent manner
*   **Multi-namespace Association**: A single data source can be associated with multiple namespaces, enabling cross-environment and cross-domain data retrieval with unified summary display
*   **Parameter Template Configuration**: Supports five parameter types:
    *   **String**: Text-based filter conditions
    *   **Number**: Numeric parameters
    *   **Boolean**: Toggle-type parameters
    *   **Date**: Date picker
    *   **Time Range**: Time period selector, commonly used for global time-driven scenarios
*   **Parameter Value Types**: Supports **fixed values** (non-editable) and **editable values** (user-adjustable) modes
*   **Chart Type Constraints**: Available chart types can be specified for data sources (`line`, `bar`, `pie`, `single`), helping page designers quickly select appropriate display methods
*   **Tag-based Governance**: Supports associating multiple data source tags (e.g., CMDB, monitoring, alerting, logging, business, other) for subsequent retrieval, filtering, and permission control
*   **Team Ownership Control**: Team ownership can be configured for data sources, enabling organization-level data visibility isolation
*   **Enable Status Management**: Supports enable/disable toggling; when disabled, the data source cannot be selected for new components but does not affect previously configured components

> **UI Guide:**
>
> It is recommended to add a screenshot of the "Data Source List and Edit Drawer" showing the name, REST API, namespace association, tag selection, chart type checkboxes, and parameter template configuration areas.
>
> *   **Diagram explanation**: The essence of the data source page is consolidating scattered API capabilities into standardized analysis assets. The more standardized the configuration, the lower the reuse cost for subsequent dashboards and canvases.

---

### 2.2 Namespace Management

#### Core Purpose

Namespace management maintains the connection context for external data environments, addressing the question of "through what connection method does the platform access external data capabilities." Each namespace represents an independent data environment, such as data endpoints for different clusters, regions, or business lines.

#### Core Capabilities

*   **Centralized Connection Information Maintenance**: Centrally manage namespace names, NATS namespaces (message topic prefixes), accounts, passwords, and domain information
*   **TLS Secure Connection**: Supports enabling TLS at the namespace level (`tls://` protocol), meeting enterprise-grade network security requirements
*   **Encrypted Password Storage**: Namespace passwords are automatically AES-encrypted upon saving; plaintext is never stored in the database, reducing the risk of leakage
*   **Dynamic Protocol Adaptation**: The system automatically selects `nats://` or `tls://` protocol to construct the connection URL based on the `enable_tls` field
*   **Connection Fault Tolerance**: A connection failure in a single namespace does not block data returns from other namespaces, ensuring analysis page availability
*   **Lifecycle Management**: Supports creation, editing, deletion, and enable/disable status management for continuous maintenance of data access links
*   **Multi-data Source Reuse**: Once namespace configuration is complete, it can be reused by multiple data sources, reducing repetitive configuration

> **UI Guide:**
>
> It is recommended to add a screenshot of the "Namespace List and Edit Drawer" showing configuration items including name, NATS namespace, account, password, domain, and TLS toggle.
>
> *   **Diagram explanation**: Namespaces serve as the security gateway for data access. TLS support and password encryption mechanisms ensure secure access to internal data capabilities even in external network environments.

---
