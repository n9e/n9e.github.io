---
title: "Monitor ClickHouse with Nightingale"
sidebar_label: "ClickHouse"
description: "Reads system.metrics, system.events and system.asynchronous_metrics over HTTP; queries, merges, replication queues and memory all come with metric descriptions."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/ClickHouse
toc_max_heading_level: 2
mdx:
  format: md
---

The ClickHouse input queries the system tables over HTTP (port 8123 by default): `system.metrics`, `system.events`, `system.asynchronous_metrics`, `system.parts` and others. That yields concurrent queries, merges and mutations, replication queue and lag, memory and caches, part counts and ZooKeeper sessions. Verified against a real ClickHouse 24.8 workload.

The two dashboards use different metric families and are not interchangeable: `ClickHouse_Categraf` expects this input, `ClickHouse_Exporter` expects the `clickhouse_*` metrics from ClickHouse's built-in Prometheus endpoint. The rules cover query backlog, replication lag, too many parts, memory near the limit and lost ZooKeeper sessions.

## What's in the template

- **2 dashboards**, 26 panels in total
- **10 alert rules**, each with runbook steps
- **81 metric descriptions**
- **Categraf collector config**: `input.clickhouse`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.clickhouse/clickhouse.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.clickhouse started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   # Read metrics from one or many ClickHouse servers
   [[instances]]
     ## Username for authorization on ClickHouse server
     username = "default"

     ## Password for authorization on ClickHouse server
     # password = ""

     ## HTTP(s) timeout while getting metrics values
     ## The timeout includes connection time, any redirects, and reading the
     ## response body.
     # timeout = 5

     ## List of servers for metrics scraping
     ## metrics scrape via HTTP(s) clickhouse interface
     ## https://clickhouse.tech/docs/en/interfaces/http/
     # servers = ["http://127.0.0.1:8123"]

     ## If "auto_discovery"" is "true" plugin tries to connect to all servers
     ## available in the cluster with using same "user:password" described in
     ## "user" and "password" parameters and get this server hostname list from
     ## "system.clusters" table. See
     ## - https://clickhouse.tech/docs/en/operations/system_tables/#system-clusters
     ## - https://clickhouse.tech/docs/en/operations/server_settings/settings/#server_settings_remote_servers
     ## - https://clickhouse.tech/docs/en/operations/table_engines/distributed/
     ## - https://clickhouse.tech/docs/en/operations/table_engines/replication/#creating-replicated-tables
     # auto_discovery = true

     ## Filter cluster names in "system.clusters" when "auto_discovery" is "true"
     ## when this filter present then "WHERE cluster IN (...)" filter will apply
     ## please use only full cluster names here, regexp and glob filters is not
     ## allowed for "/etc/clickhouse-server/config.d/remote.xml"
     ## <yandex>
     ##  <remote_servers>
     ##    <my-own-cluster>
     ##        <shard>
     ##          <replica><host>clickhouse-ru-1.local</host><port>9000</port></replica>
     ##          <replica><host>clickhouse-ru-2.local</host><port>9000</port></replica>
     ##        </shard>
     ##        <shard>
     ##          <replica><host>clickhouse-eu-1.local</host><port>9000</port></replica>
     ##          <replica><host>clickhouse-eu-2.local</host><port>9000</port></replica>
     ##        </shard>
     ##    </my-own-cluster>
     ##  </remote_servers>
     ##
     ## </yandex>
     ##
     ## example: cluster_include = ["my-own-cluster"]
     # cluster_include = []

     ## Filter cluster names in "system.clusters" when "auto_discovery" is
     ## "true" when this filter present then "WHERE cluster NOT IN (...)"
     ## filter will apply
     ##    example: cluster_exclude = ["my-internal-not-discovered-cluster"]
     # cluster_exclude = []

     ## Optional TLS Config
     # tls_ca = "/etc/telegraf/ca.pem"
     # tls_cert = "/etc/telegraf/cert.pem"
     # tls_key = "/etc/telegraf/key.pem"
     ## Use TLS but skip chain & host verification
     # insecure_skip_verify = false

       # [[instances.metrics]]
       # measurement = "sessions"
       # metric_fields = [ "value" ]
       # timeout = "3s"
       # request = '''
       # SELECT count() AS value FROM system.processes
       # '''
   ```

1. Open the integration center in Nightingale, find ClickHouse, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| ClickHouse_Categraf | 11 |
| ClickHouse_Exporter | 15 |

## Bundled alert rules

10 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (4)

#### ClickHouse Categraf replica is read-only

S2 Warning · for 1 min · Trigger:

```promql
clickhouse_metrics_readonly_replica > 0
```

Runbook:

1. Run SELECT database, table, is_readonly, zookeeper_exception FROM system.replicas WHERE is_readonly to find the read-only tables and the reason;
1. Check that the ZooKeeper/Keeper cluster is healthy (echo ruok | nc \<zk> 2181) and that ClickHouse can reach it;
1. Once ZooKeeper is back, run SYSTEM RESTART REPLICA \<db>.\<table> so the replica re-establishes its session;
1. If the metadata in ZooKeeper is lost, use SYSTEM RESTORE REPLICA to rebuild it, after confirming another healthy replica exists.

#### ClickHouse Categraf memory usage

Memory usage alert

S1 Critical · for 1 min · Trigger:

```promql
clickhouse_metrics_memory_tracking / clickhouse_asynchronous_metrics_os_memory_total * 100 > 90

