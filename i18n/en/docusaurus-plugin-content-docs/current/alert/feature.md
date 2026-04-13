---
sidebar_position: 3
---

# Features

## 1. Event

Events are the smallest data units in the Alert Center, representing raw alerts or status change notifications received from external systems. The platform converts heterogeneous data into a unified event model through standardized processing, laying the foundation for subsequent aggregation, dispatch, and recovery judgment.

### 1.1 Core Positioning

The Event layer addresses "how data enters the platform" and "how it associates with recovery." It serves as both the unified entry point for multi-source onboarding and the data source for full alert lifecycle tracing.

### 1.2 Core Capabilities

*   **Multi-Source Onboarding Adaptation**: Supports multiple onboarding methods including REST API and NATS messaging channels, connecting to heterogeneous data sources like Prometheus, Zabbix, cloud monitoring, and Webhooks through the Adapter pattern
*   **Field Standardization Mapping**: Maps fields from different sources to the standard event model through `event_fields_mapping` configuration, with fallback value retrieval from `labels` metadata
*   **CMDB Information Enrichment**: Optionally enable CMDB auto-enrichment capability that queries and supplements instance information into event labels based on `resource_type` and `resource_id/resource_name`
*   **Recovery Event Association**: Achieves intelligent association between recovery events and creation events through `external_id` unique identification, supporting auto-recovery judgment
*   **Pre-Filtering Shield**: Events are immediately checked against shield policies after storage; events matching policies are marked as **Shielded (SHIELD)** status and do not enter the subsequent alert pipeline

