---
title: "KubePodNotReady 告警：含义、常见原因与处置"
sidebar_label: "KubePodNotReady"
sidebar_position: 17
description: "Prometheus 告警 KubePodNotReady 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

一个不属于 Job 的 Pod 已经处于 `Pending`、`Unknown` 或 `Failed` 阶段 15 分钟。Pending 表示容器还没全部启动（常常是还没调度上）；Unknown 通常是所在节点失联；Failed 表示 Pod 已经终止、不会再起来。无论哪种，这个 Pod 都没在提供服务，负载的实际副本数低于期望值。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

```promql
sum by (namespace, pod, cluster) (
  max by(namespace, pod, cluster) (
    kube_pod_status_phase{job="kube-state-metrics", phase=~"Pending|Unknown|Failed"}
  ) * on(namespace, pod, cluster) group_left(owner_kind) topk by(namespace, pod, cluster) (
    1, max by(namespace, pod, owner_kind, cluster) (kube_pod_owner{owner_kind!="Job"})
  )
) > 0
```

告警信息：`Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes.`

## 常见原因

- 没有节点能接收这个 Pod：CPU 或内存不够满足 requests，或者节点选择器、亲和性规则、污点把所有节点都排除了。
- 挂载的 PVC 没有绑定，或者卷所在的可用区与所有可调度节点都不一致。
- 镜像拉不下来（名字或标签写错、缺 `imagePullSecrets`、镜像仓库限流）。
- Pod 所在节点与控制面失联，Pod 被标成 `Unknown`。
- 命名空间的 ResourceQuota 用满，Pod 无法创建。

## 处置步骤

1. kubectl get pod \<pod> -n \<ns> -o wide 看 STATUS 与 READY，再 kubectl describe pod 看 Events；
1. Pending 多为资源不足或调度约束（节点亲和、污点、PVC 未绑定）；ImagePullBackOff 查镜像地址与拉取凭据；
1. Running 但未 Ready 的看就绪探针配置与 kubectl logs \<pod> 里的启动报错；
1. 确认副本数是否已不足以承载流量，不足的先扩容其他健康副本。

## 补充说明

- 名字叫 NotReady，但规则看的是 Pod 阶段，不是 `Ready` 状态。`Running` 但就绪探针失败的 Pod 不会触发它，这种情况通常由 KubeDeploymentReplicasMismatch 或 KubeStatefulSetReplicasMismatch 发现。
- 属于 Job 的 Pod 被排除在外，批处理任务结束或失败不会通过这条规则告警，那种情况看 KubeJobFailed。
- 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `kube_pod_status_phase`（kube-state-metrics）
- `kube_pod_owner`（kube-state-metrics）

## 相关告警

- [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting)：pod/… in namespace … on container … has been in waiting state for longer than 1 hour.
- [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping)：Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
- [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready)：… has been unready for more than 15 minutes.
- [KubeQuotaAlmostFull](/alert-rules/kubernetes/kubequotaalmostfull)：Namespace … is using … of its … quota.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubePodNotReady
  expr: |-
    sum by (namespace, pod, cluster) (
      max by(namespace, pod, cluster) (
        kube_pod_status_phase{job="kube-state-metrics", phase=~"Pending|Unknown|Failed"}
      ) * on(namespace, pod, cluster) group_left(owner_kind) topk by(namespace, pod, cluster) (
        1, max by(namespace, pod, owner_kind, cluster) (kube_pod_owner{owner_kind!="Job"})
      )
    ) > 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubepodnotready"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
