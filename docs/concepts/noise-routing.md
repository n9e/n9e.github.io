---
title: "Noise reduction and routing model"
sidebar_label: "Noise reduction and routing model"
description: "Mute rules, subscriptions, pipelines and notification rules are not alternatives: they act on an event in a fixed order, which is why a muted alert can still page."
last_reviewed: 2026-10-10
---

Nightingale has four mechanisms that act on an event. They are **not alternatives** — each acts at
a different moment. Getting the order wrong is what produces "I muted it and still got paged" and
"the pipeline rewrote the label but routing did not follow".

## The actual order

```
a rule evaluates and produces an event
        │
        ├─1 event pipeline attached to the alert rule
        │     processors run in order: rewrite labels, enrich, or drop the event outright
        │
        ├─2 mute rules
        │     · mute event and notification (default) → the event is never created
        │     · mute notification only              → event created and recorded, just not sent
        │
        ├─3 the event is stored; subscriptions fan it out to other teams here
        │
        └─4 per notification rule:
              ├─ event pipeline attached to the notification rule (a second, separate hook)
              ├─ match on severity, labels and time window
              └─ pick the media type and message template, then send
```

Two things that catch people out:

- **Pipelines run before mutes.** Labels a pipeline writes are therefore visible to mute rules.
- **There are two pipeline hooks**: one on the alert rule, one on the notification rule. The first
  affects everything downstream; the second affects only that one notification rule's delivery.

## Which one to reach for

| What you want | Use |
|---|---|
| Silence during a change window | Mute rule, "mute event and notification" |
| Keep the record, just do not send right now | Mute rule, "mute notification only" |
| This class of event should not exist at all | Pipeline on the rule, with a drop processor |
| Attach owner, site, or other context to events | Pipeline label-enrichment processor |
| Another team also wants to hear about these | Subscription rule |
| S1 phones people, S3 only goes to a chat room | Notification rule, per-severity media |
| One incident should not send a hundred messages | Mute rules plus a for-duration long enough to filter spikes |

## The two mute modes differ more than they look

- **Mute event and notification** (default): the event is **never created**. Clean, but the history
  for that window has a hole in it, which hurts when you review the incident afterwards.
- **Mute notification only**: the event is created and recorded, flagged as muted, and simply not
  sent. Use this when you want to know afterwards what happened during the window.

## A subscription is not a forward

A subscription means "**I also want to receive events matching this**". The subscriber configures
it, and picks their own media and severity filter. The rule's owner does not need to know who
subscribed.

That is different from adding one more recipient to somebody else's notification rule: this way you
do not have to touch their configuration.

## Related

- [Mute rules](../events/mute-rules.md)
- [Alert subscriptions](../events/subscriptions.md)
- [Event pipelines](../events/pipelines.md)
- [Notification rules](../notifications/rules.md)
- When nothing arrives, walk this chain: [Why is there an alert event but no notification?](../troubleshooting/no-notification.md)
