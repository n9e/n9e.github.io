# Evaluation, recovery and state changes

A rule does not fire on the first high value: three timing parameters and a small state machine decide when it first fires, when it recovers and whether it flaps.

A rule does not fire the moment a query comes back high. Three timing parameters and a small state machine decide when it first speaks, when it stops, and whether it flaps.

## Three timing parameters[​](#three-timing-parameters "Direct link to Three timing parameters")

| Parameter           | Called in the UI    | Meaning                                                         | Default         |
| ------------------- | ------------------- | --------------------------------------------------------------- | --------------- |
| Execution frequency | Execution frequency | How often the query runs                                        | `@every 60s`    |
| For-duration        | For duration        | How long the condition must hold before an event is produced    | 60s             |
| Recover duration    | Recover duration    | How long after the condition clears before recovery is declared | 0 (immediately) |

Each solves a different problem:

* **The execution frequency** sets both how fast you find out and how much load the rule puts on the data source. Do not run a 10-second SQL statement on a 15-second frequency. The field takes a cron expression; `@every 60s` is the default.
* **The for-duration** filters spikes. CPU touching 100% for one sample is not worth waking anyone; three minutes of it is.
* **The recover duration** filters spikes on the way down. Without it, a metric oscillating around the threshold produces recovered–triggered–recovered–triggered. Note that it holds back the **recovery event itself**, not just the notification: until the window passes, the event is still firing.

## How the state moves[​](#how-the-state-moves "Direct link to How the state moves")

```
   OK

    │  condition true

    ▼

  Pending ────── held for the for-duration ──────> Firing (event created, notification sent)

    │                                                 │

    │ condition false                                 │ condition false

    ▼                                                 ▼

  back to OK                                      Observing

  (no event was ever created, so no recovery)         │ survives the observation window

                                                      ▼

                                                  Recovered (recovery notification)
```

The key point: **going from Pending straight back to OK sends nothing at all**, because no event was ever created. Only something that actually reached Firing can later recover.

Recovery notifications themselves can be switched off per rule.

## Custom recovery conditions[​](#custom-recovery-conditions "Direct link to Custom recovery conditions")

By default, recovery means "the trigger condition is no longer true". Some cases want asymmetric thresholds — "alert above 90%, but do not call it recovered until it drops below 70%" — which is the standard way to stop flapping.

**Open-source Prometheus rules do not have that switch.** Recovery is always the inverse of the trigger, and the recover duration is the only anti-flap lever. Types that use the trigger-condition form — ElasticSearch, Loki, ClickHouse and the rest — do carry a separate recovery condition, and its default differs by type: log-shaped sources default to "recovered when the query returns nothing".

## One rule can carry several severities[​](#one-rule-can-carry-several-severities "Direct link to One rule can carry several severities")

A rule's queries are a list, and each query has its own severity:

```
cpu_usage_active > 75   →  S3

cpu_usage_active > 85   →  S2

cpu_usage_active > 95   →  S1
```

Combined with the inhibit switch: when one target matches several of them at once, only the most severe survives, so you do not get three messages.

## Finding out what one evaluation actually did[​](#finding-out-what-one-evaluation-actually-did "Direct link to Finding out what one evaluation actually did")

The rule page keeps **evaluation records**: one per cycle, holding what the query returned, what the verdict was, whether a pipeline dropped it, and whether a mute rule caught it.

"The query returns data in the explorer but the rule does not fire" is nearly always answered here. See [Evaluation execution records](https://n9e.github.io/docs/alerting/execution-records.md).

## Related[​](#related "Direct link to Related")

* [Alert lifecycle and severity](https://n9e.github.io/docs/concepts/alert-lifecycle.md)
* [Evaluation interval and recovery](https://n9e.github.io/docs/alerting/evaluation.md)
* [Alert fires repeatedly or never recovers](https://n9e.github.io/docs/troubleshooting/alert-flapping.md)
