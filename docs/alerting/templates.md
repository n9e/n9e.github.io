# Rule templates and built-in rules

Nightingale ships rule templates for MySQL, Redis, Kubernetes and sixty other components; import them into any business group, and save your own rules as templates.

Last reviewed 2026-10-10

Where this page ends: the alert rules that ship with Nightingale for MySQL, Redis, Kubernetes and sixty other things are in one of your business groups, pointed at your data sources and attached to a notification rule — and you know how to put your own rules into the same library.

## The library that ships with the install[​](#the-library-that-ships-with-the-install "Direct link to The library that ships with the install")

**Integrations → Components** (`/components`) is a grid of logos, one per integration. Nightingale ships <!-- -->83<!-- --> integrations; <!-- -->63<!-- --> of them carry alert rules.

Click an integration to open its drawer. Among its tabs, **Alert rules** is the list of rules that integration brings. Each rule carries a `note`, tags, and an `action` annotation with concrete first-response advice for whoever gets paged.

The list is filterable by **Category** — the categories come from how the rules are packaged, so MySQL has `mysql_by_categraf` and `mysql_by_exporter` as separate categories. Pick the one matching how you actually collect the metrics; importing both gives you every rule twice.

Rules from the shipped library are marked **System** in the *Updated by* column. That mark also means they cannot be edited or deleted here — only imported.

## Import a built-in rule into a business group[​](#import-a-built-in-rule-into-a-business-group "Direct link to Import a built-in rule into a business group")

Tick the rules you want, then **Import to business group**.

| Field              | What to put in it                                                                     |
| ------------------ | ------------------------------------------------------------------------------------- |
| Business group     | Where the rules land, and therefore which team owns the resulting events              |
| Enabled            | Off by default. Leave it off, review what came in, then enable                        |
| Source type        | Read-only, derived from the rules you selected                                        |
| Data source filter | Which of **your** instances these rules should run against                            |
| Notification rule  | Attach one here. The built-in rules carry no notification config of their own         |
| Content            | The rules as JSON. Editable — this is the place to adjust a threshold before it lands |

All the rules in one import must share a data source type; a mixed selection is refused before submission.

Submit. Expected result: the rules appear in that business group's rule list, disabled, with your data source filter and notification rule already set.

Unlike the export/import round trip described in [Import, export and reuse](https://n9e.github.io/docs/alerting/import-export.md), this path keeps the effective time window — the built-in rules carry theirs in the file.

## The same import, from the rule list[​](#the-same-import-from-the-rule-list "Direct link to The same import, from the rule list")

If you are already looking at a business group's rules, you do not have to go to Components: **Alert rules → Import → Import built-in alert rules** browses the same library and imports into the group you are in.

One difference worth knowing: this path does **not** offer the notification rule field, so rules imported this way arrive with nothing attached. Set it afterwards with **More → Update alert rules → Notification rule**.

## What to do after importing[​](#what-to-do-after-importing "Direct link to What to do after importing")

A built-in rule is a starting point, not a finished configuration. Three things need your attention before you enable them:

1. **Thresholds.** They were written against a generic install. `disk_used_percent > 85` is reasonable for a database server and noisy for a log collector. Go through them once.
2. **Severity.** The library is generous with S1. Decide which of these genuinely justify waking someone — see [Labels, annotations and severity](https://n9e.github.io/docs/alerting/labels-severity.md).
3. **A notification rule**, if you imported from the rule list. Without it the rule fires into silence.

Then enable them a few at a time rather than all at once, so that a wave of noise can be traced to a specific batch.

## Turning your own rule into a template[​](#turning-your-own-rule-into-a-template "Direct link to Turning your own rule into a template")

There is no "save as template" button. The supported path is a deliberate three-step one, and the form itself tells you so:

1. build and refine the rule in your own business group, where you can [test fire](https://n9e.github.io/docs/alerting/test-fire.md) it against real data;
2. select it in the rule list and use **More → Export rules JSON**;
3. go to **Integrations → Components**, open the integration it belongs to (or create one), the **Alert rules** tab, and click **Create**. Fill in a category name and paste the JSON.

A template stored this way lives in the database rather than the shipped files, so it shows your name in *Updated by* instead of **System**, and you can edit and delete it. From then on it appears in the same list as the built-in ones and imports the same way.

You can also create a new integration from the **Create** button on the Components page itself — it takes a name, a logo and an enabled flag. There is no package upload; an integration created this way is a container for templates you paste in.

Two notes on the JSON. The **rule name** is what the import matches on, so give templates names that will not collide with rules people already have. And strip anything environment-specific before pasting — data source ids in particular, since the import form sets those.

## Where the library comes from[​](#where-the-library-comes-from "Direct link to Where the library comes from")

The shipped rules are plain JSON files in the Nightingale release, under `integrations/<Integration>/alerts/*.json`. Each file is an array of rules, and the file name becomes the category you see in the UI.

They are read from disk at startup. The integrations themselves are recorded in the database; the alert rules, dashboards and metric descriptions are held in memory and rebuilt on every start, which is why editing the JSON files and restarting is enough to change what the library offers.

The directory defaults to `integrations` next to the working directory, and can be moved with `BuiltinIntegrationsDir` under `[Center]`. To skip loading the shipped library entirely — an air-gapped install with its own curated set, say — insert a row into the `configs` table with `ckey` = `disable_integration_init`.

## Next[​](#next "Direct link to Next")

* Adapt what you imported: [Metric rules](https://n9e.github.io/docs/alerting/metric-rules.md)
* Move your rules between environments: [Import, export and reuse](https://n9e.github.io/docs/alerting/import-export.md)
* Decide what deserves to page someone: [Rule design best practices](https://n9e.github.io/docs/alerting/best-practices.md)
