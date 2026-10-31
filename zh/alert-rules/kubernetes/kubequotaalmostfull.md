# KubeQuotaAlmostFull 告警：含义、常见原因与处置

Prometheus 告警 KubeQuotaAlmostFull 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

一个命名空间的某项 ResourceQuota（CPU、内存、Pod 数、存储等）已用到 90% 到 100% 之间。现在还没出问题；配额一旦用满，API Server 会拒绝在这个命名空间创建新的 Pod 和对象，通常表现为发布失败，或者该扩容时扩不出来。

* **级别**：提醒（`info`）
* **持续**：15 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  > 0.9 < 1
```

告警信息：`Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* 团队的负载增长了，配额一直没调整。
* HPA 扩容后接近了配额允许的上限。
* 已结束的 Pod、旧的 ReplicaSet、不再使用的 PVC 仍然占着配额。
* 发布时需要在现有副本之外再放下 surge Pod。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl describe quota -n \<ns> 看是哪一项（cpu/memory/pods/storage）触顶；
2. kubectl get pod -n \<ns> -o custom-columns 统计各工作负载的 requests 占用，找出大户；
3. 确认是否有已停止但未清理的资源仍占着配额；
4. 确需更多配额的联系集群管理员调整 ResourceQuota。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 这是提醒级别的规则，应该发给命名空间的负责人。更紧急的后续告警是 KubeQuotaFullyUsed 和 KubeQuotaExceeded。
* 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `kube_resourcequota`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubeQuotaFullyUsed](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubequotafullyused)：Namespace … is using … of its … quota.
* [KubeQuotaExceeded](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubequotaexceeded)：Namespace … is using … of its … quota.
* [KubePodNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodnotready.md)：Pod …/… has been in a non-ready state for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

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

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
