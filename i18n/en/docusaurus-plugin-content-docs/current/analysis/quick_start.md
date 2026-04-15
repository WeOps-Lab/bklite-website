---
sidebar_position: 2
---

# Quick Start

## 1. Prerequisites

Before using BlueKing Lite Operations Analytics, it is recommended to confirm the following preparations:

*   **Platform Account and Permissions**: You have an account that can access the BlueKing Lite platform and have viewing permissions for the Operations Analytics module. To create analysis assets, you need to apply for additional permissions for directories, dashboards, or data sources.
*   **Built-in Data Environment**: The platform has already initialized built-in namespaces and data source tags (CMDB, Alerting, Monitoring, Logging, Business, Other) by default. Regular users can use them out of the box without additional configuration.
*   **Clear Analysis Objectives**: It is recommended to clarify the analysis scenario you wish to verify in advance, for example:
    *   Resource overview (use dashboards to display host and application counts)
    *   Trend analysis (use line charts to display alert trends)
    *   Relationship positioning (use topology diagrams to display service dependencies)
    *   Architecture expression (use architecture diagrams to display system structure)
*   **Team Ownership Confirmation**: Confirm which teams should have access to the analysis assets for subsequent ownership scope configuration.

> **Note:**
> Operations Analytics provides built-in data sources and namespaces that can be used directly by default. **Regular users do not need to enter the settings page to adjust underlying configurations**; only when built-in capabilities cannot meet business requirements should administrators supplement or modify the relevant configurations.

---

## 2. Step 1: Plan Directories and Create Analysis Assets

**Navigation Path**: View → Left Directory Tree → "+" Button or Right-click Menu

After entering Operations Analytics, it is recommended to first plan the directory structure on the view page, then create specific analysis objects. A well-planned directory structure is the foundation for subsequent asset accumulation and team collaboration.

### 2.1 Recommended Directory Organization

| Organization Dimension | Example | Applicable Scenario |
|----------------------|---------|-------------------|
| **By Business Domain** | E-commerce / Payments / Fulfillment / Infrastructure | Multi-business line independent operations |
| **By Analysis Topic** | Stability Overview / Capacity Management / Alert Review / Architecture Inventory | Topic-based operations analysis |
| **By Team Responsibility** | Platform Operations / Business Operations / SRE / Security | Clear responsibility boundaries |

### 2.2 Steps to Create a Directory

1. Right-click on an empty area in the left directory tree or on a target directory on the view page, and select "New Directory"
2. Enter the directory name (names cannot be duplicated within the same parent directory)
3. Enter description information (optional, recommended for understanding the directory purpose later)
4. Click Save to complete the directory creation

### 2.3 Directory Planning Notes

*   **Hierarchy Control**: Directory hierarchy is limited to 3 levels; plan carefully to avoid excessive nesting
*   **Naming Convention**: It is recommended to use the format "BusinessDomain_Scenario" or "Team_Topic," such as "Ecommerce_StabilityOverview"
*   **Directories vs. Analysis Objects**: Directories are suitable for long-term analysis topics; do not solidify one-time tasks as independent hierarchy levels
*   **Deletion Protection**: Directories containing sub-directories or analysis objects cannot be directly deleted; content must be cleared first

> **UI Guide:**
>
> It is recommended to add a screenshot of the "View Page Directory Tree" showing the left directory tree, creation entry point, and right-click menu.
>
> *   **Diagram explanation**: The directory tree is the organizational entry point for team analysis assets. Plan the directory structure clearly first, and subsequently added dashboards, topology diagrams, and architecture diagrams will be easier to reuse and accumulate.

---

## 3. Step 2: Create Your First Analysis Object

**Navigation Path**: View → Select Target Directory → Click "New Dashboard" / "New Topology Diagram" / "New Architecture Diagram"

For first-time verification, it is recommended to **start with a dashboard**, as it is the most suitable for quickly confirming whether built-in data sources meet current analysis needs. If your goal is to express dependency relationships or system architecture, you can start directly with a topology diagram or architecture diagram.

### 3.1 Create a Dashboard (Recommended First Choice)

#### Steps

1. **Enter the Creation Page**: Click "New Dashboard" on the target directory, fill in the name and description, then enter the editing page
2. **Add the First Component**:
    *   Click "Add Component" in the canvas area
    *   Select a data source in the component configuration panel (it is recommended to prioritize built-in data sources)
    *   The system will automatically load the parameter template configured for that data source
3. **Configure Parameters**:
    *   Fill in necessary filter items based on the data source template (such as time range, object scope)
    *   Fixed value parameters are automatically populated; editable parameters need to be manually selected or entered
4. **Select Chart Type**: Choose the appropriate chart based on data characteristics:
    *   **Line Chart**: Trend data (e.g., alert count over time)
    *   **Bar Chart**: Category comparison data (e.g., host count by business line)
    *   **Pie Chart**: Proportion data (e.g., alert level distribution)
    *   **Single-value Chart**: Key metrics (e.g., total host count, unrecovered alert count)
