# KubePodNotReady alert: what it means and how to fix it

What the KubePodNotReady Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A Pod that is not owned by a Job has been in the `Pending`, `Unknown` or `Failed` phase for 15 minutes. A Pending Pod has not started all its containers (often it has not even been scheduled), an Unknown Pod usually sits on a node that has stopped reporting, and a Failed Pod has terminated for good. Either way the Pod is not serving, and the workload is running with fewer replicas than it asked for.

* **Severity**: Warning (`warning`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
sum by (namespace, pod, cluster) (

  max by(namespace, pod, cluster) (

    kube_pod_status_phase{job="kube-state-metrics", phase=~"Pending|Unknown|Failed"}

  ) * on(namespace, pod, cluster) group_left(owner_kind) topk by(namespace, pod, cluster) (

    1, max by(namespace, pod, owner_kind, cluster) (kube_pod_owner{owner_kind!="Job"})

  )

) > 0
```

Alert message: `Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes.`

## Common causes[​](#common-causes "Direct link to Common causes")

* No node can take the Pod: not enough CPU or memory to satisfy its requests, or node selectors, affinity rules and taints rule out every node.
* A PersistentVolumeClaim it mounts is not bound, or the volume is in a different zone from every eligible node.
* The image cannot be pulled (wrong name or tag, missing `imagePullSecrets`, registry rate limits).
* The node it runs on lost contact with the control plane, which puts the Pod into `Unknown`.
* The namespace hit its ResourceQuota, so the Pod could not be admitted.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
2. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
3. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
4. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

## Notes[​](#notes "Direct link to Notes")

* Despite its name, the rule looks at the Pod phase, not the `Ready` condition. A Pod that is `Running` but failing its readiness probe does not trigger it; KubeDeploymentReplicasMismatch or KubeStatefulSetReplicasMismatch usually catch that case.
* Pods owned by Jobs are excluded, so finished or failed batch work does not page anyone through this rule. Use KubeJobFailed for those.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_pod_status_phase` (kube-state-metrics)
* `kube_pod_owner` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeContainerWaiting](https://n9e.github.io/alert-rules/kubernetes/kubecontainerwaiting.md): pod/… in namespace … on container … has been in waiting state for longer than 1 hour.
* [KubePodCrashLooping](https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping.md): Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
* [KubeNodeNotReady](https://n9e.github.io/alert-rules/kubernetes/kubenodenotready.md): … has been unready for more than 15 minutes.
* [KubeQuotaAlmostFull](https://n9e.github.io/alert-rules/kubernetes/kubequotaalmostfull.md): Namespace … is using … of its … quota.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubePodNotReady

  expr: |-

    sum by (namespace, pod, cluster) (

      max by(namespace, pod, cluster) (

        kube_pod_status_phase{job="kube-state-metrics", phase=~"Pending|Unknown|Failed"}

      ) * on(namespace, pod, cluster) group_left(owner_kind) topk by(namespace, pod, cluster) (

        1, max by(namespace, pod, owner_kind, cluster) (kube_pod_owner{owner_kind!="Job"})

      )

    ) > 0

  for: 15m

  labels:

    severity: warning

  annotations:

    summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubepodnotready"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
