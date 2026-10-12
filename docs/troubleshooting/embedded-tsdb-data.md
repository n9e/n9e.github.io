# Embedded TSDB has fragmented or missing data

Gaps in the embedded TSDB rarely raise errors — retention, disk pressure or restarts; three timestamp metrics show whether the gap is on the write or the query side.

The chart has gaps in it; or you widen the time range and there is nothing at all before a certain point; or the same query gives different answers on two refreshes. Each of these has a definite cause in the embedded store, and **most of them do not produce an error** — so classify first, act second.

Gauge urgency by whether the gap is **current**. Missing old data is usually the retention policy working as designed and does not need a night call. **No data for the last few minutes** means data is being lost right now — and alert rules querying that window come back empty too, so they fail alongside it.

## First: is the gap on the write side or the query side[​](#first-is-the-gap-on-the-write-side-or-the-query-side "Direct link to First: is the gap on the write side or the query side")

This splits the problem in half. On the machine running Nightingale:

```
curl -s --noproxy '*' http://127.0.0.1:17000/metrics | grep -E \

  'prometheus_tsdb_head_samples_appended_total|prometheus_tsdb_head_series|n9e_pushgw_samples_received_total'
```

Run it again a minute later and compare:

| What you see                                          | Conclusion                                                                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `n9e_pushgw_samples_received_total` is not climbing   | Samples never reached Nightingale — a **collection or network** problem, go to [Categraf troubleshooting](https://n9e.github.io/docs/data/categraf/troubleshooting.md) |
| It climbs, but `head_samples_appended_total` does not | Received but not stored — see "out of order" below, and check the forwarding config                                                                                    |
| Both climb, yet the chart is empty                    | It was stored; the problem is on the **query side** — wrong data source, or several instances each holding half                                                        |
| Both climb, and only a recent stretch is missing      | Usually the process restarted or collection stopped during that window; line up the timestamps first                                                                   |

Both `n9e_pushgw_samples_received_total` and `prometheus_tsdb_head_series` count for the **current process** and reset on restart — do not read a restart as data loss.

## Three timestamp metrics say exactly how far the data goes[​](#three-timestamp-metrics-say-exactly-how-far-the-data-goes "Direct link to Three timestamp metrics say exactly how far the data goes")

The embedded store is the Prometheus storage engine, so it exposes its own boundaries directly. **These numbers are far quicker than reading charts** (all in milliseconds):

```
curl -s --noproxy '*' http://127.0.0.1:17000/metrics | grep -E \

  'prometheus_tsdb_lowest_timestamp|prometheus_tsdb_head_min_time|prometheus_tsdb_head_max_time|prometheus_tsdb_retention_limit_bytes'
```

| Metric                                  | Meaning                             | How to use it                                                                                   |
| --------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `prometheus_tsdb_lowest_timestamp`      | The **oldest** sample in the store  | Anything earlier necessarily returns empty. This is the direct answer to "the old data is gone" |
| `prometheus_tsdb_head_max_time`         | The newest sample                   | Not advancing means data is being lost right now                                                |
| `prometheus_tsdb_head_min_time`         | Where the current head block starts | Far from `lowest_timestamp` means the historical blocks are still there                         |
| `prometheus_tsdb_retention_limit_bytes` | The disk cap, `0` meaning unlimited | Defaults to `1.073741824e+10`, which is exactly 10 GiB                                          |

To read it as a date:

```
date -d @$(( $(curl -s --noproxy '*' http://127.0.0.1:17000/metrics \

  | awk '/^prometheus_tsdb_lowest_timestamp/{printf "%.0f", $2/1000}') )) 2>/dev/null \

  || date -r $(curl -s --noproxy '*' http://127.0.0.1:17000/metrics \

  | awk '/^prometheus_tsdb_lowest_timestamp/{printf "%.0f", $2/1000}')
```

## Common root causes, and how to confirm each[​](#common-root-causes-and-how-to-confirm-each "Direct link to Common root causes, and how to confirm each")

### Retention or the disk cap deleted the old data[​](#retention-or-the-disk-cap-deleted-the-old-data "Direct link to Retention or the disk cap deleted the old data")

The two ceilings are an **or**, and **whichever is hit first starts deleting the oldest blocks**:

```
[EmbeddedTSDB]

RetentionDuration = "15d"   # 15 days by default

MaxBytes = "10GiB"          # 10 GiB by default; empty or 0 means unlimited
```

So a `MaxBytes` that is too small **silently** shortens the effective retention below 15 days, with no indication anywhere in the UI.

**How to confirm**: convert `prometheus_tsdb_lowest_timestamp` to a date. If it is clearly later than `RetentionDuration` would allow, the disk cap is what is biting, not time. Then check with `du -sh data/tsdb` whether real usage is sitting against `MaxBytes`.

**How to fix**: raise `MaxBytes` to what the disk can absorb and restart. If you need more history than the disk holds, it is time for an external store — see [Embedded TSDB single-Center limits](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md). **Blocks already deleted do not come back.**

### A collector's clock drifted and its samples are dropped as out of order[​](#a-collectors-clock-drifted-and-its-samples-are-dropped-as-out-of-order "Direct link to A collector's clock drifted and its samples are dropped as out of order")

The embedded store accepts out-of-order samples only within `OutOfOrderTimeWindow` (default `10m`) and **discards anything beyond it**. A machine whose clock is off by a quarter of an hour produces regular, repeating holes.

**How to confirm**: this pair of metrics exists for exactly this question —

```
prometheus_tsdb_head_out_of_order_samples_appended_total   # late, but inside the window: accepted

prometheus_tsdb_out_of_order_samples_total                 # outside the window: rejected
```

**The second one climbing means data is being lost.** Then run `date -u` on the suspect machine and compare with the server.

**How to fix**: fix that machine's NTP. **Do not paper over it by enlarging `OutOfOrderTimeWindow`** — a wider window costs memory, and a machine with a wrong clock is writing wrong timestamps anyway.

### Several Center instances, each holding half[​](#several-center-instances-each-holding-half "Direct link to Several Center instances, each holding half")

**The data is on one Center process's local disk.** Two replicas means two half-datasets, and which one a query lands on is arbitrary — so an arbitrary half is missing, **with no error at all**, just holes in the chart.

**How to confirm**: hit `/metrics` on **each instance separately** and compare their `prometheus_tsdb_head_series`. If both are non-zero and only their sum matches what you expected, this is it. There is also a startup warning that other active instances were detected in the same engine cluster, but it is **printed once** and easily missed.

**How to fix**: the embedded store and multiple instances are mutually exclusive. High availability means moving to an external store; to stop the bleeding right now, scale back to one instance.

### You are querying a different source from the one being written[​](#you-are-querying-a-different-source-from-the-one-being-written "Direct link to You are querying a different source from the one being written")

**How to confirm**: under **Integrations → Data sources**, check the `embedded-tsdb` entry still exists with the URL `http://127.0.0.1:17000/prometheus`. Then run the same query against **each data source in turn** under **Explorer → Metrics** and find where the data actually is.

Two situations send people to the wrong place:

* with `[[Pushgw.Writers]]` forwarding to an external store, the data is in **both**, but their retention differs — so widening the range leaves only one of them populated;
* if an **enabled Prometheus-type data source already exists** at startup, Nightingale **skips auto-registering** `embedded-tsdb`. Samples are **still written to the local store**; there is simply nothing in the UI pointing at it, which presents as "the data disappeared" when in fact nobody can query it.

**How to fix**: in the second case, create a Prometheus data source aimed at `http://127.0.0.1:17000/prometheus` and it becomes queryable. Note also that **editing the `embedded-tsdb` record's URL achieves nothing** — every restart writes it back from the config.

### Remote access is blocked by the local-only restriction[​](#remote-access-is-blocked-by-the-local-only-restriction "Direct link to Remote access is blocked by the local-only restriction")

With no `BasicAuthUser` configured, `/prometheus/api/v1/*` **only accepts requests from the local machine**; everything else gets a 403:

```
embedded tsdb endpoints only accept requests from the n9e host by default;

set EmbeddedTSDB.BasicAuthUser/BasicAuthPass (or DatasourceUrl) to allow remote access
```

**How to confirm**: curl that endpoint from another machine; this body is the answer. The check uses the **connection's peer address** and ignores every forwardable header, so `X-Forwarded-For` and friends cannot change the outcome.

**How to fix**: if Grafana, `n9e-edge` or another collector genuinely needs to read it directly, say so explicitly:

```
[EmbeddedTSDB]

BasicAuthUser = "n9e"

BasicAuthPass = "<password>"
```

Once set, the auto-registered data source URL switches from `127.0.0.1` to the detected host IP.

## Confirming recovery[​](#confirming-recovery "Direct link to Confirming recovery")

1. `prometheus_tsdb_head_max_time` advances on every refresh — the write path works;
2. `prometheus_tsdb_out_of_order_samples_total` has stopped climbing — nothing is being dropped as out of order;
3. `prometheus_tsdb_lowest_timestamp` converts to a date consistent with your configured retention;
4. Under **Explorer → Metrics**, pick `embedded-tsdb`, query something certain to exist (`up`, or any host's `cpu_usage_idle`), widen the range over the problem window, and confirm the line is continuous;
5. Test fire any alert rule that depends on this data and confirm the query returns something.

Old data that the retention policy already deleted **does not come back** after the fix — this step only confirms that nothing is being lost from now on.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The full output of `curl --noproxy '*' http://127.0.0.1:17000/metrics | grep prometheus_tsdb_`;
2. The verbatim `[EmbeddedTSDB]` section and the result of `du -sh data/tsdb`;
3. How many Center instances are running, and whether `[[Pushgw.Writers]]` is configured;
4. The **exact time range** of the gap, and the process log covering it;
5. The query that failed and which data source it used.

**Redacting**: replace `BasicAuthPass` and any credentials inside external store URLs. Metric names and values can be pasted as they are.

## Next[​](#next "Direct link to Next")

* Where that data source came from: [Auto-registered Embedded TSDB datasource](https://n9e.github.io/docs/data/embedded-tsdb.md)
* When to move off it: [Embedded TSDB single-Center limits](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md)
* Migrating without downtime: [External TSDB and dual-write migration](https://n9e.github.io/docs/install/external-tsdb.md)
* The source connects but returns nothing: [Data source connects but queries return no data](https://n9e.github.io/docs/troubleshooting/no-data.md)
* The collection side: [Categraf troubleshooting](https://n9e.github.io/docs/data/categraf/troubleshooting.md)
