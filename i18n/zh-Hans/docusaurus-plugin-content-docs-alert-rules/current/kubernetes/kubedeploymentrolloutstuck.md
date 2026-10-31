---
title: "KubeDeploymentRolloutStuck 告警：含义、常见原因与处置"
sidebar_label: "KubeDeploymentRolloutStuck"
sidebar_position: 8
description: "Prometheus 告警 KubeDeploymentRolloutStuck 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Deployment 的 `Progressing` 状态为 `False`。发布在 `progressDeadlineSeconds`（默认 600 秒）内没有进展时，Kubernetes 会把它置为 False，原因是 `ProgressDeadlineExceeded`。Kubernetes 不会自动回滚：新旧 ReplicaSet 保持原样，在有人处理之前，线上可能是新旧版本混跑。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

```promql
kube_deployment_status_condition{condition="Progressing", status="false",job="kube-state-metrics"}
!= 0
```

告警信息：`Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes.`

## 常见原因

- 新版本崩溃或就绪探针失败，新 Pod 一直不可用。
- 新 Pod 调度不上去，或者镜像拉不下来。
- 新版本需要的 CPU 或内存超过了命名空间配额或节点剩余容量。
- `maxUnavailable` 为 0，而集群没有空间放下额外的 surge Pod。

## 处置步骤

1. kubectl rollout status deploy/\<name> -n \<ns> 确认卡在第几个副本；
1. kubectl describe pod 看新版本 Pod 为何未就绪（镜像、探针、资源）；
1. 短期无法修复的用 kubectl rollout undo deploy/\<name> 回滚到上一版本；
1. 修复后重新发布，并检查 maxSurge/maxUnavailable 配置是否合理。

## 补充说明

- 超过期限后 `kubectl rollout status deploy/<name> -n <ns>` 会报错退出，CI/CD 流水线可以靠它在这条告警之前就失败。
- 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `kube_deployment_status_condition`（kube-state-metrics）

## 相关告警

- [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch)：Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.
- [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping)：Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
- [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting)：pod/… in namespace … on container … has been in waiting state for longer than 1 hour.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubeDeploymentRolloutStuck
  expr: |-
    kube_deployment_status_condition{condition="Progressing", status="false",job="kube-state-metrics"}
    != 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubedeploymentrolloutstuck"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
