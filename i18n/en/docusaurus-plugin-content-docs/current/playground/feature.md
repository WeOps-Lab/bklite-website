---
sidebar_position: 3
---

# Features

The Console module aims to find a common anchor point across the various complex core business functions of the entire system. Within this overarching framework, we break down its main capabilities into three domains: portal entry aggregation, global message delivery center, and personal base configuration.

## 1. Portal Entry Area (Home)
The primary interaction area after users step through the door, responsible for resource aggregation and routing dispatch.

*   **Dynamic Application Card Display**: Before page rendering, the backend automatically associates and verifies the role configuration tables distributed across all affiliated organizations for the employee, achieving a "what you see is what you have permission to use" experience (effectively preventing new employees from stumbling into unauthorized systems when facing a vast sea of applications and experiencing unnecessary frustration). Cards also support automatic extraction of the latest system locale configuration for display.
*   **Personalized Card Flow Editor**: Provides a drag-and-drop-enabled canvas (solving the inefficiency issue caused by traditional default flat layouts on large screens), supporting individuals in adding, removing, and saving entry order based on their workflow needs, with system-recognized save states and permanent cloud synchronization.
*   **First-Visit Guided Initialization**: Initiates a mandatory guided loading process for accounts that are truly accessing the system for the first time and have no underlying historical configuration attributes retained.

## 2. Notification Service Center (Notification Center)
A built-in subscription inbox available to all users. A hub where various associated service event statuses and notification directives converge.

*   **Granular Paginated Query Filter**: At the data level, entries are sorted in reverse chronological order (newest first). In addition to querying the overall read volume, users can precisely filter by the corresponding sub-module component category of delivered notifications and by individual "read/unread status" (helping users avoid missing any valuable important system message).
*   **Seamless Batch Processing**: Beyond normal point-to-point event viewing, when messages accumulate, the system offers one-click "mark all as read" or complete entry deletion capabilities (ensuring enterprise personnel can rapidly process pending items and achieve automatic storage cleanup).

## 3. User Profile Center (User Profile)
Supports management of the user's core credential status and business communication preference settings.

*   **Regional Preference Synchronization**: Provides comprehensive language support (internationalized Chinese and English) and a basic timezone corrector (ensuring absolute local time alignment on the display side for log audit streams).
*   **Email Two-Way Verification Rebinding**: Supports rebinding of the personal identity auxiliary contact email with security-blocking verification messaging (preventing the risk of core information such as internal verification credentials being leaked externally due to identity theft).
*   **Password Rotation with Strong Policy Validation**: For internal password changes, it provides security baseline configuration constraints based on unified platform-wide synchronized control (a new password can only be saved and take effect across all endpoints when the input meets the minimum complexity requirements enforced by the security rules on the control side, such as special characters and mixed-case character minimums).

> **Warning / Security Best Practice:**
> "Password changes, security verification, and other operational modifications are only effective for the current session holder." Therefore, if you leave your workstation screen for an extended period, it is recommended to develop the habit of actively logging out, locking the screen, and signing off. If you perform a password update here, the system will also automatically take over, invalidate, and forcibly revoke any remaining associated tokens (such as those from mobile APP sessions or browser incognito window remnants). Please remember to perform a fresh secure login verification across all endpoints afterward.
