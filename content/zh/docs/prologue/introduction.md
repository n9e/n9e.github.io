---
title: "夜莺项目介绍"
description: ""
date: 2025-01-25T08:48:57+08:00
lastmod: 2025-01-25T22:33:27+08:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 100
toc: true
---

夜莺项目是一个专注在告警方向的开源监控项目。类似 Grafana 可以对接各类数据源，夜莺当前可以对接 Prometheus、VictoriaMetrics、Elasticsearch、Loki 等数据源。当然，Grafana 侧重点是可视化，夜莺的侧重点是告警。

> 另外夜莺团队还开源了一个采集器 [Categraf](https://github.com/flashcatcloud/categraf)，用于采集监控数据，支持 Linux、Windows、SNMP、MySQL、Redis、Postgres、ElasticSearch、Kafka 等各类监控对象的数据采集。Categraf 当前已经支持了近百种插件（[插件列表](https://github.com/flashcatcloud/categraf/tree/main/inputs)），和夜莺丝滑对接，共同组成了一个完整的监控系统。如果你是 Exporter 重度用户，可以继续使用原来的采集方案，如果是新用户，建议使用 Categraf 作为采集器。

## 代码仓库

- 后端: [https://github.com/ccfos/nightingale](https://github.com/ccfos/nightingale)
- 前端: [https://github.com/n9e/fe](https://github.com/n9e/fe)

## 夜莺架构

<img src="/img/prologue/intro/product-arch.png" />
<br />
<br />

夜莺可以对接 Prometheus、VictoriaMetrics、Elasticsearch、Loki 等数据源，根据用户配置的告警规则查询指标和日志，做告警判定，然后生成告警事件，推送到各种通知媒介。

## 关键特性

<img src="/img/prologue/intro/alert-rules.png" />
<br />
<br />

夜莺支持灵活的告警配置，同时支持指标和日志数据源，可以配置告警规则的生效时段、生效的集群、事件 Relabel 等。

<img src="/img/prologue/intro/dashboard-host.png" />
<br />
<br />

夜莺的可视化能力虽然不如 Grafana，也支持常用的仪表盘图表类型，并且内置了各类中间件、数据库的告警规则和仪表盘，开箱即用。