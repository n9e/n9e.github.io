# 内置时序库的数据为什么断续或缺失？

内置时序库出现断档多半不报错：保留期到了、磁盘压力、进程重启都是常见原因；三个时间戳指标能先分清断在写入侧还是查询侧。

最后校对于 2026-10-10

图上一段一段的空白；或者往前拉时间范围，某个点之前什么都查不到； 或者同一个查询刷新两次结果不一样。这几种现象在内置时序库上有各自明确的成因， 而且**大多不报错**——所以先做区分，再动手。

紧急程度看断的是不是**当前**：老数据缺失通常是保留策略在正常工作， 不用半夜起来处理；**最近几分钟就没数据**才是在丢，而且告警规则这时候查到的也是空的， 会跟着一起失灵。

## 先确定断档出在写入侧还是查询侧[​](#先确定断档出在写入侧还是查询侧 "先确定断档出在写入侧还是查询侧的直接链接")

这一步把问题劈成两半。在装了夜莺的那台机器上：

```
curl -s --noproxy '*' http://127.0.0.1:17000/metrics | grep -E \

  'prometheus_tsdb_head_samples_appended_total|prometheus_tsdb_head_series|n9e_pushgw_samples_received_total'
```

隔一分钟再跑一次，对比两次的数：

| 现象                                        | 结论                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `n9e_pushgw_samples_received_total` 不涨    | 样本压根没到夜莺，是**采集或网络**的问题，去 [Categraf 排障](https://n9e.github.io/zh/zh/docs/data/categraf/troubleshooting.md) |
| 它涨，但 `head_samples_appended_total` 不涨 | 收到了没写进去，看下面「乱序」和转发配置                                                                                        |
| 两个都涨，但图上还是空                      | 写进去了，是**查询侧**的问题——数据源选错了，或者多实例各拿一半                                                                  |
| 两个都涨，图上只有近期缺一段                | 通常是那一段时间进程重启了或采集停了，先对时间                                                                                  |

`n9e_pushgw_samples_received_total` 和 `prometheus_tsdb_head_series` 都是 **当前进程**的计数，重启会归零，别把重启当成丢数。

## 三个时间戳指标直接告诉你数据到哪儿了[​](#三个时间戳指标直接告诉你数据到哪儿了 "三个时间戳指标直接告诉你数据到哪儿了的直接链接")

内置时序库用的就是 Prometheus 的存储引擎，所以它把自己的边界原样暴露出来了。 **这三个数比翻图快得多**（单位都是毫秒）：

```
curl -s --noproxy '*' http://127.0.0.1:17000/metrics | grep -E \

  'prometheus_tsdb_lowest_timestamp|prometheus_tsdb_head_min_time|prometheus_tsdb_head_max_time|prometheus_tsdb_retention_limit_bytes'
```

| 指标                                    | 含义                         | 怎么用                                                   |
| --------------------------------------- | ---------------------------- | -------------------------------------------------------- |
| `prometheus_tsdb_lowest_timestamp`      | 库里**最老**的那个样本的时间 | 比它还早的查询必然是空的。这就是「老数据没了」的直接答案 |
| `prometheus_tsdb_head_max_time`         | 最新样本的时间               | 它不往前走 = 现在正在丢数据                              |
| `prometheus_tsdb_head_min_time`         | 当前 head 块的起点           | 和 `lowest_timestamp` 差很远，说明历史块还在             |
| `prometheus_tsdb_retention_limit_bytes` | 磁盘上限，`0` 表示不限       | 默认 `1.073741824e+10`，正好是 10 GiB                    |

换成能看的时间：

```
date -d @$(( $(curl -s --noproxy '*' http://127.0.0.1:17000/metrics \

  | awk '/^prometheus_tsdb_lowest_timestamp/{printf "%.0f", $2/1000}') )) 2>/dev/null \

  || date -r $(curl -s --noproxy '*' http://127.0.0.1:17000/metrics \

  | awk '/^prometheus_tsdb_lowest_timestamp/{printf "%.0f", $2/1000}')
```

## 常见根因与确认方法[​](#常见根因与确认方法 "常见根因与确认方法的直接链接")

### 保留期或磁盘上限把老数据删了[​](#保留期或磁盘上限把老数据删了 "保留期或磁盘上限把老数据删了的直接链接")

两个上限是**或**的关系，**先撞上哪个就从最旧的块开始删哪个**：

```
[EmbeddedTSDB]

RetentionDuration = "15d"   # 默认 15 天

MaxBytes = "10GiB"          # 默认 10 GiB，留空或 0 表示不限
```

所以一个偏小的 `MaxBytes` 会**悄悄地**把实际保留期压到 15 天以下，界面上没有任何提示。

**怎么确认**：`prometheus_tsdb_lowest_timestamp` 换算出来的时间， 明显晚于 `RetentionDuration` 允许的最早时间——就是磁盘上限在起作用，不是时间在起作用。 再用 `du -sh data/tsdb` 看实际占用是不是贴着 `MaxBytes`。

**怎么修**：把 `MaxBytes` 调到磁盘能吃下的量并重启；需要的历史比这更长， 就该换外部时序库了，见 [内置时序库的单实例边界](https://n9e.github.io/zh/zh/docs/operations/embedded-tsdb-limits.md)。 **注意已经被删掉的块不会回来。**

### 采集端时钟偏了，样本被当成乱序丢掉[​](#采集端时钟偏了样本被当成乱序丢掉 "采集端时钟偏了，样本被当成乱序丢掉的直接链接")

内置时序库只接受 `OutOfOrderTimeWindow`（默认 `10m`）以内的乱序样本， **超出这个窗口的直接丢弃**。一台时钟偏了十几分钟的机器，指标会呈现规律性的空洞。

**怎么确认**：这一对指标就是为它准备的——

```
prometheus_tsdb_head_out_of_order_samples_appended_total   # 落在窗口内、被接受的

prometheus_tsdb_out_of_order_samples_total                 # 超出窗口、被拒绝的
```

**后者持续增长就是在丢数据。** 再到怀疑的那台机器上 `date -u` 和服务端对一下。

**怎么修**：修机器的 NTP。**不要靠调大 `OutOfOrderTimeWindow` 来掩盖**—— 窗口越大内存开销越大，而且时钟错了的机器，时间戳本身也是错的。

### 多个 Center 实例，各拿到一半[​](#多个-center-实例各拿到一半 "多个 Center 实例，各拿到一半的直接链接")

**数据在单个 Center 进程的本地磁盘上。** 起了两个副本，就是两份各一半的数据； 查询落到哪个实例是随机的，于是随机缺一半——**不报任何错**，就是图上有洞。

**怎么确认**：**分别**打每个实例的 `/metrics`，比较各自的 `prometheus_tsdb_head_series`。两边都不为零、加起来才等于你以为的总量，就是它。 启动时也有一行告警，说检测到同集群里还有别的活跃实例，但**只打一次**，很容易错过。

**怎么修**：内置时序库和多实例是互斥的。要高可用就必须换外部时序库； 只想临时止血，先缩到一个实例。

### 查的不是写进去的那个数据源[​](#查的不是写进去的那个数据源 "查的不是写进去的那个数据源的直接链接")

**怎么确认**：**集成中心 → 数据源**，确认名叫 `embedded-tsdb` 的那条还在、 URL 是 `http://127.0.0.1:17000/prometheus`。然后在**数据查询 → 指标**里 **逐个数据源**跑同一条查询，看数据到底在哪个里面。

有两种情况会让人查错地方：

* 配了 `[[Pushgw.Writers]]` 转发到外部时序库之后，数据**两边都有**， 但两边的保留期不一样，往前拉就只有一边有；
* 启动时如果已经存在一个**启用状态的 Prometheus 类型数据源**， 夜莺**就不会自动注册** `embedded-tsdb` 那条了。样本**照样写进本地库**， 只是界面上没有任何入口指向它——现象是「数据不见了」，其实只是没人查得到它。

**怎么修**：第二种情况手动建一个 Prometheus 数据源指向 `http://127.0.0.1:17000/prometheus` 就能查到了。 另外**改 `embedded-tsdb` 这条记录的 URL 没有用**——每次重启都会按配置写回去。

### 远程访问被本机限制挡住[​](#远程访问被本机限制挡住 "远程访问被本机限制挡住的直接链接")

没配 `BasicAuthUser` 时，`/prometheus/api/v1/*` **只接受来自本机的请求**， 其余一律 403：

```
embedded tsdb endpoints only accept requests from the n9e host by default;

set EmbeddedTSDB.BasicAuthUser/BasicAuthPass (or DatasourceUrl) to allow remote access
```

**怎么确认**：从别的机器 curl 一下这个端点，拿到上面这段就是它。 判定用的是**连接的对端地址**，不看任何可转发的头，所以 `X-Forwarded-For` 之类改不了结果。

**怎么修**：确实需要让 Grafana、`n9e-edge` 或别的采集器直接读，就显式开：

```
[EmbeddedTSDB]

BasicAuthUser = "n9e"

BasicAuthPass = "<密码>"
```

配好之后自动注册的数据源 URL 会从 `127.0.0.1` 换成检测到的本机 IP。

## 确认恢复了[​](#确认恢复了 "确认恢复了的直接链接")

1. `prometheus_tsdb_head_max_time` 每次刷新都在往前走——写入侧通了；
2. `prometheus_tsdb_out_of_order_samples_total` 不再增长——没有样本因为乱序被丢；
3. `prometheus_tsdb_lowest_timestamp` 换算出的时间符合你配的保留期；
4. 在**数据查询 → 指标**里选 `embedded-tsdb`，查一条肯定有数的指标 （比如 `up`，或者任意主机的 `cpu_usage_idle`），把时间范围拉到出问题的那一段， 确认曲线是连续的；
5. 依赖这段数据的告警规则，用**测试触发**跑一遍，确认能查到数。

老数据被保留策略删掉的那部分，**修好之后也不会回来**—— 这一步只能确认「从现在起不再丢」。

## 收集这些再去提问[​](#收集这些再去提问 "收集这些再去提问的直接链接")

1. `curl --noproxy '*' http://127.0.0.1:17000/metrics | grep prometheus_tsdb_` 的完整输出；
2. `[EmbeddedTSDB]` 这一节的原文，和 `du -sh data/tsdb` 的结果；
3. 起了几个 Center 实例，有没有配 `[[Pushgw.Writers]]`；
4. 断档的**准确时间范围**，以及那段时间的进程日志；
5. 出问题的那条查询、用的哪个数据源。

**脱敏**：`BasicAuthPass`、外部时序库地址里的凭据要替换； 指标名和数值原样保留。

## 下一步[​](#下一步 "下一步的直接链接")

* 这个数据源是怎么来的：[自动注册的内置时序库数据源](https://n9e.github.io/zh/zh/docs/data/embedded-tsdb.md)
* 什么时候该换外部库：[内置时序库的单实例边界](https://n9e.github.io/zh/zh/docs/operations/embedded-tsdb-limits.md)
* 不停机地迁走：[外部时序库与双写迁移](https://n9e.github.io/zh/zh/docs/install/external-tsdb.md)
* 数据源连得上但查不到数：[数据源连接正常但查询无数据](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)
* 采集侧的排查：[Categraf 排障](https://n9e.github.io/zh/zh/docs/data/categraf/troubleshooting.md)
