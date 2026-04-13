## Why

BlueKing Lite 网站目前所有内容（文档、自定义页面、React 组件、导航/页脚）均为中文硬编码。作为一个开源运维平台，需要面向国际社区提供英文版本，扩大用户覆盖面和社区参与度。Docusaurus 已配置 `i18n.locales: ['zh-Hans', 'en']` 但尚无任何英文翻译内容。

## What Changes

- 在 `docusaurus.config.js` navbar 中添加 `localeDropdown` 语言切换器
- 使用 Docusaurus `<Translate>` 组件包裹所有 React 组件中的硬编码中文字符串（~200+ 处，涉及 ~15 个组件文件）
- 运行 `docusaurus write-translations --locale en` 生成翻译 JSON 骨架
- 创建 `i18n/en/code.json` 填充所有 `<Translate>` 组件的英文翻译
- 创建 `i18n/en/docusaurus-theme-classic/navbar.json` 和 `footer.json` 翻译 navbar/footer 标签
- 创建 `i18n/en/docusaurus-plugin-content-docs/current/` 下全部 ~50 个 Markdown 文档的英文翻译版
- 翻译 ~15 个 `_category_.json` 的 sidebar 标签
- 自定义页面（首页、价格页、Playground）通过 `<Translate>` 实现双语
- 在 `package.json` 中添加英文 locale 的 start/build 脚本

## Capabilities

### New Capabilities
- `i18n-infrastructure`: Docusaurus i18n 基础设施 — localeDropdown、翻译 JSON 文件结构、构建脚本
- `component-i18n`: React 组件国际化 — 用 `<Translate>` 包裹所有硬编码中文，生成 `code.json`
- `docs-translation`: Markdown 文档英文翻译 — 50 个文档文件的完整英文版本
- `page-i18n`: 自定义页面国际化 — 首页、价格页、Playground 页面的双语支持

### Modified Capabilities

（无已有 spec 需要修改）

## Impact

- **代码文件**: ~15 个 React 组件文件需要用 `<Translate>` 包裹中文字符串
- **新增文件**: `i18n/en/` 下约 60+ 个文件（50 个翻译文档 + JSON 翻译文件）
- **配置**: `docusaurus.config.js` 添加 localeDropdown
- **构建**: 构建时间增加（需编译两个 locale），CI/CD 需适配
- **依赖**: 无新增依赖（`<Translate>` 是 `@docusaurus/Translate` 内置组件）
- **SEO**: 英文页面使用 `/en/` 前缀路径，需确保 hreflang 标签正确（Docusaurus 自动处理）
