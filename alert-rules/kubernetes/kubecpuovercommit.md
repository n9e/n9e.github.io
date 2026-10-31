---
title: "KubeCPUOvercommit alert: what it means and how to fix it"
sidebar_label: "KubeCPUOvercommit"
sidebar_position: 5
description: "What the KubeCPUOvercommit Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

The CPU requested by all Pods in the cluster is more than the cluster could provide if its largest node went away. In other words, the cluster cannot survive losing one node: the Pods from that node would have nowhere to be rescheduled. It is a capacity warning, not an outage, and it is about requests, not actual CPU usage.

- **Severity**: Warning (`warning`)
- **Fires after**: 10m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
sum(namespace_cpu:kube_pod_container_resource_requests:sum{job="kube-state-metrics",}) by (cluster) - (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
and
(sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
```

Alert message: `Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure.`

## Common causes

- Workloads grew (more replicas, HPAs scaling out) without the node pool growing.
- Nodes were removed or scaled down, by hand or by an autoscaler.
- Requests are set far above what containers actually use, so the cluster looks fuller than it is.
- One node is much larger than the others, so the "lose the largest node" reserve is big.

## How to fix it

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
1. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
1. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
1. If headroom is genuinely insufficient, add nodes.

## Notes

- The expression uses the `namespace_cpu:kube_pod_container_resource_requests:sum` recording rule from kubernetes-mixin. Without that recording rule loaded, the rule never fires.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `namespace_cpu:kube_pod_container_resource_requests:sum` (recording rule from kubernetes-mixin)
- `kube_node_status_allocatable` (kube-state-metrics)

## Related alerts

- [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit): Cluster … has overcommitted memory resource requests for Pods by … bytes and cannot tolerate node failure.
- [KubeCPUQuotaOvercommit](/alert-rules/kubernetes#kubecpuquotaovercommit): Cluster …  has overcommitted CPU resource requests for Namespaces.
- [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout): HPA …/… has been running at max replicas for longer than 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeCPUOvercommit
  expr: |-
    sum(namespace_cpu:kube_pod_container_resource_requests:sum{job="kube-state-metrics",}) by (cluster) - (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
    and
    (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubecpuovercommit"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
