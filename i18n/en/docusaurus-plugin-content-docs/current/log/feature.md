---
sidebar_position: 3
---

# Features

The log system is a high-frequency capability foundation for collecting, categorizing, inspecting, and proactively guarding against heterogeneous text. We break down this system into four major interactive operation modules for detailed explanation.

## 1. Log Collection & Integration (Integration)

The integration system is the upstream engine of the entire log operation. We transform what was originally a black-box code operations process into clear, intuitive operation cards.

*   **Card-Style All-in-One Integration**: Adopting a supermarket-style card layout, it encompasses a rich variety of collection types: built-in Vector probe supports direct collection from `Syslog`, `File`, `Docker`, and `Exec`; supports `Filebeat` link testing; and even includes `Packetbeat` for network traffic (Flow/ICMP/DHCP) collection.
*   **Multi-Line Truncation and Merge Reassembly**: For the nightmare of multi-line merging (such as large Java exceptions), the frontend natively provides a multi-condition mode control panel (including merge regex defaults, start markers, four truncation logic mode selections, and forced timeout export), highly compatible with real business operation characteristics.
*   **Tree-View Reception Tracking List**: A tree-structured hierarchical list view displays all log reception target instances and their statuses, with a built-in "Quick View Logs" jump button to assist verification.

## 2. Log Search & Display (Search)

Moving beyond traditional slow text searching tools, we have rebuilt an exploration interface that is both straightforward and appealing to engineer preferences.

*   **Query Suggestions and One-Click Insert**: The query input box is always accompanied by intuitive input hints. In the detailed reading list mode, it supports one-click appending of "timestamps" or standalone business field names/values to the query statement.
*   **Dual-Track Visual Presentation (Histogram & Terminal Stream)**: The top-pinned "Query Histogram" depicts the time-storm distribution of log alerts; in addition to structured expanded information display in list view mode, you can switch directly to **Terminal Mode**, enjoying dynamic auto-refresh in that mode.
*   **Condition Latch and Group Permission Binding**: If you've spent significant effort crafting a complex query or debugging logic, you can save that search condition (including time filters and grouping) via a popup dialog. These saved conditions are automatically bound to the current organization, enabling team sharing and ready-to-use access.

## 3. Grouping Rules & Isolation (Grouping)

The key mechanism for making log searches fast while preventing permission boundary violations and data leaks.

*   **Rule-Based Assignment**: In addition to the built-in, unmodifiable [All Log Data default group] as a fallback, the system allows creating new grouping conditions. Using "any/all" logic, conditions based on fields and "contains/equals" values automatically absorb specific logs into custom groups.
*   **Enforced Permission Visibility**: These groups enforce access isolation at the foundational level. Whether in the log reception statistics tree or the top query interface dropdown search, data display is strictly bound to "current user permission organization filters."

## 4. Log Event Policies & Analyzer (Events & Analysis)

We empower logs to evolve beyond a pure search repository into an automated defense line. Simply locating problems is not enough? Convert them directly into dashboards and alerts.

*   **Keyword and Aggregation Alert Isolation**: The system provides multiple forms of monitoring. It includes "Keyword Alerts" that summarize single-policy same-category plain text errors into one Alert; as well as "Aggregation Alerts" that generate one Alert per unique value based on special field classification. Notifications are also integrated with WeCom and the Monitor Center through a unified communication domain.
*   **Drawer-Style Investigation and Detail Linkage**: Once triggered, within the event detail interface, you simply invoke the drawer panel from the table to directly access the original log content that triggered the alert or the timestamp display page.
*   **Custom View Analysis Dashboard Module**: We reuse highly flexible graphical component modules (no tedious view add/edit operations required). Users can build custom Analysis dashboards and calculation functions with just two minimalist filters — grouping and time — plus drag-and-drop "single value charts, line charts, and log boards."
