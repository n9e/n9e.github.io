---
title: "Why does the alert not fire when the query returns results?"
sidebar_label: "Why does the alert not fire when the query returns results?"
description: "Query has data but nothing fires: the evaluation records hold the answer — for-duration not met, wrong datasource_queries, group or window mismatch, disabled, muted."
last_reviewed: 2026-10-10
---

You paste the rule's expression into the Metrics explorer, the value is clearly over the threshold,
and the rule page shows no events at all. This page is not a list of "maybe A, maybe B" — it is one
path, read backwards from the evaluation records.

Urgency: one silent rule affects only what that rule covers. If **every rule on the same data source
is silent**, no engine has picked up that data source — that is an outage, jump straight to "The rule
is never evaluated".

## Start at the evaluation records (90% of answers are there)

Open the rule → **Evaluation records**. One record per evaluation cycle, holding what was queried,
what the verdict was, and which step downstream stopped it. The useful parts are these counters and
each event's **stage**:

| Field | Meaning |
|---|---|
| `anomaly_total` | how many series crossed the threshold this cycle |
| `pending` | the **for-duration** is not satisfied yet, so no event is produced |
| `inhibited` | the same object matched several severities and the lower ones were suppressed |
| `muted` | caught by a mute rule (including notify-only mutes and the mute hook) |
| `drop_by_pipeline` | dropped by a workflow attached to the alert rule |
| `fired` | an event was actually created or refreshed |

Each event also carries a `stage` and a `detail`, and the stage values are exactly those steps:
`pending`, `inhibited`, `muted`, `muted_notify_only`, `muted_by_hook`, `drop_by_pipeline`, `fired`,
`stalled`, `recovered`, `push_queue_failed`.

**Follow the `stage`, do not guess.** A `pending` detail looks like this:

```
for=180s elapsed=45s
```

The for-duration is 180 seconds and only 45 have accumulated — it is not failing to fire, it is not
due yet.

If `anomaly_total` is 0, **no series crossed the threshold at query time**. That is not a judgement
problem; go back to the query: [Why does a data source connect but return no data?](./no-data.md).

## The rule is never evaluated

No evaluation records at all — as opposed to records without events — means no engine has taken this
rule. **The server logs nothing in this case**: a hash-ring miss is a silent `continue`, and the most
common variant of all (no engine covers the data source, so the ring is empty) is explicitly excluded
from the error log.

The `instances` and `disabled_instances` fields in the evaluation-records response are the only
signal: `instances` lists the engine instances currently responsible for that data source, and **an
empty list means nobody is running this rule**.

Check, in order:

1. **Is the rule disabled?** A disabled rule vanishes from the engine cache with no evaluation-time
   log at all — only a single line when its worker stops:
   `alert_eval_<rule id> datasource_<ds id> stopped`.
2. **Does the data source still exist and is it enabled?** A disabled data source makes the rule
   silently skipped; only at DEBUG level do you see
   `alert_eval_%d datasource %d status is %s` (note the **space** after `datasource` in these
   lines, not an underscore — easy to miss when grepping).
3. **Is an alerting engine running?** Look at **System → Alerting engines**. An instance whose
   heartbeat is older than 30 seconds stops taking shards, but its row is not deleted for at least
   10 minutes — so the list can show engines that are already gone. Read the `clock` column.

## Wrong data source: `datasource_queries` is the field that counts

The rule model carries two fields that both look like a data source selector. **`datasource_ids` and
`cluster` are deprecated and ignored; `datasource_queries` is what is actually used.**

It is a list of match conditions where `match_type` sets the semantics: `0` is an explicit list of
IDs, `2` means "all data sources". Imported rules, and rules carried over from an older version,
easily end up with `{"match_type":2,"values":[0]}` — **the rule may be running against a data source
you never intended**, finds nothing there, and stays quiet.

Open the rule and read what the Data source field actually selects. Do not trust memory.

## Effective time window and business group

Neither of these stops the rule from evaluating. They make the resulting event **be treated as
muted** — so the evaluation record shows `muted`, and the detail spells out why:

| detail | Meaning |
|---|---|
| `rule is not effective for period of time, was muted` | the current time is outside the rule's effective window |
| `ident not exists, was muted` | the host on the event no longer exists in the host list |
| `ident not match busigroup, was muted` | the rule is scoped to its own business group and this host is not in it |
| `match mute rule` | a mute rule matched; the detail carries the `mute_id` |

The effective window is three fields together: start time, end time, days of week. **A rule outside
its window still queries the data source every cycle** — it just produces no events, so it saves you
noise but not load.

One more thing people get wrong: **an event's business group comes from the rule's business group,
not from the object's.** Filtering events by business group and finding nothing is usually this.

## A mute rule ate the event entirely

Mute rules have two modes and they behave very differently:

- **Mute event and notification** (the default): the event is **never created**. It is not on the
  events page and not in the history. "The metric was clearly over and there is not one event in the
  history" is almost always this.
- **Mute notification only**: the event is created and stored as usual, simply not sent, and a
  notification record is written with a muted status.

`muted` and `muted_notify_only` in the evaluation record are exactly this distinction. To get the
history back, switch the mute rule to notification-only.

## Collect this before you ask

1. The rule ID, its business group, and the actual Data source and Effective window settings;
2. From the last few evaluation records: `anomaly_total` / `pending` / `muted` / `fired`, plus one
   event's `stage` and `detail`;
3. `curl -s http://127.0.0.1:17000/metrics | grep -E 'n9e_alert_rule_eval_(total|error_total)|n9e_alert_eval_query_series_count'`;
4. Log lines beginning `alert_eval_<rule id> ` — that prefix catches everything this rule logs.

**Redacting**: replace business labels, host names and data source addresses inside the expression.

## Next

- The evaluation records themselves are empty: [Why are evaluation records missing or dropped?](./evaluation-missing.md)
- The event exists but nothing arrives: [Why is there an alert event but no notification?](./no-notification.md)
- Fires and recovers repeatedly: [Why does an alert fire repeatedly or never recover?](./alert-flapping.md)
- The full model: [Evaluation, recovery and state changes](../concepts/evaluation.md)
- How to read the records page: [Evaluation execution records](../alerting/execution-records.md)
