# System architecture

The core is one n9e process: no dependencies for testing, MySQL and Redis for production, several instances sharing them for a cluster, and n9e-edge for multi-site.

Last reviewed 2026-10-11

The architecture is small: **one `n9e` process is the whole core**. For testing it runs with no dependencies at all; production adds MySQL and Redis. Multi-site deployments with unreliable links have a separate edge mode.

## What one process does[​](#what-one-process-does "Direct link to What one process does")

```
        ┌──────────────────────────── n9e ────────────────────────────┐

        │  Web / API   rule evaluation   Pushgw   notification   MCP  │

        └──┬───────────────┬──────────────┬────────────────┬──────────┘

           │               │              │                │

    browser / API     data sources      TSDB            channels

                     Prometheus …   (external or built in)  DingTalk / …

                           │

                     MySQL + Redis

                   (metadata, coordination)
```

The `n9e` process only needs the `etc/` and `integrations/` directories next to the binary. Everything else is optional.

## Three sizes[​](#three-sizes "Direct link to Three sizes")

### Single node, testing[​](#single-node-testing "Direct link to Single node, testing")

Download a release, run `./n9e`. Port 17000, `root` / `root.2020`.

Metadata goes into `n9e.db` (SQLite) next to the binary, Redis is an in-process miniredis, and metrics land in the embedded TSDB. **Convenient, but not for production** — see the [Production readiness checklist](https://n9e.github.io/docs/get-started/production-checklist.md).

### Single node, production[​](#single-node-production "Direct link to Single node, production")

Edit `etc/config.toml` to move metadata to MySQL or PostgreSQL and use a real Redis:

```
[DB]

DBType = "mysql"

DSN = "root:<password>@tcp(localhost:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"



[Redis]

RedisType = "standalone"

Address = "127.0.0.1:6379"
```

The database is conventionally called `n9e_v6` — the name has been carried since v6 and the schema scripts still use it.

### Cluster[​](#cluster "Direct link to Cluster")

Run `n9e` on several hosts with **identical configuration**, sharing one MySQL and one Redis. That is the whole cluster setup.

Alert rules are distributed across the instances automatically: 100 rules and 2 instances means roughly 50 each, and **a rule only ever runs on one instance**, so no duplicate alerts. If an instance dies, another takes over its rules.

Note that a cluster **must turn off the embedded TSDB**. Its data sits on one process's local disk, so with several instances each one holds a fragment.

## Whether data flows through Nightingale[​](#whether-data-flows-through-nightingale "Direct link to Whether data flows through Nightingale")

These are two genuinely different shapes, and the choice decides which features you get.

|                   | Data does not flow through  | Data flows through                         |
| ----------------- | --------------------------- | ------------------------------------------ |
| Collection        | Your own Prometheus scrapes | Categraf remote-writes to Nightingale      |
| Nightingale's job | Query the TSDB              | Receive, then forward per `Pushgw.Writers` |
| Host list         | Empty                       | Populated, groupable, taggable             |
| Self-healing      | Unavailable                 | Available                                  |
| Alert rules       | Fully available             | Fully available                            |

Nightingale is not a long-term metric store. The embedded TSDB is the deliberate exception — see [Storage](https://n9e.github.io/docs/concepts/storage.md).

## Edge mode[​](#edge-mode "Direct link to Edge mode")

With several sites, having the central `n9e` query a remote site's TSDB makes alerting only as reliable as that link — and sometimes the centre cannot reach the remote store at all.

Deploy `n9e-edge` at the site instead: rules are still managed centrally and pushed down, but **evaluation happens locally** against the site's own TSDB. When the link drops, the edge keeps alerting.

See [Edge data centers](https://n9e.github.io/docs/install/edge.md).

## Related[​](#related "Direct link to Related")

* What each process is responsible for: [Components](https://n9e.github.io/docs/concepts/components.md)
* Where metadata lives and where metrics live: [Storage](https://n9e.github.io/docs/concepts/storage.md)
* Choosing a deployment: [Install and deploy](https://n9e.github.io/docs/install/overview.md)
