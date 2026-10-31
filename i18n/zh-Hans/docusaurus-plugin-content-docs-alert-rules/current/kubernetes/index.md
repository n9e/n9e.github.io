---
title: "Kubernetes 告警规则：77 条 PromQL 规则与处置步骤"
sidebar_label: "Kubernetes"
sidebar_position: 1
description: "77 条开箱可用的 Kubernetes 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 kube-state-metrics, cAdvisor (kubelet), apiserver。可下载为 Prometheus 规则文件，或导入夜莺。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes
toc_max_heading_level: 2
mdx:
  format: md
---

基于每个集群都已经暴露的指标做的 Kubernetes 告警规则：kube-state-metrics 提供对象状态，kubelet 内置的 cAdvisor 提供容器资源用量，apiserver、kubelet、scheduler、controller-manager 的指标端点覆盖控制面。覆盖 Pod 反复重启与未就绪、发布卡住、副本数不一致、Job 失败、资源超卖、配额吃紧、证书过期和控制面宕机。大部分规则沿用 kubernetes-mixin / kube-prometheus 的告警名（KubePodCrashLooping、KubeNodeNotReady、KubeAPIErrorBudgetBurn 等），和你在 Alertmanager 里见到的名字一致。

## 概览

- **77 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
- **指标来源**：kube-state-metrics, cAdvisor (kubelet), apiserver
- **下载**：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
- 阈值只是起点，启用前请按自己的环境调整。

## 规则一览

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| Deployment Pod 可用性不足70%（replica超过9个pod） | 紧急 | 1 分钟 |
| Job执行失败 | 提醒 | 1 分钟 |
| Pod启动超时 | 警告 | 1 分钟 |
| Pod状态异常 | 紧急 | 1 分钟 |
| Pod频繁重启 | 警告 | 1 分钟 |
| 容器CPU使用率超过80% | 提醒 | 1 分钟 |
| 容器内存超过80% | 提醒 | 1 分钟 |
| Node CPU使用率超过90% | 提醒 | 1 分钟 |
| Node内存使用率超过90% | 警告 | 1 分钟 |
| Node状态异常 | 紧急 | 1 分钟 |
| Node磁盘使用率超过90% | 提醒 | 1 分钟 |
| [KubeClientCertificateExpiration-S2](/alert-rules/kubernetes/kubeclientcertificateexpiration) | 警告 | — |
| [KubeClientCertificateExpiration-S1](/alert-rules/kubernetes/kubeclientcertificateexpiration) | 紧急 | — |
| AggregatedAPIErrors | 警告 | — |
| AggregatedAPIDown | 警告 | 5 分钟 |
| KubeAPIDown | 紧急 | 15 分钟 |
| [KubeAPIErrorBudgetBurn-S1-120秒](/alert-rules/kubernetes/kubeapierrorbudgetburn) | 紧急 | 2 分钟 |
| [KubeAPIErrorBudgetBurn-S1-900秒](/alert-rules/kubernetes/kubeapierrorbudgetburn) | 紧急 | 15 分钟 |
| [KubeAPIErrorBudgetBurn-S2-3600秒](/alert-rules/kubernetes/kubeapierrorbudgetburn) | 警告 | 60 分钟 |
| [KubeAPIErrorBudgetBurn-S2-10800秒](/alert-rules/kubernetes/kubeapierrorbudgetburn) | 警告 | 180 分钟 |
| Deployment副本异常 | 警告 | 10 分钟 |
| StatefulSet副本异常 | 警告 | 10 分钟 |
| DaemonSet未就绪Pod | 警告 | 10 分钟 |
| HPA扩容失败 | 警告 | 5 分钟 |
| Pod处于Failed状态 | 警告 | 5 分钟 |
| Job执行失败 | 警告 | 5 分钟 |
| CPUThrottlingHigh | 提醒 | 15 分钟 |
| [KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown) | 警告 | 5 分钟 |
| KubeAggregatedAPIErrors | 警告 | — |
| KubeAPITerminatedRequests | 警告 | 5 分钟 |
| KubeClientErrors | 警告 | 15 分钟 |
| [KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting) | 警告 | 60 分钟 |
| KubeControllerManagerDown | 紧急 | 15 分钟 |
| [KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit) | 警告 | 10 分钟 |
| KubeCPUQuotaOvercommit | 警告 | 5 分钟 |
| [KubeDaemonSetMisScheduled](/alert-rules/kubernetes/kubedaemonsetmisscheduled) | 警告 | 15 分钟 |
| KubeDaemonSetNotScheduled | 警告 | 10 分钟 |
| KubeDaemonSetRolloutStuck | 警告 | 15 分钟 |
| KubeDeploymentGenerationMismatch | 警告 | 15 分钟 |
| [KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch) | 警告 | 15 分钟 |
| [KubeDeploymentRolloutStuck](/alert-rules/kubernetes/kubedeploymentrolloutstuck) | 警告 | 15 分钟 |
| [KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout) | 警告 | 15 分钟 |
| KubeHpaReplicasMismatch | 警告 | 15 分钟 |
| [KubeJobFailed](/alert-rules/kubernetes/kubejobfailed) | 警告 | 15 分钟 |
| KubeJobNotCompleted | 警告 | — |
| KubeletClientCertificateExpiration | 警告 | — |
| KubeletClientCertificateRenewalErrors | 警告 | 15 分钟 |
| [KubeletDown](/alert-rules/kubernetes/kubeletdown) | 紧急 | 15 分钟 |
| KubeletPlegDurationHigh | 警告 | 5 分钟 |
| KubeletPodStartUpLatencyHigh | 警告 | 15 分钟 |
| KubeletServerCertificateExpiration | 警告 | — |
| KubeletServerCertificateRenewalErrors | 警告 | 15 分钟 |
| [KubeletTooManyPods](/alert-rules/kubernetes/kubelettoomanypods) | 提醒 | 15 分钟 |
| [KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit) | 警告 | 10 分钟 |
| KubeMemoryQuotaOvercommit | 警告 | 5 分钟 |
| [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready) | 警告 | 15 分钟 |
| KubeNodeReadinessFlapping | 警告 | 15 分钟 |
| KubeNodeUnreachable | 警告 | 15 分钟 |
| KubePersistentVolumeErrors | 紧急 | 5 分钟 |
| [KubePersistentVolumeFillingUp](/alert-rules/kubernetes/kubepersistentvolumefillingup) | 紧急 | 1 分钟 |
| KubePersistentVolumeInodesFillingUp | 紧急 | 1 分钟 |
| [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping) | 警告 | 15 分钟 |
| [KubePodNotReady](/alert-rules/kubernetes/kubepodnotready) | 警告 | 15 分钟 |
| [KubeQuotaAlmostFull](/alert-rules/kubernetes/kubequotaalmostfull) | 提醒 | 15 分钟 |
| KubeQuotaExceeded | 警告 | 15 分钟 |
| KubeQuotaFullyUsed | 提醒 | 15 分钟 |
| KubeSchedulerDown | 紧急 | 15 分钟 |
| KubeStatefulSetGenerationMismatch | 警告 | 15 分钟 |
| [KubeStatefulSetReplicasMismatch](/alert-rules/kubernetes/kubestatefulsetreplicasmismatch) | 警告 | 15 分钟 |
| KubeStatefulSetUpdateNotRolledOut | 警告 | 15 分钟 |
| KubeVersionMismatch | 警告 | 15 分钟 |
| Node运行太多Pod | 警告 | 15 分钟 |
| Node状态抖动 | 警告 | 15 分钟 |
| Pod启动耗时高 | 警告 | 15 分钟 |
| 客户端证书过期-S1 | 紧急 | — |
| 服务端证书过期-S1 | 紧急 | — |
| kubelet故障 | 紧急 | 15 分钟 |

