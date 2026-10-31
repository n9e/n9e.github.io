---
title: "Elasticsearch 告警规则：11 条 PromQL 规则与处置步骤"
sidebar_label: "Elasticsearch"
sidebar_position: 6
description: "11 条开箱可用的 Elasticsearch 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 elasticsearch_exporter, Categraf。可下载为 Prometheus 规则文件，或导入夜莺。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch
toc_max_heading_level: 2
mdx:
  format: md
---

Elasticsearch 告警规则：集群健康变黄或变红、JVM 堆内存用量过高、磁盘空间不足或耗尽、未分配 / 初始化中 / 迁移中的分片、积压的集群任务，以及索引长时间没有新文档写入。exporter 一组使用 prometheus-community/elasticsearch_exporter 的指标名；Categraf 一组对 Categraf 采集的指标做同样的检查。

## 概览

- **11 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
- **指标来源**：elasticsearch_exporter, Categraf
- **下载**：[`elasticsearch.yml`](pathname:///alert-rules/elasticsearch.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
- 阈值只是起点，启用前请按自己的环境调整。

## 规则一览

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| Elastic Cluster Red status | 紧急 | — |
| Elastic Cluster Yellow status | 警告 | — |
| Elasticsearch disk out of space of the instance | 紧急 | 2 分钟 |
| Elasticsearch disk space low of the instance | 警告 | 2 分钟 |
| Elasticsearch Heap Usage Too High of the instance | 紧急 | 2 分钟 |
| Elasticsearch Heap Usage warning of the instance | 警告 | 2 分钟 |
| Elasticsearch initializing shards of the instance | 警告 | 15 分钟 |
| Elasticsearch no new documents of the instance | 警告 | 5 分钟 |
| Elasticsearch pending tasks of the instance | 警告 | 15 分钟 |
| Elasticsearch relocation shards of the instance | 警告 | 15 分钟 |
| Elasticsearch unassigned shards of the instance | 紧急 | — |

## Prometheus exporter（11）

本组全部规则对用 Categraf 采集的实例同样适用，指标名完全一致。

### Elastic Cluster Red status

紧急 · — · 触发条件:

```promql
elasticsearch_cluster_health_status{color="red"} == 1
```

处置步骤:

1. 用 GET _cluster/health?level=indices 定位处于 red 的索引；
1. 用 GET _cluster/allocation/explain 看主分片无法分配的具体原因；
1. 常见原因是节点掉线，先把节点拉回集群让分片自动恢复；
1. 节点数据确实损坏时，用 POST _snapshot/\<repo>/\<snap>/_restore 从快照恢复该索引。

### Elastic Cluster Yellow status

警告 · — · 触发条件:

```promql
elasticsearch_cluster_health_status{color="yellow"} == 1
```

处置步骤:

1. 用 GET _cluster/allocation/explain 看副本分片无法分配的原因；
1. 单节点集群把索引副本数设为 0：PUT \<index>/_settings \{"index.number_of_replicas":0\}；
1. 多节点集群检查是否有节点掉线、或磁盘触发了 watermark 导致不再分配；
1. 处理完确认 health 回到 green。

### Elasticsearch disk out of space of the instance

紧急 · 2 分钟 · 触发条件:

```promql
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

处置步骤:

1. 用 GET _cat/allocation?v 定位磁盘吃紧的节点；
1. 删除或归档过期索引（DELETE \<index>），或用 ILM 把冷数据迁到冷节点；
1. 磁盘释放后手工解除只读：PUT _all/_settings \{"index.blocks.read_only_allow_delete":null\}；
1. 长期需扩容磁盘或增加数据节点。

### Elasticsearch disk space low of the instance

警告 · 2 分钟 · 触发条件:

```promql
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

处置步骤:

1. 用 GET _cat/allocation?v 看各节点磁盘水位；
1. 清理过期索引或调整 ILM 策略，提前把数据滚动到冷节点；
1. 评估 cluster.routing.allocation.disk.watermark.* 阈值是否与实际容量匹配；
1. 提前安排扩容，避免跌到 flood-stage 后索引被置为只读。

### Elasticsearch Heap Usage Too High of the instance

紧急 · 2 分钟 · 触发条件:

```promql
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

处置步骤:

1. 用 GET _nodes/stats/jvm 确认是哪个节点堆压力大；
1. 用 GET _cat/indices?v&s=store.size:desc 找占用大的索引，关闭或归档不用的；
1. 用 GET _tasks?actions=*search*&detailed 定位大聚合或深分页查询并 cancel；
1. 长期把堆调整为物理内存的一半（不超过 31G），或增加节点分摊。

### Elasticsearch Heap Usage warning of the instance

警告 · 2 分钟 · 触发条件:

```promql
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

处置步骤:

1. 对照 elasticsearch_jvm_gc_collection_seconds_count 看 old GC 是否变频繁；
1. 用 GET _cat/indices?v&s=store.size:desc 排查近期是否有索引数据量暴涨；
1. 用 GET _nodes/stats/indices/fielddata 检查 fielddata 与查询缓存占用；
1. 提前规划扩容或清理，避免涨到 90% 触发 Full GC。

### Elasticsearch initializing shards of the instance

警告 · 15 分钟 · 触发条件:

```promql
elasticsearch_cluster_health_initializing_shards > 0
```

处置步骤:

1. 用 GET _cat/recovery?v&active_only=true 看恢复进度是否还在推进；
1. 卡住不动时用 GET _cluster/allocation/explain 看原因（磁盘不足、节点带宽打满）；
1. 恢复限速可临时调高 indices.recovery.max_bytes_per_sec；
1. 确认没有节点在反复掉线导致分片反复重建。

### Elasticsearch no new documents of the instance

警告 · 5 分钟 · 触发条件:

```promql
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

处置步骤:

1. 先确认该集群本来就应持续写入，否则关闭此规则；
1. 检查上游写入端（Filebeat/Logstash/应用 bulk 客户端）是否存活、日志中是否有 bulk 被拒；
1. 用 GET _cat/thread_pool/write?v 看 write 线程池的 rejected 是否在增长；
1. 确认索引未被置为只读（磁盘 watermark 会触发 read_only_allow_delete）。

### Elasticsearch pending tasks of the instance

警告 · 15 分钟 · 触发条件:

```promql
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

处置步骤:

1. 用 GET _cluster/pending_tasks 看积压的具体任务和优先级；
1. 用 GET _cat/master?v 确认 master 是否在频繁切换；
1. 用 GET _cat/shards 统计分片总数，排查是否因大量小索引导致集群状态过大；
1. 收敛分片数量（合并小索引、调整 ILM），必要时给 master 节点单独扩容。

### Elasticsearch relocation shards of the instance

警告 · 15 分钟 · 触发条件:

```promql
elasticsearch_cluster_health_relocating_shards > 0
```

处置步骤:

1. 用 GET _cat/recovery?v&active_only=true 看迁移是否还在推进；
1. 停滞则用 GET _cluster/allocation/explain 看是否被磁盘 watermark 或 allocation filter 挡住；
1. 确认是否有人手工触发了大规模 reroute，或有节点在上下线；
1. 必要时临时调高 cluster.routing.allocation.node_concurrent_recoveries 与恢复限速。

### Elasticsearch unassigned shards of the instance

紧急 · — · 触发条件:

```promql
elasticsearch_cluster_health_unassigned_shards > 0
```

处置步骤:

1. 用 GET _cluster/allocation/explain 直接拿到未分配的原因；
1. 节点掉线则先把节点恢复回集群；
1. 副本数超过可用节点数则调小 index.number_of_replicas；
1. 磁盘触发 watermark 则先清理磁盘，再执行 POST _cluster/reroute?retry_failed=true。

## 怎么使用这些规则

- **用 Prometheus 或 vmalert**：下载 [`elasticsearch.yml`](pathname:///alert-rules/elasticsearch.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页；有单独页面的规则指向它自己的页面。
- **用夜莺**：同样的规则内置在 [Elasticsearch](/integrations/elasticsearch) 集成模板里。在集成中心把规则[导入到业务组](/docs/data/integrations/import)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可

处置步骤和其余规则来自夜莺的集成模板（[Elasticsearch](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接

- [用夜莺监控 Elasticsearch](/integrations/elasticsearch)：采集配置、仪表盘与指标说明
- [在夜莺里写指标告警规则](/docs/alerting/metric-rules)
- [全部告警规则](/alert-rules)
