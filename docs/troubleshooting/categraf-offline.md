---
title: "Why does a Categraf target show as offline?"
sidebar_label: "Why does a Categraf target show as offline?"
description: "A target shows offline when its heartbeat has not reached Redis in time — clock skew, a wrong heartbeat URL or network policy; update time is not a liveness signal."
last_reviewed: 2026-10-10
---

The status cell for a host in the host list turns yellow or red, yet you SSH in and Categraf is
plainly alive. This page starts with how "offline" is decided, because everything else is guesswork
until you know the rule.

Scope: this only affects the host's liveness judgement and the rules built on it (`target_miss`,
`offset`). Metric ingest is a **separate path** — a host with a dead heartbeat may still be sending
metrics, and the reverse is equally possible.

## How "offline" is decided

The status cell looks at exactly one thing: **how long ago this host last sent a heartbeat**.

| Since the last heartbeat | Status cell | `target_up` in the API |
|---|---|---|
| < 60 s | green | 2 |
| 60 – 180 s | yellow | 1 |
| ≥ 180 s, or no record in Redis at all | red | 0 |

**Both thresholds are hard-coded; there is no setting for them.** A collector whose heartbeat
interval is longer than 60 seconds is permanently yellow here — that is not a fault.

The heartbeat timestamp lives in Redis under the key `n9e_meta_update_time_<ident>` with a **24-hour
TTL**, so a host down for more than a day drops straight to the "no record in Redis" row.

## Separate "no heartbeat" from "no metadata"

These are two different Redis keys with two different TTLs. The symptoms look alike, the causes do
not:

- **the status cell is red** — `n9e_meta_update_time_<ident>` expired or was never written; a
  heartbeat-path problem;
- **CPU count, memory, OS show as unknown** — `n9e_meta_<ident>` (7-day TTL) is missing; the API
  reports `cpu_num = -1` for this.

A host can be green with unknown metadata, or the other way round. Establish which one you have
before going further.

## The heartbeat path: agent to Redis

### On the agent

Heartbeat failures always show up in the Categraf log on that machine:

```bash
journalctl -u categraf | grep -i heartbeat
```

- `E! failed to do heartbeat: ... connection refused` — the network is blocked, or Nightingale is
  not listening;
- `E! heartbeat status code: 401` — the server has `[HTTP.APIForAgent.BasicAuth]` on and the agent's
  `[heartbeat] basic_auth_user/pass` must be filled in;
- `E! heartbeat status code: 404` — wrong path (it must be `/v1/n9e/heartbeat`), **or the server has
  `[HTTP.APIForAgent] Enable` turned off** — that switch unregisters the route entirely, along with
  every ingest endpoint;
- nothing at all — `[heartbeat] enable` is probably false.

**`hostname` is mandatory in the heartbeat body**; without it the server refuses, and an edge node
answers 400 `hostname is required`.

The full agent-side walkthrough is
[Categraf troubleshooting](../data/categraf/troubleshooting.md).

### On the server

Heartbeats are buffered in memory and **flushed to Redis once per second**, and the timestamp is
stamped at flush time rather than at arrival. A second or two of jitter is normal.

A failed Redis write leaves this in the Nightingale log:

```
update_ts: failed to write target ts in redis: <err>, keys: [n9e_meta_update_time_n9e-web-01], retry 1/3
failed to write target ts in redis after 3 retries, keys: [...]
```

If you see this, stop looking at the agent — the heartbeat arrived and the server failed to record
it. Three retries, 500 ms apart, inside a 3-second budget; past that the batch is dropped.

## Do not use "Updated at" as a liveness signal

The `update_at` column on the target row is **not the heartbeat time**. It moves in only two cases:

1. the host is registered for the first time;
2. the agent reports **changed metadata** — IP, tags, `engine_name`, agent version, OS.

A healthy host that reports continuously and never changes can carry an `update_at` from months ago.
**Judging liveness by that field is simply wrong**; `beat_time` in the API is the heartbeat.

## Every host goes red after restarting Nightingale

Check `[Redis] RedisType` first. **The shipped default is `miniredis` — an in-process, in-memory
Redis with no persistence.** Restarting Nightingale wipes every heartbeat record, so **every host is
red for the next 60 seconds**, and `target_miss` rules can genuinely fire during that window.

For production, point `RedisType` at a real Redis (`standalone` / `cluster` / `sentinel`). Until you
do, the post-restart wave of red is expected and not worth investigating.

## The host never appeared at all

If the symptom is "this host was never in the list" rather than "it turned red", the problem is
registration, not heartbeat timeout:

- **Only a heartbeat creates a target row.** Writing metrics does not — unless you explicitly turn on
  `Pushgw.GetHeartbeatFromMetric`, which is off by default and absent from the sample config. A
  writer that sends metrics but no heartbeat will get its samples in and never appear in the host
  list.
- **The writer carries a `host` label instead of `ident` / `agent_hostname`** (Telegraf, typically),
  so the host name is discarded. Append `?ignore_host=false` to the write URL.

## Collect this before you ask

1. The host's `ident`, the colour of its status cell, and the value in the Updated at column;
2. `journalctl -u categraf | grep -i heartbeat | tail -50`;
3. Any `update_ts:` lines from the Nightingale log in the same window;
4. The server's `[Redis] RedisType` and `[HTTP.APIForAgent] Enable` values.

**Redacting**: replace host names, IPs and BasicAuth credentials; write addresses as placeholders
like `n9e:17000`.

## Next

- The host is there but has no metrics: [Why does a data source connect but return no data?](./no-data.md)
- The full agent-side walkthrough: [Categraf troubleshooting](../data/categraf/troubleshooting.md)
- The host list page itself: [Targets](../data/categraf/targets.md)
- Configuring liveness alerts: [Rule scope](../alerting/scope.md)
