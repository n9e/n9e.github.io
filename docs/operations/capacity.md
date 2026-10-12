# Capacity planning

Load is driven by rule count, series count, event volume and database traffic; measure four numbers to know where to scale — there is deliberately no sizing table.

Last reviewed 2026-10-10

This page does not give you a "X cores and Y GB run Z rules" table — the last section explains why. What it gives instead is **four numbers you can measure directly**, and where to scale when each one approaches its limit. Measuring your own environment beats copying someone else's spec sheet.

## What consumes what[​](#what-consumes-what "Direct link to What consumes what")

| Resource          | Driven mainly by                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| CPU               | Rule count × evaluation frequency, and how many series each evaluation returns                                |
| Memory            | Cached config (rules, targets, users) + series returned by evaluations + samples and events sitting in queues |
| Metadata database | Event writes, notification record writes, and every cache's 9-second sync query                               |
| Disk              | Embedded TSDB blocks, evaluation records, logs                                                                |
| Outbound network  | One data source query per evaluation, plus samples forwarded to the TSDB                                      |

Note that **most of the evaluation cost is not on Nightingale's side**: a rule that queries Prometheus once a minute puts the bulk of the load on Prometheus. Past a certain rule count, the data source usually gives out before Nightingale does.

## Measure these four[​](#measure-these-four "Direct link to Measure these four")

All of them are on `/metrics`; `curl --noproxy '*' http://n9e:17000/metrics` gets you there.

### 1. Active series[​](#1-active-series "Direct link to 1. Active series")

```
prometheus_tsdb_head_series
```

Only present on a Center with the embedded TSDB on, where it is the real count of currently active series. With an external store, read the equivalent metric there.

**Reference ceiling**: the embedded store suits up to about 100k active series; past that, move to an external one. That boundary comes from the product itself — it is in the `[EmbeddedTSDB]` comments in `etc/config.toml`.

### 2. Evaluation cost[​](#2-evaluation-cost "Direct link to 2. Evaluation cost")

```
n9e_alert_rule_eval_total                        # total evaluations, no labels

n9e_alert_rule_eval_duration_ms{rule_id="..."}   # last evaluation duration per rule
```

Sort `rule_eval_duration_ms` by `rule_id` and look at the top ten — those are your cost centres. When **one rule's evaluation time approaches its own execution frequency** (`@every 60s` by default), that rule no longer fits in its slot.

The fix is usually the rule, not the hardware: lower the frequency, narrow the query, or aggregate before returning ten thousand series.

### 3. Database connections[​](#3-database-connections "Direct link to 3. Database connections")

```
n9e_db_pool_in_use_connections     # connections currently in use

n9e_db_pool_wait_count_total       # how many times something waited for one

n9e_db_pool_wait_duration_seconds_total
```

`in_use` sitting against `[DB] MaxOpenConns` (150 by default) while `wait_count_total` climbs means the database layer is queuing. Look for slow queries first, and only then consider a larger pool.

### 4. Ingest volume and queues[​](#4-ingest-volume-and-queues "Direct link to 4. Ingest volume and queues")

```
n9e_pushgw_samples_received_total{channel="prometheus"}   # samples arriving per second

n9e_pushgw_sample_queue_size{queueid="..."}               # backlog per queue

n9e_pushgw_push_queue_error_total{queueid="..."}          # samples dropped
```

The number of queues defaults to the CPU count, and the global admission ceiling is `queues × QueueMaxSize × 0.1`. Once `push_queue_error_total` is non-zero you are genuinely losing data — see [Pushgw queue, writers and dual write](https://n9e.github.io/docs/operations/pushgw.md).

## Disk is its own calculation[​](#disk-is-its-own-calculation "Direct link to Disk is its own calculation")

Three kinds of data land on local disk, each with its own ceiling:

| Data               | Setting                                                           | Default ceiling                              |
| ------------------ | ----------------------------------------------------------------- | -------------------------------------------- |
| Embedded TSDB      | `[EmbeddedTSDB] RetentionDuration` / `MaxBytes`                   | 15 days / 10 GiB, **whichever is hit first** |
| Evaluation records | `[Alert.EvalLog] RetentionHours` / `MaxDiskGB` / `PerRuleDailyMB` | 192 hours / 20 GB / 1024 MB per rule per day |
| Logs               | `[Log] KeepHours` / `RotateNum` / `RotateSize`                    | stdout by default, so no disk usage          |

Leaving `MaxBytes` empty or `0` means the embedded TSDB has no disk limit — which in practice means until the disk is full. Do not configure it that way in production.

On the metadata database side, three tables grow over time, and their cleanup defaults differ:

| Table                      | Setting                              | Default                                                         |
| -------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| Historical alert events    | `[Center] CleanAlertHisEventDay`     | **Kept forever** (`<= 0` disables cleanup), runs daily at 02:00 |
| Notification records       | `[Center] CleanNotifyRecordDay`      | 7 days, runs daily at 01:00                                     |
| Workflow execution records | `[Center] CleanPipelineExecutionDay` | 7 days, runs daily at 06:00                                     |

**Historical alert events are not cleaned up by default.** In a high-event environment, set a retention before you go live, or that table grows without bound.

## Where to scale[​](#where-to-scale "Direct link to Where to scale")

Find which of the numbers topped out first; adding machines does not solve every case.

| What topped out                           | What to do                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Evaluation cost (rules no longer fit)     | Add `n9e` instances — rules redistribute onto them automatically                                                                   |
| Evaluation cost (a handful of slow rules) | Fix those rules; hardware will not help                                                                                            |
| Active series                             | Move to an external TSDB — see [Embedded TSDB single-Center limits](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md) |
| Ingest volume                             | Split out `n9e-pushgw`, or add `n9e` instances behind a load balancer                                                              |
| Database queuing                          | Find slow queries, then raise `[DB] MaxOpenConns`, and only then resize the database                                               |
| Disk                                      | Shorten retention, or move off the embedded TSDB                                                                                   |
| Slow UI while evaluation is fine          | Split out `n9e-alert` so evaluation and the web tier stop competing for CPU                                                        |

One cost that is easy to miss: Pushgw exposes one `n9e_pushgw_sample_received_by_ident{host_ident="..."}` series on its own `/metrics` for **every monitored host**. At ten thousand hosts that single metric is ten thousand series, and there is no switch to turn it off — budget for it when you scrape Nightingale's own metrics.

## Why there is no sizing table here[​](#why-there-is-no-sizing-table-here "Direct link to Why there is no sizing table here")

"N cores and M GB support K rules" only means something once you also state what data source those rules query, how many series come back, and how often they run — and those three vary by two orders of magnitude between environments. A rule matching `up == 0` and a rule scanning ten thousand series before a `topk` are not in the same cost bracket.

Publishing a number without its preconditions means someone buys hardware from it, and this page carries the blame when it does not hold. So what is here is the measurement and the direction to scale: **run it at your own scale, measure the four numbers above, and grow from there**.

## Related[​](#related "Direct link to Related")

* [Production topology](https://n9e.github.io/docs/operations/topology.md)
* [High availability and failure domains](https://n9e.github.io/docs/operations/high-availability.md)
* [Pushgw queue, writers and dual write](https://n9e.github.io/docs/operations/pushgw.md)
* [Built-in metrics and health checks](https://n9e.github.io/docs/operations/health.md)
