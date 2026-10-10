---
title: "MySQL / PostgreSQL / SQLite 与 Redis"
sidebar_label: "MySQL / PostgreSQL / SQLite 与 Redis"
description: "元数据库可选 MySQL、PostgreSQL 或 SQLite（仅测试），表结构由进程首次启动时自动建好；Redis 存放心跳等运行时状态。"
---

夜莺要连两个存储：一个**元数据库**（用户、业务组、规则、仪表盘、通知配置都在里面），
一个 **Redis**。指标不在这里，那是[时序库](../concepts/storage.md)的事。

## 选哪个

| | 什么时候用 | 代价 |
|---|---|---|
| SQLite | 单人试用、写文档、跑 CI | 没有第二份数据，多实例无法共享，同一个文件被两个进程写会损坏 |
| MySQL 8 | 默认选择，社区里跑得最多 | 需要自己保证高可用 |
| PostgreSQL 12+ | 团队已经在用 PG | 同上；部分表在 PG 下用的是不同的列类型定义 |

生产上 MySQL 和 PostgreSQL 都是一等公民，选团队运维得起的那个。
**SQLite 只够测试**——这是它的定位，不是它没调好。

## MySQL

```toml
[DB]
DBType = "mysql"
DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
MaxOpenConns = 150
MaxIdleConns = 50
```

`parseTime=True` 不能省。字符集用 `utf8mb4`，否则通知模板里的 emoji 会写不进去。

库名习惯叫 `n9e_v6`，从 v6 沿用至今，仓库里的建库脚本用的也是这个名字。
换个名字也能跑，改 DSN 即可。

## PostgreSQL

```toml
[DB]
DBType = "postgres"
DSN = "host=postgres port=5432 user=n9e dbname=n9e_v6 password=<password> sslmode=disable"
```

DSN 是 key=value 形式，不是 URL。生产上把 `sslmode` 改成 `require` 或更严。

## SQLite

默认值，什么都不用配：

```toml
[DB]
DBType = "sqlite"
DSN = "n9e.db"
```

文件落在二进制同级目录。要重置就把 `n9e.db`、`n9e.db-wal`、`n9e.db-shm`
**三个一起删**——只删主文件会让新库配上旧 WAL。

## 表结构是怎么来的

`n9e` **每次启动都会跑一遍 AutoMigrate**：建缺失的表、补缺失的列和索引。
所以初始化只需要一个空库，加上一个能建表改表的账号。

仓库里那几份 SQL 是给特定场景准备的便利脚本，都**不是完整的表结构**：

| 文件 | 用途 | 注意 |
|---|---|---|
| `docker/initsql/a-n9e.sql` | MySQL 建库 + 建表，compose 首次启动时执行 | 不含 `notify_channel_config`、`ai_llm_config` 等表，靠 AutoMigrate 补 |
| `docker/compose-postgres/initsql_for_postgres/` | PostgreSQL 版本的同一份东西 | 同上 |
| `docker/migratesql/migrate.sql` | 历次版本的增量 DDL，给当初用 SQL 初始化、想手工对齐的人 | 不是升级的必需步骤 |
| `docker/sqlite.sql` | 早期的 SQLite 建表脚本 | **已经过时**，v9 的新表都不在里面；SQLite 直接靠 AutoMigrate 即可 |

AutoMigrate 的失败只记日志、不阻止启动，所以升级后要去日志里搜一次
`failed to migrate table`。`alert_his_event`、`alert_cur_event` 这两张大表的迁移
是异步跑的，大库上建索引可能要几十分钟。

## Redis 用来做什么

Redis 不是缓存加速的可选项，它是必需的：

- **登录会话**——JWT 的签发和吊销，键前缀 `[HTTP.JWTAuth] RedisKeyPrefix`（默认 `/jwt/`）；
- **机器元信息**——心跳带上来的 CPU、内存、操作系统等，每秒批量写进 Redis，设备列表读的是这份；
- **图形验证码**——`[HTTP.ShowCaptcha]` 打开时的验证码；
- **AI 会话状态与并发锁**，以及跨实例取消一次对话的 Pub/Sub 通道。

```toml
[Redis]
RedisType = "standalone"
Address = "redis:6379"
# Password = ""
# DB = 0
```

`RedisType` 可选 `standalone`、`cluster`、`sentinel`、`miniredis`。
默认的 `miniredis` 是**跑在夜莺进程内的假 Redis**，进程一停数据就没了，只适合测试。
`cluster` 和 `sentinel` 模式下 `Address` 填多个地址，逗号分隔。

**边缘机房的 `n9e-edge` 不能复用中心的 Redis**，要在边缘机房单独部署一个，
否则网络一断边缘就跟着废了。

## 下一步

- [二进制包](./binary.md)——改完配置怎么启动
- [配置文件布局](./configuration.md)——口令怎么不写明文
- [高可用](./high-availability.md)——多实例共享同一套 MySQL 和 Redis