5. **Adjust Layout**: Drag components to adjust position and size, organizing into a readable page structure
6. **Save the Page**: Click the "Save" button at the top to complete the first dashboard creation

#### Configuration Tips

*   **Prioritize Built-in Data Sources**: The platform comes with pre-configured common data sources for CMDB, monitoring, alerting, etc., requiring no setup from scratch
*   **Control Page Complexity**: For the first page, it is recommended to create a "minimum viable version" first, verify data correctness, and then gradually enrich
*   **Enable Global Time**: If the page contains multiple time-based components, it is recommended to enable the global time selector for unified filtering

> **UI Guide:**
>
> It is recommended to add a screenshot of "New Dashboard" showing the component configuration panel, data source selection, parameter entry, and chart type selection.
>
> *   **Diagram explanation**: The focus during the quick start phase is not building the foundation, but using existing capabilities to create the first usable page and verify whether the platform can support the team's current analysis expression needs.

---

### 3.2 Create a Topology Diagram

#### Applicable Scenarios

*   Display call relationships between services
*   Express network topology structures
*   Locate fault impact scope
*   Display alert propagation paths within a system

#### Steps

1. **Enter the Creation Page**: Click "New Topology Diagram" on the target directory, fill in the name and description, then enter the canvas editing page
2. **Add Core Nodes**:
    *   Drag "Icon Nodes" from the left toolbar to the canvas to represent key services or resources
    *   Use "Text Nodes" to add descriptive text
3. **Establish Connection Relationships**:
    *   Select a node, click on a connection point and drag to the target node to create a connection line
    *   Double-click a connection line to add a label (such as call relationship, latency value)
4. **Bind Status Data** (Optional):
    *   Add "Single-value Nodes" or "Chart Nodes"
    *   Bind data sources in the property panel and configure threshold coloring
    *   Set refresh frequency to keep node status updated periodically
5. **Optimize Layout**:
    *   Use the "Fit Canvas" button to adjust the overall visible area
    *   Use "Undo/Redo" to adjust unsatisfactory operations
6. **Save the Page**: Click the "Save" button at the top

#### Configuration Tips

*   **Start with the Minimum Viable Diagram**: For the first version, only place core nodes (such as gateway, core services, database), then expand after verifying the approach
*   **Use Labels Effectively**: Add labels on connection lines to describe relationship types, improving diagram readability
*   **Focus on Dynamic Nodes**: Bind single-value data sources to nodes that need critical monitoring, using colors to distinguish health status

---

### 3.3 Create an Architecture Diagram

#### Applicable Scenarios

*   System architecture reviews and presentations
*   Resource inventory and cloud migration planning
*   Technical debt assessment
*   Cross-team technical solution communication

#### Steps

1. **Enter the Creation Page**: Click "New Architecture Diagram" on the target directory, fill in the name and description, then enter the canvas editing page
2. **Select the Icon System**:
    *   Choose appropriate icons from the left icon library (cloud resources, platform components, CMDB resources, etc.)
    *   Drag them to the canvas and adjust positions
3. **Organize Layer Structure**:
    *   Use "Basic Shapes" to draw layer boundaries (such as network layer, application layer, data layer)
    *   Differentiate environments through colors (e.g., red for production, green for testing)
4. **Add Descriptive Elements**:
    *   Use "Text Nodes" to add layer descriptions and notes
    *   Use connection lines and labels to express relationships between components
5. **Save the Page**: Click the "Save" button at the top

#### Configuration Tips

*   **Define the Expression Goal First**: Clarify whether to present "logical architecture" or "physical deployment" to avoid a single diagram carrying too many objectives
*   **Standardize Icon Usage**: Use the same icon for the same type of resource to ensure consistency within the team
*   **Layered Display**: For cross-cloud and cross-platform scenarios, layered display is recommended to avoid information overload on a single screen

> **UI Guide:**
>
> It is recommended to add a screenshot of the "View Page" showing the left directory tree, right content area, and the switching relationship between dashboards, topology diagrams, and architecture diagrams.
>
> *   **Diagram explanation**: The view page is the main workbench for Operations Analytics. The left side is responsible for organizing assets, and the right side is responsible for editing and viewing content. Together they form a truly reusable analysis space.

---

## 4. Step 3: Save and Verify Analysis Results

**Navigation Path**: View → Current Analysis Object → Save → Switch to View Mode for Verification

After completing component or canvas configuration, save promptly and verify results to confirm whether the page already has team sharing value.

### 4.1 Pre-save Checklist

| Check Item | Check Content | Pass Criteria |
|-----------|--------------|--------------|
| **Data Source** | Is the data source bound to the component correct? | Data comes from the expected built-in or custom data source |
| **Data Accuracy** | Do the returned results match the analysis objective? | Values and trends are consistent with expectations |
| **Chart Suitability** | Is the chart type appropriate for the current data? | Trends use line charts, comparisons use bar charts, proportions use pie charts |
| **Parameter Generality** | Is the parameter configuration sufficiently general? | Other users can take over without needing to re-understand the underlying logic |
| **Naming Clarity** | Are the directory, page, and component names clear? | The purpose can be understood from the name alone without additional explanation |
| **Permission Reasonability** | Are team ownership and permissions set reasonably? | Those who should see it can; those who should not cannot |

