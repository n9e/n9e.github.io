---
title: "KubePersistentVolumeFillingUp alert: what it means and how to fix it"
sidebar_label: "KubePersistentVolumeFillingUp"
sidebar_position: 15
description: "What the KubePersistentVolumeFillingUp Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

A PersistentVolume has less than 3% of its space left, as reported by the kubelet on the node that mounts it. Databases, queues and other stateful services usually stop accepting writes or crash once the volume is full, so this one is critical.

- **Severity**: Critical (`critical`)
- **Fires after**: 1m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
(
  kubelet_volume_stats_available_bytes{job="kubelet", metrics_path="/metrics"}
    /
  kubelet_volume_stats_capacity_bytes{job="kubelet", metrics_path="/metrics"}
) < 0.03
and
kubelet_volume_stats_used_bytes{job="kubelet", metrics_path="/metrics"} > 0
unless on(namespace, persistentvolumeclaim)
kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1
unless on(namespace, persistentvolumeclaim)
kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

Alert message: `The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free.`

## Common causes

- Data has simply grown: tables, indexes, topic logs or object counts outpaced the size chosen at creation.
- Retention or cleanup stopped working: log rotation, compaction, TTL jobs or backups that delete old copies.
- Temporary files, dumps or core files written to the data volume and never removed.
- The volume was sized for a test environment and reused in production.

## How to fix it

1. Run kubectl get pvc -n \<ns> to find the PVC and PV;
1. kubectl exec into a Pod using the volume and use du to find the largest directories;
1. Clean up logs and temporary data;
1. If the StorageClass supports online expansion, kubectl edit pvc and raise spec.resources.requests.storage; otherwise migrate the data.

## Notes

- Volumes mounted read-only by many Pods (`ReadOnlyMany`) are skipped. You can also silence one PVC by labelling it `excluded_from_alerts=true`, but kube-state-metrics only exports PVC labels that are listed in its `--metric-labels-allowlist` flag, so add that label there first.
- The metrics come from the kubelet (`kubelet_volume_stats_*`). Volumes whose driver does not report usage statistics never produce them, so the rule stays silent for those volumes.
- The expression selects `job="kubelet"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `kubelet_volume_stats_available_bytes` (kubelet)
- `kubelet_volume_stats_capacity_bytes` (kubelet)
- `kubelet_volume_stats_used_bytes` (kubelet)
- `kube_persistentvolumeclaim_access_mode` (kube-state-metrics)
- `kube_persistentvolumeclaim_labels` (kube-state-metrics)

## Related alerts

- [KubePersistentVolumeInodesFillingUp](/alert-rules/kubernetes#kubepersistentvolumeinodesfillingup): The PersistentVolume claimed by … in Namespace … only has … free inodes.
- [KubePersistentVolumeErrors](/alert-rules/kubernetes#kubepersistentvolumeerrors): The persistent volume … has status ….
- [KubeStatefulSetReplicasMismatch](/alert-rules/kubernetes/kubestatefulsetreplicasmismatch): StatefulSet …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubePersistentVolumeFillingUp
  expr: |-
    (
      kubelet_volume_stats_available_bytes{job="kubelet", metrics_path="/metrics"}
        /
      kubelet_volume_stats_capacity_bytes{job="kubelet", metrics_path="/metrics"}
    ) < 0.03
    and
    kubelet_volume_stats_used_bytes{job="kubelet", metrics_path="/metrics"} > 0
    unless on(namespace, persistentvolumeclaim)
    kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1
    unless on(namespace, persistentvolumeclaim)
    kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubepersistentvolumefillingup"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
