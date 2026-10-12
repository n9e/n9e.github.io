---
title: "AI / Skill / MCP troubleshooting"
sidebar_label: "AI / Skill / MCP troubleshooting"
description: "Symptom-by-symptom fixes for the AI features: the assistant stays silent or stops halfway, a skill is ignored or fails to install, an MCP client cannot connect."
last_reviewed: 2026-10-10
---

Symptom first, then the fix. Everything on this page is verifiable from the product's own logs and
error messages — no guessing at what the model was thinking.

## Which half is broken

Two independent things can fail, and they fail differently:

- **The model half** — the assistant, `/a2a`, and the AI buttons. Needs an LLM config. Symptoms
  are error cards and slow or empty answers.
- **The data half** — `/mcp`, and the tools behind every answer. Needs no model at all. Symptoms
  are HTTP status codes.

A quick separator: ask the assistant *"What can you do?"*. An answer means the model half is fine
and the problem is in the tools; an error card means start with the model.

## The assistant will not answer

| What you see | Cause |
|---|---|
| Card: **No LLM configured in the current environment** | No config is both enabled **and** Default. Both switches, on the same row |
| The reply stops partway and says the request failed | Usually the model's own timeout. Raise **Timeout (seconds)** in that config's advanced settings |
| Nothing at all after a long wait | The endpoint is unreachable from the Nightingale host — see the next section |

Prove the model path independently: edit the config and press **Test connection**. It sends one
real request with exactly the values in the form. The failure dialog names the kind:

| Kind | What to change |
|---|---|
| Authentication | Wrong key, or a key with leading/trailing whitespace. Anthropic keys start `sk-ant-`, OpenAI `sk-` |
| Endpoint not found | The URL. Give the version root — `https://api.openai.com/v1` — not the chat path, and not a bare hostname |
| Rate limited | Provider-side quota. Check the usage page on their console |
| No content in the reply | Usually a pure reasoning model that spent the whole budget thinking. Raise **Max tokens**, or pick a non-reasoning model |
| Anything network-shaped | The Nightingale host cannot reach the address. Test it from that machine, then set **Proxy** if it needs one |

Field-by-field detail is in [Configure an LLM provider](./llm-provider.md).

## The answer is wrong, thin, or stops early

**"Reached maximum iterations."** The chain of tool calls hit its budget — 25 by default. Narrow
the question, or raise `max_iterations` in the frontmatter of the skill that covers this kind of
question.

**It cannot see data you can see.** It runs as the account asking, so this is a permissions answer,
not an AI one: check that account's role and its teams' business groups. The model is in
[Permission inheritance and RBAC](./permissions.md).

**It invents field names or metric names.** Name the object and the window, and ask it to look
rather than recall: *"read the definition of rule 42 and tell me"*. The documentation-search tool
exists precisely so version-specific names come from the docs — if outbound access to
`flashcat.cloud` is blocked, that tool degrades and this gets worse.

**Answers are truncated on long conversations.** Set **Context length** on the LLM config to the
model's real window; how much history gets sent is computed from it, and empty means a conservative
fixed budget.

## A skill is not being used

Enabling a skill does not mean it is loaded. The match is made on its **description**, so:

1. Check the switch — a disabled skill is tagged `OFF` and never considered.
2. Check visibility. A skill marked *Visible to managing teams only* is invisible to everyone
   outside those teams, and the model is not told it exists.
3. **Rewrite the description in the words a user would type**, including the alert names and error
   strings they would paste. This is the cause the overwhelming majority of the time.
4. Look for near-duplicates. Several similar descriptions all match and all consume context;
   merge them.

Guidance and worked examples are in [Install, manage and write Skills](./skills.md).

## A skill will not install

| Error | Fix |
|---|---|
| `SKILL.md not found in archive root` | You archived the parent directory. One wrapping folder is unwrapped for you; two is not |
| Frontmatter must contain a non-empty `name` | The file starts with `---`, the YAML parses, and `name` is set. All three |
| `archive size exceeds 10MB limit` | Upload cap. Trim companion files, or install from Git instead |
| `git_url must be an http or https URL` | ssh URLs are not supported. Use the https clone URL |
| `git_token is required when git_auth_type=token` | Either supply a token or switch back to no auth |
| A Git install fails on a private repository | Tokens are stored encrypted with the `[HTTP.RSA]` keys — configure those first. For a credential that needs a username, use `username:token` |
| The enable switch refuses with a message about a managing team | Open **Modify** and set the managing teams first |
| Delete is greyed out | Disable the skill first. Built-ins can never be deleted |

