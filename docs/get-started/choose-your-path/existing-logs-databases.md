# I already have logs or databases

Alert on ElasticSearch, Loki, ClickHouse, MySQL and the other SQL-queried stores using the same rule model as metrics.

Last reviewed 2026-10-10

Where this path ends: a rule evaluating against your log store or business database, producing an event when it crosses the line. Same rule model as metrics — only the query language differs. About 15 minutes.

## What the open-source build supports[​](#what-the-open-source-build-supports "Direct link to What the open-source build supports")

| Kind             | Type                                       | Queried with |
| ---------------- | ------------------------------------------ | ------------ |
| Time series      | Prometheus, VictoriaMetrics, Thanos, Mimir | PromQL       |
| Time series      | TDengine, IoTDB                            | SQL          |
| Logs             | ElasticSearch, OpenSearch                  | DSL / Lucene |
| Logs             | Loki                                       | LogQL        |
| Logs             | VictoriaLogs                               | LogsQL       |
| Logs / analytics | ClickHouse, Doris                          | SQL          |
| Databases        | MySQL, PostgreSQL                          | SQL          |

Eleven in total. The list under **Integrations → Data sources → Add** in your build is the authority.

## 1. Register the data source[​](#1-register-the-data-source "Direct link to 1. Register the data source")

**Integrations → Data sources → Add**, then pick the type. Each asks for something different:

* **ElasticSearch / OpenSearch** — cluster URLs (several allowed) and the version; auth if needed;
* **Loki** — the URL **must end in `/loki`**, e.g. `http://loki:3100/loki`; without it the form refuses to save;
* **VictoriaLogs** — the URL is enough;
* **ClickHouse** — node address (`host:port`), user, password, protocol `native` or `http`;
* **MySQL / PostgreSQL** — address, database, user, password. A **read-only account** is enough; rules only ever run SELECT;
* **TDengine** — the REST endpoint (port 6041 by default) plus user and password.

Click **Save & test**. A failed test is not saved.

## 2. Decide what the query returns[​](#2-decide-what-the-query-returns "Direct link to 2. Decide what the query returns")

A log or SQL rule is "run a query on a schedule, compare the number that comes back against a threshold". So settle two things first:

* does the query return **one number** (say, ERROR count in the last 5 minutes) or **a set of numbers** (ERROR count grouped by service)?
* if it is a set, which field groups it — that field becomes a label on the event, and labels are what decide how alerts of the same kind get grouped.

For SQL sources, watch the cost of the query. Rules run **on a schedule**: a statement that takes 30 seconds, run every minute, will flatten the database. Run it by hand first and look at the time.

## 3. Write the rule[​](#3-write-the-rule "Direct link to 3. Write the rule")

**Alerts & Notifications → Alert rules → Add**, select the source you just created. The form switches to the editor for that type — DSL for ES, LogQL for Loki, a SQL box for the SQL ones.

Set the evaluation interval, for-duration and severity, then save.

To check the query and the threshold before anything is live, use **Test fire** on the rule: it runs against real data and shows what each stage produced, without waiting for a real breach.

## 4. Verify[​](#4-verify "Direct link to 4. Verify")

**Alerts & Notifications → Events** should show an event. That means data source → query → evaluation → event works.

## Next[​](#next "Direct link to Next")

* Full field reference per source type: [Collect and connect data](https://n9e.github.io/docs/data/overview.md)
* Writing log rules: [Log rules](https://n9e.github.io/docs/alerting/log-rules.md)
* Writing SQL rules: [SQL-backed rules](https://n9e.github.io/docs/alerting/sql-rules.md)
