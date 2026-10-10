---
title: "From Prometheus + Alertmanager"
sidebar_label: "From Prometheus + Alertmanager"
description: "Keep Prometheus for storage and scraping; move rules, routes, silences and receivers into Nightingale objects."
---

Where this page ends: you can take an `alertmanager.yml` and a `rules.yml` apart, place every
entry on a Nightingale object, know which entries **have no equivalent**, and cut over in an
order you can reverse at any point.

Alertmanager is the only component Nightingale actually replaces. Nothing else moves.

## What stays, what gets replaced

| What you run today | After the migration |
|---|---|
| Prometheus scraping (`scrape_configs`) | **Untouched**, not one line |
| Prometheus storage, `remote_write`, Thanos / Mimir | **Untouched**; registered as a data source and queried in place |
| Exporters, Grafana dashboards | **Untouched** |
| **Recording rules** in `rule_files` | **Untouched**, Prometheus keeps computing them |
| **Alerting rules** in `rule_files` | Moved into Nightingale; Prometheus stops evaluating them |
| `alertmanager.yml` (routes, silences, receivers, inhibition) | Split into notification rules / mute rules / media types / message templates |
| The Alertmanager process | Retired last |

Evaluation moves from Prometheus to Nightingale: the alerting engine sends instant queries to
Prometheus on a schedule and treats each returned series as an anomaly point. As long as
Prometheus is queryable, evaluation carries on.

**Nightingale cannot receive an Alertmanager webhook.** The backend has no inbound alert endpoint
of the `/api/v1/alerts` shape — only metric write endpoints (`prometheus/v1/write`,
`opentsdb/put` and friends). So you cannot park Alertmanager in front of Nightingale as a
forwarder during the transition; the rules have to be rebuilt.

## The object mapping

### Rules and expressions

| Prometheus | Nightingale |
|---|---|
| `groups[].rules[].alert` | Rule name |
| `expr` | The single query in the rule (the threshold stays inside the PromQL, `... > 0.5`) |
| `for` | For duration, in seconds; unparseable or absent falls back to 60s |
| group `interval` | Execution frequency, as `@every Ns`; absent means 60s |
| `labels.severity` | Severity S1 / S2 / S3 by keyword; anything unrecognised becomes S2, and the label itself is not carried into the tags |
| every other entry in `labels` | An appended tag `key=value` — **spaces in the key and the value are stripped** |
| `annotations` | Annotations, as-is |
| `record:` entries in the same file | **Silently skipped**; see [Recording rules](../query/recording-rules.md) |
| `keep_firing_for`, group `limit` | **Not converted** |

The whole `rules.yml` can be pasted into **Alert rules → Import → Import Prometheus alert
rules**; the edge cases are in [Import, export and reuse](../alerting/import-export.md). Note
that the import hard-codes the repeat interval to 60 minutes and the recover duration to 0 —
neither comes from the YAML, so review both afterwards.

### Routes and receivers

| Alertmanager | Nightingale | Notes |
|---|---|---|
| One entry in `receivers[]` | One notification config inside a **notification rule** | Media + parameters + recipients |
| The receiver's type (webhook / email / DingTalk…) | **Media type** | The "how", see [DingTalk / Feishu / WeCom](../notifications/dingtalk-feishu-wecom.md) |
| Go templates under `templates` | **Message template** | See [Templates and variables](../notifications/templates.md) |
| `route.matchers` | **Applicable tags** and **Applicable attributes** on a notification config | All ANDed |
| The `route` tree, `continue` | **No equivalent** | See the next section |
| `group_by` / `group_wait` / `group_interval` | **No equivalent** | One notification carries exactly one event; nothing is batched by label |
| `repeat_interval` | **Repeat interval** on the alert rule, in **minutes**; 0 means never repeat | Plus a **max notification count** cap that Alertmanager has no equivalent for |
| `send_resolved` | The **Notify on recovery** switch | |
| `resolve_timeout` (roughly) | **Recover duration**, in **seconds**: after the anomaly clears, keep watching this long before declaring recovery | |
| Alertmanager clustering (gossip dedup) | Several alerting engine instances shard the rules between them | No gossip needed |

### Silences and inhibition

| Alertmanager | Nightingale | Difference |
|---|---|---|
| Silence (UI / API / `amtool`) | **Mute rule** | A mute rule **must belong to one business group** and only affects that group's events; an Alertmanager silence is global |
| Silence matchers (`=` `!=` `=~` `!~`) | Six operators: `==` `!=` `=~` `!~` `in` `not in` | Two extra set operators, but missing labels behave differently — see below |
| A silence's start and end | **Fixed time** mute | There is also a **Periodic time** mute (days of week plus a daily window), which on the Alertmanager side needs `mute_time_intervals` on a route |
| (no equivalent) | The **Mute notifications only** method keeps the event on record | An Alertmanager silence only ever has this one meaning |
| `inhibit_rules` (cross-rule) | **No equivalent** | See below |

The switch labelled **Inhibit** on the rule form is **not** `inhibit_rules`: it acts only
**within one rule in one evaluation round** — when curves with an identical metric name and
identical labels trip several severity tiers at once, the higher one suppresses the lower.
Cross-rule suppression ("the rack is down, stop paging about its hosts") has no declarative
form in Nightingale. The nearest thing is attaching an [event pipeline](../events/pipelines.md)
with a drop processor to the downstream rule and dropping on a label the upstream event wrote.
That is a piece of engineering, not a setting — budget for it before you start.

## Flattening the route tree

