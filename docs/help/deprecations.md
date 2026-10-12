# Deprecations and EOL policy

Features, fields and UI items marked deprecated, with their replacements; the project publishes no removal schedule, and GitHub releases are the version record.

Last reviewed 2026-10-10

This page lists what Nightingale marks as deprecated and what replaced it. It does not list removal dates, because **the project does not publish any** — see the first section before reading the rest.

## There is no published maintenance policy[​](#there-is-no-published-maintenance-policy "Direct link to There is no published maintenance policy")

The project publishes no support matrix, no LTS designation, no stated maintenance window per minor version, and no announced removal schedule for anything on this page. [Compatibility matrix](https://n9e.github.io/docs/reference/compatibility.md) says the same thing about platform versions, for the same reason.

In practice the head of the release line is what receives fixes: v9.1.1 is a patch on top of v9.1.0, and that is where a bug fix appears. Beyond that, the authoritative record is GitHub:

| What you want to know                            | Where                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Which versions exist, and when each was released | [GitHub Releases](https://github.com/ccfos/nightingale/releases)                                           |
| Whether a fix has landed                         | The `fix:` entries in each release — see [Release notes](https://n9e.github.io/docs/help/release-notes.md) |
| Whether a field is still read by the engine      | The source. Nothing else is binding                                                                        |

**Everything marked deprecated below still exists and still works in v9.1.1.** Nothing has been removed. Read "deprecated" as "the replacement is where new work should go", not as "this stops working next release" — nobody has said when, and you should not infer a date from this page.

## The install date decides what you still see[​](#the-install-date-decides-what-you-still-see "Direct link to The install date decides what you still see")

The interface hides deprecated menu entries based on **when the installation was created, not which version it runs**. The cutoff is 2025-06-20, the v8 beta 14 release:

* an installation created **after** that date never shows the deprecated notification pages, and never shows the notification-version switch on the alert rule form;
* an installation created **before** it still shows them, with a deprecation marker beside them in the sidebar.

So two systems both running v9.1.1 can have different menus, and neither is broken. If a colleague's install has entries yours does not, theirs predates the cutoff.

## Deprecated in the interface[​](#deprecated-in-the-interface "Direct link to Deprecated in the interface")

| What                                         | Where it was           | Replacement                                                           |
| -------------------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| Notification (`/help/notification-settings`) | Alerts & Notifications | **Notification rules** plus **Media types**                           |
| Templates (`/help/notification-tpls`)        | Alerts & Notifications | **Message templates**                                                 |
| Relabel, on the alert rule form              | The alert rule form    | The **Event label rewrite** processor in an event-processing workflow |

The first two are the entries hidden by the install-date rule above. The third is not hidden — the form carries its own notice saying that existing relabel configuration is better expressed as a workflow processor.

## Deprecated fields on the alert rule[​](#deprecated-fields-on-the-alert-rule "Direct link to Deprecated fields on the alert rule")

These carry a `Deprecated` marker in the alert rule model. All of them are still accepted and still returned by the API:

| Field                                                 | Replacement                                              | Note                                                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `datasource_ids`, `cluster`                           | `datasource_queries`                                     | `datasource_ids` is back-filled on read for the list page; the engine reads only `datasource_queries`                     |
| `notify_channels`, `notify_groups`, `callbacks`       | `notify_rule_ids`                                        | The three-layer notification model. A rule on `notify_version: 1` does not use them                                       |
| `enable_stime`, `enable_etime`, `enable_days_of_week` | `enable_stimes`, `enable_etimes`, `enable_days_of_weeks` | The singular forms held one effective window; the plural forms hold several                                               |
| `prom_for_duration`                                   | Marked *use cron pattern instead*                        | **Still the only implementation of the for-duration**, and still read at every evaluation. Do not strip it from rule JSON |

Anything that reads or writes alert rule JSON — an exporter, a provisioning script, a sync job — should move to the replacements, and must keep `prom_for_duration` regardless.

## Subscription rule fields cleared by the new notification version[​](#subscription-rule-fields-cleared-by-the-new-notification-version "Direct link to Subscription rule fields cleared by the new notification version")

Saving a subscription rule with `notify_version: 1` clears these fields to empty on the server, with no error and no warning:

* the authorised teams (`user_group_ids`);
* the redefined channels (`redefine_channels`, `new_channels`);
* the redefined webhooks (`redefine_webhooks`, `webhooks`);
* the redefined severity (`redefine_severity`, `new_severity`).

This is intended, not a bug: on the new model those decisions belong to the notification rules the subscription selects, not to the subscription. See [Alert subscriptions](https://n9e.github.io/docs/events/subscriptions.md). If you create subscriptions from a script, sending those fields alongside `notify_version: 1` silently drops them.

## Code that is still there but no longer on any path[​](#code-that-is-still-there-but-no-longer-on-any-path "Direct link to Code that is still there but no longer on any path")

Two things you may find by reading the source or watching a network trace. Both still respond; build on neither.

* **`POST /api/n9e/busi-group/alert-rules/notify-tryrun` and `.../enable-tryrun`.** The frontend still defines a wrapper for each, and its only call sites for them are commented out. Their job is done by [test fire](https://n9e.github.io/docs/alerting/test-fire.md), which walks query → threshold → event → notification in one pass instead of two partial checks.
* **The v7-era senders in `alert/sender/`** (DingTalk, WeCom, Feishu, Lark, Telegram, Mattermost, email). They are still compiled in and still wired up, but only the legacy path reaches them: an event from a rule on `notify_version: 0` carrying `notify_channels` and `notify_groups`. Notification rules take an entirely different route, through the media types configured under **Alerts & Notifications → Media types**. Editing a template on the old path does not change what notification rules send.

## Related[​](#related "Direct link to Related")

* [Release notes](https://n9e.github.io/docs/help/release-notes.md) — upgrade impact per version
* [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md) — where most of these replacements arrived
* [Compatibility matrix](https://n9e.github.io/docs/reference/compatibility.md) — the other page with no official promise behind it
