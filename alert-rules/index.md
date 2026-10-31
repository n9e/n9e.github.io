---
title: "Prometheus alert rules with runbooks"
sidebar_label: "Overview"
sidebar_position: 0
slug: /
description: "238 Prometheus alert rules for 8 services, including Kubernetes, Linux, MySQL and Redis. Every rule has a PromQL condition, a severity, a duration and runbook steps. Free to download as Prometheus rules files."
last_reviewed: 2026-10-13
custom_edit_url: null
mdx:
  format: md
---

An alert rule is only half the job: when it fires at 3 a.m., someone needs to know what to check first. This library collects 238 PromQL alert rules from Nightingale's integration templates, and every one of them comes with runbook steps written for the person on call. The rules use standard exporter metric names (node_exporter, kube-state-metrics, mysqld_exporter and so on), so they work with plain Prometheus as well as with Nightingale.

| Service | Rules | Metrics from | Download |
| --- | ---: | --- | --- |
| [Kubernetes](/alert-rules/kubernetes) | 77 | kube-state-metrics, cAdvisor (kubelet), apiserver | [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml) |
| [Prometheus](/alert-rules/prometheus) | 30 | Prometheus's own /metrics, Prometheus Operator | [`prometheus.yml`](pathname:///alert-rules/prometheus.yml) |
| [Linux](/alert-rules/linux) | 76 | node_exporter, Categraf, Telegraf | [`linux.yml`](pathname:///alert-rules/linux.yml) |
| [MySQL](/alert-rules/mysql) | 11 | mysqld_exporter, Categraf | [`mysql.yml`](pathname:///alert-rules/mysql.yml) |
| [Redis](/alert-rules/redis) | 12 | redis_exporter, Categraf | [`redis.yml`](pathname:///alert-rules/redis.yml) |
| [Elasticsearch](/alert-rules/elasticsearch) | 11 | elasticsearch_exporter, Categraf | [`elasticsearch.yml`](pathname:///alert-rules/elasticsearch.yml) |
| [MongoDB](/alert-rules/mongodb) | 8 | mongodb_exporter | [`mongodb.yml`](pathname:///alert-rules/mongodb.yml) |
| [Windows](/alert-rules/windows) | 13 | windows_exporter, Categraf | [`windows.yml`](pathname:///alert-rules/windows.yml) |

## Runbooks by alert name

These standard alert names, used by kubernetes-mixin and kube-prometheus, each have their own page with the meaning, common causes, the rule and the runbook.

- **Kubernetes**: [KubeClientCertificateExpiration](/alert-rules/kubernetes/kubeclientcertificateexpiration), [KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn), [KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown), [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting), [KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit), [KubeDaemonSetMisScheduled](/alert-rules/kubernetes/kubedaemonsetmisscheduled), [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch), [KubeDeploymentRolloutStuck](/alert-rules/kubernetes/kubedeploymentrolloutstuck), [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout), [KubeJobFailed](/alert-rules/kubernetes/kubejobfailed), [KubeletDown](/alert-rules/kubernetes/kubeletdown), [KubeletTooManyPods](/alert-rules/kubernetes/kubelettoomanypods), [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit), [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready), [KubePersistentVolumeFillingUp](/alert-rules/kubernetes/kubepersistentvolumefillingup), [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping), [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready), [KubeQuotaAlmostFull](/alert-rules/kubernetes/kubequotaalmostfull), [KubeStatefulSetReplicasMismatch](/alert-rules/kubernetes/kubestatefulsetreplicasmismatch)
- **Prometheus**: [PrometheusOperatorRejectedResources](/alert-rules/prometheus/prometheusoperatorrejectedresources), [PrometheusBadConfig](/alert-rules/prometheus/prometheusbadconfig), [PrometheusNotConnectedToAlertmanagers](/alert-rules/prometheus/prometheusnotconnectedtoalertmanagers), [PrometheusRemoteWriteBehind](/alert-rules/prometheus/prometheusremotewritebehind), [PrometheusRemoteWriteDesiredShards](/alert-rules/prometheus/prometheusremotewritedesiredshards), [PrometheusRuleFailures](/alert-rules/prometheus/prometheusrulefailures), [PrometheusTargetLimitHit](/alert-rules/prometheus/prometheustargetlimithit)

## Rule format

- Each service page lists every rule with its PromQL condition, severity, `for` duration and runbook steps, grouped by the collector that produces the metrics. Standard alert names with their own page appear there as a short entry with a link.
- Each `.yml` file is a standard Prometheus rules file and passes `promtool check rules`. Severity is a `severity` label (critical / warning / info), the summary is in `annotations.summary`, and `annotations.runbook_url` links to the rule page.
- Thresholds are starting points, not recommendations for every environment. Review them before you enable a rule.

## Why the runbooks matter

A rule without a runbook moves the investigation to whoever is on call. The steps here say what to look at first (the log before the last restart, the exit code, the slow query list, the replication thread state) and what usually fixes it, so the alert carries its own first response.

## Sources and license

Rule expressions are partly adapted from community collections: [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0), [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0), [awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts) (CC BY 4.0). Runbook steps and the remaining rules come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0).

## Related

- [Integrations](/integrations): collector config and dashboards for each service
- [Alert rules in Nightingale](/docs/alerting/overview)
- [Rule design practices](/docs/alerting/best-practices)
