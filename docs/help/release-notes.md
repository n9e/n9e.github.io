---
title: "Release notes"
sidebar_label: "Release notes"
description: "Curated notes per release with upgrade impact, in addition to the GitHub changelog."
last_reviewed: 2026-10-15
---

This page does not mirror the changelog — the full per-commit list lives on GitHub and is updated
faster than this page could be. It answers one question instead: **if I move to this version, what
do I have to change?**

Curated through **[v9.2.0 (2026-10-11)](https://github.com/ccfos/nightingale/releases/tag/v9.2.0)**.
For later releases, see the full changes on [GitHub Releases](https://github.com/ccfos/nightingale/releases).

## Where the authoritative record is

| What you want | Where |
|---|---|
| The full set of changes per release | [GitHub Releases](https://github.com/ccfos/nightingale/releases) |
| Every commit between two versions | The **Full Changelog** link at the bottom of each release |
| Schema changes per version | [`docker/migratesql/migrate.sql`](https://github.com/ccfos/nightingale/blob/main/docker/migratesql/migrate.sql) in the repository, sectioned by `/* vX.Y.Z */` comments |
| Why a change was made | The PR number in the release notes — open it and read the discussion |

## How the product tells you a new version exists

On startup Nightingale checks GitHub for the latest tag and compares it with its own. In the
**open-source edition** the page header shows the running version; when there is an update it
carries a red dot, and hovering says *New version available vX.Y.Z*, linking to GitHub Releases.

**System → About** lists the **frontend version** and the **backend version** separately. They
should match; when they do not, usually only half the upgrade landed, or the browser is holding
cached frontend assets — hard-refresh once.

## Upgrade impact of the v9 releases

**Only the things you have to act on.** Feature improvements are not here; they are in the GitHub
release notes.

| Version | Date | What to handle before upgrading |
|---|---|---|
| **v9.2.0** | 2026-10-11 | Replace both the binary and the `integrations` directory; also replace `etc/metrics.yaml` if you need metric descriptions in the added languages. Check database permissions for this release's schema changes. Keeping an old config does not enable the embedded TSDB. See the checklist below |
| **v9.1.1** | 2026-08-18 | Nothing. A pure fix release: replace the binary and restart |
| **v9.1.0** | 2026-08-06 | 1. **Evaluation records are on by default** — the alerting engine writes to its local `./evallog`, retained 8 days and capped at 20 GB, so leave disk headroom or turn it off under `[Alert.EvalLog]`. 2. **The embedded TSDB is not switched on for you**: `[EmbeddedTSDB]` exists only in the new `etc/config.toml`, so carrying an old config over leaves it off. 3. Two `notification_record` indexes are created online after startup, which takes a while on a large table |
| **v9.0.0** | 2026-07-25 | 1. **Redis 5.0 or later is required** (the AI assistant relies on Redis Streams); 7.0+ is recommended on Cluster. 2. telegraf users must append `ignore_host=false` to the write URL, or those machines stop appearing in the host list. 3. `n9e-edge` and `n9e-pushgw` must be upgraded in the same pass |

Headline features per release, one line each — details on GitHub:

- **v9.0.0**: Nightingale AI (assistant, skills marketplace, LLM configs); **test fire** on alert
  rules; **mute notifications only** on mute rules; a built-in `/mcp` endpoint; navigation, layout
  and tables redesigned; the alert rule / mute / subscription / notification rule forms rebuilt.
- **v9.1.0**: the embedded TSDB; one-click data source import from Grafana; per-cycle evaluation
  records; testable media types and previewable message templates; mock events in workflow try
  runs; a much larger library of built-in alert rule templates.
- **v9.1.1**: list pages keep the current page in the URL; the log viewer renders through a
  virtual list; a batch of fixes.
- **v9.2.0**: native Jira, Discord, JSM Alert, Slack and Mattermost channels; mixed-datasource dashboard
  queries, time-limited anonymous sharing and Grafana import reports; reversible account disabling;
  AI script tasks through ibex; more languages and fixes including multi-instance login loops.

### v9.2.0 upgrade checklist {#v920-upgrade-checklist}

1. **Back up the metadata database and config, then check schema-change permissions.** This release
   adds `source_token.note`, the `idx_source_token_token` index on `source_token.token`, and
   `users.disabled`. Nightingale migrates them at startup when its database account has the required
   DDL permissions. Otherwise, have a DBA apply the missing changes using the
   [MySQL or PostgreSQL SQL in the v9.2.0 release notes](https://github.com/ccfos/nightingale/releases/tag/v9.2.0).
   Expected result: startup migration reports no permission or schema errors.
2. **Update the files together.** Replace the binary and the `integrations` directory. Also replace
   `etc/metrics.yaml` if you need metric descriptions in the added languages. Preserve your connection
   settings and restart; upgrade `n9e-edge` / `n9e-pushgw` in the same pass if you run them.
   Expected result: the processes start normally and the new integration templates are available.
3. **Choose metric storage for your deployment.** To enable the embedded TSDB, merge the
   `[EmbeddedTSDB]` section from the
   [v9.2.0 config](https://github.com/ccfos/nightingale/blob/v9.2.0/etc/config.toml) into your old config;
   replacing the binary alone does not enable it. It suits small, single-Center deployments only.
   Multi-Center deployments should keep an external TSDB.
   Expected result: existing data source queries, dashboards and alert rules still return data.

When upgrading from v8, also follow [v8 to v9](../migration/v8-to-v9.md) for Redis requirements,
telegraf write parameters, verification and rollback preparation.

## Three sections to read in any release note

Every GitHub release follows the same shape. Before upgrading, read at least these three:

1. **Upgrade note ⚠️ / Notes** — the only place that says "you must do this first", such as the
   Redis version requirement or a config section you have to add by hand. **Skipping this section
   is the number one cause of a bad upgrade.**
2. **Schema changes** — how the tables change. Check that the database account can create and alter
   tables and add indexes, so Nightingale can migrate at startup. Otherwise, give the DBA the changes
   for the versions you need; do not rerun the entire cumulative migration file.
3. The `fix:` entries under **What's Changed** — to find out whether the bug you have been living
   with is gone.

## Reading the version number

`vMAJOR.MINOR.PATCH`, plus `-beta.N` pre-release tags.

- **PATCH** (v9.1.0 → v9.1.1): bug fixes only; usually replace the binary and restart.
- **MINOR** (v9.0.0 → v9.1.0): new features, possibly with changed defaults — v9.1.0 is exactly
  that case, so read the upgrade note.
- **MAJOR** (v8 → v9): environment requirements change and the UI is reorganised; follow the
  [migration page](../migration/v8-to-v9.md).

## Next

- How to upgrade: [v8 to v9](../migration/v8-to-v9.md)
- What has been deprecated: [Deprecations and EOL policy](./deprecations.md)
