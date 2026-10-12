---
title: "Why is Nightingale slow or backlogged?"
sidebar_label: "Why is Nightingale slow or backlogged?"
description: "Late alerts, growing queues and high database CPU each map to one built-in metric that localises the cause; pick the metric by symptom, then work back to the root."
last_reviewed: 2026-10-10
---

Alerts arrive minutes later than the thing they are about; a page in the UI takes forever to load;
charts show regular holes. This page does one job: **get from a symptom to the metric that localises
it, and from that metric to the cause.** How to size a deployment and what the defaults are belong to
[Capacity planning](../operations/capacity.md) and
[Limits and defaults](../reference/limits.md) — not repeated here.

Gauge urgency by the queues. **A steady non-zero queue** means the system is saturated but keeping
up, and can be scheduled as optimisation work. **A queue that keeps climbing** means data is being
lost — a full queue drops — so stop the bleeding first.

## Pick the metric from the symptom

Everything is on `/metrics`. **Take two samples a minute apart — what matters is the change, not the
absolute value**:

```bash
curl -s --noproxy '*' http://127.0.0.1:17000/metrics > /tmp/m1.txt
# wait 60 seconds
curl -s --noproxy '*' http://127.0.0.1:17000/metrics > /tmp/m2.txt
```

| Symptom | Look at | How to read it |
|---|---|---|
| Alerts are late | `n9e_alert_rule_eval_duration_ms` | One rule's time approaching its own execution frequency means that rule no longer fits its slot |
| Alerts stopped entirely | `n9e_alert_rule_eval_total` | Not climbing means evaluation stopped — much worse than slow |
| Events appear but notifications lag | `n9e_alert_notify_record_queue_size` | Climbing means the send side is blocked |
| The events themselves are slow | `n9e_alert_alert_queue_size` | Climbing means event processing is behind production |
| Holes in the metric charts | `n9e_pushgw_sample_queue_size` | Approaching the cap means samples are about to be dropped |
| Writes being rejected | `n9e_pushgw_push_queue_over_limit_error_total` | Any growth means whole write requests are being turned away |
| The whole UI is sluggish | `n9e_center_http_request_duration_seconds` | Read it alongside `n9e_db_pool_wait_count_total` |
| One data source's rules are all wrong | `n9e_alert_query_data_error_total` | Broken down by `datasource`, so the culprit is obvious |

One trap to know up front: **a labelled counter does not appear on `/metrics` at all until something
is recorded on it.** So on a healthy instance `n9e_alert_rule_eval_error_total` and
`n9e_alert_query_data_error_total` are **absent**, not zero. Do not use `absent()` to mean "are there
errors" — it fires permanently while everything is fine.

## Slow evaluation: find which rules

`n9e_alert_rule_eval_duration_ms` is a **gauge labelled per rule, holding that rule's most recent
evaluation time** (not a histogram, so there are no quantiles — just sort and read the top):

```bash
grep '^n9e_alert_rule_eval_duration_ms' /tmp/m2.txt | sort -t' ' -k2 -rn | head -10
```

The output looks like this, and `rule_id` is the rule ID you can look up directly in the UI:

```
n9e_alert_rule_eval_duration_ms{datasource_id="1",rule_id="6"} 2
n9e_alert_rule_eval_duration_ms{datasource_id="1",rule_id="5"} 1
```

**The threshold is relative, not absolute**: compare the value against that rule's own **execution
frequency** (`@every 60s` by default). At or near the frequency, the rule no longer fits in its own
time slot.

There is a companion metric, useful and rarely mentioned, that says how many series each rule pulls
back per query:

```bash
grep '^n9e_alert_eval_query_series_count' /tmp/m2.txt | sort -t' ' -k2 -rn | head -10
# n9e_alert_eval_query_series_count{datasource_id="1",ref="1",rule_id="5"} 10
```

**High duration plus a large series count means the query itself is too wide** — much the most
common combination.

## Growing queues: work out which one

Three queues sit at different points in the chain, so whichever is climbing names the bottleneck:

| Metric | This segment is | Growth means |
|---|---|---|
| `n9e_pushgw_sample_queue_size` | Samples received → forwarded into the TSDB | The TSDB cannot keep up, or the forward target is unreachable |
| `n9e_alert_alert_queue_size` | Events produced → events processed | Events are produced faster than they are processed, usually an alert storm |
| `n9e_alert_notify_record_queue_size` | Notification records being stored | The metadata database is slow to write |

**Only sustained growth is a problem.** A steady non-zero value just means that segment always has
data in flight, which is normal. The test is the difference between your two samples.

## Common root causes, and how to confirm each

### A handful of rules are slowing down the whole round

**How to confirm**: sort `rule_eval_duration_ms` as above; the top two or three are an order of
magnitude above the rest. Their `eval_query_series_count` is usually the largest too.

**How to fix**: change the rules, not the hardware. Three directions, best value first:

- **Narrow the query** — add label filters so one rule is not scanning every metric;
- **Aggregate before returning** — use `sum by (...)` or `topk` to collapse ten thousand series
  rather than hauling them all back into Nightingale to evaluate;
