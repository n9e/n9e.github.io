---
title: "Monitor Elasticsearch with Nightingale"
sidebar_label: "Elasticsearch"
description: "Collects cluster health, node JVM, thread pools, index and shard state through Elasticsearch's own HTTP API; one node is enough to see the whole cluster on small deployments."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch
toc_max_heading_level: 2
mdx:
  format: md
---

Elasticsearch exposes its state over HTTP JSON. The input reads `_cluster/health`, `_cluster/stats`, `_nodes/stats` and index statistics: cluster colour, unassigned shards, node JVM heap and GC, circuit breakers, thread pool rejections, indexing and search latency, and disk watermarks.

On a small cluster set `local = false` and scrape any one node to get data for all of them; on a large cluster run Categraf on every node with `local = true`. Dashboards come in Categraf and elasticsearch_exporter editions; the rules cover the cluster turning yellow or red, unassigned shards, JVM heap near the limit, thread pool rejections and disk watermarks.

## What's in the template

- **5 dashboards**, 307 panels in total
- **22 alert rules**, each with runbook steps
- **30 metric descriptions**
- **Categraf collector config**: `input.elasticsearch`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.elasticsearch/elasticsearch.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.elasticsearch started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   ############################################################################
   # !!! uncomment [[instances]] to enable this plugin
   [[instances]]
   # # interval = global.interval * interval_times
   # interval_times = 1

   # append some labels to metrics
   # labels = { cluster="cloud-n9e-es" }

   ## specify a list of one or more Elasticsearch servers
   # servers = ["http://localhost:9200"]
   servers = []

   ## Timeout for HTTP requests to the elastic search server(s)
   http_timeout = "10s"

   # either /_nodes/stats or /_nodes/_local/stats depending on this setting
   local = false

   ## Set cluster_health to true when you want to obtain cluster health stats
   cluster_health = true

   ## Adjust cluster_health_level when you want to obtain detailed health stats
   ## The options are
   ##  - indices (default)
   ##  - cluster
   cluster_health_level = "cluster"

   ## Set cluster_stats to true when you want to obtain cluster stats.
   cluster_stats = true

   ## Indices to collect; can be one or more indices names or _all
   ## Use of wildcards is allowed. Use a wildcard at the end to retrieve index names that end with a changing value, like a date.
   # indices_include = ["zipkin*"]

   ## use "shards" or blank string for indices level
   indices_level = ""

   ## node_stats is a list of sub-stats that you want to have gathered. Valid options
   ## are "indices", "os", "process", "jvm", "thread_pool", "fs", "transport", "http",
   ## "breaker". Per default, all stats are gathered.
   node_stats = ["jvm", "breaker", "process", "os", "fs", "indices", "thread_pool", "transport"]

   ## HTTP Basic Authentication username and password.
   username = "elastic"
   password = "password"

   ## Optional TLS Config
   # use_tls = false
   # tls_ca = "/etc/categraf/ca.pem"
   # tls_cert = "/etc/categraf/cert.pem"
   # tls_key = "/etc/categraf/key.pem"
   ## Use TLS but skip chain & host verification
   # insecure_skip_verify = true

   ## Sets the number of most recent indices to return for indices that are configured with a date-stamped suffix.
   ## Each 'indices_include' entry ending with a wildcard (*) or glob matching pattern will group together all indices that match it, and 
   ## sort them by the date or number after the wildcard. Metrics then are gathered for only the 'num_most_recent_indices' amount of most 
   ## recent indices.
   num_most_recent_indices = 1
   ```

1. Open the integration center in Nightingale, find Elasticsearch, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| ElasticSearch | 53 |
| Elasticsearch Dashboard | 54 |
| ElasticSearch, group by service | 53 |
| ElasticSearch, group by cluster | 53 |
| ElasticSearch By Exporter | 94 |

## Bundled alert rules

22 rules, disabled on import so you can enable them one by one with your own thresholds. The PromQL condition and runbook steps for every rule are in the alert rule library: [Elasticsearch alert rules](/alert-rules/elasticsearch).

| Rule | Severity | For |
| --- | --- | --- |
| Elastic Cluster Red status | S1 Critical | — |
| Elastic Cluster Yellow status | S2 Warning | — |
| Elasticsearch disk out of space of the instance | S1 Critical | 2m |
| Elasticsearch disk space low of the instance | S2 Warning | 2m |
| Elasticsearch Heap Usage Too High of the instance | S1 Critical | 2m |
| Elasticsearch Heap Usage warning of the instance | S2 Warning | 2m |
| Elasticsearch initializing shards of the instance | S2 Warning | 15m |
| Elasticsearch no new documents of the instance | S2 Warning | 5m |
| Elasticsearch pending tasks of the instance | S2 Warning | 15m |
| Elasticsearch relocation shards of the instance | S2 Warning | 15m |
| Elasticsearch unassigned shards of the instance | S1 Critical | — |
| Elastic Cluster Red status | S1 Critical | — |
| Elastic Cluster Yellow status | S2 Warning | — |
| Elasticsearch disk out of space of the instance | S1 Critical | 2m |
| Elasticsearch disk space low of the instance | S2 Warning | 2m |
| Elasticsearch Heap Usage Too High of the instance | S1 Critical | 2m |
| Elasticsearch Heap Usage warning of the instance | S2 Warning | 2m |
| Elasticsearch initializing shards of the instance | S2 Warning | 15m |
| Elasticsearch no new documents of the instance | S2 Warning | 5m |
| Elasticsearch pending tasks of the instance | S2 Warning | 15m |
| Elasticsearch relocation shards of the instance | S2 Warning | 15m |
| Elasticsearch unassigned shards of the instance | S1 Critical | — |

## Metric reference

30 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `elasticsearch_cluster_health_delayed_unassigned_shards` | Number of Cluster Health delayed unassigned shards | count |
| `elasticsearch_cluster_health_number_of_pending_tasks` | Cluster Health Pending tasks quantity |  |
| `elasticsearch_cluster_health_relocating_shards` | Number of shards for Cluster Health relocating | count |
| `elasticsearch_cluster_health_unassigned_shards` | Cluster Health unassigned number of shards | count |
| `elasticsearch_cluster_health_status_code` | Cluster Health health status code — -1: Green, Green state, indicating that all shards are normal; 2: Yellow, Yellow state, the main shard is normal, the slave shard is abnormal; 3: Red, Red state, some main shards are abnormal |  |
| `elasticsearch_cluster_health_number_of_data_nodes` | Number of Cluster Health data nodes |  |
| `elasticsearch_cluster_health_initializing_shards` | Number of shards being initialized by Cluster Health | count |
| `elasticsearch_cluster_health_active_primary_shards` | Cluster Health Number of active primary shards | count |
| `elasticsearch_cluster_health_active_shards` | Cluster Health Active Shards | count |
| `elasticsearch_cluster_health_number_of_nodes` | Number of Cluster Health nodes |  |
| `irate(elasticsearch_indices_indexing_index_time_in_millis[3m]) / irate(elasticsearch_indices_indexing_index_total[3m])` | Indexing average time consumption | ms |
| `irate(elasticsearch_indices_merges_total_time_in_millis[3m]) / irate(elasticsearch_indices_merges_total[3m])` | Average time consumed by Merge | ms |
| `irate(elasticsearch_indices_search_query_time_in_millis[3m]) / irate(elasticsearch_indices_search_query_total[3m])` | Query average time consumption | ms |
| `irate(elasticsearch_indices_indexing_index_total[3m])` | indexing per second | count |
| `irate(elasticsearch_indices_merges_total_size_in_bytes[3m])` | merge size per second | bytes/s |
| `irate(elasticsearch_indices_merges_total_docs[3m])` | Number of merges per second | count |
| `irate(elasticsearch_indices_docs_deleted[3m])` | Number of docs deleted per second | count |
| `100 - 100 * elasticsearch_fs_total_available_in_bytes / elasticsearch_fs_total_total_in_bytes` | Hard Drive Usage | % |
| `irate(elasticsearch_transport_rx_size_in_bytes[3m])` | Network traffic-inbound traffic per second | bytes/s |
| `irate(elasticsearch_transport_tx_size_in_bytes[3m])` | Network traffic-outbound traffic per second | bytes/s |
| `elasticsearch_process_cpu_percent` | Process CPU usage | % |
| `elasticsearch_jvm_mem_heap_used_percent` | Process JVM Heap Usage | % |
| `elasticsearch_jvm_mem_heap_committed_in_bytes` | Process JVM Heap area committed size | bytes |
| `elasticsearch_jvm_mem_non_heap_committed_in_bytes` | Process JVM Non Heap area committed size | bytes |
| `elasticsearch_jvm_mem_pools_old_used_in_bytes` | Process JVM Old memory pool used size | bytes |
| `elasticsearch_jvm_mem_pools_young_used_in_bytes` | Process JVM Young memory pool used size | bytes |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_count[3m])` | Number of GCs per second for the new generation of the process |  |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_time_in_millis[3m])` | Process new generation time per second GC | ms |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_count[3m])` | Number of GCs per second of process old generation |  |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_time_in_millis[3m])` | Process old generation GC time per second | ms |

## Related

- [Elasticsearch template source](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `elasticsearch` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/elasticsearch): every config option and the full metric list.
- [Use Elasticsearch as a log data source](/docs/data/elasticsearch)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
