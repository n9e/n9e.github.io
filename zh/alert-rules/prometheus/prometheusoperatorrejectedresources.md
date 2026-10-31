# PrometheusOperatorRejectedResources 告警：含义、常见原因与处置

Prometheus 告警 PrometheusOperatorRejectedResources 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

Prometheus Operator 拒绝了一个或多个监控资源（ServiceMonitor、PodMonitor、Probe、PrometheusRule、AlertmanagerConfig），没有把它们放进生成的配置。这些资源在集群里照样存在，`kubectl apply` 也成功了，但它们描述的目标没有被采集，里面的规则也没有加载。除了这条告警，没有别的地方会提醒你。

* **级别**：警告（`warning`）
* **持续**：5 分钟
* 属于 [Prometheus 告警规则](https://n9e.github.io/zh/alert-rules/prometheus.md)（`prometheus.yml`）

## 规则[​](#规则 "规则的直接链接")

```
min_over_time(prometheus_operator_managed_resources{state="rejected",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

告警信息：`Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf "%0.0f" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* PrometheusRule 里有解析不了的规则，比如 PromQL 写错或时长格式不对。
* ServiceMonitor 或 PodMonitor 要读取 Prometheus 所在文件系统里的文件（`bearerTokenFile`、TLS 文件路径），而 Operator 配置为禁止这种用法。
* 资源引用的 Secret 或 ConfigMap 不存在，或者在 Operator 无权读取的命名空间里。
* AlertmanagerConfig 使用的接收器或字段没有通过 Operator 的校验。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 告警上的 `controller` 和 `resource` 标签说明了被拒的是哪类对象，Operator 日志里有具体对象名和原因。
* 表达式里限定了 `job="prometheus-operator"`、`namespace="monitoring"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `prometheus_operator_managed_resources`（Prometheus Operator）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [PrometheusOperatorReconcileErrors](https://n9e.github.io/zh/alert-rules/prometheus.md#prometheusoperatorreconcileerrors)：… of reconciling operations failed for … controller in … namespace.
* [PrometheusOperatorSyncFailed](https://n9e.github.io/zh/alert-rules/prometheus.md#prometheusoperatorsyncfailed)：Controller … in … namespace fails to reconcile … objects.
* [PrometheusBadConfig](https://n9e.github.io/zh/alert-rules/prometheus/prometheusbadconfig.md)：Prometheus …/… has failed to reload its configuration.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Prometheus 规则：[`prometheus.yml`](https://n9e.github.io/zh/alert-rules/prometheus.yml)。

```
- alert: PrometheusOperatorRejectedResources

  expr: |-

    min_over_time(prometheus_operator_managed_resources{state="rejected",job="prometheus-operator",namespace="monitoring"}[5m]) > 0

  for: 5m

  labels:

    severity: warning

  annotations:

    summary: "Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf \"%0.0f\" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources."

    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusoperatorrejectedresources"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
