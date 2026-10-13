# Upgrade

Upgrade between minor versions and across v8 → v9: back up first, read the database changes, roll the binaries.

Last reviewed 2026-10-10

Upgrading Nightingale means **replacing the binary and restarting**: the schema is brought up to date by the process itself at startup, and there is no separate migration command. The work is at the two ends — backing up before, and confirming afterwards that the upgrade actually happened.

## Before you start[​](#before-you-start "Direct link to Before you start")

Keep a copy of four things:

```
mysqldump -u root -p n9e_v6 > n9e_v6.$(date +%F).sql

cp -a /opt/n9e/etc /opt/n9e/etc.bak

cp -a /opt/n9e/n9e /opt/n9e/n9e.$(./n9e -version)

mv /opt/n9e/integrations /opt/n9e/integrations.bak
```

The database is the only one you cannot recreate; the other three just save time. `./n9e -version` prints the running version — putting it in the backup filename means not guessing during a rollback.

Then read the release notes for the target version. Across a major version, start with [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md), which lists the config sections you have to add by hand.

## A minor version upgrade[​](#a-minor-version-upgrade "Direct link to A minor version upgrade")

Single instance:

```
systemctl stop n9e

tar zxf n9e-v<new-version>-linux-amd64.tar.gz -C /opt/n9e

diff -u /opt/n9e/etc.bak/config.toml /opt/n9e/etc/config.toml

systemctl start n9e
```

Three things to watch:

* **replace `integrations/` wholesale, do not merge.** It holds the dashboards and rule templates shipped with the version, and mixing old files in produces templates that no longer match;
* **`diff` the config, do not overwrite it.** A new version may add sections, and the ones missing from your old file stay silently off;
* **hard-refresh the browser**, or it keeps serving cached js.

## Rolling a cluster[​](#rolling-a-cluster "Direct link to Rolling a cluster")

With several instances, take them one at a time rather than restarting together:

1. stop the first instance. Its rules are picked up by another within 30 seconds;
2. replace the binary, diff the config, start it;
3. check **System → Alerting engines** until it reappears with a live heartbeat;
4. **wait a little longer** — a freshly started instance delays evaluation (30 seconds by default) while configuration syncs from the database into memory;
5. only then move to the next host.

Alerting never stops during this, because at every moment at least one instance is evaluating rules. Restarting them all at once buys you a window where nobody is.

If you run `n9e-edge`, upgrade the edge processes in the same pass — not the centre alone.

## Verifying afterwards[​](#verifying-afterwards "Direct link to Verifying afterwards")

Three checks, in order:

```
curl -s http://127.0.0.1:17000/api/n9e/version

grep -i "failed to migrate table" /opt/n9e/logs/*.log
```

**Expected result**: the version is the new one, and there are no migration failures in the log.

Then open **System → About**; the version there should match the command line:

![The About page](https://n9e.github.io/img/docs/operations/about.webp)![The About page](https://n9e.github.io/img/docs/operations/about.dark.webp)

Finally check that nothing broke: open a dashboard and confirm charts render, and look at the events page to confirm new events are still being produced. Indexes on the large tables (`alert_his_event`, `notification_record`) are built **asynchronously after startup** and can take tens of minutes on a big database. The service is usable throughout — do not restart just because you see index-building in the log.

## Next[​](#next "Direct link to Next")

* [Rollback](https://n9e.github.io/docs/install/rollback.md) — when the upgrade does not go well
* [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md) — the cross-major breaking points
* [Upgrade and database migration](https://n9e.github.io/docs/operations/upgrade.md) — how schema migration works
