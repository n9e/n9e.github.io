# MCP 认证为什么失败？

MCP 认证失败先看状态码是哪一层拒绝的：网关、Token 还是 OAuth；常见原因是头名写错、Token 过期、回调地址不匹配。

最后校对于 2026-10-10

MCP 客户端连不上：状态显示失败、日志里是 401、或者 OAuth 授权页转了一圈又回到未连接。 这页按「哪一层拒绝了你」组织——**每一层的返回长得不一样**，认出来就不用挨个试。

影响范围仅限接了 MCP 的那个客户端，不影响告警和通知，可以从容排查。 但如果是**改了 `[HTTP.TokenAuth]` 之后所有客户端一起挂**，那就顺带把用 Token 调 `/api/n9e/*` 的脚本也检查一遍——它们共用同一条认证路径。

## 先确认你连的是不是 `/mcp`[​](#先确认你连的是不是-mcp "先确认你连的是不是-mcp的直接链接")

**`/mcp` 在根路径上，不在 `/api/n9e` 前缀下面。** 这一条值得单独排在最前面， 因为夜莺**对没匹配上的 `/api/n9e/*` 返回 200 和前端页面**，不是 404：

```
curl -s --noproxy '*' -o /dev/null -w '%{http_code} %{content_type}\n' \

  http://127.0.0.1:17000/api/n9e/mcp

# 200 text/html; charset=utf-8
```

所以填成 `/api/n9e/mcp` 的客户端拿到的是一个 200 加一段 HTML， 表现出来是「JSON 解析失败」「返回了意料之外的内容」，**不是认证错误**。 **状态码 200 不能当作这个接口存在的证据。** 正确地址是 `http://127.0.0.1:17000/mcp`，对外则是 `https://<你的域名>/mcp`。

## 状态码告诉你是哪一层拒绝的[​](#状态码告诉你是哪一层拒绝的 "状态码告诉你是哪一层拒绝的的直接链接")

拿 `GET /mcp` 探一下——它本来就不被支持，所以返回什么，说明的正是「谁先拦下了你」：

```
curl -s --noproxy '*' -i http://127.0.0.1:17000/mcp -H 'X-User-Token: <你的 Token>'
```

| 返回                                                                | 结论                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| `405 Method Not Allowed` + `Allow: POST`                            | **认证通过了**，只是 GET 不支持。地址和 Token 都是对的 |
| `401 Unauthorized`，`Content-Type: text/plain`，正文 `unauthorized` | 认证没过。往下看                                       |
| `200` + HTML                                                        | 地址错了，见上一节                                     |
| `403`，提示里带 Host                                                | 反向代理没转发 `Host` 头，撞上了 SDK 的 DNS 重绑定防护 |
| 连不上 / 超时                                                       | 网络或代理问题，还没到夜莺                             |

**认证发生在方法检查之前**，所以没带 Token 时 `GET /mcp` 也是 401 而不是 405。 「405 还是 401」就是最快的那道分水岭。

注意 401 的正文是**纯文本 `unauthorized`，不是 JSON**，别拿它去解析 `err` 字段。

## 日志里有没有 `done` 那一行[​](#日志里有没有-done-那一行 "日志里有没有-done-那一行的直接链接")

服务端对每个 `/mcp` 请求打一对日志，**这一对齐不齐，直接说明认证过没过**：

```
INFO router/router_a2a.go:281 [MCP] start trace_id=a22235c1-... method=POST path=/mcp remote=127.0.0.1 body_len=149 body_truncated=false body={"jsonrpc":"2.0","id":1,"method":"initialize",...}

INFO router/router_a2a.go:304 [MCP] done trace_id=a22235c1-... method=POST path=/mcp user=root status=200 cost=5.51ms bytes_out=547
```

* **有 `start` 没有 `done`** —— 请求在认证那一层就被挡掉了，根本没进处理器。 这是认证失败最干脆的判据；
* **有 `done`** —— 认证过了，`user=` 后面就是**这个 Token 属于谁**。 客户端权限不对时先看这里：它连成的身份可能不是你以为的那个账号。

`trace_id` 把两行串起来。另外 `start` 行里的 `body` **只在 Content-Type 是 JSON 时才记**， 否则写成 `<skipped non-json content-type=...>`——看到这个说明客户端的 Content-Type 也不对。

