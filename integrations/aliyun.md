# Monitor Alibaba Cloud with Nightingale

Pulls ECS, RDS, Redis, SLB, CDN, ARMS and other product metrics through the CloudMonitor OpenAPI; the template ships dozens of per-product dashboards and rules.

Last reviewed 2026-10-27

The `aliyun` input calls the CloudMonitor OpenAPI and pulls metrics per namespace: ECS, RDS, Redis, MongoDB, SLB/ALB, OSS, CDN, message queues, ARMS application monitoring and more. Metrics arrive named `aliyun_<namespace>_<metric>` with instance ID and region labels.

Create a RAM user, grant `AliyunCloudMonitorReadOnlyAccess` and issue an AccessKey. CloudMonitor metrics are usually at 60-second granularity, so do not collect more often than that. This is one of the dashboard-richest templates in the catalog, one per product, and the rules cover ECS CPU and disk, RDS connections and IOPS, Redis memory, SLB backend health, CDN status codes and other everyday cases.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **44 dashboards**, 883 panels in total
* **73 alert rules**, each with runbook steps
* **Categraf collector config**: `input.aliyun`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.aliyun/cloud.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.aliyun started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 60

   [[instances]]

   # # endpoint region 参考 https://help.aliyun.com/document_detail/28616.html#section-72p-xhs-6qt

   # region="cn-beijing"

   # endpoint="metrics.cn-hangzhou.aliyuncs.com"

   # access_key_id="your-access-key-id"

   # access_key_secret="your-access-key-secret"

   # interval_times=4

   # delay="10m"

   # period="60s"

   # # namespace 参考 https://help.aliyun.com/document_detail/163515.htm?spm=a2c4g.11186623.0.0.44d65c58mhgNw3

   # namespaces=["acs_ecs_dashboard"]

   # [[instances.metric_filters]]

   # # metric name 参考 https://help.aliyun.com/document_detail/163515.htm?spm=a2c4g.11186623.0.0.401d15c73Z0dZh

   # # 参考页面中的Metric Id 填入下面的metricName ,页面中包含中文的Metric Name对应接口中的Description

   # metric_names=["cpu_cores","vm.TcpCount"]

   # namespace=""

   # ratelimit=25

   # catch_ttl="1h"

   # timeout="5s"
   ```

2. Open the integration center in Nightingale, find Alibaba Cloud, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                                                                  | Panels |
| -------------------------------------------------------------------------- | ------ |
| AliYun-Message Queue for RabbitMQ                                          | 21     |
| ARMS-Application                                                           | 35     |
| ARMS-DB                                                                    | 5      |
| AliYun ARMS-JVM-SERVICE                                                    | 14     |
| ARMS-Machine                                                               | 7      |
| AliYun ARMS-JVM                                                            | 14     |
| AliYun CDN                                                                 | 5      |
| AliYun ECS                                                                 | 5      |
| AliYun MongoDB                                                             | 23     |
| MSE Monitoring Dashboard                                                   | 8      |
| AliYun MySQL                                                               | 15     |
| AliYun NAT                                                                 | 19     |
| AliYun OSS                                                                 | 43     |
| AliYun POLARDB-MySQL                                                       | 11     |
| AliYun RDS                                                                 | 5      |
| AliYun RDS\_N                                                              | 8      |
| AliYun REDIS                                                               | 5      |
| AliYun REDIS Cluster                                                       | 32     |
| AliYun REDIS\_N                                                            | 7      |
| AliYun REDIS Standard                                                      | 32     |
| AliYun SLB                                                                 | 6      |
| AliYun-SLB (Load Balancer)                                                 | 17     |
| AliYun WAF                                                                 | 6      |
| AliYun-ALB                                                                 | 36     |
| CDN Global Dashboard                                                       | 9      |
| ECS Instance Detail                                                        | 36     |
| AliYun-EIP                                                                 | 11     |
| AliYun-ES                                                                  | 10     |
| AliYun-Kafka                                                               | 17     |
| AliYun-MSE Ingress Monitoring Center                                       | 18     |
| AliYun-MongoDB-ReplicaSet                                                  | 29     |
| AliYun-OceanBase                                                           | 18     |
| AliYun-PolarDB                                                             | 18     |
| RDS-MySQL - Global Overview                                                | 5      |
| RDS-MySQL - Single Instance Monitoring                                     | 26     |
| AliYun-RabbitMQ                                                            | 25     |
| Redis/Tair Memory Edition (Standard) Instance Detail Dashboard             | 30     |
| Redis/Tair Memory Edition (RW-Splitting/Cluster) Instance Detail Dashboard | 136    |
| Redis Community Edition - Monitoring Dashboard - Standard                  | 17     |
| Redis Community Edition - Monitoring Dashboard - Cluster                   | 25     |
| Redis Community Edition - Monitoring Dashboard - RW-Splitting              | 25     |
| AliYun SLB                                                                 | 17     |
| WAF                                                                        | 5      |
| Enhanced NAT Gateway                                                       | 27     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

73 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### AliYun CDN edge status code 5XX ratio exceeds 1%[​](#aliyun-cdn-edge-status-code-5xx-ratio-exceeds-1 "Direct link to AliYun CDN edge status code 5XX ratio exceeds 1%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_cdn_code5xx_isp_value{} > 1
```

Runbook:

1. Use the console's error code analysis to see which regions/ISPs are erroring;
2. Check origin health — CDN 5xx is mostly caused by failed origin fetches;
3. If the origin is healthy, check the origin configuration (origin HOST, protocol, timeout);
4. For widespread failures, open a ticket with Alibaba Cloud and consider temporarily switching the origin address.

### AliYun CDN edge status code 4XX ratio reaches 100%[​](#aliyun-cdn-edge-status-code-4xx-ratio-reaches-100 "Direct link to AliYun CDN edge status code 4XX ratio reaches 100%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_cdn_code4xx_isp_value{} ==100
```

Runbook:

1. Use the console's error code analysis to confirm whether it is 403 or 404;
2. 403 usually means the hotlink protection/Referer/URL auth configuration does not match the actual requests;
3. 404 usually means the origin resource was deleted or the origin path is misconfigured;
4. After fixing, purge the CDN cache and retest.

### Mongo replica set - CPU usage exceeds 50%[​](#mongo-replica-set---cpu-usage-exceeds-50 "Direct link to Mongo replica set - CPU usage exceeds 50%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_cpu_utilization_average > 50
```

