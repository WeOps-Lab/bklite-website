---
sidebar_position: 2
title: Frontend Development
---

# Frontend Development

This guide helps you develop new APP modules in the BK-Lite frontend project.

---

## 1. Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 5
- **Runtime**: React 19
- **UI Components**: Ant Design 5
- **Styling**: Tailwind CSS 4 + CSS Modules (SCSS)
- **State Management**: React Context
- **Internationalization**: react-intl
- **Charts**: @antv/g6, @xyflow/react
- **HTTP Client**: Axios
- **Authentication**: next-auth

---

## 2. Directory Structure

Each APP module follows a unified directory structure:

```
src/app/<module>/
├── (pages)/              # Page components (route groups)
│   ├── layout.tsx        # Module layout (optional)
│   ├── page.tsx          # Module home page
│   └── <feature>/        # Feature pages
│       └── page.tsx
├── api/                  # API layer
│   └── index.ts          # Module API Hook
├── components/           # Module components
├── hooks/                # Module Hooks
├── types/                # Type definitions
├── context/              # State management (optional)
├── styles/               # Module styles
└── locales/              # Internationalization (optional)
```

---

## 3. Creating a New Module

### 3.1 Create Directory Structure

Using a `demo` module as an example:

```bash
cd web/src/app
mkdir -p demo/{api,components,hooks,types,styles,"(pages)"}
```

### 3.2 Create Module Layout

Create `demo/(pages)/layout.tsx`:

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

> **Note**: `useApiClient` provides the API client instance and loading state, ensuring child components are only rendered after the API configuration is ready.

### 3.3 Create Home Page

Create `demo/(pages)/page.tsx`:

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
      <Card title="Demo Module" loading={loading}>
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

## 4. API Layer

### 4.1 Create Module API Hook

Create `demo/api/index.ts`:

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

  // Get list
  const getDemoList = async (
    params: ListParams = {},
    config?: AxiosRequestConfig
  ) => {
    return await get('/demo/api/list/', { params, ...config });
  };

  // Get details
  const getDemoDetail = async (id: React.Key) => {
    return await get(`/demo/api/${id}/`);
  };

  // Create
  const createDemo = async (data: Record<string, unknown>) => {
    return await post('/demo/api/', data);
  };

  // Update
  const updateDemo = async (id: React.Key, data: Record<string, unknown>) => {
    return await patch(`/demo/api/${id}/`, data);
  };

  // Delete
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

### 4.2 useApiClient Reference

`useApiClient` is an encapsulated HTTP client Hook that provides the following methods:

| Method | Description |
|--------|-------------|
| `get(url, config)` | GET request |
| `post(url, data, config)` | POST request |
| `patch(url, data, config)` | PATCH request |
| `put(url, data, config)` | PUT request |
| `del(url, config)` | DELETE request |
| `isLoading` | Whether API configuration is loading |

---

## 5. Type Definitions

Create `demo/types/index.ts`:

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

## 6. Menu Configuration

Add menu configuration in `public/menus/zh.json`:

```json
{
  "title": "Demo Module",
  "icon": "demo-icon",
  "url": "/demo/home",
  "name": "demo_list",
  "children": [
    {
      "title": "Feature Page",
      "url": "/demo/feature",
      "icon": "feature-icon",
      "name": "demo_feature"
    },
    {
      "title": "Detail Page (Hidden)",
      "url": "/demo/detail",
      "name": "demo_detail",
      "isNotMenuItem": true
    }
  ]
}
```

### Menu Configuration Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Menu display name |
| `icon` | string | Icon name (from iconfont) |
| `url` | string | Route path |
| `name` | string | Permission identifier (used for access control) |
| `children` | array | Sub-menus |
| `isNotMenuItem` | boolean | Whether to hide the menu item (for detail pages, etc.) |
| `withParentPermission` | boolean | Whether to inherit parent permissions |

---

## 7. State Management (Optional)

If module-level state management is needed, create `demo/context/common.tsx`:

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

## 8. Common Components

The project provides several reusable global components:

### 8.1 CustomTable

A general-purpose table component supporting pagination, search, and column configuration:

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

A dynamic form component supporting configuration-driven form generation:

```tsx
import DynamicForm from '@/components/dynamic-form';

const formItems = [
  { name: 'name', label: 'Name', type: 'input', required: true },
  { name: 'status', label: 'Status', type: 'select', options: statusOptions },
];

<DynamicForm
  items={formItems}
  onFinish={handleSubmit}
/>
```

### 8.3 Permission

A permission control component:

```tsx
import Permission from '@/components/permission';

<Permission requiredPermissions={['demo_edit']}>
  <Button type="primary">Edit</Button>
</Permission>
```

### 8.4 SubLayout

A sub-layout component for pages with sidebars:

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

## 9. Style Guide

### 9.1 Tailwind CSS (Recommended)

```tsx
<div className="p-4 bg-white rounded-lg shadow">
  <h1 className="text-xl font-bold text-gray-800">Title</h1>
  <p className="mt-2 text-gray-600">Description text</p>
</div>
```

### 9.2 CSS Modules

Create `demo/styles/index.module.scss`:

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

Usage:

```tsx
import styles from './index.module.scss';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

---

## 10. Internationalization

### 10.1 Add Translation Files

Add to `public/locales/zh/demo.json`:

```json
{
  "demo.title": "Demo Module",
  "demo.create": "Create",
  "demo.edit": "Edit",
  "demo.delete": "Delete"
}
```

### 10.2 Using Translations

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

## 11. Best Practices

### 11.1 Component Design

- **Single Responsibility**: Each component should do one thing only
- **Reuse First**: Prefer using global components
- **Type Safety**: All Props must have type definitions

### 11.2 API Calls

- **Unified Encapsulation**: All API calls go through the module API Hook
- **Error Handling**: Handle errors uniformly at the Hook level
- **Loading State**: Provide loading state for all async operations

### 11.3 Performance Optimization

- **Lazy Loading**: Use dynamic imports for large components
- **Cache Optimization**: Use `useMemo` and `useCallback` appropriately
- **Avoid Re-renders**: Wrap pure display components with `React.memo`

### 11.4 Code Standards

- **Naming Conventions**: Components in PascalCase, functions in camelCase
- **File Organization**: Keep related code in the same directory
- **Comments**: Add comments for complex logic

---

## 12. Complete Examples

Refer to the following existing modules for best practices:

| Module | Path | Description |
|--------|------|-------------|
| monitor | `src/app/monitor/` | Monitoring module with complete CRUD examples |
| alarm | `src/app/alarm/` | Alert module showcasing complex forms and lists |
| cmdb | `src/app/cmdb/` | Asset module showcasing tree structures and detail pages |
| opspilot | `src/app/opspilot/` | AI module showcasing complex state management |

---

## FAQ

### Q: How to add a new page?

1. Create the corresponding `page.tsx` under the `(pages)/` directory
2. Add the route in the menu configuration

### Q: How to reuse components from other modules?

Prefer using global components (`src/components/`). If you need to reuse a module component, consider promoting it to a global component.

### Q: How to handle permission control?

Use the `Permission` component to wrap elements that require permissions. The permission identifier corresponds to the `name` field in the menu configuration.