## kube-state-metrics、cAdvisor 与控制面（77）

### Deployment Pod 可用性不足70%（replica超过9个pod）

紧急 · 1 分钟 · 触发条件:

```promql
kube_deployment_status_replicas_unavailable and kube_deployment_status_replicas_available{} / kube_deployment_status_replicas{} * 100 < 70 and kube_deployment_status_replicas{} > 9
```

处置步骤:

1. kubectl describe deploy \<name> -n \<ns> 看 Conditions 与 Events；
1. kubectl get pod -n \<ns> -l \<selector> 看未就绪 Pod 的状态与原因；
1. 常见为资源不足无法调度、镜像拉取失败、就绪探针不通过；
1. 按 Pod 的具体状态排查，资源不足的扩容节点或调低 requests。

### Job执行失败

提醒 · 1 分钟 · 触发条件:

```promql
kube_job_status_failed{} > 0
```

处置步骤:

1. kubectl get job \<job> -n \<ns> 看失败次数，再 kubectl logs job/\<job> 看失败原因；
1. kubectl describe job 看 Events，确认是否因 backoffLimit 耗尽而放弃；
1. 修复根因后 kubectl delete job 再重新提交，或让 CronJob 下次调度重跑；
1. 确认该任务失败是否有下游影响（数据未产出、清理未执行），需要时手工补做。

### Pod启动超时

警告 · 1 分钟 · 触发条件:

```promql
kube_pod_container_status_waiting_reason{} == 1
```

处置步骤:

1. kubectl describe pod \<pod> -n \<ns> 看 Events 的时间戳，定位卡在拉镜像、挂载卷还是初始化容器；
1. 拉镜像慢的检查镜像大小与仓库带宽，考虑预热镜像或用本地仓库；
1. 挂载卷慢的排查 PV/CSI 驱动状态；
1. 应用自身启动慢的优化启动逻辑，并把就绪探针的 initialDelaySeconds 调到合理值。

### Pod状态异常

紧急 · 1 分钟 · 触发条件:

```promql
kube_pod_status_phase{phase=~"Pending|Unknown|Failed"} > 0
```

处置步骤:

1. kubectl get pod \<pod> -n \<ns> -o wide 看 STATUS 与 READY，再 kubectl describe pod 看 Events；
1. Pending 多为资源不足或调度约束（节点亲和、污点、PVC 未绑定）；ImagePullBackOff 查镜像地址与拉取凭据；
1. Running 但未 Ready 的看就绪探针配置与 kubectl logs \<pod> 里的启动报错；
1. 确认副本数是否已不足以承载流量，不足的先扩容其他健康副本。

### Pod频繁重启

警告 · 1 分钟 · 触发条件:

```promql
increase(kube_pod_container_status_restarts_total{}[5m]) > 3
```

处置步骤:

1. kubectl logs \<pod> -n \<ns> --previous 看上一次退出前的日志，这是最关键的一步；
1. kubectl describe pod 看退出码与 Events：137 通常是 OOM 或被 kill，1/2 多为应用自身启动失败；
1. 配置或依赖问题（连不上数据库、ConfigMap/Secret 缺失）先修依赖再拉起；
1. OOM 的对照 resources.limits.memory 与实际用量调整，或修复应用内存泄漏。

### 容器CPU使用率超过80%

提醒 · 1 分钟 · 触发条件:

```promql
100 * (sum(rate(container_cpu_usage_seconds_total{id!="/"}[2m])) by (pod_name,namespace,container) / sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.*)")) by (pod_name,namespace,container)) > 80 and sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.)")) by (pod_name,namespace,container) != 0
```

处置步骤:

1. kubectl top pod \<pod> -n \<ns> --containers 确认实际用量与 limit 的比值；
1. 对照 CPUThrottlingHigh 指标确认是否已经在被限流；
1. 业务量增长的调大 resources.limits.cpu 或做水平扩容（HPA）；
1. 用量异常的在应用侧抓 CPU profile 定位热点，避免只靠加配额掩盖问题。

### 容器内存超过80%

提醒 · 1 分钟 · 触发条件:

```promql
(sum(container_memory_working_set_bytes{id!="/"}) BY (instance,name,container,pod_name,namespace) / sum(container_spec_memory_limit_bytes{id!="/"} > 0) BY (instance,name,container,pod_name,namespace) * 100) > 80
```

处置步骤:

1. kubectl top pod \<pod> -n \<ns> --containers 确认用量与 limit；
1. 对照历史曲线判断是持续爬升（疑似泄漏）还是业务高峰的正常波动；
1. 正常波动的调大 resources.limits.memory 并预留余量；
1. 持续爬升的在应用侧抓堆定位泄漏，扩配额只是拖延。

