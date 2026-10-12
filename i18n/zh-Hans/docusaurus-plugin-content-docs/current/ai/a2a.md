---
title: "A2A 端点"
sidebar_label: "A2A 端点"
description: "A2A 端点把夜莺暴露成可被其他 Agent 平台发现和调用的 Agent，Agent Card 声明地址与支持的方法。"
last_reviewed: 2026-10-10
---

这页办完你会得到：一个第三方 Agent 平台能自动发现并调用的夜莺 Agent，
以及一条验证过的 `message:send` 请求。

## 和 MCP 是两种东西

| | `/mcp` | `/a2a` |
|---|---|---|
| 对面拿到的 | 74 个细粒度工具，自己编排 | 一个会说话的 Agent |
| 交互形态 | JSON-RPC 工具调用 | 自然语言进，自然语言出 |
| 需要配大模型吗 | **不需要**——工具直接打到夜莺 API | **需要**，它驱动的就是内置助手 |
| 适合谁 | Claude Code、Cursor 这类自带模型的客户端 | 别人家的 Agent 编排平台 |

两个端点默认都开着，用同一套鉴权。**A2A 在页面上答不上来的问题，
在 A2A 上也答不上来**——先在 Nightingale AI 里聊通了再说，见
[Nightingale AI 概览](./nightingale-ai.md)。

## Agent Card：第三方唯一需要的地址

```bash
curl -s https://n9e.example.com/.well-known/agent-card.json
```

这个地址**不需要认证**（规范要求可发现）。`/.well-known/agent.json` 是给老客户端的别名。

卡片里声明的：

| 字段 | 值 |
|---|---|
| `name` | `Nightingale Agent` |
| `supportedInterfaces` | 一个 HTTP+JSON 接口，URL 是 `<BaseURL>/a2a` |
| `capabilities.streaming` | `true` |
| `defaultInputModes` / `defaultOutputModes` | 都是 `text` |
| `securitySchemes` | `x-user-token`（apiKey，放在请求头里）；开了 RSAuth 还会多一个 `oidc` |
| `skills` | 内置 Skill 的名字、描述、示例问句，逐条列出 |

`skills` 是从内置 Skill 的 frontmatter 生成的，所以对面能看到夜莺具体擅长什么
（排查告警没触发、分析仪表盘、生成 PromQL……），而不是一句笼统的介绍。

`BaseURL` 留空时是从请求头猜的。**放在反向代理后面务必显式配**，
否则第三方拿到的可能是内网地址：

```toml
[HTTP.A2A]
BaseURL = "https://n9e.example.com"
```

## 发一条消息

REST 绑定的路径是 `/a2a/message:send`（**没有** `/v1` 前缀），
`messageId`、`role`、`parts` 三个字段都必填，`role` 的枚举值是 `ROLE_USER`：

```bash
curl -s -X POST https://n9e.example.com/a2a/message:send \
  -H 'Content-Type: application/json' \
  -H 'X-User-Token: YOUR_TOKEN' \
  -d '{
    "message": {
      "messageId": "req-0001",
      "role": "ROLE_USER",
      "parts": [{ "text": "现在有哪些活跃告警？" }]
    },
    "metadata": { "lang": "zh_CN" }
  }'
```

预期结果：一个 `task` 对象，里面有 `id`、`contextId`、`status.state`，
以及 `metadata` 里的 `n9e.chat_id` / `n9e.seq_id`。
`status.state` 是 `TASK_STATE_COMPLETED` 说明这一轮跑完了；答案在 `artifacts` 里。
这一步可能要几十秒——模型在思考并调工具，属正常。

多轮对话把 `"contextId": "<上一次返回的 contextId>"` 放进 `message` 里。
`contextId` 一一对应夜莺的 `chat_id`，也就是说 A2A 的会话和页面上的会话是同一条，
在 Nightingale AI 的会话列表里能看到。

## 支持哪些方法

| 方法 | 路径 |
|---|---|
| 发消息（同步） | `POST /a2a/message:send` |
| 发消息（流式 SSE） | `POST /a2a/message:stream` |
| 查任务 | `GET /a2a/tasks/{id}` |
| 取消任务 | `POST /a2a/tasks/{id}:cancel` |
| 重新订阅 | `POST /a2a/tasks/{id}:subscribe` |

`tasks/list` **故意没实现**，按规范返回 `UnsupportedOperation`——
跨用户枚举任务对一个内置助手没意义，还会泄漏别人的活动。

直接 GET `/a2a` 根路径会返回一段 JSON 提示，把上面这些路径列出来。
这是为了让误用旧 JSON-RPC 写法（`tasks/send`）的客户端拿到一句人话，
而不是被重定向到前端页面。

任务状态存在 Redis 里，TTL 24 小时，多实例共享；过期后 `tasks/get` 返回 task not found，
但对话本身还在数据库里。

## 反向代理和超时

A2A 在根路径，且是长连接：

```nginx
location /.well-known/ {
    proxy_pass http://127.0.0.1:17000;
}

location /a2a/ {
    proxy_pass http://127.0.0.1:17000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    proxy_buffering off;        # 不关掉，流式回答永远吐不出来
    proxy_read_timeout 3600s;   # 默认 60 秒会把回答拦腰截断
    proxy_send_timeout 3600s;
}
```

服务端每 30 秒会发一个空的 working 状态心跳，就是为了绕过网关的空闲超时——
但网关自己的读超时还是得放宽。

## 命令行客户端

仓库里带了一个基于官方 SDK 的测试客户端：

```bash
go run ./cmd/a2a-cli --server http://127.0.0.1:17000 --token YOUR_TOKEN \
    --message "查看当前正在告警的事件"

# 接着上一轮聊
go run ./cmd/a2a-cli --server http://127.0.0.1:17000 --token YOUR_TOKEN \
    --context-id CHAT_ID --message "进一步分析其中第一条"
```

默认走流式；加 `--get` 会在结束后再调一次 `tasks/get` 验证任务确实存下来了。

## 关掉它

```toml
[HTTP.A2A]
Disable = true   # /a2a、/mcp、Agent Card 一起关
```

只想关 MCP 保留 A2A 的话用 `DisableMCP = true`。

## 下一步

- 先把助手聊通：[Nightingale AI 概览](./nightingale-ai.md)
- 换成 OAuth 让对方用自己的账号：[OAuth 2.1 与外部身份源](./oauth.md)
- 细粒度工具那条路：[启用 MCP 端点](./mcp-endpoint.md)
