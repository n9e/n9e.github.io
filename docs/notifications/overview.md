# Notifications

How an event reaches a person — media types, message templates and notification rules, and which of them ship configured.

Last reviewed 2026-10-10

Six media types ship configured and enabled — FlashDuty, Callback, Email, DingTalk, WeCom and Feishu Card — and 20 built-in message templates cover the rest: Slack, Telegram, Discord, Mattermost, PagerDuty, FlashDuty, Jira and webhooks. Each message is rendered from a template; the variables available to those templates are listed in the [reference](https://n9e.github.io/docs/reference/notification-variables.md).

## [Notification architecture](https://n9e.github.io/docs/notifications/architecture.md)

[Three objects carry a notification: the rule picks recipients, the media type says how to send, the template says what to send; a missing link makes it vanish.](https://n9e.github.io/docs/notifications/architecture.md)

## [Notification rules](https://n9e.github.io/docs/notifications/rules.md)

[Match events by label and severity, then pick the media type, the template and the recipients.](https://n9e.github.io/docs/notifications/rules.md)

## [Templates and variables](https://n9e.github.io/docs/notifications/templates.md)

[Templates are Go text/template with every variable under $event; a misspelled variable raises no error and just leaves a hole in the message — preview catches it.](https://n9e.github.io/docs/notifications/templates.md)

## [DingTalk / Feishu / WeCom](https://n9e.github.io/docs/notifications/dingtalk-feishu-wecom.md)

[Robot webhooks and card messages for the three major Chinese workplace apps.](https://n9e.github.io/docs/notifications/dingtalk-feishu-wecom.md)

## [Email / Phone / SMS](https://n9e.github.io/docs/notifications/email-phone-sms.md)

[SMTP settings, and voice and SMS through Aliyun and Tencent Cloud.](https://n9e.github.io/docs/notifications/email-phone-sms.md)

## [Slack / Telegram / Discord / Mattermost](https://n9e.github.io/docs/notifications/chat.md)

[Webhook-based chat channels, and how to format a message that survives each one's markdown.](https://n9e.github.io/docs/notifications/chat.md)

## [PagerDuty / FlashDuty / Jira](https://n9e.github.io/docs/notifications/oncall-ticketing.md)

[Hand events to an on-call platform or open a ticket, with the field mapping each one expects.](https://n9e.github.io/docs/notifications/oncall-ticketing.md)

## [Callback (generic webhook)](https://n9e.github.io/docs/notifications/callback.md)

[POST events to any HTTP endpoint: the URL, headers and body template, the variables they can use, and when a call counts as delivered.](https://n9e.github.io/docs/notifications/callback.md)

## [Script media type](https://n9e.github.io/docs/notifications/script.md)

[Hand events to your own program: how the script is stored and run, what arrives on stdin, and how success and failure are recorded.](https://n9e.github.io/docs/notifications/script.md)

## [Retries and delivery status](https://n9e.github.io/docs/notifications/delivery.md)

[Failed sends are retried only for connection failures, with parameters per send type; the outcome of every message is in the notification log, kept for seven days.](https://n9e.github.io/docs/notifications/delivery.md)

## [Test a notification end to end](https://n9e.github.io/docs/notifications/test.md)

[Send a test message through a real channel, from rule to phone, before you rely on it at 3 a.m.](https://n9e.github.io/docs/notifications/test.md)
