---
title: "用夜莺监控 MongoDB"
sidebar_label: "MongoDB"
description: "内置 mongodb_exporter 的采集逻辑，覆盖连接、操作计数、复制集与分片状态；仪表盘要求开启兼容模式的指标名。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB
toc_max_heading_level: 2
mdx:
  format: md
---

MongoDB 插件由 percona 的 mongodb_exporter 封装而来，通过 `serverStatus`、`replSetGetStatus` 等命令采集连接数、操作计数、队列、WiredTiger 缓存、复制集成员状态和 oplog 窗口。分片集群用 `mongodb_cluster` 插件从 mongos 侧采集。

模板里的仪表盘按 `mongodb_ss_*` 这类 0.1x 兼容指标名编写，所以 Categraf 配置里必须设置 `compatible_mode = true`，并给每个实例一个 `instance` 标签。规则覆盖连接数、复制延迟、副本集成员异常和实例不可达。

## 模板里有什么

- **1 张仪表盘**，共 23 个面板
- **8 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.mongodb`、`input.mongodb_cluster`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

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

1. 在夜莺「集成中心」里找到 MongoDB，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| MongoDB Overview by exporter | 23 |

## 内置告警规则

共 8 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### MongoDB average operation latency exceeds 250ms - exporter

S2 警告 · 持续 10 分钟 · 触发条件:

```promql
rate(mongodb_mongod_op_latencies_latency_total[5m]) / rate(mongodb_mongod_op_latencies_ops_total[5m]) > 250000
```

处置步骤:

1. db.currentOp(\{"secs_running":\{$gt:5\}\}) 找当前长时间运行的操作，必要时 db.killOp(opid) 止血；
1. 开 profiler 定位慢查询：db.setProfilingLevel(1,100) 后 db.system.profile.find().sort(\{millis:-1\}).limit(10)；
1. 对慢查询执行 explain("executionStats")，看是否走了 COLLSCAN 全表扫描并补索引；
1. 排查是否有大批量写入或索引重建正在占住磁盘 IO。

### Mongo connection number has exceeded 80% - exporter

S2 警告 · 持续 2 分钟 · 触发条件:

```promql
avg by (instance) (mongodb_connections{state="current"}) / (avg by (instance) (mongodb_connections{state="current"}) + avg by (instance) (mongodb_connections{state="available"})) * 100 > 80
```

处置步骤:

1. db.serverStatus().connections 确认 current 与 available 的真实水位；
1. db.currentOp(true) 按 client 分组，找出连接数异常的应用；
1. 区分业务增长与驱动连接池泄漏（应用侧 maxPoolSize 配置过大或没有复用 MongoClient）；
1. 应急可调大 mongod 的 net.maxIncomingConnections，同时核对系统 ulimit -n 是否足够。

### Mongo has encountered an Assert error - exporter

S3 提醒 · 持续 30 分钟 · 触发条件:

```promql
rate(mongodb_asserts_total{type=~"regular|message"}[5m]) > 0
```

处置步骤:

1. 用 db.adminCommand(\{getLog:"global"\}) 看日志中 assert 的上下文；
1. db.serverStatus().asserts 确认是 regular 还是 message 类在涨；
1. regular 多为存储层异常，检查磁盘健康与数据文件完整性；message 多为协议或驱动不匹配，核对驱动版本；
1. 确认是否与近期升级、schema 变更的时间吻合。

### Mongo has encountered cursor timeout - exporter

S2 警告 · 持续 30 分钟 · 触发条件:

```promql
rate(mongodb_mongod_metrics_cursor_timed_out_total[5m]) > 0
```

处置步骤:

1. db.serverStatus().metrics.cursor 看 timedOut 与 open.total 的变化；
1. 应用侧确认游标用完是否 close()，批处理单批耗时是否过长；
1. 长耗时遍历改用 noCursorTimeout 并自行管理生命周期，或调小 batchSize 加快消费；
1. 检查是否有慢查询把游标撑过了 cursorTimeoutMillis（默认 10 分钟）。

### Mongo has encountered page fault interrupt - exporter

S2 警告 · 持续 30 分钟 · 触发条件:

```promql
rate(mongodb_extra_info_page_faults_total[5m]) > 0
```

处置步骤:

1. db.serverStatus().wiredTiger.cache 看 "bytes currently in the cache" 与配置上限的比值；
1. 用 db.stats() 和索引大小对比物理内存，评估工作集是否已超内存；
1. 优先删除无用索引、归档冷数据来缩小工作集；
1. 确认宿主机没有 swap 抖动，必要时扩内存或做分片。

### Mongo has just restarted, please pay attention - exporter

S3 提醒 · 触发条件:

```promql
mongodb_instance_uptime_seconds < 60
```

处置步骤:

1. 看 mongod 日志尾部确认是崩溃、被 OOM kill 还是人工重启；
1. 若是 OOM，核对 wiredTigerCacheSizeGB 与宿主机内存后调小；
1. 副本集场景用 rs.status() 确认是否已自动选出新主、应用是否已重连；
1. 非计划内重启要检查 systemd 或容器编排是否在反复拉起。

### Mongo instance has crashed - exporter

S1 紧急 · 触发条件:

```promql
mongodb_up == 0
```

处置步骤:

1. 登录主机用 systemctl status mongod 或 docker ps 确认进程是否存活；
1. 进程存活则用 mongosh 手工连一次，区分实例夯住与网络/认证问题；
1. 进程不在则先看日志尾部定位原因（OOM、磁盘满、数据文件损坏）再拉起，不要盲目重启；
1. 副本集场景立即执行 rs.status() 确认是否已完成主从切换，并确认应用已摘除该节点。

### Mongo replica set master-slave delay exceeds 30 seconds - exporter

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
(max by (rs_nm) (mongodb_rs_members_optimeDate) - min by (rs_nm) (mongodb_rs_members_optimeDate)) / 1000 > 30
```

处置步骤:

1. 在主节点执行 rs.status()，对比各成员的 optimeDate 与 lastHeartbeat 定位落后的成员；
1. 到落后节点看 mongod 日志是否有 oplog 拉取报错或磁盘 IO 瓶颈；
1. 主节点用 db.currentOp() 确认是否有大批量写入把 oplog 灌满导致从节点追不上；
1. 落后超过 oplog 窗口时从节点需要重新初始同步（initial sync），期间先把读流量切走。

## 相关链接

- [MongoDB 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `mongodb` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/mongodb)：完整配置项和指标列表。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
