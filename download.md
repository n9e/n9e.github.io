DOWNLOAD

# Up in five minutes,<br /><!-- -->or deployed the way production needs.

Every package here is built from a tagged release and published on GitHub. Say what you are trying to do and the page shows only the commands for that path.

**v9.2.0**released<!-- --> <!-- -->2026-10-11[Release notes<!-- --> →](https://github.com/ccfos/nightingale/releases/tag/v9.2.0)

## What do you want to do?

Try itRecommendedDocker Compose brings up n9e, its database and a collector together.Deploy to productionBinaries, a Docker image or the Helm chart, against your own database and Redis.Edge data centersRun n9e-edge locally where the link to the center is unreliable.Offline hostsWhat to fetch in advance for machines without internet access.

### Try it

Five containers: n9e, MySQL, Redis, VictoriaMetrics, and Categraf collecting the host it runs on.

`git clone https://github.com/ccfos/nightingale.gitcd nightingale/docker/compose-bridgedocker compose up -d`Copy

### Once it is up

1. docker compose ps shows five containers running
2. Open http\://localhost:17000 and sign in as root / root.2020
3. The host it runs on is already listed under Targets, reported by the bundled Categraf

[Docker Compose guide<!-- --> →](https://n9e.github.io/docs/install/docker-compose.md)

### Other bundles in the same directory

* `compose-postgres`PostgreSQL 12 instead of MySQL
* `compose-host-network`Prometheus as the store, host networking, Linux only
* `compose-host-network-metric-log`Adds Kafka, Elasticsearch and Logstash for logs, Linux only

## Categraf, the collector

**v0.5.18**released<!-- --> <!-- -->2026-08-31[Release notes<!-- --> →](https://github.com/flashcatcloud/categraf/releases/tag/v0.5.18)

One agent per host for operating systems, middleware, databases and Kubernetes, writing over Prometheus Remote Write. Install it wherever Nightingale should see data.

| Platform                      | Size  | SHA256              |                                                                                                                     |
| ----------------------------- | ----- | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Linux<!-- --> <!-- -->amd64   | 55 MB | `d8e1a69d4262a4c9…` | [Download](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-linux-amd64.tar.gz) |
| Linux<!-- --> <!-- -->arm64   | 49 MB | `5d98d263348ec5b0…` | [Download](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-linux-arm64.tar.gz) |
| Windows<!-- --> <!-- -->amd64 | 56 MB | `a45e3625340b9a7d…` | [Download](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-windows-amd64.zip)  |
| Windows<!-- --> <!-- -->arm64 | 49 MB | `ea2850040a10adbd…` | [Download](https://github.com/flashcatcloud/categraf/releases/download/v0.5.18/categraf-v0.5.18-windows-arm64.zip)  |

A slim build with metrics collection only, and one with the NVIDIA DCGM plugin, are on the release page.<!-- --> [All Categraf builds<!-- --> →](https://github.com/flashcatcloud/categraf/releases/latest)

Point config.toml at your Nightingale address and the host appears under Targets within a minute.

[About Categraf<!-- --> →](https://n9e.github.io/categraf.md)[Categraf docs<!-- --> →](https://n9e.github.io/docs/data/categraf.md)

## Upgrading and rolling back

Minor versions roll the binary. Across v8 to v9, back up the database first and read the schema changes in the release notes; the migration runs on first start.

[Upgrade guide<!-- --> →](https://n9e.github.io/docs/install/upgrade.md)[Rollback<!-- --> →](https://n9e.github.io/docs/install/rollback.md)[v8 to v9<!-- --> →](https://n9e.github.io/docs/migration/v8-to-v9.md)

## Stuck?

The community answers on Slack and GitHub Issues.

[Slack #n9e<!-- --> →](https://join.slack.com/t/n9e/shared_invite/zt-480klxytf-P9qm3C1M87kDmRPp_H30Kw)[GitHub Issues<!-- --> →](https://github.com/ccfos/nightingale/issues)

[All releases on GitHub<!-- --> →](https://github.com/ccfos/nightingale/releases)
