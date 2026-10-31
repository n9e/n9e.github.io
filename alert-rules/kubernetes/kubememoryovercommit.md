---
title: "KubeMemoryOvercommit alert: what it means and how to fix it"
sidebar_label: "KubeMemoryOvercommit"
sidebar_position: 13
description: "What the KubeMemoryOvercommit Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

The memory requested by all Pods in the cluster is more than the cluster could provide if its largest node went away, so a single node failure would leave Pods unschedulable. Like its CPU twin it is about requests, not usage, but memory is less forgiving: Pods that do not fit stay Pending instead of running slower.

- **Severity**: Warning (`warning`)
- **Fires after**: 10m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
and
(sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
```

Alert message: `Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure.`

## Common causes

- Workloads grew without the node pool growing.
- Nodes were removed or scaled down.
- Memory requests are set well above actual usage.
- One node is much larger than the rest, so the reserve for losing it is large.

## How to fix it

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
1. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
1. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
1. If headroom is genuinely insufficient, add nodes.

## Notes

- The expression uses the `namespace_memory:kube_pod_container_resource_requests:sum` recording rule from kubernetes-mixin. Without it, the rule never fires.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `namespace_memory:kube_pod_container_resource_requests:sum` (recording rule from kubernetes-mixin)
- `kube_node_status_allocatable` (kube-state-metrics)

## Related alerts

- [KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit): Cluster … has overcommitted CPU resource requests for Pods by … CPU shares and cannot tolerate node failure.
- [KubeMemoryQuotaOvercommit](/alert-rules/kubernetes#kubememoryquotaovercommit): Cluster …  has overcommitted memory resource requests for Namespaces.
- [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout): HPA …/… has been running at max replicas for longer than 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeMemoryOvercommit
  expr: |-
    sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
    and
    (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubememoryovercommit"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
