---
title: "Data Sources"
description: "Nightingale monitoring supports integration with various data sources, including Prometheus, ElasticSearch, Grafana Loki, etc. By configuring data sources, Nightingale can query and display monitoring data from these sources, as well as set up alerts based on the data in them."
date: 2025-07-26T17:16:07.929+08:00
lastmod: 2025-07-26T17:16:07.929+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 1000
toc: true
---

Nightingale supports integration with various data sources. Early supported data sources, such as Prometheus, VictoriaMetrics, ElasticSearch, etc., support both querying/visualization and alerting. As the project has evolved, Nightingale has positioned itself as an alert engine. Therefore, newly integrated data sources like ClickHouse, MySQL, Postgres, etc., only support alerting and not querying/visualization.

Whether you want to view data from a data source or set up alerts based on its data, you first need to configure the data source. Add a data source in `Integrations - Data sources`, select the corresponding data source type, fill in the data source's address, username, password, etc., and click save.

<img src="/img/usage/datasource/list_en.png" alt="Data Sources"/>

When configuring a data source, in addition to filling in the connection address of the data source, another key point is to select the associated alert engine. If your data source is in an edge computer room and you have built a dedicated n9e-edge for the edge computer room, then select the corresponding n9e-edge as the associated alert engine.

In the data source configuration, each form item basically has a tooltip (the small question mark icon next to each form field; you can see usage prompts by hovering the mouse over it), which will not be repeated here.

After configuring the data source, you can check the time series database data on the [Ad-hoc Query page](/docs/usage/ad-hoc/). If data can be retrieved, it indicates that the data source configuration is correct.

## FAQ

**1. The writer address of the data source is already configured in Nightingale's config.toml file. Is it necessary to configure it repeatedly on the page?**

Yes. The writer address in config.toml is used for the data forwarding link, while the data source configuration on the page is used for querying and alerting. They are different concepts. In addition, the writer address should be a remote write address, while the data source configuration on the page is usually the base address of the data source. Moreover, many users do not use Nightingale to forward monitoring metrics, so they do not configure the writer address in config.toml and only configure the data source on the page.

**2. I want to use the edge mode to alert on the time series database in the edge computer room, but the central n9e cannot connect to the edge time series database. Can Nightingale still be used for unified alerting in this case?**

Yes. Such edge time series databases still need to be added on the page. When adding, select "Save" instead of "Test and Save". This way, the central Nightingale will not verify connectivity and will save successfully directly. At the same time, when configuring the data source, configure the intranet address of the time series database and select an n9e-edge alert engine that can connect to the time series database. Then, n9e-edge will use the intranet address of the time series database for querying and alerting.

In this case, the edge time series database can still trigger alerts, but its data cannot be queried on the Nightingale page. Because Nightingale's page queries data through the central n9e, and the central n9e cannot connect to the edge time series database, so queries are not possible.