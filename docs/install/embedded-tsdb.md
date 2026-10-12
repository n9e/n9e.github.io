---
title: "Embedded TSDB for onboarding and small scale"
sidebar_label: "Embedded TSDB for onboarding and small scale"
description: "Use the built-in store to get going with zero extra components; retention, capacity and the single-Center constraint."
last_reviewed: 2026-10-10
---

The embedded time-series store is **on by default**, so charts and alert rules work straight after
install with nothing else configured. This page is about tuning its retention and capacity, and
about where it stops being the right answer.

## It is already running

```toml
[EmbeddedTSDB]
Enable = true
Dir = "data/tsdb"
RetentionDuration = "15d"
MaxBytes = "10GiB"
```

At startup it does two things: creates `data/tsdb` under the working directory, and
**auto-registers a Prometheus-type data source named `embedded-tsdb`**.

Pick that data source under **Explorer → Metrics**, query `up`, and getting points back confirms the
write path works. Metrics that Categraf remote-writes land here with no forwarding to configure.

## Retention and capacity

```toml
[EmbeddedTSDB]
RetentionDuration = "30d"   # forms like 12h / 7d / 15d
MaxBytes = "50GiB"          # empty or 0 means unlimited
```

The two limits are an **or**: samples past the retention window are deleted, and so are the oldest
blocks once disk usage passes `MaxBytes`. A `MaxBytes` that is too small therefore shortens the
effective retention below `RetentionDuration`, silently.

Set `MaxBytes` to something the disk can absorb, then watch how large `data/tsdb` actually grows.
That beats trying to compute a series count up front.

Two others you may occasionally touch:

- `OutOfOrderTimeWindow` (`10m`) — tolerance for collector clock skew and resends; samples outside
  the window are dropped;
- `QueryMaxSamples` and `QueryTimeout` — read-side limits, worth raising only when dashboards
  span very long ranges.

Restart `n9e` for changes to take effect.

## By default it only accepts local requests

The `/prometheus/api/v1/*` endpoints — both query and remote write — **only accept requests from the
local machine** by default, which is why the auto-registered data source points at
`http://127.0.0.1:17000/prometheus`.

To let Grafana, `n9e-edge` or another agent read from or write to it directly, configure
credentials:

```toml
[EmbeddedTSDB]
BasicAuthUser = "n9e"
BasicAuthPass = "<password>"
```

Setting them lifts the local-only restriction, and the auto-registered data source URL switches from
`127.0.0.1` to the detected host IP. If there is a VIP or a domain in front, name it with
`DatasourceUrl` — setting that lifts the restriction as well.

## When to stop using it

Three hard boundaries; hitting any one of them means moving to an external store:

1. **The data lives on the local disk of one Center process.** With several instances each holds a
   fragment and query results go silently incomplete — so **high availability means turning it
   off**.
2. **Only the Center process handles this section.** `n9e-edge`, `n9e-alert` and `n9e-pushgw` read
   the same `etc` directory but ignore `[EmbeddedTSDB]`, and say so at startup.
3. **It suits roughly 100k active series or fewer.** Past that, query latency and memory use become
   noticeable.

One more thing that is not a limit but is worth knowing: this data has no replica. If the machine
dies it is gone, and whether that matters depends on whether you still rely on that history.

## Next

- [External TSDB and dual-write migration](./external-tsdb.md) — moving without downtime
- [Auto-registered Embedded TSDB datasource](../data/embedded-tsdb.md) — using it from the UI
- [Embedded TSDB and external storage](../concepts/storage.md) — which data lives where
