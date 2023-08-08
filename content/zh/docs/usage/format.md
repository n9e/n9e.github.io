---
title: "告警格式"
description: "夜莺（ Nightingale ）告警通知消息的内容格式"
lead: ""
date: 2020-10-06T08:48:57+00:00
lastmod: 2020-10-06T08:48:57+00:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 850
toc: true
---

告警事件的消息通知格式，是由模板控制的，模板文件在 `etc/template` 下：

- dingtalk.tpl 钉钉的消息模板
- feishu.tpl 飞书的消息模板
- wecom.tpl 企业微信的消息模板
- subject.tpl 邮件标题模板
- mailbody.tpl 邮件内容模板

这些模板文件都遵从 go template 语法，模板中可以引用变量，有哪些变量可以引用呢？可以参考 [AlertCurEvent](https://github.com/ccfos/nightingale/blob/main/src/models/alert_cur_event.go#L13) 结构，这个结构的各个字段都可以被引用。

## 需求：如何自定义展示标签

告警事件中一般会有多个标签，模板文件中这个写法 `{{.TagsJSON}}` 可以按照数组的方式展示所有的标签。对于Kubernetes体系的监控数据，有的时候标签会非常非常多，看起来很费劲，有些朋友就会想，我是否可以自定义，只展示部分标签呢？

答案当然是可以的。`TagsJSON` 是所有标签的数组形式，`TagsMap`是所有标签的map形式，我们可以使用`TagsMap`来方便的获取特定的标签值，比如我这里修改企微的模板文件，不展示所有的标签：

```
**级别状态**: {{if .IsRecovered}}<font color="info">S{{.Severity}} Recovered</font>{{else}}<font color="warning">S{{.Severity}} Triggered</font>{{end}}
**规则标题**: {{.RuleName}}{{if .RuleNote}}
**规则备注**: {{.RuleNote}}{{end}}
**监控指标**: {{$metric := index .TagsMap "__name__"}}{{if eq "disk_used_percent" $metric}}机器：{{index .TagsMap "ident"}} 分区：{{index .TagsMap "path"}}{{else}}{{.TagsJSON}}{{end}}
{{if .IsRecovered}}**恢复时间**：{{timeformat .LastEvalTime}}{{else}}**触发时间**: {{timeformat .TriggerTime}}
**触发时值**: {{.TriggerValue}}{{end}}
**发送时间**: {{timestamp}}
```

注意上面监控指标那一行，先从TagsMap中拿到 `__name__` 对应的标签值，就是 `$metric`，然后判断 `$metric` 是否是磁盘利用率，如果是就只展示ident标签的内容和path标签的内容，如果不是，就还是按照老样子，把TagsJSON全部展示出来。

但是，这种方式每次都要修改模板文件，太麻烦了。实际上，告警规则的备注也是支持模板语法的，我们可以利用这个特性做自定义。

## 使用模板语法自定义规则备注

这里的思路是：我们利用模板语法自定义规则备注，在规则备注里加一个特殊的前缀，在tpl文件里做判断，如果发现有这个前缀，就不展示TagsJSON，如果没有这个前缀，就还是展示TagsJSON。

配置告警规则时，规则备注配置成如下：

```
; ident={{$labels.ident}} path={{$labels.path}}
```

加了一个分号做前缀。然后wecom.tpl如下定义：

```
**级别状态**: {{if .IsRecovered}}<font color="info">S{{.Severity}} Recovered</font>{{else}}<font color="warning">S{{.Severity}} Triggered</font>{{end}}
**规则标题**: {{.RuleName}}{{if .RuleNote}}
**规则备注**: {{.RuleNote}}{{end}}{{$iscustom := match "^;" .RuleNote}}{{if not $iscustom}}
**监控指标**: {{.TagsJSON}}{{end}}
{{if .IsRecovered}}**恢复时间**：{{timeformat .LastEvalTime}}{{else}}**触发时间**: {{timeformat .TriggerTime}}
**触发时值**: {{.TriggerValue}}{{end}}
**发送时间**: {{timestamp}}
```

上面逻辑是，判断RuleNote的内容，如果以分号开头（用正则匹配），表示这是特殊前缀，此时就不展示TagsJSON了，如果不是这个前缀，就展示TagsJSON。

## 注意

以上效果的达成，需要夜莺后端版本在 5.9.6 以上。

