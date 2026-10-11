---
title: "Notification architecture"
sidebar_label: "Notification architecture"
description: "Three objects carry a notification: the rule picks recipients, the media type says how to send, the template says what to send; a missing link makes it vanish."
---

Where this page ends: you know which three objects an alert event passes through on its way
from "fired" to "your phone rang", what each one owns, which field joins them, and which
missing link makes a notification disappear without a sound.

## Three objects

| Object | Menu | Question it answers | Who configures it |
|---|---|---|---|
| Media type | Alerts & Notifications → Media types | **How to send**: which URL, which HTTP method, what the request body looks like, timeout and retries | An admin, once; reused site-wide |
| Message template | Alerts & Notifications → Message templates | **What to send**: renders event fields into text | Usually the built-in one; clone it when you want different wording |
| Notification rule | Alerts & Notifications → Notification rules | **Who gets it, and when**: pick a media type and a template, fill in this destination's bot token or recipients, then filter by severity and labels | Whoever owns that chat room or that team |

The important split: **secrets do not live on the media type, they live on the notification
rule**. One "DingTalk" media type is shared by ten business groups, and each notification rule
supplies its own `access_token` — no need for one media type per chat room. Email and SMS are
the exception: an SMTP server address or a cloud vendor's access key is site-wide
configuration and lives on the media type.

## One delivery, end to end

```
an alert rule fires an event, carrying the list of notification rule ids attached to it
        │
        └─ for each notification rule:
             1. run the event pipeline attached to this notification rule (optional)
                 └ pipeline dropped the event → this rule stops here
             2. recovery event, and the rule does not notify on recovery → skip
             3. for each "notification config":
                  a. match the filters: time range → severity → labels → attributes,
                     all four must pass
                  b. look up the media type by channel_id, the template by template_id
                       either missing → dropped, plus one failed notification record
                  c. render the template into fields such as $tpl.title / $tpl.content
                  d. substitute $tpl, $params and $sendtos into the media type's URL,
                     headers and body, then send
                  e. write a notification record, success or failure
```

Two things that catch people out:

- **The filters are ANDed, but an empty value does not mean the same thing everywhere.**
  Empty time ranges, labels and attributes mean *no restriction*; an **empty severity list
  matches nothing at all**, which effectively disables that notification config.
- **Mute rules and subscriptions are not on this path.** They act earlier, when the event is
  stored. For the full ordering see [Noise reduction and routing model](../concepts/noise-routing.md).

## Template and media type are joined by a string

A message template carries a `notify_channel_ident` (labelled **Media type** in the UI), and a
media type carries the same field. Once you pick a media type in a notification rule, the
template dropdown lists only templates whose media type matches — **a string comparison, not a
foreign key**.

That explains three things:

- The 20 built-in message templates cover 20 media types (`dingtalk`, `wecom`, `feishucard`,
  `telegram`, `slackwebhook`, `discord`, `jira`, `email`, `tx-sms` …), while the open-source
  edition ships **only 6 media types**. The extra templates are not decoration: create a media
  type whose type is `slackwebhook` and that built-in template becomes selectable immediately.
- The field names in a template (`title`, `content`, `subject`, `incident`) must match the
  `{{$tpl.xxx}}` references in the media type's request body. A mismatch renders that field
  empty — the message goes out with a hole in it.
- Changing the media type clears the selected template and parameters, because the old ones
  almost certainly do not fit the new one.

## Three kinds of media type that ignore templates

Media types whose `request_type` is `flashduty` or `pagerduty`, plus the one identified as
`callback`, build their payload straight from event fields and never render a message
template. The UI hides the **Message template** dropdown for them accordingly.

Every other media type is **dropped entirely when no template is selected**, leaving a failed
notification record that reads `message_template not found`. That is the single most common
cause of "everything looks configured but nothing arrives".

## One rule, several notification configs

A notification rule holds a list of notification configs, each with its own media type,
template, recipients and filters. Three configs in one rule give you this:

| Config | Media type | Severities | Time range |
|---|---|---|---|
| 1 | Phone | S1 | Any |
| 2 | DingTalk group | S1, S2 | Any |
| 3 | Email | S3 | Mon–Fri 09:00–18:00 |

One event is matched against each config independently, and sent once per config that matches.

## Not in the open-source edition

Notification **escalation** (page someone else when an alert stays open) and notification
**aggregation** (merge similar events into one message) are not available. The
open-source notification rule form has neither section, and the open-source backend does not
process them. To keep the volume down here, use mute rules, per-severity filters on
subscriptions, and dropping events in an event pipeline.

## Configure a custom medium {#custom-media}

For an HTTP endpoint not covered by a built-in medium, create a medium with an
explicit **media type**, such as `custom_webhook`, and choose HTTP as its sending
type. Configure its URL, method, headers and body for the receiver's contract.

Declare rule-specific inputs such as a token in the medium's parameter
configuration; their values belong in the notification rule. A body can reference
the selected message template through `$tpl`, and rule parameters through `$params`.
These are Go-template variables, not JSON placeholders.

Create a message template with the same media-type string, then select the medium
and template in a notification rule and fill in its parameters. Matching the
display names is insufficient: the media-type strings must match.

Use the [notification test](./test.md) before attaching the rule to production
alerts. Confirm both a successful delivery record and the receiver's actual
payload. For a whole-event callback, see [Callback](./callback.md); for a local
executable, see [Script medium](./script.md).

## Next

- Configure one: [Notification rules](./rules.md)
- Change the wording: [Templates and variables](./templates.md)
- Prove it works before you rely on it: [Test a notification end to end](./test.md)
- Where failures show up: [Retries and delivery status](./delivery.md)
