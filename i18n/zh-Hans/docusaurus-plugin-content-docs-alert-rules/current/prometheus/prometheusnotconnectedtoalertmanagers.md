---
title: "PrometheusNotConnectedToAlertmanagers 告警：含义、常见原因与处置"
sidebar_label: "PrometheusNotConnectedToAlertmanagers"
sidebar_position: 3
description: "Prometheus 告警 PrometheusNotConnectedToAlertmanagers 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Prometheus 没有发现任何可以发送告警的 Alertmanager。规则照常求值，告警在 Prometheus 的 `/alerts` 页面上照样显示为触发，但没有任何通知发出去。一切都静悄悄的、看不出异常，所以这条告警应该走一条不依赖同一个 Alertmanager 的通道发出。

- **级别**：警告（`warning`）
- **持续**：10 分钟
- 属于 [Prometheus 告警规则](/alert-rules/prometheus)（`prometheus.yml`）

## 规则

```promql
# Without max_over_time, failed scrapes could create false negatives, see
# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
max_over_time(prometheus_notifications_alertmanagers_discovered{job="prometheus-k8s",namespace="monitoring"}[5m]) < 1
```

告警信息：`Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers.`

## 常见原因

- 配置里的 `alerting` 段缺失或被删了。
- Alertmanager 服务发现没有结果：服务名、命名空间或端口名写错。用 Operator 的话，检查 Prometheus 资源里的 `spec.alerting.alertmanagers`。
- Prometheus 没有 RBAC 权限列出 Alertmanager 服务的 endpoints。
- Alertmanager 的 Pod 全挂了，服务下没有任何 endpoint。

## 处置步骤

1. 检查 Alertmanager 实例是否健康、网络是否连通；
1. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
1. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
1. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

## 补充说明

- Prometheus 的 `/status` 页面（Runtime & Build Information）会列出已发现的 Alertmanager。
- 表达式里限定了 `job="prometheus-k8s"`、`namespace="monitoring"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `prometheus_notifications_alertmanagers_discovered`（Prometheus 自身指标）

## 相关告警

- [PrometheusErrorSendingAlertsToAnyAlertmanager](/alert-rules/prometheus#prometheuserrorsendingalertstoanyalertmanager)：…% minimum errors while sending alerts from Prometheus …/… to any Alertmanager.
- [PrometheusErrorSendingAlertsToSomeAlertmanagers](/alert-rules/prometheus#prometheuserrorsendingalertstosomealertmanagers)：…% errors while sending alerts from Prometheus …/… to Alertmanager ….
- [PrometheusNotificationQueueRunningFull](/alert-rules/prometheus#prometheusnotificationqueuerunningfull)：Alert notification queue of Prometheus …/… is running full.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Prometheus 规则：[`prometheus.yml`](pathname:///alert-rules/prometheus.yml)。

```yaml
- alert: PrometheusNotConnectedToAlertmanagers
  expr: |-
    # Without max_over_time, failed scrapes could create false negatives, see
    # https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
    max_over_time(prometheus_notifications_alertmanagers_discovered{job="prometheus-k8s",namespace="monitoring"}[5m]) < 1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusnotconnectedtoalertmanagers"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
