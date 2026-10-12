---
title: "Docker Compose"
sidebar_label: "Docker Compose"
description: "一条命令把夜莺连同数据库、时序库一起拉起；编排里有什么、怎么改。"
last_reviewed: 2026-10-10
---

仓库的 `docker/` 下有四套现成的编排，`docker compose up -d` 一条命令就能拿到一套
「夜莺 + MySQL + Redis + 时序库 + 采集器」的完整环境，不用自己准备依赖。

## 四套编排，先选一套

```bash
git clone https://github.com/ccfos/nightingale.git
cd nightingale/docker
```

| 目录 | 元数据库 | 时序库 | 网络 |
|---|---|---|---|
| `compose-bridge` | MySQL 8 | VictoriaMetrics | bridge，端口映射到宿主机 |
| `compose-postgres` | PostgreSQL 12 | VictoriaMetrics | bridge |
| `compose-host-network` | MySQL 8 | Prometheus | `network_mode: host` |
| `compose-host-network-metric-log` | MySQL 8 | Prometheus + Kafka / Elasticsearch / Logstash | `network_mode: host` |

:::warning 两套 host-network 的只能在 Linux 上跑
`network_mode: host` 是 Linux 独有的能力，Docker Desktop（macOS / Windows）上容器不会真的共享宿主机网络栈，这两套起不来。在 mac 上评估请用 `compose-bridge`。
:::

不确定就用 `compose-bridge`。

## 拉起来

```bash
cd compose-bridge
docker compose up -d
```

**预期结果**：`docker compose ps` 里 5 个容器都是 running，
浏览器打开 `http://localhost:17000` 能用 `root` / `root.2020` 登进去。

`nightingale` 容器的环境变量里有 `WAIT_HOSTS: mysql:3306, redis:6379`，
进程会先等这两个端口通了再启动，所以不用关心容器的启动顺序。

## 编排里有什么

`compose-bridge` 起 5 个容器，映射出 4 个端口：

| 容器 | 端口 | 作用 |
|---|---|---|
| `mysql` | 3306 | 元数据库，首次启动时用 `docker/initsql/` 建好 `n9e_v6` |
| `redis` | 6379 | 会话、心跳缓存 |
| `victoriametrics` | 8428 | 时序库 |
| `nightingale` | 17000 / 20090 | Web、API、写入端点 / 自愈的 ibex RPC |
| `categraf` | — | 采集宿主机指标，写回 `nightingale:17000` |

3306 和 6379 是直接映射到宿主机的，**本机已经跑着 MySQL 或 Redis 时会撞端口**，
改 `ports` 或者停掉本机的服务。

## 改配置

夜莺的配置目录是挂进去的，不在镜像里：

```yaml
volumes:
  - ./etc-nightingale:/app/etc
```

改 `compose-bridge/etc-nightingale/config.toml` 后 `docker compose restart nightingale` 即可。
这份配置和二进制包里的默认配置有几处不同，都是为了适配容器网络：

```toml
[DB]
DBType = "mysql"
DSN="root:1234@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&collation=utf8mb4_general_ci&parseTime=True&loc=Local&allowNativePasswords=true"

[Redis]
RedisType = "standalone"
Address = "redis:6379"

[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"
```

注意它**没有 `[EmbeddedTSDB]` 段**——编排里已经有一个真的时序库，指标直接写
VictoriaMetrics，不走内置库。地址用的是 compose 的服务名，改成集群外的地址时把服务名换成
真实主机名即可。

`root:1234` 这组数据库口令写在编排文件和配置文件里，上生产前必须改掉。

## 换成 PostgreSQL

`compose-postgres` 除了元数据库，其余部分和 `compose-bridge` 一样：

```toml
[DB]
DBType = "postgres"
DSN="host=postgres port=5432 user=root dbname=n9e_v6 password=1234 sslmode=disable"
```

它把 5432 映射到宿主机，不映射 3306。两种数据库的取舍见[数据库选型](./databases.md)。

## 接自己已有的数据库和时序库

编排里的 MySQL / Redis / VictoriaMetrics 是为了「一条命令能跑」凑齐的，
已经有这些组件时把对应的 service 从 `docker-compose.yaml` 里删掉，
再把 `etc-nightingale/config.toml` 里的地址改成真实地址即可——
`nightingale` 容器本身不区分依赖是不是自己人。

改完记得同步 `WAIT_HOSTS`，否则进程会一直等一个已经不存在的服务名。

## 下一步

- [数据库选型](./databases.md)
- [外置时序库与双写迁移](./external-tsdb.md)
- [上生产前的检查清单](../get-started/production-checklist.md)
