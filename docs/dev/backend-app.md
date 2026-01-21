---
sidebar_position: 3
title: 后端开发
---

# 后端开发

本指南帮助你在 BK-Lite 后端项目中开发新的 APP 模块。

---

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Python | 3.12+ | 运行时 |
| Django | 4.2 | Web 框架 |
| Django REST Framework | 3.15 | API 框架 |
| Celery | 5.4 | 异步任务队列 |
| PostgreSQL | - | 主数据库 |
| Redis | 5.0 | 缓存 & Celery Broker |
| NATS | - | 消息队列 |
| MinIO | - | 对象存储 |
| uv | - | 包管理工具 |

---

## 目录结构

每个 APP 模块遵循统一的目录结构：

```
apps/<module>/
├── __init__.py
├── admin.py              # Django Admin 配置
├── apps.py               # APP 配置
├── config.py             # 模块配置
├── urls.py               # 路由配置
├── models/               # 数据模型
│   └── __init__.py
├── views/                # 视图层（API）
│   └── __init__.py
├── serializers/          # 序列化器
│   └── __init__.py
├── filters/              # 过滤器
│   └── __init__.py
├── services/             # 业务逻辑层
│   └── __init__.py
├── tasks/                # Celery 异步任务
│   └── __init__.py
├── constants/            # 常量定义
│   └── __init__.py
├── utils/                # 工具函数
│   └── __init__.py
├── migrations/           # 数据库迁移
├── tests/                # 测试
└── initialization/       # 初始化数据
```

---

## 创建新模块

### 1. 创建 APP

```bash
cd server
uv run python manage.py startapp demo apps/demo
```

然后补充项目约定的目录结构：

```bash
cd apps/demo
mkdir -p models views serializers filters services tasks constants utils initialization
touch models/__init__.py views/__init__.py serializers/__init__.py
```

### 2. 配置 APP

修改 `apps/demo/apps.py`：

```python
from django.apps import AppConfig


class DemoConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.demo"
    verbose_name = "Demo 模块"
```

### 3. 注册 APP

在 `config/settings/installed_apps.py` 中添加：

```python
INSTALLED_APPS += [
    "apps.demo",
]
```

### 4. 注册路由

在 `urls.py` 中添加：

```python
from django.urls import include, path

urlpatterns = [
    # ... 其他路由
    path("demo/", include("apps.demo.urls")),
]
```

---

## 数据模型

### 定义模型

创建 `demo/models/demo.py`：

```python
from django.db import models
from apps.core.models import TimeStampMixin


class Demo(TimeStampMixin):
    """Demo 模型"""

    name = models.CharField("名称", max_length=128)
    description = models.TextField("描述", blank=True, default="")
    status = models.CharField(
        "状态",
        max_length=32,
        choices=[
            ("active", "启用"),
            ("inactive", "禁用"),
        ],
        default="active",
    )
    config = models.JSONField("配置", default=dict, blank=True)

    class Meta:
        db_table = "demo"
        verbose_name = "Demo"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
```

### 导出模型

在 `demo/models/__init__.py` 中：

```python
from apps.demo.models.demo import Demo
```

### 生成迁移

```bash
make migrate
```

---

## 序列化器

创建 `demo/serializers/demo.py`：

```python
from rest_framework import serializers
from apps.demo.models import Demo


class DemoSerializer(serializers.ModelSerializer):
    """Demo 序列化器"""

    class Meta:
        model = Demo
        fields = "__all__"


class DemoCreateSerializer(serializers.ModelSerializer):
    """Demo 创建序列化器"""

    class Meta:
        model = Demo
        fields = ["name", "description", "status", "config"]


class DemoUpdateSerializer(serializers.ModelSerializer):
    """Demo 更新序列化器"""

    class Meta:
        model = Demo
        fields = ["name", "description", "status", "config"]
```

---

## 过滤器

创建 `demo/filters/demo.py`：

```python
import django_filters
from apps.demo.models import Demo


class DemoFilter(django_filters.FilterSet):
    """Demo 过滤器"""

    name = django_filters.CharFilter(lookup_expr="icontains")
    status = django_filters.CharFilter()

    class Meta:
        model = Demo
        fields = ["name", "status"]
```

---

## 视图层

创建 `demo/views/demo.py`：

