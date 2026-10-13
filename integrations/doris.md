---
title: "Monitor Doris with Nightingale"
sidebar_label: "Doris"
description: "FE and BE both expose Prometheus-format /metrics; scrape them with the Categraf prometheus input. Templates cover queries, loads, compaction and node state."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Doris
toc_max_heading_level: 2
mdx:
  format: md
---

Doris FE (port 8030 by default) and BE (8040) processes both expose Prometheus metrics on `/metrics`, so no dedicated plugin is needed. Label each node type with `group` and `job`; the dashboards use those labels to separate FE from BE and one cluster from another.

The templates cover query QPS and latency, load jobs, compaction backlog, tablet state, BE disk and memory, and node liveness.

## What's in the template

- **1 dashboard**, 91 panels in total
- **21 alert rules**, each with runbook steps
- **Categraf collector config**: `input.prometheus`

## How to connect

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](/docs/data/prometheus) and the templates work as they are.

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.prometheus/collect_doris_examples.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.prometheus started` once the plugin is loaded.

   ```toml
   # doris_fe
   [[instances]]
   # 配置 fe metrics 服务地址
   urls = [
        "http://127.0.0.1:8030/metrics"
   ]

   url_label_key = "instance"
   url_label_value = "{{.Host}}"
   # 指定 fe 服务 group 和 job 标签，这里是仪表盘变量调用，可根据实际需求修改。
   labels = { group = "fe",job = "doris_cluster01"}

   # doris_be
   [[instances]]
   # 配置 be metrics 服务地址
   urls = [
        "http://127.0.0.1:8040/metrics"
   ]
   url_label_key = "instance"
   url_label_value = "{{.Host}}"
   # 指定 be 服务 group 和 job 标签，这里是仪表盘变量调用，可根据实际需求修改。
   labels = { group = "be",job = "doris_cluster01"}
   ```

1. Open the integration center in Nightingale, find Doris, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Doris Overview | 91 |

## Bundled alert rules

21 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Doris JVM memory usage

S2 Warning · for 1 min · Trigger:

```promql
sum by (ident) (jvm_heap_size_bytes{type="used"}) / sum by (ident) (jvm_heap_size_bytes{type="max"}) > 0.85
```

Runbook:

1. Run jstat -gcutil \<pid> 1000 to watch GC frequency and old generation usage;
1. High FE memory usually comes from too much metadata (an explosion of tables/partitions/tablets) — use SHOW PROC '/statistic' to see the scale;
1. Raise the FE JAVA_OPTS -Xmx and restart (roll the restart to avoid impact);
1. For the root cause, reduce partition counts and drop unused tables — Doris keeps all metadata in memory, so scale control is an ongoing discipline.

### Doris_BE TCP packet receive errors in the last 1 minute

S2 Warning · for 1 min · Trigger:

```promql
increase(doris_be_snmp_tcp_in_errs[1m]) > 0
```

Runbook:

1. On that BE node run netstat -s | grep -i error to see the specific error types;
1. Run ethtool -S \<nic> to check for physical-layer errors;
1. Check network quality between BEs and from FE to BE (mtr);
1. Confirm the link is not saturated — Doris query fragment transfer is bandwidth intensive.

### Doris_BE batch thread pool queue backlog

S2 Warning · for 1 min · Trigger:

```promql
doris_be_add_batch_task_queue_size > 20
```

Runbook:

1. Run SHOW PROC '/backends' to check whether BE load is balanced;
1. Lower load job concurrency or increase batch size to reduce tiny loads;
1. Raise doris_max_pending_batch_size and the related thread pool parameters in be.conf and restart the BE;
1. Check whether disk IO is saturated — the final bottleneck for loading is usually the disk.

### Doris_BE CPU usage

S2 Warning · for 1 min · Trigger:

```promql
(sum(doris_be_cpu)by(instance)-sum(doris_be_cpu{mode=~"idle|iowait"})by(instance))/sum(doris_be_cpu)by(instance)*100 > 70
```

Runbook:

1. Run SHOW PROCESSLIST to find large running queries and KILL them to stop the bleeding if needed;
1. Use fe.audit.log to find the SQL scanning the most rows and add partition pruning or materialized views;
1. Check whether compaction is consuming CPU (search the BE log for compaction);
1. If query volume genuinely grew, add BE nodes.

### Doris_BE OlapScanner thread pool backlog

S2 Warning · for 1 min · Trigger:

```promql
doris_be_scanner_thread_pool_queue_size > 0
```

Runbook:

1. Check fe.audit.log for the SQL scanning the most rows and reduce the scan with partition pruning, prefix indexes or materialized views;
1. Run SHOW PROC '/backends' to check whether BE load is unbalanced;
1. Raise doris_scanner_thread_pool_thread_num in be.conf and restart, but only if CPU has headroom;
1. If disk IO is saturated, consider SSDs or adding BE nodes.

### Doris_BE packet-sending thread pool backlog

S2 Warning · for 1 min · Trigger:

```promql
doris_be_send_batch_thread_pool_queue_size > 0
```

Runbook:

1. Check bandwidth and latency between BEs (iperf3, mtr);
1. Check whether a large result set query is doing heavy shuffle, and use EXPLAIN to see whether a colocate join can reduce the transfer;
1. Raise send_batch_thread_pool_thread_num in be.conf;
1. Confirm the NIC is not saturated and upgrade to 10GbE if needed.

### Doris_FE P95 query latency

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_query_latency_ms{quantile="0.95"} > 5000
```

