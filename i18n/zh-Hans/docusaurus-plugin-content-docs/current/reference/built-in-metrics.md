---
title: "内置指标"
sidebar_label: "内置指标"
description: "每个夜莺进程在 /metrics 上暴露的自身指标。"
last_reviewed: 2026-10-10
---

每个进程都在自己的 HTTP 端口上暴露 `/metrics`，Prometheus 格式：

```bash
curl http://n9e:17000/metrics
```

由 `[HTTP] ExposeMetrics` 控制，默认开着。

**告警系统自己挂了是不会给你发告警的**，所以这套指标该被你的监控系统抓走，
并配上规则——怎么配见[监控夜莺自身](../operations/self-monitoring.md)。

## 先看哪几个

按「出问题时最先暴露」排：

| 指标 | 说明 |
|---|---|
| `n9e_alert_rule_eval_total` / `n9e_alert_rule_eval_error_total` | 规则判定跑了多少次、错了多少次。判定停了这里最先看得出来 |
| `n9e_alert_rule_eval_duration_ms` | 单次判定耗时。数据源变慢会先反映在这里 |
| `n9e_alert_alert_queue_size` | 事件队列积压。持续增长说明下游消费不过来 |
| `n9e_alert_query_data_error_total` | 查询数据源失败次数 |
| `n9e_center_http_request_duration_seconds` | Web / API 的响应耗时 |
| `n9e_db_operation_latency_seconds` | 元数据库的操作耗时 |

## 完整清单

<!-- generated:gen-metrics-reference -->
夜莺自己的指标共 **55 条**，都在每个进程的 `/metrics` 上（`[HTTP] ExposeMetrics` 默认开）。

下面不含 Go runtime 和 process 那批——那是所有 Go 程序都有的，不是夜莺的自监控信息。

带 † 的 16 条是从源码里补的：带标签的指标在**第一次被触发之前不会出现在 `/metrics` 里**，所以一个刚起来的实例上查不到它们。这不是缺陷，配告警规则时按名字写就行。

### `n9e_alert_*`

| 指标 | 类型 | 含义 |
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

| 指标 | 类型 | 含义 |
|---|---|---|
| `n9e_center_http_request_duration_seconds` | histogram | HTTP request latencies in seconds. |
| `n9e_center_redis_operation_latency_seconds` | histogram | Histogram of latencies for Redis operations |
| `n9e_center_uptime` | counter | HTTP service uptime. |

### `n9e_cron_*`

| 指标 | 类型 | 含义 |
|---|---|---|
| `n9e_cron_duration` | gauge | Cron method use duration, unit: ms. |
| `n9e_cron_sync_number` | gauge | Cron sync number. |

### `n9e_db_*`

| 指标 | 类型 | 含义 |
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

| 指标 | 类型 | 含义 |
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

| 指标 | 类型 | 含义 |
|---|---|---|
| `n9e_sandbox_exec_active` | gauge | Currently running sandbox executions. |
<!-- /generated -->