Runbook:

1. Confirm on the console instance monitoring page whether the CPU curve is sustained or a spike;
2. Use the console's one-click diagnosis or the slow log to find the SQL consuming the most CPU;
3. Add indexes to slow SQL and eliminate full table scans — this is the most effective step;
4. If it stays high after tuning, change the instance specification in the console, noting there will be a brief interruption.

### Mongo replica set - IOPS usage exceeds 80%[​](#mongo-replica-set---iops-usage-exceeds-80 "Direct link to Mongo replica set - IOPS usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_iops_utilization_average > 80
```

Runbook:

1. Confirm the IOPS curve against the specification ceiling on the console monitoring page;
2. Use the slow log to find the SQL scanning the most data — heavy random reads are the main cause of saturated IOPS;
3. Add indexes to reduce scanning and avoid large batch write transactions;
4. If it still tops out after tuning, upgrade the instance specification (IOPS scales with it).

### Mongo replica set - QPS spike exceeds 100%[​](#mongo-replica-set---qps-spike-exceeds-100 "Direct link to Mongo replica set - QPS spike exceeds 100%")

S3 Info · for 1 min · Trigger:

```
aliyun_acs_mongodb_qps_average offset 5m > 0 and (aliyun_acs_mongodb_qps_average - aliyun_acs_mongodb_qps_average offset 5m) / (aliyun_acs_mongodb_qps_average offset 5m) * 100 > 100
```

Runbook:

1. Confirm on the console monitoring page when the QPS curve jumped;
2. Compare against the business release log and marketing activity to confirm whether the traffic is expected;
3. If unexpected, use the slow/audit log to group by source, find the abnormal client and rate limit it;
4. Confirm whether a cache layer failed and let requests through to the database.

### Mongo replica set - replication lag exceeds 5 seconds[​](#mongo-replica-set---replication-lag-exceeds-5-seconds "Direct link to Mongo replica set - replication lag exceeds 5 seconds")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_replication_lag_average > 5
```

Runbook:

1. Confirm the lag curve and which node is lagging in the console;
2. On the primary, look for large transactions or bulk DML loading data — this is the most common cause;
3. If the read-only node itself is loaded, reduce queries to it or upgrade it;
4. If lag keeps growing, move read traffic back to the primary first.

### Mongo replica set - memory usage exceeds 80%[​](#mongo-replica-set---memory-usage-exceeds-80 "Direct link to Mongo replica set - memory usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_memory_utilization_average > 80
```

Runbook:

1. Confirm the memory growth trend on the console monitoring page;
2. For MongoDB watch the WiredTiger cache share; for MySQL watch the buffer pool and per-connection memory (sort/join buffers);
3. Look for large result set queries or an excessive connection count consuming memory;
4. If it is still short after tuning, upgrade in the console.

### Mongo replica set - disk usage exceeds 80%[​](#mongo-replica-set---disk-usage-exceeds-80 "Direct link to Mongo replica set - disk usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_disk_utilization_average > 80
```

Runbook:

1. Use the console's space analysis to see whether data, logs or temporary files dominate;
2. If binlog/redo dominates, shorten the log retention;
3. If data itself is large, archive historical data — after deleting you still need OPTIMIZE TABLE or to wait for space reclamation;
4. Expand the disk in the console as soon as possible; cloud disk expansion is usually online.

### Mongo sharded cluster - CPU usage exceeds 50%[​](#mongo-sharded-cluster---cpu-usage-exceeds-50 "Direct link to Mongo sharded cluster - CPU usage exceeds 50%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_sharding_cpu_utilization_average > 50
```

Runbook:

1. Confirm on the console instance monitoring page whether the CPU curve is sustained or a spike;
2. Use the console's one-click diagnosis or the slow log to find the SQL consuming the most CPU;
3. Add indexes to slow SQL and eliminate full table scans — this is the most effective step;
4. If it stays high after tuning, change the instance specification in the console, noting there will be a brief interruption.

### Mongo sharded cluster - IOPS usage exceeds 80%[​](#mongo-sharded-cluster---iops-usage-exceeds-80 "Direct link to Mongo sharded cluster - IOPS usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_sharding_iops_utilization_average > 80
```

Runbook:

1. Confirm the IOPS curve against the specification ceiling on the console monitoring page;
2. Use the slow log to find the SQL scanning the most data — heavy random reads are the main cause of saturated IOPS;
3. Add indexes to reduce scanning and avoid large batch write transactions;
4. If it still tops out after tuning, upgrade the instance specification (IOPS scales with it).

### Mongo sharded cluster - QPS spike exceeds 100%[​](#mongo-sharded-cluster---qps-spike-exceeds-100 "Direct link to Mongo sharded cluster - QPS spike exceeds 100%")

S3 Info · for 1 min · Trigger:

```
aliyun_acs_mongodb_sharding_qps_average offset 5m > 0 and (aliyun_acs_mongodb_sharding_qps_average - aliyun_acs_mongodb_sharding_qps_average offset 5m) / (aliyun_acs_mongodb_sharding_qps_average offset 5m) * 100 > 100
```

Runbook:

1. Confirm on the console monitoring page when the QPS curve jumped;
2. Compare against the business release log and marketing activity to confirm whether the traffic is expected;
3. If unexpected, use the slow/audit log to group by source, find the abnormal client and rate limit it;
4. Confirm whether a cache layer failed and let requests through to the database.

