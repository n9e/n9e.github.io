# KubeletDown 告警：含义、常见原因与处置

Prometheus 告警 KubeletDown 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

Prometheus 里没有任何一个 kubelet 目标处于 `up == 1`。规则把整个选择器包在 `absent()` 里，所以只有所有 kubelet 都消失或都抓取失败时才会触发，单个节点坏了不会触发。它一响，整个集群的 kubelet 和 cAdvisor 指标（容器 CPU、内存、卷用量）都断了，依赖这些指标的规则也会跟着失声。

* **级别**：紧急（`critical`）
* **持续**：15 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
absent(up{job="kubelet", metrics_path="/metrics"} == 1)
```

告警信息：`Kubelet has disappeared from Prometheus target discovery.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* 采集配置变了：kubelet 的 ServiceMonitor 被删，或者它的选择器、端口名、路径对不上了。
* Prometheus 在 10250 端口上认证不了 kubelet：bearer token 过期或缺失、TLS 校验失败，或者 RBAC 不再授予 `nodes/metrics` 权限。
* 网络策略或防火墙挡住了 Prometheus 到节点的访问。
* 少见情况：集群里的 kubelet 真的全挂了，比如推了一份错误配置。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. 登录节点执行 systemctl status kubelet 确认进程状态；
2. journalctl -u kubelet -n 200 --no-pager 定位退出或报错原因；
3. 常见为证书过期、配置错误、容器运行时不可用；
4. 恢复后确认节点回到 Ready，并检查期间是否有 Pod 被误驱逐。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 单个 kubelet 挂掉表现为 KubeNodeNotReady，而不是这条告警。KubeletDown 响了，先按监控链路的问题处理：打开 Prometheus 的 `/targets` 页面，看 kubelet 任务的抓取报错。
* 表达式里限定了 `job="kubelet"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `up`（Prometheus 自身指标）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubeNodeNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubenodenotready.md)：… has been unready for more than 15 minutes.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeletDown

  expr: |-

    absent(up{job="kubelet", metrics_path="/metrics"} == 1)

  for: 15m

  labels:

    severity: critical

  annotations:

    summary: "Kubelet has disappeared from Prometheus target discovery."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeletdown"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
