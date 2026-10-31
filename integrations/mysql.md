# Monitor MySQL with Nightingale

Connects to the instance and runs SHOW STATUS, SHOW VARIABLES and replica status; slow-query pileups, connection exhaustion and broken or lagging replication come with rules and runbooks.

Last reviewed 2026-10-31

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

20 rules, disabled on import so you can enable them one by one with your own thresholds. The PromQL condition and runbook steps for every rule are in the alert rule library: [MySQL alert rules](https://n9e.github.io/alert-rules/mysql.md).

| Rule                                                                        | Severity    | For |
| --------------------------------------------------------------------------- | ----------- | --- |
| MySQL slow queries are piling up - categraf                                 | S2 Warning  | 2m  |
| More than 60% of the connections in Mysql are in a running state - categraf | S2 Warning  | 2m  |
| Mysql has just restarted. Please be advised - categraf                      | S3 Info     | —   |
| Mysql has opened a large number of file handles. Please be aware - categraf | S2 Warning  | 2m  |
| Mysql instance has crashed - categraf                                       | S1 Critical | —   |
| MysqlInnodbLogWaits - categraf                                              | S2 Warning  | —   |
| MysqlSlaveIoThreadNotRunning - categraf                                     | S1 Critical | —   |
| MysqlSlaveReplicationLag - categraf                                         | S1 Critical | 1m  |
| MysqlSlaveSqlThreadNotRunning - categraf                                    | S1 Critical | —   |
| The number of connections in Mysql has exceeded 80% - categraf              | S2 Warning  | 2m  |
| More than 60% of the connections in MySQL are in a running state            | S2 Warning  | 2m  |
| More than 80% of MySQL files open                                           | S2 Warning  | 2m  |
| MySQL connection count has exceeded 80%                                     | S2 Warning  | 2m  |
| Mysql has just restarted. Please be advised - exporter                      | S3 Info     | —   |
| MySQL slow queries are piling up                                            | S2 Warning  | 2m  |
| MysqlInnodbLogWaits - exporter                                              | S2 Warning  | —   |
| MysqlSlaveIoThreadNotRunning - exporter                                     | S1 Critical | —   |
| MysqlSlaveReplicationLag - exporter                                         | S1 Critical | 1m  |
| MysqlSlaveSqlThreadNotRunning - exporter                                    | S1 Critical | —   |
| The MySQL instance is down                                                  | S1 Critical | —   |

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
| `mysql_global_variables_max_connections`                                                                           | Global Variables Maximum Connection Limit — The maximum number of connections allowed, the default value is 151, is too small. View the current settings with the `SHOW VARIABLES LIKE'max _ connections ''command; Reset the maximum number of connections via` SET GLOBAL max \_ connections = 2048 `; By modifying the MySQL configuration file, add `max \_ connections = 2048 `under` \[mysqld] \` so that its restart still works |         |
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