clickhouse_metrics_memory_tracking/ clickhouse_asynchronous_metrics_os_memory_total * 100 > 80
```

Runbook:

1. Run SELECT query, memory_usage, elapsed FROM system.processes ORDER BY memory_usage DESC LIMIT 5 to find the queries consuming memory, and KILL QUERY WHERE query_id='...' to stop the bleeding if needed;
1. Check the highest memory_usage entries in system.query_log to find SQL missing filters or doing large JOINs;
1. Use max_memory_usage / max_bytes_before_external_group_by to cap a single query and allow spilling to disk;
1. Confirm the mark cache and uncompressed cache are not configured too large.

#### ClickHouse Categraf disk usage

Disk usage alert

S1 Critical · for 1 min · Trigger:

```promql
clickhouse_asynchronous_metrics_disk_available_default / (clickhouse_asynchronous_metrics_disk_available_default + clickhouse_asynchronous_metrics_disk_used_default) * 100 < 10

clickhouse_asynchronous_metrics_disk_available_default / (clickhouse_asynchronous_metrics_disk_available_default + clickhouse_asynchronous_metrics_disk_used_default) * 100 < 20
```

Runbook:

1. Run SELECT name, free_space, total_space FROM system.disks to check each disk;
1. Run SELECT database, table, formatReadableSize(sum(bytes)) FROM system.parts WHERE active GROUP BY 1,2 ORDER BY sum(bytes) DESC to find the largest tables;
1. For tables with a TTL, run ALTER TABLE ... MATERIALIZE TTL to trigger cleanup, or DROP PARTITION to remove expired partitions;
1. Longer term, expand the disk or configure a multi-volume storage policy to move cold data down.

#### ClickHouse Categraf concurrent network connections too high

S2 Warning · for 1 min · Trigger:

```promql
clickhouse_metrics_network_send > 250 or clickhouse_metrics_network_receive > 250

clickhouse_metrics_network_send > 250 or clickhouse_metrics_network_receive > 250

increase(clickhouse_metrics_interserver_connection[5m]) > 0
```

Runbook:

1. Run SELECT count(), user, client_hostname FROM system.processes GROUP BY 2,3 ORDER BY 1 DESC to see which clients the connections come from;
1. Compare with Query and TCPConnection in system.metrics to tell high query concurrency apart from a connection leak;
1. For clients that do not reuse connections, switch to a connection pool on the application side;
1. Check that max_concurrent_queries and max_connections match the instance size, and apply rate limiting if needed.

### Native metrics (6)

#### ClickHouse native endpoint authentication errors

S2 Warning · for 1 min · Trigger:

```promql
increase(ClickHouseErrorMetric_AUTHENTICATION_FAILED[5m]) > 0

