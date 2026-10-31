---
title: "PrometheusBadConfig 告警：含义、常见原因与处置"
sidebar_label: "PrometheusBadConfig"
sidebar_position: 2
description: "Prometheus 告警 PrometheusBadConfig 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

最近一次重载 Prometheus 配置失败。Prometheus 会继续用旧配置运行，所以不会立刻出问题；但此后的所有改动（新的采集目标、新的规则文件、新的 Alertmanager 配置）都没有生效。如果配置文件一直是坏的，下次重启时 Prometheus 可能起不来。

- **级别**：紧急（`critical`）
- **持续**：10 分钟
- 属于 [Prometheus 告警规则](/alert-rules/prometheus)（`prometheus.yml`）

## 规则

```promql
# Without max_over_time, failed scrapes could create false negatives, see
# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
max_over_time(prometheus_config_last_reload_successful{job="prometheus-k8s",namespace="monitoring"}[5m]) == 0
```

告警信息：`Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration.`

## 常见原因

- `prometheus.yml` 有 YAML 语法错误或未知字段。
- `rule_files` 里列出的某个规则文件解析失败。
- 引用的文件（TLS 证书、密码文件、file_sd 目标列表）不存在或不可读。
- 在 Kubernetes 上，某个 ServiceMonitor、PodMonitor 或 PrometheusRule 被 Operator 生成成了无效配置。

## 处置步骤

1. kubectl logs 或实例日志里找配置解析报错的具体行；
1. 用 promtool check config prometheus.yml 本地校验；
1. K8s 上通常由 Operator 生成配置，检查 ServiceMonitor/PrometheusRule 是否有非法字段；
1. 修正后确认 /-/reload 成功且 /config 页显示新配置。

## 补充说明

- 每次重载前先跑 `promtool check config prometheus.yml`。用 Operator 时，生成的配置放在一个 Secret 里，重载错误可以在 config-reloader sidecar 的日志里看到。
- 表达式里限定了 `job="prometheus-k8s"`、`namespace="monitoring"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `prometheus_config_last_reload_successful`（Prometheus 自身指标）

## 相关告警

- [PrometheusRuleFailures](/alert-rules/prometheus/prometheusrulefailures)：Prometheus …/… has failed to evaluate … rules in the last 5m.
- [PrometheusOperatorRejectedResources](/alert-rules/prometheus/prometheusoperatorrejectedresources)：Prometheus operator in … namespace rejected … …/… resources.
- [PrometheusOperatorReconcileErrors](/alert-rules/prometheus#prometheusoperatorreconcileerrors)：… of reconciling operations failed for … controller in … namespace.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Prometheus 规则：[`prometheus.yml`](pathname:///alert-rules/prometheus.yml)。

```yaml
- alert: PrometheusBadConfig
  expr: |-
    # Without max_over_time, failed scrapes could create false negatives, see
    # https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
    max_over_time(prometheus_config_last_reload_successful{job="prometheus-k8s",namespace="monitoring"}[5m]) == 0
  for: 10m
  labels:
    severity: critical
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusbadconfig"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
