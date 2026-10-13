# 用夜莺监控 Elasticsearch

通过 ES 自己的 HTTP 接口采集集群健康、节点 JVM、线程池、索引和分片状态，小集群抓一个节点即可拿到全集群数据。

最后校对于 2026-10-13

Elasticsearch 通过 HTTP JSON 接口暴露自身状态，插件抓 `_cluster/health`、`_cluster/stats`、`_nodes/stats` 和索引统计：集群颜色、未分配分片、节点 JVM 堆与 GC、断路器、线程池拒绝、索引写入与查询延迟、磁盘水位。

小集群设 `local = false`，从任意一个节点抓就能拿到所有节点的数据；大集群建议每个节点部署 Categraf 并设 `local = true` 只抓本机。模板里的仪表盘分 Categraf 和 elasticsearch\_exporter 两套，规则覆盖集群变红变黄、分片未分配、JVM 堆逼近上限、线程池拒绝和磁盘水位。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 张仪表盘**，共 307 个面板
* **22 条告警规则**，每条附处置步骤
* **30 条指标说明**
* **Categraf 采集配置**：`input.elasticsearch`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.elasticsearch/elasticsearch.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.elasticsearch started` 就说明插件已加载。

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

2. 在夜莺「集成中心」里找到 Elasticsearch，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                          | 面板数 |
| ------------------------------- | ------ |
| ElasticSearch                   | 53     |
| Elasticsearch Dashboard         | 54     |
| ElasticSearch, group by service | 53     |
| ElasticSearch, group by cluster | 53     |
| ElasticSearch By Exporter       | 94     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 22 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（11）[​](#categraf-采集11 "Categraf 采集（11）的直接链接")

#### Elastic Cluster Red status[​](#elastic-cluster-red-status "Elastic Cluster Red status的直接链接")

S1 紧急 · 触发条件:

```
 elasticsearch_cluster_health_status{color="red"} == 1
```

处置步骤:

1. 用 GET \_cluster/health?level=indices 定位处于 red 的索引；
2. 用 GET \_cluster/allocation/explain 看主分片无法分配的具体原因；
3. 常见原因是节点掉线，先把节点拉回集群让分片自动恢复；
4. 节点数据确实损坏时，用 POST \_snapshot/\<repo>/\<snap>/\_restore 从快照恢复该索引。

#### Elastic Cluster Yellow status[​](#elastic-cluster-yellow-status "Elastic Cluster Yellow status的直接链接")

S2 警告 · 触发条件:

```
elasticsearch_cluster_health_status{color="yellow"} == 1
```

处置步骤:

1. 用 GET \_cluster/allocation/explain 看副本分片无法分配的原因；
2. 单节点集群把索引副本数设为 0：PUT \<index>/\_settings {"index.number\_of\_replicas":0}；
3. 多节点集群检查是否有节点掉线、或磁盘触发了 watermark 导致不再分配；
4. 处理完确认 health 回到 green。

#### Elasticsearch disk out of space of the instance[​](#elasticsearch-disk-out-of-space-of-the-instance "Elasticsearch disk out of space of the instance的直接链接")

S1 紧急 · 持续 2 分钟 · 触发条件:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

处置步骤:

1. 用 GET \_cat/allocation?v 定位磁盘吃紧的节点；
2. 删除或归档过期索引（DELETE \<index>），或用 ILM 把冷数据迁到冷节点；
3. 磁盘释放后手工解除只读：PUT \_all/\_settings {"index.blocks.read\_only\_allow\_delete":null}；
4. 长期需扩容磁盘或增加数据节点。

#### Elasticsearch disk space low of the instance[​](#elasticsearch-disk-space-low-of-the-instance "Elasticsearch disk space low of the instance的直接链接")

S2 警告 · 持续 2 分钟 · 触发条件:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

处置步骤:

1. 用 GET \_cat/allocation?v 看各节点磁盘水位；
2. 清理过期索引或调整 ILM 策略，提前把数据滚动到冷节点；
3. 评估 cluster.routing.allocation.disk.watermark.\* 阈值是否与实际容量匹配；
4. 提前安排扩容，避免跌到 flood-stage 后索引被置为只读。

#### Elasticsearch Heap Usage Too High of the instance[​](#elasticsearch-heap-usage-too-high-of-the-instance "Elasticsearch Heap Usage Too High of the instance的直接链接")

S1 紧急 · 持续 2 分钟 · 触发条件:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

处置步骤:

1. 用 GET \_nodes/stats/jvm 确认是哪个节点堆压力大；
2. 用 GET \_cat/indices?v\&s=store.size:desc 找占用大的索引，关闭或归档不用的；
3. 用 GET \_tasks?actions=*search*\&detailed 定位大聚合或深分页查询并 cancel；
4. 长期把堆调整为物理内存的一半（不超过 31G），或增加节点分摊。

#### Elasticsearch Heap Usage warning of the instance[​](#elasticsearch-heap-usage-warning-of-the-instance "Elasticsearch Heap Usage warning of the instance的直接链接")

S2 警告 · 持续 2 分钟 · 触发条件:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

处置步骤:

1. 对照 elasticsearch\_jvm\_gc\_collection\_seconds\_count 看 old GC 是否变频繁；
2. 用 GET \_cat/indices?v\&s=store.size:desc 排查近期是否有索引数据量暴涨；
3. 用 GET \_nodes/stats/indices/fielddata 检查 fielddata 与查询缓存占用；
4. 提前规划扩容或清理，避免涨到 90% 触发 Full GC。

#### Elasticsearch initializing shards of the instance[​](#elasticsearch-initializing-shards-of-the-instance "Elasticsearch initializing shards of the instance的直接链接")

S2 警告 · 持续 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_initializing_shards > 0
```

