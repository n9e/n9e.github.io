---
title: "Import, export and reuse"
sidebar_label: "Import, export and reuse"
description: "Move rules between environments as JSON, and keep them in version control."
last_reviewed: 2026-10-11
---

Where this page ends: a set of rules leaves one environment as a JSON file and arrives in another
one, and you know exactly which fields did not survive the trip.

## Export a set of rules

**Alerts & Notifications → Alert rules**, tick the rules you want, then **More → Export rules JSON**.

A dialog shows the JSON — an array, one object per rule. You can edit it in place before taking it,
then **Download JSON** (saves `download.json`) or **Copy JSON content to clipboard**.

The same menu also has **Export (CSV)**, which dumps every field of the selected rules as a
spreadsheet. That one is for reading and reviewing; CSV cannot be imported back.

## What the export deliberately drops

The JSON is not a byte-for-byte copy of the rule. Fields that only make sense in the source
environment are stripped: `id`, `group_id`, `create_by` / `update_by` and their timestamps,
`datasource_ids` (the deprecated one), plus the legacy notification fields.

Two of the drops will change behaviour after import, so plan for them:

| Dropped | Consequence after import |
|---|---|
| `enable_stimes` / `enable_etimes` / `enable_days_of_weeks` | The **effective time window is lost** — the imported rule is effective all day, every day |
| `disabled` | The import dialog's own **Enabled** switch decides, and it defaults to off |

Everything that decides *what* the rule alerts on survives: `name`, `cate`, `prod`, `rule_config`
(queries, thresholds, severities, inhibit), `append_tags`, `annotations`, `cron_pattern`,
`prom_for_duration`, `recover_duration`, `notify_repeat_step`, `notify_max_number`, `enable_in_bg`,
`time_zone`, `datasource_queries`, `pipeline_configs`.

So the round trip is lossy for scheduling, and lossless for logic. After importing, walk step 5 of
each rule and put the effective window back if it had one.

## Import into a business group

Select the target business group in the left tree, then **Import**. The dialog has three tabs;
the middle one, **Import alert rules**, takes the JSON you exported.

| Field | What to do with it |
|---|---|
| Content | Paste the array. A single object is accepted too and wrapped for you |
| Source type | Read-only. It is derived from the `cate` in your JSON |
| Data source filter | **Re-point the rules at this environment's data sources.** The ids in the file mean nothing here |
| Enabled | Off by default. Leave it off, review the rules, then enable them |
| Overwrite rules with the same name | Off by default. On, a same-named rule in this group is replaced in place, keeping its id and creation record. Off, a name clash is reported as an error and that rule is skipped |

**Every rule in one import must be the same data source type.** Mixing a Prometheus rule and a
MySQL rule in one paste is rejected before submission — split them into two imports.

Click **Import**. Expected result: a table with one row per rule, showing the rule name and either
an empty result cell (success) or an error message.

Notification settings are not carried over. The importer clears the legacy channel and group fields
and leaves the rule with no notification rule attached, so **attach one after importing** or nothing
will be sent. See [Notification rules](../notifications/rules.md).

<span id="导入步骤" />

## Import Prometheus alerting rules

The third tab, **Import Prometheus alert rules**, takes a Prometheus rule file as YAML — the same
text you would put in `rules.yml`:

```yaml
groups:
- name: example
  rules:
  - alert: HighRequestLatency
    expr: job:request_latency_seconds:mean5m{job="myjob"} > 0.5
    for: 10m
    labels:
      severity: page
    annotations:
      summary: High request latency
```

A bare list of rules, or a single rule object, is accepted as well and wrapped into a synthetic
group. Pick the data sources, decide whether to enable them, and submit.

### How the fields map

| Prometheus | Nightingale |
|---|---|
| `alert` | Rule name |
| `expr` | The single query in `rule_config` |
| `for` | For duration. Unparseable or absent falls back to 60s |
| group `interval` | Execution frequency, as `@every Ns`. Absent means 60s |
| `labels.severity` | Severity. `critical` / `error` / `fatal` / `page` / `sev1` → S1; `warning` / `warn` / `sev2` → S2; `info` / `notice` / `sev3` → S3. Anything unrecognised, and any rule without the label, becomes **S2** |
| every other entry in `labels` | A `key=value` tag |
| `annotations` | Annotations, as-is |

**Recording rules in the file are silently ignored.** Only entries with an `alert:` key are
converted — see [Recording rules](../query/recording-rules.md) for the Nightingale equivalent.
`keep_firing_for` and `limit` are not converted either.

## Keeping rules in version control

The exported JSON is stable enough to diff, which makes a usable review workflow:

1. edit rules in a staging environment through the UI, where the form validates them and
   [Test fire](./test-fire.md) proves they work;
2. export the group's rules and commit the JSON;
3. review the diff like any other change;
4. import into production with **Overwrite rules with the same name** on, so the merge is by name.

Two things to be disciplined about. The rule **name is the primary key** for this workflow —
renaming a rule in staging creates a second rule in production instead of updating the first. And
because the effective window does not survive export, either keep every rule effective all day, or
record the windows somewhere the import step will remind you about.

## Copying without a file

For moving rules inside one Nightingale, do not round-trip through JSON:

- **More → Clone to business groups** copies the selected rules into one or more other groups,
  keeping their names. This is the right way to hand a rule set to another team.
- The **Clone** action on a rule row opens the rule as a new unsaved copy, for making a variant.
- **More → Update alert rules** batch-edits one field across the selection — severity, execution
  frequency, effective time, tags, notification rule, and about fifteen others. This is how you fix
  a freshly imported batch that all needs the same data source or the same notification rule.

One caveat on batch edit: changing **Severity** only works on rules that have exactly one threshold.
On a rule with several severity tiers the request succeeds and changes nothing.

## Next

- Start from the shipped library instead: [Rule templates and built-in rules](./templates.md)
- Re-point imported rules: [Scope by business group and data source](./scope.md)
- Make sure they can actually notify: [Notification rules](../notifications/rules.md)
