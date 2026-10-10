---
title: "Variables and filters"
sidebar_label: "Variables and filters"
description: "Dashboard variables add dropdowns at the top of a board, populated from label values and chained to each other; pick a host or a cluster and every chart switches."
---

Where this page ends: a few dropdowns at the top of a board so that picking a host or a
cluster switches every chart at once — one board serving dozens of hosts instead of dozens of
copies.

## 1. Add the first variable

Open a dashboard; the variable bar sits under the title bar. With no variables yet it shows an
**Add variable** link; once there are some, the entry point is the pencil icon at the end of
the bar.

Create a **Query** variable:

| Field | What to put in it |
|---|---|
| Name | Letters, numbers and underscores only. Panels reference it as `$name` or `${name}` |
| Label | The text shown above the dropdown; empty falls back to the name |
| Type | See the next section |
| Hide | A hidden variable has no dropdown, but its value is still substituted |
| Data source | Where the candidate values come from |
| Definition | The expression that produces the values, see below |
| Regex | Optional. A regular expression literal (`/…/`) filtering the options; named capture groups let the display text differ from the value |
| Multi select / Include all option / Custom all value | Dropdown behaviour |
| Width | Dropdown width; empty means 180px |

On a Prometheus source, **Definition** accepts these forms:

```
label_names()                             every label name
label_values(ident)                       every value of one label
label_values(up{job="api"}, instance)     filter series first, then take one label
metrics(cpu_.*)                           metric names matching a regex
query_result(up == 0)                     the instant result of a PromQL query
```

Anything without a function name is treated as a PromQL instant query, equivalent to
`query_result(...)`.

The form previews the result live. **If the preview shows no options, do not save** — you
would only be storing an empty dropdown.

Expected result: after saving, a dropdown appears on the variable bar; pick a value and the
panels refresh.

## 2. Variable types

| Type | Where the options come from | Typical use |
|---|---|---|
| Query | Queried from a data source | Hosts, instances, clusters, service names |
| Custom | A fixed comma-separated list you type | `prod,staging,dev` |
| Text box | Typed by whoever is looking at the board | A trace id, a keyword |
| Constant | One hard-coded value | Factoring out a repeated prefix, usually with Hide on |
| Datasource | Every source of one category | The same board across per-region Prometheus instances |
| Datasource identifier | The same, but yielding the identifier rather than the internal id | |
| Host ident | The hosts the current user may see | Filtering the host list by permission |

The last one has a side effect worth remembering: **a dashboard using Host ident cannot be
shared anonymously**, because it depends on an authenticated API. The UI disables link
generation outright — see [Anonymous time-limited sharing](./sharing.md).

## 3. Chain the dropdowns together

Reference one variable from another variable's definition and they cascade:

```
cluster     label_values(up, cluster)
instance    label_values(up{cluster="$cluster"}, instance)
```

Picking a cluster narrows the instance options to that cluster.

Order matters: **the referenced variable must come first**, and the variable list can be
dragged to reorder.

## 4. Use variables in a panel

Panel queries, panel titles and text panels all accept `${name}`:

```promql
cpu_usage_idle{ident="$ident"}
```

A multi-select variable expands to `a|b|c`, so it **must** become a regex match:

```promql
cpu_usage_idle{ident=~"$ident"}
```

Beyond your own variables, a set of built-ins is always available:

| Built-in | What it is |
|---|---|
| `${__field.name}` / `${__field.value}` | The series name / value in the legend |
| `${__field.labels.X}` / `${__field.labels.__name__}` | One label's value / the metric name |
| `${__interval}` / `${__interval_ms}` | The interval, which defaults to the step |
| `${__range}` / `${__range_ms}` | The length of the current time range |
| `${__rate_interval}` | `__interval * 4` |
| `${__from}` / `${__to}` | Range bounds in milliseconds; `__from_date_seconds` and `__from_date_iso` also exist |

Panel options also carry **Repeat**: pick a multi-select variable and one identical panel is
rendered per value, with a configurable maximum per row. Eight identical CPU charts for eight
hosts come from this, not from copy-paste.

## How the time range takes part

Two things people conflate:

1. **Variable options are resolved within the current time range.** `label_values(...)` looks
   at the series that existed in that window. Widening from "last 1 hour" to "last 7 days" can
   therefore add hosts that were decommissioned; and a host that came online twenty minutes
   ago legitimately does not show up yet. Check this first when a dropdown is missing
   something.
2. **The time range itself is not a variable.** It lives in the URL as `__from` / `__to` and
   is remembered per dashboard in the browser. To reference it inside a query, use the
   `${__from}` / `${__range}` built-ins above.

## Things that trip people up

- Names allow only letters, numbers and underscores, matching how `$name` is parsed;
- **A multi-select variable needs `=~`.** With `=` the query matches the literal string
  `a|b|c` and always returns nothing;
- With **Include all option** and no **Custom all value**, "all" expands to every current
  option joined together (`a|b|c`), so it too only works under `=~`. Put `.*` in Custom all
  value if that is what you want;
- This page is about **dashboard variables**. System → Variable (`/system/variable-settings`)
  is a different feature: global variables for notification templates and rules, covered in
  [Global variables and secrets](../security/variables.md).

## Next

- Put them to work on panels: [Build a dashboard](./dashboards.md)
- Sharing a board that has variables: [Anonymous time-limited sharing](./sharing.md)
- Where the labels come from: [Labels and annotations](../concepts/labels-annotations.md)
