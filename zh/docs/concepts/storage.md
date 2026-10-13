# 内置时序库与外部存储

夜莺自带一个时序库让你零依赖起步；这页讲它的边界，以及什么时候必须换成 Prometheus 或 VictoriaMetrics。

最后校对于 2026-10-10

夜莺要存两类东西，它们的去处完全不同：

* **元数据**——用户、业务组、告警规则、仪表盘、通知配置。存在 SQLite / MySQL / PostgreSQL 里；
* **指标**——时序数据。默认存在内置时序库，生产上通常换成外部时序库。

搞混这两个，就会出现「我明明配了 VictoriaMetrics，为什么还要 MySQL」这类困惑。

## 元数据：SQLite 只够测试[​](#元数据sqlite-只够测试 "元数据：SQLite 只够测试的直接链接")

默认 `DBType = "sqlite"`，数据在二进制同级目录的 `n9e.db`。 好处是零依赖，代价是没有第二份数据、多实例没法共享。

生产换成 MySQL 或 PostgreSQL：

```
[DB]

DBType = "mysql"

DSN = "root:<password>@tcp(localhost:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
```

Redis 同理：默认 `RedisType = "miniredis"` 是**进程内的假 Redis**， 生产要换成 `standalone` / `cluster` / `sentinel`。

## 内置时序库：为「开箱」而生[​](#内置时序库为开箱而生 "内置时序库：为「开箱」而生的直接链接")

默认开启：

```
[EmbeddedTSDB]

Enable = true

Dir = "data/tsdb"

RetentionDuration = "15d"

MaxBytes = "10GiB"
```

打开时，Categraf 推过来的指标存在本地，不需要任何外部时序库就能看图和告警。 启动时它还会**自动注册一个名叫 `embedded-tsdb` 的 Prometheus 类型数据源**， 指向 `http://127.0.0.1:17000/prometheus`，所以你装完就能直接建规则。

它的两条硬边界：

1. **数据在单个 Center 进程的本地磁盘上。** 多副本部署时每个副本只有一部分数据——所以**做高可用就必须关掉它**。
2. **适合小规模**，大致 10 万活跃序列以内。再往上要换外部时序库。

## 什么时候换，怎么换[​](#什么时候换怎么换 "什么时候换，怎么换的直接链接")

出现下面任何一条，就该换了：

* 要跑多个 Center 实例做高可用；
* 活跃序列数往 10 万以上走；
* 数据要保留超过内置库的保留期，或者要和别的系统共用同一份指标。

换的做法是**双写过渡**，不用停机：

```
# 先加上外部时序库，两边同时写

[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"



# 等外部库攒够了历史数据，再关掉内置的

[EmbeddedTSDB]

Enable = false
```

内置库和 `Pushgw.Writers` 可以同时生效，这就是迁移窗口。 详见[外部时序库与双写迁移](https://n9e.github.io/zh/docs/install/external-tsdb.md)。

## 注意：edge / alert / pushgw 不看这段配置[​](#注意edge--alert--pushgw-不看这段配置 "注意：edge / alert / pushgw 不看这段配置的直接链接")

`[EmbeddedTSDB]` **只有 Center 进程会处理**。`n9e-edge`、`n9e-alert`、`n9e-pushgw` 读同一个 `etc` 目录，但会忽略这一段。

## 相关[​](#相关 "相关的直接链接")

* [内置时序库用于开箱与小规模](https://n9e.github.io/zh/docs/install/embedded-tsdb.md)
* [内置时序库的单实例限制](https://n9e.github.io/zh/docs/operations/embedded-tsdb-limits.md)
* [数据库选型](https://n9e.github.io/zh/docs/install/databases.md)
