---
title: "通知模板渲染失败"
sidebar_label: "通知模板渲染失败"
description: "消息正文变成报错或某个字段莫名为空，都是模板渲染问题，而且通知记录仍显示成功；用真实事件预览模板能提前发现。"
---

群里收到一条告警，正文是一段英文报错；或者标题、某个字段莫名其妙是空的。
这两种都是模板渲染的问题，而且**通知记录里都会显示成功**——
因为 HTTP 请求确实发出去了、对方确实回了 200。

## 现象：消息正文变成了报错

渲染失败时，产品**不会中止发送**，而是把错误文本当作这个字段的正文发出去。
实际收到的长这样：

```json
{"title": "", "content": "failed to execute template: template: content:1:183: executing &#34;content&#34; at &lt;$event.NoSuchField&gt;: can&#39;t evaluate field NoSuchField in type *models.AlertCurEvent"}
```

（HTML 实体是转义的结果，`&#34;` 是引号、`&lt;`/`&gt;` 是尖括号。）

Slack 类媒介是例外：出错的字段会被**整个丢掉**，下游按缺字段处理，
所以现象是「消息里少了一块」而不是「多了一段报错」。

服务端日志里同时有一行，这是最好的定位入口：

```
ERROR models/message_tpl.go:3888 failed to render template field content: failed to execute template: template: content:1:183: executing "content" at <$event.NoSuchField>: can't evaluate field NoSuchField in type *models.AlertCurEvent events: [0x14003c2dc08]
```

grep `failed to render template field` 就能把所有渲染失败一次捞出来，
`field` 后面那个词就是出问题的模板字段名（`content` / `title` / `subject` …）。

## 能用的变量只有这几个

模板渲染时，产品会在你写的内容前面**悄悄拼一段前缀**，声明这几个变量：

```
{{ $events := .events }}
{{ $event := index $events 0 }}
{{ $labels := $event.TagsMap }}
{{ $value := $event.TriggerValue }}
```

所以**消息模板里可用的顶层变量一共就四个半**：

| 变量 | 类型 | 说明 |
|---|---|---|
| `$event` | 单个事件 | 绝大多数字段从这里取，如 `$event.RuleName` |
| `$events` | 事件数组 | 合并发送时不止一条，`range` 它 |
| `$labels` | 标签字典 | 等价于 `$event.TagsMap` |
| `$value` | 字符串 | 等价于 `$event.TriggerValue` |
| `{{$.domain}}` | 字符串 | 站点地址。**必须写 `$.`**，`{{.domain}}` 只在最外层成立 |

**根对象本身只有 `events` 和 `domain` 两个键**，除此之外什么都没有。
这就解释了本页最常见的那个错误：

- **`{{.RuleName}}` 不会报错，它会渲染成空。** 因为根是一个字典，取不到的键返回空值。
  正确写法是 `{{$event.RuleName}}`。
- **`{{$tpl.xxx}}`、`{{$params.xxx}}`、`{{$sendto}}` 在消息模板里不存在。**
  它们属于**通知媒介**的请求体那一层，不是消息模板这一层。两个地方长得像，容易搞混。

## 三类错误，各自长什么样

### 静默为空：最难发现的一类

这类不报错、不打日志，只是内容空了：

- `{{.任意字段}}` —— 根字典里没这个键，渲染成空；
- `{{$labels.nosuchtag}}` —— 标签字典里没有这个标签，返回空字符串。

**只能靠肉眼比对预期输出。** 写模板时的自查办法：把每个变量都写成
`键=值` 的形式先发一次，看哪一项右边是空的。

### 执行期报错：变量在，但用错了

模板语法没问题，跑的时候炸了。前缀统一是 `failed to execute template:`。

两个最典型的：

```
executing "content" at <$event.NoSuchField>: can't evaluate field NoSuchField in type *models.AlertCurEvent
```
—— `$event` 上没有这个字段。注意这里用的是 **Go 结构体字段名**，不是接口里的 JSON 名：
是 `$event.RuleName` 而不是 `$event.rule_name`，是 `$event.TargetIdent`、`$event.TriggerTime`、
`$event.AnnotationsJSON.summary`。

