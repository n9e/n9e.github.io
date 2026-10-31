# KubePersistentVolumeFillingUp 告警：含义、常见原因与处置

Prometheus 告警 KubePersistentVolumeFillingUp 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

一个 PersistentVolume 剩余空间不足 3%，数据来自挂载它的节点上的 kubelet。数据库、队列等有状态服务在卷写满后通常会拒绝写入或直接崩溃，所以这条是紧急级别。

* **级别**：紧急（`critical`）
* **持续**：1 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
(

  kubelet_volume_stats_available_bytes{job="kubelet", metrics_path="/metrics"}

    /

  kubelet_volume_stats_capacity_bytes{job="kubelet", metrics_path="/metrics"}

) < 0.03

and

kubelet_volume_stats_used_bytes{job="kubelet", metrics_path="/metrics"} > 0

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

告警信息：`The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* 数据正常增长：表、索引、topic 日志或对象数量超过了创建时预估的大小。
* 保留或清理机制失效：日志轮转、compaction、TTL 任务、清理旧备份的任务没在跑。
* 临时文件、导出文件或 core 文件写进了数据卷，没人清理。
* 卷按测试环境的大小创建，后来直接用到了生产。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl get pvc -n \<ns> 定位对应的 PVC 与 PV；
2. 进到使用该卷的 Pod 里用 du 找出占用最大的目录（kubectl exec）；
3. 清理日志与临时数据；
4. StorageClass 支持在线扩容的直接 kubectl edit pvc 调大 spec.resources.requests.storage，不支持的需要迁移数据。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 被多个 Pod 只读挂载（`ReadOnlyMany`）的卷不告警。也可以给某个 PVC 打上 `excluded_from_alerts=true` 标签来屏蔽，但 kube-state-metrics 只导出 `--metric-labels-allowlist` 参数里列出的 PVC 标签，要先把这个标签加进去。
* 指标来自 kubelet（`kubelet_volume_stats_*`）。存储驱动不上报用量统计的卷不会有这些指标，规则对它们不起作用。
* 表达式里限定了 `job="kubelet"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `kubelet_volume_stats_available_bytes`（kubelet）
* `kubelet_volume_stats_capacity_bytes`（kubelet）
* `kubelet_volume_stats_used_bytes`（kubelet）
* `kube_persistentvolumeclaim_access_mode`（kube-state-metrics）
* `kube_persistentvolumeclaim_labels`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubePersistentVolumeInodesFillingUp](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubepersistentvolumeinodesfillingup)：The PersistentVolume claimed by … in Namespace … only has … free inodes.
* [KubePersistentVolumeErrors](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubepersistentvolumeerrors)：The persistent volume … has status ….
* [KubeStatefulSetReplicasMismatch](https://n9e.github.io/zh/alert-rules/kubernetes/kubestatefulsetreplicasmismatch.md)：StatefulSet …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubePersistentVolumeFillingUp

  expr: |-

    (

      kubelet_volume_stats_available_bytes{job="kubelet", metrics_path="/metrics"}

        /

      kubelet_volume_stats_capacity_bytes{job="kubelet", metrics_path="/metrics"}

    ) < 0.03

    and

    kubelet_volume_stats_used_bytes{job="kubelet", metrics_path="/metrics"} > 0

    unless on(namespace, persistentvolumeclaim)

    kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1

    unless on(namespace, persistentvolumeclaim)

    kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1

  for: 1m

  labels:

    severity: critical

  annotations:

    summary: "The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubepersistentvolumefillingup"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
