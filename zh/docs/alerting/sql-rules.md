# SQL 规则

按计划对 MySQL、PostgreSQL、ClickHouse、Doris、TDengine、IoTDB 执行一条 SQL 的规则。

最后校对于 2026-10-10

这页办完你会得到：一条按周期执行一句 SQL、把结果里的某一列变成数字、越线就报警的规则。 这是对业务状态告警的方式——卡住的订单、失败的任务、排不空的队列—— 不用先把它们导出成指标。

## 哪些数据源走这条路[​](#哪些数据源走这条路 "哪些数据源走这条路的直接链接")

MySQL、PostgreSQL、ClickHouse、Doris、TDengine 和 IoTDB 用的是同一套规则形态： 一句语句、一份「结果列 → 值和标签」的映射、一条判定表达式。 它们的差别在方言，以及时间范围怎么表达，下面分别讲。

## 语句必须产出什么[​](#语句必须产出什么 "语句必须产出什么的直接链接")

两个要求，而且都是强制的：

**它要为每个你想告警的对象返回一行**，不是返回一张报表。规则比较的是数字，所以在 SQL 里聚合：

```
SELECT count(*) AS value

FROM orders

WHERE created_at >= NOW() - INTERVAL 5 MINUTE

  AND status = 'failed'
```

**它要有一列被你指定成「值」。** 在**辅助配置**下面：

| 字段     | 作用                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 值字段   | 哪一列是那个数。MySQL、PostgreSQL、ClickHouse、Doris **必填**——不填查询会直接报 `valueKey is required`。可以用回车分隔填多列，每列各成一条序列 |
| 标签字段 | 哪些列变成事件上的标签。同样可以填多列                                                                                                         |

标签字段填不填，行为是不一样的，很多人在这里翻车：

* **标签字段留空**——所有既不是值列、也不是时间列的列，会自动变成标签。
* **标签字段填了**——只有你点名的那些列变成标签，其余列被丢弃。

所以一条按服务分组的查询，要么是碰巧能用（标签字段留空），要么是有意配对的：

```
SELECT service, count(*) AS value

FROM orders

WHERE created_at >= NOW() - INTERVAL 5 MINUTE AND status = 'failed'

GROUP BY service
```

**值字段**填 `value`，**标签字段**填 `service`。于是每个超阈值的服务各出一条事件， 带着自己的名字。

TDengine 表单里这两个字段的名字一样，但值列在底层用的是它自己的键， 另外多一个 **TimeFormat** 用来解析时间戳列。

## 时间范围要你自己写[​](#时间范围要你自己写 "时间范围要你自己写的直接链接")

这是和指标规则最重要的一个区别。**MySQL、PostgreSQL、ClickHouse 和 IoTDB， 告警引擎不会往你的语句里注入时间范围。** 表单上那个时间间隔字段限制的是预览， 不是引擎真正发出去的那条查询。

所以时间窗必须写在 SQL 里：

```
WHERE created_at >= NOW() - INTERVAL 5 MINUTE      -- MySQL

WHERE created_at >= now() - interval '5 minutes'   -- PostgreSQL

WHERE ts >= now() - INTERVAL 5 MINUTE              -- ClickHouse
```

一条完全没有时间条件的语句，就是每个评估周期做一次全表扫描。 想让 DBA 恨上你的监控系统，这是最快的办法。

### 各数据源的时间宏[​](#各数据源的时间宏 "各数据源的时间宏的直接链接")

只有两种数据源给了宏，就两种：

**Doris** 支持 `$__timeFilter(<列名>)`，窗口由表单上的**查询区间**（默认 60 秒） 和可选的**延迟查询**算出来：

```
SELECT count(*) AS cnt FROM logs.errors WHERE $__timeFilter(`ts`)
```

它会展开成 `(ts >= FROM_UNIXTIME(起) AND ts < FROM_UNIXTIME(止))`。

**TDengine** 会替换三个变量：

