---
title: "Datasource → rule → event model"
sidebar_label: "Core object model"
description: "The three objects everything else hangs off: a data source is queried by a rule, and a rule that trips produces an event."
last_reviewed: 2026-10-10
---

There are a lot of objects in Nightingale, but three carry the model. Everything else decorates
them.

## The three objects

```
data source ──queried by──> alert rule ──trips and produces──> event
     │                          │                                │
  where it lives          which business group             labels and annotations
  how to connect          what to query, what counts       noise reduction, routing
```

**A data source** answers "where is the data and how do I connect". It stores no data itself, only
the connection: address, auth, timeout, type. Register it once; rules and query pages refer to it
by name from then on.

**An alert rule** answers "what to query and what counts as too much". It binds one or more data
sources, carries a query (PromQL, SQL, LogQL… depending on the source type) and the evaluation
terms: how often to run, how long the condition must hold, which severity it gets.

**An event** is what evaluation produces. It carries the value and time of the trigger plus labels
and annotations, and from there it goes through noise reduction and routing until it becomes a
message on somebody's phone.

## Everything else hangs off those three

| Object | Attaches to | Purpose |
|---|---|---|
| Business group | Rules, targets and dashboards each belong to one | The permission boundary — see [Business groups](./business-groups.md) |
| Mute rule | Acts on events | Suppress the event, or just the notification |
| Subscription | Acts on events | Let another team receive them |
| Event pipeline | Attaches to a rule or a notification rule | Rewrite labels, enrich, drop |
| Notification rule | Consumes events | Decide recipients and media by severity and labels |
| Message template | Referenced by a notification rule | Decide what the message looks like |
| Dashboard | Queries data sources | Visualisation; not part of alerting |

## One datapoint's full journey

1. A collector writes a metric into a time-series database (or your existing pipeline already does);
2. you register that database in Nightingale as a **data source**;
3. an **alert rule** queries it with PromQL every 15 seconds;
4. one evaluation comes back over the threshold and stays over it for the configured duration →
   an **event** is produced;
5. the event carries labels such as `ident=n9e-web-01`, `env=prod`;
6. those labels decide whether it gets muted, whether some team has subscribed to it, and which
   notification rule picks it up;
7. the notification rule chooses a media type and a template, and sends it.

Every step is inspectable in the UI: evaluation records on the rule, the event on the events page,
delivery outcome in the notification records.

## Related

- [Alert lifecycle and severity](./alert-lifecycle.md)
- [Labels, annotations and identity](./labels-annotations.md)
- [Noise reduction and routing model](./noise-routing.md)
