# Docker Compose

Bring up Nightingale with its database and time-series store in one command; what the bundle contains and how to change it.

Last reviewed 2026-10-10

The repository ships four ready-made bundles under `docker/`. One `docker compose up -d` gives you Nightingale plus a database, a time-series store and a collector, with nothing to prepare first.

## Four bundles, pick one[​](#four-bundles-pick-one "Direct link to Four bundles, pick one")

```
git clone https://github.com/ccfos/nightingale.git

cd nightingale/docker
```

| Directory                         | Metadata database | Time-series store                             | Networking                          |
| --------------------------------- | ----------------- | --------------------------------------------- | ----------------------------------- |
| `compose-bridge`                  | MySQL 8           | VictoriaMetrics                               | bridge, ports published to the host |
| `compose-postgres`                | PostgreSQL 12     | VictoriaMetrics                               | bridge                              |
| `compose-host-network`            | MySQL 8           | Prometheus                                    | `network_mode: host`                |
| `compose-host-network-metric-log` | MySQL 8           | Prometheus + Kafka / Elasticsearch / Logstash | `network_mode: host`                |

The two host-network bundles are Linux only

`network_mode: host` is a Linux capability. On Docker Desktop (macOS / Windows) containers do not really share the host network stack, and these two will not come up. Use `compose-bridge` to evaluate on a Mac.

When in doubt, use `compose-bridge`.

## Bring it up[​](#bring-it-up "Direct link to Bring it up")

```
cd compose-bridge

docker compose up -d
```

**Expected result**: `docker compose ps` shows five containers running, and `http://localhost:17000` accepts `root` / `root.2020`.

The `nightingale` container carries `WAIT_HOSTS: mysql:3306, redis:6379`, so the process waits for those ports before starting and you do not have to care about container ordering.

## What the bundle contains[​](#what-the-bundle-contains "Direct link to What the bundle contains")

`compose-bridge` runs five containers and publishes four ports:

| Container         | Ports         | What it does                                                         |
| ----------------- | ------------- | -------------------------------------------------------------------- |
| `mysql`           | 3306          | Metadata database; `docker/initsql/` creates `n9e_v6` on first start |
| `redis`           | 6379          | Sessions and heartbeat caches                                        |
| `victoriametrics` | 8428          | Time-series store                                                    |
| `nightingale`     | 17000 / 20090 | Web, API and write endpoints / ibex RPC for self-healing             |
| `categraf`        | —             | Collects host metrics and writes back to `nightingale:17000`         |

3306 and 6379 are published straight to the host, so they **collide with a MySQL or Redis you already run there**. Change `ports`, or stop the local service.

## Changing the configuration[​](#changing-the-configuration "Direct link to Changing the configuration")

Nightingale's config directory is mounted in, not baked into the image:

```
volumes:

  - ./etc-nightingale:/app/etc
```

Edit `compose-bridge/etc-nightingale/config.toml`, then `docker compose restart nightingale`. This file differs from the binary package's default in a few places, all of them to fit container networking:

```
[DB]

DBType = "mysql"

DSN="root:1234@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&collation=utf8mb4_general_ci&parseTime=True&loc=Local&allowNativePasswords=true"



[Redis]

RedisType = "standalone"

Address = "redis:6379"



[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"
```

Note there is **no `[EmbeddedTSDB]` section**: the bundle already has a real time-series store, so metrics go straight to VictoriaMetrics. The addresses are compose service names — replace them with real hostnames when you point outside the bundle.

The `root:1234` database credentials sit in both the compose file and the config file. Change them before this becomes production.

## Switching to PostgreSQL[​](#switching-to-postgresql "Direct link to Switching to PostgreSQL")

`compose-postgres` is the same bundle with a different metadata database:

```
[DB]

DBType = "postgres"

DSN="host=postgres port=5432 user=root dbname=n9e_v6 password=1234 sslmode=disable"
```

It publishes 5432 instead of 3306. For the trade-off between the two, see [Choosing a metadata database](https://n9e.github.io/docs/install/databases.md).

## Using your own database and TSDB[​](#using-your-own-database-and-tsdb "Direct link to Using your own database and TSDB")

The MySQL, Redis and VictoriaMetrics services exist so that one command produces a working system. If you already run them, delete those services from `docker-compose.yaml` and put the real addresses into `etc-nightingale/config.toml` — the `nightingale` container does not care whether its dependencies are part of the bundle.

Update `WAIT_HOSTS` at the same time, or the process waits forever on a service name that no longer resolves.

## Next[​](#next "Direct link to Next")

* [Choosing a metadata database](https://n9e.github.io/docs/install/databases.md)
* [External TSDB and dual-write migration](https://n9e.github.io/docs/install/external-tsdb.md)
* [Production readiness checklist](https://n9e.github.io/docs/get-started/production-checklist.md)
