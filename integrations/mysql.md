# Monitor MySQL with Nightingale

Connects to the instance and runs SHOW STATUS, SHOW VARIABLES and replica status; slow-query pileups, connection exhaustion and broken or lagging replication come with rules and runbooks.

Last reviewed 2026-10-13

The MySQL input is straightforward: it connects to the instance, runs `SHOW GLOBAL STATUS`, `SHOW GLOBAL VARIABLES`, `SHOW SLAVE STATUS` and friends, and turns the results into metrics. Basic status and replication are collected by default; extended InnoDB metrics, the processlist and schema and table sizes are opt-in. Custom SQL can also be turned into metrics.

The bundled rules cover the incidents that actually happen: slow queries piling up, connections approaching max\_connections, too many threads running, replica IO or SQL thread stopped, replication lag, unexpected restarts and open files near the limit, each with runbook steps. The dashboards come in three flavours for local collection, remote multi-instance by address, and by instance label, plus a set written for mysqld\_exporter metric names.

Grant the monitoring account `PROCESS`, `REPLICATION CLIENT` and `SELECT`; do not use root.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **7 dashboards**, 227 panels in total
* **20 alert rules**, each with runbook steps
* **31 metric descriptions**
* **Categraf collector config**: `input.mysql`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.mysql/mysql.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.mysql started` once the plugin is loaded.

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

2. Open the integration center in Nightingale, find MySQL, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                                                                                              | Panels |
| ------------------------------------------------------------------------------------------------------ | ------ |
| MySQL Dashboard (filtered by address, for a central Categraf scraping multiple remote MySQL instances) | 39     |
| MySQL Dashboard (filtered by instance, requires attaching an instance label at collection time)        | 39     |
| MySQL Dashboard, for Categraf scraping the local MySQL instance                                        | 39     |
| MySQL Overview by categraf                                                                             | 24     |
| MySQL Overview by categraf, group by ident                                                             | 38     |
| MySQL Overview by categraf, group by instance                                                          | 24     |
| MySQL Overview by exporter                                                                             | 24     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

20 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (10)[​](#collected-by-categraf-10 "Direct link to Collected by Categraf (10)")

#### MySQL slow queries are piling up - categraf[​](#mysql-slow-queries-are-piling-up---categraf "Direct link to MySQL slow queries are piling up - categraf")

MySQL slow queries are piling up over the last 5 minutes

S2 Warning · for 2 min · Trigger:

```
increase(mysql_global_status_slow_queries[5m]) > 10
```

Runbook:

1. Run SHOW FULL PROCESSLIST to find long-running SQL and KILL \<id> to stop the bleeding if needed;
2. Use mysqldumpslow -s t -t 10 \<slow\_log> or pt-query-digest to find the top slow queries;
3. Run EXPLAIN on the queries you found to inspect the plan, then add indexes or rewrite them;
4. If the noise comes from long\_query\_time being set too low, tune that parameter instead of ignoring the alert.

#### More than 60% of the connections in Mysql are in a running state - categraf[​](#more-than-60-of-the-connections-in-mysql-are-in-a-running-state---categraf "Direct link to More than 60% of the connections in Mysql are in a running state - categraf")

S2 Warning · for 2 min · Trigger:

```
avg by (instance) (mysql_global_status_threads_running) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 60
```

Runbook:

1. Run SHOW FULL PROCESSLIST to see which SQL statement and which table the piled-up threads are concentrated on;
2. Run SHOW ENGINE INNODB STATUS to check for lock waits or deadlocks;
3. KILL the offending SQL to stop the bleeding, then add indexes or apply rate limiting;
4. Check whether an upstream traffic spike or a slow dependency is keeping connections from being released.

#### Mysql has just restarted. Please be advised - categraf[​](#mysql-has-just-restarted-please-be-advised---categraf "Direct link to Mysql has just restarted. Please be advised - categraf")

MySQL has just been restarted, less than one minute ago

S3 Info · Trigger:

```
mysql_global_status_uptime < 60
```

Runbook:

1. Check the error log (the file pointed to by SHOW VARIABLES LIKE 'log\_error') to tell a crash, an OOM kill and a manual restart apart;
2. If it was an OOM, compare innodb\_buffer\_pool\_size against the machine's physical memory and lower it;
3. If the restart was unplanned, check whether systemd or the container orchestrator is repeatedly restarting it;
4. After the restart, confirm replication resumed automatically and application connection pools reconnected.

#### Mysql has opened a large number of file handles. Please be aware - categraf[​](#mysql-has-opened-a-large-number-of-file-handles-please-be-aware---categraf "Direct link to Mysql has opened a large number of file handles. Please be aware - categraf")

More than 80% of MySQL files open

S2 Warning · for 2 min · Trigger:

```
avg by (instance) (mysql_global_status_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

Runbook:

1. Run SHOW GLOBAL STATUS LIKE 'Open\_files' and SHOW VARIABLES LIKE 'open\_files\_limit' to confirm the current level;
2. Raise open\_files\_limit in my.cnf and raise the system ulimit -n and the systemd LimitNOFILE to match;
3. Check whether table\_open\_cache is set too large and inflating the handle count;
4. Check whether a large number of partitioned or small tables are being accessed at once.

#### Mysql instance has crashed - categraf[​](#mysql-instance-has-crashed---categraf "Direct link to Mysql instance has crashed - categraf")

S1 Critical · Trigger:

```
mysql_up == 0
```

Runbook:

1. Log in to the host and run systemctl status mysqld or docker ps to confirm the process is alive;
2. If it is alive, connect by hand with mysql -h\<host> -P\<port> -u\<user> -p to tell a hung instance apart from a network or account problem;
3. If it is not running, read the tail of the error log to identify the cause (OOM, full disk, corrupted data files) before starting it — do not blindly restart;
4. If replication is in use, immediately assess whether to fail over, and confirm the application has taken this node out of rotation.

#### MysqlInnodbLogWaits - categraf[​](#mysqlinnodblogwaits---categraf "Direct link to MysqlInnodbLogWaits - categraf")

MySQL innodb log writes stalling

S2 Warning · Trigger:

```
rate(mysql_global_status_innodb_log_waits[15m]) > 10
```

Runbook:

1. Raise innodb\_log\_buffer\_size (typically doubling the 16M default up to 64M\~256M);
2. Check whether innodb\_log\_file\_size is too small and causing frequent checkpoints;
3. Run iostat -x 1 to see whether the disk holding the redo log is already at full utilization;
4. Check for large transactions writing too much data at once and split them into smaller batches.

#### MysqlSlaveIoThreadNotRunning - categraf[​](#mysqlslaveiothreadnotrunning---categraf "Direct link to MysqlSlaveIoThreadNotRunning - categraf")

MySQL Slave IO thread not running

S1 Critical · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_io_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last\_IO\_Error;
2. The usual causes are the primary being unreachable, an invalid replication account, or the required binlog having been purged — fix the network, reset the account with CHANGE MASTER TO, or rebuild the replica from a backup respectively;
3. Then run START SLAVE IO\_THREAD and confirm Slave\_IO\_Running=Yes;
4. Take read traffic off this replica before you start.

#### MysqlSlaveReplicationLag - categraf[​](#mysqlslavereplicationlag---categraf "Direct link to MysqlSlaveReplicationLag - categraf")

S1 Critical · for 1 min · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) (mysql_slave_status_seconds_behind_master - mysql_slave_status_sql_delay) > 30
```

Runbook:

1. Run SHOW SLAVE STATUS\G and read Seconds\_Behind\_Master together with the event the SQL thread is currently applying;
2. On the primary, run SHOW PROCESSLIST to check for a large transaction or a bulk DML loading data;
3. If the replica applies single-threaded, enable parallel replication (slave\_parallel\_workers / slave\_parallel\_type=LOGICAL\_CLOCK);
4. If the lag keeps growing, move read traffic back to the primary or to another replica.

#### MysqlSlaveSqlThreadNotRunning - categraf[​](#mysqlslavesqlthreadnotrunning---categraf "Direct link to MysqlSlaveSqlThreadNotRunning - categraf")

MySQL Slave SQL thread not running

S1 Critical · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_sql_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last\_SQL\_Error to identify the event it is stuck on;
2. If it is a conflict that can be safely skipped (such as a duplicate primary key), verify the data is consistent, then run SET GLOBAL sql\_slave\_skip\_counter=1 followed by START SLAVE SQL\_THREAD;
3. If the primary and replica data have already diverged, rebuild the replica from a backup instead of blindly skipping;
4. Take read traffic off this replica before you start.

#### The number of connections in Mysql has exceeded 80% - categraf[​](#the-number-of-connections-in-mysql-has-exceeded-80---categraf "Direct link to The number of connections in Mysql has exceeded 80% - categraf")

More than 80% of MySQL connections are in use

S2 Warning · for 2 min · Trigger:

```
avg by (instance) (mysql_global_status_threads_connected) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 80
```

Runbook:

1. Run SHOW FULL PROCESSLIST and group connections by source host to find the application with an abnormal connection count;
2. Tell a traffic spike apart from an application connection pool leak (many long-lived Sleep connections piling up);
3. As an emergency measure raise max\_connections, checking free memory at the same time to avoid an OOM;
4. For the root cause, cap the application connection pool and shorten wait\_timeout.

### Collected by an exporter (10)[​](#collected-by-an-exporter-10 "Direct link to Collected by an exporter (10)")

#### More than 60% of the connections in MySQL are in a running state[​](#more-than-60-of-the-connections-in-mysql-are-in-a-running-state "Direct link to More than 60% of the connections in MySQL are in a running state")

S2 Warning · for 2 min · Trigger:

```
avg by (instance) (mysql_global_status_threads_running) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 60
```

Runbook:

1. Run SHOW FULL PROCESSLIST to see which SQL statement and which table the piled-up threads are concentrated on;
2. Run SHOW ENGINE INNODB STATUS to check for lock waits or deadlocks;
3. KILL the offending SQL to stop the bleeding, then add indexes or apply rate limiting;
4. Check whether an upstream traffic spike or a slow dependency is keeping connections from being released.

#### More than 80% of MySQL files open[​](#more-than-80-of-mysql-files-open "Direct link to More than 80% of MySQL files open")

More than 80% of MySQL files open

S2 Warning · for 2 min · Trigger:

```
avg by (instance) (mysql_global_status_innodb_num_open_files) / avg by (instance)(mysql_global_variables_open_files_limit) * 100 > 80
```

Runbook:

1. Run SHOW GLOBAL STATUS LIKE 'Open\_files' and SHOW VARIABLES LIKE 'open\_files\_limit' to confirm the current level;
2. Raise open\_files\_limit in my.cnf and raise the system ulimit -n and the systemd LimitNOFILE to match;
3. Check whether table\_open\_cache is set too large and inflating the handle count;
4. Check whether a large number of partitioned or small tables are being accessed at once.

#### MySQL connection count has exceeded 80%[​](#mysql-connection-count-has-exceeded-80 "Direct link to MySQL connection count has exceeded 80%")

More than 80% of MySQL connections are in use

S2 Warning · for 2 min · Trigger:

```
avg by (instance) (mysql_global_status_threads_connected) / avg by (instance) (mysql_global_variables_max_connections) * 100 > 80
```

Runbook:

1. Run SHOW FULL PROCESSLIST and group connections by source host to find the application with an abnormal connection count;
2. Tell a traffic spike apart from an application connection pool leak (many long-lived Sleep connections piling up);
3. As an emergency measure raise max\_connections, checking free memory at the same time to avoid an OOM;
4. For the root cause, cap the application connection pool and shorten wait\_timeout.

#### Mysql has just restarted. Please be advised - exporter[​](#mysql-has-just-restarted-please-be-advised---exporter "Direct link to Mysql has just restarted. Please be advised - exporter")

MySQL has just been restarted, less than one minute ago

S3 Info · Trigger:

```
mysql_global_status_uptime < 60
```

Runbook:

1. Check the error log (the file pointed to by SHOW VARIABLES LIKE 'log\_error') to tell a crash, an OOM kill and a manual restart apart;
2. If it was an OOM, compare innodb\_buffer\_pool\_size against the machine's physical memory and lower it;
3. If the restart was unplanned, check whether systemd or the container orchestrator is repeatedly restarting it;
4. After the restart, confirm replication resumed automatically and application connection pools reconnected.

#### MySQL slow queries are piling up[​](#mysql-slow-queries-are-piling-up "Direct link to MySQL slow queries are piling up")

MySQL slow queries are piling up over the last 5 minutes

S2 Warning · for 2 min · Trigger:

```
increase(mysql_global_status_slow_queries[5m]) > 10
```

Runbook:

1. Run SHOW FULL PROCESSLIST to find long-running SQL and KILL \<id> to stop the bleeding if needed;
2. Use mysqldumpslow -s t -t 10 \<slow\_log> or pt-query-digest to find the top slow queries;
3. Run EXPLAIN on the queries you found to inspect the plan, then add indexes or rewrite them;
4. If the noise comes from long\_query\_time being set too low, tune that parameter instead of ignoring the alert.

#### MysqlInnodbLogWaits - exporter[​](#mysqlinnodblogwaits---exporter "Direct link to MysqlInnodbLogWaits - exporter")

MySQL innodb log writes stalling

S2 Warning · Trigger:

```
rate(mysql_global_status_innodb_log_waits[15m]) > 10
```

Runbook:

1. Raise innodb\_log\_buffer\_size (typically doubling the 16M default up to 64M\~256M);
2. Check whether innodb\_log\_file\_size is too small and causing frequent checkpoints;
3. Run iostat -x 1 to see whether the disk holding the redo log is already at full utilization;
4. Check for large transactions writing too much data at once and split them into smaller batches.

#### MysqlSlaveIoThreadNotRunning - exporter[​](#mysqlslaveiothreadnotrunning---exporter "Direct link to MysqlSlaveIoThreadNotRunning - exporter")

MySQL Slave IO thread not running

S1 Critical · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_io_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last\_IO\_Error;
2. The usual causes are the primary being unreachable, an invalid replication account, or the required binlog having been purged — fix the network, reset the account with CHANGE MASTER TO, or rebuild the replica from a backup respectively;
3. Then run START SLAVE IO\_THREAD and confirm Slave\_IO\_Running=Yes;
4. Take read traffic off this replica before you start.

#### MysqlSlaveReplicationLag - exporter[​](#mysqlslavereplicationlag---exporter "Direct link to MysqlSlaveReplicationLag - exporter")

S1 Critical · for 1 min · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) (mysql_slave_status_seconds_behind_master - mysql_slave_status_sql_delay) > 30
```

