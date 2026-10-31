# MySQL alert rules for Prometheus: 11 rules with runbooks

11 ready-to-use MySQL alert rules in PromQL, each with severity, duration and runbook steps. Metrics from mysqld\_exporter, Categraf. Download as a Prometheus rules file or import into Nightingale.

Last reviewed 2026-10-31

MySQL alert rules for the failures that page people in practice: an instance that is down or has just restarted, slow queries piling up, connections approaching max\_connections, too many running threads, InnoDB log waits, open files nearing the limit, and replication problems (IO or SQL thread stopped, replica lag). The exporter group uses mysqld\_exporter metric names (`mysql_global_status_*`, `mysql_slave_status_*`); each rule comes with the first commands to run, such as SHOW FULL PROCESSLIST and pt-query-digest, when it fires.

## At a glance[​](#at-a-glance "Direct link to At a glance")

* **11 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
* **Metrics from**: mysqld\_exporter, Categraf
* **Download**: [`mysql.yml`](https://n9e.github.io/alert-rules/mysql.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
* Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list[​](#rule-list "Direct link to Rule list")

| Rule                                                                        | Severity | For |
| --------------------------------------------------------------------------- | -------- | --- |
| More than 60% of the connections in MySQL are in a running state            | Warning  | 2m  |
| More than 80% of MySQL files open                                           | Warning  | 2m  |
| MySQL connection count has exceeded 80%                                     | Warning  | 2m  |
| Mysql has just restarted. Please be advised - exporter                      | Info     | —   |
| MySQL slow queries are piling up                                            | Warning  | 2m  |
| MysqlInnodbLogWaits - exporter                                              | Warning  | —   |
| MysqlSlaveIoThreadNotRunning - exporter                                     | Critical | —   |
| MysqlSlaveReplicationLag - exporter                                         | Critical | 1m  |
| MysqlSlaveSqlThreadNotRunning - exporter                                    | Critical | —   |
| The MySQL instance is down                                                  | Critical | —   |
| Mysql has opened a large number of file handles. Please be aware - categraf | Warning  | 2m  |

## Prometheus exporter (10)[​](#prometheus-exporter-10 "Direct link to Prometheus exporter (10)")

9 of the 10 rules in this group also apply unchanged to instances collected by Categraf, which produces the same metric names.

### More than 60% of the connections in MySQL are in a running state[​](#more-than-60-of-the-connections-in-mysql-are-in-a-running-state "Direct link to More than 60% of the connections in MySQL are in a running state")

Warning · 2m · Trigger:

```
avg by (instance) (mysql_global_status_threads_running) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 60
```

Runbook:

1. Run SHOW FULL PROCESSLIST to see which SQL statement and which table the piled-up threads are concentrated on;
2. Run SHOW ENGINE INNODB STATUS to check for lock waits or deadlocks;
3. KILL the offending SQL to stop the bleeding, then add indexes or apply rate limiting;
4. Check whether an upstream traffic spike or a slow dependency is keeping connections from being released.

### More than 80% of MySQL files open[​](#more-than-80-of-mysql-files-open "Direct link to More than 80% of MySQL files open")

More than 80% of MySQL files open

Warning · 2m · Trigger:

```
avg by (instance) (mysql_global_status_innodb_num_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

Runbook:

1. Run SHOW GLOBAL STATUS LIKE 'Open\_files' and SHOW VARIABLES LIKE 'open\_files\_limit' to confirm the current level;
2. Raise open\_files\_limit in my.cnf and raise the system ulimit -n and the systemd LimitNOFILE to match;
3. Check whether table\_open\_cache is set too large and inflating the handle count;
4. Check whether a large number of partitioned or small tables are being accessed at once.

### MySQL connection count has exceeded 80%[​](#mysql-connection-count-has-exceeded-80 "Direct link to MySQL connection count has exceeded 80%")

More than 80% of MySQL connections are in use

Warning · 2m · Trigger:

```
avg by (instance) (mysql_global_status_threads_connected) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 80
```

Runbook:

1. Run SHOW FULL PROCESSLIST and group connections by source host to find the application with an abnormal connection count;
2. Tell a traffic spike apart from an application connection pool leak (many long-lived Sleep connections piling up);
3. As an emergency measure raise max\_connections, checking free memory at the same time to avoid an OOM;
4. For the root cause, cap the application connection pool and shorten wait\_timeout.

### Mysql has just restarted. Please be advised - exporter[​](#mysql-has-just-restarted-please-be-advised---exporter "Direct link to Mysql has just restarted. Please be advised - exporter")

MySQL has just been restarted, less than one minute ago

Info · — · Trigger:

```
mysql_global_status_uptime < 60
```

Runbook:

1. Check the error log (the file pointed to by SHOW VARIABLES LIKE 'log\_error') to tell a crash, an OOM kill and a manual restart apart;
2. If it was an OOM, compare innodb\_buffer\_pool\_size against the machine's physical memory and lower it;
3. If the restart was unplanned, check whether systemd or the container orchestrator is repeatedly restarting it;
4. After the restart, confirm replication resumed automatically and application connection pools reconnected.

### MySQL slow queries are piling up[​](#mysql-slow-queries-are-piling-up "Direct link to MySQL slow queries are piling up")

MySQL slow queries are piling up over the last 5 minutes

Warning · 2m · Trigger:

```
increase(mysql_global_status_slow_queries[5m]) > 10
```

Runbook:

1. Run SHOW FULL PROCESSLIST to find long-running SQL and KILL \<id> to stop the bleeding if needed;
2. Use mysqldumpslow -s t -t 10 \<slow\_log> or pt-query-digest to find the top slow queries;
3. Run EXPLAIN on the queries you found to inspect the plan, then add indexes or rewrite them;
4. If the noise comes from long\_query\_time being set too low, tune that parameter instead of ignoring the alert.

### MysqlInnodbLogWaits - exporter[​](#mysqlinnodblogwaits---exporter "Direct link to MysqlInnodbLogWaits - exporter")

MySQL innodb log writes stalling

Warning · — · Trigger:

```
rate(mysql_global_status_innodb_log_waits[15m]) > 10
```

Runbook:

1. Raise innodb\_log\_buffer\_size (typically doubling the 16M default up to 64M\~256M);
2. Check whether innodb\_log\_file\_size is too small and causing frequent checkpoints;
3. Run iostat -x 1 to see whether the disk holding the redo log is already at full utilization;
4. Check for large transactions writing too much data at once and split them into smaller batches.

### MysqlSlaveIoThreadNotRunning - exporter[​](#mysqlslaveiothreadnotrunning---exporter "Direct link to MysqlSlaveIoThreadNotRunning - exporter")

MySQL Slave IO thread not running

Critical · — · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_io_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last\_IO\_Error;
2. The usual causes are the primary being unreachable, an invalid replication account, or the required binlog having been purged — fix the network, reset the account with CHANGE MASTER TO, or rebuild the replica from a backup respectively;
3. Then run START SLAVE IO\_THREAD and confirm Slave\_IO\_Running=Yes;
4. Take read traffic off this replica before you start.

### MysqlSlaveReplicationLag - exporter[​](#mysqlslavereplicationlag---exporter "Direct link to MysqlSlaveReplicationLag - exporter")

Critical · 1m · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) (mysql_slave_status_seconds_behind_master - mysql_slave_status_sql_delay) > 30
```

Runbook:

1. Run SHOW SLAVE STATUS\G and read Seconds\_Behind\_Master together with the event the SQL thread is currently applying;
2. On the primary, run SHOW PROCESSLIST to check for a large transaction or a bulk DML loading data;
3. If the replica applies single-threaded, enable parallel replication (slave\_parallel\_workers / slave\_parallel\_type=LOGICAL\_CLOCK);
4. If the lag keeps growing, move read traffic back to the primary or to another replica.

### MysqlSlaveSqlThreadNotRunning - exporter[​](#mysqlslavesqlthreadnotrunning---exporter "Direct link to MysqlSlaveSqlThreadNotRunning - exporter")

MySQL Slave SQL thread not running

Critical · — · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_sql_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last\_SQL\_Error to identify the event it is stuck on;
2. If it is a conflict that can be safely skipped (such as a duplicate primary key), verify the data is consistent, then run SET GLOBAL sql\_slave\_skip\_counter=1 followed by START SLAVE SQL\_THREAD;
3. If the primary and replica data have already diverged, rebuild the replica from a backup instead of blindly skipping;
4. Take read traffic off this replica before you start.

### The MySQL instance is down[​](#the-mysql-instance-is-down "Direct link to The MySQL instance is down")

Critical · — · Trigger:

```
mysql_up == 0
```

Runbook:

1. Log in to the host and run systemctl status mysqld or docker ps to confirm the process is alive;
2. If it is alive, connect by hand with mysql -h\<host> -P\<port> -u\<user> -p to tell a hung instance apart from a network or account problem;
3. If it is not running, read the tail of the error log to identify the cause (OOM, full disk, corrupted data files) before starting it — do not blindly restart;
4. If replication is in use, immediately assess whether to fail over, and confirm the application has taken this node out of rotation.

## Categraf (1)[​](#categraf-1 "Direct link to Categraf (1)")

For hosts and instances collected by Categraf; metric names follow Categraf plugins.

### Mysql has opened a large number of file handles. Please be aware - categraf[​](#mysql-has-opened-a-large-number-of-file-handles-please-be-aware---categraf "Direct link to Mysql has opened a large number of file handles. Please be aware - categraf")

More than 80% of MySQL files open

Warning · 2m · Trigger:

```
avg by (instance) (mysql_global_status_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

Runbook:

1. Run SHOW GLOBAL STATUS LIKE 'Open\_files' and SHOW VARIABLES LIKE 'open\_files\_limit' to confirm the current level;
2. Raise open\_files\_limit in my.cnf and raise the system ulimit -n and the systemd LimitNOFILE to match;
3. Check whether table\_open\_cache is set too large and inflating the handle count;
4. Check whether a large number of partitioned or small tables are being accessed at once.

## How to use these rules[​](#how-to-use-these-rules "Direct link to How to use these rules")

* **With Prometheus or vmalert**: download [`mysql.yml`](https://n9e.github.io/alert-rules/mysql.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
* **With Nightingale**: the same rules ship in the [MySQL](https://n9e.github.io/integrations/mysql.md) integration template. Open the integration center, [import the rules into a business group](https://n9e.github.io/docs/data/integrations/import.md), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The runbook steps and the remaining rules come from Nightingale's integration templates ([MySQL](https://github.com/ccfos/nightingale/tree/main/integrations/MySQL), Apache-2.0). Corrections are welcome as pull requests there.

## Related[​](#related "Direct link to Related")

* [Monitor MySQL with Nightingale](https://n9e.github.io/integrations/mysql.md): collector config, dashboards and metric reference
* [Write a metric rule in Nightingale](https://n9e.github.io/docs/alerting/metric-rules.md)
* [All alert rules](https://n9e.github.io/alert-rules.md)
