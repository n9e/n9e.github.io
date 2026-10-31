# 用夜莺监控 MongoDB

内置 mongodb\_exporter 的采集逻辑，覆盖连接、操作计数、复制集与分片状态；仪表盘要求开启兼容模式的指标名。

最后校对于 2026-10-31

MongoDB 插件由 percona 的 mongodb\_exporter 封装而来，通过 `serverStatus`、`replSetGetStatus` 等命令采集连接数、操作计数、队列、WiredTiger 缓存、复制集成员状态和 oplog 窗口。分片集群用 `mongodb_cluster` 插件从 mongos 侧采集。

模板里的仪表盘按 `mongodb_ss_*` 这类 0.1x 兼容指标名编写，所以 Categraf 配置里必须设置 `compatible_mode = true`，并给每个实例一个 `instance` 标签。规则覆盖连接数、复制延迟、副本集成员异常和实例不可达。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 23 个面板
* **8 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.mongodb`、`input.mongodb_cluster`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

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

2. 在夜莺「集成中心」里找到 MongoDB，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                       | 面板数 |
| ---------------------------- | ------ |
| MongoDB Overview by exporter | 23     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 8 条，导入后默认停用，按自己环境的阈值逐条启用。每条规则的触发条件（PromQL）和处置步骤收录在告警规则库：[MongoDB 告警规则](https://n9e.github.io/zh/alert-rules/mongodb.md)。

| 规则                                                               | 级别    | 持续    |
| ------------------------------------------------------------------ | ------- | ------- |
| MongoDB average operation latency exceeds 250ms - exporter         | S2 警告 | 10 分钟 |
| Mongo connection number has exceeded 80% - exporter                | S2 警告 | 2 分钟  |
| Mongo has encountered an Assert error - exporter                   | S3 提醒 | 30 分钟 |
| Mongo has encountered cursor timeout - exporter                    | S2 警告 | 30 分钟 |
| Mongo has encountered page fault interrupt - exporter              | S2 警告 | 30 分钟 |
| Mongo has just restarted, please pay attention - exporter          | S3 提醒 | —       |
| Mongo instance has crashed - exporter                              | S1 紧急 | —       |
| Mongo replica set master-slave delay exceeds 30 seconds - exporter | S1 紧急 | 1 分钟  |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[MongoDB 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/MongoDB%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `mongodb` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/mongodb)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
