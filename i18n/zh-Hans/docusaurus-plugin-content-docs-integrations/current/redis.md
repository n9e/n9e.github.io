---
title: "用夜莺监控 Redis"
sidebar_label: "Redis"
description: "连上 Redis 执行 INFO 采集内存、命中率、连接、慢日志和主从状态，另带 Sentinel 插件和按 redis_exporter 写的模板。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Redis
toc_max_heading_level: 2
mdx:
  format: md
---

Redis 插件连上实例执行 `INFO` 命令并解析，得到内存使用与碎片率、键空间命中率、连接数、阻塞客户端、持久化状态、主从复制状态等指标。多个实例就写多个 `[[instances]]`，建议给每个实例一个 `instance` 标签，仪表盘靠它区分。

Sentinel 环境另有 `redis_sentinel` 插件采集哨兵视角的主从拓扑。模板里的仪表盘分 Categraf 和 redis_exporter 两套，规则覆盖内存逼近 maxmemory、命中率下降、连接数异常、主从断开和实例重启。

## 模板里有什么

- **3 张仪表盘**，共 47 个面板
- **13 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.redis`、`input.redis_sentinel`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.redis/redis.toml`

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   # address = "127.0.0.1:6379"
   # username = ""
   # password = ""
   # pool_size = 2

   # # Optional. Specify redis commands to retrieve values
   # commands = [
   #     {command = ["get", "sample-key1"], metric = "custom_metric_name1"},
   #     {command = ["get", "sample-key2"], metric = "custom_metric_name2"}
   # ]

   # # interval = global.interval * interval_times
   # interval_times = 1

   # important! use global unique string to specify instance
   # labels = { instance="n9e-10.2.3.4:6379" }

   ## Optional TLS Config
   # use_tls = false
   # tls_min_version = "1.2"
   # tls_ca = "/etc/categraf/ca.pem"
   # tls_cert = "/etc/categraf/cert.pem"
   # tls_key = "/etc/categraf/key.pem"
   ## Use TLS but skip chain & host verification
   # insecure_skip_verify = true
   ```

   `conf/input.redis_sentinel/redis_sentinel.toml`

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   # [protocol://][:password]@address[:port]
   # e.g. servers = ["tcp://localhost:26379"]
   servers = []

   # # interval = global.interval * interval_times
   # interval_times = 1
   # add some dimension data by labels
   # labels = {}

   ## Optional TLS Config
   # use_tls = false
   # tls_min_version = "1.2"
   # tls_ca = "/etc/categraf/ca.pem"
   # tls_cert = "/etc/categraf/cert.pem"
   # tls_key = "/etc/categraf/key.pem"
   ## Use TLS but skip chain & host verification
   # insecure_skip_verify = true
   ```

1. 在夜莺「集成中心」里找到 Redis，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| Redis by address | 16 |
| Redis by instance | 16 |
| Redis Overview - exporter | 15 |

## 内置告警规则

共 13 条，导入后默认停用，按自己环境的阈值逐条启用。每条规则的触发条件（PromQL）和处置步骤收录在告警规则库：[Redis 告警规则](/alert-rules/redis)。

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| High Redis eviction rate | S2 警告 | 1 分钟 |
| High Redis memory usage rate | S2 警告 | 1 分钟 |
| High Redis Ping latency (above 100 milliseconds) | S2 警告 | 1 分钟 |
| Low Redis hit rate | S2 警告 | 1 分钟 |
| Redis connection refused | S2 警告 | — |
| Redis has just been restarted, please be aware | S3 提醒 | — |
| High Redis client connection count - exporter | S2 警告 | 1 分钟 |
| High Redis eviction rate - exporter | S2 警告 | 1 分钟 |
| High Redis latency - exporter | S2 警告 | 1 分钟 |
| High Redis memory usage rate - exporter | S2 警告 | 1 分钟 |
| Low Redis hit rate - exporter | S2 警告 | 1 分钟 |
| Redis connection refused - exporter | S2 警告 | — |
| Redis has just been restarted, please be aware - exporter | S3 提醒 | — |

## 相关链接

- [Redis 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Redis）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `redis` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis)：完整配置项和指标列表。
- [Categraf `redis_sentinel` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis_sentinel)：完整配置项和指标列表。
- [实践：监控 Redis](/docs/practice/redis)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
