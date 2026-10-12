---
title: "想启用 Nightingale AI"
sidebar_label: "想启用 Nightingale AI"
description: "配置一个大模型提供方，打开内置助手和 MCP 端点，再接上 Claude Code 这类客户端。"
last_reviewed: 2026-10-10
---

这条路的终点：能在夜莺里用自然语言问「现在有哪些 S1 告警」，
并且 Claude Code 这类 MCP 客户端也能连上来查同样的东西。大约 10 分钟。

## 开始之前

- 夜莺已经起来了；
- 一个大模型的 API Key，或者一个本机跑着的 Ollama。

## 1. 配一个大模型

入口在 **Nightingale AI**（左侧一级菜单）里，进去之后左边二级导航有 **LLM 管理**。
它没有顶级菜单入口，直接访问 `/ai-config/llm-configs` 会跳到这里。

点 **新增**，要填的是：

| 字段 | 说明 |
|---|---|
| 名称 | 自己起 |
| 提供方类型 | 表单里只有三个选项：**OpenAI 兼容** / **Anthropic Claude** / **Google Gemini** |
| API 地址 | 兼容 OpenAI 协议的自建服务（vLLM、Azure OpenAI、Ollama、Kimi 等）都选 **OpenAI 兼容**，地址填自己的 |
| API Key | |
| 模型 | 模型名，比如 `gpt-4o`、`claude-sonnet-4-5` |
| 上下文长度 | |

保存后把它设为**默认**：没有单独指定模型的功能都会用这一个。

## 2. 问一句话试试

回到 **Nightingale AI**，新开一个对话，问：

> 现在有哪些 S1 级别的活跃告警？

助手会去查你的事件数据再回答。答得上来，说明模型和数据两边都通了。

## 3. MCP 端点：默认就开着

`/mcp` 和 `/a2a` 两个端点**默认启用**，不用改配置。它们复用 `HTTP.TokenAuth`，
也就是说客户端拿 `X-User-Token` 就能连；开了内置授权服务器或外部 IdP 的话，
也接受 `Authorization: Bearer`。

**关键一点：MCP 客户端的权限就是那个 Token 所属用户的权限，一点不多。**
给 AI 用的 Token，就按最小权限建一个专用账号，不要直接用 root 的。

默认只注册**只读**工具。要开写工具（新建 / 修改 / 删除），得显式打开：

```toml
[HTTP.A2A]
MCPEnableWriteTools = true
```

还可以只放开一部分工具集：

```toml
# 留空 = 全部默认工具集
MCPToolsets = ["alerts", "dashboards"]
```

可用的工具集有 13 个：`alerts`、`targets`、`datasource`、`mutes`、`busi_groups`、
`notify_rules`、`alert_subscribes`、`event_pipelines`、`users`、`metrics`、`logs`、
`dashboards`、`roles`。写不认识的名字会被忽略，不会意外放大权限。

## 4. 接一个客户端

先建 Token：右下角头像 → 个人设置里生成一个。然后在客户端里配上夜莺的 `/mcp` 地址和这个 Token。

连上之后让它做一件只读的事验证，比如「列出所有告警规则」。

## 下一步

- 助手能看到什么、能做什么：[AI 与 MCP](../../ai/overview.mdx)
- 写工具怎么安全地开：[安全地启用写工具](../../ai/write-tools.md)
- 工具清单：[MCP 工具](../../reference/mcp-tools.md)
