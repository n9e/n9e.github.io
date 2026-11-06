BLOG

# Nightingale Blog

Notes on alerting, Prometheus and Kubernetes monitoring from the Nightingale maintainers: data from our rule library, migration guides and design write-ups.

[Alerting](https://n9e.io/blog/tags/alerting.md)[Prometheus](https://n9e.io/blog/tags/prometheus.md)[Grafana](https://n9e.io/blog/tags/grafana.md)[SQL](https://n9e.io/blog/tags/sql.md)[Data](https://n9e.io/blog/tags/data.md)[Kubernetes](https://n9e.io/blog/tags/kubernetes.md)[AI and MCP](https://n9e.io/blog/tags/ai.md)[High availability](https://n9e.io/blog/tags/high-availability.md)[Migration](https://n9e.io/blog/tags/migration.md)

[![](https://n9e.io/img/blog/grafana-alerting-vs-alertmanager.webp)](https://n9e.io/blog/grafana-alerting-vs-alertmanager.md)

## [Grafana Alerting vs Alertmanager: rules, routing and coexistence](https://n9e.io/blog/grafana-alerting-vs-alertmanager.md)

Compare Grafana Alerting with Prometheus and Alertmanager: rule ownership, data sources, notification routing, coexistence and a practical way to choose.

Nov 5, 2026·7

<!-- -->

min read

* [Prometheus](https://n9e.io/blog/tags/prometheus.md)
* [Alerting](https://n9e.io/blog/tags/alerting.md)
* [Grafana](https://n9e.io/blog/tags/grafana.md)

[![](https://n9e.io/img/blog/sql-query-alerting-mysql.webp)](https://n9e.io/blog/sql-query-alerting-mysql.md)

## [SQL query alerting: monitor failed orders in MySQL](https://n9e.io/blog/sql-query-alerting-mysql.md)

Build a MySQL query alert for failed orders with Nightingale: a bounded SQL window, numeric result fields, stable labels, recovery behavior and query-cost checks.

Nov 5, 2026·8

<!-- -->

min read

* [SQL](https://n9e.io/blog/tags/sql.md)
* [Alerting](https://n9e.io/blog/tags/alerting.md)

[![](https://n9e.io/img/blog/alert-for-duration.webp)](https://n9e.io/blog/prometheus-alert-for-duration.md)

## [How long should a Prometheus alert wait? Data from 692 rules](https://n9e.io/blog/prometheus-alert-for-duration.md)

We counted the for duration and severity of 692 alert rule templates. 44% use the 60s default. Here is when for: 0, 60s, 15m and 1h are the right choice.

Nov 1, 2026·9

<!-- -->

min read

* [Alerting](https://n9e.io/blog/tags/alerting.md)
* [Prometheus](https://n9e.io/blog/tags/prometheus.md)
* [Data](https://n9e.io/blog/tags/data.md)

[![](https://n9e.io/img/blog/kubernetes-metrics-sources.webp)](https://n9e.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

## [kube-state-metrics vs metrics-server: which should you use?](https://n9e.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

Compare kube-state-metrics and metrics-server, then see where cAdvisor and node\_exporter fit for autoscaling, resource monitoring and Kubernetes alerts.

Nov 1, 2026·9

<!-- -->

min read

* [Kubernetes](https://n9e.io/blog/tags/kubernetes.md)
* [Prometheus](https://n9e.io/blog/tags/prometheus.md)
* [Alerting](https://n9e.io/blog/tags/alerting.md)

[![](https://n9e.io/img/blog/mcp-server-design.webp)](https://n9e.io/blog/mcp-server-for-alerting.md)

## [MCP server for alerting: six design decisions](https://n9e.io/blog/mcp-server-for-alerting.md)

How Nightingale's built-in MCP server handles permissions, write access and audit: RBAC inherited from the token, write tools unregistered by default, no delete tools, and one caveat.

Nov 1, 2026·7

<!-- -->

min read

* [AI and MCP](https://n9e.io/blog/tags/ai.md)
* [Alerting](https://n9e.io/blog/tags/alerting.md)

[![](https://n9e.io/img/blog/prometheus-high-availability.webp)](https://n9e.io/blog/prometheus-high-availability.md)

## [Prometheus high availability: storage vs alerting](https://n9e.io/blog/prometheus-high-availability.md)

Running two Prometheus replicas solves half of high availability. How Alertmanager clustering, replica labels and Thanos, Mimir or VictoriaMetrics deduplication fit together.

Nov 1, 2026·7

<!-- -->

min read

* [Prometheus](https://n9e.io/blog/tags/prometheus.md)
* [High availability](https://n9e.io/blog/tags/high-availability.md)
* [Alerting](https://n9e.io/blog/tags/alerting.md)

[![](https://n9e.io/img/blog/symptom-based-alerting.webp)](https://n9e.io/blog/symptom-based-alerting.md)

## [Symptom-based alerting with Prometheus](https://n9e.io/blog/symptom-based-alerting.md)

Symptom-based vs cause-based alerting with real Prometheus rules: error ratio, latency and probe alerts that page, and where CPU, disk and certificate alerts still belong.

Nov 1, 2026·7

<!-- -->

min read

* [Alerting](https://n9e.io/blog/tags/alerting.md)
* [Prometheus](https://n9e.io/blog/tags/prometheus.md)

[![](https://n9e.io/img/blog/zabbix-to-prometheus.webp)](https://n9e.io/blog/migrate-zabbix-to-prometheus.md)

## [Migrating from Zabbix to Prometheus](https://n9e.io/blog/migrate-zabbix-to-prometheus.md)

A concept-by-concept map from Zabbix to Prometheus: hosts, items, triggers, LLD, dependencies, maintenance. Plus the gaps with no equivalent and a migration order that never turns Zabbix off.

Nov 1, 2026·7

<!-- -->

min read

* [Migration](https://n9e.io/blog/tags/migration.md)
* [Prometheus](https://n9e.io/blog/tags/prometheus.md)
* [Alerting](https://n9e.io/blog/tags/alerting.md)
