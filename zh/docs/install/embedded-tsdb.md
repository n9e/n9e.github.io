# 内置时序库：开箱与小规模

零额外组件先跑起来：内置时序库的保留期、容量，以及单 Center 的限制。

最后校对于 2026-10-10

内置时序库**默认就是开着的**，装完不用配任何东西就能看图、建规则。 这页讲怎么把它调到合适的保留期和容量，以及它在什么地方会顶到天花板。

## 它已经在跑了[​](#它已经在跑了 "它已经在跑了的直接链接")

```
[EmbeddedTSDB]

Enable = true

Dir = "data/tsdb"

RetentionDuration = "15d"

MaxBytes = "10GiB"
```

启动时它做两件事：在工作目录下建 `data/tsdb` 存数据， 并**自动注册一个名叫 `embedded-tsdb` 的 Prometheus 类型数据源**。

在**数据查询 → 指标**里选这个数据源，输入 `up`，能查出点来就说明写入链路是通的。 Categraf 按远程写入推过来的指标，不需要再配任何转发就落在这里。

## 调保留期和容量[​](#调保留期和容量 "调保留期和容量的直接链接")

```
[EmbeddedTSDB]

RetentionDuration = "30d"   # 12h / 7d / 15d 这类写法

MaxBytes = "50GiB"          # 留空或 0 表示不限
```

两个条件是**或**的关系：数据超过保留期会被删，磁盘占用超过 `MaxBytes` 也会从最老的块开始删。 所以 `MaxBytes` 设小了，实际保留期会短于 `RetentionDuration`，而且不报错。

先按 `MaxBytes` 给一个磁盘容量能兜住的值，再观察 `data/tsdb` 实际长到多大， 比一开始就精算序列数靠谱。

另外两个偶尔要动的：

* `OutOfOrderTimeWindow`（默认 `10m`）——容忍采集端时钟偏移和补传，窗口外的样本会被丢弃；
* `QueryMaxSamples`、`QueryTimeout`——查询侧的闸门，仪表盘时间范围拉得很大时才需要放宽。

改完重启 `n9e` 生效。

## 它默认只接受本机访问[​](#它默认只接受本机访问 "它默认只接受本机访问的直接链接")

`/prometheus/api/v1/*` 这组端点（查询和写入都在这儿）**默认只接受来自本机的请求**， 自动注册的数据源地址也因此写成 `http://127.0.0.1:17000/prometheus`。

想让 Grafana、`n9e-edge` 或者别的采集器直接读写它，得配上认证：

```
[EmbeddedTSDB]

BasicAuthUser = "n9e"

BasicAuthPass = "<password>"
```

配上之后本机限制自动解除，自动注册的数据源地址也会从 `127.0.0.1` 换成检测到的本机 IP。 前面挂了 VIP 或域名时，用 `DatasourceUrl` 指定对外地址——设了它同样会解除本机限制。

## 什么时候不该再用它[​](#什么时候不该再用它 "什么时候不该再用它的直接链接")

三条硬边界，任意一条踩到就该换外部时序库：

1. **数据在单个 Center 进程的本地磁盘上。** 多实例部署时每个实例只有一部分数据， 查询结果会静默地不完整。所以**做高可用就必须关掉它**。
2. **只有 Center 进程会处理这段配置。** `n9e-edge`、`n9e-alert`、`n9e-pushgw` 读同一个 `etc` 目录，但会忽略 `[EmbeddedTSDB]`，启动时打一行提示。
3. **规模大致在 10 万活跃序列以内。** 再往上，查询延迟和内存占用都会明显起来。

还有一条不算限制但要知道：这份数据没有副本。机器挂了就是没了， 是否需要备份取决于你还依不依赖这段历史。

## 下一步[​](#下一步 "下一步的直接链接")

* [外置时序库与双写迁移](https://n9e.github.io/zh/docs/install/external-tsdb.md)——不停机换到 Prometheus 或 VictoriaMetrics
* [自动注册的内置时序库数据源](https://n9e.github.io/zh/docs/data/embedded-tsdb.md)——这个数据源在页面上怎么用
* [内置时序库与外部存储](https://n9e.github.io/zh/docs/concepts/storage.md)——两类数据分别存在哪