Runbook:

1. On the FE run SHOW PROCESSLIST to see current slow queries and KILL \<id> to stop the bleeding if needed;
1. Sort fe.audit.log by QueryTime to find the top slow SQL;
1. Use EXPLAIN to check whether partition pruning and indexes are used, and whether a large-table JOIN is missing colocate;
1. Combine with BE CPU and the scanner thread pool queue to tell FE planning from BE execution as the bottleneck.

### Doris_FE P99 query latency

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_query_latency_ms{quantile="0.99"} > 10000
```

Runbook:

1. On the FE run SHOW PROCESSLIST to see current slow queries and KILL \<id> to stop the bleeding if needed;
1. Sort fe.audit.log by QueryTime to find the top slow SQL;
1. Use EXPLAIN to check whether partition pruning and indexes are used, and whether a large-table JOIN is missing colocate;
1. Combine with BE CPU and the scanner thread pool queue to tell FE planning from BE execution as the bottleneck.

### Doris_FE P95 transaction publish time

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_txn_publish_latency_ms{quantile="0.95"} > 5000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
1. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
1. Check whether load concurrency is too high and lower it or use larger batches;
1. Check BE disk IO and compaction pressure.

### Doris_FE P99 transaction publish time

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_txn_publish_latency_ms{quantile="0.99"} > 10000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
1. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
1. Check whether load concurrency is too high and lower it or use larger batches;
1. Check BE disk IO and compaction pressure.

### Doris_FE P95 transaction execution time

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_txn_exec_latency_ms{quantile="0.95"} > 5000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
1. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
1. Check whether load concurrency is too high and lower it or use larger batches;
1. Check BE disk IO and compaction pressure.

### Doris_FE P99 transaction execution time

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_txn_exec_latency_ms{quantile="0.99"} > 10000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
1. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
1. Check whether load concurrency is too high and lower it or use larger batches;
1. Check BE disk IO and compaction pressure.

### Doris_FE failed transactions

S2 Warning · for 1 min · Trigger:

```promql
increase(doris_fe_txn_counter{type="failed"}[5m]) > 0
```

Runbook:

1. Search fe.log for 'transaction failed' to find the reason;
1. Common causes are insufficient tablet replicas, an unavailable BE, or timeouts — use SHOW PROC '/statistic' for unhealthy replicas;
1. Confirm the loader has retry logic and add it if not;
1. After fixing the BE or replica problem, rerun the failed load jobs.

### Doris_FE abnormal transactions

S2 Warning · for 1 min · Trigger:

```promql
sum by (type) (doris_fe_txn_status{type=~"aborted|unknown"}) > 0
```

Runbook:

1. Run SHOW TRANSACTION WHERE STATUS='ABORTED' to see the specific transactions and reasons;
1. aborted is usually a timeout or insufficient replicas; unknown needs the most attention — it means the FE cannot confirm the final state;
1. Fix the underlying problem (BE availability, replica health) and reload;
1. For unknown transactions, verify with the business side whether data is duplicated or missing.

### Doris_FE P95 edit log write latency

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_editlog_write_latency_ms{quantile="0.95"} > 1000
```

