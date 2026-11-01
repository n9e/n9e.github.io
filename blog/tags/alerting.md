# 6 posts tagged with "Alerting"

Designing alert rules that page for the right reasons.

[View all tags](https://n9e.github.io/blog/tags.md)

## [kube-state-metrics vs metrics-server vs cAdvisor vs node\_exporter](https://n9e.github.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![Four Kubernetes metric sources: kube-state-metrics, cAdvisor, node\_exporter and metrics-server](https://n9e.github.io/assets/images/kubernetes-metrics-sources-29962af59a23c3f84206f81323ffa542.webp)

Kubernetes metrics come from four places, and their names look alike. `kube_pod_container_resource_limits`, `container_memory_working_set_bytes`, `node_memory_MemAvailable_bytes` and the numbers in `kubectl top` all sound like they describe the same thing. They are made by different components and they answer different questions. Only three of the four are meant for monitoring.

This post explains what each component measures and how to tell which one a metric came from. It also covers the renames that make a query copied from a 2019 blog post return nothing.

**Tags:**

* [Kubernetes](https://n9e.github.io/blog/tags/kubernetes.md "Monitoring and alerting on Kubernetes clusters.")
* [Prometheus](https://n9e.github.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.github.io/blog/kube-state-metrics-vs-metrics-server-vs-cadvisor-vs-node-exporter.md)

## [How long should a Prometheus alert wait? Data from 692 rules](https://n9e.github.io/blog/prometheus-alert-for-duration.md)

November 1, 2026 ·

<!-- -->

9 min read

Eric Qin

![A histogram of for durations across 692 alert rule templates, with 304 rules at 60 seconds](https://n9e.github.io/assets/images/alert-for-duration-8a11aeeb3b53ac4cd26ec55c82f56d39.webp)

Every alert rule answers two questions: what counts as bad, and how long it has to stay bad. Most review effort goes into the first one, the expression and the threshold. The second is the `for` duration, and it often gets whatever value the tool filled in.

We wanted to know how often that happens, so we counted. Nightingale ships alert rule templates for 49 integrations. **692 rules, and 304 of them (44%) have a `for` duration of exactly 60 seconds**, which is the default in Nightingale's rule editor. This post walks through what the numbers show and what `for` value suits which kind of alert.

**Tags:**

* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")
* [Prometheus](https://n9e.github.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [Data](https://n9e.github.io/blog/tags/data.md "Posts built on numbers from Nightingale's own templates and rule library.")

[**Read more**](https://n9e.github.io/blog/prometheus-alert-for-duration.md)

## [MCP server for alerting: six design decisions](https://n9e.github.io/blog/mcp-server-for-alerting.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![An AI client asking which alerts are firing, connected with a user\&#39;s token to Nightingale\&#39;s MCP endpoint](https://n9e.github.io/assets/images/mcp-server-design-c8e30bb02b115a796a5092ccdd548d47.webp)

Since v9, the Nightingale process is also an MCP server. Claude Code, Cursor or any other MCP client can connect to `/mcp` and ask which alerts are firing, which rules are noisiest, or what a metric did over the last hour.

The tool list was the easy part. The hard questions were about trust. Whose permissions does the AI client have? What can it change? How do you find out afterwards what it did? This post walks through the six decisions we made, and one caveat we haven't solved.

**Tags:**

* [AI and MCP](https://n9e.github.io/blog/tags/ai.md "AI assistants, MCP servers and how they touch production systems.")
* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.github.io/blog/mcp-server-for-alerting.md)

## [Prometheus high availability: storage vs alerting](https://n9e.github.io/blog/prometheus-high-availability.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![Two Prometheus replicas writing to deduplicated storage and sending alerts to a clustered Alertmanager](https://n9e.github.io/assets/images/prometheus-high-availability-116818454807068016c0d755e596c981.webp)

Ask how to make Prometheus highly available and the usual answer is "run two of them". That is correct, and it is only half the job. Two replicas give you two copies of every alert and two slightly different copies of every time series. Each needs its own fix, and the fixes don't share a configuration.

This post separates the two problems: keeping alerts flowing exactly once, and keeping the data queryable without gaps. It ends with a checklist.

**Tags:**

* [Prometheus](https://n9e.github.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")
* [High availability](https://n9e.github.io/blog/tags/high-availability.md "Keeping monitoring and alerting up when parts of it fail.")
* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.github.io/blog/prometheus-high-availability.md)

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

## [Symptom-based alerting with Prometheus](https://n9e.github.io/blog/symptom-based-alerting.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![A greyed-out CPU alert next to a highlighted checkout error-rate alert](https://n9e.github.io/assets/images/symptom-based-alerting-f69a35ab01ce77da6511c872a7877225.webp)

At 3 a.m. an alert says CPU is at 92% on `db-3`. The on-call engineer opens the dashboards. Checkout is fast, errors are flat, and nobody is affected. The alert was true and useless.

A week later, checkout fails for 20 minutes because a dependency returns errors. CPU is fine, memory is fine, every host looks healthy. No alert fires.

Both failures have the same root cause: the rules watch *causes*, not *symptoms*. This post explains the difference, shows what symptom rules look like in PromQL, and explains where cause alerts still earn their place.

**Tags:**

* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")
* [Prometheus](https://n9e.github.io/blog/tags/prometheus.md "Prometheus metrics, rules and operations.")

[**Read more**](https://n9e.github.io/blog/symptom-based-alerting.md)
