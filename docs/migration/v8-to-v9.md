# v8 to v9

v8 to v9 is a binary swap with the schema migrated on startup, but several new config sections must be added by hand or the new features stay silently off.

Where this page ends: a v8 install running v9, with the prerequisites checked beforehand, the config sections that **must be added by hand** in place (otherwise the new features stay silently off), and a verification pass done.

There is **no manual data migration** between v8 and v9, and no breaking API rename. Three things do bite: the Redis version, a couple of sections that only exist in the new config file, and the indexes built online at startup.

## Three things to check before you start[​](#three-things-to-check-before-you-start "Direct link to Three things to check before you start")

1. **Redis 5.0 or later.** The v9 AI assistant relies on Redis Streams and will not start below 5.0. On Redis Cluster, 7.0+ is recommended so sharded Pub/Sub is available.
2. **Upgrade every process together.** If you run `n9e-edge` or `n9e-pushgw`, replace them in the same pass as `n9e`. Do not upgrade the centre alone.
3. **Leave disk headroom.** From v9.1 evaluation records are **on by default**: the alerting engine writes every evaluation round to its own local `./evallog`, retained for 8 days and capped at 20 GB. You can turn it off (below), but you cannot ignore it.

Back up four things: the database (`mysqldump`), the binary, `etc/` and `integrations/`.

## Upgrade steps[​](#upgrade-steps "Direct link to Upgrade steps")

Binary deployment:

```
# 1. back up

mysqldump -u root -p n9e_v6 > n9e_v6.$(date +%F).sql

cp -a etc etc.bak && mv integrations integrations.bak



# 2. replace the binary and the integrations directory (use the new one whole,

#    do not merge), then diff the config and copy the new sections across

diff -u etc.bak/config.toml etc/config.toml



# 3. restart
```

Container deployment: change the image tag in `docker-compose.yml` to the v9 one, `diff` the config, restart the containers.

Do not skip the last step: **hard-refresh the browser**, or it will keep the cached js and css.

## What happens to the schema[​](#what-happens-to-the-schema "Direct link to What happens to the schema")

