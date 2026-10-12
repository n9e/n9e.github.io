# Why are evaluation records missing or dropped?

Missing evaluation records mean one of four things: not recorded, not evaluated, query rejected or cycle skipped; overload and datasource timeouts are the usual causes.

Last reviewed 2026-10-10

The evaluation records on the rule page have holes in them: some cycles are there, some are not, or a whole stretch is blank. Those records are the only forensic trace of "there was data and it did not alert" — without them, troubleshooting has nothing to hold on to.

**A missing record does not mean the evaluation did not run.** Separate those two first, or you will investigate entirely the wrong thing.

## First: "no record" or "no evaluation"[​](#first-no-record-or-no-evaluation "Direct link to First: \"no record\" or \"no evaluation\"")

| Symptom                                       | What it means                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Records present, events stopped at some stage | Evaluation is fine — go to [Why does the alert not fire when the query returns results?](https://n9e.github.io/docs/troubleshooting/alert-not-firing.md) |
| The API returns `"enabled": false`            | The evaluation-record feature is turned off; evaluation is unaffected                                                                                    |
| Records scattered, `truncated` is true        | Evaluation is fine; the record itself was degraded or dropped                                                                                            |
| No records at all and `instances` is empty    | **No engine is running this rule** — that is a real evaluation problem                                                                                   |

The last one is covered by "The rule is never evaluated" in [Why does the alert not fire when the query returns results?](https://n9e.github.io/docs/troubleshooting/alert-not-firing.md). The other three are this page.

## What the records are and where they live[​](#what-the-records-are-and-where-they-live "Direct link to What the records are and where they live")

Evaluation records are **not in the database**. Each alerting engine writes them as JSONL on its own local disk, rotated hourly and gzipped on the hour:

```
<Dir>/<rule id>_<datasource id>/2026-09-03/21.jsonl.gz
```

`Dir` defaults to `evallog` under `[Log] Dir`. Two direct consequences:

* **replace the engine instance, or wipe that machine's disk, and the history is gone** — there is no replica;
* the center fetches records by asking the engine that owns the data source, chosen through the hash ring, so **an unreachable engine means no records**; the API's `note` tells you that you can read them locally on that node instead.

Everything is configured under `[Alert.EvalLog]`, which ships fully commented out (i.e. enabled by default):

```
# [Alert.EvalLog]

# Disable = false

# Dir = "logs/evallog"

# RetentionHours = 192

# MaxSeriesPerQuery = 100

# MaxPointsPerSeries = 60

# MaxRecordBytes = 262144

# PerRuleDailyMB = 1024

# QueueSize = 512

# MaxDiskGB = 20

# MaxQueryBytes = 33554432

# MaxConcurrentQueries = 2
```

## Four kinds of "missing", and how to confirm each[​](#four-kinds-of-missing-and-how-to-confirm-each "Direct link to Four kinds of \"missing\", and how to confirm each")

### The feature is off[​](#the-feature-is-off "Direct link to The feature is off")

The cheapest one. The API returns `{"list": [], "enabled": false}` — **not an error, an explicit statement that it is disabled**. Set `[Alert.EvalLog] Disable` back to `false` and restart the engine.

### The write queue is full, or the disk will not take writes[​](#the-write-queue-is-full-or-the-disk-will-not-take-writes "Direct link to The write queue is full, or the disk will not take writes")

Read this counter:

```
curl -s http://127.0.0.1:17000/metrics | grep n9e_alert_eval_log_drop_total
```

If it climbs, records really are being dropped. Two causes, distinguishable in the log:

```
evallog write path degraded (<reason>): dropping eval records for <rule>, 128 dropped since degradation began; check disk space/health of <dir>

evallog write path recovered, 128 records were dropped during degradation
```

After a write failure there is a **30-second cooldown** during which records are discarded outright, so one disk hiccup wipes out a whole stretch rather than a record or two. When you see `degraded`, go check space and health on the disk holding that directory.

The queue length is `QueueSize` (512 by default). It doubles as the memory ceiling: when the disk stalls, this is what holds records in memory, roughly 200 KB each at the default caps.

### One record was too big and got degraded step by step[​](#one-record-was-too-big-and-got-degraded-step-by-step "Direct link to One record was too big and got degraded step by step")

A record has a hard `MaxRecordBytes` ceiling (256 KB by default). Over it, content is **cut in stages** rather than the record being thrown away:

1. drop all series samples (`series`);
2. blank each event's tags and detail, keeping only the hash and the stage;
3. drop `anomalies` too, and truncate the query text and error message to 512 bytes;
4. still over — only then is the record dropped and `n9e_alert_eval_log_drop_total` incremented.

Any of these sets `truncated` to true on the record. **So "the record is there but has no series data" is not a bug** — that rule simply returns too many series per query. To keep the evidence, raise `MaxRecordBytes`, or lower `MaxSeriesPerQuery` (default 100) and `MaxPointsPerSeries` (default 60) so records are small to begin with.

There is one more budget, per rule per day: `PerRuleDailyMB` (default 1024). Once it is exceeded, that rule writes **summary-only records for the rest of the day** and series quietly disappear.

### Retention or the disk budget cleaned them up[​](#retention-or-the-disk-budget-cleaned-them-up "Direct link to Retention or the disk budget cleaned them up")

The cleaner runs every 10 minutes and does two passes: delete date directories and hour files older than `RetentionHours` (192 hours, i.e. 8 days), then delete the oldest hour buckets until the total is under `MaxDiskGB` (20 by default).

The matching log lines:

```
evallog clean: disk budget exceeded, pruned to 21474836480 bytes

evallog clean: still 25769803776 bytes after pruning all closed hour files, budget 21474836480; lower PerRuleDailyMB / MaxSeriesPerQuery or raise MaxDiskGB
```

The second line is a hard signal: **the currently open hour files alone exceed the budget**, so deleting older data cannot help. Do what the message says.

## The read side: not missing, just rejected[​](#the-read-side-not-missing-just-rejected "Direct link to The read side: not missing, just rejected")

Queries have their own concurrency gate, and the two error strings differ so you can tell which layer refused you:

* engine side: `evallog is busy: too many concurrent eval-record queries on this engine instance, please retry`
* center side: `too many concurrent eval-record queries on this center instance, please retry`

**Neither returns an empty list** — by design, a retryable error beats an empty result, because an empty list reads as "nothing was evaluated then". The counter is `n9e_alert_eval_log_query_reject_total`, which has nothing to do with the write-side drop counter.

A result can also be truncated for size, and the API's `note` says so:

```
result truncated by the per-query byte budget ([Alert.EvalLog] MaxQueryBytes = 33554432): ...
```

Narrow the time range, or raise `MaxQueryBytes` — the cost is heap on that engine, roughly `MaxConcurrentQueries × MaxQueryBytes × 3.7`, and it must stay under the center's 48 MB per-node response cap.

## Skipped evaluation cycles: no metric will tell you[​](#skipped-evaluation-cycles-no-metric-will-tell-you "Direct link to Skipped evaluation cycles: no metric will tell you")

If the previous cycle is still running when the next one is due, the scheduler **skips that cycle entirely**. This path emits **neither a log line nor a metric**; you can only infer it:

```
curl -s http://127.0.0.1:17000/metrics | grep -E 'n9e_alert_rule_eval_total|n9e_alert_rule_eval_duration_ms'
```

If `n9e_alert_rule_eval_total` grows more slowly than "rule count ÷ interval" implies, and a few rules show a high `n9e_alert_rule_eval_duration_ms`, cycles are being skipped. The fix is in [Why is Nightingale slow or backlogged?](https://n9e.github.io/docs/troubleshooting/performance.md).

While you are here: a query **error** and an **empty** query result are two very different things inside the engine. On an error, the whole judgement and recovery step for that cycle is skipped — firing events are neither refreshed nor recovered. An empty-but-successful result runs the recovery logic normally. A negative `n9e_alert_eval_query_series_count` is the error marker: `-1` query failed, `-2` the data source or client could not be obtained, `-3` the query template failed to render.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The rule ID, data source ID, and the `enabled` / `truncated` / `note` fields from the API response;
2. `curl -s http://127.0.0.1:17000/metrics | grep -E 'n9e_alert_eval_log_'`;
3. Every log line starting with `evallog `;
4. `df -h` for the disk holding the directory, and `du -sh <Dir>`.

**Redacting**: the log lines carry rule names and directory paths — replace any site or product name embedded in a path.

## Next[​](#next "Direct link to Next")

* Records are there but no event appeared: [Why does the alert not fire when the query returns results?](https://n9e.github.io/docs/troubleshooting/alert-not-firing.md)
* Slow engine, growing queues: [Why is Nightingale slow or backlogged?](https://n9e.github.io/docs/troubleshooting/performance.md)
* How to read the records page: [Evaluation execution records](https://n9e.github.io/docs/alerting/execution-records.md)
* The judgement model: [Evaluation, recovery and state changes](https://n9e.github.io/docs/concepts/evaluation.md)
