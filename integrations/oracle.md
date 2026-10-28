# Monitor Oracle with Nightingale

Runs a customizable set of SQL queries with a read-only account to collect sessions, tablespaces, wait events and cache hit ratios; a Linux Categraf can monitor Oracle on Windows remotely.

Last reviewed 2026-10-28

The Oracle input connects to the instance and runs the queries defined in `metric.toml`: session counts, active sessions, tablespace usage, wait events, SGA and PGA, cache hit ratios, archive logs and more. Every query can be edited or extended. Connection settings and query definitions live in separate files so they can be trimmed per version and environment.

The input does not run on Windows itself, but a Categraf on Linux can connect to an Oracle instance hosted on Windows. The monitoring account needs `CREATE SESSION` and `SELECT_CATALOG_ROLE`; if a query fails with ORA-00942 or ORA-01031, grant read access on that view rather than switching to an application account.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 26 panels in total
* **5 alert rules**, each with runbook steps
* **Categraf collector config**: `input.oracle`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

   `conf/input.oracle/metric.toml`

   ```
   [[metrics]]

   mesurement = "sessions"

   label_fields = [ "status", "type" ]

   metric_fields = [ "value" ]

   timeout = "3s"

   request = '''

   SELECT status, type, COUNT(*) as value FROM v$session GROUP BY status, type

   '''



   [[metrics]]

   mesurement = "lock"

   metric_fields = [ "cnt" ]

   timeout = "3s"

   request = '''

   SELECT COUNT(*) AS cnt

     FROM ALL_OBJECTS A, V$LOCKED_OBJECT B, SYS.GV_$SESSION C

    WHERE A.OBJECT_ID = B.OBJECT_ID

      AND B.PROCESS = C.PROCESS

   '''



   [[metrics]]

   mesurement = "slow_queries"

   metric_fields = [ "p95_time_usecs", "p99_time_usecs" ]

   timeout = "3s"

   request = '''

   SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY elapsed_time) AS p95_time_usecs,

          percentile_disc(0.99) WITHIN GROUP (ORDER BY elapsed_time) AS p99_time_usecs

   FROM v$sql

   WHERE last_active_time >= sysdate - 5/(24*60)

   '''



   [[metrics]]

   mesurement = "resource"

   label_fields = [ "resource_name" ]

   metric_fields = [ "current_utilization", "limit_value" ]

   timeout = "3s"

   request = '''

   SELECT resource_name,

          current_utilization,

          CASE WHEN TRIM(limit_value) = 'UNLIMITED' THEN '-1' ELSE TRIM(limit_value) END AS limit_value

   FROM v$resource_limit

   '''



   [[metrics]]

   mesurement = "asm_diskgroup"

   label_fields = [ "name" ]

   metric_fields = [ "total", "free" ]

   timeout = "3s"

   ignore_zero_result = true

   request = '''

   SELECT name,

          total_mb * 1024 * 1024 AS total,

          free_mb * 1024 * 1024 AS free

   FROM v$asm_diskgroup_stat

   WHERE EXISTS (SELECT 1 FROM v$datafile WHERE name LIKE '+%')

   '''



   [[metrics]]

   mesurement = "activity"

   metric_fields = [ "value" ]

   field_to_append = "name"

   timeout = "3s"

   request = '''

   SELECT name, value

   FROM v$sysstat

   WHERE name IN ('parse count (total)', 'execute count', 'user commits', 'user rollbacks')

   '''



   [[metrics]]

   mesurement = "process"

   metric_fields = [ "count" ]

   timeout = "3s"

   request = "SELECT COUNT(*) AS count FROM v$process"



   [[metrics]]

   mesurement = "wait_time"

   metric_fields = [ "value" ]

   label_fields = [ "wait_class" ]

   timeout = "3s"

   request = '''

   SELECT n.wait_class AS wait_class,

          ROUND(m.time_waited / m.INTSIZE_CSEC, 3) AS value

   FROM v$waitclassmetric m, v$system_wait_class n

   WHERE m.wait_class_id = n.wait_class_id

     AND n.wait_class != 'Idle'

   '''



   [[metrics]]

   mesurement = "tablespace"

   label_fields = [ "tablespace", "type" ]

   metric_fields = [ "bytes", "max_bytes", "free" ]

   timeout = "3s"

   request = '''

   SELECT dt.tablespace_name AS tablespace,

          dt.contents AS type,

          dt.block_size * dtum.used_space AS bytes,

          dt.block_size * dtum.tablespace_size AS max_bytes,

          dt.block_size * (dtum.tablespace_size - dtum.used_space) AS free

   FROM dba_tablespace_usage_metrics dtum, dba_tablespaces dt

   WHERE dtum.tablespace_name = dt.tablespace_name

   ORDER BY tablespace

   '''



   [[metrics]]

   mesurement = "sysmetric"

   metric_fields = [ "value" ]

   field_to_append = "metric_name"

   timeout = "3s"

   request = '''

   SELECT metric_name, value

   FROM v$sysmetric

   WHERE group_id = 2

   '''



   [[metrics]]

   mesurement = "applylag"

   metric_fields = [ "value" ]

   timeout = "3s"

   ignore_zero_result = true

   request = '''

   SELECT ROUND(

            EXTRACT(DAY FROM TO_DSINTERVAL(value)) * 86400

          + EXTRACT(HOUR FROM TO_DSINTERVAL(value)) * 3600

          + EXTRACT(MINUTE FROM TO_DSINTERVAL(value)) * 60

          + EXTRACT(SECOND FROM TO_DSINTERVAL(value))

          ) AS value

   FROM v$dataguard_stats

   WHERE name = 'apply lag'

   '''
   ```

   `conf/input.oracle/oracle.toml`

   ```
   # # collect interval

   # interval = 15



   #[[instances]]

   # address = "10.1.2.3:1521/orcl"

   # username = "monitor"

   # password = "<password>"

   # is_sys_dba = false

   # is_sys_oper = false

   # disable_connection_pool = false

   # max_open_connections = 5

   # # interval = global.interval * interval_times

   # interval_times = 1

   # labels = { region="cloud" }



   # [[instances.metrics]]

   # mesurement = "sessions"

   # label_fields = [ "status", "type" ]

   # metric_fields = [ "value" ]

   # timeout = "3s"

   # request = '''

   # SELECT status, type, COUNT(*) as value FROM v$session GROUP BY status, type

   # '''



   # [[instances]]

   # address = "192.168.10.10:1521/orcl"

   # username = "monitor"

   # password = "<password>"

   # is_sys_dba = false

   # is_sys_oper = false

   # disable_connection_pool = false

   # max_open_connections = 5

   # # labels = { region="local" }
   ```

