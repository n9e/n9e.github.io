---
title: "配置告警规则"
date: 2025-01-26T11:45:54+08:00
lastmod: 2025-01-26T11:45:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 140
toc: true
---

夜莺支持指标告警和日志告警，根据用户配置的告警规则，周期性查询数据源，当数据源中的数据满足告警阈值时，触发告警。

<img src="/img/usage/alerting/list_zh.png" alt="告警规则"/>
<br />
<br />

你可以手工创建告警规则，或导入内置的告警规则，或导入 Prometheus 的告警规则。

