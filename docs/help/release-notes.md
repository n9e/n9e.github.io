# Release notes

Curated notes per release with upgrade impact, in addition to the GitHub changelog.

This page does not mirror the changelog — the full per-commit list lives on GitHub and is updated faster than this page could be. It answers one question instead: **if I move to this version, what do I have to change?**

Curated through **v9.1.1 (2026-08-18)**. For anything newer, go straight to GitHub.

## Where the authoritative record is[​](#where-the-authoritative-record-is "Direct link to Where the authoritative record is")

| What you want                       | Where                                                                                                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The full set of changes per release | [GitHub Releases](https://github.com/ccfos/nightingale/releases)                                                                                                        |
| Every commit between two versions   | The **Full Changelog** link at the bottom of each release                                                                                                               |
| Schema changes per version          | [`docker/migratesql/migrate.sql`](https://github.com/ccfos/nightingale/blob/main/docker/migratesql/migrate.sql) in the repository, sectioned by `/* vX.Y.Z */` comments |
| Why a change was made               | The PR number in the release notes — open it and read the discussion                                                                                                    |

## How the product tells you a new version exists[​](#how-the-product-tells-you-a-new-version-exists "Direct link to How the product tells you a new version exists")

On startup Nightingale checks GitHub for the latest tag and compares it with its own. In the **open-source edition** the page header shows the running version; when there is an update it carries a red dot, and hovering says *New version available vX.Y.Z*, linking to GitHub Releases.

**System → About** lists the **frontend version** and the **backend version** separately. They should match; when they do not, usually only half the upgrade landed, or the browser is holding cached frontend assets — hard-refresh once.

## Upgrade impact of the v9 releases[​](#upgrade-impact-of-the-v9-releases "Direct link to Upgrade impact of the v9 releases")

**Only the things you have to act on.** Feature improvements are not here; they are in the GitHub release notes.

| Version    | Date       | What to handle before upgrading                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v9.1.1** | 2026-08-18 | Nothing. A pure fix release: replace the binary and restart                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **v9.1.0** | 2026-08-06 | 1. **Evaluation records are on by default** — the alerting engine writes to its local `./evallog`, retained 8 days and capped at 20 GB, so leave disk headroom or turn it off under `[Alert.EvalLog]`. 2. **The embedded TSDB is not switched on for you**: `[EmbeddedTSDB]` exists only in the new `etc/config.toml`, so carrying an old config over leaves it off. 3. Two `notification_record` indexes are created online after startup, which takes a while on a large table |
| **v9.0.0** | 2026-07-25 | 1. **Redis 5.0 or later is required** (the AI assistant relies on Redis Streams); 7.0+ is recommended on Cluster. 2. telegraf users must append `ignore_host=false` to the write URL, or those machines stop appearing in the host list. 3. `n9e-edge` and `n9e-pushgw` must be upgraded in the same pass                                                                                                                                                                        |

The full upgrade procedure, verification and rollback are in [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md).

Headline features per release, one line each — details on GitHub:

* **v9.0.0**: Nightingale AI (assistant, skills marketplace, LLM configs); **test fire** on alert rules; **mute notifications only** on mute rules; a built-in `/mcp` endpoint; navigation, layout and tables redesigned; the alert rule / mute / subscription / notification rule forms rebuilt.
* **v9.1.0**: the embedded TSDB; one-click data source import from Grafana; per-cycle evaluation records; testable media types and previewable message templates; mock events in workflow try runs; a much larger library of built-in alert rule templates.
* **v9.1.1**: list pages keep the current page in the URL; the log viewer renders through a virtual list; a batch of fixes.

## Three sections to read in any release note[​](#three-sections-to-read-in-any-release-note "Direct link to Three sections to read in any release note")

Every GitHub release follows the same shape. Before upgrading, read at least these three:

1. **Upgrade note ⚠️ / Notes** — the only place that says "you must do this first", such as the Redis version requirement or a config section you have to add by hand. **Skipping this section is the number one cause of a bad upgrade.**
2. **Schema changes** — how the tables change. Skippable if the database account may create tables, since Nightingale alters them at startup; if it may not, hand `migrate.sql` to the DBA.
3. The `fix:` entries under **What's Changed** — to find out whether the bug you have been living with is gone.

## Reading the version number[​](#reading-the-version-number "Direct link to Reading the version number")

`vMAJOR.MINOR.PATCH`, plus `-beta.N` pre-release tags.

* **PATCH** (v9.1.0 → v9.1.1): bug fixes only; usually replace the binary and restart.
* **MINOR** (v9.0.0 → v9.1.0): new features, possibly with changed defaults — v9.1.0 is exactly that case, so read the upgrade note.
* **MAJOR** (v8 → v9): environment requirements change and the UI is reorganised; follow the [migration page](https://n9e.github.io/docs/migration/v8-to-v9.md).

## Next[​](#next "Direct link to Next")

* How to upgrade: [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md)
* What has been deprecated: [Deprecations and EOL policy](https://n9e.github.io/docs/help/deprecations.md)
