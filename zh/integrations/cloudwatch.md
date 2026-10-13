# 用夜莺监控 AWS CloudWatch

通过 CloudWatch API 拉取任意 namespace 的指标统计值，EC2、RDS、ELB、Lambda 都能接；模板带 RDS 仪表盘和常用规则。

最后校对于 2026-10-13

CloudWatch 插件从 Telegraf 移植，调用 CloudWatch 的 GetMetricData API 按 namespace（`AWS/EC2`、`AWS/RDS`、`AWS/ELB` 等）拉取指标的统计值，可以按维度过滤只采自己关心的资源。认证走标准的凭证链：`role_arn`、显式 AK/SK、profile、环境变量、共享凭证文件、EC2 实例角色，按这个顺序尝试。

CloudWatch 按 API 调用计费，采集周期和 namespace 范围要和账单一起考虑。模板带一张 RDS 仪表盘，规则覆盖 EC2 状态检查失败、CPU 持续高、RDS 连接数与存储、ELB 5xx 和不健康后端。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 19 个面板
* **8 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.cloudwatch`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.cloudwatch/cloud.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.cloudwatch started` 就说明插件已加载。

   ```
   interval="5m"

   [[instances]]

     ## Amazon Region

     # list of region and endpoint, see https://docs.aws.amazon.com/general/latest/gr/cw_region.html

     region = "us-east-1"



     ## Amazon Credentials

     ## Credentials are loaded in the following order

     ## 1) Web identity provider credentials via STS if role_arn and

     ##    web_identity_token_file are specified

     ## 2) Assumed credentials via STS if role_arn is specified

     ## 3) explicit credentials from 'access_key' and 'secret_key'

     ## 4) shared profile from 'profile'

     ## 5) environment variables

     ## 6) shared credentials file

     ## 7) EC2 Instance Profile

     # access_key = ""

     # secret_key = ""

     # token = ""

     # role_arn = ""

     # web_identity_token_file = ""

     # role_session_name = ""

     # profile = ""

     # shared_credential_file = ""



     ## Endpoint to make request against, the correct endpoint is automatically

     ## determined and this option should only be set if you wish to override the

     ## default.

     ##   ex: endpoint_url = "http://localhost:8000"

     endpoint_url = "https://monitoring.ap-southeast-1.amazonaws.com"



     ## Set http_proxy

     # use_system_proxy = false

     # http_proxy_url = "http://localhost:8888"



     ## The minimum period for CloudWatch metrics is 1 minute (60s). However not

     ## all metrics are made available to the 1 minute period. Some are collected

     ## at 3 minute, 5 minute, or larger intervals.

     ## See https://aws.amazon.com/cloudwatch/faqs/#monitoring.

     ## Note that if a period is configured that is smaller than the minimum for a

     ## particular metric, that metric will not be returned by the CloudWatch API

     ## and will not be collected by Telegraf.

     #

     ## Collection Delay (required)

     ## Must account for metrics availability via CloudWatch API

     delay = "5m"



     ## Requested CloudWatch aggregation Period (required)

     ## Must be a multiple of 60s.

     period = "5m"



     ## Recommended if "delay" and "period" are both within 3 hours of request

     ## time. Invalid values will be ignored. Recently Active feature will only

     ## poll for CloudWatch ListMetrics values that occurred within the last 3h.

     ## If enabled, it will reduce total API usage of the CloudWatch ListMetrics

     ## API and require less memory to retain.

     ## Do not enable if "period" or "delay" is longer than 3 hours, as it will

     ## not return data more than 3 hours old.

     ## See https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_ListMetrics.html

     #recently_active = "PT3H"



     ## Configure the TTL for the internal cache of metrics.

     # cache_ttl = "1h"



     ## Metric Statistic Namespaces (required)

     # namespaces = ["AWS/EC2"]



     ## Maximum requests per second. Note that the global default AWS rate limit

     ## is 50 reqs/sec, so if you define multiple namespaces, these should add up

     ## to a maximum of 50.

     ## See http://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_limits.html

     # ratelimit = 25



     ## Timeout for http requests made by the cloudwatch client.

     # timeout = "5s"



     ## Batch Size

     ## The size of each batch to send requests to CloudWatch. 500 is the

     ## suggested largest size. If a request gets to large (413 errors), consider

     ## reducing this amount.

     # batch_size = 500



     ## Namespace-wide statistic filters. These allow fewer queries to be made to

     ## cloudwatch.

     # statistic_include = ["average", "sum", "minimum", "maximum", sample_count"]

     # statistic_exclude = []



     ## Metrics to Pull

     ## Defaults to all Metrics in Namespace if nothing is provided

     ## Refreshes Namespace available metrics every 1h

     #[[instances.metrics]]

     #  names = ["Latency", "RequestCount"]

     #

     #  ## Statistic filters for Metric.  These allow for retrieving specific

     #  ## statistics for an individual metric.

     #  # statistic_include = ["average", "sum", "minimum", "maximum", sample_count"]

     #  # statistic_exclude = []

     #

     #  ## Dimension filters for Metric.

     #  ## All dimensions defined for the metric names must be specified in order

     #  ## to retrieve the metric statistics.

     #  ## 'value' has wildcard / 'glob' matching support such as 'p-*'.

     #  [[instances.metrics.dimensions]]

     #    name = "LoadBalancerName"

     #    value = "p-example"
   ```

2. 在夜莺「集成中心」里找到 CloudWatch，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘           | 面板数 |
| ---------------- | ------ |
| AWS RDS Telegraf | 19     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 8 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### RDS 实例 CPU 使用率过高[​](#rds-实例-cpu-使用率过高 "RDS 实例 CPU 使用率过高的直接链接")