### Node CPU使用率超过90%

提醒 · 1 分钟 · 触发条件:

```promql
100-cpu_usage_idle{cpu="cpu-total"} > 90
```

处置步骤:

1. kubectl top node 确认整体分布，kubectl top pod -A --sort-by=cpu 找出占用最高的 Pod；
1. 确认该节点是否被调度了过多高负载 Pod，必要时用 kubectl drain 迁走部分；
1. 检查 Pod 的 requests 是否设置过低导致超卖；
1. 集群整体水位高的扩容节点。

### Node内存使用率超过90%

警告 · 1 分钟 · 触发条件:

```promql
mem_used_percent > 90
```

处置步骤:

1. kubectl top node 与 kubectl top pod -A --sort-by=memory 定位占用最高的 Pod；
1. 检查是否有 Pod 未设 memory limit 在无限增长；
1. 用 kubectl drain 迁走部分 Pod 缓解，注意先确认目标节点有余量；
1. 检查 kubelet 的驱逐阈值配置是否合理，集群整体紧张的扩容节点。

### Node状态异常

紧急 · 1 分钟 · 触发条件:

```promql
kube_node_status_condition{condition="Ready",status="true"} == 0
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 与 Events，确认是 MemoryPressure、DiskPressure 还是 kubelet 失联；
1. 登录节点确认 kubelet 与容器运行时进程状态（systemctl status kubelet containerd）；
1. kubelet 日志用 journalctl -u kubelet -n 200 定位；
1. 节点短期无法恢复的执行 kubectl drain 让 Pod 尽快迁走，避免等待驱逐超时。

### Node磁盘使用率超过90%

提醒 · 1 分钟 · 触发条件:

```promql
disk_used_percent > 90
```

处置步骤:

1. 登录节点用 df -h 定位挂载点，通常是 /var/lib/docker 或 /var/lib/containerd；
1. 执行 crictl rmi --prune 或 docker system prune 清理无用镜像层，这是最快见效的；
1. 检查是否有 Pod 在往 emptyDir 或宿主机路径写大量数据；
1. 清理后确认 kubelet 的 DiskPressure 污点已自动移除。

### KubeClientCertificateExpiration-S2

A client certificate used to authenticate to the apiserver is expiring in less than 7.0 days.

警告 · — · PromQL、常见原因与处置步骤：[KubeClientCertificateExpiration](/alert-rules/kubernetes/kubeclientcertificateexpiration)

### KubeClientCertificateExpiration-S1

A client certificate used to authenticate to the apiserver is expiring in less than 24.0 hours.

紧急 · — · PromQL、常见原因与处置步骤：[KubeClientCertificateExpiration](/alert-rules/kubernetes/kubeclientcertificateexpiration)

### AggregatedAPIErrors

An aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has reported errors. The number of errors have increased for it in the past five minutes. High values indicate that the availability of the service changes too often.

警告 · — · 触发条件:

```promql
sum by(name, namespace)(increase(aggregator_unavailable_apiservice_count[5m])) > 2
```

处置步骤:

1. kubectl get apiservice 看哪个 APIService 处于 False 状态；
1. kubectl describe apiservice \<name> 看具体报错；
1. 后端服务不可用的检查对应 Deployment/Service 是否健康（常见是 metrics-server）；
1. 证书问题的核对 CA bundle 配置。

### AggregatedAPIDown

An aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has been only \{\{ $value | humanize \}\}% available over the last 10m.

警告 · 5 分钟 · 触发条件:

```promql
(1 - max by(name, namespace)(avg_over_time(aggregator_unavailable_apiservice[10m]))) * 100 < 85
```

处置步骤:

1. kubectl get apiservice 确认是哪个 APIService；
1. kubectl -n \<ns> get pod 检查其后端 Pod 是否健康；
1. 查看该 Pod 日志定位启动或运行错误；
1. 恢复后用 kubectl top node 之类命令验证功能已回来。

### KubeAPIDown

KubeAPI has disappeared from Prometheus target discovery.

紧急 · 15 分钟 · 触发条件:

```promql
absent(up{job="apiserver"} == 1)
```

处置步骤:

1. 在控制面节点确认 kube-apiserver 进程/静态 Pod 状态与日志；
1. 多副本部署确认是否只挂了部分实例，负载均衡是否已把故障实例摘除；
1. 常见根因是 etcd 不可用、证书过期、资源耗尽；
1. 优先恢复 etcd 与证书，apiserver 本身通常会自动恢复。

### KubeAPIErrorBudgetBurn-S1-120秒

The API server is burning too much error budget.

紧急 · 2 分钟 · PromQL、常见原因与处置步骤：[KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### KubeAPIErrorBudgetBurn-S1-900秒

The API server is burning too much error budget.

紧急 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### KubeAPIErrorBudgetBurn-S2-3600秒

The API server is burning too much error budget.

警告 · 60 分钟 · PromQL、常见原因与处置步骤：[KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### KubeAPIErrorBudgetBurn-S2-10800秒

The API server is burning too much error budget.

警告 · 180 分钟 · PromQL、常见原因与处置步骤：[KubeAPIErrorBudgetBurn](/alert-rules/kubernetes/kubeapierrorbudgetburn)

### Deployment副本异常

Deployment \{\{ $labels.deployment \}\} in namespace \{\{ $labels.namespace \}\} has mismatched replicas.

警告 · 10 分钟 · 触发条件:

```promql
kube_deployment_spec_replicas{job="kube-state-metrics"} != kube_deployment_status_replicas_available{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe deploy \<name> -n \<ns> 看 Conditions 与 Events；
1. kubectl get pod -n \<ns> -l \<selector> 看未就绪 Pod 的状态与原因；
1. 常见为资源不足无法调度、镜像拉取失败、就绪探针不通过；
1. 按 Pod 的具体状态排查，资源不足的扩容节点或调低 requests。

### StatefulSet副本异常

StatefulSet \{\{ $labels.statefulset \}\} in namespace \{\{ $labels.namespace \}\} has mismatched replicas.

警告 · 10 分钟 · 触发条件:

```promql
kube_statefulset_status_replicas_ready{job="kube-state-metrics"} != kube_statefulset_spec_replicas{job="kube-state-metrics"}
```

处置步骤:

1. kubectl get pod -n \<ns> -l \<selector> 按序号看是哪个副本卡住；
1. kubectl describe pod 排查该副本的 PVC 是否绑定成功——这是有状态服务最常见的卡点；
1. 存储问题排查 PV/StorageClass 与 CSI 驱动；
1. 应用自身问题看 kubectl logs，修复后 StatefulSet 会自动继续。

### DaemonSet未就绪Pod

DaemonSet \{\{ $labels.daemonset \}\} in namespace \{\{ $labels.namespace \}\} has unready pods.

警告 · 10 分钟 · 触发条件:

```promql
kube_daemonset_status_number_ready{job="kube-state-metrics"} < kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe ds \<name> -n \<ns> 看 Events 与期望/实际数量；
1. 对比节点的污点与 DaemonSet 的容忍配置——污点不匹配是最常见原因；
1. 检查 nodeSelector/affinity 是否把节点排除在外；
1. 资源不足导致的调低 DaemonSet 的 requests 或释放节点资源。

### HPA扩容失败

HPA \{\{ $labels.hpa \}\} in namespace \{\{ $labels.namespace \}\} has scale up failures.

警告 · 5 分钟 · 触发条件:

```promql
kube_hpa_status_failed_scale_up_total{job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl describe hpa \<name> -n \<ns> 看 Conditions 里的具体原因；
1. ScalingLimited 说明触及了 min/max 边界；FailedGetScale 说明目标工作负载有问题；
1. 指标获取失败的检查 metrics-server 或自定义指标适配器是否健康；
1. 资源不足导致新副本 Pending 的，扩容节点。

### Pod处于Failed状态

Pod \{\{ $labels.pod \}\} in namespace \{\{ $labels.namespace \}\} has failed.

警告 · 5 分钟 · 触发条件:

```promql
kube_pod_status_phase{job="kube-state-metrics",phase="Failed"} == 1
```

处置步骤:

1. kubectl get pod \<pod> -n \<ns> -o wide 看 STATUS 与 READY，再 kubectl describe pod 看 Events；
1. Pending 多为资源不足或调度约束（节点亲和、污点、PVC 未绑定）；ImagePullBackOff 查镜像地址与拉取凭据；
1. Running 但未 Ready 的看就绪探针配置与 kubectl logs \<pod> 里的启动报错；
1. 确认副本数是否已不足以承载流量，不足的先扩容其他健康副本。

### Job执行失败

Job \{\{ $labels.job_name \}\} in namespace \{\{ $labels.namespace \}\} has failed.

警告 · 5 分钟 · 触发条件:

```promql
kube_job_status_failed{job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl get job \<job> -n \<ns> 看失败次数，再 kubectl logs job/\<job> 看失败原因；
1. kubectl describe job 看 Events，确认是否因 backoffLimit 耗尽而放弃；
1. 修复根因后 kubectl delete job 再重新提交，或让 CronJob 下次调度重跑；
1. 确认该任务失败是否有下游影响（数据未产出、清理未执行），需要时手工补做。

### CPUThrottlingHigh

\{\{ $value | humanizePercentage \}\} throttling of CPU in namespace \{\{ $labels.namespace \}\} for container \{\{ $labels.container \}\} in pod \{\{ $labels.pod \}\}.

提醒 · 15 分钟 · 触发条件:

```promql
sum(increase(container_cpu_cfs_throttled_periods_total{container!="", }[5m])) by (container, pod, namespace)
  /
sum(increase(container_cpu_cfs_periods_total{}[5m])) by (container, pod, namespace)
  > ( 25 / 100 )
```

处置步骤:

1. kubectl top pod \<pod> -n \<ns> --containers 对照 resources.limits.cpu；
1. 注意 Java 等运行时若未感知 cgroup limit 会开过多线程加剧限流，确认 JVM 版本与参数；
1. 调大 limits.cpu，或改用 HPA 水平扩容分摊；
1. limit 设置远高于 request 时容易被超卖挤占，评估是否把两者设置得更接近。

### KubeAggregatedAPIDown

Kubernetes aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has been only \{\{ $value | humanize \}\}% available over the last 10m.

警告 · 5 分钟 · PromQL、常见原因与处置步骤：[KubeAggregatedAPIDown](/alert-rules/kubernetes/kubeaggregatedapidown)

### KubeAggregatedAPIErrors

Kubernetes aggregated API \{\{ $labels.name \}\}/\{\{ $labels.namespace \}\} has reported errors. It has appeared unavailable \{\{ $value | humanize \}\} times averaged over the past 10m.

警告 · — · 触发条件:

```promql
sum by(name, namespace, cluster)(increase(aggregator_unavailable_apiservice_total{job="apiserver"}[10m])) > 4
```

处置步骤:

1. kubectl get apiservice 看哪个处于 False 状态；
1. kubectl describe apiservice \<name> 看具体报错；
1. 后端服务不可用的检查对应 Deployment/Service；
1. 证书问题的核对 CA bundle 配置。

### KubeAPITerminatedRequests

The kubernetes apiserver has terminated \{\{ $value | humanizePercentage \}\} of its incoming requests.

警告 · 5 分钟 · 触发条件:

```promql
sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m]))  / (  sum(rate(apiserver_request_total{job="apiserver"}[10m])) + sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m])) ) > 0.20
```

处置步骤:

1. 查看 apiserver 的 apiserver_flowcontrol 相关指标，确认是哪个 flow schema 在被限流；
1. 定位发起大量请求的客户端（通常是某个 Operator 或脚本在做全量 LIST）；
1. 对该客户端限流或优化其请求模式；
1. 确需更高配额的调整 FlowSchema 与 PriorityLevelConfiguration。

### KubeClientErrors

Kubernetes API server client '\{\{ $labels.job \}\}/\{\{ $labels.instance \}\}' is experiencing \{\{ $value | humanizePercentage \}\} errors.'

警告 · 15 分钟 · 触发条件:

```promql
(sum(rate(rest_client_requests_total{job="apiserver",code=~"5.."}[5m])) by (cluster, instance, job, namespace)
  /
sum(rate(rest_client_requests_total{job="apiserver"}[5m])) by (cluster, instance, job, namespace))
> 0.01
```

处置步骤:

1. 从告警标签定位是哪个组件/实例在报错；
1. 看该组件日志中的具体错误码：401/403 是 RBAC 权限问题，429 是被限流，5xx 是 apiserver 侧问题；
1. 权限问题核对 ServiceAccount 的 Role/ClusterRoleBinding；
1. 限流问题确认该组件是否在做高频 LIST，优化为 Watch 或加 resourceVersion。

### KubeContainerWaiting

pod/\{\{ $labels.pod \}\} in namespace \{\{ $labels.namespace \}\} on container \{\{ $labels.container\}\} has been in waiting state for longer than 1 hour.

警告 · 60 分钟 · PromQL、常见原因与处置步骤：[KubeContainerWaiting](/alert-rules/kubernetes/kubecontainerwaiting)

### KubeControllerManagerDown

KubeControllerManager has disappeared from Prometheus target discovery.

紧急 · 15 分钟 · 触发条件:

```promql
absent(up{job="kube-controller-manager"} == 1)
```

处置步骤:

1. 在控制面节点确认 kube-controller-manager 静态 Pod 或进程状态与日志；
1. 多副本部署确认 leader 选举是否正常切换；
1. 常见根因是 apiserver 不可用或证书过期；
1. 恢复后确认副本数异常的工作负载开始自动修复。

### KubeCPUOvercommit

Cluster \{\{ $labels.cluster \}\} has overcommitted CPU resource requests for Pods by \{\{ $value \}\} CPU shares and cannot tolerate node failure.

警告 · 10 分钟 · PromQL、常见原因与处置步骤：[KubeCPUOvercommit](/alert-rules/kubernetes/kubecpuovercommit)

### KubeCPUQuotaOvercommit

Cluster \{\{ $labels.cluster \}\}  has overcommitted CPU resource requests for Namespaces.

警告 · 5 分钟 · 触发条件:

```promql
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(cpu|requests.cpu)"})) by (cluster)
  /
