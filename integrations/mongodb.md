---
title: "Monitor MongoDB with Nightingale"
sidebar_label: "MongoDB"
description: "Embeds the mongodb_exporter collector for connections, op counters, replica set and sharding state; the dashboards need the compatible metric names turned on."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB
toc_max_heading_level: 2
mdx:
  format: md
---

The MongoDB input wraps Percona's mongodb_exporter and collects connections, op counters, queues, WiredTiger cache, replica set member state and oplog window via `serverStatus`, `replSetGetStatus` and related commands. For sharded clusters, the `mongodb_cluster` input collects from the mongos side.

The bundled dashboards are written against the 0.1x-compatible metric names such as `mongodb_ss_*`, so the Categraf config must set `compatible_mode = true` and give every instance an `instance` label. The rules cover connection counts, replication lag, unhealthy replica set members and unreachable instances.

## What's in the template

- **1 dashboard**, 23 panels in total
- **8 alert rules**, each with runbook steps
- **Categraf collector config**: `input.mongodb`, `input.mongodb_cluster`

## How to connect

1. [Install Categraf](/docs/data/categraf/install) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

   `conf/input.mongodb/mongodb.toml`

   ```toml
   [[instances]]
   # log level, enum: panic, fatal, error, warn, warning, info, debug, trace, defaults to info.
   log_level = "info"
   # append some const labels to metrics
   # NOTICE! the instance label is required for dashboards
   labels = { instance="mongo-cluster-01" }

   # mongodb dsn, see https://www.mongodb.com/docs/manual/reference/connection-string/
   # mongodb_uri = "mongodb://127.0.0.1:27017"
   mongodb_uri = ""
   # if you don't specify the username or password in the mongodb_uri, you can set here. 
   # This will overwrite the dsn, it would be helpful when special characters existing in the username or password and you don't want to encode them.
   # NOTICE! this user must be granted enough rights to query needed stats, see ../inputs/mongodb/README.md
   # username = "<username>"
   # password = "<password>"
   # if set to true, use the direct connection way
   # direct_connect = true

   # collect all means you collect all the metrics, if set, all below enable_xxx flags in this section will be ignored
   collect_all = true
   # if set to true, collect databases metrics
   # enable_db_stats = true
   # if set to true, collect getDiagnosticData metrics
   # enable_diagnostic_data = true
   # if set to true, collect replSetGetStatus metrics
   # enable_replicaset_status = true
   # if set to true, collect top metrics by admin command
   # enable_top_metrics = true
   # if set to true, collect index metrics. You should specify one of the coll_stats_namespaces and the discovering_mode flags.
   # enable_index_stats = true
   # if set to true, collect collections metrics. You should specify one of the coll_stats_namespaces and the discovering_mode flags.
   # enable_coll_stats = true

   # Only get stats for the collections matching this list of namespaces. if none set, discovering_mode will be enabled.
   # Example: db1.col1,db.col1
   # coll_stats_namespaces = []
   # Only get stats for index with the collections matching this list of namespaces.
   # Example: db1.col1,db.col1
   # index_stats_collections = []
   # if set to true, replace -1 to DESC for label key_name of the descending_index metrics
   # enable_override_descending_index = true

   # The bundled dashboard uses the 0.1x-compatible mongodb_ss_* metric names.
   compatible_mode = true

   # [[instances]]
   # # interval = global.interval * interval_times
   # interval_times = 1

   # log_level = "error"

   # append some labels to metrics
   # labels = { instance="mongo-cluster-02" }
   # mongodb_uri = "mongodb://username:password@127.0.0.1:27017"
   # collect_all = true
   # compatible_mode = true
   ```

   `conf/input.mongodb_cluster/mongodb_cluster.toml`

   ```toml
   [[instances]]
   # 日志级别，枚举值：panic, fatal, error, warn, warning, info, debug, trace，默认为 info。
   log_level = "info"

   # 为指标附加一些常量标签
   # 注意！instance 标签是仪表板所必需的
   labels = { instance="mongo-cluster-02" }

   # MongoDB 的数据源名称（DSN），请参考 https://www.mongodb.com/docs/manual/reference/connection-string/
   mongodb_uri = "mongodb://127.0.0.1:27017"
   #mongodb_uri = ""
   # 如果你没有在 mongodb_uri 中指定用户名或密码，可以在这里设置。
   # 这将覆盖 dsn，当用户名或密码中存在特殊字符时，设置这里会很有用，避免手动编码它们。
   # 注意！该用户必须被授予足够的权限来查询所需的统计数据，详见 ../inputs/mongodb/README.md
   #username = "root"
   #password = "<password>"
   # 如果设置为 true，将使用直接连接方式。
   # 如果希望采集集群每个实例的 mongodb_rs_myState 指标，需要开启 direct_connect
   direct_connect = true

   # 如果设置为 true，则采集所有指标。 如果设置此项，下面所有的 enable_xxx 标志将会被忽略。
   collect_all = true

   # 如果设置为 true，采集数据库的统计数据
   #enable_db_stats = true

   # 如果设置为 true，采集 MongoDB 的诊断数据
   enable_diagnostic_data = true

   # 如果设置为 true，采集副本集状态的相关指标
   #enable_replicaset_status = true

   # 如果设置为 true，采集通过 admin 命令获得的 top 相关指标
   #enable_top_metrics = true

   # 如果设置为 true，采集与索引相关的指标。需要指定集合的命名空间和发现模式。你需要指定其中一个 coll_stats_namespaces 和 discovering_mode 标志。
   #enable_index_stats = true

   # 如果设置为 true，采集集合相关的指标。你需要指定其中一个 coll_stats_namespaces 和 discovering_mode 标志。
   #enable_coll_stats = true

   # 仅获取与此列表匹配的集合统计信息。如果未设置，将启用 discovering_mode。
   # 示例：db1.col1,db.col1
   # coll_stats_namespaces = []

   # 仅获取与此列表匹配的集合中的索引统计信息。
   # 示例：db1.col1,db.col1
   # index_stats_collections = []

   # 如果设置为 true，将在降序索引的 label key_name 中用 DESC 替代 -1
   # enable_override_descending_index = true

   # 启用兼容模式，暴露的指标名称符合 0.1x 版本的兼容性命名规则，简化了从旧版本到当前版本的迁移。
   # compatible_mode = true
   ```

