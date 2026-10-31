---
title: "Elasticsearch alert rules for Prometheus: 11 rules with runbooks"
sidebar_label: "Elasticsearch"
sidebar_position: 6
description: "11 ready-to-use Elasticsearch alert rules in PromQL, each with severity, duration and runbook steps. Metrics from elasticsearch_exporter, Categraf. Download as a Prometheus rules file or import into Nightingale."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch
toc_max_heading_level: 2
mdx:
  format: md
---

Elasticsearch alert rules for cluster health turning yellow or red, JVM heap usage climbing, disk space running low or out, unassigned, initializing and relocating shards, pending cluster tasks, and an index that has stopped receiving new documents. The exporter group uses prometheus-community/elasticsearch_exporter metric names; the Categraf group runs the same checks on Categraf-collected metrics.

## At a glance

- **11 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
- **Metrics from**: elasticsearch_exporter, Categraf
- **Download**: [`elasticsearch.yml`](pathname:///alert-rules/elasticsearch.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
- Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list

| Rule | Severity | For |
| --- | --- | --- |
| Elastic Cluster Red status | Critical | — |
| Elastic Cluster Yellow status | Warning | — |
| Elasticsearch disk out of space of the instance | Critical | 2m |
| Elasticsearch disk space low of the instance | Warning | 2m |
| Elasticsearch Heap Usage Too High of the instance | Critical | 2m |
| Elasticsearch Heap Usage warning of the instance | Warning | 2m |
| Elasticsearch initializing shards of the instance | Warning | 15m |
| Elasticsearch no new documents of the instance | Warning | 5m |
| Elasticsearch pending tasks of the instance | Warning | 15m |
| Elasticsearch relocation shards of the instance | Warning | 15m |
| Elasticsearch unassigned shards of the instance | Critical | — |

## Prometheus exporter (11)

All rules in this group also apply unchanged to instances collected by Categraf, which produces the same metric names.

### Elastic Cluster Red status

Critical · — · Trigger:

```promql
elasticsearch_cluster_health_status{color="red"} == 1
```

Runbook:

1. Run GET _cluster/health?level=indices to find the indices that are red;
1. Run GET _cluster/allocation/explain to see exactly why the primary shard cannot be allocated;
1. The usual cause is a node dropping out — bring the node back so shards recover automatically;
1. If the node's data is genuinely corrupted, restore the index from a snapshot with POST _snapshot/\<repo>/\<snap>/_restore.

### Elastic Cluster Yellow status

Warning · — · Trigger:

```promql
elasticsearch_cluster_health_status{color="yellow"} == 1
```

Runbook:

1. Run GET _cluster/allocation/explain to find why the replica shards cannot be allocated;
1. On a single-node cluster, set the index replica count to 0: PUT \<index>/_settings \{"index.number_of_replicas":0\};
1. On a multi-node cluster, check whether a node dropped out or a disk watermark is blocking allocation;
1. Once handled, confirm the health goes back to green.

### Elasticsearch disk out of space of the instance

Critical · 2m · Trigger:

```promql
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

Runbook:

1. Run GET _cat/allocation?v to find the nodes that are short on disk;
1. Delete or archive expired indices (DELETE \<index>), or use ILM to move cold data to cold nodes;
1. After freeing disk, lift the read-only block by hand: PUT _all/_settings \{"index.blocks.read_only_allow_delete":null\};
1. Longer term, expand the disk or add data nodes.

### Elasticsearch disk space low of the instance

Warning · 2m · Trigger:

```promql
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

Runbook:

1. Run GET _cat/allocation?v to check the disk watermark on each node;
1. Clean up expired indices or adjust the ILM policy to roll data to cold nodes earlier;
1. Review whether the cluster.routing.allocation.disk.watermark.* thresholds match your actual capacity;
1. Schedule expansion early so it never drops to flood stage and turns indices read-only.

### Elasticsearch Heap Usage Too High of the instance

Critical · 2m · Trigger:

```promql
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

Runbook:

1. Run GET _nodes/stats/jvm to identify which node is under heap pressure;
1. Run GET _cat/indices?v&s=store.size:desc to find the largest indices and close or archive the unused ones;
1. Run GET _tasks?actions=*search*&detailed to find large aggregations or deep pagination queries and cancel them;
1. Longer term, set the heap to half of physical memory (never above 31G), or add nodes to spread the load.

### Elasticsearch Heap Usage warning of the instance

Warning · 2m · Trigger:

```promql
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

Runbook:

1. Compare against elasticsearch_jvm_gc_collection_seconds_count to see whether old GC is becoming more frequent;
1. Run GET _cat/indices?v&s=store.size:desc to check whether any index has grown sharply recently;
1. Run GET _nodes/stats/indices/fielddata to inspect fielddata and query cache usage;
1. Plan capacity or cleanup ahead of time so it does not climb to 90% and trigger full GC.

### Elasticsearch initializing shards of the instance

Warning · 15m · Trigger:

```promql
elasticsearch_cluster_health_initializing_shards > 0
```

Runbook:

1. Run GET _cat/recovery?v&active_only=true to see whether recovery is still making progress;
1. If it is stuck, run GET _cluster/allocation/explain to find the reason (insufficient disk, saturated node bandwidth);
1. Temporarily raise indices.recovery.max_bytes_per_sec if the recovery throttle is the bottleneck;
1. Confirm no node is repeatedly dropping out and causing shards to be rebuilt over and over.

### Elasticsearch no new documents of the instance

Warning · 5m · Trigger:

```promql
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

Runbook:

1. First confirm this cluster is genuinely expected to receive continuous writes, otherwise disable this rule;
1. Check that the upstream writers (Filebeat/Logstash/application bulk clients) are alive and whether their logs show rejected bulk requests;
1. Run GET _cat/thread_pool/write?v to see whether the write thread pool's rejected counter is growing;
1. Confirm the indices have not been made read-only (a disk watermark triggers read_only_allow_delete).

### Elasticsearch pending tasks of the instance

Warning · 15m · Trigger:

```promql
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

Runbook:

1. Run GET _cluster/pending_tasks to see the queued tasks and their priorities;
1. Run GET _cat/master?v to confirm the master is not flapping;
1. Run GET _cat/shards to count total shards and check whether a large number of tiny indices is bloating the cluster state;
1. Reduce the shard count (merge small indices, tune ILM) and, if needed, scale the master nodes separately.

### Elasticsearch relocation shards of the instance

Warning · 15m · Trigger:

```promql
elasticsearch_cluster_health_relocating_shards > 0
```

Runbook:

1. Run GET _cat/recovery?v&active_only=true to see whether the relocation is still progressing;
1. If it has stalled, run GET _cluster/allocation/explain to check whether a disk watermark or an allocation filter is blocking it;
1. Confirm whether someone triggered a large reroute by hand, or whether nodes are joining and leaving;
1. If needed, temporarily raise cluster.routing.allocation.node_concurrent_recoveries and the recovery throttle.

### Elasticsearch unassigned shards of the instance

Critical · — · Trigger:

```promql
elasticsearch_cluster_health_unassigned_shards > 0
```

Runbook:

1. Run GET _cluster/allocation/explain to get the exact reason the shards are unassigned;
1. If a node dropped out, bring it back into the cluster first;
1. If the replica count exceeds the number of available nodes, lower index.number_of_replicas;
1. If a disk watermark was hit, free disk space first and then run POST _cluster/reroute?retry_failed=true.

## How to use these rules

- **With Prometheus or vmalert**: download [`elasticsearch.yml`](pathname:///alert-rules/elasticsearch.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page.
- **With Nightingale**: the same rules ship in the [Elasticsearch](/integrations/elasticsearch) integration template. Open the integration center, [import the rules into a business group](/docs/data/integrations/import), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license

The runbook steps and the remaining rules come from Nightingale's integration templates ([Elasticsearch](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch), Apache-2.0). Corrections are welcome as pull requests there.

## Related

- [Monitor Elasticsearch with Nightingale](/integrations/elasticsearch): collector config, dashboards and metric reference
- [Write a metric rule in Nightingale](/docs/alerting/metric-rules)
- [All alert rules](/alert-rules)
