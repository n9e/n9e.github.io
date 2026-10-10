---
title: "Network and TLS hardening"
sidebar_label: "Network and TLS hardening"
description: "Terminate TLS, restrict the write endpoints, and which ports must not face the internet."
---

Where this page ends: a network plan you can turn straight into firewall rules and gateway
configuration, plus a list of what the default configuration hands out without a login — because
the second decides how much of the first you can skip.

## What is on port 17000

In one word: **everything**. The web UI, `/api/n9e/*`, four protocols' worth of write endpoints,
collector heartbeats, the embedded TSDB's query interface, `/mcp` and `/a2a`, and `/metrics` all
share the port. The itemised list is in [Ports and network flows](../reference/ports.md).

Two other ports exist: 19000 for `n9e-edge`, and 20090 for ibex self-healing (gRPC). Both are
site-internal only.

Because write endpoints and admin endpoints share one port, **"expose 17000" is not an option**.
Either put the whole thing behind a gateway that splits by path, or separate the collector network
from the user network.

## What an unauthenticated caller gets by default

Run this check before deciding how to divide the network. Both switches under
`[Center.AnonymousAccess]` **default to `true`**:

```toml
[Center.AnonymousAccess]
PromQuerier = true
AlertDetail = true
```

With `PromQuerier = true`, the following endpoints carry **no authentication middleware at all**:
the data source pass-through proxy `/api/n9e/proxy/:id/*`, `/v2/query-batch`, `/ds-query`,
`/logs-query`, `/datasource/brief`, and the metadata endpoints for Elasticsearch, Loki, TDengine,
IoTDB and VictoriaLogs. Check it for yourself:

```bash
curl https://<your-nightingale>/api/n9e/datasource/brief
```

Expected result: **200 and the site-wide data source list**, with no credential supplied.
Passwords, certificates and headers are redacted, but names, types and connection addresses remain
— and more importantly the proxy endpoint sits in the same batch of routes, so anyone who can reach
this port can run queries against your data sources.

`AlertDetail = true` does the same for alert event details, which open anonymously.

Both switches exist to serve the ad-hoc chart share link and event detail sharing. So there are
only two honest positions: **turn them off, or design the network as though 17000 were public.**
Turning them off leaves dashboard time-limited share links working — that path uses a separate
board-scoped token and does not depend on these switches. Only the `/chart/<id>` style temporary
chart link breaks (see [Anonymous time-limited sharing](../query/sharing.md)).

## 1. Terminate TLS on Nightingale itself

Set **both** `CertFile` and `KeyFile` under `[HTTP]`. The port stays the same; the protocol becomes
HTTPS:

```toml
[HTTP]
Host = "0.0.0.0"
Port = 17000
CertFile = "/etc/n9e/tls/server.crt"
KeyFile = "/etc/n9e/tls/server.key"
```

The minimum version is TLS 1.2, fixed in code. Setting only one of the two is the same as setting
neither — the process serves plaintext as usual.

Expected result: after a restart, `curl -I https://<your-nightingale>/ping` returns 200, and plain
HTTP against the same address is no longer served.

Certificates are read when the process starts, so **replacing them requires a restart**; there is
no hot reload. `n9e-edge` has the same pair of fields in `etc/edge/edge.toml`.

After switching to HTTPS, these addresses have to follow: the collectors' write address,
`[[Pushgw.Writers]] Url`, and the auto-registered data source of the embedded TSDB.

## 2. Put it behind a gateway and split by path

More common than terminating TLS in-process is fronting it with a gateway, which also lets you
split traffic by path:

| Path | Audience |
|---|---|
| `/`, `/api/n9e/*` | People |
| `/prometheus/v1/write`, `/opentsdb/put`, `/openfalcon/push`, `/datadog/api/v1/series`, `/v1/n9e/heartbeat` | Collectors |
| `/mcp`, `/a2a` | AI clients |
| `/metrics`, `/api/debug/pprof/*` | Internal self-monitoring only |

