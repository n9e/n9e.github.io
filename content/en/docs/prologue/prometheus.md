---
title: "Nightingale vs Prometheus"
description: "Nightingale and Prometheus are often discussed in relation to each other, and in fact, they have a complementary relationship. This article will detail the differences and connections between the two."
date: 2025-07-26T13:12:27.760+08:00
lastmod: 2025-07-26T13:12:27.760+08:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 150
toc: true
---

Nightingale is similar to Grafana in that it can integrate with a variety of data sources, the most common of which is Prometheus-type. Other data sources that are compatible with the Prometheus interface, such as VictoriaMetrics, Thanos, and M3DB, can also be considered Prometheus-type sources, so the relationship between the two is close.

If you have the following requirements, you might consider using Nightingale:

- You have multiple time-series databases, such as Prometheus and VictoriaMetrics, and want to use a unified platform to manage various alert rules with permission control.
- You are concerned about the single point of failure of Prometheus's alerting engine and want to avoid downtime.
- In addition to Prometheus alerts, you need alerts from other data sources such as ElasticSearch, Loki, and ClickHouse.
- You require more flexible alert rule configurations, such as controlling the effective time, event relabeling, event linkage with CMDB, and supporting alert self-healing scripts.

Nightingale also has visualization capabilities similar to Grafana, but it may not be as advanced. In my observation, many companies adopt a combination approach (in the adult world, there are no absolutes):

- Data Collection: A combination of various agents and exporters is used, with Categraf being the primary choice (especially for machine monitoring, seamlessly integrated with Nightingale), supplemented by various exporters.
- Storage: The time-series database primarily used is VictoriaMetrics, as it is compatible with Prometheus, offers better performance, and has a clustered version. For most companies, the single-node version is sufficient.
- Alerting Engine: Nightingale is used for alerting, making it easy for different teams to manage and collaborate. It comes with some built-in rules out of the box, and the configuration of alert rules is very flexible, with an event pipeline mechanism that facilitates integration with their own CMDB, etc.
- Visualization: Grafana is used for visualization, as it offers more advanced and visually appealing charts. The community is also very large, and many pre-made dashboards can be found on the Grafana site, making it relatively hassle-free.
- On-call Distribution of Alert Events: [FlashDuty](https://flashcat.cloud/product/flashduty/) is used, which supports integration with various monitoring systems such as Zabbix, Prometheus, Nightingale, cloud monitoring solutions, Elastalert, etc. It consolidates alert events into a single platform for unified noise reduction, scheduling, claim escalation, response, distribution, and more.
