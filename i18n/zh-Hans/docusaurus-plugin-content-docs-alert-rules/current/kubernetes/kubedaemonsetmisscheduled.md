---
title: "KubeDaemonSetMisScheduled 告警：含义、常见原因与处置"
sidebar_label: "KubeDaemonSetMisScheduled"
sidebar_position: 6
description: "Prometheus 告警 KubeDaemonSetMisScheduled 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

DaemonSet 有一部分 Pod 运行在按它当前的节点选择器、亲和性和节点污点来看「不该运行」的节点上。这本身很少直接造成故障，但说明 DaemonSet 的部署范围和集群的节点布局对不上了。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

```promql
kube_daemonset_status_number_misscheduled{job="kube-state-metrics"} > 0
```

告警信息：`{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run.`

## 常见原因

- 节点标签变了，不再匹配 DaemonSet 的节点选择器或亲和性。
- 节点被加了 `NoSchedule` 污点。已经在上面的 Pod 会继续运行，但不再算作放对了位置。
- DaemonSet 的定义改了，覆盖的节点变少了。

## 处置步骤

1. kubectl get pod -n \<ns> -l \<selector> -o wide 看被误调度到哪些节点；
1. 检查 DaemonSet 的 nodeSelector/affinity 与节点标签是否匹配；
1. 通常是节点标签被改动或 DaemonSet 配置更新导致，修正后多余 Pod 会被自动清理；
1. 未自动清理的手工删除对应 Pod。

## 补充说明

- 先判断哪一边是对的。如果 DaemonSet 仍然应该在那些节点上运行，就修它的选择器或加容忍；如果不应该，就清掉残留的 Pod。
- 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `kube_daemonset_status_number_misscheduled`（kube-state-metrics）

## 相关告警

- [KubeDaemonSetNotScheduled](/alert-rules/kubernetes#kubedaemonsetnotscheduled)：… Pods of DaemonSet …/… are not scheduled.
- [KubeDaemonSetRolloutStuck](/alert-rules/kubernetes#kubedaemonsetrolloutstuck)：DaemonSet …/… has not finished or progressed for at least 15 minutes.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubeDaemonSetMisScheduled
  expr: |-
    kube_daemonset_status_number_misscheduled{job="kube-state-metrics"} > 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubedaemonsetmisscheduled"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
