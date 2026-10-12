---
title: "读写工具集"
sidebar_label: "读写工具集"
description: "MCP 端点提供 13 个工具集共 74 个工具；六个工具集完全只读，没有删除工具，写工具需要单独开启。"
last_reviewed: 2026-10-10
---

这页是给「该放开哪几个工具集」这个决定用的。逐个工具的参数在
[MCP 工具](../reference/mcp-tools.md)，那页是从源码生成的，不用来回翻。

## 13 个工具集一览

默认注册 **42 个只读工具**；打开 `MCPEnableWriteTools` 后是 **74 个**（多出 32 个写工具）。

| 工具集 | 工具数（读/写） | 覆盖什么 |
|---|---|---|
| `alerts` | 12（6/6） | 活跃与历史告警事件、告警规则的查询/创建/修改/导入/克隆/批量启停 |
| `targets` | 1（1/0） | 设备列表 |
| `datasource` | 6（4/2） | 数据源清单与完整配置，创建或更新、启停 |
| `mutes` | 4（2/2） | 屏蔽规则 |
| `busi_groups` | 1（1/0） | 当前用户可见的业务组 |
| `notify_rules` | 13（5/8） | 通知规则、通知媒介、消息模板，含发送测试 |
| `alert_subscribes` | 3（3/0） | 订阅规则 |
| `event_pipelines` | 5（5/0） | 工作流及其执行记录 |
| `users` | 10（4/6） | 用户、团队、团队成员 |
| `metrics` | 2（2/0） | PromQL 即时查询与区间查询 |
| `logs` | 3（3/0） | 日志查询、索引与字段列表 |
| `dashboards` | 8（3/5） | 仪表盘元信息与面板 JSON、克隆、公开开关 |
| `roles` | 6（3/3） | 角色、权限点、角色授权 |

工具集名字就是 `MCPToolsets` 里要写的字符串，留空 = 全部：

```toml
[HTTP.A2A]
MCPToolsets = ["alerts", "dashboards", "metrics"]
```

写错的名字被丢弃并打告警，不会回退成「全放开」。

## 只读和写是怎么分的

不是靠工具自己声明的标记，而是**注册时就分成两个列表**：
只读工具永远注册，写工具只在 `MCPEnableWriteTools = true` 时才注册。
关着的时候，写工具压根不出现在 `tools/list` 里，模型看不见也就调不了。

每个工具同时还带一个 `readOnlyHint` 注解给客户端看，两者是一致的。

## 六个工具集完全只读

`targets`、`busi_groups`、`alert_subscribes`、`event_pipelines`、`metrics`、`logs`
里没有任何写工具——即使打开写开关，它们的行为也不变。

## 没有删除工具

74 个里**一个删除工具都没有**。所谓写工具是创建和更新，删业务组、删用户、删规则
都做不到。`etc/config.toml` 里把写工具描述成 "create/update/delete" 是过时的注释。

这不代表写工具无害，只是它的破坏形态是「改坏」而不是「删掉」。

## 风险最高的几个写工具

按影响面排，打开写工具前值得先看一眼：

| 工具 | 为什么危险 |
|---|---|
| `reset_user_password` | 能重置任意用户的密码 |
| `create_user` / `update_user_profile` | 这两个接口顺带分配角色，等于能提权 |
| `bind_role_operations` | 整体替换某个角色的权限集，传少了就等于悄悄削权 |
| `create_notify_channel` / `update_notify_channel` | Webhook 类媒介 = 把告警内容 POST 到任意地址 |
| `upsert_datasource` | 写入数据源凭据，并会向填入的地址发起一次连通性探测 |
| `set_dashboard_public` | 把仪表盘切成匿名可访问 |
| `toggle_alert_rules` / `set_datasource_status` / `create_mute` | 都能制造监控盲区：批量停规则、停数据源、静默告警 |

结论很直接：**只在真需要写的场景开写工具，并且用 `MCPToolsets` 把 `users`、`roles`
这类工具集摘掉。** 做法见 [安全地启用写工具](./write-tools.md)。

## 只读工具里也有一个要留神

`logs` 的 `query_logs` 把查询体原样透传给夜莺的日志查询接口，
接口按你传的数据源类型分发。注册了 MySQL、PostgreSQL、ClickHouse、Doris、TDengine
这类 SQL 数据源时，SQL 是照写照执行的。**有 SQL 数据源就把 `logs` 摘掉**，
详见 [权限继承与 RBAC](./permissions.md)。

## 挑一个最小集

从「读者要 AI 干什么」倒推，而不是先全开再减：

| 场景 | 够用的工具集 |
|---|---|
| 值班分诊：看事件、看规则、看是谁的 | `alerts`、`busi_groups`、`targets` |
| 加上「解释一下这个尖峰」 | 再加 `metrics` |
| 治理噪声：找最吵的规则、看屏蔽和订阅 | 再加 `mutes`、`alert_subscribes` |
| 让 AI 帮忙改配置 | 再加写开关，并且**先读完写工具那页** |

## 下一步

- 逐工具清单与参数：[MCP 工具](../reference/mcp-tools.md)
- 打开写工具：[安全地启用写工具](./write-tools.md)
- 端点本身：[启用 MCP 端点](./mcp-endpoint.md)
