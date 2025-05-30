---
title: "配置数据源"
date: 2025-01-26T11:15:54+08:00
lastmod: 2025-01-26T11:15:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 1000
toc: true
---

夜莺支持对接各类数据源，目前支持的数据源有：

- Prometheus，以及支持 Prometheus 协议的其他存储，比如 VictoriaMetrics、Thanos 等
- ElasticSearch，以及支持 ElasticSearch 协议的其他存储，比如 OpenSearch 等
- Grafana Loki

在 `集成中心-数据源` 中添加数据源，选择对应的数据源类型，填写数据源的地址、用户名、密码等信息，点击保存即可。

<img src="/img/usage/datasource/list_zh.png" alt="数据源"/>