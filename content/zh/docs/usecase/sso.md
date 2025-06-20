---
title: "单点登录（SSO）"
description: "夜莺监控（Nightingale）支持单点登录（SSO）功能，可以通过 SSO 方式登录夜莺监控。SSO 支持多种协议，如 OAuth2、OIDC 等。"
date: 2025-06-20T08:16:11.095+08:00
lastmod: 2025-06-20T08:16:11.095+08:00
draft: false
images: []
menu:
  docs:
    parent: "usecase"
weight: 10200
toc: true
---

夜莺监控（Nightingale）支持单点登录（SSO）功能，支持 LDAP、CAS、OAuth2、OIDC 等多种协议。SSO 功能可以让用户通过统一的身份认证系统登录夜莺监控，简化用户管理和登录流程，也降低了安全风险。

对于 CAS、OAuth2、OIDC 三种方式，用户通过 SSO 登录夜莺之后，夜莺会判断当前登录的用户是否存在于夜莺的用户表中，如果不存在，则会自动创建一个用户，如果存在，夜莺会用 SSO 中的用户信息覆盖夜莺中已有用户的信息（前提是配置项 `CoverAttributes = true`，后文会介绍），这样的好处是用户只需要在 SSO 那里维护手机号、邮箱即可，夜莺会在用户登录时自动同步（当然，仅是在登录时同步，所以用户至少要通过 SSO 登录过一次夜莺，否则夜莺中没有这个用户的信息）。

## 配置 OIDC

这是最推荐的方式，如果你的 SSO 同时支持 OIDC 和 OAuth2，建议使用 OIDC。

### 配置项说明

下面是 OIDC 各个配置项的说明：

```toml
# 是否开启 OIDC 单点登录，夜莺可以同时开启多个 SSO 方式
Enable = false

# 登录页面会展示 SSO 登录地址的超链接，DisplayName 用于配置超链接的文本内容
DisplayName = 'OIDC'

# IDC 登录验证通过后，需要跳转到夜莺，下面是配置夜莺用于 OIDC 的回调地址
# 您需要把 n9e.com 替换为您的夜莺地址，/callback 是固定的路径
RedirectURL = 'http://n9e.com/callback'

# OIDC SSO 服务器根地址，换成您的 OIDC 服务器地址
SsoAddr = 'http://sso.example.org'

# OIDC SSO 服务器的登出地址，用户在夜莺中点击登出时会跳转到这个地址，即可完成夜莺和 SSO 的同步登出
SsoLogoutAddr = 'http://sso.example.org/session/end'

# OIDC 给夜莺分配的 ClientId 和 ClientSecret，必须要配置，一般是在 SSO 服务器上注册应用时获取的
ClientId = ''
ClientSecret = ''

# 用户通过 SSO 登录夜莺，夜莺发现用户在夜莺的用户表中不存在时，会自动创建一个用户
# 创建用户的时候，需要给这个用户一个角色，下面是配置默认角色的列表
DefaultRoles = ['Standard']

# 用户通过 SSO 登录夜莺时，夜莺会向 SSO 服务器请求用户信息，并将用户信息写入夜莺的用户表中
# 如果 CoverAttributes = true 则会覆盖夜莺中已有的用户信息，比如手机号、邮箱等。通常这里就是配置为 true 即可
CoverAttributes = true

# Scope 是 OIDC 协议中的一个概念，表示请求获取的用户信息字段列表，通常就是下面的这些字段
Scopes = ['openid', 'profile', 'email', 'phone']

# 用户在 OIDC 中信息字段和夜莺中的用户信息字段不是 100% 一一对应的
# 所以在下面配置：夜莺的各个字段对应 OIDC 中的哪些字段
# Username、Nickname、Phone、Email 就是夜莺中的用户信息字段
# 后面的 sub、nickname、phone_number、email 就是 OIDC 中的用户字段名
# 请根据您的 OIDC 服务器的用户信息字段进行调整
[Attributes]
Username = 'sub'
Nickname = 'nickname'
Phone = 'phone_number'
Email = 'email'
```

