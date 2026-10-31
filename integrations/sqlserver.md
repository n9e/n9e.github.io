# Monitor SQLServer with Nightingale

Collects connections, waits, buffer pool, log usage and database state from DMVs and performance counters; VIEW SERVER STATE is all the permission it needs.

Last reviewed 2026-10-31

The SQL Server input is based on the Telegraf plugin of the same name and reads dynamic management views (DMVs) and performance counters: connections and requests, wait statistics, buffer cache hit ratio, page life expectancy, transaction log usage, database state and size, and Always On availability group health. It has been verified against SQL Server 2022.

Create a login in master and grant `VIEW SERVER STATE` and `VIEW ANY DEFINITION`; on 2022 and later add `VIEW SERVER PERFORMANCE STATE`. The rules cover blocking, deadlocks, log space, falling cache hit ratio and databases going offline.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 10 panels in total
* **11 alert rules**, each with runbook steps
* **Categraf collector config**: `input.sqlserver`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.sqlserver/sqlserver.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.sqlserver started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   [[instances]]



   ## Specify instances to monitor with a list of connection strings.

   ## All connection parameters are optional.

   ## By default, the host is localhost, listening on default port, TCP 1433.

   ##   for Windows, the user is the currently running AD user (SSO).

   ##   See https://github.com/denisenkom/go-mssqldb for detailed connection

   ##   parameters, in particular, tls connections can be created like so:

   ##   "encrypt=true;certificate=<cert>;hostNameInCertificate=<SqlServer host fqdn>"

   # servers = ["Server=server.xxx.com;Port=1433;User Id=monitor;Password=xxxxxx;app name=categraf;log=1;"]

   # servers = [ ]



   ## Authentication method

   ## valid methods: "connection_string", "AAD"

   # auth_method = "connection_string"



   ## "database_type" enables a specific set of queries depending on the database type. If specified, it replaces azuredb = true/false and query_version = 2

   ## In the config file, the sql server plugin section should be repeated each with a set of servers for a specific database_type.

   ## Possible values for database_type are - "SQLServer" or "AzureSQLDB" or "AzureSQLManagedInstance" or "AzureSQLPool"



   database_type = "SQLServer"



   ## A list of queries to include. If not specified, all the below listed queries are used.

   include_query = []



   ## A list of queries to explicitly ignore.

   exclude_query = ["SQLServerAvailabilityReplicaStates", "SQLServerDatabaseReplicaStates"]



   ## Queries enabled by default for database_type = "SQLServer" are -

   ## SQLServerPerformanceCounters, SQLServerWaitStatsCategorized, SQLServerDatabaseIO, SQLServerProperties, SQLServerMemoryClerks,

   ## SQLServerSchedulers, SQLServerRequests, SQLServerVolumeSpace, SQLServerCpu, SQLServerAvailabilityReplicaStates, SQLServerDatabaseReplicaStates,

   ## SQLServerRecentBackups



   ## Following are old config settings

   ## You may use them only if you are using the earlier flavor of queries, however it is recommended to use

   ## the new mechanism of identifying the database_type there by use it's corresponding queries



   ## Optional parameter, setting this to 2 will use a new version

   ## of the collection queries that break compatibility with the original

   ## dashboards.

   ## Version 2 - is compatible from SQL Server 2012 and later versions and also for SQL Azure DB

   # query_version = 2



   ## Toggling this to true will emit an additional metric called "sqlserver_telegraf_health".

   ## This metric tracks the count of attempted queries and successful queries for each SQL instance specified in "servers".

   ## The purpose of this metric is to assist with identifying and diagnosing any connectivity or query issues.

   ## This setting/metric is optional and is disabled by default.

   # health_metric = false



   ## Possible queries across different versions of the collectors

   ## Queries enabled by default for specific Database Type



   ## database_type =  SQLServer by default collects the following queries

   ## - SQLServerPerformanceCounters

   ## - SQLServerWaitStatsCategorized

   ## - SQLServerDatabaseIO

   ## - SQLServerProperties

   ## - SQLServerMemoryClerks

   ## - SQLServerSchedulers

   ## - SQLServerRequests

   ## - SQLServerVolumeSpace

   ## - SQLServerCpu

   ## - SQLServerRecentBackups

   ## and following as optional (if mentioned in the include_query list)

   ## - SQLServerAvailabilityReplicaStates

   ## - SQLServerDatabaseReplicaStates



   ## Version 2 by default collects the following queries

   ## Version 2 is being deprecated, please consider using database_type.

   ## - PerformanceCounters

   ## - WaitStatsCategorized

   ## - DatabaseIO

   ## - ServerProperties

   ## - MemoryClerk

   ## - Schedulers

   ## - SqlRequests

   ## - VolumeSpace

   ## - Cpu



   ## Version 1 by default collects the following queries

   ## Version 1 is deprecated, please consider using database_type.

   ## - PerformanceCounters

   ## - WaitStatsCategorized

   ## - CPUHistory

   ## - DatabaseIO

   ## - DatabaseSize

   ## - DatabaseStats

   ## - DatabaseProperties

   ## - MemoryClerk

   ## - VolumeSpace

   ## - PerformanceMetrics
   ```

2. Open the integration center in Nightingale, find SQLServer, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard | Panels |
| --------- | ------ |
| SQLServer | 10     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

11 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### SQL Server instance unreachable[​](#sql-server-instance-unreachable "Direct link to SQL Server instance unreachable")

S1 Critical · for 1 min · Trigger:

```
sqlserver_up == 0
```

Runbook:

1. On the database host run systemctl status mssql-server (Linux) or Get-Service MSSQLSERVER (Windows) to check the service;
2. If the service is running, connect by hand with sqlcmd -S \<host>,1433 -U \<user> to separate a network problem, a port not listening, and a locked account;
3. If the service is down, check /var/opt/mssql/log/errorlog (Linux) or the SQL Server error log; a full disk, tempdb creation failure, or an expired certificate are common causes;
4. After recovery run SELECT name, state\_desc FROM sys.databases to confirm every database is back ONLINE.

### SQL Server has a database in SUSPECT state[​](#sql-server-has-a-database-in-suspect-state "Direct link to SQL Server has a database in SUSPECT state")

S1 Critical · for 1 min · Trigger:

```
sqlserver_server_properties_db_suspect > 0
```

Runbook:

1. Run SELECT name, state\_desc FROM sys.databases WHERE state\_desc <> 'ONLINE' to identify the database;
2. Look for the most recent errors for that database in the SQL Server error log to tell an IO error from log corruption;
3. Restoring from the most recent good backup (RESTORE DATABASE) is the path with the least data loss and should be preferred;
4. Only if no backup exists should you use EMERGENCY mode plus DBCC CHECKDB(..., REPAIR\_ALLOW\_DATA\_LOSS); that operation loses data, so take a file-level snapshot first.

### SQL Server has a database in OFFLINE state[​](#sql-server-has-a-database-in-offline-state "Direct link to SQL Server has a database in OFFLINE state")

S2 Warning · for 3 min · Trigger:

```
sqlserver_server_properties_db_offline > 0
```

Runbook:

1. Run SELECT name, state\_desc FROM sys.databases WHERE state\_desc = 'OFFLINE' to list the offline databases;
2. Confirm against the change record whether this is planned maintenance or a migration;
3. If unplanned, try ALTER DATABASE \[db] SET ONLINE and read the error log for the exact reason if it fails;
4. Once online run DBCC CHECKDB(\[db]) WITH NO\_INFOMSGS to confirm data consistency.

### SQL Server data volume free space low[​](#sql-server-data-volume-free-space-low "Direct link to SQL Server data volume free space low")

S1 Critical · for 5 min · Trigger:

```
sqlserver_volume_space_available_space_bytes / (sqlserver_volume_space_total_space_bytes > 0) * 100 < 10
```

Runbook:

1. Take volume\_mount\_point from the alert labels and run SELECT DB\_NAME(database\_id), name, size\*8/1024 AS size\_mb FROM sys.master\_files ORDER BY size DESC to find the largest files;
2. For an oversized log file, run BACKUP LOG to truncate it first and then DBCC SHRINKFILE; under the full recovery model it cannot shrink without a log backup;
3. If the data files genuinely need that space, clean up historical partitions or archive cold data;
4. As an emergency measure move tempdb or backup files to another volume, but plan a disk expansion.

### SQL Server transaction log usage too high[​](#sql-server-transaction-log-usage-too-high "Direct link to SQL Server transaction log usage too high")

S1 Critical · for 5 min · Trigger:

```
sqlserver_performance_value{counter="Percent Log Used", instance!="_Total", instance!="Total"} > 85
```

Runbook:

1. Take instance (the database name) from the alert labels and run SELECT name, log\_reuse\_wait\_desc FROM sys.databases WHERE name = '\<db>' to see why the log cannot be reused;
2. For LOG\_BACKUP, run BACKUP LOG \[db] TO DISK='...' immediately; this is by far the most common cause;
3. For ACTIVE\_TRANSACTION, run DBCC OPENTRAN to find the long transaction and decide whether to KILL it;
4. For REPLICATION or AVAILABILITY\_REPLICA, investigate whether replication/AlwaysOn synchronisation is stuck and repair the replication link first.

### SQL Server page life expectancy too low[​](#sql-server-page-life-expectancy-too-low "Direct link to SQL Server page life expectancy too low")

S2 Warning · for 5 min · Trigger:

```
sqlserver_performance_value{counter="Page life expectancy", object="SQLServer:Buffer Manager"} < 300
```

Runbook:

1. Run SELECT \* FROM sys.dm\_os\_performance\_counters WHERE counter\_name LIKE '%Page life%' to confirm the live value;
2. Run SELECT TOP 20 \* FROM sys.dm\_exec\_query\_stats ORDER BY total\_logical\_reads DESC to find the statements with the highest logical reads, usually full scans caused by missing indexes;
3. Take the suggestions from sys.dm\_db\_missing\_index\_details, review them, and create the indexes; this pays off faster than adding memory;
4. If queries are already optimised and it is still low, check whether max server memory is set too small or is being squeezed by other processes before adding RAM.

### SQL Server has queries waiting for memory grants[​](#sql-server-has-queries-waiting-for-memory-grants "Direct link to SQL Server has queries waiting for memory grants")

S2 Warning · for 3 min · Trigger:

```
sqlserver_performance_value{counter="Memory Grants Pending"} > 0
```

Runbook:

1. Run SELECT session\_id, requested\_memory\_kb, granted\_memory\_kb, wait\_time\_ms FROM sys.dm\_exec\_query\_memory\_grants to see who is waiting and who is holding;
2. For sessions with huge grants, pull the statement with sys.dm\_exec\_sql\_text; it is usually a large sort or hash join, and a missing index amplifies the memory requirement significantly;
3. As an emergency measure KILL the largest consumer to release memory;
4. Longer term add the indexes suggested by dm\_db\_missing\_index\_details, split large queries, or raise max server memory.

### SQL Server blocked process count too high[​](#sql-server-blocked-process-count-too-high "Direct link to SQL Server blocked process count too high")

S2 Warning · for 3 min · Trigger:

```
sqlserver_performance_value{counter="Processes blocked"} > 5
```

Runbook:

1. Run SELECT blocking\_session\_id, session\_id, wait\_type, wait\_time, wait\_resource FROM sys.dm\_exec\_requests WHERE blocking\_session\_id <> 0 to find the head of the blocking chain;
2. For the head session use DBCC INPUTBUFFER(\<spid>) or sys.dm\_exec\_sql\_text to see what it is running;
3. Once confirmed as a runaway long transaction, run KILL \<spid> to stop the bleeding;
4. Afterwards check whether that transaction lacks an index (widening the lock range) or the application forgot to commit, and consider enabling READ\_COMMITTED\_SNAPSHOT to reduce reader/writer conflict.

### SQL Server deadlock occurred[​](#sql-server-deadlock-occurred "Direct link to SQL Server deadlock occurred")

S2 Warning · for 1 min · Trigger:

```
increase(sqlserver_performance_value{counter="Number of Deadlocks/sec"}[10m]) > 0
```

Runbook:

1. Query the system\_health extended event session for the deadlock graph: SELECT XEvent.query('.') FROM (SELECT CAST(target\_data AS XML) AS TargetData FROM sys.dm\_xe\_session\_targets ...) and extract xml\_deadlock\_report;
2. Read the lock acquisition order and the indexes involved from the graph;
3. The usual fix is to make multi-table updates follow the same order everywhere in the application code, plus indexes on the participating queries to narrow the lock range;
4. In the short term the application can retry on error 1205, but that does not replace fixing the root cause.

### SQL Server data file read latency too high[​](#sql-server-data-file-read-latency-too-high "Direct link to SQL Server data file read latency too high")

S2 Warning · for 5 min · Trigger:

```
rate(sqlserver_database_io_read_latency_ms[5m]) / (rate(sqlserver_database_io_reads[5m]) > 0) > 50
```

Runbook:

1. Take database\_name and logical\_filename from the alert labels to identify the slow file;
2. On the host run iostat -x 1 (Linux) or watch Avg. Disk sec/Read in Performance Monitor to tell slow storage from read amplification inside SQL Server;
3. If the storage is fine, optimise queries and add indexes as for page life expectancy to reduce physical reads;
4. If the storage really is slow, consider moving the file to SSD, splitting filegroups to spread IO, or checking whether backup jobs overlap the business peak.

### SQL Server data file write latency too high[​](#sql-server-data-file-write-latency-too-high "Direct link to SQL Server data file write latency too high")

S2 Warning · for 5 min · Trigger:

```
rate(sqlserver_database_io_write_latency_ms[5m]) / (rate(sqlserver_database_io_writes[5m]) > 0) > 50
```

Runbook:

1. Take database\_name and file\_type from the alert labels and handle file\_type=LOG first, since slow log writes stall every commit;
2. On the host run iostat -x 1 and check that disk's await and %util to see whether it is saturated;
3. If the log file shares a disk with the data files, move the log to a dedicated low-latency disk;
4. Check whether backups, DBCC CHECKDB, or index rebuilds overlap the business peak and move them to off-peak hours.

## Related[​](#related "Direct link to Related")

* [SQLServer template source](https://github.com/ccfos/nightingale/tree/main/integrations/SQLServer): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `sqlserver` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/sqlserver): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
