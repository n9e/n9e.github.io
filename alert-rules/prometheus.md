# Prometheus alert rules for Prometheus: 30 rules with runbooks

30 ready-to-use Prometheus alert rules in PromQL, each with severity, duration and runbook steps. Metrics from Prometheus's own /metrics, Prometheus Operator. Download as a Prometheus rules file or import into Nightingale.

Last reviewed 2026-10-31

Rules that watch Prometheus itself: a bad configuration reload, failing or missed rule evaluations, a notification queue backing up, no connection to Alertmanager, remote write falling behind, TSDB compactions or reloads failing, scrape and label limits being hit, and the Prometheus Operator failing to reconcile. When these fire, every other alert you rely on may be silently missing, so they are worth routing to the people who own the monitoring stack rather than to application teams.

## At a glance[​](#at-a-glance "Direct link to At a glance")

* **30 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
* **Metrics from**: Prometheus's own /metrics, Prometheus Operator
* **Download**: [`prometheus.yml`](https://n9e.github.io/alert-rules/prometheus.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
* Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list[​](#rule-list "Direct link to Rule list")

| Rule                                            | Severity | For  |
| ----------------------------------------------- | -------- | ---- |
| ConfigReloaderSidecarErrors                     | Warning  | 10m  |
| PrometheusOperatorListErrors                    | Warning  | 15m  |
| PrometheusOperatorNodeLookupErrors              | Warning  | 10m  |
| PrometheusOperatorNotReady                      | Warning  | 5m   |
| PrometheusOperatorReconcileErrors               | Warning  | 10m  |
| PrometheusOperatorRejectedResources             | Warning  | 5m   |
| PrometheusOperatorSyncFailed                    | Warning  | 10m  |
| PrometheusOperatorWatchErrors                   | Warning  | 15m  |
| PrometheusBadConfig                             | Critical | 10m  |
| PrometheusDuplicateTimestamps                   | Warning  | 10m  |
| PrometheusErrorSendingAlertsToAnyAlertmanager   | Critical | 15m  |
| PrometheusErrorSendingAlertsToSomeAlertmanagers | Warning  | 15m  |
| PrometheusHighQueryLoad                         | Warning  | 15m  |
| PrometheusLabelLimitHit                         | Warning  | 15m  |
| PrometheusMissingRuleEvaluations                | Warning  | 15m  |
| PrometheusNotConnectedToAlertmanagers           | Warning  | 10m  |
| PrometheusNotificationQueueRunningFull          | Warning  | 15m  |
| PrometheusNotIngestingSamples                   | Warning  | 10m  |
| PrometheusOutOfOrderTimestamps                  | Warning  | 10m  |
| PrometheusRemoteStorageFailures                 | Critical | 15m  |
| PrometheusRemoteWriteBehind                     | Critical | 15m  |
| PrometheusRemoteWriteDesiredShards              | Warning  | 15m  |
| PrometheusRuleFailures                          | Critical | 15m  |
| PrometheusScrapeBodySizeLimitHit                | Warning  | 15m  |
| PrometheusScrapeSampleLimitHit                  | Warning  | 15m  |
| PrometheusSDRefreshFailure                      | Warning  | 20m  |
| PrometheusTargetLimitHit                        | Warning  | 15m  |
| PrometheusTargetSyncFailure                     | Critical | 5m   |
| PrometheusTSDBCompactionsFailing                | Warning  | 240m |
| PrometheusTSDBReloadsFailing                    | Warning  | 240m |

## Prometheus self-monitoring (30)[​](#prometheus-self-monitoring-30 "Direct link to Prometheus self-monitoring (30)")

### ConfigReloaderSidecarErrors[​](#configreloadersidecarerrors "Direct link to ConfigReloaderSidecarErrors")

Errors encountered while the {{$labels.pod}} config-reloader sidecar attempts to sync config in {{$labels.namespace}} namespace. As a result, configuration for service running in {{$labels.pod}} may be stale and cannot be updated anymore.

Warning · 10m · Trigger:

```
max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0
```

Runbook:

1. Run kubectl logs \<pod> -c config-reloader -n \<ns> for the specific error;
2. It is usually a config syntax error causing the reload to be rejected;
3. Validate with promtool check config / amtool check-config;
4. After fixing, confirm the reload succeeded and verify the new config on Prometheus's /config page.

### PrometheusOperatorListErrors[​](#prometheusoperatorlisterrors "Direct link to PrometheusOperatorListErrors")

Errors while performing List operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

Warning · 15m · Trigger:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[10m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_total{job="prometheus-operator",namespace="monitoring"}[10m]))) > 0.4
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

