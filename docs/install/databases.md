# MySQL / PostgreSQL / SQLite and Redis

The metadata store is MySQL, PostgreSQL or SQLite (testing only); the process creates the schema on first start, and Redis holds runtime state such as heartbeats.

Nightingale connects to two stores: a **metadata database** (users, business groups, alert rules, dashboards, notification config) and **Redis**. Metrics are not in either — those belong to the [time-series store](https://n9e.github.io/docs/concepts/storage.md).

## Which one[​](#which-one "Direct link to Which one")

|                | Use it when                                             | Cost                                                                                   |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| SQLite         | Trying it alone, writing docs, CI                       | No second copy, no sharing between instances, and two processes on one file corrupt it |
| MySQL 8        | The default choice, and what most of the community runs | You provide the high availability                                                      |
| PostgreSQL 12+ | Your team already runs PG                               | Same, and a few tables use different column types under PG                             |

MySQL and PostgreSQL are both first-class in production; pick the one your team can operate. **SQLite is for testing** — that is its purpose, not a tuning problem.

## MySQL[​](#mysql "Direct link to MySQL")

```
[DB]

DBType = "mysql"

DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"

MaxOpenConns = 150

MaxIdleConns = 50
```

`parseTime=True` is not optional. Use `utf8mb4`, or emoji in notification templates fail to write.

The database is conventionally called `n9e_v6`; the name has been carried since v6 and the bundled schema scripts still use it. Another name works fine — change the DSN.

## PostgreSQL[​](#postgresql "Direct link to PostgreSQL")

```
[DB]

DBType = "postgres"

DSN = "host=postgres port=5432 user=n9e dbname=n9e_v6 password=<password> sslmode=disable"
```

The DSN is key=value form, not a URL. In production set `sslmode` to `require` or stricter.

## SQLite[​](#sqlite "Direct link to SQLite")

The default, with nothing to configure:

```
[DB]

DBType = "sqlite"

DSN = "n9e.db"
```

The file lands next to the binary. To reset it, delete `n9e.db`, `n9e.db-wal` and `n9e.db-shm` **together** — removing only the main file leaves a fresh database paired with a stale WAL.

## Where the schema comes from[​](#where-the-schema-comes-from "Direct link to Where the schema comes from")

`n9e` **runs AutoMigrate on every start**: it creates missing tables and adds missing columns and indexes. Bootstrapping therefore needs only an empty database and an account that may create and alter tables.

The SQL files in the repository are conveniences for specific situations, and **none of them is a complete schema**:

| File                                            | Purpose                                                                               | Caveat                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `docker/initsql/a-n9e.sql`                      | Creates the MySQL database and tables; run by compose on first start                  | Missing `notify_channel_config`, `ai_llm_config` and others — AutoMigrate fills them in |
| `docker/compose-postgres/initsql_for_postgres/` | The PostgreSQL equivalent                                                             | Same                                                                                    |
| `docker/migratesql/migrate.sql`                 | Cumulative DDL deltas, for people who bootstrapped from SQL and want to align by hand | Not a required upgrade step                                                             |
| `docker/sqlite.sql`                             | An early SQLite schema                                                                | **Stale** — none of the v9 tables are in it; SQLite relies on AutoMigrate               |

A failed migration is logged and does not stop startup, so after an upgrade search the log for `failed to migrate table`. The two large tables, `alert_his_event` and `alert_cur_event`, migrate asynchronously; building indexes on a large one can take tens of minutes.

## What Redis is for[​](#what-redis-is-for "Direct link to What Redis is for")

Redis is not an optional cache layer, it is required:

* **Login sessions** — JWT issuing and revocation, under `[HTTP.JWTAuth] RedisKeyPrefix` (`/jwt/` by default);
* **Host metadata** — CPU, memory and OS reported by heartbeats, written to Redis in batches every second; the host list reads from there;
* **Captchas**, when `[HTTP.ShowCaptcha]` is on;
* **AI conversation state and locks**, plus the pub/sub channel that cancels a conversation across instances.

```
[Redis]

RedisType = "standalone"

Address = "redis:6379"

# Password = ""

# DB = 0
```

`RedisType` accepts `standalone`, `cluster`, `sentinel` and `miniredis`. The default `miniredis` is a **fake Redis running inside the Nightingale process** — its data goes when the process does, so it is for testing only. For `cluster` and `sentinel`, put several comma-separated addresses in `Address`.

**`n9e-edge` cannot reuse the central Redis.** Deploy a separate one at the edge site, otherwise the edge dies with the link it was supposed to survive.

## Next[​](#next "Direct link to Next")

* [Binary packages](https://n9e.github.io/docs/install/binary.md) — starting the process after the config change
* [Configuration layout](https://n9e.github.io/docs/install/configuration.md) — keeping passwords out of plain text
* [High availability](https://n9e.github.io/docs/install/high-availability.md) — several instances on one MySQL and one Redis
