---
title: "即时查询"
description: "夜莺监控（Nightingale）支持 Ad-hoc 查询，可以在界面上直接查询数据源的数据。既可以查询时序指标数据，也可以查询日志数据。"
date: 2025-01-26T11:23:54+08:00
lastmod: 2025-05-31T22:48:53.293+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 1100
toc: true
---

夜莺支持 Ad-hoc 查询，可以在界面上直接查询数据源的数据。菜单入口在 `数据查询` 下面，选择 `指标` 可以查询指标数据，选择 `日志` 可以查询日志数据。

## 指标查询

下面是一个指标查询样例：

<img src="/img/usage/ad-hoc/metric-explorer_zh.png" alt="指标查询"/>

这个页面和 Prometheus 的 `graph` 页面类似，支持查询时序指标数据。当然也做了一些增强，增加了内置指标、历史记录等等一些能力。上图中是一个 range vector，且使用的 Table 视图，此时夜莺会多做一步，计算各个数据的时间差，就是最右侧那个 `+15`，方便我们排查是否有数据丢失的情况，比如大都是规律的时间差，和采集频率一致，但是突然发现有两个时间差比较大，是好几倍的采集频率，那就表示有数据采集或传输失败了。

> 🎯 常见问题：这个页面一进来为啥看不到任何数据。这是符合预期的，需要先输入 Promql 进行查询，然后才能看到数据。而非一进来这个页面就可以看到数据。Promql 是使用 Prometheus、Nightingale 的前置知识，建议先学习 Promql 的基础知识，资料参考：《[Promql系列教程](https://flashcat.cloud/tags/promql/)》

如果使用的采集器是 Categraf，可以查询 `cpu_usage_active` 这个指标，如果能查到，说明数据源配置是 OK 的。如果使用的采集器是 Node-Exporter，那可以查询 `node_load1` 这个指标，如果能查到，说明数据源配置是 OK 的。

## 日志查询

日志查询主要是支持的 ElasticSearch 数据源，配置 ElasticSearch 数据源的时候，有个版本字段很多人会有困惑，如果你是 `6.x` 版本的 ElasticSearch，那么就选择 `6.0+` 版本，如果是 `7.x` 版本的 ElasticSearch，就选择 `7.0+` 版本，如果是更高版本，也直接选择 `7.0+` 版本，如果遇到不兼容的情况，提 issues 反馈即可。

配置完了数据源之后，可以在 `数据查询-日志` 页面进行查询，下面是一个日志查询样例：

<img src="/img/usage/ad-hoc/log-explorer_zh.png" alt="日志查询"/>

和 Kibana 的日志查询页面很像，夜莺这里既可以支持按照索引模式查询，也可以不创建索引模式，直接查询索引（支持通配符），不过直接查询索引不是一个好的实践，后面可能会下掉这个功能。另外查询语法支持 KQL 和 Lucene（即 query string）两种，对于 ElasticSearch 的玩家而言，这些概念都不陌生，这里就不赘述了。

数据源配置成功之后，下一步就可以进入重头戏了，配置告警规则，体验夜莺的告警引擎能力。
