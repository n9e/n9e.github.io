---
title: "权限继承与 RBAC"
sidebar_label: "权限继承与 RBAC"
description: "每次 MCP 工具调用都是以 Token 用户身份发起的内部 API 调用，客户端的权限因此与该用户完全一致，业务组边界同样生效。"
---

这页解释一件事：接上来的 AI 客户端，权限边界到底画在哪，
以及你该怎么把这条边界收到自己想要的位置。

## 一句话

**MCP / A2A 客户端的权限 = Token 所属用户的权限，一点不多。**
不存在「给 AI 单独开一套权限」这回事——要收紧，就换一个权限更小的账号。

## 机制：一次工具调用就是一次内部 API 调用

客户端调 `list_alert_rules`，服务端不是直接去查库，而是把这次调用**在进程内**重新打到
夜莺自己的 `/api/n9e/busi-group/{gid}/alert-rules` 上，带着你这个 Token，
走完整的中间件链（鉴权 → 取用户 → 权限点 → 业务组校验）。

没有 socket，没有旁路。所以「MCP 会不会绕过 RBAC」这个问题的答案是结构性的**不会**：
它走的就是你在页面上点一下时走的那条路。

## 两层权限，AND 关系

夜莺的权限模型只有两层，MCP 上和页面上完全一样：

**第一层，角色决定能碰哪些接口。** 内置 `Admin`、`Standard`、`Guest`；
一个角色是一组权限点，比如 `/alert-rules/add`。角色不够，工具调用直接被拒。

**第二层，业务组成员关系决定能操作哪些数据。** 用户属于团队，团队对业务组有读或读写。

```
能改这条告警规则  =  角色里有「修改告警规则」这个权限点
                     AND
                     我所在的某个团队对规则所属的业务组有写权限
```

`Admin` 角色会绕过第二层。所以**给 AI 用的账号不要给 `Admin`**——
给了就等于把所有业务组一起给了。完整的模型见
[认证、Token 与权限模型](../concepts/auth-rbac.md)。

## 业务组是怎么落到工具上的

多数工具的入参里直接带 `group_id` 或 `gids`：

- `list_alert_rules`、`list_mutes`、`list_dashboards` 这类要指定业务组，
  指到没权限的组上就会被拒；
- `list_busi_groups` 只会返回**当前用户有权访问的那些**，所以模型天然只能在这个范围里挑；
- 事件类的 `list_active_alerts` 按事件所属业务组过滤。

实践含义：你想让 AI 只看到「交易系统」这一个业务组，
不用改任何 MCP 配置，只要让那个账号只在这一个业务组里有成员关系就行。

## 三件值得知道的事

**一、OAuth Token 只在 agent 面生效。** 通过内置授权服务器或外部 IdP 拿到的 access token，
只能用在 `/a2a` 和 `/mcp` 上，拿去调 `/api/n9e/*` 的其他接口会被拒。
个人 Token 没有这个限制。

**二、写工具默认根本没注册。** 32 个写工具在 `MCPEnableWriteTools = true` 之前
不出现在 `tools/list` 里——这是在 RBAC 之外多加的一道闸，
和账号权限无关。见 [安全地启用写工具](./write-tools.md)。

**三、「只读工具」不等于「无副作用」。** `logs` 工具集里的 `query_logs`
把查询体原样透传给夜莺的日志查询接口，而这个接口会按你传的数据源类型分发。
如果你注册了 MySQL、PostgreSQL、ClickHouse、Doris、TDengine 这类 SQL 数据源，
那条 SQL 是照写照执行的。这条路径上**有**一层只读校验
（`aiagent/tools/datasource_query.go` 里的 `validateReadOnlySQL`），
但它是关键字黑名单——语句以 `INSERT`、`UPDATE`、`DELETE`、`DROP`、`ALTER`、`CREATE`、
`TRUNCATE`、`REPLACE`、`GRANT`、`REVOKE` 开头或包含这些词就拒掉。
明显的写操作能挡住，但它不是 SQL 解析器，只能当纵深防御，不能当保证。
**注册了 SQL 数据源、又要开 MCP 的话，用 `MCPToolsets` 把 `logs` 摘掉**，
或者给 AI 账号一个连不到这些数据源的角色。

## 怎么验证边界确实在那儿

用 AI 账号的 Token 调一个它不该有权限的东西，看是不是被拒：

```bash
curl -s -X POST http://127.0.0.1:17000/mcp \
  -H 'X-User-Token: AI_ACCOUNT_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{
        "name":"list_busi_groups","arguments":{}}}'
```

预期结果：返回的业务组列表**只有**你授权过的那几个。
如果 root 能看到 5 个而这个账号看到 5 个，说明账号权限没收紧，回去改角色和团队。

## 下一步

- 建账号和 Token：[个人 Token 认证](./token-auth.md)
- 权限点全表：[权限矩阵](../reference/permissions.md)
- 业务组模型：[业务组](../concepts/business-groups.md)