处置步骤:

1. 用 GET \_cat/recovery?v\&active\_only=true 看恢复进度是否还在推进；
2. 卡住不动时用 GET \_cluster/allocation/explain 看原因（磁盘不足、节点带宽打满）；
3. 恢复限速可临时调高 indices.recovery.max\_bytes\_per\_sec；
4. 确认没有节点在反复掉线导致分片反复重建。

#### Elasticsearch no new documents of the instance[​](#elasticsearch-no-new-documents-of-the-instance "Elasticsearch no new documents of the instance的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

处置步骤:

1. 先确认该集群本来就应持续写入，否则关闭此规则；
2. 检查上游写入端（Filebeat/Logstash/应用 bulk 客户端）是否存活、日志中是否有 bulk 被拒；
3. 用 GET \_cat/thread\_pool/write?v 看 write 线程池的 rejected 是否在增长；
4. 确认索引未被置为只读（磁盘 watermark 会触发 read\_only\_allow\_delete）。

#### Elasticsearch pending tasks of the instance[​](#elasticsearch-pending-tasks-of-the-instance "Elasticsearch pending tasks of the instance的直接链接")

S2 警告 · 持续 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

处置步骤:

1. 用 GET \_cluster/pending\_tasks 看积压的具体任务和优先级；
2. 用 GET \_cat/master?v 确认 master 是否在频繁切换；
3. 用 GET \_cat/shards 统计分片总数，排查是否因大量小索引导致集群状态过大；
4. 收敛分片数量（合并小索引、调整 ILM），必要时给 master 节点单独扩容。

#### Elasticsearch relocation shards of the instance[​](#elasticsearch-relocation-shards-of-the-instance "Elasticsearch relocation shards of the instance的直接链接")

S2 警告 · 持续 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_relocating_shards > 0
```

处置步骤:

1. 用 GET \_cat/recovery?v\&active\_only=true 看迁移是否还在推进；
2. 停滞则用 GET \_cluster/allocation/explain 看是否被磁盘 watermark 或 allocation filter 挡住；
3. 确认是否有人手工触发了大规模 reroute，或有节点在上下线；
4. 必要时临时调高 cluster.routing.allocation.node\_concurrent\_recoveries 与恢复限速。

#### Elasticsearch unassigned shards of the instance[​](#elasticsearch-unassigned-shards-of-the-instance "Elasticsearch unassigned shards of the instance的直接链接")

S1 紧急 · 触发条件:

```
elasticsearch_cluster_health_unassigned_shards > 0
```

处置步骤:

1. 用 GET \_cluster/allocation/explain 直接拿到未分配的原因；
2. 节点掉线则先把节点恢复回集群；
3. 副本数超过可用节点数则调小 index.number\_of\_replicas；
4. 磁盘触发 watermark 则先清理磁盘，再执行 POST \_cluster/reroute?retry\_failed=true。

### Exporter 采集（11）[​](#exporter-采集11 "Exporter 采集（11）的直接链接")

#### Elastic Cluster Red status[​](#elastic-cluster-red-status-1 "Elastic Cluster Red status的直接链接")

S1 紧急 · 触发条件:

```
 elasticsearch_cluster_health_status{color="red"} == 1