S2 警告 · 持续 10 分钟 · 触发条件:

```
cloudwatch_aws_rds_cpu_utilization_average > 85
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier 与 region，在 Performance Insights 里按 Top SQL 排序找出消耗 CPU 最多的语句；
2. 对定位到的 SQL 执行 EXPLAIN 看执行计划，缺索引导致的全表扫描是最常见原因；
3. 确认没有异常的批量任务或统计查询打在主库上，有则迁到只读副本；
4. 优化后仍不足的再考虑升级实例规格，注意变更需要在维护窗口内进行。

### RDS 实例可用存储空间不足[​](#rds-实��例可用存储空间不足 "RDS 实例可用存储空间不足的直接链接")

S1 紧急 · 持续 5 分钟 · 触发条件:

```
cloudwatch_aws_rds_free_storage_space_average < 10737418240
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier，在控制台确认当前分配容量与已用容量；
2. 立即执行存储扩容（Modify > Allocated storage），RDS 扩容可在线进行但有 6 小时冷却期，不要拖到写满；
3. 同时清理占用：删除过期的临时表、缩短 binlog 保留时间（call mysql.rds\_set\_configuration('binlog retention hours', N)）、归档历史分区；
4. 长期建议开启 Storage Autoscaling 并设置合理的上限。

### RDS 实例 IO 突发余额耗尽[​](#rds-实例-io-突发余额耗尽 "RDS 实例 IO 突发余额耗尽的直接链接")

S1 紧急 · 持续 5 分钟 · 触发条件:

```
cloudwatch_aws_rds_burst_balance_average < 20
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier，在 CloudWatch 里对比 ReadIOPS/WriteIOPS 与卷的基线 IOPS，确认超用幅度；
2. 先从源头降 IO：用 Performance Insights 找出物理读最多的查询并补索引；
3. 应急可把存储类型改为 gp3 或 io1/io2 拿到稳定 IOPS，gp3 变更可在线完成；
4. 也可通过扩大卷容量提高基线 IOPS，但成本效率通常不如直接换 gp3。

### RDS 实例可用内存不足[​](#rds-实例可用内存不足 "RDS 实例可用内存不足的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
cloudwatch_aws_rds_freeable_memory_average < 536870912
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier，在 Performance Insights 里查看内存相关等待事件；
2. 检查参数组中 innodb\_buffer\_pool\_size（MySQL）或 shared\_buffers（PostgreSQL）是否设置过大，超过实例内存的 75% 容易触发；
3. 连接数过多也会吃内存，确认应用侧使用了连接池，并核对 max\_connections 是否远超实际需要；
4. 确认配置合理后再考虑升级到内存更大的实例规格。

### RDS 实例读延迟过高[​](#rds-实例读延迟过高 "RDS 实例读延迟过高的直接链接")

S2 警告 · 持续 10 分钟 · 触发条件:

```
cloudwatch_aws_rds_read_latency_average > 0.05
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier，对比同时段的 ReadIOPS 与 BurstBalance，先排除 IO 突发余额耗尽；
2. IOPS 未打满却延迟高的，检查是否有大批量扫描把缓冲池冲掉，用 Performance Insights 找出物理读最多的 SQL；
3. 补索引减少物理读是最有效的手段，其次是把分析型查询迁到只读副本；
4. 确认负载合理仍延迟高的，升级存储类型到 gp3/io1 拿到更稳定的延迟。

### RDS 实例写延迟过高[​](#rds-实例写延迟过高 "RDS 实例写延迟过高的直接链接")

S2 警告 · 持续 10 分钟 · 触发条件:

```
cloudwatch_aws_rds_write_latency_average > 0.05
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier，先确认是否开启了 Multi-AZ，同步复制会使写延迟高于单可用区实例，属于预期；
2. 对比 WriteIOPS 与卷的 IOPS 上限，打满的按突发余额/存储类型处理；
3. 检查是否有大事务或批量导入正在执行，拆小批次可显著降低延迟；
4. binlog/WAL 写放大明显的，确认 sync\_binlog 与 innodb\_flush\_log\_at\_trx\_commit 的配置是否符合业务对持久性的真实要求。

### RDS 实例磁盘队列积压[​](#rds-实例磁盘队列积压 "RDS 实例磁盘队列积压的直接链接")

S2 警告 · 持续 10 分钟 · 触发条件:

```
cloudwatch_aws_rds_disk_queue_depth_average > 10
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier，同时看 ReadIOPS/WriteIOPS 与 BurstBalance，确认是否已触及 IOPS 上限；
2. 用 Performance Insights 按 IO 等待排序找出制造 IO 的 SQL，优先优化这些语句；
3. 确认没有备份、快照、索引重建等重 IO 任务与业务高峰重叠；
4. 负载确实需要更高 IOPS 的，切换到 gp3 并显式配置 IOPS 与吞吐。

### RDS 实例 Swap 使用过高[​](#rds-实例-swap-使用过高 "RDS 实例 Swap 使用过高的直接链接")

S3 提醒 · 持续 15 分钟 · 触发条件:

```
cloudwatch_aws_rds_swap_usage_average > 268435456
```

处置步骤:

1. 从告警标签取 db\_instance\_identifier，结合 FreeableMemory 一起看，确认内存压力的持续时间；
2. 检查参数组里缓冲池相关参数是否设置过大，以及连接数是否超出预期；
3. 排查是否有大排序、大临时表的查询把内存吃满，用 Performance Insights 定位后优化；
4. 配置与查询都合理仍持续换页的，升级到内存更大的实例规格。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[CloudWatch 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/CloudWatch）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/CloudWatch%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `cloudwatch` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/cloudwatch)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
