---
title: "Prometheus 告警规则库：附处置步骤"
sidebar_label: "概览"
sidebar_position: 0
slug: /
description: "8 个服务的 238 条 Prometheus 告警规则，涵盖 Kubernetes、Linux、MySQL、Redis 等。每条都有 PromQL 触发条件、级别、持续时间和处置步骤，可免费下载为 Prometheus 规则文件。"
last_reviewed: 2026-10-13
custom_edit_url: null
mdx:
  format: md
---

告警规则只做了一半的事：凌晨三点响起来的时候，值班的人还得知道先查什么。这个规则库收录了夜莺集成模板里的 238 条 PromQL 告警规则，每一条都附有写给值班人的处置步骤。规则使用标准 exporter 的指标名（node_exporter、kube-state-metrics、mysqld_exporter 等），所以既能用在夜莺里，也能直接给 Prometheus 使用。

| 服务 | 规则数 | 指标来源 | 下载 |
| --- | ---: | --- | --- |
| [Kubernetes](/alert-rules/kubernetes) | 77 | kube-state-metrics, cAdvisor (kubelet), apiserver | [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml) |
| [Prometheus](/alert-rules/prometheus) | 30 | Prometheus's own /metrics, Prometheus Operator | [`prometheus.yml`](pathname:///alert-rules/prometheus.yml) |
| [Linux](/alert-rules/linux) | 76 | node_exporter, Categraf, Telegraf | [`linux.yml`](pathname:///alert-rules/linux.yml) |
| [MySQL](/alert-rules/mysql) | 11 | mysqld_exporter, Categraf | [`mysql.yml`](pathname:///alert-rules/mysql.yml) |
| [Redis](/alert-rules/redis) | 12 | redis_exporter, Categraf | [`redis.yml`](pathname:///alert-rules/redis.yml) |
| [Elasticsearch](/alert-rules/elasticsearch) | 11 | elasticsearch_exporter, Categraf | [`elasticsearch.yml`](pathname:///alert-rules/elasticsearch.yml) |
| [MongoDB](/alert-rules/mongodb) | 8 | mongodb_exporter | [`mongodb.yml`](pathname:///alert-rules/mongodb.yml) |
| [Windows](/alert-rules/windows) | 13 | windows_exporter, Categraf | [`windows.yml`](pathname:///alert-rules/windows.yml) |

## 按告警名查处置手册

下面这些是 kubernetes-mixin 和 kube-prometheus 使用的标准告警名，每个都有单独一页，写明含义、常见原因、规则和处置步骤。

- **Kubernetes**: [KubeClientCertificateExpiration](/alert-rules/kubernetes/kubeclientcertificateexpiration), [KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn), [KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown), [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting), [KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit), [KubeDaemonSetMisScheduled](/alert-rules/kubernetes/kubedaemonsetmisscheduled), [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch), [KubeDeploymentRolloutStuck](/alert-rules/kubernetes/kubedeploymentrolloutstuck), [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout), [KubeJobFailed](/alert-rules/kubernetes/kubejobfailed), [KubeletDown](/alert-rules/kubernetes/kubeletdown), [KubeletTooManyPods](/alert-rules/kubernetes/kubelettoomanypods), [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit), [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready), [KubePersistentVolumeFillingUp](/alert-rules/kubernetes/kubepersistentvolumefillingup), [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping), [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready), [KubeQuotaAlmostFull](/alert-rules/kubernetes/kubequotaalmostfull), [KubeStatefulSetReplicasMismatch](/alert-rules/kubernetes/kubestatefulsetreplicasmismatch)
- **Prometheus**: [PrometheusOperatorRejectedResources](/alert-rules/prometheus/prometheusoperatorrejectedresources), [PrometheusBadConfig](/alert-rules/prometheus/prometheusbadconfig), [PrometheusNotConnectedToAlertmanagers](/alert-rules/prometheus/prometheusnotconnectedtoalertmanagers), [PrometheusRemoteWriteBehind](/alert-rules/prometheus/prometheusremotewritebehind), [PrometheusRemoteWriteDesiredShards](/alert-rules/prometheus/prometheusremotewritedesiredshards), [PrometheusRuleFailures](/alert-rules/prometheus/prometheusrulefailures), [PrometheusTargetLimitHit](/alert-rules/prometheus/prometheustargetlimithit)

## 规则格式

- 每个服务一页，列出全部规则的 PromQL 触发条件、级别、持续时间和处置步骤，按产生指标的采集器分组。有单独页面的标准告警名，在服务页上只留简短条目和链接。
- 每个 `.yml` 文件都是标准 Prometheus 规则文件，并通过了 `promtool check rules`。级别写在 `severity` 标签（critical / warning / info），摘要在 `annotations.summary`，`annotations.runbook_url` 指向对应的规则页。
- 阈值只是起点，不是对所有环境都合适的推荐值。启用前请逐条确认。

## 为什么要附处置步骤

没有处置步骤的规则，等于把排查工作整个丢给值班的人。这里的步骤写明了先看什么（上次重启前的日志、退出码、慢查询列表、复制线程状态）以及通常怎么修，让告警自带第一步响应。

## 来源与许可

部分规则表达式改编自社区规则集：[kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）、[kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）、[awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts)（CC BY 4.0）。处置步骤与其余规则来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0）。

## 相关链接

- [集成](/integrations)：每个服务的采集配置与仪表盘
- [夜莺的告警规则](/docs/alerting/overview)
- [规则设计实践](/docs/alerting/best-practices)
