---
title: "Embedded TSDB single-Center limits"
sidebar_label: "Embedded TSDB single-Center limits"
description: "The embedded store lives inside one Center process: what that rules out and when to move off it."
last_reviewed: 2026-10-10
---

The embedded store lets you get charts and alerts with zero extra dependencies, at the cost of being
tied to one process. This page spells out what "tied to one process" excludes, so you know when you
have to move off it.

## It is a Prometheus TSDB inside the process

With `[EmbeddedTSDB] Enable = true`, Center opens a Prometheus tsdb storage engine and a promql
engine inside itself, keeping data in the directory given by `Dir`:

```toml
[EmbeddedTSDB]
Enable = true
Dir = "data/tsdb"
RetentionDuration = "15d"
MaxBytes = "10GiB"
OutOfOrderTimeWindow = "10m"
```

The query endpoints are mounted at `/prometheus/api/v1/*` and are compatible with the Prometheus
HTTP API (`query`, `query_range`, `series`, `labels`, `label/<name>/values`, `status/buildinfo`). At
startup a Prometheus-type data source named `embedded-tsdb` is auto-registered pointing at them.

`RetentionDuration` and `MaxBytes` are **two independent ceilings; whichever is hit first starts
deleting the oldest blocks**. Leaving `MaxBytes` empty or `0` means no disk limit — and a full disk
means a process that cannot write.

## Limit one: exactly one Center instance

The data is on **that one process's local disk**. Two Center replicas means two half-datasets, and
the replicas also overwrite each other's auto-registered data source URL. Which replica a query
lands on is arbitrary, so an arbitrary half is missing — **with no error**, just a gap in the chart
and half the rules evaluating against nothing.

Center logs a warning at startup when it detects other active instances in the same engine cluster.
That log line is the only hint you get; it is not repeated.

So this limit rules out:

- multi-instance high availability (see [High availability and failure domains](./high-availability.md));
- running Center as a multi-replica Deployment on Kubernetes;
- rolling restarts behind a load balancer without losing queries — this data is wholly unavailable
  while that process is down.

## Limit two: local-only access by default

With neither `BasicAuthUser` / `BasicAuthPass` nor `DatasourceUrl` configured,
`/prometheus/api/v1/*` **only accepts requests from the host itself**; everything else gets a 403:

```
embedded tsdb endpoints only accept requests from the n9e host by default;
set EmbeddedTSDB.BasicAuthUser/BasicAuthPass (or DatasourceUrl) to allow remote access
```

That is the safe default: these endpoints offer both "read every metric" and "write without
authentication", which should not be open to the whole network with zero configuration.

To let `n9e-edge`, Grafana or another collector read and write it directly, say so explicitly:

```toml
[EmbeddedTSDB]
BasicAuthUser = "n9e"
BasicAuthPass = "<password>"
# when a VIP or domain fronts this instance, point the auto-registered data source at it
# DatasourceUrl = "http://n9e-vip:17000/prometheus"
```

Once set, the auto-registered data source URL switches from `127.0.0.1` to the detected host IP.

## Limit three: no online backup, and no replica

There is no Prometheus snapshot endpoint. Keeping a copy means stopping the process and copying the
`data/tsdb` directory — see [Backup and restore](./backup-restore.md). The destructive
`delete_series` / `clean_tombstones` endpoints are not even registered by default; using them means
setting `EnableAdminAPI = true`, and configuring basic auth first.

## When to move off it

Any one of these is enough:

| Signal | How to check |
|---|---|
| You want several Center instances for HA | Hard requirement, no middle ground |
| Active series heading past 100k | `curl --noproxy '*' http://n9e:17000/metrics \| grep prometheus_tsdb_head_series` |
| Block size approaching `MaxBytes` | Same endpoint, `prometheus_tsdb_storage_blocks_bytes` |
| You need more history than `RetentionDuration` | A requirement, not a metric |
| The metrics have to be shared with another system | A requirement, not a metric |

`prometheus_tsdb_head_series` is the real count of currently active series, and the most reliable of
these signals.

## How to move: dual write

The embedded store and `[[Pushgw.Writers]]` **can be active at the same time**. That overlap is the
migration window, and there is no downtime.

```toml
# step one: add the external store, write to both
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"
```

Restart, then confirm on the metrics page that the new data source returns data. Once the external
store holds as much history as you need — usually the old `RetentionDuration` — turn the embedded
one off:

```toml
# step two: turn the embedded store off
[EmbeddedTSDB]
Enable = false
```

The `embedded-tsdb` data source stays in the list afterwards but returns nothing. **Repoint your
dashboards and alert rules at the new data source before you turn it off**, or they will silently
find no data.

## Related

- [Embedded TSDB and external storage](../concepts/storage.md)
- [External TSDB and dual-write migration](../install/external-tsdb.md)
- [High availability and failure domains](./high-availability.md)
- [Backup and restore](./backup-restore.md)
