# Data source connects but queries return no data

A source passes its test but returns nothing: check write, store and query in turn — nothing written, time range past the last point, label mismatch, wrong store.

The data source page says the test passed, the status is green, and every query you write comes back empty. This page follows the data: write → store → query, with a way to confirm each layer.

How urgent depends on what you are querying. A brand-new data source only affects you. A source that had data yesterday and is empty today sits on the same path your alert rules use, so **rules are silently failing too** — start at [Evaluation records are missing or dropped](https://n9e.github.io/docs/troubleshooting/evaluation-missing.md) to confirm the rules are still being evaluated.

## First, confirm this source is queryable at all in the open-source build[​](#first-confirm-this-source-is-queryable-at-all-in-the-open-source-build "Direct link to First, confirm this source is queryable at all in the open-source build")

This one check rules out a whole class of "nothing I click shows anything".

In the open-source build, **ClickHouse, Doris, MySQL, PostgreSQL and OpenSearch cannot be used in the Metrics explorer, the Log explorer, or dashboards.** They register fine, report healthy and work in alert rules, but **the only place their queries run is the Data preview inside the alert rule form**.

| The source you want to query                     | Where you can query it                       |
| ------------------------------------------------ | -------------------------------------------- |
| Prometheus Like, TDengine, IoTDB                 | Explorer → Metrics                           |
| Elasticsearch, Loki, VictoriaLogs                | Explorer → Logs                              |
| ClickHouse, Doris, MySQL, PostgreSQL, OpenSearch | Only via Data preview in the alert rule form |

So the usual advice — "verify it in the explorer first" — does not hold for that last row. Not being able to pick the source in the Metrics explorer is not evidence that it is broken.

## Step 1: did the data actually arrive[​](#step-1-did-the-data-actually-arrive "Direct link to Step 1: did the data actually arrive")

Writing metrics and sending a heartbeat are two independent paths in Categraf. A host appearing in the host list says nothing about whether its metrics got in.

**Read the server's own counters.** On the Nightingale host:

```
curl -s http://127.0.0.1:17000/metrics | grep -E 'n9e_pushgw_samples_received_total|n9e_pushgw_sample_received_by_ident'
```

* `n9e_pushgw_samples_received_total{channel="prometheus"}` is flat — nothing is arriving at all; the problem is on the agent or the network, go to [Categraf troubleshooting](https://n9e.github.io/docs/data/categraf/troubleshooting.md);
* the total climbs but `n9e_pushgw_sample_received_by_ident{host_ident="<hostname>"}` has no entry for the host you are looking for — data is arriving, but this host's `ident` is not what you think it is;
* both climb — ingest is fine, move on.

**Watch out: `ignore_host` defaults to `true`.** A writer that only carries a `host` label and neither `ident` nor `agent_hostname` (Telegraf, typically) has its host name discarded — samples get in but attach to no machine. Those writers must append `?ignore_host=false` to the write URL.

**And there is an "arrived but discarded" case.** `n9e_pushgw_drop_sample_total` is driven solely by `[[Pushgw.DropSample]]`, so it only moves if you configured a drop filter. Queue-full discards are a different counter, `n9e_pushgw_push_queue_error_total{queueid}`, whose log line reads:

```
Write channel(3) full, current channel size: 1000000, item: ...
```

**A full queue still answers the client with HTTP 200**, so the agent reports nothing wrong. This is the easiest "no data" cause to miss entirely.

## Step 2: the time range and "the most recent point"[​](#step-2-the-time-range-and-the-most-recent-point "Direct link to Step 2: the time range and \"the most recent point\"")

**The embedded TSDB's `LookbackDelta` defaults to `5m`.** An instant query only looks five minutes back, so a collection interval longer than five minutes — or a five-minute gap — makes instant queries empty while a range query over the same window still shows the history. **Use a range query to answer "was there ever data", and an instant query to answer "is there data right now"**; they are two different questions.

**Out-of-order and stale samples are dropped silently.** `OutOfOrderTimeWindow` defaults to `10m`; anything older is thrown away and **the write endpoint still returns success**. To confirm:

```
curl -s http://127.0.0.1:17000/metrics | grep -E 'prometheus_tsdb_too_old_samples_total|prometheus_tsdb_out_of_order_samples_total'
```

A climbing `prometheus_tsdb_too_old_samples_total` means agent clock skew or a backfill. The server log carries the matching line:

```
embedded tsdb append fail, dropped samples: 128, last error: too old sample
```

Related: `Pushgw.ForceUseServerTS` defaults to `true`, so samples written through Nightingale have their timestamps overwritten with server time — clock skew is erased on that path. Writers that go straight to an external TSDB get no such protection.

## Step 3: the labels do not match[​](#step-3-the-labels-do-not-match "Direct link to Step 3: the labels do not match")

Query correct, time range correct — now suspect the labels.

**`Pushgw.LabelRewrite` defaults to `true`.** As Nightingale forwards a sample it **overwrites** same-named labels with the host's labels from the host list, then adds the ones that were missing. So an agent configured with `region=cn` on a host tagged `region=us` in the host list stores `us`, and querying `region="cn"` is correctly empty. Open the host in the host list and read the tags actually attached to it.

**`agent_hostname` is renamed to `ident`.** The writer reports `agent_hostname`, the stored label is `ident`, and querying by `agent_hostname` finds nothing.

**Query with no labels first**, confirm the metric name exists, then add labels one at a time to see which one empties the result:

```
mem_used_percent

mem_used_percent{ident="n9e-web-01"}

mem_used_percent{ident="n9e-web-01", region="trade"}
```

## Step 4: you are querying a different store[​](#step-4-you-are-querying-a-different-store "Direct link to Step 4: you are querying a different store")

Nightingale can run the embedded TSDB and `[[Pushgw.Writers]]` forwarding at the same time (dual write), or only one of them. **Data written to A, queried in B** is the most common empty result during onboarding.

* With only the embedded TSDB, the data source is named `embedded-tsdb`;
* with `[[Pushgw.Writers]]` configured, query the data source that matches the forwarding target;
* if another Prometheus data source already exists, the embedded TSDB **does not** auto-register one — a startup log line says so, and the name `embedded-tsdb` simply will not exist.

One more: a remote Grafana or a second Nightingale querying the embedded TSDB's `/prometheus` gets a 403 that explains itself:

```
{"error":"embedded tsdb endpoints only accept requests from the n9e host by default; set EmbeddedTSDB.BasicAuthUser/BasicAuthPass (or DatasourceUrl) to allow remote access","errorType":"forbidden","status":"error"}
```

That is not missing data — the endpoint only accepts local requests by default. See [Embedded TSDB has fragmented or missing data](https://n9e.github.io/docs/troubleshooting/embedded-tsdb-data.md).

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

Before opening a [GitHub issue](https://github.com/ccfos/nightingale/issues) or asking in the community, have this ready:

1. The data source type and version, and which page you queried from (Metrics explorer / Log explorer / Data preview in the rule form);
2. The full query and the time range — absolute start and end times, not "the last hour";
3. The output of `curl -s http://127.0.0.1:17000/metrics | grep -E '^n9e_pushgw_'`;
4. Any `embedded tsdb append fail` or `Write channel` lines from the server log in that same window.

**Redacting**: replace business label values, host names, data source addresses and tokens; write addresses as placeholders like `n9e:17000`. The `trace_id` in a log line is safe to keep — it only means something on your own instance.

## Next[​](#next "Direct link to Next")

* The host never showed up: [Categraf target is offline](https://n9e.github.io/docs/troubleshooting/categraf-offline.md)
* Problems inside the embedded store: [Embedded TSDB has fragmented or missing data](https://n9e.github.io/docs/troubleshooting/embedded-tsdb-data.md)
* Data is there but the rule stays quiet: [Query works but the alert does not fire](https://n9e.github.io/docs/troubleshooting/alert-not-firing.md)
* Debugging the agent: [Categraf troubleshooting](https://n9e.github.io/docs/data/categraf/troubleshooting.md)
