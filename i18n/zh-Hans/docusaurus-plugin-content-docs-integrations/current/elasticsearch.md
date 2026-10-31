---
title: "用夜莺监控 Elasticsearch"
sidebar_label: "Elasticsearch"
description: "通过 ES 自己的 HTTP 接口采集集群健康、节点 JVM、线程池、索引和分片状态，小集群抓一个节点即可拿到全集群数据。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch
toc_max_heading_level: 2
mdx:
  format: md
---

Elasticsearch 通过 HTTP JSON 接口暴露自身状态，插件抓 `_cluster/health`、`_cluster/stats`、`_nodes/stats` 和索引统计：集群颜色、未分配分片、节点 JVM 堆与 GC、断路器、线程池拒绝、索引写入与查询延迟、磁盘水位。

小集群设 `local = false`，从任意一个节点抓就能拿到所有节点的数据；大集群建议每个节点部署 Categraf 并设 `local = true` 只抓本机。模板里的仪表盘分 Categraf 和 elasticsearch_exporter 两套，规则覆盖集群变红变黄、分片未分配、JVM 堆逼近上限、线程池拒绝和磁盘水位。

## 模板里有什么

- **5 张仪表盘**，共 307 个面板
- **22 条告警规则**，每条附处置步骤
- **30 条指标说明**
- **Categraf 采集配置**：`input.elasticsearch`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.elasticsearch/elasticsearch.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.elasticsearch started` 就说明插件已加载。

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

1. 在夜莺「集成中心」里找到 Elasticsearch，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| ElasticSearch | 53 |
| Elasticsearch Dashboard | 54 |
| ElasticSearch, group by service | 53 |
| ElasticSearch, group by cluster | 53 |
| ElasticSearch By Exporter | 94 |

## 内置告警规则

共 22 条，导入后默认停用，按自己环境的阈值逐条启用。每条规则的触发条件（PromQL）和处置步骤收录在告警规则库：[Elasticsearch 告警规则](/alert-rules/elasticsearch)。

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| Elastic Cluster Red status | S1 紧急 | — |
| Elastic Cluster Yellow status | S2 警告 | — |
| Elasticsearch disk out of space of the instance | S1 紧急 | 2 分钟 |
| Elasticsearch disk space low of the instance | S2 警告 | 2 分钟 |
| Elasticsearch Heap Usage Too High of the instance | S1 紧急 | 2 分钟 |
| Elasticsearch Heap Usage warning of the instance | S2 警告 | 2 分钟 |
| Elasticsearch initializing shards of the instance | S2 警告 | 15 分钟 |
| Elasticsearch no new documents of the instance | S2 警告 | 5 分钟 |
| Elasticsearch pending tasks of the instance | S2 警告 | 15 分钟 |
| Elasticsearch relocation shards of the instance | S2 警告 | 15 分钟 |
| Elasticsearch unassigned shards of the instance | S1 紧急 | — |
| Elastic Cluster Red status | S1 紧急 | — |
| Elastic Cluster Yellow status | S2 警告 | — |
| Elasticsearch disk out of space of the instance | S1 紧急 | 2 分钟 |
| Elasticsearch disk space low of the instance | S2 警告 | 2 分钟 |
| Elasticsearch Heap Usage Too High of the instance | S1 紧急 | 2 分钟 |
| Elasticsearch Heap Usage warning of the instance | S2 警告 | 2 分钟 |
| Elasticsearch initializing shards of the instance | S2 警告 | 15 分钟 |
| Elasticsearch no new documents of the instance | S2 警告 | 5 分钟 |
| Elasticsearch pending tasks of the instance | S2 警告 | 15 分钟 |
| Elasticsearch relocation shards of the instance | S2 警告 | 15 分钟 |
| Elasticsearch unassigned shards of the instance | S1 紧急 | — |

## 指标说明

共 30 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标 | 含义 | 单位 |
| --- | --- | --- |
| `elasticsearch_cluster_health_delayed_unassigned_shards` | Cluster Health delayed unassigned 的分片数 | 个 |
| `elasticsearch_cluster_health_number_of_pending_tasks` | Cluster Health Pending task 数量 |  |
| `elasticsearch_cluster_health_relocating_shards` | Cluster Health relocating 的分片数 | 个 |
| `elasticsearch_cluster_health_unassigned_shards` | Cluster Health unassigned 的分片数 | 个 |
| `elasticsearch_cluster_health_status_code` | Cluster Health 健康度状态码 — - 1：Green，绿色状态，表示所有分片都正常; 2：Yellow，黄色状态，主分片都正常，从分片有不正常的; 3：Red，红色状态，有些主分片不正常 |  |
| `elasticsearch_cluster_health_number_of_data_nodes` | Cluster Health 数据节点数量 |  |
| `elasticsearch_cluster_health_initializing_shards` | Cluster Health 正在初始化的分片数 | 个 |
| `elasticsearch_cluster_health_active_primary_shards` | Cluster Health 活跃主分片数 | 个 |
| `elasticsearch_cluster_health_active_shards` | Cluster Health 活跃分片数 | 个 |
| `elasticsearch_cluster_health_number_of_nodes` | Cluster Health 节点数量 |  |
| `irate(elasticsearch_indices_indexing_index_time_in_millis[3m]) / irate(elasticsearch_indices_indexing_index_total[3m])` | Indexing 平均耗时 | ms |
| `irate(elasticsearch_indices_merges_total_time_in_millis[3m]) / irate(elasticsearch_indices_merges_total[3m])` | Merge 平均耗时 | ms |
| `irate(elasticsearch_indices_search_query_time_in_millis[3m]) / irate(elasticsearch_indices_search_query_total[3m])` | Query 平均耗时 | ms |
| `irate(elasticsearch_indices_indexing_index_total[3m])` | 每秒 indexing 数量 | 个 |
| `irate(elasticsearch_indices_merges_total_size_in_bytes[3m])` | 每秒 merge 大小 | bytes/s |
| `irate(elasticsearch_indices_merges_total_docs[3m])` | 每秒 merge 数量 | 个 |
| `irate(elasticsearch_indices_docs_deleted[3m])` | 每秒删除 doc 数量 | 个 |
| `100 - 100 * elasticsearch_fs_total_available_in_bytes / elasticsearch_fs_total_total_in_bytes` | 硬盘使用率 | % |
| `irate(elasticsearch_transport_rx_size_in_bytes[3m])` | 网络流量 - 入向每秒流量 | bytes/s |
| `irate(elasticsearch_transport_tx_size_in_bytes[3m])` | 网络流量 - 出向每秒流量 | bytes/s |
| `elasticsearch_process_cpu_percent` | 进程 CPU 使用率 | % |
| `elasticsearch_jvm_mem_heap_used_percent` | 进程 JVM Heap 使用率 | % |
| `elasticsearch_jvm_mem_heap_committed_in_bytes` | 进程 JVM Heap 区 committed 大小 | bytes |
| `elasticsearch_jvm_mem_non_heap_committed_in_bytes` | 进程 JVM Non Heap 区 committed 大小 | bytes |
| `elasticsearch_jvm_mem_pools_old_used_in_bytes` | 进程 JVM Old 内存池 used 大小 | bytes |
| `elasticsearch_jvm_mem_pools_young_used_in_bytes` | 进程 JVM Young 内存池 used 大小 | bytes |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_count[3m])` | 进程新生代每秒 GC 次数 |  |
| `irate(elasticsearch_jvm_gc_collectors_young_collection_time_in_millis[3m])` | 进程新生代每秒 GC 耗时 | ms |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_count[3m])` | 进程老生代每秒 GC 次数 |  |
| `irate(elasticsearch_jvm_gc_collectors_old_collection_time_in_millis[3m])` | 进程老生代每秒 GC 耗时 | ms |

## 相关链接

- [Elasticsearch 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Elasticsearch）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `elasticsearch` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/elasticsearch)：完整配置项和指标列表。
- [把 Elasticsearch 接成日志数据源](/docs/data/elasticsearch)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
