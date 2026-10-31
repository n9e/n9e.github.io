# PrometheusRuleFailures alert: what it means and how to fix it

What the PrometheusRuleFailures Prometheus alert means, its common causes, the PromQL rule and the runbook steps to fix it, with a ready-to-use rule in YAML.

Last reviewed 2026-10-31

Prometheus failed to evaluate one or more alerting or recording rules in the last 5 minutes. A rule that fails to evaluate produces no result, so an alert that should be firing stays silent, and recording rules leave gaps that other rules and dashboards then read.

* **Severity**: Critical (`critical`)
* **Fires after**: 15m
* Part of the [Prometheus alert rules](https://n9e.github.io/alert-rules/prometheus.md) (`prometheus.yml`)

## The rule[​](#the-rule "Direct link to The rule")

```
increase(prometheus_rule_evaluation_failures_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Alert message: `Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf "%.0f" $value }} rules in the last 5m.`

## Common causes[​](#common-causes "Direct link to Common causes")

* Vector matching errors that appear only with certain data: `many-to-many matching not allowed` or `found duplicate series for the match group` after a new label or a duplicate target shows up.
* A query that exceeds the query timeout or the maximum number of samples it may load.
* A rule that reads a recording rule or metric that has been renamed, so it now returns errors in a combined expression.
* Remote read or storage errors while the rule is being evaluated.

## How to fix it[​](#how-to-fix-it "Direct link to How to fix it")

1. Check the log for the failing rule name and error;
2. Common causes are a query syntax error in the rule, a reference to a non-existent metric, or an oversized result;
3. Validate the rule files with promtool check rules;
4. After fixing, confirm the rule shows ok on the /rules page.

## Notes[​](#notes "Direct link to Notes")

* The `/rules` page in the Prometheus UI shows the last error for each rule; this is quicker than searching the logs. Some of these errors depend on the data, so `promtool check rules` can pass while evaluation still fails.
* The expression selects `job="prometheus-k8s"`, `namespace="monitoring"`. If your scrape job or namespace is named differently, change these matchers or the rule never matches.

## Metrics it uses[​](#metrics-it-uses "Direct link to Metrics it uses")

* `prometheus_rule_evaluation_failures_total` (Prometheus's own metrics)

## Related alerts[​](#related-alerts "Direct link to Related alerts")

* [PrometheusMissingRuleEvaluations](https://n9e.github.io/alert-rules/prometheus.md#prometheusmissingruleevaluations): Prometheus …/… has missed … rule group evaluations in the last 5m.
* [PrometheusBadConfig](https://n9e.github.io/alert-rules/prometheus/prometheusbadconfig.md): Prometheus …/… has failed to reload its configuration.
* [PrometheusOperatorRejectedResources](https://n9e.github.io/alert-rules/prometheus/prometheusoperatorrejectedresources.md): Prometheus operator in … namespace rejected … …/… resources.

## Prometheus rule YAML[​](#prometheus-rule-yaml "Direct link to Prometheus rule YAML")

Add this to a rules file loaded through `rule_files`, or download every Prometheus rule at once as [`prometheus.yml`](https://n9e.github.io/alert-rules/prometheus.yml).

```
- alert: PrometheusRuleFailures

  expr: |-

    increase(prometheus_rule_evaluation_failures_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0

  for: 15m

  labels:

    severity: critical

  annotations:

    summary: "Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf \"%.0f\" $value }} rules in the last 5m."

    runbook_url: "https://n9e.github.io/alert-rules/prometheus/prometheusrulefailures"
```

**With Nightingale**: this rule ships in the [Kubernetes integration](https://n9e.github.io/integrations/kubernetes.md) template; [import it into a business group](https://n9e.github.io/docs/data/integrations/import.md) and Nightingale attaches the runbook to every alert it sends.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The rule expression is adapted from [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus) (Apache-2.0). The runbook steps come from [Nightingale's integration templates](https://github.com/ccfos/nightingale/tree/main/integrations) (Apache-2.0); the explanation and causes are written for this page.
