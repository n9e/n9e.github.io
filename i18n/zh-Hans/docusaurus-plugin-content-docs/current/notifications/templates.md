---
title: "模板与变量"
sidebar_label: "模板与变量"
description: "消息模板用 Go text/template，变量都挂在 $event 上；写错的变量不报错、只在消息里留空白，预览能提前发现。"
last_reviewed: 2026-10-10
---

这页办完你会得到：一份自己的消息模板，用到的每个变量都在预览里验证过，
并且知道为什么写错的变量不会报错、只会让消息里空一块。

## 打开模板编辑器

**告警通知 → 消息模板**。左边是模板列表，中间是编辑器，右边是可引用的事件变量面板
（点任意一个即可复制）。

<Shot src="/img/docs/notifications/message-templates.zh" alt="消息模板" />

标题栏显示这份模板的**标识**和**媒介类型**。标识是服务端生成的 uuid，不用管；
媒介类型决定这份模板在通知规则里跟着哪个媒介出现。

开源版内置 20 份模板，覆盖 `dingtalk`、`wecom`、`feishu`、`feishucard`、`lark`、
`larkcard`、`telegram`、`discord`、`slackbot`、`slackwebhook`、`mattermostbot`、
`mattermostwebhook`、`email`、`callback`、`jira`、`jsm_alert`、`tx-sms`、`tx-voice`、
`ali-sms`、`ali-voice`。**不要直接改内置模板**——升级会把 `update_by` 仍是 `system`
的那份覆盖回去。要改就先克隆。

## 变量都挂在 $event 上

模板是 Go template，渲染前后端会先注入这几个变量：

```gotemplate
{{ $events := .events }}          {{/* 这一批事件，数组 */}}
{{ $event := index $events 0 }}   {{/* 第一条事件，绝大多数时候用它 */}}
{{ $labels := $event.TagsMap }}   {{/* 标签键值对 */}}
{{ $value := $event.TriggerValue }}
```

所以字段要写成 `{{$event.RuleName}}`，**不是 `{{.RuleName}}`**。
写成后者不会报错，只会渲染成空字符串——「消息发出来了，但某一行是空的」基本都是这个原因。

站点地址是个例外：它是渲染数据里的一个键，不是变量，写 `{{$.domain}}`。
不要写 `{{.domain}}`——在 `range` / `with` 内部 dot 会被改写，那样只在最外层成立。

## 常用变量和辅助函数

右侧面板按「常用 / 基本信息 / 触发相关 / 标签与注解 / 机器相关 / 通知相关 / 回调与扩展」
分组，可以搜中文说明。最常用的几个：

| 写法 | 是什么 |
|---|---|
| `{{$event.RuleName}}` | 规则名称 |
| `{{$event.RuleNote}}` | 规则备注 |
| `{{$event.Severity}}` | 级别，1 / 2 / 3 |
| `{{$event.IsRecovered}}` | 是不是恢复事件 |
| `{{$event.TriggerValue}}` | 触发时的值 |
| `{{$event.TagsJSON}}` | 标签数组 |
| `{{$event.TagsMap.instance}}` | 取某一个标签，把 `instance` 换成你的标签名 |
| `{{$event.AnnotationsJSON.summary}}` | 取某一条附加信息 |
| `{{$event.TargetIdent}}` / `{{$event.GroupName}}` | 机器标识 / 业务组 |
| `{{$event.TriggerTime}}` / `{{$event.FirstTriggerTime}}` / `{{$event.LastEvalTime}}` | 三个时间戳，都是 int64 |

时间戳要格式化才能看：`{{timeformat $event.TriggerTime}}`。
**`timeformat` 只吃 int64**，喂给它一个字符串会渲染出 `invalid value; expected int64`
并原样发出去。当前时间用 `{{timestamp}}`。

其他常用函数：`humanizeDurationInterface`（秒数转「1h20m」）、`formatDecimal`（保留小数位）、
`sub` / `add` / `now.Unix`（算持续时长）、`jsonMarshal`、`toUpper` / `toLower`、`join`。
完整字段清单见[通知模板变量](../reference/notification-variables.md)。

