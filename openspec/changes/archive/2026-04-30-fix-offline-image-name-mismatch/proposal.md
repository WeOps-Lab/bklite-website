## Why

Enterprise 离线包部署时，`do_package` 通过 `restore_image_alias` 将镜像保存为裸名（如 `webhookd`），但 `do_install` 在 OFFLINE 模式下 `init_docker_images` 仍可能生成带完整 registry 前缀的镜像引用（如 `bk-lite.tencentcloudcr.com/bklite/weopsx/webhookd`）写入 `.env`。两侧命名不一致导致 docker-compose 找不到本地镜像而尝试 pull，在离线环境下直接失败。

## What Changes

- 移除 `resolve_third_party_image()` 和 `resolve_internal_app_image()` 中的 OFFLINE 特殊分支，统一始终返回带 `REGISTRY_BASE` 前缀的完整镜像路径
- 修改 `do_package()` 移除 `restore_image_alias` 和 `docker tag` 步骤，直接用完整路径做 `docker save`
- 删除已无调用方的 `restore_image_alias()` 函数
- 在 OFFLINE 模式下为 `docker compose up` 添加 `--pull never` 防御性保护
- `OFFLINE` 变量职责收窄：仅控制"从 tar 加载 vs pull"和"跳过 collector pull"，不再参与镜像名解析

## Capabilities

### New Capabilities
- `offline-image-consistency`: 确保离线包的镜像打包命名与安装时的镜像引用完全一致

### Modified Capabilities

## Impact

- 文件: `deploy/docker-compose/bootstrap.sh`（唯一修改文件）
- 离线包格式变更: `images/*.tar` 文件内的镜像 tag 从裸名变为完整 registry 路径，`images.sha256` 中的镜像名也相应变化
- **向后不兼容**: 旧版 `do_package` 生成的离线包无法被新版 `do_install` 直接使用（镜像名不匹配）。需要用新版重新打包。
