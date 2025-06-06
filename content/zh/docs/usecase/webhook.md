---
title: "Webhook(Callback)"
description: ""
date: 2025-06-06T10:54:48+08:00
lastmod: 2025-06-06T10:54:48+08:00
draft: false
images: []
menu:
  docs:
    parent: "usecase"
weight: 10000
toc: true
---

本文讲解夜莺 v8.beta13 以上版本的 Webhook(Callback) 相关能力。Webhook 通常用在两个场景：

1. 与夜莺联动事件自动化处理：
   - 事件触发后，夜莺可以通过 Webhook 通知外部系统，外部系统可以根据事件内容进行自动化处理。
   - 事件触发后，夜莺可以通过 Webhook 通知外部系统，外部系统对事件做修改，然后把事件返回，继续在夜莺中处理。相当于外部系统充当了夜莺的事件处理器。
2. 与夜莺联动事件通知：
   - 事件触发后，夜莺可以通过 Webhook 通知外部系统，外部系统可以根据事件内容进行告警通知，即外部系统仅充当一个通知媒介。

下面我们分别对这两种场景进行讲解演示。

## 与夜莺联动事件自动化处理

1. 需要新建一个“通知规则”
2. 在“通知规则”里，添加事件处理器，事件处理器需要提前创建好，使用 Callback 类型的处理器，创建处理器的页面举例如下。

<img src="/img/usecase/webhook/01.png" alt="Event Processor"/>

> 这里的 `http://10.99.1.107:8888/print` 是我的一个测试程序，可以把接收到的 HTTP 请求打印出来，方便演示。这个程序也是一个开源小程序，地址在 [github gohttpd](https://github.com/UlricQin/gohttpd)。

创建了处理器后，回到通知规则页面，添加事件处理器，选择刚才创建的处理器。

<img src="/img/usecase/webhook/02.png" alt="Add Event Processor"/>

接下来，就可以去配置“告警规则”做测试了，测试一下产生的告警能否被第三方程序接收到。

为了尽快看到效果，可以创建一个肯定会触发阈值的告警规则，然后在通知规则那里，选择刚才创建的通知规则：

<img src="/img/usecase/webhook/03.png" alt="Add Alert Rule"/>

稍等片刻，去观察 `http://10.99.1.107:8888/print` 这个程序是否收到回调的 HTTP 请求。我的环境里看到的结果如下：

<img src="/img/usecase/webhook/04.png" alt="Webhook request"/>

从上图可以看出，HTTP request 中包含了告警事件的信息，其内容如下：

```json
{
	"id": 1097371,
	"cate": "prometheus",
	"cluster": "prom",
	"datasource_id": 1,
	"group_id": 2,
	"group_name": "DBA-Postgres",
	"hash": "54f5543591c6dc0e30139cae196a1eee",
	"rule_id": 54,
	"rule_name": "测试事件回调",
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
				"display": "now-undefineds to now-undefineds",
				"end": "now-undefineds",
				"start": "now-undefineds"
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
	"trigger_time": 1749180264,
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
	"tags": ["__name__=cpu_usage_active", "cpu=cpu-total", "ident=ulric-flashcat.local", "rulename=测试事件回调"],
	"tags_map": {
		"__name__": "cpu_usage_active",
		"cpu": "cpu-total",
		"ident": "ulric-flashcat.local",
		"rulename": "测试事件回调"
	},
	"original_tags": ["", "", "", ""],
	"annotations": {},
	"is_recovered": false,
	"last_eval_time": 1749180264,
	"last_sent_time": 1749180264,
	"notify_cur_number": 1,
	"first_trigger_time": 1749180264,
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
	"rule_hash": "dc128d86d65326499bd03ecfbe56e4c3",
	"extra_info_map": null,
	"notify_rule_ids": [3],
	"notify_version": 0,
	"notify_rules": null
}
```

测试正常。如果您有类似需求，就可以使用这种 Callback 处理器来对接，在您的程序中做一些自动化的逻辑。

### Event Update 处理器

事件处理器中，还有一个 Event Update 处理器，和 Callback 的配置方式一样，这俩工作逻辑也很像，这里也做一个介绍。

夜莺在调用 Callback 地址的时候，是不关注 HTTP Response 的，而在调用 Event Update 的时候，会把 HTTP Response 的内容作为新的告警事件走后续处理。

所以，Event Update 如其名，就是用来修改告警事件的。通常用于附加一些额外信息到告警事件中，比如：

- 把事件交给 AI 分析，得到一些结论性质的信息，附加到事件中
- 去 CMDB 查询一些元信息，附加到事件中

注意，告警事件的结构不能乱改，比如直接在 JSON 顶层增加一个字段，后续流程是不认的。通常建议把新内容附加到 `annotations` 字段，我上面的例子中，`annotations` 是空的所以看不出来数据结构，实际 `annotations` 是一个 map 结构，map key 和 map value 都是字符串类型，你要附加内容的时候，也需要遵循这个结构。

> 高级玩家也可以修改 Event 的其他字段，但是你得清楚你的修改对后续的影响，普通用户就只需要把内容附加到 `annotations` 字段，然后把整个新的 Event 序列化为 JSON 放到 HTTP Response 的 body 中即可。

## 与夜莺联动事件通知

如果你的程序仅仅做告警事件的通知，则应该做成一个自定义通知媒介，不建议作为一个事件处理器。

下面我来模拟一个场景。假设我想使用企微应用（和企微机器人不是一个东西）来做告警通知，我们来捋一下整个流程。

### 自定义通知媒介基础配置

1、企微应用通知的时候，需要知道被通知的人的企微账号。夜莺里默认没有这个信息，我们可以自定义一个 wecomid 的联系方式的字段，然后各个用户自行配置一下。

<img src="/img/usecase/webhook/05.png" alt="add contact"/>

上图中，`wecomid` 是我自定义的字段名，点击那个“联系方式管理”（只有管理员有权限），可以创建新的联系方式，这里我创建了一个新的联系方式叫 wecomid，用于配置各个用户的企微 ID。

2、创建一个自定义通知媒介，对应我自己的程序，当用户在夜莺里配置要发告警消息给这个通知媒介的时候，夜莺就会调用我的程序，我的程序就会去调用企微接口，使用企微应用的方式发送通知消息（当然，我这里不是实际发送，只是一个演示，仍然使用上面介绍的 [gohttpd](https://github.com/UlricQin/gohttpd) 小程序做演示）。

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

### 消息模板

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

我这里仅仅演示，所以 markdown 里渲染的字段比较少，你后面可以参考其他的模板来丰富这个内容。注意，消息模板的媒介类型需要和通知媒介的媒介类型一致，这样才能关联起来，故而我这里还是写的 wecomapp。

### 测试

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

其实吧，企微应用的通知接口是 HTTP 的，不需要自己写程序也可以配置出来，不过这个配置有点复杂，主要是拼接请求体那里不好搞，需要使用内置的一些函数来拼接企微 ID 之类的，回头再单独介绍，本文重点是通过这么一个过程来演示自定义通知媒介的使用。

## 总结

从夜莺 v8.beta13 开始，通知规则、事件处理器、通知媒介、消息模板，整个设计极为灵活，但是确实有些难以理解，期待社区的朋友多多分享使用经验，多写文章，可以把您写的文章链接附到本文下面（提 PR 即可），帮助更多人。