Runbook:

1. Run SHOW SLAVE STATUS\G and read Seconds\_Behind\_Master together with the event the SQL thread is currently applying;
2. On the primary, run SHOW PROCESSLIST to check for a large transaction or a bulk DML loading data;
3. If the replica applies single-threaded, enable parallel replication (slave\_parallel\_workers / slave\_parallel\_type=LOGICAL\_CLOCK);
4. If the lag keeps growing, move read traffic back to the primary or to another replica.

#### MysqlSlaveSqlThreadNotRunning - exporter[​](#mysqlslavesqlthreadnotrunning---exporter "Direct link to MysqlSlaveSqlThreadNotRunning - exporter")

MySQL Slave SQL thread not running

S1 Critical · Trigger:

```
mysql_slave_status_master_server_id > 0 and ON (instance) mysql_slave_status_slave_sql_running == 0
```

Runbook:

1. Run SHOW SLAVE STATUS\G on the replica and read Last\_SQL\_Error to identify the event it is stuck on;
2. If it is a conflict that can be safely skipped (such as a duplicate primary key), verify the data is consistent, then run SET GLOBAL sql\_slave\_skip\_counter=1 followed by START SLAVE SQL\_THREAD;
3. If the primary and replica data have already diverged, rebuild the replica from a backup instead of blindly skipping;
4. Take read traffic off this replica before you start.

