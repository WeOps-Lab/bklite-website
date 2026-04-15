---
sidebar_position: 2
---

# Quick Start

This guide will walk you through configuring models, injecting enterprise local knowledge, and quickly publishing an intelligent application for conversational interaction via WeCom or Web from scratch in OpsPilot.

## Prerequisites
*   You have obtained access to the OpsPilot platform and editing permissions for your team.
*   You have obtained the corresponding LLM API keys from cloud providers in advance (e.g., DeepSeek, Tongyi Qianwen, etc.).

## Step-by-Step Guide

### 1. Configure Model Integration (Provider)
With a computational "brain," agents can perform reasoning.
1.  Navigate to the "Models (Provider)" module and click "New Model."
2.  Select the model category (LLM, Embed, etc.) and vendor, then enter your API key and other authentication information.
3.  Click "Save" and enable the model by setting its status to visible. For easier management, you can group similar models into specific business groups.

### 2. Inject Enterprise Private Knowledge (Knowledge)
Give the model enterprise-level "memory" to avoid "response hallucinations."
1.  Go to the "Knowledge Base (Knowledge)" module, create a new knowledge base, and select the corresponding base Embed model for knowledge segmentation.
2.  Upload core local files in the knowledge base details.
3.  Wait for the backend to complete automatic parsing, preprocessing, and chunking of the documents. When the status shows "Ready," your agent can reference this content during retrieval at any time.

### 3. Create an Agent (Skill)
Assemble the model and knowledge base to define the AI execution role that does the actual work.
1.  Go to the "Agents (Skill)" module and click "New" to create a new dedicated agent.
2.  Configure the "System Prompt" for the agent to set its long-term memory and persona rules.
3.  Bind the LLM model configured in Step 1, and enable **RAG** capability to associate the private knowledge base created in Step 2.
4.  Save the configuration, and you can send a few test questions in the "Test Window" on the right side of the page to check if it has mastered your internal knowledge.

### 4. Orchestrate Workflow and Publish Application (Studio)
Use ChatFlow to assemble the agent into a service that can be exposed externally.
1.  Go to the "Studio" module and select or create a new **ChatFlow** type application entity.
2.  On the visual canvas, drag your agent and routing nodes from the left panel, and connect them to form a smooth automated processing workflow.
3.  Click the "Channel" card, select the desired channel type (e.g., **WeCom Bot** or **DingTalk**), and fill in the webhook address or parameters.
4.  Switch the application status and confirm "Go Live."

## Result Verification & Closure

After completing the above configuration, your enterprise intelligent assistant is officially launched:
1.  Go to the channel you just configured (e.g., in your WeCom discussion group), directly @mention the bot to ask questions, and see if it responds as expected.
2.  You can return to the "Application Logs" and "Application Statistics" features in "Studio" at any time:
    *   **Business Audit Closure**: Review execution logs to track model processing time and ensure Q&A behavior meets enterprise expectations.
    *   **Usage Tracking Closure**: Use the trend dashboard to identify which questions have the highest request frequency, driving focused knowledge base updates for those high-frequency topics.
