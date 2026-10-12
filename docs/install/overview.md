# Installation and deployment

The ways to run Nightingale — Compose, Docker image, binaries, Helm, n9e-edge — and which fits which situation.

| Method         | When to use it                                                          |
| -------------- | ----------------------------------------------------------------------- |
| Docker Compose | Evaluation and small production setups — brings up its own dependencies |
| Docker image   | You already run MySQL and a time-series store                           |
| Binary         | Linux amd64 / arm64 tarballs with checksums on every GitHub release     |
| Helm           | Kubernetes                                                              |
| `n9e-edge`     | Edge data centers whose link to the center is unreliable                |

See the [download page](https://n9e.github.io/download.md) for the exact commands per method.

## [Docker Compose](https://n9e.github.io/docs/install/docker-compose.md)

[Bring up Nightingale with its database and time-series store in one command; what the bundle contains and how to change it.](https://n9e.github.io/docs/install/docker-compose.md)

## [Binary packages](https://n9e.github.io/docs/install/binary.md)

[Download the Linux amd64 / arm64 tarball from GitHub releases, verify the checksum, point it at your MySQL and Redis, and run n9e under systemd.](https://n9e.github.io/docs/install/binary.md)

## [Helm / Kubernetes](https://n9e.github.io/docs/install/helm.md)

[A community-maintained Helm chart deploys Nightingale on Kubernetes with MySQL, Redis, Prometheus and Categraf; values can point it at databases outside the cluster.](https://n9e.github.io/docs/install/helm.md)

## [MySQL / PostgreSQL / SQLite and Redis](https://n9e.github.io/docs/install/databases.md)

[The metadata store is MySQL, PostgreSQL or SQLite (testing only); the process creates the schema on first start, and Redis holds runtime state such as heartbeats.](https://n9e.github.io/docs/install/databases.md)

## [Embedded TSDB for onboarding and small scale](https://n9e.github.io/docs/install/embedded-tsdb.md)

[Use the built-in store to get going with zero extra components; retention, capacity and the single-Center constraint.](https://n9e.github.io/docs/install/embedded-tsdb.md)

## [External TSDB and dual-write migration](https://n9e.github.io/docs/install/external-tsdb.md)

[Move from the embedded store to Prometheus or VictoriaMetrics without a gap, using Pushgw dual write.](https://n9e.github.io/docs/install/external-tsdb.md)

## [Configuration layout](https://n9e.github.io/docs/install/configuration.md)

[Configuration is a directory: config.toml is read by n9e, alert and pushgw, etc/edge by n9e-edge; environment variables fill in blanks but never override set keys.](https://n9e.github.io/docs/install/configuration.md)

## [High availability](https://n9e.github.io/docs/install/high-availability.md)

[Run multiple Center and Alert instances behind a load balancer, and what still needs to be a singleton.](https://n9e.github.io/docs/install/high-availability.md)

## [Offline deployment](https://n9e.github.io/docs/install/offline.md)

[Install on hosts without internet access: packages, images and integration templates to fetch in advance.](https://n9e.github.io/docs/install/offline.md)

## [Edge data centers](https://n9e.github.io/docs/install/edge.md)

[A local alerting engine for sites whose link to the center is unreliable, and the one flag that silently breaks it.](https://n9e.github.io/docs/install/edge.md)

## [Upgrade](https://n9e.github.io/docs/install/upgrade.md)

[Upgrade between minor versions and across v8 → v9: back up first, read the database changes, roll the binaries.](https://n9e.github.io/docs/install/upgrade.md)

## [Rollback](https://n9e.github.io/docs/install/rollback.md)

[Return to the previous version after a failed upgrade, including what to do about schema migrations that already ran.](https://n9e.github.io/docs/install/rollback.md)

## [Uninstall and data retention](https://n9e.github.io/docs/install/uninstall.md)

[Remove Nightingale cleanly, and what to keep or export before you do.](https://n9e.github.io/docs/install/uninstall.md)
