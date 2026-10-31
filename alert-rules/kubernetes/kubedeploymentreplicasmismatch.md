# KubeDeploymentReplicasMismatch alert: what it means and how to fix it

What the KubeDeploymentReplicasMismatch Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A Deployment has had fewer available replicas than it asks for, for 15 minutes, while no rollout is in progress: the number of updated replicas has not changed in the last 10 minutes. Some replicas are missing or unready, so the service runs below its planned capacity.

* **Severity**: Warning (`warning`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
(

  kube_deployment_spec_replicas{job="kube-state-metrics"}

    >

  kube_deployment_status_replicas_available{job="kube-state-metrics"}

) and (

  changes(kube_deployment_status_replicas_updated{job="kube-state-metrics"}[10m])

    ==

  0

)
```

Alert message: `Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes.`

## Common causes[​](#common-causes "Direct link to Common causes")

* New Pods cannot be scheduled: not enough CPU or memory, or affinity rules and taints leave no eligible node.
* Pods are crash looping or failing their readiness probe, so they never count as available.
* Images cannot be pulled on some nodes.
* The namespace quota is exhausted, so the ReplicaSet cannot create the missing Pods (look for `exceeded quota` events on the ReplicaSet).
* A node failure removed replicas and the replacements are stuck for one of the reasons above.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
2. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
3. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
4. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

## Notes[​](#notes "Direct link to Notes")

* The `changes(...[10m]) == 0` clause keeps the rule quiet during a normal rolling update. A rollout that stops making progress is reported by KubeDeploymentRolloutStuck instead.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_deployment_spec_replicas` (kube-state-metrics)
* `kube_deployment_status_replicas_available` (kube-state-metrics)
* `kube_deployment_status_replicas_updated` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeDeploymentRolloutStuck](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentrolloutstuck.md): Rollout of deployment …/… is not progressing for longer than 15 minutes.
* [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md): Pod …/… has been in a non-ready state for longer than 15 minutes.
* [KubePodCrashLooping](https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping.md): Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
* [KubeHpaMaxedOut](https://n9e.github.io/alert-rules/kubernetes/kubehpamaxedout.md): HPA …/… has been running at max replicas for longer than 15 minutes.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubeDeploymentReplicasMismatch

  expr: |-

    (

      kube_deployment_spec_replicas{job="kube-state-metrics"}

        >

      kube_deployment_status_replicas_available{job="kube-state-metrics"}

    ) and (

      changes(kube_deployment_status_replicas_updated{job="kube-state-metrics"}[10m])

        ==

      0

    )

  for: 15m

  labels:

    severity: warning

  annotations:

    summary: "Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubedeploymentreplicasmismatch"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
