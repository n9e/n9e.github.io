# KubeContainerWaiting 告警：含义、常见原因与处置

Prometheus 告警 KubeContainerWaiting 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

一个容器处于 `Waiting` 状态已经超过 1 小时：既没运行，也没终止。等待原因说明它卡在哪一步，可能是拉镜像、挂卷，也可能是崩溃重启之间的退避等待。

* **级别**：警告（`warning`）
* **持续**：60 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
sum by (namespace, pod, container, cluster) (kube_pod_container_status_waiting_reason{job="kube-state-metrics"}) > 0
```

告警信息：`pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* `ImagePullBackOff` 或 `ErrImagePull`：镜像名或标签写错、缺拉取凭据、镜像仓库不可达或限流。
* `CreateContainerConfigError`：容器引用的 ConfigMap、Secret 或其中的 key 不存在。
* 长时间 `ContainerCreating`：卷挂载失败，或者网络插件没能给 Pod 配好网络。
* `CrashLoopBackOff`：容器反复崩溃，KubePodCrashLooping 也会同时告警。
* `PodInitializing`：init 容器还没执行完。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl describe pod \<pod> -n \<ns> 看 Waiting 的 Reason；
2. ImagePullBackOff 检查镜像名、tag 与拉取凭据（imagePullSecrets）；
3. CreateContainerConfigError 检查引用的 ConfigMap/Secret 是否存在；
4. CrashLoopBackOff 按崩溃循环路径处理，看 --previous 日志。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 规则对 `kube_pod_container_status_waiting_reason` 求和时没有按原因过滤，所有等待原因都算。可以按 `reason` 标签给告警分组，或者用 `kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].state.waiting}'` 查看。
* 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `kube_pod_container_status_waiting_reason`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubePodCrashLooping](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodcrashlooping.md)：Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").
* [KubePodNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodnotready.md)：Pod …/… has been in a non-ready state for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeContainerWaiting

  expr: |-

    sum by (namespace, pod, container, cluster) (kube_pod_container_status_waiting_reason{job="kube-state-metrics"}) > 0

  for: 60m

  labels:

    severity: warning

  annotations:

    summary: "pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubecontainerwaiting"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
