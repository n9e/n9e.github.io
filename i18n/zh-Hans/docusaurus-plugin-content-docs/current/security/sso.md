---
title: "SSO 与外部身份集成"
sidebar_label: "SSO 与外部身份集成"
description: "OIDC、OAuth2、LDAP、CAS、钉钉与飞书登录，以及把外部组映射到角色。"
last_reviewed: 2026-10-10
---

这页办完你会得到：用公司账号就能登进夜莺，账号第一次登录时自动创建，
并且落在一个**看得见东西**的角色和团队上——最后这半句是接 SSO 最常翻车的地方。

## 六个身份源，两种配置方式

**系统配置 → 单点登录**（`/system/sso-settings`），六个 tab：LDAP、CAS、OIDC、OAuth2、钉钉、飞书。
编辑方式看 tab：

- **LDAP / CAS / OIDC / OAuth2**：一整块 TOML 文本，在代码编辑器里直接改，字段名就是 TOML 的键名；
- **钉钉 / 飞书**：常规表单。

<Shot src="/img/docs/security/sso.zh" alt="单点登录" />

两种都是底部一个 **保存**。保存后**不用重启进程**——后端定期比对配置的更新时间，
变了就重新加载一次。保存要求 `Admin`；`/system/sso-settings` 那个权限点只管菜单显不显示，
见[角色与权限矩阵](./roles.md)。

配置正文里可以用 `{{.变量名}}` 引用加密变量，六个身份源都支持。
`ClientSecret`、`BindPass` 这类值不想以明文留在库里就走这条路，见[密钥管理](./secrets.md)。

## 1. 接一个 OIDC

把 OIDC tab 里的 `Enable` 改成 `true`，填下面几项：

```toml
Enable = true
DisplayName = 'Sign in with OIDC'
RedirectURL = 'https://<你的夜莺地址>/callback'
SsoAddr = 'https://sso.example.org'
SsoLogoutAddr = 'https://sso.example.org/session/end'
ClientId = '<IdP 那边分配的>'
ClientSecret = '{{.oidc_client_secret}}'
CoverAttributes = true
DefaultRoles = ['Standard']
Scopes = ['openid', 'profile', 'email', 'phone']

[Attributes]
Username = 'sub'
Nickname = 'nickname'
Phone = 'phone_number'
Email = 'email'
```

几个要点：

- `RedirectURL` 必须和 IdP 那边登记的回调地址**一字不差**，路径固定是 `/callback`。
- `[Attributes]` 是「IdP 的 claim 叫什么」到夜莺字段的对应。`Username` 决定登录名，
  挑一个**不会变**的 claim——`sub` 比 `email` 稳，因为登录名建完就改不了。
- `CoverAttributes = true` 表示每次登录都用 IdP 的值覆盖夜莺里的显示名、手机号、邮箱。
- `DefaultRoles` 只在**第一次登录建账号时**生效。

预期结果：保存后回登录页，多出一个写着 `DisplayName` 文案的按钮。点它跳到 IdP，
认证完跳回夜莺并且已经是登录状态。

## 2. 接一个通用 OAuth2 {#oauth2}

身份源只支持普通 OAuth2、不支持 OIDC 时用这个 tab——典型的是公司自建、带自己一套用户信息接口的 SSO。
身份源支持 OIDC 的话，优先用 OIDC tab。

```toml
Enable = true
DisplayName = 'Sign in with OAuth2'
RedirectURL = 'https://<你的夜莺地址>/callback/oauth'
SsoAddr = 'https://sso.example.com/oauth2/authorize'
SsoLogoutAddr = 'https://sso.example.com/oauth2/logout'
TokenAddr = 'https://sso.example.com/oauth2/token'
UserInfoAddr = 'https://sso.example.com/api/v1/user/info'
TranTokenMethod = 'header'
ClientId = '<身份源分配的>'
ClientSecret = '{{.oauth2_client_secret}}'
CoverAttributes = true
DefaultRoles = ['Standard']
DefaultTeams = [1]
UserinfoIsArray = false
UserinfoPrefix = 'data'
Scopes = ['profile', 'email', 'phone']

[Attributes]
Username = 'sub'
Nickname = 'nickname'
Phone = 'phone_number'
Email = 'email'
```

一次登录走四步，上面每个地址各管一步：

1. 浏览器跳到 `SsoAddr`（授权端点），带上 client ID、`Scopes`、一个 state 值和 `RedirectURL`；
2. 身份源把浏览器带着 code 送回 `RedirectURL`。路径固定是 `/callback/oauth`，
   必须和身份源那边登记的完全一致；
3. 后端拿 `ClientId`、`ClientSecret` 去 `TokenAddr` 用 code 换 access token；
4. 后端带着这个 token 调 `UserInfoAddr`，按 `[Attributes]` 映射返回结果。

state 值在 Redis 里只存 5 分钟，所以一次登录要在 5 分钟内走完。