Nightingale runs AutoMigrate at startup, so **you do not run any SQL by hand** — provided the account it connects with may create and alter tables. If it may not, hand the matching version sections of [`docker/migratesql/migrate.sql`](https://github.com/ccfos/nightingale/blob/main/docker/migratesql/migrate.sql) to your DBA. The database name has been `n9e_v6` since v6 and does not change.

`docker/sqlite.sql` and `docker/initsql/a-n9e.sql` are **fresh-install** files and play no part in an upgrade. `sqlite.sql` in particular is still at v7: it contains none of `notify_rule`, `notify_channel`, `message_template`, `event_pipeline` or `ai_llm_config` — **which is fine, AutoMigrate creates them.** Do not treat either file as the source of truth for the schema.

Two sets of indexes are built **asynchronously after startup**, which can take a long time on big tables. The service is usable throughout:

| Table                 | Index                                          | Note                                                 |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `alert_his_event`     | `idx_group_last_eval_time`                     | Usually the largest table; tens of minutes is normal |
| `notification_record` | `idx_nr_rule_created_evt`, `idx_nr_created_at` | A high-write table                                   |

**Only the `notification_record` indexes are built online.** Those two are issued on MySQL with an explicit `ALGORITHM=INPLACE, LOCK=NONE` — where online index creation is unsupported they **fail loudly** rather than silently degrading into a write-blocking DDL, and the log then tells you to add the index by hand with `gh-ost` or `pt-online-schema-change`. On PostgreSQL they use `CREATE INDEX CONCURRENTLY`.

**The `alert_his_event` index is a plain `CREATE INDEX`.** On MySQL 5.6+ that is still an online operation, but **on PostgreSQL a plain `CREATE INDEX` holds a share lock for the whole build**, so inserts into what is usually your largest table stall until it completes. On a large PostgreSQL deployment, plan for that: either accept the stall in a maintenance window, or create the index by hand with `CREATE INDEX CONCURRENTLY` before you start the new version, so the migration finds it already there and skips it.

A database upgraded from a much older release may still be missing the `notify_rule_id` column, in which case that one index is skipped with a message saying it will retry on the next start — that is expected, leave it.

## Config sections to deal with by hand[​](#config-sections-to-deal-with-by-hand "Direct link to Config sections to deal with by hand")

### Embedded TSDB: off unless you add it[​](#embedded-tsdb-off-unless-you-add-it "Direct link to Embedded TSDB: off unless you add it")

```
[EmbeddedTSDB]

Enable = true

Dir = "data/tsdb"

RetentionDuration = "15d"

MaxBytes = "10GiB"
```

This section **only exists in the new `etc/config.toml`**, so carrying your old config file over leaves it off — that is the single reason for "I replaced the binary and the embedded TSDB did nothing". It is **handled by the center process only**; `n9e-edge` / `n9e-alert` / `n9e-pushgw` ignore it and log a warning. Data lives on the local disk of **that one center instance**, so it fits single-instance deployments; with several replicas, stay on an external store. See [Embedded TSDB and external storage](https://n9e.github.io/docs/concepts/storage.md).

### Evaluation records: on unless you turn them off[​](#evaluation-records-on-unless-you-turn-them-off "Direct link to Evaluation records: on unless you turn them off")

```
# [Alert.EvalLog]

# Disable = false          # false is the default, i.e. enabled

# Dir = "logs/evallog"     # defaults to <[Log] Dir>/evallog

# RetentionHours = 192     # 8 days

# MaxDiskGB = 20
```

This section is **commented out** in the new config file because the code's own defaults already enable it. In other words: change nothing and it still writes to disk. Uncomment these lines only to shorten retention or switch it off. What they are for: [Evaluation records](https://n9e.github.io/docs/alerting/execution-records.md).

### One more if you run telegraf[​](#one-more-if-you-run-telegraf "Direct link to One more if you run telegraf")

Append `ignore_host=false` to telegraf's metric write URL, or the machines running telegraf **stop registering into the host list**. Categraf users are unaffected.

## The navigation moved[​](#the-navigation-moved "Direct link to The navigation moved")

v9 reorganised the menu. Coming from v8, these are the entries people cannot find. They all **still exist and are all available in the open-source edition** — they are just no longer top-level menu items:

| What you are looking for                      | Where it is in v9                                           |
| --------------------------------------------- | ----------------------------------------------------------- |
| Muting rules, Subscription rules              | Tabs at the top of **Alerts & Notifications → Alert rules** |
| Recording rules, Built-in metrics, Quick view | Tabs at the top of **Explorer → Metrics**                   |
| Event pipeline execution records              | A tab on **Alerts & Notifications → Workflows**             |
| LLM configs, Skill management                 | The secondary nav inside the Nightingale AI workspace       |
| The machine list                              | **Infrastructure → Hosts**                                  |

## Behaviour changes that affect scripts and queries[​](#behaviour-changes-that-affect-scripts-and-queries "Direct link to Behaviour changes that affect scripts and queries")

| Change                                                    | Consequence                                                                                                                                                                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target.update_at` is **no longer the heartbeat time**    | The heartbeat is written only to Redis (key `n9e_meta_update_time_<ident>`); read `beat_time` from the API instead. Judging liveness by `update_at` now marks everything offline                                                                  |
| Subscription rules' redefined severity / media / callback | On the new notification version these are cleared on save (along with the authorized teams). Express them through the notification rules the subscription selects — see [Alert subscriptions](https://n9e.github.io/docs/events/subscriptions.md) |
| The alert rule's top-level `prom_ql`                      | Always an empty string; the query lives in `rule_config.queries[].prom_ql`. Anything parsing rule JSON must read the latter                                                                                                                       |
| `prom_for_duration`                                       | Marked `Deprecated` in the source, but it is **still the only implementation of the for-duration**. Do not strip it                                                                                                                               |

The three-layer notification model — notification rules plus media types plus message templates — **arrived in v8**, not v9, so a v8 configuration carries over as-is. What v9 changed is the media type management UI, not the data model.

## Verify after upgrading[​](#verify-after-upgrading "Direct link to Verify after upgrading")

1. **Read the startup log.** Search for `failed to migrate table`. That line means a table was not altered, almost always a permissions problem — apply `migrate.sql` by hand as above.
2. **Check the version.** **System → About** shows the frontend and backend versions separately; both should be v9.
3. **Check the host list.** Heartbeat times under **Infrastructure → Hosts** should be ticking over. If they are not, check Redis connectivity first.
4. **Run a test fire.** Pick an existing alert rule and [test fire](https://n9e.github.io/docs/alerting/test-fire.md) it, checking every stage — query, threshold, event, notification. It is the fastest way to prove the whole chain at once.
5. **Send a test notification.** Hit **Run test** on any notification rule to confirm the media config survived the upgrade.

## Rolling back[​](#rolling-back "Direct link to Rolling back")

An upgrade never clears data, but the columns AutoMigrate added do not undo themselves. Roll back in this order:

1. stop the processes;
2. put the old binary back, and restore `etc.bak` and `integrations.bak`;
3. **restore the database backup only if the old version refuses to start** — the columns v9 added are merely surplus to v8, which normally ignores them and boots fine, whereas restoring the backup throws away every event and record produced since the upgrade;
4. start the processes and hard-refresh the browser.

Across major versions (v6 straight to v9, say) the project recommends stepping through each one. That is advice, not a hard limit — `migrate.sql` accumulates by version section, so applying it section by section makes a failure much easier to locate.

## Next[​](#next "Direct link to Next")

* What changed in each release: [Release notes](https://n9e.github.io/docs/help/release-notes.md)
* What has been deprecated: [Deprecations and EOL policy](https://n9e.github.io/docs/help/deprecations.md)
