## Context

The production deployment bootstrap script in deploy/docker-compose/bootstrap.sh currently uses a single MIRROR value to express both the registry base and the namespace of internal application images. This works for the default path but does not cleanly support the required enterprise behavior where third-party images continue to resolve from a mode-specific registry base while all internal application images switch from the bklite namespace to the weopsx namespace. The same script also persists mirror-related configuration to common.env and derives offline package aliases from fully resolved image names, so the change must remain consistent across install, re-run, and package flows.

The concrete problem: with the current single-MIRROR model, enterprise mode sets `MIRROR=bk-lite.tencentcloudcr.com/bklite/weopsx` and all images are prefixed with it. This produces paths like `weopsx/bklite/server` (redundant double namespace) for internal apps and `weopsx/library/traefik:3.6.2` (unwanted namespace segment) for third-party images.

## Goals / Non-Goals

**Goals:**
- Separate registry base configuration from internal application namespace selection in the production docker-compose bootstrap flow.
- Ensure all internal application images resolve under the bklite namespace by default and the weopsx namespace when --enterprise is enabled.
- Preserve existing third-party image resolution behavior so shared infrastructure images keep using the mode-specific registry base layout without the application namespace segment.
- Keep generated common.env and offline package metadata compatible with the new model while providing a migration path for existing MIRROR-only configurations.

**Non-Goals:**
- Changing docker-compose service definitions or the names of exported DOCKER_IMAGE_* variables consumed by compose files.
- Extending the same namespace-selection behavior to deploy/dev/bootstrap.sh.
- Introducing new external dependencies or changing application runtime behavior beyond image resolution.

## Decisions

### Split image configuration into registry base and application namespace
The bootstrap script will move from a single MIRROR concept to two internal configuration values: one representing the mode-specific registry base and one representing the namespace for internal application images. The mode-specific registry base is selected per deployment mode (default vs enterprise) and is NOT shared across modes:

- Default: registry base `bk-lite.tencentcloudcr.com/bklite`, application namespace `bklite`
- Enterprise: registry base `bk-lite.tencentcloudcr.com/bklite/weopsx`, application namespace `""` (empty)

The ENTERPRISE_ENABLED flag maps directly to these pairs. When ENTERPRISE_ENABLED is false (or unset), the default pair is used; when true, the enterprise pair is used. The enterprise registry has ALL images (internal and third-party) under the `weopsx/` path prefix, so the enterprise registry base already includes `weopsx` and no additional application namespace is needed.

This is the smallest structure that can express the required default and enterprise naming rules without overloading a single value.

Alternative considered: continue using MIRROR as the full prefix and special-case enterprise image names inline. This was rejected because it keeps the current ambiguity, makes package alias restoration fragile, and spreads enterprise-specific string handling across the script.

### Change internal application image declarations from namespaced to bare service names
Internal application images are currently declared as `bklite/server`, `bklite/web`, etc. with the namespace baked into the declaration. The refactored script will declare these as bare service names (e.g. `server`, `web`) and the internal application resolution helper will prepend `<registry-base>/<app-namespace>/` dynamically. This decoupling is what makes namespace switching possible without duplicating image declarations.

The full set of internal application images that change from namespaced to bare declarations: server, web, stargazer, metis, mlflow, fusion-collector, telegraf, nats-executor, vllm, webhookd.

### Keep separate resolution paths for third-party and internal application images
Third-party images and internal application images will use different helper functions. Third-party images will continue to resolve to mode-specific registry base plus either library or upstream repository paths. Internal application images will resolve to mode-specific registry base plus selected namespace plus service name. This preserves current behavior where only internal application images change under enterprise mode.

Concrete resolved paths after refactor:

```
Default mode (ENTERPRISE_ENABLED=false):
  Internal:   bk-lite.tencentcloudcr.com/bklite/bklite/server
  Third-party: bk-lite.tencentcloudcr.com/bklite/library/traefik:3.6.2
  Third-party: bk-lite.tencentcloudcr.com/bklite/pgvector/pgvector:pg15

Enterprise mode (ENTERPRISE_ENABLED=true):
  Internal:   bk-lite.tencentcloudcr.com/bklite/weopsx/server
  Third-party: bk-lite.tencentcloudcr.com/bklite/weopsx/library/traefik:3.6.2
  Third-party: bk-lite.tencentcloudcr.com/bklite/weopsx/pgvector/pgvector:pg15
```

