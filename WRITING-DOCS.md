# 写文档的口径

这份是给参与补齐 `docs/` 的人（和 agent）看的硬约束。信息架构已经定好了，
每一页的标题和 description 就是提纲（见 `scripts/docs-tree.mjs`），不用重新设计目录。

标杆是 `docs/get-started/quick-start.md`：短、直给、每段只说一件事。

## 一、一切可核对的东西必须溯源

| 要写的东西 | 去哪儿核对 |
|---|---|
| 菜单名、页面标题、字段名 | `n9e/fe/src/components/SideMenu/locale/{zh_CN,en_US}.ts`，以及对应页面自己的 `locale/` |
| 路由 / UI 路径 | 在 `http://localhost:8765` 上真的点一遍 |
| 配置项、默认值 | `ccfos/nightingale/etc/config.toml` 及对应 conf 结构体 |
| API 路径、参数 | `ccfos/nightingale/center/router/` |
| 数据表、字段语义 | `ccfos/nightingale/models/` |
| 旧站已有的中文正文 | `flashcatcloud/fc-site/content/chinese/docs/content/flashcat-monitor/nightingale-v9/`（stub 里的 `legacy:` URL 到本地文件是机械映射） |

旧站的 `_en.md` 是 `hidden: true` 的半成品，**不要当英文底稿**。

## 二、写不实就不写

某页凭现有源码和环境落不到「读者照着做能成」的程度，就**保留 `planned: true`**，
在批次报告里说明卡在哪。半成品且诚实，好过写满且是编的。

## 三、不写商业版功能

`plus-only-menus.json` 里列的东西一律不进开源文档。判定方法见 `scripts/docs-env/README.md`。
容易搞错的是 AI 配置——它是开源的，只是入口在 Nightingale AI 工作区里。

## 四、文风

- 一页 60–150 行是常态，超过 250 行说明啰嗦了；
- 不写「整体三栏布局」这类结构描述，直接说每个区域干什么；
- 开头一句说清「这页办完你会得到什么」，不要先介绍功能叫什么；
- 结尾给「下一步」，链回旅途的下一环；
- 命令、配置片段要完整可复制，版本明确，不含真实凭据；
- 每个操作步骤都要有「预期结果」，让读者能判断自己做对没有。

## 五、中英两份

中文先写（源材料是中文），英文同批产出，不是机翻——按英文读者的习惯重排，
术语对齐 `en_US.ts`。

**两份的标题结构必须一致**（数量、顺序、被链接到的锚点 slug）。两边标题一漂，
跨页 `#锚点` 链接就会只在一个语言下断，而 `onBrokenAnchors: 'warn'` 只警告不报错，
159 页的构建日志里没人会看见它。

## 六、截图

只有「照着做」的页面配图；概念页、排障页、参考手册以文字和表格为主。
要图就往 `scripts/docs-env/shot-manifest.mjs` 里加一条，然后
`node scripts/docs-env/shoot-docs.mjs <section>`，不要手动截图往仓库里塞。

引用路径写成 `/img/docs/<section>/<name>.png`。中文页引 `.zh.png` 那一份。

## 七、写完一页要做的事

1. 删掉 front matter 里的注释块 + `planned: true` + `sidebar_class_name: planned` +
   `legacy:`（如果有），保留 `title` / `sidebar_label` / `description`；
2. 中英两棵树都要改：`docs/` 和 `i18n/zh-Hans/docusaurus-plugin-content-docs/current/`；
3. 在 `scripts/docs-tree.mjs` 对应的 `doc(...)` 上加 `{ existing: true }`——
   这是文件被误删后 scaffold 不会悄悄重建成空占位的唯一保险；
4. 跑 `npm run scaffold`，确认 `sidebars.ts`、`src/data/docs-tabs.json`、
   `src/css/docs-icons.css`、`i18n/en/docusaurus-plugin-content-docs/current.json`
   这四个生成文件 `git diff` 为空。`{ existing: true }` 一旦误加到 `category(...)` 上
   会悄悄改掉侧栏输出；
5. `npm run build` 过（两个 locale，`onBrokenLinks: 'throw'` 是硬门禁）。
