---
title: "Introduction"
description: "Nightingale is an open-source project focused on alerting. Similar to Grafana's data source integration approach, Nightingale also connects with various existing data sources. However, while Grafana focuses on visualization, Nightingale emphasizes alerting engines."
date: 2020-10-06T00:48:57+08:00
lastmod: 2025-01-25T22:33:27+08:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 100
toc: true
---

Nightingale is an open-source project focused on alerting. Similar to Grafana's data source integration approach, Nightingale also connects with various existing data sources. However, while Grafana focuses on visualization, Nightingale focuses on alerting.

## Repo

- Backend: [https://github.com/ccfos/nightingale](https://github.com/ccfos/nightingale)
- Frontend: [https://github.com/n9e/fe](https://github.com/n9e/fe)

Any issues or PRs are welcome!

## Architecture

<img src="/img/prologue/intro/product-arch.png" />
<br />
<br />

Nightingale can integrate with various data sources such as Prometheus, VictoriaMetrics, Elasticsearch, and Loki. It queries metrics and logs based on the alert rules configured by users, makes alert determinations, and then generates alert events, which are pushed to various notification channels.

## Key Capabilities

<img src="/img/prologue/intro/alert-rules.png" />
<br />
<br />

Nightingale enables flexible alarm configuration. It supports both metric and log data sources. Users can configure aspects such as the active time periods of alarm rules, the clusters in which the rules are effective, and event relabeling.

<img src="/img/prologue/intro/dashboard-host.png" />
<br />
<br />

Although Nightingale's visualization capabilities are not as strong as those of Grafana, it still supports common dashboard chart types. Moreover, it has built-in alarm rules and dashboards for various middleware and databases, making it ready-to-use. 

