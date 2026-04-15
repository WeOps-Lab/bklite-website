---
sidebar_position: 3
---

# Features
## 1. Monitoring View (View)
The Monitoring View is the daily core workstation for operations personnel, enabling layered visualization from "global resource overview" to "deep instance-level metrics," covering all scenarios including resource status viewing, metric trend analysis, and alert correlation.


### 1.1 Global Resource View (List/Honeycomb)
Provides a centralized overview of all operations objects, supporting switching between list and honeycomb (Hive) views for quick target resource identification and basic status viewing (due to type differences, some resources like Pod/Node support honeycomb extended display).

> ![49205af9-5582-46ff-9f99-c3c8ebc5a99f.png](https://static.cwoa.net/4fa1939f8b8c48cc82fe663fd3692983.png)

#### Core Capabilities
- **Multi-Dimensional Category Navigation**: The left panel supports filtering managed objects by dimensions such as "Operating System (Host), Network (Website/Ping), Database (Elasticsearch/MySQL, etc.), Middleware (RabbitMQ/Nginx, etc.)," with resource counts annotated next to each category (e.g., "Host(1)");
- **Core Status Overview**: List mode displays resource "Name, Report Time, Report Status (Normal/Abnormal), CPU Usage, Memory Usage"; honeycomb mode visually presents cluster or node density and status distribution through hexagonal color blocks;
- **Quick Action Entry Points**: Each resource provides "View Instance (modal)" and "Dashboard Details" buttons on the right side or in hover tooltips, enabling one-click access to in-depth information.


### 1.2 Instance View Modal (View Modal)
Provides quick deep information aggregation for a single resource, allowing you to view charts and alerts within the current context without page navigation.
>![0ccd53ce-3b7c-4668-8c8d-c761c46eed22.png](https://static.cwoa.net/61090b77367943ec861609c3dc8f87c9.png)
> ![d0e0382f-5753-4a00-9bb1-8caea7e10db8.png](https://static.cwoa.net/c10675a1b83f43b8b9132d628774bfba.png)
> ![12a6d300-204d-40c2-82a5-3ac4b4684c3d.png](https://static.cwoa.net/5d4641ad73e84b9daaecdea742330d0c.png)

#### Core Capabilities
- **Dual Tab Switching**:
  - **Monitor View (MonitorView) Tab**: Displays detailed metrics for the instance, presenting core performance indicator time trends via line charts;
  - **Alert List (MonitorAlarm) Tab**: Correlates alert records for the instance, supporting viewing of related active/historical alerts with alert "Level, Time, Name, Status" and providing operations.
  - **Detail Entry**: The upper-right corner of the modal provides a "View Dashboard (Detail Page)" entry point.


### 1.3 Instance Detail Page (Detail Main Route)
A full metric panoramic view for a single resource (currently the detail main route independent page only exposes Metrics display; related alerts have been shifted left into the Instance View Modal for management).

> ![0e1add3a-1a65-45df-ad23-613be11a4281.png](https://static.cwoa.net/6824f951a1f94f3c947e26619894d55e.png)
> ![5c051f8a-34bc-41e6-a391-46638ae9564b.png](https://static.cwoa.net/c8ba49dc16034145b8708ccf708862c6.png)

#### Core Capabilities
- **Full Metric Categorized Display**: Metrics are categorized by dimensions such as "Process, Disk IO, Memory" in collapsible sections; expanding reveals all monitoring metrics within that category;
- **Multi-Chart Visualization**: Each metric is presented as a time-trend line chart, supporting mouse hover to view "specific time, metric value, associated device (e.g., device name for Disk IO)";
- **Flexible Time Range Selection**: Supports selecting "Last 15 minutes / Custom time period" for quick lookback across different metric data periods;
- **Metric Action Entry Points**: Each chart provides "Search, Favorite" quick actions for subsequent rapid access to metrics of interest.

## 2. Search
**Search is the platform's ad-hoc analysis and data exploration hub**, supporting free-combination queries across all metrics and cross-dimensional real-time aggregation. It meets the needs for deep drill-down and correlation analysis in non-predefined scenarios, providing multi-perspective data analysis support for operations personnel conducting evidence mining and fault boundary determination.

### 2.1 Structured Query Building
Through the left-side "Data Query" panel, users can build complex monitoring requests top-down, with the system automatically filtering available options based on context.

> **Interface Guide:**
> ![事件1.png](https://static.cwoa.net/0b5e928a04d442c483e707259602d254.png)
> ![事件2.png](https://static.cwoa.net/6cb55a11786f40418876596e6846e52e.png)
#### Core Capabilities
- **Chained Object Selection**: Guided selection of "Object (Plugin Type)" → "Asset (Specific Instance)" → "Metric (Monitoring Item)," ensuring query path accuracy.
- **Real-Time Aggregation Computation**: Supports mathematical aggregation of data within selected periods including **AVG** (Average), **MAX** (Maximum), **MIN** (Minimum), **SUM** (Sum), meeting different scenarios from resource load analysis to business volume statistics.
- **Query Configuration Reuse**: Supports one-click query condition copying for quickly building comparison views of similar metrics.

---

### 2.2 Dimension Filtering and Precise Cleansing
Building upon basic queries, the "Conditions" function enables fine-grained filtering on metric-associated labels (Labels/Tags) to eliminate data noise. It also supports multi-group condition (AND condition) intersection combinations for higher-precision matching.

> **Interface Guide:**
> ![事件3.png](https://static.cwoa.net/d75edd9648124bc99845d0fdc9871ea5.png)
#### Core Capabilities
- **Fine-Grained Data Slicing**: Filter by metric attributes (such as K8s `pod_name` or host `device`) to observe only the performance of specific subsets.
- **Logical Operator Support**: Provides standard three-part configuration of "Dimension Key, Operator (`=`, `!=`, `in`, `not in`, etc.), Dimension Value."
- **Multi-Condition Joint Query**: Supports adding multiple filter AND conditions, achieving precise "dehydration" and pinpointing of massive monitoring data through flexible matching logic.

---

### 2.3 Intelligent Visualization and Dimension Tables
The system automatically renders high-precision time-series line charts (trend charts) based on query results, accompanied by real-time statistical summary data (dimension tables).

> **Interface Guide:**
> ![事件4.png](https://static.cwoa.net/1728b2c5762d46109157143c230863e3.png)

#### Core Capabilities
- **Multi-Instance Curves on Screen**: Supports displaying metric fluctuations of multiple instances (e.g., CPU of multiple hosts) simultaneously in one trend chart, facilitating outlier identification.
- **Dimension Table Statistics**: Below or beside the chart, real-time calculations of "Maximum, Minimum, Average" across different dimensions within the current time window quantify resource operating ranges.
- **Interactive Probe**: Mouse hover triggers a data probe for viewing precise readings at specific time points.

---

### 2.4 Multiple Query Groups and Management (Favorites/Load)
Supports parallel multiple query tasks, flexible dashboard layouts, and named query bookmark management for analyzing correlations between different metrics or solidifying daily high-priority exploration patterns.

> **Interface Guide:**
> ![事件5.png](https://static.cwoa.net/f10925cefb3a45bbb2281e7dcf372cd9.png)
> ![事件6.png](https://static.cwoa.net/8495c267f01b4605b985e1fba8151e65.png)

#### Core Capabilities
- **Multiple Query Groups (Parallel Tasks)**: Click "+ Add Query" to create multiple independent query cards, enabling cross-resource, cross-metric same-axis/split-axis analysis.
- **Named Query Save/Load**: Allows saving configured multi-dimensional complex query conditions as "Favorite Bookmarks," supporting quick subsequent loading for improved daily reuse efficiency.
- **Layered Layout Switching**:
  - **List Mode**: Vertical arrangement, suitable for deep analysis of long-period waveforms for a single metric.
  - **Tiled Grid Mode**: Matrix arrangement, suitable for monitoring full-chain core metrics within limited screen space.
- **Global Time Linkage**: Supports unified time period selection, one-click refreshing all charts to ensure baseline synchronization.

## 3. Event
**Events are the platform's core module for full-lifecycle alert management**, integrating "Alert, Policy, Template" sub-tabs to achieve the closed-loop operations flow from "anomaly monitoring - alert handling - rule configuration - template reuse," serving as the unified operations entry point for handling monitoring anomalies.
### 3.1 Event Page
> ![9d79d1ec-58fe-41f0-aba8-a62f854ebc8a.png](https://static.cwoa.net/26461d1b322f47459eada7c0be47f8a3.png)

#### Core Positioning
The Event page is the centralized operations carrier for the full alert lifecycle, with three sub-tabs at the top for function switching:
- **Alert Tab**: Manage current unhandled/handled alert records (corresponding to section 3.2);
- **Policy Tab**: Create/edit alert detection rules (corresponding to section 3.3);
- **Template Tab**: Reuse pre-configured alert rule templates (corresponding to section 3.4);
No page navigation required — you can complete the core operations of "viewing alerts, configuring rules, using templates" to improve operational efficiency.


### 3.2 Alert Management (Event Page "Alert" Tab)
Under the "Alert" sub-tab, monitoring anomalies can be managed in two categories: "Active Alerts" and "Historical Alerts."

#### 3.2.1 Active Alert Management
Maintain real-time awareness of currently unhandled anomaly alerts, quickly locating and handling high-risk events. When a related alert policy is "disabled," the system will automatically close alerts triggered by that policy that are still active, preventing alert accumulation.

> ![fec1b716-0425-4803-89e7-459cd024ba69.png](https://static.cwoa.net/3d2fcde50ecb445d91977c6ed84e8c3c.png)
>![aa360431-0fa2-4acb-bb8d-45dc9eee783f.png](https://static.cwoa.net/754728afdba5449d9bf32ff1fd5ca288.png)

##### Core Capabilities
- **Multi-Dimensional Filtering**: Supports dropdown filtering by "Level (Fatal / Warning / Info), Status," with left navigation bar filtering alerts by asset type such as "OS/Network/Database";
- **Alert Distribution Visualization**: Displays alert time density through histograms for intuitive identification of "alert storm" periods;
- **Alert Handling and Details**: List displays alert "Level, Time, Associated Asset, Status"; clicking "Details" shows full alert information (including first alert time, policy name, notification channel source, etc.); clicking "Close" marks the alert as handled.


#### 3.2.2 Historical Alert Review
Query handled/auto-recovered historical alerts to assist with fault tracing and SLA analysis.

> ![5e057f61-2d03-475d-9080-38d32c5f880b.png](https://static.cwoa.net/feaeab46c01c4b1cb2a27a8669e3c0f8.png)
##### Core Capabilities
- **Time Range Filtering**: Supports "Last 7 days / Custom time period" queries, combined with asset type filtering for precise targeting of specific resource historical anomalies;
- **Multi-Status Display**: List includes "Auto-Recovery" status alerts, annotated with "Operator, Notification Status" for tracing the handling process;
- **Trend Analysis**: Histograms display historical alert time distribution, helping identify periodic failures.


### 3.3 Policy Configuration (Event Page "Policy" Tab)
Under the "Policy" sub-tab, you can manage the lifecycle of alert rules and define precise anomaly detection logic through the "Create Policy" wizard.

> ![e71be938-76a1-4a89-a796-b0844f98ad7d.png](https://static.cwoa.net/33d3d20e41cf47cb87f688143ad5e6e2.png)
> ![5cd2d595-1893-4321-bd1c-e0e11911a7f8.png](https://static.cwoa.net/b6b477d1dd2842539738fd65d36a2398.png)
> ![c6a8ac73-4053-4b0a-9e2d-e3688ded2466.png](https://static.cwoa.net/bf45e14bafb949b9a81d6578dcb1159b.png)
> ![9626eb71-ac4f-41c8-9a4f-e6bb1702ada9.png](https://static.cwoa.net/b71775761f984de684b19d2593cd9c53.png)
> ![87b96271-1dfc-4f30-9463-aef99a93ff3c.png](https://static.cwoa.net/08ac297af15e46a5804f40f9d52aa232.png)


#### 3.3.1 Policy Lifecycle Management
The policy list displays configured rules' "Name, Number of Monitored Targets, Creator, Execution Time, Active Status" and provides:
- "Active Toggle": One-click enable/disable policy;
- "Edit/Delete": Adjust rules or remove invalid configurations;
- "+ Add": Click to enter the **Create Policy Wizard** and complete new rule configuration in 4 steps.


#### 3.3.2 Step-by-Step Create Policy Wizard
Through a wizard-style form, complete the full-process rule definition from "Basic Information" to "Notification Configuration":

1. **Step 1: Basic Information Configuration**
   - Policy Name: Enter a rule identifier (e.g., "Host CPU Usage Too High");
   - Alert Name: Supports variable references (e.g., `Host ${metric_instance_id} CPU Usage Too High`) for dynamic alert names across different instances;
   - Organization: Select the organization the rule belongs to (default is "Default");
   - Target: Click "+" to select assets to monitor (supports multi-select);
   - Detection Frequency: Set the metric detection interval (e.g., "every 5 minutes").


2. **Step 2: Define Metric Rules**
   - Collection Template: Select the corresponding collection plugin (e.g., "host" for host collection);
   - Metric: Select the specific monitoring metric (e.g., "cpu_summary.usage" for CPU usage);
   - Filter/Group: Filter/group metric data by dimensions (e.g., `instance_id`);
   - Aggregation Method: Select the metric calculation method within the detection period (e.g., "MAX" for maximum value);
   - Aggregation Period: Set the time range for metric data aggregation (e.g., "5 minutes").


3. **Step 3: Set Alert Conditions**
   - **Threshold Configuration**: Set conditions for metric values based on detection algorithms (e.g., Fatal level ">=90", Error level ">=85", Warning level ">=80"); the algorithm itself can also trigger conditions for missing data scenarios (e.g., `threshold/no_data`);
   - **Global No-Data Alert**: Supports configuring policy-level "No-Data Alerts (`alert/no_data`)" independent of threshold conditions, triggering when the entire resource or collection item has not reported data for an extended period, preventing missed alerts due to collection plugin failures;
   - **Auto-Recovery**: Set "alert automatically recovers after N consecutive periods not meeting the threshold" (e.g., "5 periods").


4. **Step 4: Configure Notifications**
   - Enable/disable the "Notification" toggle; subsequently bind email, WeCom, and other channels for alert delivery.


After completing the 4-step configuration, click "Confirm." The policy will automatically run at the detection frequency and generate alerts when anomalies are triggered.


### 3.4 Template Library (Event Page "Template" Tab)
Under the "Template" sub-tab, you can reuse pre-configured alert rule templates to lower the configuration barrier.

> ![9e3353eb-b6bb-4dc0-879d-1b75e7af7fb0.png](https://static.cwoa.net/80e3985d68c2496fbc9dc95d5262aaa8.png)
>![dbed706c-bd70-4188-9023-eb32204c3d18.png](https://static.cwoa.net/98a22ccaed164f4389163431a0407f27.png) 
>![c9f24719-7c8f-4ea4-a670-eb6c5dd29dd6.png](https://static.cwoa.net/b9bdb2bb0d414dd29e280f04bac10a5d.png)
>![0b9cb782-413d-48b1-a19e-7ffd287e2bd7.png](https://static.cwoa.net/58c1ba7774354b72800da0d274d9a459.png)

#### Core Capabilities
- **Pre-Configured Mainstream Templates**: Categorized by asset type, providing core scenario templates such as "Host CPU Usage Too High, Memory Usage Too High";
- **Template Detail Descriptions**: Each template is annotated with "Detection Logic + Risk Prompts" (e.g., "Host CPU Usage Too High: Detects if CPU exceeds threshold, warns of system overload risk");
- **Quick Reuse**: Alert policies can be generated directly from templates without repeating basic rule configuration.

---

## 4. Integration
**Integration is the configuration and management hub for monitoring data collection**, implementing full-process collection management from "collection template onboarding - onboarded asset management - resource grouping rule configuration" through the "Integration, Assets, Grouping" sub-tabs, providing stable data source support for monitoring scenarios.


### 4.1 Integration (Collection Template Onboarding)
> ![06cf8615-c8c3-4944-9461-771dc7c182f2.png](https://static.cwoa.net/f0c5961306d344c19f4dd234208dafe0.png)
> ![9ff50478-b2a9-436b-b847-9349e811f393.png](https://static.cwoa.net/dbf5bc52cfa84c9cba852eb144223d1d.png)

#### Core Capabilities
- **Pre-Configured Full-Stack Collection Templates**: Provides standardized collection templates covering "Host (Telegraf), Website Probing, Ping, Database (Elasticsearch/MySQL, etc.), Middleware." Each template card intuitively displays the current **status** (e.g., whether enabled, whether out-of-the-box) and **collection logic** (e.g., "Host Template: Collects CPU, Memory, Disk data via Telegraf");
- **Flexible Onboarding Methods (Automatic and Manual)**: Some built-in resources (such as base OS host collection) support fully automatic zero-configuration onboarding, while complex objects provide a **wizard-style manual template onboarding** process. Click the template's "+ Onboard" button to enter the configuration page and complete 3 types of core configuration:
  1. Select collection metrics (e.g., Disk/CPU/Memory);
  2. Set monitoring targets (select target node assets);
  3. Configure collection interval (e.g., 10s);
  Once complete, the corresponding asset collection task is created;
- **Category-Filtered Templates**: The left navigation bar categorizes by "OS/Network/Database" dimensions for quickly locating target type collection templates.


### 4.2 Assets (Onboarded Resource Management)
> ![b85524f2-476c-4331-8ea8-747067f6bd0f.png](https://static.cwoa.net/002e909bc951469c857737ddef4a8a01.png)
>![26e464dc9d7bf0a82bdd377a9509b62d.png](https://static.cwoa.net/3c3ae58f2e664cafb3315ccbedb39090.png)
> ![fa8703c2922cc3d80a02124622cf2149.png](https://static.cwoa.net/e669280f95a043528dd95c0af05beb9e.png)
>![6ac66228d5b2bfec5db089e22d070bef.png](https://static.cwoa.net/968bdadb52b248389d1a501cc1e072cd.png)
#### Core Capabilities
- **Onboarded Asset Overview**: List displays all asset objects associated with configured collection methods, including "Asset Name, Integration Template, Organization," with left-side filtering by asset type such as "Host/Website/Database";
- **Asset Full-Lifecycle Operations**: Each asset supports 4 types of operations:
  - "View": View the asset's collection details and monitoring chart dashboard;
  - "Edit": Modify the asset's "Instance Name, Organization";
  - "Configure": Adjust specific parameters for the collection target (e.g., monitoring metric type, target IP, collection interval);
  - "Delete": Remove invalid collection assets;
- **Collection Status Monitoring**: The asset detail page displays individual asset "Report Status, Last Report Time" to confirm in real-time whether the asset node's data collection pipeline is functioning normally.


### 4.3 Grouping (Resource Grouping Rule Configuration)
> ![150f8c3abef44ab730d6c4ccdfbf89e9.png](https://static.cwoa.net/dc7f66ed486a46a59a26fd65e9c62e89.png)
> ![6d255288fc0814e1a236b50f6f91fdd3.png](https://static.cwoa.net/6951e13edcec44d7873f2d9512f0986e.png)

#### Core Capabilities
- **Resource Logical Group Management**: Through rules, scattered assets under the same type category are re-aggregated by "technical dimension (e.g., K8s/Pod, OS/Host)" or business cluster dimension. The list displays "Rule Name, Object Type, Rule Description, Organization";
- **Rule Configuration Logic**: When creating/editing rules, you can set "Matching Metric, Condition (e.g., `instance_id = 3`), Organization" to achieve automatic asset classification;
- **Batch Operations Support**: Grouping rules provide the logical grouping foundation for subsequent "batch alert policy configuration, batch monitoring data viewing," reducing repetitive operations and improving operational efficiency.
