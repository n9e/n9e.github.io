# Monitor Elasticsearch with Nightingale

Collects cluster health, node JVM, thread pools, index and shard state through Elasticsearch's own HTTP API; one node is enough to see the whole cluster on small deployments.

Last reviewed 2026-10-27

Elasticsearch exposes its state over HTTP JSON. The input reads `_cluster/health`, `_cluster/stats`, `_nodes/stats` and index statistics: cluster colour, unassigned shards, node JVM heap and GC, circuit breakers, thread pool rejections, indexing and search latency, and disk watermarks.

On a small cluster set `local = false` and scrape any one node to get data for all of them; on a large cluster run Categraf on every node with `local = true`. Dashboards come in Categraf and elasticsearch\_exporter editions; the rules cover the cluster turning yellow or red, unassigned shards, JVM heap near the limit, thread pool rejections and disk watermarks.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 dashboards**, 307 panels in total
* **22 alert rules**, each with runbook steps
* **30 metric descriptions**
* **Categraf collector config**: `input.elasticsearch`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.elasticsearch/elasticsearch.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.elasticsearch started` once the plugin is loaded.

   ```
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

2. Open the integration center in Nightingale, find Elasticsearch, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                       | Panels |
| ------------------------------- | ------ |
| ElasticSearch                   | 53     |
| Elasticsearch Dashboard         | 54     |
| ElasticSearch, group by service | 53     |
| ElasticSearch, group by cluster | 53     |
| ElasticSearch By Exporter       | 94     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

