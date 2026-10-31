# KubeletTooManyPods 告警：含义、常见原因与处置

Prometheus 告警 KubeletTooManyPods 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

一个节点上运行的 Pod 数超过了它能容纳数量的 95%，上限由 kubelet 的 `maxPods` 决定（默认 110）。到上限后，本该落到这台节点的新 Pod 会一直 Pending；Pod 太密的节点也更容易出现 kubelet 变慢的问题。

* **级别**：提醒（`info`）
* **持续**：15 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
count by(cluster, node) (

  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})

)

/

max by(cluster, node) (

  kube_node_status_capacity{job="kube-state-metrics",resource="pods"} != 1

) > 0.95
```

告警信息：`Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* 大节点上塞了很多小 Pod，CPU 和内存还没用完，Pod 数先到顶了。
* DaemonSet 和带大量 sidecar 的负载在每个节点上都占了名额。
* 已完成或失败的 Pod 还没被回收。
* 有些托管集群的 Pod 上限和节点能分到的 IP 数挂钩，比 110 低。比如 Amazon EKS 使用 VPC CNI 时，上限取决于实例类型。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l 确认实际数量；
2. 对照 kubelet 的 maxPods 配置（默认 110）；
3. 用 kubectl drain 或调整调度策略把部分 Pod 迁到其他节点；
4. 确需更高密度的调大 maxPods，但要同步评估节点的 CPU/内存/PLEG 压力。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 比值是 `Running` 阶段的 Pod 数除以 kube-state-metrics 报告的节点容量。
* 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的�指标 "用到的指标的直接链接")

* `kube_pod_status_phase`（kube-state-metrics）
* `kube_pod_info`（kube-state-metrics）
* `kube_node_status_capacity`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubeNodeNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubenodenotready.md)：… has been unready for more than 15 minutes.
* [KubePodNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodnotready.md)：Pod …/… has been in a non-ready state for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeletTooManyPods

  expr: |-

    count by(cluster, node) (

      (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})

    )

    /

    max by(cluster, node) (

      kube_node_status_capacity{job="kube-state-metrics",resource="pods"} != 1

    ) > 0.95

  for: 15m

  labels:

    severity: info

  annotations:

    summary: "Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubelettoomanypods"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
