1. [Comparisons](https://n9e.github.io/comparisons.md)
2. Prometheus + Alertmanager

# Nightingale vs Prometheus + Alertmanager

Prometheus stays. The exporters stay. The Grafana panels stay. Alertmanager is the only component this comparison actually replaces: rules move from YAML into the UI, the routing tree is flattened into notification rules, and silences become mute rules with a business-group boundary.

[Try live demo](https://play.n9e.io/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)

## The 30-second version

* **Stay on Prometheus + Alertmanager if**

  the team is comfortable with GitOps, the rule count fits in one head, and webhooks into PagerDuty or a similar on-call tool are all the delivery you need. The pair is mature and adds no components; nothing here says switch for its own sake.

* **Move to Nightingale if**

  rules must be maintained in a UI by teams who are not SREs, permissions have to follow business groups, someone has to be phoned rather than webhooked, or the data is no longer only in Prometheus: logs in Elasticsearch, business metrics in MySQL.

* **Run both if**

  you want evidence first. Register Prometheus as a data source and Nightingale evaluates the same rules while Alertmanager keeps delivering; switch one notification channel at a time and back out of any step in about a minute.

Their way

Rules live in YAML and ship through GitOps.

The Nightingale way

Rules live in the UI, scoped by business group.

## Where it shines

Prometheus remains one of the best time-series foundations available, and Alertmanager’s grouping and silencing model is genuinely clean. At moderate scale, with a GitOps-comfortable team and a rule count you can hold in your head, the pair is enough and adds no components.

## When Nightingale fits better

Nightingale earns its place when rules must be maintained by teams who are not SREs, when permissions need to follow business groups, when someone has to be phoned at 3am, or when the data is not all in Prometheus.

## Signs it is time to switch

* Rules must be maintained by teams who are not SREs
* Someone has to be phoned at 3am, not just webhooked
* The data is no longer all in Prometheus

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

## Side by side

| Capability comparison           | Nightingale v9                                                                                                          | Prometheus + Alertmanager                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Data sources                    | Built in<!-- -->: Metrics, logs and SQL stores, 10+ types                                                               | Not available<!-- -->: Evaluates Prometheus data only                                                                                  |
| Where rules live                | Built in<!-- -->: In the UI, owned by a business group; a whole rules.yml can be imported                               | Not available<!-- -->: YAML files and a reload; no UI editing                                                                          |
| Rule language                   | Built in<!-- -->: Same PromQL, threshold inside the expression                                                          | Built in<!-- -->: PromQL                                                                                                               |
| Notification grouping           | Not available<!-- -->: One event per notification; no label-based batching into one message                             | Built in<!-- -->: group\_by / group\_wait / group\_interval                                                                            |
| Cross-rule inhibition           | Partial or via add-on<!-- -->: Built in across severity tiers of one rule; across rules it is an event pipeline rewrite | Built in<!-- -->: inhibit\_rules                                                                                                       |
| Silences / mutes                | Built in<!-- -->: Fixed and recurring windows, mute-notifications-only, scoped to a business group                      | Partial or via add-on<!-- -->: One-off silences; recurring windows via mute\_time\_intervals on routes                                 |
| Notification channels           | Built in<!-- -->: 20 built in, including phone, SMS, DingTalk, Feishu and WeCom                                         | Partial or via add-on<!-- -->: Email, Slack, PagerDuty, Telegram, WeChat, webhooks; phone, SMS, DingTalk and Feishu need third parties |
| Subscriptions and collaboration | Built in<!-- -->: Subscription rules, timeout escalation, event pipeline processors                                     | Not available<!-- -->: None                                                                                                            |
| Permissions                     | Built in<!-- -->: Users, teams, business-group RBAC                                                                     | Not available<!-- -->: No authentication or permission model                                                                           |
| Dashboards                      | Partial or via add-on<!-- -->: Built in, can embed Grafana panels by URL                                                | Not available<!-- -->: Expression browser only; Grafana is the usual companion                                                         |
| Self-healing                    | Built in<!-- -->: Script execution via ibex                                                                             | Not available<!-- -->: None                                                                                                            |
| AI / MCP                        | Built in<!-- -->: Built-in assistant and 74 MCP tools                                                                   | Not available<!-- -->: None                                                                                                            |
| License                         | Built in<!-- -->: Apache-2.0                                                                                            | Built in<!-- -->: Apache-2.0, CNCF graduated                                                                                           |

* Built in
* Partial or via add-on
* Not available

Based on the publicly documented capabilities of each project’s open-source edition as of August 2026. We try to state what the other tools are good at — advice you cannot trust is worth nothing to a community.

## How the objects map

Take a rules.yml and an alertmanager.yml apart, and here is where each piece lands. The entry-by-entry mapping, the method for flattening the routing tree and the four asymmetries are in the migration guide.

| Prometheus / Alertmanager                 | Nightingale                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Alerting rules in rules.yml               | Alert rules; paste the whole file into “Import Prometheus alert rules”                     |
| Recording rules                           | Untouched, Prometheus keeps computing them                                                 |
| receivers\[]                              | Notification media plus a notification config inside a notification rule                   |
| The route tree                            | Flattened: every root-to-leaf path becomes one notification config with its matchers ANDed |
| group\_by / group\_wait / group\_interval | No equivalent; one event per notification                                                  |
| inhibit\_rules                            | No declarative equivalent; rewrite as a drop processor in an event pipeline                |
| Silence                                   | Mute rule, which must belong to a business group                                           |
| Alertmanager cluster                      | Several alert engine instances shard the rules; no gossip needed                           |

Two traps: a notification config with no severity ticked matches nothing, not everything; and an event that lacks a label never matches, even for != and !\~, whereas Alertmanager treats a missing label as an empty string.

[From Prometheus + Alertmanager<!-- --> →](https://n9e.github.io/docs/migration/from-alertmanager.md)[Coexistence and rollback plan<!-- --> →](https://n9e.github.io/docs/migration/coexistence.md)

## Questions about this comparison

Do I have to replace Prometheus?

No. Prometheus keeps scraping and storing; Nightingale registers it as a data source and runs instant queries against it on a schedule, so nothing has to move. Thanos, Mimir and VictoriaMetrics connect the same way.

Can alertmanager.yml be converted automatically?

The alert rules can: paste rules.yml into Rules → Import → Import Prometheus alert rules. Routes, receivers and silences are rebuilt entry by entry following the migration guide, because Nightingale uses flat notification rules rather than a routing tree.

Can Nightingale receive webhooks from Alertmanager?

No. Nightingale has no inbound alert endpoint, only metric write endpoints, so Alertmanager cannot sit in front of it as a forwarder during a transition. Rules are rebuilt inside Nightingale.

What happens to Alertmanager grouping?

Nightingale sends one event per notification and does not batch alerts into one message by label. Noise is cut at the rule level instead (one rule covers every series the query returns), plus mute rules and subscriptions. If your on-call flow depends on grouped messages, accept that difference before you switch.

Do I have to stop Alertmanager to switch?

Only as the final step. Everything before it runs with Prometheus and Alertmanager untouched: import rules disabled, enable one business group as a canary, compare in parallel, then remove the alerting rules from rule\_files and stop Alertmanager last.

## Other comparisons

* [Nightingale vs Zabbix](https://n9e.github.io/comparisons/zabbix.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons/zabbix.md)
* [Nightingale vs Grafana Alerting](https://n9e.github.io/comparisons/grafana-alerting.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons/grafana-alerting.md)
* [Comparisons](https://n9e.github.io/comparisons.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons.md)

## Not sure? Run both.

Nightingale reads the storage you already have. Installing it changes nothing about the alerting you run today.

[Try live demo](https://play.n9e.io/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)