Note: In enterprise mode, both internal and third-party images share the same registry base (including `weopsx/`). The distinction is that internal images are bare service names appended directly, while third-party images retain their original Docker Hub paths (with `library/` prefix for official images).

Alternative considered: preserve a single add_mirror_prefix helper and infer behavior from image name prefixes such as bklite/. This was rejected because the distinction is semantic, not syntactic, and explicit helper separation is easier to reason about and maintain.

### Handle USER_MIRROR environment variable override
The current script captures `USER_MIRROR="${MIRROR:-}"` at startup so users can override via `MIRROR=xxx ./bootstrap.sh`. The refactored script will continue to accept this override. When a user-supplied MIRROR is present, it will be treated as a registry base override. The application namespace will still be determined by the ENTERPRISE_ENABLED flag (bklite or weopsx). This preserves the existing single-variable user experience while supporting the new internal model.

Alternative considered: introduce two new user-facing environment variables (REGISTRY_BASE and APP_NAMESPACE). This was rejected because it adds user-facing complexity for a niche use case, and the single MIRROR override is already established convention.

### Persist the new model explicitly and retain backward compatibility for existing MIRROR-only state
common.env generation and update paths will persist the registry base and internal application namespace as separate values. Additionally, a derived MIRROR value will be written for backward compatibility with any external tooling that reads common.env (MIRROR = registry-base in both modes). The loader will continue to accept existing MIRROR-only state so prior installations can be re-run without forcing users to delete configuration before upgrading. Legacy values where MIRROR ends with `/weopsx` will be treated as the enterprise registry base with empty application namespace.

Alternative considered: make the new model breaking and require users to regenerate common.env. This was rejected because the script is treated as idempotent deployment tooling, and forcing manual cleanup would create avoidable upgrade friction.

### Make offline package alias restoration use the same image classification rules as online resolution
The package flow will stop assuming that stripping MIRROR from the resolved image name is sufficient to recover the original alias. Instead, it will restore aliases based on whether an image is third-party or internal application. This keeps the saved image name, tarball file naming, and hash metadata aligned with the new namespace-selection model.

Alternative considered: keep the current sed-based restoration and accept different aliases between default and enterprise modes. This was rejected because it would make offline package contents inconsistent with online image selection rules and complicate later image loading behavior.

## Risks / Trade-offs

- [Legacy common.env values may encode old enterprise semantics] → Add compatibility handling during config load so previously persisted MIRROR values can still be interpreted correctly. Specifically, if MIRROR ends with `/weopsx`, treat the entire value as registry base and set application namespace to empty.
- [Offline packaging may drift from online resolution if classification logic is duplicated] → Centralize image classification and alias restoration rules in reusable helpers within the bootstrap script.
- [Future contributors may keep using MIRROR directly out of habit] → Keep compatibility exports only where necessary and make the new registry-base plus namespace model the primary internal interface. Add inline comments in bootstrap.sh explaining the new model.
- [Enterprise image availability may differ from default namespace coverage] → Limit namespace switching to the explicitly identified internal application image set and preserve existing third-party image behavior.
- [Enterprise registry has all images under weopsx/ prefix] → The enterprise registry base includes `weopsx/` so both internal and third-party images resolve under the same base path. This means APP_NAMESPACE is empty for enterprise, and the resolution helpers must handle empty namespace without producing double-slash paths.

## Migration Plan

1. Update bootstrap configuration loading to normalize legacy MIRROR-only state into registry base plus application namespace.
2. Update image resolution helpers and internal application image declarations.
3. Update common.env save and update paths to persist the new values.
4. Update offline package alias restoration to follow the new classification rules.
5. Regenerate install.run from deploy/docker-compose after the bootstrap script change is complete.
6. Validate default mode and --enterprise mode resolution separately before release.

Rollback strategy: restore the prior bootstrap script and regenerate install.run, then remove newly written configuration keys if necessary. Legacy MIRROR compatibility handling reduces rollback risk because existing persisted state remains readable.

## Open Questions

None. All previously open questions have been resolved as decisions above:

- common.env MIRROR field: will be written as a derived backward-compatibility value (see "Persist the new model" decision).
- Enterprise offline package aliases: will use bare service names (e.g. `server`) since APP_NAMESPACE is empty in enterprise mode. Default mode uses `bklite/<service>` names.
