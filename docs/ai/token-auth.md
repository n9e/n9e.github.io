# Personal token authentication

Create a token, pass it in X-User-Token, and understand that the client inherits exactly that user's permissions.

Last reviewed 2026-10-10

Where this page ends: a least-privilege account dedicated to AI access with one token under it, and a command that proves the token reaches `/mcp`.

## 1. Create a dedicated account[​](#1-create-a-dedicated-account "Direct link to 1. Create a dedicated account")

Resist the urge to reuse root's token. **A token has no permissions of its own — it is a credential to act *as that user*.** What an MCP client can touch is decided entirely by whose token it holds.

Under **Organization → Users**, add a user such as `ai-readonly` with the `Guest` or `Standard` role (not `Admin`, which bypasses the business-group layer). Then under **Teams**, put it in a team that has read access to the business groups you want the AI to see. How the two layers combine is in [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md).

## 2. Generate the token[​](#2-generate-the-token "Direct link to 2. Generate the token")

Log in as that account, click the avatar at the bottom left → **Profile** → the **Token management** tab (route `/account/profile/token`).

Click **Create token** and give it a **Token name** (required). The list has four columns: token name, token, created at and **last used** — that last one is what lets you find tokens nobody uses any more.

The value is masked; click **View** to reveal and copy it.

Expected result: one new row, with an empty "last used".

One token per purpose (this one for CI, that one for the AI client) so an incident is traceable and a single token can be revoked without disturbing anyone else.

## 3. How to send it[​](#3-how-to-send-it "Direct link to 3. How to send it")

The header name comes from `HeaderUserTokenKey` under `[HTTP.TokenAuth]`, default `X-User-Token`:

```
curl -s -X POST http://127.0.0.1:17000/mcp \

  -H 'X-User-Token: YOUR_TOKEN' \

  -H 'Content-Type: application/json' \

  -H 'Accept: application/json, text/event-stream' \

  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{

        "protocolVersion":"2025-06-18","capabilities":{},

        "clientInfo":{"name":"curl","version":"1"}}}'
```

Expected result: `serverInfo.name` is `Nightingale MCP Server`. An invalid or deleted token gets **401 with the plain-text body `unauthorized`**.

The same token works on `/a2a` and on `/api/n9e/*` — all three entry points share one auth path.

## 4. Three ways in, one permission model[​](#4-three-ways-in-one-permission-model "Direct link to 4. Three ways in, one permission model")

| Entry point      | How it authenticates                          | Permissions come from  |
| ---------------- | --------------------------------------------- | ---------------------- |
| Browser          | Username/password or SSO, exchanged for a JWT | The user who logged in |
| HTTP API         | `X-User-Token`                                | The token's owner      |
| MCP / A2A client | The same, or OAuth `Authorization: Bearer`    | The same               |

An MCP tool call is re-dispatched in-process onto Nightingale's own `/api/n9e/...` routes carrying your token, through the full middleware chain. **So the client can do exactly what that person can do in the UI, and nothing more.**

## 5. Revoking[​](#5-revoking "Direct link to 5. Revoking")

Delete the row on the same page; it takes effect immediately. Deletion is per token, so a leaked credential is revoked on its own without rotating everyone else's.

Tokens are **long-lived until deleted** — there is no expiry. Rotate them on a schedule, or at minimum review the "last used" column periodically and delete what nobody uses.

## 6. Beyond tokens[​](#6-beyond-tokens "Direct link to 6. Beyond tokens")

Tokens are the least-effort option, but every integration means issuing another credential. If you already run SSO, or want hosted clients like Claude and ChatGPT to "connect by entering an address", OAuth fits better: the user authorizes with their own account and you issue nothing. See [OAuth 2.1 and external identity providers](https://n9e.github.io/docs/ai/oauth.md).

## Next[​](#next "Direct link to Next")

* How permissions are actually computed: [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md)
* Put the token into a client: [Connect Claude Code / Cursor / other clients](https://n9e.github.io/docs/ai/mcp-clients.md)
* Rotation policy: [Tokens and credential rotation](https://n9e.github.io/docs/security/tokens.md)
