---
title: "日志告警"
description: "夜莺监控（Nightingale）支持日志告警，可以针对 ElasticSearch、Loki、ClickHouse 中的日志数据配置告警规则，周期性查询数据源，当数据源中的数据满足告警阈值时，触发告警。"
date: 2025-06-01T16:11:07+08:00
lastmod: 2025-06-01T16:11:07+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 1300
toc: true
---

夜莺监控（Nightingale）支持日志告警，可以针对 ElasticSearch、Loki、ClickHouse 等数据源中的日志数据配置告警规则，周期性查询数据源，当数据源中的数据满足告警阈值时，触发告警。日志告警和指标告警的区别主要是查询条件的写法不同。其他各个字段都是通用的，请一定先阅读[指标告警](/zh/docs/usage/metric-alerting/)的内容，这里不再赘述。

## ElasticSearch 告警原理

ElasticSearch 支持不同的查询语法，比如 DSL、KQL、Lucene、EQL、SQL 等，夜莺作为一个告警引擎，本质就是让用户配置查询语句，然后周期性查询数据源，对查到的数据做阈值判断，满足阈值条件就触发告警。

最先支持的查询语法是 Lucene，即 query_string 方式，查到数据之后做一个基本的统计，比如做一个计数，统计一下查到的日志行数，或者针对日志中的某个字段做统计，计算其平均、最大值、分位值等。然后把统计结果和用户配置的阈值进行对比，满足阈值条件就触发告警。

## ElasticSearch 告警配置

首先是配置数据源，即当前告警规则要生效到哪些 ElasticSearch 数据源上，这个和指标告警本质是一样的逻辑。

<img src="/img/usage/logs-alerting/01.png" alt="选择 ElasticSearch 数据源"/>

> 🟢 数据源的类型那里，只有配置了对应类型的数据源，这里才会展示。即：如果你只配置了 Prometheus 类型的数据源，创建告警规则的时候，是看不到 ElasticSearch、TDEngine、ClickHouse 等其他类型的。

然后配置查询统计条件：

<img src="/img/usage/logs-alerting/02.png" alt="ElasticSearch 告警规则 - 配置查询统计条件"/>

首先要选择索引，支持通配符，我上面配置的是 `fc*`，然后最关键的是过滤条件，我上面配置的是 `message.status:>100`，过滤 `message.status` 字段大于 100 的日志。这个过滤条件是 Lucene 的语法，和 Kibana 的查询语法是不一样的。日志必然有个日期字段，需要通过配置告知夜莺，哪个字段是日期字段，然后配置一个时间间隔，上图配置的是 5 分钟，夜莺就根据日期字段过滤最近 5 分钟的数据。

然后下面是统计分析方法，上例中选择的是 `count`，表示统计日志行数，并且没有任何 Group By 条件。

最后是阈值判断，即把上面 `count` 的结果，和阈值做比对，如果符合条件就产生告警事件。上例中阈值是 `> 0` 就告警，即 `count` 的结果大于 0 就告警。

稍等片刻，我们可以看到产生的告警事件：

<img src="/img/usage/logs-alerting/03.png" alt="ElasticSearch 历史告警事件"/>

## ElasticSearch 过滤条件

过滤条件（即上例中的 `message.status:>100`）还有哪些写法？可以点击过滤条件旁边的那个小问号的图标，会在侧拉板中展示过滤条件的写法样例说明。一些典型的写法如下：

- `status:active` 查询 status 字段包含 active 的记录
- `title:(quick OR brown)` 查询 title 字段包含 quick 或 brown 的记录
- `author:"John Smith"` 查询 author 字段包含完整短语 “John Smith” 的记录
- `count:[1 TO 5]` 数据范围查询，闭区间，即包含 1 和 5
- `date:[2022-01-01 TO 2022-12-31]` 日期范围查询
- `age:>=10` 数值大小过滤，大于等于 10

注意，为了避免犯错，建议字段后面的冒号`:`前后都不要加空格。另外，不同的条件之间可以使用 AND、OR 连接，比如 `status:active AND age:>=10`。更多写法请参考 [ElasticSearch 的官方文档](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-query-string-query)。

