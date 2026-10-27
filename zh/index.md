[v9 · 内置 AI AGENT 与 MCP SERVER<!-- --> →](#ai)

# 开源监控告警专家

夜莺监控（Nightingale，n9e）是一款开源告警引擎：接入你已有的 Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse 等 10+ 数据源，统一告警规则、降噪与分发。内置 AI Agent，一句话就能建规则、查清规则为什么没触发，通知里还可以附上 AI 分析摘要。

* 20+ 内置 AI Skill
* MCP / A2A 接口
* 模型自选

[在线体验](https://play.n9e.io/api/n9e/auth/demo-login)无需注册

[5 分钟安装](https://n9e.github.io/zh/docs/get-started/quick-start.md)自托管部署

[GitHub★ ](https://github.com/ccfos/nightingale)

<!-- -->

[13k+](https://github.com/ccfos/nightingale)

本机跑一套完整环境

`git clone https://github.com/ccfos/nightingale.gitcd nightingale/docker/compose-bridgedocker compose up -d`复制

n9e.example.com/dashboards

![夜莺监控仪表盘](https://n9e.github.io/zh/img/hero-dashboard-light.webp)![](https://n9e.github.io/zh/img/hero-dashboard-dark.webp)

S1CPU 使用率持续高于 90%

\_\_name\_\_=cpu\_usage\_idleident=n9e-demo-01busigroup=DevOps

触发于

<!-- -->

**02:14:07**已持续

<!-- -->

**14m**

已送达![钉钉](https://n9e.github.io/zh/img/logos/dingtalk.png)![飞书](https://n9e.github.io/zh/img/logos/feishu.png)![Slack](https://n9e.github.io/zh/img/logos/slack.png)

13,396GitHub Stars

10+数据源类型

20通知媒介

83内置集成模板

74MCP 工具

HOW IT WORKS

## 从任意数据源，到有人收到通知

夜莺不接管你的存储，只做好告警这一层。下面是数据在夜莺里流转的四个阶段，每个阶段对应产品里一个真实的对象。

datasourceruleeventagent

**event** — <!-- -->数据在这里变成告警

datasource

### 接入已有数据源

数据不搬迁。把 Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse、Loki 接成数据源，夜莺在其上做告警分析。还没有采集？Categraf 一个 agent 覆盖操作系统、中间件与数据库，按 Prometheus Remote Write 协议直接写入。

* 10+ 数据源类型，指标、日志、数据库统一接入
* 83 个内置集成模板：采集配置、仪表盘、告警规则成套导入

![夜莺集成中心的组件模板列表](https://n9e.github.io/zh/img/step-connect.webp)

rule

### 统一告警规则

指标、日志、SQL 类数据库用同一套规则体系，不必为每种数据源重学一遍配法。规则在页面上配、按业务组分权限，分 S1 / S2 / S3 三级。装完就带一批常用规则，不用从空白开始。

* 一条规则可同时作用于多个数据源
* 页面或 API 配置规则，不用改 YAML 再 reload

![夜莺告警规则管理页面](https://n9e.github.io/zh/img/step-alert.webp)

event

### 降噪，然后分发

告警风暴先在聚合视图里按业务组和级别收敛，再经屏蔽规则、订阅规则、事件 Pipeline 逐层过滤，最后按人按组送到 20 种通知媒介。需要自动处置就接 ibex 跑自愈脚本。

* 钉钉、飞书、企业微信、电话、短信、Slack 等 20 种内置媒介
* 事件 Pipeline：改写标签、按条件路由

![夜莺告警事件聚合视图](https://n9e.github.io/zh/img/step-automate.webp)

agent

### 交给 AI 处理

v9 起，n9e 进程自身就是一个 MCP Server。Claude Code、Cursor 这类客户端直连 /mcp，用自然语言查告警、看指标、加屏蔽，不用再部署一个进程。

* 内置 AI Agent 与 20+ 个 Skill
* 权限跟着 token 走，RBAC 与该用户在页面上完全一致

\~/.claude.json

```
{
  "mcpServers": {
    "nightingale": {
      "type": "http",
      "url": "http://127.0.0.1:17000/mcp",
      "headers": { "X-User-Token": "<your-token>" }
    }
  }
}
```

NIGHTINGALE AI

## 一套 AI，三种用法

AI 能力都在 n9e 进程里，不用另外部署组件。三种用法共用一套权限：AI 能看到、能改的，和当前用户在页面上一样。

1. 在夜莺里用

   ### 内置 AI Agent 与 20+ 个 Skill

   能建告警规则和仪表盘，能生成 PromQL / SQL，能排查规则为什么没触发、诊断主机健康，还能写通知模板和自愈脚本。团队自己的排查流程可以用 skill-creator 做成新 Skill，也可以从 git 仓库安装。

2. 在告警流程里用

   ### 通知里附上 AI 分析摘要

   在事件 Pipeline 里加一个 AI 摘要节点，大模型在通知发出前写好分析，值班的人在钉钉、飞书、Slack 里就能直接看到。

3. 从外部调用

   ### MCP 与 A2A，两个入口

   Claude Code、Cursor 这类客户端连 /mcp（74 个工具，写工具默认关闭），其他 Agent 通过 /a2a 调用夜莺。两个入口用同一个 token，也支持 OAuth 2.1 对接 Keycloak、Entra ID、Okta。

模型自选：OpenAI 兼容接口、Claude、Gemini，私有部署也能接内网模型。

claude — nightingale via MCP

昨晚有哪些 S1 告警还没恢复？

nightingale · get\_alert\_events<!-- --> severity=1 status=firing

3 条进行中，最久的是 mysql-prod 主从延迟 > 30s，已持续 2h14m

mysql-prod 最近一小时的内存用量呢？

nightingale · query\_metrics<!-- --> ident=mysql-prod range=1h

峰值 87.4%，当前 62.1%，没有触发内存类规则

把主从延迟这条屏蔽到明早 9 点，理由写"变更窗口"

nightingale · create\_mute\_rule<!-- --> scope=mysql-prod until=09:00

✓ 屏蔽规则 #1024 已创建，明日 09:00 自动失效

INTEGRATIONS

## 长在你现有的技术栈上

夜莺不要求你换一套体系。数据源、采集器、通知媒介都对接现成的。

DATA SOURCES<!-- --> · <!-- -->数据源

* ![Prometheus logo](https://n9e.github.io/zh/img/logos/prometheus.png)Prometheus
* ![VictoriaMetrics logo](https://n9e.github.io/zh/img/logos/victoriametrics.png)VictoriaMetrics
* ![ElasticSearch logo](https://n9e.github.io/zh/img/logos/elasticsearch.png)ElasticSearch
* ![ClickHouse logo](https://n9e.github.io/zh/img/logos/ck.png)ClickHouse
* ![Loki logo](https://n9e.github.io/zh/img/logos/loki.png)Loki
* ![VictoriaLogs logo](https://n9e.github.io/zh/img/logos/victorialogs.png)VictoriaLogs
* ![MySQL logo](https://n9e.github.io/zh/img/logos/mysql.png)MySQL
* ![PostgreSQL logo](https://n9e.github.io/zh/img/logos/pgsql.png)PostgreSQL
* ![TDengine logo](https://n9e.github.io/zh/img/logos/tdengine.png)TDengine
* ![OpenSearch logo](https://n9e.github.io/zh/img/logos/opensearch.png)OpenSearch
* ![Doris logo](https://n9e.github.io/zh/img/logos/doris.png)Doris
* ![IoTDB logo](https://n9e.github.io/zh/img/logos/iotdb.png)IoTDB

NOTIFICATIONS<!-- --> · <!-- -->通知媒介

* ![钉钉 logo](https://n9e.github.io/zh/img/logos/dingtalk.png)钉钉
* ![飞书 logo](https://n9e.github.io/zh/img/logos/feishu.png)飞书
* ![企业微信 logo](https://n9e.github.io/zh/img/logos/wecom.png)企业微信
* 电话 / 短信
* 邮件
* ![Slack logo](https://n9e.github.io/zh/img/logos/slack.png)Slack
* ![Telegram logo](https://n9e.github.io/zh/img/logos/telegram.png)Telegram
* ![Discord logo](https://n9e.github.io/zh/img/logos/discord.png)Discord
* ![Mattermost logo](https://n9e.github.io/zh/img/logos/mattermost.png)Mattermost
* ![PagerDuty logo](https://n9e.github.io/zh/img/logos/pagerduty.png)PagerDuty
* ![FlashDuty logo](https://n9e.github.io/zh/img/logos/flashduty.png)FlashDuty
* ![Jira logo](https://n9e.github.io/zh/img/logos/jira.png)Jira

[查看全部集成<!-- --> →](https://n9e.github.io/zh/integrations.md)

DEPLOY

## 按你的环境部署

### 自建

Apache-2.0 全功能开源。一条 compose 命令拉起，也支持二进制与 Helm。

`docker compose up -d`[下载与安装](https://n9e.github.io/zh/download.md)

<!-- -->

[ →](https://n9e.github.io/zh/download.md)

### 边缘机房

与中心网络不稳的机房部署 n9e-edge 作本地告警引擎：断网期间告警照常产生、照常通知。

`n9e-edge --configs etc/edge`[了解边缘架构](https://n9e.github.io/zh/docs/operations/edge-partition.md)

<!-- -->

[ →](https://n9e.github.io/zh/docs/operations/edge-partition.md)

COMPARISONS

## 和你在用的比一比

各有所长。夜莺建议你继续用 Prometheus 或 VictoriaMetrics 存数据，把告警这层交给专家。

### [vs Prometheus + Alertmanager](https://n9e.github.io/zh/comparisons/prometheus-alertmanager.md)

[同样的数据，规则在页面上配、有权限体系，通知媒介不用自己搭。](https://n9e.github.io/zh/comparisons/prometheus-alertmanager.md)

### [vs Zabbix](https://n9e.github.io/zh/comparisons/zabbix.md)

[不重做采集体系，接住你已有的时序库与日志库，云原生栈更顺手。](https://n9e.github.io/zh/comparisons/zabbix.md)

### [vs Grafana Alerting](https://n9e.github.io/zh/comparisons/grafana-alerting.md)

[Grafana 长于可视化，夜莺把力气全花在告警引擎与事件分发上。](https://n9e.github.io/zh/comparisons/grafana-alerting.md)

[看完整对比](https://n9e.github.io/zh/comparisons.md)

<!-- -->

[ →](https://n9e.github.io/zh/comparisons.md)

WHO USES NIGHTINGALE

## 数千家企业的生产环境里跑着夜莺

互联网、金融、车企、制造、医疗——以下为部分授权展示的用户。

![夜莺用户企业 logo 墙](https://n9e.github.io/zh/img/user-logos.webp)

## 把告警这件事，交给专家

五分钟拉起一套夜莺，接上你的数据源，收到第一条告警。

[5 分钟安装](https://n9e.github.io/zh/docs/get-started/quick-start.md)[GitHub](https://github.com/ccfos/nightingale)

<!-- -->

[ →](https://github.com/ccfos/nightingale)

社区·[Slack #n9e](https://join.slack.com/t/n9e/shared_invite/zt-4ejx42fd0-S9aVULH4FTdH~jEAz80U7g)·[GitHub Issues](https://github.com/ccfos/nightingale/issues)·微信群加 picobyte，备注"夜莺互助群"
