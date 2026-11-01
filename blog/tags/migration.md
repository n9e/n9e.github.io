# One post tagged with "Migration"

Moving between monitoring and alerting systems.

[View all tags](https://n9e.github.io/blog/tags.md)

## [Migrating from Zabbix to Prometheus](https://n9e.github.io/blog/migrate-zabbix-to-prometheus.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![From Zabbix hosts, items and triggers to Prometheus targets, metrics and one alert rule covering every host](https://n9e.github.io/assets/images/zabbix-to-prometheus-ab76e9ac8ebf08826765513529b49986.webp)

Moving from Zabbix to Prometheus is not a data migration. There is no export file that turns into rule files, and no tool that converts triggers into PromQL. The two systems model monitoring differently. Most of the work is translating concepts, then rebuilding a smaller set of rules on top of them.

This post maps each Zabbix concept to its Prometheus counterpart, lists the parts that have no equivalent, and suggests an order of work that keeps Zabbix running until the end.

**Tags:**

* [Migration](https://n9e.github.io/blog/tags/migration.md "Moving between monitoring and alerting systems.")
* [Prometheus](https://n9e.github.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.github.io/blog/migrate-zabbix-to-prometheus.md)
