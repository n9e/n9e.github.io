---
title: "用夜莺监控 ClickHouse"
sidebar_label: "ClickHouse"
description: "通过 HTTP 接口读取 system.metrics、system.events 和 system.asynchronous_metrics，查询、合并、复制队列和内存都有指标说明。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/ClickHouse
toc_max_heading_level: 2
mdx:
  format: md
---

ClickHouse 插件通过 HTTP 接口（默认 8123）查询 `system.metrics`、`system.events`、`system.asynchronous_metrics` 和 `system.parts` 等系统表：并发查询、合并与 mutation、复制队列与延迟、内存与缓存、parts 数量、ZooKeeper 会话。已在 ClickHouse 24.8 真实负载上验证。

模板里的两张仪表盘用的指标族不同：`ClickHouse_Categraf` 对应本插件，`ClickHouse_Exporter` 对应 ClickHouse 自带的 Prometheus 端点暴露的 `clickhouse_*` 指标，不能互换。规则覆盖查询堆积、复制延迟、parts 过多、内存逼近上限和 ZooKeeper 断连。

## 模板里有什么

- **2 张仪表盘**，共 26 个面板
- **10 条告警规则**，每条附处置步骤
- **81 条指标说明**
- **Categraf 采集配置**：`input.clickhouse`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.clickhouse/clickhouse.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.clickhouse started` 就说明插件已加载。

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

1. 在夜莺「集成中心」里找到 ClickHouse，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| ClickHouse_Categraf | 11 |
| ClickHouse_Exporter | 15 |

## 内置告警规则

共 10 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（4）

#### ClickHouse Categraf 副本进入只读

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
clickhouse_metrics_readonly_replica > 0
```

处置步骤:

1. 执行 SELECT database, table, is_readonly, zookeeper_exception FROM system.replicas WHERE is_readonly 定位只读的表和原因；
1. 检查 ZooKeeper/Keeper 集群是否健康（echo ruok | nc \<zk> 2181），以及 ClickHouse 到它的网络连通性；
1. ZK 恢复后执行 SYSTEM RESTART REPLICA \<db>.\<table> 让副本重新建立会话；
1. 若是 ZK 上元数据丢失，需要 SYSTEM RESTORE REPLICA 重建，操作前先确认另有健康副本。

#### ClickHouse Categraf 内存使用

内存使用报警

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
clickhouse_metrics_memory_tracking / clickhouse_asynchronous_metrics_os_memory_total * 100 > 90

clickhouse_metrics_memory_tracking/ clickhouse_asynchronous_metrics_os_memory_total * 100 > 80
```

处置步骤:

1. 执行 SELECT query, memory_usage, elapsed FROM system.processes ORDER BY memory_usage DESC LIMIT 5 找当前吃内存的查询，必要时 KILL QUERY WHERE query_id='...' 止血；
1. 查 system.query_log 里 memory_usage 最高的历史查询，定位缺少过滤条件或大 JOIN 的 SQL；
1. 用 max_memory_usage / max_bytes_before_external_group_by 给单查询设上限并允许落盘；
1. 确认 mark cache、uncompressed cache 配置是否过大。

#### ClickHouse Categraf 磁盘使用

磁盘使用报警

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
clickhouse_asynchronous_metrics_disk_available_default / (clickhouse_asynchronous_metrics_disk_available_default + clickhouse_asynchronous_metrics_disk_used_default) * 100 < 10

clickhouse_asynchronous_metrics_disk_available_default / (clickhouse_asynchronous_metrics_disk_available_default + clickhouse_asynchronous_metrics_disk_used_default) * 100 < 20
```

处置步骤:

1. 执行 SELECT name, free_space, total_space FROM system.disks 确认各磁盘水位；
1. 用 SELECT database, table, formatReadableSize(sum(bytes)) FROM system.parts WHERE active GROUP BY 1,2 ORDER BY sum(bytes) DESC 找出占用最大的表；
1. 对有 TTL 的表执行 ALTER TABLE ... MATERIALIZE TTL 触发清理，或直接 DROP PARTITION 删除过期分区；
1. 长期需扩容磁盘或配置多卷存储策略把冷数据下沉。

#### ClickHouse Categraf 并发网络连接数过高

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
clickhouse_metrics_network_send > 250 or clickhouse_metrics_network_receive > 250

