# Why does an alert fire repeatedly or never recover?

Flapping or never-recovering alerts usually come from a threshold sitting on the data, a data gap read as recovery, a changing label set, or no recovery condition.

Last reviewed 2026-10-10

One rule sent forty messages overnight — fire, recover, fire, recover. Or the opposite: the problem was fixed hours ago and the event is still sitting there. These are two directions of the same machinery, so they share a page.

Decide this first: **is the event flapping, or only the notification?** Open the event history. A genuine alternating series of triggered/recovered rows means the event is flapping. A single event that never recovered, plus a pile of messages, means repeat notifications. The two lead to entirely different investigations.

## Three timing parameters, one job each[​](#three-timing-parameters-one-job-each "Direct link to Three timing parameters, one job each")

| Parameter           | Default       | What it filters                                                                       |
| ------------------- | ------------- | ------------------------------------------------------------------------------------- |
| Execution frequency | `@every 60s`  | how often the query runs                                                              |
| For duration        | 60 s          | how long the condition must hold before an event exists — filters the **rising** edge |
| Recover duration    | 0 (immediate) | how long it must be clear before recovery is declared — filters the **falling** edge  |

**The recover duration holds back the recovery event itself, not just the recovery message.** Inside that window the event is still firing and still visible on the page. It is the most direct cure for flapping, and in the open-source build it is the **only** anti-flap lever for Prometheus rules — those have no separate recovery condition, recovery is always the inverse of the trigger, so an asymmetric "alert above 90%, recover below 70%" is not expressible.

Rule types that use the trigger-condition form (Elasticsearch, Loki, ClickHouse and the rest) do have a configurable recovery condition.

## The most common cause: a data gap read as a recovery[​](#the-most-common-cause-a-data-gap-read-as-a-recovery "Direct link to The most common cause: a data gap read as a recovery")

This is the number one source of flapping and it is hard to spot.

The engine cannot tell "the value came down" from "the points for this window are missing", and it treats an empty result as a recovery in both cases. So one missed collection cycle, one dropped batch in the TSDB, or one query that times out and returns nothing produces a recovery — and the next cycle, when data returns, produces a fresh trigger.

How to confirm it is this:

1. Open the rule's **evaluation records**, find the recovering cycle, and check that `anomaly_total` is 0 **and** that cycle's `series_total` is also 0 — **no series came back at all**, as opposed to values dropping below the threshold;
2. Run a range query over the same window in the Metrics explorer and look for gaps in the line;
3. Check whether `prometheus_tsdb_too_old_samples_total` on the server's `/metrics` is climbing (out-of-order or stale samples being discarded produce exactly these gaps).

Once confirmed, treat it from these angles:

* **set the recover duration longer than one gap** — with a 15-second collection interval, 60–120 seconds is a reasonable starting point;
* avoid expressions that go entirely empty when a single point is missing;
* the gap itself is an ingest problem — fix the root cause via [Why does a data source connect but return no data?](https://n9e.github.io/docs/troubleshooting/no-data.md).

One counter-intuitive point worth stating plainly: **a query error and an empty query result behave completely differently.** On an error the whole judgement-and-recovery step for that cycle is skipped, so the event is neither refreshed nor recovered. Only a successful empty result triggers recovery. An intermittently timing-out data source therefore does not cause flapping — it causes stuck state.

## The label set changed, so it became a different event[​](#the-label-set-changed-so-it-became-a-different-event "Direct link to The label set changed, so it became a different event")

An event is identified by a hash over its label set. **Change any key or value and it is a different event** — the old one is recovered because it stopped appearing, the new one fires as new. What you see is endless trigger/recover on what is really the same object.

Usual sources:

* the expression carries a volatile label: container ID, pod name, an ephemeral port inside `instance`;
* a `relabel` processor in a workflow attached to the rule is rewriting labels;
* someone edited this host's tags in the host list while `Pushgw.LabelRewrite` is on (it is by default), so the stored labels changed.

How to confirm: take an adjacent recovered/triggered pair from the history and **compare their labels key by key**. Find one key that changes and you have your answer. Fix it by aggregating the volatile label away in the expression (`sum without(instance) (...)`) or dropping it in a workflow.

## The other direction: it never recovers[​](#the-other-direction-it-never-recovers "Direct link to The other direction: it never recovers")

An event that will not clear, in this order:

1. **Is the rule still being evaluated?** If the evaluation records stop at some point, no engine is running the rule any more — and **without evaluation there is never a recovery**. Go to [Why are evaluation records missing or dropped?](https://n9e.github.io/docs/troubleshooting/evaluation-missing.md).
2. **Is the query erroring every cycle?** Errors skip recovery entirely. Check whether `n9e_alert_rule_eval_error_total{stage="query_data"}` is climbing and whether `n9e_alert_eval_query_series_count` is negative.
3. **Is the recover duration too long?** Until the window elapses, the event is still firing.
4. **Did the object disappear?** Once a host is deleted from the host list, events carrying that `ident` are treated as muted (the evaluation record's detail reads `ident not exists, was muted`) and will not recover on their own.
5. **Are recovery notifications switched off?** The event may have recovered on screen while you heard nothing — "notify on recovery" is a separate per-rule switch, and turning it off still records the recovery, it just does not send it.

## The notifications flap, the event does not[​](#the-notifications-flap-the-event-does-not "Direct link to The notifications flap, the event does not")

One event in the history plus many messages is repeat notification, not flapping. Two parameters control it:

* **Repeat interval** (`notify_repeat_step`, in minutes): how often to re-send. Setting it to 0 means **one notification for the entire life of the alert**.
* **Max notifications** (`notify_max_number`): 0 means unlimited.

The log states the decision for every cycle, under the prefix `alert_eval_<rule id> datasource_<ds id> event-hash-<hash>`:

```
fired, notify_repeat_step_matched(1788440612 >= 1788438872 + 60 * 60) notify_max_number_ignore(#2 / 0)

stalled, notify_repeat_step_not_matched(1788440612 < 1788438872 + 60 * 60)

stalled, notify_repeat_step_matched(...) notify_max_number_not_matched(#5 / 5)
```

`stalled` means: **the event is still firing, but this cycle sends nothing and writes no new history row.** From the user's side it simply goes quiet. The same words appear as the event `stage` in the evaluation records.

When one rule carries several severities, the **inhibit** switch keeps only the most severe match per object; turning it off means three messages instead of one. The `inhibited` counter in the evaluation record is how many it suppressed.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The rule ID and its four values: execution frequency, for duration, recover duration, repeat interval;
2. The event history for the flapping window, **with the labels column kept** — that is what makes label drift visible;
3. `anomaly_total`, `series_total` and the event `stage` from the evaluation records over the same window;
4. Every log line containing `event-hash-<hash>`.

**Redacting**: replace host names, product names and container IDs inside label values, but **keep the structure of which keys are changing** — without that the problem is unreadable.

## Next[​](#next "Direct link to Next")

* The full model: [Evaluation, recovery and state changes](https://n9e.github.io/docs/concepts/evaluation.md)
* Tuning the intervals: [Evaluation interval and recovery](https://n9e.github.io/docs/alerting/evaluation.md)
* Root cause of the data gaps: [Why does a data source connect but return no data?](https://n9e.github.io/docs/troubleshooting/no-data.md)
* Other noise-reduction options: [Common noise patterns](https://n9e.github.io/docs/events/noise-patterns.md)
