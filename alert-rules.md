# Prometheus alert rules with runbooks

238 Prometheus alert rules for 8 services, including Kubernetes, Linux, MySQL and Redis. Every rule has a PromQL condition, a severity, a duration and runbook steps. Free to download as Prometheus rules files.

Last reviewed 2026-10-31

An alert rule is only half the job: when it fires at 3 a.m., someone needs to know what to check first. This library collects 238 PromQL alert rules from Nightingale's integration templates, and every one of them comes with runbook steps written for the person on call. The rules use standard exporter metric names (node\_exporter, kube-state-metrics, mysqld\_exporter and so on), so they work with plain Prometheus as well as with Nightingale.

| Service                                                             | Rules | Metrics from                                      | Download                                                                   |
| ------------------------------------------------------------------- | ----- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| [Kubernetes](https://n9e.github.io/alert-rules/kubernetes.md)       | 77    | kube-state-metrics, cAdvisor (kubelet), apiserver | [`kubernetes.yml`](https://n9e.github.io/alert-rules/kubernetes.yml)       |
| [Prometheus](https://n9e.github.io/alert-rules/prometheus.md)       | 30    | Prometheus's own /metrics, Prometheus Operator    | [`prometheus.yml`](https://n9e.github.io/alert-rules/prometheus.yml)       |
| [Linux](https://n9e.github.io/alert-rules/linux.md)                 | 76    | node\_exporter, Categraf, Telegraf                | [`linux.yml`](https://n9e.github.io/alert-rules/linux.yml)                 |
| [MySQL](https://n9e.github.io/alert-rules/mysql.md)                 | 11    | mysqld\_exporter, Categraf                        | [`mysql.yml`](https://n9e.github.io/alert-rules/mysql.yml)                 |
| [Redis](https://n9e.github.io/alert-rules/redis.md)                 | 12    | redis\_exporter, Categraf                         | [`redis.yml`](https://n9e.github.io/alert-rules/redis.yml)                 |
| [Elasticsearch](https://n9e.github.io/alert-rules/elasticsearch.md) | 11    | elasticsearch\_exporter, Categraf                 | [`elasticsearch.yml`](https://n9e.github.io/alert-rules/elasticsearch.yml) |
| [MongoDB](https://n9e.github.io/alert-rules/mongodb.md)             | 8     | mongodb\_exporter                                 | [`mongodb.yml`](https://n9e.github.io/alert-rules/mongodb.yml)             |
| [Windows](https://n9e.github.io/alert-rules/windows.md)             | 13    | windows\_exporter, Categraf                       | [`windows.yml`](https://n9e.github.io/alert-rules/windows.yml)             |

## Rule format[​](#rule-format "Direct link to Rule format")

* Each page lists every rule with its PromQL condition, severity, `for` duration and runbook steps, grouped by the collector that produces the metrics.
* Each `.yml` file is a standard Prometheus rules file and passes `promtool check rules`. Severity is a `severity` label (critical / warning / info), the summary is in `annotations.summary`, and `annotations.runbook_url` links to the rule page.
* Thresholds are starting points, not recommendations for every environment. Review them before you enable a rule.

## Why the runbooks matter[​](#why-the-runbooks-matter "Direct link to Why the runbooks matter")

A rule without a runbook moves the investigation to whoever is on call. The steps here say what to look at first (the log before the last restart, the exit code, the slow query list, the replication thread state) and what usually fixes it, so the alert carries its own first response.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

Rule expressions are partly adapted from community collections: [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) (Apache-2.0), [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0), [awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts) (CC BY 4.0). Runbook steps and the remaining rules come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0).

## Related[​](#related "Direct link to Related")

* [Integrations](https://n9e.github.io/integrations.md): collector config and dashboards for each service
* [Alert rules in Nightingale](https://n9e.github.io/docs/alerting/overview.md)
* [Rule design practices](https://n9e.github.io/docs/alerting/best-practices.md)
