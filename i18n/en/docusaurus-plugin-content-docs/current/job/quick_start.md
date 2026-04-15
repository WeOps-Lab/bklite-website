---
sidebar_position: 2
---

# Quick Start

This guide will walk you through using the "Quick Execute" feature to complete your first batch script execution on target hosts in the fastest way possible.

## 1. Prerequisites

Before you begin, ensure your target hosts meet one of the following management modes:
*   **Agent Mode**: The target host has been installed with a controller through "Node Management" and shows an "Online" status in the system.
*   **Agentless (Ansible) Mode**: The target host has SSH access and is correctly associated with matching credential information in the system.

## 2. Step-by-Step Guide

### Step One: Navigate to the Quick Execute Page
Log in to the console, then click on the left sidebar navigation: **"Job Management"** > **"Quick Execute"**.

### Step Two: Write the Execution Script
1. Above the code editing area on the left side of the page, select your "Script Language" (e.g., **Shell**).
2. Enter a simple status probe command in the code box, such as checking the remote machine's uptime and memory:
    ```bash
    echo "=== System Uptime ==="
    uptime
    echo "=== Memory Usage ==="
    free -m
    ```

### Step Three: Select Target Hosts
1. In the "Target Selection" area on the right half of the page, click the corresponding "+ Add" button.
2. After the topology structure domain pops up, you can select the business machines to include in the test through the existing system topology module, or directly enter the target hosts through "Manual IP Input."
3. After confirming the selected machine list is correct, click the confirm button in the lower-right corner to close the popup.

### Step Four: Execute the Job
1. If no special privileges are required, you can keep the "Execution Account" and "Timeout" at the system default values below.
2. Click the main "Execute" button at the bottom of the page to submit the job for distribution.

> **Warning / Security Best Practices:**
> 
> In the instant before you click execute, the execution code will pass through the "High-Risk Command Configuration" layer for identification. If you accidentally enter a destructive statement (such as `rm -rf /`), the job will be directly intercepted and blocked by the platform, comprehensively preventing low-level mistakes.

## 3. Result Verification & Closure

Submitting the operation request is nearly instantaneous. The page will automatically redirect to the diagnostic tracking page for that task:

> **Interface Guide:**
> 
> *   **Overall Success Rate Overview**: The pie chart or progress bar at the top of the interface will intuitively show you the overall distribution of successful hosts vs. failed hosts.
> *   **Log Result Tracking**: Click on the target node we just selected in the host table below. The right panel or expanded popup will directly output the `Uptime` and `Memory` information queried through the command! If the command exit code is abnormal (i.e., Exit Code is not 0), you can also directly identify the cause of the anomaly in the execution log column.