Alertmanager routing is a tree: matched top-down, stopping at the first match by default
(`continue: false`). Nightingale is flat: **an alert rule carries several notification rules,
each of which holds several notification configs, and every config independently ANDs its four
conditions — time window, severity, tags, attributes — and every config that matches sends its
own message.** There is no order, and nothing stops after a match.

To flatten: **for each root-to-leaf path in the tree, AND together every matcher along the way
and make that one notification config.**

```yaml
# alertmanager.yml
route:
  receiver: default-chat
  routes:
    - matchers: [ 'env="prod"' ]
      receiver: prod-chat
      routes:
        - matchers: [ 'severity="critical"' ]
          receiver: prod-oncall-phone
          continue: true
```

Flattens into three notification rules:

| Notification rule | Severities | Tags | Media |
|---|---|---|---|
| `prod-oncall-phone` | S1 | `env == prod` | Phone |
| `prod-chat` | S1 S2 S3 | `env == prod` | Group bot |
| `default-chat` | S1 S2 S3 | `env != prod` | Group bot |

Four things to watch:

- The example has `continue: true`, so critical goes to both phone and chat — the flat model
  does that by default, with nothing to configure. It is the **default `continue: false` that
  you have to emulate by hand**: write sibling branches as mutually exclusive conditions
  (`!=` / `not in` / `!~` to exclude the more specific branch), or one event matches two rules
  and goes out twice.
- The `env != prod` in the last row **only holds if the event always carries an `env` label**.
  The next section explains why.
- The root catch-all receiver has a sturdier form: a
  [subscription rule](../events/subscriptions.md) with every filter left empty. Its meaning is
  literally "I want all events", so it is a natural catch-all and it does not depend on any
  label existing.
- **Notification rules are not global.** In Alertmanager every alert flows into the one tree;
  in Nightingale an event only reaches the notification rules explicitly attached to its alert
  rule. Attach them in bulk with **Alert rules → More → Update alert rules**. **A rule with no
  notification rule attached leaves its events sitting in the event list.**

## Four asymmetries that bite

1. **An empty filter means the opposite on each side.** In Alertmanager an omitted matcher means
   no restriction; in a Nightingale notification config, leaving all three **Applicable
   severities** boxes unticked **matches nothing** and disables the config outright. Translating
   a route tree mechanically is exactly how you hit this. Applicable tags and time periods do
   mean "no restriction" when empty — only severity is inverted.
2. **A missing label fails the match — including `!=` and `!~`.** Nightingale's tag filter looks
   the key up first and returns "no match" when it is absent (`MatchTags` in
   `alert/common/key.go`). Alertmanager treats a missing label as an empty string, so
   `env!="prod"` *does* match an alert with no `env`. Before moving any silence or route that
   excludes with `!=` / `!~` / `not in`, make sure the label is always present — the cheapest
   fix is to append that dimension in the alert rule's tags, see
   [Labels and severity](../alerting/labels-severity.md).
3. **Mute rules have a business-group boundary.** One Alertmanager silence can cover the whole
   estate; a Nightingale mute rule only acts on the group it belongs to. A change window that
   spans several business groups needs several mute rules.
4. **Recovery semantics.** For a Prometheus-type rule the threshold lives inside the PromQL, so
   a series disappearing and a series dropping below the threshold look identical — both
   recover the alert, and a dead exporter "auto-recovers" the alert. This matches Alertmanager,
   but say it out loud to the on-call team before cutting over. Details in
   [Evaluation and recovery](../alerting/evaluation.md).

## The order to migrate in

Every step is verifiable on its own; if one fails, stop there.

1. **Register the data source.** Integrations → Data sources → Add → Prometheus, with the
   Prometheus query URL. *Verify*: the health check passes on save. Field by field, see
   [Prometheus](../data/prometheus.md).
2. **Create media types and message templates.** Move the address, token and secret of every
   entry in `receivers[]`. *Verify*: hit **Test** before saving and actually receive a message.
3. **Create the notification rules, flattening the tree.** Work through the table above.
   *Verify*: **Run test** on each notification config — **Use mock event** first to prove the
   address works, then **Pick history events** to prove the filters let through what they
   should. See [Test a notification end to end](../notifications/test.md).
4. **Import the alert rules, disabled.** Pick the business group → Import → Import Prometheus
   alert rules, paste `rules.yml`, leave **Enabled** off. *Verify*: an empty result cell on
   every row of the import table.
5. **Attach notification rules and enable one group.** Bulk-attach, then enable a single
   business group as the canary. *Verify*: run [Test fire](../alerting/test-fire.md) on one
   rule and check every stage — query, threshold, event, notification.
6. **Move the silences.** Rebuild the **unexpired** Alertmanager silences as mute rules; ignore
   the expired ones. *Verify*: the **Test** button on the mute form runs the match against
   existing events, showing exactly what it will swallow.
7. **Run both for a while.** Both sides evaluate, both notify, and you compare what fires. See
   [Coexistence and rollback plan](./coexistence.md).
8. **Retire.** Once there is no divergence, drop the alerting rules from Prometheus'
   `rule_files` and reload (keeping the recording rules), then stop Alertmanager.

## Rolling back

Before step 8 the rollback is always the same: **bulk-disable the Nightingale rules.** Keep the
rest of the Nightingale configuration — a disabled rule does not evaluate and produces no
events, and Prometheus was never touched.

After step 8, roll back by putting the `rule_files` entries back, reloading Prometheus and
restarting Alertmanager. Because scraping and storage were never modified, there is no gap in
the historical data.

## Next

- Running both sides and comparing them: [Coexistence and rollback plan](./coexistence.md)
- The full order events are processed in: [Noise reduction and routing model](../concepts/noise-routing.md)
- Which business group a rule belongs to: [Scope by business group and data source](../alerting/scope.md)
