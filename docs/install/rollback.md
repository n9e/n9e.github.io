# Rollback

Return to the previous version after a failed upgrade, including what to do about schema migrations that already ran.

Rolling the binary back is easy. The database is the hard part: the new version altered the schema the moment it started, and **there is no reverse migration**. This page is about getting back to a working system under that constraint.

## One thing to be clear about first[​](#one-thing-to-be-clear-about-first "Direct link to One thing to be clear about first")

The AutoMigrate that `n9e` runs at every startup is additive only: it creates missing tables, columns and indexes, and **never drops anything or records what the schema looked like before**. So:

* after you put the old binary back, the database holds tables and columns the old version does not know about. It reads the fields it expects and ignores the rest, so it **usually starts fine**;
* "usually" is not a guarantee. A column whose meaning changed, or one that gained a NOT NULL constraint, can make the old version fail on write;
* data the new version wrote into new tables — the configuration of new features, say — is invisible to the old version and is not migrated back.

Which makes the `mysqldump` you took before upgrading **the only reliable way back**. That is why [Upgrade](https://n9e.github.io/docs/install/upgrade.md) asks for it first.

## Rolling back the binary only[​](#rolling-back-the-binary-only "Direct link to Rolling back the binary only")

For a small change, running for a short time, with none of the new features configured, try this first — it is fastest and loses no data:

```
systemctl stop n9e

cp /opt/n9e/n9e.<old-version> /opt/n9e/n9e

rm -rf /opt/n9e/integrations && mv /opt/n9e/integrations.bak /opt/n9e/integrations

cp -a /opt/n9e/etc.bak/config.toml /opt/n9e/etc/config.toml

systemctl start n9e
```

Put the config file back too. Sections the old version does not recognise are ignored, but any value you adjusted during the upgrade may have been written with the new semantics in mind.

**Expected result**: `/api/n9e/version` reports the old version, there are no database errors in the log, and the UI logs in with dashboards and alert rules intact.

Database errors such as `Unknown column` or `Error 1364` (field has no default value) mean this route does not work; take the next one.

## Restoring the database from backup[​](#restoring-the-database-from-backup "Direct link to Restoring the database from backup")

When the binary rollback is not clean, or the new version already wrote data you do not want to keep, take the database back as well:

```
systemctl stop n9e                     # on every instance in the cluster

mysql -u root -p -e "DROP DATABASE n9e_v6; CREATE DATABASE n9e_v6 DEFAULT CHARACTER SET utf8mb4;"

mysql -u root -p n9e_v6 < n9e_v6.<date>.sql

cp /opt/n9e/n9e.<old-version> /opt/n9e/n9e

systemctl start n9e
```

The cost is blunt: **everything created after the backup is gone** — rules written since, alert events, notification records, dashboard edits. The shorter the upgrade window, the smaller that cost.

In a cluster, stop every instance before restoring, or a surviving one keeps writing and fights the data you are importing.

## The embedded TSDB and evaluation records[​](#the-embedded-tsdb-and-evaluation-records "Direct link to The embedded TSDB and evaluation records")

Neither lives in the database, so handle them on their own terms:

* **embedded TSDB** (`data/tsdb`) — the on-disk format is compatible across minor versions, so a rollback does not need to touch it. If the upgrade also lowered `RetentionDuration` or `MaxBytes`, the data those limits already deleted is not coming back;
* **evaluation records** (`logs/evallog`) — local files on each instance. Deleting them costs you some "what did this rule query" history and nothing else.

## `n9e-cli` is not a rollback tool[​](#n9e-cli-is-not-a-rollback-tool "Direct link to n9e-cli-is-not-a-rollback-tool")

The `n9e-cli` binary in the release has exactly one purpose: migrating v5 data into v6 (`n9e-cli -upgrade -config <the v5 webapi.conf>`). It does not downgrade anything, and it does not reverse any schema change.

## Next[​](#next "Direct link to Next")

* [Upgrade](https://n9e.github.io/docs/install/upgrade.md) — do the backup step properly and you never need this page
* [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md) — a routine backup policy
* [Rollback and recovery](https://n9e.github.io/docs/operations/rollback.md) — bad config pushes and corrupted databases