### Mongo sharded cluster - replication lag exceeds 5 seconds[​](#mongo-sharded-cluster---replication-lag-exceeds-5-seconds "Direct link to Mongo sharded cluster - replication lag exceeds 5 seconds")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_sharding_replication_lag_average > 5
```

Runbook:

1. Confirm the lag curve and which node is lagging in the console;
2. On the primary, look for large transactions or bulk DML loading data — this is the most common cause;
3. If the read-only node itself is loaded, reduce queries to it or upgrade it;
4. If lag keeps growing, move read traffic back to the primary first.

### Mongo sharded cluster - memory usage exceeds 80%[​](#mongo-sharded-cluster---memory-usage-exceeds-80 "Direct link to Mongo sharded cluster - memory usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_sharding_memory_utilization_average > 80
```

Runbook:

1. Confirm the memory growth trend on the console monitoring page;
2. For MongoDB watch the WiredTiger cache share; for MySQL watch the buffer pool and per-connection memory (sort/join buffers);
3. Look for large result set queries or an excessive connection count consuming memory;
4. If it is still short after tuning, upgrade in the console.

### Mongo sharded cluster - disk usage exceeds 80%[​](#mongo-sharded-cluster---disk-usage-exceeds-80 "Direct link to Mongo sharded cluster - disk usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_sharding_disk_utilization_average > 80
```

Runbook:

1. Use the console's space analysis to see whether data, logs or temporary files dominate;
2. If binlog/redo dominates, shorten the log retention;
3. If data itself is large, archive historical data — after deleting you still need OPTIMIZE TABLE or to wait for space reclamation;
4. Expand the disk in the console as soon as possible; cloud disk expansion is usually online.

### Mongo standalone - disk usage exceeds 80%[​](#mongo-standalone---disk-usage-exceeds-80 "Direct link to Mongo standalone - disk usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_single_node_disk_utilization_average > 80
```

Runbook:

1. Use the console's space analysis to see whether data, logs or temporary files dominate;
2. If binlog/redo dominates, shorten the log retention;
3. If data itself is large, archive historical data — after deleting you still need OPTIMIZE TABLE or to wait for space reclamation;
4. Expand the disk in the console as soon as possible; cloud disk expansion is usually online.

### Mongo standalone - memory usage exceeds 80%[​](#mongo-standalone---memory-usage-exceeds-80 "Direct link to Mongo standalone - memory usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_single_node_memory_utilization_average > 80
```

Runbook:

1. Confirm the memory growth trend on the console monitoring page;
2. For MongoDB watch the WiredTiger cache share; for MySQL watch the buffer pool and per-connection memory (sort/join buffers);
3. Look for large result set queries or an excessive connection count consuming memory;
4. If it is still short after tuning, upgrade in the console.

### Mongo standalone - CPU usage exceeds 50%[​](#mongo-standalone---cpu-usage-exceeds-50 "Direct link to Mongo standalone - CPU usage exceeds 50%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_mongodb_single_node_cpu_utilization_average > 50
```

Runbook:

1. Confirm on the console instance monitoring page whether the CPU curve is sustained or a spike;
2. Use the console's one-click diagnosis or the slow log to find the SQL consuming the most CPU;
3. Add indexes to slow SQL and eliminate full table scans — this is the most effective step;
4. If it stays high after tuning, change the instance specification in the console, noting there will be a brief interruption.

### Mongo standalone - QPS spike exceeds 100%[​](#mongo-standalone---qps-spike-exceeds-100 "Direct link to Mongo standalone - QPS spike exceeds 100%")

S3 Info · for 1 min · Trigger:

```
aliyun_acs_mongodb_single_node_qps_average offset 5m > 0 and (aliyun_acs_mongodb_single_node_qps_average - aliyun_acs_mongodb_single_node_qps_average offset 5m) / (aliyun_acs_mongodb_single_node_qps_average offset 5m) * 100 > 100
```

Runbook:

1. Confirm on the console monitoring page when the QPS curve jumped;
2. Compare against the business release log and marketing activity to confirm whether the traffic is expected;
3. If unexpected, use the slow/audit log to group by source, find the abnormal client and rate limit it;
4. Confirm whether a cache layer failed and let requests through to the database.

### AliYun-NAT - concurrent connection watermark exceeds 80%[​](#aliyun-nat---concurrent-connection-watermark-exceeds-80 "Direct link to AliYun-NAT - concurrent connection watermark exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_nat_gateway_session_active_connection_water_lever_value > 80
```

Runbook:

1. Confirm in the console whether it is concurrent connections or new connections that topped out;
2. Use flow logs to find which ECS instances hold the most connections;
3. The usual root cause is an application not reusing connections or a scanning job — switch to a connection pool;
4. If you genuinely need more capacity, upgrade the NAT gateway specification.

### AliYun-NAT - new connection watermark exceeds 80%[​](#aliyun-nat---new-connection-watermark-exceeds-80 "Direct link to AliYun-NAT - new connection watermark exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_nat_gateway_session_new_connection_water_lever_value > 80
```

Runbook:

1. Confirm in the console whether it is concurrent connections or new connections that topped out;
2. Use flow logs to find which ECS instances hold the most connections;
3. The usual root cause is an application not reusing connections or a scanning job — switch to a connection pool;
4. If you genuinely need more capacity, upgrade the NAT gateway specification.

### AliYun-OSS - GetObject average latency exceeds 100ms[​](#aliyun-oss---getobject-average-latency-exceeds-100ms "Direct link to AliYun-OSS - GetObject average latency exceeds 100ms")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_oss_dashboard_get_object_server_latency_value > 100
```

Runbook:

1. Confirm on the console monitoring page whether the latency curve rises together with request volume;
2. Check for heavy large-file reads or cross-region access — cross-region is the common cause of high latency;
3. For frequent small-file reads, consider a CDN or a local cache;
4. If it persists and is not a usage problem, open an Alibaba Cloud ticket.

### AliYun-OSS - availability below 100%[​](#aliyun-oss---availability-below-100 "Direct link to AliYun-OSS - availability below 100%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_oss_dashboard_availability_value < 100
```

Runbook:

1. Confirm the time distribution and error code mix of the failed requests on the console monitoring page;
2. Mostly 4xx means a client-side problem (permissions, signature, missing key) — check the application logic;
3. Mostly 5xx is a server-side problem — open an Alibaba Cloud ticket immediately;
4. Confirm the application has retry and fallback, and add them if not.

