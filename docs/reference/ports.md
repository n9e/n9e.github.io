---
title: "Ports and network flows"
sidebar_label: "Ports and network flows"
description: "Every listening port and every outbound connection, so a firewall rule set can be written from one table."
last_reviewed: 2026-10-10
---

## Listening (inbound)

| Port | Process | Config key | Who connects |
|---|---|---|---|
| 17000 | `n9e` (Center) | `[HTTP] Port` | Browsers, API clients, MCP clients, Categraf |
| 19000 | `n9e-edge` | `[HTTP] Port` in `etc/edge/edge.toml` | Browsers and collectors at that site |
| 20090 | ibex, in `n9e` / `n9e-edge` | `[Ibex] RPCListen` | Categraf's self-healing agent |

## What is on 17000

**Write endpoints and the admin UI share the port**, which is the single most important fact when
locking down the network:

| Path | Purpose | Who should reach it |
|---|---|---|
| `/` | Web UI | People |
| `/api/n9e/*` | The API the frontend runs on | People, automation |
| `/prometheus/v1/write` | Prometheus Remote Write ingest | Collectors |
| `/opentsdb/put` | OpenTSDB protocol ingest | Collectors |
| `/openfalcon/push` | Open-Falcon protocol ingest | Collectors |
| `/datadog/api/v1/series` | Datadog Agent ingest | Collectors |
| `/v1/n9e/heartbeat` | Collector heartbeat | Collectors |
| `/prometheus` | Query endpoint of the embedded TSDB | Nightingale itself (localhost only by default) |
| `/mcp`, `/a2a` | MCP / A2A endpoints | AI clients |
| `/metrics` | Its own metrics | Your monitoring |

So **"just expose 17000" is not an answer**. Either put the whole thing behind a gateway that
splits by path, or separate the collector network from the user network. See
[Network and TLS hardening](../security/network-tls.md).

## Outbound

| Target | Address from | When needed |
|---|---|---|
| MySQL / PostgreSQL | `[DB] DSN` | Production (not needed while on SQLite) |
| Redis | `[Redis] Address` | Production (not needed while on miniredis) |
| Data sources | The data source's own config | Every evaluation, every query |
| External TSDB | `[[Pushgw.Writers]] Url` | With the embedded TSDB off, or during a dual write |
| Notification media | The media type's URL / SMTP server | Every notification |
| LLM provider | The LLM config's API URL | When using Nightingale AI |

## Edge mode

`n9e-edge` needs to reach the centre's 17000 to pull rule configuration, and the centre needs
`[HTTP.APIForService] Enable = true`. The rest of the edge flows are in
[Edge data centers](../install/edge.md).

## Related

- [Configuration reference](./configuration.md)
- [Network and TLS hardening](../security/network-tls.md)
- [Production topology](../operations/topology.md)
