---
title: "Import dashboards and rules"
sidebar_label: "Import dashboards and rules"
description: "Import the bundled dashboards and alert rules into a business group, and adjust thresholds before enabling."
last_reviewed: 2026-10-10
---

import { figures } from '@site/src/data/figures';

Where this page ends: a business group that now has this component's dashboards, plus a batch of
alert rules sitting **disabled**, waiting for you to adjust thresholds and enable them one by one.

Nightingale ships templates for {figures.integrations} components. Once metrics are arriving there is no need to draw
panels or write rules from scratch — import the templates into a business group and tune them.

## What a component ships with

**Integrations → Components**, click any component card, and the drawer has four tabs:

| Tab | Contents |
|---|---|
| Instructions | How this component is collected — see [Install collector configuration](./collector-config.md) |
| Metrics | Which metrics it produces and what each one means |
| Dashboards | Ready-made dashboard templates |
| Alert rules | Ready-made alert rule templates |

Not every component has all four. Of the {figures.integrations}, {figures.integrationsWithAlerts} ship alert rules, {figures.integrationsWithDashboards} ship dashboards, and {figures.integrationsWithMetrics} ship
metric descriptions.

## Importing dashboards

On the component drawer's **Dashboards** tab the columns are Name / Tags / Note / Updated by /
Operations. Bundled entries show **System** in the Updated by column.

Tick the rows you want and click **Import to business group**. The dialog has two fields:

| Field | Notes |
|---|---|
| Business group | Where it lands. It **must be a leaf group**; intermediate levels are not selectable |
| Content | Pre-filled with the JSON of the templates you ticked; normally leave it alone |

Click **Clone** to finish. The dashboards then appear under **Explorer → Dashboards** with that
business group selected.

The import is a **one-time copy**: when Nightingale is upgraded and a template changes, dashboards
you already imported do not follow. Re-import to pick up the new version.

**Panel data sources are not chosen at import time**, they are chosen when the dashboard is opened —
so one imported copy can be pointed at different sources.

## Importing alert rules

On the **Alert rules** tab, tick the rules and click **Import to business group**. This dialog has
more fields than the dashboard one:

| Field | Notes |
|---|---|
| Business group | As above, must be a leaf group |
| Enabled | **Off by default.** Leave it off until the thresholds are right |
| Source type | Read-only, derived from the templates themselves. Bundled rules are almost always `prometheus` |
| Data source | Which source(s) these rules run against. A **Data source preview** sits next to it |
| Notification rule | Where events go; you can pick an existing one or create one inline |
| Content | The rules' JSON, pre-filled |

Click **Import** to finish.

One import covers **one data source type**. Mixing types produces *"Cannot import alert rules of
different data source types"* and disables the submit button — import them in two passes.

## The other direction: from the dashboard and rule lists

If you would rather not start in the template center, the reverse path works too:

- **Explorer → Dashboards → pick a business group → Import**, and the first tab is
  **Import built-in dashboard**: choose a **Component**, then tick rows in the **Templates** table.
  That table has an extra **Variable** column so you can set dashboard variables before importing;
- **Alerts & Notifications → Alert rules → pick a business group → Import**, first tab
  **Import built-in alert rules**, which adds a **Category** dropdown (a component often ships two
  rule sets — `xxx_by_categraf` and `xxx_by_exporter` — split by how the data was collected).

Both entry points read the same templates through the same API; use whichever page you are already
on.

Those **Import** buttons only appear once a **leaf business group** is selected.

## A third entry point: one-click import after saving a data source

When a Prometheus-type data source is saved successfully, the result panel runs a template match:
it merges the sentinel metrics of the bundled templates into a single query against your source, and
**whichever sentinels have recent samples tell it which components' data is already there**. Those
components are then listed as cards:

> Found data from 3 components in this datasource. Click a card to import templates

Clicking a card opens the import dialog with dashboards and alert rules on separate tabs, each
showing its count. This path works for **Prometheus-family sources only**, and it judges "has recent
data", not "has ever had data".

## Adjust thresholds before enabling

The thresholds in bundled rules are **generic defaults**, not calibrated for your environment. After
importing, go through at least these three:

1. **The threshold.** "CPU above 90%" is normal on a load generator and an incident on a database
   primary;
2. **The for-duration.** A rule that fires on every blip gets ignored fast; look at how much the
   metric normally moves first;
3. **Notification rule and severity.** S1 should wake someone up; S3 should not.

Then turn **Enabled** on. Enabling all of them at once is the classic way to lose the team's trust —
switch on the five that matter, watch for a week, then do the next batch.

## Next

- Confirm the data is really there before trusting the rules: [Verify incoming data](./verify.md)
- Tuning rules: [Alert rules](../../alerting/overview.mdx)
- Editing dashboards: [Build a dashboard](../../query/dashboards.md)
- Nothing collecting yet: [Install collector configuration](./collector-config.md)
