---
title: "KubeletTooManyPods alert: what it means and how to fix it"
sidebar_label: "KubeletTooManyPods"
sidebar_position: 12
description: "What the KubeletTooManyPods Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

A node is running more than 95% of the Pods it can hold, as set by the kubelet's `maxPods` (110 by default). When it reaches the limit, new Pods that would land there stay Pending, and a crowded node is more likely to show kubelet slowness.

- **Severity**: Info (`info`)
- **Fires after**: 15m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
count by(cluster, node) (
  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})
)
/
max by(cluster, node) (
  kube_node_status_capacity{job="kube-state-metrics",resource="pods"} != 1
) > 0.95
```

Alert message: `Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.`

## Common causes

- Many small Pods packed onto large nodes, which hit the Pod limit before CPU or memory run out.
- DaemonSets and sidecar-heavy workloads using up slots on every node.
- Completed or failed Pods that have not been garbage-collected yet.
- On some managed clusters the Pod limit is tied to the number of IP addresses a node can get, so it is lower than 110. On Amazon EKS with the VPC CNI, for example, it depends on the instance type.

## How to fix it

1. Run kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l for the actual count;
1. Compare against the kubelet maxPods setting (110 by default);
1. Use kubectl drain or scheduling policy to move some Pods to other nodes;
1. If you genuinely need higher density, raise maxPods but reassess node CPU/memory/PLEG pressure at the same time.

## Notes

- The ratio counts Pods in the `Running` phase against the node capacity reported by kube-state-metrics.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `kube_pod_status_phase` (kube-state-metrics)
- `kube_pod_info` (kube-state-metrics)
- `kube_node_status_capacity` (kube-state-metrics)

## Related alerts

- [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready): … has been unready for more than 15 minutes.
- [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready): Pod …/… has been in a non-ready state for longer than 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeletTooManyPods
  expr: |-
    count by(cluster, node) (
      (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})
    )
    /
    max by(cluster, node) (
      kube_node_status_capacity{job="kube-state-metrics",resource="pods"} != 1
    ) > 0.95
  for: 15m
  labels:
    severity: info
  annotations:
    summary: "Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubelettoomanypods"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
