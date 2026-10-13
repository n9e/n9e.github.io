---
title: "用夜莺监控 SQLServer"
sidebar_label: "SQLServer"
description: "基于 DMV 和性能计数器采集 SQL Server 的连接、等待、缓冲区、日志和数据库状态，只需 VIEW SERVER STATE 权限。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/SQLServer
toc_max_heading_level: 2
mdx:
  format: md
---

SQL Server 插件基于 Telegraf 的同名插件，通过动态管理视图（DMV）和性能计数器采集：连接与请求、等待统计、缓冲区命中率、页生命周期、事务日志使用、数据库状态与大小、Always On 可用性组状态。已在 SQL Server 2022 上完成真实采集验证。

在 master 库里建一个登录名并授予 `VIEW SERVER STATE`、`VIEW ANY DEFINITION`，2022 及以上再加 `VIEW SERVER PERFORMANCE STATE`。规则覆盖阻塞、死锁、日志空间、缓冲区命中率下降和数据库离线。

## 模板里有什么

- **1 张仪表盘**，共 10 个面板
- **11 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.sqlserver`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.sqlserver/sqlserver.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.sqlserver started` 就说明插件已加载。

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]

   ## Specify instances to monitor with a list of connection strings.
   ## All connection parameters are optional.
   ## By default, the host is localhost, listening on default port, TCP 1433.
   ##   for Windows, the user is the currently running AD user (SSO).
   ##   See https://github.com/denisenkom/go-mssqldb for detailed connection
   ##   parameters, in particular, tls connections can be created like so:
   ##   "encrypt=true;certificate=<cert>;hostNameInCertificate=<SqlServer host fqdn>"
   # servers = ["Server=server.xxx.com;Port=1433;User Id=monitor;Password=xxxxxx;app name=categraf;log=1;"]
   # servers = [ ]

   ## Authentication method
   ## valid methods: "connection_string", "AAD"
   # auth_method = "connection_string"

   ## "database_type" enables a specific set of queries depending on the database type. If specified, it replaces azuredb = true/false and query_version = 2
   ## In the config file, the sql server plugin section should be repeated each with a set of servers for a specific database_type.
   ## Possible values for database_type are - "SQLServer" or "AzureSQLDB" or "AzureSQLManagedInstance" or "AzureSQLPool"

   database_type = "SQLServer"

   ## A list of queries to include. If not specified, all the below listed queries are used.
   include_query = []

   ## A list of queries to explicitly ignore.
   exclude_query = ["SQLServerAvailabilityReplicaStates", "SQLServerDatabaseReplicaStates"]

   ## Queries enabled by default for database_type = "SQLServer" are -
   ## SQLServerPerformanceCounters, SQLServerWaitStatsCategorized, SQLServerDatabaseIO, SQLServerProperties, SQLServerMemoryClerks,
   ## SQLServerSchedulers, SQLServerRequests, SQLServerVolumeSpace, SQLServerCpu, SQLServerAvailabilityReplicaStates, SQLServerDatabaseReplicaStates,
   ## SQLServerRecentBackups

   ## Following are old config settings
   ## You may use them only if you are using the earlier flavor of queries, however it is recommended to use
   ## the new mechanism of identifying the database_type there by use it's corresponding queries

   ## Optional parameter, setting this to 2 will use a new version
   ## of the collection queries that break compatibility with the original
   ## dashboards.
   ## Version 2 - is compatible from SQL Server 2012 and later versions and also for SQL Azure DB
   # query_version = 2

   ## Toggling this to true will emit an additional metric called "sqlserver_telegraf_health".
   ## This metric tracks the count of attempted queries and successful queries for each SQL instance specified in "servers".
   ## The purpose of this metric is to assist with identifying and diagnosing any connectivity or query issues.
   ## This setting/metric is optional and is disabled by default.
   # health_metric = false

   ## Possible queries across different versions of the collectors
   ## Queries enabled by default for specific Database Type

   ## database_type =  SQLServer by default collects the following queries
   ## - SQLServerPerformanceCounters
   ## - SQLServerWaitStatsCategorized
   ## - SQLServerDatabaseIO
   ## - SQLServerProperties
   ## - SQLServerMemoryClerks
   ## - SQLServerSchedulers
   ## - SQLServerRequests
   ## - SQLServerVolumeSpace
   ## - SQLServerCpu
   ## - SQLServerRecentBackups
   ## and following as optional (if mentioned in the include_query list)
   ## - SQLServerAvailabilityReplicaStates
   ## - SQLServerDatabaseReplicaStates

   ## Version 2 by default collects the following queries
   ## Version 2 is being deprecated, please consider using database_type.
   ## - PerformanceCounters
   ## - WaitStatsCategorized
   ## - DatabaseIO
   ## - ServerProperties
   ## - MemoryClerk
   ## - Schedulers
   ## - SqlRequests
   ## - VolumeSpace
   ## - Cpu

   ## Version 1 by default collects the following queries
   ## Version 1 is deprecated, please consider using database_type.
   ## - PerformanceCounters
   ## - WaitStatsCategorized
   ## - CPUHistory
   ## - DatabaseIO
   ## - DatabaseSize
   ## - DatabaseStats
   ## - DatabaseProperties
   ## - MemoryClerk
   ## - VolumeSpace
   ## - PerformanceMetrics
   ```

1. 在夜莺「集成中心」里找到 SQLServer，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| SQLServer | 10 |

## 内置告警规则

共 11 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### SQL Server 实例不可达

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
sqlserver_up == 0
```

