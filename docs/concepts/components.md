---
title: "Center, Alert, Edge, Pushgw and Categraf"
sidebar_label: "Processes and roles"
description: "Most deployments need only the n9e process; n9e-alert and n9e-pushgw are roles that can be split out, n9e-edge serves multi-site setups, Categraf collects on hosts."
last_reviewed: 2026-10-10
---

A Nightingale release ships several binaries, but **most deployments need exactly one**. This page
sorts out which is which.

## One line each

| Process | Responsible for | When you deploy it separately |
|---|---|---|
| `n9e` (Center) | Web, API, rule evaluation, data ingest, notification, MCP endpoint | Always. By default it does all of it |
| `n9e-alert` | Rule evaluation only | To take evaluation load off the web tier |
| `n9e-pushgw` | Ingest and forwarding only | When write volume needs its own scaling |
| `n9e-edge` | Local rule evaluation at a remote site | Multiple sites with an unreliable link to the centre |
| `categraf` | The collector, installed on monitored hosts | When you need host and middleware metrics |

`n9e` already contains the alert and pushgw capabilities. Splitting them out is a **performance
option, not a required step**. Starting with three processes only gives you two more config files
to keep in sync.

## Center is the default answer

The `n9e` process carries all of:

- **Web and API** — the whole UI, and the HTTP API the frontend runs on;
- **The evaluation engine** — query data sources on a schedule, decide whether a threshold is
  crossed, produce events;
- **Pushgw** — accept remote write / OpenTSDB / Datadog / Falcon writes and forward them to one or
  more TSDBs per `Pushgw.Writers`;
- **Notification** — deliver events to media types according to notification rules;
- **MCP / A2A endpoints** — `/mcp` and `/a2a`, on by default.

A cluster is just several `n9e` processes with identical config sharing MySQL and Redis; rules
distribute themselves.

## Edge is the one real architectural change

`n9e-edge` exists for a specific problem: when the central engine queries a remote site's TSDB,
alerting is only as good as that link, and a partition means no alerting at all.

Edge runs at the remote site. Rules are still managed centrally and pushed down, but querying and
evaluation happen locally. During a partition the edge keeps evaluating and keeps notifying, then
reconciles with the centre afterwards.

See [Edge data centers](../install/edge.md) and
[Edge network partition behavior](../operations/edge-partition.md).

## Categraf is the collection side

`categraf` is not part of Nightingale — it is the companion collector, with its own repository and
release cycle. It runs on monitored hosts, collects operating-system and middleware metrics, and
remote-writes them to Nightingale.

You do not have to use it. Your existing Prometheus, Telegraf, exporters and Datadog Agent can all
feed Nightingale, or Nightingale can simply query the store you already have.

## Minimal and typical deployments

**Minimal**: one `n9e`. SQLite metadata, in-process Redis, embedded TSDB. Fine to try, not for
production.

**Typical production**: two or three `n9e` + MySQL + Redis + an external TSDB (usually
VictoriaMetrics), with categraf on the monitored hosts.

**Multi-site**: that stack at the centre, plus one `n9e-edge` and a local TSDB at each site whose
link is unreliable.

## Related

- [System architecture](./architecture.md)
- [Install and deploy](../install/overview.mdx)
- [Production topology](../operations/topology.md)
