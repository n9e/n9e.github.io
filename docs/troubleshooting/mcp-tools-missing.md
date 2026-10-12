# MCP tools are missing or denied

"No such tool" has three shapes — write tools not enabled, toolset disabled, or the token's user lacks the permission — and the tools/list response tells them apart.

The client connected, but the model says it has no such tool; or the tool list is far shorter than expected; or a call comes back refused. Those are three different causes with **three differently shaped responses**, so classifying by shape is much faster than working through the config.

This assumes the connection itself works. If the client cannot connect at all, start with [MCP authentication fails](https://n9e.github.io/docs/troubleshooting/mcp-auth.md).

## Count what `tools/list` returns[​](#count-what-toolslist-returns "Direct link to count-what-toolslist-returns")

Tool count is the fastest discriminator, because **the defaults are exact numbers**:

```
curl -s --noproxy '*' -X POST http://127.0.0.1:17000/mcp \

  -H 'X-User-Token: <your token>' \

  -H 'Content-Type: application/json' \

  -H 'Accept: application/json, text/event-stream' \

  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \

  | sed -n 's/^data: //p' \

  | python3 -c 'import sys,json; print(len(json.load(sys.stdin)["result"]["tools"]))'
```

| The count               | Conclusion                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **42**                  | Default config: **only read-only tools are registered**. What is missing is the write tools |
| **74**                  | Write tools are on (42 read + 32 write)                                                     |
| Fewer than 42 but not 0 | `MCPToolsets` is narrowing the set — or names were misspelled and dropped                   |
| **0**                   | **Every** name in `MCPToolsets` is wrong. It does not fall back to "everything"             |

**The tool count depends on server configuration, not on whose token it is.** Permissions do not change whether a tool appears in the list, only whether a call is refused. That fact alone separates "configuration problem" from "permission problem" immediately.

## Three kinds of "no such tool", three different responses[​](#three-kinds-of-no-such-tool-three-different-responses "Direct link to Three kinds of \"no such tool\", three different responses")

| What you see                                                                              | What it means                                                                                                    | Where to fix it                               |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| A JSON-RPC `error`, `code: -32602`, `unknown tool "xxx"`                                  | The tool is **not registered at all**: write tools are off, or its toolset is not in the whitelist               | Server config                                 |
| A normal `result` carrying `"isError": true`, body starting `forbidden: no access to ...` | The tool exists and ran; **permissions** refused it                                                              | The token owner's role and business groups    |
| A normal `result`, `"isError": true`, some other argument error                           | The tool exists; the model passed bad arguments                                                                  | The prompt, or the tool's parameter reference |
| A normal `result` whose content is an **empty list**                                      | The tool exists and permissions passed — there is no visible data, **which may mean this account cannot see it** | See "empty list" below                        |

An unregistered tool looks exactly like this:

```
{"jsonrpc":"2.0","id":3,"error":{"code":-32602,"message":"unknown tool \"create_user\""}}
```

## Common root causes, and how to confirm each[​](#common-root-causes-and-how-to-confirm-each "Direct link to Common root causes, and how to confirm each")

### Write tools are not registered by default[​](#write-tools-are-not-registered-by-default "Direct link to Write tools are not registered by default")

While `MCPEnableWriteTools` is off, the 32 write tools are **not refused at call time — they are never registered**. They do not appear in `tools/list`, so the model cannot call them.

**How to confirm**: the count is 42, and calling any write tool returns `-32602 unknown tool`.

**How to fix**:

```
[HTTP.A2A]

MCPEnableWriteTools = true
```

**Restart center** for it to take effect; `tools/list` should then return 74. Read [Enable write tools safely](https://n9e.github.io/docs/ai/write-tools.md) before you flip it — the write tools in the `users` and `roles` toolsets can reassign roles and reset passwords, so exclude those with the whitelist at the same time.

Two expectations worth correcting while you are here: **none of the 74 tools deletes anything** — "write" means create and update; and the six toolsets `targets`, `busi_groups`, `alert_subscribes`, `event_pipelines`, `metrics` and `logs` **contain no write tools at all**, so the switch does not add anything to them.

### A name in `MCPToolsets` is misspelled and silently dropped[​](#a-name-in-mcptoolsets-is-misspelled-and-silently-dropped "Direct link to a-name-in-mcptoolsets-is-misspelled-and-silently-dropped")

The subtlest cause on this page: **an unrecognised name is dropped and startup continues.** No error, and no falling back to "all toolsets". **All names wrong means zero tools.**

**How to confirm**: grep the startup log for `ignoring unknown toolset`. The wording is fixed, and **it prints every valid name**, which is quicker than looking them up:

```
WARNING [MCP] ignoring unknown toolset "alert"; valid names: [alert_subscribes alerts busi_groups dashboards datasource event_pipelines logs metrics mutes notify_rules roles targets users]
```

Singular-for-plural is the usual slip (`alert` for `alerts`, `mute` for `mutes`).

**How to fix**: correct them against the list in that warning. Two extra semantics are worth knowing: **empty means all default toolsets**, and so does the literal `"all"` (kept for config back-compatibility); an empty string in the list is skipped without a warning. What each toolset covers is in [Read and write toolsets](https://n9e.github.io/docs/ai/toolsets.md).

### The tool exists, but the token's user lacks the permission[​](#the-tool-exists-but-the-tokens-user-lacks-the-permission "Direct link to The tool exists, but the token's user lacks the permission")

**An MCP client has exactly the permissions of its token's owner** — there is no separate "AI permission". A tool call is re-dispatched in-process onto Nightingale's own `/api/n9e/...` routes and goes through the full chain: authenticate, check the permission point, check the business group.

**How to confirm**: the response is a `result` with `"isError": true` whose body starts with `forbidden:` — for example `forbidden: no access to busi group 3` or `forbidden: no access to this alert rule`. Then find that request's `[MCP] done` line in the server log: **the name after `user=` is the identity it connected as**, which is often not the account you assumed.

**How to fix**: change that account's role and teams; no MCP configuration changes. The two layers are AND-ed: the role decides which endpoints are reachable, business groups decide which data can be acted on. Do not reach for `Admin` as a shortcut — it bypasses the business-group layer and hands over every group at once. Details in [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md).

### An empty list does not necessarily mean "no data"[​](#an-empty-list-does-not-necessarily-mean-no-data "Direct link to An empty list does not necessarily mean \"no data\"")

This gets its own section because it **does not error**, and so reads as "the system simply has none". Asking for alert rules in a business group the account cannot reach returns an empty list rather than a refusal:

```
{"list": [], "total": 0}
```

**How to confirm**: send the same request with the token of **root, or any account that can see every business group**. Different answers mean permissions; identical answers mean there genuinely is no data. `list_busi_groups` returns only the groups the current user can access, so call it first to see how wide this account's view actually is.

**How to fix**: add the account to a team with access to the business group in question.

### The client cached the old tool list[​](#the-client-cached-the-old-tool-list "Direct link to The client cached the old tool list")

You changed the server config, restarted center, and the client looks unchanged.

**How to confirm**: ask the server directly with the curl above. **Right count from curl, wrong count in the client** means client-side caching.

**How to fix**: restart the client. The server does advertise `tools.listChanged` during `initialize`, but not every client refreshes on it, and a restart is the reliable option.

## Confirming the fix[​](#confirming-the-fix "Direct link to Confirming the fix")

1. `tools/list` returns the count you expect (42 by default, 74 with write tools on, or the sum of the whitelisted toolsets);
2. The startup log carries **no** `ignoring unknown toolset` warning;
3. Using **the target account's own token**, call one specific tool and confirm you get a normal `result` — neither `-32602` nor `"isError": true`;
4. Call `list_busi_groups` and check the groups match, **one for one**, what that account sees in the UI. More means the permissions are too wide; fewer means they are not wide enough;
5. Restart the client and confirm its tool count agrees with curl.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The **count** returned by `tools/list`, and the **exact name** of the missing tool;
2. The **complete response** from calling it (`error.code` and `message`, or `isError` and the body);
3. The verbatim `[HTTP.A2A]` section, especially `MCPEnableWriteTools` and `MCPToolsets`;
4. Every `[MCP]` line from the startup log;
5. Which account the token belongs to, and that account's role and teams.

**Redacting**: replace the token. **Keep the tool names, the `MCPToolsets` contents and the `forbidden:` message verbatim** — they are not credentials, and they are the answer.

## Next[​](#next "Direct link to Next")

* What the 13 toolsets contain: [Read and write toolsets](https://n9e.github.io/docs/ai/toolsets.md)
* Per-tool parameters: [MCP tool reference](https://n9e.github.io/docs/reference/mcp-tools.md)
* Read before turning writes on: [Enable write tools safely](https://n9e.github.io/docs/ai/write-tools.md)
* How the boundary is computed: [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md)
* It will not connect at all: [MCP authentication fails](https://n9e.github.io/docs/troubleshooting/mcp-auth.md)
