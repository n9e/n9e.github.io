# Security checklist

The short list to run before exposing Nightingale to a wider audience.

Last reviewed 2026-10-10

This page is an index to the ones before it, ordered by when each item is due. Every line can be confirmed in under a minute; the long version lives on the page it links to.

Nightingale's defaults are tuned for "works the moment it is installed", not for "hand it straight to a room full of people". The four items in the first section are therefore not optional.

## 1. Right after installation[​](#1-right-after-installation "Direct link to 1. Right after installation")

| Check                                                                                                                                                                  | Detail                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Change `root`'s default password.** `root.2020` is public knowledge, and the host is wide open between installation and that change                                  | [Users and teams](https://n9e.github.io/docs/security/users-teams.md)           |
| **Replace the sample basic auth in the config file.** The credentials under `[HTTP.APIForService.BasicAuth]` ship with the source, so everyone has them                | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md) |
| **Decide whether `[Center.AnonymousAccess]` stays on.** Both switches default to `true`, and while they are on the data source query and proxy endpoints need no login | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md) |
| **Create a named administrator account for yourself** and stop working as `root` — otherwise an incident cannot be traced to a person                                  | [Users and teams](https://n9e.github.io/docs/security/users-teams.md)           |

## 2. Before letting colleagues in[​](#2-before-letting-colleagues-in "Direct link to 2. Before letting colleagues in")

This section is all permissions. Remember they come in two ANDed layers; configuring only one produces "can log in, sees nothing".

| Check                                                                                                                       | Detail                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Teams exist and have members; business groups are authorized to teams with read-write / read-only set                       | [Business group authorization](https://n9e.github.io/docs/security/business-groups.md) |
| `Standard` is confirmed to be both sufficient and not too broad — it carries the full `/busi-groups` create/edit/delete set | [Roles and permission matrix](https://n9e.github.io/docs/security/roles.md)            |
| Automation and AI clients issue tokens from **dedicated accounts**, one per purpose, never `Admin`                          | [Tokens and credential rotation](https://n9e.github.io/docs/security/tokens.md)        |
| Hosts have been moved out of **Ungrouped** into business groups, or colleagues will not see them in the host list           | [Business group authorization](https://n9e.github.io/docs/security/business-groups.md) |
| Everyone has an email / phone / contact entry filled in — a notification with no resolvable address is **dropped silently** | [Users and teams](https://n9e.github.io/docs/security/users-teams.md)                  |
| With SSO wired up, `DefaultTeams` (or the default team) is set, and that team holds a business group authorization          | [SSO / external identity integration](https://n9e.github.io/docs/security/sso.md)      |

## 3. Before it takes external traffic[​](#3-before-it-takes-external-traffic "Direct link to 3. Before it takes external traffic")

| Check                                                                                                                | Detail                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| TLS is terminated: either `[HTTP] CertFile` + `KeyFile`, or a gateway in front                                       | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)     |
| Traffic is **split by path** rather than exposing all of 17000 — write endpoints and admin endpoints share the port  | [Ports and network flows](https://n9e.github.io/docs/reference/ports.md)            |
| Collector writes require basic auth (`[HTTP.APIForAgent.BasicAuth]` is commented out by default)                     | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)     |
| Embedded TSDB: `DatasourceUrl` is not set without basic auth — that opens both reads and writes to the whole network | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)     |
| `[HTTP] PProf` is off and `/metrics` is not internet-facing                                                          | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)     |
| `[HTTP.A2A] MCPEnableWriteTools` stays `false`, so `/mcp` exposes read-only tools only                               | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)     |
| JWT lifetimes are shortened to taste (25 h access, 7 days refresh by default)                                        | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)     |
| `[HTTP.ShowCaptcha]` is on if the login page is externally reachable                                                 | [Network and TLS hardening](https://n9e.github.io/docs/security/network-tls.md)     |
| "Print request body paths" lists no path carrying credentials, and finished entries were removed                     | [Site and user variable settings](https://n9e.github.io/docs/security/variables.md) |
| Config files are `chmod 600`, and the six encryptable fields that should be ciphertext are                           | [Secret management](https://n9e.github.io/docs/security/secrets.md)                 |

## 4. Verify it[​](#4-verify-it "Direct link to 4. Verify it")

A checklist can be wrong; a request cannot. Substitute your own address and run these three:

```
# 1. Can an anonymous caller list the data sources?

curl -i https://<your-nightingale>/api/n9e/datasource/brief



# 2. Is pprof still open?

curl -i https://<your-nightingale>/api/debug/pprof/



# 3. Does the collector heartbeat require a credential?

curl -i -X POST https://<your-nightingale>/v1/n9e/heartbeat
```

The result you want is **all three failing**: 401, 403, 404, or no connection at all.

A `200` means, respectively:

1. `[Center.AnonymousAccess] PromQuerier` is still `true`, or this address was never locked down at the network level — anyone can run queries against your data sources;
2. `[HTTP] PProf` is still `true`, and heap and goroutine dumps can be pulled;
3. `[HTTP.APIForAgent.BasicAuth]` is still empty, and anyone can write metrics in.

One caveat on check 3: a **404** means the agent API group is not mounted at this address at all — which is a pass only if you know collectors reach the write endpoints by some other route. If they do, run the same check against that address instead, or the write path stays open where you did not look.

**On a default configuration all three return 200.** That is not a broken environment; that is what "not configured yet" looks like.

## 5. Review periodically[​](#5-review-periodically "Direct link to 5. Review periodically")

| Check                                                                                                    | Detail                                                                          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Sort the user list by **Last active** and clear out departed people and abandoned service accounts       | [Users and teams](https://n9e.github.io/docs/security/users-teams.md)           |
| Each service account should hold exactly one token; extras are leftovers from an unfinished rotation     | [Tokens and credential rotation](https://n9e.github.io/docs/security/tokens.md) |
| Review dashboard public settings and unexpired share links — they are decoupled from passwords           | [Anonymous time-limited sharing](https://n9e.github.io/docs/query/sharing.md)   |
| Run one rotation across the credential inventory: passwords, basic auth, data sources, SSO, media tokens | [Tokens and credential rotation](https://n9e.github.io/docs/security/tokens.md) |
| After every upgrade, re-check the ports and the configuration defaults                                   | [Ports and network flows](https://n9e.github.io/docs/reference/ports.md)        |

## Next[​](#next "Direct link to Next")

* Going to production also means capacity, high availability and backups: [Production checklist](https://n9e.github.io/docs/get-started/production-checklist.md)
* The permission model itself: [Authentication, tokens and RBAC model](https://n9e.github.io/docs/concepts/auth-rbac.md)
* Point-by-point permissions: [Permission matrix](https://n9e.github.io/docs/reference/permissions.md)
