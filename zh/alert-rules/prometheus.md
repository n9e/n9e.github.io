# Prometheus 告警规则：30 条 PromQL 规则与处置步骤

30 条开箱可用的 Prometheus 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 Prometheus's own /metrics, Prometheus Operator。可下载为 Prometheus 规则文件，或导入夜莺。

最后校对于 2026-10-31

盯 Prometheus 自身的规则：配置重载失败、规则评估失败或漏评、通知队列积压、连不上 Alertmanager、Remote Write 落后、TSDB 压缩或重载失败、触及采集与标签上限，以及 Prometheus Operator 调和失败。这类告警一响，你依赖的其它告警可能已经悄悄失效，所以应该发给维护监控系统的人，而不是业务团队。

## 概览[​](#概览 "概览的直接链接")

* **30 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
* **指标来源**：Prometheus's own /metrics, Prometheus Operator
* **下载**：[`prometheus.yml`](https://n9e.github.io/zh/alert-rules/prometheus.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
* 阈值只是起点，启用前请按自己的环境调整。

## 规则一览[​](#规则一览 "规则一览的直接链接")

| 规则                                                                                                                              | 级别 | 持续     |
| --------------------------------------------------------------------------------------------------------------------------------- | ---- | -------- |
| ConfigReloaderSidecarErrors                                                                                                       | 警告 | 10 分钟  |
| PrometheusOperatorListErrors                                                                                                      | 警告 | 15 分钟  |
| PrometheusOperatorNodeLookupErrors                                                                                                | 警告 | 10 分钟  |
| PrometheusOperatorNotReady                                                                                                        | 警告 | 5 分钟   |
| PrometheusOperatorReconcileErrors                                                                                                 | 警告 | 10 分钟  |
| [PrometheusOperatorRejectedResources](https://n9e.github.io/zh/alert-rules/prometheus/prometheusoperatorrejectedresources.md)     | 警告 | 5 分钟   |
| PrometheusOperatorSyncFailed                                                                                                      | 警告 | 10 分钟  |
| PrometheusOperatorWatchErrors                                                                                                     | 警告 | 15 分钟  |
| [PrometheusBadConfig](https://n9e.github.io/zh/alert-rules/prometheus/prometheusbadconfig.md)                                     | 紧急 | 10 分钟  |
| PrometheusDuplicateTimestamps                                                                                                     | 警告 | 10 分钟  |
| PrometheusErrorSendingAlertsToAnyAlertmanager                                                                                     | 紧急 | 15 分钟  |
| PrometheusErrorSendingAlertsToSomeAlertmanagers                                                                                   | 警告 | 15 分钟  |
| PrometheusHighQueryLoad                                                                                                           | 警告 | 15 分钟  |
| PrometheusLabelLimitHit                                                                                                           | 警告 | 15 分钟  |
| PrometheusMissingRuleEvaluations                                                                                                  | 警告 | 15 分钟  |
| [PrometheusNotConnectedToAlertmanagers](https://n9e.github.io/zh/alert-rules/prometheus/prometheusnotconnectedtoalertmanagers.md) | 警告 | 10 分钟  |
| PrometheusNotificationQueueRunningFull                                                                                            | 警告 | 15 分钟  |
| PrometheusNotIngestingSamples                                                                                                     | 警告 | 10 分钟  |
| PrometheusOutOfOrderTimestamps                                                                                                    | 警告 | 10 分钟  |
| PrometheusRemoteStorageFailures                                                                                                   | 紧急 | 15 分钟  |
| [PrometheusRemoteWriteBehind](https://n9e.github.io/zh/alert-rules/prometheus/prometheusremotewritebehind.md)                     | 紧急 | 15 分钟  |
| [PrometheusRemoteWriteDesiredShards](https://n9e.github.io/zh/alert-rules/prometheus/prometheusremotewritedesiredshards.md)       | 警告 | 15 分钟  |
| [PrometheusRuleFailures](https://n9e.github.io/zh/alert-rules/prometheus/prometheusrulefailures.md)                               | 紧急 | 15 分钟  |
| PrometheusScrapeBodySizeLimitHit                                                                                                  | 警告 | 15 分钟  |
| PrometheusScrapeSampleLimitHit                                                                                                    | 警告 | 15 分钟  |
| PrometheusSDRefreshFailure                                                                                                        | 警告 | 20 分钟  |
| [PrometheusTargetLimitHit](https://n9e.github.io/zh/alert-rules/prometheus/prometheustargetlimithit.md)                           | 警告 | 15 分钟  |
| PrometheusTargetSyncFailure                                                                                                       | 紧急 | 5 分钟   |
| PrometheusTSDBCompactionsFailing                                                                                                  | 警告 | 240 分钟 |
| PrometheusTSDBReloadsFailing                                                                                                      | 警告 | 240 分钟 |

## Prometheus 自监控（30）[​](#prometheus-自监控30 "Prometheus 自监控（30）的直接链接")

### ConfigReloaderSidecarErrors[​](#configreloadersidecarerrors "ConfigReloaderSidecarErrors的直接链接")

Errors encountered while the {{$labels.pod}} config-reloader sidecar attempts to sync config in {{$labels.namespace}} namespace. As a result, configuration for service running in {{$labels.pod}} may be stale and cannot be updated anymore.

警告 · 10 分钟 · 触发条件:

```
max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0
```

处置步骤:

1. kubectl logs \<pod> -c config-reloader -n \<ns> 看具体报错；
2. 常见为配置文件语法错误导致 reload 被拒绝；
3. 用 promtool check config / amtool check-config 校验配置；
4. 修正后确认 reload 成功，并在 Prometheus 的 /config 页核对配置已更新。

### PrometheusOperatorListErrors[​](#prometheusoperatorlisterrors "PrometheusOperatorListErrors的直接链接")

Errors while performing List operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

警告 · 15 分钟 · 触发条件:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[10m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_total{job="prometheus-operator",namespace="monitoring"}[10m]))) > 0.4
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

### PrometheusOperatorNodeLookupErrors[​](#prometheusoperatornodelookuperrors "PrometheusOperatorNodeLookupErrors的直接链接")

Errors while reconciling Prometheus in {{ $labels.namespace }} Namespace.

警告 · 10 分钟 · 触发条件:

```
rate(prometheus_operator_node_address_lookup_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]) > 0.1
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

### PrometheusOperatorNotReady[​](#prometheusoperatornotready "PrometheusOperatorNotReady的直接链接")

Prometheus operator in {{ $labels.namespace }} namespace isn't ready to reconcile {{ $labels.controller }} resources.

警告 · 5 分钟 · 触发条件:

```
min by (cluster,controller,namespace) (max_over_time(prometheus_operator_ready{job="prometheus-operator",namespace="monitoring"}[5m]) == 0)
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

### PrometheusOperatorReconcileErrors[​](#prometheusoperatorreconcileerrors "PrometheusOperatorReconcileErrors的直接链接")

{{ $value | humanizePercentage }} of reconciling operations failed for {{ $labels.controller }} controller in {{ $labels.namespace }} namespace.

警告 · 10 分钟 · 触发条件:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]))) / (sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.1
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

### PrometheusOperatorRejectedResources[​](#prometheusoperatorrejectedresources "PrometheusOperatorRejectedResources的直接链接")

Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf "%0.0f" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources.

警告 · 5 分钟 · PromQL、常见原因与处置步骤：[PrometheusOperatorRejectedResources](https://n9e.github.io/zh/alert-rules/prometheus/prometheusoperatorrejectedresources.md)

### PrometheusOperatorSyncFailed[​](#prometheusoperatorsyncfailed "PrometheusOperatorSyncFailed的直接链接")

Controller {{ $labels.controller }} in {{ $labels.namespace }} namespace fails to reconcile {{ $value }} objects.

警告 · 10 分钟 · 触发条件:

```
min_over_time(prometheus_operator_syncs{status="failed",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

### PrometheusOperatorWatchErrors[​](#prometheusoperatorwatcherrors "PrometheusOperatorWatchErrors的直接链接")

Errors while performing watch operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

警告 · 15 分钟 · 触发条件:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[5m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.4
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

### PrometheusBadConfig[​](#prometheusbadconfig "PrometheusBadConfig的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration.

紧急 · 10 分钟 · PromQL、常见原因与处置步骤：[PrometheusBadConfig](https://n9e.github.io/zh/alert-rules/prometheus/prometheusbadconfig.md)

### PrometheusDuplicateTimestamps[​](#prometheusduplicatetimestamps "PrometheusDuplicateTimestamps的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with different values but duplicated timestamp.

警告 · 10 分钟 · 触发条件:

```
rate(prometheus_target_scrapes_sample_duplicate_timestamp_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被重复抓取的目标（同一实例出现在多个 job 下）；
2. 检查 ServiceMonitor/PodMonitor 的 selector 是否过于宽泛导致重叠；
3. 收敛 selector 让每个目标只被一个 job 抓取；
4. 修正后确认丢弃计数不再增长。

### PrometheusErrorSendingAlertsToAnyAlertmanager[​](#prometheuserrorsendingalertstoanyalertmanager "PrometheusErrorSendingAlertsToAnyAlertmanager的直接链接")

{{ printf "%.1f" $value }}% minimum errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to any Alertmanager.

紧急 · 15 分钟 · 触发条件:

```
min without (alertmanager) (

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

)

* 100

> 3
```

处置步骤:

1. 检查 Alertmanager 实例是否健康、网络是否连通；
2. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
3. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
4. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

### PrometheusErrorSendingAlertsToSomeAlertmanagers[​](#prometheuserrorsendingalertstosomealertmanagers "PrometheusErrorSendingAlertsToSomeAlertmanagers的直接链接")

{{ printf "%.1f" $value }}% errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to Alertmanager {{$labels.alertmanager}}.

警告 · 15 分钟 · 触发条件:

```
(

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring"}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring"}[5m])

)

* 100

> 1
```

处置步骤:

1. 检查 Alertmanager 实例是否健康、网络是否连通；
2. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
3. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
4. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

### PrometheusHighQueryLoad[​](#prometheushighqueryload "PrometheusHighQueryLoad的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} query API has less than 20% available capacity in its query engine for the last 15 minutes.

警告 · 15 分钟 · 触发条件:

```
avg_over_time(prometheus_engine_queries{job="prometheus-k8s",namespace="monitoring"}[5m]) / max_over_time(prometheus_engine_queries_concurrent_max{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0.8
```

处置步骤:

1. 在 /status 页看查询引擎的并发与队列指标；
2. 用 topk 类查询或 query log 找出最重的查询；
3. 常见根因是高基数标签与过大的时间范围——收窄范围、减少 group by 维度；
4. 优化后仍高的扩容 Prometheus 或做联邦/分片。

### PrometheusLabelLimitHit[​](#prometheuslabellimithit "PrometheusLabelLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because some samples exceeded the configured label\_limit, label\_name\_length\_limit or label\_value\_length\_limit.

警告 · 15 分钟 · 触发条件:

```
increase(prometheus_target_scrape_pool_exceeded_label_limits_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被拒绝的目标与具体原因；
2. 到目标侧确认为何标签数异常多，通常是把高基数信息（用户ID、请求ID）打成了标签；
3. 在目标侧修正指标设计，或用 metric\_relabel\_configs 丢弃多余标签；
4. 确需更多标签的调大 label\_limit，但要先评估基数影响。

### PrometheusMissingRuleEvaluations[​](#prometheusmissingruleevaluations "PrometheusMissingRuleEvaluations的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has missed {{ printf "%.0f" $value }} rule group evaluations in the last 5m.

警告 · 15 分钟 · 触发条件:

```
increase(prometheus_rule_group_iterations_missed_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 看日志中 rule evaluation 相关的超时报错；
2. 找出评估耗时最长的规则组，通常是包含重查询的记录规则；
3. 拆分规则组、拉长 evaluation\_interval，或优化规则里的查询；
4. 资源不足的扩容 Prometheus。

### PrometheusNotConnectedToAlertmanagers[​](#prometheusnotconnectedtoalertmanagers "PrometheusNotConnectedToAlertmanagers的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers.

警告 · 10 分钟 · PromQL、常见原因与处置步骤：[PrometheusNotConnectedToAlertmanagers](https://n9e.github.io/zh/alert-rules/prometheus/prometheusnotconnectedtoalertmanagers.md)

### PrometheusNotificationQueueRunningFull[​](#prometheusnotificationqueuerunningfull "PrometheusNotificationQueueRunningFull的直接链接")

Alert notification queue of Prometheus {{$labels.namespace}}/{{$labels.pod}} is running full.

警告 · 15 分钟 · 触发条件:

```
# Without min_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  predict_linear(prometheus_notifications_queue_length{job="prometheus-k8s",namespace="monitoring"}[5m], 60 * 30)

>

  min_over_time(prometheus_notifications_queue_capacity{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

处置步骤:

1. 检查 Alertmanager 实例是否健康、网络是否连通；
2. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
3. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
4. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

### PrometheusNotIngestingSamples[​](#prometheusnotingestingsamples "PrometheusNotIngestingSamples的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not ingesting samples.

警告 · 10 分钟 · 触发条件:

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

处置步骤:

1. 在 /targets 页确认是否所有目标都 down；
2. 检查服务发现是否正常（/service-discovery 页）；
3. 配置错误导致目标为空的按配置问题处理；
4. 这是监控体系的完全失明，应最高优先级处理。

### PrometheusOutOfOrderTimestamps[​](#prometheusoutofordertimestamps "PrometheusOutOfOrderTimestamps的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with timestamps arriving out of order.

警告 · 10 分钟 · 触发条件:

```
rate(prometheus_target_scrapes_sample_out_of_order_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 确认是哪个目标在上报乱序数据；
2. 常见根因是目标机器时钟不同步，或指标由多个来源汇聚后时间戳错乱；
3. 先校准目标机器时钟（chronyc）；
4. Pushgateway 类场景确认推送端的时间戳处理逻辑。

### PrometheusRemoteStorageFailures[​](#prometheusremotestoragefailures "PrometheusRemoteStorageFailures的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} failed to send {{ printf "%.1f" $value }}% of the samples to {{ $labels.remote\_name}}:{{ $labels.url }}

紧急 · 15 分钟 · 触发条件:

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

处置步骤:

1. 看 Prometheus 日志中 remote\_write 或 tsdb 相关报错；
2. 远程写入失败的确认远端存储可用性与鉴权配置，并看是否触发了限流；
3. 本地存储失败的检查磁盘空间与权限，TSDB 损坏时可能需要清理 WAL；
4. 确认队列积压是否在下降，持续积压需要调大 queue\_config 或降低写入量。

### PrometheusRemoteWriteBehind[​](#prometheusremotewritebehind "PrometheusRemoteWriteBehind的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf "%.1f" $value }}s behind for {{ $labels.remote\_name}}:{{ $labels.url }}.

紧急 · 15 分钟 · PromQL、常见原因与处置步骤：[PrometheusRemoteWriteBehind](https://n9e.github.io/zh/alert-rules/prometheus/prometheusremotewritebehind.md)

### PrometheusRemoteWriteDesiredShards[​](#prometheusremotewritedesiredshards "PrometheusRemoteWriteDesiredShards的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote\_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value }}.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[PrometheusRemoteWriteDesiredShards](https://n9e.github.io/zh/alert-rules/prometheus/prometheusremotewritedesiredshards.md)

### PrometheusRuleFailures[​](#prometheusrulefailures "PrometheusRuleFailures的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf "%.0f" $value }} rules in the last 5m.

紧急 · 15 分钟 · PromQL、常见原因与处置步骤：[PrometheusRuleFailures](https://n9e.github.io/zh/alert-rules/prometheus/prometheusrulefailures.md)

### PrometheusScrapeBodySizeLimitHit[​](#prometheusscrapebodysizelimithit "PrometheusScrapeBodySizeLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured body\_size\_limit.

警告 · 15 分钟 · 触发条件:

```
increase(prometheus_target_scrapes_exceeded_body_size_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被拒绝的目标；
2. 手工 curl 该目标的 /metrics 看实际大小，确认是否指标数量异常膨胀；
3. 常见根因是高基数指标，在目标侧治理或用 metric\_relabel\_configs 丢弃；
4. 确需更大限制的调大 body\_size\_limit。

### PrometheusScrapeSampleLimitHit[​](#prometheusscrapesamplelimithit "PrometheusScrapeSampleLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured sample\_limit.

警告 · 15 分钟 · 触发条件:

```
increase(prometheus_target_scrapes_exceeded_sample_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被拒绝的目标与样本数；
2. 手工 curl /metrics | wc -l 确认实际规模；
3. 高基数指标是主因，在目标侧减少标签维度，或用 metric\_relabel\_configs 丢弃不需要的指标；
4. 确需更大限制的调大 sample\_limit，但要评估存储与查询压力。

### PrometheusSDRefreshFailure[​](#prometheussdrefreshfailure "PrometheusSDRefreshFailure的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to refresh SD with mechanism {{$labels.mechanism}}.

警告 · 20 分钟 · 触发条件:

```
increase(prometheus_sd_refresh_failures_total{job="prometheus-k8s",namespace="monitoring"}[10m]) > 0
```

处置步骤:

1. 看日志中服务发现相关的报错；
2. K8s SD 的检查 Prometheus 的 RBAC 权限是否覆盖所需资源；
3. 其他 SD（Consul/文件等）的检查后端可达性与凭据；
4. 修复后在 /service-discovery 页确认目标列表已更新。

### PrometheusTargetLimitHit[​](#prometheustargetlimithit "PrometheusTargetLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because the number of targets exceeded the configured target\_limit.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[PrometheusTargetLimitHit](https://n9e.github.io/zh/alert-rules/prometheus/prometheustargetlimithit.md)

### PrometheusTargetSyncFailure[​](#prometheustargetsyncfailure "PrometheusTargetSyncFailure的直接链接")

{{ printf "%.0f" $value }} targets in Prometheus {{$labels.namespace}}/{{$labels.pod}} have failed to sync because invalid configuration was supplied.

紧急 · 5 分钟 · 触发条件:

```
increase(prometheus_target_sync_failed_total{job="prometheus-k8s",namespace="monitoring"}[30m]) > 0
```

处置步骤:

1. 看日志中 target sync 的具体报错；
2. 常见为 relabel 配置错误导致目标地址非法；
3. 检查最近变更的 ServiceMonitor/PodMonitor 配置；
4. 修正后在 /targets 页确认目标恢复正常。

### PrometheusTSDBCompactionsFailing[​](#prometheustsdbcompactionsfailing "PrometheusTSDBCompactionsFailing的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} compaction failures over the last 3h.

警告 · 240 分钟 · 触发条件:

```
increase(prometheus_tsdb_compactions_failed_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

处置步骤:

1. 看日志中 compaction 相关报错；
2. 最常见是磁盘空间不足——先确认剩余空间；
3. 数据块损坏的可能需要删除损坏的 block 目录（会丢失该段数据）；
4. 修复后确认后续 compaction 成功完成。

### PrometheusTSDBReloadsFailing[​](#prometheustsdbreloadsfailing "PrometheusTSDBReloadsFailing的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} reload failures over the last 3h.

警告 · 240 分钟 · 触发条件:

```
increase(prometheus_tsdb_reloads_failures_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

处置步骤:

1. 看日志中 reload 相关报错与涉及的 block；
2. 常见为数据块损坏或权限问题；
3. 权限问题修正数据目录属主；损坏的 block 只能删除（会丢失该段数据）；
4. 修复后重启 Prometheus 并确认数据可查。

## 怎么使用这些规则[​](#怎么使用这些规则 "怎么使用这些规则的直接链接")

* **用 Prometheus 或 vmalert**：下载 [`prometheus.yml`](https://n9e.github.io/zh/alert-rules/prometheus.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页；有单独页面的规则指向它自己的页面。
* **用夜莺**：同样的规则内置在 [Kubernetes](https://n9e.github.io/zh/integrations/kubernetes.md) 集成模板里。在集成中心把规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

不少规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。 处置步骤和其余规则来自夜莺的集成模板（[Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* [用夜莺监控 Kubernetes](https://n9e.github.io/zh/integrations/kubernetes.md)：采集配置、仪表盘与指标说明
* [在夜莺里写指标告警规则](https://n9e.github.io/zh/docs/alerting/metric-rules.md)
* [全部告警规则](https://n9e.github.io/zh/alert-rules.md)