sum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"}) by (cluster)
  > 1.5
```

处置步骤:

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
1. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
1. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
1. 冗余确实不足的扩容节点。

### KubeDaemonSetMisScheduled

\{\{ $value \}\} Pods of DaemonSet \{\{ $labels.namespace \}\}/\{\{ $labels.daemonset \}\} are running where they are not supposed to run.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeDaemonSetMisScheduled](/alert-rules/kubernetes/kubedaemonsetmisscheduled)

### KubeDaemonSetNotScheduled

\{\{ $value \}\} Pods of DaemonSet \{\{ $labels.namespace \}\}/\{\{ $labels.daemonset \}\} are not scheduled.

警告 · 10 分钟 · 触发条件:

```promql
kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
  -
kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl describe ds \<name> -n \<ns> 看 Events 与期望/实际数量；
1. 对比节点的污点与 DaemonSet 的容忍配置——污点不匹配是最常见原因；
1. 检查 nodeSelector/affinity 是否把节点排除在外；
1. 资源不足导致的调低 DaemonSet 的 requests 或释放节点资源。

### KubeDaemonSetRolloutStuck

DaemonSet \{\{ $labels.namespace \}\}/\{\{ $labels.daemonset \}\} has not finished or progressed for at least 15 minutes.

警告 · 15 分钟 · 触发条件:

