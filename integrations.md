INTEGRATIONS

# Plugs into what you already run

Data sources, collectors, notification channels and templates — Nightingale connects to what exists rather than replacing it. The full list is below, and every entry links to how to wire it up.

83Built-in templates

13Data source types

20Notification channels

Search integrations: nginx, k8s, aws, cert…`/`

<!-- -->

to search

[Data sources](#sources)[Notifications](#channels)[Templates](#templates)[Collectors](#collectors)

DATA SOURCES

## Data sources

Nightingale ships no storage of its own; it queries what you already run. Metrics stores speak PromQL, log stores use their own query syntax, and SQL stores take plain SQL — alert rules and dashboards work on all three.

Metrics

* [![Prometheus logo](https://n9e.github.io/img/logos/prometheus.png)Prometheus](https://n9e.github.io/docs/data/prometheus.md)
* [![VictoriaMetrics logo](https://n9e.github.io/img/logos/victoriametrics.png)VictoriaMetrics](https://n9e.github.io/docs/data/victoriametrics.md)
* [![Embedded TSDB logo](https://n9e.github.io/img/logo-mark.webp)Embedded TSDB](https://n9e.github.io/docs/data/embedded-tsdb.md)

Logs

* [![ElasticSearch logo](https://n9e.github.io/img/logos/elasticsearch.png)ElasticSearch](https://n9e.github.io/docs/data/elasticsearch.md)
* [![OpenSearch logo](https://n9e.github.io/img/logos/opensearch.png)OpenSearch](https://n9e.github.io/docs/data/elasticsearch.md)
* [![Loki logo](https://n9e.github.io/img/logos/loki.png)Loki](https://n9e.github.io/docs/data/loki-victorialogs.md)
* [![VictoriaLogs logo](https://n9e.github.io/img/logos/victorialogs.png)VictoriaLogs](https://n9e.github.io/docs/data/loki-victorialogs.md)

SQL

* [![ClickHouse logo](https://n9e.github.io/img/logos/ck.png)ClickHouse](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)
* [![MySQL logo](https://n9e.github.io/img/logos/mysql.png)MySQL](https://n9e.github.io/docs/data/sql-databases.md)
* [![PostgreSQL logo](https://n9e.github.io/img/logos/pgsql.png)PostgreSQL](https://n9e.github.io/docs/data/sql-databases.md)
* [![TDengine logo](https://n9e.github.io/img/logos/tdengine.png)TDengine](https://n9e.github.io/docs/data/sql-databases.md)
* [![Doris logo](https://n9e.github.io/img/logos/doris.png)Doris](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)
* [![IoTDB logo](https://n9e.github.io/img/logos/iotdb.png)IoTDB](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)

NOTIFICATIONS

## Notification channels

DingTalk, WeCom, Feishu, email and phone/SMS work out of the box. Slack, Telegram, Discord, PagerDuty and Jira come with built-in message templates — create the media type and send. Anything else goes through a webhook with a custom body.

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

[Notification docs<!-- --> →](https://n9e.github.io/docs/notifications/overview.md)

BUILT-IN TEMPLATES

## Built-in templates

Each template bundles Categraf collector config, dashboards and a set of alert rules, importable in one click from the integration center. The numbers on each card are counted from the repo at build time — they say what the template actually ships, not what we hope it does.

All83Hosts & hardware14Databases & storage16Message queues8Web & middleware15Containers & cloud native8Cloud providers & CDN9Network & probes9DevOps & others4

* [![Linux logo](https://n9e.github.io/img/integrations/Linux.png)Linux5 dashboards·4 rule sets·collector config·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/Linux/markdown/README.en_US.md)
* [![Kubernetes logo](https://n9e.github.io/img/integrations/Kubernetes.png)Kubernetes17 dashboards·9 rule sets·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/Kubernetes/markdown/README.en_US.md)
* [![MySQL logo](https://n9e.github.io/img/integrations/MySQL.png)MySQL7 dashboards·2 rule sets·collector config·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/MySQL/markdown/README.en_US.md)
* [![Redis logo](https://n9e.github.io/img/integrations/Redis.png)Redis3 dashboards·2 rule sets·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/Redis/markdown/README.en_US.md)
* [![Windows logo](https://n9e.github.io/img/integrations/Windows.png)Windows6 dashboards·2 rule sets](https://github.com/ccfos/nightingale/blob/main/integrations/Windows/markdown/README.en_US.md)
* [![Docker logo](https://n9e.github.io/img/integrations/Docker.png)Docker1 dashboard·1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/Docker/markdown/README.en_US.md)
* [![PostgreSQL logo](https://n9e.github.io/img/integrations/PostgreSQL.png)PostgreSQL1 dashboard·1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/PostgreSQL/markdown/README.en_US.md)
* [![Nginx logo](https://n9e.github.io/img/integrations/Nginx.png)Nginx3 dashboards·2 rule sets·collector config·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/Nginx/markdown/README.en_US.md)
* [![Elasticsearch logo](https://n9e.github.io/img/integrations/Elasticsearch.png)Elasticsearch5 dashboards·2 rule sets·collector config·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/Elasticsearch/markdown/README.en_US.md)
* [![Kafka logo](https://n9e.github.io/img/integrations/Kafka.png)Kafka2 dashboards·2 rule sets·collector config·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/Kafka/markdown/README.en_US.md)
* [![MongoDB logo](https://n9e.github.io/img/integrations/MongoDB.png)MongoDB1 dashboard·1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/MongoDB/markdown/README.en_US.md)
* [![Java logo](https://n9e.github.io/img/integrations/Java.png)Java3 dashboards](https://github.com/ccfos/nightingale/blob/main/integrations/Java/markdown/README.en_US.md)
* [![RabbitMQ logo](https://n9e.github.io/img/integrations/RabbitMQ.png)RabbitMQ4 dashboards·1 rule set·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/RabbitMQ/markdown/README.en_US.md)
* [![SNMP logo](https://n9e.github.io/img/integrations/SNMP.png)SNMP9 dashboards·5 rule sets·collector config·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/SNMP/markdown/README.en_US.md)
* [![Ping logo](https://n9e.github.io/img/integrations/Ping.png)Ping2 dashboards·1 rule set·collector config·metric docs](https://github.com/ccfos/nightingale/blob/main/integrations/Ping/markdown/README.en_US.md)
* [![Alibaba Cloud logo](https://n9e.github.io/img/integrations/AliYun.png)Alibaba Cloud44 dashboards·12 rule sets·collector config](https://github.com/ccfos/nightingale/blob/main/integrations/AliYun/markdown/README.en_US.md)

Show all 83 templates

<!-- -->

↓

[Browse every template on GitHub<!-- --> →](https://github.com/ccfos/nightingale/tree/main/integrations)2026-10-13

COLLECTORS

## How data gets in

Nightingale does not collect data itself. The templates above are written for Categraf, but any collector that speaks Prometheus Remote Write can feed it.

### CategrafRecommended

One agent for operating systems, middleware, databases and cloud providers. Every built-in template ships its collector config for Categraf.

[Categraf docs](https://n9e.github.io/docs/data/categraf.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/categraf.md)

### Telegraf / Datadog Agent

Keep what is already running; point its output at the Nightingale Remote Write endpoint.

[Collector setup](https://n9e.github.io/docs/data/integrations/collector-config.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/integrations/collector-config.md)

### Exporters

node\_exporter, mysqld\_exporter and the rest of the Prometheus ecosystem, scraped by Categraf or Prometheus and written in.

[Collector config](https://n9e.github.io/docs/data/integrations/collector-config.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/integrations/collector-config.md)

### Remote Write directly

Your own programs or the OpenTelemetry Collector push straight to /prometheus/v1/write.

[Verify data arrives](https://n9e.github.io/docs/data/integrations/verify.md)

<!-- -->

[ →](https://n9e.github.io/docs/data/integrations/verify.md)

## Not seeing what you need?

The template list comes straight from the open-source repo, where a template is one directory: icon, collector config, dashboards, alert rules. Ask for what is missing in an issue, or write one to the spec and send a PR.

[Request in an issue](https://github.com/ccfos/nightingale/issues/new/choose)[Template spec](https://n9e.github.io/docs/reference/integration-schema.md)
