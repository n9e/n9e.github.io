# 监控夜莺自身

当告警系统本身挂了的时候，能叫醒你的那几条规则。

最后校对于 2026-10-10

告警系统挂了不会告诉你它挂了。这页给出让夜莺盯住自己的具体做法， 以及**它盯不住的那一块**该怎么补。

## 先说清楚边界[​](#先说清楚边界 "先说清楚边界的直接链接")

夜莺能监控自己的绝大部分故障：判定停了、数据源查不动、样本被丢、数据库排队。 但有一类它天然覆盖不了——**整个夜莺不可用**。进程没了，规则也就没人跑了。

所以完整的方案是两层：

1. **夜莺盯自己**，覆盖「还活着但工作不正常」的所有情况，这是下面几节的内容；
2. **一个夜莺之外的东西盯夜莺**，覆盖「彻底没了」。最省事的做法是外部的 uptime 检查每分钟打一次 `http://n9e:17000/ping`，也可以用另一个故障域里的 夜莺实例互相监控。

跳过第二层，就等于把「告警系统挂了」这件事托付给了告警系统自己。

## 第一步：把自身指标采进来[​](#第一步把自身指标采进来 "第一步：把自身指标采进来的直接链接")

每个进程都在 `/metrics` 上暴露自身指标（`[HTTP] ExposeMetrics` 默认 `true`）。 让 categraf 去抓它，用 `prometheus` 插件：

```
# conf/input.prometheus/prometheus.toml

[[instances]]

urls = ["http://127.0.0.1:17000/metrics"]

url_label_key = "instance"

url_label_value = "{{.Host}}"
```

集群里每个实例都要配一份，指向自己。多机房的话 `n9e-edge` 换成 19000 端口。

**预期结果**：几分钟后到**数据查询 → 指标**里查 `n9e_alert_rule_eval_total`， 能看到按实例分开的曲线。查不到就先解决采集，规则配了也是白配。

## 该配的规则[​](#该配的规则 "该配的规则的直接链接")

下面这些都在**告警通知 → 规则管理**里建，数据源选你存自身指标的那个。 表达式里没有加实例维度；集群里想区分是哪个实例，用 categraf 打上的机器标识做 `by (ident)` 聚合。

| 要发现的问题         | 表达式                                                             | 触发条件              |
| -------------------- | ------------------------------------------------------------------ | --------------------- |
| 判定停了             | `sum(rate(n9e_alert_rule_eval_total[5m]))`                         | `< 0.01`，持续 5 分钟 |
| Center 刚重启过      | `n9e_center_uptime`                                                | `< 300`，持续时长设 0 |
| 判定报错             | `sum(rate(n9e_alert_rule_eval_error_total[5m]))`                   | `> 0`，持续 5 分钟    |
| 数据源查不动         | `sum by (datasource) (rate(n9e_alert_query_data_error_total[5m]))` | `> 0`，持续 5 分钟    |
| 事件处理积压         | `n9e_alert_alert_queue_size`                                       | `> 0`，持续 10 分钟   |
| 写入被拒             | `rate(n9e_pushgw_push_queue_over_limit_error_total[5m])`           | `> 0`                 |
| 样本被丢             | `sum(rate(n9e_pushgw_push_queue_error_total[5m]))`                 | `> 0`                 |
| 数据库连接排队       | `rate(n9e_db_pool_wait_count_total[5m])`                           | `> 0`，持续 5 分钟    |
| 内置库序列数逼近上限 | `prometheus_tsdb_head_series`                                      | `> 100000`            |

**「判定停了」这条最重要**，因为它是所有其他规则失效时唯一还能说话的那条。 把它的通知发到和业务告警不同的渠道去——业务告警本来就是判定引擎发出来的， 判定停了的时候那条通道正好是坏的。

### 进程整个没了怎么办[​](#进程整个没了怎么办 "进程整个没了怎么办的直接链接")

上面的表达式在进程消失后会查不到数据，普通的阈值条件不会触发。 夜莺的规则表单里有一项**数据缺失**（「之前查到过数据，现在查不到就告警；重新查到数据就恢复」）， 把它打开，序列消失就会告警：

```
# 表达式

n9e_center_uptime

# 触发条件：打开「数据缺失」
```

这条能覆盖「某个实例没了」。覆盖不了「所有实例都没了」——那还是要靠上面说的第二层。

## 采集断流也要盯[​](#采集断流也要盯 "采集断流也要盯的直接链接")

监控系统最安静的故障是「没有告警」，因为数据早就不进来了。 除了上面的 `n9e_pushgw_samples_received_total`，还要有一条针对被监控对象的规则： 挑一个每台机器都会上报的指标，打开**数据缺失**，机器不报数就告警。

这条规则和上面那些不是一回事：上面查的是夜莺自己的健康，这条查的是数据管道的健康。 两个都要有。

## 通知失败不在指标里[​](#通知失败不在指标里 "通知失败不在指标里的直接链接")

`/metrics` 上有 `n9e_alert_alert_notify_total` 和 `n9e_alert_alert_notify_error_total` 两个计数器，但它们只覆盖旧的 webhook / 邮件 / 回调发送路径。 **走「通知规则」发出去的通知不计入这两个指标**，它们落的是数据库里的通知记录表 （`notification_record`，`status` 字段 1 成功 2 失败）。

所以通知失败有两个看法：

* **人看**：告警事件详情里的通知记录，或者事件列表页；
* **机器看**：把夜莺的元数据库注册成一个 MySQL / PostgreSQL 数据源， 写一条 SQL 告警规则统计最近一段时间 `status = 2` 的条数。 注册数据源的方法见 [MySQL / PostgreSQL 数据源](https://n9e.github.io/zh/zh/docs/data/sql-databases.md)， 写 SQL 规则见 [SQL 告警规则](https://n9e.github.io/zh/zh/docs/alerting/sql-rules.md)。

注意通知记录默认只保留 7 天（`[Center] CleanNotifyRecordDay`，每天凌晨 1 点清理）， SQL 规则的时间窗口要在这个范围内。

## 相关[​](#相关 "相关的直接链接")

* [内置指标与健康检查](https://n9e.github.io/zh/zh/docs/operations/health.md)
* [高可用与故障域](https://n9e.github.io/zh/zh/docs/operations/high-availability.md)
* [日志与诊断包](https://n9e.github.io/zh/zh/docs/operations/diagnostics.md)
* [上线前检查清单](https://n9e.github.io/zh/zh/docs/get-started/production-checklist.md)
