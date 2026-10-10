---
title: "PagerDuty / FlashDuty / Jira"
sidebar_label: "PagerDuty / FlashDuty / Jira"
description: "把事件交给值班平台或开工单，附各家要求的字段映射。"
---

这页办完你会得到：夜莺的告警事件进入 FlashDuty 或 PagerDuty 的值班流程，
或者变成一条 Jira 工单——而不是停在群消息里等人看见。

## 三种做法，性质不同

| | FlashDuty | PagerDuty | Jira / JSM |
|---|---|---|---|
| 类型面板里有卡片吗 | 有，且开源版**已内置一个媒介** | 有卡片，需要自己建 | 没有，用导入 |
| 消息模板 | **不用**，直接发事件原始 JSON | **不用**，后端按 Events API v2 拼 payload | 用，内置 `Jira` / `JSMAlert` |
| 恢复怎么处理 | 事件里的 `is_recovered` 由对方识别 | 发一条 `resolve`，按 `dedup_key` 关闭 | JSM 按 alias 关闭；Jira 只建单，不自动关 |
| 在通知规则里选什么 | **协作空间**（多选） | **服务/集成**（多选） | 和普通 HTTP 媒介一样，填参数 |

前两种的共同点是：**降噪、排班、升级都交给对方做**，夜莺这边不要再叠一层筛选，
把事件原样送过去就行。

## FlashDuty：开源版内置

**告警通知 → 通知媒介**，编辑内置的 `FlashDuty`。

先去 FlashDuty 控制台的集成中心创建一个「夜莺」类型的告警事件集成，
拿到形如 `https://api.flashcat.cloud/event/push/alert/n9e?integration_key=<key>` 的推送地址。

媒介里填：

| 字段 | 说明 |
|---|---|
| URL | **整条推送地址**，包含 `integration_key`，不要只填 key |
| 代理 | 需要走代理出网时填 |
| 超时时间 | 毫秒，默认 5000 |
| 重试次数 | 默认 3 |

回到通知规则，选中这个媒介后会出现 **协作空间** 多选框，列表是从 FlashDuty 拉回来的。
留空表示用集成自身的默认空间；选了多个就按每个空间各发一次。

**这里没有消息模板下拉框**——FlashDuty 收的是事件对象的原始 JSON 数组，排版由它自己做。

有一条也值得知道：FlashDuty 这条链路上，**只要请求发出去了就算成功**——
对方返回 5xx 也不重试、也不记成失败，状态码和响应体原样写进通知记录。
这是有意的：重发会破坏对方的去重。所以排查 FlashDuty 时要看通知记录的**响应内容**，
光看状态是「成功」没意义。

## PagerDuty：类型面板里有卡片

需要两个不同的凭证，分清楚它们是这页最要紧的事：

- **REST API Key**：填在**媒介**上，夜莺只用它去列出你的 Service 和 Integration，
  好在通知规则里给你一个下拉框。
- **Integration Key（routing key）**：**你不用手抄**。在通知规则里勾选「服务/集成」之后，
  夜莺自己去把对应的 routing key 取回来。

平台侧准备：

1. **Services → Service Directory → New Service**，选一个 Escalation Policy，
   集成类型选 **Events API v2**；
2. 头像 → My Profile → User Settings → API Access → **Create API User Token**，
   只读权限就够。

媒介里填 API Key、代理、超时时间（默认 5000 毫秒）、重试次数（默认 3）。
**没有 URL 也没有请求体**——投递地址是写死的 `https://events.pagerduty.com/v2/enqueue`，
payload 由后端拼。

通知规则里选好媒介后，**服务/集成** 是必选项。一条都不选，发送时会直接失败并记录
`pagerduty requires at least one routing key in sendtos`。

PagerDuty 的重试口径也和普通 HTTP 媒介不同：只有 200 和 202 算成功，
**其余状态码会按重试次数再试**（总共尝试「重试次数 + 1」轮）。

:::note 测试弹窗要手填 Integration Key
在媒介编辑页点「测试」时，服务下拉框取不到值（它依赖已保存的媒介 id），
所以测试弹窗里要你手填 Integration Key。这只影响测试，保存之后走通知规则就没这问题了。
:::

## PagerDuty 送过去的字段

