# Disaster recovery

Rebuild from backups in a new environment, and the order in which to bring components back.

[Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md) puts a database back where it came from. This page covers the harder case: **the environment is gone and you are rebuilding on different machines.** Almost everything about the procedure is the same; what is different is that the addresses changed, and several things inside Nightingale were pinned to the old ones.

## What you have to have brought with you[​](#what-you-have-to-have-brought-with-you "Direct link to What you have to have brought with you")

| Input                                      | Without it                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| A dump of the metadata database            | There is nothing to recover. Users, business groups, rules, dashboards and notification config all live there |
| The `etc/` directory                       | Every setting has to be worked out again from scratch                                                         |
| The binary of the version you were running | A newer one migrates the schema forward the moment it starts, which is a second change on top of a recovery   |
| `integrations/` from that same version     | Built-in dashboard and rule templates, and any you added                                                      |

The first two are the ones that matter. If `etc/` is in version control and the dump is offsite, you can rebuild; if either is only on the machines that are gone, you cannot.

## Bring it back in this order[​](#bring-it-back-in-this-order "Direct link to Bring it back in this order")

1. **The metadata database.** Restore the dump into a fresh, empty database. Nothing else can start before this: a process that cannot reach its database exits.
2. **Redis, empty.** Do not restore it — sessions, heartbeat timestamps and host metadata all expire on their own. [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md) explains what that costs.
3. **One `n9e` instance.** Restore `etc/`, then edit `[DB] DSN` and `[Redis] Address` to the new addresses. Start it alone.
4. **Verify before adding anything.** `curl --noproxy '*' http://n9e:17000/ping` returns `pong`; `grep -i "failed to migrate table" logs/*.log` is empty; you can log in and the rules, dashboards and notification config are all there.
5. **Fix the addresses** — the next section. Do this before the collectors come back, so that data lands where the dashboards look for it.
6. **The remaining `n9e` instances.** Check that they all appear under **System → Alerting engines**.
7. **The collectors, then the edge sites.** Last, deliberately: see the warning below.

**Mute first, then start the collectors.** The moment metrics resume, every rule that was unsatisfiable during the outage becomes satisfiable again and fires at once. Create a muting rule with a time range covering the recovery window before step 7, and let it expire on its own. Muting rules are a tab on **Alerts & Notifications → Alert rules**.

## Addresses change, and several things follow the address[​](#addresses-change-and-several-things-follow-the-address "Direct link to Addresses change, and several things follow the address")

This is the part that separates a rebuild from a restore. Each of these was recorded when the old environment was running and comes back from the dump pointing at machines that no longer exist:

| What                                            | Where it points                                          | What to do                                                                                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data source URLs                                | The `datasource` table                                   | Edit each one under **Integrations → Data sources**. Nothing rewrites them                                                                                                               |
| A data source's alerting engine cluster         | `cluster_name` on the data source                        | It must match `[Alert.Heartbeat] EngineName` on the instances, or **no engine will serve that data source and its rules never run**. Keep the old `EngineName`, or fix every data source |
| The site URL used in notification links         | `site_info` in the `configs` table                       | Set it under **System → Site**. The process fills it in only when it is empty, so a restored value is kept as-is and every notification keeps linking to the old host                    |
| The auto-registered `embedded-tsdb` data source | Rewritten at each startup to this instance's own address | Nothing to do, unless you pinned `[EmbeddedTSDB] DatasourceUrl` to a VIP that no longer exists                                                                                           |
| Old instances on the alerting engines page      | The `alerting_engines` table                             | Nothing. Rows with no heartbeat for 600 seconds are deleted, so the ghosts clear within about ten minutes                                                                                |
| Collector write URLs                            | Each collector's own config                              | Repoint them, or move the DNS name. This is the argument for putting a name in front of Nightingale before you need one                                                                  |

Notification media types and the addresses they call are usually external and survive the move untouched — but if anything pointed back at Nightingale itself, it is on the list above.

## What does not come back[​](#what-does-not-come-back "Direct link to What does not come back")

* **Embedded TSDB samples**, unless you deliberately backed the directory up. There is no online snapshot; see [Embedded TSDB single-Center limits](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md).
* **Everything written after the dump** — rules edited since, alert events, notification records.
* **Metrics from the outage itself.** Nothing replays them; expect a gap in every chart.
* **Redis contents.** Everyone logs in again, and host heartbeat times stay blank until the collectors next report.

## Setting a recovery objective you can actually meet[​](#setting-a-recovery-objective-you-can-actually-meet "Direct link to Setting a recovery objective you can actually meet")

Two numbers, and both come from things you control rather than things you hope for:

* **How much you can lose** is your backup interval. A nightly dump means up to 24 hours of rule and dashboard edits. Nothing about Nightingale changes that number — the dump schedule does.
* **How long it takes** is whatever your last rehearsal took. Not an estimate.

Which makes the rehearsal the whole exercise. [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md) asks for a quarterly restore; make **one of those a rebuild** — restore into a machine with a different hostname and address, and work down the table above. Every entry in it is something that only shows up when the address changes, so a same-address restore rehearsal will never find them.

Time it, write the number down, and keep the runbook somewhere that is not the environment it describes.

## Related[​](#related "Direct link to Related")

* [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md) — what to back up, and the restore procedure
* [Rollback and recovery](https://n9e.github.io/docs/operations/rollback.md) — smaller undos
* [Production topology](https://n9e.github.io/docs/operations/topology.md) — the shape you are rebuilding
* [Production readiness checklist](https://n9e.github.io/docs/get-started/production-checklist.md)
