---
title: "Config datasource"
date: 2025-01-26T11:15:54+08:00
lastmod: 2025-01-26T11:15:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 100
toc: true
---

Nightingale supports various data sources, including:

- Prometheus, as well as other storage systems that support the Prometheus protocol, such as VictoriaMetrics and Thanos
- ElasticSearch, as well as other storage systems that support the ElasticSearch protocol, such as OpenSearch
- Grafana Loki

Add a data source in the `Integrations-Data sources`, select the corresponding data source type, fill in the data source address, username, password, and other information, and click Save.

<img src="/img/usage/datasource/list_en.png" alt="Data sources"/>