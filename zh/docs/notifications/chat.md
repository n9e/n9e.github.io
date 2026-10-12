# Slack / Telegram / Discord / Mattermost

基于 Webhook 的聊天媒介，以及怎么写一条各家 Markdown 都不吃掉的消息。

最后校对于 2026-10-10

这页办完你会得到：一个能往 Slack / Telegram / Discord / Mattermost 发消息的媒介， 并且知道为什么同一份模板在这四家渲染出来不一样。

## 四家的处境不一样[​](#四家的处境不一样 "四家的处境不一样的直接链接")

后端对这四家都注册了发送逻辑，20 份内置消息模板里也都有它们 （`telegram`、`slackwebhook`、`slackbot`、`discord`、`mattermostwebhook`、`mattermostbot`）。 **差别只在通知媒介页左侧的类型面板**：

| 平台       | 类型面板里有卡片吗 | 内置消息模板                          | 怎么建媒介                  |
| ---------- | ------------------ | ------------------------------------- | --------------------------- |
| Telegram   | 有                 | `Telegram`                            | 点卡片，填 token 和 chat id |
| Slack      | 没有               | `SlackWebhook` / `SlackBot`           | 用导入，或用「回调」媒介    |
| Discord    | 没有               | `Discord`                             | 同上                        |
| Mattermost | 没有               | `MattermostWebhook` / `MattermostBot` | 同上                        |

所以后三家不是「不支持」，只是没有开箱的表单入口。媒介建出来之后， **只要媒介类型（`ident`）写对，那份内置模板立刻就能在通知规则里选到**—— 模板和媒介就是靠这个字符串对上的。

## Telegram：类型面板里有卡片[​](#telegram类型面板里有卡片 "Telegram：类型面板里有卡片的直接链接")

**告警通知 → 通知媒介**，左侧点 **Telegram**。

先在 Telegram 里准备两样东西：

