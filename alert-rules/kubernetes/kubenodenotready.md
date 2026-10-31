# KubeNodeNotReady alert: what it means and how to fix it

What the KubeNodeNotReady Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A node's `Ready` condition has not been `True` for 15 minutes; it is either `False` (the kubelet reports a problem) or `Unknown` (the kubelet has stopped reporting). New Pods are not scheduled there, and Pods already on it are evicted once the not-ready or unreachable taint outlasts their toleration, which is 300 seconds by default.

* **Severity**: Warning (`warning`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0
```

Alert message: `{{ $labels.node }} has been unready for more than 15 minutes.`

## Common causes[​](#common-causes "Direct link to Common causes")

* The kubelet or the container runtime (containerd, CRI-O) has stopped or keeps restarting.
* The node cannot reach the API server: network partition, firewall change, or a broken route.
* The node is out of resources: memory, disk, or process IDs, so the kubelet itself cannot work.
* The kubelet client certificate expired and the node can no longer authenticate.
* The machine was shut down, rebooted or reclaimed (for example a spot instance) without being drained.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl describe node \<node> for Conditions and Events to tell MemoryPressure, DiskPressure and a lost kubelet apart;
2. Log in to the node and check kubelet and the container runtime (systemctl status kubelet containerd);
3. Use journalctl -u kubelet -n 200 to locate the problem;
4. If the node cannot recover soon, run kubectl drain so the Pods move promptly instead of waiting for the eviction timeout.

## Notes[​](#notes "Direct link to Notes")

* The expression `status="true" == 0` covers both `False` and `Unknown`. `kubectl describe node <node>` shows which one and the last heartbeat time, which separates "the kubelet says something is wrong" from "the kubelet is gone".
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_node_status_condition` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeletDown](https://n9e.github.io/alert-rules/kubernetes/kubeletdown.md): Kubelet has disappeared from Prometheus target discovery.
* [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md): Pod …/… has been in a non-ready state for longer than 15 minutes.
* [KubeletTooManyPods](https://n9e.github.io/alert-rules/kubernetes/kubelettoomanypods.md): Kubelet '…' is running at … of its Pod capacity.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubeNodeNotReady

  expr: |-

    kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0

  for: 15m

  labels:

    severity: warning

  annotations:

    summary: "{{ $labels.node }} has been unready for more than 15 minutes."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubenodenotready"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
