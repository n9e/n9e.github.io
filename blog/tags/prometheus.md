# 6 posts tagged with "Prometheus"

Prometheus metrics, rules and operations.

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

## [How long should a Prometheus alert wait? Data from 692 rules](https://n9e.io/blog/prometheus-alert-for-duration.md)

November 1, 2026 ·

<!-- -->

9 min read

Eric Qin

![A histogram of for durations across 692 alert rule templates, with 304 rules at 60 seconds](https://n9e.io/assets/images/alert-for-duration-8a11aeeb3b53ac4cd26ec55c82f56d39.webp)

Every alert rule answers two questions: what counts as bad, and how long it has to stay bad. Most review effort goes into the first one, the expression and the threshold. The second is the `for` duration, and it often gets whatever value the tool filled in.

We wanted to know how often that happens, so we counted. Nightingale ships alert rule templates for 49 integrations. **692 rules, and 304 of them (44%) have a `for` duration of exactly 60 seconds**, which is the default in Nightingale's rule editor. This post walks through what the numbers show and what `for` value suits which kind of alert.

**Tags:**

* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")
* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Data](https://n9e.io/blog/tags/data.md "Posts built on numbers from Nightingale's own templates and rule library.")

[**Read more**](https://n9e.io/blog/prometheus-alert-for-duration.md)

## [kube-state-metrics vs metrics-server: which should you use?](https://n9e.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

November 1, 2026 ·

<!-- -->

9 min read

Eric Qin

![Four Kubernetes metric sources: kube-state-metrics, cAdvisor, node\_exporter and metrics-server](https://n9e.io/assets/images/kubernetes-metrics-sources-29962af59a23c3f84206f81323ffa542.webp)

**kube-state-metrics exposes Kubernetes object state for monitoring; metrics-server supplies recent CPU and memory usage through the Metrics API for autoscaling and `kubectl top`.** A Deployment's missing replicas and a Pod's current CPU usage are different questions. A cluster that needs both autoscaling and object-state alerts will commonly use both components.

For a full monitoring setup, add the other two sources: cAdvisor for container resource usage and node\_exporter for the host underneath. This post explains which component answers each question, where to scrape it, and the metric renames that can break an otherwise valid alert query.

**Tags:**

* [Kubernetes](https://n9e.io/blog/tags/kubernetes.md "Monitoring and alerting on Kubernetes clusters.")
* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

## [Prometheus high availability: storage vs alerting](https://n9e.io/blog/prometheus-high-availability.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![Two Prometheus replicas writing to deduplicated storage and sending alerts to a clustered Alertmanager](https://n9e.io/assets/images/prometheus-high-availability-116818454807068016c0d755e596c981.webp)

Ask how to make Prometheus highly available and the usual answer is "run two of them". That is correct, and it is only half the job. Two replicas give you two copies of every alert and two slightly different copies of every time series. Each needs its own fix, and the fixes don't share a configuration.

This post separates the two problems: keeping alerts flowing exactly once, and keeping the data queryable without gaps. It ends with a checklist.

**Tags:**

* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [High availability](https://n9e.io/blog/tags/high-availability.md "Keeping monitoring and alerting up when parts of it fail.")
* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.io/blog/prometheus-high-availability.md)

## [Symptom-based alerting with Prometheus](https://n9e.io/blog/symptom-based-alerting.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![A greyed-out CPU alert next to a highlighted checkout error-rate alert](https://n9e.io/assets/images/symptom-based-alerting-f69a35ab01ce77da6511c872a7877225.webp)

At 3 a.m. an alert says CPU is at 92% on `db-3`. The on-call engineer opens the dashboards. Checkout is fast, errors are flat, and nobody is affected. The alert was true and useless.

A week later, checkout fails for 20 minutes because a dependency returns errors. CPU is fine, memory is fine, every host looks healthy. No alert fires.

Both failures have the same root cause: the rules watch *causes*, not *symptoms*. This post explains the difference, shows what symptom rules look like in PromQL, and explains where cause alerts still earn their place.

**Tags:**

* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")
* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")

[**Read more**](https://n9e.io/blog/symptom-based-alerting.md)

## [Migrating from Zabbix to Prometheus](https://n9e.io/blog/migrate-zabbix-to-prometheus.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![From Zabbix hosts, items and triggers to Prometheus targets, metrics and one alert rule covering every host](https://n9e.io/assets/images/zabbix-to-prometheus-ab76e9ac8ebf08826765513529b49986.webp)

Moving from Zabbix to Prometheus is not a data migration. There is no export file that turns into rule files, and no tool that converts triggers into PromQL. The two systems model monitoring differently. Most of the work is translating concepts, then rebuilding a smaller set of rules on top of them.

This post maps each Zabbix concept to its Prometheus counterpart, lists the parts that have no equivalent, and suggests an order of work that keeps Zabbix running until the end.

**Tags:**

* [Migration](https://n9e.io/blog/tags/migration.md "Moving between monitoring and alerting systems.")
* [Prometheus](https://n9e.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.io/blog/migrate-zabbix-to-prometheus.md)
