---
sidebar_position: 2
---

# Quick Start

This guide walks you through setting up a new department's organizational structure from scratch in the System Management module, assigning employee accounts, and granting core permissions — ultimately ensuring that department employees can access the designated applications and data securely and properly.

## Prerequisites
*   Log in to the BK-Lite console with an account that has "Super Admin" or "Platform Admin" permissions.
*   Before distributing access to business departments, ensure you are clear about the maximum permission scope required for each department's system boundaries.

## Step-by-Step Guide

### 1. Set Up Organization and User Structure (User Management)
At the initial stage, you need to map the enterprise's actual personnel and structure to the platform.
1.  Navigate to "User Management" > "Organization Structure", click "Create" and build a tree-based organizational structure specific to your enterprise (e.g., R&D Department > Frontend Team).
2.  Go to "User List", click "Add User", fill in the employee's basic information (such as name, email, login name, etc.), and bind them to the organization you just created.

### 2. Configure Application Roles and Assign Permissions (Application Management)
With the organization and users in place, the next step is to define what they can "do" and what they can "see" on the platform.
1.  Navigate to "Application Management" > "Role Management", select the application the employee needs to use (such as CMDB, monitoring, etc.), and create a "role" that represents this type of personnel (e.g., Read-Only User, Inventory Manager).
2.  Configure the **menu settings** and **data permission bindings** for this new role. This step determines which views and data scopes the role can access.
3.  Click the "Members & Organizations" tab for the role, and assign the organizations or specific users from Step 1 to the role. The system will automatically distribute and refresh the corresponding permission rules.

### 3. Strengthen System Security (Security Management)
Protecting the system must start at the login gate.
1.  Navigate to "Security Management" > "Security Settings".
2.  To ensure enterprise-grade account security, configure and enable your password policy mechanisms (e.g., adjust minimum password length, configure account lockout after multiple failed password attempts). You can also optionally set up a unified authentication endpoint based on an enterprise identity source for consistency.

### 4. Set Up System Notification Channels (Notification Channels)
If you need various business modules (such as the Alert Center) to push messages to internal personnel, you must first set up the delivery capability here.
1.  Go to "Notification Channels" > "Channel List", click "Create".
2.  Based on your enterprise's actual communication tools, set the type (e.g., WeCom bot or Feishu bot) and enter the corresponding Webhook URL or secret key credential parameters.

## Verification and Closure

After completing the basic "registration" process above:
1.  Use the new user account created in Step 1 to attempt logging into the system in a browser's incognito mode. The system should prompt the new user with enterprise password compliance policy requirements.
2.  After successful login, check the sidebar navigation: you should only be able to see the **specific menu pages** that were made accessible through the permissions assigned in Step 2 (thus completing the permission isolation verification loop).
3.  Return to the Super Admin's main account view and open "Security Management" > "Operation Logs" and "Login Logs". The log list should clearly and accurately record the new employee's first login activity, ensuring that all application access is fully traceable.
