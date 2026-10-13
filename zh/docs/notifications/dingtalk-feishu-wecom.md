# 钉钉 / 飞书 / 企业微信

三大国内办公应用的机器人 Webhook 与卡片消息。

最后校对于 2026-10-10

这页办完你会得到：告警发进你的钉钉群 / 飞书群 / 企业微信群，一个媒介被所有群共用， 每个群的 token 各自填在自己的通知规则里。

## 最快的路径：粘贴 Webhook 地址[​](#最快的路径粘贴-webhook-地址 "最快的路径：粘贴 Webhook 地址的直接链接")

如果你只是想让某个群收到告警，不用先去建媒介。在**告警规则**的编辑页， **通知规则** 这个下拉框里有 **快捷创建**：把机器人的完整 Webhook 地址粘进去就行。

它能自动识别钉钉、企业微信、飞书卡片、Lark 卡片和 FlashDuty， 从地址里取出 token，查重后复用已有的通知规则，或者替你把媒介和通知规则一起建好。

识别不出来（比如 Slack、自建 webhook）就走下面的手动流程。

## 1. 在 IM 里建群机器人[​](#1-在-im-里建群机器人 "1. 在 IM 里建群机器人的直接链接")

| 平台     | 路径                                              | 拿到的地址                                                    |
| -------- | ------------------------------------------------- | ------------------------------------------------------------- |
| 钉钉     | 群设置 → 智能群助手 → 添加机器人 → **自定义**     | `https://oapi.dingtalk.com/robot/send?access_token=<token>`   |
| 企业微信 | 群设置 → 群机器人 → 添加机器人 → 新建机器人       | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<uuid>` |
| 飞书     | 群设置 → 群机器人 → 添加机器人 → **自定义机器人** | `https://open.feishu.cn/open-apis/bot/v2/hook/<uuid>`         |
| Lark     | Group settings → Bots → Add Bot → **Custom Bot**  | `https://open.larksuite.com/open-apis/bot/v2/hook/<uuid>`     |

**只有 token 那一段是要填进夜莺的**，不是整条 URL——媒介里已经写好了域名和路径， 把整条 URL 粘进去会拼出一个无效地址。

## 2. 媒介一般不用改[​](#2-媒介一般不用改 "2. 媒介一般不用改的直接链接")

**告警通知 → 通知媒介**。开源版内置了 `Dingtalk`、`Wecom`、`Feishu Card` 三个媒介， 直接用就行；Lark 卡片在左侧类型面板里有卡片，点一下建一个。

![通知媒介](https://n9e.github.io/zh/img/docs/notifications/media-types.zh.webp)![通知媒介](https://n9e.github.io/zh/img/docs/notifications/media-types.zh.dark.webp)

媒介里已经预置好了 URL、请求方法、请求头和请求体。只有这几种情况需要动它：

* **要走代理才能出网**：填 HTTP 配置里的**代理**；
* **想按业务线分开统计或限流**：复制一份媒介，改个名字；
* **想换消息形态**（比如钉钉从 markdown 换成 ActionCard）：改**请求体**。

## 3. 在通知规则里填 token[​](#3-在通知规则里填-token "3. 在通知规则里填 token的直接链接")

**告警通知 → 通知规则 → 新增**，在通知配置里：

1. **通知媒介** 选 `Dingtalk` / `Wecom` / `Feishu Card`；
2. **消息模板** 会自动选中同类型的那一份（`Dingtalk` / `Wecom` / `FeishuCard`）；
3. 填媒介参数（见下表），`Bot Name` 只是备注，可以不填；
4. 勾选**适用级别**，否则这条配置匹配不到任何事件；
5. 点 **通知测试** → 选「使用模拟事件」，确认群里真的收到消息。

## 三家的字段对照[​](#三家的字段对照 "三家的字段对照的直接链接")

|              | 钉钉                     | 企业微信           | 飞书卡片                       | Lark 卡片            |
| ------------ | ------------------------ | ------------------ | ------------------------------ | -------------------- |
| 媒介参数名   | `Access Token`           | `Key`              | `Access Token`                 | `Token`              |
| 填什么       | `access_token=` 后面那段 | `key=` 后面的 UUID | `/hook/` 后面的 UUID           | `/hook/` 后面的 UUID |
| 内置消息模板 | `Dingtalk`               | `Wecom`            | `FeishuCard`                   | `LarkCard`           |
| 模板字段     | `title` + `content`      | `content`          | `title` + `content`            | `title` + `content`  |
| 消息形态     | markdown                 | markdown           | 交互式卡片，恢复变绿、告警变红 | 同飞书               |
| 频率限制     | 20 条 / 分钟             | 20 条 / 分钟       | 100 条 / 分钟，5 条 / 秒       | 同飞书               |

企业微信的模板只有 `content` 一个字段，没有标题——所以级别和规则名要写进正文第一行， 内置模板就是这么做的。

## 安全设置：只支持关键词和 IP 白名单[​](#安全设置只支持关键词和-ip-白名单 "安全设置：只支持关键词和 IP 白名单的直接链接")

三家建机器人时都会让你选一种安全策略。夜莺支持的是：

* **自定义关键词**：机器人只转发包含关键词的消息。挑一个必然出现在消息里的词， 比如 `Triggered` 或者你的规则名前缀。钉钉最多 10 个关键词，飞书最多 3 个。
* **IP 白名单**：填夜莺服务器的出口 IP。

**加签 / 签名校验不支持。** 媒介的请求体里没有签名字段，也没地方填密钥。 建机器人时选加签，消息会被平台以 `sign not match` 拒绝。

## @ 到具体的人[​](#-到具体的人 "@ 到具体的人的直接链接")

只有钉钉支持。内置的 Dingtalk 媒介请求体里已经有 `{{batchContactsAts $sendtos}}` 和 `atMobiles`，但**默认取不到人**—— `$sendtos` 是空的。要让它生效：

1. 编辑 `Dingtalk` 媒介，把**变量配置 → 联系方式**设成 `Phone`；
2. 通知规则里就会多出 **接收人 / 接收团队**，选上；
3. 这些用户的手机号要填过，并且人得在群里。

企业微信群机器人**不能按手机号 @**（只能在 markdown 里写 `<@userid>`）， 飞书卡片机器人同理。

## 常见报错[​](#常见报错 "常见报错的直接链接")

| 报错                                                             | 原因                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `keywords not in content`（钉钉）/ `Key Words Not Found`（飞书） | 消息里没有你设的关键词。换个必然出现的词，或者改用 IP 白名单 |
| `sign not match` / `sign match fail`                             | 机器人选了加签，改成关键词或 IP 白名单                       |
| `invalid webhook url`（企业微信）                                | 把整条 URL 填进了 `Key`，只填 UUID                           |
| `errcode 45009`（企业微信）/ 钉钉限流                            | 超过 20 条/分钟。用屏蔽规则或多建几个群分流                  |
| `status_code:200` 但群里没消息                                   | 机器人被移出群了，或者消息被关键词策略过滤                   |

失败详情在事件详情的**通知记录**里，见[重试与投递状态](https://n9e.github.io/zh/docs/notifications/delivery.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* 改消息排版：[模板与变量](https://n9e.github.io/zh/docs/notifications/templates.md)
* Slack / Telegram / Discord：[Slack / Telegram / Discord / Mattermost](https://n9e.github.io/zh/docs/notifications/chat.md)
* 上线前完整验一遍：[端到端测试一条通知](https://n9e.github.io/zh/docs/notifications/test.md)
