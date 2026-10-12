# Rule design best practices

Opinions on rule design: alert only on what needs a person, leave trends to dashboards, size a rule to one class of object, and review so the rule set does not rot.

Where this page ends: a set of opinions you can argue with, and a review habit that keeps a rule set from rotting. None of it is enforced by the product — it is the part that decides whether people still read your alerts in six months.

## What is worth alerting on[​](#what-is-worth-alerting-on "Direct link to What is worth alerting on")

The test is not "can I measure it". It is: **when this fires, is there something a person should do about it, now?** If the honest answer is no, it belongs on a dashboard.

Three things pass that test:

* **Symptoms users can feel.** Error rate, latency, a queue that is not draining, a job that did not run. These are worth an S1 because someone is being harmed while you read the message.
* **Resources with a deadline.** Disk filling, certificates expiring, a licence running out. They are S2 or S3 — the deadline is known and there is time to act, which is exactly what makes them safe to send during working hours.
* **The monitoring itself.** A collector that stopped reporting, a data source that stopped answering. If this is broken, everything above it is silently fine-looking. `target_up == 0` is worth having on day one.

Two that consistently fail it:

* **Causes with no symptom.** CPU at 95% on a machine whose users are unaffected is a fact, not an incident. Alert on the symptom and use CPU to explain it afterwards.
* **Anything nobody has ever acted on.** Every rule set has a handful of these. They are not harmless — they train people to skim.

## What belongs on a dashboard instead[​](#what-belongs-on-a-dashboard-instead "Direct link to What belongs on a dashboard instead")

Capacity trends, traffic patterns, comparative views, anything you look at weekly rather than react to. A [dashboard](https://n9e.github.io/docs/query/dashboards.md) is the right home for a number you want to know but do not want to be told.

The reliable signal that you have crossed the line: a rule whose notification you would silence if you were on call. That rule is a dashboard panel with extra steps.

## How much one rule should cover[​](#how-much-one-rule-should-cover "Direct link to How much one rule should cover")

Prefer **one rule covering many objects** over one rule per object. A rule matching every host produces one event per host that crosses the threshold, each labelled with its own `ident`, so you lose nothing by generalising — and you gain a single place to change the threshold.

Split into separate rules only when something genuinely differs:

* a different severity is not a reason to split — put [several thresholds in one rule](https://n9e.github.io/docs/alerting/metric-rules.md) with **Inhibit** on;
* a different threshold for a handful of exceptions is not a reason either — that is what [variables](https://n9e.github.io/docs/alerting/metric-rules.md) are for;
* a different **owning team** is a reason, because the business group is a per-rule property;
* a different **query** is a reason, obviously.

The failure mode to avoid is thirty near-identical rules that were cloned once and then drifted. When you find those, collapse them and use tags to keep the routing distinctions.

## Past a hundred rules[​](#past-a-hundred-rules "Direct link to Past a hundred rules")

At that size the constraint stops being "is each rule correct" and becomes "can anyone find and change the right one".

### Conventions that pay for themselves[​](#conventions-that-pay-for-themselves "Direct link to Conventions that pay for themselves")

**Names describe the condition, not the metric.** `Root filesystem almost full` beats `disk_used_percent high`, because the first survives a change of metric and the second does not. Never put a variable in a rule name — every event then has a different name and none of them group.

**Tags are a small shared vocabulary.** Decide on the handful of keys everything carries — `team`, `service`, `env` is usually enough — and use exactly those, spelled exactly that way. Every notification rule, mute rule and subscription downstream matches on them, and each synonym you allow has to be encoded in all of them. See [Labels, annotations and severity](https://n9e.github.io/docs/alerting/labels-severity.md).

**Severity means the same thing everywhere.** Write the three definitions down and hold to them. S1 that sometimes means "urgent" and sometimes "important" makes routing unfixable.

**Every S1 rule has a `runbook_url` annotation.** If nobody can write the runbook, the rule is not actually actionable, and that is worth discovering while writing it rather than at 3 a.m.

### Cutting business groups[​](#cutting-business-groups "Direct link to Cutting business groups")

The business group decides both **who can edit a rule** and **which team owns its events** — and the ownership comes from the rule, not from the machine the event is about. So the grouping that works is by **owning team**, not by environment or by technology.

If several teams need to see the same events, do not clone the rule into each group; that makes N rules to keep in sync. Keep one rule in the owning team's group and let the others use [subscriptions](https://n9e.github.io/docs/events/subscriptions.md).

Business group names can be rendered as a tree by using a separator such as `/` — `DBA/MySQL` and `DBA/Redis` — which keeps a long flat list navigable.

### Keeping changes reviewable[​](#keeping-changes-reviewable "Direct link to Keeping changes reviewable")

Rules built through the UI can be exported as JSON and committed, then imported into production with overwrite-by-name. That gives you a diff to review and a history to blame, which a hundred rules edited in place do not have. The workflow and its two sharp edges are in [Import, export and reuse](https://n9e.github.io/docs/alerting/import-export.md).

Start from the [shipped rule library](https://n9e.github.io/docs/alerting/templates.md) rather than writing standard rules yourself — then treat what you import as a draft, because its thresholds were written for a generic install.

## The review that keeps it honest[​](#the-review-that-keeps-it-honest "Direct link to The review that keeps it honest")

Once a month, take the events from the last period and ask two questions per rule:

1. **Did it fire?** A rule that has never fired is either protecting you or lying to you, and you cannot tell which without [test firing](https://n9e.github.io/docs/alerting/test-fire.md) it. Do that; delete the ones that turn out to be broken.
2. **Did anyone act?** A rule that fired forty times and was acted on zero times should be demoted to S3 or deleted. Muting it is the wrong answer — a [mute rule](https://n9e.github.io/docs/events/mute-rules.md) hides the noise and keeps the maintenance cost.

Then look at the loudest rules specifically. Usually one or two rules account for most of the volume, and usually the fix is a longer for-duration, an asymmetric recovery condition, or an aggregation that turns thirty per-host events into one per-service event. The techniques are in [Noise reduction patterns](https://n9e.github.io/docs/events/noise-patterns.md).

## Next[​](#next "Direct link to Next")

* Cut the noise you already have: [Noise reduction patterns](https://n9e.github.io/docs/events/noise-patterns.md)
* Make the numbers behave: [Evaluation interval and recovery](https://n9e.github.io/docs/alerting/evaluation.md)
* Version the rule set: [Import, export and reuse](https://n9e.github.io/docs/alerting/import-export.md)
* Before going live: [Production checklist](https://n9e.github.io/docs/get-started/production-checklist.md)
