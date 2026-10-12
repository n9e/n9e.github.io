* [](https://n9e.github.io/index.md)
* Troubleshooting

# Troubleshooting

Organised by symptom, not by component: find the line that matches what you are seeing.

## [Why does a data source connect but return no data?](https://n9e.github.io/docs/troubleshooting/no-data.md)

[A source passes its test but returns nothing: check write, store and query in turn — nothing written, time range past the last point, label mismatch, wrong store.](https://n9e.github.io/docs/troubleshooting/no-data.md)

## [Why does a Categraf target show as offline?](https://n9e.github.io/docs/troubleshooting/categraf-offline.md)

[A target shows offline when its heartbeat has not reached Redis in time — clock skew, a wrong heartbeat URL or network policy; update time is not a liveness signal.](https://n9e.github.io/docs/troubleshooting/categraf-offline.md)

## [Why does the alert not fire when the query returns results?](https://n9e.github.io/docs/troubleshooting/alert-not-firing.md)

[Query has data but nothing fires: the evaluation records hold the answer — for-duration not met, wrong datasource\_queries, group or window mismatch, disabled, muted.](https://n9e.github.io/docs/troubleshooting/alert-not-firing.md)

## [Why are evaluation records missing or dropped?](https://n9e.github.io/docs/troubleshooting/evaluation-missing.md)

[Missing evaluation records mean one of four things: not recorded, not evaluated, query rejected or cycle skipped; overload and datasource timeouts are the usual causes.](https://n9e.github.io/docs/troubleshooting/evaluation-missing.md)

## [Why does an alert fire repeatedly or never recover?](https://n9e.github.io/docs/troubleshooting/alert-flapping.md)

[Flapping or never-recovering alerts usually come from a threshold sitting on the data, a data gap read as recovery, a changing label set, or no recovery condition.](https://n9e.github.io/docs/troubleshooting/alert-flapping.md)

## [Why is there an alert event but no notification?](https://n9e.github.io/docs/troubleshooting/no-notification.md)

[Event but no message: in the notification log, no record means a mute or notification rule stopped it; a failure points at the channel, a success at the receiver.](https://n9e.github.io/docs/troubleshooting/no-notification.md)

## [Why does notification template rendering fail?](https://n9e.github.io/docs/troubleshooting/template-errors.md)

[A message body that is error text, or a field that is empty, is a template rendering problem that still logs as success; preview against a real event to catch it.](https://n9e.github.io/docs/troubleshooting/template-errors.md)

## [Why does the event pipeline route to the wrong destination?](https://n9e.github.io/docs/troubleshooting/wrong-routing.md)

[Wrong recipients usually mean the destination was decided earlier than expected: processor order, a label rewrite before the match, or the two mount points' scopes.](https://n9e.github.io/docs/troubleshooting/wrong-routing.md)

## [Why does a workflow Try run succeed but production execution fail?](https://n9e.github.io/docs/troubleshooting/workflow-prod-fails.md)

[Try run passes, production fails: real events may lack labels the mock had, and the alert process — not the UI — runs the workflow with its own permissions and network.](https://n9e.github.io/docs/troubleshooting/workflow-prod-fails.md)

## [Why is embedded TSDB data fragmented or missing?](https://n9e.github.io/docs/troubleshooting/embedded-tsdb-data.md)

[Gaps in the embedded TSDB rarely raise errors — retention, disk pressure or restarts; three timestamp metrics show whether the gap is on the write or the query side.](https://n9e.github.io/docs/troubleshooting/embedded-tsdb-data.md)

## [Why does the edge lose contact with the center?](https://n9e.github.io/docs/troubleshooting/edge-disconnected.md)

[During a partition the edge keeps alerting locally but its events never reach the center — that is expected; an edge that never connected is a misconfiguration.](https://n9e.github.io/docs/troubleshooting/edge-disconnected.md)

## [Why does MCP authentication fail?](https://n9e.github.io/docs/troubleshooting/mcp-auth.md)

[MCP authentication fails at the gateway, the token check or OAuth — the status code says which; usual causes: wrong header name, expired token, bad redirect URL.](https://n9e.github.io/docs/troubleshooting/mcp-auth.md)

## [Why are MCP tools missing or denied?](https://n9e.github.io/docs/troubleshooting/mcp-tools-missing.md)

["No such tool" has three shapes — write tools not enabled, toolset disabled, or the token's user lacks the permission — and the tools/list response tells them apart.](https://n9e.github.io/docs/troubleshooting/mcp-tools-missing.md)

## [Why does an upgrade or database migration fail?](https://n9e.github.io/docs/troubleshooting/upgrade-fails.md)

[Unknown column errors, blank pages or a hung process after an upgrade mean the schema did not fully migrate — usually missing database privileges or an interrupted run.](https://n9e.github.io/docs/troubleshooting/upgrade-fails.md)

## [Why is Nightingale slow or backlogged?](https://n9e.github.io/docs/troubleshooting/performance.md)

[Late alerts, growing queues and high database CPU each map to one built-in metric that localises the cause; pick the metric by symptom, then work back to the root.](https://n9e.github.io/docs/troubleshooting/performance.md)

[Previous](https://n9e.github.io/docs/operations/disaster-recovery.md)

[Disaster recovery](https://n9e.github.io/docs/operations/disaster-recovery.md)

[Next](https://n9e.github.io/docs/troubleshooting/no-data.md)

[Why does a data source connect but return no data?](https://n9e.github.io/docs/troubleshooting/no-data.md)

© 2026 Nightingale Contributors · Apache-2.0 License

[English](https://n9e.github.io/docs/troubleshooting.md)[简体中文](https://n9e.github.io/zh/docs/troubleshooting)