- **Lower the frequency** — not every rule needs to run once a minute.

If it is genuinely expensive and genuinely necessary, precompute it with a
[recording rule](../query/recording-rules.md) and alert on the result instead.

### The data source itself got slow

Most evaluation cost **is not on Nightingale's side**: a rule that queries Prometheus puts the bulk
of the load on Prometheus.

**How to confirm**: check whether `n9e_alert_query_data_error_total` concentrates on one
`datasource`, and whether **every** rule under that source got slower together —
**broad slowness is the data source; isolated slowness is the rule.** Then time the same query by
hand against that source.

**How to fix**: scale the data source, or move the rules onto cheaper queries. Adding machines to
Nightingale does not help here.

### An alert storm saturated everything downstream

One rule matching tens of thousands of series produces tens of thousands of events per round.

**How to confirm**: `n9e_alert_alerts_total` spikes while `n9e_alert_alert_queue_size` starts
climbing. That counter is labelled `busi_group` / `cluster` / `type` — **there is no `rule_id` on
it**, so it narrows the storm to a business group, not to a rule. To get to the rule, group the
events list by rule and see whether it is concentrated on one.

**How to fix**: put alert inhibition or a longer for-duration on that rule first to filter the
spikes, then go back and narrow the query. Choosing among the noise-reduction mechanisms is covered
in [Noise reduction and routing model](../concepts/noise-routing.md).

### The metadata database is queuing

**How to confirm**: this pair exists for exactly this question —

```bash
grep -E '^n9e_db_pool_in_use_connections|^n9e_db_pool_wait_count_total' /tmp/m2.txt
```

`in_use` sitting against `[DB] MaxOpenConns` (150 by default) while `wait_count_total` climbs means
the pool is queuing. A sluggish UI and a growing notification record queue often appear together,
and this is their shared root.

**How to fix**: **find the slow queries before raising the connection count.** Enlarging the pool
blindly just pushes the load onto the database. Two tables get out of hand most easily:
**historical alert events are kept forever by default** (`[Center] CleanAlertHisEventDay`), while
notification records default to 7 days. In a high-event environment the first grows without bound —
set a retention before you go live.

### Evaluation records cannot be written fast enough

Evaluation records (evallog) are on by default and write to local disk every round.

**How to confirm**:

```bash
grep -E '^n9e_alert_eval_log_drop_total|^n9e_alert_eval_log_query_reject_total' /tmp/m2.txt
```

`eval_log_drop_total` climbing means the records are already incomplete. While that is happening,
**"absent from the records" no longer means "did not happen"** — which will mislead you when
investigating something else.

**How to fix**: if the disk cannot keep up, tune `MaxDiskGB` and `RetentionHours` under
`[Alert.EvalLog]`, or cap a single rule's writes with `PerRuleDailyMB`. Turn the section off if you
genuinely do not need it.

## Confirming recovery

1. **None of the three queues is growing any more** — two `/metrics` samples a minute apart, and the
   difference is back near zero;
2. The top of the sorted `n9e_alert_rule_eval_duration_ms` is clearly below each rule's own execution
   frequency;
3. `n9e_alert_rule_eval_total` is climbing steadily — evaluation has not stopped;
4. `n9e_pushgw_push_queue_over_limit_error_total` is **no longer growing** (it is a counter — read
   the delta, not the total). Note that `n9e_pushgw_drop_sample_total` is **not** an overload
   signal: it counts samples removed by the drop filters you configured, so it stays flat under
   load and proves nothing here;
5. Pick a rule that was noticeably late and **test fire** it; the time from trigger to notification
   is back to what you expect;
6. Charts are continuous after the window that had holes.

Once it is fixed, **build alert rules on these metrics** so you do not investigate by hand next time
— concrete expressions are in [Monitor Nightingale itself](../operations/self-monitoring.md).

## Collect this before you ask

1. **Two `/metrics` snapshots** a minute apart:
   `curl --noproxy '*' http://127.0.0.1:17000/metrics > metrics.txt`;
2. The top ten lines of sorted `rule_eval_duration_ms` and `eval_query_series_count`;
3. Scale: how many rules, how many hosts, roughly how many active series
   (`prometheus_tsdb_head_series`, present only with the embedded TSDB);
4. Deployment shape: how many `n9e` instances, whether `n9e-alert` / `n9e-pushgw` are split out, and
   what the metadata database is and where it runs;
5. **When** it started getting slow, and what happened around then (rules added, hosts added, config
   changed, an upgrade).

**Redacting**: `rule_id`, `datasource_id` and `busi_group` are numbers or group names and can be
shared as they are; replace data source addresses and any credentials in a DSN.

## Next

- Where to scale and how to estimate: [Capacity planning](../operations/capacity.md)
- The defaults and ceilings: [Limits and defaults](../reference/limits.md)
- What each metric means: [Built-in metrics](../reference/built-in-metrics.md)
- Turning these into alerts: [Monitor Nightingale itself](../operations/self-monitoring.md)
- Evaluation stopped entirely: [Why are evaluation records missing or dropped?](./evaluation-missing.md)
