---
sidebar_position: 3
title: Backend Development
---

# Backend Development

This guide helps you develop new APP modules in the BK-Lite backend project.

---

## Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| Python | 3.12+ | Runtime |
| Django | 4.2 | Web framework |
| Django REST Framework | 3.15 | API framework |
| Celery | 5.4 | Async task queue |
| PostgreSQL | - | Primary database |
| Redis | 5.0 | Cache & Celery Broker |
| NATS | - | Message queue |
| MinIO | - | Object storage |
| uv | - | Package manager |

---

## Directory Structure

Each APP module follows a unified directory structure:

```
apps/<module>/
├── __init__.py
├── admin.py              # Django Admin configuration
├── apps.py               # APP configuration
├── config.py             # Module configuration
├── urls.py               # Route configuration
├── models/               # Data models
│   └── __init__.py
├── views/                # View layer (API)
│   └── __init__.py
├── serializers/          # Serializers
│   └── __init__.py
├── filters/              # Filters
│   └── __init__.py
├── services/             # Business logic layer
│   └── __init__.py
├── tasks/                # Celery async tasks
│   └── __init__.py
├── constants/            # Constants
│   └── __init__.py
├── utils/                # Utility functions
│   └── __init__.py
├── migrations/           # Database migrations
├── tests/                # Tests
└── initialization/       # Initialization data
```

---

## Creating a New Module

### 1. Create the APP

```bash
cd server
uv run python manage.py startapp demo apps/demo
```

Then add the project-standard directory structure:

```bash
cd apps/demo
mkdir -p models views serializers filters services tasks constants utils initialization
touch models/__init__.py views/__init__.py serializers/__init__.py
```

### 2. Configure the APP

Modify `apps/demo/apps.py`:

```python
from django.apps import AppConfig


class DemoConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.demo"
    verbose_name = "Demo Module"
```

### 3. Register the APP

Add to `config/settings/installed_apps.py`:

```python
INSTALLED_APPS += [
    "apps.demo",
]
```

### 4. Register Routes

Add to `urls.py`:

```python
from django.urls import include, path

urlpatterns = [
    # ... other routes
    path("demo/", include("apps.demo.urls")),
]
```

---

## Data Models

### Define a Model

Create `demo/models/demo.py`:

```python
from django.db import models
from apps.core.models import TimeStampMixin


class Demo(TimeStampMixin):
    """Demo model"""

    name = models.CharField("Name", max_length=128)
    description = models.TextField("Description", blank=True, default="")
    status = models.CharField(
        "Status",
        max_length=32,
        choices=[
            ("active", "Active"),
            ("inactive", "Inactive"),
        ],
        default="active",
    )
    config = models.JSONField("Configuration", default=dict, blank=True)

    class Meta:
        db_table = "demo"
        verbose_name = "Demo"
        verbose_name_plural = verbose_name
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
```

### Export the Model

In `demo/models/__init__.py`:

```python
from apps.demo.models.demo import Demo
```

### Generate Migrations

```bash
make migrate
```

---

## Serializers

Create `demo/serializers/demo.py`:

```python
from rest_framework import serializers
from apps.demo.models import Demo


class DemoSerializer(serializers.ModelSerializer):
    """Demo serializer"""

    class Meta:
        model = Demo
        fields = "__all__"


class DemoCreateSerializer(serializers.ModelSerializer):
    """Demo creation serializer"""

    class Meta:
        model = Demo
        fields = ["name", "description", "status", "config"]


class DemoUpdateSerializer(serializers.ModelSerializer):
    """Demo update serializer"""

    class Meta:
        model = Demo
        fields = ["name", "description", "status", "config"]
```

---

## Filters

Create `demo/filters/demo.py`:

```python
import django_filters
from apps.demo.models import Demo


class DemoFilter(django_filters.FilterSet):
    """Demo filter"""

    name = django_filters.CharFilter(lookup_expr="icontains")
    status = django_filters.CharFilter()

    class Meta:
        model = Demo
        fields = ["name", "status"]
```

---

## View Layer

Create `demo/views/demo.py`:

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
        """Statistics endpoint"""
        total = Demo.objects.count()
        active = Demo.objects.filter(status="active").count()
        return Response({
            "total": total,
            "active": active,
            "inactive": total - active,
        })

    @action(detail=True, methods=["post"])
    def toggle_status(self, request, pk=None):
        """Toggle status"""
        instance = self.get_object()
        instance.status = "inactive" if instance.status == "active" else "active"
        instance.save()
        return Response(DemoSerializer(instance).data)
```

---

## Route Configuration

Create `demo/urls.py`:

```python
from rest_framework import routers
from apps.demo.views.demo import DemoViewSet

router = routers.DefaultRouter()
router.register(r"api/demo", DemoViewSet, basename="Demo")

urlpatterns = router.urls
```

---

## Business Logic Layer

For complex business logic, create a Service layer.

Create `demo/services/demo.py`:

```python
from typing import Optional
from apps.demo.models import Demo


class DemoService:
    """Demo business logic"""

    @staticmethod
    def create_demo(
        name: str,
        description: str = "",
        status: str = "active",
        config: Optional[dict] = None,
    ) -> Demo:
        """Create a Demo"""
        return Demo.objects.create(
            name=name,
            description=description,
            status=status,
            config=config or {},
        )

    @staticmethod
    def batch_update_status(ids: list, status: str) -> int:
        """Batch update status"""
        return Demo.objects.filter(id__in=ids).update(status=status)

    @staticmethod
    def get_active_demos():
        """Get all active Demos"""
        return Demo.objects.filter(status="active")
