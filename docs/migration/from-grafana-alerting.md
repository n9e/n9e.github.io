---
title: "From Grafana Alerting"
sidebar_label: "From Grafana Alerting"
description: "Keep Grafana dashboards; move alert rules and contact points, and what to do about unified alerting state."
---

Where this page ends: Grafana unified alerting taken apart onto Nightingale objects, a clear line
between what moves automatically and what has to be rewritten, and a decision about Grafana's
No data / Error states.

## What stays, what gets replaced

| What you run today | After the migration |
|---|---|
| Grafana dashboards, panels, variables | **Untouched.** Nightingale ships dashboards but does not ask you to migrate — see [Use Grafana with Nightingale](../query/grafana.md) |
| Grafana's data sources (Prometheus, Loki, ES…) | **Untouched**; both sides talk to the same backends |
| Grafana recording rules | **Untouched**, or moved to [recording rules](../query/recording-rules.md) if you prefer |
| Grafana-managed alert rules | **Rewritten** as Nightingale alert rules |
| Data source-managed alert rules | These are Prometheus ruler rules; take [the Alertmanager route](./from-alertmanager.md) instead |
| Notification policies | Flattened into notification rules |
| Contact points | Media types plus notification rules |
| Mute timings and silences | Mute rules |

## The one thing that automates: data sources

Rules do not move; data sources do. **Integrations → Data sources** has an **Import from Grafana**
button at the top right, visible to admins only:

1. Enter the **Grafana URL** and pick the **auth type** — API Token, or username and password.
   For a self-signed certificate, tick **Skip TLS verification**.
2. Click **Fetch**. A preview table appears listing the Grafana type, name, **mapped type**,
   whether it is supported, whether the name collides, and whether credentials are still needed.
   This step **writes nothing**.
3. Tick what you want and click **Import**. Results come back per row: imported, pending
   credentials, skipped, or failed.

Two things to know:

- **Secrets do not come across.** Anything flagged as needing credentials arrives half-built; open
  the data source and fill in the password or token before it will work.
- **Unsupported types are flagged and skipped.** Nightingale supports a finite set of data source
  types, so Grafana plugins with no counterpart cannot be imported.

*Verify*: open each imported data source and run its health check.

## The object mapping

### Alert rules

| Grafana Alerting | Nightingale |
|---|---|
| The query A + Reduce B + Threshold C expression chain | A Prometheus rule **puts the threshold inside the PromQL** (`avg_over_time(...[5m]) > 80`); log and SQL rules have separate trigger conditions written as `$A.value > 80` |
| Pending period | For duration |
| The evaluation group's interval | Execution frequency |
| Labels | Appended tags |
| The `summary` / `description` annotations | Annotations |
| The `runbook_url` annotation | The rule's **Runbook URL** field |
| The rule's folder | A **business group** — but that is also a permission boundary, not just a folder. See [Business groups](../concepts/business-groups.md) |
| Alert instances (the many instances one rule expands into) | Events. However many series the query returns is how many events you get |
| State history | [Alert events](../events/active-historical.md), plus [evaluation records](../alerting/execution-records.md) |

The expression chain is the fiddly part of this migration: Grafana splits "what to query" from
"what counts as too much", while a Nightingale Prometheus rule folds them into one PromQL. Replace
the Reduce with a PromQL aggregation over time (`avg_over_time` / `max_over_time` /
`last_over_time`) and the Threshold with a comparison operator.

### Notification policies and contact points

Grafana unified alerting embeds an Alertmanager, so a notification policy *is* an Alertmanager
route tree, `continue` semantics included. **Nightingale has no tree routing** — several flat
notification rules each match and each send.

The flattening method, and the two traps ("an empty filter means the opposite on each side" and
"a missing label never matches"), are identical to the Alertmanager page and not repeated here:
see [From Prometheus + Alertmanager](./from-alertmanager.md).

