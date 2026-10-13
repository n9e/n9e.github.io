# 个人 Token 认证

创建 Token、放进 X-User-Token 头，并理解客户端继承的正是该用户的权限。

最后校对于 2026-10-10

这页办完你会得到：一个专门给 AI 客户端用的最小权限账号，和它名下的一个 Token； 以及一条验证过这个 Token 能连上 `/mcp` 的命令。

## 1. 建一个专用账号[​](#1-建一个专用账号 "1. 建一个专用账号的直接链接")

先别急着用 root 的 Token。**Token 没有自己的权限，它就是「以这个人的身份行事」的凭据**， 所以 AI 客户端能碰到什么，完全取决于 Token 主人是谁。

在 **人员组织 → 用户管理** 里新建一个用户，比如 `ai-readonly`，角色给 `Guest` 或 `Standard` （不要给 `Admin`，`Admin` 会绕过业务组这一层）。再在 **团队管理** 里把它加进某个团队， 让那个团队对你希望 AI 能看到的业务组有读权限。两层权限怎么叠加见 [权限继承与 RBAC](https://n9e.github.io/zh/docs/ai/permissions.md)。

## 2. 生成 Token[​](#2-生成-token "2. 生成 Token的直接链接")

用这个账号登录，点左下角头像 → **个人信息** → **Token 管理** 这个 tab （路由 `/account/profile/token`）。

点 **创建 Token**，填一个 **Token 名称**（必填）。列表里的四列是 Token 名称、Token、创建时间、**最近使用时间**——最后一列在盘点「哪些 Token 还在用」时很有用。

Token 值默认打码，点 **查看** 展开并复制。

预期结果：列表里多一行，最近使用时间还是空的。

一个用途一个 Token（这个给 CI、那个给 AI 客户端），出事的时候能单独吊销、也能追溯到人。

## 3. 怎么发出去[​](#3-怎么发出去 "3. 怎么发出去的直接链接")

请求头名字来自 `[HTTP.TokenAuth]` 的 `HeaderUserTokenKey`，默认 `X-User-Token`：

```
curl -s -X POST http://127.0.0.1:17000/mcp \

  -H 'X-User-Token: YOUR_TOKEN' \

  -H 'Content-Type: application/json' \

  -H 'Accept: application/json, text/event-stream' \

  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{

        "protocolVersion":"2025-06-18","capabilities":{},

        "clientInfo":{"name":"curl","version":"1"}}}'
```

预期结果：`serverInfo.name` 是 `Nightingale MCP Server`。 Token 无效或被删了，返回 **401 + 纯文本 `unauthorized`**。

同一个 Token 同样能用在 `/a2a` 和 `/api/n9e/*` 上——三个入口是同一套鉴权。

## 4. 三个入口，一套权限[​](#4-三个入口一套权限 "4. 三个入口，一套权限的直接链接")

| 入口             | 怎么认                                    | 权限来自     |
| ---------------- | ----------------------------------------- | ------------ |
| 浏览器           | 账号密码或 SSO 换 JWT                     | 登录的那个人 |
| HTTP API         | `X-User-Token`                            | Token 的主人 |
| MCP / A2A 客户端 | 同上，或 OAuth 的 `Authorization: Bearer` | 同上         |

MCP 的工具调用是在进程内重新打到夜莺自己的 `/api/n9e/...` 上的， 带的就是你这个 Token，走的是完整的中间件链。**所以客户端和这个人在页面上能做的事完全一样， 一点不多。**

## 5. 吊销[​](#5-吊销 "5. 吊销的直接链接")

同一个页面上删掉那一行就行，立即生效。删除是按 Token 粒度的： 某个 Token 泄漏了，删它一个，其他人的不受影响。

Token 在删除前**长期有效**，没有过期时间。所以要么定期轮换， 要么至少定期看一眼「最近使用时间」，把不用的清掉。

## 6. Token 之外[​](#6-token-之外 "6. Token 之外的直接链接")

Token 是最省事的做法，但每接一方就要发一次凭据。如果你已经有 SSO， 或者想让 Claude、ChatGPT 这类托管客户端「填个地址就能连」，走 OAuth 更合适—— 用户拿自己的账号授权，你不用发 Token。见 [OAuth 2.1 与外部身份源](https://n9e.github.io/zh/docs/ai/oauth.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* 权限到底怎么算：[权限继承与 RBAC](https://n9e.github.io/zh/docs/ai/permissions.md)
* 把 Token 填进客户端：[接入 Claude Code / Cursor 等客户端](https://n9e.github.io/zh/docs/ai/mcp-clients.md)
* 轮换策略：[Token 与凭据轮换](https://n9e.github.io/zh/docs/security/tokens.md)
