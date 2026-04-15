---
sidebar_position: 3
---

# Feature Guide

MLOps is dedicated to deconstructing the complex and opaque world of AI model engineering. The system organizes the workspace by algorithm application category, with each category sharing four unified core functional domains. Below is a complete breakdown of the MLOps module's architecture and core capabilities.

## 1. Unified Algorithm Scenario Management
This is the heartbeat bus of the entire engine, providing soft-isolated spaces for underlying physical and logical structures based on different business forms.

*   **Multi-source heterogeneous model integration**: All 6 built-in algorithm dashboards (anomaly detection/time series prediction/log clustering/text classification/image classification/object detection) provide a unified, homogeneous information architecture pipeline (addressing the governance gap where users struggle with unified management across different scenarios and vendor models due to numerous scattered components).
*   **Configuration-level dynamic mounting (Algorithm Configuration)**: Provides dedicated input parameter strategy controls for different algorithms (addressing the challenge that different built-in algorithm packages require varying underlying image parameter combinations, through visual dynamic forms and configuration identifier isolation, ensuring that the form fields presented to users are the most relevant configuration parameters for each specific scenario).

## 2. Dataset Management
"A model becomes what it eats." This module is not just a storage disk but the source workshop that controls feeding standards.

*   **Structured sample management and pre-labeling**: Beyond basic multi-scenario file or media image upload/CRUD operations, it includes a built-in purpose labeling configurator that designates each individual entry's purpose as "training," "validation," or "testing" (addressing the baseline requirement that without quality delineation after data asset ingestion, the entire training cycle becomes uncontrollable).
*   **Temporal snapshot release controller**: Leveraging a powerful published version baseline snapshot model, it supports archiving, restoring, or full-volume compressed download of prepared data baselines at any time (preventing rollback incidents where continuous manual sample annotation overwrites early high-value experiment model dependencies).

## 3. Training Task Orchestration and Observation (Training)
Transforms what was previously console-based `python .py` training scripts into a highly visual, controllable state machine on the platform.

*   **Controlled periodic engine orchestration**: Enforces that tasks must be bound to a specific historical dataset and a unique model algorithm parameter form, with full UI-based start and stop operations (providing concurrency prevention and re-run safety mechanisms, restricting running tasks from being accidentally terminated).
*   **Transparent observability dashboard**: Provides powerful metric history drill-down capabilities, including parameter inspection panels and real-time model internal version retrospection (addressing the black-box dilemma where business personnel are helpless when traditional algorithm experiments throw server console errors, unable to investigate or adjust parameters; also providing a shortcut channel for downloading output files).

## 4. Capability Publishing and Real-Time Inference (Serving)
Receives model outputs and transforms them into enterprise public service endpoints that continuously feed external systems.

*   **Hot-swappable seamless model deployment engine**: Deeply integrated with the system's actual runtime, supporting one-click mounting and publishing of new prediction inference services along with underlying container resource allocation (eliminating the lengthy, inefficient process where data scientists must seek operations engineers to set up K8s applications and Nginx rules just to publish prediction models).
*   **Sandbox visual inference experience**: In addition to providing a unified routing pipeline for backend integration, an online inference experience area is available on the web interface.

> **UI Guide:**
>
> ![Capability Publishing and Online Inference Workspace](https://bklite.ai/docs/assets/mlops-serving-predict.png)
>
> *   **Configuration logic**: This is the experience page after you have deployed a model service. Regardless of whether the underlying algorithm scenario is CV image classification or log tracing, you simply place formatted text in the input workspace on this interface, click the submit button, and the system will cross the built-in service firewall in real time to retrieve results and visually project them in the result panel on the right for your reference.

> **Warning / Security Best Practices:**
> 1. Once data is in a mounted training state or published as an immutable version baseline, the original mappings cannot be forcibly destroyed.
> 2. Publishing a model service essentially dispatches tasks to the platform's underlying physical container pool for actual runtime allocation, occupying hardware port-level instances. After completing periodic prediction batch jobs, it is recommended that administrators develop the habit of entering the "Capability Publishing" area in the backend to manually stop or remove tasks that remain in a running state, preventing zombie resource consumption on the platform.
