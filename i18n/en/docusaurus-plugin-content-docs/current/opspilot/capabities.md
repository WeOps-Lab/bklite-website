---
sidebar_position: 5
---

# Capabilities Overview
OpsPilot's capability system consists of two core modules:
- **Multi-Type LLM Integration**: Supports mainstream domestic and international LLM, Embed, Rerank, and OCR models, meeting AI scenario requirements for Q&A, retrieval, document understanding, and more.
- **Built-in Platform Tools**: Out-of-the-box operations and general-purpose tools covering cluster management, CI/CD, inspection, office automation, and other scenarios, ready to use without additional configuration.

## Models

OpsPilot supports integration with various mainstream large language models and industry models. This chapter introduces the different model types, capability characteristics, and applicable scenarios to help users flexibly select the right model based on business requirements.

### LLM Models

#### HuggingFace Series

##### QwQ (Alibaba Cloud Tongyi Qianwen Reasoning Model)

- **Core Function**: Enhances mathematical, programming, and logical reasoning capabilities through reinforcement learning, able to analyze problems step by step using "chain of thought."
- **Advantages**:
  - Small yet powerful: With only 32 billion parameters (approximately 320 million "knowledge nodes"), its performance approaches the 670 billion parameter DeepSeek-R1 model.
  - Multi-domain proficiency: Excels at math problem solving, code generation, and complex logical reasoning (such as contract clause analysis).
- **Applications**:
  - Mathematical reasoning: Solves complex mathematical problems, such as advanced algebraic equations, geometric proofs, etc.
  - Programming assistance: Helps write code, debug code, and optimize code logic.
  - General reasoning: Handles various problems requiring logical thinking, such as contract clause interpretation, logic puzzles, etc.

#### DeepSeek Series (High-Efficiency Domestic Models)

##### DeepSeek-R1:1.5b

- **Core Function**: A lightweight large language model focused on the code domain, supporting Python, Java, and other programming languages.
- **Advantages**:
  - Low-configuration operation: Can run on mobile phones or ordinary computers (8GB RAM), minimal resource consumption.
  - Fast code generation: Code completion, function generation, and error debugging 3-5x faster than manual work.
- **Applications**:
  - Code generation: Quickly generates code in various programming languages such as Python, Java, C++, etc.
  - Code optimization: Optimizes existing code to improve runtime efficiency and readability.
  - Code debugging: Checks for syntax errors and logic errors in code and provides correction suggestions.

#### OpenAI Series (World-Leading General Models)

##### 1. GPT-3.5-Turbo-16K

- **Core Function**: A general-purpose large language model with extended context processing capability, handling long texts (12,000 characters) with high cost-effectiveness.
- **Advantages**:
  - Multi-task adaptability: Capable of writing articles, translation, data analysis, customer service Q&A, and more.
  - Cost-effective: Achieves a good balance between performance and cost, with lower usage costs compared to GPT-4.
- **Applications**:
  - Content creation platforms: Creators can use it to quickly generate article outlines and first drafts.
  - Enterprise document processing: Used for content summarization and key information extraction from contracts, reports, etc.

##### 2. GPT-4-32K

- **Core Function**: A top-tier large language model with ultra-long context processing capability and powerful multimodal abilities. Handles ultra-long texts (24,000 characters) and supports multimodal input (text + images).
- **Advantages**:
  - Powerful comprehensive capabilities: Excels in language understanding, reasoning, creative generation.
  - Multimodal fusion: Enables text-image fusion interaction and expands application scenarios.
- **Applications**:
  - Ultra-long text analysis: Processes text up to 32K tokens for deep analysis and understanding.
  - Multimodal interaction: Supports text and image input/output.
  - Complex problem solving: Solves advanced mathematical and specialized technical problems.

##### 3. GPT-4o (Multimodal All-in-One Model)

- **Core Function**: A flagship multimodal model supporting mixed input/output of text, audio, images, and video, focused on "all-in-one interaction" capabilities.
- **Advantages**:
  - Speed & cost innovation: 200% faster processing speed, 50% lower price, 5x higher rate limits.
  - Multimodal capability breakthrough: Precisely identifies image and video details, supports direct voice interaction with emotion recognition.
  - Enhanced reasoning: Sets new high scores in MMLU evaluations.
- **Applications**:
  - Real-time multimodal reasoning: Simultaneously performs real-time reasoning on audio, visual, and text data.
  - Cross-language translation: Handles 50 different languages.
  - Complex task handling: Strong text, reasoning, and coding capabilities.

#### LLM Model Summary

