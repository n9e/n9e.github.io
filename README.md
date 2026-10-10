# 夜莺官网

夜莺（Nightingale）开源官网。基于 Docusaurus 3，中文为 source of truth，英文站在 `/en/`。

方案见 `~/Desktop/2026-08-26-n9e-官网建站方案.md`，调研底稿见 `710leo/research/website/`。

## 开发

```bash
npm install
npm start          # 开发服务器，只服务默认 locale（中文）
npm start -- --locale en   # 单独看英文站
npm run build      # 中英两份产物，输出到 build/ 与 build/en/
npm run serve      # 本地起服务看构建产物（英文站在 /en/ 下）
npm run typecheck
```

## 目录

```
docusaurus.config.ts   站点配置：导航、页脚、公告条、i18n、主题色变量入口
src/
  content/             全部文案（zh.ts 为源，en.ts 对齐同一份 types.ts）
  components/home/     首页各区块 + 共用的 home.module.css
  pages/               首页与三个框架页（对比 / 集成 / 下载）
  css/custom.css       设计 token、Docusaurus 主题覆盖、全局工具类
  data/stats.json      GitHub 数字，由 scripts/fetch-stats.mjs 刷新
  data/releases.json   下载页的版本、直链、校验值，由 scripts/fetch-releases.mjs 刷新
  data/integrations.json 集成页的内置模板目录，由 scripts/fetch-integrations.mjs 刷新
scripts/integration-categories.mjs  模板的分类映射、隐藏名单、展示名与搜索别名（上游仓库没有分类字段，这里是唯一来源）
static/img/            产品截图、数据源与通知渠道 logo、用户 logo 墙；img/integrations/ 是脚本从上游同步的模板图标
i18n/en/               英文的导航/页脚等主题文案
```

## 改文案

所有可见文字都在 `src/content/zh.ts` 与 `en.ts`，两份共用 `types.ts` 的结构，漏字段 `npm run typecheck` 会报。
导航栏、页脚、公告条不在这里——前两者在 `i18n/en/docusaurus-theme-classic/*.json`，公告条按 locale 分流写在 `docusaurus.config.ts` 顶部。

## 数字更新

首页数字条的 stars / forks / 版本号来自 `src/data/stats.json`：

```bash
node scripts/fetch-stats.mjs   # 拉 GitHub API 覆写；失败则保留原值并以非零码退出
```

建议 CI 每日跑一次再构建，避免出现"12000+ Star"这类过时数字。

集成页的模板卡片（图标、几张仪表盘、几组规则、README 语言）来自 `src/data/integrations.json`：

```bash
node scripts/fetch-integrations.mjs   # 两次 GitHub API 拿目录树；图标按 blob sha 判断是否重下
```

上游新增模板而 `scripts/integration-categories.mjs` 没归类时会打印警告并落到「其他」，构建不中断。

## 设计约定

- 强调色只用产品自己的告警级别色（S1 红 / S2 橙 / S3 蓝），且必须承载真实语义，不做装饰。
- 首页"四个阶段"左侧的竖轨是产品里每行告警的级别色条放大而来；数据变成 `event` 的那一步换成三级告警色，颜色变化本身在陈述事实。
- 结构标记用产品里真实存在的对象名（`datasource → rule → event → agent`），不用 01/02/03。
- 动效只有首屏一次编排（卡片入场、色条抽出、送达渠道依次落位），其余靠 hover；`prefers-reduced-motion` 下全部关闭。
- 产品截图是核心视觉资产，光暗两套通过 `[data-theme]` 切换，不用 JS 判断。

## 接文档时要做的事

文档为下一阶段交付（方案 §4.2：一期仅 v9、全新撰写、基于 mock 环境，按用户旅程组织七个顶层）。接入时：

1. `docusaurus.config.ts` 里把 `docs: false` 换成正式配置并加 `sidebars.ts`；
2. 打开同文件中被注释的 `@easyops-cn/docusaurus-search-local`（依赖已装好）——它的 SearchBar 依赖 docs 插件，所以现在必须关着，否则构建失败；
3. 搜索框只在 `build` + `serve` 后出现，`npm start` 下看不到，属正常；
4. 把导航栏和页脚里指向 `flashcat.cloud/docs` 的"文档"链接改回站内 `/docs/`。
