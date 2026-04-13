---
sidebar_position: 2
---

# Quick Start

This guide will walk you through the complete core workflow from scratch in the MLOps module, using basic algorithm scenarios like "Anomaly Detection" as an example: "Prepare Dataset -> Start Model Training -> Publish Service -> Online Inference."

## Prerequisites
*   You already have a BK-Lite access account with management view permissions granted for MLOps resources.
*   You have prepared a test dataset suitable for the chosen algorithm scenario (e.g., a structured `CSV` file with metric-formatted data that matches the selected feature characteristics).

## Step-by-Step Guide

### 1. Mount the Data Foundation (Dataset Management)
The quality of a model heavily depends on the quality of its "feeding."
1.  Log into the system, enter MLOps, and select your target algorithm scenario from the "Scenario Dropdown" at the top-left of the platform (e.g., **Anomaly Detection** or **Image Classification**).
2.  Navigate to the "Dataset" menu in the left sidebar, click "New Dataset," and enter the basic information to create the dataset placeholder.
3.  Click on the newly created dataset details page, batch upload your raw sample files, and based on business rules, label them with their intended purpose on the page, such as "Training Set" or "Test Set."
4.  After sample allocation is complete, click "Publish Version" at the top to create a "data baseline (V1)" snapshot for mounting. The status will transition to "Published" and become available.

### 2. Schedule and Generate the Model (Training Task Management)
Assemble the data baseline you just created with the system's underlying algorithm to let the machine automatically learn patterns.
1.  Return to the left menu, enter the "Training Tasks" area, and click "New Task."
2.  In the task configuration dialog, you only need to mount two key items: (1) the "Dataset Published Version" you created in Step 1; (2) the algorithm configuration and core input features you want to use.
3.  After saving, the task will be in "Pending Training" status. Click the "Start Training" button in the task list.
4.  During actual training (status: "Training"), you can refresh at any time and inspect the task's **Metric History** and **Runtime Parameters** panels to evaluate effectiveness and estimate remaining wait time.

### 3. Build a Consumable Capability (Capability Publishing)
A model's business value can only be realized once it becomes an online API or test endpoint.
1.  After the training task status changes to "Completed," click "Capability Publishing" in the left sidebar and select "New Service."
2.  In the dialog, specify the training task record that just completed and the exact "model output version number" it produced.
3.  After saving, the system will allocate a service in dormant status. Click "Start" in the action column, and the system's underlying container hosting will launch the corresponding inference container package and establish connectivity.

## Result Verification and Closure

After successfully launching the container (i.e., the service status displays **Active/Started**), do not leave the page just yet:
1.  Find your deployed rule in the Capability Publishing section and click the "Online Inference" button.
2.  In the visual interactive window that appears, submit a piece of completely new data or a local test image that was never fed to the model, and click submit.
3.  Observe the model output results in the **Inference Response Area** below, and evaluate whether the identification and labeling are accurate.
4.  **Business closure recommendation**: Once the inference quality meets your acceptance criteria, your related client systems or internal operations modules can integrate with the unified API published by this service for fully automated high-frequency identification calls. If the results are unsatisfactory, return to the "Dataset Management" step, supplement your special case data, republish as `V2`, and conduct a new round of iterative training.
