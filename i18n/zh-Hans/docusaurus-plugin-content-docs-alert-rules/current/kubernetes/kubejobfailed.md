---
title: "KubeJobFailed 告警：含义、常见原因与处置"
sidebar_label: "KubeJobFailed"
sidebar_position: 10
description: "Prometheus 告警 KubeJobFailed 是什么意思、常见原因有哪些、PromQL 规则怎么写、响了怎么处置，附可直接使用的规则 YAML。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

一个 Job 被标记为 `Failed`（`kube_job_failed > 0`）：它用完了 `backoffLimit`（默认重试 6 次），或者超过了 `activeDeadlineSeconds`，原本要做的批处理工作（备份、报表、数据同步）没有完成。

- **级别**：警告（`warning`）
- **持续**：15 分钟
- 属于 [Kubernetes 告警规则](/alert-rules/kubernetes)（`kubernetes.yml`）

## 规则

```promql
kube_job_failed{job="kube-state-metrics"}  > 0
```

告警信息：`Job {{ $labels.namespace }}/{{ $labels.job_name }} failed to complete. Removing failed job after investigation should clear this alert.`

## 常见原因

- 任务本身出错：输入数据有问题、查询失败、依赖服务不可用。
- Pod 超出内存限制被杀，或者在资源紧张的节点上被驱逐。
- Job 运行时间超过 `activeDeadlineSeconds`。
- 容器镜像或命令改了，和 Job 的参数对不上了。

## 处置步骤

1. kubectl get job \<job> -n \<ns> 看失败次数，再 kubectl logs job/\<job> 看失败原因；
1. kubectl describe job 看 Events，确认是否因 backoffLimit 耗尽而放弃；
1. 修复根因后 kubectl delete job 再重新提交，或让 CronJob 下次调度重跑；
1. 确认该任务失败是否有下游影响（数据未产出、清理未执行），需要时手工补做。

## 确认是哪一个 Job 失败

从告警中复制命名空间和 `job_name`，替换以下示例值后执行：

```bash
ns=default
job=nightly-report-example
kubectl get job "$job" -n "$ns" -o yaml
kubectl describe job "$job" -n "$ns"
kubectl get pods -n "$ns" -l "batch.kubernetes.io/job-name=$job"
```

预期结果：Job 的 conditions 说明最终失败原因，Pod 列表指出失败的执行实例。选取失败 Pod 后，用 `kubectl logs POD_NAME -n "$ns" --all-containers=true --tail=100` 查看日志。一个 Job 可能尝试多次，一个 Pod 的日志不代表全部尝试。若选择器没有返回 Pod，检查 Job 的 `.spec.selector`，并确认 Pod 是否已清理。

## 验证恢复，不掩盖失败的执行

CronJob 后续生成的 Job 成功，不会移除旧的失败 Job。先核对各 Job 的所属 CronJob、完成状态和产出，再决定是否补跑。补跑可能重复写数据或执行支付，应先确认任务的重试行为。

预期结果：新执行的 Job 为 `Complete=True`，业务产出也符合预期。清理前先保留失败日志，并按既有流程确认；删除失败 Job 也会删除其 Pod。清理后等待下一次采集和规则评估，旧 Job 的告警应消失。不要仅为静音而删除尚未查清的失败任务。参考 [Kubernetes Job 终止与清理](https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup)。

## 补充说明

- 只要失败的 Job 对象还在，这条告警就会一直响，哪怕后来的执行已经成功。清理前先保留日志，并验证新执行的结果。CronJob 保留多少个失败 Job 由 `failedJobsHistoryLimit` 控制（默认 1）。
- 表达式里限定了 `job="kube-state-metrics"`。如果你的采集任务或命名空间叫别的名字，要改掉这些匹配条件，否则规则永远匹配不到数据。

## 用到的指标

- `kube_job_failed`（kube-state-metrics）

## 相关告警

- [KubeJobNotCompleted](/alert-rules/kubernetes#kubejobnotcompleted)：Job …/… is taking more than … to complete.
- [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping)：Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").

## Prometheus 规则 YAML

加到通过 `rule_files` 加载的规则文件里即可；也可以一次下载全部 Kubernetes 规则：[`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml)。

```yaml
- alert: KubeJobFailed
  expr: |-
    kube_job_failed{job="kube-state-metrics"}  > 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Job {{ $labels.namespace }}/{{ $labels.job_name }} failed to complete. Removing failed job after investigation should clear this alert."
    runbook_url: "https://n9e.io/alert-rules/kubernetes/kubejobfailed"
```

**用夜莺**：这条规则内置在 [Kubernetes 集成](/integrations/kubernetes)模板里，[导入到业务组](/docs/data/integrations/import)后，夜莺发出的每条告警都会带上处置步骤。

## 来源与许可

规则表达式改编自 [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin)（Apache-2.0）。处置步骤来自[夜莺的集成模板](https://github.com/ccfos/nightingale/tree/main/integrations)（Apache-2.0），含义和常见原因为本页撰写。
