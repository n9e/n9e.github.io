---
title: "VictoriaMetrics"
sidebar_label: "VictoriaMetrics"
description: "There is no separate VictoriaMetrics type: register it as Prometheus and set the TSDB type to VictoriaMetrics; single-node and cluster endpoints differ."
last_reviewed: 2026-10-10
---

To save you hunting through the type list: **the open-source edition has no "VictoriaMetrics" data
source type.** VictoriaMetrics implements Prometheus's query API, so you register it under the
**Prometheus** type and then set **Time series database type** to `VictoriaMetrics` in the same form.

This page covers three things: which URL to use for single-node versus cluster, what that
**Time series database type** setting actually changes, and how to configure the write path when
Nightingale is pushing samples into VictoriaMetrics itself.

## Single-node and cluster endpoints differ

Cluster VictoriaMetrics splits reads and writes across two components with completely different
addresses. Getting this wrong produces the classic "it connects but returns nothing".

| Purpose | Single-node | Cluster |
|---|---|---|
| Data source **URL** (query, vmselect) | `http://{vm}:8428/` | `http://{vmselect}:8481/select/0/prometheus/` |
| Write endpoint (vminsert) | `http://{vm}:8428/api/v1/write` | `http://{vminsert}:8480/insert/0/prometheus/api/v1/write` |

The `0` in the cluster path is the tenant ID (`accountID`). In a multi-tenant setup, register one
data source per tenant with its own ID in the path.

Every other field behaves exactly as described in [Prometheus](./prometheus.md): name, timeout,
user and password, skip SSL verify, custom HTTP headers.

## Set the time series database type

The **Time series database type** dropdown at the bottom of the form should be set to
`VictoriaMetrics`. It does not change the query itself, but it changes two behaviours:

- **Dashboard variables.** For a `label_values(metric, label)` variable over a window shorter than
  a day, values are resolved through a different series endpoint. VictoriaMetrics makes samples
  visible slightly later than Prometheus does, and without this the dropdown is frequently empty
  for short ranges;
- **Delete series.** Nightingale issues the request in VictoriaMetrics's shape; for a cluster URL
  containing `/select/<tenant>/prometheus` it rewrites the path to
  `/delete/<tenant>/prometheus/...` automatically.

Leaving it on `Prometheus` is not an error — those two things simply happen the Prometheus way.

## When Nightingale also writes to it

Everything above is the **read** path. If Categraf pushes metrics to Nightingale and Nightingale
forwards them to VictoriaMetrics, there is a **write** path too, and it lives in the config file,
not in the data source form:

```toml
[Pushgw]
# use target labels stored in the database instead of those on the series
LabelRewrite = true
ForceUseServerTS = true

[[Pushgw.Writers]]
# single-node
Url = "http://victoriametrics:8428/api/v1/write"
# cluster
# Url = "http://vminsert:8480/insert/0/prometheus/api/v1/write"
# BasicAuthUser = ""
# BasicAuthPass = ""
# Timeout = 10000
```

Two settings are easy to confuse, so remember this: **the data source URL points at vmselect,
`Pushgw.Writers` points at vminsert.** The **Remote Write URL** field in the data source form is a
third, unrelated thing — it is only where [recording rules](../query/recording-rules.md) write
their results back, and has nothing to do with the Categraf data flow.

`[[Pushgw.Writers]]` can run at the same time as [`[EmbeddedTSDB]`](./embedded-tsdb.md), writing to
both. That overlap is the migration window from the embedded store to VictoriaMetrics — see
[External TSDB and dual-write migration](../install/external-tsdb.md).

## Verify

1. Click **Save & test**. Nightingale issues one `<URL>/api/v1/query?query=1%2B1`, and only stores
   the record if it succeeds. A 404 on a cluster almost always means the URL is missing the
   `/select/0/prometheus/` segment;
2. **Explorer → Metrics**, select this source, and run `up` or any metric you know exists. A line
   on the chart is what you are after;
3. If Nightingale is doing the writing: wait one collection interval (Categraf defaults to 15s),
   then query `cpu_usage_active`. Getting data back means the write path works too.

## Next

- Write the first rule against it: [Your first alert rule](../alerting/first-rule.md)
- Migrating off the embedded store: [External TSDB and dual-write migration](../install/external-tsdb.md)
- Field-by-field walkthrough of the form: [Prometheus](./prometheus.md)
