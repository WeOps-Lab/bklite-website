---
sidebar_position: 2
title: 前端开发
---

# 前端开发

本指南帮助你在 BK-Lite 前端项目中开发新的 APP 模块。

---

## 1. 技术栈

- **框架**：Next.js 16 (App Router + Turbopack)
- **语言**：TypeScript 5
- **运行时**：React 19
- **UI 组件**：Ant Design 5
- **样式**：Tailwind CSS 4 + CSS Modules (SCSS)
- **状态管理**：React Context
- **国际化**：react-intl
- **图表**：@antv/g6、@xyflow/react
- **HTTP 客户端**：Axios
- **认证**：next-auth

---

## 2. 目录结构

每个 APP 模块遵循统一的目录结构：

```
src/app/<module>/
├── (pages)/              # 页面组件（路由分组）
│   ├── layout.tsx        # 模块布局（可选）
│   ├── page.tsx          # 模块首页
│   └── <feature>/        # 功能页面
│       └── page.tsx
├── api/                  # API 层
│   └── index.ts          # 模块 API Hook
├── components/           # 模块组件
├── hooks/                # 模块 Hooks
├── types/                # 类型定义
├── context/              # 状态管理（可选）
├── styles/               # 模块样式
└── locales/              # 国际化（可选）
```

---

## 3. 创建新模块

### 3.1 创建目录结构

以创建 `demo` 模块为例：

```bash
cd web/src/app
mkdir -p demo/{api,components,hooks,types,styles,"(pages)"}
```

### 3.2 创建模块布局

创建 `demo/(pages)/layout.tsx`：

```tsx
'use client';

import DemoProvider from '@/app/demo/context/common';
import '@/app/demo/styles/index.css';
import useApiClient from '@/utils/request';

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoading } = useApiClient();
  return <DemoProvider>{isLoading ? null : children}</DemoProvider>;
}
```

> **说明**：`useApiClient` 提供了 API 客户端实例和加载状态，用于确保 API 配置就绪后再渲染子组件。

### 3.3 创建首页

创建 `demo/(pages)/page.tsx`：

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card } from 'antd';
import useApiClient from '@/utils/request';
import useDemoApi from '@/app/demo/api';
import { DemoItem } from '@/app/demo/types';

const DemoPage = () => {
  const { isLoading } = useApiClient();
  const { getDemoList } = useDemoApi();
  const [data, setData] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    fetchData();
  }, [isLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getDemoList();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card title="Demo 模块" loading={loading}>
        {data.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </Card>
    </div>
  );
};

export default DemoPage;
```

---

## 4. API 层

### 4.1 创建模块 API Hook

创建 `demo/api/index.ts`：

```tsx
import useApiClient from '@/utils/request';
import { AxiosRequestConfig } from 'axios';

interface ListParams {
  page?: number;
  page_size?: number;
  name?: string;
}

const useDemoApi = () => {
  const { get, post, patch, del } = useApiClient();

  // 获取列表
  const getDemoList = async (
    params: ListParams = {},
    config?: AxiosRequestConfig
  ) => {
    return await get('/demo/api/list/', { params, ...config });
  };

  // 获取详情
  const getDemoDetail = async (id: React.Key) => {
    return await get(`/demo/api/${id}/`);
  };

  // 创建
  const createDemo = async (data: Record<string, unknown>) => {
    return await post('/demo/api/', data);
  };

  // 更新
  const updateDemo = async (id: React.Key, data: Record<string, unknown>) => {
    return await patch(`/demo/api/${id}/`, data);
  };

  // 删除
  const deleteDemo = async (id: React.Key) => {
    return await del(`/demo/api/${id}/`);
  };

  return {
    getDemoList,
    getDemoDetail,
    createDemo,
    updateDemo,
    deleteDemo,
  };
};

export default useDemoApi;
```

### 4.2 useApiClient 说明

`useApiClient` 是封装的 HTTP 客户端 Hook，提供以下方法：

| 方法 | 说明 |
|------|------|
| `get(url, config)` | GET 请求 |
| `post(url, data, config)` | POST 请求 |
| `patch(url, data, config)` | PATCH 请求 |
| `put(url, data, config)` | PUT 请求 |
| `del(url, config)` | DELETE 请求 |
| `isLoading` | API 配置是否加载中 |

---

## 5. 类型定义

创建 `demo/types/index.ts`：

```tsx
export interface DemoItem {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DemoListResponse {
  count: number;
  results: DemoItem[];
}
```

---

## 6. 配置菜单

在 `public/menus/zh.json` 中添加菜单配置：

```json
{
  "title": "Demo 模块",
  "icon": "demo-icon",
  "url": "/demo/home",
  "name": "demo_list",
  "children": [
    {
      "title": "功能页面",
      "url": "/demo/feature",
      "icon": "feature-icon",
      "name": "demo_feature"
    },
    {
      "title": "详情页（隐藏）",
      "url": "/demo/detail",
      "name": "demo_detail",
      "isNotMenuItem": true
    }
  ]
}
```

### 菜单配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 菜单显示名称 |
| `icon` | string | 图标名称（来自 iconfont） |
| `url` | string | 路由路径 |
| `name` | string | 权限标识（用于权限控制） |
| `children` | array | 子菜单 |
| `isNotMenuItem` | boolean | 是否隐藏菜单项（用于详情页等） |
| `withParentPermission` | boolean | 是否继承父级权限 |

---

## 7. 状态管理（可选）

如需模块级状态管理，创建 `demo/context/common.tsx`：

```tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within DemoProvider');
  }
  return context;
};