```promql
(
  (
    kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"}
      !=
    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
  ) or (
    kube_daemonset_status_number_misscheduled{job="kube-state-metrics"}
      !=
    0
  ) or (
    kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}
      !=
    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
  ) or (
    kube_daemonset_status_number_available{job="kube-state-metrics"}
      !=
    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
  )
) and (
  changes(kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}[5m])
    ==
  0
)
```

处置步骤:

1. kubectl rollout status ds/\<name> -n \<ns> 看卡在哪些节点；
1. kubectl describe pod 排查新版本 Pod 为何未就绪；
1. 短期无法修复的用 kubectl rollout undo ds/\<name> 回滚；
1. 检查 updateStrategy 的 maxUnavailable 配置是否过于保守。

### KubeDeploymentGenerationMismatch

Deployment generation for \{\{ $labels.namespace \}\}/\{\{ $labels.deployment \}\} does not match, this indicates that the Deployment has failed but has not been rolled back.

警告 · 15 分钟 · 触发条件:

```promql
kube_deployment_status_observed_generation{job="kube-state-metrics"}
  !=
kube_deployment_metadata_generation{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe \<kind> \<name> -n \<ns> 对比 generation 与 observedGeneration；
1. 检查 kube-controller-manager 是否健康——控制器不工作是最常见原因；
1. 看 controller-manager 日志中与该对象相关的报错；
1. 确认 apiserver 与 etcd 正常，控制器恢复后 generation 会自动追平。

### KubeDeploymentReplicasMismatch

Deployment \{\{ $labels.namespace \}\}/\{\{ $labels.deployment \}\} has not matched the expected number of replicas for longer than 15 minutes.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeDeploymentReplicasMismatch](/alert-rules/kubernetes/kubedeploymentreplicasmismatch)

### KubeDeploymentRolloutStuck

Rollout of deployment \{\{ $labels.namespace \}\}/\{\{ $labels.deployment \}\} is not progressing for longer than 15 minutes.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeDeploymentRolloutStuck](/alert-rules/kubernetes/kubedeploymentrolloutstuck)

### KubeHpaMaxedOut

HPA \{\{ $labels.namespace \}\}/\{\{ $labels.horizontalpodautoscaler  \}\} has been running at max replicas for longer than 15 minutes.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeHpaMaxedOut](/alert-rules/kubernetes/kubehpamaxedout)

### KubeHpaReplicasMismatch

HPA \{\{ $labels.namespace \}\}/\{\{ $labels.horizontalpodautoscaler  \}\} has not matched the desired number of replicas for longer than 15 minutes.

警告 · 15 分钟 · 触发条件:

```promql
(kube_horizontalpodautoscaler_status_desired_replicas{job="kube-state-metrics"}
  !=
kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"})
  and
(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}
  >
kube_horizontalpodautoscaler_spec_min_replicas{job="kube-state-metrics"})
  and
