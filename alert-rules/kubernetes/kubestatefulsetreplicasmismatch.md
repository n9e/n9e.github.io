# KubeStatefulSetReplicasMismatch alert: what it means and how to fix it

What the KubeStatefulSetReplicasMismatch Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A StatefulSet has had a different number of ready replicas than it runs, for 15 minutes, with no update in progress. Stateful services are often quorum-based (etcd, ZooKeeper, Kafka, databases), so one missing replica can mean reduced redundancy, and two can mean an outage.

* **Severity**: Warning (`warning`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
(

  kube_statefulset_status_replicas_ready{job="kube-state-metrics"}

    !=

  kube_statefulset_status_replicas{job="kube-state-metrics"}

) and (

  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[10m])

    ==

  0

)
```

Alert message: `StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes.`

## Common causes[​](#common-causes "Direct link to Common causes")

* A Pod's PersistentVolumeClaim cannot bind or attach, for example because the volume is in a different zone from the node (`volume node affinity conflict`).
* A replica is crash looping or failing its readiness probe, often because its data on disk is corrupted or its peers won't let it rejoin.
* The Pod cannot be scheduled: no node fits its requests, anti-affinity rules, or zone constraints.
* With the default `OrderedReady` pod management policy, one stuck Pod blocks every Pod with a higher ordinal from being created.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl get pod -n \<ns> -l \<selector> and check by ordinal which replica is stuck;
2. Run kubectl describe pod to check whether its PVC bound successfully — this is the most common sticking point for stateful services;
3. For storage problems, check the PV/StorageClass and the CSI driver;
4. For application problems check kubectl logs; once fixed, the StatefulSet continues automatically.

## Notes[​](#notes "Direct link to Notes")

* Check Pods by ordinal (`<name>-0`, `<name>-1`, …). The lowest ordinal that is not ready is usually the one to fix; the rest are waiting behind it.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_statefulset_status_replicas_ready` (kube-state-metrics)
* `kube_statefulset_status_replicas` (kube-state-metrics)
* `kube_statefulset_status_replicas_updated` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md): Pod …/… has been in a non-ready state for longer than 15 minutes.
* [KubePersistentVolumeFillingUp](https://n9e.github.io/alert-rules/kubernetes/kubepersistentvolumefillingup.md): The PersistentVolume claimed by … in Namespace … is only … free.
* [KubePersistentVolumeErrors](https://n9e.github.io/alert-rules/kubernetes.md#kubepersistentvolumeerrors): The persistent volume … has status ….
* [KubeDeploymentReplicasMismatch](https://n9e.github.io/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md): Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubeStatefulSetReplicasMismatch

  expr: |-

    (

      kube_statefulset_status_replicas_ready{job="kube-state-metrics"}

        !=

      kube_statefulset_status_replicas{job="kube-state-metrics"}

    ) and (

      changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[10m])

        ==

      0

    )

  for: 15m

  labels:

    severity: warning

  annotations:

    summary: "StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubestatefulsetreplicasmismatch"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