### AliYun-OSS - valid request ratio below 100%[​](#aliyun-oss---valid-request-ratio-below-100 "Direct link to AliYun-OSS - valid request ratio below 100%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_oss_dashboard_request_valid_rate_value < 100
```

Runbook:

1. Confirm the time distribution and error code mix of the failed requests on the console monitoring page;
2. Mostly 4xx means a client-side problem (permissions, signature, missing key) — check the application logic;
3. Mostly 5xx is a server-side problem — open an Alibaba Cloud ticket immediately;
4. Confirm the application has retry and fallback, and add them if not.

### AliYun-OSS - server error request ratio above 0[​](#aliyun-oss---server-error-request-ratio-above-0 "Direct link to AliYun-OSS - server error request ratio above 0")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_oss_dashboard_server_error_rate_value > 0
```

Runbook:

1. Confirm the volume and duration of 5xx on the console monitoring page;
2. Check whether it is concentrated on one bucket or one operation type;
3. Server-side errors should go straight to an Alibaba Cloud ticket with the request IDs attached;
4. Meanwhile confirm the application's retry logic works so requests are not silently lost.

### AliYun-OSS - server error request count above 0[​](#aliyun-oss---server-error-request-count-above-0 "Direct link to AliYun-OSS - server error request count above 0")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_oss_dashboard_server_error_count_value > 0
```

Runbook:

1. Confirm the volume and duration of 5xx on the console monitoring page;
2. Check whether it is concentrated on one bucket or one operation type;
3. Server-side errors should go straight to an Alibaba Cloud ticket with the request IDs attached;
4. Meanwhile confirm the application's retry logic works so requests are not silently lost.

### PolarDB CPU usage exceeds 80%[​](#polardb-cpu-usage-exceeds-80 "Direct link to PolarDB CPU usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_cpu_utilization_average > 80
```

Runbook:

1. Confirm on the console instance monitoring page whether the CPU curve is sustained or a spike;
2. Use the console's one-click diagnosis or the slow log to find the SQL consuming the most CPU;
3. Add indexes to slow SQL and eliminate full table scans — this is the most effective step;
4. If it stays high after tuning, change the instance specification in the console, noting there will be a brief interruption.

### PolarDB inode usage exceeds 80%[​](#polardb-inode-usage-exceeds-80 "Direct link to PolarDB inode usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_inode_utilization_average > 80
```

Runbook:

1. Use the console's space analysis to find the source of small files, usually too many partitions or accumulated temporary files;
2. Reduce the partition count and drop unused tables;
3. Check for many small tables that were never cleaned up;
4. If it cannot be reduced, expand the disk in the console (inode count grows with capacity).

### PolarDB IOPS usage exceeds 80%[​](#polardb-iops-usage-exceeds-80 "Direct link to PolarDB IOPS usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_iops_usage_average > 80
```

Runbook:

1. Confirm the IOPS curve against the specification ceiling on the console monitoring page;
2. Use the slow log to find the SQL scanning the most data — heavy random reads are the main cause of saturated IOPS;
3. Add indexes to reduce scanning and avoid large batch write transactions;
4. If it still tops out after tuning, upgrade the instance specification (IOPS scales with it).

### PolarDB Proxy CPU usage exceeds 80%[​](#polardb-proxy-cpu-usage-exceeds-80 "Direct link to PolarDB Proxy CPU usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_proxy_cpu_utilization_average > 80
```

Runbook:

1. Check the Proxy's connection count and QPS curves in the console;
2. If connections are high, cap the application pool — Proxy overhead correlates strongly with connection count;
3. Check whether an unnecessarily strong read/write splitting consistency level is enabled (strong consistency significantly increases Proxy overhead);
4. If you genuinely need more capacity, upgrade the Proxy specification.

### PolarDB read-only node replication lag exceeds 1 second[​](#polardb-read-only-node-replication-lag-exceeds-1-second "Direct link to PolarDB read-only node replication lag exceeds 1 second")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_replica_lag_average > 1
```

Runbook:

1. Confirm the lag curve and which node is lagging in the console;
2. On the primary, look for large transactions or bulk DML loading data — this is the most common cause;
3. If the read-only node itself is loaded, reduce queries to it or upgrade it;
4. If lag keeps growing, move read traffic back to the primary first.

### PolarDB memory usage exceeds 80%[​](#polardb-memory-usage-exceeds-80 "Direct link to PolarDB memory usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_memory_utilization_average > 80
```

Runbook:

1. Confirm the memory growth trend on the console monitoring page;
2. For MongoDB watch the WiredTiger cache share; for MySQL watch the buffer pool and per-connection memory (sort/join buffers);
3. Look for large result set queries or an excessive connection count consuming memory;
4. If it is still short after tuning, upgrade in the console.

### PolarDB slow query spike exceeds 100[​](#polardb-slow-query-spike-exceeds-100 "Direct link to PolarDB slow query spike exceeds 100")

S2 Warning · for 1 min · Trigger:

```
delta(aliyun_acs_polardb_cluster_slow_queries_ps_average{}[2m]) > 100
```

Runbook:

1. Sort the console slow log page by execution time to find the top slow SQL;
2. Use EXPLAIN to inspect the plan and eliminate full table scans;
3. Add indexes or rewrite the SQL and retest;
4. Check whether it relates to a recently released feature and roll back that query first if so.

### PolarDB disk usage exceeds 80%[​](#polardb-disk-usage-exceeds-80 "Direct link to PolarDB disk usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_disk_utilization_average > 80
```

Runbook:

1. Use the console's space analysis to see whether data, logs or temporary files dominate;
2. If binlog/redo dominates, shorten the log retention;
3. If data itself is large, archive historical data — after deleting you still need OPTIMIZE TABLE or to wait for space reclamation;
4. Expand the disk in the console as soon as possible; cloud disk expansion is usually online.

