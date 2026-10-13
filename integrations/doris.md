# Monitor Doris with Nightingale

FE and BE both expose Prometheus-format /metrics; scrape them with the Categraf prometheus input. Templates cover queries, loads, compaction and node state.

Last reviewed 2026-10-13

Doris FE (port 8030 by default) and BE (8040) processes both expose Prometheus metrics on `/metrics`, so no dedicated plugin is needed. Label each node type with `group` and `job`; the dashboards use those labels to separate FE from BE and one cluster from another.

The templates cover query QPS and latency, load jobs, compaction backlog, tablet state, BE disk and memory, and node liveness.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 91 panels in total
* **21 alert rules**, each with runbook steps
* **Categraf collector config**: `input.prometheus`

## How to connect[​](#how-to-connect "Direct link to How to connect")

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](https://n9e.github.io/docs/data/prometheus.md) and the templates work as they are.

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.prometheus/collect_doris_examples.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.prometheus started` once the plugin is loaded.

   ```
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

2. Open the integration center in Nightingale, find Doris, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard      | Panels |
| -------------- | ------ |
| Doris Overview | 91     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

21 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Doris JVM memory usage[​](#doris-jvm-memory-usage "Direct link to Doris JVM memory usage")

S2 Warning · for 1 min · Trigger:

```
sum by (ident) (jvm_heap_size_bytes{type="used"}) / sum by (ident) (jvm_heap_size_bytes{type="max"}) > 0.85
```

Runbook:

1. Run jstat -gcutil \<pid> 1000 to watch GC frequency and old generation usage;
2. High FE memory usually comes from too much metadata (an explosion of tables/partitions/tablets) — use SHOW PROC '/statistic' to see the scale;
3. Raise the FE JAVA\_OPTS -Xmx and restart (roll the restart to avoid impact);
4. For the root cause, reduce partition counts and drop unused tables — Doris keeps all metadata in memory, so scale control is an ongoing discipline.

### Doris\_BE TCP packet receive errors in the last 1 minute[​](#doris_be-tcp-packet-receive-errors-in-the-last-1-minute "Direct link to Doris_BE TCP packet receive errors in the last 1 minute")

S2 Warning · for 1 min · Trigger:

```
increase(doris_be_snmp_tcp_in_errs[1m]) > 0
```

Runbook:

1. On that BE node run netstat -s | grep -i error to see the specific error types;
2. Run ethtool -S \<nic> to check for physical-layer errors;
3. Check network quality between BEs and from FE to BE (mtr);
4. Confirm the link is not saturated — Doris query fragment transfer is bandwidth intensive.

### Doris\_BE batch thread pool queue backlog[​](#doris_be-batch-thread-pool-queue-backlog "Direct link to Doris_BE batch thread pool queue backlog")

S2 Warning · for 1 min · Trigger:

```
doris_be_add_batch_task_queue_size > 20
```

Runbook:

1. Run SHOW PROC '/backends' to check whether BE load is balanced;
2. Lower load job concurrency or increase batch size to reduce tiny loads;
3. Raise doris\_max\_pending\_batch\_size and the related thread pool parameters in be.conf and restart the BE;
4. Check whether disk IO is saturated — the final bottleneck for loading is usually the disk.

### Doris\_BE CPU usage[​](#doris_be-cpu-usage "Direct link to Doris_BE CPU usage")

S2 Warning · for 1 min · Trigger:

```
(sum(doris_be_cpu)by(instance)-sum(doris_be_cpu{mode=~"idle|iowait"})by(instance))/sum(doris_be_cpu)by(instance)*100 > 70
```

Runbook:

1. Run SHOW PROCESSLIST to find large running queries and KILL them to stop the bleeding if needed;
2. Use fe.audit.log to find the SQL scanning the most rows and add partition pruning or materialized views;
3. Check whether compaction is consuming CPU (search the BE log for compaction);
4. If query volume genuinely grew, add BE nodes.

### Doris\_BE OlapScanner thread pool backlog[​](#doris_be-olapscanner-thread-pool-backlog "Direct link to Doris_BE OlapScanner thread pool backlog")

S2 Warning · for 1 min · Trigger:

```
doris_be_scanner_thread_pool_queue_size > 0
```

Runbook:

1. Check fe.audit.log for the SQL scanning the most rows and reduce the scan with partition pruning, prefix indexes or materialized views;
2. Run SHOW PROC '/backends' to check whether BE load is unbalanced;
3. Raise doris\_scanner\_thread\_pool\_thread\_num in be.conf and restart, but only if CPU has headroom;
4. If disk IO is saturated, consider SSDs or adding BE nodes.

### Doris\_BE packet-sending thread pool backlog[​](#doris_be-packet-sending-thread-pool-backlog "Direct link to Doris_BE packet-sending thread pool backlog")

S2 Warning · for 1 min · Trigger:

```
doris_be_send_batch_thread_pool_queue_size > 0
```

Runbook:

1. Check bandwidth and latency between BEs (iperf3, mtr);
2. Check whether a large result set query is doing heavy shuffle, and use EXPLAIN to see whether a colocate join can reduce the transfer;
3. Raise send\_batch\_thread\_pool\_thread\_num in be.conf;
4. Confirm the NIC is not saturated and upgrade to 10GbE if needed.

### Doris\_FE P95 query latency[​](#doris_fe-p95-query-latency "Direct link to Doris_FE P95 query latency")

S2 Warning · for 1 min · Trigger:

```
doris_fe_query_latency_ms{quantile="0.95"} > 5000
```

Runbook:

1. On the FE run SHOW PROCESSLIST to see current slow queries and KILL \<id> to stop the bleeding if needed;
2. Sort fe.audit.log by QueryTime to find the top slow SQL;
3. Use EXPLAIN to check whether partition pruning and indexes are used, and whether a large-table JOIN is missing colocate;
4. Combine with BE CPU and the scanner thread pool queue to tell FE planning from BE execution as the bottleneck.

### Doris\_FE P99 query latency[​](#doris_fe-p99-query-latency "Direct link to Doris_FE P99 query latency")

S2 Warning · for 1 min · Trigger:

```
doris_fe_query_latency_ms{quantile="0.99"} > 10000
```

Runbook:

1. On the FE run SHOW PROCESSLIST to see current slow queries and KILL \<id> to stop the bleeding if needed;
2. Sort fe.audit.log by QueryTime to find the top slow SQL;
3. Use EXPLAIN to check whether partition pruning and indexes are used, and whether a large-table JOIN is missing colocate;
4. Combine with BE CPU and the scanner thread pool queue to tell FE planning from BE execution as the bottleneck.

### Doris\_FE P95 transaction publish time[​](#doris_fe-p95-transaction-publish-time "Direct link to Doris_FE P95 transaction publish time")

S2 Warning · for 1 min · Trigger:

```
doris_fe_txn_publish_latency_ms{quantile="0.95"} > 5000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
2. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
3. Check whether load concurrency is too high and lower it or use larger batches;
4. Check BE disk IO and compaction pressure.

### Doris\_FE P99 transaction publish time[​](#doris_fe-p99-transaction-publish-time "Direct link to Doris_FE P99 transaction publish time")

S2 Warning · for 1 min · Trigger:

```
doris_fe_txn_publish_latency_ms{quantile="0.99"} > 10000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
2. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
3. Check whether load concurrency is too high and lower it or use larger batches;
4. Check BE disk IO and compaction pressure.

### Doris\_FE P95 transaction execution time[​](#doris_fe-p95-transaction-execution-time "Direct link to Doris_FE P95 transaction execution time")

S2 Warning · for 1 min · Trigger:

```
doris_fe_txn_exec_latency_ms{quantile="0.95"} > 5000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
2. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
3. Check whether load concurrency is too high and lower it or use larger batches;
4. Check BE disk IO and compaction pressure.

### Doris\_FE P99 transaction execution time[​](#doris_fe-p99-transaction-execution-time "Direct link to Doris_FE P99 transaction execution time")

S2 Warning · for 1 min · Trigger:

```
doris_fe_txn_exec_latency_ms{quantile="0.99"} > 10000
```

Runbook:

1. Check the transaction timing entries in fe.log to tell whether publish or execution is slow;
2. Slow publish usually means slow BE responses or unhealthy tablet replicas — use SHOW PROC '/statistic' for the unhealthy replica count;
3. Check whether load concurrency is too high and lower it or use larger batches;
4. Check BE disk IO and compaction pressure.

### Doris\_FE failed transactions[​](#doris_fe-failed-transactions "Direct link to Doris_FE failed transactions")

S2 Warning · for 1 min · Trigger:

```
increase(doris_fe_txn_counter{type="failed"}[5m]) > 0
```

Runbook:

1. Search fe.log for 'transaction failed' to find the reason;
2. Common causes are insufficient tablet replicas, an unavailable BE, or timeouts — use SHOW PROC '/statistic' for unhealthy replicas;
3. Confirm the loader has retry logic and add it if not;
4. After fixing the BE or replica problem, rerun the failed load jobs.

### Doris\_FE abnormal transactions[​](#doris_fe-abnormal-transactions "Direct link to Doris_FE abnormal transactions")

S2 Warning · for 1 min · Trigger:

```
sum by (type) (doris_fe_txn_status{type=~"aborted|unknown"}) > 0
```

Runbook:

1. Run SHOW TRANSACTION WHERE STATUS='ABORTED' to see the specific transactions and reasons;
2. aborted is usually a timeout or insufficient replicas; unknown needs the most attention — it means the FE cannot confirm the final state;
3. Fix the underlying problem (BE availability, replica health) and reload;
4. For unknown transactions, verify with the business side whether data is duplicated or missing.

### Doris\_FE P95 edit log write latency[​](#doris_fe-p95-edit-log-write-latency "Direct link to Doris_FE P95 edit log write latency")

S2 Warning · for 1 min · Trigger:

```
doris_fe_editlog_write_latency_ms{quantile="0.95"} > 1000
```

Runbook:

1. Slow editlog writes directly affect every metadata operation — first use iostat -x 1 to check whether the disk holding the FE metadata directory is saturated;
2. Confirm the FE metadata directory does not share a disk with data; a dedicated SSD is recommended;
3. Check network latency between FEs — multi-replica editlog must be synchronised;
4. Look for a burst of DDL or load jobs submitted at the same time.

### Doris\_FE P99 edit log write latency[​](#doris_fe-p99-edit-log-write-latency "Direct link to Doris_FE P99 edit log write latency")

S2 Warning · for 1 min · Trigger:

```
doris_fe_editlog_write_latency_ms{quantile="0.99"} > 2000
```

Runbook:

1. Slow editlog writes directly affect every metadata operation — first use iostat -x 1 to check whether the disk holding the FE metadata directory is saturated;
2. Confirm the FE metadata directory does not share a disk with data; a dedicated SSD is recommended;
3. Check network latency between FEs — multi-replica editlog must be synchronised;
4. Look for a burst of DDL or load jobs submitted at the same time.

### Doris\_FE error queries per second[​](#doris_fe-error-queries-per-second "Direct link to Doris_FE error queries per second")

S2 Warning · for 1 min · Trigger:

```
doris_fe_query_err_rate > 1
```

Runbook:

1. Filter fe.audit.log for State=ERR records and read the specific error;
2. Separate syntax/permission errors (user-side) from resource/timeout errors (server-side);
3. For resource errors, combine BE CPU, memory and scan queue to find the bottleneck;
4. If it lines up with a recent change (upgrade, schema modification), roll back to verify.

### Doris\_FE metadata file cleanup failures[​](#doris_fe-metadata-file-cleanup-failures "Direct link to Doris_FE metadata file cleanup failures")

S2 Warning · for 1 min · Trigger:

```
increase(doris_fe_image_clean[1m]) > 0
```

Runbook:

1. Search fe.log for image clean errors and determine whether it is permissions or disk;
2. Use df -h and ls -lh \<meta\_dir>/image to check directory size and free space;
3. For permissions, fix the directory owner; for a full disk, clean other files first;
4. Longer term, give the FE metadata directory enough dedicated space.

### Doris\_FE metadata log cleanup failures[​](#doris_fe-metadata-log-cleanup-failures "Direct link to Doris_FE metadata log cleanup failures")

S2 Warning · for 1 min · Trigger:

```
increase(doris_fe_edit_log_clean[1m]) > 0
```

Runbook:

1. Search fe.log for edit log clean errors;
2. Confirm free space and permissions on the metadata directory;
3. Check whether an FE node has fallen far behind and is preventing log trimming — use SHOW FRONTENDS to see node states;
4. If a lagging node cannot recover, consider removing and re-adding it.

### Doris\_FE metadata image generation failures[​](#doris_fe-metadata-image-generation-failures "Direct link to Doris_FE metadata image generation failures")

S2 Warning · for 1 min · Trigger:

```
increase(doris_fe_image_write[1m]) > 0
```

Runbook:

1. Search fe.log for image write errors — usually insufficient disk space or memory;
2. Use df -h for the metadata directory and jstat to check whether the FE heap is tight;
3. For low memory, raise the FE -Xmx; for low disk, clean up or expand;
4. After fixing, confirm a new image file appears under \<meta\_dir>/image — this verification step is mandatory.

### Doris\_FE rejected transactions[​](#doris_fe-rejected-transactions "Direct link to Doris_FE rejected transactions")

S2 Warning · for 1 min · Trigger:

```
increase(doris_fe_txn_counter{type="reject"}[5m]) > 0
```

Runbook:

1. Search fe.log for reject-related entries to confirm the reason;
2. The most common cause is load concurrency exceeding the FE transaction limit (max\_running\_txn\_num\_per\_db) — use SHOW PROC '/transactions' for the current count;
3. As an emergency measure raise max\_running\_txn\_num\_per\_db, but the real fix is lower load concurrency with larger batches;
4. Confirm the loader has retry logic and rerun the rejected jobs.

## Related[​](#related "Direct link to Related")

* [Doris template source](https://github.com/ccfos/nightingale/tree/main/integrations/Doris): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `prometheus` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/prometheus): every config option and the full metric list.
* [Use Doris as a data source](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
