# Event aggregation and deduplication

One rule plus one label set is one event, so repeated evaluations never create a second; the aggregation view folds hundreds of active events into a few cards.

Where this page ends: you know why one incident does not produce a message every evaluation cycle, and how to fold a screenful of hundreds of active events into a handful of cards.

## Deduplication is built in: an event is rule + label set[​](#deduplication-is-built-in-an-event-is-rule--label-set "Direct link to Deduplication is built in: an event is rule + label set")

An event's identity is its **rule together with its label set** — that is the Hash you see in the detail panel.

* The same rule with the same labels has **exactly one active event**. The rule keeps evaluating and the condition keeps holding, which updates that event's trigger time and trigger value — **it does not create a new event each cycle**;
* The same rule across 5 hosts is 5 events (different `ident`), each firing and recovering on its own;
* Only a fresh trigger after recovery counts as a new one.

So "duplicate alerts" in Nightingale is usually not one event sent many times; it is **too fine a label dimension** — a rule that expands over `device` into a dozen series produces a dozen independent events. To get fewer, first see whether the rule can aggregate the dimension away (`sum by (...)` in PromQL) — see [Metric rules](https://n9e.github.io/docs/alerting/metric-rules.md).

Repeat notifications for one event are governed by two fields on the alert rule: **notify repeat interval (minutes)**, how long to wait before reminding while it is still unrecovered, and **max send count**, where 0 means unlimited. Those two are the most direct "one incident should not send a hundred messages" controls.

## Folding hundreds of active events into cards[​](#folding-hundreds-of-active-events-into-cards "Direct link to Folding hundreds of active events into cards")

**Alerts & Notifications → Events → Active alerts** has an **Aggregate rule** selector above the list. Pick one and events are grouped by the string the rule computes; a row of cards appears above the table, one per group. Clicking a card filters the table to that group.

Next to the selector it shows "N aggregate results", so you can see at a glance that a screenful is really only a few kinds of problem.

## Aggregation expressions worth having[​](#aggregation-expressions-worth-having "Direct link to Aggregation expressions worth having")

Click **Add rule** in the dropdown and fill in two fields: **Rule name** (what shows in the dropdown) and **Aggregate rule** (a Go template whose output becomes the card title). An administrator can also make it public for everyone; otherwise only you see it.

| Group by                  | Expression                                    |
| ------------------------- | --------------------------------------------- |
| Alert rule                | `{{.RuleName}}`                               |
| Business group + severity | `Group:{{.GroupName}} Severity:{{.Severity}}` |
| Host                      | `{{.TagsMap.ident}}`                          |
| Instance label            | `{{.TagsMap.instance}}`                       |
| Service                   | `{{.TagsMap.service}}`                        |

Available fields include `.RuleName`, `.GroupName`, `.Severity` and `.TagsMap.<label>`.

On call, the two that earn their keep are `{{.RuleName}}` and `{{.TagsMap.ident}}`: the first answers "which rule is flooding the screen", the second answers "is it all just one host".

An aggregate rule only changes **how this page displays**; it does not touch the events or affect notifications.

## Three ways to cut the number of messages[​](#three-ways-to-cut-the-number-of-messages "Direct link to Three ways to cut the number of messages")

Once the cards have shown you a class that does not need to be sent one by one:

1. **Raise the repeat interval and max send count on the rule** — for "the same event keeps ringing";
2. **A mute rule** — for "keep this class quiet for a while", see [Mute rules](https://n9e.github.io/docs/events/mute-rules.md);
3. **The event drop processor in a workflow** — for "this class should never be sent", see [Event pipelines](https://n9e.github.io/docs/events/pipelines.md).

The order they act in is in [Noise reduction and routing model](https://n9e.github.io/docs/concepts/noise-routing.md); worked scenarios are in [Noise reduction patterns](https://n9e.github.io/docs/events/noise-patterns.md).

## Next[​](#next "Direct link to Next")

* Using the two event lists: [Active and historical events](https://n9e.github.io/docs/events/active-historical.md)
* Splitting by condition instead of cutting everything: [Conditional routing](https://n9e.github.io/docs/events/routing.md)
* Firing and recovering over and over: [Alerts fire and recover repeatedly](https://n9e.github.io/docs/troubleshooting/alert-flapping.md)
