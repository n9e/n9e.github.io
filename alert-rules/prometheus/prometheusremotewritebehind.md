---
title: "PrometheusRemoteWriteBehind alert: what it means and how to fix it"
sidebar_label: "PrometheusRemoteWriteBehind"
sidebar_position: 4
description: "What the PrometheusRemoteWriteBehind Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/n9e/n9e.github.io/blob/main/scripts/alert-rules/alerts.mjs
toc_max_heading_level: 2
mdx:
  format: md
---

Remote write is more than 2 minutes behind: the newest sample Prometheus has ingested is more than 120 seconds newer than the newest sample it has sent to a remote endpoint. Dashboards and alerts that read from the remote store (VictoriaMetrics, Thanos Receive, Mimir, a managed service) see stale data. If the lag keeps growing, samples can be dropped before they are sent.

- **Severity**: Critical (`critical`)
- **Fires after**: 15m
- Part of the [Prometheus alert rules](/alert-rules/prometheus) (`prometheus.yml`)

## The rule

```promql
# Without max_over_time, failed scrapes could create false negatives, see
# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
(
  max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
- ignoring(remote_name, url) group_right
  max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
)
> 120
```

Alert message: `Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf "%.1f" $value }}s behind for {{ $labels.remote_name}}:{{ $labels.url }}.`

## Common causes

- The remote endpoint is slow or rejecting writes: overloaded, rate limiting with HTTP 429, or returning errors.
- Network latency or bandwidth between Prometheus and the endpoint is not enough for the write volume.
- Remote write is capped at too few shards for the series count (see PrometheusRemoteWriteDesiredShards).
- A spike in series count, for example from a new high-cardinality label, multiplied the write volume.
- After a restart, Prometheus is replaying a large WAL and catching up.

## How to fix it

1. Check the Prometheus log for remote_write or tsdb errors;
1. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
1. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
1. Confirm the queue backlog is draining; if not, raise queue_config or reduce the write volume.

## Notes

- The expression selects `job="prometheus-k8s"`, `namespace="monitoring"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses

- `prometheus_remote_storage_highest_timestamp_in_seconds` (Prometheus's own metrics)
- `prometheus_remote_storage_queue_highest_sent_timestamp_seconds` (Prometheus's own metrics)

## Related alerts

- [PrometheusRemoteWriteDesiredShards](/alert-rules/prometheus/prometheusremotewritedesiredshards): Prometheus …/… remote write desired shards calculation wants to run … shards for queue …:…, which is more than the max of \{\{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value \}\}.
- [PrometheusRemoteStorageFailures](/alert-rules/prometheus#prometheusremotestoragefailures): Prometheus …/… failed to send …% of the samples to …:…

## Prometheus rule YAML

Add this to a rules file loaded through `rule_files`, or download every Prometheus rule at once as [`prometheus.yml`](pathname:///alert-rules/prometheus.yml).

```yaml
- alert: PrometheusRemoteWriteBehind
  expr: |-
    # Without max_over_time, failed scrapes could create false negatives, see
    # https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.
    (
      max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
    - ignoring(remote_name, url) group_right
      max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])
    )
    > 120
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf \"%.1f\" $value }}s behind for {{ $labels.remote_name}}:{{ $labels.url }}."
    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusremotewritebehind"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](/integrations/kubernetes) template; [import it into a business group](/docs/data/integrations/import) and Nightingale attaches the runbook to every alert it sends.

## Sources and license

The rule expression is adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
