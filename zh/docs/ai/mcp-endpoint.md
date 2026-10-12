# 启用 MCP 端点

/mcp 端点内置在 n9e 进程里，默认开启；用 curl 列出工具清单即可确认存活，配置里可只放开部分工具集。

这页办完你会得到：一条用 curl 验证过、能列出工具清单的 `/mcp` 端点， 以及一份写清楚了「只放开哪些工具集」的配置。

## 它默认就开着[​](#它默认就开着 "它默认就开着的直接链接")

`n9e` 进程自身就是 MCP Server，没有第二个组件要部署。`[HTTP.A2A]` 的两个开关默认都是 `false`：

```
[HTTP.A2A]

# Disable = false     # true = 关掉 /a2a 和 /mcp 全部端点，连 Agent Card 一起

# DisableMCP = false  # true = 只关 /mcp，/a2a 保留
```

`etc/config.toml` 里这一节整段是注释掉的，也就是说**你什么都不用改**。

前提是 `[HTTP.TokenAuth]` 开着（默认开）。它关掉的话 `/mcp` 会拒绝所有请求， 启动日志里会有一条 `[A2A] HTTP.TokenAuth.Enable=false` 的告警。

## 走什么协议[​](#走什么协议 "走什么协议的直接链接")

**MCP Streamable HTTP，无状态（stateless）模式**。不支持旧的 SSE 双端点传输，也不支持 stdio。

| 事实             | 值                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 端点             | `POST /mcp`（根路径，**不在** `/api/n9e` 前缀下）                               |
| 必须的请求头     | `Content-Type: application/json`、`Accept: application/json, text/event-stream` |
| 鉴权             | `X-User-Token`，或 OAuth 的 `Authorization: Bearer`                             |
| `GET /mcp`       | 405，`Allow: POST`——无状态模式不提供独立 SSE 流                                 |
| `Mcp-Session-Id` | initialize 响应里会回一个，但服务端**不校验**，后续请求带不带都行               |
| serverInfo       | `Nightingale MCP Server` / `1.0.0`                                              |

无状态意味着每个 POST 都是自包含的，多实例挂在负载均衡后面**不需要会话粘滞**。

## 确认它活着[​](#确认它活着 "确认它活着的直接链接")

先在「个人设置 → Token 管理」里生成一个 Token（做法见 [个人 Token 认证](https://n9e.github.io/zh/zh/docs/ai/token-auth.md)），然后：

```
curl -s -X POST http://127.0.0.1:17000/mcp \

  -H 'X-User-Token: YOUR_TOKEN' \

  -H 'Content-Type: application/json' \

  -H 'Accept: application/json, text/event-stream' \

  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{

        "protocolVersion":"2025-06-18","capabilities":{},

        "clientInfo":{"name":"curl","version":"1"}}}'
```

预期结果：一行 `event: message` 加一行 `data:`，`data` 里 `serverInfo.name` 是 `Nightingale MCP Server`，响应头里有 `Mcp-Session-Id`。

不带 Token 会返回 **401，纯文本 `unauthorized`**——不是 JSON，别拿 `err` 字段去解析它。

拿到 `Mcp-Session-Id` 后，先发一条 `notifications/initialized`（返回 202），再发 `{"jsonrpc":"2.0","id":2,"method":"tools/list"}`，默认配置下应当返回 **42 个只读工具**。

## 只放开一部分工具集[​](#只放开一部分工具集 "只放开一部分工具集的直接链接")

留空 = 全部默认工具集。想收窄就显式列：

```
[HTTP.A2A]

MCPToolsets = ["alerts", "dashboards"]
```

合法名字有 13 个：`alerts`、`targets`、`datasource`、`mutes`、`busi_groups`、 `notify_rules`、`alert_subscribes`、`event_pipelines`、`users`、`metrics`、`logs`、 `dashboards`、`roles`。

写错的名字会被丢掉并打一条 `[MCP] ignoring unknown toolset` 的告警，**不会**回退成「全放开」。 一份全是错别字的白名单换来的是零个工具，不是 74 个。各工具集覆盖什么见 [读写工具集](https://n9e.github.io/zh/zh/docs/ai/toolsets.md)。

## 放在反向代理后面[​](#放在反向代理后面 "放在反向代理后面的直接链接")

`/mcp` 在根路径，只转发 `/api/n9e/*` 的 nginx 是够不着它的：

```
location /mcp {

    proxy_pass http://127.0.0.1:17000;

    proxy_http_version 1.1;

    proxy_set_header Host $host;



    proxy_buffering off;        # 不关掉，流式回答永远吐不出来

    proxy_read_timeout 3600s;   # 一次问答跑几分钟是常态

    proxy_send_timeout 3600s;

}
```

`proxy_set_header Host` 别省：SDK 自带 DNS rebinding 防护， 本机监听 + Host 头不是本机名时会直接 403。

同时建议把 `BaseURL` 显式写上，否则 Agent Card 里公布的地址是从请求头猜的， 第三方可能拿到一个内网地址：

```
[HTTP.A2A]

BaseURL = "https://n9e.example.com"
```

## 关掉它[​](#关掉它 "关掉它的直接链接")

```
[HTTP.A2A]

DisableMCP = true   # 只关 MCP

# Disable = true    # 连 /a2a 和 Agent Card 一起关
```

改完重启 center 生效。

## 下一步[​](#下一步 "下一步的直接链接")

* 建 Token 并理解它代表谁：[个人 Token 认证](https://n9e.github.io/zh/zh/docs/ai/token-auth.md)
* 把客户端接上来：[接入 Claude Code / Cursor 等客户端](https://n9e.github.io/zh/zh/docs/ai/mcp-clients.md)
* 把写工具打开：[安全地启用写工具](https://n9e.github.io/zh/zh/docs/ai/write-tools.md)
