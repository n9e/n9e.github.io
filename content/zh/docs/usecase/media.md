---
title: "自定义通知媒介"
description: "夜莺监控 Nightingale 支持自定义通知媒介，可以通过 HTTP、脚本等方式发送告警事件。本文介绍如何使用企微应用作为自定义通知媒介，发送告警事件通知。"
date: 2025-07-03T23:27:13+08:00
lastmod: 2025-07-03T23:27:13+08:00
draft: false
images: []
menu:
  docs:
    parent: "usecase"
weight: 11003
toc: true
---

> 在阅读本节之前，请一定确保你已经阅读过《[通知规则](/zh/docs/usage/notify-rules/)》章节的内容，而且《[通知规则](/zh/docs/usage/notify-rules/)》章节中提到的那些外部链接资料，也都阅读过了。

下面我来模拟一个场景。假设我想使用企微应用（和企微机器人不是一个东西）来做告警通知，我们来捋一下整个流程。

## 基础配置

1、企微应用通知的时候，需要知道被通知的人的企微账号。夜莺里默认没有这个信息，我们可以自定义一个 wecomid 的联系方式的字段，然后各个用户自行配置一下。

<img src="/img/usecase/webhook/05.png" alt="add contact"/>

上图中，`wecomid` 是我自定义的字段名，点击那个“联系方式管理”（只有管理员有权限），可以创建新的联系方式，这里我创建了一个新的联系方式叫 wecomid，用于配置各个用户的企微 ID。