```python
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.demo.models import Demo
from apps.demo.serializers.demo import (
    DemoSerializer,
    DemoCreateSerializer,
    DemoUpdateSerializer,
)
from apps.demo.filters.demo import DemoFilter
from config.drf.pagination import CustomPageNumberPagination


class DemoViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    """Demo ViewSet"""

    queryset = Demo.objects.all()
    serializer_class = DemoSerializer
    filterset_class = DemoFilter
    pagination_class = CustomPageNumberPagination

    def get_serializer_class(self):
        if self.action == "create":
            return DemoCreateSerializer
        if self.action in ["update", "partial_update"]:
            return DemoUpdateSerializer
        return DemoSerializer

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """统计接口"""
        total = Demo.objects.count()
        active = Demo.objects.filter(status="active").count()
        return Response({
            "total": total,
            "active": active,
            "inactive": total - active,
        })

    @action(detail=True, methods=["post"])
    def toggle_status(self, request, pk=None):
        """切换状态"""
        instance = self.get_object()
        instance.status = "inactive" if instance.status == "active" else "active"
        instance.save()
        return Response(DemoSerializer(instance).data)
```

---

## 路由配置

创建 `demo/urls.py`：

```python
from rest_framework import routers
from apps.demo.views.demo import DemoViewSet

router = routers.DefaultRouter()
router.register(r"api/demo", DemoViewSet, basename="Demo")

urlpatterns = router.urls
```

---

## 业务逻辑层

对于复杂业务逻辑，创建 Service 层。

创建 `demo/services/demo.py`：

```python
from typing import Optional
from apps.demo.models import Demo


class DemoService:
    """Demo 业务逻辑"""

    @staticmethod
    def create_demo(
        name: str,
        description: str = "",
        status: str = "active",
        config: Optional[dict] = None,
    ) -> Demo:
        """创建 Demo"""
        return Demo.objects.create(
            name=name,
            description=description,
            status=status,
            config=config or {},
        )

    @staticmethod
    def batch_update_status(ids: list, status: str) -> int:
        """批量更新状态"""
        return Demo.objects.filter(id__in=ids).update(status=status)

    @staticmethod
    def get_active_demos():
        """获取所有启用的 Demo"""
        return Demo.objects.filter(status="active")
```

---

## 异步任务

创建 `demo/tasks/demo.py`：

```python
from celery import shared_task
from apps.demo.models import Demo


@shared_task
def sync_demo_data():
    """同步 Demo 数据（定时任务示例）"""
    demos = Demo.objects.filter(status="active")
    for demo in demos:
        # 处理逻辑
        pass
    return f"Synced {demos.count()} demos"


@shared_task
def process_demo_async(demo_id: int):
    """异步处理单个 Demo"""
    try:
        demo = Demo.objects.get(id=demo_id)
        # 处理逻辑
        return f"Processed demo: {demo.name}"
    except Demo.DoesNotExist:
        return f"Demo {demo_id} not found"
```

---

## 菜单与权限配置

菜单和权限是模块接入系统的关键步骤，通过 JSON 配置文件定义，系统启动时自动初始化。

### 1. 创建菜单配置文件

在 `support-files/system_mgmt/menus/` 目录下创建 `demo.json`：

```json
{
  "client_id": "demo",
  "name": "Demo",
  "url": "/demo/list",
  "tags": ["示例模块", "快速上手"],
  "description": "Demo module for development reference",
  "icon": "demo",
  "menus": [
    {
      "name": "List",
      "children": [
        {
          "id": "demo_list",
          "name": "List",
          "operation": ["View", "Add", "Edit", "Delete"]
        }
      ]
    },
    {
      "name": "Settings",
      "children": [
        {
          "id": "demo_settings",
          "name": "Settings",
          "operation": ["View", "Edit"]
        }
      ]
    }
  ],
  "roles": [
    {
      "name": "admin",
      "role_name": "demo_admin",
      "menus": []
    },
    {
      "name": "normal",
      "role_name": "demo_normal",
      "menus": ["demo_list-View"]
    }
  ]
}
```

### 2. 配置字段说明

| 字段 | 说明 |
|------|------|
| `client_id` | 模块唯一标识，与路由前缀一致 |
| `name` | 模块显示名称 |
| `url` | 模块默认入口 URL |
| `tags` | 模块标签，用于分类展示 |
| `icon` | 图标名称 |
| `menus` | 菜单和权限点定义 |
| `roles` | 预置角色及其权限 |

### 3. 权限点命名规则

权限点格式为 `{menu_id}-{operation}`，例如：

- `demo_list-View`：查看列表权限
- `demo_list-Add`：新增权限
- `demo_list-Edit`：编辑权限
- `demo_list-Delete`：删除权限

### 4. 初始化菜单数据

将模块添加到 `batch_init` 命令：

