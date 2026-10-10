---
title: "Production readiness checklist"
sidebar_label: "Production readiness checklist"
description: "What to change before real traffic: default credentials, external database, TSDB choice, HA, backups and self-monitoring."
---

Getting a single instance running is easy, but those defaults are **not for production**. This is
the list to walk before you go live.

## Must do

### Change the default password

A fresh install has `root` / `root.2020`, and **that is public knowledge**. Change it on first
login, or create a new admin account and disable root.

The same goes for the sample credentials under `[HTTP.APIForService.BasicAuth]` in
`etc/config.toml` (`user001` / `ccc26da7b9aba533cbb263a36c07dcc5`) — public, so replace them if you
turn that API on.

### Replace SQLite and the in-process Redis

The defaults are a SQLite file and miniredis, an in-process stand-in. They exist so a single
process can run with nothing else installed: there is no second copy of the data if the process
dies, and no way for several instances to share state.

```toml
[DB]
DBType = "mysql"
DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"

[Redis]
RedisType = "standalone"
Address = "redis:6379"
```

PostgreSQL works too, with `DBType = "postgres"`.

### Decide on the time-series database

The embedded TSDB is on by default and keeps data on the local disk of **one Center process**.
Two consequences:

- with several replicas each holds a fragment, so **high availability means turning it off**;
- it does not carry large volumes (roughly past 100k active series).

Production usually means an external store:

```toml
[EmbeddedTSDB]
Enable = false

[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"
```

Both can be on at once as a dual write while you migrate, then turn the embedded one off once the
new store has enough history.

## Strongly recommended

### Run more than one instance

Run `n9e` on several hosts with identical config, sharing one MySQL and one Redis. Alert rules are
distributed across instances automatically — a rule runs on exactly one instance, so no duplicate
alerts — and another instance takes over the rules of one that dies.

### Back up

The metadata database is the thing that matters: users, business groups, alert rules, dashboards
and notification config all live there. Keep `etc/` in version control too. Whether to back up the
embedded TSDB depends on whether you still depend on it.

Rehearse the restore. A backup nobody has restored is not a backup.

### Monitor Nightingale itself

An alerting system that is down will not alert you about being down. Every process exposes its own
metrics on `/metrics`; point Nightingale at itself and watch at least process liveness, whether
rule evaluation is still running on schedule, and notification delivery failures.

See [Monitor Nightingale itself](../operations/self-monitoring.md).

### Decide whether anonymous access stays on

Both switches under `[Center.AnonymousAccess]` **default to `true`**:

```toml
[Center.AnonymousAccess]
PromQuerier = true
AlertDetail = true
```

While they are on, **the query and proxy endpoints need no login**. Measured on a default install:
an unauthenticated `GET /api/n9e/datasource/brief` returns every data source's name, type and
connection address (passwords are redacted), and
`GET /api/n9e/proxy/<datasource id>/api/v1/query?query=<PromQL>` returns query results.

The default exists so anonymous dashboard share links work. Turn it off if you do not need them —
and if you do need them, **this port must not face the internet directly**.

### Close down the network

The write endpoints (`/prometheus/v1/write`, `/v1/n9e/heartbeat`) and the admin UI should not face
the internet directly. Put them behind a gateway with TLS if outside access is needed. See
[Network and TLS hardening](../security/network-tls.md).

### Get credentials out of the config file

Database passwords, channel tokens and LLM API keys do not belong hard-coded in `config.toml`.
See [Secret management](../security/secrets.md).

## After you are live

- **Actually verify the notification chain once**, rule to phone. Do not discover a misconfigured
  channel during a real incident;
- add at least one "collector went quiet" rule, or you will not notice when data stops arriving;
- walk the upgrade and rollback procedures before you need them:
  [Upgrade](../install/upgrade.md), [Rollback](../install/rollback.md).
