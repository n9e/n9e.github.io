---
title: "From Zabbix"
sidebar_label: "From Zabbix"
description: "Moving from Zabbix is a rebuild: hosts map to targets, templates to integrations, triggers to rules; some concepts have no equivalent, and Zabbix never has to stop."
last_reviewed: 2026-10-10
---

import { figures } from '@site/src/data/figures';

Where this page ends: every Zabbix object placed on a Nightingale one, a clear list of what has
**no equivalent at all**, and an order of work that never takes Zabbix down.

## Accept this first: it is a rebuild, not a migration

**Nightingale has no importer for Zabbix templates or triggers**, and cannot read Zabbix XML or
YAML exports. The two data models are far enough apart that no mechanical conversion exists.

The good news is that the rebuild is smaller than it looks. A Zabbix template attached to 1000
hosts materialises 1000 sets of triggers; in Nightingale that is usually **one rule** — the rule
runs one query, and however many series come back is how many events you get. Hosts are never
enumerated.

Historical data does not move either. Zabbix's `history` and `trends` stay where they are; Zabbix
keeps running and collecting throughout, and afterwards you demote it to a read-only archive.

## The object mapping

### Collection and storage

| Zabbix | Nightingale |
|---|---|
| Zabbix Server | Nightingale plus a time-series database. The [embedded TSDB](../install/embedded-tsdb.md) is on by default and enough to start with; at scale, forward to an external store |
| Zabbix Agent | [Categraf](../data/categraf/install.md), or the exporters you already run |
| Zabbix Proxy | Conceptually closest to `n9e-edge`, but not the same thing: a Proxy is a collection relay, edge **pushes evaluation down** — see [Edge data centers](../install/edge.md) |
| `history` / `trends` tables | An external store, or the [embedded TSDB](../data/embedded-tsdb.md) |
| Item | **No equivalent.** What gets collected is decided by the collector's config; Nightingale does not define items |
| Item key (`vfs.fs.size[/,pfree]`) | A metric name plus labels (`disk_used_percent{path="/"}`) |
| The Zabbix API | Nightingale's HTTP API |

### Hosts and grouping

| Zabbix | Nightingale |
|---|---|
| Host | A row in the host list, keyed on `ident` (the hostname Categraf reports) |
| Host group | A **business group** — but it is also the **permission boundary**, not just a grouping. See [Business groups](../concepts/business-groups.md) |
| Host macros / inventory | Custom tags and notes on the target, plus the labels the collector reports in `[global.labels]` |
| Template | A **component in the template center**: {figures.integrations} components ship, {figures.integrationsWithAlerts} of them with alert rule templates and {figures.integrationsWithDashboards} with dashboard templates |
| Template inheritance / nested templates | **No equivalent.** Importing a component is a one-time copy; changing the template does not flow back into copies already imported |
| LLD (low-level discovery) | **No equivalent**, and usually not needed: however many series a query returns is how many objects you have, so a new mount point or NIC simply shows up in the result |

### Triggers and alerting

| Zabbix | Nightingale |
|---|---|
| Trigger | An [alert rule](../alerting/first-rule.md). One rule covers **every** object its query can return |
| Trigger expression | The rule's query (PromQL / SQL / LogQL, depending on the source type) |
| Recovery expression (OK event) | The **Recovery configuration** dropdown on log and SQL rules, which allows asymmetric thresholds. A Prometheus rule keeps its threshold inside the expression and has no separate recovery expression — see [Evaluation and recovery](../alerting/evaluation.md) |
| Six severity levels | **Three**: S1 / S2 / S3. Suggested mapping: Disaster and High → S1; Average and Warning → S2; Information and Not classified → S3 |
| Trigger dependencies | **No equivalent.** The nearest thing is attaching an [event pipeline](../events/pipelines.md) with a drop processor to the downstream rule, dropping on a label the upstream event wrote |
| The `nodata()` function | The **No data** switch on log and SQL rules. Prometheus rules need a separate rule (`target_up == 0`) |
| Trigger hysteresis | An asymmetric threshold in the recovery condition, or a recover duration |

### Notification and maintenance

