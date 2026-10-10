---
title: "Enable the MCP endpoint"
sidebar_label: "Enable the MCP endpoint"
description: "The /mcp endpoint is built into the n9e process and on by default; list its tools with curl to confirm it is up, and restrict which toolsets it exposes in config."
---

Where this page ends: a `/mcp` endpoint you have verified with curl and that lists its tools, plus
a config that says explicitly which toolsets it exposes.

## It is on by default

The `n9e` process is itself the MCP server — there is no second component to deploy. Both switches
under `[HTTP.A2A]` default to `false`:

```toml
[HTTP.A2A]
# Disable = false     # true closes /a2a and /mcp entirely, agent card included
# DisableMCP = false  # true closes only /mcp and keeps /a2a
```

The whole section is commented out in `etc/config.toml`, which is to say **you change nothing**.

The prerequisite is `[HTTP.TokenAuth]` being enabled (it is by default). With it off, `/mcp`
rejects every request and the startup log carries an `[A2A] HTTP.TokenAuth.Enable=false` warning.

## Which transport it speaks

**MCP Streamable HTTP, in stateless mode.** Not the older two-endpoint SSE transport, and not stdio.

| Fact | Value |
|---|---|
| Endpoint | `POST /mcp` — root path, **not** under the `/api/n9e` prefix |
| Required headers | `Content-Type: application/json` and `Accept: application/json, text/event-stream` |
| Auth | `X-User-Token`, or OAuth `Authorization: Bearer` |
| `GET /mcp` | 405 with `Allow: POST` — stateless mode offers no standalone SSE stream |
| `Mcp-Session-Id` | Returned on the initialize response, but **never validated**; later requests may omit it |
| serverInfo | `Nightingale MCP Server` / `1.0.0` |

Stateless means every POST is self-contained, so several instances behind a load balancer need
**no sticky sessions**.

## Check that it is up

Generate a token first under **Profile → Token management** (see
[Personal token authentication](./token-auth.md)), then:

```bash
curl -s -X POST http://127.0.0.1:17000/mcp \
  -H 'X-User-Token: YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
        "protocolVersion":"2025-06-18","capabilities":{},
        "clientInfo":{"name":"curl","version":"1"}}}'
```

Expected result: an `event: message` line followed by a `data:` line whose `serverInfo.name` is
`Nightingale MCP Server`, and an `Mcp-Session-Id` response header.

Without a token you get **401 and the plain-text body `unauthorized`** — not JSON, so do not parse
it for an `err` field.

Once you have the session id, send `notifications/initialized` (answered with 202), then
`{"jsonrpc":"2.0","id":2,"method":"tools/list"}`. Under the default config that returns
**42 read-only tools**.

## Expose only some toolsets

Empty means all default toolsets. To narrow it, list them explicitly:

```toml
[HTTP.A2A]
MCPToolsets = ["alerts", "dashboards"]
```

There are 13 valid names: `alerts`, `targets`, `datasource`, `mutes`, `busi_groups`,
`notify_rules`, `alert_subscribes`, `event_pipelines`, `users`, `metrics`, `logs`, `dashboards`,
`roles`.

A misspelled name is dropped with an `[MCP] ignoring unknown toolset` warning; it does **not** fall
back to "everything". A whitelist made entirely of typos yields zero tools, not 74. What each
toolset covers is in [Read and write toolsets](./toolsets.md).

## Behind a reverse proxy

`/mcp` sits at the root path, so an nginx that only forwards `/api/n9e/*` cannot reach it:

```nginx
location /mcp {
    proxy_pass http://127.0.0.1:17000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    proxy_buffering off;        # without this, streaming answers never emit anything
    proxy_read_timeout 3600s;   # a single question running for minutes is normal
    proxy_send_timeout 3600s;
}
```

Do not skip `proxy_set_header Host`: the SDK ships DNS-rebinding protection and answers 403 when
the connection is local but the `Host` header is not.

Set `BaseURL` explicitly as well, otherwise the address advertised in the agent card is guessed
from request headers and a third party may end up with an internal one:

```toml
[HTTP.A2A]
BaseURL = "https://n9e.example.com"
```

## Turning it off

```toml
[HTTP.A2A]
DisableMCP = true   # MCP only
# Disable = true    # /a2a and the agent card too
```

Restart center for either to take effect.

## Next

- Create a token and understand whom it speaks for: [Personal token authentication](./token-auth.md)
- Connect a client: [Connect Claude Code / Cursor / other clients](./mcp-clients.md)
- Turn write tools on: [Enable write tools safely](./write-tools.md)