处置步骤:

1. 在数据库主机执行 systemctl status mssql-server（Linux）或 Get-Service MSSQLSERVER（Windows）确认服务状态；
1. 服务在跑则用 sqlcmd -S \<host>,1433 -U \<user> 手工连一次，区分是网络不通、端口没监听还是账号被锁；
1. 服务没起来则查看 /var/opt/mssql/log/errorlog（Linux）或 SQL Server 错误日志，常见原因是磁盘满、tempdb 无法创建、证书过期；
1. 恢复后执行 SELECT name, state_desc FROM sys.databases 确认所有库都回到 ONLINE。

### SQL Server 存在 SUSPECT 状态的数据库

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
sqlserver_server_properties_db_suspect > 0
```

处置步骤:

1. 执行 SELECT name, state_desc FROM sys.databases WHERE state_desc \<> 'ONLINE' 确认是哪个库；
1. 查看 SQL Server 错误日志里该库最近的报错，确认是 IO 错误还是日志损坏；
1. 优先用最近一次可用备份做还原（RESTORE DATABASE），这是数据损失最小的路径；
1. 无可用备份时才考虑 EMERGENCY 模式 + DBCC CHECKDB(..., REPAIR_ALLOW_DATA_LOSS)，该操作会丢数据，务必先做文件级快照。

### SQL Server 存在 OFFLINE 状态的数据库

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
sqlserver_server_properties_db_offline > 0
```

处置步骤:

1. 执行 SELECT name, state_desc FROM sys.databases WHERE state_desc = 'OFFLINE' 列出离线的库；
1. 确认是否是计划内的维护或迁移操作，核对变更单；
1. 非计划的执行 ALTER DATABASE [库名] SET ONLINE 尝试上线，失败则看错误日志里的具体原因；
1. 上线后执行 DBCC CHECKDB([库名]) WITH NO_INFOMSGS 确认数据一致性。

### SQL Server 数据卷剩余空间不足

S1 紧急 · 持续 5 分钟 · 触发条件:

```promql
sqlserver_volume_space_available_space_bytes / (sqlserver_volume_space_total_space_bytes > 0) * 100 < 10
```

处置步骤:

1. 从告警标签取 volume_mount_point，执行 SELECT DB_NAME(database_id), name, size*8/1024 AS size_mb FROM sys.master_files ORDER BY size DESC 找出占用最大的文件；
1. 日志文件异常大的先执行 BACKUP LOG 截断再 DBCC SHRINKFILE，注意完整恢复模式下不备份日志是缩不掉的；
1. 数据文件确实需要这么大的，清理历史分区或归档冷数据；
1. 应急可先把 tempdb 或备份文件迁到其他卷腾出空间，长期需要扩容磁盘。

### SQL Server 事务日志使用率过高

S1 紧急 · 持续 5 分钟 · 触发条件:

```promql
sqlserver_performance_value{counter="Percent Log Used", instance!="_Total", instance!="Total"} > 85
```

处置步骤:

1. 从告警标签取 instance（数据库名），执行 SELECT name, log_reuse_wait_desc FROM sys.databases WHERE name = '\<库名>' 看日志为什么不能重用；
1. log_reuse_wait_desc 为 LOG_BACKUP 的立刻执行 BACKUP LOG [库名] TO DISK='...'，这是最常见的原因；
1. 为 ACTIVE_TRANSACTION 的执行 DBCC OPENTRAN 找出长事务并评估是否 KILL；
1. 为 REPLICATION 或 AVAILABILITY_REPLICA 的去查复制/AlwaysOn 的同步是否卡住，先修复同步链路。

