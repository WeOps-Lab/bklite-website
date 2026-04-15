## 1. i18n 基础设施搭建

- [x] 1.1 在 `docusaurus.config.js` 的 `navbar.items` 中添加 `{ type: 'localeDropdown', position: 'right' }`，放在 GitHub 图标之前
- [x] 1.2 运行 `docusaurus write-translations --locale en` 生成 `i18n/en/` 翻译骨架文件
- [x] 1.3 翻译 `i18n/en/docusaurus-theme-classic/navbar.json`：产品文档→Docs, 部署指南→Deploy Guide, 运维手册→Operations, 开发指南→Dev Guide, AI体验→AI Playground, 价格→Pricing, 加入社区→Join Community, 在线体验→Online Demo, 账号→Account
- [x] 1.4 翻译 `i18n/en/docusaurus-theme-classic/footer.json`：产品→Products, 社区→Community, 更多→More, 及各子链接标签
- [x] 1.5 翻译 `i18n/en/docusaurus-plugin-content-docs/current.json`：所有 sidebar category 标签（监控→Monitoring, 告警→Alerts, 日志→Logs, 作业→Jobs, CMDB, 节点管理→Node Management 等）
- [x] 1.6 在 `package.json` 中添加 `"start:en": "docusaurus start --locale en --host 0.0.0.0 --port 3001"` 脚本

## 2. 首页组件国际化 (src/pages/index.js)

- [x] 2.1 用 `translate()` 包裹 hero 区域文案：tagline、副标题 "全栈能力，轻量落地"、stat cards（AI原生、极简部署、按需启用）
- [x] 2.2 用 `translate()` 包裹版本选择器数据：基础版/智能版名称和描述
- [x] 2.3 用 `translate()` 包裹复制按钮 title "复制脚本"
- [x] 2.4 用 `<Translate>` 包裹 Layout title "轻量级运维平台"

## 3. HomepageFeatures 组件国际化 (src/components/HomepageFeatures/index.js)

- [x] 3.1 用 `translate()` 包裹所有特性分类标题和描述（经典运维、智能运维等）
- [x] 3.2 用 `translate()` 包裹所有模块名称和描述（监控中心、日志中心、CMDB、告警中心、ITSM、作业管理、运营分析等）

## 4. AIShowcase 组件国际化 (src/components/AIShowcase/index.js)

- [x] 4.1 用 `translate()` 包裹所有特性卡片标题和描述（涉密环境支持、极致轻量、成本优化、边缘自治、AI原生、无感扩容、国际化、开放生态）
- [x] 4.2 用 `<Translate>` 包裹 "关键特性" section 标题

## 5. FinalCTA 组件国际化 (src/components/FinalCTA/index.js)

- [x] 5.1 用 `<Translate>` 包裹 CTA 标题 "立即开始，轻量落地智能运维" 和描述文案
- [x] 5.2 用 `translate()` 包裹特性项（5分钟快速上手、模块化设计、开源社区共建）
- [x] 5.3 用 `<Translate>` 包裹二维码相关文案（扫码加入社区、社区二维码描述）

## 6. MegaMenu 组件国际化 (src/components/MegaMenu/index.js)

- [x] 6.1 用 `translate()` 包裹所有菜单分类标题（经典运维、平台底座、智能运维）和模块描述

## 7. Navbar 自定义组件国际化

- [x] 7.1 国际化 JoinCommunityNavbarButton (src/components/JoinCommunityNavbarButton/index.js)：扫码加入社区、社区二维码、描述文案、按钮文字
- [x] 7.2 国际化 LogoutNavbarButton (src/components/LogoutNavbarButton/index.js)：管理员/访客/普通用户、账号、登录、退出登录、菜单、用户名标签等所有中文字符串

## 8. 价格页面国际化 (src/pages/pricing.js)

- [x] 8.1 用 `translate()` 包裹 pricingPlans 数据中的所有中文：社区版→Community, 标准版→Standard, 企业版→Enterprise, 所有 description 和 features 列表项, buttonText
- [x] 8.2 用 `<Translate>` 包裹页面标题 "BlueKing Lite"、副标题、"功能列表"、"推荐" badge

## 9. Playground 页面和组件国际化

- [x] 9.1 国际化 src/pages/playground/index.js：页面标题 "AI体验"、登录提示文案
- [x] 9.2 国际化 src/components/Playground/MLOpsTab/index.js：场景名称和描述（异常检测、时序预测、日志聚类、文本分类、图片分类、目标检测）、UI 按钮和状态消息
- [x] 9.3 国际化 src/components/Playground/OpsPilotTab/index.js："敬请期待" 及描述文案
- [x] 9.4 国际化 src/components/Playground/scenarios/AnomalyDetection/index.js：所有中文 UI 字符串（加载中、模型推理中、时间单位、数据标签、按钮文字、错误消息等）
- [x] 9.5 国际化 src/components/Playground/scenarios/TimeSeriesPredict/index.js：同上模式处理所有中文字符串
- [x] 9.6 国际化 src/components/Playground/scenarios/LogClustering/index.js：同上模式处理所有中文字符串
- [x] 9.7 国际化 src/components/Playground/scenarios/TextClassification/index.js：同上模式处理所有中文字符串
- [x] 9.8 国际化 src/components/Playground/scenarios/ComingSoon/index.js："该场景正在开发中，敬请期待"

## 10. 生成 code.json 英文翻译

- [x] 10.1 运行 `docusaurus write-translations --locale en` 提取所有 `<Translate>` 和 `translate()` 的翻译 key
- [x] 10.2 填写 `i18n/en/code.json` 中所有翻译 key 的英文翻译

## 11. Markdown 文档英文翻译

- [x] 11.1 创建 `i18n/en/docusaurus-plugin-content-docs/current/` 目录结构（镜像 docs/ 目录）
- [x] 11.2 翻译 opspilot 模块文档（5 个文件：introduce, feature, quick_start, capabities, tutorial）
- [x] 11.3 翻译 monitor 模块文档（3 个文件）
- [x] 11.4 翻译 alert 模块文档（3 个文件）
- [x] 11.5 翻译 log 模块文档（3 个文件）
- [x] 11.6 翻译 job 模块文档（3 个文件）
- [x] 11.7 翻译 cmdb 模块文档（3 个文件）
- [x] 11.8 翻译 node 模块文档（3 个文件）
- [x] 11.9 翻译 analysis 模块文档（3 个文件）
- [x] 11.10 翻译 mlops 模块文档（3 个文件）
- [x] 11.11 翻译 console 模块文档（3 个文件）
- [x] 11.12 翻译 itsm 模块文档（3 个文件）
- [x] 11.13 翻译 system 模块文档（3 个文件）
- [x] 11.14 翻译 deploy 模块文档（docker-compose.md）
- [x] 11.15 翻译 operations 模块文档（3 个文件）
- [x] 11.16 翻译 dev 模块文档（3 个文件）
- [x] 11.17 翻译 faq 文档（index.md）
- [x] 11.18 翻译 lab 文档（index.md）
- [x] 11.19 翻译 playground 文档（3 个文件）
- [x] 11.20 翻译 asserts 模块文档

## 12. 验证和构建测试

- [x] 12.1 运行 `docusaurus build` 验证双 locale 构建无报错
- [x] 12.2 本地启动英文 locale 验证首页、文档、价格页、Playground 所有页面显示英文
- [x] 12.3 验证 locale 切换器正常工作：中文⇄英文切换保持当前页面
- [x] 12.4 检查所有导航链接在英文 locale 下正确跳转
