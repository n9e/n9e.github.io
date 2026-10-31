---
title: "PrometheusRuleFailures 告警：含义、常见原因与处置"
sidebar_label: "PrometheusRuleFailures"
sidebar_position: 6
description: "Prometheus 告警 PrometheusRuleFailures 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Prometheus 在过去 5 分钟里有告警规则或 recording rule 求值失败。求值失败的规则不产生结果：本该触发的告警不会响，recording rule 会出现数据断档，依赖它的其它规则和仪表盘也跟着读到空值。

- **级别**：紧急（`critical`）
- **持续**：15 分钟
- 属于 [Prometheus 告警规则](/alert-rules/prometheus)（`prometheus.yml`）

## 规则

```promql
increase(prometheus_rule_evaluation_failures_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

告警信息：`Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf "%.0f" $value }} rules in the last 5m.`

## 常见原因

- 只在特定数据下出现的向量匹配错误：新增了一个标签或出现重复目标后，报 `many-to-many matching not allowed` 或 `found duplicate series for the match group`。
- 查询超过了查询超时时间，或超过了允许加载的最大样本数。
- 规则引用的 recording rule 或指标改了名，组合表达式开始报错。
- 求值时远程读或存储出错。

## 处置步骤

1. 看日志中失败规则的名称与错误；
1. 常见为规则里的查询语法错误、引用了不存在的指标、或返回数据量过大；
1. 用 promtool check rules 校验规则文件；
1. 修正后确认 /rules 页该规则状态为 ok。

## 补充说明

- Prometheus 界面的 `/rules` 页面会显示每条规则最近一次的错误，比翻日志快。这类错误有些和数据有关，所以 `promtool check rules` 能通过，求值时仍然会失败。
- 表达式里限定了 `job="prometheus-k8s"`、`namespace="monitoring"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `prometheus_rule_evaluation_failures_total`（Prometheus 自身指标）

## 相关告警

- [PrometheusMissingRuleEvaluations](/alert-rules/prometheus#prometheusmissingruleevaluations)：Prometheus …/… has missed … rule group evaluations in the last 5m.
- [PrometheusBadConfig](/alert-rules/prometheus/prometheusbadconfig)：Prometheus …/… has failed to reload its configuration.
- [PrometheusOperatorRejectedResources](/alert-rules/prometheus/prometheusoperatorrejectedresources)：Prometheus operator in … namespace rejected … …/… resources.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Prometheus 规则：[`prometheus.yml`](pathname:///alert-rules/prometheus.yml)。

```yaml
- alert: PrometheusRuleFailures
  expr: |-
    increase(prometheus_rule_evaluation_failures_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf \"%.0f\" $value }} rules in the last 5m."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusrulefailures"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
