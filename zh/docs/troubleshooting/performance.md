# 夜莺为什么变慢或出现积压？

告警延迟、队列增长、数据库 CPU 高各对应一个能定位的内置指标；先按现象选指标，再从指标找根因。

最后校对于 2026-10-10

告警比实际晚了好几分钟才到；界面点开一个页面转半天；指标图上出现规律性的空洞。 这页只做一件事：**从现象找到那个能定位的指标，再从指标找到根因。** 容量该怎么规划、各项默认值是多少，是[容量规划](https://n9e.github.io/zh/docs/operations/capacity.md)和 [限制与默认值](https://n9e.github.io/zh/docs/reference/limits.md)的事，这里不重复。

紧急程度看队列：**队列是稳定的非零值**，说明系统在满负荷但还跟得上，可以排期优化； **队列在持续增长**，那就是在丢数据了——队列满了会直接丢，先止血。

## 按现象选指标[​](#按现象选指标 "按现象选指标的直接链接")

所有数据都在 `/metrics` 上。**先取两次、隔一分钟，看的是变化不是绝对值**：

```
curl -s --noproxy '*' http://127.0.0.1:17000/metrics > /tmp/m1.txt

# 等 60 秒

curl -s --noproxy '*' http://127.0.0.1:17000/metrics > /tmp/m2.txt
```

| 你看到的现象             | 先看这个指标                                   | 怎么判读                                                 |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------------- |
| 告警延迟，事件比实际晚   | `n9e_alert_rule_eval_duration_ms`              | 单条规则的耗时逼近它自己的执行频率，就是这条规则装不下了 |
| 告警彻底不来了           | `n9e_alert_rule_eval_total`                    | 不再增长 = 判定停了，这比慢严重得多                      |
| 事件出来了但通知很晚     | `n9e_alert_notify_record_queue_size`           | 持续增长 = 发送侧堵住了                                  |
| 事件本身就慢             | `n9e_alert_alert_queue_size`                   | 持续增长 = 事件处理跟不上产生速度                        |
| 指标图有空洞             | `n9e_pushgw_sample_queue_size`                 | 逼近上限就要丢样本了                                     |
| 写入被拒                 | `n9e_pushgw_push_queue_over_limit_error_total` | 只要在涨，就是整批写入请求被挡回去了                     |
| 界面整体卡               | `n9e_center_http_request_duration_seconds`     | 配合 `n9e_db_pool_wait_count_total` 一起看               |
| 某个数据源的规则集体不准 | `n9e_alert_query_data_error_total`             | 按 `datasource` 分维度，一眼看出是哪个源                 |

有一个坑要先知道：**带标签的计数器在第一次被记录之前根本不出现在 `/metrics` 上**。 所以健康实例上 `n9e_alert_rule_eval_error_total` 和 `n9e_alert_query_data_error_total` 是**不存在**，不是 0。别用 `absent()` 去判断「有没有错」——它会一直报警。

## 判定慢：先看是哪几条规则[​](#判定慢先看是哪几条规则 "判定慢：先看是哪几条规则的直接链接")

`n9e_alert_rule_eval_duration_ms` 是**按规则打标签的 gauge，存的是这条规则最近一轮的耗时** （不是直方图，所以算不了分位数，直接排序看头部就行）：

```
grep '^n9e_alert_rule_eval_duration_ms' /tmp/m2.txt | sort -t' ' -k2 -rn | head -10
```

输出长这样，`rule_id` 就是规则 ID，可以直接在界面上按 ID 找到那条规则：

```
n9e_alert_rule_eval_duration_ms{datasource_id="1",rule_id="6"} 2

n9e_alert_rule_eval_duration_ms{datasource_id="1",rule_id="5"} 1
```

**判断标准是相对的，不是绝对的**：拿这个值和那条规则自己的**执行频率**（默认 `@every 60s`）比。 逼近或超过频率，就说明这条规则已经放不进自己的时间片了。

配套还有一个很有用但少见的指标，直接告诉你每条规则每次查回来多少条曲线：

```
grep '^n9e_alert_eval_query_series_count' /tmp/m2.txt | sort -t' ' -k2 -rn | head -10

# n9e_alert_eval_query_series_count{datasource_id="1",ref="1",rule_id="5"} 10
```

**耗时高 + 曲线数大 = 查询本身太宽**，这是最常见的组合。

## 队列涨：分清是哪一个队列[​](#队列涨分清是哪一个队列 "队列涨：分清是哪一个队列的直接链接")

三个队列在链路的不同位置，涨的那个直接指出瓶颈在哪一段：

| 指标                                 | 这一段是                  | 涨了意味着                                 |
| ------------------------------------ | ------------------------- | ------------------------------------------ |
| `n9e_pushgw_sample_queue_size`       | 样本收进来 → 转发进时序库 | 时序库写不动了，或者转发目标不可达         |
| `n9e_alert_alert_queue_size`         | 事件产生 → 事件处理       | 事件产生速度超过了处理速度，通常是告警风暴 |
| `n9e_alert_notify_record_queue_size` | 通知记录落库              | 元数据库写入慢                             |

**只有持续增长才是问题。** 一个稳定的非零值只说明这一段一直有在途数据，是正常的。 判据就是前面那两次采样的差。

## 常见根因与确认方法[​](#常见根因与确认方法 "常见根因与确认方法的直接链接")

### 少数几条规则拖慢了整轮判定[​](#少数几条规则拖慢了整轮判定 "少数几条规则拖慢了整轮判定的直接链接")

**怎么确认**：按上面的方法排序 `rule_eval_duration_ms`，头部两三条的耗时比其余高一个数量级。 再看它们的 `eval_query_series_count`，通常也是最大的那几条。

**怎么修**：改规则，不是加机器。三个方向，按性价比排：

* **把查询写窄**——加标签过滤，别让一条规则扫全量指标；
* **先聚合再返回**——用 `sum by (...)` 或 `topk` 把上万条曲线压下来， 而不是把它们全捞回夜莺再判定；
* **降低执行频率**——不是每条规则都需要每分钟跑一次。

真的很贵又必须要，就把它拆成[记录规则](https://n9e.github.io/zh/docs/query/recording-rules.md)预先算好， 再对结果做告警。

### 数据源自己慢了[​](#数据源自己慢了 "数据源自己慢了的直接链接")

绝大部分判定开销**不在夜莺这一侧**：一条查 Prometheus 的规则，负载主要落在 Prometheus 上。

**怎么确认**：`n9e_alert_query_data_error_total` 按 `datasource` 分维度， 看是不是集中在某一个源上；同时那个源下面**所有**规则的 `rule_eval_duration_ms` 一起变大——**面状变慢就是数据源，点状变慢才是规则**。 再直接到那个数据源上手动跑一次同样的查询计时。

**怎么修**：扩数据源，或者把规则挪到更便宜的查询上。给夜莺加机器不解决这个。

### 事件风暴把下游打满[​](#事件风暴把下游打满 "事件风暴把下游打满的直接链接")

一条规则匹配到成千上万条曲线，一轮就产生成千上万个事件。

**怎么确认**：`n9e_alert_alerts_total` 短时间陡增，同时 `n9e_alert_alert_queue_size` 开始涨。 这个计数器的标签是 `busi_group` / `cluster` / `type`，**上面没有 `rule_id`**， 所以它只能把范围缩到业务组，缩不到具体规则。要定位到规则， 去事件列表里按规则分组，看是不是集中在一条上。

**怎么修**：先给那条规则加**告警抑制**或提高 for 时长把抖动滤掉， 再回头把查询聚合窄。降噪手段的选择见[降噪与路由模型](https://n9e.github.io/zh/docs/concepts/noise-routing.md)。

### 元数据库排队[​](#元数据库排队 "元数据库排队的直接链接")

**怎么确认**：这一对指标就是为它准备的——

```
grep -E '^n9e_db_pool_in_use_connections|^n9e_db_pool_wait_count_total' /tmp/m2.txt
```

`in_use` 长期贴着 `[DB] MaxOpenConns`（默认 150），同时 `wait_count_total` 在涨， 就是连接池在排队。界面卡顿和通知记录队列增长经常同时出现，根都在这里。

**怎么修**：**先找慢查询，再考虑加连接数。** 盲目调大连接池只会把压力全推给数据库。 两张表最容易失控：**历史告警事件默认永久保留**（`[Center] CleanAlertHisEventDay`）， 通知记录默认留 7 天。前者在高事件量环境下会无限长大，上线前就该设个保留期。

### 判定记录写不过来[​](#判定记录写不过来 "判定记录写不过来的直接链接")

判定记录（evallog）默认开着，每轮判定都往本地磁盘写一份。

**怎么确认**：

```
grep -E '^n9e_alert_eval_log_drop_total|^n9e_alert_eval_log_query_reject_total' /tmp/m2.txt
```

`eval_log_drop_total` 在涨 = 记录已经不完整了。这时候 **「判定记录里没有」就不能等价于「没发生过」**——排查别的问题时容易被它误导。

**怎么修**：磁盘跟不上就调 `[Alert.EvalLog]` 的 `MaxDiskGB` 和 `RetentionHours`， 或者用 `PerRuleDailyMB` 限制单条规则的写入量。确实不需要就整节关掉。

## 确认恢复了[​](#确认恢复了 "确认恢复了的直接链接")

1. **三个队列都不再持续增长**——隔一分钟取两次 `/metrics`，差值回到 0 附近；
2. `n9e_alert_rule_eval_duration_ms` 排序后的头部，耗时明显低于各自的执行频率；
3. `n9e_alert_rule_eval_total` 稳定增长——判定没有停；
4. `n9e_pushgw_push_queue_over_limit_error_total` **不再增长**（它是计数器，只看增量，不看总量）。 注意 `n9e_pushgw_drop_sample_total` **不是**过载信号——它统计的是被你配置的丢弃过滤规则 筛掉的样本，过载时并不会涨，拿它当证据会得出错误结论；
5. 挑一条之前延迟明显的规则，**测试触发**一次，从触发到收到通知的时间回到预期；
6. 图上原来有空洞的那段时间之后，曲线是连续的。

改完之后**给这几个指标建上告警规则**，别等下次再手工查—— 具体规则写法见[监控夜莺自身](https://n9e.github.io/zh/docs/operations/self-monitoring.md)。

## 收集这些再去提问[​](#收集这些再去提问 "收集这些再去提问的直接链接")

1. **两份 `/metrics` 快照**，间隔一分钟： `curl --noproxy '*' http://127.0.0.1:17000/metrics > metrics.txt`；
2. `rule_eval_duration_ms` 和 `eval_query_series_count` 排序后的前十行；
3. 规模数据：多少条规则、多少台主机、大致多少活跃曲线 （`prometheus_tsdb_head_series`，用内置时序库时才有）；
4. 部署形态：几个 `n9e` 实例，有没有拆 `n9e-alert` / `n9e-pushgw`， 元数据库是什么、跑在哪；
5. 变慢的**起始时间**，以及那前后做过什么（加规则、加机器、改配置、升级）。

**脱敏**：`rule_id`、`datasource_id`、`busi_group` 这些是数字或组名，可以原样给； 数据源地址和 DSN 里的凭据要替换。

## 下一步[​](#下一步 "下一步的直接链接")

* 该扩哪里、怎么估：[容量规划](https://n9e.github.io/zh/docs/operations/capacity.md)
* 各项默认值和上限：[限制与默认值](https://n9e.github.io/zh/docs/reference/limits.md)
* 每个指标的含义：[内置指标](https://n9e.github.io/zh/docs/reference/built-in-metrics.md)
* 把这些做成告警：[监控夜莺自身](https://n9e.github.io/zh/docs/operations/self-monitoring.md)
* 判定彻底停了：[判定记录为什么缺失或被丢弃？](https://n9e.github.io/zh/docs/troubleshooting/evaluation-missing.md)
