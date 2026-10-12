# Where it fits in the observability stack

Of the six observability layers, Nightingale owns the middle three — rules, noise reduction, routing and delivery; collectors, storage and Grafana stay as they are.

After this page you can place Nightingale in the stack you already run, and say which pieces stay.

## Six layers, Nightingale owns the middle three[​](#six-layers-nightingale-owns-the-middle-three "Direct link to Six layers, Nightingale owns the middle three")

Layers 1 and 2 stay yours: your collectors keep running, your stores keep storing. At layer 6 Nightingale sends the message but does not run rotas or escalation policies — that is what on-call platforms are for, and Nightingale can hand events to them.

## What you do not have to replace[​](#what-you-do-not-have-to-replace "Direct link to What you do not have to replace")

| What you run today                               | After Nightingale                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Prometheus / VictoriaMetrics / Thanos / Mimir    | Register as a data source, scrape config untouched                                                      |
| ElasticSearch / OpenSearch / Loki / VictoriaLogs | Register as a data source, same rule model as metrics                                                   |
| MySQL / PostgreSQL / ClickHouse / TDengine       | Register as a data source, rules run SQL directly                                                       |
| Grafana                                          | Keep it. Nightingale ships dashboards but does not ask you to migrate                                   |
| node\_exporter and friends                       | Keep being scraped by Prometheus; Nightingale queries Prometheus                                        |
| Alertmanager                                     | This is the layer that gets replaced — rules, silences, routes and receivers become Nightingale objects |

Alertmanager and the alerting built into your TSDB are the only real overlap. That overlap is the point.

## One exception: the embedded TSDB[​](#one-exception-the-embedded-tsdb "Direct link to One exception: the embedded TSDB")

Nightingale ships with a time-series database, on by default, so the whole flow works before you install anything else. It exists for onboarding, not as another TSDB to run: data lives on the local disk of **one Center process**, so with several replicas each one holds a fragment.

It is fine at small scale (roughly under 100k active series). Past that, turn it off and point `Pushgw.Writers` at an external store. Both can run at once as a dual write during migration.

## Three common shapes[​](#three-common-shapes "Direct link to Three common shapes")

* **Data does not flow through Nightingale.** You handle collection and storage; Nightingale only queries. The host list stays empty and self-healing is unavailable, but alert rules work fully.
* **Data flows through Nightingale.** Categraf remote-writes to Nightingale, which stores nothing itself and forwards to one or more TSDBs per `Pushgw.Writers`. Host list and self-healing work.
* **Edge deployment.** Where a site's link to the centre is unreliable, run `n9e-edge` there so evaluation happens locally and alerting survives a partition. See [Edge data centers](https://n9e.github.io/docs/install/edge.md).

Next: [Choose your path](https://n9e.github.io/docs/get-started/choose-your-path/existing-metrics.md).