### PolarDB connection usage exceeds 80%[​](#polardb-connection-usage-exceeds-80 "Direct link to PolarDB connection usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_polardb_cluster_connection_utilization_average > 80
```

Runbook:

1. Check the connection count curve against the specification ceiling in the console;
2. Group connections by source with SHOW PROCESSLIST (MySQL family) or db.currentOp() (MongoDB) to find the abnormal application;
3. Tell business growth apart from a connection pool leak (many idle connections piling up);
4. Upgrade as an emergency measure, and cap the application pool and shorten idle timeouts for the root cause.

### AliYun RDS MySQL / CPU usage alert[​](#aliyun-rds-mysql--cpu-usage-alert "Direct link to AliYun RDS MySQL / CPU usage alert")

S2 Warning · for 3 min · Trigger:

```
AliyunRds_CpuUsage{engine="MySQL"} > 80
```

Runbook:

1. Confirm on the console instance monitoring page whether the CPU curve is sustained or a spike;
2. Use the console's one-click diagnosis or the slow log to find the SQL consuming the most CPU;
3. Add indexes to slow SQL and eliminate full table scans — this is the most effective step;
4. If it stays high after tuning, change the instance specification in the console, noting there will be a brief interruption.

### AliYun RDS MySQL / IOPS usage alert[​](#aliyun-rds-mysql--iops-usage-alert "Direct link to AliYun RDS MySQL / IOPS usage alert")

S2 Warning · for 3 min · Trigger:

```
AliyunRds_IOPSUsage{engine="MySQL"} > 80
```

Runbook:

1. Confirm the IOPS curve against the specification ceiling on the console monitoring page;
2. Use the slow log to find the SQL scanning the most data — heavy random reads are the main cause of saturated IOPS;
3. Add indexes to reduce scanning and avoid large batch write transactions;
4. If it still tops out after tuning, upgrade the instance specification (IOPS scales with it).

### AliYun RDS MySQL / QPS fluctuation alert[​](#aliyun-rds-mysql--qps-fluctuation-alert "Direct link to AliYun RDS MySQL / QPS fluctuation alert")

S2 Warning · for 3 min · Trigger:

```
100 * delta(AliyunRds_MySQL_QPS{}[5m]) / AliyunRds_MySQL_QPS{} offset 1m > 30
```

Runbook:

1. Confirm on the console monitoring page when the QPS curve jumped;
2. Compare against the business release log and marketing activity to confirm whether the traffic is expected;
3. If unexpected, use the slow/audit log to group by source, find the abnormal client and rate limit it;
4. Confirm whether a cache layer failed and let requests through to the database.

### AliYun RDS MySQL / TPS fluctuation alert[​](#aliyun-rds-mysql--tps-fluctuation-alert "Direct link to AliYun RDS MySQL / TPS fluctuation alert")

S2 Warning · for 3 min · Trigger:

```
100 * delta(AliyunRds_MySQL_TPS{}[5m]) / AliyunRds_MySQL_TPS{} offset 1m > 30
```

Runbook:

1. Confirm on the console monitoring page when the QPS curve jumped;
2. Compare against the business release log and marketing activity to confirm whether the traffic is expected;
3. If unexpected, use the slow/audit log to group by source, find the abnormal client and rate limit it;
4. Confirm whether a cache layer failed and let requests through to the database.

### AliYun RDS MySQL / memory usage alert[​](#aliyun-rds-mysql--memory-usage-alert "Direct link to AliYun RDS MySQL / memory usage alert")

S2 Warning · for 3 min · Trigger:

```
AliyunRds_MemoryUsage{engine="MySQL"} > 80
```

Runbook:

1. Confirm the memory growth trend on the console monitoring page;
2. For MongoDB watch the WiredTiger cache share; for MySQL watch the buffer pool and per-connection memory (sort/join buffers);
3. Look for large result set queries or an excessive connection count consuming memory;
4. If it is still short after tuning, upgrade in the console.

### AliYun RDS MySQL / total connections alert[​](#aliyun-rds-mysql--total-connections-alert "Direct link to AliYun RDS MySQL / total connections alert")

S2 Warning · for 3 min · Trigger:

```
AliyunRds_MySQL_ThreadsConnected{} > 1200
```

Runbook:

1. Check the connection count curve against the specification ceiling in the console;
2. Group connections by source with SHOW PROCESSLIST (MySQL family) or db.currentOp() (MongoDB) to find the abnormal application;
3. Tell business growth apart from a connection pool leak (many idle connections piling up);
4. Upgrade as an emergency measure, and cap the application pool and shorten idle timeouts for the root cause.

### AliYun RDS MySQL / slow query ratio above 1 alert[​](#aliyun-rds-mysql--slow-query-ratio-above-1-alert "Direct link to AliYun RDS MySQL / slow query ratio above 1 alert")

S2 Warning · for 3 min · Trigger:

```
100 * max(AliyunRds_MySQL_SlowQueries) by (instanceId, instanceName, regionId) / max(AliyunRds_MySQL_QPS) by (instanceId, instanceName, regionId) > 1
```

Runbook:

1. Sort the console slow log page by execution time to find the top slow SQL;
2. Use EXPLAIN to inspect the plan and eliminate full table scans;
3. Add indexes or rewrite the SQL and retest;
4. Check whether it relates to a recently released feature and roll back that query first if so.

### AliYun RDS MySQL / slow query alert[​](#aliyun-rds-mysql--slow-query-alert "Direct link to AliYun RDS MySQL / slow query alert")

S2 Warning · for 3 min · Trigger:

```
AliyunRds_MySQL_SlowQueries{} > 100
```

Runbook:

1. Sort the console slow log page by execution time to find the top slow SQL;
2. Use EXPLAIN to inspect the plan and eliminate full table scans;
3. Add indexes or rewrite the SQL and retest;
4. Check whether it relates to a recently released feature and roll back that query first if so.

### AliYun RDS MySQL / disk space usage alert[​](#aliyun-rds-mysql--disk-space-usage-alert "Direct link to AliYun RDS MySQL / disk space usage alert")

S2 Warning · for 3 min · Trigger:

```
AliyunRds_DiskUsage{engine="MySQL"} > 80
```

Runbook:

1. Use the console's space analysis to see whether data, logs or temporary files dominate;
2. If binlog/redo dominates, shorten the log retention;
3. If data itself is large, archive historical data — after deleting you still need OPTIMIZE TABLE or to wait for space reclamation;
4. Expand the disk in the console as soon as possible; cloud disk expansion is usually online.

### AliYun RDS MySQL / instance state abnormal alert[​](#aliyun-rds-mysql--instance-state-abnormal-alert "Direct link to AliYun RDS MySQL / instance state abnormal alert")

S1 Critical · for 1 min · Trigger:

```
{__name__=~"AliyunRds_MySQL_(SlaveIO|SlaveSQL)Running"} != 1
```

Runbook:

1. Confirm the replication state and lag on the read-only instance page in the Alibaba Cloud console;
2. The console usually offers a repair-replication entry — use it first;
3. If it was caused by the primary's binlog being purged, the read-only instance must be rebuilt;
4. Move read traffic off that read-only instance before you start.

### AliYun RDS MySQL / connection usage alert[​](#aliyun-rds-mysql--connection-usage-alert "Direct link to AliYun RDS MySQL / connection usage alert")

S2 Warning · for 3 min · Trigger:

```
AliyunRds_ConnectionUsage{engine="MySQL"} > 80
```

Runbook:

1. Check the connection count curve against the specification ceiling in the console;
2. Group connections by source with SHOW PROCESSLIST (MySQL family) or db.currentOp() (MongoDB) to find the abnormal application;
3. Tell business growth apart from a connection pool leak (many idle connections piling up);
4. Upgrade as an emergency measure, and cap the application pool and shorten idle timeouts for the root cause.

### RabbitMQ connections exceed 1000[​](#rabbitmq-connections-exceed-1000 "Direct link to RabbitMQ connections exceed 1000")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_amqp_instance_connections_value > 1000
```

