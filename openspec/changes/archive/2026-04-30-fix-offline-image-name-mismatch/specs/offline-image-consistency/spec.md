## ADDED Requirements

### Requirement: Package preserves full image reference
`do_package` SHALL save Docker images using their complete registry-qualified name (including REGISTRY_BASE and APP_NAMESPACE) as the image tag in the tar file.

#### Scenario: Enterprise package saves with full path
- **WHEN** `bootstrap.sh package --enterprise` is executed
- **THEN** each image tar file contains the tag `bk-lite.tencentcloudcr.com/bklite/weopsx/<service>` (not bare `<service>`)

#### Scenario: Community package saves with full path
- **WHEN** `bootstrap.sh package` is executed without --enterprise
- **THEN** each image tar file contains the tag `bk-lite.tencentcloudcr.com/bklite/bklite/<service>` for internal images and `bk-lite.tencentcloudcr.com/bklite/<third-party>` for third-party images

### Requirement: Install generates matching image references
`do_install` in OFFLINE mode SHALL generate `.env` image variable values that exactly match the image tags stored in the offline tar files.

#### Scenario: Offline enterprise install uses full path in .env
- **WHEN** `OFFLINE=true bootstrap.sh --enterprise` is executed
- **THEN** `.env` contains `DOCKER_IMAGE_WEBHOOKD=bk-lite.tencentcloudcr.com/bklite/weopsx/webhookd`
- **AND** the loaded local image is tagged as `bk-lite.tencentcloudcr.com/bklite/weopsx/webhookd`

#### Scenario: Image name resolution is OFFLINE-agnostic
- **WHEN** `init_docker_images` is called regardless of OFFLINE value
- **THEN** `resolve_third_party_image()` and `resolve_internal_app_image()` SHALL return the same full registry path in both online and offline modes

### Requirement: Offline install never attempts network pull
In OFFLINE mode, Docker Compose SHALL NOT attempt any network requests to image registries.

#### Scenario: docker compose up with --pull never
- **WHEN** OFFLINE=true and `docker compose up` is invoked by `start_services()`
- **THEN** the command MUST include `--pull never` flag

#### Scenario: Collector image skip
- **WHEN** OFFLINE=true and `generate_collector_packages()` is called
- **THEN** `docker pull` for the collector image SHALL be skipped (existing behavior preserved)

### Requirement: Hash file records full image names
The `images.sha256` file generated during `do_package` SHALL record the full registry-qualified image name for each entry.

#### Scenario: Hash file format
- **WHEN** package completes
- **THEN** each line in `images/images.sha256` follows format: `<full-registry-path> <sha256-hash> <filename.tar>`
