## 1. Image Configuration Model

- [x] 1.1 Replace the single MIRROR-centric configuration model in deploy/docker-compose/bootstrap.sh with internal registry-base and application-namespace concepts. Define two constant pairs: default (bk-lite.tencentcloudcr.com/bklite, bklite) and enterprise (bk-lite.tencentcloudcr.com/bklite/weopsx, ""). Map ENTERPRISE_ENABLED flag to the appropriate pair.
- [x] 1.2 Add compatibility loading logic that derives the effective registry base and application namespace from legacy common.env files that only define MIRROR. Handle both default-format MIRROR (no weopsx suffix) and enterprise-format MIRROR (weopsx suffix).
- [x] 1.3 Update common.env save and refresh paths to persist the new image selection fields (registry base and application namespace) needed for subsequent bootstrap runs, plus a derived MIRROR value for backward compatibility.
- [x] 1.4 Preserve the USER_MIRROR environment variable override: when the user passes MIRROR via env, treat it as a registry base override while still deriving application namespace from the ENTERPRISE_ENABLED flag.

## 2. Image Resolution Behavior

- [x] 2.1 Create separate resolution helpers in deploy/docker-compose/bootstrap.sh: one for third-party images (registry-base + library-or-upstream path) and one for internal application images (registry-base + app-namespace + service-name). Both helpers must return the image name unchanged in OFFLINE mode.
- [x] 2.2 Change all internal application image declarations from namespaced format (bklite/server) to bare service names (server) and route them through the internal application helper. Affected images: server, web, stargazer, metis, mlflow, fusion-collector, telegraf, nats-executor, vllm, webhookd.
- [x] 2.3 Validate that third-party image exports continue to resolve through the mode-specific registry base without the application namespace segment.

## 3. Offline Packaging And Generated Artifacts

- [x] 3.1 Update package mode alias restoration and hash metadata generation so offline package image names follow the same image classification rules as runtime resolution. Internal app aliases must reflect the selected namespace (bklite/ or weopsx/); third-party aliases must remain stable across modes.
- [x] 3.2 Regenerate static/install.run from deploy/docker-compose after the bootstrap script changes are complete.
- [x] 3.3 Update the inline help text and log messages in bootstrap.sh to describe the new registry-base and application-namespace model. (No external documentation files need updating as none currently describe the MIRROR configuration.)

## 4. Validation

- [x] 4.1 Verify resolved image names for a default-mode bootstrap flow match the expected paths (e.g. bk-lite.tencentcloudcr.com/bklite/bklite/server for internal, .../library/traefik:3.6.2 for third-party).
- [x] 4.2 Verify resolved image names for a --enterprise bootstrap flow match the expected paths (e.g. bk-lite.tencentcloudcr.com/bklite/weopsx/server for internal, .../library/traefik:3.6.2 for third-party).
- [x] 4.3 Verify offline package output remains loadable and consistent with the selected namespace behavior.
- [x] 4.4 Verify that a legacy common.env containing only MIRROR (both default and enterprise formats) is correctly normalized into registry base plus application namespace on next bootstrap run.
- [x] 4.5 Verify that USER_MIRROR override (MIRROR=custom.registry.com/myrepo ./bootstrap.sh install) correctly applies as registry base while respecting the ENTERPRISE_ENABLED namespace selection.
