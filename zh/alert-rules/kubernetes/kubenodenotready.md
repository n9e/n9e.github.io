# KubeNodeNotReady 告警：含义、常见原因与处置

Prometheus 告警 KubeNodeNotReady 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。

最后校对于 2026-10-31

节点的 `Ready` 状态已经 15 分钟不是 `True`：要么是 `False`（kubelet 报告了问题），要么是 `Unknown`（kubelet 不再上报）。新的 Pod 不会再调度上来；节点上已有的 Pod，在 not-ready 或 unreachable 污点持续时间超过它的容忍时间（默认 300 秒）后会被驱逐。

* **级别**：警告（`warning`）
* **持续**：15 分钟
* 属于 [Kubernetes 告警规则](https://n9e.github.io/zh/alert-rules/kubernetes.md)（`kubernetes.yml`）

## 规则[​](#规则 "规则的直接链接")

```
kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0
```

告警信息：`{{ $labels.node }} has been unready for more than 15 minutes.`

## 常见原因[​](#常见原因 "常见原因的直接链接")

* kubelet 或容器运行时（containerd、CRI-O）停止或反复重启。
* 节点连不上 API Server：网络分区、防火墙变更、路由故障。
* 节点资源耗尽：内存、磁盘或进程号用光，kubelet 自己都跑不动。
* kubelet 客户端证书过期，节点无法再通过认证。
* 机器被关机、重启或回收（比如竞价实例），事先没有 drain。

## 处置步骤[​](#处置步骤 "处置步骤的直接链接")

1. kubectl describe node \<node> 看 Conditions 与 Events，确认是 MemoryPressure、DiskPressure 还是 kubelet 失联；
2. 登录节点确认 kubelet 与容器运行时进程状态（systemctl status kubelet containerd）；
3. kubelet 日志用 journalctl -u kubelet -n 200 定位；
4. 节点短期无法恢复的执行 kubectl drain 让 Pod 尽快迁走，避免等待驱逐超时。

## 补充说明[​](#补充说明 "补充说明的直接链接")

* 表达式 `status="true" == 0` 同时覆盖 `False` 和 `Unknown` 两种情况。`kubectl describe node <node>` 能看到是哪一种以及最后一次心跳时间，据此区分「kubelet 报告有问题」和「kubelet 已经失联」。
* 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标[​](#用到的指标 "用到的指标的直接链接")

* `kube_node_status_condition`（kube-state-metrics）

## 相关告警[​](#相关告警 "相关告警的直接链接")

* [KubeletDown](https://n9e.github.io/zh/alert-rules/kubernetes/kubeletdown.md)：Kubelet has disappeared from Prometheus target discovery.
* [KubePodNotReady](https://n9e.github.io/zh/alert-rules/kubernetes/kubepodnotready.md)：Pod …/… has been in a non-ready state for longer than 15 minutes.
* [KubeletTooManyPods](https://n9e.github.io/zh/alert-rules/kubernetes/kubelettoomanypods.md)：Kubelet '…' is running at … of its Pod capacity.

## Prometheus 规则 YAML[​](#prometheus-规则-yaml "Prometheus 规则 YAML的直接链接")

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](https://n9e.github.io/zh/alert-rules/kubernetes.yml)。

```
- alert: KubeNodeNotReady

  expr: |-

    kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0

  for: 15m

  labels:

    severity: warning

  annotations:

    summary: "{{ $labels.node }} has been unready for more than 15 minutes."

    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubenodenotready"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](https://n9e.github.io/zh/integrations/kubernetes.md)模板里，[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
