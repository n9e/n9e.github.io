---
title: "PrometheusOperatorRejectedResources alert: what it means and how to fix it"
sidebar_label: "PrometheusOperatorRejectedResources"
sidebar_position: 1
description: "What the PrometheusOperatorRejectedResources Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

The Prometheus Operator rejected one or more monitoring resources (ServiceMonitor, PodMonitor, Probe, PrometheusRule, AlertmanagerConfig) and left them out of the generated configuration. The resources still exist in the cluster and `kubectl apply` succeeded, but the targets they describe are not scraped and the rules they contain are not loaded. Nothing else tells you this has happened.

- **Severity**: Warning (`warning`)
- **Fires after**: 5m
- Part of the [Prometheus alert rules](/alert-rules/prometheus) (`prometheus.yml`)

## The rule

```promql
min_over_time(prometheus_operator_managed_resources{state="rejected",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

Alert message: `Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf "%0.0f" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources.`

## Common causes

- A PrometheusRule contains a rule that does not parse, such as invalid PromQL or a bad duration.
- A ServiceMonitor or PodMonitor reads a file from the Prometheus filesystem (`bearerTokenFile`, TLS file paths) while the Operator is configured to forbid it.
- A resource references a Secret or ConfigMap that does not exist or is in a namespace the Operator cannot read.
- An AlertmanagerConfig uses a receiver or field that does not pass the Operator's validation.

## How to fix it

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
1. For permission errors, verify the Operator's ClusterRole covers the required resources;
1. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
1. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

## Notes

- The `controller` and `resource` labels on the alert tell you which kind of object was rejected. The Operator logs name the object and the reason.
- The expression selects `job="prometheus-operator"`, `namespace="monitoring"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `prometheus_operator_managed_resources` (Prometheus Operator)

## Related alerts

- [PrometheusOperatorReconcileErrors](/alert-rules/prometheus#prometheusoperatorreconcileerrors): … of reconciling operations failed for … controller in … namespace.
- [PrometheusOperatorSyncFailed](/alert-rules/prometheus#prometheusoperatorsyncfailed): Controller … in … namespace fails to reconcile … objects.
- [PrometheusBadConfig](/alert-rules/prometheus/prometheusbadconfig): Prometheus …/… has failed to reload its configuration.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Prometheus rule at once as [`prometheus.yml`](pathname:///alert-rules/prometheus.yml).

```yaml
- alert: PrometheusOperatorRejectedResources
  expr: |-
    min_over_time(prometheus_operator_managed_resources{state="rejected",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf \"%0.0f\" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusoperatorrejectedresources"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
