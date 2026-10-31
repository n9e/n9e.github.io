---
title: "PrometheusNotConnectedToAlertmanagers alert: what it means and how to fix it"
sidebar_label: "PrometheusNotConnectedToAlertmanagers"
sidebar_position: 3
description: "What the PrometheusNotConnectedToAlertmanagers Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Prometheus has discovered no Alertmanager to send alerts to. Rules are still evaluated and alerts still show as firing on the Prometheus `/alerts` page, but no notifications go out. Everything is silent and nothing looks wrong, which is why this alert should be routed through a channel that does not depend on the same Alertmanager.

- **Severity**: Warning (`warning`)
- **Fires after**: 10m
- Part of the [Prometheus alert rules](/alert-rules/prometheus) (`prometheus.yml`)

## The rule

```promql
# Without max_over_time, failed scrapes could create false negatives, see
# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
max_over_time(prometheus_notifications_alertmanagers_discovered{job="prometheus-k8s",namespace="monitoring"}[5m]) < 1
```

Alert message: `Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers.`

## Common causes

- The `alerting` section of the configuration is missing or was removed.
- Alertmanager discovery returns nothing: wrong service name, namespace or port name. With the Operator, check `spec.alerting.alertmanagers` in the Prometheus resource.
- Prometheus lacks RBAC permissions to list the endpoints of the Alertmanager service.
- All Alertmanager Pods are down, so the service has no endpoints.

## How to fix it

1. Check whether the Alertmanager instances are healthy and reachable;
1. Confirm Alertmanager discovery on the Prometheus /status page;
1. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
1. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

## Notes

- The Prometheus `/status` page (Runtime & Build Information) lists the Alertmanagers it has discovered.
- The expression selects `job="prometheus-k8s"`, `namespace="monitoring"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `prometheus_notifications_alertmanagers_discovered` (Prometheus's own metrics)

## Related alerts

- [PrometheusErrorSendingAlertsToAnyAlertmanager](/alert-rules/prometheus#prometheuserrorsendingalertstoanyalertmanager): …% minimum errors while sending alerts from Prometheus …/… to any Alertmanager.
- [PrometheusErrorSendingAlertsToSomeAlertmanagers](/alert-rules/prometheus#prometheuserrorsendingalertstosomealertmanagers): …% errors while sending alerts from Prometheus …/… to Alertmanager ….
- [PrometheusNotificationQueueRunningFull](/alert-rules/prometheus#prometheusnotificationqueuerunningfull): Alert notification queue of Prometheus …/… is running full.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Prometheus rule at once as [`prometheus.yml`](pathname:///alert-rules/prometheus.yml).

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

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
