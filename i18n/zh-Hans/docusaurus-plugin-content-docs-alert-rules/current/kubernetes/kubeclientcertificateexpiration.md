---
title: "KubeClientCertificateExpiration 告警：含义、常见原因与处置"
sidebar_label: "KubeClientCertificateExpiration"
sidebar_position: 1
description: "Prometheus 告警 KubeClientCertificateExpiration 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

过去 5 分钟里客户端向 API Server 出示的证书中，至少有 1% 会在 7 天内（警告）或 24 小时内（紧急）过期。规则取的是剩余有效期的第 1 百分位。过期后这些客户端会收到 `401 Unauthorized`。如果它们属于 kubelet、控制器或调度器，节点会变成 NotReady，或者控制面停止调和。

- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

模板把这个告警按阈值、时间窗口和级别拆成了 2 条规则，请一起加载。

### KubeClientCertificateExpiration-S2

警告（`warning`） · 持续：—

```promql
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 604800
```

### KubeClientCertificateExpiration-S1

紧急（`critical`） · 持续：—

```promql
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 86400
```

告警信息：`A client certificate used to authenticate to the apiserver is expiring in less than 7.0 days.`

## 常见原因

- kubeadm 签发的控制面证书有效期一年，在 `kubeadm upgrade` 时续期。一年没升级过的集群会遇到这个问题。
- kubelet 客户端证书轮换没有开启，或者它发起的 CSR 没有被批准。
- 发给人员或 CI 系统、使用客户端证书认证的长期 kubeconfig 文件。
- 手工或外部工具生成的证书，没有配续期任务。

## 处置步骤

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
1. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
1. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
1. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

## 补充说明

- 指标来自客户端实际出示的证书，所以只反映最近连接过的客户端，也看不出是哪个客户端。kubeadm 集群可以用 `kubeadm certs check-expiration` 列出控制面自己的证书。
- 表达式里限定了 `job="apiserver"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `apiserver_client_certificate_expiration_seconds_count`（kube-apiserver）
- `apiserver_client_certificate_expiration_seconds_bucket`（kube-apiserver）

## 相关告警

- [KubeletClientCertificateExpiration](/alert-rules/kubernetes#kubeletclientcertificateexpiration)：Client certificate for Kubelet on node … expires in ….
- [KubeletServerCertificateExpiration](/alert-rules/kubernetes#kubeletservercertificateexpiration)：Server certificate for Kubelet on node … expires in ….
- [KubeNodeNotReady](/alert-rules/kubernetes/kubenodenotready)：… has been unready for more than 15 minutes.

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubeClientCertificateExpiration-S2
  expr: |-
    apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 604800
  labels:
    severity: warning
  annotations:
    summary: "A client certificate used to authenticate to the apiserver is expiring in less than 7.0 days."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeclientcertificateexpiration"
- alert: KubeClientCertificateExpiration-S1
  expr: |-
    apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 86400
  labels:
    severity: critical
  annotations:
    summary: "A client certificate used to authenticate to the apiserver is expiring in less than 24.0 hours."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubeclientcertificateexpiration"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
