## Why

The production docker-compose bootstrap script currently encodes registry base and internal application namespace into a single MIRROR value. That makes the default and enterprise image naming rules hard to express, and it prevents the script from cleanly supporting the required behavior where all internal application images switch from the bklite namespace to the weopsx namespace under --enterprise while third-party images continue to use the mode-specific registry base without the application namespace segment. The current enterprise path also produces redundant naming (e.g. `weopsx/bklite/server` instead of `weopsx/server`).

## What Changes

- Refactor image configuration in the production docker-compose bootstrap flow to separate mode-specific registry base selection from internal application namespace selection. Default registry base is `bk-lite.tencentcloudcr.com/bklite` with namespace `bklite`; enterprise registry base is `bk-lite.tencentcloudcr.com/bklite/weopsx` with empty namespace (enterprise registry has all images under the `weopsx/` path).
- Change internal application image declarations from namespaced format (`bklite/server`) to bare service names (`server`) and resolve them dynamically through a dedicated helper that applies the selected namespace. Affected images: server, web, stargazer, metis, mlflow, fusion-collector, telegraf, nats-executor, vllm, webhookd.
- Update internal application image resolution so all internal application images use the bklite namespace by default and the weopsx namespace when --enterprise is enabled.
- Keep third-party image resolution behavior unchanged so infrastructure and dependency images continue to resolve from the mode-specific registry base with their original paths.
- Persist the new image selection configuration in bootstrap-generated environment files with compatibility handling for existing MIRROR-based configurations, including a derived MIRROR value for backward compatibility.
- Preserve the USER_MIRROR environment variable override as a registry base override, with application namespace still determined by the ENTERPRISE_ENABLED flag.
- Update offline package generation so saved image aliases and hash metadata remain consistent with the new internal application namespace rules.

## Capabilities

### New Capabilities
- `image-namespace-selection`: Defines how the production docker-compose bootstrap script resolves internal application images, third-party images, persisted configuration, and offline package aliases across default and enterprise modes.

### Modified Capabilities

## Impact

Affected systems include the production deployment bootstrap script, generated common environment configuration, offline image packaging, and generated install.run artifacts derived from deploy/docker-compose. The change does not alter site frontend behavior or docker-compose service definitions that only consume the generated DOCKER_IMAGE_* variables.
