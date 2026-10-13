---
title: "用夜莺监控 Oracle"
sidebar_label: "Oracle"
description: "用只读账号跑一组可自定义的 SQL 采集会话、表空间、等待事件和缓存命中率，Linux 上的 Categraf 也能远程监控 Windows 上的 Oracle。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Oracle
toc_max_heading_level: 2
mdx:
  format: md
---

Oracle 插件连接实例并执行 `metric.toml` 里定义的一组 SQL：会话数、活动会话、表空间使用率、等待事件、SGA/PGA、缓存命中率、归档日志等，每条 SQL 都能改、能加。连接配置和查询定义分在两个文件，方便按版本和环境裁剪。

插件默认不能跑在 Windows 上，但可以用 Linux 上的 Categraf 远程连接 Windows 上的 Oracle。监控账号给 `CREATE SESSION` 和 `SELECT_CATALOG_ROLE` 即可；某条 SQL 报 ORA-00942 或 ORA-01031 时，补该视图的读取权限，不要换业务账号。

## 模板里有什么

- **1 张仪表盘**，共 26 个面板
- **5 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.oracle`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.oracle/metric.toml`

   ```toml
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

   ```toml
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

1. 在夜莺「集成中心」里找到 Oracle，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| Oracle by categraf | 26 |

## 内置告警规则

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Oracle: 数据库归档日志量大于100

Job:\{\{$labels.job\}\};Address:\{\{$labels.address\}\};Region:\{\{$labels.region\}\};

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
oracle_archivelog_count>100
```

处置步骤:

1. 用 SELECT * FROM V$RECOVERY_FILE_DEST 确认 FRA 的配额与已用空间；
1. 用 RMAN 的 crosscheck archivelog all; delete expired archivelog all; 清理已备份的归档；
1. 确认归档备份任务是否正常执行——归档堆积通常是备份失败导致的；
1. 长期需调大 db_recovery_file_dest_size 或把归档目录迁到更大的存储。

### Oracle: 数据库总连接数大于500

Job:\{\{$labels.job\}\};Address:\{\{$labels.address\}\};Region:\{\{$labels.region\}\};

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
oracle_process_count > 500

oracle_process_count > 800
```

处置步骤:

1. 用 SELECT COUNT(*) FROM V$PROCESS 与 SHOW PARAMETER processes 对比当前水位与上限；
1. 用 SELECT machine, program, COUNT(*) FROM V$SESSION GROUP BY 1,2 ORDER BY 3 DESC 找出连接数异常的应用；
1. 区分业务增长与应用连接池泄漏（大量 INACTIVE 会话堆积）；
1. 应急可调大 processes 参数（需重启实例），根因侧收敛应用连接池上限。

### Oracle: 数据库活跃连接数大于100

Job:\{\{$labels.job\}\};Address:\{\{$labels.address\}\};Region:\{\{$labels.region\}\};

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
sum by (instance) (oracle_sessions_value{status='ACTIVE',type='USER'}) > 100
```

处置步骤:

1. 用 SELECT sid, serial#, sql_id, event, seconds_in_wait FROM V$SESSION WHERE status='ACTIVE' AND type='USER' ORDER BY seconds_in_wait DESC 看活跃会话在等什么；
1. 等待事件集中在某类（如 enq: TX - row lock contention）说明有锁冲突，顺着 blocking_session 找源头；
1. 用 sql_id 查 V$SQL 定位慢 SQL，必要时 ALTER SYSTEM KILL SESSION 止血；
1. 定位后补索引或改写 SQL，并排查上游是否有突发流量。

### Oracle: 监控数据采集失败，可能已经挂了

S1 紧急 · 持续 90 秒 · 触发条件:

```promql
oracle_up != 1
```

处置步骤:

1. 登录主机确认 pmon 进程与监听器状态（ps -ef | grep pmon、lsnrctl status）；
1. 进程存活则用 sqlplus 手工连一次，区分实例夯住与监听/账号问题；
1. 进程不在则看 alert_\<SID>.log 尾部定位原因（ORA-00600、归档满、磁盘满）再拉起；
1. 有 Data Guard 的立即评估是否需要 failover。

### Oracle: 表空间使用率大于95%

Job:\{\{$labels.job\}\};Address:\{\{$labels.address\}\};Tablespace:\{\{$labels.tablespace\}\};Region:\{\{$labels.region\}\};

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
oracle_tablespace_bytes/oracle_tablespace_max_bytes*100>95
```

处置步骤:

1. 用 SELECT tablespace_name, bytes/1024/1024 mb FROM DBA_DATA_FILES 与 DBA_FREE_SPACE 确认是哪个表空间、数据文件是否已达最大；
1. 应急扩容：ALTER DATABASE DATAFILE '\<path>' RESIZE \<更大值>，或 ADD DATAFILE 新增文件；
1. 确认是否有大表或历史数据可归档删除，删除后需 shrink 或 move 才能真正释放；
1. 检查数据文件是否开了 AUTOEXTEND 及其 MAXSIZE 设置。

## 相关链接

- [Oracle 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Oracle）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `oracle` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/oracle)：完整配置项和指标列表。
- [实践：监控 Oracle](/docs/practice/oracle)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
