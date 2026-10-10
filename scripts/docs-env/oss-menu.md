# 开源版侧栏菜单（写「在哪个菜单下」时照抄这里）

从跑起来的开源前端里抽出来的，不是 locale 文件里的键名——两者对不上。
比如 `/alert-rules` 在中文界面显示的是「规则管理」而不是「告警规则」，
`/targets` 显示「设备列表」而不是「机器列表」。

**侧栏那一行的名字不一定是页面的名字。** `/metric/explorer` 侧栏叫「指标」，
但那一行是页签组，落地的页签叫「即时查询」——写「去 XX 页面查一下」时要用后者。
产品里不存在的名字（比如「指标浏览器」「日志浏览器」）一律不要用，
`node scripts/docs-env/check-ui-names.mjs` 会把它们查出来。

重新抽取：`KEEP_MENU=1 node scripts/docs-env/inspect-ui.mjs /alert-rules --locale zh`

| 路由 | 英文 | 中文 |
|---|---|---|
| `/landing` | Home | 首页 |
| `/nightingale-ai` | Nightingale AI | Nightingale AI |
| — | Infrastructure | 基础设施 |
| `/targets` | Hosts | 设备列表 |
| — | Explorer | 数据查询 |
| `/metric/explorer` | Metrics | 指标（侧栏这一行是页签组，落地的那个页签叫 **即时查询 / Metrics explorer**，写正文时用页签名） |
| `/log/explorer` | Logs | 日志（页面标题是 **日志检索 / Log explorer**） |
| `/dashboards` | Dashboards | 仪表盘 |
| — | Alerts & Notifications | 告警通知 |
| `/alert-rules` | Alert rules | 规则管理 |
| `/job-tpls` | Self-healing | 告警自愈（下面两个 tab：自愈脚本 `/job-tpls`、历史任务 `/job-tasks`） |
| `/alert-cur-events` | Events | 告警事件 |
| `/notification-rules` | Notification rules | 通知规则 |
| `/notification-channels` | Media types | 通知媒介 |
| `/notification-templates` | Message templates | 消息模板 |
| `/event-pipelines` | Workflows | 工作流 |
| — | Integrations | 集成中心 |
| `/datasources` | Data sources | 数据源 |
| `/components` | Components | 模板中心 |
| `/embedded-products` | Embedded products | 系统集成 |
| — | Organization | 人员组织 |
| `/users` | Users | 用户管理 |
| `/user-groups` | Teams | 团队管理 |
| `/roles` | Roles | 角色管理 |
| — | System | 系统配置 |
| `/system/site-settings` | Site | 站点设置 |
| `/system/variable-settings` | Variable | 变量设置 |
| `/system/sso-settings` | SSO | 单点登录 |
| `/system/alerting-engines` | Alerting engines | 告警引擎 |
| `/system/version` | About | 关于产品 |

菜单里没有独立入口、但开源版能用的页面：

| 路由 | 英文 | 中文 | 入口 |
|---|---|---|---|
| `/alert-mutes` | Muting rules | 屏蔽规则 | 规则管理页的 tab |
| `/alert-subscribes` | Subscription rules | 订阅规则 | 规则管理页的 tab |
| `/recording-rules` | Recording rules | 记录规则 | 指标页的 tab |
| `/metrics-built-in` | Built-in metrics | 指标视图 | 指标页的 tab |
| `/object/explorer` | Quick view | 快捷视图 | 指标页的 tab |
| `/metric/explorer` | Metrics explorer | 即时查询 | 指标页的第一个 tab，也是点「指标」的落地页 |
| `/nightingale-ai/llm-configs` | LLM configs | LLM 管理（页面标题是「LLM 配置」） | Nightingale AI 工作区的二级侧栏 |
| `/nightingale-ai/skills` | Skill management | Skill 管理 | 同上 |
| `/event-pipelines-executions` | Execution records | 执行记录 | 工作流页的 tab |

## 告警规则的「数据源类型」列表是动态的

告警规则表单里能选的数据源类型，**只包含你已经注册过至少一个实例的类型**
（`fe/src/App.tsx` 里按已注册数据源过滤 `datasourceCateOptions`）。
所以在一个只注册了 Prometheus 的环境里，规则表单看起来"只支持 Prometheus"——
那是环境的样子，不是产品的限制。

11 种类型（Prometheus Like、Elasticsearch、Loki、TDengine、ClickHouse、MySQL、
PostgreSQL、Doris、OpenSearch、VictoriaLogs、IoTDB）**都能配告警规则**，
Doris 和 IoTDB 也在内（后端 `models/alert_rule.go` 的 `IsInnerRule()` 明确列了这两个）。
规则表单里另外多一张「Host」卡片，那不是数据源，是针对设备列表里机器的一种规则类型。

**没有 `victoriametrics` 这个数据源类型。** VictoriaMetrics 注册成 `Prometheus Like`，
在表单最后的「时序库类型」里选 VictoriaMetrics——那个字段只影响仪表盘查询的优化方式。

## 真正受限的是查询和仪表盘，不是告警

`ck`、`doris`、`mysql`、`pgsql`、`opensearch` 在 `fe/src/utils/datasourceRegistry.ts` 里标了
`graphPro: true`，开源版**进不了即时查询、日志检索和仪表盘**，只能用于告警规则。

- 日志检索开源版只有：Elasticsearch、Loki、VictoriaLogs
- 即时查询开源版只有：Prometheus Like、TDengine、IoTDB

写文档时不要说「注册完就能在即时查询里验证」——对 MySQL、ClickHouse 这些不成立，
它们在开源版里唯一能跑查询的地方是告警规则表单里的「数据预览」。