### SQL Server 页面生命周期过短

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
sqlserver_performance_value{counter="Page life expectancy", object="SQLServer:Buffer Manager"} < 300
```

处置步骤:

1. 执行 SELECT * FROM sys.dm_os_performance_counters WHERE counter_name LIKE '%Page life%' 确认实时值；
1. 执行 SELECT TOP 20 * FROM sys.dm_exec_query_stats ORDER BY total_logical_reads DESC，找出逻辑读最大的语句，通常是缺索引导致的全表扫描；
1. 用 sys.dm_db_missing_index_details 拿到建议索引并评估后创建，这比加内存见效快；
1. 确认查询已优化仍不足的，检查 max server memory 配置是否过小或被其他进程挤占，再考虑扩内存。

### SQL Server 存在等待内存授予的查询

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
sqlserver_performance_value{counter="Memory Grants Pending"} > 0
```

处置步骤:

1. 执行 SELECT session_id, requested_memory_kb, granted_memory_kb, wait_time_ms FROM sys.dm_exec_query_memory_grants 查看谁在等、谁占着；
1. 对占用巨大的会话用 sys.dm_exec_sql_text 取出语句，通常是大排序或大哈希连接，缺索引会显著放大内存需求；
1. 应急可 KILL 掉占用最大的会话释放内存；
1. 长期按 dm_db_missing_index_details 建索引、拆分大查询，或调大 max server memory。

### SQL Server 阻塞进程数过高

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
sqlserver_performance_value{counter="Processes blocked"} > 5
```

处置步骤:

1. 执行 SELECT blocking_session_id, session_id, wait_type, wait_time, wait_resource FROM sys.dm_exec_requests WHERE blocking_session_id \<> 0 找出阻塞链的源头；
1. 对源头 session 用 DBCC INPUTBUFFER(\<spid>) 或 sys.dm_exec_sql_text 看它在执行什么；
1. 确认是失控的长事务后执行 KILL \<spid> 先止血；
1. 事后检查该事务是否缺少索引导致锁范围过大，或应用侧忘记提交事务，必要时评估启用 READ_COMMITTED_SNAPSHOT 降低读写互斥。

### SQL Server 发生死锁

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
increase(sqlserver_performance_value{counter="Number of Deadlocks/sec"}[10m]) > 0
```

处置步骤:

1. 执行 system_health 扩展事件查询死锁图：SELECT XEvent.query('.') FROM (SELECT CAST(target_data AS XML) AS TargetData FROM sys.dm_xe_session_targets ...) 取出 xml_deadlock_report；
1. 从死锁图里看两个事务的加锁顺序与涉及的索引；
1. 最常见的修法是统一业务代码里多表更新的顺序，以及给参与的查询补索引缩小锁范围；
1. 短期可在应用侧对死锁错误号 1205 做自动重试，但不能替代根因修复。

### SQL Server 数据文件读延迟过高

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(sqlserver_database_io_read_latency_ms[5m]) / (rate(sqlserver_database_io_reads[5m]) > 0) > 50
```

处置步骤:

1. 从告警标签取 database_name 与 logical_filename，定位是哪个库的哪个文件慢；
1. 在主机侧执行 iostat -x 1（Linux）或用性能监视器看 Avg. Disk sec/Read，确认是存储本身慢还是 SQL Server 读放大；
1. 存储正常则按 Page Life Expectancy 的思路优化查询、补索引，减少物理读；
1. 存储确实慢的，考虑把该文件迁到 SSD、拆分文件组分散 IO，或排查是否与备份任务错峰不当。

### SQL Server 数据文件写延迟过高

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(sqlserver_database_io_write_latency_ms[5m]) / (rate(sqlserver_database_io_writes[5m]) > 0) > 50
```

处置步骤:

1. 从告警标签取 database_name 与 file_type，file_type=LOG 的优先处理，日志写慢会直接卡住所有提交；
1. 主机侧用 iostat -x 1 看该磁盘的 await 与 %util，确认是否已打满；
1. 日志文件与数据文件放在同一块盘的，把日志迁到独立的低延迟磁盘；
1. 检查是否有备份、DBCC CHECKDB、索引重建等重 IO 任务与业务高峰重叠，调整到低峰执行。

## 相关链接

- [SQLServer 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/SQLServer）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `sqlserver` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/sqlserver)：完整配置项和指标列表。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
