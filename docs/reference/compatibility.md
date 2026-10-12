# Compatibility matrix

What is known to work with which versions, and why there is no official support matrix here.

Last reviewed 2026-10-10

**To be clear up front: the project publishes no official support matrix.** What follows was verified against the release artefacts and the code — it is not a promise.

Treat this page as a starting set of known-good combinations, not as an exhaustive list of what works.

## What the official compose bundles actually run[​](#what-the-official-compose-bundles-actually-run "Direct link to What the official compose bundles actually run")

This is the combination that gets exercised at release time:

| Component       | Version          | Bundle                 |
| --------------- | ---------------- | ---------------------- |
| MySQL           | 8                | `compose-bridge`       |
| PostgreSQL      | 12-alpine        | `compose-postgres`     |
| Redis           | 6.2 / 7.0-alpine | one in each bundle     |
| VictoriaMetrics | v1.79.12         | both bundles           |
| Prometheus      | latest           | `compose-host-network` |

## Metadata database[​](#metadata-database "Direct link to Metadata database")

| Database   | Situation                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------ |
| SQLite     | Built in, **single-process testing only**. The schema is created by AutoMigrate at startup |
| MySQL      | Driver is `go-sql-driver/mysql` v1.9.3, covering 5.7 and up; the bundle uses 8             |
| PostgreSQL | Driver is `jackc/pgx` v5, covering current versions; the bundle uses 12                    |

Character set: the MySQL DSN needs `charset=utf8mb4&parseTime=True&loc=Local`, and the schema script `docker/initsql/a-n9e.sql` is utf8mb4 throughout.

## Redis[​](#redis "Direct link to Redis")

| Form                            | Key                        |
| ------------------------------- | -------------------------- |
| miniredis (in-process, testing) | `RedisType = "miniredis"`  |
| Standalone                      | `RedisType = "standalone"` |
| Cluster                         | `RedisType = "cluster"`    |
| Sentinel                        | `RedisType = "sentinel"`   |

The client is `go-redis/v9`, compatible with Redis 6 and up.

## Data sources[​](#data-sources "Direct link to Data sources")

Eleven types in the open-source build:

| Type                                                                      | Notes                                                                                                     |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Prometheus Like                                                           | Covers Prometheus, VictoriaMetrics, Thanos, Mimir, M3 — anything implementing the PromQL HTTP API         |
| ElasticSearch                                                             | The version field **can be left blank to auto-detect**, or set to `x.y.z`. The code branches above 7.17.0 |
| OpenSearch                                                                | The version has to be stated in the config                                                                |
| Loki                                                                      | The URL **must end in `/loki`**                                                                           |
| VictoriaLogs / TDengine / ClickHouse / Doris / IoTDB / MySQL / PostgreSQL | See their own pages                                                                                       |

Note that **being registerable** and **being usable everywhere** are different things: ClickHouse, Doris, MySQL, PostgreSQL and OpenSearch are kept out of both explorers and dashboards in the open-source build, and can only back alert rules. See [Collect and connect data](https://n9e.github.io/docs/data/overview.md).

## Collectors[​](#collectors "Direct link to Collectors")

| Collector                            | How it feeds Nightingale                                          |
| ------------------------------------ | ----------------------------------------------------------------- |
| Categraf                             | The companion collector, own repo and release cycle. Remote Write |
| Prometheus / vmagent / Grafana Agent | Remote Write                                                      |
| Telegraf                             | Remote Write or the OpenTSDB protocol                             |
| Datadog Agent                        | `/datadog/api/v1/series`                                          |
| Open-Falcon collectors               | `/openfalcon/push`                                                |

## Build environment[​](#build-environment "Direct link to Build environment")

Go 1.25. The frontend is Vite + React; see the `n9e/fe` repository for its build.

## Related[​](#related "Direct link to Related")

* [Choosing a metadata database](https://n9e.github.io/docs/install/databases.md)
* [Collect and connect data](https://n9e.github.io/docs/data/overview.md)
* [Data write protocols](https://n9e.github.io/docs/reference/write-protocols.md)