## A skill script will not run

Script execution has two independent gates, and the message tells you which one you hit.

**"Skill has no runnable script."** The runner looks for `main.py`, then `main.sh`, then a single
`.py` or `.sh` at the top level. More than one, and you have to name it.

**Execution is refused.** You set `RequireIsolation = true` and the host cannot build a real
sandbox. That is the configuration working as intended. Either supply a python-base root filesystem
on Linux, or accept that this host does not run skill scripts.

**It runs, but the startup log carries `SKILL EXECUTION RUNNING WITHOUT ISOLATION (unsafe-exec)`.**
The script is running directly on the Nightingale host with no network. Read the safety section of
[Install, manage and write Skills](./skills.md) before leaving it that way.

Every run logs `sandbox audit: exec_id=... engine=... network=... exit_code=...`, which is where a
non-zero exit code shows up.

## An MCP client will not connect

| Symptom | Cause and fix |
|---|---|
| **401**, body is the plain text `unauthorized` | Wrong or deleted token. If every token fails, `[HTTP.TokenAuth]` is off — the startup log carries `[A2A] HTTP.TokenAuth.Enable=false` |
| **405** with `Allow: POST` | The client sent `GET /mcp`. Stateless mode has no standalone SSE stream; the client must be configured as Streamable HTTP, not the older SSE transport |
| **415** or **400** | Missing headers. Both `Content-Type: application/json` and `Accept: application/json, text/event-stream` are required |
| **403** mentioning the host | The reverse proxy is not setting `proxy_set_header Host`, so the SDK's DNS-rebinding protection fires |
| A 404 from the proxy, or HTML where JSON should be | The request never reached `n9e`. `/mcp` sits at the root path, not under `/api/n9e`, so a proxy that only forwards `/api/n9e/*` never passes it through — add a `location /mcp` block |
| The connection drops after about 60 seconds | nginx defaults. `proxy_buffering off` plus `proxy_read_timeout` and `proxy_send_timeout` of an hour |

The proxy block that satisfies all of these is in
[Enable the MCP endpoint](./mcp-endpoint.md). To take the client out of the picture, reproduce it
with the curl from that page.

## Connected, but the tools are wrong

| Symptom | Cause |
|---|---|
| Zero tools | Every name in `MCPToolsets` was rejected. The startup log has one `[MCP] ignoring unknown toolset` per bad name — a whitelist of typos yields nothing, it never falls back to "everything" |
| Fewer tools than expected | `MCPToolsets` is narrower than you thought, or write tools are off. Read-only is 42; all of them is 74 |
| No write tools, and you did enable them | `MCPEnableWriteTools = true` needs a restart. Then `tools/list` should return 74 |
| Tools are there but every call is refused | The token's owner lacks the permission point, or their teams have no access to the business group being named. Ask for `list_busi_groups` and compare with what that account sees in the UI |
| A tool exists that you did not want | Narrow `MCPToolsets`. There is no per-tool switch |

## A2A calls hang or return nothing

`/a2a` drives the built-in assistant, so **it needs a working LLM config** — everything in the
first two sections applies here first.

| Symptom | Cause |
|---|---|
| The request sits for tens of seconds | Normal. The model is thinking and calling tools; the server sends a status heartbeat every 30 seconds to keep gateways from closing the connection |
| The gateway closes it anyway | Raise `proxy_read_timeout` and turn `proxy_buffering` off — the heartbeat cannot help if the gateway's own timeout is 60 seconds |
| `tasks/get` returns task-not-found for a task that completed | Task state lives in Redis with a 24-hour TTL. The conversation itself is still in the database |
| The agent card advertises an internal address | `BaseURL` was left empty and got inferred from request headers. Set it explicitly |

More in [A2A endpoint](./a2a.md).

## Next

- Config reference for the endpoints: [Enable the MCP endpoint](./mcp-endpoint.md)
- Authentication failures in depth: [Why does MCP authentication fail?](../troubleshooting/mcp-auth.md)
- Missing tools in depth: [Why are MCP tools missing or denied?](../troubleshooting/mcp-tools-missing.md)