### 4.2 Verification and Iteration

1. **Data Verification**: Switch between different time ranges and filter conditions to confirm normal data responses
2. **Permission Verification**: Switch to another team member's account (or consult an administrator) to confirm the visibility scope meets expectations
3. **Scenario Verification**: Invite colleagues to review together, collect feedback, and iterate
4. **Ongoing Maintenance**: Assign maintenance owners for key pages to ensure long-term availability of analysis assets

---

## 5. Result Verification and Closure Recommendations

After completing the above steps, it is recommended to confirm a complete loop using the following methods:

*   **Asset Accumulation Verification**: On the view page, confirm that the directory structure and analysis objects have been successfully saved and can be browsed normally in the directory tree
*   **Data Query Verification**: On the page, confirm that data source results are stable and that filter conditions and time ranges work properly
*   **Permission Boundary Verification**: Switch to another team member's perspective to confirm the page sharing boundary meets expectations
*   **Scenario Implementation Verification**: Use the first dashboard or canvas in a real operations scenario (such as shift inspection or fault review) rather than stopping at a one-time verification page

### Advanced Optimization Recommendations

If the first analysis object has been verified as usable, the following optimizations are recommended:

*   **Establish Naming Conventions**: Create unified directory naming conventions for high-frequency analysis scenarios, such as "BusinessDomain_Scenario_Perspective"
*   **Assign Maintenance Owners**: Designate maintenance owners for key pages to periodically update data scope and display logic
*   **Accumulate Templates**: Save common analysis patterns as team templates for quick copying to create similar pages
*   **Tiered Permissions**: Refine permission configurations based on team division of labor, such as business teams only being able to view business domain analysis assets

---

## 6. Administrator Extension Guide

In most scenarios, regular users can directly use the platform's built-in data sources and namespaces. **Only in the following situations should administrators enter the settings page to supplement underlying configurations**:

*   Existing built-in data sources cannot cover new business analysis scenarios (e.g., need to integrate third-party business system data)
*   Need to add specific namespaces to connect to new data environments (e.g., new clusters, new regions)
*   Need to adjust parameter templates, chart type restrictions, or team visibility scope

### 6.1 Create a Namespace

**Navigation Path**: Settings → Namespaces → New

| Configuration Item | Description | Example |
|-------------------|-------------|---------|
| Name | Display name of the namespace | Production Cluster A |
| NATS Namespace | Message topic prefix | bklite_prod |
| Account | NATS connection account | ops_analysis |
| Password | NATS connection password (auto-encrypted) | ***** |
| Domain | NATS server address | nats.example.com:4222 |
| Enable TLS | Whether to use TLS encrypted connection | Yes (recommended for production) |

> **Security Tip:**
> It is strongly recommended to enable TLS for production environments. Passwords are automatically encrypted upon saving; plaintext is never stored in the database.

### 6.2 Create a Data Source

**Navigation Path**: Settings → Data Sources → New

| Configuration Item | Description | Example |
|-------------------|-------------|---------|
| Name | Display name of the data source | Host Resource Statistics |
| REST API | Data API path | /api/cmdb/hosts/statistics |
| Namespace | Associated data source | Production Cluster A |
| Tags | Data source classification tags | CMDB |
| Chart Types | Supported display formats | Line chart, Bar chart, Single-value chart |
| Parameter Template | Required API parameters | time_range, app_id |

> **Configuration Tip:**
> It is recommended to distinguish parameter templates between "fixed values" and "editable values." Fixed values are determined at configuration time, while editable values are left for users to adjust on the analysis page.

---

## 7. Frequently Asked Questions (FAQ)

**Q1: Why does my dashboard have no data?**

*   Check if the data source is enabled
*   Check if the namespace connection is normal (consult the administrator if needed)
*   Check if the parameter configuration is correct, especially the time range
*   Check if the current user has viewing permission for the team that owns the data source

**Q2: How do I share my created dashboard with other team members?**

*   Ensure the dashboard's "Owner Team" is set correctly
*   Confirm team members have "Dashboard View" permissions
*   Team members can see the dashboard in the directory tree on the view page

**Q3: What is the difference between topology diagrams and architecture diagrams?**

*   **Topology Diagrams**: Focus on expressing dynamic relationships and real-time status, supporting data binding and timed refresh, suitable for fault localization and runtime observation
*   **Architecture Diagrams**: Focus on expressing static resource structures and system layers, suitable for architecture reviews and solution communication

**Q4: Can the directory hierarchy limit be adjusted?**

*   The current directory hierarchy limit is fixed at 3 levels to balance flexibility and maintainability. If deeper levels are needed, it is recommended to use naming conventions to represent hierarchical relationships.

**Q5: How is data displayed when a data source is associated with multiple namespaces?**

*   The system fetches data from all namespaces in parallel and returns results partitioned by namespace name. Frontend components can choose to display all data or only data from specific namespaces.
