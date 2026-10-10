---
title: "Monitor Nightingale itself"
sidebar_label: "Monitor Nightingale itself"
description: "Rules that page you when the alerting system is the thing that is down."
---

An alerting system that is down will not tell you it is down. This page gives the concrete rules
that make Nightingale watch itself, and what to do about **the one part it cannot cover**.

## Start with the boundary

Nightingale can monitor most of its own failures: evaluation stalled, a data source unreachable,
samples dropped, the database queuing. There is one class it inherently cannot cover — **Nightingale
being wholly unavailable**. With the process gone, nothing is left to run the rule.

So a complete setup has two layers:

1. **Nightingale watching itself**, covering everything in the "alive but not working" category —
   that is the rest of this page;
2. **Something outside Nightingale watching Nightingale**, covering "gone entirely". The cheapest
   version is an external uptime check hitting `http://n9e:17000/ping` every minute; a Nightingale
   instance in a different failure domain works too.

Skipping the second layer means trusting the alerting system to report its own death.

## Step one: collect its own metrics

Every process exposes its metrics on `/metrics` (`[HTTP] ExposeMetrics` defaults to `true`). Have
categraf scrape it with the `prometheus` plugin:

```toml
# conf/input.prometheus/prometheus.toml
[[instances]]
urls = ["http://127.0.0.1:17000/metrics"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
```

Configure one per instance in the cluster, each pointing at itself. For a multi-site deployment,
`n9e-edge` uses port 19000.

**Expected result**: a few minutes later, querying `n9e_alert_rule_eval_total` under
**Explorer → Metrics** returns one series per instance. If it does not, fix collection first —
rules built on absent data are decoration.

## The rules to create

Create these under **Alerts & Notifications → Alert rules**, against whichever data source holds the
self metrics. The expressions carry no instance dimension; to break them down per instance in a
cluster, aggregate `by (ident)` on the host identity categraf attaches.

| What it catches | Expression | Condition |
|---|---|---|
| Evaluation stopped | `sum(rate(n9e_alert_rule_eval_total[5m]))` | `< 0.01` for 5 minutes |
| A Center restarted recently | `n9e_center_uptime` | `< 300`, for-duration 0 |
| Evaluation errors | `sum(rate(n9e_alert_rule_eval_error_total[5m]))` | `> 0` for 5 minutes |
| A data source cannot be queried | `sum by (datasource) (rate(n9e_alert_query_data_error_total[5m]))` | `> 0` for 5 minutes |
| Event processing backlog | `n9e_alert_alert_queue_size` | `> 0` for 10 minutes |
| Writes being rejected | `rate(n9e_pushgw_push_queue_over_limit_error_total[5m])` | `> 0` |
| Samples being dropped | `sum(rate(n9e_pushgw_push_queue_error_total[5m]))` | `> 0` |
| Database connections queuing | `rate(n9e_db_pool_wait_count_total[5m])` | `> 0` for 5 minutes |
| Embedded TSDB series near the ceiling | `prometheus_tsdb_head_series` | `> 100000` |

**"Evaluation stopped" is the important one**, because it is the only rule still able to speak when
every other rule has stopped working. Send it to a different channel from your business alerts — the
business alerts come out of the evaluation engine, so when evaluation stops that path is exactly the
broken one.

### When the process disappears entirely

Once a process is gone, the expressions above return nothing, and a plain threshold never triggers.
The rule form has a **No data** condition ("Trigger an alert when previously available data can no
longer be found; recover automatically when the data appears again") — turn it on and a vanished
series alerts:

```
# expression
n9e_center_uptime
# condition: enable "No data"
```

That covers "one instance is gone". It does not cover "all instances are gone" — that is what the
second layer above is for.

## Watch for collection going quiet

The quietest failure a monitoring system has is silence, because the data stopped arriving long ago.
Besides `n9e_pushgw_samples_received_total` above, add a rule aimed at the monitored estate itself:
pick a metric every host reports, turn on **No data**, and a host that goes silent alerts.

That rule is a different thing from the ones above: those check Nightingale's own health, this one
checks the health of the data pipeline. You want both.

## Notification failures are not in the metrics

`/metrics` carries `n9e_alert_alert_notify_total` and `n9e_alert_alert_notify_error_total`, but they
only cover the older webhook / email / callback senders. **Notifications delivered through
notification rules do not increment them**; those are recorded in the metadata database instead, in
the notification record table (`notification_record`, with `status` 1 for success and 2 for
failure).

So there are two ways to see delivery failures:

- **for a human**: the notification records on the alert event detail, or the event list page;
- **for a machine**: register Nightingale's own metadata database as a MySQL / PostgreSQL data
  source and write a SQL alert rule counting rows with `status = 2` over a recent window. See
  [MySQL and PostgreSQL as data sources](../data/sql-databases.md) for registering it and
  [SQL alert rules](../alerting/sql-rules.md) for the rule.

Note that notification records are kept for 7 days by default (`[Center] CleanNotifyRecordDay`,
cleaned daily at 01:00), so keep the SQL rule's window inside that.

## Related

- [Built-in metrics and health checks](./health.md)
- [High availability and failure domains](./high-availability.md)
- [Logs and diagnostic bundles](./diagnostics.md)
- [Production readiness checklist](../get-started/production-checklist.md)
