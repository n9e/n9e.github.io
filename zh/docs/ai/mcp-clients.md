# 接入 Claude Code / Cursor 等客户端

Claude Code、Cursor 等 MCP 客户端只需 /mcp 地址和一个 Token 即可接入；一条只读提示词就能验证连通。

这页办完你会得到：一个连上夜莺的 MCP 客户端， 以及一条只读的验证提示词，跑通了就说明地址、Token、权限三件事都对。

## 客户端只需要两样东西[​](#客户端只需要两样东西 "客户端只需要两样东西的直接链接")

| 要填的 | 值                                                                |
| ------ | ----------------------------------------------------------------- |
| 地址   | `https://n9e.example.com/mcp`（根路径，**不在** `/api/n9e` 下面） |
| 认证   | 请求头 `X-User-Token: <你的 Token>`                               |

Token 怎么建见 [个人 Token 认证](https://n9e.github.io/zh/zh/docs/ai/token-auth.md)。 本机验证时地址是 `http://127.0.0.1:17000/mcp`。

传输协议是 MCP Streamable HTTP，**不需要**任何本地 stdio 网关或代理进程。 客户端配置里如果有 `command` / `args` 这种 stdio 写法，那是另一种接法，不适用这里。

## 配置的通用写法[​](#配置的通用写法 "配置的通用写法的直接链接")

Claude Code、Claude Desktop、Cursor 这类客户端用的是同一种 JSON 结构， 差别只在文件放哪儿：

```
{

  "mcpServers": {

    "nightingale": {

      "type": "http",

      "url": "https://n9e.example.com/mcp",

      "headers": { "X-User-Token": "YOUR_TOKEN" }

    }

  }

}
```

* **Claude Code**：写进用户级配置 `~/.claude.json`，或用 `claude mcp add` 交互添加；
* **Cursor**：写进 `~/.cursor/mcp.json`（全局）或项目里的 `.cursor/mcp.json`；
* **其他客户端**：找它文档里「远程 / HTTP MCP server」那一节， 能填 URL 和自定义请求头就能连。

改完重启客户端。预期结果：客户端的 MCP 服务器列表里 `nightingale` 是已连接状态， 工具数默认是 **42**（打开写工具后是 74）。

## 托管客户端：Claude、ChatGPT[​](#托管客户端claudechatgpt "托管客户端：Claude、ChatGPT的直接链接")

这类客户端跑在别人的服务器上，填不了自定义请求头，只能填一个地址。 它们走 OAuth：你在夜莺上开内置授权服务器，用户在客户端里点一次「允许」就连上了， 你一个 Token 都不用发。

在客户端的「添加自定义连接器 / Remote MCP server」里填 `https://n9e.example.com/mcp`， 剩下的它自己发现。前提是服务端先开好 OAuth，见 [OAuth 2.1 与外部身份源](https://n9e.github.io/zh/zh/docs/ai/oauth.md)——那页还列了地址必须满足的三个条件 （浏览器可达、与 `Issuer` 完全一致、HTTPS）。

## 验证连通的第一条提示词[​](#验证连通的第一条提示词 "验证连通的第一条提示词的直接链接")

连上之后，先让它做一件只读、结果你自己一眼能核对的事：

> 列出我能看到的所有业务组。

预期结果：返回的业务组和你用这个账号登录页面看到的一模一样。 数量对不上，说明 Token 属于另一个账号，或者账号权限没按你想的收紧—— 回到 [权限继承与 RBAC](https://n9e.github.io/zh/zh/docs/ai/permissions.md)。

再试一条带数据的：

> 现在有哪些活跃告警？按级别分组告诉我。

这条要跑通 `list_active_alerts`，能答上来说明工具调用这条路是通的。

## 连不上的时候[​](#连不上的时候 "连不上的时候的直接链接")

| 现象                   | 多半是                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------ |
| 401                    | Token 错了、被删了，或 `[HTTP.TokenAuth]` 被关了                                     |
| 405                    | 客户端发的是 `GET /mcp`——无状态模式不提供独立 SSE 流，只接 POST                      |
| 415 / 400              | 缺 `Content-Type: application/json` 或 `Accept: application/json, text/event-stream` |
| 403 且提到 Host        | 反向代理没设 `proxy_set_header Host`，撞上了 DNS rebinding 防护                      |
| 连上了但一个工具都没有 | `MCPToolsets` 里的名字写错了，全被丢弃了                                             |
| 大约 60 秒后断开       | nginx 缺 `proxy_buffering off` 和长超时                                              |

逐条的排查动作见 [AI / Skill / MCP 排障](https://n9e.github.io/zh/zh/docs/ai/troubleshooting.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* 让它能改东西：[安全地启用写工具](https://n9e.github.io/zh/zh/docs/ai/write-tools.md)
* 好用的提示词：[常见排查工作流](https://n9e.github.io/zh/zh/docs/ai/workflows.md)
* 工具清单：[MCP 工具](https://n9e.github.io/zh/zh/docs/reference/mcp-tools.md)
