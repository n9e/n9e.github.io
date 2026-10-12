# Log rules

Alert on log counts or matched patterns from ElasticSearch, OpenSearch, Loki and VictoriaLogs — all four alert, but only three can be previewed in the Log explorer.

Where this page ends: a rule that counts matching log lines on a schedule and fires when there are too many of them, on whichever of the four log stores you run.

Log alerting always reduces to the same thing — **turn a window of logs into one number, then compare it**. What differs between the four sources is where the comparison lives.

## Four sources, two shapes of rule[​](#four-sources-two-shapes-of-rule "Direct link to Four sources, two shapes of rule")

| Source        | Where the threshold goes                     | Expression style               |
| ------------- | -------------------------------------------- | ------------------------------ |
| Elasticsearch | A separate **Trigger conditions** block      | `$A > 100`                     |
| OpenSearch    | Same as Elasticsearch                        | `$A > 100`                     |
| VictoriaLogs  | Same block                                   | `$A.<stats alias> > 100`       |
| Loki          | **Inside the LogQL**, like a Prometheus rule | none — it is part of the query |

Loki is the odd one out and is documented separately below. The other three share the trigger model described in [Evaluation interval and recovery](https://n9e.github.io/docs/alerting/evaluation.md).

## Elasticsearch and OpenSearch[​](#elasticsearch-and-opensearch "Direct link to Elasticsearch and OpenSearch")

Both use the same form; OpenSearch simply hides the index-pattern option.

### Building the number[​](#building-the-number "Direct link to Building the number")

One query card under **Queries**:

| Field                      | What to put in it                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Index                      | The index to search. `logs-2026.01.01`, a comma-separated list, or a wildcard like `logs-*`                                            |
| Filter                     | A **Lucene** query — `level:ERROR AND service:checkout`. The rule form does not offer KQL                                              |
| Date field                 | The timestamp field, `@timestamp` by default                                                                                           |
| Interval                   | The window, in seconds. Default 60. This is both the aggregation bucket and how far back the query looks                               |
| Metric                     | How the window becomes a number: `count`, or one of `avg` / `sum` / `max` / `min` / `p90` / `p95` / `p99` over a numeric **Field key** |
| Group by                   | Optional. Split by a term field, so each value produces its own event, with `Size` and `Min doc count` to bound it                     |
| Advanced settings → Offset | Shift the window back by N seconds, for a source whose writes lag                                                                      |

`count` is the common case: "how many lines matched". The percentiles are for alerting on a value inside the logs — request duration recorded per line, say.

**Group by is what turns one alert into one alert per service.** Without it, a rule that counts errors across all services fires once and tells you nothing about where. With `Group by: service, Size 10`, each service over threshold produces its own event carrying `service=<name>` as a label, which routing can then use.

### The trigger condition[​](#the-trigger-condition "Direct link to The trigger condition")

Below the queries, **Trigger conditions → Threshold conditions**. Each condition has its own severity, and — as with metric rules — several conditions plus **Inhibit** gives you tiered thresholds without duplicate messages.

The condition can be written two ways:

* **Builder** — pick the query, an operator and a number;
* **Code** — write the expression yourself, which is what you need for more than one query:

```
$A > 100 && $B < 10
```

For Elasticsearch, a query is referenced as bare `$A`. Add more query cards to get `$B`, `$C`, and combine them.

Two things silently do not work, so check them with [Test fire](https://n9e.github.io/docs/alerting/test-fire.md):

* referencing a query alias that no longer exists;
* comparing a label with a number. Labels are strings — `$A.service == 'checkout'` is fine, `$A.service > 10` is a type error, and the engine treats an expression it cannot evaluate as "not met" without complaining.

## VictoriaLogs[​](#victorialogs "Direct link to VictoriaLogs")

The query is one LogsQL statement, and it must end in a `stats` pipe — the rule runs it as an instant stats query, so a plain search returns nothing usable:

```
_msg:error | stats count() as value
```

The alias you give the stat is how the trigger refers to it:

```
$A.value > 20
```

The form warns if the query has no `_time` filter, and the warning is worth heeding: without one, the query scans everything the store holds, every evaluation cycle.

```
_time:5m AND _msg:error | stats count() as value
```

## Loki[​](#loki "Direct link to Loki")

Loki rules are shaped like Prometheus rules, not like the other log rules. There is one **LogQL** box per query, the threshold goes inside it, and each query carries its own severity:

```
count_over_time({job="myapp"} |= "error" [5m]) > 10
```

Consequences, all of them the same as for [metric rules](https://n9e.github.io/docs/alerting/metric-rules.md):

* the query must return an instant vector, so it needs `count_over_time`, `rate` or another aggregation over a range — a bare log selector will not do;
* one returned series produces one event, so `sum by (job) (...)` decides the granularity;
* there is no separate trigger block, and therefore **no recovery condition and no no-data switch** on Loki rules;
* recovery means the query stopped returning the series.

Adding a second query brings up the **Inhibit** switch, same as for metric rules.

## Recovery defaults differ here[​](#recovery-defaults-differ-here "Direct link to Recovery defaults differ here")

On Elasticsearch, OpenSearch and VictoriaLogs rules, each trigger condition carries a **Recovery configuration** dropdown, and the choice matters more for logs than anywhere else:

* **No data is considered recovered** — no matching error lines usually does mean the problem is over. This is what the form preselects for a log source.
* **Recover only when data exists and the trigger condition is not met** — the alert stays firing while the query returns nothing. Correct when "no logs at all" means the pipeline broke, not that the service got healthy.

If a silent log pipeline is itself the thing you want to hear about, use the separate **No data** switch on the alert conditions step rather than the recovery mode. It has its own severity, so "errors are up" and "logs stopped arriving" become two distinguishable events.

## Verify before you save[​](#verify-before-you-save "Direct link to Verify before you save")

Each query card has a **Preview** that runs the query and shows the resulting values in a table. Use it before saving — it is the only way to see whether your filter matches anything.

For Elasticsearch, Loki and VictoriaLogs you can also explore interactively first in **Explorer → Logs**, which is easier for iterating on a filter. **OpenSearch is not available in the Log explorer**, so the rule form's Preview is where you check an OpenSearch query.

Then use [Test fire](https://n9e.github.io/docs/alerting/test-fire.md) to check the trigger expression against real data, and after saving read [the evaluation records](https://n9e.github.io/docs/alerting/execution-records.md) to see what each cycle actually returned.

## Next[​](#next "Direct link to Next")

* Timing and recovery in detail: [Evaluation interval and recovery](https://n9e.github.io/docs/alerting/evaluation.md)
* Alert on a database instead: [SQL-backed rules](https://n9e.github.io/docs/alerting/sql-rules.md)
* Register the store first: [Elasticsearch](https://n9e.github.io/docs/data/elasticsearch.md), [Loki and VictoriaLogs](https://n9e.github.io/docs/data/loki-victorialogs.md)