clickhouse_metrics_network_send > 250 or clickhouse_metrics_network_receive > 250

increase(clickhouse_metrics_interserver_connection[5m]) > 0
```

处置步骤:

1. 执行 SELECT count(), user, client_hostname FROM system.processes GROUP BY 2,3 ORDER BY 1 DESC 看连接来自哪些客户端；
1. 对照 system.metrics 里的 Query、TCPConnection 判断是查询并发高还是连接泄漏；
1. 客户端未复用连接的，在应用侧改用连接池；
1. 确认 max_concurrent_queries 与 max_connections 配置是否与实例规格匹配，必要时限流。

### 原生指标（6）

#### ClickHouse 原生端点 认证错误

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
increase(ClickHouseErrorMetric_AUTHENTICATION_FAILED[5m]) > 0

increase(ClickHouseErrorMetric_RESOURCE_ACCESS_DENIED[5m]) > 0
```

处置步骤:

1. 查 SELECT event_time, user, client_hostname, exception FROM system.query_log WHERE type='ExceptionBeforeStart' AND exception LIKE '%AUTHENTICATION_FAILED%' ORDER BY event_time DESC LIMIT 20 定位来源 IP 与用户名；
1. 来源是自家应用则核对配置里的账号密码与 users.xml；
1. 来源陌生 IP 则按入侵尝试处理，收紧 users.xml 的 networks 白名单并改密码；
1. 确认 ClickHouse 端口没有直接暴露在公网。

#### ClickHouse 原生端点 副本进入只读

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
ClickHouseMetrics_ReadonlyReplica > 0
```

处置步骤:

1. 执行 SELECT database, table, is_readonly, zookeeper_exception FROM system.replicas WHERE is_readonly 定位只读的表和原因；
1. 检查 ZooKeeper/Keeper 集群是否健康（echo ruok | nc \<zk> 2181），以及 ClickHouse 到它的网络连通性；
1. ZK 恢复后执行 SYSTEM RESTART REPLICA \<db>.\<table> 让副本重新建立会话；
1. 若是 ZK 上元数据丢失，需要 SYSTEM RESTORE REPLICA 重建，操作前先确认另有健康副本。

#### ClickHouse 原生端点 内存使用

内存使用报警

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
ClickHouseMetrics_MemoryTracking / ClickHouseAsyncMetrics_OSMemoryTotal * 100 > 90

ClickHouseMetrics_MemoryTracking / ClickHouseAsyncMetrics_OSMemoryTotal * 100 > 80
```

处置步骤:

1. 执行 SELECT query, memory_usage, elapsed FROM system.processes ORDER BY memory_usage DESC LIMIT 5 找当前吃内存的查询，必要时 KILL QUERY WHERE query_id='...' 止血；
1. 查 system.query_log 里 memory_usage 最高的历史查询，定位缺少过滤条件或大 JOIN 的 SQL；
1. 用 max_memory_usage / max_bytes_before_external_group_by 给单查询设上限并允许落盘；
1. 确认 mark cache、uncompressed cache 配置是否过大。

#### ClickHouse 原生端点 副本错误

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
ClickHouseErrorMetric_ALL_REPLICAS_ARE_STALE == 1 or ClickHouseErrorMetric_ALL_REPLICAS_LOST == 1

 ClickHouseErrorMetric_NO_AVAILABLE_REPLICA == 1

 ClickHouseErrorMetric_TOO_FEW_LIVE_REPLICAS == 1
```

处置步骤:

1. 执行 SELECT database, table, is_readonly, absolute_delay, zookeeper_exception FROM system.replicas 定位失效的表；
1. absolute_delay 很大说明副本追不上，检查副本节点的 IO 与 merge 队列（system.replication_queue）；
1. ALL_REPLICAS_LOST 通常是 ZooKeeper 上的元数据丢失，需要在健康副本上确认数据后执行 SYSTEM RESTORE REPLICA；
1. 恢复期间把查询路由到健康分片，避免持续报错。

#### ClickHouse 原生端点 磁盘使用

磁盘使用报警

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
ClickHouseAsyncMetrics_DiskAvailable_default / (ClickHouseAsyncMetrics_DiskAvailable_default + ClickHouseAsyncMetrics_DiskUsed_default) * 100 < 10

ClickHouseAsyncMetrics_DiskAvailable_default / (ClickHouseAsyncMetrics_DiskAvailable_default + ClickHouseAsyncMetrics_DiskUsed_default) * 100 < 20

ClickHouseAsyncMetrics_DiskAvailable_backups / (ClickHouseAsyncMetrics_DiskAvailable_backups + ClickHouseAsyncMetrics_DiskUsed_backups) * 100 < 20
```

