# Why does an upgrade or database migration fail?

Unknown column errors, blank pages or a hung process after an upgrade mean the schema did not fully migrate — usually missing database privileges or an interrupted run.

Last reviewed 2026-10-10

You swapped in the new binary, the process started, and the UI reports `Unknown column`; or one new feature's page is blank; or the process hangs entirely after startup. All of these point at one thing: **the schema was not fully brought up to date.**

Gauge urgency by reach. **Errors confined to one new feature's page** while everything else works can be fixed calmly. **Cannot log in, or the events page will not open** means a core table is affected — go straight to the last section and get back to a consistent state.

## The process starting is not evidence the migration succeeded[​](#the-process-starting-is-not-evidence-the-migration-succeeded "Direct link to The process starting is not evidence the migration succeeded")

This is the foundation of the page, and the least intuitive part: **a migration failure is non-fatal — the error is only logged, and the process starts anyway.**

So "the service came up" says nothing about whether the upgrade worked. The only evidence is the startup log:

```
grep -n "failed to migrate table" /path/to/n9e.log
```

**Any output means the migration is incomplete.** The line looks like this, and the name after the colon is the table that did not get upgraded:

```
ERROR failed to migrate table:alert_his_event Error 1142 (42000): ALTER command denied to user 'n9e'@'%' for table 'alert_his_event'
```

Pull these four out together — they mean quite different things:

```
grep -nE "failed to migrate table|failed to create index|skip index .* not migrated yet|recovered panic during" /path/to/n9e.log
```

| Log line                                                                                                          | Meaning                                                                | Act on it?                                 |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| `failed to migrate table:<table> ...`                                                                             | That table was not upgraded                                            | **Yes** — see the first root cause below   |
| `failed to create index ... please create it manually with an online DDL tool (gh-ost / pt-online-schema-change)` | An index was not built; the table structure itself is fine             | Yes, but not urgently — see the second     |
| `skip index <name> on notification_record: column(...) not migrated yet, will retry on next start`                | Index building and column adding run in parallel, and this pass missed | **No** — the next startup picks it up      |
| `recovered panic during <scene>`                                                                                  | A panic during migration was caught                                    | Yes — include the stack when you report it |

## How the migration happens[​](#how-the-migration-happens "Direct link to How the migration happens")

**There is no separate migration command.** Every `n9e` startup runs GORM's AutoMigrate: it creates missing tables, adds missing columns and builds missing indexes. It is **additive only** — it never drops anything, and never records what the schema looked like before.

Three consequences you will use repeatedly:

1. **An upgrade needs no hand-written SQL from you**, provided the account it connects with may create and alter tables;
2. **Restarting the same version retries the migration**, so after one failure, fixing the permission and restarting often completes it;
3. **There is no reverse migration.** After rolling the binary back the database holds tables and columns the old version does not know about — it usually ignores them and starts fine, but that is not a guarantee.

`docker/sqlite.sql` and `docker/initsql/a-n9e.sql` are **fresh-install** files and play no part in an upgrade. `sqlite.sql` in particular is still at v7 and contains none of `notify_rule`, `notify_channel`, `message_template`, `event_pipeline` or `ai_llm_config` — **which is fine, AutoMigrate creates them.** Do not treat either file as the source of truth for the schema.

The database name has been `n9e_v6` since v6 and does not change on upgrade.

## Common root causes, and how to confirm each[​](#common-root-causes-and-how-to-confirm-each "Direct link to Common root causes, and how to confirm each")

### The database account cannot create or alter tables[​](#the-database-account-cannot-create-or-alter-tables "Direct link to The database account cannot create or alter tables")

This is the main source of `failed to migrate table`. Plenty of production databases grant the application account only DML, not DDL.

**How to confirm**: the error text on that log line says so directly — on MySQL, `Error 1142 ... ALTER command denied` or `CREATE command denied`; on PostgreSQL, `permission denied for table ...`. You can also check it head-on:

```
-- run as the account Nightingale connects with

SHOW GRANTS FOR CURRENT_USER();
```

**How to fix**, one of two ways:

* **Grant temporarily and restart** — give the account `CREATE`, `ALTER` and `INDEX`, restart `n9e` so it completes the migration itself, confirm the log is clean, then revoke;
* **Hand it to the DBA** — take the sections for your target version out of `docker/migratesql/migrate.sql`. That file accumulates by version, so applying it section by section makes any failure much easier to locate.

### An index will not build, and the log tells you to call a DBA[​](#an-index-will-not-build-and-the-log-tells-you-to-call-a-dba "Direct link to An index will not build, and the log tells you to call a DBA")

The indexes on two large tables are built **asynchronously after startup**, which can take tens of minutes on a big database. **The service is usable throughout.**

| Table                 | Index                                          |
| --------------------- | ---------------------------------------------- |
| `alert_his_event`     | `idx_group_last_eval_time`                     |
| `notification_record` | `idx_nr_rule_created_evt`, `idx_nr_created_at` |

On MySQL both are issued with an explicit `ALGORITHM=INPLACE, LOCK=NONE` — **where online index creation is unsupported it fails loudly rather than silently degrading into a write-blocking DDL.** PostgreSQL uses `CREATE INDEX CONCURRENTLY`.

**How to confirm**: the `please create it manually with an online DDL tool` line, or directly:

```
SHOW INDEX FROM notification_record;

SHOW INDEX FROM alert_his_event;
```

**How to fix**: do as it says and add them with `gh-ost` or `pt-online-schema-change`. **It works without them**, but the events list and notification record queries get noticeably slower.