increase(ClickHouseErrorMetric_RESOURCE_ACCESS_DENIED[5m]) > 0
```

Runbook:

1. Run SELECT event_time, user, client_hostname, exception FROM system.query_log WHERE type='ExceptionBeforeStart' AND exception LIKE '%AUTHENTICATION_FAILED%' ORDER BY event_time DESC LIMIT 20 to find the source IP and username;
1. If it is your own application, verify the credentials in its config against users.xml;
1. If the source is an unknown IP, treat it as an intrusion attempt: tighten the networks allowlist in users.xml and rotate the password;
1. Confirm the ClickHouse port is not directly exposed to the internet.

#### ClickHouse native endpoint replica is read-only

S2 Warning · for 1 min · Trigger:

```promql
ClickHouseMetrics_ReadonlyReplica > 0
```

Runbook:

1. Run SELECT database, table, is_readonly, zookeeper_exception FROM system.replicas WHERE is_readonly to find the read-only tables and the reason;
1. Check that the ZooKeeper/Keeper cluster is healthy (echo ruok | nc \<zk> 2181) and that ClickHouse can reach it;
1. Once ZooKeeper is back, run SYSTEM RESTART REPLICA \<db>.\<table> so the replica re-establishes its session;
1. If the metadata in ZooKeeper is lost, use SYSTEM RESTORE REPLICA to rebuild it, after confirming another healthy replica exists.

#### ClickHouse native endpoint memory usage

Memory usage alert

S1 Critical · for 1 min · Trigger:

```promql
ClickHouseMetrics_MemoryTracking / ClickHouseAsyncMetrics_OSMemoryTotal * 100 > 90

ClickHouseMetrics_MemoryTracking / ClickHouseAsyncMetrics_OSMemoryTotal * 100 > 80
```

Runbook:

1. Run SELECT query, memory_usage, elapsed FROM system.processes ORDER BY memory_usage DESC LIMIT 5 to find the queries consuming memory, and KILL QUERY WHERE query_id='...' to stop the bleeding if needed;
1. Check the highest memory_usage entries in system.query_log to find SQL missing filters or doing large JOINs;
1. Use max_memory_usage / max_bytes_before_external_group_by to cap a single query and allow spilling to disk;
1. Confirm the mark cache and uncompressed cache are not configured too large.

#### ClickHouse native endpoint replica errors

S1 Critical · for 1 min · Trigger:

```promql
ClickHouseErrorMetric_ALL_REPLICAS_ARE_STALE == 1 or ClickHouseErrorMetric_ALL_REPLICAS_LOST == 1

 ClickHouseErrorMetric_NO_AVAILABLE_REPLICA == 1

 ClickHouseErrorMetric_TOO_FEW_LIVE_REPLICAS == 1
```

Runbook:

1. Run SELECT database, table, is_readonly, absolute_delay, zookeeper_exception FROM system.replicas to locate the failed tables;
1. A large absolute_delay means the replica cannot keep up — check the replica node's IO and its merge queue (system.replication_queue);
1. ALL_REPLICAS_LOST usually means the metadata in ZooKeeper is gone, so verify the data on a healthy replica and then run SYSTEM RESTORE REPLICA;
1. Route queries to healthy shards while recovering so they stop failing.

#### ClickHouse native endpoint disk usage

Disk usage alert

S1 Critical · for 1 min · Trigger:

```promql
ClickHouseAsyncMetrics_DiskAvailable_default / (ClickHouseAsyncMetrics_DiskAvailable_default + ClickHouseAsyncMetrics_DiskUsed_default) * 100 < 10

ClickHouseAsyncMetrics_DiskAvailable_default / (ClickHouseAsyncMetrics_DiskAvailable_default + ClickHouseAsyncMetrics_DiskUsed_default) * 100 < 20

