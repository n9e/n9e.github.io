# High availability and failure domains

Which failures a multi-instance deployment survives, which it does not, and how to test it.

High availability in Nightingale needs no extra component: **run several `n9e` processes with identical config, sharing one MySQL and one Redis**. This page is about what that actually protects, what it does not protect at all, and how to prove it before you need it.

## Building the cluster[​](#building-the-cluster "Direct link to Building the cluster")

Deploy `n9e` on several hosts with the same configuration file, pointing at the same database and the same Redis. There is no leader to elect, no cluster to initialise, no third component to install.

Only three sections have to match:

```
[DB]

DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"



[Redis]

RedisType = "standalone"

Address = "redis:6379"



# only instances in the same engine cluster share rules with each other

[Alert.Heartbeat]

EngineName = "default"
```

Leaving `[Alert.Heartbeat] IP` empty makes the process detect its own outbound IP, and the instance identity becomes `<IP>:<HTTP port>`. In containers, or on hosts with several NICs, set it explicitly so the identity does not drift with the network environment.

**System → Alerting engines** lists the instances currently alive, grouped by engine cluster. A **Last heartbeat** that stops advancing is the signal that an instance is in trouble.

## How rules are distributed[​](#how-rules-are-distributed "Direct link to How rules are distributed")

Every instance writes a heartbeat row into `alerting_engines` once a second (`[Alert.Heartbeat] Interval`, 1000 ms by default). **An instance that has heartbeat within the last 30 seconds counts as alive**; the live instances form a consistent hash ring, and each alert rule lands on one instance by rule ID. So a rule runs on exactly one instance at a time, and there are no duplicate alerts.

The ring is built per data source: an instance only takes part in the distribution for the data sources it is associated with. Rows with no heartbeat for over 600 seconds are cleaned up by the Center process every 10 minutes.

That is where the failover time comes from:

| Stage                                         | Takes                                         |
| --------------------------------------------- | --------------------------------------------- |
| Instance dies until it is considered inactive | Up to 30 seconds                              |
| Ring rebuild (next heartbeat)                 | About 1 second                                |
| The new owner starts evaluating               | Immediately, unless it has just restarted too |

A freshly started process **waits 30 seconds before it starts evaluating** (`[Alert] EngineDelay`, 30 seconds by default), so config can sync from the database into memory. Count that in when you roll a cluster: restart one instance at a time, and wait for it to reappear on the alerting engines page before touching the next one.

## What it survives, what it does not[​](#what-it-survives-what-it-does-not "Direct link to What it survives, what it does not")

| Failure                                         | Result                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| One `n9e` instance dies                         | Its rules are taken over within 30 seconds; that batch is not evaluated meanwhile                                                                |
| One `n9e` instance is restarted for an upgrade  | Same, plus the 30-second evaluation delay after start                                                                                            |
| The metadata database is unavailable            | **Everything is down** — rules, users and events all live there, and there is no degraded mode                                                   |
| Redis is unavailable                            | **A process that cannot reach Redis at startup exits**; losing it at runtime breaks sessions and heartbeat caches widely                         |
| One data source is unavailable                  | Only the rules using it; the query error is written into the evaluation records                                                                  |
| A notification channel is unavailable           | Events are still produced; the notification record shows the failure                                                                             |
| The instance holding the embedded TSDB dies     | Metrics cannot be written and history cannot be queried for that period                                                                          |
| The link between centre and an edge site breaks | The edge keeps evaluating and notifying locally — see [Edge network partition behavior](https://n9e.github.io/docs/operations/edge-partition.md) |

The conclusion is blunt: **several instances only remove one failure domain, the `n9e` process itself**. MySQL and Redis need their own high availability; Nightingale does not compensate for them.

## Turn off the embedded TSDB first[​](#turn-off-the-embedded-tsdb-first "Direct link to Turn off the embedded TSDB first")

The embedded store keeps its data on the **local disk of one Center process**. With several replicas each holds a fragment, and they also overwrite each other's auto-registered data source URL, so query results go silently incomplete — no error, just a gap in the chart.

```
[EmbeddedTSDB]

Enable = false
```

At startup, Center logs a warning when it detects other active instances in the same engine cluster. For the migration path see [Embedded TSDB single-Center limits](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md).

## Rehearsing it[​](#rehearsing-it "Direct link to Rehearsing it")

Do this once while nothing is broken; it beats reading documentation while something is.

1. **Record the baseline.** Open the alerting engines page and note the instance list, then take the evaluation count: `curl --noproxy '*' http://n9e:17000/metrics | grep n9e_alert_rule_eval_total`.
2. **Stop one instance.** `kill` one of the `n9e` processes — not `kill -9`, so it goes through graceful shutdown. **Expected result**: the instance disappears from the alerting engines page within 30 seconds.
3. **Check that rules are still running.** Read `n9e_alert_rule_eval_total` again on a surviving instance. **Expected result**: it keeps climbing, and faster than before, because it picked up another batch of rules.
4. **Check that alerts still come out.** Set up a rule beforehand whose threshold is certain to be met so it fires every cycle. **Expected result**: with one instance down, that rule still produces events and still delivers notifications.
5. **Bring the instance back.** **Expected result**: it reappears on the alerting engines page after about 30 seconds, and one evaluation cycle later `n9e_alert_rule_eval_total` is climbing on both.

Step 4 is the one people skip. A live instance with climbing counters does not prove the delivery chain works — a broken channel, template or notification rule leaves the first three steps looking perfectly healthy.

## Related[​](#related "Direct link to Related")

* [Production topology](https://n9e.github.io/docs/operations/topology.md)
* [Embedded TSDB single-Center limits](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md)
* [Upgrade and database migration](https://n9e.github.io/docs/operations/upgrade.md)
* [Monitor Nightingale itself](https://n9e.github.io/docs/operations/self-monitoring.md)
