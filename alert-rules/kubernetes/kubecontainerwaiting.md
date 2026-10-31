# KubeContainerWaiting alert: what it means and how to fix it

What the KubeContainerWaiting Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

A container has been in the `Waiting` state for more than an hour: it is neither running nor terminated. The waiting reason tells you which step it is stuck on, from pulling the image to mounting volumes to the back-off between crash restarts.

* **Severity**: Warning (`warning`)
* **Fires after**: 60m
* Part of the [Kubernetes alert rules](https://n9e.github.io/alert-rules/kubernetes.md) (`kubernetes.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
sum by (namespace, pod, container, cluster) (kube_pod_container_status_waiting_reason{job="kube-state-metrics"}) > 0
```

Alert message: `pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour.`

## Common causes[​](#common-causes "Direct link to Common causes")

* `ImagePullBackOff` or `ErrImagePull`: wrong image name or tag, missing pull credentials, or the registry is unreachable or rate limiting.
* `CreateContainerConfigError`: a ConfigMap, Secret or key that the container references does not exist.
* `ContainerCreating` for a long time: a volume cannot be attached or mounted, or the network plugin cannot set up the Pod network.
* `CrashLoopBackOff`: the container keeps crashing; KubePodCrashLooping fires as well.
* `PodInitializing`: an init container has not finished.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Run kubectl describe pod \<pod> -n \<ns> and read the Waiting Reason;
2. For ImagePullBackOff, check the image name, tag and pull credentials (imagePullSecrets);
3. For CreateContainerConfigError, check the referenced ConfigMap/Secret exists;
4. For CrashLoopBackOff, follow the crash loop path and read the --previous logs.

## Notes[​](#notes "Direct link to Notes")

* The rule sums `kube_pod_container_status_waiting_reason` without filtering on the reason, so every waiting reason counts. Group the alert by the `reason` label, or check it with `kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].state.waiting}'`.
* The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `kube_pod_container_status_waiting_reason` (kube-state-metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [KubePodCrashLooping](https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping.md): Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
* [KubePodNotReady](https://n9e.github.io/alert-rules/kubernetes/kubepodnotready.md): Pod …/… has been in a non-ready state for longer than 15 minutes.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml).

```
- alert: KubeContainerWaiting

  expr: |-

    sum by (namespace, pod, container, cluster) (kube_pod_container_status_waiting_reason{job="kube-state-metrics"}) > 0

  for: 60m

  labels:

    severity: warning

  annotations:

    summary: "pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubecontainerwaiting"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