2. Open the integration center in Nightingale, find Oracle, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard          | Panels |
| ------------------ | ------ |
| Oracle by categraf | 26     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Oracle: archived log volume exceeds 100[​](#oracle-archived-log-volume-exceeds-100 "Direct link to Oracle: archived log volume exceeds 100")

Job:{{$labels.job}};Address:{{$labels.address}};Region:{{$labels.region}};

S2 Warning · for 5 min · Trigger:

```
oracle_archivelog_count>100
```

Runbook:

1. Run SELECT \* FROM V$RECOVERY\_FILE\_DEST to check the FRA quota and used space;
2. Use RMAN's crosscheck archivelog all; delete expired archivelog all; to clear already-backed-up archives;
3. Confirm the archive backup job is running — a pile-up of archives is usually caused by failed backups;
4. Longer term, raise db\_recovery\_file\_dest\_size or move the archive destination to larger storage.

### Oracle: total database connections exceed 500[​](#oracle-total-database-connections-exceed-500 "Direct link to Oracle: total database connections exceed 500")

Job:{{$labels.job}};Address:{{$labels.address}};Region:{{$labels.region}};

S2 Warning · for 5 min · Trigger:

```
oracle_process_count > 500



oracle_process_count > 800
```

Runbook:

1. Compare SELECT COUNT(\*) FROM V$PROCESS against SHOW PARAMETER processes to see the current level versus the limit;
2. Run SELECT machine, program, COUNT(\*) FROM V$SESSION GROUP BY 1,2 ORDER BY 3 DESC to find the application with an abnormal connection count;
3. Tell business growth apart from an application connection pool leak (many INACTIVE sessions piling up);
4. As an emergency measure raise the processes parameter (requires an instance restart); for the root cause, cap the application connection pool.

### Oracle: active database connections exceed 100[​](#oracle-active-database-connections-exceed-100 "Direct link to Oracle: active database connections exceed 100")

Job:{{$labels.job}};Address:{{$labels.address}};Region:{{$labels.region}};

S2 Warning · for 5 min · Trigger:

```
sum by (instance) (oracle_sessions_value{status='ACTIVE',type='USER'}) > 100
```

Runbook:

1. Run SELECT sid, serial#, sql\_id, event, seconds\_in\_wait FROM V$SESSION WHERE status='ACTIVE' AND type='USER' ORDER BY seconds\_in\_wait DESC to see what the active sessions are waiting on;
2. If the wait events cluster on one type (such as enq: TX - row lock contention) there is lock contention — follow blocking\_session to the source;
3. Use the sql\_id against V$SQL to find the slow statement, and ALTER SYSTEM KILL SESSION to stop the bleeding if needed;
4. Once located, add indexes or rewrite the SQL, and check upstream for a traffic spike.

### Oracle: metric collection failed, instance may be down[​](#oracle-metric-collection-failed-instance-may-be-down "Direct link to Oracle: metric collection failed, instance may be down")

S1 Critical · for 90s · Trigger:

```
oracle_up != 1
```

Runbook:

1. Log in to the host and check the pmon process and listener state (ps -ef | grep pmon, lsnrctl status);
2. If they are alive, connect by hand with sqlplus to tell a hung instance from a listener or account problem;
3. If not running, read the tail of alert\_\<SID>.log to identify the cause (ORA-00600, full FRA, full disk) before starting it;
4. If Data Guard is in place, immediately assess whether to fail over.

### Oracle: tablespace usage exceeds 95%[​](#oracle-tablespace-usage-exceeds-95 "Direct link to Oracle: tablespace usage exceeds 95%")

Job:{{$labels.job}};Address:{{$labels.address}};Tablespace:{{$labels.tablespace}};Region:{{$labels.region}};

S2 Warning · for 3 min · Trigger:

```
oracle_tablespace_bytes/oracle_tablespace_max_bytes*100>95
```

Runbook:

1. Use SELECT tablespace\_name, bytes/1024/1024 mb FROM DBA\_DATA\_FILES together with DBA\_FREE\_SPACE to identify the tablespace and whether the data file has reached its maximum;
2. Expand it: ALTER DATABASE DATAFILE '\<path>' RESIZE \<larger value>, or ADD DATAFILE;
3. Check whether large tables or historical data can be archived and deleted — after deletion you still need shrink or move to actually release space;
4. Check whether the data file has AUTOEXTEND enabled and what its MAXSIZE is.

## Related[​](#related "Direct link to Related")

* [Oracle template source](https://github.com/ccfos/nightingale/tree/main/integrations/Oracle): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `oracle` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/oracle): every config option and the full metric list.
* [Walkthrough: monitor Oracle](https://n9e.github.io/docs/practice/oracle.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
