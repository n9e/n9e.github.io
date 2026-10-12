# OAuth 2.1 and external identity providers

Nightingale as authorization server for hosted clients, or as resource server in front of Keycloak, Entra ID or Okta.

Personal tokens are already enough. This page solves two different problems: letting an integrator call Nightingale **as themselves, with their company account**, and letting hosted clients such as Claude and ChatGPT — which **cannot send a custom header** — connect by entering an address.

Both options can be on at once without interfering, and personal tokens keep working either way.

## Choosing between them[​](#choosing-between-them "Direct link to Choosing between them")

| Your situation                                                     | Which option                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| The company already runs SSO (Keycloak / Okta / Entra ID / Auth0…) | **Option A**: Nightingale trusts credentials your SSO issues |
| No SSO, but you want Claude / ChatGPT to connect directly          | **Option B**: Nightingale is the authorization server itself |

Neither `[HTTP.RSAuth]` nor `[HTTP.MCPAuth]` **exists in `etc/config.toml`** — you add the section by hand.

## Option A: trust the existing SSO[​](#option-a-trust-the-existing-sso "Direct link to Option A: trust the existing SSO")

The integrator calls as the employee, so permissions and the audit trail belong to that person. When they leave, disabling them in the SSO is enough and nothing changes in Nightingale.

**Step 1: register an audience identifier for Nightingale in the SSO.** The credentials it issues have to state "this is for Nightingale" — give it a name such as `n9e-a2a-rs`. In Keycloak: `Client scopes → the relevant scope → Mappers → Add → Audience`, set Included Custom Audience, and tick *Add to access token*. Auth0 and Entra ID configure the same thing under their own API / audience settings.

**Step 2: edit `etc/config.toml` and restart center:**

```
[HTTP.RSAuth]

Enable = true

Audience = "n9e-a2a-rs"   # must match step 1 exactly

Provider = "oidc"         # use this when the SSO speaks OIDC, which is the common case
```

With `Audience` empty, every OAuth token is rejected and a warning appears at startup.

**Step 3: configure SSO in the UI.** **System → SSO → OIDC**: turn the switch on; fill in the company login system's address, ClientId and ClientSecret; the username field (Attributes → Username) is usually `preferred_username`; set the default roles and default teams — the first time an employee calls in this way, Nightingale creates their account from exactly those defaults. Saving takes effect in about 10 seconds, no restart.

RSAuth has no issuer or JWKS config of its own; it reuses this OIDC login config.

## Option B: Nightingale as the authorization server[​](#option-b-nightingale-as-the-authorization-server "Direct link to Option B: Nightingale as the authorization server")

**Step 1: edit the config and restart:**

```
[HTTP.MCPAuth]

Enable = true

# The address users' browsers actually reach Nightingale at — the same one you hand out in step 3

Issuer = "https://n9e.example.com"
```

Everything else has a default: access tokens last one hour, refresh tokens seven days, authorization codes 60 seconds; an empty signing key is derived from `JWTAuth.SigningKey`.

**Step 2: allow one more path through the reverse proxy** (on top of `/mcp` and `/.well-known/`):

```
location /oauth/ {

    proxy_pass http://127.0.0.1:17000;

}
```

**Step 3: tell users which address to enter.** MCP clients get `https://n9e.example.com/mcp`; standard A2A clients get `https://n9e.example.com/.well-known/agent-card.json`.

What the user then experiences: the client discovers on its own that Nightingale is the authorization server → the browser opens Nightingale's login page (skipped if already logged in) → a consent page appears and they click Allow → back in the client, connected. From then on that client calls as that person, with exactly their UI permissions.

## Three conditions the address must meet[​](#three-conditions-the-address-must-meet "Direct link to Three conditions the address must meet")

1. **It must be reachable from the user's browser** — the flow involves logging in and clicking confirm in a browser, so not an IP, container name or `127.0.0.1` that only the server can reach;
2. **Scheme, domain and port must match `Issuer` byte for byte** — if `Issuer` is `https://n9e.example.com`, you cannot enter `http://` or add a port;
3. **Use HTTPS** — most clients refuse an `http://` remote address for security reasons (`localhost` for local debugging is the exception).

In a multi-instance deployment (several center instances behind a load balancer), `Issuer` must be set explicitly.

## Verify[​](#verify "Direct link to Verify")

```
# Returns JSON only when MCPAuth is on; 404 otherwise

curl -s https://n9e.example.com/.well-known/oauth-authorization-server



# Returns JSON when either RSAuth or MCPAuth is on; 404 otherwise

curl -s https://n9e.example.com/.well-known/oauth-protected-resource/mcp
```

Expected result: the first carries `authorization_endpoint`, `token_endpoint` and `registration_endpoint`, with `code_challenge_methods_supported` equal to `["S256"]`. The second lists the authorization server(s) you enabled in `authorization_servers` — two entries if you enabled both.

A credential-less request to `/mcp` comes back 401 with a `WWW-Authenticate: Bearer resource_metadata="..."` header, which is how an OAuth-aware client discovers where to authorize.

## Facts worth knowing[​](#facts-worth-knowing "Direct link to Facts worth knowing")

* **PKCE is S256-only**; `plain` is refused. Dynamic Client Registration (RFC 7591) is on, which is why hosted clients need no pre-registration from you.
* **An OAuth token is confined to the agent plane**: accepted on `/a2a` and `/mcp`, refused on the rest of `/api/n9e/*`.
* **`/oauth/revoke` is a no-op**: tokens are stateless, so revocation means short TTLs or rotating the signing key. Refresh tokens are not rotated.
* **`Provider = "oauth2"` does not enforce audience in its default mode**: it decides a token is valid if the UserInfo call succeeds, and a UserInfo response carries no `aud`, so **any valid token from that IdP is accepted**. Where that matters, set `RSVerifyMethod` to `introspect` (RFC 7662) in the OAuth2 SSO config and fill in `IntrospectAddr`.
* **Accounts are created on first call**: a user your external IdP authenticates who does not exist in Nightingale is created with the default roles from the SSO config. That default role is therefore the floor for every external user — decide it deliberately.

## Next[​](#next "Direct link to Next")

* The simpler path: [Personal token authentication](https://n9e.github.io/docs/ai/token-auth.md)
* The permission boundary does not change with the auth method: [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md)
* Configuring SSO itself: [SSO / external identity integration](https://n9e.github.io/docs/security/sso.md)
