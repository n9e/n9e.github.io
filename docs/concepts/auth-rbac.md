---
title: "Authentication, tokens and RBAC model"
sidebar_label: "Authentication and permissions"
description: "Two layers: roles decide which pages and endpoints are reachable, business-group membership decides which data can be touched; UI, HTTP API and MCP share the model."
---

There are only two layers to the permission model, but many people only see one of them, and then
wonder why "I am an Admin and still cannot edit this rule".

## Two layers

**Layer one: roles decide which pages and endpoints you can reach.** Three are built in: `Admin`,
`Standard`, `Guest`. Roles attach to a user, and a user can hold several. A role is a set of
permission points such as `/alert-rules/add` or `/metric/explorer`.

**Layer two: business-group membership decides which data you can act on.** Users belong to teams;
teams are members of business groups with a read/write flag. See
[Business groups](./business-groups.md).

The two are combined with **AND**:

```
may edit this alert rule  =  my role holds the "edit alert rule" permission point
                             AND
                             one of my teams has write on the business group
                             that owns the rule
```

The `Admin` role bypasses layer two. So "I am an Admin and still cannot edit it" usually means you
are actually `Standard`.

## Three ways in, one permission model

| Entry point | How it authenticates | Permissions come from |
|---|---|---|
| Browser | Username/password or SSO, exchanged for a JWT | The user who logged in |
| HTTP API | `X-User-Token`, a personal token | The token's owner |
| MCP / A2A client | The same, or OAuth `Authorization: Bearer` | The same |

**The important part: a token has no permissions of its own.** It is a credential to act *as that
user* — no more, no less.

In practice that means a token for an AI client or an automation script should be generated from a
**dedicated least-privilege account**, not from root's. It can then be revoked on its own when
something goes wrong, without disturbing anyone else.

## Single sign-on

OIDC, OAuth2, LDAP and CAS are supported, as are DingTalk and Feishu QR login. Configure them
under **System → SSO**.

With SSO in place, a user is created on first login, with a configurable default role. External
group structures can be mapped onto Nightingale roles — see
[SSO / external identity integration](../security/sso.md).

Reverse-proxy authentication (`[HTTP.ProxyAuth]`) is also available: a gateway in front does the
authenticating and passes the username in a header. **Turning it on disables JWT login** — so it is
either all through the gateway or all through Nightingale's own login, not a mix.

## Managing tokens

Personal tokens are generated from the avatar menu. They are long-lived until deleted.

Worth doing in production:

- one token per purpose (this one for CI, that one for the AI client), so an incident is traceable;
- revoke individually when someone leaves or a token leaks, instead of rotating everyone's;
- rotate on a schedule — see [Tokens and credential rotation](../security/tokens.md).

## Related

- [Roles and permission matrix](../security/roles.md)
- [Users and teams](../security/users-teams.md)
- [Permission matrix (full list)](../reference/permissions.md)
- [Permission inheritance for MCP](../ai/permissions.md)
