# Edge loses contact with the center

During a partition the edge keeps alerting locally but its events never reach the center — that is expected; an edge that never connected is a misconfiguration.

The edge instance's heartbeat under **System → Alerting engines** has frozen, or its row has disappeared altogether; or people at the site received an alert while the centre's event list shows nothing at all.

That last one is this page's signature symptom: **somebody got paged and the system has no record of it.** During a partition that is **expected behaviour**, not a fault — establishing that first saves most of the investigation.

## First: a partition, or never connected at all[​](#first-a-partition-or-never-connected-at-all "Direct link to First: a partition, or never connected at all")

This sets the direction, and the two directions are investigated completely differently:

| Ask yourself                                                          | Conclusion                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------- |
| Has this edge **ever appeared normally** in the alerting engines list | Yes → a genuine partition; read "what keeps working" below    |
| It has **never once appeared** since it was deployed                  | A configuration problem; read the first two root causes below |

The test is hard-edged: **a running edge survives a partition indefinitely; a booting edge does not.** At startup it performs one full config sync, and a failure in any of more than a dozen caches calls `exit(1)` — immediately and hard, with no degraded mode. So "the process will not start" and "the process is alive but the heartbeat stopped" are two different problems: the first means config or network was already broken at boot, only the second is a partition.

Related: **an edge needs its own Redis** and cannot share the centre's; a process that cannot reach Redis at startup also exits.

## What keeps working during a partition, and what does not[​](#what-keeps-working-during-a-partition-and-what-does-not "Direct link to What keeps working during a partition, and what does not")

The edge pulls configuration from the centre every 9 seconds and holds it in memory. **When a pull fails the cache keeps the last good copy and is never cleared**, and the consistent hash ring is not rebuilt either, so rule ownership is frozen for the duration. Both are deliberate.

| Capability                       | During a partition                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Rule evaluation                  | **Continues**, on the last synced rules, against the site's own data sources    |
| Muting, subscriptions, workflows | **Continue**, on the last synced config                                         |
| Sending notifications            | **Continues, and goes out directly from the edge**, not via the centre          |
| Evaluation records (evallog)     | **Continue**, written to the edge's own local disk                              |
| Creating or editing rules        | Stops. A rule changed centrally is invisible to the edge until the link returns |

"Notifications go out directly from the edge" carries a network prerequisite people miss: **the edge site must be able to reach DingTalk, Feishu, WeCom, your SMTP server and your webhook endpoints directly.** A firewall that only permits edge → centre still leaves you unable to notify.

## Events produced during a partition are lost for good[​](#events-produced-during-a-partition-are-lost-for-good "Direct link to Events produced during a partition are lost for good")

This is the important section.

An event created at the edge is POSTed to the centre's `/v1/n9e/event-persist` to be stored. During a partition that POST is retried **3 rounds** (100 ms initial interval, doubling, 2 s per-attempt timeout — worst case about 6.3 s against a single address), and **the event is then dropped**. There is no local queue, no disk spool, and no backfill once the link returns.

The consequences:

* no row in the alert event tables, so it appears in neither active nor historical events;
* the event ID is 0, so notification records and template `event_id` values are 0 too;
* the notification record is lost as well — it is a single POST with no retry at all.

**The notification itself is still sent**: a failed write never blocks delivery. So the lived experience during a partition is exactly "someone got the alert, but the system has no record".

**How to confirm it is this**: on **the edge's own** `/metrics` (port 19000):

```
curl -s --noproxy '*' http://n9e-edge:19000/metrics \

  | grep 'n9e_alert_rule_eval_error_total' | grep 'persist_event'
```

The `stage="persist_event"` dimension **only increments when an event fails to persist**, making it the most direct count of events lost to a partition. The edge log carries the matching line:

```
ERROR event:<event hash> persist err:<error>
```

The in-memory event queue with its ten-million ceiling is **not a partition buffer** — the consumer drains it continuously and a failed write does not block, so it never accumulates.

## Common root causes, and how to confirm each[​](#common-root-causes-and-how-to-confirm-each "Direct link to Common root causes, and how to confirm each")

### `APIForService` is off at the centre — and off is the shipped default[​](#apiforservice-is-off-at-the-centre--and-off-is-the-shipped-default "Direct link to apiforservice-is-off-at-the-centre--and-off-is-the-shipped-default")

The edge pulls configuration from the centre's `/v1/n9e/*`, a group of endpoints governed by `[HTTP.APIForService]` — whose **shipped value in `etc/config.toml` is `Enable = false`**. Which makes this by far the most common cause of "a newly deployed edge has never connected".

**How to confirm**: the edge log repeatedly shows failed requests against `/v1/n9e/...`; at the centre the endpoint simply does not exist. A BasicAuth mismatch gives 401 instead.

**How to fix**: configure both sides, with matching credentials:

