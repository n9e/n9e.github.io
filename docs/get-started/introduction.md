# What Nightingale (n9e) is

Nightingale (n9e, 夜莺) is an open-source alerting engine: it evaluates rules on the stores you already run, cuts the noise and delivers to on-call; it stores and collects nothing.

Nightingale (夜莺, also known as **n9e**) is an open-source alerting engine, hosted by the China Computer Federation's open-source committee (CCF ODTC) and developed on [GitHub](https://github.com/ccfos/nightingale) under Apache-2.0. It does not store your telemetry and it does not replace your collectors — it sits on top of the databases you already run, evaluates rules against them, cuts the noise, and delivers what survives to the people on call.

## What it owns[​](#what-it-owns "Direct link to What it owns")

| Layer                                     | Nightingale                                                       |
| ----------------------------------------- | ----------------------------------------------------------------- |
| Storage                                   | ❌ — keep Prometheus, VictoriaMetrics, ElasticSearch, ClickHouse… |
| Collection                                | ❌ — Categraf, Telegraf, Datadog Agent and exporters all write in |
| **Alert rules, noise reduction, routing** | ✅ **this is the layer it owns**                                  |
| Dashboards                                | ✅ built in, but Grafana stays a first-class option               |

## Where it fits[​](#where-it-fits "Direct link to Where it fits")

Register a data source, write one rule against it, and the resulting event flows through mute rules, subscriptions and event pipelines before reaching a notification channel. Since v9 the same process is also an MCP server, so an AI client can drive all of it in plain language.

* **10+ data source types** — metrics, logs and SQL-queried stores alike
* **20 built-in message templates** covering DingTalk, Feishu, WeCom, phone, SMS, Slack, PagerDuty and more — six media types ship configured, the rest you point at your own endpoint
* **86 built-in integrations** bundling collector config, dashboards and rules
* **74 MCP tools** across 13 toolsets

Apache-2.0, fully featured.

Next: [Quick start](https://n9e.github.io/docs/get-started/quick-start.md).
