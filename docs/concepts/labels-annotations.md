---
title: "Labels, annotations and identity"
sidebar_label: "Labels and annotations"
description: "Labels decide which event this is; annotations decide what the notification says. They are not interchangeable."
last_reviewed: 2026-10-10
---

Labels and annotations both look like "key-value pairs on an event", but they do different jobs,
and mixing them up breaks noise reduction outright.

| | Labels | Annotations |
|---|---|---|
| Job | Establish the event's **identity** | **Context** for a human |
| Used in matching? | Yes — mutes, subscriptions and routing all match on them | No |
| If the value changes | It becomes **a different event** | The message text changes |
| Typical content | `ident`, `env`, `service`, `region` | Current value, blast radius, what to do, runbook link |

## Labels decide what counts as "the same alert"

An event's identity is the rule plus the label set. That single rule decides three things:

- one rule across 5 machines produces **5 separate events**, because `ident` differs; each fires
  and recovers on its own;
- a mute rule matching `ident=n9e-web-01` silences that one host and leaves the rest alone;
- if the label set **changes every evaluation**, every evaluation looks like a brand-new alert —
  the single most common cause of alert storms.

So keep **anything that changes** out of the labels. The current CPU value is a number and belongs
in an annotation. A `pod` name that changes on every restart should not be an identity label either.

## Where labels come from

Three sources, layered:

1. **From the query result** — labels already on the returned series, such as `ident` or `instance`;
2. **Appended by the rule** — the "append tags" field on the rule, e.g. `service=trade`,
   `team=infra`, stamping every event this rule produces;
3. **Added by a pipeline** — after the event exists, a label-enrichment processor can look up the
   owner or the site in a CMDB and attach it.

The second is the workhorse: routing and subscriptions live on it. **When planning labels, start
from "what will I want to route on later"** — those dimensions are the ones that belong in labels.

## Annotations are written for the person who gets paged

Annotations are rendered into the notification. Write them for somebody woken at 3am with no
context, and ask what they need:

```
summary:     n9e-web-01 memory at 87%
impact:      Order entry — customers cannot check out
runbook_url: https://wiki.internal/runbook/host-memory
```

Annotations can use template variables to pull in event fields and query results, so the current
value can go straight into the text.

**Do not put identity in annotations**: an `env` written as an annotation is invisible to mute rules.

## The classic mistake

Putting the host IP in an annotation and the current value in a label — exactly backwards. The
result:

- muting one host does not match, because the IP is an annotation;
- every evaluation looks like a new event, because the value is a label.

The test is simple: **will anything ever filter on this field?** If yes, it is a label. If it is
only there to be read, it is an annotation.

## Related

- [Labels, annotations and severity](../alerting/labels-severity.md)
- [Rewrite labels and enrich context](../events/relabel-enrich.md)
- [Notification variables](../reference/notification-variables.md)
