# 认证、Token 与 RBAC 模型

权限只有两层：角色决定能进哪些页面、调哪些接口，业务组成员关系决定能动哪些数据；界面、HTTP API 和 MCP 共用这一套。

最后校对于 2026-10-10

夜莺的权限模型只有两层，但很多人只看到其中一层，于是困惑「为什么我是 Admin 还是改不了这条规则」。

## 两层权限[​](#两层权限 "两层权限的直接链接")

**第一层：角色，决定你能进哪些页面、调哪些接口。** 内置三个角色：`Admin`、`Standard`、`Guest`。角色挂在用户身上，一个用户可以有多个角色。 角色由一组「权限点」组成，比如 `/alert-rules/add`、`/metric/explorer`。

**第二层：业务组成员关系，决定你能操作哪些数据。** 用户属于若干团队，团队是业务组的成员并带读写标记。 见[业务组](https://n9e.github.io/zh/docs/concepts/business-groups.md)。

两层是**且**的关系：

```
能改这条告警规则  =  角色里有「改告警规则」这个权限点

                   且

                   我所在的某个团队，对这条规则所属的业务组有读写权
```

`Admin` 角色跳过第二层。所以「我是 Admin 却改不了」通常意味着你其实是 `Standard`。

## 三种认证方式，同一套权限[​](#三种认证方式同一套权限 "三种认证方式，同一套权限的直接链接")

| 入口             | 怎么认证                               | 权限来自       |
| ---------------- | -------------------------------------- | -------------- |
| 浏览器           | 用户名密码或 SSO，换 JWT               | 登录的那个用户 |
| HTTP API         | `X-User-Token` 个人 Token              | Token 所属用户 |
| MCP / A2A 客户端 | 同上，或 OAuth `Authorization: Bearer` | 同上           |

**关键一点：Token 没有独立权限。** 它就是「以这个用户的身份行动」的凭据， 一点不多、一点不少。

这条规则的实际含义是：给 AI 客户端或者自动化脚本用的 Token， 应该建一个**最小权限的专用账号**再生成，而不是直接用 root 的。 账号出问题时也能单独吊销，不影响别人。

## 单点登录[​](#单点登录 "单点登录的直接链接")

支持 OIDC、OAuth2、LDAP、CAS，以及钉钉、飞书扫码登录。 在 **系统配置 → 单点登录** 里配。

接了 SSO 之后，用户第一次登录会自动创建，默认角色可以配。 外部的组织架构可以映射成夜莺的角色，具体见 [SSO 与外部身份源](https://n9e.github.io/zh/docs/security/sso.md)。

也支持反向代理认证（`[HTTP.ProxyAuth]`）：由前置网关完成认证， 把用户名放在请求头里传进来。**开了这个，JWT 登录就会被禁用**—— 所以要么全走网关，要么全走夜莺自己的登录。

## Token 怎么管[​](#token-怎么管 "Token 怎么管的直接链接")

个人 Token 在头像菜单里生成。它长期有效，直到被删除。

生产上值得做的：

* 给每个用途单独一个 Token（这个给 CI、那个给 AI 客户端），出事好定位；
* 人员离职、Token 泄漏时逐个吊销，不用改所有人的凭据；
* 定期轮换，见 [Token 与凭据轮换](https://n9e.github.io/zh/docs/security/tokens.md)。

## 相关[​](#相关 "相关的直接链接")

* [角色与权限矩阵](https://n9e.github.io/zh/docs/security/roles.md)
* [用户与团队](https://n9e.github.io/zh/docs/security/users-teams.md)
* [权限矩阵（完整列表）](https://n9e.github.io/zh/docs/reference/permissions.md)
* [MCP 的权限继承](https://n9e.github.io/zh/docs/ai/permissions.md)
