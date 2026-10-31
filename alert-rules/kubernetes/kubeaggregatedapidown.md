---
title: "KubeAggregatedAPIDown alert: what it means and how to fix it"
sidebar_label: "KubeAggregatedAPIDown"
sidebar_position: 3
description: "What the KubeAggregatedAPIDown Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

An aggregated API, an APIService that the Kubernetes API server proxies to another service, has been available less than 85% of the time over the last 10 minutes. The most common one is `v1beta1.metrics.k8s.io` from metrics-server; others come from prometheus-adapter, custom metrics adapters and various operators.

- **Severity**: Warning (`warning`)
- **Fires after**: 5m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
(1 - max by(name, namespace, cluster)(avg_over_time(aggregator_unavailable_apiservice{job="apiserver"}[10m]))) * 100 < 85
```

Alert message: `Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.`

## Common causes

- The backing Pods (metrics-server, prometheus-adapter) are crashing, not ready, or scaled to zero.
- The API server cannot reach the backing service: a network policy, a firewall, or a broken Service or endpoints.
- TLS problems between the API server and the backend, such as an expired serving certificate or a wrong `caBundle` on the APIService.
- The APIService still exists but points to a service that was uninstalled.

## How to fix it

1. Run kubectl get apiservice to identify the APIService;
1. Run kubectl -n \<ns> get pod to check its backing Pods;
1. Read that Pod's logs for startup or runtime errors;
1. After recovery, verify with something like kubectl top node that the functionality is back.

## Notes

- Effects depend on the API. When the metrics API is down, `kubectl top` fails and HPAs that scale on CPU or memory stop scaling. A broken APIService can also stall namespace deletion, because the namespace controller cannot list resources from that group.
- The expression selects `job="apiserver"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `aggregator_unavailable_apiservice` (kube-apiserver)

## Related alerts

- [KubeAggregatedAPIErrors](/alert-rules/kubernetes#kubeaggregatedapierrors): Kubernetes aggregated API …/… has reported errors. It has appeared unavailable … times averaged over the past 10m.
- [KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn): The API server is burning too much error budget.
- [KubeHpaReplicasMismatch](/alert-rules/kubernetes#kubehpareplicasmismatch): HPA …/… has not matched the desired number of replicas for longer than 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeAggregatedAPIDown
  expr: |-
    (1 - max by(name, namespace, cluster)(avg_over_time(aggregator_unavailable_apiservice{job="apiserver"}[10m]))) * 100 < 85
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeaggregatedapidown"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