In addition to the models described above, OpsPilot currently supports the following full list of LLMs:

| Category | Model Icon | Model ID | Model Name | Model Type |
| --- | --- | --- | --- | --- |
| Baichuan | Baichuan | baichuan-2 | Baichuan 2 | Text |
| Baichuan | Baichuan | baichuan-2-chat | Baichuan 2 Chat | Text |
| CodeLlama | MetaAI | code-llama | CodeLlama | Code |
| CodeLlama | MetaAI | code-llama-instruct | CodeLlama Instruct | Code |
| CodeLlama | MetaAI | code-llama-python | CodeLlama Python | Code |
| CodeGeeX | CodeGeeX | codegeex4 | CodeGeeX4 | Code |
| CodeQwen | Alibaba | codeqwen1.5 | CodeQwen1.5 | Code |
| CodeQwen | Alibaba | codeqwen1.5-chat | CodeQwen1.5 Chat | Code |
| CodeShell |  | codeshell | CodeShell | Code |
| CodeShell |  | codeshell-chat | CodeShell Chat | Code |
| Codestral | Mistral | codestral-v0.1 | Codestral v0.1 | Code |
| CogAgent | Zhipu | cogagent | CogAgent | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek | DeepSeek | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-chat | DeepSeek Chat | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-coder | DeepSeek Coder | Code |
| DeepSeek | DeepSeek | deepseek-coder-instruct | DeepSeek Coder Instruct | Code |
| DeepSeek | DeepSeek | deepseek-prover-v2 | DeepSeek Prover v2 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-r1 | DeepSeek R1 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-r1-0528 | DeepSeek R1 0528 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-r1-0528-qwen3 | DeepSeek R1 0528 Qwen3 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-r1-distill-llama | DeepSeek R1 Distill Llama | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-r1-distill-qwen | DeepSeek R1 Distill Qwen | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-v2-chat | DeepSeek V2 Chat | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-v2-chat-0628 | DeepSeek V2 Chat 0628 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-v2.5 | DeepSeek V2.5 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-v3 | DeepSeek V3 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-v3-0324 | DeepSeek V3 0324 | Reasoning Enhanced |
| DeepSeek | DeepSeek | deepseek-vl2 | DeepSeek VL2 | Multimodal |
| DianJin |  | DianJin-R1 | DianJin R1 | Reasoning Enhanced |
| ERNIE | Baidu | Ernie4.5 | ERNIE 4.5 | Text |
| FinLLM |  | fin-r1 | Fin R1 | Reasoning Enhanced |
| Gemma | Gemma | gemma-3-1b-it | Gemma 3 1B IT | Text |
| Gemma | Gemma | gemma-3-it | Gemma 3 IT | Text |
| GLM (Zhipu) | ChatGLM | glm-4.1v-thinking | GLM 4.1V Thinking | Reasoning Enhanced |
| GLM (Zhipu) | ChatGLM | glm-4.5 | GLM 4.5 | Text |
| GLM (Zhipu) | ChatGLM | glm-4v | GLM 4V | Text |
| GLM (Zhipu) | ChatGLM | glm-edge-chat | GLM Edge Chat | Text |
| GLM (Zhipu) | ChatGLM | glm4-0414 | GLM4 0414 | Text |
| GLM (Zhipu) | ChatGLM | glm4-chat | GLM4 Chat | Text |
| GLM (Zhipu) | ChatGLM | glm4-chat-1m | GLM4 Chat 1M | Text |
| Gorilla |  | gorilla-openfunctions-v2 | Gorilla OpenFunctions v2 | Reasoning Enhanced |
| OpenAI | GPT | gpt-2 | GPT-2 | Text |
| LLaMA | Meta | llama-2 | LLaMA 2 | Text |
| LLaMA | Meta | llama-3 | LLaMA 3 | Text |
| LLaMA | Meta | llama-3.1 | LLaMA 3.1 | Text |
| LLaMA | Meta | llama-3.2-vision | LLaMA 3.2 Vision | Multimodal |
| LLaMA | Meta | llama-3.3-instruct | LLaMA 3.3 Instruct | Text |
| Mistral | Mistral | mistral-instruct-v0.3 | Mistral Instruct v0.3 | Text |
| Mistral | Mistral | mistral-large-instruct | Mistral Large Instruct | Text |
| Mixtral | Mistral | mixtral-8x22B-instruct-v0.1 | Mixtral 8x22B Instruct v0.1 | Text |
| Qwen | Qwen | qwen2.5-instruct | Qwen2.5 Instruct | Text |
| Qwen | Qwen | qwen2.5-coder | Qwen2.5 Coder | Code |
| Qwen | Qwen | qwen3 | Qwen3 | Text |
| Qwen | Qwen | Qwen3-Coder | Qwen3 Coder | Code |
| Qwen | Qwen | Qwen3-Thinking | Qwen3 Thinking | Reasoning Enhanced |
| Yi | Yi | Yi-1.5-chat | Yi 1.5 Chat | Text |

