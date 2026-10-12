# AI 摘要处理器

通知之前让大模型给每个事件写一段摘要：模型怎么接、提示词模板怎么写、结果落在哪、调用失败会怎样。

这页办完你会得到：流经工作流的每个事件，都带上一个由大模型写的 `ai_summary` 附加信息， 通知模板把它放在消息最前面。

它是工作流（**告警通知 → 事件处理**）里的一种处理器：添加一张处理器卡片，在 **富化** 下选 **AI 摘要生成**。 工作流怎么运行、怎么挂到规则上，见[事件 Pipeline](https://n9e.github.io/zh/zh/docs/events/pipelines.md)。

## 1. 接上模型[​](#1-接上模型 "1. 接上模型的直接链接")

由第一个字段决定，两种方式：

* **复用 LLM 配置**——选一个在 **AI 配置 → LLM 配置** 里已经配好的模型，沿用它的提供方、模型、密钥和地址， 那里支持的提供方这里都能用。该配置必须是启用状态。见[配置大模型提供方](https://n9e.github.io/zh/zh/docs/ai/llm-provider.md)。
* **留空**，填下面的字段。这时直接调用一个 **OpenAI 兼容的 chat completions** 接口：

| 字段     | 说明                                                                |
| -------- | ------------------------------------------------------------------- |
| URL      | 完整的接口地址，比如 `https://api.deepseek.com/v1/chat/completions` |
| API Key  | 以 `Authorization: Bearer <key>` 发送                               |
| 模型名称 | 比如 `deepseek-chat`                                                |

**高级配置** 里（只在手填模式下生效）：

| 字段                   | 说明                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| AI 模型参数配置        | 额外的请求字段，比如 `temperature = 0.7`。看起来像数字、布尔值或 JSON 的值，按对应类型发送 |
| 请求头                 | 加到请求上                                                                                 |
| HTTP Proxy             | 只能走代理访问模型时填                                                                     |
| 超时时间               | **毫秒**，默认 30000（输入框提示写的是秒，实际按毫秒算）                                   |
| TLS InsecureSkipVerify | 接口是自签证书时打开                                                                       |

复用 LLM 配置时，超时时间取那份配置里的设置。

## 2. 写提示词[​](#2-写提示词 "2. 写提示词的直接链接")

**提示词模板** 是一个按事件渲染的 Go 模板，渲染结果作为一条 user 消息发给模型。 `$event` 是事件，`$inputs` 是工作流的变量。新卡片自带一个能直接用的默认模板：

```
请分析以下告警事件信息，并提供一个简洁明了的中文总结：

告警规则: {{$event.RuleName}}

严重程度: {{$event.Severity}}

告警状态: {{if $event.IsRecovered}}Recovered{{else}}{{$event.Severity}} Triggered{{end}}

触发时间: {{$event.TriggerTime}}

触发值: {{$event.TriggerValue}}

规则说明: {{$event.RuleNote}}

标签信息: {{$event.Tags}}

注释信息: {{$event.Annotations}}
```

事件字段见[通知模板变量](https://n9e.github.io/zh/zh/docs/reference/notification-variables.md)。想要多长、什么语言，在提示词里写清楚； 模型的回复原样使用。

## 3. 使用结果[​](#3-使用结果 "3. 使用结果的直接链接")

回复写进事件附加信息的 **`ai_summary`** 这个 key，覆盖之前的值。事件详情页里能看到， 通知模板里这样引用：

```
{{ if $event.AnnotationsJSON.ai_summary }}AI 摘要：{{ $event.AnnotationsJSON.ai_summary }}{{ end }}
```

需要读到摘要的处理器——回调、丢弃条件——要排在它**后面**。

## 调用失败时[​](#调用失败时 "调用失败时的直接链接")

* 调用失败（连不上、非 2xx、超时、返回为空），这个节点在[执行记录](https://n9e.github.io/zh/zh/docs/events/execution-records.md)里标为**失败**。 事件**照样往下走**，进入后续处理器和通知，只是没有 `ai_summary`——所以模板里像上面那样用 `if` 兜住。
* 调用是同步的：模型慢，通知最多晚一个超时时长。
* **每个事件调用一次模型。** 用工作流的处理范围把低价值事件挡在外面，比如排除恢复事件或 S3。

## 下一步[​](#下一步 "下一步的直接链接")

* 添加、排序、挂载处理器：[事件 Pipeline](https://n9e.github.io/zh/zh/docs/events/pipelines.md)
* 看每个节点对事件做了什么：[查看 Pipeline 执行记录](https://n9e.github.io/zh/zh/docs/events/execution-records.md)
* 把摘要放进消息：[模板与变量](https://n9e.github.io/zh/zh/docs/notifications/templates.md)
