# Pushgw 队列、写入器与双写

写入路径：队列大小、背压、多写入器、同时转发到两个后端。

最后校对于 2026-10-10

Pushgw 是「样本进来、转发出去」的那一段。它在 `n9e` 进程里默认就开着， 写入量不大时不用管；一旦要做双写、或者开始丢样本，就得知道队列长什么样、 背压怎么表现、以及哪些失败是静默的。

## 写入路径[​](#写入路径 "写入路径的直接链接")

采集器把样本 POST 到下面这些端点，Pushgw 补上设备标签、按丢弃规则过滤， 放进内存队列，再由消费协程批量转发给每个配置好的写入器。

| 端点                          | 协议                                                |
| ----------------------------- | --------------------------------------------------- |
| `POST /prometheus/v1/write`   | Prometheus remote write（categraf、vmagent 走这个） |
| `POST /opentsdb/put`          | OpenTSDB                                            |
| `POST /openfalcon/push`       | Open-Falcon                                         |
| `POST /datadog/api/v1/series` | Datadog v1 series                                   |
| `POST /proxy/v1/write`        | 原样透传的 remote write 代理，见最后一节            |

这些端点由 `[HTTP.APIForAgent] Enable` 统一控制（示例配置里是 `true`）。 关掉它，Pushgw 就只剩一个内部接口，采集器全部写不进来。

两个默认打开的行为（示例配置里都是 `true`）：

* `LabelRewrite = true`——序列里的标签和设备列表里登记的标签冲突时，**以数据库里的为准**；
* `ForceUseServerTS = true`——用服务端时间覆盖样本时间，避免采集端时钟不准。 注意它**只改每条序列的第一个样本**，一次带多个点的序列后面几个点保持原时间。

## 队列：数量、容量和那个 10% 水位[​](#队列数量容量和那个-10-水位 "队列：数量、容量和那个 10% 水位的直接链接")

```
[Pushgw.WriterOpt]

QueueMaxSize = 1000000   # 每个队列的容量

QueuePopSize = 1000      # 每次从队列里取多少条转发
```

配置文件里注释掉的就这两项，但实际生效的还有几个没写进示例配置的：

| 项                    | 默认值                   | 含义                   |
| --------------------- | ------------------------ | ---------------------- |
| `QueueNumber`         | CPU 核数（单核时为 128） | 队列个数               |
| `QueueMaxSize`        | 1000000                  | **单个**队列的容量     |
| `QueuePopSize`        | 1000                     | 每批取出的条数         |
| `QueueWaterMark`      | 0.1                      | 全局准入水位           |
| `RetryCount`          | 1000                     | 写失败重试次数         |
| `RetryInterval`       | 1                        | 重试间隔（秒）         |
| `OverLimitStatusCode` | 499                      | 队列超限时返回的状态码 |

**全局准入上限是 `QueueNumber × QueueMaxSize × QueueWaterMark`。** 8 核机器上就是 `8 × 1000000 × 0.1 = 80 万`，不是 800 万——这个 10% 折扣很容易估错。

队列编号是**按请求**轮转分配的，不是按样本。一个请求里的所有样本进同一个队列， 所以少数几个连接发超大批次时，会把某一个队列打热。每个队列有且只有一个消费协程。

## 满了会发生什么[​](#满了会发生什么 "满了会发生什么的直接链接")

三种丢弃是三回事，别混：

| 情况                                             | 客户端看到                 | 计数器                                         |
| ------------------------------------------------ | -------------------------- | ---------------------------------------------- |
| 全局水位超限（只在 `/prometheus/v1/write` 上判） | HTTP **499**，整个请求被拒 | `n9e_pushgw_push_queue_over_limit_error_total` |
| 单个队列写满                                     | **HTTP 200**，样本静默丢弃 | `n9e_pushgw_push_queue_error_total{queueid}`   |
| 命中丢弃规则                                     | HTTP 200                   | `n9e_pushgw_drop_sample_total`                 |

第一种要特别注意：**499 是 4xx**。Prometheus、vmagent、categraf 这类客户端普遍把 4xx 当成「这批数据有问题」而直接丢掉，不会退避重试，所以背压并不会传导回采集端。

第二种更隐蔽：HTTP 返回 200，样本没了，唯一的证据是那个带 `queueid` 标签的计数器 和日志里的一行 warning（那行 warning 会把整条序列打出来，队列满的时候很容易刷爆日志）。

所以「有没有丢样本」不能靠客户端的返回码判断，只能看指标。

## 多写入器就是扇出[​](#多写入器就是扇出 "多写入器就是扇出的直接链接")

每多写一个 `[[Pushgw.Writers]]` 块，就多一个后端，**每一批样本都会发给每一个后端**：

```
[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"



[[Pushgw.Writers]]

Url = "http://prometheus:9090/api/v1/write"
```

三个容易踩的地方：

