# Binary packages

Download the Linux amd64 / arm64 tarball from GitHub releases, verify the checksum, point it at your MySQL and Redis, and run n9e under systemd.

By the end of this page you have an `n9e` process managed by systemd, talking to your own MySQL and Redis, listening on 17000.

## Download and verify[​](#download-and-verify "Direct link to Download and verify")

Releases carry two Linux builds, amd64 and arm64. There is no Windows or macOS package — Nightingale is a server-side program. (If you really need one, the `Makefile` in the repository shows how to build it.)

```
VERSION=9.1.1

curl -LO https://github.com/ccfos/nightingale/releases/download/v${VERSION}/n9e-v${VERSION}-linux-amd64.tar.gz

curl -LO https://github.com/ccfos/nightingale/releases/download/v${VERSION}/checksums.txt

sha256sum -c checksums.txt --ignore-missing
```

**Expected result**: `n9e-v9.1.1-linux-amd64.tar.gz: OK`.

The archive has **no top-level directory**, so create one before extracting or the files scatter into the current directory:

```
mkdir -p /opt/n9e && tar zxf n9e-v${VERSION}-linux-amd64.tar.gz -C /opt/n9e
```

## What is in the package[​](#what-is-in-the-package "Direct link to What is in the package")

| Path               | What it is                                                                   |
| ------------------ | ---------------------------------------------------------------------------- |
| `n9e`              | The Center process, the only binary you have to have                         |
| `n9e-edge`         | Local alerting engine for edge data centers                                  |
| `n9e-cli`          | One-shot v5 → v6 data migration tool; not an operations CLI                  |
| `etc/`             | Configuration directory, required by the process                             |
| `integrations/`    | Integration templates (dashboards, alert rules, collector configs), required |
| `agents/categraf/` | Bundled categraf packages, served by the "install collector" page            |
| `docker/`          | Compose bundles and schema SQL                                               |
| `n9e.sql`          | A copy of `docker/initsql/a-n9e.sql`, the MySQL bootstrap script             |

The `n9e` process only needs `etc/` and `integrations/` next to the binary; everything else can go.

`n9e-alert` and `n9e-pushgw` are **not** in the release. The `Makefile` has `build-alert` and `build-pushgw` targets, but they are not part of the release build — splitting those out means building from source.

## Get it running[​](#get-it-running "Direct link to Get it running")

```
cd /opt/n9e && ./n9e
```

The defaults need nothing else installed: SQLite for metadata, an in-process miniredis, and the embedded TSDB for metrics. Open `http://<server>:17000` and sign in as `root` / `root.2020`.

**Expected result**: the log says `http server listening on: 0.0.0.0:17000` and the login works.

Those defaults are **not for production**. Keep going to replace them, or walk the [Production readiness checklist](https://n9e.github.io/docs/get-started/production-checklist.md).

## Point it at an existing MySQL and Redis[​](#point-it-at-an-existing-mysql-and-redis "Direct link to Point it at an existing MySQL and Redis")

Create the database. You do not have to import a schema — `n9e` runs AutoMigrate on every start, so an empty database plus an account that may create and alter tables is enough:

```
CREATE DATABASE n9e_v6 DEFAULT CHARACTER SET utf8mb4;
```

The database is conventionally called `n9e_v6`; the name has been carried since v6 and the bundled schema scripts still use it.

Then edit `etc/config.toml`:

```
[DB]

DBType = "mysql"

DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"



[Redis]

RedisType = "standalone"

Address = "redis:6379"
```

**Expected result** after a restart: no `failed to migrate table` in the log, and the login is still `root` / `root.2020` — that row is written into the new database on first start. For the choice itself and the permissions involved, see [Choosing a metadata database](https://n9e.github.io/docs/install/databases.md).

## Run it under systemd[​](#run-it-under-systemd "Direct link to Run it under systemd")

```
[Unit]

Description=Nightingale

After=network-online.target

Wants=network-online.target



[Service]

Type=simple

User=n9e

WorkingDirectory=/opt/n9e

ExecStart=/opt/n9e/n9e

Restart=always

RestartSec=5

LimitNOFILE=65536



[Install]

WantedBy=multi-user.target
```

Save it as `/etc/systemd/system/n9e.service`. `WorkingDirectory` has to be the directory you extracted into: `etc/`, `integrations/`, `data/tsdb` and `logs/` are all resolved relative to it.

```
sudo systemctl daemon-reload

sudo systemctl enable --now n9e

curl -s http://127.0.0.1:17000/ping
```

**Expected result**: `/ping` returns `pong`.

## Edge data centers[​](#edge-data-centers "Direct link to Edge data centers")

`n9e-edge`, from the same package, runs at an edge site. It must be started with a **config directory**, not a config file:

```
./n9e-edge --configs etc/edge
```

Passing `--configs etc` makes it load the central `config.toml` instead, and it does not complain. See [Edge data centers](https://n9e.github.io/docs/install/edge.md).

## Next[​](#next "Direct link to Next")

* [Choosing a metadata database](https://n9e.github.io/docs/install/databases.md) — MySQL or PostgreSQL, and what Redis is for
* [Configuration layout](https://n9e.github.io/docs/install/configuration.md) — what each section of `etc/` does
* [High availability](https://n9e.github.io/docs/install/high-availability.md) — running more than one instance