| Grafana | Nightingale |
|---|---|
| Contact point | [Media type](../notifications/dingtalk-feishu-wecom.md) (how to send) plus a [notification rule](../notifications/rules.md) (who receives it) |
| Notification template | [Message template](../notifications/templates.md) |
| A notification policy's matchers | **Applicable tags** and **Applicable attributes** on a notification config |
| `group_by` / `group_wait` / `group_interval` | **No equivalent**; one notification carries exactly one event |
| `repeat_interval` | The alert rule's **Repeat interval**, in minutes |

### Silences and mute timings

| Grafana | Nightingale |
|---|---|
| Silence (one-off) | A **Fixed time** [mute rule](../events/mute-rules.md) |
| Mute timing | A **Periodic time** mute rule, or **Applicable time periods** on a notification config |
| A silence's matchers | The mute rule's event tag conditions, with six operators |
| (no equivalent) | The **Mute notifications only** method keeps the event on record |

Mute timings have two possible landings, and the scope decides which. To keep a class of event
quiet for everybody during a window, use a periodic mute rule. To stop **one notification rule**
sending during a window while the others carry on, use that rule's applicable time periods.

## What Grafana has and Nightingale does not

These are the trade-offs to settle before you start:

- **The No data / Error state machine.** A Grafana rule can say what state applies when the query
  returns nothing and when execution fails (`NoData` / `Alerting` / `OK` / `KeepLast`).
  Nightingale **has no such state machine**: in a Prometheus rule, a series disappearing means
  recovery, so alerting on "the data is gone" needs its own rule (`up == 0`, say). Log and SQL
  rules do have a **No data** switch with its own severity and auto-recovery timeout, which is the
  closest thing to Grafana's `NoData`. See [Evaluation and recovery](../alerting/evaluation.md).
- **Keep last state.** No equivalent.
- **Rule version history and provisioning.** Nightingale has no built-in rule versioning; the
  equivalent is exporting rule JSON into version control — see
  [Import, export and reuse](../alerting/import-export.md).
- **Multi-step escalation across several contact points per rule.** No equivalent; the closest is
  a [subscription rule](../events/subscriptions.md)'s **Duration** for one timeout-based copy-in.

## The order to migrate in

Grafana stays up throughout, and you can back out at any point.

1. **Import the data sources** with the button above, then fill in the missing secrets.
   *Verify*: the health check passes on each one.
2. **Create media types and message templates.** Move each contact point's address and secret.
   *Verify*: hit **Test** before saving and actually receive a message.
3. **Flatten the notification policies into notification rules.** Method on
   [the Alertmanager page](./from-alertmanager.md). *Verify*: **Run test** on each notification
   config in both modes — mock event and history events. See
   [Test a notification end to end](../notifications/test.md).
4. **Rewrite the alert rules, disabled.** Start with the most important batch, folding Reduce and
   Threshold into PromQL. *Verify*: [test fire](../alerting/test-fire.md) each rule and check
   every stage — query, threshold, event, notification.
5. **Move silences and mute timings.** Rebuild unexpired silences as fixed-time mute rules and
   land the mute timings per the choice above. *Verify*: the mute form's **Test** button runs the
   match against existing events.
6. **Run both for a while.** Leave the Grafana rules in place, let both sides notify, and compare
   what fires. Method in [Coexistence and rollback plan](./coexistence.md).
7. **Cut over.** Once there is no divergence, **pause** the Grafana rules — do not delete them —
   watch for a week, then delete. The dashboards stay exactly as they are.

## Rolling back

Before step 7, rolling back means **bulk-disabling the Nightingale rules**; Grafana never stopped.

After step 7, rolling back means un-pausing the Grafana rules. That is exactly why step 7 pauses
rather than deletes: a deleted rule has to be rebuilt, a paused one comes back in a second.

## Next

- Living alongside Grafana for charts: [Use Grafana with Nightingale](../query/grafana.md)
- The full route-tree flattening method: [From Prometheus + Alertmanager](./from-alertmanager.md)
- Running both and cutting over: [Coexistence and rollback plan](./coexistence.md)
