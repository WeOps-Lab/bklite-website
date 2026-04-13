---
sidebar_position: 3
---

# Feature Guide

The Console module aims to find a common anchor point for governance across the various core business functions of the entire system. Under this overarching framework, its main capabilities are divided into three areas: portal entry aggregation, global message delivery center, and personal profile configuration.

## 1. Portal Area (Home)
The primary interaction zone after users enter the platform, responsible for resource aggregation and routing dispatch.

*   **Dynamic Application Card Display**: Before page rendering, the backend automatically associates and validates the role configuration tables assigned within all affiliated organizations of the employee, achieving a "what you see is what you have access to" experience (effectively resolving the frustration of new employees accidentally clicking into unauthorized systems when facing a vast array of applications). Cards also automatically extract and display the latest system language configuration.
*   **Personalized Card Stream Editor**: Provides a drag-and-drop enabled canvas (solving the inefficiency of traditional system-default flat layouts for users with large screens), supporting individual addition, removal, and saving of entry ordering based on personal workflows, with system-recognized save states and permanent cloud persistence.
*   **First-visit Onboarding Guide**: For accounts that are genuinely accessing the system for the first time with no historical configuration properties, the system initiates a mandatory guided initialization process.

## 2. Notification Center
An internal subscription inbox available to all users, serving as the aggregation point for all associated service event statuses and notification directives.

*   **Fine-grained Paginated Query Filter**: At the data level, messages are sorted in reverse chronological order. In addition to querying overall message volume, users can precisely filter by the source sub-module/component category and individual "read/unread" status (helping users not miss any valuable system messages).
*   **Seamless Batch Processing**: Beyond standard point-to-point event browsing, when messages accumulate, a one-click "mark all as read" or full-entry deletion function is available (ensuring enterprise personnel can rapidly process and auto-release pending information).

## 3. User Profile Center
Supports management of the user's core credential status and business communication preferences.

*   **Regional Preference Synchronization**: Provides comprehensive language (internationalized Chinese/English support) and basic timezone adjustment (ensuring absolute local time alignment for log audit streams on the display side).
*   **Email Two-way Verification and Rebinding**: Supports personal identity auxiliary contact email rebinding with security-blocked verification messaging (mitigating the risk of identity theft leading to core credential information being leaked externally).
*   **Password Rotation with Strong Policy Validation**: Provides security baseline configuration constraints based on the entire platform's unified foundation for internal password changes (passwords can only take effect and be used across devices when the replacement credential meets the minimum complexity requirements configured on the control side, such as special characters, mixed-case characters, etc.).

> **Warning / Security Best Practice:**
> "Password and security verification changes are only effective for the current user in the active session." Therefore, if you leave your workstation for an extended period, it is recommended to develop the habit of actively logging out and locking the screen. If you perform a password update here, the system will automatically invalidate and revoke all other remaining associated tokens (such as those from mobile APP or browser incognito window sessions), so please remember to perform a fresh secure login verification across all devices.