```

处置步骤:

1. 用 GET \_cluster/health?level=indices 定位处于 red 的索引；
2. 用 GET \_cluster/allocation/explain 看主分片无法分配的具体原因；
3. 常见原因是节点掉线，先把节点拉回集群让分片自动恢复；
4. 节点数据确实损坏时，用 POST \_snapshot/\<repo>/\<snap>/\_restore 从快照恢复该索引。

#### Elastic Cluster Yellow status[​](#elastic-cluster-yellow-status-1 "Elastic Cluster Yellow status的直接链接")

S2 警告 · 触发条件:

```
elasticsearch_cluster_health_status{color="yellow"} == 1
```

处置步骤:

1. 用 GET \_cluster/allocation/explain 看副本分片无法分配的原因；
2. 单节点集群把索引副本数设为 0：PUT \<index>/\_settings {"index.number\_of\_replicas":0}；
3. 多节点集群检查是否有节点掉线、或磁盘触发了 watermark 导致不再分配；
4. 处理完确认 health 回到 green。

#### Elasticsearch disk out of space of the instance[​](#elasticsearch-disk-out-of-space-of-the-instance-1 "Elasticsearch disk out of space of the instance的直接链接")

S1 紧急 · 持续 2 分钟 · 触发条件:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 10
```

处置步骤:

1. 用 GET \_cat/allocation?v 定位磁盘吃紧的节点；
2. 删除或归档过期索引（DELETE \<index>），或用 ILM 把冷数据迁到冷节点；
3. 磁盘释放后手工解除只读：PUT \_all/\_settings {"index.blocks.read\_only\_allow\_delete":null}；
4. 长期需扩容磁盘或增加数据节点。

#### Elasticsearch disk space low of the instance[​](#elasticsearch-disk-space-low-of-the-instance-1 "Elasticsearch disk space low of the instance的直接链接")

S2 警告 · 持续 2 分钟 · 触发条件:

```
elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20
```

处置步骤:

1. 用 GET \_cat/allocation?v 看各节点磁盘水位；
2. 清理过期索引或调整 ILM 策略，提前把数据滚动到冷节点；
3. 评估 cluster.routing.allocation.disk.watermark.\* 阈值是否与实际容量匹配；
4. 提前安排扩容，避免跌到 flood-stage 后索引被置为只读。

#### Elasticsearch Heap Usage Too High of the instance[​](#elasticsearch-heap-usage-too-high-of-the-instance-1 "Elasticsearch Heap Usage Too High of the instance的直接链接")

