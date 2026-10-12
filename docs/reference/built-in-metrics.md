---
title: "Built-in metrics"
sidebar_label: "Built-in metrics"
description: "What each Nightingale process exposes about itself on /metrics."
last_reviewed: 2026-10-10
---

Every process exposes `/metrics` on its own HTTP port, in Prometheus format:

```bash
curl http://n9e:17000/metrics
```

Controlled by `[HTTP] ExposeMetrics`, which is on by default.

**An alerting system that is down will not alert you about being down**, so these should be scraped
by your monitoring and have rules on them — see
[Monitor Nightingale itself](../operations/self-monitoring.md).

## The handful to watch first

Ordered by how early they show a problem:

| Metric | Why |
|---|---|
| `n9e_alert_rule_eval_total` / `n9e_alert_rule_eval_error_total` | How many evaluations ran and how many failed. Evaluation stopping shows here first |
| `n9e_alert_rule_eval_duration_ms` | Time per evaluation. A slowing data source surfaces here |
| `n9e_alert_alert_queue_size` | Event queue backlog. Sustained growth means the downstream cannot keep up |
| `n9e_alert_query_data_error_total` | Failed data source queries |
| `n9e_center_http_request_duration_seconds` | Web and API latency |
| `n9e_db_operation_latency_seconds` | Metadata database latency |

## Full list

<!-- generated:gen-metrics-reference -->
Nightingale exposes **55 metrics of its own** on every process's `/metrics` endpoint (`[HTTP] ExposeMetrics` is on by default).

Go runtime and process metrics are left out below — every Go program has those, and they say nothing about Nightingale.

The 16 marked † come from the source rather than from a live scrape: a labelled metric **does not appear on `/metrics` until something first observes it**, so a freshly started instance will not show them. That is expected — write rules against the name regardless.

### `n9e_alert_*`

| Metric | Type | Meaning |
|---|---|---|
| `n9e_alert_alert_notify_error_total` † | counter | Number of send msg. |
| `n9e_alert_alert_notify_total` † | counter | Number of send msg. |
| `n9e_alert_alert_queue_size` | gauge | The size of alert queue. |
| `n9e_alert_alerts_total` | counter | Total number alert events. |
| `n9e_alert_eval_log_drop_total` | counter | Number of eval log records dropped (full write queue, or still oversized after full degradation). |
| `n9e_alert_eval_log_query_reject_total` | counter | Number of eval log queries rejected by the concurrency gate. |
| `n9e_alert_eval_query_series_count` | gauge | Number of series retrieved from data source after query. |
| `n9e_alert_heartbeat_error_count` † | counter | Number of heartbeat error. |
| `n9e_alert_mute_total` † | counter | Number of mute. |
| `n9e_alert_notify_record_queue_size` | gauge | The size of notify record queue. |
| `n9e_alert_query_data_error_total` † | counter | Number of rule eval query data error. |
| `n9e_alert_query_data_total` | counter | Number of rule eval query data. |
| `n9e_alert_record_eval_duration_ms` † | gauge | Duration of record eval in milliseconds. |
| `n9e_alert_record_eval_error_total` † | counter | Number of record eval errors, labeled by stage. |
| `n9e_alert_record_eval_series_count` † | gauge | Series count produced by the latest record eval; negative values encode error states. |
| `n9e_alert_record_eval_total` † | counter | Number of record eval. |
| `n9e_alert_rule_eval_duration_ms` | gauge | Duration of rule eval in milliseconds. |
| `n9e_alert_rule_eval_error_total` † | counter | Number of rule eval error. |
| `n9e_alert_rule_eval_total` | counter | Number of rule eval. |
| `n9e_alert_sub_event_total` † | counter | Number of sub event. |
| `n9e_alert_var_filling_query_total` † | counter | Number of var filling query. |

### `n9e_center_*`

| Metric | Type | Meaning |
|---|---|---|
| `n9e_center_http_request_duration_seconds` | histogram | HTTP request latencies in seconds. |
| `n9e_center_redis_operation_latency_seconds` | histogram | Histogram of latencies for Redis operations |
| `n9e_center_uptime` | counter | HTTP service uptime. |

### `n9e_cron_*`

| Metric | Type | Meaning |
|---|---|---|
| `n9e_cron_duration` | gauge | Cron method use duration, unit: ms. |
| `n9e_cron_sync_number` | gauge | Cron sync number. |

### `n9e_db_*`

| Metric | Type | Meaning |
|---|---|---|
| `n9e_db_operation_latency_seconds` | histogram | Histogram of latencies for DB operations |
| `n9e_db_operation_total` | counter | Total number of DB operations |
| `n9e_db_pool_idle_connections` | gauge | The number of idle connections |
| `n9e_db_pool_in_use_connections` | gauge | The number of connections currently in use |
| `n9e_db_pool_max_idle_closed_total` | counter | The total number of connections closed due to SetMaxIdleConns |
| `n9e_db_pool_max_idle_time_closed_total` | counter | The total number of connections closed due to SetConnMaxIdleTime |
| `n9e_db_pool_max_lifetime_closed_total` | counter | The total number of connections closed due to SetConnMaxLifetime |
| `n9e_db_pool_max_open_connections` | gauge | Maximum number of open connections to the database |
| `n9e_db_pool_open_connections` | gauge | The number of established connections both in use and idle |
| `n9e_db_pool_wait_count_total` | counter | The total number of connections waited for |
| `n9e_db_pool_wait_duration_seconds_total` | counter | The total time blocked waiting for a new connection |

### `n9e_pushgw_*`

| Metric | Type | Meaning |
|---|---|---|
| `n9e_pushgw_drop_sample_total` | counter | Number of drop sample. |
| `n9e_pushgw_forward_duration_seconds` | histogram | Forward samples to TSDB. latencies in seconds. |
| `n9e_pushgw_http_request_duration_seconds` | histogram | HTTP request latencies in seconds. |
| `n9e_pushgw_proxy_forward_error_total` † | counter | Number of forward errors on /proxy/v1/write. |
| `n9e_pushgw_proxy_forward_total` † | counter | Number of forwards performed by /proxy/v1/write. |
| `n9e_pushgw_proxy_remote_write_body_too_large_total` | counter | Number of /proxy/v1/write requests rejected with 413 due to body size over limit. |
| `n9e_pushgw_proxy_remote_write_inflight` | gauge | Current number of in-flight requests on /proxy/v1/write. |
| `n9e_pushgw_proxy_remote_write_over_limit_total` | counter | Number of /proxy/v1/write requests rejected with 429 due to in-flight over limit. |
| `n9e_pushgw_proxy_remote_write_total` | counter | Number of /proxy/v1/write requests received. |
| `n9e_pushgw_push_queue_error_total` † | counter | Number of push queue error. |
| `n9e_pushgw_push_queue_over_limit_error_total` | counter | Number of push queue over limit. |
| `n9e_pushgw_redis_operation_latency_seconds` | histogram | Histogram of latencies for Redis operations |
| `n9e_pushgw_sample_queue_size` | gauge | The size of sample queue. |
| `n9e_pushgw_sample_received_by_ident` | counter | Number of sample push by ident. |
| `n9e_pushgw_samples_received_total` | counter | Total number samples received. |
| `n9e_pushgw_write_error_total` † | counter | Number of write error. |
| `n9e_pushgw_write_total` | counter | Number of write. |

### `n9e_sandbox_*`

| Metric | Type | Meaning |
|---|---|---|
| `n9e_sandbox_exec_active` | gauge | Currently running sandbox executions. |
<!-- /generated -->
