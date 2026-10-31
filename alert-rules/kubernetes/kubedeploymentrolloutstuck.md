---
title: "KubeDeploymentRolloutStuck alert: what it means and how to fix it"
sidebar_label: "KubeDeploymentRolloutStuck"
sidebar_position: 8
description: "What the KubeDeploymentRolloutStuck Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

A Deployment's `Progressing` condition is `False`. Kubernetes sets this, with reason `ProgressDeadlineExceeded`, when a rollout has not made progress within `progressDeadlineSeconds` (600 seconds by default). Kubernetes does not roll back on its own: old and new ReplicaSets stay as they are, so you may be running a mix of versions until someone acts.

- **Severity**: Warning (`warning`)
- **Fires after**: 15m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
kube_deployment_status_condition{condition="Progressing", status="false",job="kube-state-metrics"}
!= 0
```

Alert message: `Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes.`

## Common causes

- The new version crashes or fails its readiness probe, so new Pods never become available.
- The new Pods cannot be scheduled, or their image cannot be pulled.
- The new version needs more CPU or memory than the namespace quota or the nodes have left.
- `maxUnavailable` is 0 and the cluster has no room for the extra surge Pod.

## How to fix it

1. Run kubectl rollout status deploy/\<name> -n \<ns> to see which replica it is stuck on;
1. Run kubectl describe pod to see why the new Pod is not ready (image, probe, resources);
1. If it cannot be fixed quickly, kubectl rollout undo deploy/\<name> to roll back;
1. After fixing, redeploy and review whether maxSurge/maxUnavailable are sensible.

## Notes

- `kubectl rollout status deploy/<name> -n <ns>` exits with an error once the deadline is exceeded, so the same signal can fail a CI/CD pipeline before this alert fires.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `kube_deployment_status_condition` (kube-state-metrics)

## Related alerts

- [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch): Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.
- [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping): Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
- [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting): pod/… in namespace … on container … has been in waiting state for longer than 1 hour.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeDeploymentRolloutStuck
  expr: |-
    kube_deployment_status_condition{condition="Progressing", status="false",job="kube-state-metrics"}
    != 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubedeploymentrolloutstuck"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
