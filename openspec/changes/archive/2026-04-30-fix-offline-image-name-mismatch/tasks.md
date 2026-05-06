## 1. 移除 OFFLINE 镜像名解析逻辑

- [x] 1.1 删除 `resolve_third_party_image()` 中的 OFFLINE 分支 (line 186-189)
- [x] 1.2 删除 `resolve_internal_app_image()` 中的 OFFLINE 分支 (line 206-213)
- [x] 1.3 删除 `restore_image_alias()` 函数 (line 234-256)

## 2. 修改 do_package 使用完整路径保存

- [x] 2.1 在 `do_package()` 中移除 `restore_image_alias` 调用和 `docker tag` 步骤 (line 1225-1227)
- [x] 2.2 将 `docker save` 和 hash 记录改为直接使用 `$image_name`（完整路径）(line 1230-1241)

## 3. 添加 --pull never 防御性保护

- [x] 3.1 在 `start_services()` 中，OFFLINE=true 时为 `docker compose up` 添加 `--pull never` (line 924, 940)
- [x] 3.2 检查脚本中其他 `docker compose up` 调用点 (line 1154)，同样添加保护

## 4. 验证

- [x] 4.1 确认 `init_docker_images` 在 OFFLINE 和非 OFFLINE 模式下返回相同的镜像名
- [x] 4.2 确认 `load_docker_images_with_hash_check` 加载的镜像 tag 与 `.env` 中引用一致
- [x] 4.3 确认 `generate_collector_packages` 中的 OFFLINE 跳过 pull 逻辑不受影响
