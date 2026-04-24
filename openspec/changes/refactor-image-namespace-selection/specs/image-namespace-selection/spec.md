## ADDED Requirements

### Definitions

**Internal application images** are the following images built and maintained by the bklite project: server, web, stargazer, metis, mlflow, fusion-collector, telegraf, nats-executor, vllm, webhookd. In the bootstrap script these images are declared by service name only (e.g. `server`) and resolved through the internal application helper.

**Third-party images** are all other images consumed by the deployment, including infrastructure (traefik, redis, nats, postgres) and upstream projects (pgvector/pgvector, falkordb/falkordb, victoriametrics/victoria-metrics, etc.). These are declared with their original Docker Hub path (e.g. `traefik:3.6.2`, `pgvector/pgvector:pg15`).

**Mode-specific registry base** is the registry host and project path prefix selected per deployment mode. It is NOT shared across modes:
- Default registry base: `bk-lite.tencentcloudcr.com/bklite`
- Enterprise registry base: `bk-lite.tencentcloudcr.com/bklite/weopsx`

**Application namespace** is the namespace segment inserted between the registry base and the service name for internal application images. In default mode it is `bklite`; in enterprise mode it is empty (because the enterprise registry base already includes the `weopsx` path prefix for all images).

### Requirement: Internal application image namespace selection
The production docker-compose bootstrap script SHALL resolve all internal application images under the bklite namespace by default and SHALL resolve the same internal application image set under the weopsx namespace when enterprise mode is enabled.

#### Scenario: Default mode uses bklite namespace
- **WHEN** the bootstrap script resolves internal application images without enterprise mode enabled
- **THEN** each internal application image resolves to `<default-registry-base>/bklite/<service>`
- **EXAMPLE** service `server` resolves to `bk-lite.tencentcloudcr.com/bklite/bklite/server`

#### Scenario: Enterprise mode uses weopsx namespace
- **WHEN** the bootstrap script resolves internal application images with enterprise mode enabled
- **THEN** each internal application image resolves to `<enterprise-registry-base>/weopsx/<service>`
- **EXAMPLE** service `server` resolves to `bk-lite.tencentcloudcr.com/bklite/weopsx/server`

### Requirement: Third-party image resolution remains unchanged
The production docker-compose bootstrap script SHALL keep third-party and infrastructure image resolution independent from internal application namespace selection. Third-party images use the mode-specific registry base directly, without the application namespace segment.

#### Scenario: Default mode preserves third-party image paths
- **WHEN** the bootstrap script resolves third-party images in default mode
- **THEN** images with no slash resolve to `<default-registry-base>/library/<image>`; images with a slash resolve to `<default-registry-base>/<image>`
- **EXAMPLE** `traefik:3.6.2` resolves to `bk-lite.tencentcloudcr.com/bklite/library/traefik:3.6.2`; `pgvector/pgvector:pg15` resolves to `bk-lite.tencentcloudcr.com/bklite/pgvector/pgvector:pg15`

#### Scenario: Enterprise mode preserves third-party image paths
- **WHEN** the bootstrap script resolves third-party images in enterprise mode
- **THEN** images with no slash resolve to `<enterprise-registry-base>/library/<image>`; images with a slash resolve to `<enterprise-registry-base>/<image>`
- **EXAMPLE** `traefik:3.6.2` resolves to `bk-lite.tencentcloudcr.com/bklite/weopsx/library/traefik:3.6.2`; `pgvector/pgvector:pg15` resolves to `bk-lite.tencentcloudcr.com/bklite/weopsx/pgvector/pgvector:pg15`

### Requirement: Persisted image selection configuration is reusable
The production docker-compose bootstrap script SHALL persist enough image selection configuration to reproduce the same internal application namespace and registry base choices on subsequent runs, and it SHALL remain able to interpret previously persisted MIRROR-only configuration.

#### Scenario: New configuration is written explicitly
- **WHEN** the bootstrap script saves common environment configuration after resolving images
- **THEN** it stores separate values for registry base and internal application namespace
- **THEN** it also writes a derived MIRROR value for backward compatibility with external tooling that reads common.env

#### Scenario: Legacy MIRROR-only configuration is loaded
- **WHEN** the bootstrap script starts with a previously generated common.env that only defines MIRROR
- **THEN** it derives the effective registry base and internal application namespace without requiring manual cleanup
- **EXAMPLE** legacy `MIRROR=bk-lite.tencentcloudcr.com/bklite` normalizes to registry base `bk-lite.tencentcloudcr.com/bklite` and application namespace `bklite`
- **EXAMPLE** legacy `MIRROR=bk-lite.tencentcloudcr.com/bklite/weopsx` normalizes to registry base `bk-lite.tencentcloudcr.com/bklite/weopsx` and application namespace `""` (empty)

#### Scenario: User MIRROR environment variable override
- **WHEN** the user passes a MIRROR value via environment variable (e.g. `MIRROR=custom.registry.com/myrepo`)
- **THEN** the script treats it as a registry base override and applies the mode-determined application namespace (`bklite` when default, empty when enterprise) on top

### Requirement: Offline package aliases follow resolved image classification
The production docker-compose package flow SHALL generate offline package aliases and hash metadata using the same internal-application versus third-party classification rules as runtime image resolution.

#### Scenario: Internal application aliases match selected namespace
- **WHEN** the package flow saves an internal application image in default or enterprise mode
- **THEN** the saved alias reflects the namespace selected for that mode
- **EXAMPLE** default mode saves alias `bklite/server`; enterprise mode saves alias `server` (no namespace prefix because APP_NAMESPACE is empty)

#### Scenario: Third-party aliases remain stable
- **WHEN** the package flow saves a third-party image in default or enterprise mode
- **THEN** the saved alias continues to reflect the third-party image repository path without being affected by internal application namespace selection
- **EXAMPLE** `traefik:3.6.2` is aliased as `traefik:3.6.2` in both modes; `pgvector/pgvector:pg15` is aliased as `pgvector/pgvector:pg15` in both modes
