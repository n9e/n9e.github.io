# One post tagged with "SQL"

Alerting on business data with SQL queries.

[View all tags](https://n9e.io/blog/tags.md)

## [SQL query alerting: monitor failed orders in MySQL](https://n9e.io/blog/sql-query-alerting-mysql.md)

November 5, 2026 ·

<!-- -->

8 min read

Eric Qin

![A MySQL order-outcomes table feeds a five-minute count query, a threshold and a notification](https://n9e.io/assets/images/sql-query-alerting-mysql-1a36bfcd85b83b15713a2d585902f4b7.webp)

**SQL query alerting runs a query on a schedule and checks a numeric result against a condition.** It is useful when the number you care about already lives in a business database: failed orders, overdue jobs or a queue that has stopped draining.

This example counts failed orders in MySQL over the last five minutes and configures Nightingale to alert when that count stays at five or more for two minutes. It also handles the quiet case: no failed orders should produce a numeric zero that lets the alert recover.

**Tags:**

* [SQL](https://n9e.io/blog/tags/sql.md "Alerting on business data with SQL queries.")
* [Alerting](https://n9e.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.io/blog/sql-query-alerting-mysql.md)
