# Monitor TiDB with Nightingale

TiDB, PD and TiKV all expose Prometheus metrics on /metrics; the templates cover SQL latency, Region scheduling, storage and node health.

Last reviewed 2026-10-28

Every TiDB component ships a Prometheus endpoint: TiDB Server on 10080, PD on 2379, TiKV on 20180, with TiFlash and TiCDC on whatever ports they are configured with. Scrape them with the Categraf `prometheus` input, or add the Prometheus that TiUP deploys as a Nightingale data source.

The dashboards depend on four labels: `k8s_cluster`, `tidb_cluster`, `job` and `instance`. Give the first two fixed values even outside Kubernetes. The rules cover failed and slow queries on TiDB, Region anomalies on PD, storage and Raft latency on TiKV, and components going down.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 58 panels in total
* **28 alert rules**, each with runbook steps

## How to connect[​](#how-to-connect "Direct link to How to connect")

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](https://n9e.github.io/docs/data/prometheus.md) and the templates work as they are.

```
# conf/input.prometheus/tidb.toml

interval = 15



[[instances]]

urls = ["http://<tidb>:10080/metrics"]

labels = { job = "tidb", k8s_cluster = "", tidb_cluster = "prod" }



[[instances]]

urls = ["http://<pd>:2379/metrics"]

labels = { job = "pd", k8s_cluster = "", tidb_cluster = "prod" }



[[instances]]

urls = ["http://<tikv>:20180/metrics"]

labels = { job = "tikv", k8s_cluster = "", tidb_cluster = "prod" }
```

1. Open the integration center in Nightingale, find TiDB, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard     | Panels |
| ------------- | ------ |
| tidb-Overview | 58     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

28 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### TiDB - CPU usage exceeds 80%[​](#tidb---cpu-usage-exceeds-80 "Direct link to TiDB - CPU usage exceeds 80%")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) by(instance) * 100 <= 20
```

Runbook:

1. Run top -H to see whether tidb-server, tikv-server or something else is busy;
2. High TiKV CPU usually means too many coprocessor requests — use the TiDB slow log to find SQL scanning large ranges;
3. High TiDB CPU usually means complex computation or many small queries — check the Grafana TiDB Query Summary;
4. If it stays high after SQL tuning, add nodes.

### TiDB-Node\_exporter\_is\_down[​](#tidb-node_exporter_is_down "Direct link to TiDB-Node_exporter_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="node_exporter"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB - PD disk write latency exceeds 1s; slow leader writes cause leader switches[​](#tidb---pd-disk-write-latency-exceeds-1s-slow-leader-writes-cause-leader-switches "Direct link to TiDB - PD disk write latency exceeds 1s; slow leader writes cause leader switches")

TiDB (Control Plane)

S3 Info · for 1 min · Trigger:

```
histogram_quantile(0.99, sum(rate(etcd_disk_wal_fsync_duration_seconds_bucket[1m])) by (instance,job,le) ) > 1
```

Runbook:

1. On the PD node run iostat -x 1 to check disk util and await — PD requires SSDs;
2. Confirm the PD data directory does not share a disk with TiKV data;
3. Check whether another process is competing for that disk's IO;
4. If disk performance is genuinely insufficient, moving PD to a dedicated SSD is the only real fix.

### TiDB - PD has no leader[​](#tidb---pd-has-no-leader "Direct link to TiDB - PD has no leader")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
sum(etcd_server_is_leader) !=1
```

Runbook:

1. Run pd-ctl member to check each PD member's state and whether the surviving nodes still form a majority;
2. Without a majority, restore the failed PD nodes immediately;
3. If all nodes are alive but no leader is elected, check connectivity and clock skew between PDs;
4. Check each PD's log for the election failure reason and follow the official PD recovery procedure if needed.

### TiDB - network latency between PD nodes exceeds 1s[​](#tidb---network-latency-between-pd-nodes-exceeds-1s "Direct link to TiDB - network latency between PD nodes exceeds 1s")

TiDB (Control Plane)

S3 Info · for 1 min · Trigger:

```
histogram_quantile(0.99, sum(rate(etcd_network_peer_round_trip_time_seconds_bucket[1m])) by (To,instance,job,le) ) > 1
```

Runbook:

1. Run mtr between PD nodes to find where latency and loss appear;
2. Confirm PD nodes are not spread across data centres — PD is very sensitive to network latency and should be co-located;
3. Check the NIC for errors and drops and whether bandwidth is saturated;
4. Involve the network team, and avoid large data migrations meanwhile.

### TiDB - TCP connections exceed 50000[​](#tidb---tcp-connections-exceed-50000 "Direct link to TiDB - TCP connections exceed 50000")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
node_netstat_Tcp_CurrEstab > 50000
```

Runbook:

1. Run ss -s to see the connection state distribution and whether ESTABLISHED or TIME\_WAIT dominates;
2. Run ss -tan | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn to locate the sources;
3. If the application does not reuse connections, switch to a connection pool;
4. If TIME\_WAIT dominates, enable tcp\_tw\_reuse and widen the port range.

### TiDB-TiDB\_server\_is\_down[​](#tidb-tidb_server_is_down "Direct link to TiDB-TiDB_server_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="tidb"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB-blackbox\_is\_down[​](#tidb-blackbox_is_down "Direct link to TiDB-blackbox_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="blackbox_exporter"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB-drainer\_server\_is\_down[​](#tidb-drainer_server_is_down "Direct link to TiDB-drainer_server_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="drainer"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB-grafana\_is\_down[​](#tidb-grafana_is_down "Direct link to TiDB-grafana_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="grafana"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB-pd\_server\_is\_down[​](#tidb-pd_server_is_down "Direct link to TiDB-pd_server_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="pd"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB-pump\_server\_is\_down[​](#tidb-pump_server_is_down "Direct link to TiDB-pump_server_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="pump"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB - tidb CPU usage exceeds 80% of available CPU[​](#tidb---tidb-cpu-usage-exceeds-80-of-available-cpu "Direct link to TiDB - tidb CPU usage exceeds 80% of available CPU")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
rate(process_cpu_seconds_total{job="tidb"}[1m]) > tidb_server_maxprocs{job="tidb"} * 0.8
```

Runbook:

1. Check the Grafana TiDB Query Summary for the statement types with the highest QPS and latency;
2. Use the TiDB slow log to find the specific SQL and check for missing indexes causing heavy row lookups;
3. Confirm tidb\_server\_maxprocs matches the container/machine size;
4. If it stays high after tuning, add tidb-server instances.

### TiDB - tidb schema load errors in the last 15 minutes[​](#tidb---tidb-schema-load-errors-in-the-last-15-minutes "Direct link to TiDB - tidb schema load errors in the last 15 minutes")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
increase(tidb_session_schema_lease_error_total{type="outdated"}[15m]) > 0
```

Runbook:

1. Search that tidb-server's log for schema lease errors;
2. The usual root causes are an unstable network to PD/TiKV, or GC pressure preventing lease renewal;
3. Check whether a long-running large transaction is blocking schema changes;
4. For a single-instance problem, drain traffic and restart that instance; for a cluster-wide problem, investigate PD and the network.

### TiDB - tidb skipped binlog in the last 5 minutes[​](#tidb---tidb-skipped-binlog-in-the-last-5-minutes "Direct link to TiDB - tidb skipped binlog in the last 5 minutes")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
increase( tidb_server_critical_error_total[5m] ) > 0
```

Runbook:

1. Search the tidb-server log for critical error and binlog entries to confirm what was skipped and the scope;
2. Check whether pump/drainer are available — failure to write binlog is the most common cause;
3. Confirm whether downstream data is already missing and use tooling to verify and backfill if needed;
4. After fixing the binlog path, keep watching to confirm nothing else is skipped.

### TiDB - tidb schema load failed more than 10 times in the last 10 minutes[​](#tidb---tidb-schema-load-failed-more-than-10-times-in-the-last-10-minutes "Direct link to TiDB - tidb schema load failed more than 10 times in the last 10 minutes")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
increase( tidb_domain_load_schema_total{type="failed"}[10m] ) > 10
```

Runbook:

1. Check that instance's log for the specific failure;
2. Investigate connectivity and latency to PD/TiKV;
3. Check whether a DDL is stuck (ADMIN SHOW DDL JOBS) and blocking schema version advancement;
4. Cancel stuck DDL with ADMIN CANCEL DDL JOBS and redo it.

### TiDB-tiflash\_server\_is\_down[​](#tidb-tiflash_server_is_down "Direct link to TiDB-tiflash_server_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="tiflash"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB - tikv memory grew more than 5G within 5 minutes[​](#tidb---tikv-memory-grew-more-than-5g-within-5-minutes "Direct link to TiDB - tikv memory grew more than 5G within 5 minutes")

TiDB (Control Plane)

S3 Info · for 1 min · Trigger:

```
process_resident_memory_bytes{job=~"tikv",instance=~".*"} - (process_resident_memory_bytes{job=~"tikv",instance=~".*"} offset 5m) > 5*1024*1024*1024
```

Runbook:

1. Use the TiDB slow log and the Grafana TiKV Coprocessor panel to find SQL doing very large range scans;
2. KILL that query to stop the bleeding if needed;
3. Check whether block-cache-size exceeds a sensible share of physical memory (45% is the usual ceiling);
4. If the instance just started, this may be normal warm-up — but confirm it levels off.

### TiDB - tikv restarted[​](#tidb---tikv-restarted "Direct link to TiDB - tikv restarted")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
changes(process_start_time_seconds{job="tikv"}[5m]) > 0
```

Runbook:

1. Check the tail of the tikv log and dmesg -T | grep -i 'killed process' to tell a crash, an OOM kill and a manual restart apart;
2. For OOM, compare block-cache-size against machine memory;
3. For a panic, collect the logs and check the known issues for your TiDB version;
4. After the restart, run pd-ctl store to confirm the store is Up and regions have rebalanced.

### TiDB - tikv available space below 20%[​](#tidb---tikv-available-space-below-20 "Direct link to TiDB - tikv available space below 20%")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
sum(tikv_store_size_bytes{type="available"}) by (instance) / sum(tikv_store_size_bytes{type="capacity"}) by (instance) < 0.2
```

Runbook:

1. Run pd-ctl store to see each store's capacity and usage and whether it is isolated or widespread;
2. For a single full node, check whether regions are unevenly distributed and adjust scheduling with pd-ctl;
3. If it is widespread, you must add TiKV nodes;
4. Confirm GC is running normally (a GC life time set too long lets old versions accumulate).

### TiDB-tikv\_server\_is\_down[​](#tidb-tikv_server_is_down "Direct link to TiDB-tikv_server_is_down")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
probe_success{group="tikv"} == 0
```

Runbook:

1. Take the instance address from the alert labels and first confirm the machine is alive with ping/ssh;
2. On that node confirm the process is running and check the log for a panic or OOM;
3. If the process is alive but the probe fails, check the listening port and firewall;
4. Run tiup cluster display \<cluster> for the overall topology state and confirm the remaining nodes still form a majority.

### TiDB - memory usage exceeds 80%[​](#tidb---memory-usage-exceeds-80 "Direct link to TiDB - memory usage exceeds 80%")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
(((node_memory_MemTotal_bytes-node_memory_MemFree_bytes-node_memory_Cached_bytes)/(node_memory_MemTotal_bytes)*100)) >= 80
```

Runbook:

1. Run ps aux --sort=-%mem | head to find the largest consumer;
2. For high TiKV memory, check block-cache-size first; for high TiDB memory, look for large queries without mem-quota-query;
3. Set tidb\_mem\_quota\_query to cap per-query memory;
4. If there is no leak and it is still short, add memory or move instances.

### TiDB - mount point became read-only[​](#tidb---mount-point-became-read-only "Direct link to TiDB - mount point became read-only")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
node_filesystem_readonly{fstype=~"(ext.|xfs)"} == 1
```

Runbook:

1. Run dmesg -T | grep -iE 'i/o error|remount|read-only' to confirm what triggered it;
2. Run smartctl -a /dev/sdX to check disk health — it is usually bad sectors;
3. Immediately take the services on that node out (pd-ctl store delete or remove it with tiup) so nothing keeps trying to write;
4. After replacing the disk, rejoin the cluster and wait for data to backfill.

### TiDB - filesystem inode usage exceeds 80%[​](#tidb---filesystem-inode-usage-exceeds-80 "Direct link to TiDB - filesystem inode usage exceeds 80%")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
node_filesystem_files_free{fstype=~"(ext.|xfs)"} / node_filesystem_files{fstype=~"(ext.|xfs)"} * 100 < 20
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. In TiDB deployments it is usually unrotated log files — clean the old ones first;
4. Longer term, tune log retention or raise inode density at format time.

### TiDB - disk usage exceeds 80%[​](#tidb---disk-usage-exceeds-80 "Direct link to TiDB - disk usage exceeds 80%")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
node_filesystem_avail_bytes{fstype=~"(ext.|xfs)", mountpoint!~"/boot"} / node_filesystem_size_bytes{fstype=~"(ext.|xfs)", mountpoint!~"/boot"} * 100 <= 20
```

Runbook:

1. Use df -h and du -x --max-depth=1 to find the largest directories;
2. On TiDB nodes it is usually logs and slow logs piling up — clean those first;
3. For a full TiKV data disk, expand or add nodes and confirm GC is running;
4. Use lsof +L1 to check for deleted files whose handles are still open.

### TiDB - NIC inbound packet loss[​](#tidb---nic-inbound-packet-loss "Direct link to TiDB - NIC inbound packet loss")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
increase(net_drop_in[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> to confirm the drop counters and the reason;
2. If ring buffers are too small, raise them with ethtool -G \<nic> rx;
3. Check whether bandwidth is saturated — large-scale region migration will saturate a NIC;
4. If needed, lower the scheduling concurrency with pd-ctl (leader-schedule-limit, region-schedule-limit).

### TiDB - NIC outbound packet loss[​](#tidb---nic-outbound-packet-loss "Direct link to TiDB - NIC outbound packet loss")

TiDB (Control Plane)

S2 Warning · for 1 min · Trigger:

```
increase(net_drop_out[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> to confirm transmit-side drops;
2. Raise txqueuelen and the transmit queue;
3. Check whether bandwidth is saturated and lower PD scheduling concurrency if so;
4. Investigate the NIC driver and the peer switch port state.

### TiDB - tikv instances in down state above 0[​](#tidb---tikv-instances-in-down-state-above-0 "Direct link to TiDB - tikv instances in down state above 0")

TiDB (Control Plane)

S1 Critical · for 1 min · Trigger:

```
(sum(pd_cluster_status{type="store_down_count"}) by (instance) > 0) and (sum(etcd_server_is_leader) by (instance) > 0)
```

Runbook:

1. Run pd-ctl store to identify the store and how long it has been down;
2. On that node check the tikv process and disk state;
3. If it can be recovered quickly, do so — that avoids PD triggering large-scale replica replenishment and extra load;
4. If it genuinely cannot be recovered, run pd-ctl store delete \<id> for a graceful decommission so data migrates in an orderly way.

## Related[​](#related "Direct link to Related")

* [TiDB template source](https://github.com/ccfos/nightingale/tree/main/integrations/TiDB): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