interface DemoProviderProps {
  children: ReactNode;
}

const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <DemoContext.Provider value={{ selectedId, setSelectedId }}>
      {children}
    </DemoContext.Provider>
  );
};

export default DemoProvider;
```

---

## 8. 常用组件

项目提供了多个可复用的全局组件：

### 8.1 CustomTable

通用表格组件，支持分页、搜索、列配置：

```tsx
import CustomTable from '@/components/custom-table';

<CustomTable
  columns={columns}
  dataSource={data}
  loading={loading}
  rowKey="id"
  pagination={{
    current: page,
    pageSize: pageSize,
    total: total,
    onChange: handlePageChange,
  }}
/>
```

### 8.2 DynamicForm

动态表单组件，支持配置化表单生成：

```tsx
import DynamicForm from '@/components/dynamic-form';

const formItems = [
  { name: 'name', label: '名称', type: 'input', required: true },
  { name: 'status', label: '状态', type: 'select', options: statusOptions },
];

<DynamicForm
  items={formItems}
  onFinish={handleSubmit}
/>
```

### 8.3 Permission

权限控制组件：

```tsx
import Permission from '@/components/permission';

<Permission requiredPermissions={['demo_edit']}>
  <Button type="primary">编辑</Button>
</Permission>
```

### 8.4 SubLayout

子布局组件，用于带侧边栏的页面：

```tsx
import SubLayout from '@/components/sub-layout';

<SubLayout
  menuItems={menuItems}
  activeKey={activeKey}
>
  {children}
</SubLayout>
```

---

## 9. 样式指南

### 9.1 Tailwind CSS（推荐）

```tsx
<div className="p-4 bg-white rounded-lg shadow">
  <h1 className="text-xl font-bold text-gray-800">标题</h1>
  <p className="mt-2 text-gray-600">描述文本</p>
</div>
```

### 9.2 CSS Modules

创建 `demo/styles/index.module.scss`：

```scss
.container {
  padding: 16px;
  background: var(--color-bg);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}
```

使用：

```tsx
import styles from './index.module.scss';

<div className={styles.container}>
  <h1 className={styles.title}>标题</h1>
</div>
```

---

## 10. 国际化

### 10.1 添加翻译文件

在 `public/locales/zh/demo.json` 中添加：

```json
{
  "demo.title": "Demo 模块",
  "demo.create": "创建",
  "demo.edit": "编辑",
  "demo.delete": "删除"
}
```

### 10.2 使用翻译

```tsx
import { useIntl } from 'react-intl';

const DemoPage = () => {
  const intl = useIntl();
  
  return (
    <h1>{intl.formatMessage({ id: 'demo.title' })}</h1>
  );
};
```

---

## 11. 最佳实践

### 11.1 组件设计

- **单一职责**：每个组件只做一件事
- **复用优先**：优先使用全局组件
- **类型安全**：所有 Props 必须定义类型

### 11.2 API 调用

- **统一封装**：所有 API 调用通过模块 API Hook
- **错误处理**：在 Hook 层统一处理错误
- **加载状态**：所有异步操作提供 loading 状态

### 11.3 性能优化

- **按需加载**：大组件使用动态导入
- **缓存优化**：合理使用 `useMemo`、`useCallback`
- **避免重渲染**：使用 `React.memo` 包裹纯展示组件

### 11.4 代码规范

- **命名规范**：组件 PascalCase，函数 camelCase
- **文件组织**：相关代码放在同一目录
- **注释规范**：复杂逻辑添加注释说明

---

## 12. 完整示例

参考以下现有模块学习最佳实践：

| 模块 | 路径 | 说明 |
|------|------|------|
| monitor | `src/app/monitor/` | 监控模块，包含完整的 CRUD 示例 |
| alarm | `src/app/alarm/` | 告警模块，展示复杂表单和列表 |
| cmdb | `src/app/cmdb/` | 资产模块，展示树形结构和详情页 |
| opspilot | `src/app/opspilot/` | AI 模块，展示复杂状态管理 |

---

## 常见问题

### Q: 如何添加新页面？

1. 在 `(pages)/` 目录下创建对应的 `page.tsx`
2. 在菜单配置中添加路由

### Q: 如何复用其他模块的组件？

优先使用全局组件（`src/components/`），如需复用模块组件，考虑提升为全局组件。

### Q: 如何处理权限控制？

使用 `Permission` 组件包裹需要权限的元素，权限标识对应菜单配置中的 `name` 字段。