22 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (11)[​](#collected-by-categraf-11 "Direct link to Collected by Categraf (11)")

#### Elastic Cluster Red status[​](#elastic-cluster-red-status "Direct link to Elastic Cluster Red status")

S1 Critical · Trigger:

```
 elasticsearch_cluster_health_status{color="red"} == 1
```

Runbook:

1. Run GET \_cluster/health?level=indices to find the indices that are red;
2. Run GET \_cluster/allocation/explain to see exactly why the primary shard cannot be allocated;
3. The usual cause is a node dropping out — bring the node back so shards recover automatically;
4. If the node's data is genuinely corrupted, restore the index from a snapshot with POST \_snapshot/\<repo>/\<snap>/\_restore.

#### Elastic Cluster Yellow status[​](#elastic-cluster-yellow-status "Direct link to Elastic Cluster Yellow status")

S2 Warning · Trigger:

```
elasticsearch_cluster_health_status{color="yellow"} == 1
```

Runbook:

1. Run GET \_cluster/allocation/explain to find why the replica shards cannot be allocated;
2. On a single-node cluster, set the index replica count to 0: PUT \<index>/\_settings {"index.number\_of\_replicas":0};
3. On a multi-node cluster, check whether a node dropped out or a disk watermark is blocking allocation;
4. Once handled, confirm the health goes back to green.

#### Elasticsearch disk out of space of the instance[​](#elasticsearch-disk-out-of-space-of-the-instance "Direct link to Elasticsearch disk out of space of the instance")

S1 Critical · for 2 min · Trigger:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

Runbook:

1. Run GET \_cat/allocation?v to find the nodes that are short on disk;
2. Delete or archive expired indices (DELETE \<index>), or use ILM to move cold data to cold nodes;
3. After freeing disk, lift the read-only block by hand: PUT \_all/\_settings {"index.blocks.read\_only\_allow\_delete":null};
4. Longer term, expand the disk or add data nodes.

#### Elasticsearch disk space low of the instance[​](#elasticsearch-disk-space-low-of-the-instance "Direct link to Elasticsearch disk space low of the instance")

S2 Warning · for 2 min · Trigger:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

Runbook:

1. Run GET \_cat/allocation?v to check the disk watermark on each node;
2. Clean up expired indices or adjust the ILM policy to roll data to cold nodes earlier;
3. Review whether the cluster.routing.allocation.disk.watermark.\* thresholds match your actual capacity;
4. Schedule expansion early so it never drops to flood stage and turns indices read-only.

#### Elasticsearch Heap Usage Too High of the instance[​](#elasticsearch-heap-usage-too-high-of-the-instance "Direct link to Elasticsearch Heap Usage Too High of the instance")

S1 Critical · for 2 min · Trigger:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

Runbook:

1. Run GET \_nodes/stats/jvm to identify which node is under heap pressure;
2. Run GET \_cat/indices?v\&s=store.size:desc to find the largest indices and close or archive the unused ones;
3. Run GET \_tasks?actions=*search*\&detailed to find large aggregations or deep pagination queries and cancel them;
4. Longer term, set the heap to half of physical memory (never above 31G), or add nodes to spread the load.

#### Elasticsearch Heap Usage warning of the instance[​](#elasticsearch-heap-usage-warning-of-the-instance "Direct link to Elasticsearch Heap Usage warning of the instance")

S2 Warning · for 2 min · Trigger:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

Runbook:

1. Compare against elasticsearch\_jvm\_gc\_collection\_seconds\_count to see whether old GC is becoming more frequent;
2. Run GET \_cat/indices?v\&s=store.size:desc to check whether any index has grown sharply recently;
3. Run GET \_nodes/stats/indices/fielddata to inspect fielddata and query cache usage;
4. Plan capacity or cleanup ahead of time so it does not climb to 90% and trigger full GC.

#### Elasticsearch initializing shards of the instance[​](#elasticsearch-initializing-shards-of-the-instance "Direct link to Elasticsearch initializing shards of the instance")

S2 Warning · for 15 min · Trigger:

```
elasticsearch_cluster_health_initializing_shards > 0
```

Runbook:

1. Run GET \_cat/recovery?v\&active\_only=true to see whether recovery is still making progress;
2. If it is stuck, run GET \_cluster/allocation/explain to find the reason (insufficient disk, saturated node bandwidth);
3. Temporarily raise indices.recovery.max\_bytes\_per\_sec if the recovery throttle is the bottleneck;
4. Confirm no node is repeatedly dropping out and causing shards to be rebuilt over and over.

#### Elasticsearch no new documents of the instance[​](#elasticsearch-no-new-documents-of-the-instance "Direct link to Elasticsearch no new documents of the instance")

S2 Warning · for 5 min · Trigger:

```
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

Runbook:

1. First confirm this cluster is genuinely expected to receive continuous writes, otherwise disable this rule;
2. Check that the upstream writers (Filebeat/Logstash/application bulk clients) are alive and whether their logs show rejected bulk requests;
3. Run GET \_cat/thread\_pool/write?v to see whether the write thread pool's rejected counter is growing;
4. Confirm the indices have not been made read-only (a disk watermark triggers read\_only\_allow\_delete).

#### Elasticsearch pending tasks of the instance[​](#elasticsearch-pending-tasks-of-the-instance "Direct link to Elasticsearch pending tasks of the instance")

S2 Warning · for 15 min · Trigger:

```
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

Runbook:

1. Run GET \_cluster/pending\_tasks to see the queued tasks and their priorities;
2. Run GET \_cat/master?v to confirm the master is not flapping;
3. Run GET \_cat/shards to count total shards and check whether a large number of tiny indices is bloating the cluster state;
4. Reduce the shard count (merge small indices, tune ILM) and, if needed, scale the master nodes separately.

#### Elasticsearch relocation shards of the instance[​](#elasticsearch-relocation-shards-of-the-instance "Direct link to Elasticsearch relocation shards of the instance")

S2 Warning · for 15 min · Trigger:

```
elasticsearch_cluster_health_relocating_shards > 0
```

Runbook:

1. Run GET \_cat/recovery?v\&active\_only=true to see whether the relocation is still progressing;
2. If it has stalled, run GET \_cluster/allocation/explain to check whether a disk watermark or an allocation filter is blocking it;
3. Confirm whether someone triggered a large reroute by hand, or whether nodes are joining and leaving;
4. If needed, temporarily raise cluster.routing.allocation.node\_concurrent\_recoveries and the recovery throttle.

#### Elasticsearch unassigned shards of the instance[​](#elasticsearch-unassigned-shards-of-the-instance "Direct link to Elasticsearch unassigned shards of the instance")

S1 Critical · Trigger:

```
elasticsearch_cluster_health_unassigned_shards > 0
```

Runbook:

1. Run GET \_cluster/allocation/explain to get the exact reason the shards are unassigned;
2. If a node dropped out, bring it back into the cluster first;
3. If the replica count exceeds the number of available nodes, lower index.number\_of\_replicas;
4. If a disk watermark was hit, free disk space first and then run POST \_cluster/reroute?retry\_failed=true.

### Collected by an exporter (11)[​](#collected-by-an-exporter-11 "Direct link to Collected by an exporter (11)")

#### Elastic Cluster Red status[​](#elastic-cluster-red-status-1 "Direct link to Elastic Cluster Red status")

S1 Critical · Trigger:

```
 elasticsearch_cluster_health_status{color="red"} == 1
```

Runbook:

1. Run GET \_cluster/health?level=indices to find the indices that are red;
2. Run GET \_cluster/allocation/explain to see exactly why the primary shard cannot be allocated;
3. The usual cause is a node dropping out — bring the node back so shards recover automatically;
4. If the node's data is genuinely corrupted, restore the index from a snapshot with POST \_snapshot/\<repo>/\<snap>/\_restore.

#### Elastic Cluster Yellow status[​](#elastic-cluster-yellow-status-1 "Direct link to Elastic Cluster Yellow status")

S2 Warning · Trigger:

```
elasticsearch_cluster_health_status{color="yellow"} == 1
```

Runbook:

1. Run GET \_cluster/allocation/explain to find why the replica shards cannot be allocated;
2. On a single-node cluster, set the index replica count to 0: PUT \<index>/\_settings {"index.number\_of\_replicas":0};
3. On a multi-node cluster, check whether a node dropped out or a disk watermark is blocking allocation;
4. Once handled, confirm the health goes back to green.

#### Elasticsearch disk out of space of the instance[​](#elasticsearch-disk-out-of-space-of-the-instance-1 "Direct link to Elasticsearch disk out of space of the instance")

S1 Critical · for 2 min · Trigger:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

Runbook:

1. Run GET \_cat/allocation?v to find the nodes that are short on disk;
2. Delete or archive expired indices (DELETE \<index>), or use ILM to move cold data to cold nodes;
3. After freeing disk, lift the read-only block by hand: PUT \_all/\_settings {"index.blocks.read\_only\_allow\_delete":null};
4. Longer term, expand the disk or add data nodes.

#### Elasticsearch disk space low of the instance[​](#elasticsearch-disk-space-low-of-the-instance-1 "Direct link to Elasticsearch disk space low of the instance")

S2 Warning · for 2 min · Trigger:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

Runbook:

1. Run GET \_cat/allocation?v to check the disk watermark on each node;
2. Clean up expired indices or adjust the ILM policy to roll data to cold nodes earlier;
3. Review whether the cluster.routing.allocation.disk.watermark.\* thresholds match your actual capacity;
4. Schedule expansion early so it never drops to flood stage and turns indices read-only.

#### Elasticsearch Heap Usage Too High of the instance[​](#elasticsearch-heap-usage-too-high-of-the-instance-1 "Direct link to Elasticsearch Heap Usage Too High of the instance")

S1 Critical · for 2 min · Trigger:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

Runbook:

1. Run GET \_nodes/stats/jvm to identify which node is under heap pressure;
2. Run GET \_cat/indices?v\&s=store.size:desc to find the largest indices and close or archive the unused ones;
3. Run GET \_tasks?actions=*search*\&detailed to find large aggregations or deep pagination queries and cancel them;
4. Longer term, set the heap to half of physical memory (never above 31G), or add nodes to spread the load.

#### Elasticsearch Heap Usage warning of the instance[​](#elasticsearch-heap-usage-warning-of-the-instance-1 "Direct link to Elasticsearch Heap Usage warning of the instance")

S2 Warning · for 2 min · Trigger:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

Runbook:

1. Compare against elasticsearch\_jvm\_gc\_collection\_seconds\_count to see whether old GC is becoming more frequent;
2. Run GET \_cat/indices?v\&s=store.size:desc to check whether any index has grown sharply recently;
3. Run GET \_nodes/stats/indices/fielddata to inspect fielddata and query cache usage;
4. Plan capacity or cleanup ahead of time so it does not climb to 90% and trigger full GC.

#### Elasticsearch initializing shards of the instance[​](#elasticsearch-initializing-shards-of-the-instance-1 "Direct link to Elasticsearch initializing shards of the instance")

S2 Warning · for 15 min · Trigger:

```
elasticsearch_cluster_health_initializing_shards > 0
```

Runbook:

1. Run GET \_cat/recovery?v\&active\_only=true to see whether recovery is still making progress;
2. If it is stuck, run GET \_cluster/allocation/explain to find the reason (insufficient disk, saturated node bandwidth);
3. Temporarily raise indices.recovery.max\_bytes\_per\_sec if the recovery throttle is the bottleneck;
4. Confirm no node is repeatedly dropping out and causing shards to be rebuilt over and over.

#### Elasticsearch no new documents of the instance[​](#elasticsearch-no-new-documents-of-the-instance-1 "Direct link to Elasticsearch no new documents of the instance")

S2 Warning · for 5 min · Trigger:

```
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

Runbook:

1. First confirm this cluster is genuinely expected to receive continuous writes, otherwise disable this rule;
2. Check that the upstream writers (Filebeat/Logstash/application bulk clients) are alive and whether their logs show rejected bulk requests;
3. Run GET \_cat/thread\_pool/write?v to see whether the write thread pool's rejected counter is growing;
4. Confirm the indices have not been made read-only (a disk watermark triggers read\_only\_allow\_delete).

#### Elasticsearch pending tasks of the instance[​](#elasticsearch-pending-tasks-of-the-instance-1 "Direct link to Elasticsearch pending tasks of the instance")

S2 Warning · for 15 min · Trigger:

```
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

Runbook:

1. Run GET \_cluster/pending\_tasks to see the queued tasks and their priorities;
2. Run GET \_cat/master?v to confirm the master is not flapping;
3. Run GET \_cat/shards to count total shards and check whether a large number of tiny indices is bloating the cluster state;
4. Reduce the shard count (merge small indices, tune ILM) and, if needed, scale the master nodes separately.

#### Elasticsearch relocation shards of the instance[​](#elasticsearch-relocation-shards-of-the-instance-1 "Direct link to Elasticsearch relocation shards of the instance")

S2 Warning · for 15 min · Trigger:

```
elasticsearch_cluster_health_relocating_shards > 0
```

Runbook:

1. Run GET \_cat/recovery?v\&active\_only=true to see whether the relocation is still progressing;
2. If it has stalled, run GET \_cluster/allocation/explain to check whether a disk watermark or an allocation filter is blocking it;
3. Confirm whether someone triggered a large reroute by hand, or whether nodes are joining and leaving;
4. If needed, temporarily raise cluster.routing.allocation.node\_concurrent\_recoveries and the recovery throttle.

#### Elasticsearch unassigned shards of the instance[​](#elasticsearch-unassigned-shards-of-the-instance-1 "Direct link to Elasticsearch unassigned shards of the instance")

S1 Critical · Trigger:

```
elasticsearch_cluster_health_unassigned_shards > 0
```

Runbook:

1. Run GET \_cluster/allocation/explain to get the exact reason the shards are unassigned;
2. If a node dropped out, bring it back into the cluster first;
3. If the replica count exceeds the number of available nodes, lower index.number\_of\_replicas;
4. If a disk watermark was hit, free disk space first and then run POST \_cluster/reroute?retry\_failed=true.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

30 metrics, the ones the dashboards and rules above are built on.

| Metric                                                                                                                   | Meaning                                                                                                                                                                                                                             | Unit    |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `elasticsearch_cluster_health_delayed_unassigned_shards`                                                                 | Number of Cluster Health delayed unassigned shards                                                                                                                                                                                  | count   |
| `elasticsearch_cluster_health_number_of_pending_tasks`                                                                   | Cluster Health Pending tasks quantity                                                                                                                                                                                               |         |
| `elasticsearch_cluster_health_relocating_shards`                                                                         | Number of shards for Cluster Health relocating                                                                                                                                                                                      | count   |
| `elasticsearch_cluster_health_unassigned_shards`                                                                         | Cluster Health unassigned number of shards                                                                                                                                                                                          | count   |
| `elasticsearch_cluster_health_status_code`                                                                               | Cluster Health health status code — -1: Green, Green state, indicating that all shards are normal; 2: Yellow, Yellow state, the main shard is normal, the slave shard is abnormal; 3: Red, Red state, some main shards are abnormal |         |
| `elasticsearch_cluster_health_number_of_data_nodes`                                                                      | Number of Cluster Health data nodes                                                                                                                                                                                                 |         |
| `elasticsearch_cluster_health_initializing_shards`                                                                       | Number of shards being initialized by Cluster Health                                                                                                                                                                                | count   |
| `elasticsearch_cluster_health_active_primary_shards`                                                                     | Cluster Health Number of active primary shards                                                                                                                                                                                      | count   |
| `elasticsearch_cluster_health_active_shards`                                                                             | Cluster Health Active Shards                                                                                                                                                                                                        | count   |
| `elasticsearch_cluster_health_number_of_nodes`                                                                           | Number of Cluster Health nodes                                                                                                                                                                                                      |         |
| `irate(elasticsearch_indices_indexing_index_time_in_millis[3m]) / irate(elasticsearch_indices_indexing_index_total[3m])` | Indexing average time consumption                                                                                                                                                                                                   | ms      |
| `irate(elasticsearch_indices_merges_total_time_in_millis[3m]) / irate(elasticsearch_indices_merges_total[3m])`           | Average time consumed by Merge                                                                                                                                                                                                      | ms      |
| `irate(elasticsearch_indices_search_query_time_in_millis[3m]) / irate(elasticsearch_indices_search_query_total[3m])`     | Query average time consumption                                                                                                                                                                                                      | ms      |
| `irate(elasticsearch_indices_indexing_index_total[3m])`                                                                  | indexing per second                                                                                                                                                                                                                 | count   |
| `irate(elasticsearch_indices_merges_total_size_in_bytes[3m])`                                                            | merge size per second                                                                                                                                                                                                               | bytes/s |
| `irate(elasticsearch_indices_merges_total_docs[3m])`                                                                     | Number of merges per second                                                                                                                                                                                                         | count   |
| `irate(elasticsearch_indices_docs_deleted[3m])`                                                                          | Number of docs deleted per second                                                                                                                                                                                                   | count   |
| `100 - 100 * elasticsearch_fs_total_available_in_bytes / elasticsearch_fs_total_total_in_bytes`                          | Hard Drive Usage                                                                                                                                                                                                                    | %       |
| `irate(elasticsearch_transport_rx_size_in_bytes[3m])`                                                                    | Network traffic-inbound traffic per second                                                                                                                                                                                          | bytes/s |
| `irate(elasticsearch_transport_tx_size_in_bytes[3m])`                                                                    | Network traffic-outbound traffic per second                                                                                                                                                                                         | bytes/s |
| `elasticsearch_process_cpu_percent`                                                                                      | Process CPU usage                                                                                                                                                                                                                   | %       |
| `elasticsearch_jvm_mem_heap_used_percent`                                                                                | Process JVM Heap Usage                                                                                                                                                                                                              | %       |
| `elasticsearch_jvm_mem_heap_committed_in_bytes`                                                                          | Process JVM Heap area committed size                                                                                                                                                                                                | bytes   |
| `elasticsearch_jvm_mem_non_heap_committed_in_bytes`                                                                      | Process JVM Non Heap area committed size                                                                                                                                                                                            | bytes   |
| `elasticsearch_jvm_mem_pools_old_used_in_bytes`                                                                          | Process JVM Old memory pool used size                                                                                                                                                                                               | bytes   |
| `elasticsearch_jvm_mem_pools_young_used_in_bytes`                                                                        | Process JVM Young memory pool used size                                                                                                                                                                                             | bytes   |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_count[3m])`                                                      | Number of GCs per second for the new generation of the process                                                                                                                                                                      |         |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_time_in_millis[3m])`                                             | Process new generation time per second GC                                                                                                                                                                                           | ms      |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_count[3m])`                                                        | Number of GCs per second of process old generation                                                                                                                                                                                  |         |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_time_in_millis[3m])`                                               | Process old generation GC time per second                                                                                                                                                                                           | ms      |

## Related[​](#related "Direct link to Related")

* [Elasticsearch template source](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `elasticsearch` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/elasticsearch): every config option and the full metric list.
* [Use Elasticsearch as a log data source](https://n9e.github.io/docs/data/elasticsearch.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
