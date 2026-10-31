---
title: "Redis 告警规则：12 条 PromQL 规则与处置步骤"
sidebar_label: "Redis"
sidebar_position: 5
description: "12 条开箱可用的 Redis 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 redis_exporter, Categraf。可下载为 Prometheus 规则文件，或导入夜莺。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Redis
toc_max_heading_level: 2
mdx:
  format: md
---

Redis 告警规则：内存使用率过高、key 驱逐速率升高、连接被拒、客户端连接数过多、缓存命中率下降、命令或 PING 延迟过高、实例刚刚重启。exporter 一组使用 oliver006/redis_exporter 的指标名；Categraf 一组为用 Categraf 采集的实例提供同样的检查。

## 概览

- **12 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
- **指标来源**：redis_exporter, Categraf
- **下载**：[`redis.yml`](pathname:///alert-rules/redis.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
- 阈值只是起点，启用前请按自己的环境调整。

## 规则一览

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| High Redis client connection count - exporter | 警告 | 1 分钟 |
| High Redis eviction rate - exporter | 警告 | 1 分钟 |
| High Redis latency - exporter | 警告 | 1 分钟 |
| High Redis memory usage rate - exporter | 警告 | 1 分钟 |
| Low Redis hit rate - exporter | 警告 | 1 分钟 |
| Redis connection refused - exporter | 警告 | — |
| Redis has just been restarted, please be aware - exporter | 提醒 | — |
| High Redis eviction rate | 警告 | 1 分钟 |
| High Redis memory usage rate | 警告 | 1 分钟 |
| High Redis Ping latency (above 100 milliseconds) | 警告 | 1 分钟 |
| Low Redis hit rate | 警告 | 1 分钟 |
| Redis connection refused | 警告 | — |

## Prometheus exporter（7）

本组 7 条中有 1 条规则对用 Categraf 采集的实例同样适用，指标名完全一致。

### High Redis client connection count - exporter

警告 · 1 分钟 · 触发条件:

```promql
(redis_connected_clients / redis_config_maxclients) > 0.85
```

处置步骤:

1. 用 CLIENT LIST 按来源地址统计连接，定位占用最多的应用；
1. 区分是业务扩容还是连接池泄漏（大量 idle 连接不释放）；
1. 应急执行 CONFIG SET maxclients \<更大值>，并同步核对系统 ulimit -n；
1. 根因侧收敛应用连接池上限、开启连接复用。

### High Redis eviction rate - exporter

警告 · 1 分钟 · 触发条件:

```promql
rate(redis_evicted_keys_total[5m]) / sum without (db) (redis_db_keys) > 0.1
```

处置步骤:

1. 用 INFO memory 看 used_memory 与 maxmemory 的差距，确认是否已顶到上限；
1. 用 redis-cli --bigkeys 找异常占用的大 key 并清理或拆分；
1. 确认 maxmemory-policy 是否符合业务预期（纯缓存用 allkeys-lru，有持久化数据的不能让它随意驱逐）；
1. 容量确实不够则扩容内存或做分片。

### High Redis latency - exporter

警告 · 1 分钟 · 触发条件:

```promql
sum without (cmd) (rate(redis_commands_duration_seconds_total[5m])) / rate(redis_commands_processed_total[5m]) > 0.25
```

处置步骤:

1. SLOWLOG GET 10 找耗时最高的命令；
1. 重点排查 KEYS、HGETALL、SMEMBERS 等 O(N) 命令和大 key 操作，改用 SCAN 或分批处理；
1. INFO persistence 确认是否 RDB/AOF rewrite 的 fork 导致卡顿；
1. 检查宿主机 CPU 是否打满、是否发生内存 swap。

### High Redis memory usage rate - exporter

警告 · 1 分钟 · 触发条件:

```promql
redis_memory_max_bytes > 0 and (redis_memory_used_bytes / redis_memory_max_bytes) > 0.85
```

处置步骤:

1. INFO memory 确认 used_memory_rss 与碎片率 mem_fragmentation_ratio，碎片高可开启 activedefrag；
1. 用 redis-cli --bigkeys / --memkeys 定位大 key 并拆分或补 TTL；
1. 检查是否有未设过期时间的 key 在持续堆积；
1. 确认 maxmemory-policy 后按需扩容内存或分片。

### Low Redis hit rate - exporter

警告 · 1 分钟 · 触发条件:

```promql
rate(redis_keyspace_hits_total[5m])
/
(rate(redis_keyspace_misses_total[5m]) + rate(redis_keyspace_hits_total[5m]))
< 0.9
```

处置步骤:

1. 先排除刚重启或刚扩容导致的冷启动（对照 redis_uptime_in_seconds）；
1. INFO stats 对比 keyspace_hits 与 keyspace_misses 的增长，判断是新业务 key 未预热还是缓存被大量驱逐；
1. 若同时有驱逐告警，按内存不足处理（扩容或清理大 key）；
1. 检查业务侧缓存 key 设计与 TTL 是否过短。

### Redis connection refused - exporter

警告 · — · 触发条件:

```promql
(rate(redis_rejected_connections_total[5m])) > 0
```

处置步骤:

1. INFO clients 对比 connected_clients 与 CONFIG GET maxclients；
1. 用 CLIENT LIST 按来源地址统计，定位连接泄漏的应用；
1. 应急执行 CONFIG SET maxclients \<更大值>，同时确认系统 ulimit -n 足够；
1. 根因侧收敛应用连接池大小、开启连接复用。

### Redis has just been restarted, please be aware - exporter

提醒 · — · 触发条件:

```promql
redis_uptime_in_seconds < 600
```

处置步骤:

1. 查看 Redis 日志确认是被 OOM killer 干掉、崩溃还是人工重启；
1. 若是系统 OOM，核对 maxmemory 与宿主机内存余量并调低 maxmemory；
1. 确认 RDB/AOF 是否正常加载、数据是否完整（INFO persistence 看 rdb_last_load_keys_loaded）；
1. 重启后关注命中率与后端数据库负载，必要时做缓存预热。

## Categraf（5）

适用于用 Categraf 采集的主机和实例，指标名遵循 Categraf 插件。

### High Redis eviction rate

警告 · 1 分钟 · 触发条件:

```promql
rate(redis_evicted_keys[5m]) / sum without (db) (redis_keyspace_keys) > 0.1
```

处置步骤:

1. 用 INFO memory 看 used_memory 与 maxmemory 的差距，确认是否已顶到上限；
1. 用 redis-cli --bigkeys 找异常占用的大 key 并清理或拆分；
1. 确认 maxmemory-policy 是否符合业务预期（纯缓存用 allkeys-lru，有持久化数据的不能让它随意驱逐）；
1. 容量确实不够则扩容内存或做分片。

### High Redis memory usage rate

警告 · 1 分钟 · 触发条件:

```promql
redis_maxmemory > 0 and (redis_used_memory / redis_maxmemory) > 0.85
```

处置步骤:

1. INFO memory 确认 used_memory_rss 与碎片率 mem_fragmentation_ratio，碎片高可开启 activedefrag；
1. 用 redis-cli --bigkeys / --memkeys 定位大 key 并拆分或补 TTL；
1. 检查是否有未设过期时间的 key 在持续堆积；
1. 确认 maxmemory-policy 后按需扩容内存或分片。

### High Redis Ping latency (above 100 milliseconds)

警告 · 1 分钟 · 触发条件:

```promql
redis_ping_use_seconds > 0.1
```

处置步骤:

1. 用 redis-cli --latency 和 SLOWLOG GET 10 确认是否有慢命令（KEYS、HGETALL、大 key 操作）阻塞主线程；
1. INFO persistence 看是否正在 RDB/AOF rewrite 导致 fork 卡顿；
1. 排查宿主机 CPU 是否打满、是否发生内存 swap；
1. 定位到慢命令后改用 SCAN 或分批操作替代。

### Low Redis hit rate

警告 · 1 分钟 · 触发条件:

```promql
rate(redis_keyspace_hits[5m])
/
(rate(redis_keyspace_misses[5m]) + rate(redis_keyspace_hits[5m]))
< 0.9
```

处置步骤:

1. 先排除刚重启或刚扩容导致的冷启动（对照 redis_uptime_in_seconds）；
1. INFO stats 对比 keyspace_hits 与 keyspace_misses 的增长，判断是新业务 key 未预热还是缓存被大量驱逐；
1. 若同时有驱逐告警，按内存不足处理（扩容或清理大 key）；
1. 检查业务侧缓存 key 设计与 TTL 是否过短。

### Redis connection refused

警告 · — · 触发条件:

```promql
(rate(redis_rejected_connections[5m])) > 0
```

处置步骤:

1. INFO clients 对比 connected_clients 与 CONFIG GET maxclients；
1. 用 CLIENT LIST 按来源地址统计，定位连接泄漏的应用；
1. 应急执行 CONFIG SET maxclients \<更大值>，同时确认系统 ulimit -n 足够；
1. 根因侧收敛应用连接池大小、开启连接复用。

## 怎么使用这些规则

- **用 Prometheus 或 vmalert**：下载 [`redis.yml`](pathname:///alert-rules/redis.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页。
- **用夜莺**：同样的规则内置在 [Redis](/integrations/redis) 集成模板里。在集成中心把规则[导入到业务组](/docs/data/integrations/import)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可

处置步骤和其余规则来自夜莺的集成模板（[Redis](https://github.com/ccfos/nightingale/tree/main/integrations/Redis)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接

- [用夜莺监控 Redis](/integrations/redis)：采集配置、仪表盘与指标说明
- [在夜莺里写指标告警规则](/docs/alerting/metric-rules)
- [全部告警规则](/alert-rules)