| 字段 | 说明 |
|---|---|
| `TranTokenMethod` | 调 `UserInfoAddr` 时 token 怎么传。`header`（默认）：GET，带 `Authorization: Bearer <token>` 和一个 `client_id` 请求头；`querystring`：GET，`?access_token=…&client_id=…`，同时也带 Bearer 头；`formdata`：POST，表单里放 `access_token` 和 `client_id` |
| `UserinfoPrefix` | 用户对象在响应里的位置。字段就在最外层时留空。支持 `data.user` 这样的点路径 |
| `UserinfoIsArray` | 用户对象是数组第一个元素时设为 `true` |
| `[Attributes]` | 用户对象里的字段名。`Username` 是登录名，**建出来以后改不了**，挑一个稳定的 |
| `DefaultRoles` / `DefaultTeams` | 只在第一次登录建账号时生效。`DefaultTeams` 填团队 ID |
| `SsoLogoutAddr` | 退出夜莺后浏览器跳去的地址；留空就只退出夜莺本身 |
| `SkipTlsVerify` | 模板里没有；身份源是自签证书时加一行 `SkipTlsVerify = true` |

对着真实响应看 `UserinfoPrefix` 和 `UserinfoIsArray` 怎么填：

| 用户信息接口的响应 | 配置 |
|---|---|
| `{"sub": "alice", "email": "…"}` | `UserinfoPrefix = ''` |
| `{"code": 0, "data": {"sub": "alice"}}` | `UserinfoPrefix = 'data'` |
| `{"data": [{"sub": "alice"}]}` | `UserinfoPrefix = 'data'`，`UserinfoIsArray = true` |
| `{"data": {"user": {"sub": "alice"}}}` | `UserinfoPrefix = 'data.user'` |

保存之前，拿一个真实 token 手动调一次 `UserInfoAddr`：前缀或字段名对不上时不会报错，只会取到空值。

`RSVerifyMethod`、`IntrospectAddr`、`IntrospectCacheSeconds` 和浏览器登录无关，
只在这个身份源同时用来校验 A2A、MCP 的 access token 时生效，见[OAuth 2.1 与外部身份源](../ai/oauth.md)。

## 3. 接 CAS {#cas}

```toml
Enable = true
DisplayName = 'Sign in with CAS'
RedirectURL = 'https://<你的夜莺地址>/callback/cas'
SsoAddr = 'https://cas.example.com/cas'
LoginPath = '/login'
SsoLogoutAddr = 'https://cas.example.com/cas/logout'
CoverAttributes = true
DefaultRoles = ['Standard']

[Attributes]
Nickname = 'displayName'
Phone = 'mobile'
Email = 'mail'
```

有两个地址是从 `SsoAddr` 推出来的，把它们弄对就成功了一大半：

| 环节 | 地址 |
|---|---|
| 登录页 | `SsoAddr` + `LoginPath`，后面带 `?service=<RedirectURL>` |
| 票据校验 | `SsoAddr` + `/serviceValidate`（CAS 2.0 协议） |

按上面的例子，就是 `https://cas.example.com/cas/login` 和 `https://cas.example.com/cas/serviceValidate`。

- **`LoginPath` 显式写上。** 留空时会在 `SsoAddr` 后面拼 `/cas/login`——`SsoAddr` 里含 `p3` 时拼 `/login`。
  模板里示例的 `SsoAddr` 本身就以 `/cas/` 结尾，`LoginPath` 留空就会拼出 `/cas//cas/login`。
- `RedirectURL` 就是 CAS 服务端看到的 `service`，路径固定是 `/callback/cas`。
  很多 CAS 服务端只接受在服务注册表里登记过的 service。
- **登录名是 CAS 的 principal**——校验响应里 `<cas:user>` 的值。
  `[Attributes]` 里的 `Username` 对 CAS 不起作用。
- 显示名、手机号、邮箱从 `<cas:attributes>` 里取。取到空值，说明 CAS 服务端没在 CAS 2.0
  校验接口上释放属性，去查它对这个 service 的属性释放策略。
- CAS **没有 `DefaultTeams`**。新建的 CAS 账号只有 `DefaultRoles`、没有团队，事后要手动分配——
  见第 6 节说的那个坑。
- CAS 服务端是自签证书时，加一行 `SkipTlsVerify = true`。

## 4. 接 LDAP

LDAP 不走浏览器跳转：用户在夜莺**自己的登录框**里输 LDAP 的账号密码，
后端拿这对凭据去 LDAP 验一次。所以它没有回调地址。

```toml
Enable = true
Host = 'ldap.example.org'
Port = 389
BaseDn = 'dc=example,dc=org'
BindUser = 'cn=manager,dc=example,dc=org'
BindPass = '{{.ldap_bind_pass}}'
AuthFilter = '(&(uid=%s))'
UserFilter = '(&(uid=*))'
CoverAttributes = true
CoverRoles = false
TLS = false
StartTLS = true
DefaultRoles = ['Standard']
SyncAddUsers = false
SyncDelUsers = false
SyncInterval = 86400

[Attributes]
Username = 'uid'
Nickname = 'cn'
Phone = 'mobile'
Email = 'mail'
```

- `AuthFilter` 里的 `%s` 会被替换成登录名。OpenLDAP 通常是 `(&(uid=%s))`，
  AD 是 `(&(sAMAccountName=%s))`。
