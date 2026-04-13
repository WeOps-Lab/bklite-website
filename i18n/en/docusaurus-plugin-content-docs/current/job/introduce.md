---
sidebar_position: 1
---

# Product Introduction

## 1. Overview
Job Management is a core control platform for IT infrastructure automation operations. Through a unified task distribution channel, it provides operations engineers with powerful capabilities for batch script execution, automated file distribution, Playbook orchestration, and scheduled task management. The system supports both **traditional Agent-based management mode** and **lightweight agentless (Ansible) mode**, helping enterprises significantly improve the execution efficiency of batch operations tasks and reduce business risks while ensuring security and compliance.

## 2. Core Advantages
*   **Dual-Engine Architecture**: Supports high-speed concurrent execution through Agents on nodes with installed controllers, as well as direct task distribution to agentless nodes via the Ansible protocol. Both engines abstract away differences at the user level, meeting management requirements across different security levels and network environments.
*   **Secure and Compliant Execution Channel**: The system uses dual validation through regular expressions and path whitelists to block unauthorized destructive operations at the distribution source, ensuring every batch command and file distribution stays within the authorized security boundary.
*   **Unified and Rich Resource Repository**: Beyond supporting plug-and-play temporary commands, it also includes a standardized "Script Library" and "Playbook Library" with multi-version management and release workflow control, facilitating continuous accumulation and reuse of operations assets across the enterprise.
*   **WYSIWYG Tracking Closed Loop**: After task execution, a globally unique tracking serial record is generated. Operations personnel can drill down through an intuitive detail interface to analyze each host's standard output (Stdout) and exit code (Exit Code), providing precise and visual fault diagnosis.

## 3. Use Cases
*   **Batch Application Release and Deployment**: Combining "File Distribution" and "Playbook Library" capabilities, batch-deliver updated application artifacts to designated business cluster nodes, and automatically start services, perform warm-up, and run self-tests.
*   **Emergency Recovery for System Anomalies**: When the alerting system raises critical situations like network saturation or load spikes, on-call operations personnel can use the "Quick Execute" entry point to load emergency scripts and rapidly push temporary degradation and diagnostic isolation commands to affected clusters.
*   **Global Automated Asset Inspection**: Highly repetitive daily operations tasks such as zombie process measurement, expired business log cleanup, and disk space detection can be packaged and solidified in the "Script Library," then combined with "Cron Jobs" to form an automated routine inspection and self-healing closed loop.
