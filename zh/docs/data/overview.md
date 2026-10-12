# 接入数据

夜莺在原地查询你的存储。十二种数据源共用一套规则体系；还没采集的部分交给 Categraf。

把已有的存储接进来，夜莺在原地查询。指标、日志、SQL 类数据库用同一套规则体系，不必为每种数据源 重学一遍配法。数据不用搬迁：接数据源接的是一条连接，不是一份拷贝。

夜莺自身不做采集。推荐搭档是 [Categraf](https://n9e.github.io/zh/zh/categraf.md)——一个 agent、100+ 插件，按 Prometheus Remote Write 协议写入。Telegraf、Datadog Agent 和标准 exporter 以同样方式写入；已经在抓取目标的 Prometheus 也可以原样保留。

## [自动注册的内置时序库数据源](https://n9e.github.io/zh/zh/docs/data/embedded-tsdb.md)

[全新安装自动注册 embedded-tsdb 数据源（Prometheus 类型），Pushgw 收到的数据默认写入其中，查法与外置 Prometheus 相同。](https://n9e.github.io/zh/zh/docs/data/embedded-tsdb.md)

## [Prometheus](https://n9e.github.io/zh/zh/docs/data/prometheus.md)

[注册 Prometheus 或 Thanos 地址，设置认证与超时，用一条查询验证。](https://n9e.github.io/zh/zh/docs/data/prometheus.md)

## [VictoriaMetrics](https://n9e.github.io/zh/zh/docs/data/victoriametrics.md)

[VictoriaMetrics 按 Prometheus 类型接入，再把时序库类型设为 VictoriaMetrics；单机版与集群版的地址写法不同。](https://n9e.github.io/zh/zh/docs/data/victoriametrics.md)

## [ElasticSearch / OpenSearch](https://n9e.github.io/zh/zh/docs/data/elasticsearch.md)

[接入 ES 或 OpenSearch 集群，选择索引模式与时间字段，跑一条日志查询。](https://n9e.github.io/zh/zh/docs/data/elasticsearch.md)

## [ClickHouse / Doris / IoTDB](https://n9e.github.io/zh/zh/docs/data/clickhouse-doris-iotdb.md)

[ClickHouse、Doris、IoTDB 同属 SQL 类数据源：查询结果的数值列成为序列值，其余列成为标签，直接用于告警判定。](https://n9e.github.io/zh/zh/docs/data/clickhouse-doris-iotdb.md)

## [Loki / VictoriaLogs](https://n9e.github.io/zh/zh/docs/data/loki-victorialogs.md)

[注册日志存储，写 LogQL 或 LogsQL 查询，按条数或匹配结果告警。](https://n9e.github.io/zh/zh/docs/data/loki-victorialogs.md)

## [MySQL / PostgreSQL / TDengine](https://n9e.github.io/zh/zh/docs/data/sql-databases.md)

[直接对业务数据库告警：只读账号、规则执行的 SQL、以及怎么防慢查询。](https://n9e.github.io/zh/zh/docs/data/sql-databases.md)

## [Categraf](https://n9e.github.io/zh/zh/docs/data/categraf.md)

[5 个项目](https://n9e.github.io/zh/zh/docs/data/categraf.md)

## [其他采集器](https://n9e.github.io/zh/zh/docs/agent/telegraf.md)

[2 个项目](https://n9e.github.io/zh/zh/docs/agent/telegraf.md)

## [监控实践](https://n9e.github.io/zh/zh/docs/practice.md)

[8 个项目](https://n9e.github.io/zh/zh/docs/practice.md)

## [集成模板](https://n9e.github.io/zh/zh/docs/data/integrations.md)

[3 个项目](https://n9e.github.io/zh/zh/docs/data/integrations.md)
