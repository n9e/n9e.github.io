# Rollback and recovery

Undo an upgrade or a bad config push, and recover from a corrupted metadata database.

Last reviewed 2026-10-10

Three different things get called "rolling back", and mechanically they have nothing in common: a **version**, a **file in `etc/`**, and a **change somebody made in the UI**. Each has its own undo, and only the first one is covered by [Rollback](https://n9e.github.io/docs/install/rollback.md), which has the commands. This page is about performing each of them on a deployment that is running, plus the case where the metadata database itself is what broke.

## Rolling a cluster back to the previous version[​](#rolling-a-cluster-back-to-the-previous-version "Direct link to Rolling a cluster back to the previous version")

The constraint that shapes everything: the schema migration is additive and one-way, so there is no un-migration. The old binary starts against the newer schema and ignores the columns it does not know — usually. [Rollback](https://n9e.github.io/docs/install/rollback.md) sets out when "usually" fails and what to do then.

What a cluster adds is a **mixed-version window**. Instances of both versions share one database and one Redis, and rules are split between them by consistent hash, so during the roll a given rule may be evaluated by either version. Going forward that is fine: the newer version reads everything the older one wrote. Going backward it is not symmetric — configuration created while the new version was running may use fields the old version does not implement, and the old version will evaluate those rules anyway, without saying anything.

So the ordering differs from an upgrade in one respect:

1. Roll instances back one at a time, same as forward — the 30-second failover and the 30-second post-start evaluation delay both still apply, see [Upgrade and database migration](https://n9e.github.io/docs/operations/upgrade.md).
2. **Do not stop half way.** A mixed pair is fine for the minutes a roll takes and a bad idea for days. Decide, then finish.
3. Put `integrations/` back with the binary. Those templates ship with the version.
4. Hard-refresh the browser. The frontend assets come from the process you just replaced.

No instance is special going back. The one that ran the migration on the way up has nothing to undo.

## Undoing a change to `etc/`[​](#undoing-a-change-to-etc "Direct link to undoing-a-change-to-etc")

`config.toml` is read **once, at process start**. There is no reload signal and no hot reload, so undoing a config change always means putting the file back and restarting that instance — which makes it the safest kind of change to undo, and the one that costs a restart every time.

Keep `etc/` in version control and the undo is `git checkout` plus a restart; see [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md). Restart instance by instance, the same way you roll an upgrade, so alerting keeps running while you do it.

The failure mode to recognise: **you revert `config.toml`, restart, and the setting is still there.** That means it was never in the file. Site settings, variables, SSO, notification webhooks and the notification script all live in the `configs` table in the database, not in `etc/`. They take effect without a restart — the config caches re-read from the database every 9 seconds — and they are undone in the same place they were set. That table records `update_by` and `update_at`, so "who changed this and when" has an answer.

## Undoing a change made in the UI[​](#undoing-a-change-made-in-the-ui "Direct link to Undoing a change made in the UI")

There is **no version history** for alert rules, dashboards or notification config. The form warns you when someone else edited a rule while you had it open, which prevents one person clobbering another; it does not hand you the previous version. So the recovery paths, best first:

* **Re-edit it.** The rule list shows who last updated it and when, which is usually enough to reconstruct a single change.
* **The export you took first.** Exporting the selected rules to JSON before a bulk edit is the cheapest insurance. Note that the export drops the effective time window, so check that field after re-importing.
* **Last night's database dump.** Pulling one table out of a dump means stopping every instance first; follow [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md).

One trap if you repair a rule by writing to the database directly: **the alerting engine may never notice.** The rule cache refreshes only when `count(*)` or `max(update_at)` across enabled rules changes, so an edit that leaves both untouched sits in the table and never reaches the engine. Bump `update_at` to the current epoch seconds as part of the same statement. To check what an instance actually loaded:

```
curl --noproxy '*' http://127.0.0.1:17000/dumper/sync
```

**Expected result**: the `alert_rules` entry says `success` with a record count. `not changed` means the engine decided nothing had changed — which is the symptom described above. The endpoint only answers requests from the host itself.

## When the metadata database itself is broken[​](#when-the-metadata-database-itself-is-broken "Direct link to When the metadata database itself is broken")

**Stop every `n9e` and `n9e-edge` process before you touch it.** A surviving instance writes heartbeats and events continuously, so a repair or restore that runs alongside one gives you a mixture of both. This is the single step most often skipped.

After that it is an ordinary database problem, handled with the database's own tools. If the answer turns out to be "restore the dump", the ordered procedure — including which instance to start first and how to prove evaluation resumed — is in [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md).

SQLite is the exception worth spelling out, because its usual cause is specific: running two processes against one `n9e.db` corrupts it, and you get `database disk image is malformed`. There is nothing to repair. The database is **three files** — `n9e.db`, `n9e.db-wal`, `n9e.db-shm` — and they move together: delete all three, or restore all three. Deleting only `n9e.db` pairs a new database with a stale write-ahead log. Check for an already-running process before starting another one; `lsof` on the file tells you.

## What no rollback brings back[​](#what-no-rollback-brings-back "Direct link to What no rollback brings back")

| Thing                                                                        | Why                                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Columns and tables the newer version added                                   | The migration is additive and one-way. They stay, and are harmless |
| Configuration the new version wrote into new tables                          | The old version does not read them; restoring a dump deletes them  |
| Alert events and notification records since the dump                         | Restoring a dump throws them away                                  |
| Embedded TSDB samples deleted by a lowered `RetentionDuration` or `MaxBytes` | Deletion happens at once and is not reversible                     |
| Metrics not written during the window                                        | Nothing replays them                                               |

The size of every row in that table is the length of the window, which is the argument for deciding quickly rather than deciding well.

## Related[​](#related "Direct link to Related")

* [Rollback](https://n9e.github.io/docs/install/rollback.md) — the commands, and the no-reverse-migration constraint
* [Upgrade and database migration](https://n9e.github.io/docs/operations/upgrade.md) — the ordering that avoids needing this page
* [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md) — the restore procedure
* [Disaster recovery](https://n9e.github.io/docs/operations/disaster-recovery.md) — when the environment itself is gone
