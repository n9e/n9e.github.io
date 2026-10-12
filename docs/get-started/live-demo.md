# Guided live demo

Sign in to the public demo and walk the path from data source to delivered alert, in the same order as the quick start — no install needed.

Last reviewed 2026-10-10

After this page you will have seen, on a running instance, every stop an alert makes in Nightingale: the data source it reads, the rule that evaluates it, the event it produces and the rule that delivers it.

## Sign in[​](#sign-in "Direct link to Sign in")

Open **[the live demo](http://43.106.19.165/api/n9e/auth/demo-login)**. The link signs you in as the shared demo account, so there is no username or password to type.

Expected result: you land on **Home**, with a **Getting started** checklist at the top. The demo is the open-source edition, so every menu you see here is one you get from the [quick start](https://n9e.github.io/docs/get-started/quick-start.md).

The environment is shared with every other visitor. Do not type real passwords, webhook URLs, phone numbers or API keys into it.

## The tour[​](#the-tour "Direct link to The tour")

Follow the left-hand menu in this order. Each stop is one step of the quick start.

1. **Integrations → Data sources.** The sources Nightingale queries in place: nothing is copied in. Open one to see the address and the timeout it uses. Expected result: a list of data sources, each with a type icon such as Prometheus.
2. **Explorer → Metrics.** Pick a data source and run a query such as `up`. This is the same query language an alert rule uses, so a query that returns data here will also work in a rule. Expected result: a chart and a table of series.
3. **Alerts & Notifications → Alert rules.** Choose a business group on the left, then open a rule. Look at three things: the query, the threshold for each severity (S1 / S2 / S3), and the for-duration that filters out spikes.
4. **Alerts & Notifications → Events.** **Active alerts** are still firing; **Historical alerts** keeps every event, recovered ones included. Open an event to see its labels, the value that triggered it and which notifications it set off ([more on the two lists](https://n9e.github.io/docs/events/active-historical.md)).
5. **Alerts & Notifications → Notification rules.** This is where an event is matched to people and media types. **Media types** and **Message templates** in the same menu define how a message is sent and what it looks like.
6. **Explorer → Dashboards.** Charts built on the same data sources. If you already use Grafana you can keep it; dashboards here are optional.

## Next[​](#next "Direct link to Next")

Run your own instance with the [quick start](https://n9e.github.io/docs/get-started/quick-start.md), or go straight to [your first alert rule](https://n9e.github.io/docs/alerting/first-rule.md).
