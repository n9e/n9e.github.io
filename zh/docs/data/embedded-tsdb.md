# 自动注册的内置时序库数据源

全新安装自动注册 embedded-tsdb 数据源（Prometheus 类型），Pushgw 收到的数据默认写入其中，查法与外置 Prometheus 相同。

最后校对于 2026-10-10

装完夜莺第一次打开 **集成中心 → 数据源**，列表里已经躺着一条名叫 `embedded-tsdb` 的 Prometheus 类型数据源，右边还带着一个默认标记。这页说清它是谁创建的、什么在往它里面写、 以及它和你自己加的外置 Prometheus 数据源到底差在哪。

![数据源列表，第一条�是 embedded-tsdb](/zh/img/docs/data/datasource-list.zh.webp)![数据源列表，第一条是 embedded-tsdb](/zh/img/docs/data/datasource-list.zh.dark.webp)

## 它是谁创建的[​](#它是谁创建的 "它是谁创建的的直接链接")

Center 进程启动时，只要 `[EmbeddedTSDB] Enable = true`（默认就是）， 它就会往数据源表里补一条记录：

| 字段       | 值                                  |
| ---------- | ----------------------------------- |
| 名称       | `embedded-tsdb`                     |
| 类型       | Prometheus                          |
| URL        | `http://127.0.0.1:17000/prometheus` |
| 时序库类型 | Prometheus                          |
| 创建人     | `system`                            |
| 默认数据源 | 是                                  |

这个动作是幂等的：重启时如果发现地址、认证或时序库类型和当前配置对不上， 它会把记录改回来，所以**改这条记录的 URL 没有意义**，下次重启就被改回去了。 它靠一个内部标识 `n9e-embedded-tsdb` 认自己，所以你把它改名是安全的。

那个默认标记是系统写死的（`is_default`），开源版的表单里没有对应的勾选框， 你不需要、也没法手动切换它。

## 什么在往里写[​](#什么在往里写 "什么在往里写的直接链接")

Categraf 把指标推给夜莺的 `/prometheus/v1/write`，夜莺的转发层再把样本当成一个普通的 remote write 后端写进本机的 `/prometheus/api/v1/write`。也就是说， **内置时序库是通过 `Pushgw.Writers` 这条链路被写入的**，只不过那条 writer 是启动时 自动注入的，配置文件里看不见。

带来的结果是：外部时序库有的转发语义，内置库全都有——服务端时间戳、 机器标签回填（`Pushgw.LabelRewrite`）、写入统计。

## 和外置 Prometheus 数据源的区别[​](#和外置-prometheus-数据源的区别 "和外置 Prometheus 数据源的区别的直接链接")

从查询接口上看没有区别：夜莺给它挂的是一套 Prometheus 兼容的 HTTP API， `/api/v1/query`、`/api/v1/query_range`、`/api/v1/series`、`/api/v1/labels`。 所以规则、仪表盘、即时查询用起来完全一样。

不一样的是三件事：

1. **它默认只接受本机请求。** 没配 `BasicAuthUser` 时，`/prometheus/api/v1/*` 只放行来自这台机器的请求，所以自动注册的地址是 `127.0.0.1`。 要让 `n9e-edge`、Grafana 或某个 agent 直接访问它，得配上 basic auth—— 配了之后自动注册的地址会换成探测到的本机 IP。也可以用 `DatasourceUrl` 显式指定一个 VIP 或域名，配了它同样会解除「仅本机」的限制；
2. **数据在单个 Center 进程的本地磁盘上。** 多副本部署时每个副本只有一部分数据， 所以做高可用就必须关掉它；
3. **删除序列这类管理接口默认不注册。** 要用得先 `EnableAdminAPI = true`， 并且先把 basic auth 配上。

## 什么情况下它不会被创建[​](#什么情况下它不会被创建 "什么情况下它不会被创建的直接链接")

Center 启动时如果发现**已经有启用状态的 Prometheus 类型数据源**，就不会再自动加这一条， 日志里会写明原因。这是为了不给已经接了外部时序库的环境凭空多出一个数据源。

注意这时候**样本照样写进本地存储**——只是没有数据源指向它。想查这批数据， 自己建一个 Prometheus 数据源指向 `http://127.0.0.1:17000/prometheus` 即可； 不需要本地存储就把 `[EmbeddedTSDB] Enable` 关掉。

## 保留期与容量[​](#保留期与容量 "保留期与容量的直接链接")

```
[EmbeddedTSDB]

Enable = true

Dir = "data/tsdb"

RetentionDuration = "15d"

MaxBytes = "10GiB"

OutOfOrderTimeWindow = "10m"

QueryTimeout = "1m"

QueryMaxSamples = 50000000
```

`MaxBytes` 超了会从最老的数据块开始删。`OutOfOrderTimeWindow` 是容忍乱序样本的窗口， agent 时钟有偏差或者补发数据时靠它兜着。

这段配置**只有 Center 进程会读**，`n9e-edge`、`n9e-alert`、`n9e-pushgw` 读同一个 `etc` 目录但会忽略它，启动时还会打一行提示。

## 下一步[​](#下一步 "下一步的直接链接")

* 它的适用边界：[内置时序库的单实例限制](https://n9e.github.io/zh/zh/docs/operations/embedded-tsdb-limits.md)
* 换成外部时序库：[外部时序库与双写迁移](https://n9e.github.io/zh/zh/docs/install/external-tsdb.md)
* 查不到数据：[内置时序库里没有数据](https://n9e.github.io/zh/zh/docs/troubleshooting/embedded-tsdb-data.md)
* 两类存储怎么分工：[内置时序库与外部存储](https://n9e.github.io/zh/zh/docs/concepts/storage.md)
