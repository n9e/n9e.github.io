1. [Comparisons](https://n9e.github.io/comparisons.md)
2. Grafana Alerting

# Nightingale vs Grafana Alerting

The short answer: Grafana is a visualization platform that ships alerting as one module; Nightingale (n9e) is an open-source alerting engine that makes alerting the whole product. Nightingale does not try to replace Grafana dashboards, so the comparison is about the alerting layer, and for many teams the answer is both: chart in Grafana, alert in Nightingale.

[Try live demo](https://play.n9e.io/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)

## The 30-second version

* **Stay on Grafana Alerting if**

  alert volume is modest, rules follow panels, Slack or PagerDuty contact points are enough, and the team already lives in Grafana. One system fewer is one system fewer to run.

* **Move to Nightingale if**

  the rule count has outgrown panel-level management, you need event pipelines, subscriptions or self-healing, on-call people need phone and SMS, or permissions should follow business groups rather than folders.

* **Use both if**

  the dashboard estate is large. Grafana data sources import into Nightingale in one step, dashboards stay exactly where they are, and a Nightingale dashboard can embed Grafana panels by URL.

Their way

Alerting as a module inside the visualization platform.

The Nightingale way

Alerting as the whole product; chart wherever you like.

## Where it shines

Grafana is the visualization standard and its dashboard ecosystem has no real substitute. If alert volume is modest and Grafana is already in place, its built-in alerting is one system fewer to run.

## When Nightingale fits better

Nightingale puts everything into the alerting side: event pipelines, subscriptions, self-healing. The two are not exclusive — plenty of users chart in Grafana and alert in Nightingale.

## Signs it is time to switch

* Alert volume has outgrown a panel-level rule model
* You need event pipelines, subscriptions or self-healing
* On-call people need phone and SMS, not only contact points

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

## Side by side

| Capability comparison                          | Nightingale v9                                                                                                      | Grafana Alerting                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Data sources                                   | Built in<!-- -->: 10+ types: metrics, logs, SQL                                                                     | Built in<!-- -->: Any Grafana data source with alerting support                                                                    |
| Rule expressions                               | Built in<!-- -->: Prometheus rules put the threshold in PromQL; log and SQL rules have a separate trigger condition | Built in<!-- -->: Query + Reduce + Threshold expression chain                                                                      |
| Rule ownership and permissions                 | Built in<!-- -->: Business group, which is also the permission boundary                                             | Partial or via add-on<!-- -->: Folders and org roles; fine-grained RBAC is Enterprise                                              |
| No data / error states                         | Partial or via add-on<!-- -->: Log and SQL rules have a no-data switch; Prometheus rules need a separate rule       | Built in<!-- -->: Configurable NoData / Error states, keep last state                                                              |
| Notification routing                           | Partial or via add-on<!-- -->: Flat notification rules, each matching and sending on its own                        | Built in<!-- -->: Notification policy tree with group\_by and continue                                                             |
| Notification channels                          | Built in<!-- -->: 20 built in, including phone and SMS                                                              | Partial or via add-on<!-- -->: Contact points: Slack, Teams, PagerDuty, DingDing, WeCom and more; phone and SMS need third parties |
| On-call                                        | Partial or via add-on<!-- -->: Notification rules plus subscription timeouts                                        | Not available<!-- -->: OnCall OSS was archived in March 2026; on-call lives in Grafana Cloud                                       |
| Silences                                       | Built in<!-- -->: Fixed and recurring mutes, mute-notifications-only                                                | Built in<!-- -->: Silences and mute timings                                                                                        |
| Cross-rule inhibition                          | Partial or via add-on<!-- -->: Event pipeline rewrite                                                               | Not available<!-- -->: Not supported for Grafana-managed alerts                                                                    |
| Event pipelines / subscriptions / self-healing | Built in<!-- -->: Built in                                                                                          | Not available<!-- -->: None                                                                                                        |
| Dashboards                                     | Partial or via add-on<!-- -->: Built in, can embed Grafana panels                                                   | Built in<!-- -->: The standard                                                                                                     |
| AI                                             | Built in<!-- -->: Built-in assistant and 74 MCP tools                                                               | Partial or via add-on<!-- -->: Assistant is Cloud-only; OSS relies on the LLM plugin and a separate MCP server                     |
| Rule versioning and provisioning               | Partial or via add-on<!-- -->: Export JSON into version control                                                     | Built in<!-- -->: Version history; file, API and Terraform provisioning                                                            |
| License                                        | Built in<!-- -->: Apache-2.0                                                                                        | Partial or via add-on<!-- -->: AGPL-3.0                                                                                            |

* Built in
* Partial or via add-on
* Not available

Based on the publicly documented capabilities of each project’s open-source edition as of August 2026. We try to state what the other tools are good at — advice you cannot trust is worth nothing to a community.

## How the objects map

Where each part of Grafana unified alerting lands once it is taken apart. Dashboards, panels and variables are not touched.

| Grafana                     | Nightingale                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| Data sources                | One-step import (Integrations → Data sources → Import from Grafana); secrets must be re-entered |
| Grafana-managed alert rules | Rewritten: Reduce + Threshold folded into PromQL                                                |
| Data-source-managed rules   | These are Prometheus ruler rules; follow the Alertmanager path                                  |
| Notification policy tree    | Flattened into notification rules                                                               |
| Contact point               | Notification media + notification rule                                                          |
| Silence / mute timing       | Fixed-time mute / recurring mute or a time window on the notification config                    |
| NoData / Error state        | No-data switch on log and SQL rules; a separate up == 0 rule for Prometheus                     |
| runbook\_url                | The runbook link field on the rule                                                              |

When you cut over, pause the Grafana rules rather than delete them; rolling back is then one click.

[From Grafana Alerting<!-- --> →](https://n9e.github.io/docs/migration/from-grafana-alerting.md)[Coexistence and rollback plan<!-- --> →](https://n9e.github.io/docs/migration/coexistence.md)

## Questions about this comparison

Can I keep using Grafana for charts?

Yes, and it is the most common setup. Nightingale reads the same Prometheus or Loki, so Grafana panels are unaffected, and a Nightingale dashboard can embed Grafana panels by URL.

Can Grafana alert rules be imported automatically?

Rules cannot; data sources can. “Import from Grafana” pulls the data sources into a preview table, you tick the ones you want and re-enter secrets. Alert rules are rewritten following the guide, because the expression-chain and PromQL models differ.

What happens to Grafana’s No data state?

Nightingale has no such state machine. In Prometheus rules a series disappearing counts as recovery; to alert on missing data, write a separate up == 0 rule. Log and SQL rules have a no-data switch with its own severity and auto-recovery timeout.

Does Nightingale have phone and SMS notifications?

Yes, phone and SMS are built-in media types in the open-source edition. Grafana OSS contact points have no phone or SMS; Grafana OnCall OSS was archived in March 2026 and on-call capabilities live in Grafana Cloud.

What about group\_by in notification policies?

Nightingale sends one event per notification and does no label aggregation. If the on-call flow depends on seeing a group of alerts in one message, accept that difference before switching; noise is cut by rule merging, mute rules and subscriptions instead.

## Other comparisons

* [Nightingale vs Prometheus + Alertmanager](https://n9e.github.io/comparisons/prometheus-alertmanager.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons/prometheus-alertmanager.md)
* [Nightingale vs Zabbix](https://n9e.github.io/comparisons/zabbix.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons/zabbix.md)
* [Comparisons](https://n9e.github.io/comparisons.md)
  <!-- -->
  [ →](https://n9e.github.io/comparisons.md)

## Not sure? Run both.

Nightingale reads the storage you already have. Installing it changes nothing about the alerting you run today.

[Try live demo](https://play.n9e.io/api/n9e/auth/demo-login)[Install in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)
