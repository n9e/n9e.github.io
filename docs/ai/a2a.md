---
title: "A2A endpoint"
sidebar_label: "A2A endpoint"
description: "The A2A endpoint exposes Nightingale as an agent that other agent platforms can discover and call; the agent card declares the address and supported methods."
last_reviewed: 2026-10-10
---

Where this page ends: a Nightingale agent that a third-party agent platform can discover and call
on its own, plus one verified `message:send` request.

## Not the same thing as MCP

| | `/mcp` | `/a2a` |
|---|---|---|
| What the caller gets | 74 fine-grained tools to orchestrate themselves | One agent that talks |
| Interaction | JSON-RPC tool calls | Natural language in, natural language out |
| Needs an LLM configured? | **No** — tools hit Nightingale's API directly | **Yes** — it drives the built-in assistant |
| Suits | Clients that bring their own model: Claude Code, Cursor | Somebody else's agent orchestration platform |

Both endpoints are on by default and share one auth path. **A question the assistant cannot answer
in the UI, it cannot answer over A2A either** — get a conversation working first, see
[Nightingale AI overview](./nightingale-ai.md).

## The agent card is the only address a third party needs

```bash
curl -s https://n9e.example.com/.well-known/agent-card.json
```

This address needs **no authentication** (the spec requires it to be discoverable).
`/.well-known/agent.json` is an alias for older clients.

What the card declares:

| Field | Value |
|---|---|
| `name` | `Nightingale Agent` |
| `supportedInterfaces` | One HTTP+JSON interface at `<BaseURL>/a2a` |
| `capabilities.streaming` | `true` |
| `defaultInputModes` / `defaultOutputModes` | Both `text` |
| `securitySchemes` | `x-user-token` (apiKey, in a header); an extra `oidc` scheme appears when RSAuth is on |
| `skills` | Every built-in skill, with its name, description and example prompts |

`skills` is generated from the built-in skills' frontmatter, so the caller sees what Nightingale is
actually good at — diagnosing why a rule did not fire, analyzing a dashboard, generating PromQL —
rather than one generic blurb.

An empty `BaseURL` is inferred from request headers. **Set it explicitly behind a reverse proxy**,
or the third party may end up with an internal address:

```toml
[HTTP.A2A]
BaseURL = "https://n9e.example.com"
```

## Send a message

The REST binding path is `/a2a/message:send` (**no** `/v1` prefix). `messageId`, `role` and `parts`
are all required, and the enum value for `role` is `ROLE_USER`:

```bash
curl -s -X POST https://n9e.example.com/a2a/message:send \
  -H 'Content-Type: application/json' \
  -H 'X-User-Token: YOUR_TOKEN' \
  -d '{
    "message": {
      "messageId": "req-0001",
      "role": "ROLE_USER",
      "parts": [{ "text": "Which alerts are firing right now?" }]
    },
    "metadata": { "lang": "en_US" }
  }'
```

Expected result: a `task` object carrying `id`, `contextId`, `status.state`, and
`n9e.chat_id` / `n9e.seq_id` under `metadata`. A `status.state` of `TASK_STATE_COMPLETED` means the
turn finished; the answer is in `artifacts`. This step can take tens of seconds while the model
thinks and calls tools — that is normal.

For multi-turn, put `"contextId": "<the contextId you got back>"` inside `message`. `contextId` maps
one-to-one onto Nightingale's `chat_id`, which means an A2A conversation is the same conversation
you see in the Nightingale AI conversation list.

## Which methods are supported

| Method | Path |
|---|---|
| Send a message (unary) | `POST /a2a/message:send` |
| Send a message (SSE stream) | `POST /a2a/message:stream` |
| Get a task | `GET /a2a/tasks/{id}` |
| Cancel a task | `POST /a2a/tasks/{id}:cancel` |
| Resubscribe | `POST /a2a/tasks/{id}:subscribe` |

`tasks/list` is **deliberately not implemented** and returns `UnsupportedOperation` per the spec —
enumerating tasks across users is meaningless for a built-in assistant and would leak other
people's activity.

A bare GET on `/a2a` returns a short JSON hint listing the paths above. That exists so a client
still using the legacy JSON-RPC style (`tasks/send`) gets a sentence it can read, rather than being
redirected into the frontend SPA.

Task state lives in Redis with a 24-hour TTL, shared across instances. After it expires `tasks/get`
returns task-not-found, but the conversation itself is still in the database.

## Reverse proxy and timeouts

A2A sits at the root path and holds long connections:

```nginx
location /.well-known/ {
    proxy_pass http://127.0.0.1:17000;
}

location /a2a/ {
    proxy_pass http://127.0.0.1:17000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    proxy_buffering off;        # without this, streaming answers never emit anything
    proxy_read_timeout 3600s;   # the default 60s cuts answers in half
    proxy_send_timeout 3600s;
}
```

The server sends an empty "working" status heartbeat every 30 seconds precisely to survive gateway
idle timeouts — but the gateway's own read timeout still has to be raised.

## The command-line client

The repository ships a test client built on the official SDK:

```bash
go run ./cmd/a2a-cli --server http://127.0.0.1:17000 --token YOUR_TOKEN \
    --message "Show the alert events currently firing"

# Continue the same conversation
go run ./cmd/a2a-cli --server http://127.0.0.1:17000 --token YOUR_TOKEN \
    --context-id CHAT_ID --message "Analyze the first one in more detail"
```

It streams by default; `--get` calls `tasks/get` afterwards to prove the task really was stored.

## Turning it off

```toml
[HTTP.A2A]
Disable = true   # closes /a2a, /mcp and the agent card together
```

To close MCP only and keep A2A, use `DisableMCP = true`.

## Next

- Get the assistant answering first: [Nightingale AI overview](./nightingale-ai.md)
- Let callers use their own accounts: [OAuth 2.1 and external identity providers](./oauth.md)
- The fine-grained-tools path: [Enable the MCP endpoint](./mcp-endpoint.md)