| Zabbix | Nightingale |
|---|---|
| Action + Operation | [Notification rules](../notifications/rules.md) |
| Media type | [Media types](../notifications/dingtalk-feishu-wecom.md) |
| Message template | [Message templates](../notifications/templates.md) |
| Escalation steps | Partly: a subscription rule's **Duration** gives you "still not recovered after N seconds, copy in the team lead" — see [Alert subscriptions](../events/subscriptions.md). Zabbix's multi-step escalation ladder has no equivalent |
| User / User group | Users / Teams |
| Maintenance windows | [Mute rules](../events/mute-rules.md), which additionally offer periodic windows and a notify-only mode |
| Graph / Screen / Dashboard | [Dashboards](../query/dashboards.md) |

## Where the two models really differ

Three points. Understand these and the rest of the mapping is a lookup table:

1. **Zabbix is host- and item-centric; Nightingale is query-centric.** In Zabbix you first declare
   "this host collects this item", then write a trigger against that item. In Nightingale you
   write a query and monitor whatever it returns. So the action "add an item to this host" **does
   not exist** on the Nightingale side — collecting one more metric means changing the collector's
   config, not Nightingale's.
2. **Rules are one-to-many.** One Zabbix trigger covers one host; one Nightingale rule covers
   every series its query returns. So start each translation by merging: fold the N triggers that
   share a metric and a threshold into one rule, then peel the exceptions back out with labels
   (tag the special machines `disk_threshold=high` and give them their own rule).
3. **The business group is a permission boundary.** Zabbix host groups are mostly organisation and
   permissions; a Nightingale business group additionally decides who can see a rule, who can edit
   it, and where a mute rule applies. **Plan business groups more carefully than you planned host
   groups.**

## The order to rebuild in

Zabbix stays up throughout, and every step verifies on its own.

1. **Install Categraf.** Put the collector on a batch of machines with its write URL pointing at
   Nightingale. Leave the Zabbix Agent installed. *Verify*: those machines appear under
   **Infrastructure → Hosts** with a ticking heartbeat. See
   [Install Categraf](../data/categraf/install.md) and
   [Targets and heartbeat](../data/categraf/targets.md).
2. **Settle storage.** At small scale use the embedded TSDB; if you already run Prometheus or
   VictoriaMetrics, register it as a data source. *Verify*: `cpu_usage_active` plots under
   **Explorer → Metrics**.
3. **Import the bundled templates.** Find the matching component under **Integrations →
   Components** and import its dashboards and alert rules into a business group, leaving the
   rules **disabled**. This step absorbs most of what your Zabbix templates were doing.
   *Verify*: the dashboards have data. See
   [Import dashboards and rules](../data/integrations/import.md).
4. **Translate the remaining triggers.** Rewrite the custom triggers the bundled templates do not
   cover, merging as described above. *Verify*: [test fire](../alerting/test-fire.md) each rule to
   confirm the query and threshold.
5. **Build notification.** Media type → message template → notification rule, then attach it to
   the rules. *Verify*: **Run test** on the notification rule and actually receive a message.
6. **Move maintenance windows.** Rebuild the long-lived Zabbix maintenance periods as mute rules.
   *Verify*: the **Test** button on the mute form runs the match against existing events.
7. **Run both.** See the next section.
8. **Decommission.** Once there is no divergence, disable Zabbix's Actions first (keep evaluating,
   stop notifying), watch for a week, then stop the Zabbix Agents.

## Comparing during the parallel run

Both sides evaluate and both notify. The cheapest way to compare is to **send Nightingale's
notifications to one dedicated room or mailbox** and do a daily diff:

- **Zabbix fired, Nightingale did not**: usually a trigger missed in step 4, or a metric Categraf
  never collected. Confirm the metric exists in the Metrics explorer first, then look at the rule.
- **Nightingale fired, Zabbix did not**: check you did not mistype the threshold. If it is right,
  there is probably a trigger dependency or a maintenance window on the Zabbix side that you had
  not noticed.
- **Both fired at different severities**: squeezing six levels into three loses information by
  definition. Walk the mapping table above.

The full parallel-run and rollback method is in
[Coexistence and rollback plan](./coexistence.md). Rolling back is simple: **bulk-disable the
Nightingale rules**; Zabbix was never touched.

## Next

- Deciding whether to switch at all: [Nightingale vs Zabbix](/comparisons/zabbix)
- Running both and cutting over: [Coexistence and rollback plan](./coexistence.md)
- Which business group a rule belongs to: [Scope by business group and data source](../alerting/scope.md)
- Configuring collector plugins: [Categraf plugins](../data/categraf/plugins.md)