Runbook:

1. Slow editlog writes directly affect every metadata operation — first use iostat -x 1 to check whether the disk holding the FE metadata directory is saturated;
1. Confirm the FE metadata directory does not share a disk with data; a dedicated SSD is recommended;
1. Check network latency between FEs — multi-replica editlog must be synchronised;
1. Look for a burst of DDL or load jobs submitted at the same time.

### Doris_FE P99 edit log write latency

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_editlog_write_latency_ms{quantile="0.99"} > 2000
```

Runbook:

1. Slow editlog writes directly affect every metadata operation — first use iostat -x 1 to check whether the disk holding the FE metadata directory is saturated;
1. Confirm the FE metadata directory does not share a disk with data; a dedicated SSD is recommended;
1. Check network latency between FEs — multi-replica editlog must be synchronised;
1. Look for a burst of DDL or load jobs submitted at the same time.

### Doris_FE error queries per second

S2 Warning · for 1 min · Trigger:

```promql
doris_fe_query_err_rate > 1
```

Runbook:

1. Filter fe.audit.log for State=ERR records and read the specific error;
1. Separate syntax/permission errors (user-side) from resource/timeout errors (server-side);
1. For resource errors, combine BE CPU, memory and scan queue to find the bottleneck;
1. If it lines up with a recent change (upgrade, schema modification), roll back to verify.

### Doris_FE metadata file cleanup failures

S2 Warning · for 1 min · Trigger:

```promql
increase(doris_fe_image_clean[1m]) > 0
```

Runbook:

1. Search fe.log for image clean errors and determine whether it is permissions or disk;
1. Use df -h and ls -lh \<meta_dir>/image to check directory size and free space;
1. For permissions, fix the directory owner; for a full disk, clean other files first;
1. Longer term, give the FE metadata directory enough dedicated space.

### Doris_FE metadata log cleanup failures

S2 Warning · for 1 min · Trigger:

```promql
increase(doris_fe_edit_log_clean[1m]) > 0
```

Runbook:

1. Search fe.log for edit log clean errors;
1. Confirm free space and permissions on the metadata directory;
1. Check whether an FE node has fallen far behind and is preventing log trimming — use SHOW FRONTENDS to see node states;
1. If a lagging node cannot recover, consider removing and re-adding it.

### Doris_FE metadata image generation failures

S2 Warning · for 1 min · Trigger:

```promql
increase(doris_fe_image_write[1m]) > 0
```

Runbook:

1. Search fe.log for image write errors — usually insufficient disk space or memory;
1. Use df -h for the metadata directory and jstat to check whether the FE heap is tight;
1. For low memory, raise the FE -Xmx; for low disk, clean up or expand;
1. After fixing, confirm a new image file appears under \<meta_dir>/image — this verification step is mandatory.

### Doris_FE rejected transactions

S2 Warning · for 1 min · Trigger:

```promql
increase(doris_fe_txn_counter{type="reject"}[5m]) > 0
```

Runbook:

1. Search fe.log for reject-related entries to confirm the reason;
1. The most common cause is load concurrency exceeding the FE transaction limit (max_running_txn_num_per_db) — use SHOW PROC '/transactions' for the current count;
1. As an emergency measure raise max_running_txn_num_per_db, but the real fix is lower load concurrency with larger batches;
1. Confirm the loader has retry logic and rerun the rejected jobs.

## Related

- [Doris template source](https://github.com/ccfos/nightingale/tree/main/integrations/Doris): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `prometheus` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/prometheus): every config option and the full metric list.
- [Use Doris as a data source](/docs/data/clickhouse-doris-iotdb)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
