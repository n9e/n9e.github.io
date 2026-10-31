---
title: "KubeDaemonSetMisScheduled alert: what it means and how to fix it"
sidebar_label: "KubeDaemonSetMisScheduled"
sidebar_position: 6
description: "What the KubeDaemonSetMisScheduled Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Some of a DaemonSet's Pods are running on nodes where, according to the DaemonSet's current node selector, affinity and the node's taints, they should not run. It rarely breaks anything by itself, but it means the DaemonSet's placement and the cluster's node layout disagree.

- **Severity**: Warning (`warning`)
- **Fires after**: 15m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
kube_daemonset_status_number_misscheduled{job="kube-state-metrics"} > 0
```

Alert message: `{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run.`

## Common causes

- Node labels changed and no longer match the DaemonSet node selector or affinity.
- A `NoSchedule` taint was added to nodes. Pods already there keep running, but they no longer count as correctly placed.
- The DaemonSet spec was updated to target fewer nodes.

## How to fix it

1. Run kubectl get pod -n \<ns> -l \<selector> -o wide to see which nodes they landed on;
1. Check whether the DaemonSet's nodeSelector/affinity matches the node labels;
1. This usually follows a node label change or a DaemonSet update — after correcting it the extra Pods are cleaned up automatically;
1. Delete any leftovers manually.

## Notes

- Decide which side is right. If the DaemonSet should still run there, fix its selector or add a toleration. If it should not, remove the leftover Pods.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `kube_daemonset_status_number_misscheduled` (kube-state-metrics)

## Related alerts

- [KubeDaemonSetNotScheduled](/alert-rules/kubernetes#kubedaemonsetnotscheduled): … Pods of DaemonSet …/… are not scheduled.
- [KubeDaemonSetRolloutStuck](/alert-rules/kubernetes#kubedaemonsetrolloutstuck): DaemonSet …/… has not finished or progressed for at least 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeDaemonSetMisScheduled
  expr: |-
    kube_daemonset_status_number_misscheduled{job="kube-state-metrics"} > 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubedaemonsetmisscheduled"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
