# 用夜莺监控 Redis

连上 Redis 执行 INFO 采集内存、命中率、连接、慢日志和主从状态，另带 Sentinel 插件和按 redis\_exporter 写的模板。

最后校对于 2026-10-28

Redis 插件连上实例执行 `INFO` 命令并解析，得到内存使用与碎片率、键空间命中率、连接数、阻塞客户端、持久化状态、主从复制状态等指标。多个实例就写多个 `[[instances]]`，建议给每个实例一个 `instance` 标签，仪表盘靠它区分。

Sentinel 环境另有 `redis_sentinel` 插件采集哨兵视角的主从拓扑。模板里的仪表盘分 Categraf 和 redis\_exporter 两套，规则覆盖内存逼近 maxmemory、命中率下降、连接数异常、主从断开和实例重启。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **3 张仪表盘**，共 47 个面板
* **13 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.redis`、`input.redis_sentinel`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.redis/redis.toml`

   ```
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

   ```
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

2. 在夜莺「集成中心」里找到 Redis，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                    | 面板数 |
| ------------------------- | ------ |
| Redis by address          | 16     |
| Redis by instance         | 16     |
| Redis Overview - exporter | 15     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 13 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（6）[​](#categraf-采集6 "Categraf 采集（6）的直接链接")

#### High Redis eviction rate[​](#high-redis-eviction-rate "High Redis eviction rate的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(redis_evicted_keys[5m]) / sum without (db) (redis_keyspace_keys) > 0.1
```

处置步骤:

1. 用 INFO memory 看 used\_memory 与 maxmemory 的差距，确认是否已顶到上限；
2. 用 redis-cli --bigkeys 找异常占用的大 key 并清理或拆分；
3. 确认 maxmemory-policy 是否符合业务预期（纯缓存用 allkeys-lru，有持久化数据的不能让它随意驱逐）；
4. 容量确实不够则扩容内存或做分片。

#### High Redis memory usage rate[​](#high-redis-memory-usage-rate "High Redis memory usage rate的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
redis_maxmemory > 0 and (redis_used_memory / redis_maxmemory) > 0.85
```

处置步骤:

1. INFO memory 确认 used\_memory\_rss 与碎片率 mem\_fragmentation\_ratio，碎片高可开启 activedefrag；
2. 用 redis-cli --bigkeys / --memkeys 定位大 key 并拆分或补 TTL；
3. 检查是否有未设过期时间的 key 在持续堆积；
4. 确认 maxmemory-policy 后按需扩容内存或分片。

#### High Redis Ping latency (above 100 milliseconds)[​](#high-redis-ping-latency-above-100-milliseconds "High Redis Ping latency (above 100 milliseconds)的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
redis_ping_use_seconds > 0.1
```

处置步骤:

1. 用 redis-cli --latency 和 SLOWLOG GET 10 确认是否有慢命令（KEYS、HGETALL、大 key 操作）阻塞主线程；
2. INFO persistence 看是否正在 RDB/AOF rewrite 导致 fork 卡顿；
3. 排查宿主机 CPU 是否打满、是否发生内存 swap；
4. 定位到慢命令后改用 SCAN 或分批操作替代。

#### Low Redis hit rate[​](#low-redis-hit-rate "Low Redis hit rate的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(redis_keyspace_hits[5m])

/

(rate(redis_keyspace_misses[5m]) + rate(redis_keyspace_hits[5m]))

< 0.9
```

处置步骤:

1. 先排除刚重启或刚扩容导致的冷启动（对照 redis\_uptime\_in\_seconds）；
2. INFO stats 对比 keyspace\_hits 与 keyspace\_misses 的增长，判断是新业务 key 未预热还是缓存被大量驱逐；
3. 若同时有驱逐告警，按内存不足处理（扩容或清理大 key）；
4. 检查业务侧缓存 key 设计与 TTL 是否过短。

#### Redis connection refused[​](#redis-connection-refused "Redis connection refused的直接链接")

S2 警告 · 触发条件:

```
(rate(redis_rejected_connections[5m])) > 0
```

处置步骤:

1. INFO clients 对比 connected\_clients 与 CONFIG GET maxclients；
2. 用 CLIENT LIST 按来源地址统计，定位连接泄漏的应用；
3. 应急执行 CONFIG SET maxclients <更大值>，同时确认系统 ulimit -n 足够；
4. 根因侧收敛应用连接池大小、开启连接复用。

#### Redis has just been restarted, please be aware[​](#redis-has-just-been-restarted-please-be-aware "Redis has just been restarted, please be aware的直接链接")

S3 提醒 · 触发条件:

```
redis_uptime_in_seconds < 600
```

处置步骤:

1. 查看 Redis 日志确认是被 OOM killer 干掉、崩溃还是人工重启；
2. 若是系统 OOM，核对 maxmemory 与宿主机内存余量并调低 maxmemory；
3. 确认 RDB/AOF 是否正常加载、数据是否完整（INFO persistence 看 rdb\_last\_load\_keys\_loaded）；
4. 重启后关注命中率与后端数据库负载，必要时做缓存预热。

### Exporter 采集（7）[​](#exporter-采集7 "Exporter 采集（7）的直接链接")

#### High Redis client connection count - exporter[​](#high-redis-client-connection-count---exporter "High Redis client connection count - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
(redis_connected_clients / redis_config_maxclients) > 0.85
```

处置步骤:

1. 用 CLIENT LIST 按来源地址统计连接，定位占用最多的应用；
2. 区分是业务扩容还是连接池泄漏（大量 idle 连接不释放）；
3. 应急执行 CONFIG SET maxclients <更大值>，并同步核对系统 ulimit -n；
4. 根因侧收敛应用连接池上限、开启连接复用。

#### High Redis eviction rate - exporter[​](#high-redis-eviction-rate---exporter "High Redis eviction rate - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(redis_evicted_keys_total[5m]) / sum without (db) (redis_db_keys) > 0.1
```

处置步骤:

1. 用 INFO memory 看 used\_memory 与 maxmemory 的差距，确认是否已顶到上限；
2. 用 redis-cli --bigkeys 找异常占用的大 key 并清理或拆分；
3. 确认 maxmemory-policy 是否符合业务预期（纯缓存用 allkeys-lru，有持久化数据的不能让它随意驱逐）；
4. 容量确实不够则扩容内存或做分片。

#### High Redis latency - exporter[​](#high-redis-latency---exporter "High Redis latency - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum without (cmd) (rate(redis_commands_duration_seconds_total[5m])) / rate(redis_commands_processed_total[5m]) > 0.25
```

处置步骤:

1. SLOWLOG GET 10 找耗时最高的命令；
2. 重点排查 KEYS、HGETALL、SMEMBERS 等 O(N) 命令和大 key 操作，改用 SCAN 或分批处理；
3. INFO persistence 确认是否 RDB/AOF rewrite 的 fork 导致卡顿；
4. 检查宿主机 CPU 是否打满、是否发生内存 swap。

#### High Redis memory usage rate - exporter[​](#high-redis-memory-usage-rate---exporter "High Redis memory usage rate - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
redis_memory_max_bytes > 0 and (redis_memory_used_bytes / redis_memory_max_bytes) > 0.85
```

处置步骤:

1. INFO memory 确认 used\_memory\_rss 与碎片率 mem\_fragmentation\_ratio，碎片高可开启 activedefrag；
2. 用 redis-cli --bigkeys / --memkeys 定位大 key 并拆分或补 TTL；
3. 检查是否有未设过期时间的 key 在持续堆积；
4. 确认 maxmemory-policy 后按需扩容内存或分片。

#### Low Redis hit rate - exporter[​](#low-redis-hit-rate---exporter "Low Redis hit rate - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(redis_keyspace_hits_total[5m])

/

(rate(redis_keyspace_misses_total[5m]) + rate(redis_keyspace_hits_total[5m]))

< 0.9
```

处置步骤:

1. 先排除刚重启或刚扩容导致的冷启动（对照 redis\_uptime\_in\_seconds）；
2. INFO stats 对比 keyspace\_hits 与 keyspace\_misses 的增长，判断是新业务 key 未预热还是缓存被大量驱逐；
3. 若同时有驱逐告警，按内存不足处理（扩容或清理大 key）；
4. 检查业务侧缓存 key 设计与 TTL 是否过短。

#### Redis connection refused - exporter[​](#redis-connection-refused---exporter "Redis connection refused - exporter的直接链接")

S2 警告 · 触发条件:

```
(rate(redis_rejected_connections_total[5m])) > 0
```

处置步骤:

1. INFO clients 对比 connected\_clients 与 CONFIG GET maxclients；
2. 用 CLIENT LIST 按来源地址统计，定位连接泄漏的应用；
3. 应急执行 CONFIG SET maxclients <更大值>，同时确认系统 ulimit -n 足够；
4. 根因侧收敛应用连接池大小、开启连接复用。

#### Redis has just been restarted, please be aware - exporter[​](#redis-has-just-been-restarted-please-be-aware---exporter "Redis has just been restarted, please be aware - exporter的直接链接")

S3 提醒 · 触发条件:

```
redis_uptime_in_seconds < 600
```

处置步骤:

1. 查看 Redis 日志确认是被 OOM killer 干掉、崩溃还是人工重启；
2. 若是系统 OOM，核对 maxmemory 与宿主机内存余量并调低 maxmemory；
3. 确认 RDB/AOF 是否正常加载、数据是否完整（INFO persistence 看 rdb\_last\_load\_keys\_loaded）；
4. 重启后关注命中率与后端数据库负载，必要时做缓存预热。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Redis 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Redis）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Redis%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `redis` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis)：完整配置项和指标列表。
* [Categraf `redis_sentinel` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis_sentinel)：完整配置项和指标列表。
* [实践：监控 Redis](https://n9e.github.io/zh/docs/practice/redis.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
