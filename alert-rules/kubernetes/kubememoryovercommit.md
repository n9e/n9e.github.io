# KubeMemoryOvercommit alert: what it means and how to fix it

What the KubeMemoryOvercommit Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

The memory requested by all Pods in the cluster is more than the cluster could provide if its largest node went away, so a single node failure would leave Pods unschedulable. Like its CPU twin it is about requests, not usage, but memory is less forgiving: Pods that do not fit stay Pending instead of running slower.

* **Severity**: Warning (`warning`)
* **Fires after**: 10m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

and

(sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
```

Alert message: `Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure.`

## Common causes[​](#common-causes "Direct link to Common causes")

* Workloads grew without the node pool growing.
* Nodes were removed or scaled down.
* Memory requests are set well above actual usage.
* One node is much larger than the rest, so the reserve for losing it is large.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
2. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
3. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
4. If headroom is genuinely insufficient, add nodes.

## Notes[​](#notes "Direct link to Notes")

* The expression uses the `namespace_memory:kube_pod_container_resource_requests:sum` recording rule from kubernetes-mixin. Without it, the rule never fires.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `namespace_memory:kube_pod_container_resource_requests:sum` (recording rule from kubernetes-mixin)
* `kube_node_status_allocatable` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeCPUOvercommit](https://n9e.github.io/alert-rules/kubernetes/kubecpuovercommit.md): Cluster … has overcommitted CPU resource requests for Pods by … CPU shares and cannot tolerate node failure.
* [KubeMemoryQuotaOvercommit](https://n9e.github.io/alert-rules/kubernetes.md#kubememoryquotaovercommit): Cluster … has overcommitted memory resource requests for Namespaces.
* [KubeHpaMaxedOut](https://n9e.github.io/alert-rules/kubernetes/kubehpamaxedout.md): HPA …/… has been running at max replicas for longer than 15 minutes.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubeMemoryOvercommit

  expr: |-

    sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

    and

    (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

  for: 10m

  labels:

    severity: warning

  annotations:

    summary: "Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubememoryovercommit"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