### PrometheusOperatorNodeLookupErrors[​](#prometheusoperatornodelookuperrors "Direct link to PrometheusOperatorNodeLookupErrors")

Errors while reconciling Prometheus in {{ $labels.namespace }} Namespace.

Warning · 10m · Trigger:

```
rate(prometheus_operator_node_address_lookup_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]) > 0.1
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

### PrometheusOperatorNotReady[​](#prometheusoperatornotready "Direct link to PrometheusOperatorNotReady")

Prometheus operator in {{ $labels.namespace }} namespace isn't ready to reconcile {{ $labels.controller }} resources.

Warning · 5m · Trigger:

```
min by (cluster,controller,namespace) (max_over_time(prometheus_operator_ready{job="prometheus-operator",namespace="monitoring"}[5m]) == 0)
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

### PrometheusOperatorReconcileErrors[​](#prometheusoperatorreconcileerrors "Direct link to PrometheusOperatorReconcileErrors")

{{ $value | humanizePercentage }} of reconciling operations failed for {{ $labels.controller }} controller in {{ $labels.namespace }} namespace.

Warning · 10m · Trigger:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]))) / (sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.1
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

### PrometheusOperatorRejectedResources[​](#prometheusoperatorrejectedresources "Direct link to PrometheusOperatorRejectedResources")

Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf "%0.0f" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources.

Warning · 5m · Trigger:

```
min_over_time(prometheus_operator_managed_resources{state="rejected",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

### PrometheusOperatorSyncFailed[​](#prometheusoperatorsyncfailed "Direct link to PrometheusOperatorSyncFailed")

Controller {{ $labels.controller }} in {{ $labels.namespace }} namespace fails to reconcile {{ $value }} objects.

Warning · 10m · Trigger:

```
min_over_time(prometheus_operator_syncs{status="failed",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

### PrometheusOperatorWatchErrors[​](#prometheusoperatorwatcherrors "Direct link to PrometheusOperatorWatchErrors")

Errors while performing watch operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

Warning · 15m · Trigger:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[5m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.4
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

### PrometheusBadConfig[​](#prometheusbadconfig "Direct link to PrometheusBadConfig")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration.

Critical · 10m · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

max_over_time(prometheus_config_last_reload_successful{job="prometheus-k8s",namespace="monitoring"}[5m]) == 0
```

Runbook:

1. Find the config parse error line in kubectl logs or the instance log;
2. Validate locally with promtool check config prometheus.yml;
3. On Kubernetes the config is usually generated by the Operator — check ServiceMonitor/PrometheusRule for invalid fields;
4. After fixing, confirm /-/reload succeeded and the /config page shows the new configuration.

### PrometheusDuplicateTimestamps[​](#prometheusduplicatetimestamps "Direct link to PrometheusDuplicateTimestamps")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with different values but duplicated timestamp.

Warning · 10m · Trigger:

```
rate(prometheus_target_scrapes_sample_duplicate_timestamp_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the duplicated targets on the /targets page (the same instance appearing under several jobs);
2. Check whether ServiceMonitor/PodMonitor selectors are too broad and overlapping;
3. Tighten the selectors so each target is scraped by exactly one job;
4. After fixing, confirm the discard counter stops growing.

### PrometheusErrorSendingAlertsToAnyAlertmanager[​](#prometheuserrorsendingalertstoanyalertmanager "Direct link to PrometheusErrorSendingAlertsToAnyAlertmanager")

{{ printf "%.1f" $value }}% minimum errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to any Alertmanager.

Critical · 15m · Trigger:

```
min without (alertmanager) (

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

)

* 100

> 3
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

### PrometheusErrorSendingAlertsToSomeAlertmanagers[​](#prometheuserrorsendingalertstosomealertmanagers "Direct link to PrometheusErrorSendingAlertsToSomeAlertmanagers")

{{ printf "%.1f" $value }}% errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to Alertmanager {{$labels.alertmanager}}.

Warning · 15m · Trigger:

```
(

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring"}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring"}[5m])

)

* 100

> 1
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

### PrometheusHighQueryLoad[​](#prometheushighqueryload "Direct link to PrometheusHighQueryLoad")

Prometheus {{$labels.namespace}}/{{$labels.pod}} query API has less than 20% available capacity in its query engine for the last 15 minutes.

Warning · 15m · Trigger:

```
avg_over_time(prometheus_engine_queries{job="prometheus-k8s",namespace="monitoring"}[5m]) / max_over_time(prometheus_engine_queries_concurrent_max{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0.8
```

Runbook:

1. Check the query engine concurrency and queue metrics on the /status page;
2. Use topk-style queries or the query log to find the heaviest queries;
3. The usual root causes are high-cardinality labels and over-wide time ranges — narrow the range and reduce group by dimensions;
4. If it stays high after tuning, scale Prometheus or use federation/sharding.

### PrometheusLabelLimitHit[​](#prometheuslabellimithit "Direct link to PrometheusLabelLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because some samples exceeded the configured label\_limit, label\_name\_length\_limit or label\_value\_length\_limit.

Warning · 15m · Trigger:

```
increase(prometheus_target_scrape_pool_exceeded_label_limits_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the rejected targets and the specific reason on the /targets page;
2. On the target side, work out why the label count is so high — usually high-cardinality data (user ID, request ID) was made into labels;
3. Fix the metric design at the source, or drop the excess labels with metric\_relabel\_configs;
4. If more labels are genuinely needed, raise label\_limit after assessing the cardinality impact.

### PrometheusMissingRuleEvaluations[​](#prometheusmissingruleevaluations "Direct link to PrometheusMissingRuleEvaluations")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has missed {{ printf "%.0f" $value }} rule group evaluations in the last 5m.

Warning · 15m · Trigger:

```
increase(prometheus_rule_group_iterations_missed_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Check the log for rule evaluation timeout errors;
2. Find the rule group with the longest evaluation time, usually recording rules with heavy queries;
3. Split the rule group, lengthen evaluation\_interval, or optimise the queries in the rules;
4. If resources are short, scale Prometheus.

### PrometheusNotConnectedToAlertmanagers[​](#prometheusnotconnectedtoalertmanagers "Direct link to PrometheusNotConnectedToAlertmanagers")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers.

Warning · 10m · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

max_over_time(prometheus_notifications_alertmanagers_discovered{job="prometheus-k8s",namespace="monitoring"}[5m]) < 1
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

### PrometheusNotificationQueueRunningFull[​](#prometheusnotificationqueuerunningfull "Direct link to PrometheusNotificationQueueRunningFull")

Alert notification queue of Prometheus {{$labels.namespace}}/{{$labels.pod}} is running full.

Warning · 15m · Trigger:

```
# Without min_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  predict_linear(prometheus_notifications_queue_length{job="prometheus-k8s",namespace="monitoring"}[5m], 60 * 30)

>

  min_over_time(prometheus_notifications_queue_capacity{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

### PrometheusNotIngestingSamples[​](#prometheusnotingestingsamples "Direct link to PrometheusNotIngestingSamples")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not ingesting samples.

Warning · 10m · Trigger:

```
(

  rate(prometheus_tsdb_head_samples_appended_total{job="prometheus-k8s",namespace="monitoring"}[5m]) <= 0

and

  (

    sum without(scrape_job) (prometheus_target_metadata_cache_entries{job="prometheus-k8s",namespace="monitoring"}) > 0

  or

    sum without(rule_group) (prometheus_rule_group_rules{job="prometheus-k8s",namespace="monitoring"}) > 0

  )

)
```

Runbook:

1. Check on the /targets page whether every target is down;
2. Check that service discovery is working (the /service-discovery page);
3. If a config error left the target list empty, treat it as a configuration problem;
4. This is total monitoring blindness and should be the highest priority.

### PrometheusOutOfOrderTimestamps[​](#prometheusoutofordertimestamps "Direct link to PrometheusOutOfOrderTimestamps")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with timestamps arriving out of order.

Warning · 10m · Trigger:

```
rate(prometheus_target_scrapes_sample_out_of_order_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Identify which target is reporting out-of-order data;
2. The usual root causes are an unsynchronised clock on the target, or metrics aggregated from multiple sources with mixed timestamps;
3. Correct the target machine's clock first (chronyc);
4. For Pushgateway-style setups, review how the pusher handles timestamps.

### PrometheusRemoteStorageFailures[​](#prometheusremotestoragefailures "Direct link to PrometheusRemoteStorageFailures")

Prometheus {{$labels.namespace}}/{{$labels.pod}} failed to send {{ printf "%.1f" $value }}% of the samples to {{ $labels.remote\_name}}:{{ $labels.url }}

Critical · 15m · Trigger:

```
(

  (rate(prometheus_remote_storage_failed_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

/

  (

    (rate(prometheus_remote_storage_failed_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

  +

    (rate(prometheus_remote_storage_succeeded_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

  )

)

* 100

> 1
```

Runbook:

1. Check the Prometheus log for remote\_write or tsdb errors;
2. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
3. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
4. Confirm the queue backlog is draining; if not, raise queue\_config or reduce the write volume.

### PrometheusRemoteWriteBehind[​](#prometheusremotewritebehind "Direct link to PrometheusRemoteWriteBehind")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf "%.1f" $value }}s behind for {{ $labels.remote\_name}}:{{ $labels.url }}.

Critical · 15m · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])

- ignoring(remote_name, url) group_right

  max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])

)

