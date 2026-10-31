# KubeHpaMaxedOut 告警：含义、常见原因与处置

Prometheus 告警 KubeHpaMaxedOut 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

一个 HorizontalPodAutoscaler 已经在 `maxReplicas` 上运行了 15 分钟。它不能再加副本，如果负载继续上涨，压力会摊到每个副本身上，延迟和错误率随之上升。

* **级别**：警告（`warning`）
* **持续**：15 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  ==

kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"}
```

告警信息：`HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }} has been running at max replicas for longer than 15 minutes.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* 流量或任务量确实增长，超过了配置的上限。
* `maxReplicas` 是有意设低的（出于成本或下游承载能力），现在成了瓶颈。
* 目标值相对指标设得太低。CPU 利用率是按 requests 计算的，requests 设得很小的容器会一直显得很忙。
* 应用变慢了（依赖变慢、版本回归），每个副本处理得更少，HPA 只能不停扩容。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl describe hpa \<name> -n \<ns> 看当前指标值与目标值的差距；
2. 确认集群是否还有资源支撑更多副本（节点余量）；
3. 有余量的调大 maxReplicas；没余量的先扩容节点；
4. 同时评估单副本的处理能力是否偏低，优化应用比无限扩副本更有效。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 只有集群还放得下更多 Pod，调大 `maxReplicas` 才有用。调之前先看 KubeCPUOvercommit、KubeMemoryOvercommit，或者集群自动扩缩容的状态。
* 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `kube_horizontalpodautoscaler_status_current_replicas`（kube-state-metrics）
* `kube_horizontalpodautoscaler_spec_max_replicas`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubeHpaReplicasMismatch](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubehpareplicasmismatch)：HPA …/… has not matched the desired number of replicas for longer than 15 minutes.
* [KubeCPUOvercommit](https://n9e.github.io/zh/alert-rules/kubernetes/kubecpuovercommit.md)：Cluster … has overcommitted CPU resource requests for Pods by … CPU shares and cannot tolerate node failure.
* [KubeMemoryOvercommit](https://n9e.github.io/zh/alert-rules/kubernetes/kubememoryovercommit.md)：Cluster … has overcommitted memory resource requests for Pods by … bytes and cannot tolerate node failure.
* [KubeDeploymentReplicasMismatch](https://n9e.github.io/zh/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md)：Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeHpaMaxedOut

  expr: |-

    kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

      ==

    kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"}

  for: 15m

  labels:

    severity: warning

  annotations:

    summary: "HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler  }} has been running at max replicas for longer than 15 minutes."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubehpamaxedout"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
