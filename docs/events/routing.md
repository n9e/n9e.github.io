# Conditional routing

Send an event to different channels or teams depending on its labels and severity.

Where this page ends: you know which piece of configuration to touch for "S1 phones people, S3 only goes to a chat room" and "`env=prod` goes to the on-call room, `env=dev` goes nowhere".

## Routing happens inside notification rules[​](#routing-happens-inside-notification-rules "Direct link to Routing happens inside notification rules")

There is no separate routing table. Once an event exists it goes through each **notification rule** it matched, and a notification rule can hold several **notification configurations** — that is the layer where the actual fan-out happens.

One notification configuration = **one media type + one message template + a set of recipients + a set of filter conditions**. If the filters do not match, that configuration is skipped and the others still run.

## 1. Fan out inside one notification rule[​](#1-fan-out-inside-one-notification-rule "Direct link to 1. Fan out inside one notification rule")

Go to **Alerts & Notifications → Notification rules**, edit a rule, and click "Add notification configuration" — each one you add is another outlet. The four filter groups on each are empty (unrestricted) by default and are AND-ed:

| Condition               | The split it buys you                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Applicable severities   | S1 by phone, S2 by SMS, S3 to a chat room                                                            |
| Applicable time periods | By day of week plus time range. Chat by day, phone at night                                          |
| Applicable tags         | By event label, with the same six operators as mute rules                                            |
| Applicable attributes   | By a fixed set: business group, data source, is-recovered, alert rule, severity, host business group |

The smallest "S1 phones, S3 chats" setup: two notification configurations in one rule — the first with a phone media type and only S1 ticked, the second with a chat bot and only S3.

**Ticking none of the three severities disables that configuration** — it matches no event at all.

The is-recovered attribute deserves its own mention: to keep recovery notices out of the phone channel, exclude them in that configuration's attributes rather than testing for it in the template.

## 2. Fan out across several notification rules[​](#2-fan-out-across-several-notification-rules "Direct link to 2. Fan out across several notification rules")

One alert rule can reference several notification rules. When two audiences care about **genuinely different sets of events**, splitting into two notification rules is easier to maintain than piling configurations into one — each carries its own authorized teams, so edits do not collide.

The test is simple: same people, same scenario → notification configurations; different teams owning their own thing → different notification rules.

## 3. Let the other team subscribe[​](#3-let-the-other-team-subscribe "Direct link to 3. Let the other team subscribe")

If the reason for the split is "another team also wants these alerts", do not edit their notification rule — have them create a [subscription](https://n9e.github.io/docs/events/subscriptions.md). The subscriber decides what to filter and which notification rule sends it, and the rule's owner is not involved at all.

## 4. What should never be sent, drop in a workflow[​](#4-what-should-never-be-sent-drop-in-a-workflow "Direct link to 4. What should never be sent, drop in a workflow")

The first three decide where something goes; this one decides that it does not. Use the **event drop** processor in an [event pipeline](https://n9e.github.io/docs/events/pipelines.md) to stop it by condition:

```
{{ if eq $event.TagsMap.env "dev" }}true{{ end }}
```

Attached to an **alert rule**, the event is dropped before muting and nothing downstream ever sees it. Attached to a **notification rule**, only that one rule's send is affected.

## Which one to reach for[​](#which-one-to-reach-for "Direct link to Which one to reach for")

| What you want                                 | Use                                                           |
| --------------------------------------------- | ------------------------------------------------------------- |
| Same people, different media per severity     | Several notification configurations in one rule               |
| Different channels at night and by day        | Applicable time periods on a configuration                    |
| Different teams owning different things       | Several notification rules                                    |
| Somebody else wants my alerts too             | A subscription rule                                           |
| This class of event should not be sent at all | The event drop processor in a workflow                        |
| Quiet during a change window                  | [Mute rules](https://n9e.github.io/docs/events/mute-rules.md) |

## What catches people out[​](#what-catches-people-out "Direct link to What catches people out")

* **The label has to exist first.** Routing on `env` presupposes an `env` label on the event. If there is none, add it in the rule's append-labels or [rewrite one in a workflow](https://n9e.github.io/docs/events/relabel-enrich.md).
* **Applicable tags match event labels, not rule names.** To route by rule, use the "alert rule" attribute instead.
* **Order does not matter.** The configurations in one notification rule are **parallel**; every matching one sends. It is not first-match-wins, so write mutually exclusive conditions if you want mutually exclusive outcomes.
* **Test after editing.** Each configuration has a "Run test" that walks a history event or a mock event through it — see [Verify the notification path](https://n9e.github.io/docs/notifications/test.md).

## Next[​](#next "Direct link to Next")

* Writing the rule itself: [Notification rules](https://n9e.github.io/docs/notifications/rules.md)
* What the message looks like: [Message templates](https://n9e.github.io/docs/notifications/templates.md)
* It reached the wrong people: [Notifications go to the wrong people](https://n9e.github.io/docs/troubleshooting/wrong-routing.md)
* The order all of this happens in: [Noise reduction and routing model](https://n9e.github.io/docs/concepts/noise-routing.md)