```

---

## Async Tasks

Create `demo/tasks/demo.py`:

```python
from celery import shared_task
from apps.demo.models import Demo


@shared_task
def sync_demo_data():
    """Sync Demo data (scheduled task example)"""
    demos = Demo.objects.filter(status="active")
    for demo in demos:
        # Processing logic
        pass
    return f"Synced {demos.count()} demos"


@shared_task
def process_demo_async(demo_id: int):
    """Asynchronously process a single Demo"""
    try:
        demo = Demo.objects.get(id=demo_id)
        # Processing logic
        return f"Processed demo: {demo.name}"
    except Demo.DoesNotExist:
        return f"Demo {demo_id} not found"
```

---

## Menu and Permission Configuration

Menus and permissions are critical steps for integrating a module into the system. They are defined via JSON configuration files and automatically initialized at system startup.

### 1. Create Menu Configuration File

Create `demo.json` in the `support-files/system_mgmt/menus/` directory:

```json
{
  "client_id": "demo",
  "name": "Demo",
  "url": "/demo/list",
  "tags": ["Example Module", "Quick Start"],
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

### 2. Configuration Field Reference

| Field | Description |
|-------|-------------|
| `client_id` | Unique module identifier, matches the route prefix |
| `name` | Module display name |
| `url` | Module default entry URL |
| `tags` | Module tags for categorized display |
| `icon` | Icon name |
| `menus` | Menu and permission point definitions |
| `roles` | Preset roles and their permissions |

### 3. Permission Point Naming Convention

Permission point format is `{menu_id}-{operation}`, for example:

- `demo_list-View`: View list permission
- `demo_list-Add`: Create permission
- `demo_list-Edit`: Edit permission
- `demo_list-Delete`: Delete permission

### 4. Initialize Menu Data

Add the module to the `batch_init` command:

Edit `apps/core/management/commands/batch_init.py` and add:

```python
elif app == 'demo':
    self._init_demo()

def _init_demo(self):
    """Demo module initialization"""
    self.stdout.write('Initializing Demo module...')
    # Call initialization commands here if needed
```

Then run the initialization:

```bash
uv run python manage.py init_realm_resource
```

### 5. Using Permissions in Views

#### Method 1: Decorators (Recommended)

```python
from apps.core.decorators.api_permission import HasPermission

class DemoViewSet(GenericViewSet):

    @HasPermission("demo_list-View")
    def list(self, request, *args, **kwargs):
        # Only users with demo_list-View permission can access
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

#### Method 2: Role Validation

```python
from apps.core.decorators.api_permission import HasRole

class DemoViewSet(GenericViewSet):

    @HasRole("admin")
    def dangerous_action(self, request, *args, **kwargs):
        # Only administrators can execute
        pass
```

#### Method 3: Manual Validation (Fine-Grained Control)

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
        # permission contains the user's permission information for this module
        # Can filter data or control returned fields based on permissions
```

### 6. Permission Constants

Create `demo/constants/permission.py`:

```python
class PermissionConstants:
    DEFAULT_PERMISSION = ['View', 'Operate']
    LIST_MODULE = "demo_list"
    SETTINGS_MODULE = "demo_settings"
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make migrate` | Generate and execute database migrations |
| `make dev` | Start the development server |
| `make shell` | Enter Django Shell |
| `make celery` | Start Celery Worker |
| `make test` | Run tests |

---

## Code Standards

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Module name | lowercase_underscore | `demo`, `node_mgmt` |
| Class name | PascalCase | `DemoViewSet`, `DemoService` |
| Function name | lowercase_underscore | `get_demo_list`, `create_demo` |
| Constant | UPPERCASE_UNDERSCORE | `DEFAULT_PAGE_SIZE` |

### File Organization

- **models/**: One file per main model; related models can share a file
- **views/**: One file per ViewSet
- **serializers/**: Corresponds to views
- **services/**: Extract complex business logic into the Service layer

### Code Style

- Use **Black** for code formatting (line width 150)
- Use **isort** for import sorting
- Follow PEP 8 conventions

---

## Best Practices

### 1. Layered Architecture

```
View → Serializer → Service → Model
```

- **View**: Handle requests/responses, permission checks
- **Serializer**: Data validation, serialization/deserialization
- **Service**: Business logic, transaction handling
- **Model**: Data access, ORM operations

### 2. Error Handling

```python
from rest_framework.exceptions import ValidationError, NotFound

# Use DRF built-in exceptions
raise ValidationError({"name": "Name cannot be empty"})
raise NotFound("Demo not found")
```

### 3. Permission Control

```python
from apps.core.utils.permission_utils import get_permission_rules

# In a ViewSet
def list(self, request, *args, **kwargs):
    permission = get_permission_rules(
        request.user,
        request.COOKIES.get("current_team"),
        "demo",
        "demo_module",
    )
    # Filter data based on permissions
```

### 4. Logging

```python
from loguru import logger

logger.info(f"Creating demo: {name}")
logger.error(f"Failed to create demo: {e}")
```

---

## Existing Module Reference

| Module | Path | Description |
|--------|------|-------------|
| monitor | `apps/monitor/` | Monitoring module with complete CRUD + complex query examples |
| alerts | `apps/alerts/` | Alert module with event handling examples |
| cmdb | `apps/cmdb/` | Asset module with tree structure examples |
| opspilot | `apps/opspilot/` | AI module with LangChain integration examples |
| system_mgmt | `apps/system_mgmt/` | System management with user permission examples |
