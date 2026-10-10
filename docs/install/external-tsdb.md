---
title: "External TSDB and dual-write migration"
sidebar_label: "External TSDB and dual-write migration"
description: "Move from the embedded store to Prometheus or VictoriaMetrics without a gap, using Pushgw dual write."
---

The embedded store and an external one **can be enabled at the same time**, and that overlap is the
migration window: write to both, wait until the external store holds enough history, then turn the
embedded one off. No downtime, and no gap in the charts.

## How dual write works

Samples pushed by Categraf enter the Pushgw forwarding chain and are handed to every write target.
The embedded store is just another write target on that chain — it is appended automatically at
startup. Adding an external URL under `[[Pushgw.Writers]]` therefore sends samples to both; there is
no primary/secondary relationship between two writers.

## Step 1: add the external write URL

The external store has to accept remote writes:

- **VictoriaMetrics** does out of the box, at `http://victoriametrics:8428/api/v1/write`;
- **Prometheus** needs `--web.enable-remote-write-receiver` (older versions:
  `--enable-feature=remote-write-receiver`), or writes come back 404.

```toml
# leave the embedded store on; this block is the addition
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"
# BasicAuthUser = ""
# BasicAuthPass = ""
Timeout = 10000
```

Restart `n9e`. **Expected result**: no write errors in the log, and
`curl -s http://127.0.0.1:17000/metrics | grep n9e_pushgw` shows forwarding counters climbing.

:::warning A 404 counts as a successful write
When a write target answers with a 4xx, the samples are dropped and not retried, and the only trace
is one WARNING line. So after configuring this, actually query a metric in the external store —
"the process is still up" proves nothing.
:::

## Step 2: check that both stores have data

Register the external store under **Integrations → Data sources** as a Prometheus-type source.
(VictoriaMetrics registers as `Prometheus Like`; there is no separate victoriametrics type.)

Then run the same query against `embedded-tsdb` and the new source under **Explorer → Metrics**.
**Expected result**: the new source has data from the moment dual write started and nothing before
it, and the current values match on both sides.

## Step 3: wait out the retention you need

The new store only holds data from the moment dual write began. Until it covers the history you
actually depend on, keep both: dashboards and alert rules stay on `embedded-tsdb`, and you switch to
the new source when you need the longer window.

The cost of that period is doubled write traffic and one redundant local disk.

## Step 4: turn the embedded store off

```toml
[EmbeddedTSDB]
Enable = false
```

After a restart `data/tsdb` stops growing. Once no dashboard or alert rule still points at
`embedded-tsdb`, the data source can be deleted and so can the directory.

**Expected result**: charts and alerts keep working, and the log notes that the embedded store is
not enabled.

Do not reverse the order. Turning the embedded store off before the external one is receiving leaves
a window that neither store covers.

## A fresh install straight onto an external store

With nothing to migrate, disable the embedded store and point the writer at the external one from
the start:

```toml
[EmbeddedTSDB]
Enable = false

[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"
```

No `embedded-tsdb` data source is registered in that case, so register the external store yourself
on the data sources page. Any highly available deployment has to take this route — see
[High availability](./high-availability.md).

## Next

- [VictoriaMetrics](../data/victoriametrics.md)
- [Prometheus](../data/prometheus.md)
- [Embedded TSDB and external storage](../concepts/storage.md)
