---
title: "PrometheusRemoteWriteDesiredShards 告警：含义、常见原因与处置"
sidebar_label: "PrometheusRemoteWriteDesiredShards"
sidebar_position: 5
description: "Prometheus 告警 PrometheusRemoteWriteDesiredShards 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Remote Write 会根据进来的样本速度，计算需要多少个并行分片（shard）才能跟上。这条告警在这个计算值连续 15 分钟高于配置的 `max_shards` 时触发：Remote Write 加不了它需要的分片，如果情况不变，就会开始落后（PrometheusRemoteWriteBehind）。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Prometheus 告警规则](/alert-rules/prometheus)（`prometheus.yml`）

## 规则

```promql
# Without max_over_time, failed scrapes could create false negatives, see
# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
(
  max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])
>
  max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])
)
```

告警信息：Prometheus \{\{$labels.namespace\}\}/\{\{$labels.pod\}\} remote write desired shards calculation wants to run \{\{ $value \}\} shards for queue \{\{ $labels.remote_name\}\}:\{\{ $labels.url \}\}, which is more than the max of \{\{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value \}\}.

## 常见原因

- 序列数或采集频率增加了，每秒要发的样本更多。
- 远端或网络变慢，每次发送耗时变长，同样的吞吐需要更多分片。
- `queue_config` 里的 `max_shards` 设得比实际需要低。

## 处置步骤

1. 看 Prometheus 日志中 remote_write 或 tsdb 相关报错；
1. 远程写入失败的确认远端存储可用性与鉴权配置，并看是否触发了限流；
1. 本地存储失败的检查磁盘空间与权限，TSDB 损坏时可能需要清理 WAL；
1. 确认队列积压是否在下降，持续积压需要调大 queue_config 或降低写入量。

## 补充说明

- 先解决原因，再调上限。远端慢的话，加分片只会给它更大压力；写入量确实涨了，再调大 `max_shards`，或调大 `max_samples_per_send` 让每批发得更多，同时确认 Prometheus 有足够的内存承载更大的队列。
- 表达式里限定了 `job="prometheus-k8s"`、`namespace="monitoring"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `prometheus_remote_storage_shards_desired`（Prometheus 自身指标）
- `prometheus_remote_storage_shards_max`（Prometheus 自身指标）

## 相关告警

- [PrometheusRemoteWriteBehind](/alert-rules/prometheus/prometheusremotewritebehind)：Prometheus …/… remote write is …s behind for …:….
- [PrometheusRemoteStorageFailures](/alert-rules/prometheus#prometheusremotestoragefailures)：Prometheus …/… failed to send …% of the samples to …:…

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Prometheus 规则：[`prometheus.yml`](pathname:///alert-rules/prometheus.yml)。

```yaml
- alert: PrometheusRemoteWriteDesiredShards
  expr: |-
    # Without max_over_time, failed scrapes could create false negatives, see
    # https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
    (
      max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])
    >
      max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])
    )
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max{instance=\"%s\",job=\"prometheus-k8s\",namespace=\"monitoring\"}` $labels.instance | query | first | value }}."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusremotewritedesiredshards"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