Runbook:

1. Confirm the connection count curve against the specification ceiling in the console;
2. Check whether clients open a new connection for every send/receive — the correct pattern is a reused long-lived connection with one channel per thread;
3. Confirm no client is reconnecting abnormally;
4. If you genuinely need more connections, upgrade the instance specification.

### RabbitMQ consumer count is 0[​](#rabbitmq-consumer-count-is-0 "Direct link to RabbitMQ consumer count is 0")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_amqp_instance_consumers_value < 1
```

Runbook:

1. Confirm in the console which vhost/queue has no consumers;
2. On the consumer side, confirm the application process is alive and not reporting connection or auth errors;
3. If the consumer is healthy but not connected, verify the vhost, queue name and credentials;
4. Once consumption resumes, watch the backlog start to drain.

### RabbitMQ message backlog exceeds 1000[​](#rabbitmq-message-backlog-exceeds-1000 "Direct link to RabbitMQ message backlog exceeds 1000")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_amqp_instance_vhost_queue_message_accum_maximum > 1000
```

Runbook:

1. Confirm in the console which queue has the largest backlog and how fast it is growing;
2. Check whether the consumer count is zero or clearly insufficient — start or scale out consumers first;
3. If consumers exist but are slow, check the consumer log for abnormal retries or downstream timeouts;
4. For a huge backlog, consider temporarily increasing consumer concurrency.

### AliYun Redis CPU usage alert[​](#aliyun-redis-cpu-usage-alert "Direct link to AliYun Redis CPU usage alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)CpuUsage"},"redisType","$1","measure","(.+)CpuUsage") > 80
```

Runbook:

1. Check the CPU curve under console performance monitoring and use real-time key analysis to find hot keys;
2. Use the slow log to find O(N) commands (KEYS, HGETALL, wide ZRANGE) and rework them;
3. Splitting large keys is the single most effective optimisation;
4. If it stays high, upgrade the specification or move to the cluster edition to spread the load.

### AliYun Redis QPS usage alert[​](#aliyun-redis-qps-usage-alert "Direct link to AliYun Redis QPS usage alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)QPSUsage"},"redisType","$1","measure","(.+)QPSUsage") > 80
```

Runbook:

1. Confirm the QPS curve against the specification ceiling in the console;
2. Determine whether it is business growth or cache breakdown letting requests through;
3. Adding a local cache and batching requests on the application side reduces QPS significantly;
4. If you genuinely need more capacity, upgrade or move to the cluster edition.

### AliYun Redis memory usage alert[​](#aliyun-redis-memory-usage-alert "Direct link to AliYun Redis memory usage alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)MemoryUsage"},"redisType","$1","measure","(.+)MemoryUsage") > 80
```

Runbook:

1. Use the console's cache analysis to find the key prefixes consuming the most memory;
2. Split large keys and add TTLs to keys that have none;
3. Confirm maxmemory-policy matches expectations;
4. If capacity is genuinely short, upgrade the specification in the console.

### AliYun Redis hit ratio alert[​](#aliyun-redis-hit-ratio-alert "Direct link to AliYun Redis hit ratio alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)HitRate"},"redisType","$1","measure","(.+)HitRate") < 30
```

Runbook:

1. First rule out a cold start after a restart or resize;
2. In the console, check whether it comes with heavy key eviction — if so treat it as insufficient memory;
3. Review the cache key design and whether the TTL is too short;
4. Confirm there is no flood of lookups for non-existent keys (cache penetration) — add null caching or a bloom filter if needed.

### AliYun Redis failure count alert[​](#aliyun-redis-failure-count-alert "Direct link to AliYun Redis failure count alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_StandardFailedCount"},"redisType","$1","measure","(.+)FailedCount") > 0
```

Runbook:

1. Use the console audit log or the application log to identify the failing command type and error;
2. Common causes are writes rejected for lack of memory, exceeding the connection limit, or a disabled command;
3. Handle each accordingly (upgrade, reduce connections, use a supported command);
4. Confirm the application has retry and fallback logic.

### AliYun Redis average response time alert[​](#aliyun-redis-average-response-time-alert "Direct link to AliYun Redis average response time alert")

Unit: milliseconds

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)AvgRt"},"redisType","$1","measure","(.+)AvgRt") > 100000
```

