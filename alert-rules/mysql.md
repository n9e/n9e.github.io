---
title: "MySQL alert rules for Prometheus: 11 rules with runbooks"
sidebar_label: "MySQL"
sidebar_position: 4
description: "11 ready-to-use MySQL alert rules in PromQL, each with severity, duration and runbook steps. Metrics from mysqld_exporter, Categraf. Download as a Prometheus rules file or import into Nightingale."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/MySQL
toc_max_heading_level: 2
mdx:
  format: md
---

MySQL alert rules for the failures that page people in practice: an instance that is down or has just restarted, slow queries piling up, connections approaching max_connections, too many running threads, InnoDB log waits, open files nearing the limit, and replication problems (IO or SQL thread stopped, replica lag). The exporter group uses mysqld_exporter metric names (`mysql_global_status_*`, `mysql_slave_status_*`); each rule comes with the first commands to run, such as SHOW FULL PROCESSLIST and pt-query-digest, when it fires.

## At a glance

- **11 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
- **Metrics from**: mysqld_exporter, Categraf
- **Download**: [`mysql.yml`](pathname:///alert-rules/mysql.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
- Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list

| Rule | Severity | For |
| --- | --- | --- |
| More than 60% of the connections in MySQL are in a running state | Warning | 2m |
| More than 80% of MySQL files open | Warning | 2m |
| MySQL connection count has exceeded 80% | Warning | 2m |
| Mysql has just restarted. Please be advised - exporter | Info | — |
| MySQL slow queries are piling up | Warning | 2m |
| MysqlInnodbLogWaits - exporter | Warning | — |
| MysqlSlaveIoThreadNotRunning - exporter | Critical | — |
| MysqlSlaveReplicationLag - exporter | Critical | 1m |
| MysqlSlaveSqlThreadNotRunning - exporter | Critical | — |
| The MySQL instance is down | Critical | — |
| Mysql has opened a large number of file handles. Please be aware - categraf | Warning | 2m |

## Prometheus exporter (10)

9 of the 10 rules in this group also apply unchanged to instances collected by Categraf, which produces the same metric names.

### More than 60% of the connections in MySQL are in a running state

Warning · 2m · Trigger:

```promql
avg by (instance) (mysql_global_status_threads_running) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 60
```

Runbook:

1. Run SHOW FULL PROCESSLIST to see which SQL statement and which table the piled-up threads are concentrated on;
1. Run SHOW ENGINE INNODB STATUS to check for lock waits or deadlocks;
1. KILL the offending SQL to stop the bleeding, then add indexes or apply rate limiting;
1. Check whether an upstream traffic spike or a slow dependency is keeping connections from being released.

### More than 80% of MySQL files open

More than 80% of MySQL files open

Warning · 2m · Trigger:

```promql
avg by (instance) (mysql_global_status_innodb_num_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

Runbook:

1. Run SHOW GLOBAL STATUS LIKE 'Open_files' and SHOW VARIABLES LIKE 'open_files_limit' to confirm the current level;
1. Raise open_files_limit in my.cnf and raise the system ulimit -n and the systemd LimitNOFILE to match;
1. Check whether table_open_cache is set too large and inflating the handle count;
1. Check whether a large number of partitioned or small tables are being accessed at once.

### MySQL connection count has exceeded 80%

More than 80% of MySQL connections are in use

Warning · 2m · Trigger:

```promql
avg by (instance) (mysql_global_status_threads_connected) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 80
```

Runbook:

1. Run SHOW FULL PROCESSLIST and group connections by source host to find the application with an abnormal connection count;
1. Tell a traffic spike apart from an application connection pool leak (many long-lived Sleep connections piling up);
1. As an emergency measure raise max_connections, checking free memory at the same time to avoid an OOM;
1. For the root cause, cap the application connection pool and shorten wait_timeout.

### Mysql has just restarted. Please be advised - exporter

MySQL has just been restarted, less than one minute ago

Info · — · Trigger:

```promql
mysql_global_status_uptime < 60
```

Runbook:

1. Check the error log (the file pointed to by SHOW VARIABLES LIKE 'log_error') to tell a crash, an OOM kill and a manual restart apart;
1. If it was an OOM, compare innodb_buffer_pool_size against the machine's physical memory and lower it;
1. If the restart was unplanned, check whether systemd or the container orchestrator is repeatedly restarting it;
1. After the restart, confirm replication resumed automatically and application connection pools reconnected.

### MySQL slow queries are piling up

MySQL slow queries are piling up over the last 5 minutes

Warning · 2m · Trigger:

```promql
increase(mysql_global_status_slow_queries[5m]) > 10
```

Runbook:

1. Run SHOW FULL PROCESSLIST to find long-running SQL and KILL \<id> to stop the bleeding if needed;
1. Use mysqldumpslow -s t -t 10 \<slow_log> or pt-query-digest to find the top slow queries;
1. Run EXPLAIN on the queries you found to inspect the plan, then add indexes or rewrite them;
1. If the noise comes from long_query_time being set too low, tune that parameter instead of ignoring the alert.

### MysqlInnodbLogWaits - exporter

MySQL innodb log writes stalling

Warning · — · Trigger:

```promql
rate(mysql_global_status_innodb_log_waits[15m]) > 10
```

Runbook:

1. Raise innodb_log_buffer_size (typically doubling the 16M default up to 64M~256M);
1. Check whether innodb_log_file_size is too small and causing frequent checkpoints;
1. Run iostat -x 1 to see whether the disk holding the redo log is already at full utilization;
1. Check for large transactions writing too much data at once and split them into smaller batches.

### MysqlSlaveIoThreadNotRunning - exporter

MySQL Slave IO thread not running

Critical · — · Trigger:

```promql
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_io_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last_IO_Error;
1. The usual causes are the primary being unreachable, an invalid replication account, or the required binlog having been purged — fix the network, reset the account with CHANGE MASTER TO, or rebuild the replica from a backup respectively;
1. Then run START SLAVE IO_THREAD and confirm Slave_IO_Running=Yes;
1. Take read traffic off this replica before you start.

### MysqlSlaveReplicationLag - exporter

Critical · 1m · Trigger:

```promql
mysql_slave_status_master_server_id > 0 and ON (instance) (mysql_slave_status_seconds_behind_master - mysql_slave_status_sql_delay) > 30
```

Runbook:

1. Run SHOW SLAVE STATUS\G and read Seconds_Behind_Master together with the event the SQL thread is currently applying;
1. On the primary, run SHOW PROCESSLIST to check for a large transaction or a bulk DML loading data;
1. If the replica applies single-threaded, enable parallel replication (slave_parallel_workers / slave_parallel_type=LOGICAL_CLOCK);
1. If the lag keeps growing, move read traffic back to the primary or to another replica.

### MysqlSlaveSqlThreadNotRunning - exporter

MySQL Slave SQL thread not running

Critical · — · Trigger:

```promql
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_sql_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last_SQL_Error to identify the event it is stuck on;
1. If it is a conflict that can be safely skipped (such as a duplicate primary key), verify the data is consistent, then run SET GLOBAL sql_slave_skip_counter=1 followed by START SLAVE SQL_THREAD;
1. If the primary and replica data have already diverged, rebuild the replica from a backup instead of blindly skipping;
1. Take read traffic off this replica before you start.

### The MySQL instance is down

Critical · — · Trigger:

```promql
mysql_up == 0
```

Runbook:

1. Log in to the host and run systemctl status mysqld or docker ps to confirm the process is alive;
1. If it is alive, connect by hand with mysql -h\<host> -P\<port> -u\<user> -p to tell a hung instance apart from a network or account problem;
1. If it is not running, read the tail of the error log to identify the cause (OOM, full disk, corrupted data files) before starting it — do not blindly restart;
1. If replication is in use, immediately assess whether to fail over, and confirm the application has taken this node out of rotation.

## Categraf (1)

For hosts and instances collected by Categraf; metric names follow Categraf plugins.

### Mysql has opened a large number of file handles. Please be aware - categraf

More than 80% of MySQL files open

Warning · 2m · Trigger:

```promql
avg by (instance) (mysql_global_status_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

Runbook:

1. Run SHOW GLOBAL STATUS LIKE 'Open_files' and SHOW VARIABLES LIKE 'open_files_limit' to confirm the current level;
1. Raise open_files_limit in my.cnf and raise the system ulimit -n and the systemd LimitNOFILE to match;
1. Check whether table_open_cache is set too large and inflating the handle count;
1. Check whether a large number of partitioned or small tables are being accessed at once.

## How to use these rules

- **With Prometheus or vmalert**: download [`mysql.yml`](pathname:///alert-rules/mysql.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
- **With Nightingale**: the same rules ship in the [MySQL](/integrations/mysql) integration template. Open the integration center, [import the rules into a business group](/docs/data/integrations/import), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license

The runbook steps and the remaining rules come from Nightingale's integration templates ([MySQL](https://github.com/ccfos/nightingale/tree/main/integrations/MySQL), Apache-2.0). Corrections are welcome as pull requests there.

## Related

- [Monitor MySQL with Nightingale](/integrations/mysql): collector config, dashboards and metric reference
- [Write a metric rule in Nightingale](/docs/alerting/metric-rules)
- [All alert rules](/alert-rules)
