---
title: "Uninstall and data retention"
sidebar_label: "Uninstall and data retention"
description: "Remove Nightingale cleanly, and what to keep or export before you do."
---

Nightingale has no installer, so it has no uninstaller either: stop the processes, delete the
directory, drop the database. What actually needs thought is **what you still want before you
delete it** — particularly the parts that stay useful somewhere else.

## Export before you uninstall

Judge each by "is this still worth something on another system?":

| Item | How to keep it | Useful elsewhere? |
|---|---|---|
| Alert rules | **Alert rules → More → Export rules JSON** | Yes — rules are the asset you spent the most time on |
| Dashboards | Export JSON from the dashboards page | Yes |
| The whole metadata database | `mysqldump n9e_v6` | Only to Nightingale, but **it is the only undo** |
| The `etc/` directory | Copy it | Yes — saves redoing the tuning on a reinstall |
| Metrics in the embedded TSDB | Only by migrating them out first, see below | Depends on whether you need the history |

Dump the whole database onto another machine before touching anything. If you realise afterwards
that you forgot to export something, that dump is how you get it back.

**There is no export for the embedded TSDB.** To keep that metric history, configure dual write
before uninstalling so the data also lands in an external store, then wait until it covers what you
need — see [External TSDB and dual-write migration](./external-tsdb.md).

## Stop the processes

```bash
systemctl stop n9e
systemctl disable n9e
rm /etc/systemd/system/n9e.service
systemctl daemon-reload
```

In a cluster, do this on every host. If you run `n9e-edge`, stop the edge processes too.

Under Docker Compose:

```bash
docker compose down          # keeps the volumes
docker compose down -v       # deletes the volumes as well
```

## Remove what is on disk

Everything produced at runtime lives under the directory you extracted into, so deleting that
directory is the whole cleanup:

| Path | What it is | What deleting it costs |
|---|---|---|
| `n9e`, `n9e-edge`, `n9e-cli` | The binaries | — |
| `etc/` | Configuration | Reconfiguring on reinstall |
| `integrations/` | Integration templates, shipped with the version | Nothing; a reinstall brings them back |
| `data/tsdb/` | Embedded TSDB data | The metric history, permanently |
| `logs/` | Logs, including `logs/evallog` evaluation records | Some troubleshooting history |
| `skill/` | AI skill working directory | Nothing; regenerated at startup |
| `n9e.db`, `n9e.db-wal`, `n9e.db-shm` | The metadata database when using SQLite | **Every configuration and all history** |

```bash
rm -rf /opt/n9e
```

Nightingale writes nothing under `/etc` or `/var/lib` and creates no system user, so apart from the
systemd unit you added yourself, nothing is left behind on the host.

## The database and Redis

With an external MySQL / PostgreSQL and Redis, stopping the process cleans up neither:

```sql
DROP DATABASE n9e_v6;
```

Nightingale's Redis keys are prefixed, so you can delete just its own (JWT keys sit under
`[HTTP.JWTAuth] RedisKeyPrefix`, `/jwt/` by default). If that Redis serves Nightingale alone,
`FLUSHDB` is simpler — **confirm nothing else shares it** first.

## The collectors

Hosts running Categraf need their own cleanup, or they keep pushing to an address that no longer
exists and fill their own logs with connection failures:

```bash
cd /opt/categraf && ./categraf --stop && ./categraf --remove
rm -rf /opt/categraf
```

`--remove` unregisters the systemd service Categraf registered for itself, so there is no unit file
to delete by hand.

If you are only moving Nightingale, there is no need to uninstall anything — change the write URL in
the Categraf config.

## Next

- [External TSDB and dual-write migration](./external-tsdb.md) — start here to keep the metric history
- [Backup and restore](../operations/backup-restore.md) — how to take that final dump
- [Binary packages](./binary.md) — putting it back
