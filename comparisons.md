Nightingale vs[Prometheus + Alertmanager](#prometheus)[Zabbix](#zabbix)[Grafana Alerting](#grafana)

# Keep your storage.<br /><!-- -->Change who owns alerting.

Prometheus, Zabbix and Grafana each have their ground. Nightingale argues for one thing only: the alerting layer should belong to a tool built for it.

[Try live demo](http://43.106.19.165/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)

## At a glance

| Capability comparison           | Nightingale v9                                | Prometheus + Alertmanager                               | Zabbix                                                  | Grafana Alerting                                       |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Alerting across data sources    | Built in<!-- -->: Metrics and logs, 10+ types | Not available<!-- -->: Prometheus data only             | Not available<!-- -->: Its own collection stack         | Partial or via add-on<!-- -->: Per data source plugin  |
| Notification channels           | Built in<!-- -->: 20 built in, phone and SMS  | Partial or via add-on<!-- -->: Webhooks, build your own | Partial or via add-on<!-- -->: Media types plus scripts | Partial or via add-on<!-- -->: Some built in           |
| Mute, subscribe, event pipeline | Built in<!-- -->: Native                      | Partial or via add-on<!-- -->: Basic silences           | Partial or via add-on<!-- -->: Maintenance windows      | Partial or via add-on<!-- -->: Basic silences          |
| Rules and permissions in the UI | Built in<!-- -->: Business-group RBAC         | Not available<!-- -->: YAML and reload                  | Built in<!-- -->: Yes                                   | Built in<!-- -->: Yes                                  |
| Built-in AI and MCP server      | Built in<!-- -->: 74 tools, in-process        | Not available<!-- -->: None                             | Not available<!-- -->: None                             | Partial or via add-on<!-- -->: Assistant is Cloud-only |

* Built in
* Partial or via add-on
* Not available

Based on the publicly documented capabilities of each project’s open-source edition as of August 2026. We try to state what the other tools are good at — advice you cannot trust is worth nothing to a community.

* **13,331**GitHub stars
* **10+**&#x44;ata source types
* **20**Notification channels
* **74**MCP tools

## AI is part of the process, not an add-on

It reads your alerts, rules and metrics, so answers come from your data rather than the model’s memory. Before it changes anything that already exists, it shows you the diff.

### 01Investigate

It pulls the event, the rule, runs the rule’s query over the window, checks neighbouring hosts and muting rules, and hands back an evidence chain. The call is still yours.

### 02Cut the noise

Which rules are the noisiest and which have never fired, in one question. For the ones that recur on a schedule, ask whether they are candidates for self-healing.

### 03Change configuration

Changes to existing objects take two turns: the tool returns a confirmation card first and writes only after you confirm. A proposal expires in 30 minutes, applies once, and is refused if someone edited the object meanwhile. There are no delete tools.

Nightingale AI · event #48213

Event #48213 · MySQL replica lag > 30s · mysql-prod

Analyze the root cause of this alert event

Read the event and its ruleget\_alert\_event · get\_alert\_rule

Run the rule’s query over the firing windowquery\_range · 14:00–14:20

Check other alerts on the host and muting rulesops-troubleshooting

✓Lag has stayed above 30s since 14:02. On the same host disk\_io\_util reached 96% at 14:01, and two disk alerts fired in the same window. No muting rule was in play. Three pieces of evidence are listed; whether it is the root cause is your call.

* 74 MCP tools
* 13 toolsets
* No delete tools
* Permissions follow the user
* OpenAI-compatible, Anthropic or self-hosted models
* Claude Code and Cursor connect directly

The others at this layer**Prometheus + Alertmanager**no built-in AI**Zabbix**no built-in AI**Grafana**Assistant is Cloud-only; OSS gets a separate MCP server and an LLM plugin

1. [01Prometheus + Alertmanager](#prometheus)
2. [02Zabbix](#zabbix)
3. [03Grafana Alerting](#grafana)

01

## Prometheus + Alertmanager

Their way

Rules live in YAML and ship through GitOps.

The Nightingale way

Rules live in the UI, scoped by business group.

### Where it shines

Prometheus remains one of the best time-series foundations available, and Alertmanager’s grouping and silencing model is genuinely clean. At moderate scale, with a GitOps-comfortable team and a rule count you can hold in your head, the pair is enough and adds no components.

### When Nightingale fits better

Nightingale earns its place when rules must be maintained by teams who are not SREs, when permissions need to follow business groups, when someone has to be phoned at 3am, or when the data is not all in Prometheus.

### Signs it is time to switch

* Rules must be maintained by teams who are not SREs
* Someone has to be phoned at 3am, not just webhooked
* The data is no longer all in Prometheus

Migration guide[From Prometheus + Alertmanager<!-- --> →](https://n9e.github.io/docs/migration/from-alertmanager.md)

rules.yml + alertmanager.yml

```
- alert: MysqlReplicaLag  expr: mysql_slave_lag_seconds > 30  for: 5m  labels: { team: dba }route:  receiver: dba-webhook  group_by: [alertname]
```

Nightingale · alert rule

* Name

  MySQL replica lag

* Condition

  mysql\_slave\_lag\_seconds > 30, for 5m

* Business group

  DBA

* Notify

  Phone, SMS, DingTalk

* Who can edit

  DBA group

One rule, two ways to write it

* You

  Create in one sentence: page the DBA group by phone when mysql-prod replica lag stays above 30s for 5 minutes

* Nightingale AI

  PromQL and threshold drafted. I will not guess the business group; pick one from the list and I will create the rule.

02

## Zabbix

Their way

Collect everything with its own agents, then alert on that.

The Nightingale way

Alert on the stores you already fill; collect only where nothing does.

### Where it shines

Two decades of work show in traditional IT monitoring: network gear, SNMP, agent-based collection and auto-discovery are its home ground, and the hiring pool knows it well.

### When Nightingale fits better

If your telemetry already lives in Prometheus, VictoriaMetrics or ElasticSearch, Nightingale reads it directly instead of asking you to pour it into a second collection stack.

### Signs it is time to switch

* Telemetry already lives in Prometheus, VictoriaMetrics or ElasticSearch
* Kubernetes and cloud services outnumber network gear
* You maintain two collection stacks to get one alert

Migration guide[From Zabbix<!-- --> →](https://n9e.github.io/docs/migration/from-zabbix.md)

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

03

## Grafana Alerting

Their way

Alerting as a module inside the visualization platform.

The Nightingale way

Alerting as the whole product; chart wherever you like.

### Where it shines

Grafana is the visualization standard and its dashboard ecosystem has no real substitute. If alert volume is modest and Grafana is already in place, its built-in alerting is one system fewer to run.

### When Nightingale fits better

Nightingale puts everything into the alerting side: event pipelines, subscriptions, self-healing. The two are not exclusive — plenty of users chart in Grafana and alert in Nightingale.

### Signs it is time to switch

* Alert volume has outgrown a panel-level rule model
* You need event pipelines, subscriptions or self-healing
* On-call people need phone and SMS, not only contact points

Migration guide[From Grafana Alerting<!-- --> →](https://n9e.github.io/docs/migration/from-grafana-alerting.md)

Grafana · MySQL overview

A Grafana panel embedded by URL in a Nightingale dashboard

S1MySQL replica lag > 30s

`ident=mysql-prod``busigroup=DBA`

Delivered · phone and DingTalk

Chart in Grafana, alert in Nightingale

* You

  Analyze this dashboard

* Nightingale AI

  Of 40 panels, 3 query metrics that no longer exist, and 2 show an abnormal trend in the last hour: connections and slow\_queries.

## Nothing has to be switched off

Nightingale reads the storage you already run, so the switch is a parallel run, not a cut-over.

1. 1

   ### Point it at your storage

   Register Prometheus, VictoriaMetrics or ElasticSearch as a data source. Nothing in the collection path changes.

2. 2

   ### Move the rules across

   The migration guides map every entry of an alertmanager.yml or a Grafana alert rule onto a Nightingale object, and say plainly which ones have no equivalent.

3. 3

   ### Run both, cut over by channel

   Compare what fires each day, switch one notification channel at a time, and back out of any stage in about a minute.

[Coexistence and rollback plan<!-- --> →](https://n9e.github.io/docs/migration/coexistence.md)

## Questions people ask before switching

Can I keep Grafana?

Yes, and it is the most common setup: chart in Grafana, alert in Nightingale. A Nightingale dashboard can also embed a Grafana dashboard by URL.

Do I have to replace Prometheus?

No. Nightingale does not store time series. Prometheus keeps scraping and storing; Nightingale takes over rules, noise reduction and routing on top of it.

Can Alertmanager rules be migrated?

Rules, routes, silences and receivers each map onto a Nightingale object. The migration guide takes an alertmanager.yml apart entry by entry and lists the few that have no equivalent.

Can Nightingale read Zabbix data?

No. Moving from Zabbix is a rebuild: hosts become targets, templates become integrations, triggers become rules, and Categraf takes over collection. Zabbix never has to stop while you do it.

When should I not switch?

At moderate scale, with a GitOps-comfortable team and a rule count you can hold in your head, Prometheus + Alertmanager is enough. For network gear and SNMP-first estates, Zabbix is still home ground.

## Not sure? Run both.

Nightingale reads the storage you already have. Installing it changes nothing about the alerting you run today.

[Try live demo](http://43.106.19.165/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)