算「告警持续了多久」的标准写法，内置的钉钉模板就是这么写的：

```gotemplate
{{$d := sub now.Unix $event.FirstTriggerTime}}
{{if $event.IsRecovered}}{{$d = sub $event.LastEvalTime $event.FirstTriggerTime}}{{end}}
持续时长：{{humanizeDurationInterface $d}}
```

## 字段名由媒介决定

一份模板可以有多个字段（编辑器下方的**添加模板字段**）。字段名不是随便取的——
媒介的请求体里写死了要读哪几个：

| 媒介 | 请求体里怎么引用 | 模板必须有的字段 |
|---|---|---|
| 钉钉 | `{{$tpl.title}}` + `{{$tpl.content}}` | `title`、`content` |
| 企业微信 | `{{$tpl.content}}` | `content` |
| 飞书卡片 | `{{$tpl.title}}` + `{{$tpl.content}}` | `title`、`content` |
| 邮件 | 固定 | `subject`、`content` |
| 阿里云短信 / 语音 | `{{$tpl.incident}}` | `incident` |

对不上的字段会渲染成空，**后端不会报错**。新建模板时界面会自动帮你按媒介的请求体
反推字段名并生成一份可用的起步内容，所以「新建」比「从空白手写」稳。

## 新建一份自己的模板

在模板列表上方点 **新增**（或选中一份内置模板点复制图标克隆）：

| 字段 | 说明 |
|---|---|
| 名称 | 自己取，例如 `Dingtalk-运维组` |
| 授权团队 | 必填，决定谁能编辑这份模板 |
| 媒介类型 | 下拉里只列出**已经存在的媒介**的类型 |
| 显示模式 | 公共 / 私有 |

保存后进编辑器改内容，再点 **保存**。回到通知规则，把这条通知配置的**消息模板**
换成新的那份。

内置模板都是中文的（Discord / Slack / Mattermost / Jira 那几份是英文的）。
要换语言就克隆一份自己译。

## 预览

编辑器下方的 **预览模板内容** 用真实数据渲染一遍：

- **模拟事件**：用内置假事件，可以选级别和「是否恢复」，新环境用这个；
- **历史事件**：挑几条真实发生过的事件。

预期结果：每个字段一段渲染后的文本。某个字段渲染失败时，预览会直接把 Go 模板的
报错显示出来——**这是唯一能看见模板错误的地方**，真实发送时错误会被当成正文发出去。

## 邮件模板是个例外

邮件用 `text/template` 渲染且不做任何转义，写进去的 HTML 标签会原样保留；
邮件正文又是按 `text/html` 发出去的，所以内置的 Email 模板就是一整段 HTML 表格。
反过来说，纯文本模板里的换行在邮件客户端里不会换行，要写 `<br>`。

其余媒介走 `html/template`，渲染完还会对引号和换行做 JSON 转义（因为结果要塞进请求体的
JSON 字符串里）。这意味着在非邮件模板里手写 `<b>` 之类的标签会被转义掉，
除非目标平台本来就吃 HTML（Telegram 的内置模板就靠 `parse_mode: HTML`）。

## 几个必踩的坑

- **写错变量名不报错。** `{{$event.RuleNam}}` 渲染成空。发之前用预览过一遍。
- **`{{.RuleName}}` 这种写法一律是空的。** 顶层的 dot 上只有 `events` 和 `domain` 两个键。
- **改完模板要等一会儿。** 告警引擎侧有缓存，保存后大约 10 秒内生效。
- **不要动内置模板。** 只要 `update_by` 还是 `system`，升级就会覆盖回去；克隆一份再改。
- **接口新增模板收的是数组。** 用 API 建模板时 body 要写 `[{...}]`；服务端会自己生成
  uuid 当标识，请求里写的标识不作数。更新时必须回传库里那份标识，否则报 `cannot update ident`。

## 下一步

- 完整字段清单：[通知模板变量](../reference/notification-variables.md)
- 模板里的字段名跟媒介怎么对上：[通知架构](./architecture.md)
- 渲染报错怎么查：[模板渲染报错](../troubleshooting/template-errors.md)
- 改完之后走一遍真实链路：[端到端测试一条通知](./test.md)
