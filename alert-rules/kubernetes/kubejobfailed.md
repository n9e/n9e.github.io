---
title: "KubeJobFailed alert: what it means and how to fix it"
sidebar_label: "KubeJobFailed"
sidebar_position: 10
description: "What the KubeJobFailed Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

A Job has been marked `Failed` (`kube_job_failed > 0`): it used up its `backoffLimit` (6 retries by default) or ran past `activeDeadlineSeconds`, and the batch work it was meant to do (a backup, a report, a data sync) did not happen.

- **Severity**: Warning (`warning`)
- **Fires after**: 15m
- Part of the [Kubernetes alert rules](/alert-rules/kubernetes) (`kubernetes.yml`)

## The rule

```promql
kube_job_failed{job="kube-state-metrics"}  > 0
```

Alert message: `Job {{ $labels.namespace }}/{{ $labels.job_name }} failed to complete. Removing failed job after investigation should clear this alert.`

## Common causes

- The task itself errors out: bad input data, a failed query, a dependency that is down.
- Pods are killed for exceeding their memory limit, or evicted from a node under pressure.
- The Job ran longer than `activeDeadlineSeconds`.
- The container image or command changed and no longer works with the Job arguments.

## How to fix it

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
1. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
1. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
1. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

## Notes

- The alert keeps firing for as long as the failed Job object exists, even after a later run succeeds. Delete the Job once you have looked at it. For CronJobs, `failedJobsHistoryLimit` (1 by default) controls how many failed Jobs are kept.
- The expression selects `job="kube-state-metrics"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `kube_job_failed` (kube-state-metrics)

## Related alerts

- [KubeJobNotCompleted](/alert-rules/kubernetes#kubejobnotcompleted): Job …/… is taking more than … to complete.
- [KubePodCrashLooping](/alert-rules/kubernetes/kubepodcrashlooping): Pod …/… (…) is in waiting state (reason: "CrashLoopBackOff").

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Kubernetes rule at once as [`kubernetes.yml`](pathname:///alert-rules/kubernetes.yml).

```yaml
- alert: KubeJobFailed
  expr: |-
    kube_job_failed{job="kube-state-metrics"}  > 0
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Job {{ $labels.namespace }}/{{ $labels.job_name }} failed to complete. Removing failed job after investigation should clear this alert."
    runbook_url: "https://n9e.github.io/alert-rules/kubernetes/kubejobfailed"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
