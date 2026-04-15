---
sidebar_position: 1
---

# Product Introduction

## Overview

Log Center is a one-stop centralized management system for discrete text and runtime logs built on BlueKing Lite. Built on Vector and Beats collection foundations, it shields users from complex component installation processes, enabling you to quickly collect and manage Syslog, file logs, Docker container logs, and various network flows (Flow/ICMP, etc.) scattered across servers from a single interface. Through out-of-the-box real-time data streaming terminal mode and advanced statistical alerting, it helps you pinpoint failures in seconds among massive logs.

## Core Advantages

*   **Rich Out-of-the-Box Integration**: Provides intuitive integration card pages with standardized forms pre-configured for probe types like Vector/Filebeat. For complex scenarios such as Java stack traces, built-in multi-line log merging with regex and timeout controls is included.
*   **Unique Immersive Terminal Search Experience**: Addressing the pain point of cumbersome traditional list viewing, the search provides a "Terminal Mode" with real-time dynamic refresh; combined with a "Log Histogram" to help quickly pinpoint time storm points.
*   **Secure and Flexible Grouping Rules**: By establishing log clustering logic combined with organizational permission isolation, the system supports fine-grained controllable data search scopes, securely delegating access to individual development teams.
*   **Dual Alerting with Keywords and Aggregation Dimensions**: Beyond simple "contains Error" keyword stacking alerts, the system also supports "Aggregation Alerts" that independently split events by dimensions such as "instance IP field," forming a proactive alerting closed loop.

## Use Cases

### 3.1 Online Exception and Error Text Investigation
When monitoring detects service timeouts or users report interaction lag, the platform can directly navigate to the log search page. By entering error ticket numbers or error stack keywords in the "Query" input box, combined with the field hints on the left side, you can quickly filter and pinpoint the error source.

### 3.2 Container or Service Cluster Unified Management
Leveraging Docker collection and built-in grouping management support, container outputs originally scattered across dozens of host instances can be aggregated for display, allowing teams to quickly identify abnormal fluctuation trends through group-specific histograms.

### 3.3 Dashboard Analysis and Post-Incident Review
Based on high-frequency search terms, you can one-click "Save Search Conditions" to preserve them as reusable query cards within the group. Additionally, combined with the "Log Analysis" module dashboard, query results can be quickly built into single-value and line chart metrics for long-term quality tracking and review.
