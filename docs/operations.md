* [](https://n9e.github.io/index.md)
* Operations

# Operations

Keeping Nightingale itself healthy: topology, capacity, backups, upgrades, and knowing when it is the one that is broken.

## [Production topology](https://n9e.github.io/docs/operations/topology.md)

[Reference layouts for one team, one company, and multi-site with edge alerting.](https://n9e.github.io/docs/operations/topology.md)

## [Capacity planning](https://n9e.github.io/docs/operations/capacity.md)

[Load is driven by rule count, series count, event volume and database traffic; measure four numbers to know where to scale — there is deliberately no sizing table.](https://n9e.github.io/docs/operations/capacity.md)

## [High availability and failure domains](https://n9e.github.io/docs/operations/high-availability.md)

[Which failures a multi-instance deployment survives, which it does not, and how to test it.](https://n9e.github.io/docs/operations/high-availability.md)

## [Embedded TSDB single-Center limits](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md)

[The embedded store lives inside one Center process: what that rules out and when to move off it.](https://n9e.github.io/docs/operations/embedded-tsdb-limits.md)

## [Pushgw queue, writers and dual write](https://n9e.github.io/docs/operations/pushgw.md)

[The write path: queue sizing, backpressure, multiple writers and forwarding to two backends.](https://n9e.github.io/docs/operations/pushgw.md)

## [Backup and restore](https://n9e.github.io/docs/operations/backup-restore.md)

[Only the metadata database and the etc/ directory are irreplaceable: back both up on a schedule and rehearse the restore; embedded TSDB metrics can be re-collected.](https://n9e.github.io/docs/operations/backup-restore.md)

## [Upgrade and database migration](https://n9e.github.io/docs/operations/upgrade.md)

[How schema migrations run on startup, and how to upgrade a multi-instance deployment in order.](https://n9e.github.io/docs/operations/upgrade.md)

## [Rollback and recovery](https://n9e.github.io/docs/operations/rollback.md)

[Undo an upgrade or a bad config push, and recover from a corrupted metadata database.](https://n9e.github.io/docs/operations/rollback.md)

## [Monitor Nightingale itself](https://n9e.github.io/docs/operations/self-monitoring.md)

[Rules that page you when the alerting system is the thing that is down.](https://n9e.github.io/docs/operations/self-monitoring.md)

## [Built-in metrics and health checks](https://n9e.github.io/docs/operations/health.md)

[The /metrics and health endpoints each process exposes, and the handful worth graphing.](https://n9e.github.io/docs/operations/health.md)

## [Logs and diagnostic bundles](https://n9e.github.io/docs/operations/diagnostics.md)

[Four sources when Nightingale itself misbehaves: the process log, evaluation records, /metrics and pprof — collect all four before opening an issue.](https://n9e.github.io/docs/operations/diagnostics.md)

## [Edge network partition behavior](https://n9e.github.io/docs/operations/edge-partition.md)

[What n9e-edge does when it loses the center: evaluation continues, notifications go local, and what syncs back later.](https://n9e.github.io/docs/operations/edge-partition.md)

## [Disaster recovery](https://n9e.github.io/docs/operations/disaster-recovery.md)

[Rebuild from backups in a new environment, and the order in which to bring components back.](https://n9e.github.io/docs/operations/disaster-recovery.md)

[Previous](https://n9e.github.io/docs/security/checklist.md)

[Security checklist](https://n9e.github.io/docs/security/checklist.md)

[Next](https://n9e.github.io/docs/operations/topology.md)

[Production topology](https://n9e.github.io/docs/operations/topology.md)

© 2026 Nightingale Contributors · Apache-2.0 License

[English](https://n9e.github.io/docs/operations.md)[简体中文](https://n9e.github.io/zh/docs/operations)
