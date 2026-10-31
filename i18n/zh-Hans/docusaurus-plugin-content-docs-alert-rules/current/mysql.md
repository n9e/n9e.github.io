---
title: "MySQL 告警规则：11 条 PromQL 规则与处置步骤"
sidebar_label: "MySQL"
sidebar_position: 4
description: "11 条开箱可用的 MySQL 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 mysqld_exporter, Categraf。可下载为 Prometheus 规则文件，或导入夜莺。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/MySQL
toc_max_heading_level: 2
mdx:
  format: md
---

MySQL 告警规则，覆盖实际最常把人叫起来的几类问题：实例宕机或刚重启、慢查询堆积、连接数逼近 max_connections、运行线程过多、InnoDB 日志等待、打开文件数逼近上限，以及复制异常（IO / SQL 线程停止、主从延迟）。exporter 一组使用 mysqld_exporter 的指标名（`mysql_global_status_*`、`mysql_slave_status_*`）；每条规则都附了告警后第一时间该执行的命令，比如 SHOW FULL PROCESSLIST、pt-query-digest。

## 概览

- **11 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
- **指标来源**：mysqld_exporter, Categraf
- **下载**：[`mysql.yml`](pathname:///alert-rules/mysql.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
- 阈值只是起点，启用前请按自己的环境调整。

## 规则一览

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| More than 60% of the connections in MySQL are in a running state | 警告 | 2 分钟 |
| More than 80% of MySQL files open | 警告 | 2 分钟 |
| MySQL connection count has exceeded 80% | 警告 | 2 分钟 |
| Mysql has just restarted. Please be advised - exporter | 提醒 | — |
| MySQL slow queries are piling up | 警告 | 2 分钟 |
| MysqlInnodbLogWaits - exporter | 警告 | — |
| MysqlSlaveIoThreadNotRunning - exporter | 紧急 | — |
| MysqlSlaveReplicationLag - exporter | 紧急 | 1 分钟 |
| MysqlSlaveSqlThreadNotRunning - exporter | 紧急 | — |
| The MySQL instance is down | 紧急 | — |
| Mysql has opened a large number of file handles. Please be aware - categraf | 警告 | 2 分钟 |

## Prometheus exporter（10）

本组 10 条中有 9 条规则对用 Categraf 采集的实例同样适用，指标名完全一致。

### More than 60% of the connections in MySQL are in a running state

警告 · 2 分钟 · 触发条件:

```promql
avg by (instance) (mysql_global_status_threads_running) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 60
```

处置步骤:

1. SHOW FULL PROCESSLIST 看堆积的线程集中在哪条 SQL、哪张表；
1. SHOW ENGINE INNODB STATUS 查是否存在锁等待或死锁；
1. 对元凶 SQL 执行 KILL 止血后补索引或限流；
1. 排查上游是否有突发流量或慢依赖导致连接迟迟不释放。

### More than 80% of MySQL files open

More than 80% of MySQL files open

警告 · 2 分钟 · 触发条件:

```promql
avg by (instance) (mysql_global_status_innodb_num_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

处置步骤:

1. 用 SHOW GLOBAL STATUS LIKE 'Open_files' 和 SHOW VARIABLES LIKE 'open_files_limit' 确认当前水位；
1. 调大 my.cnf 中的 open_files_limit，并同步放开系统 ulimit -n 与 systemd 的 LimitNOFILE；
1. 检查 table_open_cache 是否设置过大导致句柄膨胀；
1. 排查是否有大量分区表或小表被同时访问。

### MySQL connection count has exceeded 80%

More than 80% of MySQL connections are in use

警告 · 2 分钟 · 触发条件:

```promql
avg by (instance) (mysql_global_status_threads_connected) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 80
```

处置步骤:

1. SHOW FULL PROCESSLIST 按来源主机统计连接，找出连接数异常的应用；
1. 区分是业务突增还是应用连接池泄漏（大量长时间 Sleep 的连接堆积）；
1. 应急可调大 max_connections，同时核对内存余量避免 OOM；
1. 根因侧收敛应用连接池上限、缩短 wait_timeout。

### Mysql has just restarted. Please be advised - exporter

MySQL has just been restarted, less than one minute ago

提醒 · — · 触发条件:

```promql
mysql_global_status_uptime < 60
```

处置步骤:

1. 查看 error log（SHOW VARIABLES LIKE 'log_error' 指向的文件）确认是崩溃、被 OOM kill 还是人工重启；
1. 若是 OOM，核对 innodb_buffer_pool_size 与机器物理内存后调小；
1. 若非计划内重启，检查 systemd 或容器编排是否在反复拉起；
1. 重启后确认主从复制已自动恢复、应用连接池已重连。

### MySQL slow queries are piling up

MySQL slow queries are piling up over the last 5 minutes

警告 · 2 分钟 · 触发条件:

```promql
increase(mysql_global_status_slow_queries[5m]) > 10
```

处置步骤:

1. SHOW FULL PROCESSLIST 找当前长时间运行的 SQL，必要时 KILL \<id> 先止血；
1. 用 mysqldumpslow -s t -t 10 \<slow_log> 或 pt-query-digest 定位 TOP 慢 SQL；
1. 对定位到的 SQL 执行 EXPLAIN 看执行计划，补索引或改写；
1. 若是 long_query_time 设置过低导致的噪音，调整该参数而不是忽略告警。

### MysqlInnodbLogWaits - exporter

MySQL innodb log writes stalling

警告 · — · 触发条件:

```promql
rate(mysql_global_status_innodb_log_waits[15m]) > 10
```

处置步骤:

1. 调大 innodb_log_buffer_size（通常从默认 16M 翻倍到 64M~256M）；
1. 检查 innodb_log_file_size 是否过小导致频繁 checkpoint；
1. 用 iostat -x 1 看 redo log 所在磁盘的 util 是否已经打满；
1. 排查是否有大事务一次性写入过多数据，拆成小批次提交。

### MysqlSlaveIoThreadNotRunning - exporter

MySQL Slave IO thread not running

紧急 · — · 触发条件:

```promql
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_io_running == 0
```

处置步骤:

1. 在从库执行 SHOW SLAVE STATUS\G 看 Last_IO_Error；
1. 常见原因是主库连不上、复制账号失效、或所需 binlog 已被 purge——分别处理网络、用 CHANGE MASTER TO 重设账号、或用备份重建从库；
1. 处理完执行 START SLAVE IO_THREAD 并确认 Slave_IO_Running=Yes；
1. 恢复前先把读流量从该从库摘走。

### MysqlSlaveReplicationLag - exporter

紧急 · 1 分钟 · 触发条件:

```promql
mysql_slave_status_master_server_id > 0 and ON (instance) (mysql_slave_status_seconds_behind_master - mysql_slave_status_sql_delay) > 30
```

处置步骤:

1. SHOW SLAVE STATUS\G 看 Seconds_Behind_Master 与 SQL 线程当前正在执行的事件；
1. 到主库用 SHOW PROCESSLIST 找是否有大事务或批量 DML 正在灌数据；
1. 从库若是单线程回放，开启并行复制（slave_parallel_workers / slave_parallel_type=LOGICAL_CLOCK）；
1. 延迟持续扩大时先把读流量切回主库或其他从库。

### MysqlSlaveSqlThreadNotRunning - exporter

MySQL Slave SQL thread not running

紧急 · — · 触发条件:

```promql
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_sql_running == 0
```

处置步骤:

1. SHOW SLAVE STATUS\G 看 Last_SQL_Error 定位卡住的事件；
1. 若是可安全跳过的冲突（如重复主键），核对数据一致后执行 SET GLOBAL sql_slave_skip_counter=1 再 START SLAVE SQL_THREAD；
1. 若主从数据已经分叉，用备份重建从库，不要盲目跳过；
1. 恢复前先把读流量从该从库摘走。

### The MySQL instance is down

紧急 · — · 触发条件:

```promql
mysql_up == 0
```

处置步骤:

1. 登录主机用 systemctl status mysqld 或 docker ps 确认进程是否存活；
1. 进程存活则用 mysql -h\<host> -P\<port> -u\<user> -p 手工连一次，区分是实例夯住还是网络/账号问题；
1. 进程不在则先看 error log 尾部定位崩溃原因（OOM、磁盘满、数据文件损坏）再拉起，不要盲目重启；
1. 有主从的立即评估是否需要切主，并确认应用已摘除该节点。

## Categraf（1）

适用于用 Categraf 采集的主机和实例，指标名遵循 Categraf 插件。

### Mysql has opened a large number of file handles. Please be aware - categraf

More than 80% of MySQL files open

警告 · 2 分钟 · 触发条件:

```promql
avg by (instance) (mysql_global_status_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

处置步骤:

1. 用 SHOW GLOBAL STATUS LIKE 'Open_files' 和 SHOW VARIABLES LIKE 'open_files_limit' 确认当前水位；
1. 调大 my.cnf 中的 open_files_limit，并同步放开系统 ulimit -n 与 systemd 的 LimitNOFILE；
1. 检查 table_open_cache 是否设置过大导致句柄膨胀；
1. 排查是否有大量分区表或小表被同时访问。

## 怎么使用这些规则

- **用 Prometheus 或 vmalert**：下载 [`mysql.yml`](pathname:///alert-rules/mysql.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页。
- **用夜莺**：同样的规则内置在 [MySQL](/integrations/mysql) 集成模板里。在集成中心把规则[导入到业务组](/docs/data/integrations/import)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可

处置步骤和其余规则来自夜莺的集成模板（[MySQL](https://github.com/ccfos/nightingale/tree/main/integrations/MySQL)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接

- [用夜莺监控 MySQL](/integrations/mysql)：采集配置、仪表盘与指标说明
- [在夜莺里写指标告警规则](/docs/alerting/metric-rules)
- [全部告警规则](/alert-rules)
