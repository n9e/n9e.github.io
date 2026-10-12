# Prerequisites for using Nightingale

Learn logs, processes, time-series concepts, PromQL and the data path before diagnosing collection, storage, alerting or delivery.

Last reviewed 2026-10-11

After this page, you will know the prerequisites for Nightingale and be able to separate missing data, missing alerts and missing notifications into specific checks.

## Linux and deployment basics[​](#linux "Direct link to Linux and deployment basics")

For binaries, understand working directories, configuration files, stdout / stderr and systemd. For containers, understand port mappings, volumes, logs and where a container's `127.0.0.1` points.

```
sudo journalctl -u n9e.service -n 100 --no-pager

sudo journalctl -u categraf.service -n 100 --no-pager
```

Use the actual service names. **Expected result**: recent logs for the component under investigation. If no such unit exists, use the log entry point for its real deployment.

## Time-series model[​](#time-series "Direct link to Time-series model")

* A **metric name** describes the measurement.
* **Labels** distinguish hosts, services and instances; the name and labels identify a series.
* A **timestamp and value** form a sample. Incorrect clocks place data outside the intended range.
* A **Gauge** is a current value; a **Counter** accumulates and may reset when a process restarts.
* Histograms and summaries require understanding buckets, counts and sums.

Avoid unique request IDs as labels. See the [Prometheus data model](https://prometheus.io/docs/concepts/data_model/).

## PromQL[​](#promql "Direct link to PromQL")

Start with selecting series by labels, using `rate()` on counters and aggregating instances. Build thresholds around the meaning of the data; a cumulative count is not a requests-per-second value.

An instant query evaluates a time; a range query returns a series over an interval. Range and step affect the display. Verify an expression in the [metrics explorer](https://n9e.github.io/docs/query/metric-explorer.md) before putting it into a [metric rule](https://n9e.github.io/docs/alerting/metric-rules.md). See the [Prometheus query documentation](https://prometheus.io/docs/prometheus/latest/querying/basics/).

## Pull and push[​](#collection-paths "Direct link to Pull and push")

Prometheus and vmagent scrape with Pull. The scraper knows whether a request succeeded and can generate `up`. Categraf sends Remote Write with Push. Its liveness cannot be treated as a Prometheus scrape-status check.

Nightingale v9 can use embedded or external storage. If metrics already exist in Prometheus, register the datasource without moving them. Heartbeat metadata and sample delivery are separate paths; see [Linux monitoring](https://n9e.github.io/docs/practice/linux.md).

## Troubleshooting and asking for help[​](#troubleshooting "Direct link to Troubleshooting and asking for help")

Find the failing stage first:

1. Does the collector produce samples locally?
2. Do they reach the correct store?
3. Does Nightingale query that datasource?
4. Does rule evaluation produce an event?
5. Is the event muted, filtered or processed?
6. Is notification delivery successful?

Include versions, deployment method, expected and actual behavior, the incident time range, minimal configuration and relevant logs. Remove credentials and personal information first. Keep enough context to make the failure diagnosable.

## Next[​](#next "Direct link to Next")

* [Quick start](https://n9e.github.io/docs/get-started/quick-start.md)
* [System architecture](https://n9e.github.io/docs/concepts/architecture.md)
* [Connected datasource with no data](https://n9e.github.io/docs/troubleshooting/no-data.md)
