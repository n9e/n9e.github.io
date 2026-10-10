---
title: "Event pipeline routes to the wrong destination"
sidebar_label: "Event pipeline routes to the wrong destination"
description: "Wrong recipients usually mean the destination was decided earlier than expected: processor order, a label rewrite before the match, or the two mount points' scopes."
---

The notification went out, but to the wrong people: the on-call room's alert landed in the all-hands
room, something you muted paged anyway, one event arrived twice, or a label rewrite made it reach
nobody at all. What these share is that **the step which decided the destination is not the step you
think it is**.

Gauge urgency by direction. **Over-delivery** — people who should not have been told — is noise, and
can wait. **Under-delivery** — someone who should have been told was not — is a blind spot: stop the
bleeding with [Alert event exists but no notification arrives](./no-notification.md) first, then come
back here for the routing.

## Start at the notification records: who sent this one

**Events → open the event → Notification records.** Every record names **which notification rule**
and **which media type** sent it. Write those two down and the problem space halves immediately:

| What the records show | Where the destination was decided |
|---|---|
| One record, and its notification rule is not the one you expected | The wrong notification rule is attached to the alert rule |
| Several records with different notification rule IDs | The alert rule references several notification rules, and **each sends on its own** |
| The record sits under Subscription rule notification | It is a subscription's copy, not the original rule's |
| The record's channel reads "mute" | A notification-only mute rule matched |
| No records at all, yet somebody got the message | The event was produced on an edge — see [Edge loses contact with the center](./edge-disconnected.md) |

## Which step decides the destination

```
a rule evaluates and produces an event
      │
      ├─1 workflow attached to the alert rule   ← labels changed here are seen by everyone downstream
      │
      ├─2 mute rules                            ← they match on the labels step 1 left behind
      │
      ├─3 the event is stored; subscriptions fan out copies here
      │
      └─4 per notification rule (all of them run, independently):
            ├─ workflow attached to the notification rule ← labels changed here are seen by this rule only
            ├─ match on time window → severity → labels → attributes, in that order
            └─ per notification config, pick the media type and template, then send
```

Three places decide the destination, ordered by how often they are misread:

1. **The notification config's filters in step 4** — this, and not the recipient list on the alert
   rule, is what actually decides who gets it;
2. **The label rewrite in step 1** — everything in steps 2 and 4 uses the labels it left behind;
3. **The subscription fan-out in step 3** — it only ever adds; the original rule still sends.

The full model is in [Noise reduction and routing model](../concepts/noise-routing.md).

## Two attachment points, with completely different reach

A workflow has two attachment points, and the log says outright which one ran: the text after
`processor_by_` is either `alert_rule` or `notify_rule`.

```
INFO dispatch/dispatch.go:290 processor_by_notify_rule_id:1 pipeline_id:1, pipeline executed, status:success, message:
```

| | Attached to the alert rule | Attached to the notification rule |
|---|---|---|
| How it appears in the log | `processor_by_alert_rule_id:<rule id>` | `processor_by_notify_rule_id:<notify rule id>` |
| A label change affects | Mute rules, subscriptions, **every** notification rule | **Only this one** notification rule, this one send |
| Dropping the event means | The event is never stored; nobody hears about it | Only this notification rule stays quiet; the others still send |
| Does a drop write a notification record | **No** — it leaves a `drop_by_pipeline` stage in the evaluation records instead | **Yes**, a failed one, detail `processor_by_notify_rule_id:1 pipeline_id:3, drop by pipeline` |

**Each notification rule receives its own deep copy of the event**, so a label rewritten inside
notification rule A's workflow is invisible to notification rule B. "I rewrote the label, why is the
other chat room unchanged?" is almost always this: the workflow is on the wrong hook.

## Label rewrites happen before the match

The most counter-intuitive point on this page: **on both attachment points, the rewrite runs before
anything matches on the result.**

- The workflow on the alert rule finishes, and **only then do mute rules evaluate**. So a processor
  rewriting `env=prod` into `env=production` breaks every mute rule written against `env=prod` at
  once — which presents as "I definitely configured a mute and it paged anyway";
- The workflow on the notification rule finishes, and **only then does that rule's label filtering
  run**. Which means adding a label here is a legitimate routing technique: the very next step can
  filter on it.

The same logic applies to processor order *inside* a workflow: **rewrite-then-drop and
drop-then-rewrite are different programs.** Once an event is dropped no later processor runs, and
none of their output appears in the execution record.

## Common root causes, and how to confirm each

### Over-delivery: two notification rules each sent a copy

Notification rules have **no priority and no first-match-wins**. However many are attached to the
alert rule, that many run in turn; and within one notification rule, every notification config that
matches sends.

**How to confirm**: search the log for this event's hash — `notify rule ids:` prints one line per
notification rule:

```
INFO dispatch/dispatch.go:176 notify rule ids: 1, event: 63bfcd082b52afc11f504509aea89de0
```

The number of lines is the number that ran, and the count of notification records should agree.