* **一个 `Url` 里用逗号分隔多个地址，是「依次尝试、第一个成功就停」的容灾，不是扇出。** 要扇出就写多个 `[[Pushgw.Writers]]` 块。
* **一个块里写两行 `Url =`，TOML 只保留后一行**，前一行静默失效。 示例配置里正好有这么两行（一行注释掉了），复制粘贴时容易两行都留着。
* **写入器收到 4xx 会被当成写成功。** 目标地址写错、路径写错（比如少了 `/api/v1/write`）时， 样本会静默消失，`n9e_pushgw_write_error_total` 一动不动。配完新写入器一定要到目标库里 查一下数据真的到了。

写入器的超时默认值：`Timeout = 10000`、`DialTimeout = 3000`、`TLSHandshakeTimeout = 30000`（毫秒）。 `WriteRelabels` 是**每个写入器各自的**，写在哪个块里就只影响哪个后端。

## 一个卡住的写入器会拖垮整个队列[​](#一个卡住的写入器会拖垮整个队列 "一个卡住的写入器会拖垮整个队列的直接链接")

默认的写入器是「关键后端」：消费协程**串行地**、**同步地**给每个关键后端写， 写失败重试 `RetryCount`（1000）次、每次间隔 `RetryInterval`（1 秒）。 一个后端不可达，最坏情况下这一批要卡将近 17 分钟， 而这期间同一个队列上的其他后端一个字节都写不出去，队列随即填满开始丢样本。

外部的、允许丢的那个后端，加上 `AsyncWrite`：

```
[[Pushgw.Writers]]

Url = "http://third-party:8428/api/v1/write"

AsyncWrite = true
```

打开之后这个后端变成「非关键」：每批开独立协程写，重试次数被压到 3 次， 它慢或者挂了不会拖住别的后端。代价是丢样本时更安静。

## 内置时序库也是一个写入器[​](#内置时序库也是一个写入器 "内置时序库也是一个写入器的直接链接")

`[EmbeddedTSDB] Enable = true` 时，Center 会**追加**一个指向自己的写入器 （`http://127.0.0.1:17000/prometheus/api/v1/write`），你配的 `[[Pushgw.Writers]]` 原样保留。 这就是双写的实现方式——两者不是二选一。

由此推出两件事：

* 迁移到外部时序库时，先加 `[[Pushgw.Writers]]`，等外部库攒够历史再把 `[EmbeddedTSDB] Enable` 改成 `false`，全程不用停机；
* 内置时序库那个写入器也是「关键后端」，**它卡住同样会拖住外部写入器**。

`[EmbeddedTSDB]` 只有 Center 处理。`n9e-edge` / `n9e-alert` / `n9e-pushgw` 读同一个 etc 目录时会打印一行 warning 然后忽略这一段。

## `/proxy/v1/write`：不解包的透传[​](#proxyv1write不解包的透传 "proxyv1write不解包的透传的直接链接")

这个端点不解 snappy、不解 protobuf、不补标签、不进队列、不应用 relabel 和丢弃规则， 只是把请求体原样再 POST 给每个 `[[Pushgw.Writers]]`。

| 限制                         | 默认值             | 超限时       |
| ---------------------------- | ------------------ | ------------ |
| `[Pushgw] ProxyInflightMax`  | 1000               | HTTP **429** |
| `[Pushgw] ProxyMaxBodyBytes` | 33554432（32 MiB） | HTTP **413** |

转发是尽力而为：不重试，失败只记日志，**客户端拿到的永远是 200**。 它的可观测性靠 `n9e_pushgw_proxy_forward_error_total{url,reason}`。

注意它返回的 429 才是标准的「稍后重试」，而队列路径返回的是 499。

## 该盯的指标[​](#该盯的指标 "该盯的指标的直接链接")

| 指标                                                                | 看什么                                   |
| ------------------------------------------------------------------- | ---------------------------------------- |
| `n9e_pushgw_samples_received_total{channel}`                        | 进来的总量，突然掉下去就是采集侧出问题了 |
| `n9e_pushgw_sample_queue_size{queueid}`                             | 队列积压，某一个队列独高说明请求分布不均 |
| `n9e_pushgw_push_queue_over_limit_error_total`                      | 请求被拒                                 |
| `n9e_pushgw_push_queue_error_total{queueid}`                        | 样本被丢，这个非 0 就是真在掉数据        |
| `n9e_pushgw_write_total{url}` / `n9e_pushgw_write_error_total{url}` | 每个后端写出去多少、失败多少             |
| `n9e_pushgw_forward_duration_seconds{url}`                          | 每个后端的写入耗时，用来找那个拖后腿的   |

## 相关[​](#相关 "相关的直接链接")

* [外部时序库与双写迁移](https://n9e.github.io/zh/zh/docs/install/external-tsdb.md)
* [内置时序库的单 Center 限制](https://n9e.github.io/zh/zh/docs/operations/embedded-tsdb-limits.md)
* [容量规划](https://n9e.github.io/zh/zh/docs/operations/capacity.md)
* [内置指标与健康检查](https://n9e.github.io/zh/zh/docs/operations/health.md)
