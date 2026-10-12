# 事件、降噪与路由

事件从触发它的规则到接收它的人之间会经历什么——屏蔽规则、订阅、事件 Pipeline，以及自愈。

规则下游：屏蔽规则、订阅规则、事件 Pipeline——聚合、改写标签、按条件路由。需要自动处置就接 **ibex** 跑自愈脚本，不必叫醒人。

## [活跃事件与历史事件](https://n9e.github.io/zh/zh/docs/events/active-historical.md)

[活跃事件列表放着尚未恢复的告警，恢复后转入历史事件；两张表都能按标签、级别、业务组检索并批量处置。](https://n9e.github.io/zh/zh/docs/events/active-historical.md)

## [事件聚合与去重](https://n9e.github.io/zh/zh/docs/events/aggregation.md)

[同一规则 + 同一标签集只对应一个事件，重复判定不会再建一条；聚合视图按表达式把上百条活跃事件折成几张卡片。](https://n9e.github.io/zh/zh/docs/events/aggregation.md)

## [屏蔽规则](https://n9e.github.io/zh/zh/docs/events/mute-rules.md)

[按标签匹配、时间窗或维护计划屏蔽，并看到一条屏蔽规则现在吞掉了什么。](https://n9e.github.io/zh/zh/docs/events/mute-rules.md)

## [订阅规则](https://n9e.github.io/zh/zh/docs/events/subscriptions.md)

[让一个团队接收不属于自己的规则产生的事件，用自己的媒介和级别筛选。](https://n9e.github.io/zh/zh/docs/events/subscriptions.md)

## [事件 Pipeline](https://n9e.github.io/zh/zh/docs/events/pipelines.md)

[在通知之前按顺序对事件做变换、补充、丢弃或路由的处理器链。](https://n9e.github.io/zh/zh/docs/events/pipelines.md)

## [改写标签与补充上下文](https://n9e.github.io/zh/zh/docs/events/relabel-enrich.md)

[重命名或新增标签，或者调用你自己的接口，把返回的内容写回事件。](https://n9e.github.io/zh/zh/docs/events/relabel-enrich.md)

## [AI 摘要处理器](https://n9e.github.io/zh/zh/docs/events/ai-summary.md)

[通知之前让大模型给每个事件写一段摘要：模型怎么接、提示词模板怎么写、结果落在哪、调用失败会怎样。](https://n9e.github.io/zh/zh/docs/events/ai-summary.md)

## [条件路由](https://n9e.github.io/zh/zh/docs/events/routing.md)

[根据标签和级别把事件送到不同的媒介或团队。](https://n9e.github.io/zh/zh/docs/events/routing.md)

## [用模拟事件试跑](https://n9e.github.io/zh/zh/docs/events/try-workflow.md)

[对一条手写的事件跑一遍 Pipeline，在上线前看每个处理器的输出。](https://n9e.github.io/zh/zh/docs/events/try-workflow.md)

## [查看 Pipeline 执行记录](https://n9e.github.io/zh/zh/docs/events/execution-records.md)

[Pipeline 执行记录逐事件记下每个处理器改了什么、事件是否被丢弃、最终送到了哪里。](https://n9e.github.io/zh/zh/docs/events/execution-records.md)

## [用 ibex / Webhook 触发自愈](https://n9e.github.io/zh/zh/docs/events/self-healing.md)

[特定事件触发时，通过 ibex 在受影响主机上跑脚本，或调用一个 Webhook。](https://n9e.github.io/zh/zh/docs/events/self-healing.md)

## [降噪模式](https://n9e.github.io/zh/zh/docs/events/noise-patterns.md)

[经得起生产考验的套路：抖动、发布期间的风暴、重复数据源，以及什么根本不该叫醒人。](https://n9e.github.io/zh/zh/docs/events/noise-patterns.md)