2、创建一个自定义通知媒介，对应我自己的程序，当用户在夜莺里配置要发告警消息给这个通知媒介的时候，夜莺就会调用我的程序，我的程序就会去调用企微接口，使用企微应用的方式发送通知消息（当然，我这里不是实际发送，只是一个演示，仍然使用在 [事件处理器](/zh/docs/usecase/callback/) 章节介绍的 [gohttpd](https://github.com/UlricQin/gohttpd) 小程序做演示）。

<img src="/img/usecase/webhook/06.png" alt="media type configuration"/>

上图通知媒介的几个关键字段解释如下：

- 媒介类型：可以自定义，我这里随便取了个名字叫 wecomapp，通知媒介通常要和消息模板配合使用，只要消息模板的媒介类型也叫 wecomapp，媒介和消息模板就可以关联起来了。
- 联系方式：选择刚才创建的 wecomid 联系方式，这样夜莺在调用我的程序的时候，就会把`告警接收人`的企微ID传给我。
- URL：我的程序的地址，夜莺会通过 HTTP POST 的方式调用这个地址，请求体的内容可以在下面定义。
- 请求体：用于定义回调的 HTTP request body 内容，可以引用几个变量，这个例子里我把三个关键变量都引用了

我的请求体：

```json
{
    "events": {{ jsonMarshal $events }},
    "sendtos": {{ jsonMarshal $sendtos }},
    "tpl": {{ jsonMarshal $tpl }}
}
```

- `$events` 是要发送的告警事件列表，虽然是个列表，实际开源版永远都只会有一条事件
- `$sendtos` 是要发送给哪些接收者，最终是一个企微ID的列表，如果联系方式那里配置的是 Phone，这个 `$sendtos` 就是手机号列表
- `$tpl` 是消息模板的内容，下面马上介绍

## 消息模板

最终在调用企微的接口发告警消息的时候，显然不是要把整个事件 JSON 发出来，那用户没法看。我们需要把事件格式化展示（比如 markdown 的方式），就像其他的通知媒介，都有对应的消息模板，自定义的通知媒介也需要有消息模板。下面我们就创建一个消息模板：

<img src="/img/usecase/webhook/07.png" alt="new message template"/>

消息模板里可以创建多个字段（比如邮件模板，就需要自定义标题和内容，所以有两个字段），不过在企微应用这个场景里，不需要多个字段，我们就创建一个 content 字段即可，后面我们可以使用 markdown 格式来定义 content 字段的内容。比如：

<img src="/img/usecase/webhook/10.png" alt="message template example"/>

我把 markdown 里的内容也贴出来供你参考：

```markdown
**规则标题**: {{$event.RuleName}}   
**监控指标**: {{$event.TagsJSON}}   
**发送时间**: {{timestamp}}   
```

我这里仅仅演示，所以 markdown 里渲染的字段比较少，你后面可以参考其他的模板来丰富这个内容。

> 💡 注意，消息模板的媒介类型需要和通知媒介的媒介类型一致，这样才能关联起来，故而我这里还是写的 wecomapp。

## 测试

现在我们就可以去测试一下了，创建一个通知规则：

<img src="/img/usecase/webhook/08.png" alt="notify rule"/>

为了方便测试，我这个通知规则没有配置任何过滤条件，即任何一个告警事件产生都会发给“企微应用”这个自定义通知媒介。

最后，我们去创建一个告警规则，关联刚才创建的通知规则：

<img src="/img/usecase/webhook/09.png" alt="alert rule"/>

稍等片刻，去观察 `http://10.99.1.107:8888/print` 这个程序是否收到回调的 HTTP 请求。我的环境里看到的结果如下：

<img src="/img/usecase/webhook/11.png" alt="自定义通知媒介"/>

我把 HTTP request body 的内容贴出来给你参考：

```json
{
	"events": [{
		"id": 1097655,
		"cate": "prometheus",
		"cluster": "prom",
		"datasource_id": 1,
		"group_id": 2,
		"group_name": "DBA-Postgres",
		"hash": "f75556af7cedbe250d3d8ab709634c96",
		"rule_id": 56,
		"rule_name": "测试自定义通知媒介2",
		"rule_note": "",
		"rule_prod": "metric",
		"rule_algo": "",
		"severity": 2,
		"prom_for_duration": 0,
		"prom_ql": "cpu_usage_active{ident=\"ulric-flashcat.local\"} \u003e 0",
		"rule_config": {
			"queries": [{
				"from": 0,
				"prom_ql": "cpu_usage_active{ident=\"ulric-flashcat.local\"} \u003e 0",
				"range": {
					"display": "now to now",
					"end": "now",
					"start": "now"
				},
				"severity": 2,
				"to": 0,
				"unit": "none"
			}]
		},
		"prom_eval_interval": 15,
		"callbacks": [],
		"runbook_url": "",
		"notify_recovered": 1,
		"target_ident": "ulric-flashcat.local",
		"target_note": "",
		"trigger_time": 1749196393,
		"trigger_value": "33.06867",
		"trigger_values": "",
		"trigger_values_json": {
			"values_with_unit": {
				"v": {
					"value": 33.06867479671808,
					"unit": "",
					"text": "33.07",
					"stat": 33.06867479671808
				}
			}
		},
		"tags": ["__name__=cpu_usage_active", "cpu=cpu-total", "ident=ulric-flashcat.local", "rulename=测试自定义通知媒介2"],
		"tags_map": {
			"__name__": "cpu_usage_active",
			"cpu": "cpu-total",
			"ident": "ulric-flashcat.local",
			"rulename": "测试自定义通知媒介2"
		},
		"original_tags": ["", "", "", ""],
		"annotations": {},
		"is_recovered": false,
		"last_eval_time": 1749196393,
		"last_sent_time": 1749196393,
		"notify_cur_number": 1,
		"first_trigger_time": 1749196393,
		"extra_config": {
			"enrich_queries": []
		},
		"status": 0,
		"claimant": "",
		"sub_rule_id": 0,
		"extra_info": null,
		"target": null,
		"recover_config": {
			"judge_type": 0,
			"recover_exp": ""
		},
		"rule_hash": "3c73b1b7f98f4c5a0178c85dedabf008",
		"extra_info_map": null,
		"notify_rule_ids": [4],
		"notify_version": 0,
		"notify_rules": null
	}],
	"sendtos": ["qinxiaohui"],
	"tpl": {
		"content": "**规则标题**: 测试自定义通知媒介2   \\n**监控指标**: [__name__=cpu_usage_active cpu=cpu-total ident=ulric-flashcat.local rulename=测试自定义通知媒介2]   \\n**发送时间**: 2025-06-06 15:53:13   "
	}
}
```

这个 request body 中不但有事件详情，还有 tpl，tpl 是渲染好的内容，你可以直接拿着这个内容去调用企微的接口。其中 `sendtos` 是企微 ID 的列表，因为我们在企微应用这个通知媒介里配置的联系方式是 wecomid，所以最终的 sendtos 里就是企微 ID 的列表，如果你在通知媒介里配置的联系方式是 Phone，那么 sendtos 里就是手机号的列表。

数据都拿到了，后面就是你的自定义逻辑以及调用企微的接口了。这里我使用 gohttpd 只是为了演示请求体的内容，显然 gohttpd 工具不具备发送企微应用消息的能力，你需要自己实现这个逻辑。即：需要你自己写一个程序，监听 HTTP 端口，提供一个 HTTP POST 接口，就像上面的 gohttpd 一样，接收夜莺的回调请求，然后解析请求体，拿到事件详情、接收人列表和消息模板内容，最后调用企微的接口发送消息。
