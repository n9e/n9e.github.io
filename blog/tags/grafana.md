# One post tagged with "Grafana"

Grafana Alerting, data sources and notification workflows.

[View all tags](https://n9e.io/blog/tags.md)

## [Grafana Alerting vs Alertmanager: rules, routing and coexistence](https://n9e.io/blog/grafana-alerting-vs-alertmanager.md)

November 5, 2026 ·

<!-- -->

7 min read

Eric Qin

![Two alerting paths: Prometheus rules and Grafana-managed rules can both send alerts to an external Alertmanager](https://n9e.io/assets/images/grafana-alerting-vs-alertmanager-41493bc27d0f814667ae50923227c1ad.webp)

**Choose Prometheus with Alertmanager when your rules belong with your metrics and are maintained as code. Choose Grafana-managed alerting when you need Grafana to evaluate queries across supported data sources and manage conditions through its UI or provisioning tools.** You can also keep Prometheus rules, add Grafana-managed rules for other data, and use the same external Alertmanager for notification delivery.

The important decision is where a rule runs and who owns its notifications. Here is how to make those choices without evaluating the same condition twice.

**Tags:**

* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")
* [Grafana](https://n9e.io/blog/tags/grafana.md "Grafana Alerting, data sources and notification workflows.")

[**Read more**](https://n9e.io/blog/grafana-alerting-vs-alertmanager.md)
