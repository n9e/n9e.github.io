---
title: "KubePodCrashLooping alert: what it means and how to fix it"
sidebar_label: "KubePodCrashLooping"
sidebar_position: 16
description: "What the KubePodCrashLooping Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

A container keeps exiting and the kubelet is restarting it with a growing back-off delay (from 10 seconds up to 5 minutes), so its waiting reason reads `CrashLoopBackOff`. The rule fires when kube-state-metrics has reported that reason at any point in the last 5 minutes, for 15 minutes in a row. While the loop lasts the container serves nothing; if every replica is looping, the workload is down.

- **Severity**: Warning (`warning`)
- **Fires after**: 15m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics"}[5m]) >= 1
```

Alert message: `Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: "CrashLoopBackOff").`

## Common causes

- The application exits on startup: a bad configuration value, a missing environment variable, or a failed migration.
- A dependency is unreachable (database, message queue, another service) and the process exits instead of retrying.
- The container is killed for exceeding its memory limit. `lastState.terminated.reason` shows `OOMKilled` and the exit code is 137.
- A liveness probe that is too strict, or that starts before the application is ready, keeps killing a healthy container.
- The image runs the wrong command or entrypoint, or is built for a different CPU architecture.

## How to fix it

1. Run kubectl logs \<pod> -n \<ns> --previous to see the log before the last exit — this is the key step;
1. Run kubectl describe pod for the exit code and Events: 137 usually means OOM or killed, 1/2 usually means the application failed to start;
1. For config or dependency problems (unreachable database, missing ConfigMap/Secret), fix the dependency first;
1. For OOM, compare resources.limits.memory against actual usage, or fix the application's memory leak.

## Notes

- The quickest way to see why the last run ended is `kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState.terminated}'`, which prints the reason, exit code and timestamps.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `kube_pod_container_status_waiting_reason` (kube-state-metrics)

## Related alerts

- [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting): pod/… in namespace … on container … has been in waiting state for longer than 1 hour.
- [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready): Pod …/… has been in a non-ready state for longer than 15 minutes.
- [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch): Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubePodCrashLooping
  expr: |-
    max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics"}[5m]) >= 1
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: \"CrashLoopBackOff\")."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
