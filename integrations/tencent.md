---
title: "Monitor Tencent Cloud with Nightingale"
sidebar_label: "Tencent Cloud"
description: "Scrape Cloud Monitor metrics converted to Prometheus format by the tencentcloud-exporter; templates cover CVM, CKafka, PostgreSQL, Redis, TDSQL-C and load balancers."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Tencent
toc_max_heading_level: 2
mdx:
  format: md
---

Tencent Cloud metrics come from its Cloud Monitor service. The `tencentcloud-exporter` maintained by Tencent Cloud converts them per product into Prometheus metrics named `qce_<product>_<metric>`, which the Categraf `prometheus` input scrapes.

The templates ship one dashboard per product: CVM instances, CKafka, Cloud PostgreSQL, Redis (memory edition), TDSQL-C for MySQL, and public and private load balancers. The metric reference further down lists Tencent Cloud's monitoring metrics per product with meaning, unit and dimensions.

## What's in the template

- **7 dashboards**, 137 panels in total

## How to connect

Deploy the [tencentcloud-exporter](https://github.com/TencentCloud/tencentcloud-exporter) and configure it with an API key plus the products and regions to collect. Once `http://<exporter>:9123/metrics` responds, scrape it with the Categraf `prometheus` input:

```toml
# conf/input.prometheus/tencentcloud.toml
interval = 60

[[instances]]
urls = ["http://<exporter>:9123/metrics"]
labels = { job = "tencentcloud" }
```

1. Open the integration center in Nightingale, find Tencent Cloud, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| CVM | 15 |
| Ckafka | 10 |
| Postgres | 51 |
| Redis - Memory Edition | 16 |
| TDSQL-C(Mysql) | 11 |
| Load Balancer (Public) | 17 |
| Load Balancer (Private) | 17 |

## Related

- [Tencent Cloud template source](https://github.com/ccfos/nightingale/tree/main/integrations/Tencent): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