**How to fix**: do not deduplicate by deleting a notification rule — that hits other alert rules
too. Add a label filter or a severity filter on the redundant notification config so this class of
event is excluded there.

### The label was rewritten and the mute rule stopped matching

**How to confirm**: open the event detail and read the **labels** section — that is the state
*after* the workflow ran. Then open the mute rule's filter conditions and compare key by key. A
mismatch is your answer, and that event's evaluation record will not carry a `muted` stage either.

**How to fix**: one of two ways — rewrite the mute rule against the new label, or move the rewrite
onto the notification rule's hook so mute rules keep seeing the original labels. The first is
better: after the rewrite, the new label is the truth in this system.

### The workflow was never entered

A workflow has its own **scope** (applicable labels, applicable attributes); an event that does not
satisfy it skips the whole workflow. That is the opposite investigation from "it ran but had no
effect", so separate the two first.

**How to confirm**: four log lines with fixed wording — grep for `pipeline_id:`:

```
processor_by_notify_rule_id:1 pipeline_id:1, event pipeline not applicable, event: <hash>
processor_by_notify_rule_id:1 pipeline_id:1, event pipeline is disabled, event: <hash>
processor_by_notify_rule_id:1 pipeline_id:1, event pipeline not found, event: <hash>
processor_by_notify_rule_id:1 pipeline_id:1, pipeline executed, status:success, message:
```

- `not applicable` — the scope did not match. **This is by far the most common one**;
- `is disabled` — the workflow is disabled (disabling does not detach it; the reference on the rule
  remains);
- `not found` — the workflow was deleted and the reference is now a dead link;
- `pipeline executed` — it really ran, so go read what it did in the execution records.

The UI route to the same answer: **Workflows → Execution records**, widen the time range first (the
default is only 6 hours), and search by event ID. **No records at all means it was never entered.**

**How to fix**: loosen the scope conditions, or turn the scope filter switch off entirely —
**with the filter switch off, every event enters**.

### The order in which a notification config filters

Matching runs **time window → severity → labels → attributes**, and **returns on the first
mismatch**. So `not match severity filter` tells you the time window already passed — the order is
itself a diagnostic.

**How to confirm**: the four rejection reasons have fixed wording:

```
event time not match time filter
event severity not match severity filter
event tag not match tag filter
event attributes not match attributes filter
```

**These four are logged at ERROR level, but they are ordinary filtering, not failures.** A wall of
red in the log here is not a problem.

A successful match logs too, and the `notify_config` it prints carries every filter on that
notification config — faster than clicking through the UI:

```
INFO dispatch/dispatch.go:453 notify send timeMatch:true severityMatch:true tagMatch:true attributesMatch:true event:<hash> notify_config:&{ChannelID:7 TemplateID:181 Params:map[] Type: Severities:[1 2 3] TimeRanges:[] LabelKeys:[] Attributes:[] ChannelIdent: UserNames:[] UserGroupNames:[]}
```

Two kinds of "empty" mean opposite things, and that is this section's trap:
**an empty `TimeRanges:[]` means every hour matches**, while an **empty `Severities:[]` means nothing
ever matches**. Severity has no "blank means all".

## Confirming the fix

Do not wait for the next real alert. Verify in this order:

1. **Hit Run test on that notification config and choose History event mode**, picking an event that
   genuinely went wrong. This mode **evaluates the match conditions first** and names the condition
   that failed — exactly what this page is about;
2. When it arrives, go back to **event detail → Notification records** and confirm the notification
   rule ID and media type are the pair you wanted, and that the **number** of records is what you
   expect (that count is the answer to an over-delivery problem);
3. If a label rewrite is involved, open that record under **Workflows → Execution records** and read
   the before/after diff on the rewrite node;
4. If muting is involved, wait for one real event and confirm its evaluation record now carries the
   `muted` stage.

Mock event mode skips every filter, so it cannot verify routing — only rendering and the channel.

## Collect this before you ask

1. The event ID / hash, and the complete notification records (targets in them are already masked,
   so they are safe to share);
2. The alert rule's Notification rule field, and for each notification config the **time window,
   severity, labels and attributes**;
3. Every log line for that event hash in that window — especially `processor_by_`,
   `notify rule ids:`, `notify send timeMatch:` and the four `not match` reasons;
4. The workflow's scope configuration, and this event's execution record including the label diff.

**Redacting**: replace webhook URLs, access tokens, phone numbers and addresses. **Keep the label
keys** — routing is decided on them; the values can become placeholders.

## Next

- Nothing arrived at all: [Alert event exists but no notification arrives](./no-notification.md)
- Fine in the test run, wrong in production: [Workflow Try run succeeds but production execution fails](./workflow-prod-fails.md)
- The full model: [Noise reduction and routing model](../concepts/noise-routing.md)
- Configuring a workflow: [Event pipelines](../events/pipelines.md)
- Reading the records: [Inspect workflow execution records](../events/execution-records.md)
- The two mute modes: [Mute rules](../events/mute-rules.md)