| PagerDuty 字段 | 夜莺的来源 |
|---|---|
| `event_action` | 恢复事件是 `resolve`，其余是 `trigger` |
| `dedup_key` | 事件哈希 |
| `payload.summary` | 规则名称 |
| `payload.source` | 数据源名称 |
| `payload.severity` | S1 → `critical`，S2 → `error`，S3 → `warning` |
| `payload.group` | 业务组名称 |
| `payload.component` | 事件关联的机器对象，没有关联机器时为空 |
| `payload.timestamp` | 触发时间，RFC3339 |
| `payload.custom_details` | 标签、附加信息、规则 ID/备注、PromQL、机器标识、数据源 ID、首次触发时间等 |
| `links` | 事件详情链接、屏蔽链接 |

两个后果值得留意：

- **默认只有 `critical` 会触发电话升级。** S2、S3 映射成 `error` / `warning`，
  想让它们也打电话，去 PagerDuty 的 Event Rules 里改优先级，不要在夜莺这边改级别。
- **多选服务会扇出。** 选 N 个服务就发 N 条事件，PagerDuty 按事件计费。

## Jira / JSM：用导入建媒介

类型面板里没有 Jira 卡片，但**内置消息模板里有 `Jira` 和 `JSMAlert`**。
在媒介列表页用 **导入** 建一个 `ident` 是 `jira` 或 `jsm_alert` 的媒介，
那份内置模板就能在通知规则里选到了。

**Jira**（建工单）大致长这样：

- URL：`https://<服务账号邮箱>:<API Token>@api.atlassian.com/ex/jira/<CloudID>/rest/api/3/issue`
- 方法 POST，请求头 `Content-Type: application/json`
- 自定义参数：`project_key`
- 请求体：创建 issue，`fields.project.key` 取 `{{$params.project_key}}`，
  `summary` 取 `{{$event.RuleName}}`，描述用 ADF 格式包住 `{{$tpl.content}}`，
  `labels` 里带上 `eventHash={{$event.Hash}}`

URL 里的凭证不要写死——写成 `{{.jira_token}}`，值放[变量配置](../security/variables.md)里。
这条链路**只建单，不自动关单**；要闭环就用 `eventHash` 这个 label 自己写一个回收脚本。

**JSM Alert**（Jira Service Management 的告警，原 Opsgenie）能闭环：

- URL：`https://api.atlassian.com/jsm/ops/integration/v2/alerts`，
  恢复事件时在后面拼 `/<事件哈希>/close?identifierType=alias`——**同一个媒介同时管建和关**
- 请求头：`Authorization: GenieKey {{$params.api_key}}`
- 自定义参数：`api_key`
- 请求体按 `IsRecovered` 分支：恢复发 `note` + `source`，触发发 `message` / `description` /
  `alias` / `priority` / `tags` / `details`

注意区域：全球版是 `api.atlassian.com`，欧盟版是 `api.eu.atlassian.com`。
用错域名会返回 401。

## 恢复靠事件哈希去重

PagerDuty 的 `dedup_key` 和 JSM 的 `alias` 用的都是夜莺的**事件哈希**。
它由告警规则和事件的维度标签算出来，所以：

- 改规则 ID 或改分组维度，哈希会变，**旧的告警关不掉**，会一直挂在对方平台上；
- 恢复事件必须真的产生。规则的「通知恢复」关掉了，对方就永远收不到 `resolve`。

## 常见报错

| 报错 | 原因 |
|---|---|
| `pagerduty requires at least one routing key in sendtos` | 通知规则里没选「服务/集成」 |
| PagerDuty 服务下拉框是空的 | API Key 不对或权限不够，或者服务器出不去网 |
| `401` / `403`（PagerDuty） | routing key 失效，或该集成被停用 |
| `400 Event object is invalid`（PagerDuty） | payload 不合法，正常情况下不会出现，遇到请提 issue |
| `401`（JSM） | API Key 的区域和 URL 的区域对不上 |
| `404`（JSM 关单） | 对应的告警在对方平台上不存在，多半是哈希变了 |
| FlashDuty 协作空间拉不出来 | 集成地址填错，或只填了 key 没填完整 URL |

## 下一步

- 事件送到了但内容不对：[模板与变量](./templates.md)
- 送不出去时看哪儿：[重试与投递状态](./delivery.md)
- 在夜莺这边先降噪还是交给对方：[降噪与路由模型](../concepts/noise-routing.md)
