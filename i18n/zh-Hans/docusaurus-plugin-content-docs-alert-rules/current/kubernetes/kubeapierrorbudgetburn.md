---
title: "KubeAPIErrorBudgetBurn 告警：含义、常见原因与处置"
sidebar_label: "KubeAPIErrorBudgetBurn"
sidebar_position: 2
description: "Prometheus 告警 KubeAPIErrorBudgetBurn 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Kubernetes API Server 失败或变慢的请求太多，正在提前耗尽错误预算。规则采用 Google SRE Workbook 的多窗口燃烧率方法，可用性目标为 99%。每条规则搭配一长一短两个窗口，两个都超过阈值才触发：1h 与 5m 超过 14.4、6h 与 30m 超过 6 为紧急；1d 与 2h 超过 3、3d 与 6h 超过 1 为警告。燃烧率 14.4 时，30 天的错误预算大约两天就会用完。控制器、kubectl、CI 流水线都要经过 API Server，它出错会波及所有地方。

- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

模板把这个告警按阈值、时间窗口和级别拆成了 4 条规则，请一起加载。

### KubeAPIErrorBudgetBurn-S1-120s

紧急（`critical`） · 持续：2 分钟

```promql
sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)
and
sum(apiserver_request:burnrate5m) > (14.40 * 0.01000)
```

### KubeAPIErrorBudgetBurn-S1-900s

紧急（`critical`） · 持续：15 分钟

```promql
sum(apiserver_request:burnrate6h) > (6.00 * 0.01000)
and
sum(apiserver_request:burnrate30m) > (6.00 * 0.01000)
```

### KubeAPIErrorBudgetBurn-S2-3600s

警告（`warning`） · 持续：60 分钟

```promql
sum(apiserver_request:burnrate1d) > (3.00 * 0.01000)
and
sum(apiserver_request:burnrate2h) > (3.00 * 0.01000)
```

### KubeAPIErrorBudgetBurn-S2-10800s

警告（`warning`） · 持续：180 分钟

```promql
sum(apiserver_request:burnrate3d) > (1.00 * 0.01000)
and
sum(apiserver_request:burnrate6h) > (1.00 * 0.01000)
```

告警信息：`The API server is burning too much error budget.`

## 常见原因

- etcd 变慢，最常见的是磁盘延迟高，写请求受影响最明显。
- 客户端发起昂贵请求，比如不带 `resourceVersion` 的全命名空间 LIST，把延迟推过了 SLO。
- 某个聚合 API（metrics-server、准入 webhook 的后端）出故障，依赖它的请求跟着失败。
- 准入 webhook 变慢或宕机，被它拦截的每个写请求都要等它。
- API Server 自身 CPU 或内存不够，或者多个副本中有一个不健康。

## 处置步骤

1. 看 apiserver 的错误码与延迟分布，确认是读还是写请求在劣化；
1. 写请求劣化优先排查 etcd 的磁盘延迟——这是最常见根因；
1. 读请求劣化排查是否有客户端在做大范围 LIST（无 resourceVersion 的全量列举）；
1. 定位到异常客户端的对其限流，并考虑开启 APF（API Priority and Fairness）。

## 补充说明

- 表达式读的是 kubernetes-mixin 里的 recording rule `apiserver_request:burnrate*`。要一并加载这些 recording rule，否则规则永远不会触发。

## 用到的指标

- `apiserver_request:burnrate1h`（kubernetes-mixin 的 recording rule）
- `apiserver_request:burnrate5m`（kubernetes-mixin 的 recording rule）
- `apiserver_request:burnrate6h`（kubernetes-mixin 的 recording rule）
- `apiserver_request:burnrate30m`（kubernetes-mixin 的 recording rule）
- `apiserver_request:burnrate1d`（kubernetes-mixin 的 recording rule）
- `apiserver_request:burnrate2h`（kubernetes-mixin 的 recording rule）
- `apiserver_request:burnrate3d`（kubernetes-mixin 的 recording rule）

## 相关告警

- [KubeAPIDown](/alert-rules/kubernetes#kubeapidown)：KubeAPI has disappeared from Prometheus target discovery.
- [KubeClientErrors](/alert-rules/kubernetes#kubeclienterrors)：Kubernetes API server client '…/…' is experiencing … errors.'
- [KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown)：Kubernetes aggregated API …/… has been only …% available over the last 10m.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubeAPIErrorBudgetBurn-S1-120s
  expr: |-
    sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)
    and
    sum(apiserver_request:burnrate5m) > (14.40 * 0.01000)
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "The API server is burning too much error budget."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn"
- alert: KubeAPIErrorBudgetBurn-S1-900s
  expr: |-
    sum(apiserver_request:burnrate6h) > (6.00 * 0.01000)
    and
    sum(apiserver_request:burnrate30m) > (6.00 * 0.01000)
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "The API server is burning too much error budget."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn"
- alert: KubeAPIErrorBudgetBurn-S2-3600s
  expr: |-
    sum(apiserver_request:burnrate1d) > (3.00 * 0.01000)
    and
    sum(apiserver_request:burnrate2h) > (3.00 * 0.01000)
  for: 60m
  labels:
    severity: warning
  annotations:
    summary: "The API server is burning too much error budget."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn"
- alert: KubeAPIErrorBudgetBurn-S2-10800s
  expr: |-
    sum(apiserver_request:burnrate3d) > (1.00 * 0.01000)
    and
    sum(apiserver_request:burnrate6h) > (1.00 * 0.01000)
  for: 180m
  labels:
    severity: warning
  annotations:
    summary: "The API server is burning too much error budget."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeapierrorbudgetburn"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
