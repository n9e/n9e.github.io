---
title: "KubeAPIErrorBudgetBurn alert: what it means and how to fix it"
sidebar_label: "KubeAPIErrorBudgetBurn"
sidebar_position: 2
description: "What the KubeAPIErrorBudgetBurn Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

The Kubernetes API server is failing or slowing down requests fast enough to use up its error budget early. The rules use the multi-window burn-rate method from the Google SRE workbook against a 99% availability target. Each pairs a long and a short window, and both must exceed the threshold: 14.4 over 1h and 5m, and 6 over 6h and 30m, are critical; 3 over 1d and 2h, and 1 over 3d and 6h, are warnings. At a burn rate of 14.4 a 30-day error budget is gone in about two days. Controllers, kubectl and CI pipelines all go through the API server, so its errors spread everywhere.

- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

The template splits this alert into 4 rules with different thresholds, windows and severities. Load all of them together.

### KubeAPIErrorBudgetBurn-S1-120s

Critical (`critical`) · Fires after: 2m

```promql
sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)
and
sum(apiserver_request:burnrate5m) > (14.40 * 0.01000)
```

### KubeAPIErrorBudgetBurn-S1-900s

Critical (`critical`) · Fires after: 15m

```promql
sum(apiserver_request:burnrate6h) > (6.00 * 0.01000)
and
sum(apiserver_request:burnrate30m) > (6.00 * 0.01000)
```

### KubeAPIErrorBudgetBurn-S2-3600s

Warning (`warning`) · Fires after: 60m

```promql
sum(apiserver_request:burnrate1d) > (3.00 * 0.01000)
and
sum(apiserver_request:burnrate2h) > (3.00 * 0.01000)
```

### KubeAPIErrorBudgetBurn-S2-10800s

Warning (`warning`) · Fires after: 180m

```promql
sum(apiserver_request:burnrate3d) > (1.00 * 0.01000)
and
sum(apiserver_request:burnrate6h) > (1.00 * 0.01000)
```

Alert message: `The API server is burning too much error budget.`

## Common causes

- etcd is slow, most often because of disk latency, which drags down writes in particular.
- Clients issue expensive requests, such as LIST calls across all namespaces without a `resourceVersion`, which push latency past the SLO.
- An aggregated API (metrics-server, an admission webhook backend) is failing, and requests that depend on it fail with it.
- An admission webhook is slow or down, and every write it intercepts waits for it.
- The API server is short of CPU or memory, or one replica of several is unhealthy.

## How to fix it

1. Look at the apiserver error code and latency distribution to tell read from write degradation;
1. For write degradation, check etcd disk latency first — that is the most common root cause;
1. For read degradation, look for clients doing wide LIST calls (full enumeration without a resourceVersion);
1. Rate limit the offending client and consider enabling APF (API Priority and Fairness).

## Notes

- The expressions read the `apiserver_request:burnrate*` recording rules from kubernetes-mixin. Load those recording rules too, or the rules never fire.

## Metrics it uses

- `apiserver_request:burnrate1h` (recording rule from kubernetes-mixin)
- `apiserver_request:burnrate5m` (recording rule from kubernetes-mixin)
- `apiserver_request:burnrate6h` (recording rule from kubernetes-mixin)
- `apiserver_request:burnrate30m` (recording rule from kubernetes-mixin)
- `apiserver_request:burnrate1d` (recording rule from kubernetes-mixin)
- `apiserver_request:burnrate2h` (recording rule from kubernetes-mixin)
- `apiserver_request:burnrate3d` (recording rule from kubernetes-mixin)

## Related alerts

- [KubeAPIDown](/alert-rules/kubernetes#kubeapidown): KubeAPI has disappeared from Prometheus target discovery.
- [KubeClientErrors](/alert-rules/kubernetes#kubeclienterrors): Kubernetes API server client '…/…' is experiencing … errors.'
- [KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown): Kubernetes aggregated API …/… has been only …% available over the last 10m.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

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

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
