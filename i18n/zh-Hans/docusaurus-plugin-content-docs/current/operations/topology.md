---
title: "生产拓扑"
sidebar_label: "生产拓扑"
description: "单团队、单公司、多机房带边缘告警的参考布局。"
---

三档规模，三张部署图。挑最接近你现状的那张照着搭，不用从架构图开始设计。

## 单团队：一台机器

一个组、几十台机器、告警断一会儿不至于出事——一台机器上跑一个 `n9e` 就够。

```
      categraf ──► n9e (17000) ──► 内置时序库（本地磁盘）
                     │
                 MySQL + Redis
```

- `[DB]` 换成 MySQL 或 PostgreSQL，`[Redis]` 换成 `standalone`：默认的 SQLite 和
  miniredis 是进程内的，进程没了数据就没了；
- `[EmbeddedTSDB]` 保持开启，`RetentionDuration` 按你要看多久的历史调；
- 备份只有一件事：`mysqldump` + `etc/` 目录。

代价说清楚：**这台机器就是单点**。n9e 进程挂了、机器重启了，这段时间不判定也不通知。

## 单公司：两三个 n9e + 外部时序库

告警开始被当成基础设施之后，第一件要去掉的就是上面那个单点。

```
                    ┌── n9e #1 ─┐
   浏览器 / 采集器 ─►│   n9e #2  │──► VictoriaMetrics / Prometheus
        (LB)        └── n9e #3 ─┘
                          │
                    MySQL + Redis（各自也要做高可用）
```

组集群没有额外组件：**多跑几个 `n9e`，配置一致，共享同一套 MySQL 和 Redis**。
告警规则自动分派，一条规则只在一个实例上跑；某个实例挂了，它的规则被别的实例接管。

三处必须改：

```toml
# 1. 关掉内置时序库——它的数据在单个进程的本地磁盘上，多副本时每个只有一部分
[EmbeddedTSDB]
Enable = false

# 2. 指向外部时序库
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"

# 3. 数据库和 Redis 必须是所有实例都连得上的同一套
[DB]
DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
[Redis]
RedisType = "standalone"
Address = "redis:6379"
```

负载均衡后面挂的是 17000 端口。注意**写入端点和管理端点在同一个端口上**
（`/prometheus/v1/write`、`/v1/n9e/heartbeat` 和 Web UI 都在 17000），
做网络收口时不能简单地「把 17000 放到公网」。

## 多机房：中心 + 边缘

有多个机房、机房之间的专线不那么可靠时，让中心去查远端机房的时序库，
告警的可靠性就等于那条链路的可靠性——链路一断，整个机房失去告警。

```
   中心机房                          边缘机房 A
   ┌──────────────┐                 ┌────────────────────────┐
   │ n9e × N      │◄── 拉规则配置 ──│ n9e-edge (19000)       │
   │ MySQL/Redis  │                 │ 本地 Redis + 本地时序库 │
   └──────────────┘                 └────────────────────────┘
```

`n9e-edge` 跑在边缘机房，规则仍然在中心统一管理并下发，但**查询和判定在本地做**。
链路断了，边缘继续判定、继续发通知。

要点：

- 中心侧要打开 `[HTTP.APIForService] Enable = true`，边缘靠它拉配置；
- 边缘**需要自己的 Redis**，不能复用中心那套；
- 启动时一定要指对配置目录：`n9e-edge --configs etc/edge`，
  默认的 `etc` 是中心的配置，指错了不会报错，只会静默地跑偏。

详见[边缘机房](../install/edge.md)与[边缘断网行为](./edge-partition.md)。

## 什么时候值得拆进程

`n9e` 里已经包含了告警判定和 Pushgw 的能力，`n9e-alert` / `n9e-pushgw` 是**性能选项，不是必经步骤**。

| 现象 | 拆什么 |
|---|---|
| Web 页面卡，但判定不延迟 | 先别拆，看数据源查询是不是慢 |
| 判定延迟，Web 也跟着卡 | 拆 `n9e-alert`，让判定不和 Web 抢 CPU |
| 写入量把进程打满，判定被拖累 | 拆 `n9e-pushgw` |
| 某个机房的数据查不动 | 上 `n9e-edge`，这是拓扑变化不是性能调优 |

一上来就三个进程，只是多两份要保持同步的配置文件。

## 三档拓扑要准备的东西

| | 单团队 | 单公司 | 多机房 |
|---|---|---|---|
| `n9e` 实例数 | 1 | 2–3 | 中心 2–3 + 每机房 1 个 edge |
| 元数据库 | MySQL/PostgreSQL 单实例 | MySQL 主备 | 同左 |
| Redis | 单实例 | 哨兵或集群 | 中心一套 + 每个边缘机房一套 |
| 时序库 | 内置 | 外部（VictoriaMetrics 等） | 中心一套 + 每机房本地一套 |
| 负载均衡 | 不需要 | 需要 | 中心需要 |

## 相关

- [高可用与故障域](./high-availability.md)
- [容量规划](./capacity.md)
- [进程与角色](../concepts/components.md)
- [上线前检查清单](../get-started/production-checklist.md)
