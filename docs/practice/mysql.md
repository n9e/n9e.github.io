# Monitor MySQL

Collect MySQL runtime metrics with Categraf and distinguish them from business-SQL alerts and Nightingale metadata storage.

Last reviewed 2026-10-11

By the end of this page, MySQL runtime metrics will be collected, and you will know how that differs from business-SQL alerting. The configuration targets **Categraf v0.5.17 and Nightingale v9**.

## Choose the intended use[​](#choose "Direct link to Choose the intended use")

* **MySQL performance monitoring**: a collector reads server status and writes metrics to a TSDB.
* **Business-SQL alerts**: Nightingale queries the business database directly, for example for failed-order counts. See [SQL datasources](https://n9e.github.io/docs/data/sql-databases.md).
* **Nightingale metadata database**: stores users and rules. See [Database deployment](https://n9e.github.io/docs/install/databases.md). It does not automatically provide either monitoring path.

## Configure collection[​](#configure "Direct link to Configure collection")

First [install and register Categraf](https://n9e.github.io/docs/data/categraf/install.md). Create a monitoring account reachable from the collector, then edit `conf/input.mysql/mysql.toml`:

```
[[instances]]

address = "127.0.0.1:3306"

username = "monitor"

password = "replace-with-monitor-password"

parameters = "tls=false"

timeout_seconds = 3

gather_table_size = false

gather_slave_status = false

labels = { instance = "mysql-local:3306" }
```

Replace the address, password and unique instance label. Configure TLS for network connections; this example is for local verification. Grant the permissions required by enabled queries. Replication status, process lists and table-size collection have different permissions and costs; do not use root as a shortcut. Enable replication metrics only when needed, and check whether the server supports `SHOW SLAVE STATUS` or `SHOW REPLICA STATUS`.

Use another `[[instances]]` for each target, with a distinct `instance` label. See the [v0.5.17 configuration](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.mysql/mysql.toml) for the full option list.

## Verify[​](#verify "Direct link to Verify")

From the collector installation directory:

```
./categraf --test --inputs mysql
```

**Expected result**: metrics starting with `mysql_`, without authentication or SQL-permission errors. Restart the existing collector service, select the destination store in Nightingale's explorer, and check the metrics and instance labels.

Import the MySQL dashboards and rules from integration templates. Confirm collection before enabling thresholds against absent data.

## Business metrics[​](#business-metrics "Direct link to Business metrics")

Order counts and failed jobs are not MySQL server-status metrics. Use custom SQL queries in the collector when you also need stored trends, or a Nightingale SQL datasource for direct query-based evaluation. Use read-only credentials and bounded queries with timeouts so monitoring does not impair the business workload.

## Next[​](#next "Direct link to Next")

* [Input plugins](https://n9e.github.io/docs/data/categraf/plugins.md)
* [SQL alert rules](https://n9e.github.io/docs/alerting/sql-rules.md)