*For the complete model list, please refer to the Chinese documentation.*

### Embed Models

#### FastEmbed (bge-small-zh-v1.5)

A lightweight Chinese semantic embedding model focused on converting Chinese text into computer-understandable "digital encodings," efficiently capturing semantic similarity.

- **Lightweight & Fast**: Only 95MB in size, runs on ordinary computers with millisecond-level response.
- **Chinese Optimized**: Deeply optimized for Chinese semantics, accurately recognizing idioms, internet slang, and professional terminology.
- **Low-Cost & Easy to Use**: Open-source and free, requires no complex configuration.

#### BCEmbedding (bce-embedding-base_v1)

A Chinese-English bilingual semantic bridge model that supports bidirectional semantic conversion between Chinese and English text.

- **Bilingual Precise Alignment**: Based on Youdao translation technology, cross-language retrieval accuracy improved by 40%.
- **Long Text Processing**: Supports overall semantic encoding of documents with tens of thousands of characters.
- **Two-Stage Retrieval**: First quickly filters semantically related texts, then precisely ranks results.

### Rerank Models

#### BCEReranker (bce-reranker-base_v1)

A cross-encoder-based Chinese-English-Japanese-Korean multilingual reranking model focused on fine-grained reranking of initial retrieval results.

- **Multilingual Cross-Domain Adaptation**: Supports Chinese, English, Japanese, and Korean.
- **Long Text Precise Ranking**: Breaks through the traditional 512-token input limit.
- **Absolute Score Filtering**: Outputs quantifiable "absolute relevance scores" (recommended threshold 0.35-0.4).
- **RAG Deep Optimization**: Achieves SOTA performance in LlamaIndex evaluations when combined with BCEmbedding.

### OCR Models

#### OlmOCR

A document parsing tool based on large language models, focused on converting PDFs and images into editable text with support for tables, formulas, and handwritten content.

#### AzureOCR

Microsoft Azure cloud OCR tool supporting multilingual text recognition with Form Recognizer integration for extracting structured data from documents.

#### PaddleOCR

An open-source OCR toolkit by Baidu providing end-to-end text detection, recognition, and direction classification supporting 80+ languages.

| Model      | Advantages                                     | Applications                                   |
|-----------|------------------------------------------|----------------------------------------|
| OlmOCR    | Multimodal fusion, complex layout parsing, structured output | Academic documents, handwritten archives, PDF digitization |
| AzureOCR  | Cloud service integration, 50+ languages, security compliance | Enterprise forms, contract parsing, real-time video text recognition |
| PaddleOCR | Lightweight open-source, 80+ languages (Chinese optimized), edge-cloud deployment | Mobile recognition, batch document processing, cross-language scenarios |

---

## Tools

### Operations Tools

#### Kubernetes Tools

A suite of operations and management tools for Kubernetes clusters, covering cluster resource queries, status monitoring, fault diagnosis, and configuration management.

- **CI/CD Pipeline Full-Chain Management**: Task visual management and automated triggering with parameterized builds.
- **Team Collaboration & Process Auditing**: Build task tracing and multi-tool integration support.
- **Fault Recovery & Emergency Handling**: Batch task operations and canary deployment support.

#### Jenkins

A collection of functions for interacting with the Jenkins CI/CD platform, providing the ability to query and operate build tasks on Jenkins servers.

- **Fine-Grained Cluster Resource Management**: Multi-dimensional resource queries and resource optimization & cleanup.
- **Full-Chain Fault Diagnosis & Monitoring**: Quick abnormal resource identification and log & configuration linked analysis.
- **Automated Operations & Standardization**: Batch operation support and configuration standardization management.
- **Performance & Stability Assurance**: Node health monitoring and container runtime analysis.

### General Tools

#### General tools

##### get_current_time

- **Function**: Retrieves the current system time in real-time (accurate to seconds/milliseconds).
- **Use Cases**: Logging, task scheduling, and report generation.

---

#### Search Tools

##### duckduckgo_search

- **Function**: Initiates web queries through the DuckDuckGo search engine, returning structured search results.
- **Use Cases**: Information retrieval and data collection.
