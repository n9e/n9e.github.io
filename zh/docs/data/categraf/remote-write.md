# Remote Write

Categraf 攒批后按 Prometheus Remote Write 发出指标，可配多个写入目标同时写夜莺和另一个后端；写失败不重试。

最后校对于 2026-10-10

Categraf 采到的指标不是采一条发一条，而是进队列、攒批、按 Prometheus Remote Write 协议发出去。这页讲这条链路上的四个可调的地方，以及一件必须知道的事：**写失败没有重试**。

## 数据往哪走[​](#数据往哪走 "数据往哪走的直接链接")

```
插件采集 → 内存队列 → 攒够一批 → remote write → [[writers]] 里的每个地址
```

夜莺侧接收 remote write 的地址是 **`POST /prometheus/v1/write`**：

```
[[writers]]

url = "http://10.0.0.10:17000/prometheus/v1/write"

basic_auth_user = ""

basic_auth_pass = ""

# 单位都是毫秒

timeout = 5000

dial_timeout = 2500

max_idle_conns_per_host = 100

# headers = ["X-From", "categraf"]



## 可选 TLS

# use_tls = false

# tls_ca = "/etc/categraf/ca.pem"

# tls_cert = "/etc/categraf/cert.pem"

# tls_key = "/etc/categraf/key.pem"

# insecure_skip_verify = false
```

夜莺的 agent 接口默认**不开认证**，`basic_auth_*` 留空即可。 只有服务端在 `[HTTP.APIForAgent]` 里配了 BasicAuth，这两个字段才要填——填错的表现是 写入侧一直 401，而且**没有任何指标记录这件事**，只能看日志。

边缘机房部署时，把这个地址换成 `n9e-edge` 的地址，路径不变。

## 批量与队列[​](#批量与队列 "批量与队列的直接链接")

```
[writer_opt]

# 每次从队列里取多少条序列发出去

batch = 1000

# 队列（内存）最多存多少条序列

chan_size = 1000000
```

`batch` 是攒批大小，`chan_size` 是队列容量。两个值都填 0 或负数会被重置成默认值。

调它们的判断依据：

* **队列满了**（日志里出现 `write ... samples failed, please increase queue size`）， 说明产出比发送快。先查是不是后端慢或者不通，确认后端没问题再调大 `chan_size`；
* **后端嫌批太大**（比如网关有 body 大小限制），调小 `batch`；
* 序列数不多的机器不用动这两个值。

队列在内存里。**进程重启，队列里没发出去的数据就没了**——这是设计取舍， Categraf 不做本地缓冲。

## 没有重试[​](#没有重试 "没有重试的直接链接")

这是最需要知道的一条：**一批数据发失败，就被丢掉了。**

发送循环从队列里取一批、发一次，然后不管成功失败都继续取下一批。没有重排队， 没有退避重试，也没有本地落盘。后端抖 30 秒，这 30 秒的数据就没了。

失败时日志里是三行，都是 `W!` 级别（**不是 `E!`**，用 grep 找错误容易漏）：

```
W! push data with remote write request got error: Post "http://...": dial tcp ...: connect: connection refused response body:

W! post to http://... got error: Post "http://...": dial tcp ...: connect: connection refused

W! example timeseries: labels:<name:"__name__" value:"mem_total" > labels:<name:"agent_hostname" value:"n9e-web-01" > ...
```

第三行会举一条这批里的样本，用来判断丢的是哪部分数据。

返回非 2xx 的时候格式是：

```
W! post to <url> got error: push data with remote write request got status code: 401, response body: <body>
```

所以：**要求数据不丢的场景，别指望 agent 侧兜底**——要么保证后端可用性（夜莺多副本 + 负载均衡），要么在中间放一层带缓冲的代理。

## 写多个后端[​](#写多个后端 "写多个后端的直接链接")

`[[writers]]` 是数组，重复写几段就是几个目标，它们**并发发送**：

```
# 主路径：写夜莺，这样机器标签、告警自愈才能生效

[[writers]]

url = "http://10.0.0.10:17000/prometheus/v1/write"

timeout = 5000



# 同时写一份到自己的 VictoriaMetrics

[[writers]]

url = "http://vm:8480/insert/0/prometheus/api/v1/write"

headers = ["X-Scope-OrgID", "tenant-a"]

timeout = 5000
```

两点注意：

* **写入目标按 URL 去重。** 两段 `[[writers]]` 填了同样的 url，只会生效一个；
* **每个目标各发各的，互不影响。** 一个失败不会拖累另一个，但也不会被另一个补上 （因为都没有重试）。

## 直接写时序库的代价[​](#直接写时序库的代价 "直接写时序库的代价的直接链接")

`url` 填成 VictoriaMetrics、Prometheus、Thanos 这些的写入地址，技术上完全可行—— 它们都收 remote write。但这样一来数据**不经过夜莺**，你会失去三样东西：

1. **机器标签回填。** 在设备列表里给机器打的标签，是夜莺在转发时附加到指标上的 （`Pushgw.LabelRewrite`）。绕过夜莺，这些标签不会出现在数据里；
2. **服务端时间戳。** `Pushgw.ForceUseServerTS` 用服务端时间覆盖样本时间， 机器时钟不准时靠它兜底；
3. **告警自愈。** 自愈脚本的下发依赖 agent 和夜莺之间的通道。

想同时要「夜莺的标签能力」和「自己的时序库」，正确做法不是让 Categraf 直连时序库， 而是**让 Categraf 只写夜莺，由夜莺转发到时序库**——在夜莺的配置里加：

```
[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"
```

详见 [VictoriaMetrics](https://n9e.github.io/zh/docs/data/victoriametrics.md) 和[外部时序库与双写迁移](https://n9e.github.io/zh/docs/install/external-tsdb.md)。

## 观测写入本身[​](#观测写入本身 "观测写入本身的直��接链接")

打开 `self_metrics` 插件（建一个 `conf/input.self_metrics/` 目录即可）， Categraf 会上报自己的运行指标：

| 指标                                  | 含义                               |
| ------------------------------------- | ---------------------------------- |
| `categraf_info{version}`              | 版本号，值恒为 1，用来统计版本分布 |
| `categraf_current_queue_size`         | 当前队列里堆了多少条               |
| `categraf_metrics_enqueue_sum`        | 累计入队条数                       |
| `categraf_metrics_enqueue_failed_sum` | 累计**入队失败**条数               |

**注意 `enqueue_failed` 统计的是「队列满了塞不进去」，不是「发送失败」。** Categraf 没有任何一个指标反映 remote write 的成败——那件事只在日志里。 所以「写入是否健康」这个问题，靠 `categraf_current_queue_size` 持续升高 + 日志里的 `W!` 行来判断。

## 下一步[​](#下一步 "下一步的直接链接")

* 队列涨、数据不到：[排障](https://n9e.github.io/zh/docs/data/categraf/troubleshooting.md)
* 夜莺侧的转发配置：[Pushgw](https://n9e.github.io/zh/docs/operations/pushgw.md)
* 支持哪些写入协议：[写入协议](https://n9e.github.io/zh/docs/reference/write-protocols.md)