ClickHouseAsyncMetrics_DiskAvailable_backups / (ClickHouseAsyncMetrics_DiskAvailable_backups + ClickHouseAsyncMetrics_DiskUsed_backups) * 100 < 20
```

Runbook:

1. Run SELECT name, free_space, total_space FROM system.disks to check each disk;
1. Run SELECT database, table, formatReadableSize(sum(bytes)) FROM system.parts WHERE active GROUP BY 1,2 ORDER BY sum(bytes) DESC to find the largest tables;
1. For tables with a TTL, run ALTER TABLE ... MATERIALIZE TTL to trigger cleanup, or DROP PARTITION to remove expired partitions;
1. Longer term, expand the disk or configure a multi-volume storage policy to move cold data down.

#### ClickHouse native endpoint concurrent network connections too high

S2 Warning · for 1 min · Trigger:

```promql
ClickHouseMetrics_NetworkSend > 250 or ClickHouseMetrics_NetworkReceive > 250

ClickHouseMetrics_NetworkSend > 250 or ClickHouseMetrics_NetworkReceive > 250

increase(ClickHouseMetrics_InterserverConnection[5m]) > 0
```

Runbook:

1. Run SELECT count(), user, client_hostname FROM system.processes GROUP BY 2,3 ORDER BY 1 DESC to see which clients the connections come from;
1. Compare with Query and TCPConnection in system.metrics to tell high query concurrency apart from a connection leak;
1. For clients that do not reuse connections, switch to a connection pool on the application side;
1. Check that max_concurrent_queries and max_connections match the instance size, and apply rate limiting if needed.

## Metric reference

81 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `clickhouse_metrics_http_connection` | ClickHouse HTTP Connections — The number of clients connected to the ClickHouse server via the HTTP protocol. | count |
| `clickhouse_events_insert_query_time_microseconds_microseconds` | ClickHouse INSERT query average time — The average time in microseconds for the insertion query to execute. | count |
| `clickhouse_events_select_query` | ClickHouse SELECT Query Number — Number of SELECT queries executed |  |
| `clickhouse_events_select_query_time_microseconds_microseconds` | ClickHouse SELECT query average time — Select the average time (microseconds) for query execution. | count |
| `clickhouse_metrics_tcp_connection` | ClickHouse TCP Connections — The number of clients connected to the ClickHouse server via the TCP protocol. | count |
| `clickhouse_metrics_parts_temporary` | ClickHouse Temporary Data Volume — The number of temporary data sections that are currently being generated. | count |
| `clickhouse_metrics_distributed_send` | ClickHouse Distributed Table Joins — The number of data connections sent to the remote server of the distributed table. | count |
| `clickhouse_metrics_parts_wide` | ClickHouse wide data volume — Number of wide data sections. | count |
| `clickhouse_metrics_distributed_files_to_insert` | ClickHouse Number of distributed table files to be inserted — The number of files waiting to be inserted asynchronously into the distributed table. | count |
| `clickhouse_metrics_parts_pre_committed` | Data volume before ClickHouse submission — The number of data parts before submission, which are in the data _ parts list, but are not used for SELECT queries. | count |
| `clickhouse_metrics_parts_committed` | Data volume after ClickHouse submission — The number of submitted data parts, which are in the data _ parts list and used for SELECT queries. | count |
| `clickhouse_events_inserted_bytes` | ClickHouse Insert Uncompressed — The number of uncompressed bytes written by the insert operation. | count |
| `clickhouse_events_inserted_rows` | Number of ClickHouse inserted rows |  |
| `clickhouse_metrics_query_preempted` | ClickHouse Query Priority — The number of queries that were stopped and waiting due to the priority setting. | count |
| `clickhouse_events_query` | Total ClickHouse Queries — The total number of queries executed by ClickHouse. |  |
| `clickhouse_events_query_time_microseconds` | Total ClickHouse query time — The total time in microseconds for the query to execute. | ms |
| `clickhouse_metrics_parts_deleting` | ClickHouse Amount of Data being Deleted — The number of data parts being deleted. | count |
| `clickhouse_metrics_background_move_pool_task` | Number of active tasks in ClickHouse mobile pool — The number of active tasks in the background move pool, used to handle data moves. | count |
| `clickhouse_metrics_parts_compact` | ClickHouse Compact Data Volume — Number of compact data sections. | count |
| `clickhouse_metrics_background_buffer_flush_schedule_pool_task` | Number of active tasks in ClickHouse buffer — The number of active tasks in the background buffer flushing scheduling pool for periodic buffer flushing. | count |
| `clickhouse_metrics_parts_delete_on_destroy` | ClickHouse cross-disk volume — The number of portions of data that are moved to another disk and should be deleted in the destructor. | count |
| `clickhouse_metrics_parts_outdated` | ClickHouse Obsolete Data Volume — The number of obsolete data parts that are not active data parts, but may be used by the current SELECT query. | count |
| `clickhouse_metrics_memory_tracking` | Memory usage in ClickHouse — The total amount of memory used by the ClickHouse server. | count |
| `clickhouse_asynchronous_metrics_number_of_databases` | Number of databases in ClickHouse — Number of ClickHouse databases |  |
| `clickhouse_asynchronous_metrics_number_of_tables` | Number of tables in ClickHouse — Number of ClickHouse tables |  |
| `clickhouse_metrics_revision` | ClickHouse Revision — The revision number of the ClickHouse server, usually a number used to identify a specific build. |  |
| `clickhouse_asynchronous_metrics_uptime` | ClickHouse server runtime — The running time of the ClickHouse server since it started. | count |
| `clickhouse_metrics_version_integer` | ClickHouse version number — Version number of the ClickHouse server, expressed as an integer. |  |
| `ClickHouseMetrics_TCPConnection` | Number of ClickHouse Tcp connections — tcp connections |  |
| `ClickHouseMetrics_MemoryTracking` | ClickHouse Memory — Total memory allocated | bit |
| `increase(ClickHouseProfileEvents_InsertQueryTimeMicroseconds[1m]) / (increase(ClickHouseProfileEvents_InsertQuery[1m]) + 0.001)` | INSERT query average latency — INSERT query average latency | μs |
| `max_over_time(irate(ClickHouseProfileEvents_InsertQuery[2m]) [1h:1m])` | INSERT queries — Same number as queries, but only INSERT queries | queries |
| `max_over_time(irate(ClickHouseProfileEvents_Seek[2m]) [1h:1m])` | Number of lseek function calls — Number of times the'lseek 'function was called | times |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterCompressedBytes[2m]) [1h:1m])` | Compressed bytes written to the MergeTree table | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterBlocks[2m]) [1h:1m])` | Number of data blocks inserted into the MergeTree table — The number of data blocks inserted into the MergeTree table. Each block forms a data portion | blocks |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterUncompressedBytes[2m]) [1h:1m])` | Number of uncompressed bytes inserted by the MergeTree table — Number of uncompressed bytes inserted into the MergeTree table (columns in the form they are stored in memory) In a ClickHouse database, when data is inserted into a MergeTree series table (including ReplicatedMergeTree, etc.), the number of bytes occupied when it is temporarily stored in the original format in memory before the data is actually written to disk and compressed. "Uncompressed" here means that the data has not been processed by the columnar storage compression algorithm that ClickHouse executes during the storage phase to save storage space | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterRows[2m]) [1h:1m])` | Number of rows inserted by the MergeTree table — Number of rows inserted into the MergeTree table | rows |
| `increase(ClickHouseProfileEvents_SelectQueryTimeMicroseconds[1m]) / (increase(ClickHouseProfileEvents_SelectQuery[1m]) + 0.001)` | SELECT query average latency — SELECT query average latency | μs |
| `max_over_time(irate(ClickHouseProfileEvents_SelectQuery[2m]) [1h:1m])` | SELECT Query Number — Number of SELECT queries | queries |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedBytes[2m]) [1h:1m])` | Number of bytes of SELECT query — Number of bytes SELECT from all tables (uncompressed columns in the form they are stored in memory) | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedRows[2m]) [1h:1m])` | Number of rows of the SELECT query — The number of rows SELECT from all tables | rows |
| `ClickHouseMetrics_TCPConnection` | TCP Connections — Number of connections to TCP servers (clients with local interfaces), including server-server connections | connections |
| `ClickHouseMetrics_PartsTemporary` | Number of temporary parts — Section currently being generated, not in the data section list | parts |
| `max_over_time(irate(ClickHouseProfileEvents_ReadBufferFromFileDescriptorReadFailed[2m]) [1h:1m])` | Number of read failures from file descriptor — Number of failed reads (read/pread) from file descriptors | times |
| `max_over_time(irate(ClickHouseProfileEvents_ReadBufferFromFileDescriptorRead[2m]) [1h:1m])` | Read times from file descriptor — Number of reads (read/pread) made from file descriptors, excluding sockets | reads |
| `irate(ClickHouseProfileEvents_ReadBufferFromFileDescriptorReadBytes[2m])` | Number of bytes read from file descriptor — The number of bytes read from the file descriptor. If the file is compressed, this will show the size of the compressed data | bytes |
| `ClickHouseMetrics_DiskSpaceReservedForMerge` | Reserve space — Disk space reserved for the currently running background merge. It is slightly larger than the total size of the current merged portion | bytes |
| `ClickHouseMetrics_MemoryTracking` | Memory footprint — Total memory allocated | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_WriteBufferFromFileDescriptorWrite[2m]) [1h:1m])` | Number of writes to file descriptor — Number of writes to file descriptors (write/pwrite), excluding sockets | writes |
| `max_over_time(irate(ClickHouseProfileEvents_WriteBufferFromFileDescriptorWriteBytes[2m]) [1h:1m])` | Number of bytes written to file descriptor — The number of bytes written to the file descriptor. If the file is compressed, this will show the size of the compressed data | bytes |
| `increase(ClickHouseProfileEvents_MergesTimeMilliseconds[1m]) / increase(ClickHouseProfileEvents_Merge[1m])` | Pooled Average Duration — Average duration of merger | ms |
| `max_over_time(irate(ClickHouseProfileEvents_MergedUncompressedBytes[2m]) [1h:1m])` | Uncompressed bytes read by merging — Number of uncompressed bytes read by background merge (columns in the form they are stored in memory). This is the number of bytes before merging | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_MergedRows[2m]) [1h:1m])` | Merge number of rows read — Number of rows read by background merge. This is the number of rows before merging | rows |
| `max_over_time(irate(ClickHouseProfileEvents_Merge[2m]) [1h:1m])` | Number of background merges — Number of background merges initiated | times |
| `max_over_time(irate(ClickHouseProfileEvents_ReplicatedPartMerges[2m]) [1h:1m])` | Number of copy partial merges — Number of successful merges of the data portion of the ReplicatedMergeTree table | times |
| `max_over_time(irate(ClickHouseProfileEvents_ReplicatedDataLoss[2m]) [1h:1m])` | Number of data losses in the replication part — The number of times the data does not exist on any copy (even the copy that is now offline). These data parts must have been lost. Due to asynchronous replication (if quota insertion is not enabled), it is normal that the data part is not included when a copy of the data part fails to be written and comes back online after the failure | times |
| `max_over_time(irate(ClickHouseProfileEvents_FailedInsertQuery[2m]) [1h:1m])` | Number of failed INSERT queries — Same as the failed query but only for the INSERT query | times |
| `max_over_time(irate(ClickHouseProfileEvents_FailedSelectQuery[2m]) [1h:1m])` | Number of failed SELECT queries — Same as the failed query but only for the SELECT query | queries |
| `max_over_time(irate(ClickHouseProfileEvents_FailedQuery[2m]) [1h:1m])` | Number of failed queries — Number of failed queries | queries |
| `max_over_time(irate(ClickHouseProfileEvents_DelayedInserts[2m]) [1h:1m])` | Delayed Insertion Number — The number of times the block of INSERT to MergeTree table is restricted due to the number of active data parts of the partition | times |
| `increase(ClickHouseProfileEvents_DelayedInsertsMilliseconds[1m]) / (increase(ClickHouseProfileEvents_DelayedInserts[1m]) + 0.01)` | Average latency of delayed insertion blocking — Total waiting time (milliseconds) when the block of INSERT to MergeTree table is restricted due to the number of active data parts of the partition | ms |
| `max_over_time(irate(ClickHouseProfileEvents_SlowRead[2m]) [1h:1m])` | Slow query times — Number of slow query reads from a file, indicating system overload | times |
| `max_over_time(irate(ClickHouseProfileEvents_FileOpen[2m]) [1h:1m])` | Number of open files — Number of open files | files |
| `max_over_time(irate(ClickHouseProfileEvents_RejectedInserts[2m]) [1h:1m])` | Number of rejected insertions — Number of times a block of INSERT to MergeTree table was rejected due to an excessive number of active data parts of the partition | times |
| `ClickHouseMetrics_PartsCommitted` | Number of submitted parts — Number of data sections that have been submitted | parts |
| `max_over_time(irate(ClickHouseProfileEvents_InsertedBytes[2m]) [1h:1m])` | Insert bytes — Number of bytes of all tables INSERT (uncompressed columns in the form they are stored in memory) | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_InsertedRows[2m]) [1h:1m])` | Number of rows inserted — Number of rows for all tables INSERT | rows |
| `max_over_time(irate(ClickHouseProfileEvents_UncompressedCacheHits[2m]) [1h:1m])` | Number of uncompressed cache hits — Number of uncompressed cache hits | times |
| `max_over_time(irate(ClickHouseProfileEvents_UncompressedCacheMisses[2m]) [1h:1m])` | Number of uncompressed cache misses — Number of uncompressed cache misses | times |
| `max_over_time(irate(ClickHouseProfileEvents_QueryMemoryLimitExceeded[2m]) [1h:1m])` | Number of times the query memory limit exceeds the standard — The number of times the query memory limit exceeds the standard | times |
| `max_over_time(irate(ClickHouseProfileEvents_ReadBackoff[2m]) [1h:1m])` | Query processing thread reduction times — Reduced number of query processing threads due to slow query reads | times |
| `increase(ClickHouseProfileEvents_QueryTimeMicroseconds[1m]) / (increase(ClickHouseProfileEvents_Query[1m]) + 0.001)` | Average query latency — Average query latency | μs |
| `max_over_time(irate(ClickHouseProfileEvents_Query[2m]) [1h:1m])` | Total queries — Number of queries to be interpreted and possibly executed, excluding failed queries | queries |
| `max_over_time(irate(ClickHouseProfileEvents_MarkCacheHits[2m]) [1h:1m])` | Tag cache hits — Mark the number of cache hits | times |
| `rate(ClickHouseProfileEvents_MarkCacheMisses[2m])` | Tag cache misses — Mark the number of cache misses | times |
| `max_over_time(irate(ClickHouseProfileEvents_CompressedReadBufferBlocks[2m]) [1h:1m])` | Number of compressed blocks read — Number of compressed blocks read from compression source (file, network) (independently compressed data blocks) | blocks |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedParts[2m]) [1h:1m])` | Number of data parts read — Number of data parts read from the MergeTree table | parts |
| `max_over_time(irate(ClickHouseProfileEvents_CompressedReadBufferBytes[2m]) [1h:1m])` | Number of uncompressed bytes read — Number of uncompressed bytes read from compressed source (file, network) (number of decompressed bytes) | bytes |
| `irate(ClickHouseProfileEvents_SelectedMarks[2m])` | Number of marks read — Number of tokens read from MergeTree table (index granularity) | marks |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedRanges[2m]) [1h:1m])` | Number of ranges read — Number of ranges (non-adjacent) in all data parts read from the MergeTree table | ranges |
| `ClickHouseMetrics_PartsPreCommitted` | Number of pre-commit parts — In the DATA section, but not the section used for the SELECT query | parts |

## Related

- [ClickHouse template source](https://github.com/ccfos/nightingale/tree/main/integrations/ClickHouse): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `clickhouse` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/clickhouse): every config option and the full metric list.
- [Use ClickHouse as a data source](/docs/data/clickhouse-doris-iotdb)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
