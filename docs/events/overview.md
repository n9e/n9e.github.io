# Events, noise reduction and routing

What happens to an event between the rule that fired it and the person who receives it — mute rules, subscriptions, event pipelines, and self-healing.

Downstream of the rule: mute rules, subscriptions, and event pipelines — grouping, label rewriting and conditional routing. Wire up **ibex** when an alert should fix itself rather than wake somebody.

## [Active and historical events](https://n9e.github.io/docs/events/active-historical.md)

[Active events hold alerts that have not recovered; on recovery they move to history. Both lists are searchable by label, severity and business group, in bulk.](https://n9e.github.io/docs/events/active-historical.md)

## [Event aggregation and deduplication](https://n9e.github.io/docs/events/aggregation.md)

[One rule plus one label set is one event, so repeated evaluations never create a second; the aggregation view folds hundreds of active events into a few cards.](https://n9e.github.io/docs/events/aggregation.md)

## [Mute rules](https://n9e.github.io/docs/events/mute-rules.md)

[Silence by label match, time window or maintenance schedule, and see what a mute rule is currently swallowing.](https://n9e.github.io/docs/events/mute-rules.md)

## [Alert subscriptions](https://n9e.github.io/docs/events/subscriptions.md)

[Let a team receive events from rules they do not own, with their own channel and severity filter.](https://n9e.github.io/docs/events/subscriptions.md)

## [Event pipelines](https://n9e.github.io/docs/events/pipelines.md)

[Ordered processors that transform, enrich, drop or route an event before notification.](https://n9e.github.io/docs/events/pipelines.md)

## [Rewrite labels and enrich context](https://n9e.github.io/docs/events/relabel-enrich.md)

[Rename or add labels, or call your own service and write what it returns back onto the event.](https://n9e.github.io/docs/events/relabel-enrich.md)

## [AI summary processor](https://n9e.github.io/docs/events/ai-summary.md)

[Have an LLM write a short summary onto each event before it is notified: model setup, the prompt template, where the result lands, and what happens when the call fails.](https://n9e.github.io/docs/events/ai-summary.md)

## [Conditional routing](https://n9e.github.io/docs/events/routing.md)

[Send an event to different channels or teams depending on its labels and severity.](https://n9e.github.io/docs/events/routing.md)

## [Try a workflow with a mock event](https://n9e.github.io/docs/events/try-workflow.md)

[Run a pipeline against a hand-written event and see each processor's output before anything is live.](https://n9e.github.io/docs/events/try-workflow.md)

## [Inspect workflow execution records](https://n9e.github.io/docs/events/execution-records.md)

[Execution records trace each event through every processor: what each one changed, whether the event was dropped, and where it was sent.](https://n9e.github.io/docs/events/execution-records.md)

## [Trigger self-healing with ibex / webhook](https://n9e.github.io/docs/events/self-healing.md)

[Run a script on the affected host through ibex, or call a webhook, when a specific event fires.](https://n9e.github.io/docs/events/self-healing.md)

## [Noise reduction patterns](https://n9e.github.io/docs/events/noise-patterns.md)

[Recipes that hold up in production: flapping, storms during deploys, duplicate sources, and what should never page a human.](https://n9e.github.io/docs/events/noise-patterns.md)
