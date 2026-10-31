# Monitor MongoDB with Nightingale

Embeds the mongodb\_exporter collector for connections, op counters, replica set and sharding state; the dashboards need the compatible metric names turned on.

Last reviewed 2026-10-31

The MongoDB input wraps Percona's mongodb\_exporter and collects connections, op counters, queues, WiredTiger cache, replica set member state and oplog window via `serverStatus`, `replSetGetStatus` and related commands. For sharded clusters, the `mongodb_cluster` input collects from the mongos side.

The bundled dashboards are written against the 0.1x-compatible metric names such as `mongodb_ss_*`, so the Categraf config must set `compatible_mode = true` and give every instance an `instance` label. The rules cover connection counts, replication lag, unhealthy replica set members and unreachable instances.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 23 panels in total
* **8 alert rules**, each with runbook steps
* **Categraf collector config**: `input.mongodb`, `input.mongodb_cluster`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

   `conf/input.mongodb/mongodb.toml`

   ```
   [[instances]]

   # log level, enum: panic, fatal, error, warn, warning, info, debug, trace, defaults to info.

   log_level = "info"

   # append some const labels to metrics

   # NOTICE! the instance label is required for dashboards

   labels = { instance="mongo-cluster-01" }



   # mongodb dsn, see https://www.mongodb.com/docs/manual/reference/connection-string/

   # mongodb_uri = "mongodb://127.0.0.1:27017"

   mongodb_uri = ""

   # if you don't specify the username or password in the mongodb_uri, you can set here. 

   # This will overwrite the dsn, it would be helpful when special characters existing in the username or password and you don't want to encode them.

   # NOTICE! this user must be granted enough rights to query needed stats, see ../inputs/mongodb/README.md

   # username = "<username>"

   # password = "<password>"

   # if set to true, use the direct connection way

   # direct_connect = true



   # collect all means you collect all the metrics, if set, all below enable_xxx flags in this section will be ignored

   collect_all = true

   # if set to true, collect databases metrics

   # enable_db_stats = true

   # if set to true, collect getDiagnosticData metrics

   # enable_diagnostic_data = true

   # if set to true, collect replSetGetStatus metrics

   # enable_replicaset_status = true

   # if set to true, collect top metrics by admin command

   # enable_top_metrics = true

   # if set to true, collect index metrics. You should specify one of the coll_stats_namespaces and the discovering_mode flags.

   # enable_index_stats = true

   # if set to true, collect collections metrics. You should specify one of the coll_stats_namespaces and the discovering_mode flags.

   # enable_coll_stats = true



   # Only get stats for the collections matching this list of namespaces. if none set, discovering_mode will be enabled.

   # Example: db1.col1,db.col1

   # coll_stats_namespaces = []

   # Only get stats for index with the collections matching this list of namespaces.

   # Example: db1.col1,db.col1

   # index_stats_collections = []

   # if set to true, replace -1 to DESC for label key_name of the descending_index metrics

   # enable_override_descending_index = true



   # The bundled dashboard uses the 0.1x-compatible mongodb_ss_* metric names.

   compatible_mode = true



   # [[instances]]

   # # interval = global.interval * interval_times

   # interval_times = 1



   # log_level = "error"



   # append some labels to metrics

   # labels = { instance="mongo-cluster-02" }

   # mongodb_uri = "mongodb://username:password@127.0.0.1:27017"

   # collect_all = true

   # compatible_mode = true
   ```

   `conf/input.mongodb_cluster/mongodb_cluster.toml`

   ```
   [[instances]]

   # 日志级别，枚举值：panic, fatal, error, warn, warning, info, debug, trace，默认为 info。

   log_level = "info"



   # 为指标附加一些常量标签

   # 注意！instance 标签是仪表板所必需的

   labels = { instance="mongo-cluster-02" }



   # MongoDB 的数据源名称（DSN），请参考 https://www.mongodb.com/docs/manual/reference/connection-string/

   mongodb_uri = "mongodb://127.0.0.1:27017"

   #mongodb_uri = ""

   # 如果你没有在 mongodb_uri 中指定用户名或密码，可以在这里设置。

   # 这将覆盖 dsn，当用户名或密码中存在特殊字符时，设置这里会很有用，避免手动编码它们。

   # 注意！该用户必须被授予足够的权限来查询所需的统计数据，详见 ../inputs/mongodb/README.md

   #username = "root"

   #password = "<password>"

   # 如果设置为 true，将使用直接连接方式。

   # 如果希望采集集群每个实例的 mongodb_rs_myState 指标，需要开启 direct_connect

   direct_connect = true



   # 如果设置为 true，则采集所有指标。 如果设置此项，下面所有的 enable_xxx 标志将会被忽略。

   collect_all = true



   # 如果设置为 true，采集数据库的统计数据

   #enable_db_stats = true



   # 如果设置为 true，采集 MongoDB 的诊断数据

   enable_diagnostic_data = true



   # 如果设置为 true，采集副本集状态的相关指标

   #enable_replicaset_status = true



   # 如果设置为 true，采集通过 admin 命令获得的 top 相关指标

   #enable_top_metrics = true



   # 如果设置为 true，采集与索引相关的指标。需要指定集合的命名空间和发现模式。你需要指定其中一个 coll_stats_namespaces 和 discovering_mode 标志。

   #enable_index_stats = true



   # 如果设置为 true，采集集合相关的指标。你需要指定其中一个 coll_stats_namespaces 和 discovering_mode 标志。

   #enable_coll_stats = true



   # 仅获取与此列表匹配的集合统计信息。如果未设置，将启用 discovering_mode。

   # 示例：db1.col1,db.col1

   # coll_stats_namespaces = []



   # 仅获取与此列表匹配的集合中的索引统计信息。

   # 示例：db1.col1,db.col1

   # index_stats_collections = []



   # 如果设置为 true，将在降序索引的 label key_name 中用 DESC 替代 -1

   # enable_override_descending_index = true



   # 启用兼容模式，暴露的指标名称符合 0.1x 版本的兼容性命名规则，简化了从旧版本到当前版本的迁移。

   # compatible_mode = true
   ```

2. Open the integration center in Nightingale, find MongoDB, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                    | Panels |
| ---------------------------- | ------ |
| MongoDB Overview by exporter | 23     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

8 rules, disabled on import so you can enable them one by one with your own thresholds. The PromQL condition and runbook steps for every rule are in the alert rule library: [MongoDB alert rules](https://n9e.github.io/alert-rules/mongodb.md).

| Rule                                                               | Severity    | For |
| ------------------------------------------------------------------ | ----------- | --- |
| MongoDB average operation latency exceeds 250ms - exporter         | S2 Warning  | 10m |
| Mongo connection number has exceeded 80% - exporter                | S2 Warning  | 2m  |
| Mongo has encountered an Assert error - exporter                   | S3 Info     | 30m |
| Mongo has encountered cursor timeout - exporter                    | S2 Warning  | 30m |
| Mongo has encountered page fault interrupt - exporter              | S2 Warning  | 30m |
| Mongo has just restarted, please pay attention - exporter          | S3 Info     | —   |
| Mongo instance has crashed - exporter                              | S1 Critical | —   |
| Mongo replica set master-slave delay exceeds 30 seconds - exporter | S1 Critical | 1m  |

## Related[​](#related "Direct link to Related")

* [MongoDB template source](https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `mongodb` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/mongodb): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
