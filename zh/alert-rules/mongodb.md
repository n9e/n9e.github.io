# MongoDB 告警规则：8 条 PromQL 规则与处置步骤

8 条开箱可用的 MongoDB 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 mongodb\_exporter。可下载为 Prometheus 规则文件，或导入夜莺。

最后校对于 2026-10-31

MongoDB 告警规则：实例宕机或刚重启、连接数逼近上限、平均操作延迟过高、Assert 错误、游标超时、缺页中断、副本集主从延迟。使用 mongodb\_exporter 的指标名。

## 概览[​](#概览 "概览的直接链接")

* **8 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
* **指标来源**：mongodb\_exporter
* **下载**：[`mongodb.yml`](https://n9e.github.io/zh/alert-rules/mongodb.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
* 阈值只是起点，启用前请按自己的环境调整。

## 规则一览[​](#规则一览 "规则一览的直接链接")

| 规则                                                               | 级别 | 持续    |
| ------------------------------------------------------------------ | ---- | ------- |
| MongoDB average operation latency exceeds 250ms - exporter         | 警告 | 10 分钟 |
| Mongo connection number has exceeded 80% - exporter                | 警告 | 2 分钟  |
| Mongo has encountered an Assert error - exporter                   | 提醒 | 30 分钟 |
| Mongo has encountered cursor timeout - exporter                    | 警告 | 30 分钟 |
| Mongo has encountered page fault interrupt - exporter              | 警告 | 30 分钟 |
| Mongo has just restarted, please pay attention - exporter          | 提醒 | —       |
| Mongo instance has crashed - exporter                              | 紧急 | —       |
| Mongo replica set master-slave delay exceeds 30 seconds - exporter | 紧急 | 1 分钟  |

## Prometheus exporter（8）[​](#prometheus-exporter8 "Prometheus exporter（8）的直接链接")

### MongoDB average operation latency exceeds 250ms - exporter[​](#mongodb-average-operation-latency-exceeds-250ms---exporter "MongoDB average operation latency exceeds 250ms - exporter的直接链接")

警告 · 10 分钟 · 触发条件:

```
rate(mongodb_mongod_op_latencies_latency_total[5m]) / rate(mongodb_mongod_op_latencies_ops_total[5m]) > 250000
```

处置步骤:

1. db.currentOp({"secs\_running":{$gt:5}}) 找当前长时间运行的操作，必要时 db.killOp(opid) 止血；
2. 开 profiler 定位慢查询：db.setProfilingLevel(1,100) 后 db.system.profile.find().sort({millis:-1}).limit(10)；
3. 对慢查询执行 explain("executionStats")，看是否走了 COLLSCAN 全表扫描并补索引；
4. 排查是否有大批量写入或索引重建正在占住磁盘 IO。

### Mongo connection number has exceeded 80% - exporter[​](#mongo-connection-number-has-exceeded-80---exporter "Mongo connection number has exceeded 80% - exporter的直接链接")

警告 · 2 分钟 · 触发条件:

```
avg by (instance) (mongodb_connections{state="current"}) / (avg by (instance) (mongodb_connections{state="current"}) + avg by (instance) (mongodb_connections{state="available"})) * 100 > 80
```

处置步骤:

1. db.serverStatus().connections 确认 current 与 available 的真实水位；
2. db.currentOp(true) 按 client 分组，找出连接数异常的应用；
3. 区分业务增长与驱动连接池泄漏（应用侧 maxPoolSize 配置过大或没有复用 MongoClient）；
4. 应急可调大 mongod 的 net.maxIncomingConnections，同时核对系统 ulimit -n 是否足够。

### Mongo has encountered an Assert error - exporter[​](#mongo-has-encountered-an-assert-error---exporter "Mongo has encountered an Assert error - exporter的直接链接")

提醒 · 30 分钟 · 触发条件:

```
rate(mongodb_asserts_total{type=~"regular|message"}[5m]) > 0
```

处置步骤:

1. 用 db.adminCommand({getLog:"global"}) 看日志中 assert 的上下文；
2. db.serverStatus().asserts 确认是 regular 还是 message 类在涨；
3. regular 多为存储层异常，检查磁盘健康与数据文件完整性；message 多为协议或驱动不匹配，核对驱动版本；
4. 确认是否与近期升级、schema 变更的时间吻合。

### Mongo has encountered cursor timeout - exporter[​](#mongo-has-encountered-cursor-timeout---exporter "Mongo has encountered cursor timeout - exporter的直接链接")

警告 · 30 分钟 · 触发条件:

```
rate(mongodb_mongod_metrics_cursor_timed_out_total[5m]) > 0
```

处置步骤:

1. db.serverStatus().metrics.cursor 看 timedOut 与 open.total 的变化；
2. 应用侧确认游标用完是否 close()，批处理单批耗时是否过长；
3. 长耗时遍历改用 noCursorTimeout 并自行管理生命周期，或调小 batchSize 加快消费；
4. 检查是否有慢查询把游标撑过了 cursorTimeoutMillis（默认 10 分钟）。

### Mongo has encountered page fault interrupt - exporter[​](#mongo-has-encountered-page-fault-interrupt---exporter "Mongo has encountered page fault interrupt - exporter的直接链接")

警告 · 30 分钟 · 触发条件:

```
rate(mongodb_extra_info_page_faults_total[5m]) > 0
```

处置步骤:

1. db.serverStatus().wiredTiger.cache 看 "bytes currently in the cache" 与配置上限的比值；
2. 用 db.stats() 和索引大小对比物理内存，评估工作集是否已超内存；
3. 优先删除无用索引、归档冷数据来缩小工作集；
4. 确认宿主机没有 swap 抖动，必要时扩内存或做分片。

### Mongo has just restarted, please pay attention - exporter[​](#mongo-has-just-restarted-please-pay-attention---exporter "Mongo has just restarted, please pay attention - exporter的直接链接")

提醒 · — · 触发条件:

```
mongodb_instance_uptime_seconds < 60
```

处置步骤:

1. 看 mongod 日志尾部确认是崩溃、被 OOM kill 还是人工重启；
2. 若是 OOM，核对 wiredTigerCacheSizeGB 与宿主机内存后调小；
3. 副本集场景用 rs.status() 确认是否已自动选出新主、应用是否已重连；
4. 非计划内重启要检查 systemd 或容器编排是否在反复拉起。

### Mongo instance has crashed - exporter[​](#mongo-instance-has-crashed---exporter "Mongo instance has crashed - exporter的直接链接")

紧急 · — · 触发条件:

```
mongodb_up == 0
```

处置步骤:

1. 登录主机用 systemctl status mongod 或 docker ps 确认进程是否存活；
2. 进程存活则用 mongosh 手工连一次，区分实例夯住与网络/认证问题；
3. 进程不在则先看日志尾部定位原因（OOM、磁盘满、数据文件损坏）再拉起，不要盲目重启；
4. 副本集场景立即执行 rs.status() 确认是否已完成主从切换，并确认应用已摘除该节点。

### Mongo replica set master-slave delay exceeds 30 seconds - exporter[​](#mongo-replica-set-master-slave-delay-exceeds-30-seconds---exporter "Mongo replica set master-slave delay exceeds 30 seconds - exporter的直接链接")

紧急 · 1 分钟 · 触发条件:

```
(max by (rs_nm) (mongodb_rs_members_optimeDate) - min by (rs_nm) (mongodb_rs_members_optimeDate)) / 1000 > 30
```

处置步骤:

1. 在主节点执行 rs.status()，对比各成员的 optimeDate 与 lastHeartbeat 定位落后的成员；
2. 到落后节点看 mongod 日志是否有 oplog 拉取报错或磁盘 IO 瓶颈；
3. 主节点用 db.currentOp() 确认是否有大批量写入把 oplog 灌满导致从节点追不上；
4. 落后超过 oplog 窗口时从节点需要重新初始同步（initial sync），期间先把读流量切走。

## 怎么使用这些规则[​](#怎么使用这些规则 "怎么使用这些规则的直接链接")

* **用 Prometheus 或 vmalert**：下载 [`mongodb.yml`](https://n9e.github.io/zh/alert-rules/mongodb.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页；有单独页面的规则指向它自己的页面。
* **用夜莺**：同样的规则内置在 [MongoDB](https://n9e.github.io/zh/integrations/mongodb.md) 集成模板里。在集成中心把规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

处置步骤和其余规则来自夜莺的集成模板（[MongoDB](https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* [用夜莺监控 MongoDB](https://n9e.github.io/zh/integrations/mongodb.md)：采集配置、仪表盘与指标说明
* [在夜莺里写指标告警规则](https://n9e.github.io/zh/docs/alerting/metric-rules.md)
* [全部告警规则](https://n9e.github.io/zh/alert-rules.md)