To hand authentication to the gateway as well, use `[HTTP.ProxyAuth]`: the gateway authenticates
and passes the username in a header, and an account is created on first arrival with
`DefaultRoles`.

```toml
[HTTP.ProxyAuth]
Enable = true
HeaderUserNameKey = "X-User-Name"
DefaultRoles = ["Standard"]
```

Accept two consequences before turning it on:

- **It disables JWT login entirely.** There is no mixed mode — either everything goes through the
  gateway, or everything goes through Nightingale's own login page.
- **Anyone who can bypass the gateway, reach 17000 directly and set that header *is* that user.**
  So this switch only holds up if 17000 is reachable from the gateway and nowhere else — enforce
  that with a firewall, or change `[HTTP] Host` from `0.0.0.0` to an address only the gateway can
  reach.

## 3. Authenticate the collector write path

`[HTTP.APIForAgent] Enable = true` is the default, and the `BasicAuth` lines below it **are
commented out by default**. Heartbeat and write endpoints therefore work out of the box with no
credential at all.

```toml
[HTTP.APIForAgent]
Enable = true
[HTTP.APIForAgent.BasicAuth]
n9e-agent = "<a passphrase you generate>"
```

Every collector has to be updated with the same credential afterwards, or all heartbeats stop. The
rotation order is in [Tokens and credential rotation](./tokens.md).

`[HTTP.APIForService]` is a separate set, and **defaults to `Enable = false`**. While it is off the
entire `/v1/n9e` route group is never mounted, which is why the sample credentials shipped in the
config file are currently inert. Edge mode, a standalone alert process and variable decryption all
need it on — replace those sample credentials before you turn it on.

## 4. The embedded TSDB's /prometheus endpoint

`/prometheus/api/v1/*` serves both queries and **writes** (remote write). By default it accepts
requests from the local machine only, and the condition for that is `BasicAuthUser` and
`DatasourceUrl` **both being empty**:

```toml
[EmbeddedTSDB]
BasicAuthUser = ""
BasicAuthPass = ""
# DatasourceUrl = ""
# EnableAdminAPI = false
```

Setting **either one** lifts the local-only restriction. This is the trap: `DatasourceUrl` is meant
for pointing the auto-registered data source at a VIP or domain name, but setting it also **opens
these endpoints to the whole network**. `DatasourceUrl` without basic auth amounts to
unauthenticated metric reads and sample injection for anyone. If you need remote access, configure
`BasicAuthUser` / `BasicAuthPass` alongside it.

`EnableAdminAPI` defaults to false; turning it on registers `delete_series` and
`clean_tombstones` — configure basic auth first.

## 5. Turn off what you do not intend to expose

| Setting | Default | What to do |
|---|---|---|
| `[HTTP] PProf` | `true` | `/api/debug/pprof/*` hands out heap and goroutine dumps. Turn it off on externally reachable instances, or block it at the gateway |
| `[HTTP] ExposeMetrics` | `true` | `/metrics`. Keep it for self-monitoring, keep it off the internet |
| `[Center.AnonymousAccess]` | both `true` | See the second section of this page |
| `[HTTP.A2A] MCPEnableWriteTools` | `false` | Leave it false and `/mcp` registers read-only tools only |
| `[HTTP.JWTAuth] AccessExpired` | `1500` (minutes, 25 h) | Session lifetime; shorten it in sensitive environments |
| `[HTTP.JWTAuth] RefreshExpired` | `10080` (minutes, 7 days) | The same |
| `[HTTP.ShowCaptcha] Enable` | `false` | Login page captcha. Turn it on when the login page is externally reachable |

The outbound connections (database, Redis, data sources, notification media, LLM provider) are
listed in [Ports and network flows](../reference/ports.md); write egress rules from that table.
Redis and `[[Pushgw.Writers]]` each carry their own TLS options, which matter across sites.

## Next

- The complete port and flow tables: [Ports and network flows](../reference/ports.md)
- Turning config-file credentials into ciphertext: [Secret management](./secrets.md)
- A pass over everything before going live: [Security checklist](./checklist.md)
