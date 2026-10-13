# Monitor Redis with Nightingale

Runs INFO against Redis to collect memory, hit ratio, connections, slowlog and replication state; includes a Sentinel input and templates for redis\_exporter.

Last reviewed 2026-10-13

The Redis input connects to the instance, runs `INFO` and parses the result into memory usage and fragmentation, keyspace hit ratio, connected and blocked clients, persistence state and replication status. Add one `[[instances]]` block per instance and give each an `instance` label; the dashboards filter on it.

For Sentinel deployments the `redis_sentinel` input collects the topology from the sentinel's point of view. Dashboards come in Categraf and redis\_exporter editions; the rules cover memory nearing maxmemory, dropping hit ratio, abnormal connection counts, broken replication and restarts.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **3 dashboards**, 47 panels in total
* **13 alert rules**, each with runbook steps
* **Categraf collector config**: `input.redis`, `input.redis_sentinel`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

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

2. Open the integration center in Nightingale, find Redis, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                 | Panels |
| ------------------------- | ------ |
| Redis by address          | 16     |
| Redis by instance         | 16     |
| Redis Overview - exporter | 15     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

13 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (6)[​](#collected-by-categraf-6 "Direct link to Collected by Categraf (6)")

#### High Redis eviction rate[​](#high-redis-eviction-rate "Direct link to High Redis eviction rate")

S2 Warning · for 1 min · Trigger:

```
rate(redis_evicted_keys[5m]) / sum without (db) (redis_keyspace_keys) > 0.1
```

Runbook:

1. Use INFO memory to compare used\_memory against maxmemory and confirm whether it has topped out;
2. Use redis-cli --bigkeys to find abnormally large keys and clean up or split them;
3. Confirm maxmemory-policy matches expectations (allkeys-lru for a pure cache; data you cannot afford to lose must not be left evictable);
4. If capacity is genuinely insufficient, scale up memory or shard.

#### High Redis memory usage rate[​](#high-redis-memory-usage-rate "Direct link to High Redis memory usage rate")

S2 Warning · for 1 min · Trigger:

```
redis_maxmemory > 0 and (redis_used_memory / redis_maxmemory) > 0.85
```

Runbook:

1. Check used\_memory\_rss and the fragmentation ratio mem\_fragmentation\_ratio in INFO memory — enable activedefrag if fragmentation is high;
2. Use redis-cli --bigkeys / --memkeys to find big keys and split them or add TTLs;
3. Check whether keys without an expiry are piling up;
4. Confirm maxmemory-policy, then scale up memory or shard as needed.

#### High Redis Ping latency (above 100 milliseconds)[​](#high-redis-ping-latency-above-100-milliseconds "Direct link to High Redis Ping latency (above 100 milliseconds)")

S2 Warning · for 1 min · Trigger:

```
redis_ping_use_seconds > 0.1
```

Runbook:

1. Use redis-cli --latency and SLOWLOG GET 10 to check whether slow commands (KEYS, HGETALL, big-key operations) are blocking the main thread;
2. Check INFO persistence to see whether an RDB/AOF rewrite fork is causing the stall;
3. Check whether the host CPU is saturated or the machine is swapping;
4. Once you find the slow command, replace it with SCAN or batched operations.

#### Low Redis hit rate[​](#low-redis-hit-rate "Direct link to Low Redis hit rate")

S2 Warning · for 1 min · Trigger:

```
rate(redis_keyspace_hits[5m])

/

(rate(redis_keyspace_misses[5m]) + rate(redis_keyspace_hits[5m]))

< 0.9
```

Runbook:

1. First rule out a cold start after a restart or scale-out (check redis\_uptime\_in\_seconds);
2. Compare the growth of keyspace\_hits and keyspace\_misses in INFO stats to tell unwarmed new keys apart from heavy eviction;
3. If an eviction alert fired at the same time, treat it as insufficient memory (scale up or clean up big keys);
4. Review the cache key design and whether the TTL is too short on the application side.

#### Redis connection refused[​](#redis-connection-refused "Direct link to Redis connection refused")

S2 Warning · Trigger:

```
(rate(redis_rejected_connections[5m])) > 0
```

Runbook:

1. Compare connected\_clients from INFO clients against CONFIG GET maxclients;
2. Use CLIENT LIST grouped by source address to find the application leaking connections;
3. As an emergency measure run CONFIG SET maxclients \<larger value>, confirming the system ulimit -n is high enough;
4. For the root cause, cap the application connection pool and enable connection reuse.

#### Redis has just been restarted, please be aware[​](#redis-has-just-been-restarted-please-be-aware "Direct link to Redis has just been restarted, please be aware")

S3 Info · Trigger:

```
redis_uptime_in_seconds < 600
```

Runbook:

1. Check the Redis log to tell an OOM kill, a crash and a manual restart apart;
2. If the system OOM killer was involved, compare maxmemory against free host memory and lower maxmemory;
3. Confirm the RDB/AOF loaded correctly and the data is complete (check rdb\_last\_load\_keys\_loaded in INFO persistence);
4. After the restart, watch the hit rate and the backend database load, and warm the cache if needed.

### Collected by an exporter (7)[​](#collected-by-an-exporter-7 "Direct link to Collected by an exporter (7)")

#### High Redis client connection count - exporter[​](#high-redis-client-connection-count---exporter "Direct link to High Redis client connection count - exporter")

S2 Warning · for 1 min · Trigger:

```
(redis_connected_clients / redis_config_maxclients) > 0.85
```

Runbook:

1. Use CLIENT LIST grouped by source address to find the application holding the most connections;
2. Tell a scale-out apart from a connection pool leak (many idle connections never released);
3. As an emergency measure run CONFIG SET maxclients \<larger value> and check the system ulimit -n to match;
4. For the root cause, cap the application connection pool and enable connection reuse.

#### High Redis eviction rate - exporter[​](#high-redis-eviction-rate---exporter "Direct link to High Redis eviction rate - exporter")

S2 Warning · for 1 min · Trigger:

```
rate(redis_evicted_keys_total[5m]) / sum without (db) (redis_db_keys) > 0.1
```

Runbook:

1. Use INFO memory to compare used\_memory against maxmemory and confirm whether it has topped out;
2. Use redis-cli --bigkeys to find abnormally large keys and clean up or split them;
3. Confirm maxmemory-policy matches expectations (allkeys-lru for a pure cache; data you cannot afford to lose must not be left evictable);
4. If capacity is genuinely insufficient, scale up memory or shard.

#### High Redis latency - exporter[​](#high-redis-latency---exporter "Direct link to High Redis latency - exporter")

S2 Warning · for 1 min · Trigger:

```
sum without (cmd) (rate(redis_commands_duration_seconds_total[5m])) / rate(redis_commands_processed_total[5m]) > 0.25
```

Runbook:

1. Run SLOWLOG GET 10 to find the slowest commands;
2. Focus on O(N) commands such as KEYS, HGETALL and SMEMBERS and on big-key operations, switching to SCAN or batched processing;
3. Check INFO persistence to see whether an RDB/AOF rewrite fork is causing the stall;
4. Check whether the host CPU is saturated or the machine is swapping.

#### High Redis memory usage rate - exporter[​](#high-redis-memory-usage-rate---exporter "Direct link to High Redis memory usage rate - exporter")

S2 Warning · for 1 min · Trigger:

```
redis_memory_max_bytes > 0 and (redis_memory_used_bytes / redis_memory_max_bytes) > 0.85
```

Runbook:

1. Check used\_memory\_rss and the fragmentation ratio mem\_fragmentation\_ratio in INFO memory — enable activedefrag if fragmentation is high;
2. Use redis-cli --bigkeys / --memkeys to find big keys and split them or add TTLs;
3. Check whether keys without an expiry are piling up;
4. Confirm maxmemory-policy, then scale up memory or shard as needed.

#### Low Redis hit rate - exporter[​](#low-redis-hit-rate---exporter "Direct link to Low Redis hit rate - exporter")

S2 Warning · for 1 min · Trigger:

```
rate(redis_keyspace_hits_total[5m])

/

(rate(redis_keyspace_misses_total[5m]) + rate(redis_keyspace_hits_total[5m]))

< 0.9
```

Runbook:

1. First rule out a cold start after a restart or scale-out (check redis\_uptime\_in\_seconds);
2. Compare the growth of keyspace\_hits and keyspace\_misses in INFO stats to tell unwarmed new keys apart from heavy eviction;
3. If an eviction alert fired at the same time, treat it as insufficient memory (scale up or clean up big keys);
4. Review the cache key design and whether the TTL is too short on the application side.

#### Redis connection refused - exporter[​](#redis-connection-refused---exporter "Direct link to Redis connection refused - exporter")

S2 Warning · Trigger:

```
(rate(redis_rejected_connections_total[5m])) > 0
```

Runbook:

1. Compare connected\_clients from INFO clients against CONFIG GET maxclients;
2. Use CLIENT LIST grouped by source address to find the application leaking connections;
3. As an emergency measure run CONFIG SET maxclients \<larger value>, confirming the system ulimit -n is high enough;
4. For the root cause, cap the application connection pool and enable connection reuse.

#### Redis has just been restarted, please be aware - exporter[​](#redis-has-just-been-restarted-please-be-aware---exporter "Direct link to Redis has just been restarted, please be aware - exporter")

S3 Info · Trigger:

```
redis_uptime_in_seconds < 600
```

Runbook:

1. Check the Redis log to tell an OOM kill, a crash and a manual restart apart;
2. If the system OOM killer was involved, compare maxmemory against free host memory and lower maxmemory;
3. Confirm the RDB/AOF loaded correctly and the data is complete (check rdb\_last\_load\_keys\_loaded in INFO persistence);
4. After the restart, watch the hit rate and the backend database load, and warm the cache if needed.

## Related[​](#related "Direct link to Related")

* [Redis template source](https://github.com/ccfos/nightingale/tree/main/integrations/Redis): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `redis` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis): every config option and the full metric list.
* [Categraf `redis_sentinel` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis_sentinel): every config option and the full metric list.
* [Walkthrough: monitor Redis](https://n9e.github.io/docs/practice/redis.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
