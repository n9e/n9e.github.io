---
title: "PrometheusTargetLimitHit 告警：含义、常见原因与处置"
sidebar_label: "PrometheusTargetLimitHit"
sidebar_position: 7
description: "Prometheus 告警 PrometheusTargetLimitHit 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

某个采集任务发现的目标数超过了它的 `target_limit`。这时 Prometheus 不会只抓前 N 个，而是把这个采集池里的所有目标都标成失败，一个都不抓。整个任务一下子全部断掉，对应的 `up` 序列全部变成 0。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Prometheus 告警规则](/alert-rules/prometheus)（`prometheus.yml`）

## 规则

```promql
increase(prometheus_target_scrape_pool_exceeded_target_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

告警信息：`Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because the number of targets exceeded the configured target_limit.`

## 常见原因

- ServiceMonitor 或 PodMonitor 的选择器太宽，匹配到了本不该采集的 Service 或 Pod。
- 被监控的负载扩容超过了上限，比如大规模的 DaemonSet，或者 HPA 扩容。
- 原本用来过滤多余目标的 relabel 规则被改掉或删掉了。
- 上限是按更小的集群设的，后来没有调整。

## 处置步骤

1. 在 /targets 页确认当前目标数与限制；
1. 检查 ServiceMonitor 的 selector 是否过于宽泛，抓取了不需要的目标；
1. 收敛 selector 或按业务拆分到多个 Prometheus 实例；
1. 确需更多目标的调大 target_limit 并评估资源。

## 补充说明

- `/targets` 页面上，受影响的任务会显示一条提到 target limit 的错误。用 Operator 时，上限可能来自 ServiceMonitor 或 PodMonitor 的 `targetLimit`，也可能来自 Prometheus 资源的 `enforcedTargetLimit`。
- 表达式里限定了 `job="prometheus-k8s"`、`namespace="monitoring"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `prometheus_target_scrape_pool_exceeded_target_limit_total`（Prometheus 自身指标）

## 相关告警

- [PrometheusScrapeSampleLimitHit](/alert-rules/prometheus#prometheusscrapesamplelimithit)：Prometheus …/… has failed … scrapes in the last 5m because some targets exceeded the configured sample_limit.
- [PrometheusLabelLimitHit](/alert-rules/prometheus#prometheuslabellimithit)：Prometheus …/… has dropped … targets because some samples exceeded the configured label_limit, label_name_length_limit or label_value_length_limit.
- [PrometheusTargetSyncFailure](/alert-rules/prometheus#prometheustargetsyncfailure)：… targets in Prometheus …/… have failed to sync because invalid configuration was supplied.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Prometheus 规则：[`prometheus.yml`](pathname:///alert-rules/prometheus.yml)。

```yaml
- alert: PrometheusTargetLimitHit
  expr: |-
    increase(prometheus_target_scrape_pool_exceeded_target_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf \"%.0f\" $value }} targets because the number of targets exceeded the configured target_limit."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheustargetlimithit"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
