---
title: "PrometheusRemoteWriteDesiredShards alert: what it means and how to fix it"
sidebar_label: "PrometheusRemoteWriteDesiredShards"
sidebar_position: 5
description: "What the PrometheusRemoteWriteDesiredShards Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Remote write calculates how many parallel shards it needs to keep up with the incoming samples. This alert fires when that number has been above the configured `max_shards` for 15 minutes. Remote write cannot add the shards it needs, so it will fall behind (PrometheusRemoteWriteBehind) unless something changes.

- **Severity**: Warning (`warning`)
- **Fires after**: 15m
- Part of the [Prometheus alert rules](/alert-rules/prometheus) (`prometheus.yml`)

## The rule

```promql
# Without max_over_time, failed scrapes could create false negatives, see
# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
(
  max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])
>
  max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])
)
```

Alert message: Prometheus \{\{$labels.namespace\}\}/\{\{$labels.pod\}\} remote write desired shards calculation wants to run \{\{ $value \}\} shards for queue \{\{ $labels.remote_name\}\}:\{\{ $labels.url \}\}, which is more than the max of \{\{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value \}\}.

## Common causes

- The number of series or the scrape frequency grew, so there are more samples per second to send.
- Each send became slower because the remote endpoint or the network is slower, so more shards are needed for the same throughput.
- `max_shards` in `queue_config` is set lower than the workload needs.

## How to fix it

1. Check the Prometheus log for remote_write or tsdb errors;
1. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
1. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
1. Confirm the queue backlog is draining; if not, raise queue_config or reduce the write volume.

## Notes

- Fix the cause before raising the limit. If the endpoint is slow, more shards only add pressure on it. If the volume really grew, raise `max_shards`, or `max_samples_per_send` to send larger batches, and make sure Prometheus has the memory for the larger queues.
- The expression selects `job="prometheus-k8s"`, `namespace="monitoring"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `prometheus_remote_storage_shards_desired` (Prometheus's own metrics)
- `prometheus_remote_storage_shards_max` (Prometheus's own metrics)

## Related alerts

- [PrometheusRemoteWriteBehind](/alert-rules/prometheus/prometheusremotewritebehind): Prometheus …/… remote write is …s behind for …:….
- [PrometheusRemoteStorageFailures](/alert-rules/prometheus#prometheusremotestoragefailures): Prometheus …/… failed to send …% of the samples to …:…

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Prometheus rule at once as [`prometheus.yml`](pathname:///alert-rules/prometheus.yml).

```yaml
- alert: PrometheusRemoteWriteDesiredShards
  expr: |-
    # Without max_over_time, failed scrapes could create false negatives, see
    # https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
    (
      max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])
    >
      max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])
    )
  for: 15m
  labels:
    severity: warning
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max{instance=\"%s\",job=\"prometheus-k8s\",namespace=\"monitoring\"}` $labels.instance | query | first | value }}."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusremotewritedesiredshards"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
