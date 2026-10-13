# 通知

事件怎么送到人手里——通知媒介、消息模板、通知规则，以及哪些是开箱就有的。

最后校对于 2026-10-10

开箱就配好并启用的媒介有 6 个——FlashDuty、Callback、邮件、钉钉、企业微信、飞书卡片； 另有 20 份内置消息模板覆盖其余的：Slack、Telegram、Discord、Mattermost、 PagerDuty、FlashDuty、Jira 与 Webhook。每条消息都由模板渲染，可用变量见 [通知模板变量](https://n9e.github.io/zh/docs/reference/notification-variables.md)。

## [通知架构](https://n9e.github.io/zh/docs/notifications/architecture.md)

[一条通知经过三个对象：通知规则决定发给谁，媒介决定怎么发，模板决定发什么；三者靠媒介类型对上，缺一环通知就静默消失。](https://n9e.github.io/zh/docs/notifications/architecture.md)

## [通知规则](https://n9e.github.io/zh/docs/notifications/rules.md)

[按标签和级别匹配事件，再决定走哪个媒介、用哪份模板、发给谁。](https://n9e.github.io/zh/docs/notifications/rules.md)

## [模板与变量](https://n9e.github.io/zh/docs/notifications/templates.md)

[消息模板用 Go text/template，变量都挂在 $event 上；写错的变量不报错、只在消息里留空白，预览能提前发现。](https://n9e.github.io/zh/docs/notifications/templates.md)

## [钉钉 / 飞书 / 企业微信](https://n9e.github.io/zh/docs/notifications/dingtalk-feishu-wecom.md)

[三大国内办公应用的机器人 Webhook 与卡片消息。](https://n9e.github.io/zh/docs/notifications/dingtalk-feishu-wecom.md)

## [邮件 / 电话 / 短信](https://n9e.github.io/zh/docs/notifications/email-phone-sms.md)

[SMTP 设置，以及通过阿里云、腾讯云发电话和短信。](https://n9e.github.io/zh/docs/notifications/email-phone-sms.md)

## [Slack / Telegram / Discord / Mattermost](https://n9e.github.io/zh/docs/notifications/chat.md)

[基于 Webhook 的聊天媒介，以及怎么写一条各家 Markdown 都不吃掉的消息。](https://n9e.github.io/zh/docs/notifications/chat.md)

## [PagerDuty / FlashDuty / Jira](https://n9e.github.io/zh/docs/notifications/oncall-ticketing.md)

[把事件交给值班平台或开工单，附各家要求的字段映射。](https://n9e.github.io/zh/docs/notifications/oncall-ticketing.md)

## [Callback（通用 Webhook）](https://n9e.github.io/zh/docs/notifications/callback.md)

[把事件 POST 到任意 HTTP 接口：URL、请求头、请求体模板，模板里能用哪些变量，以及什么情况才算发送成功。](https://n9e.github.io/zh/docs/notifications/callback.md)

## [脚本媒介](https://n9e.github.io/zh/docs/notifications/script.md)

[把事件交给你自己的程序：脚本怎么保存和执行、stdin 里收到什么、成功和失败怎么记录。](https://n9e.github.io/zh/docs/notifications/script.md)

## [重试与投递状态](https://n9e.github.io/zh/docs/notifications/delivery.md)

[通知发送失败只对「连不上」自动重试，参数按发送类型各不相同；每条消息的投递结果在通知记录里可查，记录保留 7 天。](https://n9e.github.io/zh/docs/notifications/delivery.md)

## [端到端测试一条通知](https://n9e.github.io/zh/docs/notifications/test.md)

[在凌晨三点依赖它之前，先通过真实媒介从规则到手机完整发一条测试消息。](https://n9e.github.io/zh/docs/notifications/test.md)