Runbook:

1. Use the console slow log to find the slowest commands;
2. Focus on O(N) commands and big-key operations, switching to SCAN or batching;
3. Check whether throttling was triggered (bandwidth/QPS over specification);
4. Once those are ruled out, upgrade the specification in the console.

### AliYun Redis data sync latency alert[​](#aliyun-redis-data-sync-latency-alert "Direct link to AliYun Redis data sync latency alert")

Unit: milliseconds

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)SyncDelayTime"},"redisType","$1","measure","(.+)SyncDelayTime") > 5
```

Runbook:

1. Confirm the lag curve and the instance architecture in the console;
2. A spike in primary writes amplifies lag — check for bulk write jobs;
3. Syncing large keys causes obvious latency spikes — use cache analysis to find and split them;
4. If lag persists, move read traffic back to the primary.

### AliYun Redis max response time alert[​](#aliyun-redis-max-response-time-alert "Direct link to AliYun Redis max response time alert")

Unit: milliseconds

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)MaxRt"},"redisType","$1","measure","(.+)MaxRt") > 100000
```

Runbook:

1. Use the console slow log to find the single slowest command;
2. Tail latency usually comes from big-key operations or blocking commands — split large keys first;
3. Check whether an RDB/AOF persistence fork is causing periodic stalls;
4. If it persists after tuning, upgrade the specification in the console.

### AliYun Redis inbound bandwidth usage alert[​](#aliyun-redis-inbound-bandwidth-usage-alert "Direct link to AliYun Redis inbound bandwidth usage alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)IntranetInRatio"},"redisType","$1","measure","(.+)IntranetInRatio") > 80
```

Runbook:

1. Confirm the bandwidth curve against the specification ceiling in the console;
2. Use cache analysis to find large keys — writing large keys is the main cause of saturated bandwidth;
3. Split large keys and reduce one-shot bulk writes;
4. If you genuinely need more bandwidth, upgrade the specification.

### AliYun Redis outbound bandwidth usage alert[​](#aliyun-redis-outbound-bandwidth-usage-alert "Direct link to AliYun Redis outbound bandwidth usage alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)IntranetOutRatio"},"redisType","$1","measure","(.+)IntranetOutRatio") > 80
```

Runbook:

1. Confirm the bandwidth curve against the specification ceiling in the console;
2. Use cache analysis to find large keys — reading large keys is the main source of outbound bandwidth;
3. Split large keys and avoid one-shot HGETALL/SMEMBERS full reads;
4. If you genuinely need more bandwidth, upgrade the specification.

### AliYun Redis connection usage alert[​](#aliyun-redis-connection-usage-alert "Direct link to AliYun Redis connection usage alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)ConnectionUsage"},"redisType","$1","measure","(.+)ConnectionUsage")
```

Runbook:

1. Confirm the connection count curve against the specification ceiling in the console;
2. Check whether clients fail to reuse connections or the pool is oversized;
3. As an emergency measure upgrade in the console to raise the connection limit;
4. For the root cause, cap the application pool and enable connection reuse.

### AliYun Redis cached key count alert[​](#aliyun-redis-cached-key-count-alert "Direct link to AliYun Redis cached key count alert")

S2 Warning · for 3 min · Trigger:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)Keys"},"redisType","$1","measure","(.+)Keys") > 80
```

Runbook:

1. Use the console's cache analysis to count keys by prefix and find the fastest-growing prefix;
2. Confirm whether those keys should have a TTL — cache keys without expiry are a classic memory leak;
3. Add sensible expiry times and clean up the existing keys;
4. Confirm the application is not using Redis as persistent storage.

### AliYun-SLB - L7 instance Upstream 5xx (Count/Second) above 10[​](#aliyun-slb---l7-instance-upstream-5xx-countsecond-above-10 "Direct link to AliYun-SLB - L7 instance Upstream 5xx (Count/Second) above 10")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_upstream_code5xx_average > 10
```

Runbook:

1. In the console, confirm whether it is Upstream 5xx (returned by the backend) or instance 5xx (from SLB itself);
2. For Upstream 5xx, check the application logs on the backend ECS for the root cause;
3. Instance 5xx usually means all backends are unhealthy — check the health check configuration and backend state;
4. If it lines up with a recent release, roll back first.

### AliYun-SLB - L7 instance status code 5xx (Count/Second) above 10[​](#aliyun-slb---l7-instance-status-code-5xx-countsecond-above-10 "Direct link to AliYun-SLB - L7 instance status code 5xx (Count/Second) above 10")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_status_code5xx_average > 10
```

Runbook:

1. In the console, confirm whether it is Upstream 5xx (returned by the backend) or instance 5xx (from SLB itself);
2. For Upstream 5xx, check the application logs on the backend ECS for the root cause;
3. Instance 5xx usually means all backends are unhealthy — check the health check configuration and backend state;
4. If it lines up with a recent release, roll back first.

### AliYun-SLB - L7 instance QPS usage exceeds 50%[​](#aliyun-slb---l7-instance-qps-usage-exceeds-50 "Direct link to AliYun-SLB - L7 instance QPS usage exceeds 50%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_qps_utilization_average > 50
```

Runbook:

1. Confirm the QPS curve against the instance specification's performance ceiling in the console;
2. Determine whether it is genuine business growth or abnormal traffic;
3. For growth, upgrade the SLB specification (guaranteed-performance instances let you set the ceiling);
4. For abnormal traffic, add WAF/DDoS protection and rate limiting.

### AliYun-SLB - dropped connections above 0[​](#aliyun-slb---dropped-connections-above-0 "Direct link to AliYun-SLB - dropped connections above 0")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_drop_connection_average > 0
```

Runbook:

1. In the console, compare the drop curve against the instance specification's connection/bandwidth ceiling to see which one topped out;
2. If it topped out, upgrade the specification immediately — shared-performance instances top out especially easily at peak;
3. Check whether abnormal traffic is consuming the quota;
4. After upgrading, confirm drops return to zero.

