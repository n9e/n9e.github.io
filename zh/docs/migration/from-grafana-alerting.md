# 从 Grafana Alerting 迁移

Grafana 仪表盘留着；搬告警规则和联系点，以及统一告警的状态怎么处理。

最后校对于 2026-10-10

看完这页，你能把 Grafana 的统一告警拆成夜莺的对象，知道哪些能自动搬、哪些只能重写， 以及 Grafana 那些「无数据 / 执行错误」的状态该怎么落地。

## 什么留着，什么被替掉[​](#什么留着什么被替掉 "什么留着，什么被替掉的直接链接")

| 你现在跑的                                | 迁移后                                                                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Grafana 仪表盘、面板、变量                | **不动。** 夜莺自带仪表盘，但不要求你搬走，见[配合 Grafana 使用](https://n9e.github.io/zh/zh/docs/query/grafana.md)                           |
| Grafana 的数据源（Prometheus、Loki、ES…） | **不动**，两边各自连同一个后端                                                                                                                |
| Grafana 的记录规则                        | **不动**，或按需搬成[记录规则](https://n9e.github.io/zh/zh/docs/query/recording-rules.md)                                                     |
| Grafana 告警规则（Grafana-managed）       | **重写**成夜莺的告警规则                                                                                                                      |
| Grafana 告警规则（Data source-managed）   | 它们其实就是 Prometheus 的 ruler 规则，走 [Prometheus + Alertmanager 那条路](https://n9e.github.io/zh/zh/docs/migration/from-alertmanager.md) |
| 通知策略（Notification policies）         | 拍平成夜莺的通知规则                                                                                                                          |
| 联系点（Contact points）                  | 通知媒介 + 通知规则                                                                                                                           |
| 静音时段、静默                            | 屏蔽规则                                                                                                                                      |

## 一件能自动化的事：数据源[​](#一件能自动化的事数据源 "一件能自动化的事：数据源的直接链接")

规则搬不了，数据源可以一键搬。**集成中心 → 数据源**页右上角有「从 Grafana 导入」 （只有管理员能看到）：

1. 填 **Grafana 地址**，选**鉴权方式**（API Token 或用户名 / 密码）。 自签证书可以勾「跳过 TLS 证书校验」。
2. 点**拉取**。会出一张预览表，列出 Grafana 类型、名称、**映射类型**、是否支持、 是否重名、是否待补充鉴权。这一步**不写库**。
3. 勾选要导的，点**导入**。结果按条返回：成功导入 / 待补充鉴权 / 跳过 / 失败。

两件要注意的：

* **密钥不会跟着过来。** 预览表里标了「需补填密钥」的，导入后是半成品， 要去数据源详情里把密码或 Token 补上才能用。
* **不支持的类型会被标出来跳过。** 夜莺支持的数据源类型是有限的一组， Grafana 里那些没有对应实现的插件导不进来。

*验证*：导完在数据源列表里逐个点开做连通性检查。

## 对象映射[​](#对象映射 "对象映射的直接链接")

### 告警规则[​](#告警规则 "告警规则的直接链接")

| Grafana Alerting                                   | 夜莺                                                                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 规则的查询 A + Reduce B + Threshold C 这条表达式链 | Prometheus 类规则**把阈值写进 PromQL**（`avg_over_time(...[5m]) > 80`）；日志类和 SQL 类规则则有独立的触发条件，写成 `$A.value > 80`                     |
| Pending period（待处理时长）                       | 持续时长                                                                                                                                                 |
| Evaluation group 的 interval                       | 执行频率                                                                                                                                                 |
| Labels                                             | 附加标签                                                                                                                                                 |
| Annotations 的 `summary` / `description`           | 注释                                                                                                                                                     |
| Annotations 的 `runbook_url`                       | 规则上的「预案链接」字段                                                                                                                                 |
| 规则的 folder                                      | **业务组**——但它同时是权限边界，不只是文件夹，见[业务组](https://n9e.github.io/zh/zh/docs/concepts/business-groups.md)                                   |
| Alert instance（一条规则展开出的多个实例）         | 事件。一条规则的查询返回几条序列就产生几个事件                                                                                                           |
| 状态历史 / State history                           | [告警事件](https://n9e.github.io/zh/zh/docs/events/active-historical.md)，加上[判定记录](https://n9e.github.io/zh/zh/docs/alerting/execution-records.md) |

Grafana 的表达式链是这次迁移里最费手的部分：Grafana 把「查什么」和「阈值多少」拆成两步， 夜莺的 Prometheus 类规则把它们合成一条 PromQL。翻译时把 Reduce 换成 PromQL 的聚合函数 （`avg_over_time` / `max_over_time` / `last_over_time`），把 Threshold 换成比较运算符。

### 通知策略与联系点[​](#通知策略与联系点 "通知策略与联系点的直接链接")

Grafana 的统一告警内嵌了一个 Alertmanager，所以通知策略就是 Alertmanager 的路由树， `continue` 那一套语义完全一样。**夜莺没有树形路由**，是平铺的多条通知规则各自匹配、各自发送。

拍平的方法、以及「空条件在两边含义相反」「缺标签一律不匹配」这两个坑， 和 Alertmanager 那页完全一致，不再重复：见 [从 Prometheus + Alertmanager 迁移](https://n9e.github.io/zh/zh/docs/migration/from-alertmanager.md)。

| Grafana                                      | 夜莺                                                                                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contact point                                | [通知媒介](https://n9e.github.io/zh/zh/docs/notifications/dingtalk-feishu-wecom.md)（怎么发）+ [通知规则](https://n9e.github.io/zh/zh/docs/notifications/rules.md)（发给谁） |
| Notification template                        | [消息模板](https://n9e.github.io/zh/zh/docs/notifications/templates.md)                                                                                                      |
| 通知策略的 matcher                           | 通知配置上的「适用标签」「适用属性」                                                                                                                                         |
| `group_by` / `group_wait` / `group_interval` | **没有对应物**，夜莺一次通知只装一个事件                                                                                                                                     |
| `repeat_interval`                            | 告警规则上的「重复通知频率」，单位分钟                                                                                                                                       |

### 静默与静音时段[​](#静默与静音时段 "静默与静音时段的直接链接")

| Grafana                 | 夜莺                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| Silence（一次性）       | 「固定时间」[屏蔽规则](https://n9e.github.io/zh/zh/docs/events/mute-rules.md) |
| Mute timing（静音时段） | 「周期时间」屏蔽规则，或通知配置上的「适用时段」                              |
| 静默的 matcher          | 屏蔽规则的事件标签条件，六个操作符                                            |
| （无对应）              | 屏蔽方式可选「只屏蔽通知」，事件照常留档                                      |

静音时段有两种落法，选哪个取决于范围：想让某类事件在这个时段里谁都收不到，用周期屏蔽； 只想让**某一条通知规则**在这个时段不发（别的照发），用通知配置上的「适用时段」。

## Grafana 独有、夜莺没有的[​](#grafana-独有夜莺没有的 "Grafana 独有、夜莺没有的的直接链接")

这几样是必须做取舍的地方，迁移前先想清楚：

* **No data / Error 状态机。** Grafana 规则可以单独指定「查不到数据时算什么状态」 和「执行出错时算什么状态」（`NoData` / `Alerting` / `OK` / `KeepLast`）。 夜莺**没有这个状态机**：Prometheus 类规则里，序列消失就等于恢复； 想在「数据没了」时告警，要单写一条规则（比如 `up == 0`）。 日志类和 SQL 类规则有一个「无数据」开关，带自己的级别和自动恢复超时， 是最接近 Grafana `NoData` 的东西。见[判定与恢复](https://n9e.github.io/zh/zh/docs/alerting/evaluation.md)。
* **Keep last state。** 没有对应物。
* **告警规则的版本历史和 provisioning。** 夜莺没有内建的规则版本管理； 等价做法是导出规则 JSON 进版本库，见[导入、导出与复用](https://n9e.github.io/zh/zh/docs/alerting/import-export.md)。
* **每条规则可以配多个联系点的多步升级。** 没有对应物； 最接近的是[订阅规则](https://n9e.github.io/zh/zh/docs/events/subscriptions.md)的「持续时长」做一层超时抄送。

## 迁移顺序[​](#迁移顺序 "迁移顺序的直接链接")

Grafana 全程不停，随时能退。

1. **导数据源。** 用上面的「从 Grafana 导入」，补齐密钥。 *验证*：每个数据源连通性检查通过。
2. **建通知媒介和消息模板。** 把每个 Contact point 的地址和密钥搬过来。 *验证*：保存前点「测试」，真的收到消息。
3. **拍平通知策略成通知规则。** 方法见 [Alertmanager 那页](https://n9e.github.io/zh/zh/docs/migration/from-alertmanager.md)。 *验证*：每份通知配置点「发送测试」，模拟事件和历史事件两种模式都过一遍。 见[测试通知](https://n9e.github.io/zh/zh/docs/notifications/test.md)。
4. **重写告警规则，先不启用。** 从最重要的一批开始，Reduce + Threshold 合成 PromQL。 *验证*：每条规则点[试运行](https://n9e.github.io/zh/zh/docs/alerting/test-fire.md)，看查询→阈值→事件→通知各段是否都通。
5. **搬静默和静音时段。** 还没过期的静默重建成固定时间屏蔽，静音时段按上面的取舍落地。 *验证*：屏蔽规则表单上的「测试」会拿现有事件跑一遍匹配。
6. **并行跑一段。** Grafana 侧的规则先别删，两边都发通知，对比触发结果。 做法见[并行运行与回退方案](https://n9e.github.io/zh/zh/docs/migration/coexistence.md)。
7. **切换。** 确认无差异后，在 Grafana 里把这批规则**暂停**（不要删），观察一周再删。 仪表盘留着不动。

## 回退[​](#回退 "回退的直接链接")

第 7 步之前，回退就是**把夜莺这批规则批量禁用**，Grafana 那边一直在跑。

第 7 步之后要回退，就是在 Grafana 里把暂停的规则恢复。所以那一步用「暂停」不用「删除」—— 删了就得重建，暂停一秒钟就能回来。

## 下一步[​](#下一步 "下一步的直接链接")

* 还在纠结换不换：[夜莺 vs Grafana Alerting](https://n9e.github.io/zh/zh/comparisons/grafana-alerting.md)
* 仪表盘怎么和 Grafana 共存：[配合 Grafana 使用](https://n9e.github.io/zh/zh/docs/query/grafana.md)
* 路由树拍平的完整方法：[从 Prometheus + Alertmanager 迁移](https://n9e.github.io/zh/zh/docs/migration/from-alertmanager.md)
* 两边同时跑、怎么切：[并行运行与回退方案](https://n9e.github.io/zh/zh/docs/migration/coexistence.md)
