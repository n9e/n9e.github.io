# PrometheusRemoteWriteDesiredShards alert: what it means and how to fix it

What the PrometheusRemoteWriteDesiredShards Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

Remote write calculates how many parallel shards it needs to keep up with the incoming samples. This alert fires when that number has been above the configured `max_shards` for 15 minutes. Remote write cannot add the shards it needs, so it will fall behind (PrometheusRemoteWriteBehind) unless something changes.

* **Severity**: Warning (`warning`)
* **Fires after**: 15m
* Part of the [Prometheus alert rules](https://n9e.github.io/alert-rules/prometheus.md) (`prometheus.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])

>

  max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

Alert message: Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote\_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value }}.

## Common causes[​](#common-causes "Direct link to Common causes")

* The number of series or the scrape frequency grew, so there are more samples per second to send.
* Each send became slower because the remote endpoint or the network is slower, so more shards are needed for the same throughput.
* `max_shards` in `queue_config` is set lower than the workload needs.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Check the Prometheus log for remote\_write or tsdb errors;
2. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
3. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
4. Confirm the queue backlog is draining; if not, raise queue\_config or reduce the write volume.

## Notes[​](#notes "Direct link to Notes")

* Fix the cause before raising the limit. If the endpoint is slow, more shards only add pressure on it. If the volume really grew, raise `max_shards`, or `max_samples_per_send` to send larger batches, and make sure Prometheus has the memory for the larger queues.
* The expression selects `job="prometheus-k8s"`, `namespace="monitoring"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `prometheus_remote_storage_shards_desired` (Prometheus's own metrics)
* `prometheus_remote_storage_shards_max` (Prometheus's own metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [PrometheusRemoteWriteBehind](https://n9e.github.io/alert-rules/prometheus/prometheusremotewritebehind.md): Prometheus …/… remote write is …s behind for …:….
* [PrometheusRemoteStorageFailures](https://n9e.github.io/alert-rules/prometheus.md#prometheusremotestoragefailures): Prometheus …/… failed to send …% of the samples to …:…

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Prometheus rule at once as [`prometheus.yml`](https://n9e.github.io/alert-rules/prometheus.yml).

```
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

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
