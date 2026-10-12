---
title: "Embedded TSDB and external storage"
sidebar_label: "Storage"
description: "Nightingale ships with an embedded TSDB for onboarding; this page explains its limits and when to switch to Prometheus or VictoriaMetrics."
last_reviewed: 2026-10-10
---

Nightingale stores two different kinds of thing, in two different places:

- **Metadata** — users, business groups, alert rules, dashboards, notification config. Lives in
  SQLite / MySQL / PostgreSQL;
- **Metrics** — time series. Live in the embedded TSDB by default, usually an external store in
  production.

Conflating the two is what produces "I configured VictoriaMetrics, why do I still need MySQL".

## Metadata: SQLite is for testing only

The default is `DBType = "sqlite"`, storing `n9e.db` next to the binary. Zero dependencies, at the
cost of having no second copy and no way for several instances to share state.

Production means MySQL or PostgreSQL:

```toml
[DB]
DBType = "mysql"
DSN = "root:<password>@tcp(localhost:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
```

Redis is the same story: the default `RedisType = "miniredis"` is an **in-process stand-in**;
production uses `standalone`, `cluster` or `sentinel`.

## The embedded TSDB exists for onboarding

On by default:

```toml
[EmbeddedTSDB]
Enable = true
Dir = "data/tsdb"
RetentionDuration = "15d"
MaxBytes = "10GiB"
```

With it on, metrics pushed by Categraf are stored locally, so charts and alerts work with no
external TSDB at all. At startup it also **auto-registers a Prometheus-type data source named
`embedded-tsdb`** pointing at `http://127.0.0.1:17000/prometheus`, so you can write a rule
immediately after install.

Two hard limits:

1. **Data lives on the local disk of one Center process.** With several replicas each holds a
   fragment — so **high availability means turning it off**.
2. **It suits small scale**, roughly under 100k active series. Past that, use an external store.

## When to switch, and how

Switch when any of these becomes true:

- you want several Center instances for high availability;
- active series are heading past 100k;
- you need retention beyond what the embedded store keeps, or the same metrics have to be shared
  with another system.

The switch is a **dual write**, with no downtime:

```toml
# add the external store first; both are written
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"

# once the external store has enough history, turn the embedded one off
[EmbeddedTSDB]
Enable = false
```

The embedded store and `Pushgw.Writers` can be active at the same time — that overlap is the
migration window. See [External TSDB and dual-write migration](../install/external-tsdb.md).

## Note: edge / alert / pushgw ignore this section

`[EmbeddedTSDB]` **is handled by the Center process only**. `n9e-edge`, `n9e-alert` and
`n9e-pushgw` read the same `etc` directory but ignore it.

## Related

- [Embedded TSDB for onboarding and small scale](../install/embedded-tsdb.md)
- [Embedded TSDB single-Center limits](../operations/embedded-tsdb-limits.md)
- [Choosing a metadata database](../install/databases.md)
