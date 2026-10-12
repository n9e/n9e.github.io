---
title: "Permission inheritance and RBAC"
sidebar_label: "Permission inheritance and RBAC"
description: "Every MCP tool call is an internal API call made as the token's user, so a client never sees or changes more than that user; business groups apply unchanged."
last_reviewed: 2026-10-10
---

This page answers one question: where exactly is the boundary for a connected AI client, and how
do you move that boundary to where you want it.

## The short version

**An MCP / A2A client has exactly the permissions of its token's owner, and no more.** There is no
separate "permissions for the AI" — to tighten it, hand it a less privileged account.

## The mechanism: a tool call is an internal API call

When a client calls `list_alert_rules`, the server does not query the database directly. It
re-dispatches the call **in-process** onto Nightingale's own
`/api/n9e/busi-group/{gid}/alert-rules` route, carrying your token, through the whole middleware
chain: authenticate, resolve the user, check the permission point, check the business group.

No socket, no bypass. So "can MCP get around RBAC" has a structural answer — **no**: it walks the
same path a click in the UI walks.

## Two layers, combined with AND

Nightingale's permission model has only two layers, and they are the same over MCP as in the UI.

**Layer one: roles decide which endpoints you can reach.** `Admin`, `Standard` and `Guest` are
built in; a role is a set of permission points such as `/alert-rules/add`. Without the point, the
tool call is refused outright.

**Layer two: business-group membership decides which data you can act on.** Users belong to teams;
teams have read or read/write on business groups.

```
may edit this alert rule  =  my role holds the "edit alert rule" permission point
                             AND
                             one of my teams has write on the business group
                             that owns the rule
```

The `Admin` role bypasses layer two, so **do not give the AI account `Admin`** — that hands it
every business group at once. The full model is in
[Authentication, tokens and RBAC model](../concepts/auth-rbac.md).

## How business groups reach the tools

Most tools take a `group_id` or `gids` argument directly:

- `list_alert_rules`, `list_mutes` and `list_dashboards` name a business group, and pointing them
  at one you cannot reach is refused;
- `list_busi_groups` returns **only the groups the current user can access**, so the model can only
  ever pick from inside that set;
- event tools such as `list_active_alerts` filter by the event's owning business group.

The practical consequence: to make the AI see only the "Trading System" group, you change no MCP
config at all — you just make sure that account is a member of that one group.

## Three things worth knowing

**One: an OAuth token is confined to the agent plane.** An access token from the built-in
authorization server or an external IdP works on `/a2a` and `/mcp` only; the rest of `/api/n9e/*`
rejects it. Personal tokens have no such restriction.

**Two: write tools are not registered at all by default.** The 32 write tools do not appear in
`tools/list` until `MCPEnableWriteTools = true`. That is a gate *on top of* RBAC, independent of
the account's permissions — see [Enable write tools safely](./write-tools.md).

**Three: "read-only tool" does not mean "no side effects".** `query_logs` in the `logs` toolset
passes the query body through verbatim to Nightingale's log-query endpoint, which dispatches on the
datasource type you name. If you have SQL-family datasources registered — MySQL, PostgreSQL,
ClickHouse, Doris, TDengine — the SQL is executed as written. There **is** a read-only check on this
path (`validateReadOnlySQL` in `aiagent/tools/datasource_query.go`), but it is a keyword blocklist —
it rejects a statement whose text starts with or contains `INSERT`, `UPDATE`, `DELETE`, `DROP`,
`ALTER`, `CREATE`, `TRUNCATE`, `REPLACE`, `GRANT` or `REVOKE`. That stops the obvious cases; it is
not a SQL parser, so treat it as defence in depth rather than a guarantee. **If you have SQL datasources and want MCP on, drop
`logs` from `MCPToolsets`**, or give the AI account a role that cannot reach those datasources.

## Verify the boundary is where you think

Use the AI account's token to ask for something it should not have, and check that it is refused:

```bash
curl -s -X POST http://127.0.0.1:17000/mcp \
  -H 'X-User-Token: AI_ACCOUNT_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{
        "name":"list_busi_groups","arguments":{}}}'
```

Expected result: the returned list contains **only** the groups you authorized. If root sees five
and this account also sees five, the account is not scoped — go back and fix its role and teams.

## Next

- Create the account and its token: [Personal token authentication](./token-auth.md)
- The full permission points: [Permission matrix](../reference/permissions.md)
- The business-group model: [Business groups](../concepts/business-groups.md)
