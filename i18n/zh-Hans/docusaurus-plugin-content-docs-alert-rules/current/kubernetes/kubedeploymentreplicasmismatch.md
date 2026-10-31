---
title: "KubeDeploymentReplicasMismatch 告警：含义、常见原因与处置"
sidebar_label: "KubeDeploymentReplicasMismatch"
sidebar_position: 7
description: "Prometheus 告警 KubeDeploymentReplicasMismatch 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

一个 Deployment 的可用副本数已经 15 分钟低于期望值，并且当前没有在发布（最近 10 分钟内已更新副本数没有变化）。有副本缺失或未就绪，服务在低于计划容量的状态下运行。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

```promql
(
  kube_deployment_spec_replicas{job="kube-state-metrics"}
    >
  kube_deployment_status_replicas_available{job="kube-state-metrics"}
) and (
  changes(kube_deployment_status_replicas_updated{job="kube-state-metrics"}[10m])
    ==
  0
)
```

告警信息：`Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes.`

## 常见原因

- 新 Pod 调度不上去：CPU 或内存不够，或者亲和性规则、污点让所有节点都不满足条件。
- Pod 在崩溃循环或就绪探针一直失败，始终不计入可用副本。
- 部分节点上拉不下镜像。
- 命名空间配额用满，ReplicaSet 创建不了缺的 Pod（看 ReplicaSet 上的 `exceeded quota` 事件）。
- 节点故障带走了副本，替补的 Pod 又因为上面某个原因卡住。

## 处置步骤

1. kubectl describe deploy \<name> -n \<ns> 看 Conditions 与 Events；
1. kubectl get pod -n \<ns> -l \<selector> 看未就绪 Pod 的状态与原因；
1. 常见为资源不足无法调度、镜像拉取失败、就绪探针不通过；
1. 按 Pod 的具体状态排查，资源不足的扩容节点或调低 requests。

## 补充说明

- `changes(...[10m]) == 0` 这一段让规则在正常滚动发布期间保持安静。发布本身卡住不动时，告警的是 KubeDeploymentRolloutStuck。
- 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `kube_deployment_spec_replicas`（kube-state-metrics）
- `kube_deployment_status_replicas_available`（kube-state-metrics）
- `kube_deployment_status_replicas_updated`（kube-state-metrics）

## 相关告警

- [KubeDeploymentRolloutStuck](/alert-rules/kubernetes/kubedeploymentrolloutstuck)：Rollout of deployment …/… is not progressing for longer than 15 minutes.
- [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready)：Pod …/… has been in a non-ready state for longer than 15 minutes.
- [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping)：Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
- [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout)：HPA …/… has been running at max replicas for longer than 15 minutes.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubeDeploymentReplicasMismatch
  expr: |-
    (
      kube_deployment_spec_replicas{job="kube-state-metrics"}
        >
      kube_deployment_status_replicas_available{job="kube-state-metrics"}
    ) and (
      changes(kube_deployment_status_replicas_updated{job="kube-state-metrics"}[10m])
        ==
      0
    )
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubedeploymentreplicasmismatch"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
