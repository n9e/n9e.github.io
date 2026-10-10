---
title: "MCP 工具缺失或被拒绝"
sidebar_label: "MCP 工具缺失或被拒绝"
description: "「没有这个工具」有三种形状：写工具未开启、工具集被禁用、Token 用户缺少权限——tools/list 的返回先分出是哪一种。"
---

客户端连上了，但模型说「我没有这个工具」；或者工具列表比预期短一大截；
或者调用返回一句拒绝。这三种是三个不同的原因，**返回的形状不一样**，
先按形状分类，比逐条试配置快得多。

前提是连接本身是通的。如果客户端压根连不上，先看
[MCP 认证失败](./mcp-auth.md)。

## 先数一下 `tools/list` 返回了几个

工具数量是最快的判据，因为**默认值是确定的**：

```bash
curl -s --noproxy '*' -X POST http://127.0.0.1:17000/mcp \
  -H 'X-User-Token: <你的 Token>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | sed -n 's/^data: //p' \
  | python3 -c 'import sys,json; print(len(json.load(sys.stdin)["result"]["tools"]))'
```

| 数出来是 | 结论 |
|---|---|
| **42** | 默认配置，**只注册了只读工具**。缺的是写工具 |
| **74** | 写工具已打开（42 只读 + 32 写） |
| 比 42 少，但不是 0 | `MCPToolsets` 做了白名单，或者名字写错被丢了 |
| **0** | `MCPToolsets` 里的名字**全部**写错了。它不会退回成「全都要」 |

**工具数量取决于服务端配置，和 Token 是谁无关。** 权限不影响工具是否出现在列表里，
只影响调用时被不被拒。这一条能立刻把「配置问题」和「权限问题」分开。

## 三种「没有这个工具」，返回不一样

| 你看到的 | 含义 | 去哪修 |
|---|---|---|
| JSON-RPC `error`，`code: -32602`，`unknown tool "xxx"` | 这个工具**根本没注册**：写工具没开，或者它所属的工具集不在白名单里 | 服务端配置 |
| 正常 `result`，但带 `"isError": true`，正文是 `forbidden: no access to ...` | 工具在、也跑了，是**权限**把它挡住的 | Token 对应用户的角色和业务组 |
| 正常 `result`，`"isError": true`，正文是别的参数错误 | 工具在，模型参数给错了 | 提示词，或工具参数文档 |
| 正常 `result`，内容是**空列表** | 工具在、权限也过了，就是没有可见的数据——**也可能是这个账号看不到** | 见下面「空列表」那节 |

一个未注册的工具长这样，可以照着认：

```json
{"jsonrpc":"2.0","id":3,"error":{"code":-32602,"message":"unknown tool \"create_user\""}}
```

## 常见根因与确认方法

### 写工具默认根本没注册

`MCPEnableWriteTools` 关着的时候，那 32 个写工具**不是「调用时被拒」，而是压根不注册**——
`tools/list` 里看不到，模型也就无从调用。

**怎么确认**：工具数是 42，并且调用任何一个写工具都返回 `-32602 unknown tool`。

**怎么修**：

```toml
[HTTP.A2A]
MCPEnableWriteTools = true
```

**重启 center 才生效**，然后 `tools/list` 应该变成 74。
打开之前先读 [安全地启用写工具](../ai/write-tools.md)——
`users` 和 `roles` 这两个工具集里的写工具能改角色和重置密码，建议同时用白名单排除掉。

顺带两个容易踩空的预期：**74 个工具里没有任何删除工具**，
「写」只包括新建和更新；另外 `targets`、`busi_groups`、`alert_subscribes`、
`event_pipelines`、`metrics`、`logs` 这**六个工具集本来就没有写工具**，
打开开关也不会多出来。

### `MCPToolsets` 里的名字写错了，被静默忽略

这是本页最隐蔽的一个：**写错的名字会被丢掉并继续启动**，
不会报错、不会退回成「全部工具集」。**全写错就是 0 个工具。**

**怎么确认**：启动日志里 grep `ignoring unknown toolset`，措辞固定，
而且**它把所有合法名字都打了出来**，比翻文档快：

```
WARNING [MCP] ignoring unknown toolset "alert"; valid names: [alert_subscribes alerts busi_groups dashboards datasource event_pipelines logs metrics mutes notify_rules roles targets users]
```

