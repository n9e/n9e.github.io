---
title: "Why does MCP authentication fail?"
sidebar_label: "Why does MCP authentication fail?"
description: "MCP authentication fails at the gateway, the token check or OAuth — the status code says which; usual causes: wrong header name, expired token, bad redirect URL."
last_reviewed: 2026-10-10
---

The MCP client will not connect: it reports failure, the log says 401, or the OAuth consent page
comes back round to "not connected". This page is organised by **which layer rejected you** — each
layer answers differently, and recognising the answer saves you trying everything in turn.

The blast radius is only the client that speaks MCP; alerting and notifications are unaffected, so
there is time to do this properly. The exception is **every client breaking at once right after
`[HTTP.TokenAuth]` changed** — then also check any script calling `/api/n9e/*` with a token, because
they share the same authentication path.

## First, confirm you are actually pointed at `/mcp`

**`/mcp` is at the root path, not under the `/api/n9e` prefix.** This goes first because Nightingale
answers an unmatched `/api/n9e/*` with **200 and the frontend page**, not a 404:

```bash
curl -s --noproxy '*' -o /dev/null -w '%{http_code} %{content_type}\n' \
  http://127.0.0.1:17000/api/n9e/mcp
# 200 text/html; charset=utf-8
```

So a client configured with `/api/n9e/mcp` receives a 200 and a page of HTML, which presents as
"JSON parse failure" or "unexpected content" — **not** as an auth error. **A 200 is not evidence
that the endpoint exists.** The right address is `http://127.0.0.1:17000/mcp`, or
`https://<your-domain>/mcp` from outside.

## The status code tells you which layer rejected you

Probe with `GET /mcp`. It is not a supported method to begin with, so what comes back tells you
precisely who intercepted you first:

```bash
curl -s --noproxy '*' -i http://127.0.0.1:17000/mcp -H 'X-User-Token: <your token>'
```

| Response | Conclusion |
|---|---|
| `405 Method Not Allowed` with `Allow: POST` | **Authentication passed**; GET is simply unsupported. Address and token are both fine |
| `401 Unauthorized`, `Content-Type: text/plain`, body `unauthorized` | Authentication failed. Read on |
| `200` with HTML | Wrong address — see the section above |
| `403` mentioning Host | The reverse proxy is not forwarding the `Host` header, tripping the SDK's DNS-rebinding protection |
| Connection refused or timeout | Network or proxy; you never reached Nightingale |

**Authentication runs before the method check**, so with no token even `GET /mcp` is a 401 rather
than a 405. "405 or 401" is the fastest fork on this page.

Note the 401 body is **the plain text `unauthorized`, not JSON** — do not parse it for an `err`
field.

## Is there a `done` line in the log

The server logs a pair of lines for every `/mcp` request, and **whether the pair is complete tells
you directly whether authentication passed**:

```
INFO router/router_a2a.go:281 [MCP] start trace_id=a22235c1-... method=POST path=/mcp remote=127.0.0.1 body_len=149 body_truncated=false body={"jsonrpc":"2.0","id":1,"method":"initialize",...}
INFO router/router_a2a.go:304 [MCP] done trace_id=a22235c1-... method=POST path=/mcp user=root status=200 cost=5.51ms bytes_out=547
```

- **A `start` with no `done`** — the request was rejected at the authentication layer and never
  reached the handler. This is the cleanest test for an auth failure;
- **A `done` line** — authentication passed, and `user=` names **whom that token belongs to**. When
  the client's permissions look wrong, start here: it may have connected as an account other than
  the one you assumed.

`trace_id` joins the two. Also, the `body` on the `start` line is **only recorded when the
Content-Type is JSON**; otherwise it reads `<skipped non-json content-type=...>`, which is itself a
sign the client's Content-Type is wrong.

## Common root causes, and how to confirm each

### The token is absent, or sent on the wrong header

The header name comes from `HeaderUserTokenKey` under `[HTTP.TokenAuth]`, default `X-User-Token`. A
deployment that changed it has to change the clients too.

**When both credentials are present, `X-User-Token` wins.** The server reads that header first and
only falls back to `Authorization: Bearer` when it is empty. So a stale `X-User-Token` left in a
client's config completely masks a perfectly good Bearer token — which presents as "I re-authorized
and it is still 401".

**How to confirm**: copy the header name and token out of the client config character for character
and send the curl above by hand. If curl works, the problem is the client config; if curl fails, it
is the token or the server.

### The token is invalid, deleted, or TokenAuth is off server-side

**How to confirm**, in this order:

1. **Profile → Token management** — is the token still listed? Deletion takes effect
   **immediately**; there is no cache;
2. Does the **Last used** column update? Send a request, refresh the page. If the time does not
   move, the server never read that token at all — go back to the header name;
3. Is `[HTTP.TokenAuth]` disabled server-side? With it off, `/mcp` rejects everything, and the
   startup log carries an `[A2A] HTTP.TokenAuth.Enable=false` warning;
