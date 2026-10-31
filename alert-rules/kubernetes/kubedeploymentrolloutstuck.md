# KubeDeploymentRolloutStuck alert: what it means and how to fix it

What the KubeDeploymentRolloutStuck Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A Deployment's `Progressing` condition is `False`. Kubernetes sets this, with reason `ProgressDeadlineExceeded`, when a rollout has not made progress within `progressDeadlineSeconds` (600 seconds by default). Kubernetes does not roll back on its own: old and new ReplicaSets stay as they are, so you may be running a mix of versions until someone acts.

* **Severity**: Warning (`warning`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
kube_deployment_status_condition{condition="Progressing", status="false",job="kube-state-metrics"}

!= 0
```

Alert message: `Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes.`

## Common causes[​](#common-causes "Direct link to Common causes")

* The new version crashes or fails its readiness probe, so new Pods never become available.
* The new Pods cannot be scheduled, or their image cannot be pulled.
* The new version needs more CPU or memory than the namespace quota or the nodes have left.
* `maxUnavailable` is 0 and the cluster has no room for the extra surge Pod.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl rollout status deploy/\<name> -n \<ns> to see which replica it is stuck on;
2. Run kubectl describe pod to see why the new Pod is not ready (image, probe, resources);
3. If it cannot be fixed quickly, kubectl rollout undo deploy/\<name> to roll back;
4. After fixing, redeploy and review whether maxSurge/maxUnavailable are sensible.

## Notes[​](#notes "Direct link to Notes")

* `kubectl rollout status deploy/<name> -n <ns>` exits with an error once the deadline is exceeded, so the same signal can fail a CI/CD pipeline before this alert fires.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_deployment_status_condition` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeDeploymentReplicasMismatch](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md): Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.
* [KubePodCrashLooping](https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping.md): Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
* [KubeContainerWaiting](https://n9e.github.io/alert-rules/kubernetes/kubecontainerwaiting.md): pod/… in namespace … on container … has been in waiting state for longer than 1 hour.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
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

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