最常见的就是单复数写反（`alert` / `alerts`、`mute` / `mutes`）。

**怎么修**：按告警里那份列表逐字改。两个额外语义值得知道：
**留空表示全部默认工具集**，写 `"all"` 也一样（为兼容旧配置保留）；
列表里的空字符串会被跳过，不告警。各工具集覆盖什么见
[只读与写入工具集](../ai/toolsets.md)。

### 工具在，但 Token 对应的用户没权限

**MCP 客户端的权限就是 Token 所属用户的权限**，没有单独的「给 AI 的权限」。
工具调用会在进程内重新走一遍夜莺自己的 `/api/n9e/...` 路由，
认证、权限点、业务组一道都不少。

**怎么确认**：返回是带 `"isError": true` 的 `result`，正文里有 `forbidden:` 前缀，
比如 `forbidden: no access to busi group 3`、`forbidden: no access to this alert rule`。
再到服务端日志里找这次请求的 `[MCP] done` 行，**`user=` 后面就是它连成的身份**——
经常和你以为的不是一个账号。

**怎么修**：改这个账号的角色和团队，不用动任何 MCP 配置。
两层是**与**的关系：角色决定能不能调这个接口，业务组决定能操作哪些数据。
不要为了省事给 `Admin`——它会绕过业务组这一层，等于把所有业务组一次性交出去。
详见 [权限继承与 RBAC](../ai/permissions.md)。

### 返回空列表，不一定是「没有数据」

这一节单独列出来，因为它**不报错**，最容易被当成「系统里就是没有」。
拿一个够不着的业务组 ID 去查告警规则，返回的是空列表而不是拒绝：

```json
{"list": [], "total": 0}
```

**怎么确认**：用 **root 或一个能看到全部业务组的账号**的 Token 发同一个请求。
两次结果不一样，就是权限；一样，那就是真的没有数据。
`list_busi_groups` 只返回当前用户能访问的业务组，先调它看看这个账号的可见范围有多大。

**怎么修**：把这个账号加进对应业务组的团队里。

### 客户端缓存了旧的工具列表

改完服务端配置、也重启了 center，客户端还是老样子。

**怎么确认**：用上面那条 curl 直接问服务端。**curl 数对了、客户端不对**，
就是客户端侧的缓存。

**怎么修**：重启客户端。服务端在 `initialize` 时声明了
`tools.listChanged`，但不是每个客户端都会据此刷新，重启最稳。

## 确认修好了

1. `tools/list` 的数量是你期望的那个（默认 42，开了写工具 74，用白名单就是白名单里那几个集合之和）；
2. 启动日志里**没有** `ignoring unknown toolset` 告警；
3. 用**目标账号自己的 Token**调一个具体的工具，确认返回的是正常 `result`，
   既不是 `-32602`，也不带 `"isError": true`；
4. 调 `list_busi_groups`，返回的业务组和这个账号登录界面看到的**逐条一致**——
   多了说明权限给宽了，少了说明还没给够；
5. 回到客户端重启，确认它列出的工具数和 curl 一致。

## 收集这些再去提问

1. `tools/list` 返回的**数量**，以及缺的那个工具的**准确名字**；
2. 调用它时的**完整返回**（`error.code` 和 `message`，或者 `isError` 和正文）；
3. 服务端 `[HTTP.A2A]` 这一节的原文，尤其是 `MCPEnableWriteTools` 和 `MCPToolsets`；
4. 启动日志里所有 `[MCP]` 开头的行；
5. Token 属于哪个账号，那个账号的角色和所在团队。

**脱敏**：Token 替换掉；工具名、`MCPToolsets` 的内容、`forbidden:` 那句报错要原样保留，
它们不是凭据，正是答案。

## 下一步

- 13 个工具集分别是什么：[只读与写入工具集](../ai/toolsets.md)
- 逐个工具的参数：[MCP 工具参考](../reference/mcp-tools.md)
- 打开写工具之前先读：[安全地启用写工具](../ai/write-tools.md)
- 权限边界怎么算：[权限继承与 RBAC](../ai/permissions.md)
- 连都连不上：[MCP 认证失败](./mcp-auth.md)
