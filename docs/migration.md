* [](https://n9e.github.io/index.md)
* Migration and comparison

# Migration and comparison

Coming from another alerting stack, or from Nightingale v8: what maps to what, and how to run both during the switch.

## [v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md)

[v8 to v9 is a binary swap with the schema migrated on startup, but several new config sections must be added by hand or the new features stay silently off.](https://n9e.github.io/docs/migration/v8-to-v9.md)

## [From Prometheus + Alertmanager](https://n9e.github.io/docs/migration/from-alertmanager.md)

[Keep Prometheus for storage and scraping; move rules, routes, silences and receivers into Nightingale objects.](https://n9e.github.io/docs/migration/from-alertmanager.md)

## [From Zabbix](https://n9e.github.io/docs/migration/from-zabbix.md)

[Moving from Zabbix is a rebuild: hosts map to targets, templates to integrations, triggers to rules; some concepts have no equivalent, and Zabbix never has to stop.](https://n9e.github.io/docs/migration/from-zabbix.md)

## [From Grafana Alerting](https://n9e.github.io/docs/migration/from-grafana-alerting.md)

[Keep Grafana dashboards; move alert rules and contact points, and what to do about unified alerting state.](https://n9e.github.io/docs/migration/from-grafana-alerting.md)

## [Coexistence and rollback plan](https://n9e.github.io/docs/migration/coexistence.md)

[Run both systems on the same data during the switch, compare what fires, and cut over channel by channel.](https://n9e.github.io/docs/migration/coexistence.md)

[Previous](https://n9e.github.io/docs/troubleshooting/performance.md)

[Why is Nightingale slow or backlogged?](https://n9e.github.io/docs/troubleshooting/performance.md)

[Next](https://n9e.github.io/docs/migration/v8-to-v9.md)

[v8 to v9](https://n9e.github.io/docs/migration/v8-to-v9.md)

© 2026 Nightingale Contributors · Apache-2.0 License

[English](https://n9e.github.io/docs/migration.md)[简体中文](https://n9e.github.io/zh/docs/migration)
