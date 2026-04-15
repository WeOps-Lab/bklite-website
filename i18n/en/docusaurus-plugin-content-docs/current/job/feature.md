---
sidebar_position: 3
---

# Features

The Job Management module consists of multiple tightly integrated functional pages. Below, we provide a detailed introduction to the core positioning and configuration capabilities of each module, organized by the system's page navigation layout.

## 1. Dashboard
The entry-level digital cockpit for Job Management, designed to provide the operations team with a global snapshot of task execution for the day.
*   **Execution Data Overview**: Intuitively displays the "total job executions" and "success/failure rate" distribution within a specific time period, helping operations managers gauge the overall health of automated system operations.
*   **High-Frequency Trigger Entries**: Provides quick-access shortcut buttons to "Quick Execute" or "Create Cron Job," adapting to common usage habits for frequent invocations.

## 2. Target Management
The group management repository for target objects across various automated execution actions.
*   **Multi-Management Mode Configuration**: Execution groups defined and managed here support both **Agent mode** (hosts with resident agents installed for scheduling) and **Agentless mode** (direct management via the Ansible protocol without resident agents).
*   **Flexible Target Mapping and Selection**: Supports aggregating and associating scattered hosts from macro cluster perspectives or micro machine attribute levels through Tags or specific IP lists. This enables one-click target group referencing when subsequently triggering tasks such as script distribution.

## 3. Quick Execute
A high-speed, no-orchestration workspace built for ad-hoc short commands and troubleshooting task needs.
*   **Plug-and-Play Execution Panel**: For temporary commands to be sent to hosts, it provides an IDE-like editable code panel. Users can directly write Shell, Python, and other common language script snippets and execute them on selected target resources.
*   **Remote Streaming Feedback**: Enables millisecond-level interactive response from remote machines. The standard output (Stdout) from each target machine is printed in real-time on the page, greatly enhancing the experience in urgent interactive scenarios.

## 4. File Distribution
A centralized control hub for large-scale physical file transfer across multi-endpoint nodes.
*   **End-to-End Delivery Channel**: Supports both pushing binary packages, configuration files, and other artifacts from the control center or a remote resource machine to designated paths on massive endpoints, and pulling remote business logs and files back to the source for aggregation.
*   **Target Blacklist/Whitelist Control**: Protected by the underlying "High-Risk Path Interception System," file placement addresses are subject to blacklist and whitelist restrictions (strictly prohibiting overwrites to foundational paths such as `/etc`, `/boot`).

## 5. Resource Library
A standardized repository for centrally managing high-quality, replayable assets accumulated over long operational cycles.
*   **Script Library**: Preserves commonly used environment repair and service detection scripts in reusable form. Provides code-level version management and online/offline workflow for scripts, preventing issues caused by unauthorized modifications by others.
*   **Playbook Library**: For complex deployment tasks (such as installing a database with prerequisite disk mounting), it supports importing external Ansible standard YAML Playbooks. Based on declarative state management, it maintains long-running operational environment architectures that cannot be reliably achieved with a single line of code.

## 6. Cron Jobs
Unattended processing gears designed for highly repetitive cyclical operations tasks.
*   **Cron-Level Scheduling**: Binds tasks solidified in the "Script Library" or "Quick Execute" with custom Cron expressions, enabling periodic operations like "clean up abandoned logs at 2 AM every night."
*   **Full Lifecycle Engine Management**: Provides strong intervention capabilities for periodic rule-based tasks — whether task "suspension (halt)," "restart," or projecting "the next three predicted trigger times."

## 7. High-Risk Configuration & Interception (Security Config)
The "defense fuse" that guards the inviolable boundaries of automation, designed to prevent operations from being fully compromised and causing system-wide paralysis.
*   **High-Risk Command Configuration**: Provides powerful regex capture policies that intercept users at the moment they submit dangerous commands (such as entering improper `rm -rf /` or forced kernel start/stop commands), immediately blocking distribution and sending alerts.
*   **High-Risk Path Configuration**: Combined with "File Distribution" actions, it designates file operation forbidden zones, absolutely prohibiting blind writes to paths critically related to system survival.

> **Warning / Security Best Practices:**
> 
> Never whitelist common high-risk commands under the pretext of testing convenience. Any compliant, frequently needed troubleshooting actions that require elevated privileges should first be encapsulated in the controlled "Script Library," rather than executed through scattered quick commands.

## 8. Execution History
The global operations process archive, and the first place to look when troubleshooting — the black box.
*   **Global Execution Timeline**: Records every execution serial number and overview, whether from quick triggers or scheduled dispatches. All execution details are stored in the database for on-demand review at any time.
*   **Deep-Dive Drill-Down**: In the various branch views of "Job Details," you can precisely trace each machine's anomalous distribution messages and final standard exit output. This ensures that who executed what, when, and what error was reported is recorded as indisputable evidence.