1. **Bot token**：跟 [@BotFather](https://t.me/BotFather) 对话，`/newbot` → 起个显示名 → 起一个以 `bot` 结尾的用户名，拿到形如 `123456789:AAE...` 的 token。
2. **Chat id**：把机器人拉进目标群并发一条消息，然后访问 `https://api.telegram.org/bot<TOKEN>/getUpdates`，读 `chat.id`。 私聊是正数，群和频道是负数（`-100…`），**负号要一起填**。

媒介表单里除了名称，通常只要改一处：**HTTP 配置 → 代理**。 `api.telegram.org` 在国内直连不通，填一个能出网的 HTTP 代理地址。

URL、请求参数和请求体都已经预置好了：请求体是 `{"text":"{{$tpl.content}}","parse_mode":"HTML"}`，内置的 `Telegram` 模板写的正是 HTML 标签。 如果你把模板改成 Markdown，请求体里的 `parse_mode` 也要跟着改成 `MarkdownV2`， 否则 Telegram 会把标签当普通文本、或者直接报 `Can't parse entities`。

## Slack / Discord / Mattermost：用导入建媒介[​](#slack--discord--mattermost用导入建媒介 "Slack / Discord / Mattermost：用导入建媒介的直接链接")

媒介列表页右上角有 **导入**，粘一段 JSON 就能建媒介——这是**给 `ident` 赋值的唯一入口** （表单里的媒介类型是隐藏字段，由你点的那张卡片决定）。

以 Slack Incoming Webhook 为例，粘这一段：

```
[

  {

    "name": "Slack",

    "ident": "slackwebhook",

    "enable": true,

    "request_type": "http",

    "param_config": {

      "custom": {

        "params": [

          { "key": "webhook_url", "cname": "Webhook Url", "type": "string" }

        ]

      }

    },

    "request_config": {

      "http_request_config": {

        "url": "{{$params.webhook_url}}",

        "method": "POST",

        "headers": { "Content-Type": "application/json" },

        "timeout": 10000,

        "concurrency": 5,

        "retry_times": 3,

        "retry_interval": 100,

        "request": {

          "body": "{\"text\": \"{{$tpl.content}}\", \"mrkdwn\": true}"

        }

      }

    }

  }

]
```

预期结果：列表里多出一条媒介类型为 `slackwebhook` 的记录；去通知规则里选中它， **消息模板下拉框里会出现内置的 `SlackWebhook`**。

另外三家把 `ident`、`param_config` 和 `body` 换掉就行：

| 媒介类型            | URL                                      | 请求体                                                             | 参数                                                      |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| `slackwebhook`      | `{{$params.webhook_url}}`                | `{"text": "…", "mrkdwn": true}`                                    | `webhook_url`                                             |
| `slackbot`          | `https://slack.com/api/chat.postMessage` | `{"channel": "#{{$params.channel}}", "text": "…", "mrkdwn": true}` | `channel`；token 放请求头 `Authorization: Bearer <token>` |
| `discord`           | `{{$params.webhook_url}}`                | `{"content": "…"}`                                                 | `webhook_url`                                             |
| `mattermostwebhook` | `{{$params.webhook_url}}`                | `{"text": "…"}`                                                    | `webhook_url`                                             |
| `mattermostbot`     | `<你的 Mattermost 地址>/api/v4/posts`    | `{"channel_id": "{{$params.channel_id}}", "message": "…"}`         | `channel_id`；token 放请求头                              |

表里的 `…` 都是 `{{$tpl.content}}`。请求体是一段 JSON **字符串**，里面的引号要转义。 Webhook 地址不要写死在媒介里——留成 `{{$params.webhook_url}}`，每条通知规则填自己的那条， 这样一个媒介能服务多个频道。

Bot 方式（`slackbot` / `mattermostbot`）的 token 放在请求头里， 写成 `{{.变量名}}` 可以引用[变量配置](https://n9e.github.io/zh/zh/docs/security/variables.md)里的密文，不必明文存在媒介上。

## 另一条路：用「回调」媒介手写请求体[​](#另一条路用回调媒介手写请求体 "另一条路：用「回调」媒介手写请求体的直接链接")

不想折腾 JSON 导入的话，直接用内置的 **回调**（Callback）媒介：类型面板里点「回调」， URL 留 `{{$params.callback_url}}`，把请求体改成目标平台要的形状。

![新建通知媒介](/zh/img/docs/notifications/media-type-add.zh.webp)![新建通知媒介](/zh/img/docs/notifications/media-type-add.zh.dark.webp)

代价是：**回调类媒介不消费消息模板**，界面上也不显示模板下拉框。 整条消息的排版得写在媒介的请求体里，用 `{{$event.RuleName}}` 这类变量直接拼，比如：

```
{"text": "[S{{$event.Severity}}] {{$event.RuleName}} - {{$event.TargetIdent}}"}
```

一个平台只有一种消息格式时这样最省事；要按业务线换文案，还是走上面的导入方式， 让模板去承担排版。

## 各家的 Markdown 不一样[​](#各家的-markdown-不一样 "各家的 Markdown 不一样的直接链接")

同一段文字在四家渲染出来不同，这也是内置模板各写一份的原因：

| 平台       | 加粗               | 链接                     | 备注                            |
| ---------- | ------------------ | ------------------------ | ------------------------------- |
| Slack      | `*粗体*`（单星号） | `<url\|文字>`            | 请求体要带 `"mrkdwn": true`     |
| Discord    | `**粗体**`         | `[文字](url)`            | 标准 Markdown                   |
| Mattermost | `**粗体**`         | `[文字](url)`            | 标准 Markdown                   |
| Telegram   | `<b>粗体</b>`      | `<a href="url">文字</a>` | 靠请求体里的 `parse_mode: HTML` |

想写一份到处都能看的模板，就只用纯文本加换行，别用加粗和链接语法。

## Slack 的两个特例[​](#slack-的两个特例 "Slack 的两个特例的直接链接")

渲染逻辑对 `slackwebhook` 和 `slackbot` 这两个媒介类型做了特殊处理：

* **`<` 会被还原。** 其余媒介走 `html/template`，`<` 被转义成 `&lt;`； Slack 的 `<url|文字>` 链接语法要是被转义就废了，所以渲染完会把 `&lt;` 换回 `<`。
* **渲染失败时整个字段被丢掉。** 其余媒介会把 Go 模板的报错当成正文发出去 （难看，但你至少看得见）；Slack 是直接不发这个字段，消息可能是空的。 所以改完 Slack 模板一定要用**预览**看一眼，见[模板与变量](https://n9e.github.io/zh/zh/docs/notifications/templates.md)。

## 在通知规则里用起来[​](#在通知规则里用起来 "在通知规则里用起来的直接链接")

媒介建好之后就和别的媒介一样：新建通知规则 → 选媒介 → 选模板 → 填 `webhook_url` 之类的参数 → 勾选适用级别 → **通知测试**。

预期结果：频道里收到一条排版正常的消息。

有一个坑值得先知道：**夜莺只把 HTTP 200 当成功**，其余状态码一律记成失败。 Discord 的 Webhook 成功时返回的不是 200，所以会出现「消息到了、通知记录却是失败」。 以频道里到底有没有消息为准，别只看记录里的状态。

## 常见报错[​](#常见报错 "常见报错的直接链接")

| 报错                                                 | 原因                                                 |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `status_code:400, response:invalid_payload`（Slack） | 请求体不是合法 JSON，多半是模板里的引号没转义        |
| `status_code:404, response:no_service`（Slack）      | Webhook 地址失效或被撤销                             |
| `status_code:401 Unauthorized`（Telegram）           | token 不对，或者被 BotFather 重置过                  |
| `400 chat not found`（Telegram）                     | chat id 写错，或者漏了负号，或者机器人没进过那个会话 |
| `all retries failed`（Telegram）                     | 出网不通，配代理                                     |
| 消息里出现 `invalid value; expected int64`           | 模板里给 `timeformat` 喂了非时间戳字段               |

## 下一步[​](#下一步 "下一步的直接链接")

* 模板变量和辅助函数：[模板与变量](https://n9e.github.io/zh/zh/docs/notifications/templates.md)
* 媒介、模板、规则的关系：[通知架构](https://n9e.github.io/zh/zh/docs/notifications/architecture.md)
* 接值班平台或开工单：[PagerDuty / FlashDuty / Jira](https://n9e.github.io/zh/zh/docs/notifications/oncall-ticketing.md)
