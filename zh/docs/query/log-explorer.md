# 日志检索与索引模式

检索 ElasticSearch、Loki、VictoriaLogs，定义索引模式，从一条日志跳到一条规则。

这页办完你会得到：在日志存储上跑通一条检索，用字段侧栏把结果收窄到你要的那几条， 并把「查哪些索引、用哪个时间字段」存成一个索引模式，下次不用重填。

## 开始之前：这个页面能选哪些数据源[​](#开始之前这个页面能选哪些数据源 "开始之前：这个页面能选哪些数据源的直接链接")

开源版的日志检索**只支持三类**：**Elasticsearch**、**Loki**、**VictoriaLogs**。

OpenSearch、ClickHouse、Doris 可以注册成数据源，但**在这个检索页面上选不到**。 一个可用的都没有时，页面直接提示「没有可用的数据源类型」并指向数据源管理。

数据源怎么注册见 [ElasticSearch / OpenSearch](https://n9e.github.io/zh/zh/docs/data/elasticsearch.md) 和 [Loki / VictoriaLogs](https://n9e.github.io/zh/zh/docs/data/loki-victorialogs.md)。

## 1. 选数据源，跑第一条检索[​](#1-选数据源跑第一条检索 "1. 选数据源，跑第一条检索的直接链接")

**数据查询 → 日志**（`/log/explorer`）。

![日志检索](/zh/img/docs/query/log-explorer.zh.png)![日志检索](/zh/img/docs/query/log-explorer.zh.dark.png)

左边一列自上而下（Elasticsearch 的形态）：

| 控件     | 填什么                                                                 |
| -------- | ---------------------------------------------------------------------- |
| 数据源   | 上面那三类之一                                                         |
| 检索方式 | **Indices**（直接填索引）或 **Index patterns**（用预先存好的索引模式） |
| 索引     | 索引名或通配，比如 `app-log-*`。右边的齿轮是索引模式管理入口           |
| 日期字段 | 拿哪个字段当时间轴，通常是 `@timestamp`                                |

顶上一行是语法开关（**KQL** / **Lucene**）、**查询条件**、时间范围（默认最近 1 小时）和 **查询** 按钮。点 **查询**。

预期结果：中间出现一张直方图（「所有日志统计」），下面是日志表，右上角给出耗时和条数。

两种语法各自的写法：

```
Lucene    status:active                  字段等值

          title:(quick OR brown)         字段里含任一词

          author:"John Smith"            完整短语

          bro*                           通配，? 匹配单字符

          quikc~                         模糊匹配

          count:[1 TO 5]  age:>10        范围

          quick AND brown  NOT fox       布尔



KQL       method: GET

          level: error*

          response_time >= 1 and response_time <= 5

          method: POST and status_code: (500 or 502)

          user:{ first: "Alice" and last: "White" }     嵌套字段
```

日志表上面那一排：**原始 / 表格 / 时序图 / 聚类** 切换展示形态；**换行**、**行号**、 **日志时间** 是列开关；齿轮是字段列设置。

## 2. 用字段侧栏把结果收窄[​](#2-用字段侧栏把结果收窄 "2. 用字段侧栏把结果收窄的直接链接")

左下角的「可用字段」列的是这批日志里出现过的字段。鼠标移上去会出现三个动作：

* **添加到本次检索**：把 `字段: 值` 作为条件加进去；
* **从本次检索中排除**：加一个否定条件；
* **过滤存在该字段的文档**。

点字段名还能看它的**前 N 个值**和占比——「哪个 service 报错最多」这类问题这样最快。

日志表上方的 **筛选 + 添加** 是显式的筛选条件，字段 / 操作符 / 值三段式。 **多个筛选条件之间是「且」**，每条可以单独禁用而不删掉，适合来回试。

排完之后想让同事看同一屏，点右上角的 **⋮ → 分享链接**：它把当前的查询条件序列化进 URL 复制给你。这是给**已登录**的人用的，不是匿名链接。

## 3. 索引模式：把「查哪些索引」存下来[​](#3-索引模式把查哪些索引存下来 "3. 索引模式：把「查哪些索引」存下来的直接链接")

每次手填 `app-log-*` 和 `@timestamp` 很烦，存成一个索引模式就好。

入口不在侧栏菜单里：把「检索方式」切成 **Index patterns**，索引框右边的**齿轮**就是 管理入口（`/log/index-patterns`）。点 **新增索引模式**：

| 字段           | 填什么                                                 |
| -------------- | ------------------------------------------------------ |
| 数据源         | 必填，只能选 Elasticsearch 类型                        |
| 跨集群         | 需要跨集群检索时打开                                   |
| 名称           | 索引通配，比如 `app-log-*`。不带通配符会自动补一个 `*` |
| 时间字段       | 从该索引里 date 类型的字段中选，默认 `@timestamp`      |
| 匹配隐藏的索引 | 是否把以 `.` 开头的隐藏索引也算进来                    |
| 备注           |                                                        |

抽屉右半边实时预览匹配到哪些索引，没匹配上会显示「没有匹配的索引」——这时先回去检查 通配写法，别急着保存。

这个页面受 `/log/index-patterns` 权限点控制，没授权的人连那个齿轮都看不到。

## Loki 和 VictoriaLogs 不一样在哪[​](#loki-和-victorialogs-不一样在哪 "Loki 和 VictoriaLogs 不一样在哪的直接链接")

这两个没有「索引」和「日期字段」的概念，左侧那两个框不出现。

* **Loki**：查询框写 **LogQL**，例如 `{job="varlogs"} |= "error"`。旁边有个查询构造器 抽屉，按标签、行过滤、解析器、区间聚合一步步拼，拼完可以「预览 QL」再执行； 日志行上还能打开上下文浏览，看这条前后发生了什么。
* **VictoriaLogs**：查询框写 **LogsQL**，默认值是 `*`（全匹配）。多出「限制数量」和 「匹配结果」两个数字，展示形态是分组 / 表格 / JSON。

## 从一条日志到一条规则[​](#从一条日志到一条规则 "从一条日志到一条规则的直接链接")

**这个页面上没有「生成告警规则」按钮**，不用找。把这里调通的检索变成告警的做法是：

1. 记下这四样东西：数据源、索引（或索引模式）、日期字段、查询条件；
2. 去 **告警通知 → 规则管理 → 新增**，规则类型选日志类；
3. 把上面四样原样填进去，再定「多少条算异常」。

字段语义和阈值怎么定见[日志告警规则](https://n9e.github.io/zh/zh/docs/alerting/log-rules.md)。

## 下一步[​](#下一步 "下一步的直接链接")

* 写日志类告警规则：[日志告警规则](https://n9e.github.io/zh/zh/docs/alerting/log-rules.md)
* 接入 ES / OpenSearch 集群：[ElasticSearch / OpenSearch](https://n9e.github.io/zh/zh/docs/data/elasticsearch.md)
* 接入 Loki / VictoriaLogs：[Loki / VictoriaLogs](https://n9e.github.io/zh/zh/docs/data/loki-victorialogs.md)
