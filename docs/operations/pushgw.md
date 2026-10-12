---
title: "Pushgw queue, writers and dual write"
sidebar_label: "Pushgw queue, writers and dual write"
description: "The write path: queue sizing, backpressure, multiple writers and forwarding to two backends."
last_reviewed: 2026-10-10
---

Pushgw is the "samples in, samples forwarded out" half of Nightingale. It is on by default inside
the `n9e` process and needs no attention at low volume. The moment you set up dual write, or start
losing samples, you need to know what the queue looks like, how backpressure shows up, and which
failures are silent.

## The write path

Collectors POST samples to the endpoints below. Pushgw enriches them with target labels, filters
them through the drop rules, puts them into an in-memory queue, and a consumer forwards batches to
every configured writer.

| Endpoint | Protocol |
|---|---|
| `POST /prometheus/v1/write` | Prometheus remote write (categraf and vmagent use this) |
| `POST /opentsdb/put` | OpenTSDB |
| `POST /openfalcon/push` | Open-Falcon |
| `POST /datadog/api/v1/series` | Datadog v1 series |
| `POST /proxy/v1/write` | Opaque remote-write proxy — see the last section |

All of them are governed by `[HTTP.APIForAgent] Enable` (`true` in the shipped config). Turn it off
and Pushgw registers one internal route only; no collector can write at all.

Two behaviours that are on by default (both `true` in the shipped config):

- `LabelRewrite = true` — when a series label collides with one registered on the target, **the
  database value wins**;
- `ForceUseServerTS = true` — overwrite the sample timestamp with server time, so a skewed collector
  clock does not matter. Note it **only rewrites the first sample of each series**; later points in
  a multi-point series keep their original timestamps.

## The queue: count, capacity, and that 10% watermark

```toml
[Pushgw.WriterOpt]
QueueMaxSize = 1000000   # capacity of each queue
QueuePopSize = 1000      # how many entries are popped per forward batch
```

Those two are the ones shown (commented) in the config file, but several more are in effect:

| Setting | Default | Meaning |
|---|---|---|
| `QueueNumber` | Number of CPUs (128 on a single-CPU host) | How many queues |
| `QueueMaxSize` | 1000000 | Capacity of **one** queue |
| `QueuePopSize` | 1000 | Entries popped per batch |
| `QueueWaterMark` | 0.1 | Global admission watermark |
| `RetryCount` | 1000 | Write retries |
| `RetryInterval` | 1 | Retry interval, seconds |
| `OverLimitStatusCode` | 499 | Status returned when the queues are over the limit |

**The global admission ceiling is `QueueNumber × QueueMaxSize × QueueWaterMark`.** On an 8-core host
that is `8 × 1000000 × 0.1 = 800,000`, not 8 million — the 10% discount is easy to get wrong.

Queue assignment is round-robin **per request**, not per sample. All samples in one request land in
one queue, so a few connections sending very large batches will hot-spot a single queue. Each queue
has exactly one consumer goroutine.

## What happens when it fills up

Three drops, three different things — do not conflate them:

| Case | What the client sees | Counter |
|---|---|---|
| Global watermark exceeded (checked only on `/prometheus/v1/write`) | HTTP **499**, whole request rejected | `n9e_pushgw_push_queue_over_limit_error_total` |
| One queue full | **HTTP 200**, samples silently dropped | `n9e_pushgw_push_queue_error_total{queueid}` |
| Matched a drop rule | HTTP 200 | `n9e_pushgw_drop_sample_total` |

Watch the first one: **499 is a 4xx**. Prometheus, vmagent and categraf generally treat 4xx as "this
batch is bad" and discard it rather than backing off, so the backpressure never reaches the
collector.

The second is sneakier: HTTP 200, samples gone, and the only evidence is that `queueid`-labelled
counter plus a warning log line — one that prints the entire series, which floods the log exactly
when the queue is already full.

So "am I losing samples" cannot be answered from client-side status codes. Only the metrics answer
it.

## Several writers means fan-out

Every extra `[[Pushgw.Writers]]` block is another backend, and **every batch goes to every
backend**:

```toml
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"

[[Pushgw.Writers]]
Url = "http://prometheus:9090/api/v1/write"
```

