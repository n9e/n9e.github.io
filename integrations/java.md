# Monitor Java applications (JVM) with Nightingale

JVM memory, GC, threads and class loading exposed via the JMX Exporter or the OpenTelemetry Java Agent; one dashboard set for each metric naming.

Last reviewed 2026-10-31

Monitoring a Java application mostly means monitoring the JVM: heap and non-heap memory, GC count and pause time per generation, thread count and deadlocks, class loading, file descriptors. The two common ways of exposing these produce different metric names, so the templates are split:

* `JMX` and `JMX - Kubernetes`: the application loads the Prometheus JMX Exporter Java Agent and emits `jvm_memory_*`, `jvm_gc_collection_seconds_*` and friends.
* `JVM by OpenTelemetry`: the application loads the OpenTelemetry Java Agent and an OTel Collector converts the data to Prometheus metrics.

The two sets do not mix. Spring Boot applications can also go through Actuator; see the [Spring Boot integration](https://n9e.github.io/integrations/springboot.md).

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **3 dashboards**, 74 panels in total

## How to connect[​](#how-to-connect "Direct link to How to connect")

Taking the JMX Exporter as the example: add `-javaagent:jmx_prometheus_javaagent.jar=9404:config.yaml` to the JVM options, check that `http://<host>:9404/metrics` responds, then scrape it with the Categraf `prometheus` input:

```
# conf/input.prometheus/java-jmx.toml

[[instances]]

urls = ["http://127.0.0.1:9404/metrics"]

url_label_key = "instance"

url_label_value = "{{.Host}}"

labels = { job = "order-service" }
```

Put the application name in the `job` label; the dashboards filter on it. If a Prometheus already scrapes these targets, [add it as a data source](https://n9e.github.io/docs/data/prometheus.md) instead.

1. Open the integration center in Nightingale, find Java, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard             | Panels |
| --------------------- | ------ |
| JMX                   | 26     |
| JMX - Kubernetes      | 26     |
| JVM by OpenTelementry | 22     |

## Related[​](#related "Direct link to Related")

* [Java template source](https://github.com/ccfos/nightingale/tree/main/integrations/Java): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Walkthrough: monitor Java applications](https://n9e.github.io/docs/practice/java.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
