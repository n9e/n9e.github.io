# Coexistence and rollback plan

Run both systems on the same data during the switch, compare what fires, and cut over channel by channel.

Where this page ends: a working method for running two alerting systems side by side, reconciling them daily, and backing out of any stage in about a minute. It applies equally whether you are coming from Alertmanager, Zabbix or Grafana Alerting.

## What is actually running in parallel[​](#what-is-actually-running-in-parallel "Direct link to What is actually running in parallel")

Only **evaluation** and **notification** are duplicated. The data is not:

```
collection and storage (one copy, shared by both)

        │

        ├──> old system evaluates ──> old system notifies ──> the real on-call room / phone

        │

        └──> Nightingale evaluates ──> Nightingale notifies ──> a shadow channel (nobody paged)
```

Nightingale **queries your existing stores in place**, so nothing is copied and nothing is dual-written. The only extra cost of the parallel period is query load: two systems polling the same backend on their own schedules. With a lot of rules, glance at the store's load first.

The one case that does need dual writes is if you are **also** changing stores (Prometheus to VictoriaMetrics, say). That is a separate project — do not put it in the same window as the alerting migration.

## Step 1: keep Nightingale away from people[​](#step-1-keep-nightingale-away-from-people "Direct link to Step 1: keep Nightingale away from people")

Sending to the on-call room on day one means validating your configuration with a production incident. Let it idle for a while first.

Two ways, depending on what you want to compare:

