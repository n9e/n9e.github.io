---
title: "SQL-backed rules"
sidebar_label: "SQL-backed rules"
description: "Rules that run a SQL statement against MySQL, PostgreSQL, ClickHouse, Doris, TDengine or IoTDB on a schedule."
---

Where this page ends: a rule that runs one SQL statement on a schedule, turns a column of the result
into a number, and fires when that number crosses a line. This is how you alert on business state —
stuck orders, failed jobs, a queue that stopped draining — without exporting it as a metric first.

## Which sources take this path

MySQL, PostgreSQL, ClickHouse, Doris, TDengine and IoTDB all use the same rule shape: a statement,
a mapping from result columns to values and labels, and a trigger expression. Their differences are
in dialect and in how you express the time range, covered below.

## What the statement has to produce

Two requirements, and both are enforced:

**It must return a row per thing you want to alert about**, not a report. The rule compares numbers,
so aggregate in SQL:

```sql
SELECT count(*) AS value
FROM orders
WHERE created_at >= NOW() - INTERVAL 5 MINUTE
  AND status = 'failed'
```

**It must have a column you nominate as the value.** Under **Auxiliary settings**:

| Field | What it does |
|---|---|
| Value field | Which column holds the number. **Required** for MySQL, PostgreSQL, ClickHouse and Doris — the query fails with `valueKey is required` without it. Several columns can be listed, separated by Enter; each becomes its own series |
| Label field | Which columns become labels on the event. Also multi-valued |

The two behave differently when Label field is empty, and this catches people out:

- **Label field empty** — every column that is not a value column and not a timestamp is turned into
  a label automatically.
- **Label field set** — only the columns you named become labels; the rest are discarded.

So a query grouped by service either works by accident (empty label field) or works deliberately:

```sql
SELECT service, count(*) AS value
FROM orders
WHERE created_at >= NOW() - INTERVAL 5 MINUTE AND status = 'failed'
GROUP BY service
```

with **Value field** `value` and **Label field** `service`. Each service over threshold then
produces its own event, labelled with its own name.

TDengine names these fields the same way in the form but stores the value column under its own key,
and adds a **TimeFormat** for parsing timestamp columns.

## You write the time range yourself

This is the single most important difference from a metric rule. **For MySQL, PostgreSQL,
ClickHouse and IoTDB, the alerting engine does not inject a time range into your statement.** The
form's interval field bounds the preview, not the query the engine sends.

So the window has to be in the SQL:

```sql
WHERE created_at >= NOW() - INTERVAL 5 MINUTE      -- MySQL
WHERE created_at >= now() - interval '5 minutes'   -- PostgreSQL
WHERE ts >= now() - INTERVAL 5 MINUTE              -- ClickHouse
```

A statement with no time predicate at all is a full table scan repeated every evaluation cycle.
That is the fastest way to make a DBA hate your monitoring system.

### Time macros, per source

Two sources do give you a macro, and only two:

**Doris** supports `$__timeFilter(<column>)`, and computes the window from the form's **Interval**
field (60s by default) and optional **Offset**:

```sql
SELECT count(*) AS cnt FROM logs.errors WHERE $__timeFilter(`ts`)
```

It expands to `(ts >= FROM_UNIXTIME(start) AND ts < FROM_UNIXTIME(end))`.

**TDengine** substitutes three variables:

| Variable | Becomes |
|---|---|
| `$from` | The window start, as a quoted RFC3339 timestamp — the quotes are included, do not add your own |
| `$to` | The window end, same form |
| `$interval` | The interval in seconds, as `60s` |

```sql
SELECT avg(current) AS current FROM power.meters WHERE ts >= $from AND ts < $to
```

**Do not use `$__timeFilter` in a MySQL, PostgreSQL, ClickHouse or IoTDB alert rule.** On MySQL it
fails the query outright with `requires a query time range, got none`; on the others the macro is
passed through to the database verbatim and becomes a syntax error. Write the predicate by hand.

## The trigger condition

Below the query, **Trigger conditions → Threshold conditions**, the same block log rules use. The
expression references a query by alias and a column by name:

```
$A.value > 10
```

`$A.<column>` is the value of that column. `$A.<label>` is a label, and labels are **strings** —
`$A.service == 'checkout'` works, `$A.service > 10` is a type error that the engine silently treats
as "condition not met". Verify with [Test fire](./test-fire.md), which evaluates the expression
against real rows and reports the error instead of swallowing it.

Multiple queries combine with `&&` and `||`, and **Join operations** control how their rows are
matched up when they have different label sets.

Each condition carries its own severity, so tiered thresholds work here exactly as they do for
metric rules — add a second condition and turn on **Inhibit**.

The **Recovery configuration** dropdown on each condition matters more here than anywhere else.
*Recover only when data exists and the trigger condition is not met* keeps the alert firing while
the database is unreachable, which is almost always what you want: a database you cannot query is
not a database that is healthy.

It is preselected for MySQL, PostgreSQL, TDengine and IoTDB — but **ClickHouse and Doris are
classified as log stores**, so they start on *No data is considered recovered* instead. Set it
explicitly on those two. See [Evaluation interval and recovery](./evaluation.md).

## Per-source constraints

- **PostgreSQL** requires fully qualified table names — `database.schema.table`. A bare table name
  fails with `no valid table name in format database.schema.table found`.
- **ClickHouse and Doris** are for scanning large tables; keep the statement bounded and give it a
  `LIMIT` where it makes sense.
- **TDengine** results must contain a `TIMESTAMP` column.
- **All of them**: set the execution frequency against how long the statement takes. A query taking
  eight seconds must not run every fifteen. Run it once by hand with timing before you pick.

## The only place to test the query

**ClickHouse, Doris, MySQL, PostgreSQL and OpenSearch are not available in the metric or Log
explorers in the open-source edition.** There is no "paste it in the explorer first" step for these
sources.

The place to run the statement inside Nightingale is the **Preview** on the query card in the rule
form. It executes the SQL against the selected data source and shows the resulting series — name,
labels and value — which is exactly what the trigger expression will see. If the columns in the
preview are not what you expected, fix the value and label fields before going further.

Then [test fire](./test-fire.md) the rule to check the expression, and after saving use
[the evaluation records](./execution-records.md) to see what each cycle returned in production.

## Next

- Timing and recovery: [Evaluation interval and recovery](./evaluation.md)
- Alert on logs instead: [Log rules](./log-rules.md)
- Register the database first: [SQL databases](../data/sql-databases.md), [ClickHouse, Doris and IoTDB](../data/clickhouse-doris-iotdb.md)