PostgreSQL has one self-healing behaviour worth recognising: a failed `CREATE INDEX CONCURRENTLY` leaves an unusable index behind, and the next startup drops it before rebuilding, logging `dropping invalid index ... left behind by a failed CREATE INDEX CONCURRENTLY`. Ignore that line.

### Startup hangs[​](#startup-hangs "Direct link to Startup hangs")

The process has not exited and has not errored; the log simply stops in the migration phase.

**How to confirm**: check the database for DDL waiting on a lock:

```
SHOW PROCESSLIST;                          -- MySQL: look for "Waiting for table metadata lock"

SELECT * FROM pg_stat_activity WHERE state <> 'idle';   -- PostgreSQL
```

A repeated `CREATE INDEX` against a very large `alert_his_event` waits on the metadata lock forever and **hangs startup with it**. Several instances starting the new version for the first time simultaneously is the usual way to hit this.

**How to fix**: **roll the upgrade, one instance at a time**, waiting for a clean log before starting the next. If you are already stuck, stop the surplus instances and let one finish building the index.

### The config file is the old one, so new features stay off[​](#the-config-file-is-the-old-one-so-new-features-stay-off "Direct link to The config file is the old one, so new features stay off")

This is not a migration failure, but it presents very much like "the upgrade did nothing": the feature is there and the page is empty.

**How to confirm**: diff for the sections the new version added:

```
diff -u /opt/n9e/etc.bak/config.toml /opt/n9e/etc/config.toml
```

The classic case is `[EmbeddedTSDB]`, which **only exists in the new `etc/config.toml`** — carrying your old config over leaves it off, presenting as "I replaced the binary and the embedded TSDB did nothing".

**How to fix**: copy the new sections into your config file one at a time. **Do not overwrite your file with the new one** — that discards your customisations. The `integrations/` directory is the opposite: **replace it wholesale, do not merge**, or you get dashboards and rule templates that no longer match the version.

### The UI version does not match the backend[​](#the-ui-version-does-not-match-the-backend "Direct link to The UI version does not match the backend")

**How to confirm**: **System → About** shows the frontend and backend versions separately; both should be the new one.

**How to fix**: **hard-refresh the browser** (the cache-clearing kind). Cached frontend js is the most common false alarm after an upgrade.

## Getting back to a consistent state after a partial migration[​](#getting-back-to-a-consistent-state-after-a-partial-migration "Direct link to Getting back to a consistent state after a partial migration")

In order of increasing cost — try the cheap one first:

1. **Fix the cause and restart once.** The migration is retried at every startup, so restoring the permission, freeing the disk or releasing the table lock and restarting `n9e` completes most partial migrations by itself. **This is the first thing to try**;
2. **Have the DBA add the missing tables and columns** using the matching version sections of `docker/migratesql/migrate.sql`, then restart and confirm no `failed to migrate table` remains;
3. **Roll the binary back.** The columns the new version added are merely surplus to the old one, which normally ignores them and boots. If the old version reports `Unknown column` or `Error 1364` (field has no default value), this route does not work;
4. **Restore the database from backup.** The cost is blunt: **everything created since the backup is gone** — rules written since, alert events, notification records, dashboard edits. In a cluster, **stop every instance first**, or a surviving one keeps writing and fights the import.

Option 4 is exactly what the pre-upgrade `mysqldump` is for. The steps are in [Rollback](https://n9e.github.io/docs/install/rollback.md).

## Confirming the upgrade succeeded[​](#confirming-the-upgrade-succeeded "Direct link to Confirming the upgrade succeeded")

Work through these; each has a definite expected result:

1. **A clean log**: `grep "failed to migrate table" <log>` produces **no output**;

2. **The right version**:

   ```
   curl -s --noproxy '*' http://127.0.0.1:17000/api/n9e/version
   ```

   then check the frontend version under **System → About**;

3. **Heartbeats ticking**: the heartbeat times under **Infrastructure → Hosts** are updating — if they are not, check Redis connectivity first;

4. **One end-to-end run**: pick an existing alert rule and **test fire** it, which verifies query, evaluation, event and notification in one pass;

5. **One test notification**: hit **Run test** on any notification rule to confirm the media config survived.

Steps 4 and 5 pass perfectly well while indexes are still building in the background — **do not restart just because you see index building in the log**.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The **versions** before and after (`./n9e --version` or `/api/n9e/version`; the frontend version is on the About page);
2. The **complete startup log**, at least from launch to "serving";
3. The output of `grep -nE "failed to migrate table|failed to create index|recovered panic during" <log>`;
4. The database type and version, and `SHOW GRANTS` for the account Nightingale uses;
5. The result of `diff -u etc.bak/config.toml etc/config.toml`;
6. The deployment shape: how many instances, whether there is an edge, and whether metadata is in MySQL, PostgreSQL or SQLite.

**Redacting**: replace the DSN password, channel tokens and LLM API keys. **Keep the table and column names in the error text** — they are the answer. Host names in `SHOW GRANTS` can be masked.

## Next[​](#next "Direct link to Next")

* The full upgrade procedure: [Upgrade](https://n9e.github.io/docs/install/upgrade.md)
* Cross-major breaking points: [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md)
* When you cannot go forward: [Rollback](https://n9e.github.io/docs/install/rollback.md)
* A backup policy: [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md)
* What to monitor afterwards: [Monitor Nightingale itself](https://n9e.github.io/docs/operations/self-monitoring.md)
