# MongoDB alert rules for Prometheus: 8 rules with runbooks

8 ready-to-use MongoDB alert rules in PromQL, each with severity, duration and runbook steps. Metrics from mongodb\_exporter. Download as a Prometheus rules file or import into Nightingale.

Last reviewed 2026-10-31

MongoDB alert rules for an instance that has crashed or just restarted, connections approaching the limit, high average operation latency, assertion errors, cursor timeouts, page faults and replica-set lag. They use mongodb\_exporter metric names.

## At a glance[​](#at-a-glance "Direct link to At a glance")

* **8 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
* **Metrics from**: mongodb\_exporter
* **Download**: [`mongodb.yml`](https://n9e.github.io/alert-rules/mongodb.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
* Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list[​](#rule-list "Direct link to Rule list")

| Rule                                                               | Severity | For |
| ------------------------------------------------------------------ | -------- | --- |
| MongoDB average operation latency exceeds 250ms - exporter         | Warning  | 10m |
| Mongo connection number has exceeded 80% - exporter                | Warning  | 2m  |
| Mongo has encountered an Assert error - exporter                   | Info     | 30m |
| Mongo has encountered cursor timeout - exporter                    | Warning  | 30m |
| Mongo has encountered page fault interrupt - exporter              | Warning  | 30m |
| Mongo has just restarted, please pay attention - exporter          | Info     | —   |
| Mongo instance has crashed - exporter                              | Critical | —   |
| Mongo replica set master-slave delay exceeds 30 seconds - exporter | Critical | 1m  |

## Prometheus exporter (8)[​](#prometheus-exporter-8 "Direct link to Prometheus exporter (8)")

### MongoDB average operation latency exceeds 250ms - exporter[​](#mongodb-average-operation-latency-exceeds-250ms---exporter "Direct link to MongoDB average operation latency exceeds 250ms - exporter")

Warning · 10m · Trigger:

```
rate(mongodb_mongod_op_latencies_latency_total[5m]) / rate(mongodb_mongod_op_latencies_ops_total[5m]) > 250000
```

Runbook:

1. Run db.currentOp({"secs\_running":{$gt:5}}) to find long-running operations and db.killOp(opid) to stop the bleeding if needed;
2. Enable the profiler to find slow queries: db.setProfilingLevel(1,100), then db.system.profile.find().sort({millis:-1}).limit(10);
3. Run explain("executionStats") on the slow queries to see whether they do a COLLSCAN and add indexes;
4. Check whether a bulk write or an index rebuild is saturating disk IO.

### Mongo connection number has exceeded 80% - exporter[​](#mongo-connection-number-has-exceeded-80---exporter "Direct link to Mongo connection number has exceeded 80% - exporter")

Warning · 2m · Trigger:

```
avg by (instance) (mongodb_connections{state="current"}) / (avg by (instance) (mongodb_connections{state="current"}) + avg by (instance) (mongodb_connections{state="available"})) * 100 > 80
```

Runbook:

1. Run db.serverStatus().connections to see the real current and available levels;
2. Run db.currentOp(true) and group by client to find the application with an abnormal connection count;
3. Tell business growth apart from a driver connection pool leak (maxPoolSize set too high, or the MongoClient is not reused);
4. As an emergency measure raise net.maxIncomingConnections on mongod, and confirm the system ulimit -n is high enough.

### Mongo has encountered an Assert error - exporter[​](#mongo-has-encountered-an-assert-error---exporter "Direct link to Mongo has encountered an Assert error - exporter")

Info · 30m · Trigger:

```
rate(mongodb_asserts_total{type=~"regular|message"}[5m]) > 0
```

Runbook:

1. Run db.adminCommand({getLog:"global"}) to see the context of the asserts in the log;
2. Run db.serverStatus().asserts to see whether the regular or message counter is growing;
3. Regular asserts usually point to the storage layer — check disk health and data file integrity; message asserts usually mean a protocol or driver mismatch, so verify the driver version;
4. Check whether it lines up with a recent upgrade or schema change.

### Mongo has encountered cursor timeout - exporter[​](#mongo-has-encountered-cursor-timeout---exporter "Direct link to Mongo has encountered cursor timeout - exporter")

Warning · 30m · Trigger:

```
rate(mongodb_mongod_metrics_cursor_timed_out_total[5m]) > 0
```

Runbook:

1. Run db.serverStatus().metrics.cursor and watch timedOut against open.total;
2. On the application side, confirm cursors are close()d after use and that a single batch does not take too long;
3. For long traversals use noCursorTimeout and manage the lifecycle yourself, or lower batchSize to consume faster;
4. Check whether a slow query is holding a cursor past cursorTimeoutMillis (10 minutes by default).

### Mongo has encountered page fault interrupt - exporter[​](#mongo-has-encountered-page-fault-interrupt---exporter "Direct link to Mongo has encountered page fault interrupt - exporter")

Warning · 30m · Trigger:

```
rate(mongodb_extra_info_page_faults_total[5m]) > 0
```

Runbook:

1. Run db.serverStatus().wiredTiger.cache and compare "bytes currently in the cache" against the configured limit;
2. Compare db.stats() and index sizes against physical memory to judge whether the working set exceeds RAM;
3. Start by dropping unused indexes and archiving cold data to shrink the working set;
4. Confirm the host is not swapping, and add memory or shard if necessary.

### Mongo has just restarted, please pay attention - exporter[​](#mongo-has-just-restarted-please-pay-attention---exporter "Direct link to Mongo has just restarted, please pay attention - exporter")

Info · — · Trigger:

```
mongodb_instance_uptime_seconds < 60
```

Runbook:

1. Read the tail of the mongod log to tell a crash, an OOM kill and a manual restart apart;
2. If it was an OOM, compare wiredTigerCacheSizeGB against host memory and lower it;
3. For a replica set, run rs.status() to confirm a new primary was elected automatically and applications reconnected;
4. For an unplanned restart, check whether systemd or the container orchestrator is repeatedly restarting it.

### Mongo instance has crashed - exporter[​](#mongo-instance-has-crashed---exporter "Direct link to Mongo instance has crashed - exporter")

Critical · — · Trigger:

```
mongodb_up == 0
```

Runbook:

1. Log in to the host and run systemctl status mongod or docker ps to confirm the process is alive;
2. If it is alive, connect by hand with mongosh to tell a hung instance apart from a network or authentication problem;
3. If it is not running, read the tail of the log to identify the cause (OOM, full disk, corrupted data files) before starting it — do not blindly restart;
4. For a replica set, run rs.status() immediately to confirm failover completed and that the application has taken this node out of rotation.

### Mongo replica set master-slave delay exceeds 30 seconds - exporter[​](#mongo-replica-set-master-slave-delay-exceeds-30-seconds---exporter "Direct link to Mongo replica set master-slave delay exceeds 30 seconds - exporter")

Critical · 1m · Trigger:

```
(max by (rs_nm) (mongodb_rs_members_optimeDate) - min by (rs_nm) (mongodb_rs_members_optimeDate)) / 1000 > 30
```

Runbook:

1. Run rs.status() on the primary and compare optimeDate and lastHeartbeat across members to find the lagging one;
2. On the lagging node, check the mongod log for oplog fetch errors or disk IO bottlenecks;
3. On the primary, run db.currentOp() to check whether a bulk write is flooding the oplog faster than the secondary can apply;
4. If it falls behind the oplog window the secondary needs a fresh initial sync — move read traffic away first.

## How to use these rules[​](#how-to-use-these-rules "Direct link to How to use these rules")

* **With Prometheus or vmalert**: download [`mongodb.yml`](https://n9e.github.io/alert-rules/mongodb.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page.
* **With Nightingale**: the same rules ship in the [MongoDB](https://n9e.github.io/integrations/mongodb.md) integration template. Open the integration center, [import the rules into a business group](https://n9e.github.io/docs/data/integrations/import.md), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The runbook steps and the remaining rules come from Nightingale's integration templates ([MongoDB](https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB), Apache-2.0). Corrections are welcome as pull requests there.

## Related[​](#related "Direct link to Related")

* [Monitor MongoDB with Nightingale](https://n9e.github.io/integrations/mongodb.md): collector config, dashboards and metric reference
* [Write a metric rule in Nightingale](https://n9e.github.io/docs/alerting/metric-rules.md)
* [All alert rules](https://n9e.github.io/alert-rules.md)