> 120
```

Runbook:

1. Check the Prometheus log for remote\_write or tsdb errors;
2. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
3. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
4. Confirm the queue backlog is draining; if not, raise queue\_config or reduce the write volume.

### PrometheusRemoteWriteDesiredShards[​](#prometheusremotewritedesiredshards "Direct link to PrometheusRemoteWriteDesiredShards")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote\_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value }}.

Warning · 15m · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])

>

  max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

Runbook:

1. Check the Prometheus log for remote\_write or tsdb errors;
2. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
3. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
4. Confirm the queue backlog is draining; if not, raise queue\_config or reduce the write volume.

### PrometheusRuleFailures[​](#prometheusrulefailures "Direct link to PrometheusRuleFailures")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf "%.0f" $value }} rules in the last 5m.

Critical · 15m · Trigger:

```
increase(prometheus_rule_evaluation_failures_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Check the log for the failing rule name and error;
2. Common causes are a query syntax error in the rule, a reference to a non-existent metric, or an oversized result;
3. Validate the rule files with promtool check rules;
4. After fixing, confirm the rule shows ok on the /rules page.

### PrometheusScrapeBodySizeLimitHit[​](#prometheusscrapebodysizelimithit "Direct link to PrometheusScrapeBodySizeLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured body\_size\_limit.

Warning · 15m · Trigger:

```
increase(prometheus_target_scrapes_exceeded_body_size_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the rejected targets on the /targets page;
2. curl that target's /metrics by hand to see the actual size and whether the metric count has ballooned;
3. High-cardinality metrics are the usual cause — fix at the source or drop with metric\_relabel\_configs;
4. If a higher limit is genuinely needed, raise body\_size\_limit.

### PrometheusScrapeSampleLimitHit[​](#prometheusscrapesamplelimithit "Direct link to PrometheusScrapeSampleLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured sample\_limit.

Warning · 15m · Trigger:

```
increase(prometheus_target_scrapes_exceeded_sample_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the rejected targets and their sample counts on the /targets page;
2. Run curl /metrics | wc -l by hand to confirm the actual scale;
3. High-cardinality metrics are the main cause — reduce label dimensions at the source or drop unneeded metrics with metric\_relabel\_configs;
4. If a higher limit is genuinely needed, raise sample\_limit after assessing storage and query impact.

### PrometheusSDRefreshFailure[​](#prometheussdrefreshfailure "Direct link to PrometheusSDRefreshFailure")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to refresh SD with mechanism {{$labels.mechanism}}.

Warning · 20m · Trigger:

```
increase(prometheus_sd_refresh_failures_total{job="prometheus-k8s",namespace="monitoring"}[10m]) > 0
```

Runbook:

1. Check the log for service discovery errors;
2. For Kubernetes SD, check that Prometheus's RBAC covers the required resources;
3. For other SD types (Consul, file, …), check backend reachability and credentials;
4. After fixing, confirm the target list is updated on the /service-discovery page.

### PrometheusTargetLimitHit[​](#prometheustargetlimithit "Direct link to PrometheusTargetLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because the number of targets exceeded the configured target\_limit.

Warning · 15m · Trigger:

```
increase(prometheus_target_scrape_pool_exceeded_target_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Confirm the current target count against the limit on the /targets page;
2. Check whether the ServiceMonitor selector is too broad and picking up unwanted targets;
3. Tighten the selector or split across multiple Prometheus instances by business domain;
4. If more targets are genuinely needed, raise target\_limit and size the resources accordingly.

### PrometheusTargetSyncFailure[​](#prometheustargetsyncfailure "Direct link to PrometheusTargetSyncFailure")

{{ printf "%.0f" $value }} targets in Prometheus {{$labels.namespace}}/{{$labels.pod}} have failed to sync because invalid configuration was supplied.

Critical · 5m · Trigger:

```
increase(prometheus_target_sync_failed_total{job="prometheus-k8s",namespace="monitoring"}[30m]) > 0
```

Runbook:

1. Check the log for the specific target sync error;
2. It is usually a relabel misconfiguration producing an invalid target address;
3. Review recently changed ServiceMonitor/PodMonitor configurations;
4. After fixing, confirm the targets are healthy again on the /targets page.

### PrometheusTSDBCompactionsFailing[​](#prometheustsdbcompactionsfailing "Direct link to PrometheusTSDBCompactionsFailing")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} compaction failures over the last 3h.

Warning · 240m · Trigger:

```
increase(prometheus_tsdb_compactions_failed_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

Runbook:

1. Check the log for compaction errors;
2. The most common cause is insufficient disk space — confirm the free space first;
3. A corrupted block may need its directory deleted (losing that time range);
4. After fixing, confirm subsequent compactions complete successfully.

### PrometheusTSDBReloadsFailing[​](#prometheustsdbreloadsfailing "Direct link to PrometheusTSDBReloadsFailing")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} reload failures over the last 3h.

Warning · 240m · Trigger:

```
increase(prometheus_tsdb_reloads_failures_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

Runbook:

1. Check the log for reload errors and which block is involved;
2. It is usually a corrupted block or a permissions problem;
3. For permissions, fix the data directory owner; a corrupted block can only be deleted (losing that time range);
4. After fixing, restart Prometheus and confirm the data is queryable.

## How to use these rules[​](#how-to-use-these-rules "Direct link to How to use these rules")

* **With Prometheus or vmalert**: download [`prometheus.yml`](https://n9e.github.io/alert-rules/prometheus.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page.
* **With Nightingale**: the same rules ship in the [Kubernetes](https://n9e.github.io/integrations/kubernetes.md) integration template. Open the integration center, [import the rules into a business group](https://n9e.github.io/docs/data/integrations/import.md), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

Many rule expressions are adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps and the remaining rules come from Nightingale's integration templates ([Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes), Apache-2.0). Corrections are welcome as pull requests there.

## Related[​](#related "Direct link to Related")

* [Monitor Kubernetes with Nightingale](https://n9e.github.io/integrations/kubernetes.md): collector config, dashboards and metric reference
* [Write a metric rule in Nightingale](https://n9e.github.io/docs/alerting/metric-rules.md)
* [All alert rules](https://n9e.github.io/alert-rules.md)
