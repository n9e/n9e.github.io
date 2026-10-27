# Monitor PostgreSQL with Nightingale

Collects connections, transactions, cache hit ratio, locks and replication state with a read-only pg\_monitor account; custom queries against business tables are supported.

Last reviewed 2026-10-27

The PostgreSQL input connects as a client and reads the `pg_stat_*` monitoring views: connections per database, commits and rollbacks, cache hit ratio, deadlocks, temp files and replication lag. Custom queries can turn numbers from your own tables into metrics as well.

A dedicated account with the `pg_monitor` role is all it needs; only custom queries require extra SELECT grants on the relevant schemas. The rules cover connection exhaustion, long-running transactions, falling cache hit ratio and replication lag.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 14 panels in total
* **5 alert rules**, each with runbook steps
* **Categraf collector config**: `input.postgresql`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.postgresql/postgresql.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.postgresql started` once the plugin is loaded.

   ```
   # Read metrics from one or many postgresql servers

   # # collect interval

   # interval = 15



   [[instances]]

     ## specify address via a url matching:

     ##   postgres://[pqgotest[:password]]@localhost[/dbname]?sslmode=[disable|verify-ca|verify-full]

     ## or a simple string:

     ##   host=localhost user=pqgotest password=... sslmode=... dbname=app_production

     ##

     ## All connection parameters are optional.

     ##

     ## Without the dbname parameter, the driver will default to a database

     ## with the same name as the user. This dbname is just for instantiating a

     ## connection with the server and doesn't restrict the databases we are trying

     ## to grab metrics for.

     ##

     # address = "host=localhost user=postgres sslmode=disable"



     ## A custom name for the database that will be used as the "server" tag in the

     ## measurement output. If not specified, a default one generated from

     ## the connection address is used.

     # outputaddress = "db01"



     ## connection configuration.

     ## maxlifetime - specify the maximum lifetime of a connection.

     ## default is forever (0s)

     # max_lifetime = "0s"



     ## A  list of databases to explicitly ignore.  If not specified, metrics for all

     ## databases are gathered.  Do NOT use with the 'databases' option.

     # ignored_databases = ["postgres", "template0", "template1"]



     ## A list of databases to pull metrics about. If not specified, metrics for all

     ## databases are gathered.  Do NOT use with the 'ignored_databases' option.

     # databases = ["app_production", "testing"]



     ## Whether to use prepared statements when connecting to the database.

     ## This should be set to false when connecting through a PgBouncer instance

     ## with pool_mode set to transaction.

     #prepared_statements = true

     # [[instances.metrics]]

     # measurement = "sessions"

     # label_fields = [ "state" ]

     # metric_fields = [ "value" ]

     # timeout = "3s"

     # request = '''

     # SELECT COALESCE(state, 'unknown') AS state,

     #        COUNT(*)::double precision AS value

     # FROM pg_stat_activity

     # GROUP BY COALESCE(state, 'unknown')

     # '''
   ```

2. Open the integration center in Nightingale, find PostgreSQL, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard              | Panels |
| ---------------------- | ------ |
| postgresql by categraf | 14     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### PostgreSQL read time too high[​](#postgresql-read-time-too-high "Direct link to PostgreSQL read time too high")

Time spent reading data files. A high value means memory is insufficient and data files are frequently read from disk

S2 Warning · for 1 min · Trigger:

```
rate(postgresql_blk_read_time[5m]) > 100
```

Runbook:

1. First confirm SHOW track\_io\_timing is on, otherwise this metric stays at 0 and the rule is meaningless until you enable it;
2. Use pg\_stat\_statements sorted by shared\_blks\_read to find the SQL doing the most disk reads, then add indexes or rewrite them;
3. Compare shared\_buffers against instance memory — usually about 25% of physical memory;
4. Run iostat -x 1 to confirm whether the disk holding the data directory is saturated.

### Postgresql down[​](#postgresql-down "Direct link to Postgresql down")

S2 Warning · for 1 min · Trigger:

```
postgresql_up!=1
```

Runbook:

1. Log in to the host and run systemctl status postgresql or docker ps to confirm the process is alive;
2. If it is alive, connect by hand with psql -h \<host> -p \<port> -U \<user> to tell a hung instance apart from a network or pg\_hba authentication problem;
3. If it is not running, read the tail of the log under $PGDATA/log to identify the cause (OOM, full disk, full WAL directory) before starting it;
4. If a streaming replica exists, immediately assess whether to promote it (pg\_ctl promote).

### PostgreSQL write time too high[​](#postgresql-write-time-too-high "Direct link to PostgreSQL write time too high")

Time spent writing data files. In PG dirty pages are normally written to the page cache; a high value means the cache is small and the OS cache has to flush more aggressively

S2 Warning · for 1 min · Trigger:

```
rate(postgresql_blk_write_time[5m]) > 100
```

Runbook:

1. First confirm SHOW track\_io\_timing is on, otherwise this metric stays at 0;
2. Check whether buffers\_backend in pg\_stat\_bgwriter is much larger than buffers\_checkpoint — if so, shared\_buffers is too small or the bgwriter is too conservative;
3. Raise checkpoint\_timeout and checkpoint\_completion\_target to spread the flushing out and avoid IO spikes;
4. Run iostat -x 1 to confirm whether the disk is saturated, and move to faster storage if needed.

### PostgreSQL deadlocks detected[​](#postgresql-deadlocks-detected "Direct link to PostgreSQL deadlocks detected")

S2 Warning · for 1 min · Trigger:

```
increase(postgresql_deadlocks[10m]) > 0
```

Runbook:

1. In postgresql.conf, confirm log\_lock\_waits=on and a sane deadlock\_timeout, then take the full SQL of both sides of the deadlock from the log;
2. Join pg\_locks with pg\_stat\_activity to identify which two tables and which lock modes are waiting on each other;
3. The root cause is usually two transactions updating the same rows in opposite order — enforcing a single locking order in the application removes it;
4. Long transactions amplify deadlocks, so check for transactions that stay open without committing.

### PostgreSQL cache hit ratio below 50%[​](#postgresql-cache-hit-ratio-below-50 "Direct link to PostgreSQL cache hit ratio below 50%")

S2 Warning · for 1 min · Trigger:

```
rate(postgresql_blks_hit[5m])*100/(rate(postgresql_blks_hit[5m])+rate(postgresql_blks_read[5m])) < 50
```

Runbook:

1. First rule out a cold cache after a restart (check the instance uptime);
2. Use pg\_stat\_statements sorted by shared\_blks\_read to find the SQL doing the most disk reads, and add indexes to eliminate sequential scans first;
3. Compare shared\_buffers against instance memory — 25% of physical memory is the usual target;
4. Check whether a full table scan or a batch job is flushing the cache, and move it off peak hours.

## Related[​](#related "Direct link to Related")

* [PostgreSQL template source](https://github.com/ccfos/nightingale/tree/main/integrations/PostgreSQL): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `postgresql` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/postgresql): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