1. Open the integration center in Nightingale, find MongoDB, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| MongoDB Overview by exporter | 23 |

## Bundled alert rules

8 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### MongoDB average operation latency exceeds 250ms - exporter

S2 Warning · for 10 min · Trigger:

```promql
rate(mongodb_mongod_op_latencies_latency_total[5m]) / rate(mongodb_mongod_op_latencies_ops_total[5m]) > 250000
```

Runbook:

1. Run db.currentOp(\{"secs_running":\{$gt:5\}\}) to find long-running operations and db.killOp(opid) to stop the bleeding if needed;
1. Enable the profiler to find slow queries: db.setProfilingLevel(1,100), then db.system.profile.find().sort(\{millis:-1\}).limit(10);
1. Run explain("executionStats") on the slow queries to see whether they do a COLLSCAN and add indexes;
1. Check whether a bulk write or an index rebuild is saturating disk IO.

### Mongo connection number has exceeded 80% - exporter

S2 Warning · for 2 min · Trigger:

```promql
avg by (instance) (mongodb_connections{state="current"}) / (avg by (instance) (mongodb_connections{state="current"}) + avg by (instance) (mongodb_connections{state="available"})) * 100 > 80
```

Runbook:

1. Run db.serverStatus().connections to see the real current and available levels;
1. Run db.currentOp(true) and group by client to find the application with an abnormal connection count;
1. Tell business growth apart from a driver connection pool leak (maxPoolSize set too high, or the MongoClient is not reused);
1. As an emergency measure raise net.maxIncomingConnections on mongod, and confirm the system ulimit -n is high enough.

### Mongo has encountered an Assert error - exporter

S3 Info · for 30 min · Trigger:

```promql
rate(mongodb_asserts_total{type=~"regular|message"}[5m]) > 0
```

Runbook:

1. Run db.adminCommand(\{getLog:"global"\}) to see the context of the asserts in the log;
1. Run db.serverStatus().asserts to see whether the regular or message counter is growing;
1. Regular asserts usually point to the storage layer — check disk health and data file integrity; message asserts usually mean a protocol or driver mismatch, so verify the driver version;
1. Check whether it lines up with a recent upgrade or schema change.

### Mongo has encountered cursor timeout - exporter

S2 Warning · for 30 min · Trigger:

```promql
rate(mongodb_mongod_metrics_cursor_timed_out_total[5m]) > 0
```

Runbook:

1. Run db.serverStatus().metrics.cursor and watch timedOut against open.total;
1. On the application side, confirm cursors are close()d after use and that a single batch does not take too long;
1. For long traversals use noCursorTimeout and manage the lifecycle yourself, or lower batchSize to consume faster;
1. Check whether a slow query is holding a cursor past cursorTimeoutMillis (10 minutes by default).

### Mongo has encountered page fault interrupt - exporter

S2 Warning · for 30 min · Trigger:

```promql
rate(mongodb_extra_info_page_faults_total[5m]) > 0
```

Runbook:

1. Run db.serverStatus().wiredTiger.cache and compare "bytes currently in the cache" against the configured limit;
1. Compare db.stats() and index sizes against physical memory to judge whether the working set exceeds RAM;
1. Start by dropping unused indexes and archiving cold data to shrink the working set;
1. Confirm the host is not swapping, and add memory or shard if necessary.

### Mongo has just restarted, please pay attention - exporter

S3 Info · Trigger:

```promql
mongodb_instance_uptime_seconds < 60
```

Runbook:

1. Read the tail of the mongod log to tell a crash, an OOM kill and a manual restart apart;
1. If it was an OOM, compare wiredTigerCacheSizeGB against host memory and lower it;
1. For a replica set, run rs.status() to confirm a new primary was elected automatically and applications reconnected;
1. For an unplanned restart, check whether systemd or the container orchestrator is repeatedly restarting it.

### Mongo instance has crashed - exporter

S1 Critical · Trigger:

```promql
mongodb_up == 0
```

Runbook:

1. Log in to the host and run systemctl status mongod or docker ps to confirm the process is alive;
1. If it is alive, connect by hand with mongosh to tell a hung instance apart from a network or authentication problem;
1. If it is not running, read the tail of the log to identify the cause (OOM, full disk, corrupted data files) before starting it — do not blindly restart;
1. For a replica set, run rs.status() immediately to confirm failover completed and that the application has taken this node out of rotation.

### Mongo replica set master-slave delay exceeds 30 seconds - exporter

S1 Critical · for 1 min · Trigger:

```promql
(max by (rs_nm) (mongodb_rs_members_optimeDate) - min by (rs_nm) (mongodb_rs_members_optimeDate)) / 1000 > 30
```

Runbook:

1. Run rs.status() on the primary and compare optimeDate and lastHeartbeat across members to find the lagging one;
1. On the lagging node, check the mongod log for oplog fetch errors or disk IO bottlenecks;
1. On the primary, run db.currentOp() to check whether a bulk write is flooding the oplog faster than the secondary can apply;
1. If it falls behind the oplog window the secondary needs a fresh initial sync — move read traffic away first.

## Related

- [MongoDB template source](https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `mongodb` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/mongodb): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
