# KubeQuotaAlmostFull alert: what it means and how to fix it

What the KubeQuotaAlmostFull Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A namespace is using between 90% and 100% of one of its ResourceQuota limits (CPU, memory, Pod count, storage and so on). Nothing is broken yet. Once the quota is full, the API server rejects new Pods and objects in that namespace, which typically shows up as a failed rollout or a scale-out that never happens.

* **Severity**: Info (`info`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  > 0.9 < 1
```

Alert message: `Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.`

## Common causes[​](#common-causes "Direct link to Common causes")

* The team has grown its workloads and the quota was never revisited.
* An HPA scaled out and is now near the ceiling the quota allows.
* Finished Pods, old ReplicaSets or unused PVCs still count against the quota.
* A rollout needs room for surge Pods on top of the current replicas.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
2. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
3. Check for stopped-but-uncleaned resources still holding quota;
4. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

## Notes[​](#notes "Direct link to Notes")

* This is an info-level rule meant for the namespace owner. KubeQuotaFullyUsed and KubeQuotaExceeded are the louder follow-ups.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_resourcequota` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeQuotaFullyUsed](https://n9e.github.io/alert-rules/kubernetes.md#kubequotafullyused): Namespace … is using … of its … quota.
* [KubeQuotaExceeded](https://n9e.github.io/alert-rules/kubernetes.md#kubequotaexceeded): Namespace … is using … of its … quota.
* [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md): Pod …/… has been in a non-ready state for longer than 15 minutes.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubeQuotaAlmostFull

  expr: |-

    kube_resourcequota{job="kube-state-metrics", type="used"}

      / ignoring(instance, job, type)

    (kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

      > 0.9 < 1

  for: 15m

  labels:

    severity: info

  annotations:

    summary: "Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubequotaalmostfull"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
