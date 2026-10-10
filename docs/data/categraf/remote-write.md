---
title: "Remote write"
sidebar_label: "Remote write"
description: "Categraf batches metrics and ships them over Prometheus Remote Write; several writers can feed Nightingale and a second backend at once; failed writes are not retried."
---

Categraf does not send each sample as it is collected. Metrics go into a queue, are batched, and
shipped over Prometheus Remote Write. This page covers the four knobs on that path — and one thing
you must know: **a failed write is not retried.**

## Where the data goes

```
plugin collects → in-memory queue → batch fills → remote write → every [[writers]] target
```

Nightingale's remote write receiver is **`POST /prometheus/v1/write`**:

```toml
[[writers]]
url = "http://10.0.0.10:17000/prometheus/v1/write"
basic_auth_user = ""
basic_auth_pass = ""
# all in milliseconds
timeout = 5000
dial_timeout = 2500
max_idle_conns_per_host = 100
# headers = ["X-From", "categraf"]

## optional TLS
# use_tls = false
# tls_ca = "/etc/categraf/ca.pem"
# tls_cert = "/etc/categraf/cert.pem"
# tls_key = "/etc/categraf/key.pem"
# insecure_skip_verify = false
```

Nightingale's agent endpoints are **unauthenticated by default**, so leave `basic_auth_*` empty.
Fill them in only when the server sets BasicAuth under `[HTTP.APIForAgent]` — getting them wrong
shows up as a permanent 401 on the write side, and **no metric records it**; only the log does.

In an edge deployment, point this URL at `n9e-edge` instead. The path is the same.

## Batching and the queue

```toml
[writer_opt]
# how many series are pulled from the queue per flush
batch = 1000
# how many series the in-memory queue holds
chan_size = 1000000
```

`batch` is the flush size, `chan_size` the queue capacity. Setting either to zero or a negative
value resets it to the default.

When to touch them:

- **The queue is full** (the log shows `write ... samples failed, please increase queue size`) — you
  are producing faster than you can ship. Check whether the backend is slow or unreachable first, and
  only raise `chan_size` once you know the backend is fine;
- **The backend rejects large bodies** (a gateway with a body-size limit) — lower `batch`;
- On a host with a modest series count, leave both alone.

The queue lives in memory. **Restart the process and anything unsent is gone** — that is a deliberate
trade-off; Categraf does no local buffering.

## There is no retry

This is the part to internalise: **a batch that fails to send is dropped.**

The send loop pops a batch, writes it once, and moves on to the next batch regardless of the
outcome. There is no requeue, no backoff, no spill to disk. A backend that wobbles for 30 seconds
costs you 30 seconds of data.

A failure produces three log lines, all at `W!` level (**not `E!`** — grepping for errors will miss
them):

```
W! push data with remote write request got error: Post "http://...": dial tcp ...: connect: connection refused response body:
W! post to http://... got error: Post "http://...": dial tcp ...: connect: connection refused
W! example timeseries: labels:<name:"__name__" value:"mem_total" > labels:<name:"agent_hostname" value:"n9e-web-01" > ...
```

The third line samples one series from the failed batch, which tells you what was lost.

A non-2xx response reads like this:

```
W! post to <url> got error: push data with remote write request got status code: 401, response body: <body>
```

So: **when data loss is unacceptable, do not expect the agent to cover for you.** Either make the
backend highly available (several Nightingale replicas behind a load balancer), or put a buffering
proxy in front of it.

## Writing to several backends

`[[writers]]` is an array; repeat the block for each destination, and they are written
**concurrently**:

```toml
# primary path: to Nightingale, so target labels and self-healing work
[[writers]]
url = "http://10.0.0.10:17000/prometheus/v1/write"
timeout = 5000

# and a copy to your own VictoriaMetrics
[[writers]]
url = "http://vm:8480/insert/0/prometheus/api/v1/write"
headers = ["X-Scope-OrgID", "tenant-a"]
timeout = 5000
```

Two things to note:

- **Writers are deduplicated by URL.** Two blocks with the same url collapse into one;
- **Each destination is written independently.** One failing does not hold up another — but neither
  does another cover for it, since none of them retry.

## The cost of writing straight to a TSDB

Pointing `url` at VictoriaMetrics, Prometheus or Thanos works — they all accept remote write. But
then the data **does not pass through Nightingale**, and you lose three things:

1. **Target label rewriting.** The tags you attach to a host in the Hosts list are applied to its
   series by Nightingale as it forwards them (`Pushgw.LabelRewrite`). Bypass Nightingale and those
   labels never reach the data;
2. **Server-side timestamps.** `Pushgw.ForceUseServerTS` overwrites sample timestamps with server
   time, which is what saves you when a host's clock is wrong;
3. **Self-healing.** Script dispatch relies on the channel between agent and Nightingale.

To have both Nightingale's label handling and your own TSDB, the right answer is not to point
Categraf at the TSDB — it is to **let Categraf write only to Nightingale and have Nightingale
forward**:

```toml
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"
```

See [VictoriaMetrics](../victoriametrics.md) and
[External TSDB and dual-write migration](../../install/external-tsdb.md).

## Watching the write path itself

Enable the `self_metrics` plugin (create a `conf/input.self_metrics/` directory) and Categraf
reports on itself:

| Metric | Meaning |
|---|---|
| `categraf_info{version}` | Version, always valued 1; useful for version distribution |
| `categraf_current_queue_size` | How many series are queued right now |
| `categraf_metrics_enqueue_sum` | Cumulative series enqueued |
| `categraf_metrics_enqueue_failed_sum` | Cumulative **enqueue** failures |

**`enqueue_failed` counts "the queue was full", not "the send failed."** Categraf exposes no metric
at all for remote write success or failure — that lives only in the log. So judging write health
means watching `categraf_current_queue_size` climb, plus the `W!` lines.

## Next

- Queue growing, data not arriving: [Troubleshooting](./troubleshooting.md)
- Forwarding on the Nightingale side: [Pushgw](../../operations/pushgw.md)
- Which ingest protocols are accepted: [Write protocols](../../reference/write-protocols.md)