(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}
  <
kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"})
  and
changes(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}[15m]) == 0
```

处置步骤:

1. kubectl describe hpa \<name> -n \<ns> 看 Conditions 里的具体原因；
1. ScalingLimited 说明触及了 min/max 边界；FailedGetScale 说明目标工作负载有问题；
1. 指标获取失败的检查 metrics-server 或自定义指标适配器是否健康；
1. 资源不足导致新副本 Pending 的，扩容节点。

### KubeJobFailed

Job \{\{ $labels.namespace \}\}/\{\{ $labels.job_name \}\} failed to complete. Removing failed job after investigation should clear this alert.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeJobFailed](/alert-rules/kubernetes/kubejobfailed)

### KubeJobNotCompleted

Job \{\{ $labels.namespace \}\}/\{\{ $labels.job_name \}\} is taking more than \{\{ "43200" | humanizeDuration \}\} to complete.

警告 · — · 触发条件:

```promql
time() - max by(namespace, job_name, cluster) (kube_job_status_start_time{job="kube-state-metrics"}
  and
kube_job_status_active{job="kube-state-metrics"} > 0) > 43200
```

处置步骤:

1. kubectl get job \<job> -n \<ns> 看已运行时长与完成数；
1. kubectl logs job/\<job> 看是否卡在某一步；
1. 确认是任务本身耗时长还是卡死——卡死的 kubectl delete job 后修复再重跑；
1. 给 Job 设置合理的 activeDeadlineSeconds，避免无限期挂起。

### KubeletClientCertificateExpiration

Client certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

警告 · — · 触发条件:

```promql
kubelet_certificate_manager_client_ttl_seconds < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
1. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
1. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
1. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

### KubeletClientCertificateRenewalErrors

Kubelet on node \{\{ $labels.node \}\} has failed to renew its client certificate (\{\{ $value | humanize \}\} errors in the last 5 minutes).

警告 · 15 分钟 · 触发条件:

```promql
increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0
```

处置步骤:

1. 看 kubelet 日志中 certificate rotation 相关报错；
1. 检查 CSR 是否处于 Pending 未审批：kubectl get csr，必要时手工 kubectl certificate approve；
1. 确认集群是否开启了 CSR 自动审批控制器（kube-controller-manager 的 --cluster-signing-cert-file 配置）；
1. 修复后确认新 CSR 能被自动审批并签发。

### KubeletDown

Kubelet has disappeared from Prometheus target discovery.

紧急 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeletDown](/alert-rules/kubernetes/kubeletdown)

### KubeletPlegDurationHigh

The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of \{\{ $value \}\} seconds on node \{\{ $labels.node \}\}.

警告 · 5 分钟 · 触发条件:

```promql
node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10
```

处置步骤:

1. 登录节点用 crictl ps 与 crictl info 确认容器运行时响应速度；
1. 检查节点上容器数量是否过多、磁盘 IO 是否打满——这两者是 PLEG 变慢的主因；
1. 容器运行时卡顿的可尝试重启 containerd（会短暂影响该节点）；
1. 持续存在的考虑降低该节点的 Pod 密度。

### KubeletPodStartUpLatencyHigh

Kubelet Pod startup 99th percentile latency is \{\{ $value \}\} seconds on node \{\{ $labels.node \}\}.

警告 · 15 分钟 · 触发条件:

```promql
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le)) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

处置步骤:

1. kubectl describe pod \<pod> -n \<ns> 看 Events 的时间戳，定位卡在拉镜像、挂载卷还是初始化容器；
1. 拉镜像慢的检查镜像大小与仓库带宽，考虑预热镜像或用本地仓库；
1. 挂载卷慢的排查 PV/CSI 驱动状态；
1. 应用自身启动慢的优化启动逻辑，并把就绪探针的 initialDelaySeconds 调到合理值。

### KubeletServerCertificateExpiration

Server certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

警告 · — · 触发条件:

```promql
kubelet_certificate_manager_server_ttl_seconds < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
1. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
1. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
1. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

### KubeletServerCertificateRenewalErrors

Kubelet on node \{\{ $labels.node \}\} has failed to renew its server certificate (\{\{ $value | humanize \}\} errors in the last 5 minutes).

警告 · 15 分钟 · 触发条件:

```promql
increase(kubelet_server_expiration_renew_errors[5m]) > 0
```

处置步骤:

1. 看 kubelet 日志中 certificate rotation 相关报错；
1. 检查 CSR 是否处于 Pending 未审批：kubectl get csr，必要时手工 kubectl certificate approve；
1. 确认集群是否开启了 CSR 自动审批控制器（kube-controller-manager 的 --cluster-signing-cert-file 配置）；
1. 修复后确认新 CSR 能被自动审批并签发。

### KubeletTooManyPods

Kubelet '\{\{ $labels.node \}\}' is running at \{\{ $value | humanizePercentage \}\} of its Pod capacity.

提醒 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeletTooManyPods](/alert-rules/kubernetes/kubelettoomanypods)

### KubeMemoryOvercommit

Cluster \{\{ $labels.cluster \}\} has overcommitted memory resource requests for Pods by \{\{ $value | humanize \}\} bytes and cannot tolerate node failure.

警告 · 10 分钟 · PromQL、常见原因与处置步骤：[KubeMemoryOvercommit](/alert-rules/kubernetes/kubememoryovercommit)

### KubeMemoryQuotaOvercommit

Cluster \{\{ $labels.cluster \}\}  has overcommitted memory resource requests for Namespaces.

警告 · 5 分钟 · 触发条件:

```promql
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(memory|requests.memory)"})) by (cluster)
  /
sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)
  > 1.5
```

处置步骤:

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
1. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
1. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
1. 冗余确实不足的扩容节点。

### KubeNodeNotReady

\{\{ $labels.node \}\} has been unready for more than 15 minutes.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready)

### KubeNodeReadinessFlapping

The readiness status of node \{\{ $labels.node \}\} has changed \{\{ $value \}\} times in the last 15 minutes.

警告 · 15 分钟 · 触发条件:

