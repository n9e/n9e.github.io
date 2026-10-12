* [](https://n9e.github.io/index.md)
* [Collect and connect data](https://n9e.github.io/docs/data/overview.md)
* Categraf

# Categraf

The recommended collector: one agent, 100+ input plugins, pushing over Prometheus Remote Write.

## [Install and register](https://n9e.github.io/docs/data/categraf/install.md)

[Install the agent, set the Nightingale write URL, and confirm the host shows up under Targets.](https://n9e.github.io/docs/data/categraf/install.md)

## [Input plugins](https://n9e.github.io/docs/data/categraf/plugins.md)

[Categraf ships over ninety input plugins; a config file in conf/input.\<name> enables one, and a single plugin can run alone in the foreground for testing.](https://n9e.github.io/docs/data/categraf/plugins.md)

## [Remote write](https://n9e.github.io/docs/data/categraf/remote-write.md)

[Categraf batches metrics and ships them over Prometheus Remote Write; several writers can feed Nightingale and a second backend at once; failed writes are not retried.](https://n9e.github.io/docs/data/categraf/remote-write.md)

## [Targets and heartbeat](https://n9e.github.io/docs/data/categraf/targets.md)

[Categraf sends a heartbeat with host metadata every ten seconds; the target list shows status and tags from it, and hosts are assigned to business groups by hand.](https://n9e.github.io/docs/data/categraf/targets.md)

## [Troubleshooting](https://n9e.github.io/docs/data/categraf/troubleshooting.md)

[Categraf problems come in three symptoms — host missing, host present but no metrics, one plugin silent — and the log has the answer, even for errors not marked E!.](https://n9e.github.io/docs/data/categraf/troubleshooting.md)

[Previous](https://n9e.github.io/docs/data/sql-databases.md)

[MySQL / PostgreSQL / TDengine](https://n9e.github.io/docs/data/sql-databases.md)

[Next](https://n9e.github.io/docs/data/categraf/install.md)

[Install and register](https://n9e.github.io/docs/data/categraf/install.md)

© 2026 Nightingale Contributors · Apache-2.0 License

[English](https://n9e.github.io/docs/data/categraf.md)[简体中文](https://n9e.github.io/zh/docs/data/categraf)
