---
title: "Scope by business group and data source"
sidebar_label: "Scope by business group and data source"
description: "A rule has two scopes: the business group decides who may edit it and owns its events; the data source list decides which instances it queries, and can span several."
---

Every rule has two independent scopes: **who owns it** and **what it queries**. They are set in two
different steps of the form, they mean different things, and mixing them up is the usual cause of
"why is this event in the wrong team's inbox".

## The two scopes, and where they live

| Scope | Set in | Decides |
|---|---|---|
| Business group | Step 1, **Basic settings → Business group** | Who can see and edit the rule, and which group the resulting events belong to |
| Data sources | Step 2, **Data source → Data source type + Data source filter** | Which concrete instances the query is sent to |

## Business group: who edits it, who owns the events

A rule lives in exactly one business group. That group decides two things.

**Permissions.** Editing a rule needs write access to its business group. This is the whole
mechanism — there is no per-rule permission.

**Event ownership.** This is the part that surprises people:

> The business group on an event is copied from **the rule**, not from the object the event is about.

A host that belongs to the *Infra Platform* group, hit by a rule that lives in *Trading System*,
produces an event labelled *Trading System*. Everything downstream follows that label: which mute
rules apply, which subscriptions can pick it up, which team sees it on the event list.

So if a team is getting events about machines they do not own, the fix is not to move the machines —
it is to look at which group owns the rule.

To move a rule to a different group, open it, change **Business group** in step 1 and save. To have
the same rule in several groups, select the rules in the list and use
**More → Clone to business groups**.

## Data sources: which instances the query goes to

Step 2 has two fields. **Data source type** picks the plugin — Prometheus Like, Elasticsearch,
MySQL and so on. **Data source filter** picks which registered instances of that type this rule
runs against.

Only types you have registered at least one instance of appear in the list. An environment with
only Prometheus registered looks like a product that only supports Prometheus; it is not.

### Three ways to match

The filter is a list of rows, each with a match mode and an operator:

| Match mode | Operator | What you supply |
|---|---|---|
| All data sources | — | Nothing. Every instance of this type, including ones registered later |
| Exact match | In / Not in | A list of specific instances |
| Fuzzy match | In / Not in | Name patterns. `*` matches any run of characters, `?` matches exactly one |

Fuzzy match works on the data source **name**, so `prod-*` picks up `prod-beijing` and
`prod-shanghai` and will pick up `prod-tokyo` the day someone registers it. That is either exactly
what you want or exactly what you do not; decide deliberately.

Add more than one row and they are **intersected** — every row must accept an instance for it to be
included. The common shape is one row saying `Fuzzy match / In / prod-*` and a second saying
`Exact match / Not in / <the one instance under maintenance>`.

### What happens when a rule matches several sources

The rule is **evaluated once per data source, independently**. Three matched sources means three
separate evaluation loops, three sets of events, and three rows per cycle in the
[evaluation records](./execution-records.md).

Consequences worth knowing before you widen a filter:

- one query that is expensive becomes N expensive queries;
- the same series present in two sources produces two events, with different `datasource_id` —
  they are not deduplicated;
- an instance that is down affects only its own evaluation loop; the others keep working.

This is why "All data sources" is a comfortable default in a small environment and a trap in a large
one. Widening the filter to a hundred Prometheus instances silently multiplies your evaluation load
by a hundred.

## Enable in business group

Step 5 has a switch called **Enable in business group**. It only appears for Prometheus-type rules,
and it does something narrower than the name suggests:

> If the event carries an `ident` label and the host with that ident does **not** belong to the
> rule's business group, the event is discarded.

Events without an `ident` label pass straight through — the filter does not apply to them.

The use case it exists for: several teams clone the same host-monitoring rule into their own groups.
The PromQL returns every host in the time series database, but each team should only be alerted
about their own machines. Switching this on per copy achieves that without touching the query.

## The effective time window

The rest of step 5 decides *when* the rule is allowed to produce events.

- **Enable now** is the master switch. Off means no new events — **including recovery events**.
  Turning off a rule that is currently firing means you never get the recovery notification. For a
  temporary silence, use a [mute rule](../events/mute-rules.md) instead.
- **Time zone** decides which clock the windows are read in. It affects the windows only, never the
  timestamps shown on events. Default is `Local`, the server's own zone.
- **Effective time** is one or more rows of *days of week + start + end*. Multiple rows are OR'd —
  matching any one of them is enough. No rows at all means always.

Three details that catch people out:

- the interval is half-open: start included, end excluded. `00:00 ~ 00:00` and `00:00 ~ 23:59` both
  mean all day;
- start later than end means the window crosses midnight — `22:00 ~ 06:00` is a valid single row;
- the day of week is judged at the moment the alert triggers. A row of "Monday, `22:00 ~ 06:00`"
  means *Monday 00:00–06:00 plus Monday 22:00–24:00*, not "Monday night into Tuesday". For a real
  overnight window on specific days, write two rows.

An alert that triggers outside the window is **discarded outright** — no event, no history, no
notification. If what you want is "record it, just do not wake me", that is a mute rule with
notify-only mode, not an effective window.

## Getting it right through the API

Rules created by API, template import or a script hit three traps:

**`datasource_ids` is ignored.** The field that takes effect is `datasource_queries`. The default —
what the form writes when you pick *All data sources* — is:

```json
"datasource_queries": [{"match_type": 2, "op": "in", "values": [0]}]
```

To pin a rule to one instance by id:

```json
"datasource_queries": [{"match_type": 0, "op": "in", "values": [3]}]
```

**Effective time is in the plural fields.** `enable_stime` / `enable_etime` /
`enable_days_of_week` are scalars kept for old clients. The arrays the form writes are
`enable_stimes` / `enable_etimes` / `enable_days_of_weeks`, and when both are present the plural
ones win:

```json
"enable_stimes": ["09:00"],
"enable_etimes": ["18:00"],
"enable_days_of_weeks": [["1", "2", "3", "4", "5"]]
```

`0` is Sunday.

**Leave the top-level `prom_ql` empty.** A non-empty `prom_ql` makes the server rebuild
`rule_config` from it as a single query, discarding whatever you put in `rule_config.queries`.

## Next

- What a rule does inside its scope: [Metric rules](./metric-rules.md)
- Move a rule between environments: [Import, export and reuse](./import-export.md)
- Silence without changing scope: [Mute rules](../events/mute-rules.md)
- How groups work in general: [Business groups](../concepts/business-groups.md)
