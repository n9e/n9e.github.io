---
title: "Enable write tools safely"
sidebar_label: "Enable write tools safely"
description: "MCP write tools are not registered by default; enable them explicitly under [HTTP.A2A], scope them to one token, and every change is traceable in the log."
---

Where this page ends: an `[HTTP.A2A]` config that keeps write access as small as it can be, and a
log query that answers "who changed that rule".

## Off by default — genuinely not registered

While `MCPEnableWriteTools = false`, the 32 write tools **are not registered**. They are not
refused at call time; they never appear in `tools/list` at all. The model cannot see them, so it
cannot call them.

That gate sits outside RBAC. Which means even if you accidentally hand a client root's token, under
the default config it still cannot change anything.

## Turning it on

```toml
[HTTP.A2A]
MCPEnableWriteTools = true
```

Restart center. To verify, `tools/list` should go from 42 tools to 74:

```bash
curl -s -X POST http://127.0.0.1:17000/mcp \
  -H 'X-User-Token: YOUR_TOKEN' -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Mcp-Session-Id: YOUR_SESSION_ID' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

## Narrow the scope before you flip it

The write switch is global; narrowing is `MCPToolsets`' job. **Do both at once** — flipping the
switch without narrowing is the worst combination:

```toml
[HTTP.A2A]
MCPEnableWriteTools = true
MCPToolsets = ["alerts", "mutes", "dashboards"]
```

The two to drop first:

- **`users`** — `create_user` and `update_user_profile` assign roles as a side effect, which is
  privilege escalation; `reset_user_password` resets any user's password.
- **`roles`** — `bind_role_operations` replaces a role's entire permission set.

Next in line: `datasource` (writes credentials and probes the address it is given) and
`notify_rules` (a webhook media type sends alert content to an arbitrary address).

What each toolset contains is in [Read and write toolsets](./toolsets.md).

## What "scope them to a token" actually means

There is **no** config switch saying "this token may write, that one may not". The write boundary
is the product of two layers:

```
this client may edit this rule  =  MCPEnableWriteTools = true
                                   AND  the toolset is in MCPToolsets
                                   AND  the token owner's role holds the permission point
                                   AND  one of their teams has write on the rule's business group
```

So in practice: **give the client that needs writes a dedicated, more privileged account, and give
every other client a read-only one.** Both connect to the same endpoint; what each can do follows
its own token. Creating accounts is covered in
[Personal token authentication](./token-auth.md).

When you need certainty that nobody can write, turn the switch off rather than relying on account
permissions — those quietly widen the day somebody adds a role to that account.

## Where to see what they changed

The open-source build gives you two trails.

**One: the modifier on the object.** An alert rule, mute or dashboard changed over MCP carries the
token owner's username in `update_by`, exactly as if it had been edited in the UI. The list pages
show it.

**Two: the `[MCP]` request log.** Center logs a start/done pair for every `/mcp` request:

```
[MCP] start trace_id=... method=POST path=/mcp remote=10.0.0.5 body_len=98 body_truncated=false
      body={"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_busi_groups","arguments":{}}}
[MCP] done  trace_id=... method=POST path=/mcp user=root status=200 cost=3.7ms bytes_out=917
```

The start line carries the full request body (tool name and arguments), the done line carries
`user=` and the status code, and `trace_id` joins them. So "who called which write tool, when, with
what arguments" is answerable:

```bash
grep '"method":"tools/call"' /path/to/n9e.log | grep -oE '"name":"[a-z_]+"' | sort | uniq -c | sort -rn
```

Oversized bodies are truncated, and `body_truncated=true` says so.

## A safer alternative: let the AI propose, a human confirm

If what you actually want is "let the AI help me change configuration", note that the **built-in
assistant** takes a different path: `update_*` operations are two-phase — the first call only
computes the change and returns a confirmation card, and nothing is written until a person confirms
in a later turn. That mechanism does not exist on `/mcp` (a write tool there writes on the first
call), so for configuration changes the built-in assistant is the safer surface. See
[Safe automation patterns](./automation.md).

## Next

- Choosing toolsets: [Read and write toolsets](./toolsets.md)
- The permission boundary: [Permission inheritance and RBAC](./permissions.md)
- Human-in-the-loop writes: [Safe automation patterns](./automation.md)
