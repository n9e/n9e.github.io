---
title: "Edge network partition behavior"
sidebar_label: "Edge network partition behavior"
description: "What n9e-edge does when it loses the center: evaluation continues, notifications go local, and what syncs back later."
---

`n9e-edge` exists so that alerting survives a partition. This page spells out what actually happens
during one — including the fact that **alert events produced during a partition are lost for good**,
and the one operational rule that follows from it.

## What the edge does normally

The edge process never talks to the database. Every 9 seconds it pulls configuration from the
centre — alert rules, muting rules, subscriptions, business groups, targets, notification rules,
channels, message templates, data sources, users and teams — and holds it all in memory.

Those requests hit the centre's `/v1/n9e/*`, so the centre must have it enabled:

```toml
# the centre's etc/config.toml
[HTTP.APIForService]
Enable = true
[HTTP.APIForService.BasicAuth]
user001 = "<replace this default>"
```

The edge authenticates with the same pair under `[CenterApi]`:

```toml
# the edge's etc/edge/edge.toml
[CenterApi]
Addrs = ["http://n9e:17000"]
BasicAuthUser = "user001"
BasicAuthPass = "<same as above>"
Timeout = 9000
```

Several `Addrs` are tried **one after another, first success wins** — not broadcast in parallel.

## What keeps working during a partition

| Capability | During a partition |
|---|---|
| Rule evaluation | **Continues**, using the last synced rule set against the site's own data sources |
| Muting, subscriptions, event pipelines | **Continue**, on the last synced config |
| Sending notifications | **Continues, and goes out directly from the edge**, not via the centre |
| Evaluation records (evallog) | **Continue**, written to the edge's local disk |
| Creating or editing rules | Stops — a rule changed centrally is invisible to the edge until the link returns |

When a config pull fails the cache **keeps the last good copy and is never cleared**, and the
consistent hash ring is not rebuilt either, so rule ownership is frozen for the duration. Both are
deliberate.

"Notifications go out directly from the edge" carries a network requirement people miss: **the edge
site must be able to reach DingTalk, Feishu, WeCom, your SMTP server and your webhook endpoints
directly**. A firewall that only permits edge → centre still leaves you unable to notify during a
partition.

## Events produced during a partition are lost

This is the important section on this page.

An alert event created at the edge is POSTed to the centre's `/v1/n9e/event-persist` to be stored.
During a partition that POST is retried **3 rounds** (100 ms initial interval, doubling, capped at
3 s, with a 2 s per-attempt timeout) and **the event is then dropped**. There is no local queue, no
disk spool, and no backfill once the link returns.

The consequences:

- no row in the alert event tables, so it appears in neither active nor historical events;
- the event ID is 0, so notification records and template `event_id` values are 0 too;
- the notification record is lost as well — it is a single POST with no retry at all.

**The notification itself is still sent**: a failed write never blocks delivery. So the real
experience during a partition is "someone's phone got the alert, but the system has no record of
it".

The in-memory event queue with its ten-million ceiling is **not a partition buffer** — the consumer
drains it continuously and a failed write does not block, so it never accumulates.

One edge case: if the centre actually committed but the response was lost, the retry inserts a
second historical event row. Occasional duplicate history after a partition is expected.

## The rule: never restart an edge during a partition

**A running edge survives a partition indefinitely; a booting edge exits.**

At startup the edge does one full config sync, and more than a dozen caches (alert rules, business
groups, targets, data sources, …) call `exit(1)` if that first sync fails. With the link down it
will not start — immediately and hard, not in a degraded mode.

So:

- do not restart, upgrade or edit the edge's config file while the link is down;
- check the auto-restart policy of whatever supervises it — one accidental restart turns "still
  alerting" into "not alerting at all";
- the edge needs its own Redis, and **a process that cannot reach Redis at startup also exits**.

## After the link comes back

Once connectivity returns:

- config caches catch up on their next 9-second cycle;
- heartbeats resume and the edge reappears under **System → Alerting engines**, in the engine
  cluster named by `[Alert.Heartbeat] EngineName` (`edge` in the sample config);
- **the events and notification records lost during the partition do not come back.** There is no
  backfill.

Nothing needs doing by hand, and nothing can be. The evidence that survives a partition is the
edge's local **evaluation records**, which are written to the edge's own disk and do not depend on
the centre.

To read those records from the centre's UI, the edge also needs `[HTTP.APIForService] Enable = true`
(the sample config ships `false`), with a basic auth user and password matching the centre's — the
centre forwards the request using its own credentials.

## Telling whether you are partitioned

| Where to look | What a partition looks like |
|---|---|
| System → Alerting engines | The edge instance's **Last heartbeat** freezes, then the row disappears after 30 seconds |
| The edge's log | Repeated request failures against `/v1/n9e/...` |
| The edge's evaluation records | Still being produced normally — which is exactly right |
| The centre's event list | No new alerts from that site, while people at the site are getting notified |

That last row is the signature symptom: **someone got paged and the system has no record of it**.

## Related

- [Edge data centers](../install/edge.md)
- [Production topology](./topology.md)
- [An edge node has gone offline](../troubleshooting/edge-disconnected.md)
- [High availability and failure domains](./high-availability.md)
