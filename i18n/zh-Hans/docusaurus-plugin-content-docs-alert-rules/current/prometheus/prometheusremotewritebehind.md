---
title: "PrometheusRemoteWriteBehind 告警：含义、常见原因与处置"
sidebar_label: "PrometheusRemoteWriteBehind"
sidebar_position: 4
description: "Prometheus 告警 PrometheusRemoteWriteBehind 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Remote Write 落后超过 2 分钟：Prometheus 已接收的最新样本，比已发往远端的最新样本新了 120 秒以上。读远端存储（VictoriaMetrics、Thanos Receive、Mimir、托管服务）的仪表盘和告警看到的都是旧数据。落后量如果持续扩大，可能有样本在发出去之前就被丢掉。

- **级别**：紧急（`critical`）
- **持续**：15 分钟
- 属于 [Prometheus 告警规则](/alert-rules/prometheus)（`prometheus.yml`）

## 规则

```promql
# Without max_over_time, failed scrapes could create false negatives, see
# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
(
  max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
- ignoring(remote_name, url) group_right
  max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
)
> 120
```

告警信息：`Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf "%.1f" $value }}s behind for {{ $labels.remote_name}}:{{ $labels.url }}.`

## 常见原因

- 远端写入慢或拒绝写入：过载、用 HTTP 429 限流，或者返回错误。
- Prometheus 到远端的网络延迟或带宽撑不住写入量。
- Remote Write 的分片（shard）上限相对序列数太低（见 PrometheusRemoteWriteDesiredShards）。
- 序列数突增（比如新增了一个高基数标签），写入量成倍增加。
- Prometheus 重启后在回放大量 WAL，正在追赶。

## 处置步骤

1. 看 Prometheus 日志中 remote_write 或 tsdb 相关报错；
1. 远程写入失败的确认远端存储可用性与鉴权配置，并看是否触发了限流；
1. 本地存储失败的检查磁盘空间与权限，TSDB 损坏时可能需要清理 WAL；
1. 确认队列积压是否在下降，持续积压需要调大 queue_config 或降低写入量。

## 补充说明

- 表达式里限定了 `job="prometheus-k8s"`、`namespace="monitoring"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `prometheus_remote_storage_highest_timestamp_in_seconds`（Prometheus 自身指标）
- `prometheus_remote_storage_queue_highest_sent_timestamp_seconds`（Prometheus 自身指标）

## 相关告警

- [PrometheusRemoteWriteDesiredShards](/alert-rules/prometheus/prometheusremotewritedesiredshards)：Prometheus …/… remote write desired shards calculation wants to run … shards for queue …:…, which is more than the max of \{\{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value \}\}.
- [PrometheusRemoteStorageFailures](/alert-rules/prometheus#prometheusremotestoragefailures)：Prometheus …/… failed to send …% of the samples to …:…

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Prometheus 规则：[`prometheus.yml`](pathname:///alert-rules/prometheus.yml)。

```yaml
- alert: PrometheusRemoteWriteBehind
  expr: |-
    # Without max_over_time, failed scrapes could create false negatives, see
    # https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
    (
      max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
    - ignoring(remote_name, url) group_right
      max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
    )
    > 120
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf \"%.1f\" $value }}s behind for {{ $labels.remote_name}}:{{ $labels.url }}."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusremotewritebehind"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
