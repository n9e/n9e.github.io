# 文档截图环境

把一个空的夜莺实例拉起来、灌成「像真的在用」的样子，然后按清单批量截图。
所有脚本都可重复执行，环境重建后一条命令回到同样的画面——不然第二批截图和第一批对不上。

## 起环境

四套 `docker/compose-*` 在 mac 上都用不了（两套要 `network_mode: host`，Docker Desktop 不支持；
`compose-bridge` 要占 3306）。不用 compose：夜莺的默认配置本来就零外部依赖。

```bash
# 后端：SQLite + 进程内 redis + 内置时序库，单进程
cd ~/gopath/src/github.com/ccfos/nightingale
go build -o /tmp/n9e-run/n9e ./cmd/center/main.go
cp -R etc /tmp/n9e-run/ && ln -s $PWD/integrations /tmp/n9e-run/integrations
cd /tmp/n9e-run && ./n9e            # :17000

# 前端：必须是 dev，不是 dev:advanced
cd ~/gopath/src/github.com/n9e/fe
PROXY=http://localhost:17000 npm run dev   # :8765
```

**`npm run dev:advanced` 会把 `plus:` 解析到 `src/plus/`，渲染的是商业版 UI。**
开源文档的截图只能来自 `npm run dev`。

几个踩过的坑：

- 同一个 SQLite 文件上跑两个 n9e 进程会把库写坏（`database disk image is malformed`）。
  重置数据库时要连 `n9e.db-wal`、`n9e.db-shm` 一起删，只删 `n9e.db` 会让新库配上旧 WAL。
- 起进程前先 `lsof -nP -iTCP:17000 -sTCP:LISTEN` 确认没有旧实例，相对路径启动的老进程
  用 `pkill -f /tmp/n9e-run/n9e` 是杀不掉的。
- 本机有 http 代理，访问 127.0.0.1 和局域网都要 `--noproxy '*'` / `NO_PROXY=*`。

## 灌数据

```bash
./start-categraf.sh start        # 5 个 categraf 实例伪装成 5 台主机
python3 seed-demo.py             # 团队/用户/业务组/数据源/主机归属/仪表盘/规则/通知
python3 webhook-listener.py &    # 收通知，让"通知记录"页有成功投递
```

`seed-demo.py` 也可以只跑某几步：`python3 seed-demo.py rules notify`。

除内置时序库之外的数据源要连一台常驻各类容器的测试机。**这个仓库是公开的，
所以地址和口令一律走环境变量，不写死在脚本里**：

```bash
export DS_HOST=<测试机地址>
export DS_MYSQL_PASSWORD=...    DS_PGSQL_PASSWORD=...
export DS_CK_PASSWORD=...       DS_TDENGINE_PASSWORD=...
python3 seed-demo.py datasources
```

不设 `DS_HOST` 就跳过这一步，只保留自动注册的 `embedded-tsdb`——
文档站大部分截图并不需要外部数据源。

演示对象一律取英文名（`Trading System`、`Host memory usage too high`）。
这些是数据不是界面文案，一份要同时出现在中英两套截图里；
中文名出现在英文站截图里很怪，英文名出现在中文站截图里则完全正常。

告警事件**没有造事件的 API**（`center/router/mock_event.go` 里那个只在内存里流转、不落库）。
唯一的办法是建一条必然触发的规则让告警引擎真的烧出来——这样事件详情、通知记录、
恢复流程全是真的。想让事件重新触发并重发通知，把活跃事件删掉即可。

`demo-vm` 指向局域网那台 VictoriaMetrics，里面是**团队真实主机名**。
所有演示规则都用 `datasource_queries` 锁死在内置时序库上（`match_type: 0`），
不锁的话默认是「所有数据源」，会把别人的主机名扫进演示事件里。
截图时同理：查询类页面只用 `embedded-tsdb`。

## 截图

```bash
node shoot-docs.mjs --list          # 只看清单和总张数
node shoot-docs.mjs                 # 全截，中英两套
node shoot-docs.mjs data alerting   # 只截这些 section
```

- 落到 `static/img/docs/<section>/<name>.png`（英文）和 `<name>.zh.png`（中文）；
- 截完跑 `node webp-docs.mjs`：PNG 转成无损 WebP（体积省三到五成）、删掉 PNG，
  并把尺寸写进 `src/data/doc-shots.json` 供 `<Shot>` 加 width/height。正文和组件只认 `.webp`；
- 视口 1600×900，`deviceScaleFactor: 2`，和团队既有约定一致；
- 语言和「侧栏收起」都在登录前写进 localStorage（`language`、`menuCollapsed`），
  靠点按钮收侧栏不可靠，每次导航组件都会重挂载；
- playwright 从 `n9e/fe/node_modules` 借，用系统装的 Chrome（`channel: 'chrome'`），
  不给文档站加这个重依赖，也不去下 playwright 自带的 chromium。

要加图就改 `shot-manifest.mjs`，不要改 `shoot-docs.mjs`。

## 开源 / 商业版边界

`plus-only-menus.json` 记着哪些功能是商业版独有的，开源文档不得出现。

判定方法是**在开源前端里实际访问路由，渲染 404 的才算商业版独有**。
不要拿两份 `menu.tsx` 取差集——AI 配置就是反例：它在商业版菜单里有独立入口，
开源版同样能用，只是入口挪进了 Nightingale AI 工作区的二级侧栏
（`/ai-config/llm-configs` 会 302 到 `/nightingale-ai/llm-configs`）。
