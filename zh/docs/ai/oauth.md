# OAuth 2.1 与外部身份源

夜莺作为托管客户端的授权服务器，或作为 Keycloak、Entra ID、Okta 前面的资源服务器。

个人 Token 已经够用了。这页解决的是另外两件事： 让接入方**用自己的公司账号**调夜莺，或者让 Claude、ChatGPT 这类 **填不了自定义请求头**的托管客户端「填个地址就能连」。

两条路可以同时开，互不干扰，个人 Token 也照常有效。

## 两条路怎么选[​](#两条路怎么选 "两条路怎么选的直接链接")

| 你的处境                                              | 选哪条                              |
| ----------------------------------------------------- | ----------------------------------- |
| 公司已经有 SSO（Keycloak / Okta / Entra ID / Auth0…） | **方案 A**：夜莺信任 SSO 签发的凭据 |
| 没有 SSO，但想让 Claude / ChatGPT 直接连              | **方案 B**：夜莺自己当授权服务器    |

`[HTTP.RSAuth]` 和 `[HTTP.MCPAuth]` **在 `etc/config.toml` 里没有现成的段落**， 要自己加。

## 方案 A：信任已有的 SSO[​](#方案-a信任已有的-sso "方案 A：信任已有的 SSO的直接链接")

接入方是「员工本人」在调，权限和审计都落到那个人头上；人离职时在 SSO 里停掉就行， 夜莺这边什么都不用改。

**第一步，在 SSO 里给夜莺注册一个受众标识。** 它签发的凭据要写明「这是给夜莺用的」， 比如叫 `n9e-a2a-rs`。Keycloak 是在 `Client scopes → 对应 scope → Mappers → Add → Audience` 里配 Included Custom Audience， 并勾上 Add to access token；Auth0、Entra ID 在各自的 API / audience 设置里配同一件事。

**第二步，改 `etc/config.toml` 并重启 center：**

```
[HTTP.RSAuth]

Enable = true

Audience = "n9e-a2a-rs"   # 必须和第一步填的完全一致

Provider = "oidc"         # 公司 SSO 说 OIDC 的话用这个，绝大多数如此
```

`Audience` 留空的话 OAuth token 一律拒绝，启动日志里会告警。

**第三步，在页面上配 SSO。** **系统配置 → 单点登录 → OIDC**：打开开关， 填公司登录系统的地址、ClientId、ClientSecret；用户名字段（Attributes → Username） 一般填 `preferred_username`；把默认角色和默认团队设好——员工第一次这样调进来时， 夜莺会按这两个默认值自动建账号。保存后约 10 秒生效，不用重启。

RSAuth 不单独配 issuer 和 JWKS，它复用的就是这份 OIDC 登录配置。

## 方案 B：夜莺自己当授权服务器[​](#方案-b夜莺自己当授权服务器 "方案 B：夜莺自己当授权服务器的直接链接")

**第一步，改配置并重启：**

```
[HTTP.MCPAuth]

Enable = true

# 用户浏览器真正访问夜莺的地址，和第三步填给客户端的那个一致

Issuer = "https://n9e.example.com"
```

其余字段都有默认值：access token 1 小时、refresh token 7 天、 授权码 60 秒；签名密钥留空时从 `JWTAuth.SigningKey` 派生。

**第二步，反向代理再放行一条路径**（除了 `/mcp` 和 `/.well-known/` 之外）：

```
location /oauth/ {

    proxy_pass http://127.0.0.1:17000;

}
```

**第三步，把地址告诉用户。** MCP 客户端填 `https://n9e.example.com/mcp`； 标准 A2A 客户端填 `https://n9e.example.com/.well-known/agent-card.json`。

之后用户那边的流程是：客户端自动发现夜莺就是授权服务器 → 浏览器打开夜莺登录页 （已登录则跳过）→ 出现授权确认页，点「允许」→ 回到客户端，连接完成。 从此这个客户端以那个人的身份调夜莺，权限和他登录页面时完全一样。

## 客户端填的地址必须满足三个条件[​](#客户端填的地址必须满足三个条件 "客户端填的地址必须满足三个条件的直接链接")

1. **浏览器能访问到**——授权流程要在浏览器里登录并点确认， 所以不能是只有服务器自己能通的 IP、容器名或 `127.0.0.1`；
2. **域名、协议、端口和 `Issuer` 完全一致**——`Issuer` 是 `https://n9e.example.com` 就不能填 `http://`，也不能带端口；
3. **用 HTTPS**——出于安全考虑多数客户端不接受 `http://` 的远端地址 （本地调试的 `localhost` 除外）。

多实例部署（几个 center 挂在负载均衡后面）时 `Issuer` 必须显式写死。

## 验证[​](#验证 "验证的直接链接")

```
# 开了 MCPAuth 才返回 JSON，否则 404

curl -s https://n9e.example.com/.well-known/oauth-authorization-server



# RSAuth 或 MCPAuth 任一开着就返回 JSON，否则 404

curl -s https://n9e.example.com/.well-known/oauth-protected-resource/mcp
```

预期结果：第一条里有 `authorization_endpoint`、`token_endpoint`、`registration_endpoint`， `code_challenge_methods_supported` 是 `["S256"]`。 第二条里 `authorization_servers` 列着你开的那一个（两个都开就是两个）。

不带凭据访问 `/mcp` 时，401 响应会带一个 `WWW-Authenticate: Bearer resource_metadata="..."` 头，OAuth 客户端靠它自己发现该去哪儿授权。

## 几条值得知道的硬事实[​](#几条值得知道的硬事实 "几条值得知道的硬事实的直接链接")

* **PKCE 只接受 S256**，`plain` 直接拒；动态客户端注册（RFC 7591）是开着的， 所以托管客户端不需要你预先注册。
* **OAuth token 只在 agent 面有效**：`/a2a` 和 `/mcp` 收， 其余 `/api/n9e/*` 接口不收。
* **`/oauth/revoke` 是空操作**：token 是无状态签发的，撤销靠短 TTL 或轮换签名密钥。 refresh token 不轮换。
* **`Provider = "oauth2"` 的默认模式不校验 audience**：它靠调 UserInfo 成不成功判断 token 有效，而 UserInfo 响应里没有 `aud`，于是同一个 IdP 下**任意有效 token 都会被接受**。 有安全要求就在 SSO 的 OAuth2 配置里把 `RSVerifyMethod` 设成 `introspect`（RFC 7662）， 并填上 `IntrospectAddr`。
* **首次调用会自动建账号**：外部 IdP 认下来的用户在夜莺里不存在时， 按 SSO 配置里的默认角色建一个。所以那个默认角色就是外部用户的权限下限， 设之前想清楚。

## 下一步[​](#下一步 "下一步的直接链接")

* 更省事的做法：[个人 Token 认证](https://n9e.github.io/zh/zh/docs/ai/token-auth.md)
* 权限边界不因鉴权方式改变：[权限继承与 RBAC](https://n9e.github.io/zh/zh/docs/ai/permissions.md)
* SSO 本身怎么配：[SSO / 外部身份源集成](https://n9e.github.io/zh/zh/docs/security/sso.md)
