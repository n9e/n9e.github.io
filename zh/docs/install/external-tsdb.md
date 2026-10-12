# 外置时序库与双写迁移

借助 Pushgw 双写，从内置时序库无缝切换到 Prometheus 或 VictoriaMetrics。

内置时序库和外部时序库**可以同时开着**，这就是迁移窗口：先两边都写，等外部库攒够历史， 再关掉内置的。整个过程不用停机，也不会在图上留下断档。

## 双写是怎么回事[​](#双写是怎么回事 "双写是怎么回事的直接链接")

Categraf 推过来的样本先进 Pushgw 的转发链路，再分发给每一个写入目标。 内置时序库对这条链路来说就是一个普通的写入目标——它是在启动时被自动加进去的。 所以在 `[[Pushgw.Writers]]` 里再加一个外部地址，样本就同时进两边， 两个 `[[Pushgw.Writers]]` 之间没有主备关系。

## 第一步：加上外部写入地址[​](#第一步加上外部写入地址 "第一步：加上外部写入地址的直接链接")

外部时序库要开着远程写入接收端点：

* **VictoriaMetrics** 天生支持，地址是 `http://victoriametrics:8428/api/v1/write`；
* **Prometheus** 要加启动参数 `--web.enable-remote-write-receiver`（旧版本是 `--enable-feature=remote-write-receiver`），否则写入会 404。

```
# 内置库保持开着，这段是新增的

[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"

# BasicAuthUser = ""

# BasicAuthPass = ""

Timeout = 10000
```

重启 `n9e`。**预期结果**：日志里没有写入报错， `curl -s http://127.0.0.1:17000/metrics | grep n9e_pushgw` 能看到转发计数在涨。

404 会被当成写入成功

写入目标返回 4xx 时，样本被丢弃而不会重试，日志里只有一行 WARNING。 所以配完一定要真的去外部库里查一条指标，不能只看进程还活着。

## 第二步：验证两边都有数据[​](#第二步验证两边都有数据 "第二步：验证两边都有数据的直接链接")

在**集成中心 → 数据源**里把外部时序库注册成一个 Prometheus 类型的数据源 （VictoriaMetrics 也注册成 `Prometheus Like`，没有单独的 victoriametrics 类型）。

然后在**数据查询 → 指标**里用同一条查询分别跑一次 `embedded-tsdb` 和新数据源。 **预期结果**：新数据源从你配置双写的那一刻起有数据，之前没有；两边当前的值一致。

## 第三步：等够保留期[​](#第三步等够保留期 "第三步：等够保留期的直接链接")

新库只有双写开始之后的数据。在你依赖的历史长度攒够之前， 两边都留着——仪表盘和告警规则先继续用 `embedded-tsdb`，需要长历史时才切到新数据源。

这段时间的成本只是双份的写入流量和一份多余的本地磁盘。

## 第四步：关掉内置库[​](#第四步关掉内置库 "第四步：关掉内置库的直接链接")

```
[EmbeddedTSDB]

Enable = false
```

重启后 `data/tsdb` 不再增长。确认没有仪表盘和告警规则还指着 `embedded-tsdb` 之后， 可以把这个数据源删掉，目录也能删。

**预期结果**：图和告警都正常，日志里出现内置时序库未启用的提示。

顺序不能反——先关内置库再配外部库，中间那段时间的数据谁都没有。

## 全新部署直接用外部时序库[​](#全新部署直接用外部时序库 "全新部署直接用外部时序库的直接链接")

不需要迁移的话，装完第一件事就把内置库关掉、把写入地址指过去：

```
[EmbeddedTSDB]

Enable = false



[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"
```

这时 `embedded-tsdb` 数据源不会被注册，得自己在数据源页面注册外部时序库。 做高可用的部署必须走这条路，见[高可用](https://n9e.github.io/zh/zh/docs/install/high-availability.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* [接入 VictoriaMetrics](https://n9e.github.io/zh/zh/docs/data/victoriametrics.md)
* [接入 Prometheus](https://n9e.github.io/zh/zh/docs/data/prometheus.md)
* [内置时序库与外部存储](https://n9e.github.io/zh/zh/docs/concepts/storage.md)
