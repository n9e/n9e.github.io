# KubeAggregatedAPIDown 告警：含义、常见原因与处置

Prometheus 告警 KubeAggregatedAPIDown 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

某个聚合 API（由 Kubernetes API Server 代理转发到其它服务的 APIService）在过去 10 分钟里可用时间低于 85%。最常见的是 metrics-server 提供的 `v1beta1.metrics.k8s.io`，其它的来自 prometheus-adapter、自定义指标适配器和各类 Operator。

* **级别**：警告（`warning`）
* **持续**：5 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
(1 - max by(name, namespace, cluster)(avg_over_time(aggregator_unavailable_apiservice{job="apiserver"}[10m]))) * 100 < 85
```

告警信息：`Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* 后端 Pod（metrics-server、prometheus-adapter）在崩溃、未就绪，或者副本数被缩到 0。
* API Server 访问不到后端服务：网络策略、防火墙，或者 Service、Endpoints 有问题。
* API Server 与后端之间的 TLS 有问题，比如服务端证书过期，或者 APIService 上的 `caBundle` 不对。
* APIService 还在，但它指向的服务已经卸载了。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl get apiservice 确认是哪个 APIService；
2. kubectl -n \<ns> get pod 检查其后端 Pod 是否健康；
3. 查看该 Pod 日志定位启动或运行错误；
4. 恢复后用 kubectl top node 之类命令验证功能已回来。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 影响取决于是哪个 API。metrics API 不可用时，`kubectl top` 会失败，按 CPU 或内存扩缩的 HPA 也不再扩缩。坏掉的 APIService 还可能让命名空间删除卡住，因为命名空间控制器列不出那个 API 组下的资源。
* 表达式里限定了 `job="apiserver"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `aggregator_unavailable_apiservice`（kube-apiserver）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubeAggregatedAPIErrors](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubeaggregatedapierrors)：Kubernetes aggregated API …/… has reported errors. It has appeared unavailable … times averaged over the past 10m.
* [KubeAPIErrorBudgetBurn](https://n9e.github.io/zh/alert-rules/kubernetes/kubeapierrorbudgetburn.md)：The API server is burning too much error budget.
* [KubeHpaReplicasMismatch](https://n9e.github.io/zh/alert-rules/kubernetes.md#kubehpareplicasmismatch)：HPA …/… has not matched the desired number of replicas for longer than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeAggregatedAPIDown

  expr: |-

    (1 - max by(name, namespace, cluster)(avg_over_time(aggregator_unavailable_apiservice{job="apiserver"}[10m]))) * 100 < 85

  for: 5m

  labels:

    severity: warning

  annotations:

    summary: "Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeaggregatedapidown"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
