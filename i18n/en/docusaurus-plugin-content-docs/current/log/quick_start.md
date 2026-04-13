---
sidebar_position: 2
---

# Quick Start

In just a few short steps, you can seamlessly connect your business logs to the central system and begin your first data health check.

## 1. Prerequisites

*   The servers or application nodes from which you need to collect logs must be managed by the platform and have the corresponding permissions assigned.
*   You must clearly know the path scope of the logs to be collected (e.g., the specific disk write path).
*   *Note: In a Kubernetes (K8s) environment, logs primarily rely on system-initiated reporting. There is no need for, and you should not perform, active onboarding through the console node page for this step.*

## 2. Step One: Connect Log Collection

Navigate to the console interface, then go to: **Application Logs -> Log Integration**.

1.  On the integration card page, select any desired type block (such as `File` collection or `Docker` collection).
2.  Enter the integration details page, select the target **node** with the appropriate permissions, and fill in the name and assigned group.
3.  Enter the actual **collection regex pattern or path configuration**.
4.  **[Advanced]** If your logs contain multi-line content such as Java error stack traces, be sure to enable and check the "Multi-line Merge" toggle, and fill in the start marker and regex to ensure collection completeness.

## 3. Step Two: Distribute and Confirm Activation

After configuration and distribution, the system will begin scheduling the collection configuration.

1.  Go to the left-side menu and click **"Log Reception"**.
2.  This provides an intuitive tree-view management display by default. Carefully review the reception nodes and instances you just entered.
3.  If the "Status" field in the list shows a green light or success status, it means the underlying collection probe (such as Filebeat or Vector) is working normally.

> **Warning / Security Best Practices:**
> If you want to isolate data for developers of different business units, it is recommended to go to the "Log Grouping Rules" page and define conditions (contains/equals, etc.) to assign newly ingested logs into the corresponding project-specific restricted groups.

## 4. Step Three: Search and Inspect on the Interface

From this point on, you can view results in the **"Log Search"** module.

1.  **Group Filter**: Select a "Log Group" from the dropdown in the upper-left area (only groups you have permission to access are shown) to make your search more focused.
2.  **Write a Query**: Type the error keywords you're interested in into the large input box at the top. Not sure how to write complex queries? Refer to the manual with example explanations provided on the right side to help you get started quickly.
3.  **Mode Switching**: In addition to viewing specific field values in list mode, you can also click to switch to **Terminal Mode** and enjoy the experience of real-time scrolling log viewing (as smooth as `tail -f` on Linux).

## 5. Result Verification & Closure

After you find the key error line through search, you can click "Show Subject Field Names" and directly use "**Add to Query**" to quickly generate extremely precise search conditions.
Next, if the log is related to a critical failure, you can jump to "Log Events" and configure it as a long-term keyword monitoring rule to avoid the need for manual inspection next time.