* **A shadow channel** (recommended): create one notification rule whose media points at a dedicated room, mailbox, or a Callback URL that only writes a log, and attach the whole batch of new rules to it. The upside is that the delivery chain — media, template, filters — gets validated too.
* **Events without notifications**: enable the rules normally and cover the business group with a **mute notifications only** [mute rule](https://n9e.github.io/docs/events/mute-rules.md). Events are produced and recorded as usual, they just are not sent. No shadow media to build, but the notification side is not exercised at all.

Either works, but **do not use "mute events and notifications"** — that produces no events, and then there is nothing to compare.

*Verify*: Nightingale's events show up under **Alerts & Notifications → Events**, and not one of its messages has reached the on-call room.

## Step 2: reconcile three buckets[​](#step-2-reconcile-three-buckets "Direct link to Step 2: reconcile three buckets")

Every day (or every shift) pull both sides' results and sort them into three buckets. On the Nightingale side the source is the historical [alert events](https://n9e.github.io/docs/events/active-historical.md) list, filtered by business group and time range.

| Bucket                         | What it means                                                                                                | Look at first                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Only the old system fired**  | A rule was missed, or the metric was never queried at all                                                    | Confirm the data exists in the Metrics explorer or Log explorer, then read the rule's [evaluation records](https://n9e.github.io/docs/alerting/execution-records.md) |
| **Only Nightingale fired**     | A mistyped threshold, or an inhibition, dependency or maintenance window on the old side you had not noticed | [Test fire](https://n9e.github.io/docs/alerting/test-fire.md) the rule and read the actual value at each stage                                                       |
| **Both fired but differently** | Severity mapping, for-duration, or recovery condition drift                                                  | Walk them item by item; squeezing six severity levels into three loses information by definition                                                                     |

Evaluation records are the most useful thing here: they persist what **each round** queried and how it judged, on the alerting engine's local disk, so "why did this round not fire" is an answerable question rather than a guess.

**The third bucket is the one people wave through.** Both fired, so it looks fine — but a for-duration that differs by 30 seconds, or a different recovery condition, shows up during a real incident as "one side paged ten minutes earlier" or "one side never recovered".

Run for a full business cycle before moving on — at least a week, covering a weekend and a release.

## Step 3: cut over channel by channel[​](#step-3-cut-over-channel-by-channel "Direct link to Step 3: cut over channel by channel")

The unit of cutover is a **channel tier**, not a rule. The risk is not in the rules; it is in whether the phone rings at 3am.

| Tier | Nightingale sends to             | Old system sends to               | Watch                                                  |
| ---- | -------------------------------- | --------------------------------- | ------------------------------------------------------ |
| 0    | Shadow channel                   | Every real channel                | Reconcile, per step 2                                  |
| 1    | Group bot / chat (low intrusion) | Phone, SMS, email                 | On-call starts actually reading Nightingale's messages |
| 2    | Chat + email                     | Phone and SMS only                | One week                                               |
| 3    | Everything                       | **Evaluates but does not notify** | One week                                               |
| 4    | Everything                       | Stopped evaluating                | Migration complete                                     |

Leave at least a week between tiers. Moving from tier 1 to tier 2 is a **notification rule** change, not an alert rule change: use **Alert rules → More → Update alert rules** to swap the attached notification rule across the whole batch in one operation. See [Notification rules](https://n9e.github.io/docs/notifications/rules.md).

How to do tier 3 depends on the old system: point Alertmanager's receivers at a blackhole, disable Zabbix's Actions, pause Grafana's rules. What they have in common is **keeping evaluation on**, so the step 2 reconciliation can continue.

## Two things that must never run in parallel[​](#two-things-that-must-never-run-in-parallel "Direct link to Two things that must never run in parallel")

* **Anything that acts on its own.** [Self-healing](https://n9e.github.io/docs/events/self-healing.md) scripts, callbacks in event pipelines, automatic ticket creation — only one side may have these on. With both on they run twice: the service restarts twice, two duplicate tickets get filed. **Turn Nightingale's self-healing and callbacks off for the whole parallel period** and enable them at tier 4.
* **The same phone or SMS channel.** Phone and SMS are usually billed per message and they wake people up. Two systems dialling the same number costs real money and real credibility. From tier 0 to tier 2, do **not** put phone or SMS media on the Nightingale notification rules.

## The rollback for each tier[​](#the-rollback-for-each-tier "Direct link to The rollback for each tier")

Rollback has the same granularity as cutover — one tier:

| Where you are | How to back out                                                                     | How long it takes         |
| ------------- | ----------------------------------------------------------------------------------- | ------------------------- |
| Tiers 0–2     | Re-attach the batch to the shadow notification rule, or just bulk-disable the rules | One bulk operation        |
| Tier 3        | Turn notification back on in the old system (Action / receiver / rule)              | One config change         |
| Tier 4        | Turn evaluation back on in the old system                                           | Depends on the old system |

Three disciplines:

1. **Delete nothing in the old system before tier 4.** Disabled, paused, pointed at a blackhole — all fine. Deleted means rollback becomes a rebuild.
2. **Export a snapshot of the Nightingale rules as JSON before each tier.** **Alert rules → More → Export rules JSON**, into version control. Note that the export drops the effective time window — see [Import, export and reuse](https://n9e.github.io/docs/alerting/import-export.md).
3. **Backing out is not a failure.** Dropping a tier, fixing the divergence and cutting again is far cheaper than pushing through tier 3 with a known difference.

## When it counts as done[​](#when-it-counts-as-done "Direct link to When it counts as done")

All four have to hold at once:

* two consecutive weeks with nothing actionable in any of step 2's three buckets;
* on-call responds to Nightingale's messages **only**, with nobody double-checking the old UI;
* the old system has had notifications off at tier 3 for over a week, with no complaints of a missed alert;
* Nightingale's self-healing and callbacks are back on and verified.

With all four true, go to tier 4, then walk the [production checklist](https://n9e.github.io/docs/get-started/production-checklist.md) over the new system's own reliability.

## Next[​](#next "Direct link to Next")

* Everything to check before going live: [Production checklist](https://n9e.github.io/docs/get-started/production-checklist.md)
* How events are processed in Nightingale: [Noise reduction and routing model](https://n9e.github.io/docs/concepts/noise-routing.md)
* The per-system guides: [From Prometheus + Alertmanager](https://n9e.github.io/docs/migration/from-alertmanager.md), [From Zabbix](https://n9e.github.io/docs/migration/from-zabbix.md), [From Grafana Alerting](https://n9e.github.io/docs/migration/from-grafana-alerting.md)
