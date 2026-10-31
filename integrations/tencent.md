# Monitor Tencent Cloud with Nightingale

Scrape Cloud Monitor metrics converted to Prometheus format by the tencentcloud-exporter; templates cover CVM, CKafka, PostgreSQL, Redis, TDSQL-C and load balancers.

Last reviewed 2026-10-31

Tencent Cloud metrics come from its Cloud Monitor service. The `tencentcloud-exporter` maintained by Tencent Cloud converts them per product into Prometheus metrics named `qce_<product>_<metric>`, which the Categraf `prometheus` input scrapes.

The templates ship one dashboard per product: CVM instances, CKafka, Cloud PostgreSQL, Redis (memory edition), TDSQL-C for MySQL, and public and private load balancers. The metric reference further down lists Tencent Cloud's monitoring metrics per product with meaning, unit and dimensions.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **7 dashboards**, 137 panels in total

## How to connect[​](#how-to-connect "Direct link to How to connect")

Deploy the [tencentcloud-exporter](https://github.com/TencentCloud/tencentcloud-exporter) and configure it with an API key plus the products and regions to collect. Once `http://<exporter>:9123/metrics` responds, scrape it with the Categraf `prometheus` input:

```
# conf/input.prometheus/tencentcloud.toml

interval = 60



[[instances]]

urls = ["http://<exporter>:9123/metrics"]

labels = { job = "tencentcloud" }
```

1. Open the integration center in Nightingale, find Tencent Cloud, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard               | Panels |
| ----------------------- | ------ |
| CVM                     | 15     |
| Ckafka                  | 10     |
| Postgres                | 51     |
| Redis - Memory Edition  | 16     |
| TDSQL-C(Mysql)          | 11     |
| Load Balancer (Public)  | 17     |
| Load Balancer (Private) | 17     |

## Related[​](#related "Direct link to Related")

* [Tencent Cloud template source](https://github.com/ccfos/nightingale/tree/main/integrations/Tencent): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
