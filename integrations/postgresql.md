---
title: "Monitor PostgreSQL with Nightingale"
sidebar_label: "PostgreSQL"
description: "Collects connections, transactions, cache hit ratio, locks and replication state with a read-only pg_monitor account; custom queries against business tables are supported."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/PostgreSQL
toc_max_heading_level: 2
mdx:
  format: md
---

The PostgreSQL input connects as a client and reads the `pg_stat_*` monitoring views: connections per database, commits and rollbacks, cache hit ratio, deadlocks, temp files and replication lag. Custom queries can turn numbers from your own tables into metrics as well.

A dedicated account with the `pg_monitor` role is all it needs; only custom queries require extra SELECT grants on the relevant schemas. The rules cover connection exhaustion, long-running transactions, falling cache hit ratio and replication lag.

## What's in the template

- **1 dashboard**, 14 panels in total
- **5 alert rules**, each with runbook steps
- **Categraf collector config**: `input.postgresql`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.postgresql/postgresql.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.postgresql started` once the plugin is loaded.

   ```toml
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

1. Open the integration center in Nightingale, find PostgreSQL, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| postgresql by categraf | 14 |

## Bundled alert rules

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### PostgreSQL read time too high

Time spent reading data files. A high value means memory is insufficient and data files are frequently read from disk

S2 Warning · for 1 min · Trigger:

```promql
rate(postgresql_blk_read_time[5m]) > 100
```

Runbook:

1. First confirm SHOW track_io_timing is on, otherwise this metric stays at 0 and the rule is meaningless until you enable it;
1. Use pg_stat_statements sorted by shared_blks_read to find the SQL doing the most disk reads, then add indexes or rewrite them;
1. Compare shared_buffers against instance memory — usually about 25% of physical memory;
1. Run iostat -x 1 to confirm whether the disk holding the data directory is saturated.

### Postgresql down

S2 Warning · for 1 min · Trigger:

```promql
postgresql_up!=1
```

Runbook:

1. Log in to the host and run systemctl status postgresql or docker ps to confirm the process is alive;
1. If it is alive, connect by hand with psql -h \<host> -p \<port> -U \<user> to tell a hung instance apart from a network or pg_hba authentication problem;
1. If it is not running, read the tail of the log under $PGDATA/log to identify the cause (OOM, full disk, full WAL directory) before starting it;
1. If a streaming replica exists, immediately assess whether to promote it (pg_ctl promote).

### PostgreSQL write time too high

Time spent writing data files. In PG dirty pages are normally written to the page cache; a high value means the cache is small and the OS cache has to flush more aggressively

S2 Warning · for 1 min · Trigger:

```promql
rate(postgresql_blk_write_time[5m]) > 100
```

Runbook:

1. First confirm SHOW track_io_timing is on, otherwise this metric stays at 0;
1. Check whether buffers_backend in pg_stat_bgwriter is much larger than buffers_checkpoint — if so, shared_buffers is too small or the bgwriter is too conservative;
1. Raise checkpoint_timeout and checkpoint_completion_target to spread the flushing out and avoid IO spikes;
1. Run iostat -x 1 to confirm whether the disk is saturated, and move to faster storage if needed.

### PostgreSQL deadlocks detected

S2 Warning · for 1 min · Trigger:

```promql
increase(postgresql_deadlocks[10m]) > 0
```

Runbook:

1. In postgresql.conf, confirm log_lock_waits=on and a sane deadlock_timeout, then take the full SQL of both sides of the deadlock from the log;
1. Join pg_locks with pg_stat_activity to identify which two tables and which lock modes are waiting on each other;
1. The root cause is usually two transactions updating the same rows in opposite order — enforcing a single locking order in the application removes it;
1. Long transactions amplify deadlocks, so check for transactions that stay open without committing.

### PostgreSQL cache hit ratio below 50%

S2 Warning · for 1 min · Trigger:

```promql
rate(postgresql_blks_hit[5m])*100/(rate(postgresql_blks_hit[5m])+rate(postgresql_blks_read[5m])) < 50
```

Runbook:

1. First rule out a cold cache after a restart (check the instance uptime);
1. Use pg_stat_statements sorted by shared_blks_read to find the SQL doing the most disk reads, and add indexes to eliminate sequential scans first;
1. Compare shared_buffers against instance memory — 25% of physical memory is the usual target;
1. Check whether a full table scan or a batch job is flushing the cache, and move it off peak hours.

## Related

- [PostgreSQL template source](https://github.com/ccfos/nightingale/tree/main/integrations/PostgreSQL): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `postgresql` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/postgresql): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