### 配置项 FAQ

**1. 用户使用 OIDC 可以登录成功，但是用户名、手机号等获取不到**

可以调整夜莺的日志级别为 DEBUG（在 config.toml 中调整），然后重启夜莺，过滤日志关键字：`sso_exchange_user: oidc info`，再测试一遍登录，可以查看从单点登录系统获取到的用户信息有哪些，然后根据实际情况调整 `Attributes` 中的字段映射。

### 对接 Authing 演示

下面使用 [Authing](https://www.authing.com/) 作为 OIDC 的 SSO 服务器进行演示。首先，要在 Authing 上创建一个应用，获取 ClientId 和 ClientSecret。

<img src="/img/usecase/sso/authing-oidc.png" alt="Authing OIDC" />

然后在夜莺中配置 OIDC 的相关信息：

```toml
Enable = true
DisplayName = 'OIDC'
RedirectURL = 'http://192.168.127.151:17000/callback'
SsoAddr = 'https://n9e.authing.cn/oidc'
SsoLoginOutAddr = 'https://n9e.authing.cn/oidc/session/end'
ClientId = '65befb5b452d4854f9731b9b'
ClientSecret = '0af4...'
CoverAttributes = true
DefaultRoles = ['Standard']
Scopes = ['openid', 'profile', 'username', 'email', 'phone']

[Attributes]
Username = 'username'
Nickname = 'nickname'
Phone = 'phone_number'
Email = 'email'
```

上面的 `192.168.127.151:17000` 是我这个测试环境的夜莺地址，您需要替换为自己的夜莺地址。

### 对接飞书演示

飞书也支持 OIDC 协议，我们对这种方式也做一个说明。参考飞书的官方文档创建应用：[配置应用单点登录](https://anycross.feishu.cn/documentation/platform/configure-sso)，相关配置：

- 授权模式：可以把 authorization_code 和 refresh_token 都选上
- Scope：可以把 openid profile email phone offline_access 都选上
- 回调地址：填写 `http://n9e.com/callback`，注意把 `n9e.com` 替换为您的夜莺地址，需要公网可达，除非您的飞书也是私有化内网部署的

配置完成之后即可拿到 Issuer（即 SSO Server 地址）、ClientId 和 ClientSecret，配置到夜莺中。另外，也可以拿到 SSO Logout 地址，是一个类似这样的地址：

```
https://anycross.feishu.cn/sso/....../oidc/revoke
```

这个地址也配置到夜莺的 `SsoLogoutAddr` 中，虽然配置了这个地址，但是无法联动登出，下面是飞书文档的 [官方解释说明](https://anycross.feishu.cn/documentation/platform/configure-sso)：

> 由于 SSO 应用的登录态是从飞书登录态派生出的，因此不支持单点登出，即在 SSO 应用登出的时候，不能同时登出飞书。虽然平台提供了单点登出的地址，但这个地址是为了防止三方系统将其设置为必填项，地址本身并不生效。

最终夜莺中的配置如下：

```toml
Enable = true
DisplayName = 'OIDC'
RedirectURL = 'http://n9e.com/callback'
SsoAddr = 'https://anycross.feishu.cn/sso/XXXXX'
SsoLoginOutAddr = 'https://anycross.feishu.cn/sso/XXXXX/oidc/revoke'
ClientId = 'xxx'
ClientSecret = 'xxx'
CoverAttributes = true
DefaultRoles = ['Standard']
Scopes = ['openid', 'profile', 'email', 'phone']

[Attributes]
Username = 'name'
Nickname = 'name'
Phone = 'phone_number'
Email = 'email'
```

> 上面的 `n9e.com` 需要替换为您自己的夜莺地址，需要公网可达，除非您的飞书也是私有化内网部署的。

### 对接 Keycloak 演示

之前有网友写过一篇文章，讲解 Grafana 和夜莺一起对接 Keycloak，大家可以参考：[Grafana 和夜莺通过 Keycloak 深度对接整合](https://mp.weixin.qq.com/s/Bo386PKDULMLYuIPV1EkiA)。

## 配置 OAuth2

如果您的 SSO 既支持 OIDC 又支持 OAuth2，建议使用 OIDC，实在没办法再使用 OAuth2，OAuth2 坑多。

### 配置项说明

```toml
# 是否开启 OAuth2 单点登录，夜莺可以同时开启多个 SSO 方式
Enable = false

# 登录页面会展示 SSO 登录地址的超链接，DisplayName 用于配置超链接的文本内容
DisplayName = 'OAuth2'

# SSO 登录验证通过后，需要跳转到夜莺，下面是配置夜莺用于 OAuth2 的回调地址
# 您需要把 n9e.com 替换为您的夜莺地址，/callback/oauth 是固定的路径
RedirectURL = 'http://n9e.com/callback/oauth'

# OAuth2 SSO 服务器根地址，换成您的 OAuth2 服务器地址
SsoAddr = 'https://sso.example.com/oauth2/authorize'

# OAuth2 SSO 服务器的登出地址，用户在夜莺中点击登出时会跳转到这个地址，即可完成夜莺和 SSO 的同步登出
SsoLogoutAddr = 'https://sso.example.com/oauth2/authorize/session/end'

#  获取 OAuth2 token 的地址
TokenAddr = 'https://sso.example.com/oauth2/token'

# OAuth2 提供的用户信息地址，夜莺会通过这个地址获取用户信息
UserInfoAddr = 'https://sso.example.com/api/v1/user/info'

# 从 OAuth2 或许用户信息时，需要把上一步获取到的 token 放到请求头中
# token 可以放在 header 中，也可以放在 formdata 或 querystring 中，需要根据您的 OAuth2 服务器的要求进行配置
TranTokenMethod = 'header'

# OAuth2 给夜莺分配的 ClientId 和 ClientSecret，必须要配置，一般是在 SSO 服务器上注册应用时获取的
ClientId = ''
ClientSecret = ''

# 用户通过 SSO 登录夜莺，夜莺发现用户在夜莺的用户表中不存在时，会自动创建一个用户
# 创建用户的时候，需要给这个用户一个角色，下面是配置默认角色的列表
DefaultRoles = ['Standard']

# 用户通过 SSO 登录夜莺时，夜莺会向 SSO 服务器请求用户信息，并将用户信息写入夜莺的用户表中
# 如果 CoverAttributes = true 则会覆盖夜莺中已有的用户信息，比如手机号、邮箱等。通常这里就是配置为 true 即可
CoverAttributes = true

# 从 OAuth2 中获取用户数据时，返回的 JSON 格式数据是否为数组，根据你们的 OAuth2 服务器的返回格式进行配置
# 如果是数组，夜莺会取第一个元素作为用户信息
UserinfoIsArray = false

# OAuth2 用户信息的前缀，通常是 'data'，即返回的 JSON 数据中会有一个 'data' 字段，里面是用户信息
UserinfoPrefix = 'data'

# Scope 是 OAuth2 协议中的一个概念，表示请求获取的用户信息字段列表，通常就是下面的这些字段
Scopes = ['profile', 'email', 'phone']

# 用户在 OAuth2 中信息字段和夜莺中的用户信息字段不是 100% 一一对应的
# 所以在下面配置：夜莺的各个字段对应 OAuth2 中的哪些字段
# Username、Nickname、Phone、Email 就是夜莺中的用户信息字段
# 后面的 sub、nickname、phone_number、email 就是 OAuth2 中的用户字段名
# 请根据您的 OAuth2 服务器的用户信息字段进行调整
[Attributes]
Username = 'sub'
Nickname = 'nickname'
Phone = 'phone_number'
Email = 'email'
```

### 对接 Authing 演示

使用 [Authing](https://www.authing.com/) 作为 OAuth2 的 SSO 服务器进行演示。首先，要在 Authing 上启用 OAuth2。配置样例如下：

<img src="/img/usecase/sso/authing-oauth2.png" alt="Authing OAuth2" />

然后在夜莺中配置 OAuth2 的相关信息：

```toml
Enable = true
DisplayName = 'OAuth2'
RedirectURL = 'http://192.168.127.151:17000/callback/oauth'
SsoAddr = 'https://n9e.authing.cn/oauth/auth'
SsoLogoutAddr = 'https://n9e.authing.cn/oauth/session/end'
TokenAddr = 'https://n9e.authing.cn/oauth/token'
UserInfoAddr = 'https://n9e.authing.cn/oauth/me'
TranTokenMethod = 'header'
ClientId = '65befb5b452d4854f9731b9b'
ClientSecret = '0af4...'
CoverAttributes = true
DefaultRoles = ['Standard']
UserinfoIsArray = false
UserinfoPrefix = ''
Scopes = ['profile', 'username', 'email', 'phone']

[Attributes]
Username = 'username'
Nickname = 'nickname'
Phone = 'phone'
Email = 'email'
```

上面的 `192.168.127.151:17000` 是我这个测试环境的夜莺地址，您需要替换为自己的夜莺地址。

## 配置 CAS

夜莺监控（Nightingale）也支持 CAS 协议的单点登录。相比 OIDC，坑更多，慎用。

### 配置项说明

```toml
# 是否开启 CAS 单点登录，夜莺可以同时开启多个 SSO 方式
Enable = false

# 登录页面会展示 SSO 登录地址的超链接，DisplayName 用于配置超链接的文本内容
DisplayName = 'CAS'

# CAS 登录验证通过后，需要跳转到夜莺，下面是配置夜莺用于 CAS 的回调地址
# 您需要把 n9e.com 替换为您的夜莺地址，/callback/cas 是固定的路径
RedirectURL = 'http://n9e.com/callback/cas'

# CAS SSO 服务器根地址，换成您的 CAS 服务器地址
SsoAddr = 'https://cas.example.com/cas'

# CAS SSO 服务器的登出地址，用户在夜莺中点击登出时会跳转到这个地址，即可完成夜莺和 SSO 的同步登出
SsoLogoutAddr = 'https://cas.example.com/cas/session/end'

# LoginPath 这个配置项，是为了兼容不同的 CAS 版本，因为不同的 CAS 版本登录地址可能不同
# 如果您配置了 LoginPath，则夜莺会在 SsoAddr 的基础上拼接 LoginPath 作为登录地址
# 如果您没有配置 LoginPath，夜莺的逻辑是：
# 1. 如果发现 SsoAddr 中包含 p3 关键字，就设置 LoginPath = '/login'
# 2. 如果没有包含 p3 关键字，就设置 LoginPath = '/cas/login'
LoginPath = ''

# 用户通过 SSO 登录夜莺，夜莺发现用户在夜莺的用户表中不存在时，会自动创建一个用户
# 创建用户的时候，需要给这个用户一个角色，下面是配置默认角色的列表
DefaultRoles = ['Standard']

# 用户通过 SSO 登录夜莺时，夜莺会向 SSO 服务器请求用户信息，并将用户信息写入夜莺的用户表中
# 如果 CoverAttributes = true 则会覆盖夜莺中已有的用户信息，比如手机号、邮箱等。通常这里就是配置为 true 即可
CoverAttributes = true

# 用户在 CAS 中信息字段和夜莺中的用户信息字段不是 100% 一一对应的
# 所以在下面配置：夜莺的各个字段对应 CAS 中的哪些字段
# Username、Nickname、Phone、Email 就是夜莺中的用户信息字段
# 后面的 sub、nickname、phone_number、email 就是 CAS 中的用户字段名
# 请根据您的 CAS 服务器的用户信息字段进行调整
[Attributes]
Username = 'sub'
Nickname = 'nickname'
Phone = 'phone_number'
Email = 'email'
```

### 对接 Authing 演示

使用 [Authing](https://www.authing.com/) 作为 CAS 的 SSO 服务器进行演示。首先，要在 Authing 上启用 CAS。配置样例如下：

<img src="/img/usecase/sso/authing-cas.png" alt="Authing CAS" />

然后在夜莺中配置 CAS 的相关信息：

```toml
Enable = true
DisplayName = 'CAS'
RedirectURL = 'http://192.168.127.151:17000/callback/cas'
SsoAddr = 'https://n9e.authing.cn/cas-idp/65befb5b452d4854f9731b9b'
SsoLogoutAddr = 'https://n9e.authing.cn/cas-idp/65befb5b452d4854f9731b9b/logout'
LoginPath = '/login'
CoverAttributes = true
DefaultRoles = ['Standard']

[Attributes]
Username = 'username'
Nickname = 'nickname'
Phone = 'phone_number'
Email = 'email'
```

上面的 `192.168.127.151:17000` 是我这个测试环境的夜莺地址，您需要替换为自己的夜莺地址。

## 配置 LDAP

夜莺监控（Nightingale）也支持 LDAP 协议的认证登录。LDAP 是一种轻量级目录访问协议，通常用于企业内部的用户认证和授权。前面讲到的 SSO 机制（OIDC、OAuth2、CAS）都没法把用户信息周期性全量同步到夜莺中，而 LDAP 则可以做到这一点。

LDAP 在页面上也没有单独的登录超链接入口，用户在输入用户名和密码登录夜莺时，夜莺首先去 DB 中查询用户信息，如果没有找到，则自动检查 LDAP 是否启用，如果启用了，就直接使用 LDAP 进行认证登录。

### 配置项说明

```toml
# 是否开启 LDAP 单点登录，夜莺可以同时开启多个 SSO 方式
Enable = false

# LDAP 服务器地址和端口、TLS、StartTLS 等配置
# 请根据您自己的环境进行配置
Host = 'ldap.example.org'
Port = 389
TLS = false
StartTLS = true

# LDAP 服务器的根 DN，可以 Google、GPT 获取更多信息
BaseDn = 'dc=example,dc=org'

# 管理员信息，这个账号需要具备查询所有用户信息的权限
BindUser = 'cn=manager,dc=example,dc=org'
BindPass = '*******'

# 是否同步 LDAP 中的创建用户至夜莺
SyncAddUsers = false

# 是否同步 LDAP 中的删除用户操作至夜莺
SyncDelUsers = false

# 同步频率，单位：秒
SyncInterval = 86400

# 用户登录时，检查用户是否存在于 LDAp 中的筛选条件
# openldap 和 AD 通常有不同的筛选格式
# openldap 的格式可能为： (&(uid=%s))
# AD 的格式可能为 (&(sAMAccountName=%s))
# 您需要根据您的 LDAP 服务器类型进行调整
AuthFilter = '(&(uid=%s))'

# 查询 LDAP 中全量用户的筛选条件
# 根据您的 LDAP 服务器类型进行调整
UserFilter = '(&(uid=*))'

# 用户通过 LDAP 登录夜莺，夜莺发现用户在夜莺的用户表中不存在时，会自动创建一个用户
# 创建用户的时候，需要给这个用户一个角色，下面是配置默认角色的列表
DefaultRoles = ['Standard']

# 用户通过 LDAP 登录夜莺时，夜莺会向 LDAP 服务器请求用户信息，并将用户信息写入夜莺的用户表中
# 如果 CoverAttributes = true 则会覆盖夜莺中已有的用户信息，比如手机号、邮箱等。通常这里就是配置为 true 即可
CoverAttributes = true

# 用户在 LDAP 中信息字段和夜莺中的用户信息字段不是 100% 一一对应的
# 所以在下面配置：夜莺的各个字段对应 LDAP 中的哪些字段
# Username、Nickname、Phone、Email 就是夜莺中的用户信息字段
# 后面的 uid、cn、mobile、mail 就是 LDAP 中的用户字段名
# 请根据您的 LDAP 服务器的用户信息字段进行调整
[Attributes]
Username = 'uid'
Nickname = 'cn'
Phone = 'mobile'
Email = 'mail'
```

上面的配置信息如果您看完注释还是不清楚如何配置，可以咨询贵司的 LDAP 管理员，他大概率是比较清楚的。