- `BaseDn` 支持用 `|` 分隔写多个。
- `TLS` 是 ldaps（要换成 636 端口），`StartTLS` 是在 389 上升级，两者选一个。
- `SyncAddUsers` / `SyncDelUsers` 打开后，按 `SyncInterval`（秒）定期把 `UserFilter`
  命中的人同步进来、把不在了的清掉。

**LDAP 是六个里唯一能把外部组映射成角色和团队的。** 追加若干段 `[[RoleTeamMapping]]`：

```toml
[[RoleTeamMapping]]
DN = 'cn=sre,ou=groups,dc=example,dc=org'
Roles = ['Standard']
Teams = [1]

[[RoleTeamMapping]]
DN = 'cn=platform-admins,ou=groups,dc=example,dc=org'
Roles = ['Admin']
Teams = [1, 2]
```

- 匹配的是用户条目的 **`memberOf`** 属性，外加用户自己的 DN。
  这个属性名是固定的，在 `[Attributes]` 里配别的名字不生效。
- 命中多条时，角色和团队取**并集**。
- `Teams` 填的是团队 **ID**，在 **人员组织 → 团队管理** 里选中团队后，右侧顶部那一行能看到。
- 一条都没命中时，退回 `DefaultRoles` 和 `DefaultTeams`。
- **想让每次登录都按映射刷新角色，`CoverRoles` 和 `CoverAttributes` 必须同时为 `true`。**
  `CoverRoles` 默认是 `false`，也就是默认只在建账号那一次用映射，
  之后在夜莺里手工改的角色不会被覆盖回去。这是这块最容易配错的一处。

预期结果：用一个属于 `cn=sre` 的账号登录，去 **人员组织 → 用户管理** 看这一行——
账号来源是 ldap，角色和团队跟映射一致。

## 5. 钉钉和飞书扫码

这两个是表单，不是 TOML。必填项：启用、显示名称、APP ID / Client ID、
APP Secret / Client secret、用户名字段、默认角色。回调地址分别是
`https://<你的夜莺地址>/callback/dingtalk` 和 `.../callback/feishu`，
要和开放平台那边登记的一致。

- **用户名字段**决定拿对端的哪个属性当夜莺登录名。飞书可选 用户ID / 邮箱 / 手机号 / 名称，
  钉钉可选 手机号 / 名称 / 邮箱。**登录名建完就改不了**，所以先想清楚：
  选手机号或邮箱的风险是它们真的会变，选用户 ID 最稳但不好认人。
- **更新用户信息**打开后，每次登录用对端的手机号和邮箱覆盖夜莺里的值。
- 钉钉的**高级设置**里还有 `Endpoint`、代理地址、以及**用户详情**开关——
  要从通讯录里取邮箱和手机号才需要打开它，并且要在钉钉开放平台上额外开通
  「通讯录用户详情」权限，否则拿不到。
- **默认团队 / 默认角色**在第一次登录建账号时生效。

## 6. 第一次登录建出来的账号长什么样

不管走哪个身份源，第一次登录都会自动建一个用户：

| 字段 | 来自 |
|---|---|
| 登录名 | `[Attributes] Username`，或表单里的「用户名字段」 |
| 显示名 / 手机 / 邮箱 | `[Attributes]` 里对应的那几项 |
| 角色 | `DefaultRoles`（LDAP 命中 `[[RoleTeamMapping]]` 时用映射的） |
| 团队 | `DefaultTeams` / 默认团队，**没配就是空** |

在 **人员组织 → 用户管理** 里，这些账号的**账号来源**列显示身份源的名字，
一眼能分清哪些账号归你管、哪些归 IdP 管。

**这里就是那个坑**：默认角色给了 `Standard`，人也确实能登录进来，但如果团队是空的，
他打开界面还是什么都看不到——权限是两层的，第二层没接上。所以接 SSO 时
`DefaultTeams`（或表单里的默认团队）几乎总该配上，并且那个团队要在某个业务组里有授权。
展开见[用户与团队](./users-teams.md)和[业务组授权](./business-groups.md)。

还有一条：**别在夜莺这边手工删 SSO 账号**，下次登录又会被建回来。
账号的生命周期交给身份源，夜莺这边只做 `SyncDelUsers` 之类的跟随。

## 7. 反向代理认证是另一条路

如果前面已经有一层做统一认证的网关，可以不用这页的任何一个身份源，
改用配置文件里的 `[HTTP.ProxyAuth]`：网关认完把用户名放在请求头里传进来。

它和这六个不是一回事，也**不能混用**——开了 `ProxyAuth`，JWT 登录整体停用，
这页配出来的六个登录按钮也就都没用了。它的前提条件（17000 必须只对网关开放）
和风险见[网络与 TLS 加固](./network-tls.md)。

## 下一步

- 账号建出来之后怎么给权限：[用户与团队](./users-teams.md)
- 角色里具体有什么：[角色与权限矩阵](./roles.md)
- 把 ClientSecret 换成加密变量：[站点与用户变量](./variables.md)