处置步骤:

1. 执行 SELECT name, free_space, total_space FROM system.disks 确认各磁盘水位；
1. 用 SELECT database, table, formatReadableSize(sum(bytes)) FROM system.parts WHERE active GROUP BY 1,2 ORDER BY sum(bytes) DESC 找出占用最大的表；
1. 对有 TTL 的表执行 ALTER TABLE ... MATERIALIZE TTL 触发清理，或直接 DROP PARTITION 删除过期分区；
1. 长期需扩容磁盘或配置多卷存储策略把冷数据下沉。

#### ClickHouse 原生端点 并发网络连接数过高

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
ClickHouseMetrics_NetworkSend > 250 or ClickHouseMetrics_NetworkReceive > 250

ClickHouseMetrics_NetworkSend > 250 or ClickHouseMetrics_NetworkReceive > 250

increase(ClickHouseMetrics_InterserverConnection[5m]) > 0
```

处置步骤:

1. 执行 SELECT count(), user, client_hostname FROM system.processes GROUP BY 2,3 ORDER BY 1 DESC 看连接来自哪些客户端；
1. 对照 system.metrics 里的 Query、TCPConnection 判断是查询并发高还是连接泄漏；
1. 客户端未复用连接的，在应用侧改用连接池；
1. 确认 max_concurrent_queries 与 max_connections 配置是否与实例规格匹配，必要时限流。

## 指标说明

共 81 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标 | 含义 | 单位 |
| --- | --- | --- |
| `clickhouse_metrics_http_connection` | ClickHouse HTTP 连接数 — 通过HTTP协议连接到ClickHouse服务器的客户端数量。 | 个 |
| `clickhouse_events_insert_query_time_microseconds_microseconds` | ClickHouse INSERT查询平均时间 — 插入查询执行的平均时间（微秒）。 | 个 |
| `clickhouse_events_select_query` | ClickHouse SELECT 查询数 — 执行的选择（SELECT）查询的数量 |  |
| `clickhouse_events_select_query_time_microseconds_microseconds` | ClickHouse SELECT查询平均时间 — 选择查询执行的平均时间（微秒）。 | 个 |
| `clickhouse_metrics_tcp_connection` | ClickHouse TCP 连接数 — 通过TCP协议连接到ClickHouse服务器的客户端数量。 | 个 |
| `clickhouse_metrics_parts_temporary` | ClickHouse 临时数据量 — 临时数据部分的数量，这些部分当前正在生成。 | 个 |
| `clickhouse_metrics_distributed_send` | ClickHouse 分布式表连接数 — 发送到分布式表的远程服务器的数据连接数。 | 个 |
| `clickhouse_metrics_parts_wide` | ClickHouse 宽数据量 — 宽数据部分的数量。 | 个 |
| `clickhouse_metrics_distributed_files_to_insert` | ClickHouse 待插入分布式表文件数 — 等待异步插入到分布式表的文件数量。 | 个 |
| `clickhouse_metrics_parts_pre_committed` | ClickHouse 提交前数据量 — 提交前的数据部分数量，这些部分在data_parts列表中，但不用于SELECT查询。 | 个 |
| `clickhouse_metrics_parts_committed` | ClickHouse 提交后数据量 — 提交后的数据部分数量，这些部分在data_parts列表中，并且用于SELECT查询。 | 个 |
| `clickhouse_events_inserted_bytes` | ClickHouse 插入未压缩 —  插入操作写入的未压缩字节数。 | 个 |
| `clickhouse_events_inserted_rows` | ClickHouse 插入行数 |  |
| `clickhouse_metrics_query_preempted` | ClickHouse 查询优先级 — 由于优先级设置，被停止并等待的查询数量。 | 个 |
| `clickhouse_events_query` | ClickHouse 查询总数 — ClickHouse执行的查询总数。 |  |
| `clickhouse_events_query_time_microseconds` | ClickHouse 查询总时间 — 查询执行的总时间（微秒）。 | ms |
| `clickhouse_metrics_parts_deleting` | ClickHouse 正被删除数据量 — 正在被删除的数据部分数量。 | 个 |
| `clickhouse_metrics_background_move_pool_task` | ClickHouse 移动池活动任务数 — 后台移动池中的活动任务数，用于处理数据移动。 | 个 |
| `clickhouse_metrics_parts_compact` | ClickHouse 紧凑数据量 — 紧凑数据部分的数量。 | 个 |
| `clickhouse_metrics_background_buffer_flush_schedule_pool_task` | ClickHouse 缓冲区活动任务数 — 后台缓冲区冲洗调度池中的活动任务数，用于定期缓冲区冲洗。 | 个 |
| `clickhouse_metrics_parts_delete_on_destroy` | ClickHouse 跨磁盘量 — 移动到另一个磁盘并应在析构函数中删除的数据部分数量。 | 个 |
| `clickhouse_metrics_parts_outdated` | ClickHouse 过时数据量 —  过时的数据部分数量，这些部分不是活动数据部分，但当前SELECT查询可能使用它们。 | 个 |
| `clickhouse_metrics_memory_tracking` | ClickHouse中内存使用情况 — ClickHouse服务器使用的总内存量。 | 个 |
| `clickhouse_asynchronous_metrics_number_of_databases` | ClickHouse中数据库数量 — ClickHouse数据库数量 |  |
| `clickhouse_asynchronous_metrics_number_of_tables` | ClickHouse中表的数量 — ClickHouse表数量 |  |
| `clickhouse_metrics_revision` | ClickHouse修订 — ClickHouse服务器的修订号，通常是一个用于标识特定构建的数字。 |  |
| `clickhouse_asynchronous_metrics_uptime` | ClickHouse服务器运行时间 — ClickHouse服务器自启动以来的运行时间。 | 个 |
| `clickhouse_metrics_version_integer` | ClickHouse版本号 — ClickHouse服务器的版本号，以整数形式表示。 |  |
| `ClickHouseMetrics_TCPConnection` | ClickHouse Tcp 连接数 — tcp连接数 |  |
| `ClickHouseMetrics_MemoryTracking` | ClickHouse 内存 — 分配的内存总量 | bit |
| `increase(ClickHouseProfileEvents_InsertQueryTimeMicroseconds[1m]) / (increase(ClickHouseProfileEvents_InsertQuery[1m]) + 0.001)` | INSERT查询平均延迟 — INSERT查询平均延迟 | μs |
| `max_over_time(irate(ClickHouseProfileEvents_InsertQuery[2m]) [1h:1m])` | INSERT查询数 — 与查询数相同，但仅限于INSERT查询 | 次查询 |
| `max_over_time(irate(ClickHouseProfileEvents_Seek[2m]) [1h:1m])` | lseek函数调用次数 — 'lseek'函数被调用的次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterCompressedBytes[2m]) [1h:1m])` | MergeTree表写入的压缩字节数 | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterBlocks[2m]) [1h:1m])` | MergeTree表插入的数据块数 — 插入到MergeTree表的数据块数。每个块形成一个数据部分 | 块 |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterUncompressedBytes[2m]) [1h:1m])` | MergeTree表插入的未压缩字节数 — 插入到MergeTree表的未压缩字节数（列以它们在内存中存储的形式） 在ClickHouse数据库中，当数据被插入到MergeTree系列表（包括ReplicatedMergeTree等）时，在数据实际被写入磁盘并经过压缩处理之前，在内存中以原始格式暂存时所占用的字节数量。这里的“未压缩”意味着数据还未经过ClickHouse为了节省存储空间而在存储阶段执行的列式存储压缩算法处理 | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_MergeTreeDataWriterRows[2m]) [1h:1m])` | MergeTree表插入的行数 — 插入到MergeTree表的行数 | 行 |
| `increase(ClickHouseProfileEvents_SelectQueryTimeMicroseconds[1m]) / (increase(ClickHouseProfileEvents_SelectQuery[1m]) + 0.001)` | SELECT查询平均延迟 — SELECT查询平均延迟 | μs |
| `max_over_time(irate(ClickHouseProfileEvents_SelectQuery[2m]) [1h:1m])` | SELECT查询数 — SELECT查询的数量 | 次查询 |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedBytes[2m]) [1h:1m])` | SELECT查询的字节数 — 从所有表SELECT的字节数（未压缩列以它们在内存中存储的形式） | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedRows[2m]) [1h:1m])` | SELECT查询的行数 — 从所有表SELECT的行数 | 行 |
| `ClickHouseMetrics_TCPConnection` | TCP连接数 — 与 TCP 服务器（带本地接口的客户端）的连接数，也包括服务器-服务器连接 | 个连接 |
| `ClickHouseMetrics_PartsTemporary` | 临时部分数 — 目前正在生成的部分，不在数据部分列表中 | parts |
| `max_over_time(irate(ClickHouseProfileEvents_ReadBufferFromFileDescriptorReadFailed[2m]) [1h:1m])` | 从文件描述符读取失败次数 — 从文件描述符读取（read/pread）失败的次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_ReadBufferFromFileDescriptorRead[2m]) [1h:1m])` | 从文件描述符读取次数 — 从文件描述符进行读取（read/pread）的次数，不包括套接字 | reads |
| `irate(ClickHouseProfileEvents_ReadBufferFromFileDescriptorReadBytes[2m])` | 从文件描述符读取的字节数 — 从文件描述符读取的字节数。如果文件是压缩的，这将显示压缩后的数据大小 | bytes |
| `ClickHouseMetrics_DiskSpaceReservedForMerge` | 保留空间 — 为当前运行的后台合并保留的磁盘空间。它略大于当前合并部分的总大小 | bytes |
| `ClickHouseMetrics_MemoryTracking` | 内存占用 — 分配的内存总量 | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_WriteBufferFromFileDescriptorWrite[2m]) [1h:1m])` | 写入文件描述符次数 — 写入文件描述符（write/pwrite）的次数，不包括套接字 | writes |
| `max_over_time(irate(ClickHouseProfileEvents_WriteBufferFromFileDescriptorWriteBytes[2m]) [1h:1m])` | 写入文件描述符的字节数 — 写入文件描述符的字节数。如果文件是压缩的，这将显示压缩后的数据大小 | bytes |
| `increase(ClickHouseProfileEvents_MergesTimeMilliseconds[1m]) / increase(ClickHouseProfileEvents_Merge[1m])` | 合并平均持续时间 — 合并的平均持续时间 | ms |
| `max_over_time(irate(ClickHouseProfileEvents_MergedUncompressedBytes[2m]) [1h:1m])` | 合并读取的未压缩字节数 — 后台合并读取的未压缩字节数（列以它们在内存中存储的形式）。这是合并前的字节数 | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_MergedRows[2m]) [1h:1m])` | 合并读取的行数 — 后台合并读取的行数。这是合并前的行数 | 行 |
| `max_over_time(irate(ClickHouseProfileEvents_Merge[2m]) [1h:1m])` | 后台合并次数 — 启动的后台合并次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_ReplicatedPartMerges[2m]) [1h:1m])` | 复制部分合并次数 — ReplicatedMergeTree表的数据部分成功合并的次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_ReplicatedDataLoss[2m]) [1h:1m])` | 复制部分数据丢失次数 — 数据在任何副本上都不存在的次数（即使是现在离线的副本）。这些数据部分肯定丢失了。由于异步复制（如果未启用配额插入），当写入数据部分的副本失败并且在故障后重新联机时不包含该数据部分，这是正常现象 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_FailedInsertQuery[2m]) [1h:1m])` | 失败的INSERT查询数 — 与失败的查询相同，但仅限于INSERT查询 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_FailedSelectQuery[2m]) [1h:1m])` | 失败的SELECT查询数 — 与失败的查询相同，但仅限于SELECT查询 | 次查询 |
| `max_over_time(irate(ClickHouseProfileEvents_FailedQuery[2m]) [1h:1m])` | 失败的查询数 — 失败的查询数量 | 次查询 |
| `max_over_time(irate(ClickHouseProfileEvents_DelayedInserts[2m]) [1h:1m])` | 延迟插入次数 — 由于分区的活动数据部分数量过多，INSERT到MergeTree表的块被限制的次数 | 次 |
| `increase(ClickHouseProfileEvents_DelayedInsertsMilliseconds[1m]) / (increase(ClickHouseProfileEvents_DelayedInserts[1m]) + 0.01)` | 延迟插入阻塞的平均等待时间 — 由于分区的活动数据部分数量过多，INSERT到MergeTree表的块被限制时的总等待时间（毫秒） | ms |
| `max_over_time(irate(ClickHouseProfileEvents_SlowRead[2m]) [1h:1m])` | 慢查询次数 — 从文件中进行慢查询读取的次数，这表明系统过载 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_FileOpen[2m]) [1h:1m])` | 打开的文件数 — 打开的文件数量 | 个文件 |
| `max_over_time(irate(ClickHouseProfileEvents_RejectedInserts[2m]) [1h:1m])` | 拒绝插入次数 — 由于分区的活动数据部分数量过多，INSERT到MergeTree表的块被拒绝的次数 | 次 |
| `ClickHouseMetrics_PartsCommitted` | 提交部分数 — 已经提交的数据部分的数量 | parts |
| `max_over_time(irate(ClickHouseProfileEvents_InsertedBytes[2m]) [1h:1m])` | 插入字节数 — 所有表INSERT的字节数（未压缩列以它们在内存中存储的形式） | bytes |
| `max_over_time(irate(ClickHouseProfileEvents_InsertedRows[2m]) [1h:1m])` | 插入行数 — 所有表INSERT的行数 | 行 |
| `max_over_time(irate(ClickHouseProfileEvents_UncompressedCacheHits[2m]) [1h:1m])` | 未压缩缓存命中次数 — 未压缩缓存命中的次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_UncompressedCacheMisses[2m]) [1h:1m])` | 未压缩缓存未命中次数 — 未压缩缓存未命中的次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_QueryMemoryLimitExceeded[2m]) [1h:1m])` | 查询内存限制超标次数 — 查询内存限制超标的次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_ReadBackoff[2m]) [1h:1m])` | 查询处理线程降低次数 — 由于慢查询读取，降低查询处理线程数的次数 | 次 |
| `increase(ClickHouseProfileEvents_QueryTimeMicroseconds[1m]) / (increase(ClickHouseProfileEvents_Query[1m]) + 0.001)` | 查询平均延迟 — 查询平均延迟 | μs |
| `max_over_time(irate(ClickHouseProfileEvents_Query[2m]) [1h:1m])` | 查询总数 — 需要解释和可能执行的查询数量，不包括失败的查询 | 次查询 |
| `max_over_time(irate(ClickHouseProfileEvents_MarkCacheHits[2m]) [1h:1m])` | 标记缓存命中次数 — 标记缓存命中的次数 | 次 |
| `rate(ClickHouseProfileEvents_MarkCacheMisses[2m])` | 标记缓存未命中次数 — 标记缓存未命中的次数 | 次 |
| `max_over_time(irate(ClickHouseProfileEvents_CompressedReadBufferBlocks[2m]) [1h:1m])` | 读取的压缩块数 — 从压缩源（文件，网络）读取的压缩块数（独立压缩的数据块） | 块 |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedParts[2m]) [1h:1m])` | 读取的数据部分数 — 从MergeTree表读取的数据部分数 | parts |
| `max_over_time(irate(ClickHouseProfileEvents_CompressedReadBufferBytes[2m]) [1h:1m])` | 读取的未压缩字节数 — 从压缩源（文件，网络）读取的未压缩字节数（解压后的字节数） | bytes |
| `irate(ClickHouseProfileEvents_SelectedMarks[2m])` | 读取的标记数 — 从MergeTree表读取的标记数（索引粒度） | marks |
| `max_over_time(irate(ClickHouseProfileEvents_SelectedRanges[2m]) [1h:1m])` | 读取的范围数 — 从MergeTree表读取的所有数据部分中（非相邻）的范围数 | ranges |
| `ClickHouseMetrics_PartsPreCommitted` | 预提交部分数 — 在数据部分中，但不用于SELECT查询的部分 | parts |

## 相关链接

- [ClickHouse 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/ClickHouse）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `clickhouse` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/clickhouse)：完整配置项和指标列表。
- [把 ClickHouse 接成数据源](/docs/data/clickhouse-doris-iotdb)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