4. The two `[HTTP.A2A]` switches: `DisableMCP = true` closes only `/mcp`, while `Disable = true`
   closes `/a2a` and the agent card too. Test the latter with
   `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:17000/.well-known/agent-card.json`,
   which should be 200.

**How to fix**: if the token is gone, create another. **One token per purpose**, so revoking one
does not disturb anything else.

### The reverse proxy never forwards `/mcp`

`/mcp` is at the root, so an nginx that only forwards `/api/n9e/*` cannot reach it.

**How to confirm**: **bypass the proxy** and hit the backend directly. The same curl working against
`127.0.0.1:17000` but failing through the domain name is a proxy problem.

**How to fix**: add a location block, and **do not omit the `Host` header** — the SDK ships
DNS-rebinding protection and answers 403 when the connection is local but `Host` does not match:

```nginx
location /mcp {
    proxy_pass http://127.0.0.1:17000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    proxy_buffering off;        # without this, a streaming answer emits nothing at all
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

"Connects, then drops after about 60 seconds" is almost always the missing `proxy_buffering off` and
short timeouts.

### OAuth: the client cannot discover the authorization server

Hosted clients such as Claude and ChatGPT **cannot send a custom header** and therefore have to use
OAuth. They discover where to authorize from `.well-known`, and those endpoints **are a 404 when the
feature is off**:

```bash
curl -s --noproxy '*' -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:17000/.well-known/oauth-authorization-server
curl -s --noproxy '*' -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:17000/.well-known/oauth-protected-resource/mcp
```

**How to confirm**: both 404 means neither `[HTTP.MCPAuth]` nor `[HTTP.RSAuth]` is on. Neither
section **exists in `etc/config.toml`** — you add them by hand. In the same state, a 401 response
carries **no `WWW-Authenticate` header**, and since that header is exactly how a hosted client
discovers where to authorize, all it can report is "cannot connect".

**How to fix**: see [OAuth 2.1 and external identity providers](../ai/oauth.md). The proxy needs
`/oauth/` and `/.well-known/` allowed through as well as `/mcp`.

### OAuth: the address does not match `Issuer`

Authorization completes and lands back on "not connected" — usually the address fails one of three
conditions.

**How to confirm**: take the exact address the user typed into the client and check each:

1. **Can a browser reach it?** The flow really does open a login page, so it cannot be an IP,
   container name or `127.0.0.1` that only the server can resolve;
2. **Scheme, domain and port must match `Issuer` byte for byte** — with `Issuer` set to
   `https://n9e.example.com`, you cannot type `http://` or append a port;
3. **It must be HTTPS** — most clients refuse an `http://` remote address on security grounds
   (`localhost` for local debugging excepted).

In a multi-instance deployment (several centers behind a load balancer) **`Issuer` must be set
explicitly**, or each instance guesses its own and the client sees inconsistent answers.

**How to fix**: set `Issuer` to the address the user's browser actually reaches, restart center, and
have the client authorize again.

## Confirming the fix

1. Send one `initialize` by hand, with exactly the address and credential from the client config:

   ```bash
   curl -s --noproxy '*' -X POST http://127.0.0.1:17000/mcp \
     -H 'X-User-Token: <your token>' \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{
           "protocolVersion":"2025-06-18","capabilities":{},
           "clientInfo":{"name":"curl","version":"1"}}}'
   ```

   **Expected result**: an `event: message` line and a `data:` line whose `serverInfo.name` is
   `Nightingale MCP Server`, plus an `Mcp-Session-Id` response header;
2. In the server log, confirm this request **has a `[MCP] done` line**, and that `user=` is the
   account you intended;
3. Restart the client and confirm the server shows as connected with **42** tools (only read-only
   tools are registered by default);
4. Ask it something read-only — "list the business groups I can see" — and check the count matches
   what that account sees in the UI.

A wrong tool count, or specific tools missing, is a different problem: see
[Why are MCP tools missing or denied?](./mcp-tools-missing.md).

## Collect this before you ask

1. The **full address** configured in the client (domain and path both; redact the token) and the
   header name it uses;
2. The **complete response headers and body** from the curl above;
3. The `[MCP] start` / `[MCP] done` pair for that `trace_id`;
4. The server's `[HTTP.TokenAuth]`, `[HTTP.A2A]`, `[HTTP.MCPAuth]` and `[HTTP.RSAuth]` sections;
5. If there is a reverse proxy, the `/mcp` location block.

**Redacting**: replace tokens, client secrets and signing keys with placeholders. **Keep the
`trace_id`, the status codes and the name after `user=`** — they are not credentials, and they are
the evidence.

## Next

- Turning the endpoint on: [Enable the MCP endpoint](../ai/mcp-endpoint.md)
- Creating a token and whom it speaks for: [Personal token authentication](../ai/token-auth.md)
- Hosted clients and company SSO: [OAuth 2.1 and external identity providers](../ai/oauth.md)
- Connected, but the tools are wrong: [Why are MCP tools missing or denied?](./mcp-tools-missing.md)
- Client-side configuration: [Connect Claude Code / Cursor / other clients](../ai/mcp-clients.md)
