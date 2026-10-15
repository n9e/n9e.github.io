# What Nightingale (n9e) is

Nightingale (n9e, 夜莺) is an open-source alerting engine for existing data sources, with an embedded TSDB for small, single-Center deployments.

Last reviewed 2026-10-15

Nightingale (夜莺, also known as **n9e**) is an open-source alerting engine, hosted by the China Computer Federation's open-source committee (CCF ODTC) and developed on [GitHub](https://github.com/ccfos/nightingale) under Apache-2.0. It queries your existing Prometheus, log stores and databases to evaluate alert rules, reduce noise and deliver notifications. You can keep your data and collectors in place.

Without an external time series store, small, single-Center deployments can use the embedded TSDB. Multi-Center or larger deployments should use an external TSDB. See [Embedded TSDB and external storage](https://n9e.github.io/docs/concepts/storage.md) for the limits and migration path.

## What it owns[​](#what-it-owns "Direct link to What it owns")

| Layer                                     | Nightingale                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Storage                                   | Reuse Prometheus, VictoriaMetrics, Elasticsearch or ClickHouse; an embedded TSDB supports small, single-Center deployments |
| Collection                                | ❌ — Categraf, Telegraf, Datadog Agent and exporters all write in                                                          |
| **Alert rules, noise reduction, routing** | ✅ **this is the layer it owns**                                                                                           |
| Dashboards                                | ✅ built in, but Grafana stays a first-class option                                                                        |

## Where it fits[​](#where-it-fits "Direct link to Where it fits")

Register a data source, write one rule against it, and the resulting event flows through mute rules, subscriptions and event pipelines before reaching a notification channel. Since v9 the same process is also an MCP server, so an AI client can drive all of it in plain language.

* **10+<!-- --> data source types** — metrics, logs and SQL-queried stores alike
* **20<!-- --> built-in message templates** covering DingTalk, Feishu, WeCom, phone, SMS, Slack, PagerDuty and more — six media types ship configured, the rest you point at your own endpoint
* **83<!-- --> built-in integrations** bundling collector config, dashboards and rules
* **74<!-- --> MCP tools** across
  <!-- -->
  13
  <!-- -->
  toolsets

Apache-2.0, fully featured.

Next: [Quick start](https://n9e.github.io/docs/get-started/quick-start.md).