```
executing "content" at <.TriggerTime>: invalid value; expected int64
```
—— 这一条是前一节那个陷阱的连锁反应：`.TriggerTime` 从根字典取，取不到得到空值，
空值传给要求 `int64` 的 `timeformat` 就报这个。正确写法是
`{{timeformat $event.TriggerTime}}`。

同类还有一个：`wrong type for value; expected int64; got time.Time`，
说明你传给 `timeformat` 的是个时间对象而不是时间戳。

### 解析期报错：语法就不对

模板压根没编译过，前缀是 `failed to parse template:`：

```
failed to parse template: template: content:1: bad character U+007D '}'
```

括号不配对（`{{...}` 少了一个 `}`）、`if` 没有 `end`、引号没闭合，都是这一类。
**解析期报错整个字段都不会渲染**，收到的就是这行错误本身。

## 报错里的行列号对不上你的模板

`content:1:183` 里的 183 是**算上了前面那段隐藏前缀之后**的偏移量，
所以它永远比你编辑器里的位置大一百多，而且不同渲染路径下还会有几个字符的漂移。

**不要拿这个数字去数字符。** 真正有用的是尖括号里那段表达式——
`<$event.NoSuchField>`、`<.TriggerTime>` —— 它直接告诉你是哪个写法出的问题。

行号 `1` 也不代表你的模板只有一行，前缀是拼在同一行上的。

## 怎么拿真实事件预览一个模板

产品里有两处能预览，**行为不一样**，选错了会得到误导性的结论：

1. **通知规则 → 编辑 → 某条通知配置上的「运行测试」。**
   走的是**和线上完全一样的宽松渲染**：模板写错时接口照样返回成功，
   错误文本会出现在你收到的那条测试消息的正文里。
   **要看正文，不要看接口返回的成功。**
   选「历史事件」模式时会先跑一遍匹配条件，不匹配会直接拒绝并告诉你是哪一条不匹配；
   选「模拟事件」模式会跳过所有筛选，只验证渲染和通道。

2. **通知媒介 → 编辑 → 底部的「测试」。**
   走的是**严格渲染**：任何字段解析或执行失败都会**如实报错**，
   不会把错误当正文发出去。想快速验证语法，用这个。

拿真实事件预览的推荐做法：先用「历史事件」模式挑一条真正出过问题的事件，
用「运行测试」发到一个自己建的 webhook 上，把正文原样看一遍。

## 各媒介的渲染差异

同一份模板在不同媒介下的处理是不一样的，写模板时要知道：

| 媒介 | 引擎 | 转义 |
|---|---|---|
| 邮件 | text/template | **不转义**，换行就是换行 |
| Slack（webhook / bot） | html/template | JSON 转义，但把 `&lt;` 还原成 `<`（否则 `<url\|text>` 链接语法失效）；渲染出错时**丢字段** |
| 其余全部 | html/template | JSON 转义：`"` → `\"`，换行 → `\n` |

因为绝大多数媒介走 html/template，**模板里的 `<`、`>`、`&`、`'` 会被转义成 HTML 实体**。
上面那段报错正文里的 `&#34;` 就是这么来的。需要原样输出 HTML 时用 `safeHtml` 或 `unescaped`。

另外，模板函数里的 `printf` **被产品重定义过，只接受一个参数**，
不是 Go 原生那个可变参数的 `printf`。多参数的格式化要拆开写。

## 收集这些再去提问

1. 出问题的那个模板字段的**完整原文**（`content` / `title` 各一份）；
2. 你实际收到的消息正文（那段报错本身就是最关键的信息，别只截图前半句）；
3. 日志里 `failed to render template field` 的那一行；
4. 这条通知配置用的媒介类型。

**脱敏**：模板里如果引用了 `$params` 里的 token 或 webhook 地址，替换掉；
报错文本本身不含凭据，可以原样贴。

## 下一步

- 模板变量的完整写法：[消息模板与变量](../notifications/templates.md)
- 根本没收到消息：[有事件但收不到通知](./no-notification.md)
- 怎么端到端测一遍：[端到端测试一条通知](../notifications/test.md)
- 投递状态怎么读：[重试与投递状态](../notifications/delivery.md)
