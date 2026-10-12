# Why is there an alert event but no notification?

Event but no message: in the notification log, no record means a mute or notification rule stopped it; a failure points at the channel, a success at the receiver.

Last reviewed 2026-10-10

The event is plainly there on the events page, and the chat room, the mailbox and the phone are all silent. This page walks the **real order** in which an event travels from creation to delivery, with a way to confirm each step.

Gauge urgency by breadth: one rule not delivering is a rule fix. **Nothing delivering at all** — check the media type itself and whether `n9e_alert_notify_record_queue_size` is backing up.

## Open the notification records first[​](#open-the-notification-records-first "Direct link to Open the notification records first")

**Events → open the event → Notification records.** This is the biggest time-saver on the page: whether records exist, and whether they succeeded, cuts the problem space by two thirds.

| What you see                | Where it is stuck                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------- |
| No records at all           | The event never reached the notification stage — see "No notification records at all" |
| Records, status failed      | Delivery was attempted and failed — see "There are records, and they failed"          |
| Records with channel "mute" | A notification-only mute rule matched                                                 |
| Records, status success     | Nightingale sent it — see "The record says success but nobody got it"                 |

**Targets in the records are masked by default** (the last 8 characters become asterisks). SMS, voice, email, script and mute records are the exceptions and show the raw value.

Notification records are kept for **7 days** by default and cleaned at 01:00 daily. Investigate old incidents promptly.

## The real order of the chain[​](#the-real-order-of-the-chain "Direct link to The real order of the chain")

Get the order wrong and you will look in the wrong place. It is:

```
a rule evaluates and produces an event

      │

      ├─1 workflow attached to the alert rule (can drop the event outright)

      │

      ├─2 mute rules

      │      · mute event and notification (default) → the event is never created

      │      · mute notification only              → event created and stored, just not sent

      │

      ├─3 the event is stored; subscriptions fan out copies here

      │

      └─4 per notification rule:

            ├─ workflow attached to the notification rule (a second, separate hook)

            ├─ match on severity, labels, attributes and time window

            └─ pick the media type and message template, then send
```

The two things people remember backwards: **workflows run before mutes**, and **there are two workflow hooks** — one on the alert rule, one on the notification rule.

## No notification records at all[​](#no-notification-records-at-all "Direct link to No notification records at all")

The event exists, the records are empty. Work backwards through step 4:

**1. Does the rule reference a notification rule?** An empty Notification rule field means nothing gets triggered. This is the most common omission on a new rule, and neither the media type test nor the notification rule test can detect it.

**2. Is the notification rule enabled?** A disabled one is **silently skipped** with no log line.

**3. Is this a recovery event with recovery notifications turned off?** The log says:

```
notify_id: 1, event:<hash>, should skip notify
```

**4. Did the workflow on the notification rule drop it?** This case **does** leave a failed notification record, with an error like:

```
processor_by_notify_rule_id:1 pipeline_id:3, drop by pipeline
```

A workflow on the **alert rule** dropping the event writes no notification record at all (the event never reached the notification stage) — it leaves a `drop_by_pipeline` stage in the evaluation records instead.

**5. A match filter excluded it.** The most common case, and it **writes no notification record**, only a log line. Four rejection reasons, fixed wording, greppable:

```
event time not match time filter

event severity not match severity filter

event tag not match tag filter

event attributes not match attributes filter
```

**Watch the severity in particular**: **checking no severity at all means nothing ever matches** — there is no "empty means all" here. Notifications lost this way look completely normal in the UI.

A successful match logs too, which is how you confirm you got this far:

```
notify send timeMatch:true severityMatch:true tagMatch:true attributesMatch:true event:<hash> notify_config:...
```

**6. How long until a config change takes effect?** Notification rules, message templates and media types all refresh from a **9-second** cache. Testing immediately after saving may still exercise the old copy.

## There are records, and they failed[​](#there-are-records-and-they-failed "Direct link to There are records, and they failed")

The detail on the record is the reason:

| Detail                                         | Meaning                                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `notify_channel not found`                     | The media type was deleted or disabled                                                                                                         |
| `message_template not found`                   | This notification config has no message template selected                                                                                      |
| `failed to enqueue notify task, queue is full` | This media type's send queue (100,000 per channel) is full — the target is stuck                                                               |
| `all retries failed, last error: ...`          | The address could not be reached at all                                                                                                        |
| `status_code:400, response:...`                | The target received it and rejected the content — usually a token, a signature or the message format                                           |
| `failed to execute template: ...`              | Template rendering failed, see [Why does notification template rendering fail?](https://n9e.github.io/docs/troubleshooting/template-errors.md) |

One exception worth knowing about `message_template not found`: **callback, flashduty and pagerduty do not consume a message template**, so a missing template does not stop them. Every other media type with no template is **dropped and a failed record is written**. Note that callback is exempted by the media-type identifier `callback` — a copy of the callback media type saved under a different identifier is **not** exempt.

## The record says success but nobody got it[​](#the-record-says-success-but-nobody-got-it "Direct link to The record says success but nobody got it")

The most counter-intuitive section, and the most frequently reported problem.

**HTTP media types treat only HTTP 200 as success, and never look at the response body.** DingTalk answering 200 with `{"errcode":310000,"errmsg":"keywords not in content"}` is recorded as **success**. So the first thing to do is read the whole `response:` fragment on the record — the answer is usually written there.

Two related details: **201 / 202 / 204 count as failures** (only 200 succeeds), and **only transport errors are retried** — any HTTP response at all returns on the first attempt.

Per media type, a few individual quirks:

* **FlashDuty**: whatever status code comes back, it is **always recorded as success** (a deliberate choice, so retries cannot corrupt the far side). Only the response body in the record tells you the truth — read the number after `status_code:`.
* **PagerDuty**: 200 and 202 are success, anything else is retried, four attempts by default.
* **Email**: the record's channel is always the literal `Email` and a successful detail is always the literal `success` — **not the SMTP response**. Worse, **a successful enqueue writes no record at all**; only a real send failure does. And when the first attempt fails and the retry succeeds, the record still says failed. Trust the inbox, not the record.
* **WeCom with a screenshot**: text and image are two requests, and a failure on the image request fails the whole notification.

If the response body also looks healthy, the problem is on the far side: bot keyword or IP allowlist rules, the mail landing in spam, a phone number missing from the recipient list. Use the media type's **Test** button to send one more and watch whether the far side receives it — that draws a clean boundary.

## A subscription cannot rescue you[​](#a-subscription-cannot-rescue-you "Direct link to A subscription cannot rescue you")

A subscription **adds** a notification; it never removes the original rule's. So "subscribed and got nothing" and "the original rule got nothing" are two independent problems.

One trap: **a subscription with no notification rule selected leaves the subscribed copy outside the v9 notification path entirely** — the subscription does nothing. Records produced by a subscription appear under Subscription rule notification in the event detail.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The event ID and the full notification records (targets in them are already masked, so they are safe to share);
2. The rule's Notification rule field, and each notification config's severity checkboxes, label filters and time windows;
3. Log lines from that moment matching `notify_id:`, `notify send timeMatch:` and `not match`;
4. `curl -s http://127.0.0.1:17000/metrics | grep n9e_alert_notify_record_queue_size`.

**Redacting**: replace webhook URLs, access tokens, signing secrets, phone numbers and addresses; keep the `errmsg` in the response body — that is the answer.

## Next[​](#next "Direct link to Next")

* It arrived, but the body is an error message: [Why does notification template rendering fail?](https://n9e.github.io/docs/troubleshooting/template-errors.md)
* It went to the wrong people: [Why does the event pipeline route to the wrong destination?](https://n9e.github.io/docs/troubleshooting/wrong-routing.md)
* The event was never created: [Why does the alert not fire when the query returns results?](https://n9e.github.io/docs/troubleshooting/alert-not-firing.md)
* The full model: [Noise reduction and routing model](https://n9e.github.io/docs/concepts/noise-routing.md)
* Testing the chain end to end: [Test a notification end to end](https://n9e.github.io/docs/notifications/test.md)