### AliYun-SLB - inbound dropped traffic above 0[​](#aliyun-slb---inbound-dropped-traffic-above-0 "Direct link to AliYun-SLB - inbound dropped traffic above 0")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_drop_traffic_rx_average > 0
```

Runbook:

1. In the console, compare the drop curve against the instance specification's connection/bandwidth ceiling to see which one topped out;
2. If it topped out, upgrade the specification immediately — shared-performance instances top out especially easily at peak;
3. Check whether abnormal traffic is consuming the quota;
4. After upgrading, confirm drops return to zero.

### AliYun-SLB - outbound dropped traffic above 0[​](#aliyun-slb---outbound-dropped-traffic-above-0 "Direct link to AliYun-SLB - outbound dropped traffic above 0")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_drop_traffic_tx_average > 0
```

Runbook:

1. In the console, compare the drop curve against the instance specification's connection/bandwidth ceiling to see which one topped out;
2. If it topped out, upgrade the specification immediately — shared-performance instances top out especially easily at peak;
3. Check whether abnormal traffic is consuming the quota;
4. After upgrading, confirm drops return to zero.

### AliYun-SLB - instance new connection usage exceeds 50%[​](#aliyun-slb---instance-new-connection-usage-exceeds-50 "Direct link to AliYun-SLB - instance new connection usage exceeds 50%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_new_connection_utilization_average > 50
```

Runbook:

1. Confirm the max connection and new connection curves in the console;
2. Check whether the backend is responding more slowly and causing connections to pile up — a high connection count is often a symptom of a slow backend;
3. If the backend is fine, upgrade the SLB specification;
4. Check whether clients are failing to reuse connections.

### AliYun-SLB - instance max connection usage exceeds 50%[​](#aliyun-slb---instance-max-connection-usage-exceeds-50 "Direct link to AliYun-SLB - instance max connection usage exceeds 50%")

S2 Warning · for 1 min · Trigger:

```
aliyun_acs_slb_dashboard_instance_max_connection_utilization_average > 50
```

Runbook:

1. Confirm the max connection and new connection curves in the console;
2. Check whether the backend is responding more slowly and causing connections to pile up — a high connection count is often a symptom of a slow backend;
3. If the backend is fine, upgrade the SLB specification;
4. Check whether clients are failing to reuse connections.

### AliYun SLB 4XX ratio alert, above 10%[​](#aliyun-slb-4xx-ratio-alert-above-10 "Direct link to AliYun SLB 4XX ratio alert, above 10%")

S2 Warning · for 5 min · Trigger:

```
100 * AliyunSlb_InstanceStatusCode4xx{} / on(loadBalancerId) group_left sum({__name__=~"AliyunSlb_InstanceStatusCode.+"}) by (loadBalancerId,loadBalancerName,regionId) > 10
```

Runbook:

1. Check the 4xx breakdown in the console to see whether 404 or 403/401 dominates;
2. A 404 spike usually means the frontend references a decommissioned endpoint — check the release log;
3. A 403/401 spike points at an auth configuration change or expired credentials;
4. For suspected scanning traffic, put a WAF in front to block it.

### AliYun SLB 5XX ratio alert, above 10%[​](#aliyun-slb-5xx-ratio-alert-above-10 "Direct link to AliYun SLB 5XX ratio alert, above 10%")

S2 Warning · for 5 min · Trigger:

```
100 * AliyunSlb_InstanceStatusCode5xx{} / on(loadBalancerId) group_left sum({__name__=~"AliyunSlb_InstanceStatusCode.+"}) by (loadBalancerId,loadBalancerName,regionId) > 10
```

Runbook:

1. In the console, confirm whether it is Upstream 5xx (returned by the backend) or instance 5xx (from SLB itself);
2. For Upstream 5xx, check the application logs on the backend ECS for the root cause;
3. Instance 5xx usually means all backends are unhealthy — check the health check configuration and backend state;
4. If it lines up with a recent release, roll back first.

### AliYun SLB L7 instance QPS usage exceeds 80%[​](#aliyun-slb-l7-instance-qps-usage-exceeds-80 "Direct link to AliYun SLB L7 instance QPS usage exceeds 80%")

S2 Warning · for 5 min · Trigger:

```
AliyunSlb_InstanceQpsUtilization{} > 80
```

Runbook:

1. Confirm the QPS curve against the instance specification's performance ceiling in the console;
2. Determine whether it is genuine business growth or abnormal traffic;
3. For growth, upgrade the SLB specification (guaranteed-performance instances let you set the ceiling);
4. For abnormal traffic, add WAF/DDoS protection and rate limiting.

### AliYun SLB instance max connection usage exceeds 80%[​](#aliyun-slb-instance-max-connection-usage-exceeds-80 "Direct link to AliYun SLB instance max connection usage exceeds 80%")

S2 Warning · for 5 min · Trigger:

```
AliyunSlb_InstanceMaxConnectionUtilization{} > 80
```

Runbook:

1. Confirm the max connection and new connection curves in the console;
2. Check whether the backend is responding more slowly and causing connections to pile up — a high connection count is often a symptom of a slow backend;
3. If the backend is fine, upgrade the SLB specification;
4. Check whether clients are failing to reuse connections.

### AliYun SLB dropped connections exceed 10 per second[​](#aliyun-slb-dropped-connections-exceed-10-per-second "Direct link to AliYun SLB dropped connections exceed 10 per second")

S2 Warning · for 5 min · Trigger:

```
AliyunSlb_DropConnection{} > 10
```

Runbook:

1. In the console, compare the drop curve against the instance specification's connection/bandwidth ceiling to see which one topped out;
2. If it topped out, upgrade the specification immediately — shared-performance instances top out especially easily at peak;
3. Check whether abnormal traffic is consuming the quota;
4. After upgrading, confirm drops return to zero.

## Related[​](#related "Direct link to Related")

* [Alibaba Cloud template source](https://github.com/ccfos/nightingale/tree/main/integrations/AliYun): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `aliyun` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/aliyun): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
