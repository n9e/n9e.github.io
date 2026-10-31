# 用夜莺监控 MySQL

连上实例跑 SHOW STATUS、SHOW VARIABLES 和复制状态，慢查询堆积、连接数打满、主从中断与延迟都有现成规则和处置步骤。

最后校对于 2026-10-31

MySQL 插件的原理很直接：连到实例，执行 `SHOW GLOBAL STATUS`、`SHOW GLOBAL VARIABLES`、`SHOW SLAVE STATUS` 等语句，把结果整理成指标。默认采集基础状态和复制状态，InnoDB 扩展指标、processlist、库表大小这些按需打开。还可以写自定义 SQL，把查询结果当指标上报。

模板里的告警规则覆盖运维上最常见的几类事故：慢查询堆积、连接数接近 max\_connections、线程大面积 running、主从 IO/SQL 线程中断、复制延迟、实例重启、打开文件数逼近上限，每条都附处置步骤。仪表盘分「本机采集」「按 address 筛选远端多实例」「按 instance 标签筛选」三种用法，另有一套按 mysqld\_exporter 指标名写的。

给监控账号 `PROCESS`、`REPLICATION CLIENT` 和 `SELECT` 权限即可，不要用 root。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **7 张仪表盘**，共 227 个面板
* **20 条告警规则**，每条附处置步骤
* **31 条指标说明**
* **Categraf 采集配置**：`input.mysql`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.mysql/mysql.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.mysql started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   # [[queries]]

   # measurement = "users"

   # metric_fields = [ "total" ]

   # label_fields = [ "service" ]

   # timeout = "3s"

   # request = '''

   # select 'n9e' as service, count(*) as total from n9e_v5.users

   # '''



   [[instances]]

   # address = "127.0.0.1:3306"

   # username = "root"

   # password = "1234"



   # # set tls=custom to enable tls

   # parameters = "tls=false"



   # extra_status_metrics = true

   # extra_innodb_metrics = false

   # gather_processlist_processes_by_state = false

   # gather_processlist_processes_by_user = false

   # gather_schema_size = true

   # gather_table_size = false

   # gather_system_table_size = false

   # gather_slave_status = true



   # # timeout

   # timeout_seconds = 3



   # # interval = global.interval * interval_times

   # interval_times = 1



   # important! use global unique string to specify instance

   # labels = { instance="n9e-10.2.3.4:3306" }



   ## Optional TLS Config

   # use_tls = false

   # tls_min_version = "1.2"

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = true



   #[[instances.queries]]

   # measurement = "lock_wait"

   # metric_fields = [ "total" ]

   # timeout = "3s"

   # request = '''

   #SELECT count(*) as total FROM information_schema.innodb_trx WHERE trx_state='LOCK WAIT'

   #'''



   # [[instances.queries]]

   # measurement = "users"

   # metric_fields = [ "total" ]

   # label_fields = [ "service" ]

   # # field_to_append = ""

   # timeout = "3s"

   # request = '''

   # select 'n9e' as service, count(*) as total from n9e_v5.users

   # '''
   ```

2. 在夜莺「集成中心」里找到 MySQL，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                                                                               | 面板数 |
| ------------------------------------------------------------------------------------ | ------ |
| MySQL 仪表盘（使用 address 筛选，用于中心端 Categraf 采集远端多个 mysql 实例的场景） | 39     |
| MySQL 仪表盘（使用 instance 筛选，需要采集时自行打上 instance 标签）                 | 39     |
| MySQL 仪表盘，适用于 Categraf 采集本机 MySQL 的场景                                  | 39     |
| MySQL Overview by categraf                                                           | 24     |
| MySQL Overview by categraf, group by ident                                           | 38     |
| MySQL Overview by categraf, group by instance                                        | 24     |
| MySQL Overview by exporter                                                           | 24     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 20 条，导入后默认停用，按自己环境的阈值逐条启用。每条规则的触发条件（PromQL）和处置步骤收录在告警规则库：[MySQL 告警规则](https://n9e.github.io/zh/alert-rules/mysql.md)。

| 规则                                                                        | 级别    | 持续   |
| --------------------------------------------------------------------------- | ------- | ------ |
| MySQL slow queries are piling up - categraf                                 | S2 警告 | 2 分钟 |
| More than 60% of the connections in Mysql are in a running state - categraf | S2 警告 | 2 分钟 |
| Mysql has just restarted. Please be advised - categraf                      | S3 提醒 | —      |
| Mysql has opened a large number of file handles. Please be aware - categraf | S2 警告 | 2 分钟 |
| Mysql instance has crashed - categraf                                       | S1 紧急 | —      |
| MysqlInnodbLogWaits - categraf                                              | S2 警告 | —      |
| MysqlSlaveIoThreadNotRunning - categraf                                     | S1 紧急 | —      |
| MysqlSlaveReplicationLag - categraf                                         | S1 紧急 | 1 分钟 |
| MysqlSlaveSqlThreadNotRunning - categraf                                    | S1 紧急 | —      |
| The number of connections in Mysql has exceeded 80% - categraf              | S2 警告 | 2 分钟 |
| More than 60% of the connections in MySQL are in a running state            | S2 警告 | 2 分钟 |
| More than 80% of MySQL files open                                           | S2 警告 | 2 分钟 |
| MySQL connection count has exceeded 80%                                     | S2 警告 | 2 分钟 |
| Mysql has just restarted. Please be advised - exporter                      | S3 提醒 | —      |
| MySQL slow queries are piling up                                            | S2 警告 | 2 分钟 |
| MysqlInnodbLogWaits - exporter                                              | S2 警告 | —      |
| MysqlSlaveIoThreadNotRunning - exporter                                     | S1 紧急 | —      |
| MysqlSlaveReplicationLag - exporter                                         | S1 紧急 | 1 分钟 |
| MysqlSlaveSqlThreadNotRunning - exporter                                    | S1 紧急 | —      |
| The MySQL instance is down                                                  | S1 紧急 | —      |

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 31 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                                                                                               | 含义                                                                                                                                                                                                                                                                                             | 单位    |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `mysql_global_status_buffer_pool_bytes_data`                                                                       | Global Status InnoDB 缓冲池 data 大小                                                                                                                                                                                                                                                            | bytes   |
| `mysql_global_status_buffer_pool_bytes_dirty`                                                                      | Global Status InnoDB 缓冲池 dirty 大小                                                                                                                                                                                                                                                           | bytes   |
| `mysql_global_status_buffer_pool_bytes_free`                                                                       | Global Status InnoDB 缓冲池 free 大小                                                                                                                                                                                                                                                            | bytes   |
| `mysql_global_status_buffer_pool_pages_utilization`                                                                | Global Status InnoDB 缓冲池 page 使用率                                                                                                                                                                                                                                                          | %       |
| `mysql_global_status_buffer_pool_bytes_used`                                                                       | Global Status InnoDB 缓冲池 used 大小                                                                                                                                                                                                                                                            | bytes   |
| `mysql_global_status_buffer_pool_bytes_total`                                                                      | Global Status InnoDB 缓冲池总大小                                                                                                                                                                                                                                                                | bytes   |
| `mysql_global_status_uptime`                                                                                       | Global Status 启动时长                                                                                                                                                                                                                                                                           | s       |
| `mysql_global_status_threads_running`                                                                              | Global Status 当前 running 的 threads 数量                                                                                                                                                                                                                                                       |         |
| `mysql_global_status_open_files`                                                                                   | Global Status 当前打开的文件句柄数                                                                                                                                                                                                                                                               |         |
| `mysql_global_status_threads_connected`                                                                            | Global Status 当前连接数                                                                                                                                                                                                                                                                         |         |
| `mysql_global_status_max_used_connections`                                                                         | Global Status 最大曾用连接数 — 曾经达到过的最大连接数                                                                                                                                                                                                                                            |         |
| `irate(mysql_global_status_commands_total[3m])`                                                                    | Global Status 每秒 Command 数量                                                                                                                                                                                                                                                                  |         |
| `irate(mysql_global_status_queries[3m])`                                                                           | Global Status 每秒 query 数量                                                                                                                                                                                                                                                                    |         |
| `irate(mysql_global_status_questions[3m])`                                                                         | Global Status 每秒 question 数量                                                                                                                                                                                                                                                                 |         |
| `irate(mysql_global_status_slow_queries[3m])`                                                                      | Global Status 每秒 slow query 数量                                                                                                                                                                                                                                                               |         |
| `sum(irate(mysql_global_status_commands_total{command=~"commit\|rollback"}[3m])) without (command)`                | Global Status 每秒事务操作数量                                                                                                                                                                                                                                                                   |         |
| `sum(irate(mysql_global_status_commands_total{command=~"insert\|update\|delete\|replace"}[3m])) without (command)` | Global Status 每秒写操作数量                                                                                                                                                                                                                                                                     |         |
| `irate(mysql_global_status_bytes_sent[3m])`                                                                        | Global Status 每秒发送流量                                                                                                                                                                                                                                                                       | bytes/s |
| `irate(mysql_global_status_bytes_received[3m])`                                                                    | Global Status 每秒接收流量                                                                                                                                                                                                                                                                       | bytes/s |
| `sum(irate(mysql_global_status_commands_total{command="select"}[3m])) without (command)`                           | Global Status 每秒读操作数量                                                                                                                                                                                                                                                                     |         |
| `increase(mysql_global_status_aborted_clients[3m])`                                                                | Global Status 近 3 分钟 abort 的客户端 — 原始指标 mysql\_global\_status\_aborted\_clients 表示由于客户端未正确关闭连接而终止的连接数，Counter 类型，单调递增。                                                                                                                                   |         |
| `increase(mysql_global_status_aborted_connects[3m])`                                                               | Global Status 近 3 分钟 abort 的连接数 — 原始指标 mysql\_global\_status\_aborted\_connects 表示尝试连接到 MySQL 服务器失败的次数，Counter 类型，单调递增。                                                                                                                                       |         |
| `increase(mysql_global_status_table_locks_waited[3m])`                                                             | Global Status 近 3 分钟 table lock 等待次数                                                                                                                                                                                                                                                      |         |
| `mysql_global_variables_innodb_buffer_pool_size`                                                                   | Global Variables InnoDB 缓冲池配置大小                                                                                                                                                                                                                                                           | bytes   |
| `mysql_global_variables_read_only`                                                                                 | Global Variables read\_only 开关值 — 0 就是 OFF，1 是 ON                                                                                                                                                                                                                                         |         |
| `mysql_global_variables_open_files_limit`                                                                          | Global Variables 允许打开的文件句柄数                                                                                                                                                                                                                                                            |         |
| `mysql_global_variables_max_connections`                                                                           | Global Variables 最大连接数限制 — 允许的最大连接数，默认值是 151，过小了。 通过 `SHOW VARIABLES LIKE 'max_connections'` 命令查看当前设置; 通过 `SET GLOBAL max_connections = 2048` 重新设置最大连接数; 通过修改 MySQL 配置文件，在 `[mysqld]` 下面添加 `max_connections = 2048` 使其重启依旧生效 |         |
| `mysql_global_variables_query_cache_size`                                                                          | Global Variables 查询缓存大小                                                                                                                                                                                                                                                                    | bytes   |
| `mysql_up`                                                                                                         | MySQL 实例是否 UP — 1 表示 UP，说明能正常连到 MySQL 采集数据；0 表示无法连通 MySQL 实例，可能是网络问题、认证问题，或者 MySQL 本身就是挂了                                                                                                                                                       |         |
| `mysql_scrape_use_seconds`                                                                                         | MySQL 指标抓取耗时                                                                                                                                                                                                                                                                               | s       |
| `mysql_version_info`                                                                                               | MySQL 版本信息                                                                                                                                                                                                                                                                                   |         |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[MySQL 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/MySQL）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/MySQL%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `mysql` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/mysql)：完整配置项和指标列表。
* [实践：监控 MySQL](https://n9e.github.io/zh/docs/practice/mysql.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
