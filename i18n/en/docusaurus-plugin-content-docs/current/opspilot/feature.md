---
sidebar_position: 3
---

# Features

OpsPilot organizes the AI building and management pipeline into three layers: underlying resources, mid-level logic processing, and top-level view delivery. Below is a breakdown of key features by platform navigation module.

## 1. Models (Provider)
As the foundation of a full-stack agent, "Model Management" is designed to centrally register, store, and manage LLM API assets from various vendors within the enterprise.

*   **Multi-Dimensional Model Governance**: Supports centralized integration and toggling of various model categories including LLM, Embedding, Rerank, and even OCR (eliminating the need for business users to repeatedly configure LLM environments and authentication for each project).
*   **Controllable Visibility Boundaries**: Each model supports isolation management through "team groups" and status controls (addressing the risks of disordered model assets and cross-department authorization breaches).
*   **Sensitive Configuration Encryption**: Backed by high-security logic controls, fields such as API Keys are automatically encrypted (preventing plaintext password exposure in the frontend or log leakage).

## 2. Tools (Tool)
Tool management extends LLMs beyond passive question-answering, enabling them to "reach out" and interact with your existing internal enterprise systems.

*   **Out-of-the-Box Integration Architecture**: Supports one-click creation from a built-in library or custom import of invocation schemes (enabling LLMs to directly handle tasks such as network monitoring, ticket approval queries, and more).
*   **MCP Protocol Extension**: Strong compatibility with MCP tool fetching capabilities at the underlying layer (facilitating users to integrate a vast array of third-party ecosystem APIs through the latest protocol).
*   **Context Parameter Isolation**: Tool execution parameters feature clear "text" or "password" differentiation (ensuring parameters are valid and sensitive data flows securely when tools send instructions to external third parties).

## 3. Knowledge Base (Knowledge)
The knowledge base is the definitive remedy for mitigating the "hallucination" risk of large language models. Enterprises can centrally manage their "memory" here.

*   **Full-Format Text Content Extraction**: Supports knowledge sources via direct local document upload or custom links (addressing the inability of LLMs to answer domain-specific questions due to lack of real-time access to specialized corpora).
*   **Automatic Preprocessing & Visual Cleansing**: The backend handles document chunking and segmentation steps (resolving the severe limitations faced by non-AI-specialist administrators when adjusting retrieval chunk sizes).
*   **Fine-Grained Recall Control**: Supports dynamic changes to retrieval Rerank models, with configurable recall modes and similarity threshold filtering (helping system administrators optimize the accuracy and confidence of AI-adopted answers).
*   **Relational Graph Restructuring**: Supports knowledge graph extraction and generation based on Q&A documents (enabling LLMs to perform clearer causal and panoramic structural logical profiling).

## 4. Agents (Skill)
Agents are logical unit carriers that assign "execution roles" to LLMs in specific scenarios.

*   **Ready-to-Use Scenario Templates**: Built-in multi-category agent template library (addressing the pain point of beginners not knowing how to tune Prompt parameter settings when facing complex parameter configurations).
*   **Plug-and-Play Enhancement Mounting**: Directly enable RAG capabilities and bind associated "Knowledge Bases" with adjustable threshold parameters (ensuring agents can think within defined scope using tightly coupled business logic).
*   **Long-Term Memory Management**: Provides strict mode and chat history carry-over settings (enabling agents to maintain contextual conversation continuity tracking over extended interaction timelines).

## 5. Studio & ChatFlow
The mid-platform workspace where delivery personnel ultimately assemble agents and deliver services.

*   **Service Mode Switching**: Provides application cards for single-scenario Pilot customization and LobeChat session-type architecture management (addressing engineering obstacles preventing modular deployment of intelligent applications).
*   **Multi-Source Trigger Access**: Built-in rich workflow entry capabilities, aligned with OpenAI parallel interfaces, RESTful APIs, and scheduled batch processing (expanding upstream integration channels).
*   **WYSIWYG Graph Orchestration**: Controlled by a topology canvas built on node-based ChatFlow.

> **Interface Guide:**
>
> ![ChatFlow Orchestration Canvas Example](https://bklite.ai/docs/assets/opspilot-chatflow.png)
>
> *   **Configuration Logic**: On this canvas, if you need to design logic "branches," simply drag a "Logic Decision" node from the left panel, and route the flow to different agents and actions based on the Q&A intent context.

## 6. Session Tracking & Platform Channels (Sessions)
Operations and compliance support components.

*   **Multi-Channel Multimodal Publishing**: Supports open-loop integration with DingTalk, WeChat Official Accounts, WeCom groups, and even GitLab (addressing the difficulty of integrating model platforms into enterprise collaboration environments).
*   **Business Audit Closed-Loop Logging**: Provides visual interactive Chat Logs and full-chain usage details for underlying compute/token consumption (helping enterprises mitigate business risks and control invisible model consumption costs).

> **Warning / Security Best Practices:**
> To protect data assets throughout the entire process, be sure to set appropriate team scopes for "Knowledge Bases" and associated "Agents" to limit cross-contamination. Additionally, all external platform callback Webhook URLs should be stored with strong desensitization.
