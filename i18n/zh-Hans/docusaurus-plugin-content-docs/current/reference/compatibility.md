---
title: "兼容性矩阵"
sidebar_label: "兼容性矩阵"
description: "各依赖组件的版本情况，以及为什么这里没有一张官方的「支持版本」表。"
last_reviewed: 2026-10-10
---

**先说清楚：项目没有发布过官方的「支持版本矩阵」。**
下面这些是从发布物和代码里核实出来的事实，不是承诺。

生产选型时，把这页当作「已知能跑的组合」的起点，而不是「只有这些能跑」。

## 官方 compose 方案实际用的版本

这是被真实验证过的组合——发布时会跑起来看：

| 组件 | 版本 | 出现在 |
|---|---|---|
| MySQL | 8 | `compose-bridge` |
| PostgreSQL | 12-alpine | `compose-postgres` |
| Redis | 6.2 / 7.0-alpine | 两套方案各一 |
| VictoriaMetrics | v1.79.12 | 两套方案 |
| Prometheus | 最新 | `compose-host-network` |

## 元数据库

| 数据库 | 情况 |
|---|---|
| SQLite | 内置，**只适合单进程测试**。表结构靠启动时 AutoMigrate 建 |
| MySQL | 驱动是 `go-sql-driver/mysql` v1.9.3，覆盖 5.7 及以上；官方方案用 8 |
| PostgreSQL | 驱动是 `jackc/pgx` v5，覆盖主流版本；官方方案用 12 |

字符集：MySQL 的 DSN 里要带 `charset=utf8mb4&parseTime=True&loc=Local`，
建表脚本 `docker/initsql/a-n9e.sql` 用的也是 utf8mb4。

## Redis

| 形态 | 配置项 |
|---|---|
| miniredis（进程内，测试用） | `RedisType = "miniredis"` |
| 单实例 | `RedisType = "standalone"` |
| 集群 | `RedisType = "cluster"` |
| 哨兵 | `RedisType = "sentinel"` |

客户端是 `go-redis/v9`，兼容 Redis 6 及以上。

## 数据源

开源版支持 11 种类型，各自的版本情况：

| 类型 | 说明 |
|---|---|
| Prometheus Like | 覆盖 Prometheus、VictoriaMetrics、Thanos、Mimir、M3 —— 只要实现 PromQL HTTP API |
| ElasticSearch | 表单里**版本可以留空自动探测**，也可以写 `x.y.z`。代码里对 7.17.0 以上有分支处理 |
| OpenSearch | 需要在配置里写明版本 |
| Loki | URL **必须带 `/loki` 后缀** |
| VictoriaLogs / TDengine / ClickHouse / Doris / IoTDB / MySQL / PostgreSQL | 见各自的接入页 |

注意**能注册成数据源**和**能在哪里用**是两回事：ClickHouse、Doris、MySQL、PostgreSQL、
OpenSearch 在开源版进不了即时查询、日志检索和仪表盘，只能用于告警规则。
见[接入数据](../data/overview.mdx)。

## 采集器

| 采集器 | 情况 |
|---|---|
| Categraf | 配套采集器，独立仓库独立版本。Remote Write 协议 |
| Prometheus / vmagent / Grafana Agent | 通过 Remote Write 写入 |
| Telegraf | 通过 Remote Write 或 OpenTSDB 协议 |
| Datadog Agent | 走 `/datadog/api/v1/series` |
| Open-Falcon 采集器 | 走 `/openfalcon/push` |

## 构建环境

Go 1.25。前端是 Vite + React，构建脚本见 `n9e/fe` 仓库。

## 相关

- [数据库选型](../install/databases.md)
- [接入数据](../data/overview.mdx)
- [数据写入协议](./write-protocols.md)
