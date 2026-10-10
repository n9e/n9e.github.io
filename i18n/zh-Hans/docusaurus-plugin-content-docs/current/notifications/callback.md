---
title: "Callback（通用 Webhook）"
sidebar_label: "Callback（通用 Webhook）"
description: "把事件 POST 到任意 HTTP 接口：URL、请求头、请求体模板，模板里能用哪些变量，以及什么情况才算发送成功。"
---

这页办完你会得到：通知规则命中的每个事件，都按对方要求的格式 POST 到你自己的 HTTP 接口——
工单系统、内部机器人、自动化服务都行。

开源版**内置了一个已启用的 Callback 媒介**。大多数时候不用新建，在通知规则里选它、填个地址就行。

## 最快的路：直接用内置媒介

内置的 `Callback` 故意做得很通用：它的 URL 是 `{{$params.callback_url}}`，
真正的地址**在通知规则里填**，而不是写死在媒介上。

1. 打开一条通知规则（**告警通知 → 通知规则**），添加一个通知配置；
2. 媒介选 **Callback**，下面会出现两个字段：**Callback Url** 和 **Note**；
3. **Callback Url** 填完整的接口地址；Note 随便写，请求体模板里用 `$params.note` 取；
4. 在这条通知配置右上角点 **通知测试**，再保存。

一个媒介可以对接任意多个地址：每条规则（以及规则里的每个通知配置）各自带一个 Callback Url。

对方默认收到的是：

| 项 | 默认值 |
|---|---|
| 方法 | `POST` |
| 请求头 | `Content-Type: application/json` |
| 请求体 | `{{ jsonMarshal $events }}`——事件对象的 JSON **数组**，只有一个事件时也是数组 |

事件对象和历史告警表里存的结构一致，字段说明见[通知模板变量](../reference/notification-variables.md)。

## 需要自己建一个时：媒介上的字段

对方要求固定地址、鉴权头，或者请求体不是原始事件数组时，单独建一个媒介
（**告警通知 → 通知媒介 → 新增 → Callback**）。

| 字段 | 说明 |
|---|---|
| URL | 可以带模板变量，比如 `{{$params.callback_url}}`、`https://hooks.example.com/{{$params.path}}` |
| 请求方法 | GET / POST / PUT |
| 请求头 | 键值对，值里可以用变量 |
| 请求参数 | 拼到 URL 上的查询参数，值里可以用变量 |
| 请求体 | Go 模板，见下文 |
| 超时时间 | 毫秒，默认 10000 |
| 并发数 | 这个媒介同时发出的请求数，默认 5 |
| 重试次数 / 重试间隔 | 默认 3 次，间隔 100 毫秒 |
| 跳过证书验证 | 对方是自签证书时打开。没有配置自定义 CA 的选项 |
| 代理 | 只能通过代理访问对方时填 |

这些字段上方还有一块 **变量配置**，放着另外两样东西：

- **联系方式**——从规则里选中的用户和团队身上取哪个联系方式字段，见[联系方式](../security/contacts.md)。
  普通 Webhook 留空即可；
- **自定义参数**——选中这个媒介后，通知规则里会出现的输入框，模板里用 `$params.<key>` 取。
  内置媒介的 Callback Url 和 Note 就是这么来的。

## 模板里能用什么

URL、请求头的值、请求参数的值、请求体，用的是同一套变量：

| 变量 | 内容 |
|---|---|
| `$events` | 这次发送的全部事件，数组 |
| `$event` | 第一个事件——确定每次只发一个事件时用着方便 |
| `$params` | 通知规则里填的自定义参数，比如 `$params.callback_url` |
| `$tpl` | 规则里选的消息模板渲染后的结果，每个模板字段是一个 key，比如 `$tpl.content` |
| `$sendto` | 一个接收人的地址（见下一节） |
| `$sendtos` | 全部接收人的地址，数组 |
| `{{.变量名}}` | [站点变量](../security/variables.md)——token、密钥放这里 |

`jsonMarshal` 等模板函数在这些位置都能用。

### 拼 JSON 用 `jsonMarshal`，别自己加引号

请求体是用 Go 的 `html/template` 渲染的。直接输出的字符串会被 **HTML 转义**：
一条叫 `disk "full" & <slow>` 的规则，对方收到的是 `disk &#34;full&#34; &amp; &lt;slow&gt;`。
用 `jsonMarshal` 包一层，输出的就是转义正确、自带引号的 JSON 字面量：

```text
{
  "title":    {{ jsonMarshal $event.RuleName }},
  "severity": {{ $event.Severity }},
  "status":   {{ if $event.IsRecovered }}"resolved"{{ else }}"firing"{{ end }},
  "labels":   {{ jsonMarshal $event.TagsMap }},
  "note":     {{ jsonMarshal $params.note }}
}
```

站点变量（`{{.变量名}}`）是例外：它原样插入，token 里的 `+` 不会被改写。

## 接收人：一次请求，还是每人一次

媒介设置了 **联系方式**、规则里又选了用户或团队时，夜莺会按这个联系方式去取每个人的地址，
没填的人**静默跳过**。然后：

- 媒介配置里任何位置出现了 `$sendtos`，就发**一次**请求，带上所有地址；
- 否则**每个接收人一次**，每次的 `$sendto` 是这个人的地址。

不设联系方式、也没有接收人——普通 Webhook 一般就是这样——每次发送就是一个请求。

## 什么情况算发送成功

- **只有 HTTP `200` 算成功。** `201`、`202`、`204` 都记成失败，状态码和响应体照记。
  接口是你自己的，就让它返回 `200`。
- **返回了非 200 不会重试。** 重试只针对根本没连上（DNS、拒绝连接、超时），
  最多重试「重试次数」次，每次间隔「重试间隔」。
- Callback 走一个按媒介并发数消费的队列，队列满了，这次发送记为失败，原因是 `queue is full`。

发送记录（目标、状态码、响应体）在事件的通知记录里，见[重试与投递状态](./delivery.md)。

## 常见报错

| 现象 | 原因 |
|---|---|
| `callback provider requires URL` | URL 为空。用的是内置媒介的话，就是规则里的 Callback Url 没填 |
| 对方收到的内容里有 `&#34;` | 字符串直接输出了，用 `jsonMarshal` 包一层 |
| 返回 204 却记成失败 | 只有 200 算成功，改对方的返回码 |
| 每个接收人都单独收到一次请求 | 配置里没用到 `$sendtos`；对方要列表的话，在请求体里引用它 |
| 记录里出现 `failed to parse template` | URL、请求头或请求参数里的模板语法有错 |

## 下一步

- 接进规则：[通知规则](./rules.md)
- 不调 HTTP，跑你自己的程序：[脚本媒介](./script.md)
- 在通知之前、工作流里做回调：[改写标签与补充上下文](../events/relabel-enrich.md)
