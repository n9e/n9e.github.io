1. [Comparisons](https://n9e.github.io/comparisons.md)
2. Zabbix

# Nightingale vs Zabbix

Zabbix is built around hosts and items: it collects, stores and alerts on its own. Nightingale is built around queries: it evaluates on the Prometheus, VictoriaMetrics or Elasticsearch you already run, and Categraf fills only the gaps. This is not one product beating another; two architectures fit two kinds of infrastructure.

[Try live demo](https://play.n9e.io/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)

## The 30-second version

* **Stay on Zabbix if**

  the estate is mostly network gear, SNMP and IPMI, you lean on auto-discovery and LLD, and the team has years of Zabbix experience. Two decades of work in that space has no complete open-source substitute.

* **Move to Nightingale if**

  metrics already live in Prometheus or VictoriaMetrics, logs in Elasticsearch or Loki, Kubernetes and cloud services outnumber racks, or you keep both a Zabbix agent and exporters running just to get one alert.

* **Run both if**

  you want to migrate in batches. Categraf and the Zabbix agent coexist on the same host; let Nightingale deliver to one dedicated channel first, compare what fired each day, and never stop Zabbix.

Their way

Collect everything with its own agents, then alert on that.

The Nightingale way

Alert on the stores you already fill; collect only where nothing does.

## Where it shines

Two decades of work show in traditional IT monitoring: network gear, SNMP, agent-based collection and auto-discovery are its home ground, and the hiring pool knows it well.

## When Nightingale fits better

If your telemetry already lives in Prometheus, VictoriaMetrics or ElasticSearch, Nightingale reads it directly instead of asking you to pour it into a second collection stack.

## Signs it is time to switch

* Telemetry already lives in Prometheus, VictoriaMetrics or ElasticSearch
* Kubernetes and cloud services outnumber network gear
* You maintain two collection stacks to get one alert

Storage you already run

![](/img/logos/prometheus.png)Prometheus![](/img/logos/victoriametrics.png)VictoriaMetrics![](/img/logos/elasticsearch.png)ElasticSearch![](/img/logos/ck.png)ClickHouse

![](/img/logo-mark.webp)**Nightingale**Reads in place, moves nothing

20 notification channels

Phone / SMSEmail![](/img/logos/dingtalk.png)DingTalk![](/img/logos/slack.png)Slack+16

Categraf fills only the gaps

* You

  Why did this host go offline?

* Nightingale AI

  The agent stopped reporting 3 minutes ago, but the host answers ping and its neighbours are healthy. That points to the Categraf process exiting, not the host going down.

## Side by side

| Capability comparison | Nightingale v9                                                                                                                  | Zabbix                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Collection model      | Partial or via add-on<!-- -->: Categraf or your existing exporters, pushed over Remote Write                                    | Built in<!-- -->: Zabbix agent / agent 2, SNMP, IPMI, JMX, auto-discovery and LLD                               |
| Storage               | Built in<!-- -->: None of its own: reads Prometheus, VictoriaMetrics, Elasticsearch, ClickHouse; embedded TSDB for small setups | Built in<!-- -->: Its own server with MySQL / PostgreSQL / TimescaleDB                                          |
| What a rule covers    | Built in<!-- -->: One rule covers every series the query returns                                                                | Partial or via add-on<!-- -->: Triggers are generated per host; a template on 1,000 hosts is 1,000 trigger sets |
| Rule language         | Built in<!-- -->: PromQL / SQL / LogQL, depending on the source                                                                 | Built in<!-- -->: Trigger expressions and function library                                                      |
| Severity levels       | Partial or via add-on<!-- -->: Three: S1 / S2 / S3                                                                              | Built in<!-- -->: Six                                                                                           |
| Trigger dependencies  | Partial or via add-on<!-- -->: No declarative dependencies; rewrite with an event pipeline                                      | Built in<!-- -->: Trigger dependencies and event correlation                                                    |
| Maintenance / mutes   | Built in<!-- -->: Fixed and recurring mutes, mute-notifications-only keeps the event                                            | Built in<!-- -->: Maintenance periods                                                                           |
| Notification channels | Built in<!-- -->: 20 built in; phone, SMS, DingTalk, Feishu and WeCom work out of the box                                       | Partial or via add-on<!-- -->: Email, script and webhook media types; Chinese IM mostly via community templates |
| Escalation            | Partial or via add-on<!-- -->: Subscription rules escalate after a duration                                                     | Built in<!-- -->: Multi-step escalations                                                                        |
| Permissions           | Built in<!-- -->: Users, teams, business-group RBAC; the business group is the boundary                                         | Built in<!-- -->: User groups, roles, host-group permissions                                                    |
| Kubernetes            | Built in<!-- -->: Reads Prometheus data as is; Categraf ships Kubernetes plugins                                                | Partial or via add-on<!-- -->: Official Helm chart and templates, needs its own agents                          |
| Network gear / SNMP   | Partial or via add-on<!-- -->: Categraf has an SNMP plugin, no auto-discovery                                                   | Built in<!-- -->: Home ground: SNMP, discovery, network templates                                               |
| Log alerting          | Built in<!-- -->: Elasticsearch, OpenSearch, Loki, VictoriaLogs, ClickHouse                                                     | Partial or via add-on<!-- -->: Log items with regex, not queries against a log store                            |
| AI / MCP              | Built in<!-- -->: Built-in assistant and 74 MCP tools                                                                           | Not available<!-- -->: None                                                                                     |
| License               | Built in<!-- -->: Apache-2.0                                                                                                    | Partial or via add-on<!-- -->: AGPL-3.0 since 7.0                                                               |

* Built in
* Partial or via add-on
* Not available

Based on the publicly documented capabilities of each project’s open-source edition as of August 2026. We try to state what the other tools are good at — advice you cannot trust is worth nothing to a community.

## How the objects map

What each kind of Zabbix object is called in Nightingale, and which have no equivalent at all. The full table and the rebuild order that keeps Zabbix running throughout are in the migration guide.

| Zabbix              | Nightingale                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| Zabbix server       | Nightingale plus a time-series store (Nightingale stores nothing)          |
| Zabbix agent        | Categraf, or exporters you already run; both coexist on one host           |
| Host / host group   | Target (ident) / business group, which is also the permission boundary     |
| Template            | A component in the template center, 83 built in; import is a one-time copy |
| Item                | No equivalent; what is collected is decided in the collector config        |
| Trigger             | Alert rule; one covers every object the query returns                      |
| Low-level discovery | No equivalent; as many series as the query returns, that many objects      |
| Action + media type | Notification rule + notification media + message template                  |
| Maintenance         | Mute rule                                                                  |

Nightingale has no importer for Zabbix templates or triggers and cannot read its XML or YAML. Coming from Zabbix is a rebuild, not a move; the good news is that it is smaller than it looks: built-in components replace most templates, and one rule replaces a whole set of triggers.

[From Zabbix<!-- --> →](https://n9e.github.io/docs/migration/from-zabbix.md)[Coexistence and rollback plan<!-- --> →](https://n9e.github.io/docs/migration/coexistence.md)

## Questions about this comparison

Can Nightingale read Zabbix data directly?

No. Nightingale data sources are query backends such as Prometheus, VictoriaMetrics and Elasticsearch; the Zabbix history and trends tables are not among them. Leave the history in Zabbix as a read-only archive; nothing needs to be moved.

Can Zabbix templates be imported?

Not mechanically. The template center ships 83 components covering operating systems, databases, middleware and Kubernetes, so most standard Zabbix templates have a counterpart; custom triggers are rewritten one by one using the merge method in the guide.

Can Nightingale monitor switches and routers?

It can collect them, but it is not home ground. Categraf has an SNMP plugin that polls OIDs and Nightingale alerts on the result, but there is no network auto-discovery or mature device template library like Zabbix has. For device-heavy estates, keep Zabbix on the devices and put Nightingale on cloud and applications.

How do the six Zabbix severities map?

Down to three: Disaster and High become S1, Average and Warning become S2, Information and Not classified become S3. Information is lost in that step, so compare severities against this mapping during the parallel run.

Does Zabbix have to stop during the migration?

Never. Install Categraf, settle the storage, import built-in templates, translate the remaining triggers, build notifications, move maintenance windows, compare in parallel, then stop the Zabbix actions first and the agents a week later. Rolling back is disabling the Nightingale rules in bulk.

## Other comparisons

* [Nightingale vs Prometheus + Alertmanager](https://n9e.github.io/comparisons/prometheus-alertmanager.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons/prometheus-alertmanager.md)
* [Nightingale vs Grafana Alerting](https://n9e.github.io/comparisons/grafana-alerting.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons/grafana-alerting.md)
* [Comparisons](https://n9e.github.io/comparisons.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons.md)

## Not sure? Run both.

Nightingale reads the storage you already have. Installing it changes nothing about the alerting you run today.

[Try live demo](https://play.n9e.io/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)
