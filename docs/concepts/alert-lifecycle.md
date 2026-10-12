# Alert lifecycle and S1 / S2 / S3 severity

An event is identified by rule plus label set and passes through firing, ongoing and recovered; S1 / S2 / S3 change nothing mechanically — they signal urgency.

Last reviewed 2026-10-10

## An event's life[​](#an-events-life "Direct link to An event's life")

Between being created and disappearing, an event shows up in three places:

1. **Events → Active events** — currently firing, not yet recovered;
2. **Notification records** — who it was sent to, over which media, and whether that worked;
3. **Events → Historical events** — where it lands after recovery (or manual deletion), for review.

Active is "now", historical is "the past". An event moves from the first list to the second; it is never in both.

## What makes two alerts "the same alert"[​](#what-makes-two-alerts-the-same-alert "Direct link to What makes two alerts \"the same alert\"")

Not the rule — the **rule plus the label set**.

One `Host memory usage too high` rule running against 5 machines produces **5 separate events**, because their `ident` labels differ. When one machine recovers, only that event recovers; the other four keep firing.

Conversely, repeated triggers with an identical label set are treated as a continuation of the same alert, not as new alerts. **A badly designed label set therefore breaks grouping directly** — see [Labels, annotations and identity](https://n9e.github.io/docs/concepts/labels-annotations.md).

## The three severities are for humans[​](#the-three-severities-are-for-humans "Direct link to The three severities are for humans")

Nightingale does not impose a meaning on S1/S2/S3, but without a shared convention the levels decay into decoration. A convention that works is to split on **"does someone act now"** rather than on technical severity:

| Level  | Meaning                                       | Typical delivery               |
| ------ | --------------------------------------------- | ------------------------------ |
| **S1** | Someone acts now; waking them up is justified | Phone, SMS                     |
| **S2** | Handle it today, in working hours             | Chat message with a mention    |
| **S3** | Worth knowing, not worth interrupting anyone  | Chat room, or a dashboard only |

One question settles the level of a rule: **"at 3am, is this worth getting out of bed for?"** If not, it is not S1.

Severity does two concrete things in Nightingale: notification rules can route different levels to different media, and a single rule's several thresholds can each carry a level, with the inhibit switch keeping only the most severe.

## Manual intervention[​](#manual-intervention "Direct link to Manual intervention")

From the active events list you can do two things to an event:

* **Mute** — generate a mute rule straight from this event, to stop the bleeding;
* **Delete** — remove it from the active list. This fixes nothing: if the condition still holds, the next evaluation brings it back.

## Related[​](#related "Direct link to Related")

* [Evaluation, recovery and state changes](https://n9e.github.io/docs/concepts/evaluation.md)
* [Active and historical events](https://n9e.github.io/docs/events/active-historical.md)
* [Labels, annotations and severity](https://n9e.github.io/docs/alerting/labels-severity.md)
