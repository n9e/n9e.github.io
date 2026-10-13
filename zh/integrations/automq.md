# 用夜莺监控 AutoMQ

AutoMQ 通过 OTel Collector 或自身的 Prometheus 端点暴露指标，模板覆盖集群总览、Broker、Topic、消费组和明细。

最后校对于 2026-10-13

AutoMQ 是存算分离的 Kafka 兼容消息系统。它把指标发给 OTel Collector 的 Prometheus exporter，或直接在自己的端点（实测用的是 8890）暴露 Prometheus 格式数据，用 Categraf 的 `prometheus` 插件抓取即可，端口按部署配置为准。

模板带集群总览、Broker、Topic、消费组和明细五张仪表盘，指标说明覆盖请求、吞吐、延迟、存储和对象存储操作。规则覆盖 Broker 离线、请求错误率、消费积压和存储操作失败。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 张仪表盘**，共 97 个面板
* **12 条告警规则**，每条附处置步骤
* **59 条指标说明**
* **Categraf 采集配置**：`input.prometheus`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](https://n9e.github.io/zh/docs/data/prometheus.md)，模板同样能用。

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.prometheus/采集OTEL-COLLECTOR的样例.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.prometheus started` 就说明插件已加载。

   ```
   interval = 15



   [[instances]]

   urls = [

        "http://<automq-or-otel-collector>:8890/metrics"

   ]



   # AutoMQ metrics already contain an instance label; do not overwrite it.

   url_label_key = "otel_collector"

   url_label_value = "{{.Host}}"

   labels = { source = "automq" }
   ```

2. 在夜莺「集成中心」里找到 AutoMQ，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘           | 面板数 |
| ---------------- | ------ |
| Broker Metrics   | 13     |
| Cluster Overview | 12     |
| Detailed Metrics | 60     |
| Group Metrics    | 2      |
| Topic Metrics    | 10     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 12 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Kafka active controller 数目异常[​](#kafka-active-controller-数目异常 "Kafka active controller 数目异常的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(kafka_controller_active_count) by (job) != 1
```

处置步骤:

1. 在各 broker 上确认进程存活与到 controller quorum 的网络连通性；
2. KRaft 模式下用 kafka-metadata-quorum.sh --bootstrap-server \<broker> describe --status 看 quorum 状态；
3. 为 0 时先恢复宕掉的 controller 节点，恢复多数派后会自动选举；
4. 大于 1 时排查网络分区，确认后停掉少数派一侧让集群重新收敛。

### Kafka Broker 连接数过多[​](#kafka-broker-连接数过多 "Kafka Broker 连接数过多的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(kafka_server_connection_count) by (job, instance) > 1000
```

处置步骤:

1. 用 ss -tn state established '( sport = :9092 )' | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn 看连接来自哪些客户端；
2. 区分是客户端实例增多还是连接泄漏（未复用 producer/consumer）；
3. 应急调大 broker 的文件句柄上限；
4. 根因侧让客户端复用连接，并确认没有短连接式的反复建连。

### Kafka Fetch 请求高延迟[​](#kafka-fetch-请求高延迟 "Kafka Fetch 请求高延迟的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
kafka_request_time_99p_milliseconds{type="Fetch"} > 1000
```

处置步骤:

1. 看 broker 的磁盘 IO 与 page cache 命中——Fetch 慢通常是读到了冷数据要落盘；
2. 确认是否有消费者在从很早的 offset 重新消费，把冷数据大量读入；
3. 检查网络带宽是否打满；
4. 持续存在则考虑扩容 broker 或增加内存提升 page cache 命中率。

### Kafka Partition 数量过多[​](#kafka-partition-数量过多 "Kafka Partition 数量过多的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
kafka_partition_count > 5000
```

处置步骤:

1. 用 kafka-topics.sh --bootstrap-server \<broker> --describe 统计各 topic 的分区数，找出分区数明显偏大的 topic；
2. 确认分区数是否与实际吞吐匹配——很多 topic 的分区是拍脑袋定的；
3. 分区只能增不能减，需要收敛的只能新建 topic 后迁移数据；
4. 清理长期无流量的废弃 topic，这是最快见效的。

### Kafka Produce 请求高延迟[​](#kafka-produce-请求高延迟 "Kafka Produce 请求高延迟的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
kafka_request_time_99p_milliseconds{type="Produce"} > 100
```

处置步骤:

1. 看 broker 的磁盘写入延迟与网络带宽是否打满；
2. 确认 acks 配置——acks=all 时延迟受最慢副本影响，检查是否有副本落后；
3. 用 kafka-topics.sh --describe --under-replicated-partitions 确认副本同步是否正常；
4. 存储侧瓶颈明显的扩容 broker 或换更快的磁盘。

### Kafka 每秒 Fetch 请求超过1000[​](#kafka-每秒-fetch-请求超过1000 "Kafka 每秒 Fetch 请求超过1000的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(rate(kafka_request_count_total{type="Fetch"}[1m])) by (job, instance) > 1000
```

处置步骤:

1. 确认消费者数量与 fetch.min.bytes / fetch.max.wait.ms 配置——这两个值过小会导致空转式高频拉取；
2. 调大 fetch.min.bytes 让消费者攒批拉取，能显著降低请求数；
3. 确认是否有消费者处于空转（无数据仍高频拉取）；
4. 结合 broker CPU 判断是否需要扩容。

### Kafka 每秒 Produce 请求超过1000[​](#kafka-每秒-produce-请求超过1000 "Kafka 每秒 Produce 请求超过1000的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(rate(kafka_request_count_total{type="Produce"}[1m])) by (job, instance) > 1000
```

处置步骤:

1. 检查生产端的 batch.size 与 linger.ms——过小会导致每条消息一个请求；
2. 调大 linger.ms 让生产端攒批发送，能大幅降低请求数；
3. 确认是否有生产者未开启压缩（compression.type）；
4. 结合 broker CPU 判断是否需要扩容。

### Kafka 消费延迟较高[​](#kafka-消费延迟较高 "Kafka 消�费延迟较高的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(max(kafka_log_end_offset) by (job, topic, partition)) by (job, topic)

- on (topic) group_left (consumer_group)

sum(max(kafka_group_commit_offset) by (job, consumer_group, topic, partition)) by (job, consumer_group, topic) > 10000
```

处置步骤:

1. 从告警标签取 topic 与 consumer\_group，用 kafka-consumer-groups.sh --describe --group \<group> 看各分区 LAG 分布；
2. 积压集中在个别分区说明数据倾斜，检查生产端分区键；
3. 均匀积压则是消费者处理慢——先看消费端日志有无异常重试，再扩 consumer 实例（不超过分区数）；
4. 确认消费者没有全部掉线。

### Kafka 请求 S3 失败率较高[​](#kafka-请求-s3-失败率较高 "Kafka 请求 S3 失败率较高的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
sum(rate(kafka_stream_operation_latency_count{operation_type="S3Request", status="failed"}[1m])) by (job, operation_name) > 0.1
```

处置步骤:

1. 从告警标签取 operation\_name 确认是哪类操作失败（上传、下载、删除）；
2. 在 broker 日志里找对应的 S3 错误码，区分权限（403）、限流（503 SlowDown）、网络超时；
3. 限流的联系对象存储侧提配额，或降低写入并发；
4. 权限类的核对 AK/SK 与 bucket 策略，网络类的检查到对象存储的连通性与带宽。

### Kafka 请求错误率过高[​](#kafka-请求错误率过高 "Kafka 请求错误率过高的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
sum(rate(kafka_request_error_count_total{error!="NONE"}[1m])) by (job, instance, error) > 0.1
```

处置步骤:

1. 从告警标签取 error 字段确认错误类型；
2. NOT\_LEADER\_OR\_FOLLOWER 类多为分区 leader 正在切换，确认集群是否在做再平衡；
3. REQUEST\_TIMED\_OUT 类看 broker 负载与磁盘 IO；
4. 认证授权类错误核对客户端的 ACL 与凭据配置。

### Kafka 集群入向网络流量较高[​](#kafka-集群入向网络流量较高 "Kafka 集群入向网络流量较高的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(rate(kafka_broker_network_io_bytes_total{direction="in"}[1m])) by (job) > 50 * 1024 * 1024



sum(rate(kafka_broker_network_io_bytes_total{direction="in"}[1m])) by (job) > 20 * 1024 * 1024
```

处置步骤:

1. 用 kafka-topics.sh 结合 topic 级流量指标找出流量最大的 topic；
2. 确认是业务量自然增长还是有客户端在异常重发；
3. 生产端未开压缩的开启 compression.type=lz4/zstd，通常能立竿见影降低带宽；
4. 确认后按需扩容 broker 或提升网卡带宽。

### Kafka 集群出向网络流量较高[​](#kafka-集群出向网络流量较高 "Kafka 集��群出向网络流量较高的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(rate(kafka_broker_network_io_bytes_total{direction="out"}[1m])) by (job) > 50 * 1024 * 1024



sum(rate(kafka_broker_network_io_bytes_total{direction="out"}[1m])) by (job) > 20 * 1024 * 1024
```

处置步骤:

1. 找出消费流量最大的 topic 与消费组；
2. 确认是否有消费组在做全量回溯消费（从头重新消费），这是出向流量突增的常见原因；
3. 确认消费者数量是否远超实际需要，重复消费同一 topic 的消费组是否可以合并；
4. 按需扩容 broker 或提升网卡带宽。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 59 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                                                                                                                                                                                                                       | 含义                                                           | 单位    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------- |
| `sum by(job, instance) (rate(kafka_network_io_bytes_total{direction="in"}[1m]))`                                                                                                                                                           | Broker节点入站网络IO速率                                       | bytes/s |
| `sum by(job, instance) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                          | Broker节点出站网络IO速率                                       | bytes/s |
| `kafka_partition_count`                                                                                                                                                                                                                    | Broker节点当前分配的分区数量                                   | 个      |
| `sum by(job, instance) (rate(kafka_message_count_total[1m]))`                                                                                                                                                                              | Broker节点每秒消息吞吐量                                       | 个      |
| `sum by(job, consumer_group, topic) (max by(job, consumer_group, topic, partition) (kafka_group_commit_offset))`                                                                                                                           | Consumer Group提交偏移量总和                                   |         |
| `sum by(job, consumer_group, topic, partition) (rate(kafka_group_commit_offset[1m]))`                                                                                                                                                      | Consumer Group提交偏移量速率（每个实例）                       |         |
| `sum by (job) (kafka_group_count)`                                                                                                                                                                                                         | Consumer Group数量总和                                         | 个      |
| `max by(job, consumer_group, topic, partition) (kafka_group_commit_offset)`                                                                                                                                                                | Consumer Group最大提交偏移量                                   |         |
| `kafka_request_time_50p_milliseconds`                                                                                                                                                                                                      | Fetch请求处理时间的50分位数                                    | ms      |
| `kafka_request_time_99p_milliseconds`                                                                                                                                                                                                      | Fetch请求处理时间的99分位数                                    | ms      |
| `avg by(job, instance) (kafka_request_time_99p_milliseconds)`                                                                                                                                                                              | Fetch请求处理时间的99分位数（每个实例）                        | ms      |
| `kafka_request_time_mean_milliseconds`                                                                                                                                                                                                     | Fetch请求处理时间的平均值                                      | ms      |
| `kafka_request_time_max_milliseconds`                                                                                                                                                                                                      | Fetch请求处理时间的最大值                                      | ms      |
| `sum by(job, instance) (rate(kafka_topic_request_failed_total[1m]))`                                                                                                                                                                       | Fetch请求失败速率（每个实例）                                  | 请求/秒 |
| `sum by(job) (kafka_controller_active_count)`                                                                                                                                                                                              | Kafka Controller活跃状态计数                                   | 个      |
| `kafka_request_time_50p_milliseconds`                                                                                                                                                                                                      | Produce请求处理时间的50分位数                                  | ms      |
| `kafka_request_time_99p_milliseconds`                                                                                                                                                                                                      | Produce请求处理时间的99分位数                                  | ms      |
| `avg by(job, instance) (kafka_request_time_99p_milliseconds)`                                                                                                                                                                              | Produce请求处理时间的99分位数（每个实例）                      | ms      |
| `kafka_request_time_mean_milliseconds`                                                                                                                                                                                                     | Produce请求处理时间的平均值                                    | ms      |
| `kafka_request_time_max_milliseconds`                                                                                                                                                                                                      | Produce请求处理时间的最大值                                    | ms      |
| `sum by(job, instance) (rate(kafka_topic_request_failed_total[1m]))`                                                                                                                                                                       | Produce请求失败速率（每个实例）                                | 请求/秒 |
| `max by(job, consumer_group, topic, partition) (kafka_group_commit_offset)`                                                                                                                                                                | 各个Consumer Group和Topic的最大提交偏移量                      |         |
| `max by(job, topic, partition) (kafka_log_end_offset)`                                                                                                                                                                                     | 各个Topic分区的最大日志结束偏移量                              |         |
| `sum by(job, instance, topic) (rate(kafka_request_count_total[1m]))`                                                                                                                                                                       | 实例的Fetch请求速率                                            | 请求/秒 |
| `sum by(job, instance, topic) (rate(kafka_request_count_total[1m]))`                                                                                                                                                                       | 实例的Produce请求速率                                          | 请求/秒 |
| `sum by (job) (kafka_group_dead_count)`                                                                                                                                                                                                    | 已死亡的Consumer Group数量总和                                 | 个      |
| `sum by (job) (max by(job, topic, partition) (kafka_log_size))`                                                                                                                                                                            | 日志大小总和                                                   | bytes   |
| `sum by(job, topic) (max by(job, topic, partition) (kafka_log_end_offset{})) - on(job, topic) group_left(consumer_group) sum by(job, consumer_group, topic) (max by(job, consumer_group, topic, partition) (kafka_group_commit_offset{}))` | 日志消费延迟 lag                                               |         |
| `sum by(job, topic) (max by(job, topic, partition) (kafka_log_end_offset))`                                                                                                                                                                | 日志结束偏移量总和                                             |         |
| `max by(job, topic, partition) (kafka_log_end_offset)`                                                                                                                                                                                     | 日志结束最大偏移量                                             |         |
| `sum by (job) (kafka_group_preparing_rebalance_count)`                                                                                                                                                                                     | 正在准备进行rebalance的Consumer Group数量总和                  | 个      |
| `sum by (job) (kafka_group_completing_rebalance_count)`                                                                                                                                                                                    | 正在等待Leader进行状态分配的Consumer Group数量总和             | 个      |
| `sum by(job, topic) (rate(kafka_network_io_bytes_total{direction="in"}[1m]))`                                                                                                                                                              | 每个Topic的Broker节点入站网络IO速率sum by(topic)               | bytes/s |
| `sum by(job, topic, instance) (rate(kafka_network_io_bytes_total{direction="in"}[1m]))`                                                                                                                                                    | 每个Topic的Broker节点入站网络IO速率sum by(topic, instance)     | bytes/s |
| `sum by(job, topic) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                             | 每个Topic的Broker节点出站网络IO速率sum by(topic)               | bytes/s |
| `sum by(job, topic, instance) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                   | 每个Topic的Broker节点出站网络IO速率sum by(topic, instance)     | bytes/s |
| `sum by(job, topic, partition) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                  | 每个Topic的Broker节点出站网络IO速率sum by(topic, partition)    | bytes/s |
| `sum by(job, topic) (rate(kafka_message_count_total{direction="in"}[1m]))`                                                                                                                                                                 | 每个Topic的Broker节点消息吞吐量（入站）sum by(topic)           | 条/秒   |
| `sum by(job, topic, instance) (rate(kafka_message_count_total{direction="in"}[1m]))`                                                                                                                                                       | 每个Topic的Broker节点消息吞吐量（入站）sum by(topic, instance) | 条/秒   |
| `sum by(job) (rate(kafka_network_io_bytes_total[1m]))`                                                                                                                                                                                     | 每个Topic的Broker节点网络IO速率（集群级别）                    | bytes/s |
| `sum by(job, topic) (kafka_log_size)`                                                                                                                                                                                                      | 每个Topic的日志大小                                            | bytes   |
| `sum by(job, topic, type) (rate(kafka_message_count_total[1m]))`                                                                                                                                                                           | 每个Topic的消息吞吐量sum by(topic, type)                       | 条/秒   |
| `sum by(job, topic, type) (rate(kafka_topic_request_count_total[1m]))`                                                                                                                                                                     | 每个Topic的请求计数sum by(topic, type)                         | 请求/秒 |
| `sum by(job, instance) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                          | 每个实例的Broker节点出站网络IO速率(实例级别)                   | bytes/s |
| `sum by(job, instance) (kafka_partition_count)`                                                                                                                                                                                            | 每个实例的Broker节点分区数量                                   | 个      |
| `sum by(job, instance) (rate(kafka_message_count_total{direction="in"}[1m]))`                                                                                                                                                              | 每个实例的Broker节点消息吞吐量（入站）                         | 条/秒   |
| `sum by(job, instance) (rate(kafka_request_count_total{type="Fetch"}[1m]))`                                                                                                                                                                | 每个实例的Fetch请求速率                                        | 请求/秒 |
| `sum by(job, instance) (rate(kafka_request_count_total{type="Produce"}[1m]))`                                                                                                                                                              | 每个实例的Produce请求速率                                      | 请求/秒 |
| `sum by(job, instance) (kafka_server_connection_count)`                                                                                                                                                                                    | 每个实例的节点当前建立的连接数                                 | 个      |
| `kafka_broker_active_count`                                                                                                                                                                                                                | 活跃Broker数量                                                 | 个      |
| `sum by (job) (kafka_group_stable_count)`                                                                                                                                                                                                  | 稳定状态的Consumer Group数量总和                               | 个      |
| `sum by (job) (kafka_group_empty_count)`                                                                                                                                                                                                   | 空的Consumer Group数量总和                                     | 个      |
| `kafka_server_connection_count`                                                                                                                                                                                                            | 节点当前建立的连接数                                           | 个      |
| `kafka_broker_fenced_count`                                                                                                                                                                                                                | 被fence的Broker数量                                            | 个      |
| `sum by (job) (rate(kafka_request_error_count_total[1m]))`                                                                                                                                                                                 | 请求错误计数总和                                               | 个      |
| `rate(kafka_request_error_count_total[1m])`                                                                                                                                                                                                | 请求错误计数率                                                 | 个      |
| `sum by(job, instance) (rate(kafka_request_error_count_total[1m]))`                                                                                                                                                                        | 请求错误计数率（每个实例）                                     | 请求/秒 |
| `kafka_topic_count`                                                                                                                                                                                                                        | 集群Topic总数                                                  | 个      |
| `kafka_partition_total_count`                                                                                                                                                                                                              | 集群分区总数                                                   | 个      |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[AutoMQ 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/AutoMQ）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/AutoMQ%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `prometheus` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/prometheus)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