#### The MySQL instance is down[​](#the-mysql-instance-is-down "Direct link to The MySQL instance is down")

S1 Critical · Trigger:

```
mysql_up == 0
```

Runbook:

1. Log in to the host and run systemctl status mysqld or docker ps to confirm the process is alive;
2. If it is alive, connect by hand with mysql -h\<host> -P\<port> -u\<user> -p to tell a hung instance apart from a network or account problem;
3. If it is not running, read the tail of the error log to identify the cause (OOM, full disk, corrupted data files) before starting it — do not blindly restart;
4. If replication is in use, immediately assess whether to fail over, and confirm the application has taken this node out of rotation.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

31 metrics, the ones the dashboards and rules above are built on.

| Metric                                                                                                             | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                 | Unit    |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `mysql_global_status_buffer_pool_bytes_data`                                                                       | Global Status InnoDB buffer pool data size                                                                                                                                                                                                                                                                                                                                                                                              | bytes   |
| `mysql_global_status_buffer_pool_bytes_dirty`                                                                      | Global Status InnoDB buffer pool dirty size                                                                                                                                                                                                                                                                                                                                                                                             | bytes   |
| `mysql_global_status_buffer_pool_bytes_free`                                                                       | Global Status InnoDB buffer pool free size                                                                                                                                                                                                                                                                                                                                                                                              | bytes   |
| `mysql_global_status_buffer_pool_pages_utilization`                                                                | Global Status InnoDB buffer pool page usage                                                                                                                                                                                                                                                                                                                                                                                             | %       |
| `mysql_global_status_buffer_pool_bytes_used`                                                                       | Global Status InnoDB Buffer Pool used Size                                                                                                                                                                                                                                                                                                                                                                                              | bytes   |
| `mysql_global_status_buffer_pool_bytes_total`                                                                      | Global Status Total InnoDB Buffer Pool Size                                                                                                                                                                                                                                                                                                                                                                                             | bytes   |
| `mysql_global_status_uptime`                                                                                       | Global Status Startup Time                                                                                                                                                                                                                                                                                                                                                                                                              | s       |
| `mysql_global_status_threads_running`                                                                              | Global Status The number of threads currently running                                                                                                                                                                                                                                                                                                                                                                                   |         |
| `mysql_global_status_open_files`                                                                                   | Global Status Number of file handles currently open                                                                                                                                                                                                                                                                                                                                                                                     |         |
| `mysql_global_status_threads_connected`                                                                            | Global Status Number of current connections                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `mysql_global_status_max_used_connections`                                                                         | Global Status Maximum number of connections used — Maximum number of connections ever reached                                                                                                                                                                                                                                                                                                                                           |         |
| `irate(mysql_global_status_commands_total[3m])`                                                                    | Global Status Number of Commands per second                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `irate(mysql_global_status_queries[3m])`                                                                           | Global Status queries per second                                                                                                                                                                                                                                                                                                                                                                                                        |         |
| `irate(mysql_global_status_questions[3m])`                                                                         | Global Status Questions per second                                                                                                                                                                                                                                                                                                                                                                                                      |         |
| `irate(mysql_global_status_slow_queries[3m])`                                                                      | Global Status slow queries per second                                                                                                                                                                                                                                                                                                                                                                                                   |         |
| `sum(irate(mysql_global_status_commands_total{command=~"commit\|rollback"}[3m])) without (command)`                | Global Status Number of transactions per second                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `sum(irate(mysql_global_status_commands_total{command=~"insert\|update\|delete\|replace"}[3m])) without (command)` | Global Status Number of writes per second                                                                                                                                                                                                                                                                                                                                                                                               |         |
| `irate(mysql_global_status_bytes_sent[3m])`                                                                        | Global Status sends traffic per second                                                                                                                                                                                                                                                                                                                                                                                                  | bytes/s |
| `irate(mysql_global_status_bytes_received[3m])`                                                                    | Global Status receives traffic per second                                                                                                                                                                                                                                                                                                                                                                                               | bytes/s |
| `sum(irate(mysql_global_status_commands_total{command="select"}[3m])) without (command)`                           | Global Status Read operations per second                                                                                                                                                                                                                                                                                                                                                                                                |         |
| `increase(mysql_global_status_aborted_clients[3m])`                                                                | Global Status nearly 3 minutes abort client — The raw metric mysql \_ global \_ status \_ aborted \_ clients represents the number of connections terminated because the client did not properly close the connection, Counter type, monotonically increasing.                                                                                                                                                                          |         |
| `increase(mysql_global_status_aborted_connects[3m])`                                                               | Global Status Number of connections in last 3 minutes abort — The raw metric MySQL \_ global \_ status \_ aborted \_ connects represents the number of failed attempts to connect to a MySQL server, Counter type, monotonically increasing.                                                                                                                                                                                            |         |
| `increase(mysql_global_status_table_locks_waited[3m])`                                                             | Global Status nearly 3 minutes table lock waiting times                                                                                                                                                                                                                                                                                                                                                                                 |         |
| `mysql_global_variables_innodb_buffer_pool_size`                                                                   | Global Variables InnoDB buffer pool configuration size                                                                                                                                                                                                                                                                                                                                                                                  | bytes   |
| `mysql_global_variables_read_only`                                                                                 | Global Variables read \_ only Switch value — 0 is OFF, 1 is ON                                                                                                                                                                                                                                                                                                                                                                          |         |
| `mysql_global_variables_open_files_limit`                                                                          | Number of file handles that Global Variables allows to open                                                                                                                                                                                                                                                                                                                                                                             |         |
| `mysql_global_variables_max_connections`                                                                           | Global Variables Maximum Connection Limit — The maximum number of connections allowed, the default value is 151, is too small. -View the current settings with the `SHOW VARIABLES LIKE'max _ connections ''command -Reset the maximum number of connections via` SET GLOBAL max \_ connections = 2048 `-By modifying the MySQL configuration file, add` max \_ connections = 2048 `under` \[mysqld] \` so that its restart still works |         |
| `mysql_global_variables_query_cache_size`                                                                          | Global Variables Query Cache Size                                                                                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `mysql_up`                                                                                                         | Whether MySQL instance is UP — 1 means UP, indicating that it can normally connect to MySQL to collect data; 0 means that the MySQL instance cannot be connected. It may be a network problem, authentication problem, or MySQL itself is down                                                                                                                                                                                          |         |
| `mysql_scrape_use_seconds`                                                                                         | MySQL metric crawling time-consuming                                                                                                                                                                                                                                                                                                                                                                                                    | s       |
| `mysql_version_info`                                                                                               | MySQL version information                                                                                                                                                                                                                                                                                                                                                                                                               |         |

## Related[​](#related "Direct link to Related")

* [MySQL template source](https://github.com/ccfos/nightingale/tree/main/integrations/MySQL): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `mysql` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/mysql): every config option and the full metric list.
* [Walkthrough: monitor MySQL](https://n9e.github.io/docs/practice/mysql.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