```
# the centre's etc/config.toml

[HTTP.APIForService]

Enable = true

[HTTP.APIForService.BasicAuth]

user001 = "<replace the shipped default>"
```

```
# the edge's etc/edge/edge.toml

[CenterApi]

Addrs = ["http://n9e:17000"]

BasicAuthUser = "user001"

BasicAuthPass = "<the same as above>"

Timeout = 9000
```

Several `Addrs` are tried **one after another, first success wins** — not broadcast in parallel.

One more instance of the same setting is easy to miss: to read the edge's **evaluation records** from the centre's UI, **the edge's own** `[HTTP.APIForService]` also needs `Enable = true` (its shipped value is likewise `false`), with credentials matching the centre's — the centre forwards that request using its own.

### The wrong config directory at startup[​](#the-wrong-config-directory-at-startup "Direct link to The wrong config directory at startup")

```
n9e-edge --configs etc/edge
```

**`--configs` defaults to `etc`**, which holds the **centre's** `config.toml`. Point it there and the edge loads the centre's configuration — **with no error**, and completely wrong behaviour.

**How to confirm**: look at the process command line, then at the port the edge is listening on. It should be 19000 (`[HTTP] Port` in `etc/edge/edge.toml`); listening on 17000 means it loaded the centre's file. The heartbeat cluster name is a second clue: `etc/edge/edge.toml` sets `EngineName = "edge"` while the centre's sets `"default"` — **which engine cluster the instance appears under on the alerting engines page tells you directly which file it read.**

**How to fix**: add `--configs etc/edge` and restart.

### The network from the edge to the notification channels is closed[​](#the-network-from-the-edge-to-the-notification-channels-is-closed "Direct link to The network from the edge to the notification channels is closed")

**How to confirm**: from **the edge machine itself**, curl the webhook address or telnet the SMTP port. The centre being able to reach them proves nothing — during a partition the edge is the sender.

**How to fix**: open the egress policy for the edge site, not for the centre.

### Somebody restarted the edge during the partition[​](#somebody-restarted-the-edge-during-the-partition "Direct link to Somebody restarted the edge during the partition")

**A running edge survives a partition; one restart and it will not come back** until the link returns. This turns "still alerting" into "not alerting at all", and it is the most damaging item on this page.

**How to confirm**: the process is simply gone, and the log ends with a config sync failure during startup.

**How to fix**: **do not restart, upgrade, or edit the edge's config file while the link is down.** Check the auto-restart policy of whatever supervises it, so it does not helpfully restart the process for you mid-partition.

## Confirming recovery[​](#confirming-recovery "Direct link to Confirming recovery")

Nothing needs doing by hand once the link returns, and nothing can be. Confirm in this order:

1. **System → Alerting engines**: the edge instance reappears under the cluster named by `EngineName`, with **Last heartbeat** ticking over. (A row with no heartbeat for 30 seconds is removed from the list, so "the row is there and the time is moving" is the hard signal;)
2. The edge log no longer shows failed `/v1/n9e/...` requests — the config caches catch up on the next 9-second cycle;
3. `n9e_alert_rule_eval_error_total{stage="persist_event"}` **stops climbing**;
4. The centre's event list shows **newly produced** events from that site;
5. Pick one of that site's rules and **test fire** it, walking the whole chain: query, evaluation, event, notification.

**Events and notification records lost during the partition do not come back; there is no backfill.** The only evidence that survives from that window is the **evaluation records** on the edge's local disk, which do not depend on the centre.

One more normal behaviour: in the narrow window where the centre actually committed but the response was lost, the retry inserts a second historical event row. **Occasional duplicate history after a partition is expected.**

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The edge's startup command line (especially `--configs`) and the full `etc/edge/edge.toml`;
2. The `[HTTP.APIForService]` section from the centre's `etc/config.toml`;
3. The edge log covering the partition, especially the `/v1/n9e/` and `persist err:` lines;
4. `curl --noproxy '*' http://n9e-edge:19000/metrics | grep n9e_alert_rule_eval_error_total`;
5. The alerting engines row for this instance (instance, cluster name, last heartbeat).

**Redacting**: replace `BasicAuthPass`, the Redis password and channel webhooks and tokens; write addresses as placeholders like `n9e-edge:19000` and `n9e:17000`. Keep the value after `stage=` and the error text verbatim.

## Next[​](#next "Direct link to Next")

* The full partition behaviour model: [Edge network partition behavior](https://n9e.github.io/docs/operations/edge-partition.md)
* Deploying an edge: [Edge data centers](https://n9e.github.io/docs/install/edge.md)
* Choosing a deployment shape: [Production topology](https://n9e.github.io/docs/operations/topology.md)
* The event exists but nothing was sent: [Alert event exists but no notification arrives](https://n9e.github.io/docs/troubleshooting/no-notification.md)
* No data at the centre either: [Data source connects but queries return no data](https://n9e.github.io/docs/troubleshooting/no-data.md)
