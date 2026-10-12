# 通知模板变量

消息模板里可用的事件字段与辅助函数。

最后校对于 2026-10-10

消息模板用的是 Go 的 `text/template`。

**最容易踩的一点：事件字段挂在 `$event` 上，不是模板顶层的 `.`。** 写成 `{{"{{"}}.RuleName{{"}}"}}` 会静默渲染成空字符串， `{{"{{"}}timeformat .TriggerTime{{"}}"}}` 直接报 `invalid value; expected int64`。

```
{{ $event.RuleName }}                    ✅

{{ .RuleName }}                          ❌ 渲染成空

{{ timeformat $event.TriggerTime }}      ✅
```

想抄一份能跑的，看内置的 `dingtalk` 模板——那是最全的样例。

## 常用事件字段[​](#常用事件字段 "常用事件字段的直接链接")

| 字段                          | 说明                                                 |
| ----------------------------- | ---------------------------------------------------- |
| `$event.RuleName`             | 规则名                                               |
| `$event.RuleNote`             | 规则备注                                             |
| `$event.Severity`             | 级别，1 / 2 / 3                                      |
| `$event.IsRecovered`          | 是恢复事件还是触发事件                               |
| `$event.TargetIdent`          | 对象标识（机器名等）                                 |
| `$event.TargetNote`           | 对象备注                                             |
| `$event.GroupName`            | 业务组名。**取自规则所属业务组**，不是对象所属业务组 |
| `$event.TriggerValue`         | 触发时的值                                           |
| `$event.TriggerTime`          | 触发时间戳，配 `timeformat` 用                       |
| `$event.FirstTriggerTime`     | 连续告警的首次触发时间，算持续时长要用它             |
| `$event.LastEvalTime`         | 上次判定时间。恢复事件用它当恢复时间                 |
| `$event.TagsJSON`             | 标签数组                                             |
| `$event.AnnotationsJSON.<键>` | 注解，比如 `$event.AnnotationsJSON.summary`          |
| `$event.RunbookURL`           | 规则上填的处理手册链接                               |
| `$event.Cate`                 | 数据源类型                                           |
| `$event.DatasourceId`         | 数据源 ID                                            |

## 常用辅助函数[​](#常用辅助函数 "常用辅助函数的直接链接")

| 函数                              | 用途                        |
| --------------------------------- | --------------------------- |
| `timeformat`                      | 时间戳转可读时间            |
| `humanizeDurationInterface`       | 秒数转「3 分 20 秒」这类    |
| `formatDecimal`                   | 保留小数位                  |
| `add` `sub` `mul` `div`           | 四则运算                    |
| `now`                             | 当前时间，常用 `now.Unix`   |
| `toUpper` `toLower` `title`       | 大小写                      |
| `contains` `match` `reReplaceAll` | 字符串判断与替换            |
| `split` `join`                    | 字符串切分与拼接            |
| `jsonMarshal`                     | 转 JSON，webhook 类媒介常用 |
| `humanize` `humanizePercentage`   | 数字友好化                  |
| `escape` `unescaped` `safeHtml`   | 转义控制                    |

算持续时长的标准写法（抄自内置模板）：

```
{{ $d := sub now.Unix $event.FirstTriggerTime }}{{ humanizeDurationInterface $d }}
```

恢复事件要用 `sub $event.LastEvalTime $event.FirstTriggerTime`。

## 有几类媒介不消费模板[​](#有几类媒介��不消费模板 "有几类媒介不消费模板的直接链接")

`callback`、`flashduty`、`pagerduty` 这三类**不走消息模板**—— 它们的请求体直接透传事件 JSON，界面上也不给选模板。 其余媒介**缺模板会整条丢弃**，并写一条失败的通知记录。

## 站点变量[​](#站点变量 "站点变量的直接链接")

站点地址这类值用 `{{"{{"}}$.domain{{"}}"}}`，注意有那个点。 写成 `{{"{{"}}$domain{{"}}"}}` 取不到，写成 `{{"{{"}}.domain{{"}}"}}` 在 `range` / `with` 内部会失效。

## 相关[​](#相关 "相关的直接链接")

* [消息模板与变量](https://n9e.github.io/zh/zh/docs/notifications/templates.md)
* [通知模板为什么渲染失败？](https://n9e.github.io/zh/zh/docs/troubleshooting/template-errors.md)
