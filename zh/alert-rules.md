# Prometheus 告警规则库：附处置步骤

8 个服务的 238 条 Prometheus 告警规则，涵盖 Kubernetes、Linux、MySQL、Redis 等。每条都有 PromQL 触发条件、级别、持续时间和处置步骤，可免费下载为 Prometheus 规则文件。

最后校对于 2026-10-31

告警规则只做了一半的事：凌晨三点响起来的时候，值班的人还得知道先查什么。这个规则库收录了夜莺集成模板里的 238 条 PromQL 告警规则，每一条都附有写给值班人的处置步骤。规则使用标准 exporter 的指标名（node\_exporter、kube-state-metrics、mysqld\_exporter 等），所以既能用在夜莺里，也能直接给 Prometheus 使用。

| 服务                                                                   | 规则数 | 指标来源                                          | 下载                                                                          |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Kubernetes](https://n9e.github.io/zh/alert-rules/kubernetes.md)       | 77     | kube-state-metrics, cAdvisor (kubelet), apiserver | [`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)       |
| [Prometheus](https://n9e.github.io/zh/alert-rules/prometheus.md)       | 30     | Prometheus's own /metrics, Prometheus Operator    | [`prometheus.yml`](https://n9e.github.io/zh/alert-rules/prometheus.yml)       |
| [Linux](https://n9e.github.io/zh/alert-rules/linux.md)                 | 76     | node\_exporter, Categraf, Telegraf                | [`linux.yml`](https://n9e.github.io/zh/alert-rules/linux.yml)                 |
| [MySQL](https://n9e.github.io/zh/alert-rules/mysql.md)                 | 11     | mysqld\_exporter, Categraf                        | [`mysql.yml`](https://n9e.github.io/zh/alert-rules/mysql.yml)                 |
| [Redis](https://n9e.github.io/zh/alert-rules/redis.md)                 | 12     | redis\_exporter, Categraf                         | [`redis.yml`](https://n9e.github.io/zh/alert-rules/redis.yml)                 |
| [Elasticsearch](https://n9e.github.io/zh/alert-rules/elasticsearch.md) | 11     | elasticsearch\_exporter, Categraf                 | [`elasticsearch.yml`](https://n9e.github.io/zh/alert-rules/elasticsearch.yml) |
| [MongoDB](https://n9e.github.io/zh/alert-rules/mongodb.md)             | 8      | mongodb\_exporter                                 | [`mongodb.yml`](https://n9e.github.io/zh/alert-rules/mongodb.yml)             |
| [Windows](https://n9e.github.io/zh/alert-rules/windows.md)             | 13     | windows\_exporter, Categraf                       | [`windows.yml`](https://n9e.github.io/zh/alert-rules/windows.yml)             |

## 按告警名查处置手册[​](#按告警名查处置手册 "按告警名查处置手册的直接链接")

下面这些是 kubernetes-mixin 和 kube-prometheus 使用的标准告警名，每个都有单独一页，写明含义、常见原因、规则和处置步骤。

* **Kubernetes**: [KubeClientCertificateExpiration](https://n9e.github.io/zh/alert-rules/kubernetes/kubeclientcertificateexpiration.md), [KubeAPIErrorBudgetBurn](https://n9e.github.io/zh/alert-rules/kubernetes/kubeapierrorbudgetburn.md), [KubeAggregatedAPIDown](https://n9e.github.io/zh/alert-rules/kubernetes/kubeaggregatedapidown.md), [KubeContainerWaiting](https://n9e.github.io/zh/alert-rules/kubernetes/kubecontainerwaiting.md), [KubeCPUOvercommit](https://n9e.github.io/zh/alert-rules/kubernetes/kubecpuovercommit.md), [KubeDaemonSetMisScheduled](https://n9e.github.io/zh/alert-rules/kubernetes/kubedaemonsetmisscheduled.md), [KubeDeploymentReplicasMismatch](https://n9e.github.io/zh/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md), [KubeDeploymentRolloutStuck](https://n9e.github.io/zh/alert-rules/kubernetes/kubedeploymentrolloutstuck.md), [KubeHpaMaxedOut](https://n9e.github.io/zh/alert-rules/kubernetes/kubehpamaxedout.md), [KubeJobFailed](https://n9e.github.io/zh/alert-rules/kubernetes/kubejobfailed.md), [KubeletDown](https://n9e.github.io/zh/alert-rules/kubernetes/kubeletdown.md), [KubeletTooManyPods](https://n9e.github.io/zh/alert-rules/kubernetes/kubelettoomanypods.md), [KubeMemoryOvercommit](https://n9e.github.io/zh/alert-rules/kubernetes/kubememoryovercommit.md), [KubeNodeNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubenodenotready.md), [KubePersistentVolumeFillingUp](https://n9e.github.io/zh/alert-rules/kubernetes/kubepersistentvolumefillingup.md), [KubePodCrashLooping](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodcrashlooping.md), [KubePodNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodnotready.md), [KubeQuotaAlmostFull](https://n9e.github.io/zh/alert-rules/kubernetes/kubequotaalmostfull.md), [KubeStatefulSetReplicasMismatch](https://n9e.github.io/zh/alert-rules/kubernetes/kubestatefulsetreplicasmismatch.md)
* **Prometheus**: [PrometheusOperatorRejectedResources](https://n9e.github.io/zh/alert-rules/prometheus/prometheusoperatorrejectedresources.md), [PrometheusBadConfig](https://n9e.github.io/zh/alert-rules/prometheus/prometheusbadconfig.md), [PrometheusNotConnectedToAlertmanagers](https://n9e.github.io/zh/alert-rules/prometheus/prometheusnotconnectedtoalertmanagers.md), [PrometheusRemoteWriteBehind](https://n9e.github.io/zh/alert-rules/prometheus/prometheusremotewritebehind.md), [PrometheusRemoteWriteDesiredShards](https://n9e.github.io/zh/alert-rules/prometheus/prometheusremotewritedesiredshards.md), [PrometheusRuleFailures](https://n9e.github.io/zh/alert-rules/prometheus/prometheusrulefailures.md), [PrometheusTargetLimitHit](https://n9e.github.io/zh/alert-rules/prometheus/prometheustargetlimithit.md)

## 规则格式[​](#规则格式 "规则格式的直接链接")

* 每个服务一页，列出全部规则的 PromQL 触发条件、级别、持续时间和处置步骤，按产生指标的采集器分组。有单独页面的标准告警名，在服务页上只留简短条目和链接。
* 每个 `.yml` 文件都是标准 Prometheus 规则文件，并通过了 `promtool check rules`。级别写在 `severity` 标签（critical / warning / info），摘要在 `annotations.summary`，`annotations.runbook_url` 指向对应的规则页。
* 阈值只是起点，不是对所有环境都合适的推荐值。启用前请逐条确认。

## 为什么要附处置步骤[​](#为什么要附处置��步骤 "为什么要附处置步骤的直接链接")

没有处置步骤的规则，等于把排查工作整个丢给值班的人。这里的步骤写明了先看什么（上次重启前的日志、退出码、慢查询列表、复制线程状态）以及通常怎么修，让告警自带第一步响应。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

部分规则表达式改编自社区规则集：[kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）、[kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）、[awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts)（CC BY 4.0）。处置步骤与其余规则来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0）。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* [集成](https://n9e.github.io/zh/integrations.md)：每个服务的采集配置与仪表盘
* [夜莺的告警规则](https://n9e.github.io/zh/docs/alerting/overview.md)
* [规则设计实践](https://n9e.github.io/zh/docs/alerting/best-practices.md)
