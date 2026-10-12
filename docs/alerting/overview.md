# Alert rules

Rules are configured in the UI, scoped by business group, graded S1 / S2 / S3, and can span several data sources. A library of common rules ships with the install.

Last reviewed 2026-10-10

## [Create the first rule](https://n9e.github.io/docs/alerting/first-rule.md)

[A rule from scratch: pick the source, write the query, set severity, test fire it, and watch the event appear.](https://n9e.github.io/docs/alerting/first-rule.md)

## [Metric rules](https://n9e.github.io/docs/alerting/metric-rules.md)

[Metric rules put the threshold inside the PromQL expression; one rule can carry several severities, and the labels the query returns land on the event for routing.](https://n9e.github.io/docs/alerting/metric-rules.md)

## [Log rules](https://n9e.github.io/docs/alerting/log-rules.md)

[Alert on log counts or matched patterns from ElasticSearch, OpenSearch, Loki and VictoriaLogs — all four alert, but only three can be previewed in the Log explorer.](https://n9e.github.io/docs/alerting/log-rules.md)

## [SQL-backed rules](https://n9e.github.io/docs/alerting/sql-rules.md)

[Rules that run a SQL statement against MySQL, PostgreSQL, ClickHouse, Doris, TDengine or IoTDB on a schedule.](https://n9e.github.io/docs/alerting/sql-rules.md)

## [Scope by business group and data source](https://n9e.github.io/docs/alerting/scope.md)

[A rule has two scopes: the business group decides who may edit it and owns its events; the data source list decides which instances it queries, and can span several.](https://n9e.github.io/docs/alerting/scope.md)

## [Labels, annotations and severity](https://n9e.github.io/docs/alerting/labels-severity.md)

[Attach labels for routing, write annotations that read well in a notification, and choose S1 / S2 / S3 deliberately.](https://n9e.github.io/docs/alerting/labels-severity.md)

## [Evaluation interval and recovery](https://n9e.github.io/docs/alerting/evaluation.md)

[Four timing fields on a rule — interval, for-duration, observation window, recovery — decide when an event is created, when it recovers and when it re-notifies.](https://n9e.github.io/docs/alerting/evaluation.md)

## [Test fire a rule](https://n9e.github.io/docs/alerting/test-fire.md)

[Fire a rule on demand to check the query, labels and the rendered notification before it goes live.](https://n9e.github.io/docs/alerting/test-fire.md)

## [Inspect evaluation execution records](https://n9e.github.io/docs/alerting/execution-records.md)

[Every evaluation leaves a record: see what the query returned and why an event did or did not fire.](https://n9e.github.io/docs/alerting/execution-records.md)

## [Rule templates and built-in rules](https://n9e.github.io/docs/alerting/templates.md)

[Nightingale ships rule templates for MySQL, Redis, Kubernetes and sixty other components; import them into any business group, and save your own rules as templates.](https://n9e.github.io/docs/alerting/templates.md)

## [Import, export and reuse](https://n9e.github.io/docs/alerting/import-export.md)

[Move rules between environments as JSON, and keep them in version control.](https://n9e.github.io/docs/alerting/import-export.md)

## [Rule design best practices](https://n9e.github.io/docs/alerting/best-practices.md)

[Opinions on rule design: alert only on what needs a person, leave trends to dashboards, size a rule to one class of object, and review so the rule set does not rot.](https://n9e.github.io/docs/alerting/best-practices.md)

## [Should high CPU load trigger an alert?](https://n9e.github.io/docs/faq/cpu-alerting.md)

[Decide CPU alert conditions, severity and delivery from business impact and a concrete response, then attach a runbook.](https://n9e.github.io/docs/faq/cpu-alerting.md)