```promql
sum(changes(kube_node_status_condition{job="kube-state-metrics",status="true",condition="Ready"}[15m])) by (cluster, node) > 2
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 的变更时间线；
1. 登录节点看 kubelet 日志，常见根因是资源压力、容器运行时卡顿、或到 apiserver 的网络不稳；
1. 抖动期间建议先 kubectl cordon 该节点，阻止新 Pod 调度上去；
1. 根因定位并修复后再 uncordon，不要在抖动中反复重启 kubelet。

### KubeNodeUnreachable

\{\{ $labels.node \}\} is unreachable and some workloads may be rescheduled.

警告 · 15 分钟 · 触发条件:

```promql
(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1
```

处置步骤:

1. 先 ping / ssh 确认机器本身是否存活，机器宕机按宕机处理；
1. 机器存活则排查节点到 apiserver 的网络与证书（kubelet 日志里会有明确报错）；
1. 确认该节点上是否有单副本的关键服务，有的话优先在其他节点拉起；
1. 恢复后确认节点重新 Ready 且 Pod 状态正常。

### KubePersistentVolumeErrors

The persistent volume \{\{ $labels.persistentvolume \}\} has status \{\{ $labels.phase \}\}.

紧急 · 5 分钟 · 触发条件:

```promql
kube_persistentvolume_status_phase{phase=~"Failed|Pending",job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl describe pv \<pv> 与 kubectl describe pvc \<pvc> -n \<ns> 看 Events 里的具体报错；
1. 常见为存储后端不可用、容量不足、或 StorageClass 参数错误；
1. 检查 CSI 驱动 Pod 是否健康（通常在 kube-system 下）；
1. 后端存储故障的按存储系统自身流程处理，期间 Pod 会一直 Pending。

### KubePersistentVolumeFillingUp

The PersistentVolume claimed by \{\{ $labels.persistentvolumeclaim \}\} in Namespace \{\{ $labels.namespace \}\} is only \{\{ $value | humanizePercentage \}\} free.

紧急 · 1 分钟 · PromQL、常见原因与处置步骤：[KubePersistentVolumeFillingUp](/alert-rules/kubernetes/kubepersistentvolumefillingup)

### KubePersistentVolumeInodesFillingUp

The PersistentVolume claimed by \{\{ $labels.persistentvolumeclaim \}\} in Namespace \{\{ $labels.namespace \}\} only has \{\{ $value | humanizePercentage \}\} free inodes.

紧急 · 1 分钟 · 触发条件:

```promql
(
  kubelet_volume_stats_inodes_free{job="kubelet", metrics_path="/metrics"}
    /
  kubelet_volume_stats_inodes{job="kubelet", metrics_path="/metrics"}
) < 0.03
and
kubelet_volume_stats_inodes_used{job="kubelet", metrics_path="/metrics"} > 0
unless on(namespace, persistentvolumeclaim)
kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1
unless on(namespace, persistentvolumeclaim)
kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

处置步骤:

1. kubectl exec 进入使用该卷的 Pod，用 df -i 确认；
1. 逐层统计文件数找出小文件最多的目录；
1. 清理无用的小文件（缓存碎片、临时文件）；
1. 无法收敛的需要扩容或更换存储类型。

### KubePodCrashLooping

Pod \{\{ $labels.namespace \}\}/\{\{ $labels.pod \}\} (\{\{ $labels.container \}\}) is in waiting state (reason: "CrashLoopBackOff").

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping)

### KubePodNotReady

Pod \{\{ $labels.namespace \}\}/\{\{ $labels.pod \}\} has been in a non-ready state for longer than 15 minutes.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubePodNotReady](/alert-rules/kubernetes/kubepodnotready)

### KubeQuotaAlmostFull

Namespace \{\{ $labels.namespace \}\} is using \{\{ $value | humanizePercentage \}\} of its \{\{ $labels.resource \}\} quota.

提醒 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeQuotaAlmostFull](/alert-rules/kubernetes/kubequotaalmostfull)

### KubeQuotaExceeded

Namespace \{\{ $labels.namespace \}\} is using \{\{ $value | humanizePercentage \}\} of its \{\{ $labels.resource \}\} quota.

警告 · 15 分钟 · 触发条件:

```promql
kube_resourcequota{job="kube-state-metrics", type="used"}
  / ignoring(instance, job, type)
(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)
  > 1
```

处置步骤:

1. kubectl describe quota -n \<ns> 看是哪一项（cpu/memory/pods/storage）触顶；
1. kubectl get pod -n \<ns> -o custom-columns 统计各工作负载的 requests 占用，找出大户；
1. 确认是否有已停止但未清理的资源仍占着配额；
1. 确需更多配额的联系集群管理员调整 ResourceQuota。

### KubeQuotaFullyUsed

Namespace \{\{ $labels.namespace \}\} is using \{\{ $value | humanizePercentage \}\} of its \{\{ $labels.resource \}\} quota.

提醒 · 15 分钟 · 触发条件:

```promql
kube_resourcequota{job="kube-state-metrics", type="used"}
  / ignoring(instance, job, type)
(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)
  == 1
```

处置步骤:

1. kubectl describe quota -n \<ns> 看是哪一项（cpu/memory/pods/storage）触顶；
1. kubectl get pod -n \<ns> -o custom-columns 统计各工作负载的 requests 占用，找出大户；
1. 确认是否有已停止但未清理的资源仍占着配额；
1. 确需更多配额的联系集群管理员调整 ResourceQuota。

### KubeSchedulerDown

KubeScheduler has disappeared from Prometheus target discovery.

紧急 · 15 分钟 · 触发条件:

```promql
absent(up{job="kube-scheduler"} == 1)
```

处置步骤:

1. 在控制面节点确认 kube-scheduler 静态 Pod 或进程状态与日志；
1. 多副本部署的确认是否只是失去 leader，其他副本能否接管；
1. 常见根因是 apiserver 不可用或证书问题；
1. 恢复后确认 Pending 的 Pod 开始被调度。

### KubeStatefulSetGenerationMismatch

StatefulSet generation for \{\{ $labels.namespace \}\}/\{\{ $labels.statefulset \}\} does not match, this indicates that the StatefulSet has failed but has not been rolled back.

警告 · 15 分钟 · 触发条件:

```promql
kube_statefulset_status_observed_generation{job="kube-state-metrics"}
  !=
kube_statefulset_metadata_generation{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe \<kind> \<name> -n \<ns> 对比 generation 与 observedGeneration；
1. 检查 kube-controller-manager 是否健康——控制器不工作是最常见原因；
1. 看 controller-manager 日志中与该对象相关的报错；
1. 确认 apiserver 与 etcd 正常，控制器恢复后 generation 会自动追平。

### KubeStatefulSetReplicasMismatch

StatefulSet \{\{ $labels.namespace \}\}/\{\{ $labels.statefulset \}\} has not matched the expected number of replicas for longer than 15 minutes.

警告 · 15 分钟 · PromQL、常见原因与处置步骤：[KubeStatefulSetReplicasMismatch](/alert-rules/kubernetes/kubestatefulsetreplicasmismatch)

### KubeStatefulSetUpdateNotRolledOut

StatefulSet \{\{ $labels.namespace \}\}/\{\{ $labels.statefulset \}\} update has not been rolled out.

警告 · 15 分钟 · 触发条件:

```promql
(
  max without (revision) (
    kube_statefulset_status_current_revision{job="kube-state-metrics"}
      unless
    kube_statefulset_status_update_revision{job="kube-state-metrics"}
  )
    *
  (
    kube_statefulset_replicas{job="kube-state-metrics"}
      !=
    kube_statefulset_status_replicas_updated{job="kube-state-metrics"}
  )
)  and (
  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[5m])
    ==
  0
)
```

处置步骤:

1. kubectl rollout status sts/\<name> -n \<ns> 看卡在第几个副本；
1. StatefulSet 按序更新，一个副本卡住会阻塞后续全部——重点看当前正在更新的那个；
1. kubectl describe pod 排查其未就绪原因（PVC、探针、镜像）；
1. 无法快速修复的用 kubectl rollout undo 回滚。

### KubeVersionMismatch

There are \{\{ $value \}\} different semantic versions of Kubernetes components running.

警告 · 15 分钟 · 触发条件:

```promql
count by (cluster) (count by (git_version, cluster) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"},"git_version","$1","git_version","(v[0-9]*.[0-9]*).*"))) > 1
```

处置步骤:

1. kubectl get node -o wide 看各节点 kubelet 版本，kubectl version 看控制面版本；
1. 确认偏差是否在官方支持的版本偏斜范围内（kubelet 不得高于 apiserver，且落后不超过两个小版本）；
1. 通常是升级过程未完成，把落后的节点升级到位；
1. 升级前先确认工作负载对新版本 API 的兼容性。

### Node运行太多Pod

Kubelet '\{\{ $labels.node \}\}' is running at \{\{ $value | humanizePercentage \}\} of its Pod capacity.

警告 · 15 分钟 · 触发条件:

```promql
count by(node) (
  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})
)
/
max by(node) (
  kube_node_status_capacity_pods{job="kube-state-metrics"} != 1
) > 0.95
```

处置步骤:

1. kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l 确认实际数量；
1. 对照 kubelet 的 maxPods 配置（默认 110）；
1. 用 kubectl drain 或调整调度策略把部分 Pod 迁到其他节点；
1. 确需更高密度的调大 maxPods，但要同步评估节点的 CPU/内存/PLEG 压力。

### Node状态抖动

The readiness status of node \{\{ $labels.node \}\} has changed \{\{ $value \}\} times in the last 15 minutes.

警告 · 15 分钟 · 触发条件:

```promql
sum(changes(kube_node_status_condition{status="true",condition="Ready"}[15m])) by (node) > 2
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 的变更时间线；
1. 登录节点看 kubelet 日志，常见根因是资源压力、容器运行时卡顿、或到 apiserver 的网络不稳；
1. 抖动期间建议先 kubectl cordon 该节点，阻止新 Pod 调度上去；
1. 根因定位并修复后再 uncordon，不要在抖动中反复重启 kubelet。

### Pod启动耗时高

Kubelet Pod startup 99th percentile latency is \{\{ $value \}\} seconds on node \{\{ $labels.node \}\}.

警告 · 15 分钟 · 触发条件:

```promql
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (instance, le)) * on(instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

处置步骤:

1. kubectl describe pod \<pod> -n \<ns> 看 Events 的时间戳，定位卡在拉镜像、挂载卷还是初始化容器；
1. 拉镜像慢的检查镜像大小与仓库带宽，考虑预热镜像或用本地仓库；
1. 挂载卷慢的排查 PV/CSI 驱动状态；
1. 应用自身启动慢的优化启动逻辑，并把就绪探针的 initialDelaySeconds 调到合理值。

### 客户端证书过期-S1

Client certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

紧急 · — · 触发条件:

```promql
kubelet_certificate_manager_client_ttl_seconds < 86400
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
1. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
1. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
1. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

### 服务端证书过期-S1

Server certificate for Kubelet on node \{\{ $labels.node \}\} expires in \{\{ $value | humanizeDuration \}\}.

紧急 · — · 触发条件:

```promql
kubelet_certificate_manager_server_ttl_seconds < 86400
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
1. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
1. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
1. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

### kubelet故障

Kubelet has disappeared from Prometheus target discovery.

紧急 · 15 分钟 · 触发条件:

```promql
absent(up{job="kubelet"} == 1)
```

处置步骤:

1. 登录节点执行 systemctl status kubelet 确认进程状态；
1. journalctl -u kubelet -n 200 --no-pager 定位退出或报错原因；
1. 常见为证书过期、配置错误、容器运行时不可用；
1. 恢复后确认节点回到 Ready，并检查期间是否有 Pod 被误驱逐。

## 怎么使用这些规则

- **用 Prometheus 或 vmalert**：下载 [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页；有单独页面的规则指向它自己的页面。
- **用夜莺**：同样的规则内置在 [Kubernetes](/integrations/kubernetes) 集成模板里。在集成中心把规则[导入到业务组](/docs/data/integrations/import)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可

不少规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。 处置步骤和其余规则来自夜莺的集成模板（[Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接

- [用夜莺监控 Kubernetes](/integrations/kubernetes)：采集配置、仪表盘与指标说明
- [在夜莺里写指标告警规则](/docs/alerting/metric-rules)
- [全部告警规则](/alert-rules)
