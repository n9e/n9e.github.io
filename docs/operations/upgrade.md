# Upgrade and database migration

How schema migrations run on startup, and how to upgrade a multi-instance deployment in order.

Last reviewed 2026-10-10

The commands for replacing a binary are in [Upgrade](https://n9e.github.io/docs/install/upgrade.md). This page is the runtime half: **what the process does to your schema when it boots, and what a multi-instance deployment looks like from the moment the first instance goes down until the last one is back**.

## Migration runs inside the process, at startup[​](#migration-runs-inside-the-process-at-startup "Direct link to Migration runs inside the process, at startup")

There is no migration command and no migration state table. Right after `n9e` connects to the metadata database — before Redis, before the caches, before the HTTP listener — it runs GORM's AutoMigrate over the model list compiled into the binary. Everything the new version needs appears then, or not at all.

Two properties follow from that, and both matter:

* **It is additive.** Missing tables, columns and indexes are created; nothing is ever dropped, and nothing is recorded about what the schema looked like before. That is why there is no reverse migration — see [Rollback](https://n9e.github.io/docs/install/rollback.md).
* **The models are the schema, not the SQL files.** `docker/sqlite.sql` and `docker/initsql/a-n9e.sql` are fresh-install artefacts and lag behind: `sqlite.sql` contains no `notify_rule`, `notify_channel_config`, `message_template`, `event_pipeline` or `ai_llm_config` table at all. Those tables exist in a running v9 **only because AutoMigrate created them**. Never diff your live schema against those files to decide whether an upgrade landed.

Startup order, in the order things can fail:

| Step                                                         | If it fails                           |
| ------------------------------------------------------------ | ------------------------------------- |
| Connect to the metadata database                             | **The process exits**                 |
| Run the schema migration                                     | Logged, and startup continues         |
| Create the root user and the JWT signing key                 | Logged, and startup continues         |
| Connect to Redis                                             | **The process exits**                 |
| Load config into in-memory caches, start the alerting engine | Rules do not evaluate                 |
| Listen on 17000                                              | The port is in use; the process exits |

## Two phases: small tables block startup, big ones do not[​](#two-phases-small-tables-block-startup-big-ones-do-not "Direct link to Two phases: small tables block startup, big ones do not")

| Phase                  | Covers                                                                                | Blocks startup |
| ---------------------- | ------------------------------------------------------------------------------------- | -------------- |
| Synchronous            | Every table except the event tables — rules, users, data sources, notification config | Yes            |
| Asynchronous goroutine | `alert_cur_event`, `alert_his_event`, and three indexes                               | No             |

The asynchronous phase also builds three indexes, on the two tables that grow without bound — and they are **not built the same way**:

* the two on `notification_record` are issued deliberately non-blocking: `ALGORITHM=INPLACE, LOCK=NONE` on MySQL, `CREATE INDEX CONCURRENTLY` on PostgreSQL. Where MySQL cannot do it online it fails loudly rather than degrading into a write-blocking DDL;
* `idx_group_last_eval_time` on `alert_his_event` is a **plain `CREATE INDEX`** with no such clause. On PostgreSQL that holds a share lock on the table for the whole build, which blocks inserts into it — and `alert_his_event` is usually the largest table you have. On a big PostgreSQL deployment, expect historical events to stall while it builds.

Which means the process answers `/ping`, serves the UI and evaluates rules **while the largest table in your database is still being altered**. On a multi-gigabyte `alert_his_event` that runs for tens of minutes. Do not restart to unstick it: a restart begins the same work again.

One expected warning: if `notification_record` does not yet have a `notify_rule_id` column, the index that needs it is skipped with *will retry on next start*, and the other one is created anyway. Leave it alone.

## A failed migration does not stop the process[​](#a-failed-migration-does-not-stop-the-process "Direct link to A failed migration does not stop the process")

Every migration error is written to the log and swallowed; a panic inside migration is recovered. The design is deliberate — another instance or the next restart repairs the schema — but the consequence is easy to miss: **an instance can be up, serving traffic and heartbeating while a column it needs is missing.** You will not see a startup failure. You will see one feature failing at runtime with an `Unknown column` error, days later.

So the check after an upgrade is a log grep, not a health check:

```
grep -iE "failed to migrate table|failed to create index" /opt/n9e/logs/*.log
```

**Expected result**: no output. Anything there is almost always a permissions problem — the account in `[DB] DSN` may read and write but not `CREATE` or `ALTER`. Fix the grant and restart, or hand the matching version sections of `docker/migratesql/migrate.sql` to your DBA, as described in [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md).

## Let one instance migrate, then roll the rest[​](#let-one-instance-migrate-then-roll-the-rest "Direct link to Let one instance migrate, then roll the rest")

The migration code carries explicit guards against two things that only happen when several instances start at once, which tells you they are real:

* two instances issuing `ALTER` on the same table concurrently can make the MySQL driver's column-type lookup dereference a nil type. The panic is recovered, but that migration entry point is abandoned for that start;
* a duplicated `CREATE INDEX` on a large `alert_his_event` blocks on the metadata lock and hangs startup — not for seconds, indefinitely.

Neither corrupts data, and both cost you a start you then have to diagnose. The ordering that avoids both:

1. Stop **one** instance, replace its binary, start it. It owns the migration.
2. Wait for its log to go quiet: no `failed to migrate`, and no index work still running.
3. Only then take the next instance, and one at a time from there.

![The alerting engines page](https://n9e.github.io/img/docs/operations/alerting-engines.webp)![The alerting engines page](https://n9e.github.io/img/docs/operations/alerting-engines.dark.webp)

[Upgrade](https://n9e.github.io/docs/install/upgrade.md) already asks you to roll one at a time so that alerting never stops. The migration race is a **second, independent reason** for the same rule — and the reason the first instance deserves a pause before you touch the second, rather than a fixed interval.

## What the upgrade window actually costs[​](#what-the-upgrade-window-actually-costs "Direct link to What the upgrade window actually costs")

Per instance, from `systemctl stop` to steady state:

| Function                                   | During that instance's restart                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rule evaluation                            | Its rules move to a surviving instance within 30 seconds, then keep running                                                                        |
| Rule evaluation, on the restarted instance | Nothing for a further 30 seconds after start (`[Alert] EngineDelay`)                                                                               |
| Metric ingestion                           | Whatever writes to that instance's `/prometheus/v1/write` fails; put a load balancer in front, or accept the gap                                   |
| UI and API                                 | Unavailable on that instance only                                                                                                                  |
| Notifications                              | Follow evaluation — the owning instance sends them                                                                                                 |
| Embedded TSDB                              | Its data is unreadable and unwritable for the whole restart, and it must not be on in a cluster anyway                                             |
| Edge sites                                 | `n9e-edge` keeps evaluating and notifying locally — see [Edge network partition behavior](https://n9e.github.io/docs/operations/edge-partition.md) |

Restarting every instance together turns the first row into "nothing is evaluated for as long as the upgrade takes", which is the whole reason for rolling.

## Related[​](#related "Direct link to Related")

* [Upgrade](https://n9e.github.io/docs/install/upgrade.md) — the commands
* [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md) — the cross-major breaking points
* [High availability and failure domains](https://n9e.github.io/docs/operations/high-availability.md) — how rules move between instances
* [Rollback and recovery](https://n9e.github.io/docs/operations/rollback.md) — when it goes wrong
* [Why does an upgrade or database migration fail?](https://n9e.github.io/docs/troubleshooting/upgrade-fails.md) — when the log has something in it
