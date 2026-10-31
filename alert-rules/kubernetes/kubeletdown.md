# KubeletDown alert: what it means and how to fix it

What the KubeletDown Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

Prometheus has no kubelet target reporting `up == 1`. Because the rule wraps the whole selector in `absent()`, it only fires when every kubelet is missing or failing to scrape. One broken node does not trigger it. When it fires you lose kubelet and cAdvisor metrics (container CPU and memory, volume usage) for the whole cluster, and any rule built on them goes quiet.

* **Severity**: Critical (`critical`)
* **Fires after**: 15m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
absent(up{job="kubelet", metrics_path="/metrics"} == 1)
```

Alert message: `Kubelet has disappeared from Prometheus target discovery.`

## Common causes[​](#common-causes "Direct link to Common causes")

* The scrape configuration changed: the ServiceMonitor for the kubelet was deleted, or its selector, port name or path no longer matches.
* Prometheus cannot authenticate to the kubelet on port 10250: an expired or missing bearer token, a TLS verification error, or RBAC that no longer grants `nodes/metrics`.
* A network policy or firewall now blocks Prometheus from reaching the nodes.
* Less often, the kubelets really are down across the cluster, for example after a bad configuration rollout.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. On the node run systemctl status kubelet to check the process;
2. Use journalctl -u kubelet -n 200 --no-pager to find the exit or error reason;
3. Common causes are expired certificates, config errors and an unavailable container runtime;
4. After recovery, confirm the node is Ready again and check whether Pods were wrongly evicted meanwhile.

## Notes[​](#notes "Direct link to Notes")

* A single dead kubelet shows up as KubeNodeNotReady, not as this alert. Treat KubeletDown first as a monitoring problem: open the Prometheus `/targets` page and read the scrape error for the kubelet job.
* The expression selects `job="kubelet"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `up` (Prometheus's own metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubeNodeNotReady](https://n9e.github.io/alert-rules/kubernetes/kubenodenotready.md): … has been unready for more than 15 minutes.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubeletDown

  expr: |-

    absent(up{job="kubelet", metrics_path="/metrics"} == 1)

  for: 15m

  labels:

    severity: critical

  annotations:

    summary: "Kubelet has disappeared from Prometheus target discovery."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeletdown"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