> **Interface Guide:**
>
> ![Event List](https://static.cwoa.net/82505b24b0824cbd8fe7dd1fe3d1bdff.png)
>
> *   **Chart Interpretation / Configuration Logic**: The event list is used for tracing raw data, investigating "why this alert was generated" or "why the alert hasn't recovered." Focus on event status (whether shielded), action type (created/recovery/closed), and parsed field values.

---

## 2. Alert

Alerts are processable units formed after raw Events are aggregated through correlation rules. Compared to individual events, alerts emphasize responsibility attribution, context completeness, and handling actions, serving as the core entry point for on-call personnel's daily work.

### 2.1 Core Positioning

Alerts are designed to accept problem units that need to be handled by manual or automated processes. They preserve original event context information (through many-to-many associations) while providing a unified state transition mechanism, helping teams escalate from "seeing an anomaly" to "starting to handle the problem."

### 2.2 State Machine Model

Alerts follow a strict state machine definition; illegal state transitions are rejected:
| Status | Description | Entry Method |
|------|------|----------|
| **unassigned** | Unassigned | Initial status after alert creation |
| **pending** | Pending Response | After auto-dispatch or manual dispatch |
| **processing** | In Progress | After responsible person claims |
| **resolved** | Resolved | Manual recovery operation |
| **closed** | Closed | Manual close operation |
| **auto_recovery** | Auto-Recovered | Automatically triggered when recovery event covers creation event |
| **auto_close** | Auto-Closed | Policy close conditions met or fallback task triggered |

### 2.3 Core Capabilities

*   **Intelligent Fingerprint Aggregation**: Precise deduplication based on `event fingerprint`; active alerts with the same fingerprint are only updated, not duplicated
*   **Multi-Dimensional Filtering and Sorting**: Supports filtering by alert level, status, source, time range, "My Alerts" and other dimensions; list sorted by update time descending
*   **Associated Event Tracing**: Each alert can view all its associated events to understand the aggregation process and context changes
*   **Batch Handling Operations**: Supports batch dispatch, claim, and close for improved high-frequency operation efficiency
*   **Auto-Recovery Determination**: When an alert's associated creation events are covered by later recovery events, automatically triggers `auto_recovery` state transition
*   **Notification Status Tracking**: Records each notification's delivery result (success/failure/partial success) for troubleshooting notification pipeline issues
*   **One-Click Upgrade to Incident**: High-impact alerts can be upgraded to Incidents with one click, entering a higher-level collaborative workflow

> **Interface Guide:**
>
> ![Alert List](https://static.cwoa.net/82505b24b0824cbd8fe7dd1fe3d1bdff.png)
>
> *   **Chart Interpretation / Configuration Logic**: The alert list emphasizes "quick filtering + in-place handling." After compressing the problem set through "Level, Status, Ownership," you can directly execute claim, transfer, or close operations in the list, reducing page switching.

---

## 3. Incident

Incidents are used to handle problems that have escalated to higher business impact. They are not a simple rename of alerts, but rather elevate anomalies requiring team collaborative handling into higher-level management objects.

### 3.1 Core Positioning

When one or more alerts point to the same high-impact problem (such as core business interruption or cascading failure), upgrading to an Incident enables unified tracking of handling progress, organizing handling personnel, and centralized viewing of associated information.

### 3.2 State Machine Model

| Status | Description | Transition Operation |
|------|------|----------|
| **pending** | Pending Response | Initial status after creation |
| **processing** | In Progress | Claim operation |
| **closed** | Closed | Close operation |
| **resolved** | Resolved | Recovery operation |

Incidents support reopen operations: closed incidents can re-enter the in-progress status.

### 3.3 Core Capabilities

*   **Multi-Alert Association**: An incident can associate multiple alerts, providing unified viewing of related anomaly context and handling progress
*   **Centralized Collaboration Information**: The incident detail page aggregates basic information, associated alert list, and handling process records, supporting multi-role sharing of the same problem view
*   **Gantt Chart Timeline**: Visual display of the incident lifecycle and time spent in each phase, assisting post-mortem analysis
*   **Independent Status Management**: Incidents have state transitions independent of alerts, supporting claim, close, reopen, and other operations

> **Interface Guide:**
>
> ![Incident List](https://static.cwoa.net/13c556375fb440baa763059fd6df2512.png)
>
> *   **Chart Interpretation / Configuration Logic**: The incident page is suitable for handling medium-to-high impact problems. Compared to the alert list, it emphasizes the collaborative perspective, helping users shift from "handling individual anomalies" to "unified advancement of the same problem."

---

## 4. Integration Center

The Integration Center manages event onboarding sources and serves as the entry-layer capability of the Alert Center. The platform manages different systems' onboarding methods, authentication information, and usage status through unified alert source management.

### 4.1 Core Positioning

The Integration Center addresses "where events come from, how they securely enter the platform, and how to verify successful onboarding." It centralizes onboarding configuration, guide viewing, and event verification in a single entry point, making it easy for platform administrators to maintain standardized onboarding systems.

### 4.2 Supported Onboarding Methods

| Onboarding Method | Applicable Scenarios | Authentication Method |
|----------|----------|----------|
| **REST API** | External systems actively push events | `SECRET` field in Header or Body |
| **NATS** | Message queue asynchronous consumption | NATS connection configuration |
| **Prometheus** | Prometheus Alertmanager integration | Webhook configuration |
| **Zabbix** | Zabbix alert push | Custom script or Webhook |
| **Webhook** | Generic Webhook onboarding | URL + Secret |

### 4.3 Core Capabilities

*   **Source-Level Authentication Management**: Each alert source has an independent access key, supporting per-source security boundary management
*   **Field Mapping Configuration**: Customize upstream field mapping to the standard event model through `event_fields_mapping`
*   **Onboarding Guide Generation**: Automatically generates onboarding guides including interface address, request format, and authentication parameters
*   **Recent Event Viewing**: View recently received events in the alert source detail page for quick onboarding pipeline verification
*   **Lifecycle Management**: Supports alert source creation, editing, disabling, and deletion (soft delete)

> **Interface Guide:**
>
> ![Alert Source](https://static.cwoa.net/d77279aa03604616947a03c7a395f191.png)
>
> *   **Chart Interpretation / Configuration Logic**: The Integration Center serves as both the onboarding configuration entry and the troubleshooting entry. If expected alerts are not seen after onboarding, first confirm the source configuration, authentication parameters, and event reception status.

---

## 5. Settings Center

The Settings Center is responsible for consolidating alert governance rules, upgrading the platform from "passively receiving messages" to "actively managing problems." It includes event-side correlation rules, dispatch policies, shield policies, system settings, and operation logs as core capabilities.

### 5.1 Correlation Rules

Correlation rules define how Events aggregate into Alerts and serve as the core engine for noise reduction and value extraction in the Alert Center.

#### 5.1.1 Policy Types

| Policy Type | Description | Applicable Scenarios |
|----------|------|----------|
| **Smart Denoise** | Aggregation noise reduction for matching events | General monitoring alert convergence |
| **Missing Detection** | Detect expected events that haven't arrived on time | Scheduled tasks, heartbeat monitoring |

#### 5.1.2 Window Types

| Window Type | Description | Applicable Scenarios |
|----------|------|----------|
| **Sliding Window** | Continuous time periods, windows may overlap | Continuous anomaly detection |
| **Fixed Window** | Fixed time slices, e.g., per-minute/per-hour | Periodic statistics |
| **Session Window** | Identify problem persistence based on event intervals | Jitter filtering, timeout detection |

#### 5.1.3 Core Capabilities

*   **Flexible Matching Rules**: Supports multi-group condition combinations (outer OR, inner AND), with filtering by source, level, resource, label, and other dimensions
*   **Multi-Dimensional Group Aggregation**: Define aggregation dimensions through `group_by` (e.g., `resource_id`, `service`); events with the same dimensions aggregate into a single alert
*   **Fingerprint Algorithm Deduplication**: Calculate event fingerprints based on MD5 hashing to ensure only one active alert per problem
*   **Session Observation Period**: Session window policies support observation period mechanism; events recovering during the observation period don't become formal alerts
*   **Auto-Close Configuration**: Supports setting auto-close times for alerts generated by rules, controlling long-standing issues
*   **Asynchronous Dispatch Scheduling**: New alerts execute auto-dispatch through Celery asynchronous tasks without blocking the aggregation flow

> **Interface Guide:**
>
> ![微信图片_20260326195309_16_154.png](https://static.cwoa.net/db8283eee9374c8ea9a972e7940d5507.png)
>
>

### 5.2 Alert Dispatch (Assignment)

Dispatch policies are responsible for automatically assigning alerts matching conditions to responsible persons or teams, improving the efficiency of issues entering the handling workflow.

#### 5.2.1 Match Types

| Match Type | Description |
|----------|------|
| **Match All (ALL)** | All unassigned alerts within the time range are matched |
| **Condition Filter (FILTER)** | Match by alert fields and rules, supporting `eq`, `ne`, `contains`, `not_contains`, `re`, and other operators |

#### 5.2.2 Core Capabilities

*   **Flexible Effective Time**: Supports one-time, daily, weekly, and monthly time range configurations to adapt to different on-call schedules
*   **Tiered Reminder Mechanism**: Configurable reminder frequencies by alert level (e.g., fatal level reminds every 30 minutes, up to 10 times)
*   **Notification Channel Integration**: Automatically triggers notification upon successful dispatch, syncing the issue to the responsible person
*   **Fallback Dispatch Guarantee**: Alerts not matching any policy enter the fallback queue with periodic administrator notifications per global configuration
*   **Operation Log Recording**: Auto-dispatch operations are recorded in operation logs for audit tracing

> **Interface Guide:**
>
> ![Alert Dispatch](https://static.cwoa.net/65bec31304774ff8b27a47dc853af3aa.png)
>
> *   **Chart Interpretation / Configuration Logic**: The core of dispatch policies is defining "what type of problem gets automatically assigned to whom at what time." Proper configuration can significantly reduce manual judgment and transfer overhead, improving MTTR.

### 5.3 Shield Policies

Shield policies are used to filter low-value, known, or maintenance-window events that don't need to enter the alert handling workflow.

#### 5.3.1 Core Capabilities

*   **Multi-Dimensional Condition Matching**: Supports configuring match conditions by source, resource, title, content, level, and other fields
*   **Flexible Time Control**: Supports one-time, daily, weekly, monthly, and other time range configurations for maintenance windows or periodic operation scenarios
*   **Pre-Filtering Noise Reduction**: Events matching shield policies are marked as `SHIELD` status immediately after storage, bypassing subsequent aggregation and dispatch pipelines
*   **Visibility Preservation**: Shielded events remain visible in the event list for tracing and auditing

> **Interface Guide:**
>
> ![Shield Policy](https://static.cwoa.net/89814c631fc441b3915f72f9f5caa393.png)
>
> *   **Chart Interpretation / Configuration Logic**: Shield policies are suitable for governing "events known to not require handling," such as planned maintenance and repetitive low-value notifications. Use with caution to avoid over-shielding.

### 5.4 Missing Detection Policies

Missing Detection is a special policy type used to detect **events expected to arrive but not yet received**, applicable to scheduled tasks, heartbeat monitoring, and similar scenarios.

#### 5.4.1 Core Capabilities

*   **Cron Expression Configuration**: Define expected event arrival time patterns through Cron
*   **Activation Mode Selection**: Supports "First Heartbeat Activation" (monitoring begins after receiving the first event) or "Immediate Activation"
*   **Grace Period Setting**: Supports configuring a grace period to delay alert triggering after the expected time
*   **Auto-Recovery**: When a missing detection alert is generated, if matching events are subsequently received, the alert automatically recovers
*   **Runtime Status Tracking**: Records last heartbeat time, current monitoring status (waiting/monitoring/alerting)

> **Note:**
> Missing detection policies depend on continuous scheduled task scheduling checks. Please ensure the platform's Celery Worker is running normally.

### 5.5 Global Configuration and Operation Logs

#### 5.5.1 Global Configuration

System-level configuration items control the Alert Center's global behavior, including:
*   Fallback dispatch notification configuration
*   Alert enrichment feature toggles
*   Auto-close policy parameters

#### 5.5.2 Operation Logs

Operation logs record key changes and handling actions, serving as an important component of platform governance and auditing:

*   **Log Types**: Event, Alert, Incident, System
*   **Operation Types**: Create, Modify, Delete, Execute
*   **Record Content**: Operator, operation target, before/after change values, operation time

> **Interface Guide:**
>
> ![Global Configuration](https://static.cwoa.net/dcfd3d2ac6364a0ea56cc9d1b77fee0b.png)
>
> *   **Chart Interpretation / Configuration Logic**: Global configuration reflects the consistency of platform processing policies, while operation logs reflect the transparency of governance actions. Together, they elevate the Alert Center from "usable" to "governable."
