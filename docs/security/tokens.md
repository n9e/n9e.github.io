# Tokens and credential rotation

Personal tokens, service accounts for MCP and the API, and rotating them without downtime.

Where this page ends: a practice that can answer "which token belongs to whom, when was it last used, when is it due for replacement", and an order of operations for swapping a token without breaking anything in production.

The shortest path to creating and using a token is [Personal token authentication](https://n9e.github.io/docs/ai/token-auth.md); this page is about everything after that.

## What a token is, and what it is not[​](#what-a-token-is-and-what-it-is-not "Direct link to What a token is, and what it is not")

A token is a UUID attached to **one user**, standing for "act as this user".

* **It carries no permissions of its own.** root's token *is* root; a read-only account's token is read-only. The only way to narrow what an integration can touch is to issue the token from a less privileged account.
* **It does not expire.** There is no validity field on the record — deleting it is what revokes it.
* **One token works on three entry points**: `/api/n9e/*`, `/mcp` and `/a2a` share one authentication chain, with `X-User-Token` as the default header.

So "token management" is really **account management**: one account per purpose, one token per account. That is what makes an incident traceable and stoppable.

## 1. Give automation its own account[​](#1-give-automation-its-own-account "Direct link to 1. Give automation its own account")

Do not hand a personal account's token to CI or to an AI client. Create one account per purpose:

| Purpose                        | Suggested role                                          | Team and business group                                   |
| ------------------------------ | ------------------------------------------------------- | --------------------------------------------------------- |
| Read-only AI client access     | `Guest`, or a custom role with the write points removed | In a team with **read-only** on the target business group |
| Syncing alert rules from CI    | Custom role holding only the `/alert-rules` quartet     | **Read-write** on the matching business group             |
| External system reading events | `Guest` plus `/alert-cur-events`, `/alert-his-events`   | Read-only on the relevant groups                          |

Creating accounts is covered in [Users and teams](https://n9e.github.io/docs/security/users-teams.md), custom roles in [Roles and permission matrix](https://n9e.github.io/docs/security/roles.md).

**Do not give these accounts `Admin`**: `Admin` skips the business-group layer entirely, which amounts to handing over all the data.

## 2. Rotate a token without downtime[​](#2-rotate-a-token-without-downtime "Direct link to 2. Rotate a token without downtime")

Token management lives under **avatar menu → Profile → Token management** (`/account/profile/token`), and **only manages your own tokens** — so rotating a service account's token means logging in as that account first.

The order is "create the new one, then delete the old one", and the product enforces it: deleting when only one is left is refused (`cannot delete the last token`).

1. Log in as the service account, open Token management, click **Create token**.
2. **Token name** is required and must be unique within the user — so put a date in it, for example `ci-2026-09`, then `ci-2026-12` next time round.
3. The new row's value is masked by default; click **View** to reveal it before copying.
4. Swap the new value into the client / CI job / secret manager and make one real call.
5. Come back to this page and check whether the old token's **Last used** timestamp has stopped advancing.
6. Once it has, delete the old row. Revocation is immediate.

Expected result: one row left in the list, and not a single 401 on the calling side.

Step 5 is what makes this worth doing as a procedure: **Last used** tells you whether anyone is still on the old credential instead of leaving you to guess. It is updated on every successful authentication; `-` means it has never been used.

## 3. Take stock of the tokens in use[​](#3-take-stock-of-the-tokens-in-use "Direct link to 3. Take stock of the tokens in use")

There is no site-wide token list in the UI, and `GET /api/n9e/self/token` returns only your own. So the inventory rests on the "one account per purpose" discipline: the account list *is* the token list.

* Sort the user list by **Last active** at the top right; a service account that has been idle for a long time is probably abandoned.
* Each service account should hold exactly one token; extras are usually leftovers from a rotation that was never finished.
* **Deleting a user deletes every token they own.** That is the correct offboarding action — there is no need to log in as them and remove tokens one by one first.

## 4. Do not forget the other credentials[​](#4-do-not-forget-the-other-credentials "Direct link to 4. Do not forget the other credentials")

Tokens are only one kind. A real credential rotation should sweep all of these:

| Credential                      | Where to change it                       | Notes                                                                                                                                           |
| ------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`'s password               | Reset password in user management        | The default `root.2020` is public knowledge; change it at install time                                                                          |
| Collector basic auth            | `[HTTP.APIForAgent.BasicAuth]`           | Every collector has to be updated too — see [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)                     |
| Service-to-service basic auth   | `[HTTP.APIForService.BasicAuth]`         | The sample credentials shipped in the config file are public; do not keep them                                                                  |
| Data source credentials         | The data source edit page                | Non-admins cannot see these values; re-run a query afterwards to confirm                                                                        |
| SSO client secrets              | System → SSO                             | Better held in an encrypted variable — see [Secret management](https://n9e.github.io/docs/security/secrets.md)                                  |
| Notification media tokens       | Media type configuration                 | Same                                                                                                                                            |
| Dashboard anonymous share links | The Public setting on the dashboard list | A separate token; changing a password does not invalidate it. See [Anonymous time-limited sharing](https://n9e.github.io/docs/query/sharing.md) |

The config-file entries above can be stored as ciphertext — see [Secret management](https://n9e.github.io/docs/security/secrets.md).

## Next[​](#next "Direct link to Next")

* Creating a token and making requests with it: [Personal token authentication](https://n9e.github.io/docs/ai/token-auth.md)
* Getting credentials out of the config file: [Secret management](https://n9e.github.io/docs/security/secrets.md)
* A pass over everything before going live: [Security checklist](https://n9e.github.io/docs/security/checklist.md)