| 变量        | 替换成                                                      |
| ----------- | ----------------------------------------------------------- |
| `$from`     | 窗口起点，带引号的 RFC3339 时间戳——引号是自带的，别自己再加 |
| `$to`       | 窗口终点，同上                                              |
| `$interval` | 间隔秒数，形如 `60s`                                        |

```
SELECT avg(current) AS current FROM power.meters WHERE ts >= $from AND ts < $to
```

**不要在 MySQL、PostgreSQL、ClickHouse、IoTDB 的告警规则里用 `$__timeFilter`。** 在 MySQL 上它会让查询直接失败，报 `requires a query time range, got none`； 在其余几种上这个宏会原样送给数据库，变成语法错误。自己手写时间条件。

## 判定条件[​](#判定条件 "判定条件的直接链接")

查询下面是**判定条件 → 阈值判断**，和日志规则用的是同一个区块。 表达式按别名引用查询、按列名引用值：

```
$A.value > 10
```

`$A.<列名>` 是那一列的值。`$A.<标签名>` 是标签，而标签是**字符串**—— `$A.service == 'checkout'` 可以，`$A.service > 10` 是类型错误， 引擎会静默地当成「条件不满足」。用[模拟触发](https://n9e.github.io/zh/docs/alerting/test-fire.md)验一下， 它会拿真实的行实算表达式，把错误报出来而不是吞掉。

多条查询用 `&&`、`||` 组合，**集合操作**控制它们标签集不同时的行怎么对起来。

每条判定条件带自己的级别，所以分档阈值在这里和指标规则一样好使—— 加第二条条件，打开**级别抑制**。

每条判定条件上的**恢复条件**下拉，在 SQL 这里比在别处更要紧。 *必须查到数据且不满足告警条件才恢复*会让告警在数据库连不上时保持， 这几乎总是你想要的：一个查不动的数据库不等于一个健康的数据库。

MySQL、PostgreSQL、TDengine、IoTDB 默认选中的就是它——但 **ClickHouse 和 Doris 被归为日志类**， 默认停在*查不到数据就恢复*上。这两种要自己显式改。见[判定周期与恢复](https://n9e.github.io/zh/docs/alerting/evaluation.md)。

## 各数据源的额外约束[​](#各数据源的额外约束 "各数据源的额外约束的直接链接")

* **PostgreSQL** 要求表名写全——`database.schema.table`。只写表名会报 `no valid table name in format database.schema.table found`。
* **ClickHouse 和 Doris** 面对的是大表，语句要有边界，该加 `LIMIT` 就加。
* **TDengine** 的结果集必须含 `TIMESTAMP` 列。
* **所有类型**：执行频率要对着语句耗时来定。跑一次八秒的查询，不能 15 秒一跑。 定之前先手工执行一次，看看用了多久。

## 验证查询只有这一个地方[​](#验证查询只有这一个地方 "验证查询只有这一个地方的直接链接")

**ClickHouse、Doris、MySQL、PostgreSQL、OpenSearch 在开源版里进不了即时查询和日志检索。** 对这几种数据源，没有「先粘到即时查询里试试」这一步。

在夜莺里能跑这条语句的地方，是规则表单里查询卡片上的**数据预览**。 它会把 SQL 打到选中的数据源上，展示结果序列——名称、标签、值—— 而这正是判定表达式将会看到的东西。预览里的列和你预期的不一样， 就先把值字段和标签字段改对，再往下走。

然后用[模拟触发](https://n9e.github.io/zh/docs/alerting/test-fire.md)核判定表达式，保存之后用 [判定执行记录](https://n9e.github.io/zh/docs/alerting/execution-records.md)看生产环境里每个周期返回了什么。

## 下一步[​](#下一步 "下一步的直接链接")

* 时间参数与恢复：[判定周期与恢复](https://n9e.github.io/zh/docs/alerting/evaluation.md)
* 改成对日志告警：[日志规则](https://n9e.github.io/zh/docs/alerting/log-rules.md)
* 先把数据库接进来：[SQL 数据库](https://n9e.github.io/zh/docs/data/sql-databases.md)、[ClickHouse、Doris 与 IoTDB](https://n9e.github.io/zh/docs/data/clickhouse-doris-iotdb.md)
