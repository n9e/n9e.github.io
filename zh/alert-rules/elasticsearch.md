# Elasticsearch 告警规则：11 条 PromQL 规则与处置步骤

11 条开箱可用的 Elasticsearch 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 elasticsearch\_exporter, Categraf。可下载为 Prometheus 规则文件，或导入夜莺。

最后校对于 2026-10-31

Elasticsearch 告警规则：集群健康变黄或变红、JVM 堆内存用量过高、磁盘空间不足或耗尽、未分配 / 初始化中 / 迁移中的分片、积压的集群任务，以及索引长时间没有新文档写入。exporter 一组使用 prometheus-community/elasticsearch\_exporter 的指标名；Categraf 一组对 Categraf 采集的指标做同样的检查。

## 概览[​](#概览 "概览的直接链接")

* **11 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
* **指标来源**：elasticsearch\_exporter, Categraf
* **下载**：[`elasticsearch.yml`](https://n9e.github.io/zh/alert-rules/elasticsearch.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
* 阈值只是起点，启用前请按自己的环境调整。

## 规则一览[​](#规则一览 "规则一览的直接链接")

| 规则                                              | 级别 | 持续    |
| ------------------------------------------------- | ---- | ------- |
| Elastic Cluster Red status                        | 紧急 | —       |
| Elastic Cluster Yellow status                     | 警告 | —       |
| Elasticsearch disk out of space of the instance   | 紧急 | 2 分钟  |
| Elasticsearch disk space low of the instance      | 警告 | 2 分钟  |
| Elasticsearch Heap Usage Too High of the instance | 紧急 | 2 分钟  |
| Elasticsearch Heap Usage warning of the instance  | 警告 | 2 分钟  |
| Elasticsearch initializing shards of the instance | 警告 | 15 分钟 |
| Elasticsearch no new documents of the instance    | 警告 | 5 分钟  |
| Elasticsearch pending tasks of the instance       | 警告 | 15 分钟 |
| Elasticsearch relocation shards of the instance   | 警告 | 15 分钟 |
| Elasticsearch unassigned shards of the instance   | 紧急 | —       |

## Prometheus exporter（11）[​](#prometheus-exporter11 "Prometheus exporter（11）的直接链接")

本组全部规则对用 Categraf 采集的实例同样适用，指标名完全一致。

### Elastic Cluster Red status[​](#elastic-cluster-red-status "Elastic Cluster Red status的直接链接")

紧急 · — · 触发条件:

```
elasticsearch_cluster_health_status{color="red"} == 1
```

处置步骤:

1. 用 GET \_cluster/health?level=indices 定位处于 red 的索引；
2. 用 GET \_cluster/allocation/explain 看主分片无法分配的具体原因；
3. 常见原因是节点掉线，先把节点拉回集群让分片自动恢复；
4. 节点数据确实损坏时，用 POST \_snapshot/\<repo>/\<snap>/\_restore 从快照恢复该索引。

### Elastic Cluster Yellow status[​](#elastic-cluster-yellow-status "Elastic Cluster Yellow status的直接链接")

警告 · — · 触发条件:

```
elasticsearch_cluster_health_status{color="yellow"} == 1
```

处置步骤:

1. 用 GET \_cluster/allocation/explain 看副本分片无法分配的原因；
2. 单节点集群把索引副本数设为 0：PUT \<index>/\_settings {"index.number\_of\_replicas":0}；
3. 多节点集群检查是否有节点掉线、或磁盘触发了 watermark 导致不再分配；
4. 处理完确认 health 回到 green。

### Elasticsearch disk out of space of the instance[​](#elasticsearch-disk-out-of-space-of-the-instance "Elasticsearch disk out of space of the instance的直接链接")

紧急 · 2 分钟 · 触发条件:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

处置步骤:

1. 用 GET \_cat/allocation?v 定位磁盘吃紧的节点；
2. 删除或归档过期索引（DELETE \<index>），或用 ILM 把冷数据迁到冷节点；
3. 磁盘释放后手工解除只读：PUT \_all/\_settings {"index.blocks.read\_only\_allow\_delete":null}；
4. 长期需扩容磁盘或增加数据节点。

### Elasticsearch disk space low of the instance[​](#elasticsearch-disk-space-low-of-the-instance "Elasticsearch disk space low of the instance的直接链接")

警告 · 2 分钟 · 触发条件:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

处置步骤:

1. 用 GET \_cat/allocation?v 看各节点磁盘水位；
2. 清理过期索引或调整 ILM 策略，提前把数据滚动到冷节点；
3. 评估 cluster.routing.allocation.disk.watermark.\* 阈值是否与实际容量匹配；
4. 提前安排扩容，避免跌到 flood-stage 后索引被置为只读。

### Elasticsearch Heap Usage Too High of the instance[​](#elasticsearch-heap-usage-too-high-of-the-instance "Elasticsearch Heap Usage Too High of the instance的直接链接")

紧急 · 2 分钟 · 触发条件:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

处置步骤:

1. 用 GET \_nodes/stats/jvm 确认是哪个节点堆压力大；
2. 用 GET \_cat/indices?v\&s=store.size:desc 找占用大的索引，关闭或归档不用的；
3. 用 GET \_tasks?actions=*search*\&detailed 定位大聚合或深分页查询并 cancel；
4. 长期把堆调整为物理内存的一半（不超过 31G），或增加节点分摊。

### Elasticsearch Heap Usage warning of the instance[​](#elasticsearch-heap-usage-warning-of-the-instance "Elasticsearch Heap Usage warning of the instance的直接链接")

警告 · 2 分钟 · 触发条件:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

处置步骤:

1. 对照 elasticsearch\_jvm\_gc\_collection\_seconds\_count 看 old GC 是否变频繁；
2. 用 GET \_cat/indices?v\&s=store.size:desc 排查近期是否有索引数据量暴涨；
3. 用 GET \_nodes/stats/indices/fielddata 检查 fielddata 与查询缓存占用；
4. 提前规划扩容或清理，避免涨到 90% 触发 Full GC。

### Elasticsearch initializing shards of the instance[​](#elasticsearch-initializing-shards-of-the-instance "Elasticsearch initializing shards of the instance的直接链接")

警告 · 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_initializing_shards > 0
```

处置步骤:

1. 用 GET \_cat/recovery?v\&active\_only=true 看恢复进度是否还在推进；
2. 卡住不动时用 GET \_cluster/allocation/explain 看原因（磁盘不足、节点带宽打满）；
3. 恢复限速可临时调高 indices.recovery.max\_bytes\_per\_sec；
4. 确认没有节点在反复掉线导致分片反复重建。

### Elasticsearch no new documents of the instance[​](#elasticsearch-no-new-documents-of-the-instance "Elasticsearch no new documents of the instance的直接链接")

警告 · 5 分钟 · 触发条件:

```
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

处置步骤:

1. 先确认该集群本来就应持续写入，否则关闭此规则；
2. 检查上游写入端（Filebeat/Logstash/应用 bulk 客户端）是否存活、日志中是否有 bulk 被拒；
3. 用 GET \_cat/thread\_pool/write?v 看 write 线程池的 rejected 是否在增长；
4. 确认索引未被置为只读（磁盘 watermark 会触发 read\_only\_allow\_delete）。

### Elasticsearch pending tasks of the instance[​](#elasticsearch-pending-tasks-of-the-instance "Elasticsearch pending tasks of the instance的直接链接")

警告 · 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

处置步骤:

1. 用 GET \_cluster/pending\_tasks 看积压的具体任务和优先级；
2. 用 GET \_cat/master?v 确认 master 是否在频繁切换；
3. 用 GET \_cat/shards 统计分片总数，排查是否因大量小索引导致集群状态过大；
4. 收敛分片数量（合并小索引、调整 ILM），必要时给 master 节点单独扩容。

### Elasticsearch relocation shards of the instance[​](#elasticsearch-relocation-shards-of-the-instance "Elasticsearch relocation shards of the instance的直接链接")

警告 · 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_relocating_shards > 0
```

处置步骤:

1. 用 GET \_cat/recovery?v\&active\_only=true 看迁移是否还在推进；
2. 停滞则用 GET \_cluster/allocation/explain 看是否被磁盘 watermark 或 allocation filter 挡住；
3. 确认是否有人手工触发了大规模 reroute，或有节点在上下线；
4. 必要时临时调高 cluster.routing.allocation.node\_concurrent\_recoveries 与恢复限速。

### Elasticsearch unassigned shards of the instance[​](#elasticsearch-unassigned-shards-of-the-instance "Elasticsearch unassigned shards of the instance的直接链接")

紧急 · — · 触发条件:

```
elasticsearch_cluster_health_unassigned_shards > 0
```

处置步骤:

1. 用 GET \_cluster/allocation/explain 直接拿到未分配的原因；
2. 节点掉线则先把节点恢复回集群；
3. 副本数超过可用节点数则调小 index.number\_of\_replicas；
4. 磁盘触发 watermark 则先清理磁盘，再执行 POST \_cluster/reroute?retry\_failed=true。

## 怎么使用这些规则[​](#怎么使用这些规则 "怎么使用这些规则的直接链接")

* **用 Prometheus 或 vmalert**：下载 [`elasticsearch.yml`](https://n9e.github.io/zh/alert-rules/elasticsearch.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页。
* **用夜莺**：同样的规则内置在 [Elasticsearch](https://n9e.github.io/zh/integrations/elasticsearch.md) 集成模板里。在集成中心把规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

处置步骤和其余规则来自夜莺的集成模板（[Elasticsearch](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* [用夜莺监控 Elasticsearch](https://n9e.github.io/zh/integrations/elasticsearch.md)：采集配置、仪表盘与指标说明
* [在夜莺里写指标告警规则](https://n9e.github.io/zh/docs/alerting/metric-rules.md)
* [全部告警规则](https://n9e.github.io/zh/alert-rules.md)