S1 紧急 · 持续 2 分钟 · 触发条件:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 90
```

处置步骤:

1. 用 GET \_nodes/stats/jvm 确认是哪个节点堆压力大；
2. 用 GET \_cat/indices?v\&s=store.size:desc 找占用大的索引，关闭或归档不用的；
3. 用 GET \_tasks?actions=*search*\&detailed 定位大聚合或深分页查询并 cancel；
4. 长期把堆调整为物理内存的一半（不超过 31G），或增加节点分摊。

#### Elasticsearch Heap Usage warning of the instance[​](#elasticsearch-heap-usage-warning-of-the-instance-1 "Elasticsearch Heap Usage warning of the instance的直接链接")

S2 警告 · 持续 2 分钟 · 触发条件:

```
(elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"}) * 100 > 80
```

处置步骤:

1. 对照 elasticsearch\_jvm\_gc\_collection\_seconds\_count 看 old GC 是否变频繁；
2. 用 GET \_cat/indices?v\&s=store.size:desc 排查近期是否有索引数据量暴涨；
3. 用 GET \_nodes/stats/indices/fielddata 检查 fielddata 与查询缓存占用；
4. 提前规划扩容或清理，避免涨到 90% 触发 Full GC。

#### Elasticsearch initializing shards of the instance[​](#elasticsearch-initializing-shards-of-the-instance-1 "Elasticsearch initializing shards of the instance的直接链接")

S2 警告 · 持续 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_initializing_shards > 0
```

处置步骤:

1. 用 GET \_cat/recovery?v\&active\_only=true 看恢复进度是否还在推进；
2. 卡住不动时用 GET \_cluster/allocation/explain 看原因（磁盘不足、节点带宽打满）；
3. 恢复限速可临时调高 indices.recovery.max\_bytes\_per\_sec；
4. 确认没有节点在反复掉线导致分片反复重建。

#### Elasticsearch no new documents of the instance[​](#elasticsearch-no-new-documents-of-the-instance-1 "Elasticsearch no new documents of the instance的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(elasticsearch_indices_docs{es_data_node="true"}[5m]) == 0
```

处置步骤:

1. 先确认该集群本来就应持续写入，否则关闭此规则；
2. 检查上游写入端（Filebeat/Logstash/应用 bulk 客户端）是否存活、日志中是否有 bulk 被拒；
3. 用 GET \_cat/thread\_pool/write?v 看 write 线程池的 rejected 是否在增长；
4. 确认索引未被置为只读（磁盘 watermark 会触发 read\_only\_allow\_delete）。

#### Elasticsearch pending tasks of the instance[​](#elasticsearch-pending-tasks-of-the-instance-1 "Elasticsearch pending tasks of the instance的直接链接")

S2 警告 · 持续 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_number_of_pending_tasks > 10
```

处置步骤:

1. 用 GET \_cluster/pending\_tasks 看积压的具体任务和优先级；
2. 用 GET \_cat/master?v 确认 master 是否在频繁切换；
3. 用 GET \_cat/shards 统计分片总数，排查是否因大量小索引导致集群状态过大；
4. 收敛分片数量（合并小索引、调整 ILM），必要时给 master 节点单独扩容。

#### Elasticsearch relocation shards of the instance[​](#elasticsearch-relocation-shards-of-the-instance-1 "Elasticsearch relocation shards of the instance的直接链接")

S2 警告 · 持续 15 分钟 · 触发条件:

```
elasticsearch_cluster_health_relocating_shards > 0
```

处置步骤:

1. 用 GET \_cat/recovery?v\&active\_only=true 看迁移是否还在推进；
2. 停滞则用 GET \_cluster/allocation/explain 看是否被磁盘 watermark 或 allocation filter 挡住；
3. 确认是否有人手工触发了大规模 reroute，或有节点在上下线；
4. 必要时临时调高 cluster.routing.allocation.node\_concurrent\_recoveries 与恢复限速。

#### Elasticsearch unassigned shards of the instance[​](#elasticsearch-unassigned-shards-of-the-instance-1 "Elasticsearch unassigned shards of the instance的直接链接")

S1 紧急 · 触发条件:

```
elasticsearch_cluster_health_unassigned_shards > 0
```

处置步骤:

1. 用 GET \_cluster/allocation/explain 直接拿到未分配的原因；
2. 节点掉线则先把节点恢复回集群；
3. 副本数超过可用节点数则调小 index.number\_of\_replicas；
4. 磁盘触发 watermark 则先清理磁盘，再执行 POST \_cluster/reroute?retry\_failed=true。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 30 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                                                                                                     | 含义                                                                                                                                                              | 单位    |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `elasticsearch_cluster_health_delayed_unassigned_shards`                                                                 | Cluster Health delayed unassigned 的分片数                                                                                                                        | 个      |
| `elasticsearch_cluster_health_number_of_pending_tasks`                                                                   | Cluster Health Pending task 数量                                                                                                                                  |         |
| `elasticsearch_cluster_health_relocating_shards`                                                                         | Cluster Health relocating 的分片数                                                                                                                                | 个      |
| `elasticsearch_cluster_health_unassigned_shards`                                                                         | Cluster Health unassigned 的分片数                                                                                                                                | 个      |
| `elasticsearch_cluster_health_status_code`                                                                               | Cluster Health 健康度状态码 — - 1：Green，绿色状态，表示所有分片都正常 - 2：Yellow，黄色状态，主分片都正常，从分片有不正常的 - 3：Red，红色状态，有些主分片不正常 |         |
| `elasticsearch_cluster_health_number_of_data_nodes`                                                                      | Cluster Health 数据节点数量                                                                                                                                       |         |
| `elasticsearch_cluster_health_initializing_shards`                                                                       | Cluster Health 正在初始化的分片数                                                                                                                                 | 个      |
| `elasticsearch_cluster_health_active_primary_shards`                                                                     | Cluster Health 活跃主分片数                                                                                                                                       | 个      |
| `elasticsearch_cluster_health_active_shards`                                                                             | Cluster Health 活跃分片数                                                                                                                                         | 个      |
| `elasticsearch_cluster_health_number_of_nodes`                                                                           | Cluster Health 节点数量                                                                                                                                           |         |
| `irate(elasticsearch_indices_indexing_index_time_in_millis[3m]) / irate(elasticsearch_indices_indexing_index_total[3m])` | Indexing 平均耗时                                                                                                                                                 | ms      |
| `irate(elasticsearch_indices_merges_total_time_in_millis[3m]) / irate(elasticsearch_indices_merges_total[3m])`           | Merge 平均耗时                                                                                                                                                    | ms      |
| `irate(elasticsearch_indices_search_query_time_in_millis[3m]) / irate(elasticsearch_indices_search_query_total[3m])`     | Query 平均耗时                                                                                                                                                    | ms      |
| `irate(elasticsearch_indices_indexing_index_total[3m])`                                                                  | 每秒 indexing 数量                                                                                                                                                | 个      |
| `irate(elasticsearch_indices_merges_total_size_in_bytes[3m])`                                                            | 每秒 merge 大小                                                                                                                                                   | bytes/s |
| `irate(elasticsearch_indices_merges_total_docs[3m])`                                                                     | 每秒 merge 数量                                                                                                                                                   | 个      |
| `irate(elasticsearch_indices_docs_deleted[3m])`                                                                          | 每秒删除 doc 数量                                                                                                                                                 | 个      |
| `100 - 100 * elasticsearch_fs_total_available_in_bytes / elasticsearch_fs_total_total_in_bytes`                          | 硬盘使用率                                                                                                                                                        | %       |
| `irate(elasticsearch_transport_rx_size_in_bytes[3m])`                                                                    | 网络流量 - 入向每秒流量                                                                                                                                           | bytes/s |
| `irate(elasticsearch_transport_tx_size_in_bytes[3m])`                                                                    | 网络流量 - 出向每秒流量                                                                                                                                           | bytes/s |
| `elasticsearch_process_cpu_percent`                                                                                      | 进程 CPU 使用率                                                                                                                                                   | %       |
| `elasticsearch_jvm_mem_heap_used_percent`                                                                                | 进程 JVM Heap 使用率                                                                                                                                              | %       |
| `elasticsearch_jvm_mem_heap_committed_in_bytes`                                                                          | 进程 JVM Heap 区 committed 大小                                                                                                                                   | bytes   |
| `elasticsearch_jvm_mem_non_heap_committed_in_bytes`                                                                      | 进程 JVM Non Heap 区 committed 大小                                                                                                                               | bytes   |
| `elasticsearch_jvm_mem_pools_old_used_in_bytes`                                                                          | 进程 JVM Old 内存池 used 大小                                                                                                                                     | bytes   |
| `elasticsearch_jvm_mem_pools_young_used_in_bytes`                                                                        | 进程 JVM Young 内存池 used 大小                                                                                                                                   | bytes   |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_count[3m])`                                                      | 进程新生代每秒 GC 次数                                                                                                                                            |         |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_time_in_millis[3m])`                                             | 进程新生代每秒 GC 耗时                                                                                                                                            | ms      |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_count[3m])`                                                        | 进程老生代每秒 GC 次数                                                                                                                                            |         |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_time_in_millis[3m])`                                               | 进程老生代每秒 GC 耗时                                                                                                                                            | ms      |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Elasticsearch 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `elasticsearch` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/elasticsearch)：完整配置项和指标列表。
* [把 Elasticsearch 接成日志数据源](https://n9e.github.io/zh/docs/data/elasticsearch.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
