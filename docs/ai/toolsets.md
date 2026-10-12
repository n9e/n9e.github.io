# Read and write toolsets

The MCP endpoint offers 74 tools in 13 toolsets; six toolsets are entirely read-only, there are no delete tools, and write tools must be enabled separately.

Last reviewed 2026-10-10

This page exists to support one decision: which toolsets to expose. Per-tool parameters live in the [MCP tool reference](https://n9e.github.io/docs/reference/mcp-tools.md), which is generated from source.

## The 13 toolsets at a glance[​](#the-13-toolsets-at-a-glance "Direct link to The 13 toolsets at a glance")

**42 read-only tools** are registered by default; turning on `MCPEnableWriteTools` brings the total to **74** by adding 32 write tools.

| Toolset            | Tools (read/write) | What it covers                                                                                       |
| ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `alerts`           | 12 (6/6)           | Active and historical events; alert rules — read, create, update, import, clone, bulk enable/disable |
| `targets`          | 1 (1/0)            | The host list                                                                                        |
| `datasource`       | 6 (4/2)            | Datasource listing and full config; create or update, enable/disable                                 |
| `mutes`            | 4 (2/2)            | Muting rules                                                                                         |
| `busi_groups`      | 1 (1/0)            | Business groups visible to the current user                                                          |
| `notify_rules`     | 13 (5/8)           | Notification rules, media types, message templates, including send-test                              |
| `alert_subscribes` | 3 (3/0)            | Subscription rules                                                                                   |
| `event_pipelines`  | 5 (5/0)            | Workflows and their execution records                                                                |
| `users`            | 10 (4/6)           | Users, teams, team membership                                                                        |
| `metrics`          | 2 (2/0)            | PromQL instant and range queries                                                                     |
| `logs`             | 3 (3/0)            | Log queries, index and field listing                                                                 |
| `dashboards`       | 8 (3/5)            | Dashboard metadata and panel JSON, clone, public toggle                                              |
| `roles`            | 6 (3/3)            | Roles, permission points, role bindings                                                              |

The toolset name is exactly the string you put in `MCPToolsets`; empty means all of them:

```
[HTTP.A2A]

MCPToolsets = ["alerts", "dashboards", "metrics"]
```

A misspelled name is dropped with a warning — it never falls back to "everything".

## How read is separated from write[​](#how-read-is-separated-from-write "Direct link to How read is separated from write")

Not by a flag the tool declares, but by **two separate registration lists**: read tools are always registered, write tools only when `MCPEnableWriteTools = true`. While it is off, write tools do not appear in `tools/list` at all, so the model cannot see them, let alone call them.

Every tool additionally carries a `readOnlyHint` annotation for the client's benefit; the two always agree.

## Six toolsets are read-only[​](#six-toolsets-are-read-only "Direct link to Six toolsets are read-only")

`targets`, `busi_groups`, `alert_subscribes`, `event_pipelines`, `metrics` and `logs` contain no write tools at all — turning the write switch on does not change them.

## There are no delete tools[​](#there-are-no-delete-tools "Direct link to There are no delete tools")

Not one of the 74 deletes anything. "Write" means create and update; deleting a business group, a user or a rule is not reachable. The `etc/config.toml` comment describing write tools as "create/update/delete" is stale.

That does not make write tools harmless — it means their failure mode is "changed wrongly", not "gone".

## The riskiest write tools[​](#the-riskiest-write-tools "Direct link to The riskiest write tools")

Ordered by blast radius; worth reading before you flip the switch:

| Tool                                                           | Why it is dangerous                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `reset_user_password`                                          | Resets any user's password                                                                  |
| `create_user` / `update_user_profile`                          | Both assign roles as a side effect — that is privilege escalation                           |
| `bind_role_operations`                                         | Replaces a role's whole permission set; a short payload silently strips permissions         |
| `create_notify_channel` / `update_notify_channel`              | A webhook media type POSTs alert content to any address it is given                         |
| `upsert_datasource`                                            | Stores datasource credentials and probes the supplied address for connectivity              |
| `set_dashboard_public`                                         | Flips a dashboard to anonymous access                                                       |
| `toggle_alert_rules` / `set_datasource_status` / `create_mute` | All create monitoring blind spots: bulk-disable rules, disable a datasource, silence alerts |

The conclusion is blunt: **turn write tools on only where you genuinely need writes, and use `MCPToolsets` to drop `users` and `roles`.** How to do that is in [Enable write tools safely](https://n9e.github.io/docs/ai/write-tools.md).

## One read tool that still deserves care[​](#one-read-tool-that-still-deserves-care "Direct link to One read tool that still deserves care")

`query_logs` in the `logs` toolset passes the query body through verbatim to Nightingale's log-query endpoint, which dispatches on the datasource type it is given. With SQL-family datasources registered — MySQL, PostgreSQL, ClickHouse, Doris, TDengine — the SQL runs as written. **If you have SQL datasources, drop `logs`**; details in [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md).

## Picking a minimal set[​](#picking-a-minimal-set "Direct link to Picking a minimal set")

Work backwards from what you want the AI to do, rather than enabling everything and trimming:

| Scenario                                                 | Toolsets that suffice                               |
| -------------------------------------------------------- | --------------------------------------------------- |
| On-call triage: see events, see rules, see who owns them | `alerts`, `busi_groups`, `targets`                  |
| Plus "explain this spike"                                | add `metrics`                                       |
| Noise review: noisiest rules, mutes and subscriptions    | add `mutes`, `alert_subscribes`                     |
| Let the AI change configuration                          | add the write switch — **and read that page first** |

## Next[​](#next "Direct link to Next")

* Per-tool list and parameters: [MCP tool reference](https://n9e.github.io/docs/reference/mcp-tools.md)
* Turning writes on: [Enable write tools safely](https://n9e.github.io/docs/ai/write-tools.md)
* The endpoint itself: [Enable the MCP endpoint](https://n9e.github.io/docs/ai/mcp-endpoint.md)