## 常见根因与确认方法[​](#常见根因与确认方法 "常见根因与确认方法的直接链接")

### Token 没传，或者传在了错误的头上[​](#token-没传或者传在了错误的头上 "Token 没传，或者传在了错误的头上的直接链接")

头名来自 `[HTTP.TokenAuth]` 的 `HeaderUserTokenKey`，默认 `X-User-Token`。 改过这一项的部署，客户端也要跟着改。

**两个凭据同时传时，`X-User-Token` 优先。** 服务端先读这个头，为空才去读 `Authorization: Bearer`。所以客户端配置里残留一个过期的 `X-User-Token`， 会把一个好好的 Bearer Token 完全挡住——现象是「我明明重新授权了还是 401」。

**怎么确认**：把客户端那份配置里的头名和 Token 逐字符抄出来，用上面那条 curl 手动发一次。 curl 通了就是客户端配置的问题，curl 不通就是 Token 或服务端的问题。

### Token 无效、被删了，或者服务端把 TokenAuth 关了[​](#token-无效被删了或者服务端把-tokenauth-关了 "Token 无效、被删了，或者服务端把 TokenAuth 关了的直接链接")

**怎么确认**，按这个顺序：

1. **个人中心 → Token 管理**里这条 Token 还在吗？删除**立即生效**，没有缓存；
2. 列表里的\*\*「最近使用」\*\*列有没有更新？发一次请求再刷新页面， 时间没动就说明这个 Token 压根没被服务端读到——回到上一节查头名；
3. 服务端 `[HTTP.TokenAuth]` 是不是被关了。关掉之后 `/mcp` 拒绝所有请求， 启动日志里有一行 `[A2A] HTTP.TokenAuth.Enable=false` 的告警；
4. `[HTTP.A2A]` 的两个开关：`DisableMCP = true` 只关 `/mcp`， `Disable = true` 连 `/a2a` 和 agent card 一起关。后者可以用 `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:17000/.well-known/agent-card.json` 验，正常是 200。

**怎么修**：Token 没了就重新建一个。**一个用途一个 Token**， 这样吊销一个不会牵连别人。

### 反向代理把 `/mcp` 拦在外面[​](#反向代理把-mcp-拦在外面 "反向代理把-mcp-拦在外面的直接链接")

`/mcp` 在根路径，只转发 `/api/n9e/*` 的 nginx 根本够不着它。

**怎么确认**：**绕过代理**直接打后端。同一条 curl，本机 `127.0.0.1:17000` 通、 走域名不通，就是代理的问题。

**怎么修**：加一段，并且**不要漏掉 `Host` 头**——SDK 带 DNS 重绑定防护， 连接来自本机而 `Host` 对不上时会回 403：

```
location /mcp {

    proxy_pass http://127.0.0.1:17000;

    proxy_http_version 1.1;

    proxy_set_header Host $host;



    proxy_buffering off;        # 不加这句，流式回答一个字都吐不出来

    proxy_read_timeout 3600s;

    proxy_send_timeout 3600s;

}
```

「连上了但大约 60 秒后断」基本都是缺 `proxy_buffering off` 和长超时。

### OAuth：客户端发现不到授权服务器[​](#oauth客户端发现不到授权服务器 "OAuth：客户端发现不到授权服务器的直接链接")

Claude、ChatGPT 这类托管客户端**发不了自定义头**，只能走 OAuth。 它们靠 `.well-known` 自己发现该去哪授权，而这两个端点**没开就是 404**：

```
curl -s --noproxy '*' -o /dev/null -w '%{http_code}\n' \

  http://127.0.0.1:17000/.well-known/oauth-authorization-server

curl -s --noproxy '*' -o /dev/null -w '%{http_code}\n' \

  http://127.0.0.1:17000/.well-known/oauth-protected-resource/mcp
```

**怎么确认**：两个都是 404，就是 `[HTTP.MCPAuth]` / `[HTTP.RSAuth]` 都没开。 这两节**在 `etc/config.toml` 里根本不存在**，得自己手写。 同样地，没开 OAuth 时 401 响应上**不会带 `WWW-Authenticate` 头**—— 而托管客户端正是靠这个头去发现授权入口的，所以它只会报「连不上」。

