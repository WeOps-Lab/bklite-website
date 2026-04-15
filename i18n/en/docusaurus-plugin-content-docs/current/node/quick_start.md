---
sidebar_position: 2
---

# Quick Start

Through this quick start guide, you can start from scratch and use the BlueKing Lite Node module to complete **cloud region creation, node controller installation, and hosted component (agent/collector) deployment**, quickly achieving unified management of nodes and components across multi-cloud regions.

---
## Cloud Region Management
### Create a Cloud Region
Cloud regions are the logical grouping units for node resources. You must create a cloud region before managing node resources.
#### Step 1: Enter the Node Module

The Node module is the management hub for nodes and agents. You need to access the corresponding feature page from the console.

1. After entering the BlueKing Lite console, find the `Node` module in the feature list.
2. Click **"Enter"** at the top-right corner of the module card to access the Node module main page.

> **UI Guide:**
>
> ![e83d2e2d-26b5-4d50-ba0b-54b4cef8bce0.png](https://static.cwoa.net/6e68629f24dd4fcda0b42a9f589c92fc.png)
>
> *   **Feature list area**: The Node module card clearly displays core capabilities (cloud regions, agent management, etc.). Click "Enter" to access the module.

---

#### Step 2: Initiate Cloud Region Creation

The cloud region page is the top-level management interface for node resources, supporting the creation and management of nodes across different logical regions.

1. After entering the Node module, you will land on the **"Cloud Region"** tab by default.
2. Click the **"New"** button on the left side of the page to open the "New Cloud Region" configuration form.

> **UI Guide:**
>
> ![f96796c0-2b79-4fbe-8d0d-c29f3c2615c8.png](https://static.cwoa.net/8af522b488f14e658a24c50b5bb026e1.png)
>
> *   **Cloud region list**: The right side displays already created cloud regions, with each region showing associated component information; the "New" button on the left is the entry point for creating new regions.

---

#### Step 3: Configure Cloud Region Information

The system simplifies cloud region configuration through a standardized form -- just fill in the key information to complete creation.

1. In the "New Cloud Region" form, fill in the following information:
    *   **Name**: Enter an identifying name for the cloud region (e.g., "Production Environment Region");
    *   **Proxy IP/Domain**: Enter the proxy host IP or domain that connects the cloud region to the platform;
    *   **Description**: Add descriptive information about the cloud region (optional);
2. Click the **"Confirm"** button at the bottom of the form to complete the cloud region creation.

> **UI Guide:**
>
> ![f0eebb8b-cc0e-40df-abe2-31353ff7bf45.png](https://static.cwoa.net/6b6d166adebf4a258210ad919437af51.png)
>
> *   **Form field notes**: The "Proxy IP/Domain" is the critical configuration for communication between the cloud region and the platform. Enter the host address within the region that can connect to the platform.
---
#### Step 4: Configure Cloud Region Environment
The cloud region environment is the core component set supporting communication between the region and the platform (e.g., `stargazer`, `nats-executor`). This configuration must be completed to ensure subsequent node connectivity.

1. Enter the target cloud region's sub-page (e.g., the newly created "Production Environment Region"), and click **"Environment"** in the left sidebar to enter the environment configuration page;
2. In the "Environment Deployment" module's **"Proxy IP/Domain"** input field, enter the proxy host IP/domain within the cloud region that can communicate with the platform (must match the proxy information provided during cloud region creation);
3. Click the **"Generate Deployment Script"** button, and the system will generate a deployment script adapted to the current environment;
4. Copy the script and execute it on the proxy host to complete the deployment of the `stargazer` and `nats-executor` components;
5. After deployment, check the component status in the "Environment Status" module (displaying "Normal" indicates successful configuration).

> **UI Guide:**
>
> ![7ffd832a-a926-4a8f-b38f-552f1da15526.png](https://static.cwoa.net/1240e0a285eb4c8cb2746c5a44325bdd.png)
>
> *   **Environment status area**: Real-time display of the runtime status of communication components (`stargazer`/`nats-executor`);
> *   **Deployment configuration area**: Includes two deployment methods -- "Container Deployment" and "K8s Deployment" (Community Edition only supports container deployment). "Proxy IP/Domain" is the key configuration for communication components, and "Generate Deployment Script" is the entry point for quick component deployment.
---

## Node Management
### Install Node Controller
Controllers are the core management components for nodes. You must install a controller on target nodes to enable subsequent component deployment.
#### Step 1: Navigate to the Target Cloud Region's Node Page

After cloud region creation is complete, navigate to the corresponding region's node page to manage specific nodes.

1. In the cloud region list, click the target cloud region (e.g., "Direct Connect Region") to enter that region's sub-page.
2. In the left sidebar, click **"Nodes"** to enter the node management page.

> **UI Guide:**
>
> ![ef984f2a-5639-48c5-b6e8-9b32fe48547b.png](https://static.cwoa.net/dd2fd5148dc44e19889b8c08c8239457.png)
>![d548d3fe-a190-4294-a1f4-63c264f0702f.png](https://static.cwoa.net/d104766d0adb4439a31fcef57f5f6127.png)
>
> *   **Sidebar navigation**: The cloud region sub-page sidebar contains features such as "Nodes, Environment, Variables." "Nodes" is the entry point for managing server nodes.



#### Step 2: Initiate Controller Installation

The node page provides an "Install Controller" feature that supports batch deployment of management components to nodes.

1. In the top-right corner of the node page, click the **"Install Controller"** button to open the installation configuration panel.
2. Select the **"Operating System"** corresponding to the node (Linux/Windows).

> **UI Guide:**
>
> ![986be236-b8bb-4cc4-878a-4d5c20bc9abd.png](https://static.cwoa.net/b4d696cbbfb649c79b2bc3416d7f268d.png)
>
> *   **Node list area**: Displays information about managed nodes, including IP and controller status; the "Install Controller" button is the core entry point for deploying management components.



#### Step 3: Configure Installation Method and Information

The system supports two installation methods -- remote and manual -- to accommodate different operations scenarios.

1. Select the **"Installation Method"**:
    *   Remote installation: Fill in the node's IP, login account, password, and other information; the system will automatically complete the deployment;
    *   Manual installation: Follow the on-page instructions to perform operations on the node host;
2. Select the **"Controller Version"** and fill in the corresponding installation information (only required for remote installation).

> **UI Guide:**
>
> ![96f340ad-6674-4163-9a27-bf1d52178461.png](https://static.cwoa.net/51c5fd0606984d07a90b922aae8ad9e1.png)
> ![4bb34db8-3257-43ea-b204-b6dc4e006925.png](https://static.cwoa.net/b7ce26b809b84160ae7daa01c33818b7.png)
>
> *   **Installation method toggle**: Choose the installation method based on the node's network reachability. Remote installation enables batch automated deployment.



#### Step 4: Complete Controller Installation

After configuration is complete, submit the task to finish controller deployment.

1. After confirming the installation configuration is correct, click the **"Install"** button at the bottom of the panel.
2. Wait for the installation progress to complete. You can check the controller's runtime status in the node list.

---

## Hosted Component Deployment
### Install Monitoring Components
After controller installation is complete, you can deploy agents, collectors, and other business components through the hosted component feature.
#### Step 1: Select Target Nodes

First select the nodes where you want to deploy components, then initiate the component installation task.

1. In the node list, check the target nodes where you want to deploy components.
2. Click the **"Hosted Components"** dropdown menu in the top-right corner of the page, and select **"Install Component"**.

> **UI Guide:**
>
> ![2b3436d1-a33b-4294-a8ff-536ffc8a5544.png](https://static.cwoa.net/169b34adb7544acb9196a1f550a3aa2a.png)
>
> *   **Hosted components menu**: Contains full lifecycle operations for components including "Install, Start, Restart, Stop," supporting batch management of components on nodes.

---

#### Step 2: Configure Component Information

The system provides a standardized component list for quick selection of agents/collectors to deploy.

1. In the "Install Component" dialog, select the component **"Type"** (e.g., "Monitoring").
2. In the **"Component"** dropdown list, select the target component (e.g., Kafka-Exporter, Telegraf, etc.).
3. In the **"Version"** dropdown list, select the component version to install.
> **UI Guide:**
>
> ![03baf0e6-053e-4ee3-9633-5f5467756537.png](https://static.cwoa.net/d1b08155ed4a4fc9a7acc36fc5454072.png)
>
> *   **Component type classification**: Components are categorized by business scenarios such as "Monitoring, Logging, CMDB" for quick location of target collectors.
>**Version selection area**: Supports selecting different component versions to accommodate compatibility requirements across environments.
---

#### Step 3: Complete Component Installation

After confirming the configuration, submit the task to complete component deployment on target nodes.

1. After confirming the component type and selection are correct, click the **"Confirm"** button in the dialog.
2. After deployment is complete, you can check the component's runtime status in the "Hosted Components" column of the node list.

---

#### Step 4: Edit and Apply Collection Configuration (As Needed)

After component installation, you need to assign a collection configuration for it to actually execute collection tasks.

1. In the node list, click any field of the target node to open the **node detail side drawer**.
2. The drawer displays all hosted components installed on the node along with their runtime status cards. Find the **Primary Configuration** and **Sub-Configuration** modules below the cards.
3. Click the edit button for "Primary Configuration" to modify global collection rules; or create a new sub-configuration in the "Sub-Configuration" list to define specific collection tasks.
4. After modifying and saving, click the **"Apply"** button in the corresponding component card area. The system will distribute the latest configuration file to the node's component and activate it.
