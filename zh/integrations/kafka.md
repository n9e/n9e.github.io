# 用夜莺监控 Kafka

Broker 指标走 JMX，消费者延迟靠内置的 kafka\_exporter 逻辑；模板分 Categraf 和 exporter 两套，规则盯积压、离线分区和 ISR 收缩。

最后校对于 2026-10-31

Kafka 的核心指标通过 JMX 暴露，这部分用 jolokia 或 jmx\_exporter 采集即可。Categraf 的 `kafka` 插件解决的是 JMX 拿不到的那块：消费组的 lag、每个分区的 offset 和消费速率。它 fork 自 davidmparrott 版本的 kafka\_exporter，指标名和 danielqsj 版本略有差异，设置 `rename_uncommit_offset_to_lag = true` 可以切回更常见的 `kafka_consumergroup_lag` 命名。

模板里的仪表盘分 Categraf 和 kafka\_exporter 两套。规则覆盖消费积压持续增长、分区离线、under-replicated、ISR 收缩和 Broker 掉线。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **2 张仪表盘**，共 24 个面板
* **5 条告警规则**，每条附处置步骤
* **6 条指标说明**
* **Categraf 采集配置**：`input.kafka`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.kafka/kafka.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.kafka started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 15



   ############################################################################

   # !!! uncomment [[instances]] to enable this plugin

   [[instances]]

   # # interval = global.interval * interval_times

   # interval_times = 1



   # append some labels to metrics

   # cluster is a preferred tag with the cluster name. If none is provided, the first of kafka_uris will be used

   labels = { cluster="kafka-cluster-01" }



   # log level only for kafka exporter

   log_level = "error"



   # Address (host:port) of Kafka server.

   # kafka_uris = ["127.0.0.1:9092","127.0.0.1:9092","127.0.0.1:9092"]

   kafka_uris = []



   # Connect using SASL/PLAIN

   # Default is false

   # use_sasl = false



   # Only set this to false if using a non-Kafka SASL proxy

   # Default is true

   # use_sasl_handshake = false



   # SASL user name

   # sasl_username = "username"



   # SASL user password

   # sasl_password = "password"



   # The SASL SCRAM SHA algorithm sha256 or sha512 as mechanism

   # sasl_mechanism = ""



   # Connect using TLS

   # use_tls = false



   # The optional certificate authority file for TLS client authentication

   # ca_file = ""



   # The optional certificate file for TLS client authentication

   # cert_file = ""



   # The optional key file for TLS client authentication

   # key_file = ""



   # If true, the server's certificate will not be checked for validity. This will make your HTTPS connections insecure

   # insecure_skip_verify = true



   # Kafka broker version

   # Default is 2.0.0

   # kafka_version = "2.0.0"



   # if you need to use a group from zookeeper

   # Default is false

   # use_zookeeper_lag = false



   # Address array (hosts) of zookeeper server.

   # zookeeper_uris = []



   # Metadata refresh interval

   # Default is 1m

   # metadata_refresh_interval = "1m"



   # Whether show the offset/lag for all consumer group, otherwise, only show connected consumer groups, default is true

   # Default is true

   # offset_show_all = true



   # If true, all scrapes will trigger kafka operations otherwise, they will share results. WARN: This should be disabled on large clusters

   # Default is false

   # allow_concurrency = false



   # Maximum number of offsets to store in the interpolation table for a partition

   # Default is 1000

   # max_offsets = 1000



   # How frequently should the interpolation table be pruned, in seconds.

   # Default is 30

   # prune_interval_seconds = 30



   # Regex filter for topics to be monitored

   # Default is ".*"

   # topics_filter_regex = ".*"



   # Regex filter for consumer groups to be monitored

   # Default is ".*"

   # groups_filter_regex = ".*"



   # if rename  kafka_consumergroup_uncommitted_offsets to kafka_consumergroup_lag

   # Default is false

   # rename_uncommit_offset_to_lag = false



   # if disable calculating lag rate

   # Default is false

   # disable_calculate_lag_rate = false
   ```

2. 在夜莺「集成中心」里找到 Kafka，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘            | 面板数 |
| ----------------- | ------ |
| Kafka By Categraf | 12     |
| Kafka - exporter  | 12     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 5 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（3）[​](#categraf-采集3 "Categraf 采集（3）的直接链接")

#### kafka 分区副本未同步[​](#kafka-分区副本未同步 "kafka 分区副本未同步的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
max by (topic) (kafka_topic_partition_under_replicated_partition) > 0
```

