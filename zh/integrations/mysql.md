# 用夜莺监控 MySQL

连上实例跑 SHOW STATUS、SHOW VARIABLES 和复制状态，慢查询堆积、连接数打满、主从中断与延迟都有现成规则和处置步骤。

最后校对于 2026-10-28

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

共 20 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（10）[​](#categraf-采集10 "Categraf 采集（10）的直接链接")

#### MySQL slow queries are piling up - categraf[​](#mysql-slow-queries-are-piling-up---categraf "MySQL slow queries are piling up - categraf的直接链接")

MySQL slow queries are piling up over the last 5 minutes

S2 警告 · 持续 2 分钟 · 触发条件:

```
increase(mysql_global_status_slow_queries[5m]) > 10
```

处置步骤:

1. SHOW FULL PROCESSLIST 找当前长时间运行的 SQL，必要时 KILL \<id> 先止血；
2. 用 mysqldumpslow -s t -t 10 \<slow\_log> 或 pt-query-digest 定位 TOP 慢 SQL；
3. 对定位到的 SQL 执行 EXPLAIN 看执行计划，补索引或改写；
4. 若是 long\_query\_time 设置过低导致的噪音，调整该参数而不是忽略告警。

#### More than 60% of the connections in Mysql are in a running state - categraf[​](#more-than-60-of-the-connections-in-mysql-are-in-a-running-state---categraf "More than 60% of the connections in Mysql are in a running state - categraf的直接链接")

S2 警告 · 持续 2 分钟 · 触发条件:

```
avg by (instance) (mysql_global_status_threads_running) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 60
```

处置步骤:

1. SHOW FULL PROCESSLIST 看堆积的线程集中在哪条 SQL、哪张表；
2. SHOW ENGINE INNODB STATUS 查是否存在锁等待或死锁；
3. 对元凶 SQL 执行 KILL 止血后补索引或限流；
4. 排查上游是否有突发流量或慢依赖导致连接迟迟不释放。

#### Mysql has just restarted. Please be advised - categraf[​](#mysql-has-just-restarted-please-be-advised---categraf "Mysql has just restarted. Please be advised - categraf的直接链接")

MySQL has just been restarted, less than one minute ago

S3 提醒 · 触发条件:

```
mysql_global_status_uptime < 60
```

处置步骤:

1. 查看 error log（SHOW VARIABLES LIKE 'log\_error' 指向的文件）确认是崩溃、被 OOM kill 还是人工重启；
2. 若是 OOM，核对 innodb\_buffer\_pool\_size 与机器物理内存后调小；
3. 若非计划内重启，检查 systemd 或容器编排是否在反复拉起；
4. 重启后确认主从复制已自动恢复、应用连接池已重连。

#### Mysql has opened a large number of file handles. Please be aware - categraf[​](#mysql-has-opened-a-large-number-of-file-handles-please-be-aware---categraf "Mysql has opened a large number of file handles. Please be aware - categraf的直接链接")

More than 80% of MySQL files open

S2 警告 · 持续 2 分钟 · 触发条件:

```
avg by (instance) (mysql_global_status_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

处置步骤:

1. 用 SHOW GLOBAL STATUS LIKE 'Open\_files' 和 SHOW VARIABLES LIKE 'open\_files\_limit' 确认当前水位；
2. 调大 my.cnf 中的 open\_files\_limit，并同步放开系统 ulimit -n 与 systemd 的 LimitNOFILE；
3. 检查 table\_open\_cache 是否设置过大导致句柄膨胀；
4. 排查是否有大量分区表或小表被同时访问。

#### Mysql instance has crashed - categraf[​](#mysql-instance-has-crashed---categraf "Mysql instance has crashed - categraf的直接链接")

S1 紧急 · 触发条件:

```
mysql_up == 0
```

处置步骤:

1. 登录主机用 systemctl status mysqld 或 docker ps 确认进程是否存活；
2. 进程存活则用 mysql -h\<host> -P\<port> -u\<user> -p 手工连一次，区分是实例夯住还是网络/账号问题；
3. 进程不在则先看 error log 尾部定位崩溃原因（OOM、磁盘满、数据文件损坏）再拉起，不要盲目重启；
4. 有主从的立即评估是否需要切主，并确认应用已摘除该节点。

#### MysqlInnodbLogWaits - categraf[​](#mysqlinnodblogwaits---categraf "MysqlInnodbLogWaits - categraf的直接链接")

MySQL innodb log writes stalling

S2 警告 · 触发条件:

```
rate(mysql_global_status_innodb_log_waits[15m]) > 10
```

处置步骤:

1. 调大 innodb\_log\_buffer\_size（通常从默认 16M 翻倍到 64M\~256M）；
2. 检查 innodb\_log\_file\_size 是否过小导致频繁 checkpoint；
3. 用 iostat -x 1 看 redo log 所在磁盘的 util 是否已经打满；
4. 排查是否有大事务一次性写入过多数据，拆成小批次提交。

#### MysqlSlaveIoThreadNotRunning - categraf[​](#mysqlslaveiothreadnotrunning---categraf "MysqlSlaveIoThreadNotRunning - categraf的直接链接")

MySQL Slave IO thread not running

S1 紧急 · 触发条件:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_io_running == 0
```

处置步骤:

1. 在从库执行 SHOW SLAVE STATUS\G 看 Last\_IO\_Error；
2. 常见原因是主库连不上、复制账号失效、或所需 binlog 已被 purge——分别处理网络、用 CHANGE MASTER TO 重设账号、或用备份重建从库；
3. 处理完执行 START SLAVE IO\_THREAD 并确认 Slave\_IO\_Running=Yes；
4. 恢复前先把读流量从该从库摘走。

#### MysqlSlaveReplicationLag - categraf[​](#mysqlslavereplicationlag---categraf "MysqlSlaveReplicationLag - categraf的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
mysql_slave_status_master_server_id > 0 and ON (instance) (mysql_slave_status_seconds_behind_master - mysql_slave_status_sql_delay) > 30
```

处置步骤:

1. SHOW SLAVE STATUS\G 看 Seconds\_Behind\_Master 与 SQL 线程当前正在执行的事件；
2. 到主库用 SHOW PROCESSLIST 找是否有大事务或批量 DML 正在灌数据；
3. 从库若是单线程回放，开启并行复制（slave\_parallel\_workers / slave\_parallel\_type=LOGICAL\_CLOCK）；
4. 延迟持续扩大时先把读流量切回主库或其他从库。

#### MysqlSlaveSqlThreadNotRunning - categraf[​](#mysqlslavesqlthreadnotrunning---categraf "MysqlSlaveSqlThreadNotRunning - categraf的直接链接")

MySQL Slave SQL thread not running

S1 紧急 · 触发条件:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_sql_running == 0
```

处置步骤:

1. SHOW SLAVE STATUS\G 看 Last\_SQL\_Error 定位卡住的事件；
2. 若是可安全跳过的冲突（如重复主键），核对数据一致后执行 SET GLOBAL sql\_slave\_skip\_counter=1 再 START SLAVE SQL\_THREAD；
3. 若主从数据已经分叉，用备份重建从库，不要盲目跳过；
4. 恢复前先把读流量从该从库摘走。

#### The number of connections in Mysql has exceeded 80% - categraf[​](#the-number-of-connections-in-mysql-has-exceeded-80---categraf "The number of connections in Mysql has exceeded 80% - categraf的直接链接")

More than 80% of MySQL connections are in use

S2 警告 · 持续 2 分钟 · 触发条件:

```
avg by (instance) (mysql_global_status_threads_connected) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 80
```

处置步骤:

1. SHOW FULL PROCESSLIST 按来源主机统计连接，找出连接数异常的应用；
2. 区分是业务突增还是应用连接池泄漏（大量长时间 Sleep 的连接堆积）；
3. 应急可调大 max\_connections，同时核对内存余量避免 OOM；
4. 根因侧收敛应用连接池上限、缩短 wait\_timeout。

### Exporter 采集（10）[​](#exporter-采集10 "Exporter 采集（10）的直接链接")

#### More than 60% of the connections in MySQL are in a running state[​](#more-than-60-of-the-connections-in-mysql-are-in-a-running-state "More than 60% of the connections in MySQL are in a running state的直接链接")

S2 警告 · 持续 2 分钟 · 触发条件:

```
avg by (instance) (mysql_global_status_threads_running) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 60
```

处置步骤:

1. SHOW FULL PROCESSLIST 看堆积的线程集中在哪条 SQL、哪张表；
2. SHOW ENGINE INNODB STATUS 查是否存在锁等待或死锁；
3. 对元凶 SQL 执行 KILL 止血后补索引或限流；
4. 排查上游是否有突发流量或慢依赖导致连接迟迟不释放。

#### More than 80% of MySQL files open[​](#more-than-80-of-mysql-files-open "More than 80% of MySQL files open的直接链接")

More than 80% of MySQL files open

S2 警告 · 持续 2 分钟 · 触发条件:

```
avg by (instance) (mysql_global_status_innodb_num_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

处置步骤:

1. 用 SHOW GLOBAL STATUS LIKE 'Open\_files' 和 SHOW VARIABLES LIKE 'open\_files\_limit' 确认当前水位；
2. 调大 my.cnf 中的 open\_files\_limit，并同步放开系统 ulimit -n 与 systemd 的 LimitNOFILE；
3. 检查 table\_open\_cache 是否设置过大导致句柄膨胀；
4. 排查是否有大量分区表或小表被同时访问。

#### MySQL connection count has exceeded 80%[​](#mysql-connection-count-has-exceeded-80 "MySQL connection count has exceeded 80%的直接链接")

More than 80% of MySQL connections are in use

S2 警告 · 持续 2 分钟 · 触发条件:

```
avg by (instance) (mysql_global_status_threads_connected) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 80
```

处置步骤:

1. SHOW FULL PROCESSLIST 按来源主机统计连接，找出连接数异常的应用；
2. 区分是业务突增还是应用连接池泄漏（大量长时间 Sleep 的连接堆积）；
3. 应急可调大 max\_connections，同时核对内存余量避免 OOM；
4. 根因侧收敛应用连接池上限、缩短 wait\_timeout。

#### Mysql has just restarted. Please be advised - exporter[​](#mysql-has-just-restarted-please-be-advised---exporter "Mysql has just restarted. Please be advised - exporter的直接链接")

MySQL has just been restarted, less than one minute ago

S3 提醒 · 触发条件:

```
mysql_global_status_uptime < 60
```

处置步骤:

1. 查看 error log（SHOW VARIABLES LIKE 'log\_error' 指向的文件）确认是崩溃、被 OOM kill 还是人工重启；
2. 若是 OOM，核对 innodb\_buffer\_pool\_size 与机器物理内存后调小；
3. 若非计划内重启，检查 systemd 或容器编排是否在反复拉起；
4. 重启后确认主从复制已自动恢复、应用连接池已重连。

#### MySQL slow queries are piling up[​](#mysql-slow-queries-are-piling-up "MySQL slow queries are piling up的直接链接")

MySQL slow queries are piling up over the last 5 minutes

S2 警告 · 持续 2 分钟 · 触发条件:

```
increase(mysql_global_status_slow_queries[5m]) > 10
```

处置步骤:

1. SHOW FULL PROCESSLIST 找当前长时间运行的 SQL，必要时 KILL \<id> 先止血；
2. 用 mysqldumpslow -s t -t 10 \<slow\_log> 或 pt-query-digest 定位 TOP 慢 SQL；
3. 对定位到的 SQL 执行 EXPLAIN 看执行计划，补索引或改写；
4. 若是 long\_query\_time 设置过低导致的噪音，调整该参数而不是忽略告警。

#### MysqlInnodbLogWaits - exporter[​](#mysqlinnodblogwaits---exporter "MysqlInnodbLogWaits - exporter的直接链接")

MySQL innodb log writes stalling

S2 警告 · 触发条件:

```
rate(mysql_global_status_innodb_log_waits[15m]) > 10
```

处置步骤:

1. 调大 innodb\_log\_buffer\_size（通常从默认 16M 翻倍到 64M\~256M）；
2. 检查 innodb\_log\_file\_size 是否过小导致频繁 checkpoint；
3. 用 iostat -x 1 看 redo log 所在磁盘的 util 是否已经打满；
4. 排查是否有大事务一次性写入过多数据，拆成小批次提交。

#### MysqlSlaveIoThreadNotRunning - exporter[​](#mysqlslaveiothreadnotrunning---exporter "MysqlSlaveIoThreadNotRunning - exporter的直接链接")

MySQL Slave IO thread not running

S1 紧急 · 触发条件:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_io_running == 0
```

处置步骤:

1. 在从库执行 SHOW SLAVE STATUS\G 看 Last\_IO\_Error；
2. 常见原因是主库连不上、复制账号失效、或所需 binlog 已被 purge——分别处理网络、用 CHANGE MASTER TO 重设账号、或用备份重建从库；
3. 处理完执行 START SLAVE IO\_THREAD 并确认 Slave\_IO\_Running=Yes；
4. 恢复前先把读流量从该从库摘走。

#### MysqlSlaveReplicationLag - exporter[​](#mysqlslavereplicationlag---exporter "MysqlSlaveReplicationLag - exporter的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
mysql_slave_status_master_server_id > 0 and ON (instance) (mysql_slave_status_seconds_behind_master - mysql_slave_status_sql_delay) > 30
```

处置步骤:

1. SHOW SLAVE STATUS\G 看 Seconds\_Behind\_Master 与 SQL 线程当前正在执行的事件；
2. 到主库用 SHOW PROCESSLIST 找是否有大事务或批量 DML 正在灌数据；
3. 从库若是单线程回放，开启并行复制（slave\_parallel\_workers / slave\_parallel\_type=LOGICAL\_CLOCK）；
4. 延迟持续扩大时先把读流量切回主库或其他从库。

#### MysqlSlaveSqlThreadNotRunning - exporter[​](#mysqlslavesqlthreadnotrunning---exporter "MysqlSlaveSqlThreadNotRunning - exporter的直接链接")

MySQL Slave SQL thread not running

S1 紧急 · 触发条件:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_sql_running == 0
```

处置步骤:

1. SHOW SLAVE STATUS\G 看 Last\_SQL\_Error 定位卡住的事件；
2. 若是可安全跳过的冲突（如重复主键），核对数据一致后执行 SET GLOBAL sql\_slave\_skip\_counter=1 再 START SLAVE SQL\_THREAD；
3. 若主从数据已经分叉，用备份重建从库，不要盲目跳过；
4. 恢复前先把读流量从该从库摘走。

#### The MySQL instance is down[​](#the-mysql-instance-is-down "The MySQL instance is down的直接链接")

S1 紧急 · 触发条件:

```
mysql_up == 0
```

处置步骤:

1. 登录主机用 systemctl status mysqld 或 docker ps 确认进程是否存活；
2. 进程存活则用 mysql -h\<host> -P\<port> -u\<user> -p 手工连一次，区分是实例夯住还是网络/账号问题；
3. 进程不在则先看 error log 尾部定位崩溃原因（OOM、磁盘满、数据文件损坏）再拉起，不要盲目重启；
4. 有主从的立即评估是否需要切主，并确认应用已摘除该节点。

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
