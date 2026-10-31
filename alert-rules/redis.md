---
title: "Redis alert rules for Prometheus: 12 rules with runbooks"
sidebar_label: "Redis"
sidebar_position: 5
description: "12 ready-to-use Redis alert rules in PromQL, each with severity, duration and runbook steps. Metrics from redis_exporter, Categraf. Download as a Prometheus rules file or import into Nightingale."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Redis
toc_max_heading_level: 2
mdx:
  format: md
---

Redis alert rules for high memory usage, a rising eviction rate, rejected connections, too many client connections, a falling cache hit ratio, high command or ping latency, and an instance that has just restarted. The exporter group uses oliver006/redis_exporter metric names; the Categraf group covers the same checks for instances collected by Categraf.

## At a glance

- **12 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
- **Metrics from**: redis_exporter, Categraf
- **Download**: [`redis.yml`](pathname:///alert-rules/redis.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
- Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list

| Rule | Severity | For |
| --- | --- | --- |
| High Redis client connection count - exporter | Warning | 1m |
| High Redis eviction rate - exporter | Warning | 1m |
| High Redis latency - exporter | Warning | 1m |
| High Redis memory usage rate - exporter | Warning | 1m |
| Low Redis hit rate - exporter | Warning | 1m |
| Redis connection refused - exporter | Warning | — |
| Redis has just been restarted, please be aware - exporter | Info | — |
| High Redis eviction rate | Warning | 1m |
| High Redis memory usage rate | Warning | 1m |
| High Redis Ping latency (above 100 milliseconds) | Warning | 1m |
| Low Redis hit rate | Warning | 1m |
| Redis connection refused | Warning | — |

## Prometheus exporter (7)

1 of the 7 rules in this group also apply unchanged to instances collected by Categraf, which produces the same metric names.

### High Redis client connection count - exporter

Warning · 1m · Trigger:

```promql
(redis_connected_clients / redis_config_maxclients) > 0.85
```

Runbook:

1. Use CLIENT LIST grouped by source address to find the application holding the most connections;
1. Tell a scale-out apart from a connection pool leak (many idle connections never released);
1. As an emergency measure run CONFIG SET maxclients \<larger value> and check the system ulimit -n to match;
1. For the root cause, cap the application connection pool and enable connection reuse.

### High Redis eviction rate - exporter

Warning · 1m · Trigger:

```promql
rate(redis_evicted_keys_total[5m]) / sum without (db) (redis_db_keys) > 0.1
```

Runbook:

1. Use INFO memory to compare used_memory against maxmemory and confirm whether it has topped out;
1. Use redis-cli --bigkeys to find abnormally large keys and clean up or split them;
1. Confirm maxmemory-policy matches expectations (allkeys-lru for a pure cache; data you cannot afford to lose must not be left evictable);
1. If capacity is genuinely insufficient, scale up memory or shard.

### High Redis latency - exporter

Warning · 1m · Trigger:

```promql
sum without (cmd) (rate(redis_commands_duration_seconds_total[5m])) / rate(redis_commands_processed_total[5m]) > 0.25
```

Runbook:

1. Run SLOWLOG GET 10 to find the slowest commands;
1. Focus on O(N) commands such as KEYS, HGETALL and SMEMBERS and on big-key operations, switching to SCAN or batched processing;
1. Check INFO persistence to see whether an RDB/AOF rewrite fork is causing the stall;
1. Check whether the host CPU is saturated or the machine is swapping.

### High Redis memory usage rate - exporter

Warning · 1m · Trigger:

```promql
redis_memory_max_bytes > 0 and (redis_memory_used_bytes / redis_memory_max_bytes) > 0.85
```

Runbook:

1. Check used_memory_rss and the fragmentation ratio mem_fragmentation_ratio in INFO memory — enable activedefrag if fragmentation is high;
1. Use redis-cli --bigkeys / --memkeys to find big keys and split them or add TTLs;
1. Check whether keys without an expiry are piling up;
1. Confirm maxmemory-policy, then scale up memory or shard as needed.

### Low Redis hit rate - exporter

Warning · 1m · Trigger:

```promql
rate(redis_keyspace_hits_total[5m])
/
(rate(redis_keyspace_misses_total[5m]) + rate(redis_keyspace_hits_total[5m]))
< 0.9
```

Runbook:

1. First rule out a cold start after a restart or scale-out (check redis_uptime_in_seconds);
1. Compare the growth of keyspace_hits and keyspace_misses in INFO stats to tell unwarmed new keys apart from heavy eviction;
1. If an eviction alert fired at the same time, treat it as insufficient memory (scale up or clean up big keys);
1. Review the cache key design and whether the TTL is too short on the application side.

### Redis connection refused - exporter

Warning · — · Trigger:

```promql
(rate(redis_rejected_connections_total[5m])) > 0
```

Runbook:

1. Compare connected_clients from INFO clients against CONFIG GET maxclients;
1. Use CLIENT LIST grouped by source address to find the application leaking connections;
1. As an emergency measure run CONFIG SET maxclients \<larger value>, confirming the system ulimit -n is high enough;
1. For the root cause, cap the application connection pool and enable connection reuse.

### Redis has just been restarted, please be aware - exporter

Info · — · Trigger:

```promql
redis_uptime_in_seconds < 600
```

Runbook:

1. Check the Redis log to tell an OOM kill, a crash and a manual restart apart;
1. If the system OOM killer was involved, compare maxmemory against free host memory and lower maxmemory;
1. Confirm the RDB/AOF loaded correctly and the data is complete (check rdb_last_load_keys_loaded in INFO persistence);
1. After the restart, watch the hit rate and the backend database load, and warm the cache if needed.

## Categraf (5)

For hosts and instances collected by Categraf; metric names follow Categraf plugins.

### High Redis eviction rate

Warning · 1m · Trigger:

```promql
rate(redis_evicted_keys[5m]) / sum without (db) (redis_keyspace_keys) > 0.1
```

Runbook:

1. Use INFO memory to compare used_memory against maxmemory and confirm whether it has topped out;
1. Use redis-cli --bigkeys to find abnormally large keys and clean up or split them;
1. Confirm maxmemory-policy matches expectations (allkeys-lru for a pure cache; data you cannot afford to lose must not be left evictable);
1. If capacity is genuinely insufficient, scale up memory or shard.

### High Redis memory usage rate

Warning · 1m · Trigger:

```promql
redis_maxmemory > 0 and (redis_used_memory / redis_maxmemory) > 0.85
```

Runbook:

1. Check used_memory_rss and the fragmentation ratio mem_fragmentation_ratio in INFO memory — enable activedefrag if fragmentation is high;
1. Use redis-cli --bigkeys / --memkeys to find big keys and split them or add TTLs;
1. Check whether keys without an expiry are piling up;
1. Confirm maxmemory-policy, then scale up memory or shard as needed.

### High Redis Ping latency (above 100 milliseconds)

Warning · 1m · Trigger:

```promql
redis_ping_use_seconds > 0.1
```

Runbook:

1. Use redis-cli --latency and SLOWLOG GET 10 to check whether slow commands (KEYS, HGETALL, big-key operations) are blocking the main thread;
1. Check INFO persistence to see whether an RDB/AOF rewrite fork is causing the stall;
1. Check whether the host CPU is saturated or the machine is swapping;
1. Once you find the slow command, replace it with SCAN or batched operations.

### Low Redis hit rate

Warning · 1m · Trigger:

```promql
rate(redis_keyspace_hits[5m])
/
(rate(redis_keyspace_misses[5m]) + rate(redis_keyspace_hits[5m]))
< 0.9
```

Runbook:

1. First rule out a cold start after a restart or scale-out (check redis_uptime_in_seconds);
1. Compare the growth of keyspace_hits and keyspace_misses in INFO stats to tell unwarmed new keys apart from heavy eviction;
1. If an eviction alert fired at the same time, treat it as insufficient memory (scale up or clean up big keys);
1. Review the cache key design and whether the TTL is too short on the application side.

### Redis connection refused

Warning · — · Trigger:

```promql
(rate(redis_rejected_connections[5m])) > 0
```

Runbook:

1. Compare connected_clients from INFO clients against CONFIG GET maxclients;
1. Use CLIENT LIST grouped by source address to find the application leaking connections;
1. As an emergency measure run CONFIG SET maxclients \<larger value>, confirming the system ulimit -n is high enough;
1. For the root cause, cap the application connection pool and enable connection reuse.

## How to use these rules

- **With Prometheus or vmalert**: download [`redis.yml`](pathname:///alert-rules/redis.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
- **With Nightingale**: the same rules ship in the [Redis](/integrations/redis) integration template. Open the integration center, [import the rules into a business group](/docs/data/integrations/import), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license

The runbook steps and the remaining rules come from Nightingale's integration templates ([Redis](https://github.com/ccfos/nightingale/tree/main/integrations/Redis), Apache-2.0). Corrections are welcome as pull requests there.

## Related

- [Monitor Redis with Nightingale](/integrations/redis): collector config, dashboards and metric reference
- [Write a metric rule in Nightingale](/docs/alerting/metric-rules)
- [All alert rules](/alert-rules)
