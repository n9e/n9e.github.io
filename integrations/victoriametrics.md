# Monitor VictoriaMetrics with Nightingale

Both the single-node and cluster editions expose /metrics; templates cover vmsingle as well as the vmstorage, vmselect and vminsert cluster components.

Last reviewed 2026-10-27

VictoriaMetrics is often both Nightingale's time-series store and something that needs monitoring itself. The single-node edition exposes `/metrics` on port 8428; the cluster edition must be scraped per component, vmstorage (8482), vmselect (8481) and vminsert (8480), or you only see part of the picture.

There is one dashboard for single-node and one for cluster. The rules cover rejected writes, slow inserts, query timeouts, disk space, storage nodes going offline and merge backlog.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **2 dashboards**, 85 panels in total
* **9 alert rules**, each with runbook steps

## How to connect[​](#how-to-connect "Direct link to How to connect")

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](https://n9e.github.io/docs/data/prometheus.md) and the templates work as they are.

```
# conf/input.prometheus/victoriametrics.toml

[[instances]]

urls = ["http://127.0.0.1:8428/metrics"]

url_label_key = "instance"

url_label_value = "{{.Host}}"

labels = { job = "victoriametrics", service = "vmsingle" }
```

For the cluster edition, point `urls` at each component and set the `service` label to `vmstorage`, `vmselect` or `vminsert` accordingly.

1. Open the integration center in Nightingale, find VictoriaMetrics, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                 | Panels |
| ------------------------- | ------ |
| VictoriaMetrics - Cluster | 56     |
| VictoriaMetrics - Single  | 29     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

9 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### VictoriaMetrics error logging rate above 0[​](#victoriametrics-error-logging-rate-above-0 "Direct link to VictoriaMetrics error logging rate above 0")

S2 Warning · for 1 min · Trigger:

```
sum by (job, level) (rate(vm_log_messages_total{level!="info"}[5m])) > 0
```

Runbook:

1. Check the logs on that instance (journalctl -u victoria-metrics or the container logs) and filter by level for the specific error;
2. Common causes are malformed data from the write side, rejected high-cardinality labels and insufficient disk space;
3. For cardinality issues, use /api/v1/status/tsdb to see the top offenders and fix them at the write side;
4. For disk issues, follow the disk space alert path.

### Connection saturation between vm-insert and vm-storage exceeds 9[​](#connection-saturation-between-vm-insert-and-vm-storage-exceeds-9 "Direct link to Connection saturation between vm-insert and vm-storage exceeds 9")

S2 Warning · for 1 min · Trigger:

```
max(rate(vm_rpc_send_duration_seconds_total{job_name=~".+"}[5m])) by(addr) / 1000 > 9
```

Runbook:

1. Check CPU, disk IO and vm\_slow\_row\_inserts\_total on the vm-storage side to see whether the bottleneck is compute or disk;
2. Use /api/v1/status/tsdb to check whether high-cardinality metrics are amplifying writes;
3. Short term, reduce write concurrency or relabel-drop the high-cardinality metrics;
4. Longer term, add vm-storage nodes or move to faster disks.

### vm-insert instance port down[​](#vm-insert-instance-port-down "Direct link to vm-insert instance port down")

S1 Critical · for 2 min · Trigger:

```
net_response_result_code{service="vm-insert"}!=0
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
2. On that machine confirm the process is alive and check the log for a panic or OOM;
3. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
4. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vm-select instance port down[​](#vm-select-instance-port-down "Direct link to vm-select instance port down")

S1 Critical · for 1 min · Trigger:

```
net_response_result_code{service="vm-select"}!=0
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
2. On that machine confirm the process is alive and check the log for a panic or OOM;
3. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
4. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vm-select query latency exceeds 15s[​](#vm-select-query-latency-exceeds-15s "Direct link to vm-select query latency exceeds 15s")

S2 Warning · for 1 min · Trigger:

```
max(vm_request_duration_seconds{job_name=~".+"}) by (path) > 15
```

Runbook:

1. Take path from the alert labels to identify which kind of query is slow;
2. Use /api/v1/status/top\_queries to find the slowest and most frequent queries;
3. The usual root causes are an over-wide time range or high-cardinality labels — narrow the dashboard time range and reduce group by dimensions;
4. On the storage side, check whether disk IO and CPU are saturated and scale vm-select/vm-storage if needed.

### vm-storage instance port down[​](#vm-storage-instance-port-down "Direct link to vm-storage instance port down")

S1 Critical · for 2 min · Trigger:

```
net_response_result_code{service="vm-storage"} != 0
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
2. On that machine confirm the process is alive and check the log for a panic or OOM;
3. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
4. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vminsert service down[​](#vminsert-service-down "Direct link to vminsert service down")

S2 Warning · for 1 min · Trigger:

```
up{service=~"vminsert.+"} < 1
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
2. On that machine confirm the process is alive and check the log for a panic or OOM;
3. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
4. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vmselect service down[​](#vmselect-service-down "Direct link to vmselect service down")

S2 Warning · for 1 min · Trigger:

```
up{service=~"vmselect.+"} < 1
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
2. On that machine confirm the process is alive and check the log for a panic or OOM;
3. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
4. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

### vmstorage service down[​](#vmstorage-service-down "Direct link to vmstorage service down")

S2 Warning · for 1 min · Trigger:

```
up{service=~"vmstorage.+"} < 1
```

Runbook:

1. Take the instance address from the alert labels and reproduce it on the collector host with nc -vz \<address> \<port>;
2. On that machine confirm the process is alive and check the log for a panic or OOM;
3. If the process is alive but the port is unreachable, check the firewall and the listen address configuration;
4. In cluster mode, confirm the remaining node count still satisfies read/write requirements — recover the node rather than restarting the whole cluster.

## Related[​](#related "Direct link to Related")

* [VictoriaMetrics template source](https://github.com/ccfos/nightingale/tree/main/integrations/VictoriaMetrics): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Use VictoriaMetrics as a data source](https://n9e.github.io/docs/data/victoriametrics.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