编辑 `apps/core/management/commands/batch_init.py`，添加：

```python
elif app == 'demo':
    self._init_demo()

def _init_demo(self):
    """Demo 模块初始化"""
    self.stdout.write('Demo 模块初始化...')
    # 如有初始化命令，在此调用
```

然后执行初始化：

```bash
uv run python manage.py init_realm_resource
```

### 5. 在视图中使用权限

#### 方法一：装饰器（推荐）

```python
from apps.core.decorators.api_permission import HasPermission

class DemoViewSet(GenericViewSet):

    @HasPermission("demo_list-View")
    def list(self, request, *args, **kwargs):
        # 只有拥有 demo_list-View 权限的用户才能访问
        pass

    @HasPermission("demo_list-Add")
    def create(self, request, *args, **kwargs):
        pass

    @HasPermission("demo_list-Edit")
    def update(self, request, *args, **kwargs):
        pass

    @HasPermission("demo_list-Delete")
    def destroy(self, request, *args, **kwargs):
        pass
```

#### 方法二：角色校验

```python
from apps.core.decorators.api_permission import HasRole

class DemoViewSet(GenericViewSet):

    @HasRole("admin")
    def dangerous_action(self, request, *args, **kwargs):
        # 只有管理员可以执行
        pass
```

#### 方法三：手动校验（细粒度控制）

```python
from apps.core.utils.permission_utils import get_permission_rules

class DemoViewSet(GenericViewSet):

    def list(self, request, *args, **kwargs):
        permission = get_permission_rules(
            request.user,
            request.COOKIES.get("current_team"),
            "demo",
            "demo_list",
        )
        # permission 包含用户在该模块的权限信息
        # 可根据权限过滤数据或控制返回字段
```

### 6. 权限常量定义

创建 `demo/constants/permission.py`：

```python
class PermissionConstants:
    DEFAULT_PERMISSION = ['View', 'Operate']
    LIST_MODULE = "demo_list"
    SETTINGS_MODULE = "demo_settings"
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `make install` | 安装依赖 |
| `make migrate` | 生成并执行数据库迁移 |
| `make dev` | 启动开发服务器 |
| `make shell` | 进入 Django Shell |
| `make celery` | 启动 Celery Worker |
| `make test` | 运行测试 |

---

## 代码规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 模块名 | 小写下划线 | `demo`, `node_mgmt` |
| 类名 | PascalCase | `DemoViewSet`, `DemoService` |
| 函数名 | 小写下划线 | `get_demo_list`, `create_demo` |
| 常量 | 大写下划线 | `DEFAULT_PAGE_SIZE` |

### 文件组织

- **models/**: 一个文件一个主要模型，相关模型可放同一文件
- **views/**: 一个文件一个 ViewSet
- **serializers/**: 与 views 对应
- **services/**: 复杂业务逻辑抽离到 Service 层

### 代码风格

- 使用 **Black** 格式化代码（行宽 150）
- 使用 **isort** 排序 import
- 遵循 PEP 8 规范

---

## 最佳实践

### 1. 分层架构

```
View → Serializer → Service → Model
```

- **View**: 处理请求/响应，权限校验
- **Serializer**: 数据验证，序列化/反序列化
- **Service**: 业务逻辑，事务处理
- **Model**: 数据访问，ORM 操作

### 2. 错误处理

```python
from rest_framework.exceptions import ValidationError, NotFound

# 使用 DRF 内置异常
raise ValidationError({"name": "名称不能为空"})
raise NotFound("Demo 不存在")
```

### 3. 权限控制

```python
from apps.core.utils.permission_utils import get_permission_rules

# 在 ViewSet 中
def list(self, request, *args, **kwargs):
    permission = get_permission_rules(
        request.user,
        request.COOKIES.get("current_team"),
        "demo",
        "demo_module",
    )
    # 根据权限过滤数据
```

### 4. 日志记录

```python
from loguru import logger

logger.info(f"Creating demo: {name}")
logger.error(f"Failed to create demo: {e}")
```

---

## 现有模块参考

| 模块 | 路径 | 说明 |
|------|------|------|
| monitor | `apps/monitor/` | 监控模块，完整的 CRUD + 复杂查询示例 |
| alerts | `apps/alerts/` | 告警模块，事件处理示例 |
| cmdb | `apps/cmdb/` | 资产模块，树形结构示例 |
| opspilot | `apps/opspilot/` | AI 模块，LangChain 集成示例 |
| system_mgmt | `apps/system_mgmt/` | 系统管理，用户权限示例 |
