---
title: "Noise reduction patterns"
sidebar_label: "Noise reduction patterns"
description: "Recipes that hold up in production: flapping, storms during deploys, duplicate sources, and what should never page a human."
---

This page is organised by symptom: recognise which kind of noise you have, then apply the
matching recipe. The order the mechanisms act in is in
[Noise reduction and routing model](../concepts/noise-routing.md); here it is only about use.

## Flapping: fires, recovers, fires again

A metric crossing the threshold back and forth produces dozens of trigger-recover-trigger cycles
overnight.

**Do not** start by moving the threshold or adding a mute — that hides the symptom. In order:

1. **Add a for-duration.** Requiring the condition to hold for a while filters out almost all
   spikes;
2. **Tighten the recovery condition.** The default "no data means recovered" mis-fires when data
   has gaps; switch to "recover only when data exists and the trigger condition is not met" —
   see [Evaluation interval and recovery](../alerting/evaluation.md);
3. **Smooth it in the query.** `avg_over_time` and friends flatten instantaneous jitter, which is
   cleaner than patching it up on the alerting side;
4. **Raise the repeat interval.** The event may well deserve to exist; it does not deserve a
   reminder every few minutes.

For the diagnostic walk-through, see
[Alerts fire and recover repeatedly](../troubleshooting/alert-flapping.md).

## Storms during a deploy

Releases, restarts and drills set off every affected service at once.

Create a [mute rule](./mute-rules.md), with two choices that matter:

- **Pick "mute notifications only".** Events are still produced and recorded, they just are not
  sent, so afterwards you can still check whether anything actually went wrong during the window.
  "Mute events and notifications" leaves a hole in that history;
- **Pick the time type to match.** A one-off deploy window is a fixed time with a quick duration;
  a weekly maintenance window is a periodic time, configured once and effective indefinitely.

Narrow the scope with **labels** (`env=prod`, `service=order`) rather than the business group
alone — the mute form warns you specifically that with no data source and no event tags it will
mute the whole group.

The least effort: while it is happening, open one event in
[Active events](./active-historical.md) and click **Mute** at the bottom of the detail panel —
the labels are already filled in.

## One failure, several rules ringing

A host goes down and four rules fire together: host unreachable, process missing, port closed,
upstream timeout.

1. **Confirm it really is one failure.** Pick an aggregate rule that groups by host
   (`{{.TagsMap.ident}}`) above the active list; if dozens of events fold into a single card, they
   are derived alerts from one host — see
   [Event aggregation and deduplication](./aggregation.md);
2. **Suppress the derived ones, keep the root cause.** Mute them by the derived rules' labels, or
   drop them by rule name with the event drop processor in an
   [event pipeline](./pipelines.md):

   ```
   {{ if eq $event.RuleName "Port unreachable" }}true{{ end }}
   ```

3. **The durable fix is severity.** Give the root-cause rule S1 and the derived ones S3, then let
   S3 go only to a chat room and never to a phone — see [Conditional routing](./routing.md). The
   derived alerts remain available for diagnosis without waking anyone.

## Duplicate data sources, duplicate alerts

The same data lands in two time-series databases (old and new coexisting during a migration), a
rule is not pinned to one source, so it queries both and one problem produces two events — same
labels, different data source.

Rules default to "all data sources"; during a migration, **pin them explicitly** — see
[Scope by business group and data source](../alerting/scope.md).

How to spot it: filter the active list by **Data source** on the left. If each of two sources has
an identical event, this is what you are looking at.

## What should never page a human

One rule of thumb: **if it can wait until morning, it should have no phone channel.**

- **S3 / Info**: chat room or email only. In the notification rule, tick only S1 under
  "Applicable severities" on the phone configuration — see [Conditional routing](./routing.md);
- **Recovery notices**: exclude recovery events in the phone configuration's applicable
  attributes, or turn off "notify on recovery" on the rule entirely;
- **Non-production**: drop `env=dev` events in a workflow, or set up a long-lived periodic mute;
- **Alerts with no action attached**: if you do nothing when it arrives, the rule should be
  deleted or downgraded — see [Rule design best practices](../alerting/best-practices.md).

## A self-check list

When the on-call channel passes 20 alerts a day, walk this:

1. Open the active list, aggregate by `{{.RuleName}}`, and find the two or three rules doing the
   flooding;
2. For each, ask: **what did I do when it arrived?** Nothing → downgrade or delete;
3. There is an action and it is always the same one: turn it into a
   [self-healing script](./self-healing.md) and let it run itself;
4. There is an action but only during working hours: give it a time window so it is silent at
   night;
5. What is left genuinely needs a person — confirm it is S1, and that only this class has a phone
   channel;
6. Look again a week later and check that new rules have not undone the work.

## Next

- The order the mechanisms act in: [Noise reduction and routing model](../concepts/noise-routing.md)
- Configuring the mutes: [Mute rules](./mute-rules.md)
- Configuring drops and enrichment: [Event pipelines](./pipelines.md)
- It reached the wrong people: [Notifications go to the wrong people](../troubleshooting/wrong-routing.md)
