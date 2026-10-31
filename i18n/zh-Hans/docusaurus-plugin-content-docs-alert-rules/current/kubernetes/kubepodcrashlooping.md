---
title: "KubePodCrashLooping 告警：含义、常见原因与处置"
sidebar_label: "KubePodCrashLooping"
sidebar_position: 16
description: "Prometheus 告警 KubePodCrashLooping 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

容器反复退出，kubelet 以逐渐拉长的退避间隔（从 10 秒到最长 5 分钟）重启它，等待原因显示为 `CrashLoopBackOff`。规则的条件是：最近 5 分钟内 kube-state-metrics 报告过这个原因，并且持续 15 分钟。循环期间这个容器不提供服务；如果所有副本都在循环，这个负载就等于挂了。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

```promql
max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics"}[5m]) >= 1
```

告警信息：`Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: "CrashLoopBackOff").`

## 常见原因

- 应用启动即退出：配置值写错、缺环境变量、数据库迁移失败。
- 依赖连不上（数据库、消息队列、其它服务），进程直接退出而不是重试。
- 容器超出内存限制被杀，`lastState.terminated.reason` 显示 `OOMKilled`，退出码 137。
- 存活探针（liveness probe）太严，或者在应用就绪前就开始检测，把正常的容器反复杀掉。
- 镜像的启动命令或 entrypoint 写错，或者镜像的 CPU 架构不对。

## 处置步骤

1. kubectl logs \<pod> -n \<ns> --previous 看上一次退出前的日志，这是最关键的一步；
1. kubectl describe pod 看退出码与 Events：137 通常是 OOM 或被 kill，1/2 多为应用自身启动失败；
1. 配置或依赖问题（连不上数据库、ConfigMap/Secret 缺失）先修依赖再拉起；
1. OOM 的对照 resources.limits.memory 与实际用量调整，或修复应用内存泄漏。

## 补充说明

- 想最快看到上一次为什么退出，执行 `kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState.terminated}'`，会打印退出原因、退出码和时间。
- 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `kube_pod_container_status_waiting_reason`（kube-state-metrics）

## 相关告警

- [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting)：pod/… in namespace … on container … has been in waiting state for longer than 1 hour.
- [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready)：Pod …/… has been in a non-ready state for longer than 15 minutes.
- [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch)：Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubePodCrashLooping
  expr: |-
    max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics"}[5m]) >= 1
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: \"CrashLoopBackOff\")."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubepodcrashlooping"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
