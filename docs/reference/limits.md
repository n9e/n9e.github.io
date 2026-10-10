---
title: "Limits and defaults"
sidebar_label: "Limits and defaults"
description: "Hard limits, soft limits and default sizes: queue lengths, timeouts, retention."
---

The numbers you can ignore until scale finds them. The full set is in
[Configuration reference](./configuration.md).

## HTTP

| Item | Default | Key |
|---|---:|---|
| Request body limit | 64 MiB | `[HTTP] MaxContentLength` |
| Read timeout | 20s | `[HTTP] ReadTimeout` |
| Write timeout | 40s | `[HTTP] WriteTimeout` |
| Idle timeout | 120s | `[HTTP] IdleTimeout` |
| Graceful shutdown | 30s | `[HTTP] ShutdownTimeout` |

Bulk-importing alert rules or a large dashboard JSON is what usually meets the body limit first.

## Metadata database

| Item | Default | Key |
|---|---:|---|
| Max open connections | 150 | `[DB] MaxOpenConns` |
| Max idle connections | 50 | `[DB] MaxIdleConns` |
| Max connection lifetime | 7200s | `[DB] MaxLifetime` |

Multiply by the number of instances and stay under the database's own `max_connections`.

## Embedded TSDB

| Item | Default | Key |
|---|---:|---|
| Retention | 15d | `[EmbeddedTSDB] RetentionDuration` |
| Disk cap | 10 GiB | `[EmbeddedTSDB] MaxBytes` |
| Query timeout | 1m | `[EmbeddedTSDB] QueryTimeout` |

Past `MaxBytes`, **the oldest blocks are deleted first**.

The real limit is not any of these numbers: it is that the data lives on **one Center process's
local disk**, so several replicas each hold a fragment. Useful to roughly 100k active series;
past that, use an external store. See
[Embedded TSDB single-Center limits](../operations/embedded-tsdb-limits.md).

## Ingest and forwarding

| Item | Default | Key |
|---|---:|---|
| Forward queue length | 1000000 | `[Pushgw] QueueMaxSize` |
| Forward request timeout | 10000ms | `[[Pushgw.Writers]] Timeout` |
| Dial timeout | 3000ms | `[[Pushgw.Writers]] DialTimeout` |

A full queue drops data. A queue length that keeps climbing toward the cap means the downstream TSDB
cannot keep up; watching `n9e_alert_alert_queue_size` and friends catches it earlier — see
[Built-in metrics](./built-in-metrics.md).

## Rule evaluation

| Item | Default | Where |
|---|---|---|
| Execution frequency | `@every 60s` | Rule form |
| For duration | 60s | Rule form |
| Recover duration | 0 (immediate) | Rule form |
| Repeat interval | 60 minutes | Rule form |
| Max send times | 0 (unlimited) | Rule form |

## Data retention

| Data | Kept for | Key |
|---|---:|---|
| Notification records | 7 days | `[Center] CleanNotifyRecordDay` |
| Workflow execution records | 7 days | built into the cleanup job |
| Embedded TSDB samples | 15 days | `[EmbeddedTSDB] RetentionDuration` |
| Historical alert events | forever by default | `[Center] CleanAlertHisEventDay` |

**Historical alert events are kept forever unless you say otherwise.** The knob exists but ships
commented out, and `<= 0` means keep forever. Set `CleanAlertHisEventDay` to a number of days and a
daily 02:00 job deletes older events in batches — otherwise plan for that table's growth.

## Related

- [Configuration reference](./configuration.md)
- [Capacity planning](../operations/capacity.md)
- [Performance and backlog symptoms](../troubleshooting/performance.md)
