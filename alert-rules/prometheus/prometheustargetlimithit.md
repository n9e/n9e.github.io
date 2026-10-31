---
title: "PrometheusTargetLimitHit alert: what it means and how to fix it"
sidebar_label: "PrometheusTargetLimitHit"
sidebar_position: 7
description: "What the PrometheusTargetLimitHit Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

A scrape job discovered more targets than its `target_limit` allows. Prometheus does not scrape just the first N in that case: it marks every target of that scrape pool as failed and scrapes none of them. A whole job goes dark at once, and its `up` series turn to 0.

- **Severity**: Warning (`warning`)
- **Fires after**: 15m
- Part of the [Prometheus alert rules](/alert-rules/prometheus) (`prometheus.yml`)

## The rule

```promql
increase(prometheus_target_scrape_pool_exceeded_target_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Alert message: `Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because the number of targets exceeded the configured target_limit.`

## Common causes

- A ServiceMonitor or PodMonitor selector is too broad and now matches Services or Pods it was not meant to.
- The monitored workload scaled out past the limit, for example a large DaemonSet or an HPA scaling out.
- Relabeling that used to drop unwanted targets was changed or removed.
- The limit was set for a smaller cluster and never revisited.

## How to fix it

1. Confirm the current target count against the limit on the /targets page;
1. Check whether the ServiceMonitor selector is too broad and picking up unwanted targets;
1. Tighten the selector or split across multiple Prometheus instances by business domain;
1. If more targets are genuinely needed, raise target_limit and size the resources accordingly.

## Notes

- The `/targets` page shows the affected job with an error that mentions the target limit. With the Operator, the limit can come from `targetLimit` on a ServiceMonitor or PodMonitor, or `enforcedTargetLimit` on the Prometheus resource.
- The expression selects `job="prometheus-k8s"`, `namespace="monitoring"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `prometheus_target_scrape_pool_exceeded_target_limit_total` (Prometheus's own metrics)

## Related alerts

- [PrometheusScrapeSampleLimitHit](/alert-rules/prometheus#prometheusscrapesamplelimithit): Prometheus …/… has failed … scrapes in the last 5m because some targets exceeded the configured sample_limit.
- [PrometheusLabelLimitHit](/alert-rules/prometheus#prometheuslabellimithit): Prometheus …/… has dropped … targets because some samples exceeded the configured label_limit, label_name_length_limit or label_value_length_limit.
- [PrometheusTargetSyncFailure](/alert-rules/prometheus#prometheustargetsyncfailure): … targets in Prometheus …/… have failed to sync because invalid configuration was supplied.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Prometheus rule at once as [`prometheus.yml`](pathname:///alert-rules/prometheus.yml).

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

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
