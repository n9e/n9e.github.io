---
title: "Rewrite labels and enrich context"
sidebar_label: "Rewrite labels and enrich context"
description: "Rename or add labels, or call your own service and write what it returns back onto the event."
last_reviewed: 2026-10-10
---

Where this page ends: a processor that reshapes an event's labels into what you actually want,
plus a way to pull information from an external system (CMDB, on-call roster, config store) onto
the event.

Both live inside a workflow's processors; see [Event pipelines](./pipelines.md) for how to
create one.

## Rewriting labels: the event label rewrite processor

Choose processor type **Event label rewrite** (category: Rewrite). It is Prometheus relabeling,
applied to **an alert event's labels** rather than to scraped time series.

The open-source edition has four actions:

| Action | What it does |
|---|---|
| `replace` | Takes the source labels' value, extracts part of it with a regex, writes it into the target label (the default) |
| `labelmap` | Renames labels in bulk by matching label names against a regex |
| `labeldrop` | Removes labels whose names match the regex |
| `labelkeep` | Keeps only labels whose names match the regex and drops the rest |

The five fields of `replace`:

| Field | Default | What it means |
|---|---|---|
| Source labels | empty | Several allowed; joined with the separator before matching |
| Separator | `;` | What joins multiple source labels |
| Regex | `(.*)` | Matched against the joined string; capture groups pull values out |
| Value | `$1` | What gets written into the target label; `$1` is the first capture group |
| Target label | empty | **Leave it empty and this processor does nothing** |

## Four patterns you will actually use

**Stamp a fixed label on the event.** Only target label and value matter; ignore source and
regex:

```
Target label: team
Value:        infra
```

**Copy a label under another name.** Downstream only understands `host`, the event carries
`ident`:

```
Source labels: ident
Target label:  host
Value:         $1
```

**Extract part of a label.** Pull the prefix out of `n9e-web-01`:

```
Source labels: ident
Regex:         ^([a-z0-9]+)-.*$
Target label:  cluster
Value:         $1
```

**Join two labels into one**, using the default `;` separator:

```
Source labels: env, service
Regex:         (.*);(.*)
Target label:  scope
Value:         $1/$2
```

Rewriting happens **before muting**, so labels produced here are visible to mute rules and
subscriptions.

## Pulling context from an external system: the event update processor

The open-source edition ships no built-in dictionary to look values up in. The way to enrich is
to **have Nightingale ask your service**: choose processor type **Event update** and give it an
HTTP endpoint.

What it does:

1. Serialises the whole event to JSON and `POST`s it to your URL;
2. Takes the response body and **deserialises it back into that event**;
3. The event continues downstream carrying the new content.

So your service has one job: read the event JSON, look up your CMDB by a label such as `ident`,
put the owner, site or business line into the event's labels, and return **the complete event
JSON**. Anything missing from the response body is missing from the event afterwards.

Configuration:

| Field | What it means |
|---|---|
| URL | Required, your service's address |
| Authorization user name / password | Basic auth; empty means none |
| Header | Key/value pairs, several rows allowed |
| HTTP Proxy | When you need to go through a proxy |
| Callback Timeout | Milliseconds, 10000 by default |
| TLS InsecureSkipVerify | Turn on for a self-signed certificate |

## Callback versus event update

The two forms look identical and mean completely different things:

| | Webhook callback | Event update |
|---|---|---|
| Category | Dispatch | Rewrite |
| Response body | **Ignored** — sending is the whole job | **Read back and merged into the event** |
| What it is for | Opening tickets, calling automation | Adding context, correcting fields |
| If the endpoint is down | The event continues unchanged | The node errors and the event is not modified |

Use callback to tell an external system something; use event update to change the event with an
external system's answer.

## What catches people out

- **An empty target label means nothing happens.** `replace` without a target label silently does
  nothing, and the node message in the execution record reads "no change".
- **Rewrite first, then act on the new labels.** Processors run top to bottom; in the wrong order
  the later conditions never match.
- **Your service has to be fast.** Event update is synchronous, with a 10 second default timeout,
  and the notification waits the whole time. Cache slow lookups rather than stalling the alert
  path.
- **Do not put secrets in a callback URL.** Credentials belong in the auth fields or headers —
  the URL shows up in execution records.
- **This rewrites the event's labels, not the underlying data.** Series in the time-series
  database are untouched; only this event changes.

## Next

- Verify a rewrite: [Try a workflow with a mock event](./try-workflow.md)
- Read the before/after diff: [Inspect workflow execution records](./execution-records.md)
- Make new labels change where things go: [Conditional routing](./routing.md)
- Designing the labels themselves: [Labels and annotations](../concepts/labels-annotations.md)
