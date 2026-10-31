# KubeMemoryOvercommit 告警：含义、常见原因与处置

Prometheus 告警 KubeMemoryOvercommit 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

集群里所有 Pod 申请的内存，已经超过「去掉最大那台节点后」集群能提供的量，任何一台节点宕机都会让一部分 Pod 无处可调度。和 CPU 那条一样，看的是 requests 而不是实际用量；但内存没有弹性，放不下的 Pod 会一直 Pending，而不是跑得慢一点。

* **级别**：警告（`warning`）
* **持续**：10 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

and

(sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
```

告警信息：`Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* 负载增长，节点池没有跟着扩。
* 节点被缩掉了。
* 内存 requests 设得远高于实际用量。
* 有一台节点比其它节点大很多，为它预留的量就很大。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
2. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
3. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
4. 冗余确实不足的扩容节点。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 表达式用到 kubernetes-mixin 里的 recording rule `namespace_memory:kube_pod_container_resource_requests:sum`。没加载它，规则永远不会触发。
* 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `namespace_memory:kube_pod_container_resource_requests:sum`（kubernetes-mixin 的 recording rule）
* `kube_node_status_allocatable`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubeCPUOvercommit](https://n9e.github.io/zh/alert-rules/kubernetes/kubecpuovercommit.md)：Cluster … has overcommitted CPU resource requests for Pods by … CPU shares and cannot tolerate node failure.
* [KubeMemoryQuotaOvercommit](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubememoryquotaovercommit)：Cluster … has overcommitted memory resource requests for Namespaces.
* [KubeHpaMaxedOut](https://n9e.github.io/zh/alert-rules/kubernetes/kubehpamaxedout.md)：HPA …/… has been running at max replicas for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeMemoryOvercommit

  expr: |-

    sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

    and

    (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

  for: 10m

  labels:

    severity: warning

  annotations:

    summary: "Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubememoryovercommit"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
