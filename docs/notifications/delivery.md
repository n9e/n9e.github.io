---
title: "Retries and delivery status"
sidebar_label: "Retries and delivery status"
description: "Failed sends are retried only for connection failures, with parameters per send type; the outcome of every message is in the notification log, kept for seven days."
---

Where this page ends: you know where a notification can get stuck between "decided to send"
and "they received it", which failures are retried and which are not, and where to look
afterwards to find out what happened to one specific message.

## How a message actually leaves

The send path branches on the media type's **request type** (`request_type`):

| Request type | How it is sent | Concurrency control |
|---|---|---|
| `http` (DingTalk, WeCom, Feishu Card, Telegram, Callback, your own webhooks) | Queued per media type, sent asynchronously | **Concurrency** on the media type |
| `smtp` (Email) | Sent synchronously through the mail connection pool | **Batch** on the media type (mails per connection) |
| `flashduty` / `pagerduty` / `script` | Called directly, synchronously | none |

When the HTTP queue is full the message is dropped with a failure record reading
`failed to enqueue notify task, queue is full`. Seeing that means the target is too slow or the
concurrency is set too low.

## Retry only covers "could not connect"

This is the part people misread. The retry loop for HTTP media types works like this:

- **The request never went out** (DNS failure, connection refused, timeout) → wait one **retry
  interval** and try again, up to **retry times** attempts. When all of them fail the record
  reads `all retries failed, last error: <the last error>`.
- **The target returned any HTTP response** → **return immediately, no retry.** 200 counts as
  success, anything else as failure, and the record reads
  `status_code:<code>, response:<body>`.

So DingTalk answering 400 "keywords not in content", or WeCom answering 45009 "rate limited",
is **not retried**. That is deliberate: re-sending something the target explicitly rejected
achieves nothing and is unfriendly to downstream deduplication.

One edge worth knowing: **retry times set to 0 means nothing is sent at all** — the loop body
never runs, and you get an `all retries failed` record with an empty error. Do not use it as a
throttle.

## Retry settings differ per request type

| Setting | `http` | `flashduty` / `pagerduty` |
|---|---|---|
| Timeout | Timeout (ms), 10000 on the built-ins | Timeout (ms), 5000 on the built-in FlashDuty |
| Retries | Retry times, 3 on the built-ins | Retry times, 3 when unset |
| Wait | Retry interval (ms), 100 on the built-ins | Retry sleep (ms), 1000 when unset |
| Attempts actually made | equals retry times | retry times + 1 |

The defaults the "add media type" form pre-fills are not identical to the built-ins (timeout
10000, concurrency 3, retries 3, interval 3000). Adjust them to taste.

The three paths also disagree about what an error status code means:

- **`http`** — only 200 is success; anything else is recorded as a failure but **is not
  retried**;
- **`pagerduty`** — 200 and 202 are success; **any other status is retried** up to the retry
  count;
- **`flashduty`** — as long as the request left the machine it counts as success; the status
  code is recorded but never judged, because re-sending would break the target's deduplication.

## Dropped before anything is sent

In these cases no request is made at all, but **a failure record is still written**:

| What the record says | Cause | Fix |
|---|---|---|
| `message_template not found` | That notification config has no message template | Pick one in the notification rule. FlashDuty, PagerDuty and Callback media types need none, which is why the UI hides the field for them |
| `notify_channel not found` | The media type was deleted — **or disabled**; the engine cache holds only enabled ones | Re-enable it, or switch to another |
| `failed to enqueue notify task, queue is full` | The HTTP send queue backed up | Raise the media type's concurrency, or find out why the target is slow |

Two other cases produce **no record at all**, because the event never reached the notification
stage: an event pipeline on the notification rule dropped it, or it is a recovery event and the
rule does not notify on recovery.

## Where to see whether it landed

The open-source edition has no standalone "notification records" menu page; records hang off
the event: **Alerts & Notifications → Events → open an event → Notification records → View
detail**.

The drawer shows **Alert rule notification** and **Subscription rule notification** as two
tables, with columns notification rule ID, channel, username, target and status. Three things
to keep in mind:

- **Several records for the same (channel, target) pair are merged into one row.** The worse
  status wins and the detail strings are concatenated, so a single row can carry both a success
  and a failure fragment.
- **Targets are masked by default**, last 8 characters replaced with asterisks. Only email,
  SMS, voice, script and mute records show the full value — for those the target is something
  the recipient can see anyway.
- Records are written asynchronously (an in-memory queue flushed in batches every 100 ms), so
  refreshing the instant after a send may show nothing yet.

There are three statuses: **success**, **failure**, and **muted**. The last one comes from a
"mute notification only" mute rule: the channel shows as `mute`, the target as
`id=<mute rule id>`, and the detail names the mute rule. That is how you answer "what exactly
did we swallow during that window" — see [Mute rules](../events/mute-rules.md).

## Records are kept for 7 days

`notification_record` is a large, continuously written table. The center process cleans it once
a day at 01:00 and **keeps 7 days by default**. To change that, add this to the `[Center]`
section of the center's config file:

```toml
[Center]
# retention days for notification records, default 7
CleanNotifyRecordDay = 30
```

If you need long-term retention, export the rows elsewhere rather than raising this value —
the table grows in proportion to your alert volume.

## Next

- Prove the channel works first: [Test a notification end to end](./test.md)
- The message body failed to render: [Template rendering errors](../troubleshooting/template-errors.md)
- Nothing arrives at all: [Alert event exists but no notification arrives](../troubleshooting/no-notification.md)
