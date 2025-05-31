---
title: "配置数据源"
description: "夜莺监控（Nightingale）支持对接各类数据源，包括 Prometheus、ElasticSearch 和 Grafana Loki 等。通过配置数据源，夜莺可以查询展示这些数据源中的监控数据，也可以对这些数据源中的数据进行告警。"
date: 2025-01-26T11:15:54+08:00
lastmod: 2025-05-31T17:50:57.530+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 1000
toc: true
---

夜莺支持对接各类数据源，前期支持的数据源，比如 Prometheus、VictoriaMetrics、ElasticSearch 等，既支持查询看图，也支持告警。后面随着项目发展，夜莺定位为一个告警引擎，数据源的查询看图功能会逐渐弱化，主要还是用于告警。所以新对接的数据源，比如 ClickHouse、MySQL、Postgres 等，都是只支持告警，不支持查询看图。

在 `集成中心-数据源` 中添加数据源，选择对应的数据源类型，填写数据源的地址、用户名、密码等信息，点击保存即可。

<img src="/img/usage/datasource/list_zh.png" alt="数据源"/>

配置数据源时，除了要填写数据源的连接地址，另一个关键点是要选择关联的告警引擎，如果你的数据源是在边缘机房的，并且为边缘机房搭建了专属的 n9e-edge，那么就选择对应的 n9e-edge 作为关联的告警引擎。

数据源配置中，表单各项基本都对应有 tooltip（就是各个 form 表单旁边的小问号 icon，鼠标放上去可以看到用法提示），这里就不再赘述了。
