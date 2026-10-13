---
title: "Monitor VictoriaMetrics with Nightingale"
sidebar_label: "VictoriaMetrics"
description: "Both the single-node and cluster editions expose /metrics; templates cover vmsingle as well as the vmstorage, vmselect and vminsert cluster components."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/VictoriaMetrics
toc_max_heading_level: 2
mdx:
  format: md
---

VictoriaMetrics is often both Nightingale's time-series store and something that needs monitoring itself. The single-node edition exposes `/metrics` on port 8428; the cluster edition must be scraped per component, vmstorage (8482), vmselect (8481) and vminsert (8480), or you only see part of the picture.

There is one dashboard for single-node and one for cluster. The rules cover rejected writes, slow inserts, query timeouts, disk space, storage nodes going offline and merge backlog.

## What's in the template

- **2 dashboards**, 85 panels in total
- **9 alert rules**, each with runbook steps

## How to connect

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](/docs/data/prometheus) and the templates work as they are.

```toml
# conf/input.prometheus/victoriametrics.toml
[[instances]]
urls = ["http://127.0.0.1:8428/metrics"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
labels = { job = "victoriametrics", service = "vmsingle" }
```

For the cluster edition, point `urls` at each component and set the `service` label to `vmstorage`, `vmselect` or `vminsert` accordingly.

1. Open the integration center in Nightingale, find VictoriaMetrics, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| VictoriaMetrics - Cluster | 56 |
| VictoriaMetrics - Single | 29 |

## Bundled alert rules

9 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### VictoriaMetrics error logging rate above 0

S2 Warning · for 1 min · Trigger:

```promql
sum by (job, level) (rate(vm_log_messages_total{level!="info"}[5m])) > 0
```

Runbook:

1. Check the logs on that instance (journalctl -u victoria-metrics or the container logs) and filter by level for the specific error;
1. Common causes are malformed data from the write side, rejected high-cardinality labels and insufficient disk space;
1. For cardinality issues, use /api/v1/status/tsdb to see the top offenders and fix them at the write side;
1. For disk issues, follow the disk space alert path.

### Connection saturation between vm-insert and vm-storage exceeds 9

S2 Warning · for 1 min · Trigger:

```promql
max(rate(vm_rpc_send_duration_seconds_total{job_name=~".+"}[5m])) by(addr) / 1000 > 9
```

Runbook:

1. Check CPU, disk IO and vm_slow_row_inserts_total on the vm-storage side to see whether the bottleneck is compute or disk;
1. Use /api/v1/status/tsdb to check whether high-cardinality metrics are amplifying writes;
1. Short term, reduce write concurrency or relabel-drop the high-cardinality metrics;
1. Longer term, add vm-storage nodes or move to faster disks.

### vm-insert instance port down

S1 Critical · for 2 min · Trigger:

```promql
net_response_result_code{service="vm-insert"}!=0
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
1. On that machine confirm the process is alive and check the log for a panic or OOM;
1. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
1. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vm-select instance port down

S1 Critical · for 1 min · Trigger:

```promql
net_response_result_code{service="vm-select"}!=0
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
1. On that machine confirm the process is alive and check the log for a panic or OOM;
1. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
1. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vm-select query latency exceeds 15s

S2 Warning · for 1 min · Trigger:

```promql
max(vm_request_duration_seconds{job_name=~".+"}) by (path) > 15
```

Runbook:

1. Take path from the alert labels to identify which kind of query is slow;
1. Use /api/v1/status/top_queries to find the slowest and most frequent queries;
1. The usual root causes are an over-wide time range or high-cardinality labels — narrow the dashboard time range and reduce group by dimensions;
1. On the storage side, check whether disk IO and CPU are saturated and scale vm-select/vm-storage if needed.

### vm-storage instance port down

S1 Critical · for 2 min · Trigger:

```promql
net_response_result_code{service="vm-storage"} != 0
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
1. On that machine confirm the process is alive and check the log for a panic or OOM;
1. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
1. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vminsert service down

S2 Warning · for 1 min · Trigger:

```promql
up{service=~"vminsert.+"} < 1
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
1. On that machine confirm the process is alive and check the log for a panic or OOM;
1. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
1. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vmselect service down

S2 Warning · for 1 min · Trigger:

```promql
up{service=~"vmselect.+"} < 1
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
1. On that machine confirm the process is alive and check the log for a panic or OOM;
1. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
1. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vmstorage service down

S2 Warning · for 1 min · Trigger:

```promql
up{service=~"vmstorage.+"} < 1
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
1. On that machine confirm the process is alive and check the log for a panic or OOM;
1. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
1. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

## Related

- [VictoriaMetrics template source](https://github.com/ccfos/nightingale/tree/main/integrations/VictoriaMetrics): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Use VictoriaMetrics as a data source](/docs/data/victoriametrics)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
