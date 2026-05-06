## Context

`deploy/docker-compose/bootstrap.sh` 负责 BK-Lite 的打包（`package`）和安装（`install`）。当前离线模式下，`do_package` 通过 `restore_image_alias()` 将镜像别名化为裸名后保存到 tar，而 `do_install` 中 `resolve_*()` 函数在 OFFLINE=true 时也返回裸名以保持一致。

但由于 `source common.env` 可能覆盖 OFFLINE 变量（或用户遗漏设置），导致 `init_docker_images` 使用带前缀的完整路径写入 `.env`，与 tar 中的裸名镜像产生不匹配。

更根本的问题是：这种设计依赖"两侧都去掉前缀"的协调，任何一侧逻辑出错就会导致不一致。

## Goals / Non-Goals

**Goals:**
- 消除 package 和 install 之间的镜像名称不一致问题
- 让镜像名解析逻辑对 OFFLINE 标志完全无感（去掉 OFFLINE 对命名的影响）
- 确保离线部署时 docker-compose 能通过本地镜像名精确匹配启动容器

**Non-Goals:**
- 不改变 `OFFLINE` 控制"从 tar 加载 vs 网络 pull"的行为
- 不处理 `common.env` 的变量覆盖问题（属于更大范围的重构）
- 不改变在线安装的行为

## Decisions

### Decision 1: 离线包保存镜像使用完整 registry 路径

**选择**: `docker save` 时直接使用 `$image_name`（完整的 `REGISTRY_BASE/...` 路径）

**替代方案**:
- A) 保持裸名但修复 OFFLINE 变量传递链 → 治标不治本，仍依赖两侧协调
- B) load 后根据 .env 给镜像补 tag → 增加额外步骤且 .env 生成顺序在 load 之前

**理由**: 完整路径是镜像的唯一真实标识符。Docker 对带 registry 前缀的本地镜像不会尝试隐式 pull（只在 tag 不存在时才 pull）。两侧都用完整路径，天然一致。

### Decision 2: 移除 resolve 函数的 OFFLINE 分支

**选择**: `resolve_third_party_image()` 和 `resolve_internal_app_image()` 不再检查 OFFLINE，始终返回完整路径。

**理由**: OFFLINE 只应控制"镜像从哪获取"（网络 vs 本地 tar），不应控制"镜像叫什么名字"。职责分离更清晰。

### Decision 3: 添加 `--pull never` 作为防御性保护

**选择**: OFFLINE=true 时，所有 `docker compose up` 调用加 `--pull never`。

**理由**: 即使镜像名一致，Docker Compose V2 在某些版本下可能尝试 registry 验证。`--pull never` 是低成本的额外保障。

## Risks / Trade-offs

- **[离线包不向后兼容]** → 旧版 package 生成的包（裸名 tar）不能被新版 install 使用。在发布说明中标注需要重新打包。
- **[镜像占磁盘空间不变]** → tar 文件大小与镜像名无关，影响仅在于 tag 字符串长度。
- **[Docker Hub 镜像不再裸名引用]** → 第三方镜像如 `redis:5.0.14` 会变为 `bk-lite.../redis:5.0.14`。这是预期行为，与 enterprise 内部镜像的处理方式统一。
