---
title: "Production topology"
sidebar_label: "Production topology"
description: "Reference layouts for one team, one company, and multi-site with edge alerting."
---

Three sizes, three deployment pictures. Pick the one closest to where you are and copy it; there is
no need to design a topology from scratch.

## One team: a single host

One group, tens of machines, and alerting being down for a few minutes is survivable — a single
`n9e` on one host is enough.

```
      categraf ──► n9e (17000) ──► embedded TSDB (local disk)
                     │
                 MySQL + Redis
```

- switch `[DB]` to MySQL or PostgreSQL and `[Redis]` to `standalone`: the defaults, SQLite and
  miniredis, live inside the process, so the data goes when the process goes;
- leave `[EmbeddedTSDB]` on and set `RetentionDuration` to however much history you want;
- backup is one line: `mysqldump` plus the `etc/` directory.

Be honest about the cost: **that host is a single point of failure**. While the process is down or
the machine is rebooting, nothing is evaluated and nothing is delivered.

## One company: two or three `n9e` plus an external TSDB

Once alerting is treated as infrastructure, the single point above is the first thing to remove.

```
                    ┌── n9e #1 ─┐
   browsers/agents ►│   n9e #2  │──► VictoriaMetrics / Prometheus
        (LB)        └── n9e #3 ─┘
                          │
                    MySQL + Redis (make these HA too)
```

A cluster needs no extra component: **run several `n9e` processes with identical config, sharing one
MySQL and one Redis**. Alert rules distribute themselves — a rule runs on exactly one instance, and
another instance takes over the rules of one that dies.

Three things must change:

```toml
# 1. turn off the embedded TSDB — its data is on one process's local disk,
#    so with several replicas each holds a fragment
[EmbeddedTSDB]
Enable = false

# 2. point at an external store
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"

# 3. database and Redis must be one shared set every instance can reach
[DB]
DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
[Redis]
RedisType = "standalone"
Address = "redis:6379"
```

Port 17000 is what sits behind the load balancer. Note that **ingest and admin share that port**
(`/prometheus/v1/write`, `/v1/n9e/heartbeat` and the web UI are all on 17000), so "just expose
17000" is not a network plan.

## Multiple sites: centre plus edge

With several sites on links that are not entirely reliable, having the centre query a remote site's
TSDB makes alerting exactly as reliable as that link — when it breaks, the site loses alerting
altogether.

```
   central site                     edge site A
   ┌──────────────┐                 ┌──────────────────────────┐
   │ n9e × N      │◄── pull config ─│ n9e-edge (19000)         │
   │ MySQL/Redis  │                 │ local Redis + local TSDB │
   └──────────────┘                 └──────────────────────────┘
```

`n9e-edge` runs at the remote site. Rules are still managed centrally and pushed down, but
**querying and evaluation happen locally**. When the link drops, the edge keeps evaluating and keeps
notifying.

Points to get right:

- the centre needs `[HTTP.APIForService] Enable = true`; that is how the edge pulls config;
- the edge **needs its own Redis** — it cannot reuse the one at the centre;
- start it against the right config directory: `n9e-edge --configs etc/edge`. The default `etc`
  holds the central config, and pointing at it fails silently rather than loudly.

See [Edge data centers](../install/edge.md) and
[Edge network partition behavior](./edge-partition.md).

## When splitting processes is worth it

`n9e` already contains the evaluation engine and Pushgw; `n9e-alert` and `n9e-pushgw` are a
**performance option, not a required step**.

| Symptom | What to split out |
|---|---|
| Web UI is slow, evaluation is on time | Do not split yet — check whether data source queries are slow |
| Evaluation is late and the UI is slow too | `n9e-alert`, so evaluation stops competing with the web tier for CPU |
| Write volume saturates the process and evaluation suffers | `n9e-pushgw` |
| One site's data cannot be queried reliably | `n9e-edge` — that is a topology change, not tuning |

Starting with three processes only gives you two more config files to keep in sync.

## What each tier needs

| | One team | One company | Multi-site |
|---|---|---|---|
| `n9e` instances | 1 | 2–3 | 2–3 central plus one edge per site |
| Metadata database | Single MySQL/PostgreSQL | MySQL with a replica | Same |
| Redis | Single | Sentinel or cluster | One central, one per edge site |
| TSDB | Embedded | External (VictoriaMetrics, …) | One central, one local per site |
| Load balancer | Not needed | Needed | Needed at the centre |

## Related

- [High availability and failure domains](./high-availability.md)
- [Capacity planning](./capacity.md)
- [Processes and roles](../concepts/components.md)
- [Production readiness checklist](../get-started/production-checklist.md)