**怎么修**：见 [OAuth 2.1 与外部身份提供方](https://n9e.github.io/zh/docs/ai/oauth.md)。 代理上除了 `/mcp` 还要放行 `/oauth/` 和 `/.well-known/`。

### OAuth：地址和 Issuer 对不上[​](#oauth地址和-issuer-对不上 "OAuth：地址和 Issuer 对不上的直接链接")

授权走完又回到未连接，通常是地址不满足这三条：

**怎么确认**：拿用户在客户端里填的那个地址，逐条对：

1. **浏览器能不能打开**——流程里要真的跳转到登录页， 所以不能是只有服务端能访问的 IP、容器名或 `127.0.0.1`；
2. **协议、域名、端口和 `Issuer` 要逐字节相同**——`Issuer` 是 `https://n9e.example.com` 就不能填 `http://`，也不能多带端口；
3. **必须是 HTTPS**——多数客户端出于安全拒绝 `http://` 的远端地址 （本地调试的 `localhost` 除外）。

多实例部署（多个 center 挂在负载均衡后面）**必须显式配 `Issuer`**， 否则每个实例各自猜一个，客户端会在不同实例间对不上。

**怎么修**：把 `Issuer` 设成用户浏览器真正访问的那个地址，重启 center， 让客户端重新走一次授权。

## 确认修好了[​](#确认修好了 "确认修好了的直接链接")

1. 用客户端里那份一模一样的地址和凭据，手动发一次 `initialize`：

   ```
   curl -s --noproxy '*' -X POST http://127.0.0.1:17000/mcp \

     -H 'X-User-Token: <你的 Token>' \

     -H 'Content-Type: application/json' \

     -H 'Accept: application/json, text/event-stream' \

     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{

           "protocolVersion":"2025-06-18","capabilities":{},

           "clientInfo":{"name":"curl","version":"1"}}}'
   ```

   **预期结果**：一行 `event: message` 加一行 `data:`，里面 `serverInfo.name` 是 `Nightingale MCP Server`，响应头里有 `Mcp-Session-Id`；

2. 到服务端日志里确认这次请求**有 `[MCP] done` 那一行**，并且 `user=` 是你期望的账号；

3. 回客户端重启一次，确认服务器状态变成已连接，工具数是 **42**（默认只注册只读工具）；

4. 让它执行一个只读请求，比如「列出我能看到的业务组」， 返回的条数应该和这个账号登录界面看到的一致。

工具数不对、或者少了某些工具，那是另一个问题，见 [MCP 工具为什么缺失或被拒绝？](https://n9e.github.io/zh/docs/troubleshooting/mcp-tools-missing.md)。

## 收集这些再去提问[​](#收集这些再去提问 "收集这些再去提问的直接链接")

1. 客户端里填的**完整地址**（域名和路径都要，Token 替换掉）和它用的头名；
2. 上面那条 curl 的**完整响应头 + 正文**；
3. 日志里这个 `trace_id` 的 `[MCP] start` / `[MCP] done` 两行；
4. 服务端 `[HTTP.TokenAuth]`、`[HTTP.A2A]`、`[HTTP.MCPAuth]`、`[HTTP.RSAuth]` 四节的配置；
5. 有反向代理的话，`/mcp` 那段 location 配置。

**脱敏**：Token、client secret、签名密钥一律替换成占位符； `trace_id`、状态码、`user=` 后面的用户名要保留，它们不是凭据但正是线索。

## 下一步[​](#下一步 "下一步的直接链接")

* 端点本身怎么开：[启用 MCP 端点](https://n9e.github.io/zh/docs/ai/mcp-endpoint.md)
* Token 怎么建、代表谁：[个人 Token 认证](https://n9e.github.io/zh/docs/ai/token-auth.md)
* 托管客户端和企业 SSO：[OAuth 2.1 与外部身份提供方](https://n9e.github.io/zh/docs/ai/oauth.md)
* 连上了但工具不对：[MCP 工具为什么缺失或被拒绝？](https://n9e.github.io/zh/docs/troubleshooting/mcp-tools-missing.md)
* 客户端侧配置：[连接 Claude Code / Cursor 等客户端](https://n9e.github.io/zh/docs/ai/mcp-clients.md)
