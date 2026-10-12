---
title: "Metric rules"
sidebar_label: "Metric rules"
description: "Metric rules put the threshold inside the PromQL expression; one rule can carry several severities, and the labels the query returns land on the event for routing."
last_reviewed: 2026-10-10
---

Where this page ends: you can read and write the alert-conditions step of a Prometheus-type rule —
where the threshold goes, how one rule carries several severities, and which of the returned labels
end up on the event.

This is the rule type for **Prometheus Like** data sources: Prometheus itself, VictoriaMetrics,
Thanos, Mimir. For the others, see [Log rules](./log-rules.md) and [SQL-backed rules](./sql-rules.md).

## The query list

Step 3, **Alert conditions**, holds a list under **Queries & threshold**. Each entry is one PromQL
expression plus one severity. Add entries with the dashed button below the list.

```
Query          mem_used_percent > 80
Severity       S2
```

Each entry is evaluated as an **instant query** against the data source, once per execution cycle —
the same call the Metrics explorer makes, not a range query.

## The threshold is part of the PromQL

There is no separate threshold box. The comparison lives in the expression, and the rule fires for
**every series the query returns**:

```promql
mem_used_percent > 80
```

The data source only returns the series above 80, so every returned series is by definition an
anomaly. This is exactly how Prometheus alerting rules work, and it is the reason evaluation is
cheap: the filtering happens in the time series database, not in Nightingale.

The practical consequences:

- **One series in, one event out.** A query returning 30 hosts over threshold produces 30 events,
  each with that series' own labels. Group with `sum by (...)` if you want fewer.
- **A query that returns nothing means "healthy".** There is no way to distinguish "nothing is
  above threshold" from "the exporter stopped reporting" — both look like an empty result. To alert
  on the data disappearing, write a separate rule for it, on `up == 0` or `target_up == 0`.
- **Recovery arrives with no value.** When the series stops being returned, the event recovers, and
  the value at recovery time is not available — the database returned nothing to read it from.

Arithmetic and filtering all work, because it is just PromQL:

```promql
http_request_success{region="beijing"} / http_request_total{region="beijing"} < 0.995
```

## Several severities in one rule

Add more than one query to the list and each gets its own severity. The usual shape:

```
disk_used_percent > 85     S2
disk_used_percent > 95     S1
```

Adding a second query makes an **Inhibit** switch appear next to the list heading. With it on, when
one series matches several tiers at once only the most severe one produces an event — so a disk at
97% pages you once at S1 instead of twice.

Inhibition compares series, not rules: it only applies between events whose metric name **and all
labels** are identical. S1 beats S2 beats S3.

## Execution frequency and for-duration

Below the query list:

| Field | Default | What it means |
|---|---|---|
| Execution frequency | `@every 60s` | A cron expression with second precision. The dropdown offers common intervals; `@every 15s` and standard cron are both accepted |
| For duration (s) | 60 | How long the condition must keep matching before an event is produced. `0` means fire on the first match |

For-duration is checked per series: the same series must come back on consecutive cycles until the
elapsed time covers the duration. A series that appears once and vanishes never produces an event —
and never produces a recovery either, since no event existed.

Set the frequency to what you can afford, not to the smallest number available. A rule matching ten
data sources at `@every 15s` is 2400 queries an hour before anyone looks at a dashboard. More in
[Evaluation interval and recovery](./evaluation.md).

## Preview before you save

Each query card has a **Preview** area that runs the expression against the selected data source
and charts the result. Use it for two things:

- confirming the expression returns something at all — an empty chart means the rule will never fire;
- sanity-checking the threshold against the actual shape of the data, so you do not set 80 on a
  metric that lives at 95.

The preview needs a concrete data source, so pick one in step 2 first even if the rule will
eventually match several.

For a stricter check that also covers labels, templates and notification routing, use
[Test fire](./test-fire.md).

## What ends up on the event

The event's labels come from three places, in this order:

1. **the series' own labels**, as the query returned them — this is why `sum by (service)` and
   `sum by (instance)` produce very differently shaped events;
2. **the rule's tags** from step 1, added to every event this rule produces;
3. **annotations**, rendered per event, which are text rather than labels.

The event value is the series' value at trigger time, available in templates as `$value`, and the
labels as `$labels.<name>`. See [Labels, annotations and severity](./labels-severity.md).

A note on aggregation: `sum by (service) (...)` drops `instance` and `ident`. That is usually what
you want for a service-level alert, but it also means the event has no host to point at — and
self-healing, which reads the `ident` label, has nothing to work with.

## Variables: one rule, different thresholds per host

A query can carry **variables** so that one rule covers hosts that need different thresholds.
Enable them on the query card, then reference them in the PromQL with `$name`:

```promql
mem_used_percent{ident="$hosts"} > $threshold
```

Each variable has a type:

| Type | What it supplies |
|---|---|
| Threshold | A number, substituted directly into the expression |
| Enum | A set of label values the query is restricted to |
| Host | A set of hosts, picked with the same filters as the host list |

Variable sets can be nested, and a nested set overrides the one above it for the hosts it covers —
which is how "80% for everything, 95% for these three build machines" is expressed as one rule.

Variables cost performance: the rule expands into one query per combination. Use them where a
handful of exceptions would otherwise mean a handful of near-duplicate rules, not as the default.

## Next

- Get the timing right: [Evaluation interval and recovery](./evaluation.md)
- Make the event readable: [Labels, annotations and severity](./labels-severity.md)
- Make an expensive query cheap: [Recording rules](../query/recording-rules.md)
- When it does not fire: [Alert rule does not fire](../troubleshooting/alert-not-firing.md)
