# Elasticsearch alert rules for Prometheus: 11 rules with runbooks

11 ready-to-use Elasticsearch alert rules in PromQL, each with severity, duration and runbook steps. Metrics from elasticsearch\_exporter, Categraf. Download as a Prometheus rules file or import into Nightingale.

Last reviewed 2026-10-31

Elasticsearch alert rules for cluster health turning yellow or red, JVM heap usage climbing, disk space running low or out, unassigned, initializing and relocating shards, pending cluster tasks, and an index that has stopped receiving new documents. The exporter group uses prometheus-community/elasticsearch\_exporter metric names; the Categraf group runs the same checks on Categraf-collected metrics.

## At a glance[​](#at-a-glance "Direct link to At a glance")

* **11 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
* **Metrics from**: elasticsearch\_exporter, Categraf
* **Download**: [`elasticsearch.yml`](https://n9e.github.io/alert-rules/elasticsearch.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
* Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list[​](#rule-list "Direct link to Rule list")

| Rule                                              | Severity | For |
| ------------------------------------------------- | -------- | --- |
| Elastic Cluster Red status                        | Critical | —   |
| Elastic Cluster Yellow status                     | Warning  | —   |
| Elasticsearch disk out of space of the instance   | Critical | 2m  |
| Elasticsearch disk space low of the instance      | Warning  | 2m  |
| Elasticsearch Heap Usage Too High of the instance | Critical | 2m  |
| Elasticsearch Heap Usage warning of the instance  | Warning  | 2m  |
| Elasticsearch initializing shards of the instance | Warning  | 15m |
| Elasticsearch no new documents of the instance    | Warning  | 5m  |
| Elasticsearch pending tasks of the instance       | Warning  | 15m |
| Elasticsearch relocation shards of the instance   | Warning  | 15m |
| Elasticsearch unassigned shards of the instance   | Critical | —   |

## Prometheus exporter (11)[​](#prometheus-exporter-11 "Direct link to Prometheus exporter (11)")

All rules in this group also apply unchanged to instances collected by Categraf, which produces the same metric names.

### Elastic Cluster Red status[​](#elastic-cluster-red-status "Direct link to Elastic Cluster Red status")

Critical · — · Trigger:

```
elasticsearch_cluster_health_status{color="red"} == 1
```

Runbook:

1. Run GET \_cluster/health?level=indices to find the indices that are red;
2. Run GET \_cluster/allocation/explain to see exactly why the primary shard cannot be allocated;
3. The usual cause is a node dropping out — bring the node back so shards recover automatically;
4. If the node's data is genuinely corrupted, restore the index from a snapshot with POST \_snapshot/\<repo>/\<snap>/\_restore.

### Elastic Cluster Yellow status[​](#elastic-cluster-yellow-status "Direct link to Elastic Cluster Yellow status")

Warning · — · Trigger:

```
elasticsearch_cluster_health_status{color="yellow"} == 1
```

Runbook:

1. Run GET \_cluster/allocation/explain to find why the replica shards cannot be allocated;
2. On a single-node cluster, set the index replica count to 0: PUT \<index>/\_settings {"index.number\_of\_replicas":0};
3. On a multi-node cluster, check whether a node dropped out or a disk watermark is blocking allocation;
4. Once handled, confirm the health goes back to green.

### Elasticsearch disk out of space of the instance[​](#elasticsearch-disk-out-of-space-of-the-instance "Direct link to Elasticsearch disk out of space of the instance")

Critical · 2m · Trigger:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

Runbook:

1. Run GET \_cat/allocation?v to find the nodes that are short on disk;
2. Delete or archive expired indices (DELETE \<index>), or use ILM to move cold data to cold nodes;
3. After freeing disk, lift the read-only block by hand: PUT \_all/\_settings {"index.blocks.read\_only\_allow\_delete":null};
4. Longer term, expand the disk or add data nodes.

### Elasticsearch disk space low of the instance[​](#elasticsearch-disk-space-low-of-the-instance "Direct link to Elasticsearch disk space low of the instance")

Warning · 2m · Trigger:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

Runbook:

1. Run GET \_cat/allocation?v to check the disk watermark on each node;
2. Clean up expired indices or adjust the ILM policy to roll data to cold nodes earlier;
3. Review whether the cluster.routing.allocation.disk.watermark.\* thresholds match your actual capacity;
4. Schedule expansion early so it never drops to flood stage and turns indices read-only.

### Elasticsearch Heap Usage Too High of the instance[​](#elasticsearch-heap-usage-too-high-of-the-instance "Direct link to Elasticsearch Heap Usage Too High of the instance")

Critical · 2m · Trigger:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

Runbook:

1. Run GET \_nodes/stats/jvm to identify which node is under heap pressure;
2. Run GET \_cat/indices?v\&s=store.size:desc to find the largest indices and close or archive the unused ones;
3. Run GET \_tasks?actions=*search*\&detailed to find large aggregations or deep pagination queries and cancel them;
4. Longer term, set the heap to half of physical memory (never above 31G), or add nodes to spread the load.

### Elasticsearch Heap Usage warning of the instance[​](#elasticsearch-heap-usage-warning-of-the-instance "Direct link to Elasticsearch Heap Usage warning of the instance")

Warning · 2m · Trigger:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

Runbook:

1. Compare against elasticsearch\_jvm\_gc\_collection\_seconds\_count to see whether old GC is becoming more frequent;
2. Run GET \_cat/indices?v\&s=store.size:desc to check whether any index has grown sharply recently;
3. Run GET \_nodes/stats/indices/fielddata to inspect fielddata and query cache usage;
4. Plan capacity or cleanup ahead of time so it does not climb to 90% and trigger full GC.

### Elasticsearch initializing shards of the instance[​](#elasticsearch-initializing-shards-of-the-instance "Direct link to Elasticsearch initializing shards of the instance")

Warning · 15m · Trigger:

```
elasticsearch_cluster_health_initializing_shards > 0
```

Runbook:

1. Run GET \_cat/recovery?v\&active\_only=true to see whether recovery is still making progress;
2. If it is stuck, run GET \_cluster/allocation/explain to find the reason (insufficient disk, saturated node bandwidth);
3. Temporarily raise indices.recovery.max\_bytes\_per\_sec if the recovery throttle is the bottleneck;
4. Confirm no node is repeatedly dropping out and causing shards to be rebuilt over and over.

### Elasticsearch no new documents of the instance[​](#elasticsearch-no-new-documents-of-the-instance "Direct link to Elasticsearch no new documents of the instance")

Warning · 5m · Trigger:

```
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

Runbook:

1. First confirm this cluster is genuinely expected to receive continuous writes, otherwise disable this rule;
2. Check that the upstream writers (Filebeat/Logstash/application bulk clients) are alive and whether their logs show rejected bulk requests;
3. Run GET \_cat/thread\_pool/write?v to see whether the write thread pool's rejected counter is growing;
4. Confirm the indices have not been made read-only (a disk watermark triggers read\_only\_allow\_delete).

### Elasticsearch pending tasks of the instance[​](#elasticsearch-pending-tasks-of-the-instance "Direct link to Elasticsearch pending tasks of the instance")

Warning · 15m · Trigger:

```
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

Runbook:

1. Run GET \_cluster/pending\_tasks to see the queued tasks and their priorities;
2. Run GET \_cat/master?v to confirm the master is not flapping;
3. Run GET \_cat/shards to count total shards and check whether a large number of tiny indices is bloating the cluster state;
4. Reduce the shard count (merge small indices, tune ILM) and, if needed, scale the master nodes separately.

### Elasticsearch relocation shards of the instance[​](#elasticsearch-relocation-shards-of-the-instance "Direct link to Elasticsearch relocation shards of the instance")

Warning · 15m · Trigger:

```
elasticsearch_cluster_health_relocating_shards > 0
```

Runbook:

1. Run GET \_cat/recovery?v\&active\_only=true to see whether the relocation is still progressing;
2. If it has stalled, run GET \_cluster/allocation/explain to check whether a disk watermark or an allocation filter is blocking it;
3. Confirm whether someone triggered a large reroute by hand, or whether nodes are joining and leaving;
4. If needed, temporarily raise cluster.routing.allocation.node\_concurrent\_recoveries and the recovery throttle.

### Elasticsearch unassigned shards of the instance[​](#elasticsearch-unassigned-shards-of-the-instance "Direct link to Elasticsearch unassigned shards of the instance")

Critical · — · Trigger:

```
elasticsearch_cluster_health_unassigned_shards > 0
```

Runbook:

1. Run GET \_cluster/allocation/explain to get the exact reason the shards are unassigned;
2. If a node dropped out, bring it back into the cluster first;
3. If the replica count exceeds the number of available nodes, lower index.number\_of\_replicas;
4. If a disk watermark was hit, free disk space first and then run POST \_cluster/reroute?retry\_failed=true.

## How to use these rules[​](#how-to-use-these-rules "Direct link to How to use these rules")

* **With Prometheus or vmalert**: download [`elasticsearch.yml`](https://n9e.github.io/alert-rules/elasticsearch.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
* **With Nightingale**: the same rules ship in the [Elasticsearch](https://n9e.github.io/integrations/elasticsearch.md) integration template. Open the integration center, [import the rules into a business group](https://n9e.github.io/docs/data/integrations/import.md), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The runbook steps and the remaining rules come from Nightingale's integration templates ([Elasticsearch](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch), Apache-2.0). Corrections are welcome as pull requests there.

## Related[​](#related "Direct link to Related")

* [Monitor Elasticsearch with Nightingale](https://n9e.github.io/integrations/elasticsearch.md): collector config, dashboards and metric reference
* [Write a metric rule in Nightingale](https://n9e.github.io/docs/alerting/metric-rules.md)
* [All alert rules](https://n9e.github.io/alert-rules.md)
