---
title: "Logs and diagnostic bundles"
sidebar_label: "Logs and diagnostic bundles"
description: "Four sources when Nightingale itself misbehaves: the process log, evaluation records, /metrics and pprof — collect all four before opening an issue."
last_reviewed: 2026-10-10
---

There are four sources of information when Nightingale itself misbehaves: the process log, the
evaluation records, `/metrics`, and pprof. This page covers where each one is, how to turn it on,
and which of them to bundle into an issue report.

## Logs: decide where they go first

```toml
[Log]
Dir = "logs"
Level = "INFO"     # DEBUG INFO WARNING ERROR
Output = "stdout"  # stdout stderr file
```

**The default is `stdout`**, which is usually what you want under a container runtime or systemd,
where journald or the runtime takes over log handling.

Switching to `file` has a trap: **a rotation policy is mandatory**. `KeepHours` (rotate by time) and
`RotateNum` (rotate by count) cannot both be 0, or the process fails at startup with
`KeepHours and Rotatenum both are 0`.

```toml
[Log]
Dir = "logs"
Output = "file"
# pick one
KeepHours = 24
# RotateNum = 3
# RotateSize = 256   # MB, used with RotateNum
```

`DEBUG` shows the detail of every evaluation, but the volume is very high — **put it back
afterwards**.

`[HTTP] PrintAccessLog` is `false` by default. Turn it on only when you need HTTP access logs, and
off again when done.

## Following one request by trace ID

Every HTTP request gets a trace ID — from the `X-Trace-Id` header, or generated — and every log line
along that request carries a `trace_id=<id>` prefix.

Nightingale ships a viewer for it; open in a browser:

```
http://n9e:17000/api/n9e/trace-logs/<trace-id>
```

It searches every `*.log*` file under `[Log] Dir`, rotated ones included, for `trace_id=<id>`, and
in a cluster it asks each of the other instances in the same engine cluster in turn until it finds
which one served that trace.

This requires **`[Log] Output` to be `file`** — with stdout there is no file on disk to search. One
search gets a 10-second budget and at most 5000 lines; going over is reported explicitly as
truncated rather than passed off as "not found".

## Evaluation records: why a rule did not fire

This is the primary evidence for "the expression returns data on the query page but the rule never
alerts". One record is written per evaluation cycle, holding what was queried, how many series came
back, the sample points of each, which crossed the threshold, and what happened to each event
afterwards — muted, dropped by a pipeline, still pending, or actually delivered.

Records are written to the **alerting engine's local disk**, by default under
`<[Log] Dir>/evallog`, organised as `{rule_id}_{datasource_id}/{date}/{hour}.jsonl` and gzipped once
the hour is over.

The UI entry point is under **Alerts & Notifications → Alert rules**, in the row's operations
column.

The settings live in the `[Alert.EvalLog]` section of `etc/config.toml` (all commented out by
default):

| Setting | Default | Meaning |
|---|---|---|
| `Disable` | `false` | On by default |
| `Dir` | `<[Log] Dir>/evallog` | Where records land |
| `RetentionHours` | 192 | Keep 8 days |
| `MaxDiskGB` | 20 | Total disk ceiling |
| `PerRuleDailyMB` | 1024 | Daily write budget per rule; past it, records degrade to summaries |
| `MaxSeriesPerQuery` | 100 | Series recorded per query |
| `MaxPointsPerSeries` | 60 | Points recorded per series |
| `QueueSize` | 512 | Write queue depth |

Records are dropped when the queue is full or the disk cannot keep up, counted by
`n9e_alert_eval_log_drop_total`. If that is climbing, your records are incomplete — do not read
"absent from the records" as "did not happen".

## Runtime diagnostics

**pprof** (`[HTTP] PProf`, `true` by default in `etc/config.toml`, `false` in
`etc/edge/edge.toml`):

```bash
# 30-second CPU profile
curl --noproxy '*' -o cpu.pprof 'http://n9e:17000/api/debug/pprof/profile?seconds=30'
# heap
curl --noproxy '*' -o heap.pprof 'http://n9e:17000/api/debug/pprof/heap'
# goroutine stacks, plain text and readable as is
curl --noproxy '*' 'http://n9e:17000/api/debug/pprof/goroutine?debug=2' > goroutine.txt

go tool pprof -http=:8080 cpu.pprof
```

The pprof endpoints require **no authentication**, so keep them off in production and turn them on
for the duration of an investigation.

**`/dumper/sync`** answers "I changed something in the UI, why did nothing happen". It lists, per
config type, the last two sync attempts with their time, duration, row count and result.

```bash
curl --noproxy '*' http://127.0.0.1:17000/dumper/sync
```

It **only accepts local requests**, so run it on the host running Nightingale. A category stuck at
`not changed` when you know you changed something means the change never reached the database, or
you are not connected to the instance you think you are.

## What to collect before opening an issue

Sending all of this at once saves a round trip:

1. **Versions.** Backend from `./n9e --version` or
   `curl --noproxy '*' http://n9e:17000/api/n9e/version`; the frontend version is on
   **System → About**. Include both.
2. **Deployment shape.** How many `n9e` instances, whether there is an edge, whether metadata is in
   MySQL / PostgreSQL / SQLite, and whether the TSDB is the embedded one or external.
3. **The config file.** `etc/config.toml`, with **the DSN password, channel tokens and LLM API keys
   removed first**.
4. **The startup lines.** The process prints `runner.cwd`, `runner.hostname`, `runner.fd_limits` and
   `runner.vm_limits` at boot; file-descriptor and memory-limit problems show up there.
5. **Logs covering the reproduction window.** Better still, reproduce once at `DEBUG`.
6. **A `/metrics` snapshot**: `curl --noproxy '*' http://n9e:17000/metrics > metrics.txt`.
7. **If a rule is not firing**: that rule's evaluation records, exported or screenshotted, plus the
   rule configuration itself.

Issues go to [ccfos/nightingale](https://github.com/ccfos/nightingale/issues).

## Related

- [Built-in metrics and health checks](./health.md)
- [Inspect evaluation execution records](../alerting/execution-records.md)
- [A rule is not firing](../troubleshooting/alert-not-firing.md)
