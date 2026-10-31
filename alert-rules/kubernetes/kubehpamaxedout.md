---
title: "KubeHpaMaxedOut alert: what it means and how to fix it"
sidebar_label: "KubeHpaMaxedOut"
sidebar_position: 9
description: "What the KubeHpaMaxedOut Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

A HorizontalPodAutoscaler has been running at `maxReplicas` for 15 minutes. It cannot add more replicas, so if load keeps rising, each replica takes more of it and latency or error rates follow.

- **Severity**: Warning (`warning`)
- **Fires after**: 15m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}
  ==
kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"}
```

Alert message: `HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler  }} has been running at max replicas for longer than 15 minutes.`

## Common causes

- Real growth in traffic or work that has outgrown the configured maximum.
- `maxReplicas` was set low on purpose (for cost or a downstream limit) and is now the bottleneck.
- The target is too low for the metric. For CPU, utilization is measured against requests, so a container with small requests looks busy all the time.
- The application slowed down (a slow dependency, a regression), so each replica handles less and the HPA keeps scaling out.

## How to fix it

1. Run kubectl describe hpa \<name> -n \<ns> to see the gap between the current and target metric;
1. Confirm the cluster still has resources for more replicas (node headroom);
1. With headroom, raise maxReplicas; without it, add nodes first;
1. Also assess whether per-replica capacity is too low — optimising the application beats scaling replicas indefinitely.

## Notes

- Raising `maxReplicas` only helps if the cluster has room for the extra Pods. Check KubeCPUOvercommit and KubeMemoryOvercommit, or the cluster autoscaler, before you raise it.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `kube_horizontalpodautoscaler_status_current_replicas` (kube-state-metrics)
- `kube_horizontalpodautoscaler_spec_max_replicas` (kube-state-metrics)

## Related alerts

- [KubeHpaReplicasMismatch](/alert-rules/kubernetes#kubehpareplicasmismatch): HPA …/… has not matched the desired number of replicas for longer than 15 minutes.
- [KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit): Cluster … has overcommitted CPU resource requests for Pods by … CPU shares and cannot tolerate node failure.
- [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit): Cluster … has overcommitted memory resource requests for Pods by … bytes and cannot tolerate node failure.
- [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch): Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeHpaMaxedOut
  expr: |-
    kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}
      ==
    kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"}
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler  }} has been running at max replicas for longer than 15 minutes."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubehpamaxedout"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
