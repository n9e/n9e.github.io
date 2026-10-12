---
title: "Evaluation interval and recovery"
sidebar_label: "Evaluation interval and recovery"
description: "Four timing fields on a rule — interval, for-duration, observation window, recovery — decide when an event is created, when it recovers and when it re-notifies."
last_reviewed: 2026-10-10
---

Where this page ends: you can set the four timing fields on a rule deliberately instead of leaving
them at their defaults, and you know which of them decide whether an event exists at all versus
whether a message goes out.

The state machine behind these fields is described in
[Evaluation, recovery and state changes](../concepts/evaluation.md). This page is about the fields.

## The four fields and where they are

| Field | Step | Default |
|---|---|---|
| Execution frequency | 3, under the query list | `@every 60s` |
| For duration (s) | 3, next to it | 60 |
| Recover duration (s) | 4, Notification settings | 0 |
| Recovered | 4, Notification settings | on |

## Execution frequency

A cron expression with second precision. `@every 30s` is the common form; the dropdown offers the
usual intervals, and standard cron syntax works too if you need "every day at 09:00".

Two constraints, and they pull in opposite directions:

- **Do not run faster than the data arrives.** Categraf's default scrape interval is 15s. Evaluating
  every 5s just re-reads the same three points and triples the load for nothing.
- **Do not run slower than you need to know.** The frequency is the floor on your detection time,
  before for-duration adds to it.

And one that people discover the expensive way: the frequency is **per data source**. A rule that
matches ten instances at `@every 15s` issues 2400 queries an hour. Widening a data source filter
multiplies this silently — see [Scope by business group and data source](./scope.md).

For SQL-backed rules, weigh the frequency against how long the statement takes. A query that takes
eight seconds should not run every fifteen.

## For duration

How long the condition must keep holding before an event is produced. `0` fires on the first match.

It is checked per series. The same series must come back on consecutive evaluations until the
elapsed time covers the duration; a series that appears once and disappears never produces an event.
And because no event was ever created, it never produces a recovery either — a flapping metric with
a for-duration set is genuinely silent, not silently deduplicated.

Rules of thumb:

- **0** for things that are binary and unambiguous — a process is gone, a certificate expired.
- **2–3 evaluation cycles** for anything sampled — CPU, memory, latency, error rate. This is the
  common case, and it is why the default is 60s against a 60s frequency.
- **Longer than the thing's own recovery time** for anything self-healing. If a queue drains itself
  in two minutes, a two-minute for-duration means you never hear about the ones that drain.

Detection time is roughly `for duration + one execution cycle`. Budget accordingly.

## Recover duration

The observation window before a recovery is declared. Default `0` — recovery as soon as the
condition stops matching.

This is the field to reach for when an alert flaps. With `recover duration = 300`, after the
condition stops matching the rule keeps watching for five minutes; if the condition comes back
during that window, nothing happens and the alert simply stays firing.

Note what this actually gates: **no recovery event is produced at all** during the window. The alert
stays active in the event list, not just quiet. That is usually the honest representation of a
metric that is oscillating.

## How recovery is decided

For a Prometheus-type rule, recovery means one thing: **the query stopped returning that series**.
Since the threshold is inside the PromQL, a series that drops below the threshold is no longer
returned, which is indistinguishable from the exporter going away. Both recover the alert.

Log-type and SQL-type rules judge the threshold in Nightingale rather than in the data source, so
they can tell those two cases apart, and they expose a **Recovery configuration** dropdown on each
trigger condition:

| Option | Recovers when | If the query returns nothing |
|---|---|---|
| No data is considered recovered | The condition stops matching, **or** the query returns nothing | Recovers |
| Recover only when data exists and the trigger condition is not met | A row comes back and does not meet the condition | **Stays firing** |
| Recover only when the result meets the custom condition | A row comes back and matches an expression you write | **Stays firing** |

**Which one is preselected depends on the data source type.** Sources classified as log stores —
Elasticsearch, OpenSearch, VictoriaLogs, Loki, ClickHouse and Doris — default to the first, because
finding no error lines usually does mean the problem is over. Everything else defaults to the
second, because a database you cannot reach is not a database that is healthy.

ClickHouse and Doris count as log stores here even when you are running a SQL rule against them, so
check that dropdown rather than assuming.

### Asymmetric thresholds

The third option takes a recovery expression with the same syntax as the trigger. This is the
standard cure for flapping, and it does something a recover duration cannot: it separates the two
thresholds.

```
Trigger      $A.value > 90
Recovery     $A.value < 80
```

Between 80 and 90 the alert neither fires again nor recovers — it just stays as it is until the
metric commits to one side. An unparseable recovery expression is treated as "not recovered", with
no visible error, so verify it with [Test fire](./test-fire.md).

### Alerting on the data disappearing

Log and SQL rules also have a separate **No data** switch on the alert conditions step: alert when
data that used to be there is no longer returned, and recover when it comes back. It has its own
severity and its own auto-recovery timeout.

Prometheus-type rules do not have this switch. Write a separate rule for it —
`up == 0`, or `target_up == 0` for Categraf.

## Recovery and repeat notifications

Three more fields in step 4 decide what happens after the event exists:

| Field | Default | Effect |
|---|---|---|
| Recovered | on | Whether a recovery notification is sent at all. Turning it off does not stop the event from recovering — it just goes quiet |
| Repeat interval (mins) | 60 | How long before an unrecovered alert notifies again. `0` means never repeat |
| Max send times | 0 | How many notifications one event may produce in total. `0` means no limit |

A trap worth knowing: **disabling a rule that is currently firing means you never get the recovery
notification**, because a disabled rule produces no events of any kind. For a temporary silence use
a [mute rule](../events/mute-rules.md) instead.

## Choosing a set of values

Three combinations that hold up in practice:

**Something is down.** Frequency `@every 30s`, for duration `0`, recover duration `0`. You want to
know immediately and you want the recovery immediately.

**A resource is under pressure.** Frequency `@every 60s`, for duration `180`, recover duration
`300`. Three minutes of sustained pressure is worth a message; five minutes of calm before you call
it over.

**A rate crosses a line.** Frequency `@every 60s`, for duration `120`, and — on rule types that
support it — an asymmetric recovery condition rather than a recover duration.

When the numbers are not doing what you expect, the answer is in
[the evaluation records](./execution-records.md): every cycle logs whether the condition matched and
which stage the event stopped at.

## Next

- The state machine these fields drive: [Evaluation, recovery and state changes](../concepts/evaluation.md)
- When it will not stop: [Why does an alert fire repeatedly or never recover?](../troubleshooting/alert-flapping.md)
- When it never starts: [Alert rule does not fire](../troubleshooting/alert-not-firing.md)
