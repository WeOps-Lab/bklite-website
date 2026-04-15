---
sidebar_position: 1
---

# Product Introduction

## Product Overview
MLOps is the model production and operations pipeline module custom-built by BK-Lite for enterprises. It connects the complete workflow from "dataset management" and "training task orchestration" to "service capability publishing" and "online inference." The platform natively integrates algorithm scenario systems applicable to AIOps -- including time series prediction, log clustering, and anomaly detection models -- as well as multimodal scenarios such as image/text classification and object detection, aiming to provide businesses with a lightweight, transparent, and out-of-the-box AI deployment pathway.

## Core Advantages
*   **Multi-scenario "one-stop" management**: Built-in templated workflow support for 6 core algorithm scenarios (anomaly detection, time series prediction, log clustering, text classification, image classification, object detection). Each algorithm domain has independently decoupled data and business logic, yet maintains highly consistent interaction structures and user experiences, significantly reducing cross-scenario learning costs.
*   **End-to-end model pipeline**: Black-boxes the complex implementation steps of algorithm engineering into four clear phases: "prepare data," "publish version," "start training," and "publish inference service." This helps business teams complete the full model lifecycle within a single platform, eliminating the fragmented experience of jumping between various isolated component tools.
*   **Panoramic training observation and tracking**: Provides complete white-box visibility into the model "training" process. Real-time detailed runtime logs, model training evaluation metric curves, run history, and corresponding experiment version queries are available, making model outcomes explainable and traceable.
*   **Zero-friction production deployment**: Built-in runtime container and lifecycle state hosting engine capabilities. Once model training is complete, a single click transforms the output version into a service entity with a real API endpoint and an independent online inference playground.

## Use Cases
*   **Agile AIOps foundation**: Operations and development personnel can collect metric samples from various business system performance parameters, use the platform's "Anomaly Detection" and "Log Clustering" scenario-specific training for local early warning models, and integrate with monitoring platforms through the underlying inference API pipeline to achieve automated anomaly identification.
*   **Enterprise digital image or text quality inspection**: Data operations teams can import quality control samples into the platform for classification labeling, leverage "Computer Vision (CV)" type algorithms to assemble recognition services, and provide them to downstream approval workflows for high-volume compliance verification or archival determination.
*   **Customized model tuning and distribution center**: Algorithm engineers can focus on algorithm parameter experimentation without managing underlying container start/stop or service isolation port strategies, quickly releasing different dataset versions and publishing comparison versions through the online interface to accelerate model production iteration.
