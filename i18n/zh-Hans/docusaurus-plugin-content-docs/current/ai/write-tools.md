---
title: "安全地启用写工具"
sidebar_label: "安全地启用写工具"
description: "MCP 写工具默认不注册；在 [HTTP.A2A] 配置里显式打开，可限定到某个 Token，每次改动都留在日志里可追溯。"
---

这页办完你会得到：一份把写能力收到最小面的 `[HTTP.A2A]` 配置，
和一条能回答「刚才那条规则是谁改的」的日志检索命令。

## 默认是关的，而且是真的没注册

`MCPEnableWriteTools = false` 时，32 个写工具**不会被注册**——
不是调用时被拒，而是压根不出现在 `tools/list` 里。模型看不见，也就无从调用。

这道闸在 RBAC 之外。也就是说，即使你不小心把 root 的 Token 给了客户端，
默认配置下它也改不了任何东西。

## 打开它

```toml
[HTTP.A2A]
MCPEnableWriteTools = true
```

改完重启 center。验证：`tools/list` 应当从 42 个变成 74 个。

```bash
curl -s -X POST http://127.0.0.1:17000/mcp \
  -H 'X-User-Token: YOUR_TOKEN' -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Mcp-Session-Id: YOUR_SESSION_ID' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

## 打开之前先把范围收窄

写开关是全局的，收窄靠 `MCPToolsets`。**两件事一起做**，只开开关不收范围是最差的组合：

```toml
[HTTP.A2A]
MCPEnableWriteTools = true
MCPToolsets = ["alerts", "mutes", "dashboards"]
```

优先摘掉的两个：

- **`users`** —— 里面的 `create_user` / `update_user_profile` 顺带分配角色，能提权；
  `reset_user_password` 能重置任意用户密码。
- **`roles`** —— `bind_role_operations` 整体替换角色的权限集。

其次考虑摘掉的：`datasource`（写凭据 + 向填入的地址发探测）、
`notify_rules`（Webhook 媒介等于把告警内容发到任意地址）。

各工具集里具体有什么见 [读写工具集](./toolsets.md)。

## 「限定到某个 Token」是怎么回事

配置里**没有**「这个 Token 能写、那个只能读」这样的开关。写能力的边界是两层叠出来的：

```
这个客户端能改这条规则  =  MCPEnableWriteTools = true
                          AND  这个工具集在 MCPToolsets 里
                          AND  Token 主人的角色有对应的权限点
                          AND  Token 主人所在团队对规则的业务组有写权限
```

所以实际做法是：**给需要写的客户端一个权限更大的专用账号，其余客户端用只读账号。**
两个客户端连同一个端点，能做的事由各自 Token 决定。
建账号的做法见 [个人 Token 认证](./token-auth.md)。

需要「谁都不能写」的确定性时，把开关关掉，别指望账号权限——
账号能改的错误会随着有人给这个账号加角色而悄悄扩大。

## 它们改了什么，去哪儿看

开源版有两条线索：

**一、对象上的修改人。** 通过 MCP 改出来的告警规则、屏蔽、仪表盘，
`update_by` 就是 Token 主人的用户名，和页面上改一样。列表页直接能看到。

**二、`[MCP]` 请求日志。** center 对 `/mcp` 的每次请求都会打一对 start / done：

```
[MCP] start trace_id=... method=POST path=/mcp remote=10.0.0.5 body_len=98 body_truncated=false
      body={"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_busi_groups","arguments":{}}}
[MCP] done  trace_id=... method=POST path=/mcp user=root status=200 cost=3.7ms bytes_out=917
```

start 那行带完整请求体（含工具名和参数），done 那行带 `user=` 和状态码，用 `trace_id` 串起来。
所以「谁在什么时候调了哪个写工具、参数是什么」是可查的：

```bash
grep '"method":"tools/call"' /path/to/n9e.log | grep -oE '"name":"[a-z_]+"' | sort | uniq -c | sort -rn
```

请求体超过上限会被截断，`body_truncated=true` 会标出来。

## 一个更安全的替代：让 AI 提议，人来确认

如果你的诉求是「让 AI 帮忙改配置」，注意夜莺**内置助手**走的是另一条路：
`update_*` 类操作是两阶段的——第一次调用只算出改动、返回一个确认卡片，
必须由人在下一轮确认之后才真的落库。这个机制在 `/mcp` 上没有
（MCP 客户端的写工具是一次调用直接写），所以对配置变更来说，
内置助手比外部 MCP 客户端更稳妥。见 [安全的自动化模式](./automation.md)。

## 下一步

- 工具集怎么挑：[读写工具集](./toolsets.md)
- 权限边界：[权限继承与 RBAC](./permissions.md)
- 人在回路的写入：[安全的自动化模式](./automation.md)
