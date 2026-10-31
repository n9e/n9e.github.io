---
title: "KubeCPUOvercommit 告警：含义、常见原因与处置"
sidebar_label: "KubeCPUOvercommit"
sidebar_position: 5
description: "Prometheus 告警 KubeCPUOvercommit 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

集群里所有 Pod 申请的 CPU，已经超过「去掉最大那台节点后」集群能提供的量。换句话说，集群扛不住任何一台节点宕机：那台节点上的 Pod 将无处可调度。这是容量预警，不是故障；它看的是 requests，不是实际 CPU 用量。

- **级别**：警告（`warning`）
- **持续**：10 分钟
- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

```promql
sum(namespace_cpu:kube_pod_container_resource_requests:sum{job="kube-state-metrics",}) by (cluster) - (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
and
(sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
```

告警信息：`Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure.`

## 常见原因

- 负载增长（副本数增加、HPA 扩容），节点池却没有跟着扩。
- 节点被手动或被自动扩缩容缩掉了。
- requests 设得远高于容器实际用量，集群看起来比实际更满。
- 有一台节点比其它节点大很多，「去掉最大节点」预留的量就很大。

## 处置步骤

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
1. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
1. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
1. 冗余确实不足的扩容节点。

## 补充说明

- 表达式用到 kubernetes-mixin 里的 recording rule `namespace_cpu:kube_pod_container_resource_requests:sum`。没加载这条 recording rule，规则永远不会触发。
- 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `namespace_cpu:kube_pod_container_resource_requests:sum`（kubernetes-mixin 的 recording rule）
- `kube_node_status_allocatable`（kube-state-metrics）

## 相关告警

- [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit)：Cluster … has overcommitted memory resource requests for Pods by … bytes and cannot tolerate node failure.
- [KubeCPUQuotaOvercommit](/alert-rules/kubernetes#kubecpuquotaovercommit)：Cluster …  has overcommitted CPU resource requests for Namespaces.
- [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout)：HPA …/… has been running at max replicas for longer than 15 minutes.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubeCPUOvercommit
  expr: |-
    sum(namespace_cpu:kube_pod_container_resource_requests:sum{job="kube-state-metrics",}) by (cluster) - (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
    and
    (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubecpuovercommit"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
