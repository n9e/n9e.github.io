APACHE-2.0 · SELF-HOSTED · NO VENDOR LOCK-IN

# Open-Source Alerting for Your Existing Stack

Nightingale (n9e) is an open-source alerting engine. Run alert rules across Prometheus, VictoriaMetrics, Elasticsearch, ClickHouse and more from one place, and route alerts to Slack, PagerDuty or whatever your team already uses. A built-in AI agent writes rules from plain language, explains why a rule didn't fire, and can attach an AI summary to each notification.

* Built-in AI agent
* 20+ skills
* MCP & A2A
* Bring your own model

[Try live demo](https://play.n9e.io/api/n9e/auth/demo-login)No sign-up

[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)Self-hosted

[GitHub★ ](https://github.com/ccfos/nightingale)

<!-- -->

[13k+](https://github.com/ccfos/nightingale)

Run the whole stack locally

`git clone https://github.com/ccfos/nightingale.gitcd nightingale/docker/compose-bridgedocker compose up -d`Copy

n9e.example.com/dashboards

![Nightingale monitoring dashboard](https://n9e.github.io/img/hero-dashboard-light.webp)![](https://n9e.github.io/img/hero-dashboard-dark.webp)

S1CPU usage above 90%

\_\_name\_\_=cpu\_usage\_idleident=n9e-demo-01busigroup=DevOps

Fired

<!-- -->

**02:14:07**Firing for

<!-- -->

**14m**

Delivered![Slack](https://n9e.github.io/img/logos/slack.png)![PagerDuty](https://n9e.github.io/img/logos/pagerduty.png)![Telegram](https://n9e.github.io/img/logos/telegram.png)

13,400GitHub stars

10+Data source types

20Notification channels

83Built-in integrations

74MCP tools

HOW IT WORKS

## From any data source to someone getting paged

Nightingale does not take over your storage. It does one layer well. Here is how data moves through it — each stage is a real object in the product.

datasourceruleeventagent

**event** — <!-- -->data becomes an alert here

datasource

### Connect what you already run

No migration. Register Prometheus, VictoriaMetrics, ElasticSearch, ClickHouse or Loki as a data source and Nightingale evaluates alerts on top of it. Nothing collecting yet? Categraf covers operating systems, middleware and databases in a single agent and writes straight in over Prometheus Remote Write.

* 10+ data source types — metrics, logs and databases alike
* 83 built-in integrations bundle collector config, dashboards and rules

![Nightingale integration templates](https://n9e.github.io/img/step-connect.webp)

rule

### Write the rule once

Metrics, logs and SQL-queried stores share one rule model, so there is nothing new to learn per data source. Rules are configured in the UI, scoped by business group, and graded S1 / S2 / S3. A library of common rules ships with the install, so you never start from an empty page.

* One rule can span several data sources
* Edit rules in the UI or through the API — no YAML reload cycle

![Nightingale alert rule management](https://n9e.github.io/img/step-alert-en.webp)

event

### Cut the noise, then route

Storms collapse into an aggregated view by business group and severity. Mute rules, subscriptions and event pipelines filter what is left, and the survivors reach people through 20 notification channels. Wire up ibex when an alert should fix itself.

* DingTalk, Feishu, WeCom, phone, SMS, Slack and 15 more
* Event pipelines rewrite labels and route conditionally

![Nightingale aggregated alert events](https://n9e.github.io/img/step-automate-en.webp)

agent

### Hand it to an agent

Since v9 the n9e process is itself an MCP server. Claude Code, Cursor and anything else that speaks MCP connect to /mcp and manage alerting in plain language. There is no extra process to deploy.

* Built-in AI agent with 20+ skills
* Permissions follow the token — identical RBAC to that user in the UI

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

## One AI agent, three ways in

All of it runs inside the n9e process, with nothing extra to deploy. Every path shares one permission model: the AI sees and changes exactly what the current user can in the UI.

1. Inside Nightingale

   ### A built-in agent with 20+ skills

   Create alert rules and dashboards, write PromQL and SQL, find out why a rule didn't fire, diagnose hosts, draft notification templates and self-healing scripts. Turn your team's runbooks into new skills with skill-creator, or install them from git.

2. In the alert pipeline

   ### An AI summary with the alert

   Add an AI summary step to an event pipeline, and the on-call engineer gets the model's analysis in Slack or PagerDuty with the alert.

3. From outside

   ### Two endpoints: MCP and A2A

   Claude Code and Cursor connect to /mcp (74 tools, write tools off by default); other agents call Nightingale over /a2a. One token for both, or OAuth 2.1 with Keycloak, Entra ID or Okta.

Bring your own model: OpenAI-compatible, Claude or Gemini, including models running inside your network.

claude — nightingale via MCP

which S1 alerts from last night are still firing?

nightingale · get\_alert\_events<!-- --> severity=1 status=firing

3 still firing. Longest: mysql-prod replica lag > 30s, 2h14m

what did memory on mysql-prod look like this past hour?

nightingale · query\_metrics<!-- --> ident=mysql-prod range=1h

Peak 87.4%, now 62.1%. No memory rule fired.

mute the replica lag alert until 9am, reason "change window"

nightingale · create\_mute\_rule<!-- --> scope=mysql-prod until=09:00

✓ Mute rule #1024 created, expires tomorrow 09:00

INTEGRATIONS

## It grows on the stack you have

Nightingale never asks you to replace what works. Data sources, collectors and notification channels all plug into what is already running.

DATA SOURCES<!-- --> · <!-- -->Data sources

* ![Prometheus logo](https://n9e.github.io/img/logos/prometheus.png)Prometheus
* ![VictoriaMetrics logo](https://n9e.github.io/img/logos/victoriametrics.png)VictoriaMetrics
* ![ElasticSearch logo](https://n9e.github.io/img/logos/elasticsearch.png)ElasticSearch
* ![ClickHouse logo](https://n9e.github.io/img/logos/ck.png)ClickHouse
* ![Loki logo](https://n9e.github.io/img/logos/loki.png)Loki
* ![VictoriaLogs logo](https://n9e.github.io/img/logos/victorialogs.png)VictoriaLogs
* ![MySQL logo](https://n9e.github.io/img/logos/mysql.png)MySQL
* ![PostgreSQL logo](https://n9e.github.io/img/logos/pgsql.png)PostgreSQL
* ![TDengine logo](https://n9e.github.io/img/logos/tdengine.png)TDengine
* ![OpenSearch logo](https://n9e.github.io/img/logos/opensearch.png)OpenSearch
* ![Doris logo](https://n9e.github.io/img/logos/doris.png)Doris
* ![IoTDB logo](https://n9e.github.io/img/logos/iotdb.png)IoTDB

NOTIFICATIONS<!-- --> · <!-- -->Notification channels

* ![Slack logo](https://n9e.github.io/img/logos/slack.png)Slack
* ![PagerDuty logo](https://n9e.github.io/img/logos/pagerduty.png)PagerDuty
* Email
* ![Telegram logo](https://n9e.github.io/img/logos/telegram.png)Telegram
* ![Discord logo](https://n9e.github.io/img/logos/discord.png)Discord
* ![Jira logo](https://n9e.github.io/img/logos/jira.png)Jira
* ![Mattermost logo](https://n9e.github.io/img/logos/mattermost.png)Mattermost
* Phone / SMS
* ![FlashDuty logo](https://n9e.github.io/img/logos/flashduty.png)FlashDuty
* ![DingTalk logo](https://n9e.github.io/img/logos/dingtalk.png)DingTalk
* ![Feishu logo](https://n9e.github.io/img/logos/feishu.png)Feishu
* ![WeCom logo](https://n9e.github.io/img/logos/wecom.png)WeCom

[See every integration<!-- --> →](https://n9e.github.io/integrations.md)

DEPLOY

## Run it where you need it

### Self-hosted

Apache-2.0, fully featured. One compose command brings it up; binaries and Helm are there too.

`docker compose up -d`[Download and install](https://n9e.github.io/download.md)

<!-- -->

[ →](https://n9e.github.io/download.md)

### Edge data centers

Deploy n9e-edge as a local alerting engine where the link to the center is unreliable. Alerts keep firing and keep being delivered through a network partition.

`n9e-edge --configs etc/edge`[About the edge architecture](https://n9e.github.io/docs/operations/edge-partition.md)

<!-- -->

[ →](https://n9e.github.io/docs/operations/edge-partition.md)

COMPARISONS

## Against what you run today

Each tool has its ground. Keep Prometheus or VictoriaMetrics for storage — Nightingale argues only for owning the alerting layer.

### [vs Prometheus + Alertmanager](https://n9e.github.io/comparisons/prometheus-alertmanager.md)

[Same data, but rules get a UI, permissions get a model, and channels come built in.](https://n9e.github.io/comparisons/prometheus-alertmanager.md)

### [vs Zabbix](https://n9e.github.io/comparisons/zabbix.md)

[No second collection stack. It reads the time-series and log stores you already fill.](https://n9e.github.io/comparisons/zabbix.md)

### [vs Grafana Alerting](https://n9e.github.io/comparisons/grafana-alerting.md)

[Grafana is the visualization standard. Nightingale spends everything on the alerting engine.](https://n9e.github.io/comparisons/grafana-alerting.md)

[Read the full comparison](https://n9e.github.io/comparisons.md)

<!-- -->

[ →](https://n9e.github.io/comparisons.md)

WHO USES NIGHTINGALE

## Thousands of companies run it in production

Automotive, electronics, gaming, cloud, logistics, retail.

![Lenovo](https://n9e.github.io/img/logos-en/lenovo.svg)

![DJI](https://n9e.github.io/img/logos-en/dji.svg)

![SHEIN](https://n9e.github.io/img/logos-en/shein.svg)

![HoYoverse](https://n9e.github.io/img/logos-en/hoyoverse.svg)

![Lotus](https://n9e.github.io/img/logos-en/lotus.svg)

![Anker Innovations](https://n9e.github.io/img/logos-en/anker.svg)

![Hisense](https://n9e.github.io/img/logos-en/hisense.svg)

![TCL](https://n9e.github.io/img/logos-en/tcl.png)

![Hikvision](https://n9e.github.io/img/logos-en/hikvision.svg)

![Insta360](https://n9e.github.io/img/logos-en/insta360.svg)

![smart](https://n9e.github.io/img/logos-en/smart.svg)

![Yoshinoya](https://n9e.github.io/img/logos-en/yoshinoya.svg)

![NIO](https://n9e.github.io/img/logos-en/nio.svg)

![Chery](https://n9e.github.io/img/logos-en/chery.svg)

![Dahua](https://n9e.github.io/img/logos-en/dahua.svg)

![Transsion](https://n9e.github.io/img/logos-en/transsion.svg)

![Pony.ai](https://n9e.github.io/img/logos-en/ponyai.png)

![Tuya](https://n9e.github.io/img/logos-en/tuya.png)

![DHgate](https://n9e.github.io/img/logos-en/dhgate.svg)

![Leapmotor](https://n9e.github.io/img/logos-en/leapmotor.svg)

![Li Auto](https://n9e.github.io/img/logos-en/liauto.svg)

![HyperGryph](https://n9e.github.io/img/logos-en/hypergryph.svg)

![Lilith Games](https://n9e.github.io/img/logos-en/lilith.png)

![Sunborn](https://n9e.github.io/img/logos-en/sunborn.png)

![Bespin Global](https://n9e.github.io/img/logos-en/bespin.svg)

![ClassIn](https://n9e.github.io/img/logos-en/classin.svg)

![Momenta](https://n9e.github.io/img/logos-en/momenta.png)

![Inspur](https://n9e.github.io/img/logos-en/inspur.svg)

![VOYAH](https://n9e.github.io/img/logos-en/voyah.svg)

![ARCFOX](https://n9e.github.io/img/logos-en/arcfox.svg)

![Transfar](https://n9e.github.io/img/logos-en/transfar.png)

## Give alerting to a specialist

Bring up Nightingale in five minutes, point it at your data, and watch the first alert land.

[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)[GitHub](https://github.com/ccfos/nightingale)

<!-- -->

[ →](https://github.com/ccfos/nightingale)

Community·[Slack #n9e](https://join.slack.com/t/n9e/shared_invite/zt-4ejx42fd0-S9aVULH4FTdH~jEAz80U7g)·[GitHub Issues](https://github.com/ccfos/nightingale/issues)