处置步骤:

1. 从告警标签取 topic，执行 kafka-topics.sh --describe --topic \<topic> --bootstrap-server \<broker>，对比 Isr 与 Replicas 找出缺失的副本所在 broker；
2. 到该 broker 看 server.log 是否有磁盘满、GC 卡顿或网络超时；
3. broker 已下线则先恢复它，副本会自动追平；
4. 长时间追不平可用 kafka-reassign-partitions.sh 把副本迁到健康 broker。

#### kafka broker 数量下降[​](#kafka-broker-数量下降 "kafka broker 数量下降的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
delta(kafka_brokers[10m]) < 0
```

处置步骤:

1. 执行 kafka-broker-api-versions.sh --bootstrap-server \<broker> 确认当前在线 broker 列表，对比配置找出缺失的节点；
2. 到该节点确认进程是否存活、server.log 里是否有 OOM 或磁盘错误；
3. 拉起后用 kafka-topics.sh --describe --under-replicated-partitions 确认副本已追平；
4. 若节点短期修不好，用 kafka-reassign-partitions.sh 把其上的分区迁走以恢复冗余。

#### kafka 消费组积压超过 1 万条[​](#kafka-消费组积压超过-1-万条 "kafka 消费组积压超过 1 万条的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
max by (topic, consumergroup) (kafka_consumergroup_uncommitted_offsets) > 10000
```

处置步骤:

1. 从告警标签取 consumergroup 与 topic，执行 kafka-consumer-groups.sh --describe --group \<group> --bootstrap-server \<broker> 看各分区 LAG 分布；
2. 积压集中在个别分区说明数据倾斜，检查生产端分区键；
3. 均匀积压则是消费者处理慢——先看消费端日志有无异常重试，再考虑扩consumer 实例（不超过分区数）或提高单条处理效率；
4. 确认消费者没有全部掉线（MEMBERS 为 0 要先把消费者拉起来）。

### Exporter 采集（2）[​](#exporter-采集2 "Exporter 采集（2）的直接链接")

#### Kafka consumer group lag exceeds 10000 messages - exporter[​](#kafka-consumer-group-lag-exceeds-10000-messages---exporter "Kafka consumer group lag exceeds 10000 messages - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
max by (topic, consumergroup) (kafka_consumergroup_lag) > 10000
```

处置步骤:

1. 从告警标签取 consumergroup 与 topic，执行 kafka-consumer-groups.sh --describe --group \<group> --bootstrap-server \<broker> 看各分区 LAG 分布；
2. 积压集中在个别分区说明数据倾斜，检查生产端分区键；
3. 均匀积压则是消费者处理慢——先看消费端日志有无异常重试，再考虑扩consumer 实例（不超过分区数）或提高单条处理效率；
4. 确认消费者没有全部掉线（MEMBERS 为 0 要先把消费者拉起来）。

#### Kafka under-replicated partitions - exporter[​](#kafka-under-replicated-partitions---exporter "Kafka under-replicated partitions - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
max by (topic) (kafka_topic_partition_under_replicated_partition) > 0
```

处置步骤:

1. 从告警标签取 topic，执行 kafka-topics.sh --describe --topic \<topic> --bootstrap-server \<broker>，对比 Isr 与 Replicas 找出缺失的副本所在 broker；
2. 到该 broker 看 server.log 是否有磁盘满、GC 卡顿或网络超时；
3. broker 已下线则先恢复它，副本会自动追平；
4. 长时间追不平可用 kafka-reassign-partitions.sh 把副本迁到健康 broker。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 6 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                                                       | 含义                         | 单位 |
| -------------------------------------------------------------------------- | ---------------------------- | ---- |
| `kafka_brokers`                                                            | Broker 数量                  |      |
| `kafka_topic_partition_under_replicated_partition`                         | Partition 副本不同步的数量   |      |
| `kafka_topic_partition_replicas`                                           | Partition 副本数量           |      |
| `sum(irate(kafka_consumergroup_current_offset[3m])) without (partition)`   | 各个 Topic 每秒消费消息量    |      |
| `sum(irate(kafka_topic_partition_current_offset[3m])) without (partition)` | 各个 Topic 每秒生产消息量    |      |
| `kafka_topic_partitions`                                                   | 各个 Topic 的 Partition 数量 |      |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Kafka 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Kafka）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Kafka%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `kafka` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/kafka)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
