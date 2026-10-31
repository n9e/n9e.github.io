# KubePodCrashLooping alert: what it means and how to fix it

What the KubePodCrashLooping Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A container keeps exiting and the kubelet is restarting it with a growing back-off delay (from 10 seconds up to 5 minutes), so its waiting reason reads `CrashLoopBackOff`. The rule fires when kube-state-metrics has reported that reason at any point in the last 5 minutes, for 15 minutes in a row. While the loop lasts the container serves nothing; if every replica is looping, the workload is down.

* **Severity**: Warning (`warning`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics"}[5m]) >= 1
```

Alert message: `Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: "CrashLoopBackOff").`

## Common causes[​](#common-causes "Direct link to Common causes")

* The application exits on startup: a bad configuration value, a missing environment variable, or a failed migration.
* A dependency is unreachable (database, message queue, another service) and the process exits instead of retrying.
* The container is killed for exceeding its memory limit. `lastState.terminated.reason` shows `OOMKilled` and the exit code is 137.
* A liveness probe that is too strict, or that starts before the application is ready, keeps killing a healthy container.
* The image runs the wrong command or entrypoint, or is built for a different CPU architecture.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl logs \<pod> -n \<ns> --previous to see the log before the last exit — this is the key step;
2. Run kubectl describe pod for the exit code and Events: 137 usually means OOM or killed, 1/2 usually means the application failed to start;
3. For config or dependency problems (unreachable database, missing ConfigMap/Secret), fix the dependency first;
4. For OOM, compare resources.limits.memory against actual usage, or fix the application's memory leak.

## Notes[​](#notes "Direct link to Notes")

* The quickest way to see why the last run ended is `kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState.terminated}'`, which prints the reason, exit code and timestamps.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_pod_container_status_waiting_reason` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeContainerWaiting](https://n9e.github.io/alert-rules/kubernetes/kubecontainerwaiting.md): pod/… in namespace … on container … has been in waiting state for longer than 1 hour.
* [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md): Pod …/… has been in a non-ready state for longer than 15 minutes.
* [KubeDeploymentReplicasMismatch](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md): Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
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

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