Three traps:

- **Comma-separated addresses inside one `Url` are failover — try in order, stop at the first
  success — not fan-out.** Fan-out needs separate `[[Pushgw.Writers]]` blocks.
- **Two `Url =` lines in one block: TOML keeps only the second**, and the first vanishes silently.
  The shipped config has exactly that shape (one of them commented), so it is easy to paste both.
- **A 4xx response from a writer counts as a successful write.** With a wrong host or a wrong path
  (a missing `/api/v1/write`, say) samples disappear silently and
  `n9e_pushgw_write_error_total` never moves. Always confirm in the target store that data actually
  arrived after configuring a new writer.

Writer timeout defaults: `Timeout = 10000`, `DialTimeout = 3000`,
`TLSHandshakeTimeout = 30000` (milliseconds). `WriteRelabels` is **per writer** — it only affects
the backend whose block it sits in.

## One stuck writer takes the whole queue down with it

A writer is a "critical backend" by default: the consumer writes to each critical backend
**serially and synchronously**, retrying `RetryCount` (1000) times at `RetryInterval` (1 second).
One unreachable backend can therefore block a batch for nearly 17 minutes, during which no other
backend on that queue gets a single byte, the queue fills, and samples start dropping.

For an external backend you can afford to lose, set `AsyncWrite`:

```toml
[[Pushgw.Writers]]
Url = "http://third-party:8428/api/v1/write"
AsyncWrite = true
```

That makes it non-critical: each batch goes out in its own goroutine and retries are clamped to 3,
so a slow or dead backend no longer holds up the others. The cost is that losing samples there is
quieter.

## The embedded TSDB is a writer too

With `[EmbeddedTSDB] Enable = true`, Center **appends** a writer pointing at itself
(`http://127.0.0.1:17000/prometheus/api/v1/write`), and your own `[[Pushgw.Writers]]` entries are
kept as they are. That is how dual write is implemented — the two are not alternatives.

Two consequences:

- migrating to an external store means adding `[[Pushgw.Writers]]` first, waiting until the external
  store holds enough history, then setting `[EmbeddedTSDB] Enable = false` — no downtime anywhere;
- the embedded writer is a critical backend as well, so **a stalled embedded TSDB also holds up your
  external writers**.

`[EmbeddedTSDB]` is handled by Center only. `n9e-edge`, `n9e-alert` and `n9e-pushgw` reading the
same `etc` directory print a warning and ignore the section.

## `/proxy/v1/write`: pass-through, no decoding

This endpoint does not decompress snappy, does not parse protobuf, does not add labels, does not
enter the queue, and applies neither relabelling nor drop rules. It re-POSTs the raw body to every
`[[Pushgw.Writers]]` entry.

| Limit | Default | On exceeding |
|---|---|---|
| `[Pushgw] ProxyInflightMax` | 1000 | HTTP **429** |
| `[Pushgw] ProxyMaxBodyBytes` | 33554432 (32 MiB) | HTTP **413** |

Forwarding is best-effort: no retry, failures are only logged, and **the client always gets 200**.
Its observability is `n9e_pushgw_proxy_forward_error_total{url,reason}`.

Note that this path returns a proper 429 for "try again later", whereas the queued path returns 499.

## The metrics to watch

| Metric | What it tells you |
|---|---|
| `n9e_pushgw_samples_received_total{channel}` | Volume in; a sudden drop means the collector side broke |
| `n9e_pushgw_sample_queue_size{queueid}` | Backlog; one queue much higher than the rest means uneven request distribution |
| `n9e_pushgw_push_queue_over_limit_error_total` | Requests rejected |
| `n9e_pushgw_push_queue_error_total{queueid}` | Samples dropped — non-zero means you are really losing data |
| `n9e_pushgw_write_total{url}` / `n9e_pushgw_write_error_total{url}` | Written and failed, per backend |
| `n9e_pushgw_forward_duration_seconds{url}` | Write latency per backend; use it to find the slow one |

## Related

- [External TSDB and dual-write migration](../install/external-tsdb.md)
- [Embedded TSDB single-Center limits](./embedded-tsdb-limits.md)
- [Capacity planning](./capacity.md)
- [Built-in metrics and health checks](./health.md)
