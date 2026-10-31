# KubeStatefulSetReplicasMismatch 告警：含义、常见原因与处置

Prometheus 告警 KubeStatefulSetReplicasMismatch 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

一个 StatefulSet 的就绪副本数已经 15 分钟与实际副本数不一致，并且当前没有在更新。有状态服务往往依赖多数派（etcd、ZooKeeper、Kafka、数据库），少一个副本可能意味着冗余下降，少两个就可能直接不可用。

* **级别**：警告（`warning`）
* **持续**：15 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
(

  kube_statefulset_status_replicas_ready{job="kube-state-metrics"}

    !=

  kube_statefulset_status_replicas{job="kube-state-metrics"}

) and (

  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[10m])

    ==

  0

)
```

告警信息：`StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* Pod 的 PVC 绑定或挂载失败，比如卷和节点不在同一个可用区（`volume node affinity conflict`）。
* 某个副本在崩溃循环或就绪探针失败，常见原因是磁盘上的数据损坏，或者其它成员不让它重新加入。
* Pod 调度不上去：没有节点满足它的 requests、反亲和性规则或可用区约束。
* 默认的 `OrderedReady` Pod 管理策略下，一个 Pod 卡住，序号比它大的 Pod 都不会被创建。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl get pod -n \<ns> -l \<selector> 按序号看是哪个副本卡住；
2. kubectl describe pod 排查该副本的 PVC 是否绑定成功——这是有状态服务最常见的卡点；
3. 存储问题排查 PV/StorageClass 与 CSI 驱动；
4. 应用自身问题看 kubectl logs，修复后 StatefulSet 会自动继续。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 按序号检查 Pod（`<name>-0`、`<name>-1`……）。序号最小的那个未就绪 Pod 通常就是要修的，后面的都在排队等它。
* 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `kube_statefulset_status_replicas_ready`（kube-state-metrics）
* `kube_statefulset_status_replicas`（kube-state-metrics）
* `kube_statefulset_status_replicas_updated`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubePodNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodnotready.md)：Pod …/… has been in a non-ready state for longer than 15 minutes.
* [KubePersistentVolumeFillingUp](https://n9e.github.io/zh/alert-rules/kubernetes/kubepersistentvolumefillingup.md)：The PersistentVolume claimed by … in Namespace … is only … free.
* [KubePersistentVolumeErrors](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubepersistentvolumeerrors)：The persistent volume … has status ….
* [KubeDeploymentReplicasMismatch](https://n9e.github.io/zh/alert-rules/kubernetes/kubedeploymentreplicasmismatch.md)：Deployment …/… has not matched the expected number of replicas for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeStatefulSetReplicasMismatch

  expr: |-

    (

      kube_statefulset_status_replicas_ready{job="kube-state-metrics"}

        !=

      kube_statefulset_status_replicas{job="kube-state-metrics"}

    ) and (

      changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[10m])

        ==

      0

    )

  for: 15m

  labels:

    severity: warning

  annotations:

    summary: "StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubestatefulsetreplicasmismatch"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
