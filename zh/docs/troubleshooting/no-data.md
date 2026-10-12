# 数据源连上了，为什么查不到数据？

数据源测试通过但查询为空，按写入 → 存储 → 查询逐层确认：数据没写进来、时间范围不含最近点、标签不匹配、查的不是同一个库。

最后校对于 2026-10-10

数据源页面上「测试」是通过的，绿的，但在查询界面里怎么写都是空。 这页按「数据从哪来、到哪去」的顺序排查：写入 → 存储 → 查询，每一层都给出确认方法。

紧急程度取决于你在查什么：如果是刚接入的新数据源，只影响你自己； 如果是一直有数据的库突然空了，告警规则也在这条链路上，**正在跑的告警会跟着一起失灵**， 先去 [判定记录为什么缺失或被丢弃？](https://n9e.github.io/zh/zh/docs/troubleshooting/evaluation-missing.md) 确认规则还在不在评估。

## 先确认这个数据源在开源版里查得了[​](#先确认这个数据源在开源版里查得了 "先确认这个数据源在开源版里查得了的直接链接")

这一步能一次排除一大类「怎么点都没有」的情况。

开源版里 **ClickHouse、Doris、MySQL、PostgreSQL、OpenSearch 进不了即时查询、 日志检索和仪表盘**。它们注册成功、状态正常、告警规则也能用， 但**唯一能跑它们查询的地方是告警规则表单里的「数据预览」**。

| 想查的库                                         | 去哪查                             |
| ------------------------------------------------ | ---------------------------------- |
| Prometheus Like、TDengine、IoTDB                 | 数据查询 → 指标                    |
| Elasticsearch、Loki、VictoriaLogs                | 数据查询 → 日志                    |
| ClickHouse、Doris、MySQL、PostgreSQL、OpenSearch | 只能在告警规则表单的「数据预览」里 |

所以「先去即时查询里验证一下」这条常见建议，对下面那一行是不成立的—— 在即时查询里选不到它，不代表数据源坏了。

## 第一步：数据到底写进来了没有[​](#第一步数据到底写进来了没有 "第一步：数据到底写进来了没有的直接链接")

Categraf 写数据和上报心跳是两条独立的链路，设备列表里有这台机器不等于指标进来了。

**看服务端自己的计数器。** 在夜莺所在机器上：

```
curl -s http://127.0.0.1:17000/metrics | grep -E 'n9e_pushgw_samples_received_total|n9e_pushgw_sample_received_by_ident'
```

* `n9e_pushgw_samples_received_total{channel="prometheus"}` 一直不涨 —— 请求根本没到， 问题在采集端或网络，去看 [Categraf 排障](https://n9e.github.io/zh/zh/docs/data/categraf/troubleshooting.md)；
* 总数在涨，但 `n9e_pushgw_sample_received_by_ident{host_ident="<主机名>"}` 里没有你要找的那台 —— 数据到了，但这台机器的 `ident` 和你以为的不一样；
* 两个都在涨 —— 写入没问题，往下走。

**注意 `ignore_host` 默认是 `true`。** 只带 `host` 标签、不带 `ident` 或 `agent_hostname` 的 写入方（典型是 Telegraf），机器名会被丢掉，指标进得来但认不到机器上。 这类写入方要在地址后面加 `?ignore_host=false`。

**还有一类「进来了但被丢了」：** `n9e_pushgw_drop_sample_total` 只由 `[[Pushgw.DropSample]]` 这条配置驱动，配过丢弃规则才会涨；队列满导致的丢弃是另一个计数器 `n9e_pushgw_push_queue_error_total{queueid}`，日志里对应

```
Write channel(3) full, current channel size: 1000000, item: ...
```

**队列满时客户端拿到的仍然是 HTTP 200**，采集端不会报错——这是最容易漏掉的一种「没数据」。

## 第二步：时间范围和「最近一个点」[​](#第二步时间范围和最近一个点 "第二步：时间范围和「最近一个点」的直接链接")

**内置时序库的 `LookbackDelta` 默认是 `5m`。** 即时查询只会往回找 5 分钟； 采集间隔超过 5 分钟、或者数据断了 5 分钟以上，即时查询就是空， 但把时间范围拉长做区间查询能看到历史点。**先用区间查询确认「有没有过数据」， 再用即时查询确认「现在还有没有」**，这两个问题是分开的。

**乱序和过期样本会被静默丢弃。** 内置时序库的 `OutOfOrderTimeWindow` 默认 `10m`， 超出这个窗口的旧点直接扔掉，而且**写入接口照样返回成功**。确认方法：

```
curl -s http://127.0.0.1:17000/metrics | grep -E 'prometheus_tsdb_too_old_samples_total|prometheus_tsdb_out_of_order_samples_total'
```

`prometheus_tsdb_too_old_samples_total` 在涨，就是采集端时钟偏了或者在补历史数据。 服务端日志里对应一行：

```
embedded tsdb append fail, dropped samples: 128, last error: too old sample
```

顺带一句：`Pushgw.ForceUseServerTS` 默认是 `true`，走夜莺写入的样本时间戳会被改写成服务端时间， 时钟偏差在这条路上被抹平了；直连外部时序库的写入方不享受这个待遇。

## 第三步：标签对不上[​](#第三步标签对不上 "第三步：标签对不上的直接链接")

查询写对了、时间也对了，就该怀疑标签。

**`Pushgw.LabelRewrite` 默认是 `true`。** 夜莺在转发时会用设备列表里这台机器的标签 **覆盖**同名标签，再补上没有的。所以采集端配的 `region=cn`，在设备列表里被打成 `region=us` 的话， 存进去的是 `us`——你按 `region="cn"` 查当然是空的。 去设备列表打开这台机器，对一下它身上挂的标签。

**`agent_hostname` 会被改名成 `ident`。** 写入端上报的是 `agent_hostname`， 存进去的标签名是 `ident`，按 `agent_hostname` 查不到。

**先不带任何标签查一次**，确认指标名本身存在，再逐个加标签，看是哪一个把结果打空的：

```
mem_used_percent

mem_used_percent{ident="n9e-web-01"}

mem_used_percent{ident="n9e-web-01", region="trade"}
```

## 第四步：查的不是同一个库[​](#第四步查的不是同一个库 "第四步：查的不是同一个库的直接链接")

夜莺可以同时开内置时序库和 `[[Pushgw.Writers]]` 转发（双写）， 也可以只开其中一个。**数据写进了 A，你在 B 里查**，是接入期最常见的一种空结果。

* 默认只开内置时序库时，数据源名是 `embedded-tsdb`；
* 配了 `[[Pushgw.Writers]]` 转发的话，要去转发目标对应的那个数据源里查；
* 如果集成中心里已经存在别的 Prometheus 数据源，内置时序库**不会**自动注册数据源， 启动日志里会有一行说明，`embedded-tsdb` 这个名字根本不存在。

还有一种：远程的 Grafana 或另一台 n9e 直接查内置时序库的 `/prometheus`， 拿到的是 403，正文写得很清楚：

```
{"error":"embedded tsdb endpoints only accept requests from the n9e host by default; set EmbeddedTSDB.BasicAuthUser/BasicAuthPass (or DatasourceUrl) to allow remote access","errorType":"forbidden","status":"error"}
```

这不是没数据，是这个端点默认只收本机请求。细节见 [内置时序库的数据为什么断续或缺失？](https://n9e.github.io/zh/zh/docs/troubleshooting/embedded-tsdb-data.md)。

## 收集这些再去提问[​](#收集这些再去提问 "收集这些再去提问的直接链接")

去 [GitHub Issues](https://github.com/ccfos/nightingale/issues) 或社区群之前，把这些准备好：

1. 数据源类型和版本，以及你是在哪个页面查的（即时查询 / 日志检索 / 规则表单的数据预览）；
2. 完整的查询语句和时间范围（起止时间写绝对时间，不要写「最近一小时」）；
3. `curl -s http://127.0.0.1:17000/metrics | grep -E '^n9e_pushgw_'` 的输出；
4. 服务端日志里同一时间段的 `embedded tsdb append fail` 或 `Write channel` 行。

**脱敏**：查询语句里的业务标签值、主机名、数据源地址、Token 都要替换掉， 把 IP 写成 `n9e:17000` 这种占位形式，日志里的 `trace_id` 可以保留（它只在本地有意义）。

## 下一步[​](#下一步 "下一步的直接链接")

* 机器根本没上来：[Categraf 对象为什么显示离线？](https://n9e.github.io/zh/zh/docs/troubleshooting/categraf-offline.md)
* 内置时序库自己的问题：[内置时序库的数据为什么断续或缺失？](https://n9e.github.io/zh/zh/docs/troubleshooting/embedded-tsdb-data.md)
* 数据在但规则不响：[查询有结果，为什么告警不触发？](https://n9e.github.io/zh/zh/docs/troubleshooting/alert-not-firing.md)
* 采集端怎么排：[Categraf 排障](https://n9e.github.io/zh/zh/docs/data/categraf/troubleshooting.md)
