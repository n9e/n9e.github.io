# Connect your data

Nightingale queries your stores where they are. Twelve source types share one rule model; Categraf covers what nothing collects yet.

Register what you already run; Nightingale queries it in place. Metrics, logs and SQL-queried stores share one rule model, so there is nothing new to learn per source type. Nothing is migrated: a data source is a connection, not a copy.

Nightingale does not collect anything itself. [Categraf](https://n9e.github.io/categraf.md) is the recommended companion — one agent, 100+ plugins, writing over Prometheus Remote Write. Telegraf, the Datadog Agent and standard exporters write in the same way, and an existing Prometheus that already scrapes your targets can stay exactly as it is.

## [Auto-registered Embedded TSDB datasource](https://n9e.github.io/docs/data/embedded-tsdb.md)

[A fresh install auto-registers a Prometheus-type source named embedded-tsdb; Pushgw writes into it by default, and it is queried like any external Prometheus source.](https://n9e.github.io/docs/data/embedded-tsdb.md)

## [Prometheus](https://n9e.github.io/docs/data/prometheus.md)

[Register a Prometheus or Thanos endpoint, set auth and timeouts, and verify with a query.](https://n9e.github.io/docs/data/prometheus.md)

## [VictoriaMetrics](https://n9e.github.io/docs/data/victoriametrics.md)

[There is no separate VictoriaMetrics type: register it as Prometheus and set the TSDB type to VictoriaMetrics; single-node and cluster endpoints differ.](https://n9e.github.io/docs/data/victoriametrics.md)

## [ElasticSearch / OpenSearch](https://n9e.github.io/docs/data/elasticsearch.md)

[Connect an ES or OpenSearch cluster, choose index patterns and the timestamp field, and run a log query.](https://n9e.github.io/docs/data/elasticsearch.md)

## [ClickHouse / Doris / IoTDB](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)

[ClickHouse, Doris and IoTDB are one family in Nightingale: queried with SQL, one numeric column of the result becomes the series value and the rest become labels.](https://n9e.github.io/docs/data/clickhouse-doris-iotdb.md)

## [Loki / VictoriaLogs](https://n9e.github.io/docs/data/loki-victorialogs.md)

[Register a log store, write a LogQL or LogsQL query, and alert on counts or matches.](https://n9e.github.io/docs/data/loki-victorialogs.md)

## [MySQL / PostgreSQL / TDengine](https://n9e.github.io/docs/data/sql-databases.md)

[Alert on a business database directly: read-only credentials, the SQL a rule runs, and guarding against slow queries.](https://n9e.github.io/docs/data/sql-databases.md)

## [Categraf](https://n9e.github.io/docs/data/categraf.md)

[5 items](https://n9e.github.io/docs/data/categraf.md)

## [Other collectors](https://n9e.github.io/docs/agent/telegraf.md)

[2 items](https://n9e.github.io/docs/agent/telegraf.md)

## [Monitoring practice](https://n9e.github.io/docs/practice.md)

[8 items](https://n9e.github.io/docs/practice.md)

## [Integration templates](https://n9e.github.io/docs/data/integrations.md)

[3 items](https://n9e.github.io/docs/data/integrations.md)
