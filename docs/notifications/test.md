# Test a notification end to end

Send a test message through a real channel, from rule to phone, before you rely on it at 3 a.m.

Where this page ends: you have proof that when a real alert fires, the message lands in that chat room or that mailbox — not just that the configuration looks right on screen.

## Three levels of test[​](#three-levels-of-test "Direct link to Three levels of test")

| Level                  | Where the button is                                        | What it proves                                                          | What it does not                                              |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| Media type test        | **Test**, at the bottom of the media type editor           | The address is reachable, the secret is right, the network lets you out | Your message template, and the notification rule's filters    |
| Notification rule test | **Run test**, on each notification config in the rule form | Media type + template + recipients as one unit                          | That an alert rule actually references this notification rule |
| Real alert             | **Test fire** on the alert rule                            | The whole chain, including the binding                                  | —                                                             |

All three have to pass. The first two only prove the configuration is correct, not that a real alert will arrive.

## 1. Test the media type itself[​](#1-test-the-media-type-itself "Direct link to 1. Test the media type itself")

**Alerts & Notifications → Media types**, open one, and there is a **Test** button at the bottom.

It **really sends a message using what is currently in the form, without saving first**, so it is meant to be used while you are still filling things in. In the dialog, top to bottom:

* **Mode** — mock event (a built-in fake event whose severity and recovered flag you choose) or history event (pick real ones);
* **Media parameters** — whatever custom parameters this media type declares, e.g. DingTalk's Access Token;
* **Recipients** — shown only when the media type declares a contact key.

Expected result: it reports success, **and you actually see the message** in the room or mailbox. The success notice alone is not enough — a platform returning 200 and then dropping the message is common.

Two limits:

* **Script media types cannot be tested inline** and must be saved first. An unsaved script would be written to disk and executed, which is arbitrary code execution straight from the request body, so the backend refuses.
* **The body it sends is not your template.** The UI assembles starter content on the fly from the `{{$tpl.xxx}}` references in the media type's request body. So this step proves the channel works, not that your template is correct.

## 2. Test from the notification rule[​](#2-test-from-the-notification-rule "Direct link to 2. Test from the notification rule")

**Alerts & Notifications → Notification rules**, edit a rule, and click **Run test** on a notification config. This uses exactly the media type, template and recipients that config will use for real.

The difference between the two modes matters:

* **Use mock event** — **skips the filters entirely** and only exercises the channel. The severity used is the lowest one you checked. The mock event has rule name "Notification test mock event", trigger value `81.5`, and labels `ident=mock-host-01`, `source=notify-rule-test`.
* **Pick history events** — runs the filters first and refuses outright if the event does not match (`event severity not match severity filter` and friends). Use this to check that your filters are written correctly.

Expected result: the dialog echoes the target's response (for HTTP media types, `status_code:200, response:...`), and the message really arrives.

## 3. Fire a real alert[​](#3-fire-a-real-alert "Direct link to 3. Fire a real alert")

Neither of the first two steps goes through an alert rule, so the easiest thing to miss is that **the notification rule was never attached to one**.

Go to **Alerts & Notifications → Alert rules**, confirm the rule's **Notification rule** field contains it, then use the rule's own [test fire](https://n9e.github.io/docs/alerting/test-fire.md) to produce a real event.

Expected result: a new event appears under **Alerts & Notifications → Events**, and the message reaches you.

## Confirm in the notification records[​](#confirm-in-the-notification-records "Direct link to Confirm in the notification records")

If the event appeared but no message did, read the notification records: **Events → open the event detail → Notification records → View detail**.

The drawer holds two tables, **Alert rule notification** and **Subscription rule notification**, with columns notification rule ID, channel, username, target and status. The status text is the failure reason:

| What the record says                  | What it means                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `status_code:200, response:...`       | Sent, and the target answered 200                                                                              |
| `message_template not found`          | That notification config has no message template, so it was dropped                                            |
| `notify_channel not found`            | The media type was deleted or disabled                                                                         |
| `all retries failed, last error: ...` | The target address could not be reached at all                                                                 |
| `status_code:400, response:...`       | The target accepted the request and rejected the content — usually a token, a signature, or the message format |

**Targets are masked by default** (last 8 characters replaced with asterisks); email, SMS, voice, script and mute records are the exceptions.

## When the test fails, check in this order[​](#when-the-test-fails-check-in-this-order "Direct link to When the test fails, check in this order")

1. Media type test fails → it is a network or credential problem and has nothing to do with the rest of Nightingale. Read the status code in the error.
2. Media type passes, rule test fails → look at the filters (especially **no severity checked**) and at whether a template is selected.
3. Both pass, real alert does not arrive → the alert rule does not reference this notification rule, or a mute rule swallowed the event.
4. No record at all for that event → the event never reached the notification stage; walk [Alert event exists but no notification arrives](https://n9e.github.io/docs/troubleshooting/no-notification.md).

## Next[​](#next "Direct link to Next")

* The message content is wrong: [Templates and variables](https://n9e.github.io/docs/notifications/templates.md)
* How failures are retried: [Retries and delivery status](https://n9e.github.io/docs/notifications/delivery.md)
* It arrived, but at the wrong people: [Notifications routed to the wrong people](https://n9e.github.io/docs/troubleshooting/wrong-routing.md)
