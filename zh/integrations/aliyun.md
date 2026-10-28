# 用夜莺监控阿里云

通过云监控 OpenAPI 拉取 ECS、RDS、Redis、SLB、CDN、ARMS 等产品的指标，模板里有几十张按产品划分的仪表盘和告警规则。

最后校对于 2026-10-28

阿里云插件用 `aliyun` 插件调用云监控（CloudMonitor）的 OpenAPI，按 namespace 拉取各产品的指标：ECS、RDS、Redis、MongoDB、SLB/ALB、OSS、CDN、消息队列、ARMS 应用监控等。拉下来的指标以 `aliyun_<namespace>_<metric>` 命名，带实例 ID 和地域标签。

需要一个 RAM 用户，授予 `AliyunCloudMonitorReadOnlyAccess` 并创建 AccessKey。云监控指标粒度一般是 60 秒，采集周期不要短于它。模板是整个目录里仪表盘最多的集成之一，按产品各一张，规则覆盖 ECS CPU 与磁盘、RDS 连接与 IOPS、Redis 内存、SLB 后端异常、CDN 状态码等常见场景。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **44 张仪表盘**，共 883 个面板
* **73 条告警规则**，每条附处置步骤
* **Categraf 采集配置**：`input.aliyun`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.aliyun/cloud.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.aliyun started` 就说明插件已加载。

   ```
   # # collect interval

   # interval = 60

   [[instances]]

   # # endpoint region 参考 https://help.aliyun.com/document_detail/28616.html#section-72p-xhs-6qt

   # region="cn-beijing"

   # endpoint="metrics.cn-hangzhou.aliyuncs.com"

   # access_key_id="your-access-key-id"

   # access_key_secret="your-access-key-secret"

   # interval_times=4

   # delay="10m"

   # period="60s"

   # # namespace 参考 https://help.aliyun.com/document_detail/163515.htm?spm=a2c4g.11186623.0.0.44d65c58mhgNw3

   # namespaces=["acs_ecs_dashboard"]

   # [[instances.metric_filters]]

   # # metric name 参考 https://help.aliyun.com/document_detail/163515.htm?spm=a2c4g.11186623.0.0.401d15c73Z0dZh

   # # 参考页面中的Metric Id 填入下面的metricName ,页面中包含中文的Metric Name对应接口中的Description

   # metric_names=["cpu_cores","vm.TcpCount"]

   # namespace=""

   # ratelimit=25

   # catch_ttl="1h"

   # timeout="5s"
   ```

2. 在夜莺「集成中心」里找到 Alibaba Cloud，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                                          | 面板数 |
| ----------------------------------------------- | ------ |
| 阿里云-消息队列RabbitMQ版                       | 21     |
| ARMS-Application                                | 35     |
| ARMS-DB                                         | 5      |
| 阿里云 ARMS-JVM-SERVICE                         | 14     |
| ARMS-Machine                                    | 7      |
| 阿里云 ARMS-JVM                                 | 14     |
| 阿里云CDN                                       | 5      |
| 阿里云ECS                                       | 5      |
| 阿里云MongoDB                                   | 23     |
| MSE监控大盘                                     | 8      |
| 阿里云MySQL                                     | 15     |
| 阿里云NAT                                       | 19     |
| 阿里云OSS                                       | 43     |
| 阿里云POLARDB-MySQL                             | 11     |
| 阿里云RDS                                       | 5      |
| 阿里云RDS\_N                                    | 8      |
| 阿里云REDIS                                     | 5      |
| 阿里云REDIS 集群版                              | 32     |
| 阿里云REDIS\_N                                  | 7      |
| 阿里云REDIS 标准版                              | 32     |
| 阿里云SLB                                       | 6      |
| 阿里云-负载均衡                                 | 17     |
| 阿里云WAF                                       | 6      |
| 阿里云-ALB                                      | 36     |
| CDN全局大盘                                     | 9      |
| ECS实例详情                                     | 36     |
| 阿里云-EIP                                      | 11     |
| 阿里云-ES                                       | 10     |
| 阿里云-Kafka                                    | 17     |
| 阿里云-MSE Ingress监控中心                      | 18     |
| 阿里云-MongoDB-副本集                           | 29     |
| 阿里云-OceanBase                                | 18     |
| 阿里云-PolarDB                                  | 18     |
| RDS-MySQL-全局概览                              | 5      |
| RDS-MySQL-单实例监控                            | 26     |
| 阿里云-RabbitMQ                                 | 25     |
| Redis/Tair内存型(标准版)实例详情大盘            | 30     |
| Redis/Tair内存型(读写分离版/集群版)实例详情大盘 | 136    |
| Redis社区版-监控大盘-标准版                     | 17     |
| Redis社区版-监控大盘-集群版                     | 25     |
| Redis社区版-监控大盘-读写分离版                 | 25     |
| 阿里云 SLB                                      | 17     |
| WAF                                             | 5      |
| 增强型NAT网关                                   | 27     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 73 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### 阿里云CDN 边缘状态码5XX占比 超过1%[​](#阿里云cdn-边缘状态码5xx占比-超过1 "阿里云CDN 边缘状态码5XX占比 超过1%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_cdn_code5xx_isp_value{} > 1
```

处置步骤:

1. 在控制台的错误码分析里确认是哪些区域/运营商的节点在报错；
2. 确认源站健康状况——CDN 5xx 大多是回源失败导致的；
3. 源站正常则检查回源配置（回源 HOST、协议、超时）；
4. 大面积异常提工单给阿里云，同时可临时切换回源地址。

### 阿里云CDN 边缘状态码4XX占比 达到100%[​](#阿里云cdn-边缘状态码4xx占比-达到100 "阿里云CDN 边缘状态码4XX占比 达到100%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_cdn_code4xx_isp_value{} ==100
```

处置步骤:

1. 在控制台错误码分析确认具体是 403 还是 404；
2. 403 多为防盗链/Referer/URL 鉴权配置与实际请求不符；
3. 404 多为源站资源被删除或回源路径配置错误；
4. 修正配置后刷新 CDN 缓存并复测。

### Mongo副本集-CPU利用率大于50%[​](#mongo副本集-cpu利用率大于50 "Mongo副本集-CPU利用率大于50%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_cpu_utilization_average > 50
```

处置步骤:

1. 在阿里云控制台的实例监控页确认 CPU 曲线是持续还是突发；
2. 用控制台自带的「一键诊断」或慢日志找出消耗 CPU 最高的 SQL；
3. 对慢 SQL 补索引、消除全表扫描，这是最有效的手段；
4. 优化后仍高的在控制台变更实例规格，注意变配会有短暂闪断。

### Mongo副本集-IOPS利用率大于80%[​](#mongo副本集-iops利用率大于80 "Mongo副本集-IOPS利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_iops_utilization_average > 80
```

处置步骤:

1. 在控制台监控页确认 IOPS 曲线与规格上限；
2. 用慢日志找出扫描量最大的 SQL——大量随机读是 IOPS 被打满的主因；
3. 补索引减少扫描、避免大事务批量写；
4. 优化后仍触顶的升级实例规格（IOPS 随规格提升）。

### Mongo副本集-QPS超过突增100%[​](#mongo副本集-qps超过突增100 "Mongo副本集-QPS超过突增100%的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_qps_average offset 5m > 0 and (aliyun_acs_mongodb_qps_average - aliyun_acs_mongodb_qps_average offset 5m) / (aliyun_acs_mongodb_qps_average offset 5m) * 100 > 100
```

处置步骤:

1. 在控制台监控页确认 QPS 曲线的起跳时间点；
2. 对照业务侧的发布记录与营销活动，确认是否为预期流量；
3. 非预期的用慢日志/审计日志按来源统计，定位异常客户端并限流；
4. 确认缓存层是否失效导致请求穿透到数据库。

### Mongo副本集-主从延迟超过5秒[​](#mongo副本集-主从延迟超过5秒 "Mongo副本集-主从延迟超过5秒的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_replication_lag_average > 5
```

处置步骤:

1. 在控制台确认延迟曲线与延迟的节点；
2. 主节点侧排查是否有大事务或批量 DML 在灌数据——这是延迟最常见的原因；
3. 只读节点自身负载高的，减少打到它的查询或升配；
4. 延迟持续扩大时先把读流量切回主节点。

### Mongo副本集-内存利用率大于80%[​](#mongo副本集-内存利用率大于80 "Mongo副本集-内存利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_memory_utilization_average > 80
```

处置步骤:

1. 在控制台监控页确认内存增长趋势；
2. MongoDB 类关注 WiredTiger cache 占比，MySQL 类关注 buffer pool 与连接内存（每连接的 sort/join buffer）；
3. 排查是否有大结果集查询或过高的连接数在吃内存；
4. 优化后仍不足的在控制台升配。

### Mongo副本集-磁盘利用率大于80%[​](#mongo副本集-磁盘利用率大于80 "Mongo副本集-磁盘利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_disk_utilization_average > 80
```

处置步骤:

1. 在控制台的「空间分析」里看是数据、日志还是临时文件占用最大；
2. binlog/redo 占用大的调短日志保留时长；
3. 数据本身大的归档历史数据，删除后需 OPTIMIZE TABLE 或等待空间回收；
4. 尽快在控制台扩容磁盘，云盘扩容通常可在线完成。

### Mongo分片集群-CPU利用率大于50%[​](#mongo分片集群-cpu利用率大于50 "Mongo分片集群-CPU利用率大于50%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_sharding_cpu_utilization_average > 50
```

处置步骤:

1. 在阿里云控制台的实例监控页确认 CPU 曲线是持续还是突发；
2. 用控制台自带的「一键诊断」或慢日志找出消耗 CPU 最高的 SQL；
3. 对慢 SQL 补索引、消除全表扫描，这是最有效的手段；
4. 优化后仍高的在控制台变更实例规格，注意变配会有短暂闪断。

### Mongo分片集群-IOPS利用率大于80%[​](#mongo分片集群-iops利用率大于80 "Mongo分片集群-IOPS利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_sharding_iops_utilization_average > 80
```

处置步骤:

1. 在控制台监控页确认 IOPS 曲线与规格上限；
2. 用慢日志找出扫描量最大的 SQL——大量随机读是 IOPS 被打满的主因；
3. 补索引减少扫描、避免大事务批量写；
4. 优化后仍触顶的升级实例规格（IOPS 随规格提升）。

### Mongo分片集群-QPS超过突增100%[​](#mongo分片集群-qps超过突增100 "Mongo分片集群-QPS超过突增100%的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_sharding_qps_average offset 5m > 0 and (aliyun_acs_mongodb_sharding_qps_average - aliyun_acs_mongodb_sharding_qps_average offset 5m) / (aliyun_acs_mongodb_sharding_qps_average offset 5m) * 100 > 100
```

处置步骤:

1. 在控制台监控页确认 QPS 曲线的起跳时间点；
2. 对照业务侧的发布记录与营销活动，确认是否为预期流量；
3. 非预期的用慢日志/审计日志按来源统计，定位异常客户端并限流；
4. 确认缓存层是否失效导致请求穿透到数据库。

### Mongo分片集群-主从延迟超过5秒[​](#mongo分片集群-主从延迟超过5秒 "Mongo分片集群-主从延迟超过5秒的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_sharding_replication_lag_average > 5
```

处置步骤:

1. 在控制台确认延迟曲线与延迟的节点；
2. 主节点侧排查是否有大事务或批量 DML 在灌数据——这是延迟最常见的原因；
3. 只读节点自身负载高的，减少打到它的查询或升配；
4. 延迟持续扩大时先把读流量切回主节点。

### Mongo分片集群-内存利用率大于80%[​](#mongo分片集群-内存利用率大于80 "Mongo分片集群-内存利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_sharding_memory_utilization_average > 80
```

处置步骤:

1. 在控制台监控页确认内存增长趋势；
2. MongoDB 类关注 WiredTiger cache 占比，MySQL 类关注 buffer pool 与连接内存（每连接的 sort/join buffer）；
3. 排查是否有大结果集查询或过高的连接数在吃内存；
4. 优化后仍不足的在控制台升配。

### Mongo分片集群-磁盘利用率大于80%[​](#mongo分片集群-磁盘利用率大于80 "Mongo分片集群-磁盘利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_sharding_disk_utilization_average > 80
```

处置步骤:

1. 在控制台的「空间分析」里看是数据、日志还是临时文件占用最大；
2. binlog/redo 占用大的调短日志保留时长；
3. 数据本身大的归档历史数据，删除后需 OPTIMIZE TABLE 或等待空间回收；
4. 尽快在控制台扩容磁盘，云盘扩容通常可在线完成。

### Mongo单节点实例-磁盘利用率大于80%[​](#mongo单节点实例-磁盘利用率大于80 "Mongo单节点实例-磁盘利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_single_node_disk_utilization_average > 80
```

处置步骤:

1. 在控制台的「空间分析」里看是数据、日志还是临时文件占用最大；
2. binlog/redo 占用大的调短日志保留时长；
3. 数据本身大的归档历史数据，删除后需 OPTIMIZE TABLE 或等待空间回收；
4. 尽快在控制台扩容磁盘，云盘扩容通常可在线完成。

### Mongo单节点实例-内存利用率大于80%[​](#mongo单节点实例-内存利用率大于80 "Mongo单节点实例-内存利用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_single_node_memory_utilization_average > 80
```

处置步骤:

1. 在控制台监控页确认内存增长趋势；
2. MongoDB 类关注 WiredTiger cache 占比，MySQL 类关注 buffer pool 与连接内存（每连接的 sort/join buffer）；
3. 排查是否有大结果集查询或过高的连接数在吃内存；
4. 优化后仍不足的在控制台升配。

### Mongo单节点实例-CPU利用率大于50%[​](#mongo单节点实例-cpu利用率大于50 "Mongo单节点实例-CPU利用率大于50%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_single_node_cpu_utilization_average > 50
```

处置步骤:

1. 在阿里云控制台的实例监控页确认 CPU 曲线是持续还是突发；
2. 用控制台自带的「一键诊断」或慢日志找出消耗 CPU 最高的 SQL；
3. 对慢 SQL 补索引、消除全表扫描，这是最有效的手段；
4. 优化后仍高的在控制台变更实例规格，注意变配会有短暂闪断。

### Mongo单节点实列-QPS超过突增100%[​](#mongo单节点实列-qps超过突增100 "Mongo单节点实列-QPS超过突增100%的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_mongodb_single_node_qps_average offset 5m > 0 and (aliyun_acs_mongodb_single_node_qps_average - aliyun_acs_mongodb_single_node_qps_average offset 5m) / (aliyun_acs_mongodb_single_node_qps_average offset 5m) * 100 > 100
```

处置步骤:

1. 在控制台监控页确认 QPS 曲线的起跳时间点；
2. 对照业务侧的发布记录与营销活动，确认是否为预期流量；
3. 非预期的用慢日志/审计日志按来源统计，定位异常客户端并限流；
4. 确认缓存层是否失效导致请求穿透到数据库。

### 阿里云-NAT-并发连接水位大于80%[​](#阿里云-nat-并发连接水位大于80 "阿里云-NAT-并发连接水位大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_nat_gateway_session_active_connection_water_lever_value > 80
```

处置步骤:

1. 在控制台确认是并发连接还是新建连接触顶；
2. 用流量日志定位是哪些 ECS 占用了大量连接；
3. 常见根因是应用未复用连接或有扫描类任务——在应用侧改用连接池；
4. 确需更高能力的升级 NAT 网关规格。

### 阿里云-NAT-新建连接水位大于80%[​](#阿里云-nat-新建连接水位大于80 "阿里云-NAT-新建连接水位大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_nat_gateway_session_new_connection_water_lever_value > 80
```

处置步骤:

1. 在控制台确认是并发连接还是新建连接触顶；
2. 用流量日志定位是哪些 ECS 占用了大量连接；
3. 常见根因是应用未复用连接或有扫描类任务——在应用侧改用连接池；
4. 确需更高能力的升级 NAT 网关规格。

### 阿里云-OSS-GetObject请求平均延时大于100ms[​](#阿里云-oss-getobject请求平均延时大于100ms "阿里云-OSS-GetObject请求平均延时大于100ms的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_oss_dashboard_get_object_server_latency_value > 100
```

处置步骤:

1. 在控制台监控页确认延时曲线与请求量是否同步上升；
2. 确认是否有大量大文件读取或跨地域访问——跨地域是延时高的常见原因；
3. 高频小文件读取的考虑加 CDN 或本地缓存；
4. 持续异常且非自身用法问题的提工单给阿里云。

### 阿里云-OSS-可用性低于100%[​](#阿里云-oss-可用性低于100 "阿里云-OSS-可用性低于100%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_oss_dashboard_availability_value < 100
```

处置步骤:

1. 在控制台监控页确认失败请求的时间分布与错误码构成；
2. 4xx 为主说明是客户端问题（权限、签名、不存在的 key），核对应用侧逻辑；
3. 5xx 为主则是服务端问题，立即提工单给阿里云；
4. 确认业务侧是否有重试与降级，没有的要补上。

### 阿里云-OSS-有效请求率低于100%[​](#阿里云-oss-有效请求率低于100 "阿里云-OSS-有效�请求率低于100%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_oss_dashboard_request_valid_rate_value < 100
```

处置步骤:

1. 在控制台监控页确认失败请求的时间分布与错误码构成；
2. 4xx 为主说明是客户端问题（权限、签名、不存在的 key），核对应用侧逻辑；
3. 5xx 为主则是服务端问题，立即提工单给阿里云；
4. 确认业务侧是否有重试与降级，没有的要补上。

### 阿里云-OSS-服务端错误请求占比大于0[​](#阿里云-oss-服务端错误请求占比大于0 "阿里云-OSS-服务端错误请求占比大于0的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_oss_dashboard_server_error_rate_value > 0
```

处置步骤:

1. 在控制台监控页确认 5xx 的量级与持续时间；
2. 确认是否集中在某个 bucket 或某类操作；
3. 服务端错误应立即提工单给阿里云，并附上请求 ID；
4. 期间确认业务侧重试逻辑生效，避免请求直接丢失。

### 阿里云-OSS-服务端错误请求数大于0[​](#阿里云-oss-服务端错误请求数大于0 "阿里云-OSS-服务端错误请求数大于0的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_oss_dashboard_server_error_count_value > 0
```

处置步骤:

1. 在控制台监控页确认 5xx 的量级与持续时间；
2. 确认是否集中在某个 bucket 或某类操作；
3. 服务端错误应立即提工单给阿里云，并附上请求 ID；
4. 期间确认业务侧重试逻辑生效，避免请求直接丢失。

### PolarDB CPU使用率大于80%[​](#polardb-cpu使用率大于80 "PolarDB CPU使用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_cpu_utilization_average > 80
```

处置步骤:

1. 在阿里云控制台的实例监控页确认 CPU 曲线是持续还是突发；
2. 用控制台自带的「一键诊断」或慢日志找出消耗 CPU 最高的 SQL；
3. 对慢 SQL 补索引、消除全表扫描，这是最有效的手段；
4. 优化后仍高的在控制台变更实例规格，注意变配会有短暂闪断。

### PolarDB inode使用率大于80%[​](#polardb-inode使用率大于80 "PolarDB inode使用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_inode_utilization_average > 80
```

处置步骤:

1. 在控制台「空间分析」确认小文件来源，通常是分区表过多或临时文件堆积；
2. 收敛分区数量、清理无用表；
3. 确认是否有大量小表未被清理；
4. 无法收敛的在控制台扩容磁盘（inode 数随容量增长）。

### PolarDB IOPS使用率大于80%[​](#polardb-iops使用率大于80 "PolarDB IOPS使用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_iops_usage_average > 80
```

处置步骤:

1. 在控制台监控页确认 IOPS 曲线与规格上限；
2. 用慢日志找出扫描量最大的 SQL——大量随机读是 IOPS 被打满的主因；
3. 补索引减少扫描、避免大事务批量写；
4. 优化后仍触顶的升级实例规格（IOPS 随规格提升）。

### PolarDB ProxyCPU使用率大于80%[​](#polardb-proxycpu使用率大于80 "PolarDB ProxyCPU使用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_proxy_cpu_utilization_average > 80
```

处置步骤:

1. 在控制台确认 Proxy 的连接数与 QPS 曲线；
2. 连接数过高的收敛应用连接池——Proxy 的开销与连接数强相关；
3. 确认是否开启了不必要的读写分离一致性级别（高一致性会显著增加 Proxy 开销）；
4. 确需更高能力的升级 Proxy 规格。

### PolarDB 只读节点复制延迟大于1秒[​](#polardb-只读节点复制延迟大于1秒 "PolarDB 只读节点复制延迟大于1秒的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_replica_lag_average > 1
```

处置步骤:

1. 在控制台确认延迟曲线与延迟的节点；
2. 主节点侧排查是否有大事务或批量 DML 在灌数据——这是延迟最常见的原因；
3. 只读节点自身负载高的，减少打到它的查询或升配；
4. 延迟持续扩大时先把读流量切回主节点。

### PolarDB内存使用率大于80%[​](#polardb内存使用率大于80 "PolarDB内存使用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_memory_utilization_average > 80
```

处置步骤:

1. 在控制台监控页确认内存增长趋势；
2. MongoDB 类关注 WiredTiger cache 占比，MySQL 类关注 buffer pool 与连接内存（每连接的 sort/join buffer）；
3. 排查是否有大结果集查询或过高的连接数在吃内存；
4. 优化后仍不足的在控制台升配。

### PolarDB慢查量突增大于100[​](#polardb慢查量突增大于100 "PolarDB慢查量突增大于100的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
delta(aliyun_acs_polardb_cluster_slow_queries_ps_average{}[2m]) > 100
```

处置步骤:

1. 在控制台的慢日志页按执行时长排序找出 TOP 慢 SQL；
2. 用 EXPLAIN 看执行计划，重点消除全表扫描；
3. 补索引或改写 SQL 后复测；
4. 确认是否与近期上线的新功能相关，是则优先回滚该功能的查询。

### PolarDB磁盘使用率大于80%[​](#polardb磁盘使用率大于80 "PolarDB磁盘使用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_disk_utilization_average > 80
```

处置步骤:

1. 在控制台的「空间分析」里看是数据、日志还是临时文件占用最大；
2. binlog/redo 占用大的调短日志保留时长；
3. 数据本身大的归档历史数据，删除后需 OPTIMIZE TABLE 或等待空间回收；
4. 尽快在控制台扩容磁盘，云盘扩容通常可在线完成。

### PolarDB连接数使用率大于80%[​](#polardb连接数使用率大于80 "PolarDB连接数使用率大于80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_polardb_cluster_connection_utilization_average > 80
```

处置步骤:

1. 在控制台看连接数曲线与实例规格上限；
2. 用 SHOW PROCESSLIST（MySQL 类）或 db.currentOp()（MongoDB）按来源统计，找出连接异常的应用；
3. 区分业务增长与应用连接池泄漏（大量空闲连接堆积）；
4. 应急升配，根因侧收敛连接池上限并缩短空闲超时。

### 阿里云 RDS 数据库 MySQL/CPU使用率告警[​](#阿里云-rds-数据库-mysqlcpu使用率告警 "阿里云 RDS 数据库 MySQL/CPU使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
AliyunRds_CpuUsage{engine="MySQL"} > 80
```

处置步骤:

1. 在阿里云控制台的实例监控页确认 CPU 曲线是持续还是突发；
2. 用控制台自带的「一键诊断」或慢日志找出消耗 CPU 最高的 SQL；
3. 对慢 SQL 补索引、消除全表扫描，这是最有效的手段；
4. 优化后仍高的在控制台变更实例规格，注意变配会有短暂闪断。

### 阿里云 RDS 数据库 MySQL/IOPS使用率告警[​](#阿里云-rds-数据库-mysqliops使用率告警 "阿里云 RDS 数据库 MySQL/IOPS使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
AliyunRds_IOPSUsage{engine="MySQL"} > 80
```

处置步骤:

1. 在控制台监控页确认 IOPS 曲线与规格上限；
2. 用慢日志找出扫描量最大的 SQL——大量随机读是 IOPS 被打满的主因；
3. 补索引减少扫描、避免大事务批量写；
4. 优化后仍触顶的升级实例规格（IOPS 随规格提升）。

### 阿里云 RDS 数据库 MySQL/QPS波动率告警[​](#阿里云-rds-数据库-mysqlqps波动率告警 "阿里云 RDS 数据库 MySQL/QPS波动率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
100 * delta(AliyunRds_MySQL_QPS{}[5m]) / AliyunRds_MySQL_QPS{} offset 1m > 30
```

处置步骤:

1. 在控制台监控页确认 QPS 曲线的起跳时间点；
2. 对照业务侧的发布记录与营销活动，确认是否为预期流量；
3. 非预期的用慢日志/审计日志按来源统计，定位异常客户端并限流；
4. 确认缓存层是否失效导致请求穿透到数据库。

### 阿里云 RDS 数据库 MySQL/TPS波动率告警[​](#阿里云-rds-数据库-mysqltps波动率告警 "阿里云 RDS 数据库 MySQL/TPS波动率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
100 * delta(AliyunRds_MySQL_TPS{}[5m]) / AliyunRds_MySQL_TPS{} offset 1m > 30
```

处置步骤:

1. 在控制台监控页确认 QPS 曲线的起跳时间点；
2. 对照业务侧的发布记录与营销活动，确认是否为预期流量；
3. 非预期的用慢日志/审计日志按来源统计，定位异常客户端并限流；
4. 确认缓存层是否失效导致请求穿透到数据库。

### 阿里云 RDS 数据库 MySQL/内存使用率告警[​](#阿里云-rds-数据库-mysql内存使用率告警 "阿里云 RDS 数据库 MySQL/内存使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
AliyunRds_MemoryUsage{engine="MySQL"} > 80
```

处置步骤:

1. 在控制台监控页确认内存增长趋势；
2. MongoDB 类关注 WiredTiger cache 占比，MySQL 类关注 buffer pool 与连接内存（每连接的 sort/join buffer）；
3. 排查是否有大结果集查询或过高的连接数在吃内存；
4. 优化后仍不足的在控制台升配。

### 阿里云 RDS 数据库 MySQL/总连接数告警[​](#阿里云-rds-数据库-mysql总连接数告警 "阿里云 RDS 数据库 MySQL/总连接数告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
AliyunRds_MySQL_ThreadsConnected{} > 1200
```

处置步骤:

1. 在控制台看连接数曲线与实例规格上限；
2. 用 SHOW PROCESSLIST（MySQL 类）或 db.currentOp()（MongoDB）按来源统计，找出连接异常的应用；
3. 区分业务增长与应用连接池泄漏（大量空闲连接堆积）；
4. 应急升配，根因侧收敛连接池上限并缩短空闲超时。

### 阿里云 RDS 数据库 MySQL/慢查询占比大于1告警[​](#阿里云-rds-数据库-mysql慢查询占比大于1告警 "阿里云 RDS 数据库 MySQL/慢查询占比大于1告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
100 * max(AliyunRds_MySQL_SlowQueries) by (instanceId, instanceName, regionId) / max(AliyunRds_MySQL_QPS) by (instanceId, instanceName, regionId) > 1
```

处置步骤:

1. 在控制台的慢日志页按执行时长排序找出 TOP 慢 SQL；
2. 用 EXPLAIN 看执行计划，重点消除全表扫描；
3. 补索引或改写 SQL 后复测；
4. 确认是否与近期上线的新功能相关，是则优先回滚该功能的查询。

### 阿里云 RDS 数据库 MySQL/慢查询告警[​](#阿里云-rds-数据库-mysql慢查询告警 "阿里云 RDS 数据库 MySQL/慢查询告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
AliyunRds_MySQL_SlowQueries{} > 100
```

处置步骤:

1. 在控制台的慢日志页按执行时长排序找出 TOP 慢 SQL；
2. 用 EXPLAIN 看执行计划，重点消除全表扫描；
3. 补索引或改写 SQL 后复测；
4. 确认是否与近期上线的新功能相关，是则优先回滚该功能的查询。

### 阿里云 RDS 数据库 MySQL/磁盘空间使用率告警[​](#阿里云-rds-数据库-mysql磁盘空间使用率告警 "阿里云 RDS 数据库 MySQL/磁盘空间使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
AliyunRds_DiskUsage{engine="MySQL"} > 80
```

处置步骤:

1. 在控制台的「空间分析」里看是数据、日志还是临时文件占用最大；
2. binlog/redo 占用大的调短日志保留时长；
3. 数据本身大的归档历史数据，删除后需 OPTIMIZE TABLE 或等待空间回收；
4. 尽快在控制台扩容磁盘，云盘扩容通常可在线完成。

### 阿里云 RDS 数据库 MySQL/运行状态异常告警[​](#阿里云-rds-数据库-mysql运行状态异常告警 "阿里云 RDS 数据库 MySQL/运行状态异常告警的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
{__name__=~"AliyunRds_MySQL_(SlaveIO|SlaveSQL)Running"} != 1
```

处置步骤:

1. 在阿里云控制台的只读实例页确认复制状态与延迟；
2. 控制台一般提供「修复复制」入口，优先使用；
3. 因主实例 binlog 被清理导致的，只能重建只读实例；
4. 恢复前把读流量从该只读实例切走。

### 阿里云 RDS 数据库 MySQL/连接数使用率告警[​](#阿里云-rds-数据库-mysql连接数使用率告警 "阿里云 RDS 数据库 MySQL/连接数使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
AliyunRds_ConnectionUsage{engine="MySQL"} > 80
```

处置步骤:

1. 在控制台看连接数曲线与实例规格上限；
2. 用 SHOW PROCESSLIST（MySQL 类）或 db.currentOp()（MongoDB）按来源统计，找出连接异常的应用；
3. 区分业务增长与应用连接池泄漏（大量空闲连接堆积）；
4. 应急升配，根因侧收敛连接池上限并缩短空闲超时。

### RabbitMQ连接数大于1000[​](#rabbitmq连接数大于1000 "RabbitMQ连接数大于1000的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_amqp_instance_connections_value > 1000
```

处置步骤:

1. 在控制台确认连接数曲线与实例规格上限；
2. 排查客户端是否每次收发都新建连接——正确做法是长连接复用、每线程一个 channel；
3. 确认没有客户端在异常重连；
4. 确需更多连接的升级实例规格。

### RabbitMQ消费者数量为0[​](#rabbitmq消费者数量为0 "RabbitMQ消费者数量为0的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_amqp_instance_consumers_value < 1
```

处置步骤:

1. 在控制台确认是哪个 vhost/queue 没有消费者；
2. 到消费端确认应用进程是否存活、是否报连接或鉴权错误；
3. 消费端正常但未连上的，核对 vhost、queue 名与凭据配置；
4. 恢复消费后观察堆积是否开始下降。

### RabbitMQ消息堆积大于1000[​](#rabbitmq消息堆积大于1000 "RabbitMQ消息堆积大于1000的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_amqp_instance_vhost_queue_message_accum_maximum > 1000
```

处置步骤:

1. 在控制台确认堆积最多的 queue 与堆积增长速度；
2. 确认消费者数量是否为 0 或明显不足——先把消费者拉起或扩容；
3. 消费者在但处理慢的，看消费端日志是否有异常重试或下游依赖超时；
4. 堆积量巨大时评估是否需要临时增加消费并发。

### 阿里云 Redis CPU使用率告警[​](#阿里云-redis-cpu使用率告警 "阿里云 Redis CPU使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)CpuUsage"},"redisType","$1","measure","(.+)CpuUsage") > 80
```

处置步骤:

1. 在控制台的「性能监控」看 CPU 曲线，并用「实时 Key 分析」找热 key；
2. 用慢日志找 O(N) 命令（KEYS、HGETALL、大范围 ZRANGE）并改造；
3. 大 key 拆分是最有效的优化手段；
4. 优化后仍高的在控制台升配或改用集群版分摊。

### 阿里云 Redis QPS使用率告警[​](#阿里云-redis-qps使用率告警 "阿里云 Redis QPS使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)QPSUsage"},"redisType","$1","measure","(.+)QPSUsage") > 80
```

处置步骤:

1. 在控制台确认 QPS 曲线与规格上限；
2. 确认是业务增长还是缓存击穿导致请求穿透；
3. 应用侧加本地缓存、合并批量请求可显著降低 QPS；
4. 确需更高能力的升配或改用集群版。

### 阿里云 Redis 内存使用率告警[​](#阿里云-redis-内存使用率告警 "阿里云 Redis 内存使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)MemoryUsage"},"redisType","$1","measure","(.+)MemoryUsage") > 80
```

处置步骤:

1. 在控制台用「缓存分析」找出占用最大的 key 前缀；
2. 拆分大 key、给未设过期的 key 补 TTL；
3. 确认 maxmemory-policy 是否符合业务预期；
4. 容量确实不足的在控制台升配。

### 阿里云 Redis 命中率告警[​](#阿里云-redis-命中率告警 "阿里云 Redis 命中率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)HitRate"},"redisType","$1","measure","(.+)HitRate") < 30
```

处置步骤:

1. 先排除刚重启或刚扩容导致的冷启动；
2. 在控制台看是否伴随大量 key 驱逐——是则按内存不足处理；
3. 检查业务侧缓存 key 设计与 TTL 是否过短；
4. 确认没有大量查询不存在的 key（缓存穿透），必要时加空值缓存或布隆过滤器。

### 阿里云 Redis 失败次数告警[​](#阿里云-redis-失败次数告警 "阿里云 Redis 失败次数告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_StandardFailedCount"},"redisType","$1","measure","(.+)FailedCount") > 0
```

处置步骤:

1. 在控制台的「审计日志」或应用日志里确认失败的命令类型与错误信息；
2. 常见为内存不足拒绝写入、连接数超限、命令被禁用；
3. 按错误类型分别处理（升配、收敛连接、改用支持的命令）；
4. 确认业务侧有重试与降级逻辑。

### 阿里云 Redis 平均响应时间告警[​](#阿里云-redis-平均响应时间告警 "阿里云 Redis 平均响应时间告警的直接链接")

单位毫秒

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)AvgRt"},"redisType","$1","measure","(.+)AvgRt") > 100000
```

处置步骤:

1. 在控制台用慢日志找耗时最高的命令；
2. 重点排查 O(N) 命令与大 key 操作，改用 SCAN 或分批；
3. 确认是否触发了限流（带宽/QPS 超规格）；
4. 排除以上后在控制台升配。

### 阿里云 Redis 数据同步延迟告警[​](#阿里云-redis-数据同步延迟告警 "阿里云 Redis 数据同步延迟告警的直接链接")

单位毫秒

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)SyncDelayTime"},"redisType","$1","measure","(.+)SyncDelayTime") > 5
```

处置步骤:

1. 在控制台确认延迟曲线与实例架构；
2. 主节点写入量突增会放大延迟，确认是否有批量写入任务；
3. 大 key 同步会造成明显延迟尖峰，用缓存分析定位并拆分；
4. 延迟持续的把读流量切回主节点。

### 阿里云 Redis 最大响应时间告警[​](#阿里云-redis-最大响应时间告警 "阿里云 Redis 最大响应时间告警的直接链接")

单位毫秒

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)MaxRt"},"redisType","$1","measure","(.+)MaxRt") > 100000
```

处置步骤:

1. 在控制台慢日志里找耗时最高的单条命令；
2. 尾延迟通常由大 key 操作或阻塞命令引起，优先拆分大 key；
3. 确认是否有 RDB/AOF 持久化的 fork 造成周期性卡顿；
4. 优化后仍存在的在控制台升配。

### 阿里云 Redis 流入带宽使用率告警[​](#阿里云-redis-流入带宽使用率告警 "阿里云 Redis 流入带宽使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)IntranetInRatio"},"redisType","$1","measure","(.+)IntranetInRatio") > 80
```

处置步骤:

1. 在控制台确认带宽曲线与规格上限；
2. 用缓存分析找大 key——写入大 key 是带宽被打满的主因；
3. 拆分大 key、减少一次性批量写；
4. 确需更高带宽的升配。

### 阿里云 Redis 流出带宽使用率告警[​](#阿里云-redis-流出带宽使用率告警 "阿里云 Redis 流出带宽使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)IntranetOutRatio"},"redisType","$1","measure","(.+)IntranetOutRatio") > 80
```

处置步骤:

1. 在控制台确认带宽曲线与规格上限；
2. 用缓存分析找大 key——读取大 key 是流出带宽的主要来源；
3. 拆分大 key、避免一次性 HGETALL/SMEMBERS 全量读；
4. 确需更高带宽的升配。

### 阿里云 Redis 连接数使用率告警[​](#阿里云-redis-连接数使用率告警 "阿里云 Redis 连接数使用率告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|ShardingProxy|Splitrw|SplitrwProxy)ConnectionUsage"},"redisType","$1","measure","(.+)ConnectionUsage")
```

处置步骤:

1. 在控制台确认连接数曲线与规格上限；
2. 排查是否有客户端未复用连接或连接池配置过大；
3. 应急可在控制台升配提高连接数上限；
4. 根因侧收敛应用连接池并开启连接复用。

### 阿里云 Redis 缓存内Key数量告警[​](#阿里云-redis-缓存内key数量告警 "阿里云 Redis 缓存内Key数量告警的直接链接")

S2 警告 · 持续 3 分钟 · 触发条件:

```
label_replace({__name__=~"AliyunKvstore_(Standard|Sharding|Splitrw)Keys"},"redisType","$1","measure","(.+)Keys") > 80
```

处置步骤:

1. 在控制台用「缓存分析」按前缀统计 key 数量，定位增长最快的前缀；
2. 确认这批 key 是否应该设置 TTL——没有 TTL 的缓存 key 是内存泄漏的常见形态；
3. 补上合理的过期时间并清理存量；
4. 确认业务侧没有把 Redis 当持久化存储使用。

### 阿里云-负载均衡-7层协议实例Upstream 5xx(Count/Second) 大于10[​](#阿里云-负载均衡-7层协议实例upstream-5xxcountsecond-大于10 "阿里云-负载均衡-7层协议实例Upstream 5xx(Count/Second) 大于10的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_upstream_code5xx_average > 10
```

处置步骤:

1. 在控制台确认是 Upstream 5xx（后端返回）还是实例 5xx（SLB 自身）；
2. Upstream 5xx 到后端 ECS 上查应用日志定位根因；
3. 实例 5xx 多为后端全部不健康导致，检查健康检查配置与后端状态；
4. 若与近期发布时间吻合，优先回滚。

### 阿里云-负载均衡-7层协议实例状态码5xx(Count/Second)大于10[​](#阿里云-负载均衡-7层协议实例状态码5xxcountsecond大于10 "阿里云-负载均衡-7层协议实例状态码5xx(Count/Second)大于10的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_status_code5xx_average > 10
```

处置步骤:

1. 在控制台确认是 Upstream 5xx（后端返回）还是实例 5xx（SLB 自身）；
2. Upstream 5xx 到后端 ECS 上查应用日志定位根因；
3. 实例 5xx 多为后端全部不健康导致，检查健康检查配置与后端状态；
4. 若与近期发布时间吻合，优先回滚。

### 阿里云-负载均衡-七层实例QPS使用率大于50%[​](#阿里云-负载均衡-七层实例qps使用率大于50 "阿里云-负载均衡-七层实例QPS使用率大于50%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_qps_utilization_average > 50
```

处置步骤:

1. 在控制台确认 QPS 曲线与实例规格的性能上限；
2. 确认是正常业务增长还是异常流量；
3. 正常增长的升级 SLB 规格（性能保障型可指定上限）；
4. 异常流量的接入 WAF/DDoS 防护限流。

### 阿里云-负载均衡-丢弃连接数大于0[​](#阿里云-负载均衡-丢弃连接数大于0 "阿里云-负载均衡-丢弃连接数大于0的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_drop_connection_average > 0
```

处置步骤:

1. 在控制台对照丢弃曲线与该实例规格的连接数/带宽上限，确认是哪一项触顶；
2. 触顶的立即升级实例规格——性能共享型实例尤其容易在高峰触顶；
3. 确认是否存在异常流量把配额吃满；
4. 升配后持续观察丢弃是否归零。

### 阿里云-负载均衡-入方向丢弃流量大于0[​](#阿里云-负载均衡-入方向丢弃流量大于0 "阿里云-负载均衡-入方向丢弃流量大于0的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_drop_traffic_rx_average > 0
```

处置步骤:

1. 在控制台对照丢弃曲线与该实例规格的连接数/带宽上限，确认是哪一项触顶；
2. 触顶的立即升级实例规格——性能共享型实例尤其容易在高峰触顶；
3. 确认是否存在异常流量把配额吃满；
4. 升配后持续观察丢弃是否归零。

### 阿里云-负载均衡-出方向丢弃流量大于0[​](#阿里云-负载均衡-出方向丢弃流量大于0 "阿里云-负载均衡-出方向丢弃流量大于0的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_drop_traffic_tx_average > 0
```

处置步骤:

1. 在控制台对照丢弃曲线与该实例规格的连接数/带宽上限，确认是哪一项触顶；
2. 触顶的立即升级实例规格——性能共享型实例尤其容易在高峰触顶；
3. 确认是否存在异常流量把配额吃满；
4. 升配后持续观察丢弃是否归零。

### 阿里云-负载均衡-实例新建连接数使用率大于50%[​](#阿里云-负载均衡-实例新建连接数使用率大于50 "阿里云-负载均衡-实例新建连接数使用率大于50%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_new_connection_utilization_average > 50
```

处置步骤:

1. 在控制台确认最大连接数与新建连接数曲线；
2. 确认后端是否响应变慢导致连接堆积——连接数高常是后端慢的表征；
3. 后端正常的升级 SLB 规格；
4. 检查客户端是否未复用连接。

### 阿里云-负载均衡-实例最大连接数使用率大于50%[​](#阿里云-负载均衡-实例最大连接数使用率大于50 "阿里云-负载均衡-实例最大连接数使用率大于50%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
aliyun_acs_slb_dashboard_instance_max_connection_utilization_average > 50
```

处置步骤:

1. 在控制台确认最大连接数与新建连接数曲线；
2. 确认后端是否响应变慢导致连接堆积——连接数高常是后端慢的表征；
3. 后端正常的升级 SLB 规格；
4. 检查客户端是否未复用连接。

### 阿里云 SLB 4XX 占比告警 超过10%[​](#阿里云-slb-4xx-占比告警-超过10 "阿里云 SLB 4XX 占比告警 超过10%的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
100 * AliyunSlb_InstanceStatusCode4xx{} / on(loadBalancerId) group_left sum({__name__=~"AliyunSlb_InstanceStatusCode.+"}) by (loadBalancerId,loadBalancerName,regionId) > 10
```

处置步骤:

1. 在控制台看 4xx 的具体分布，确认是 404 还是 403/401 为主；
2. 404 突增多为前端引用了已下线的接口，核对发布记录；
3. 403/401 突增排查鉴权配置变更或凭据过期；
4. 疑似扫描流量的接入 WAF 做拦截。

### 阿里云 SLB 5XX 占比告警 超过10%[​](#阿里云-slb-5xx-占比告警-超过10 "阿里云 SLB 5XX 占比告警 超过10%的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
100 * AliyunSlb_InstanceStatusCode5xx{} / on(loadBalancerId) group_left sum({__name__=~"AliyunSlb_InstanceStatusCode.+"}) by (loadBalancerId,loadBalancerName,regionId) > 10
```

处置步骤:

1. 在控制台确认是 Upstream 5xx（后端返回）还是实例 5xx（SLB 自身）；
2. Upstream 5xx 到后端 ECS 上查应用日志定位根因；
3. 实例 5xx 多为后端全部不健康导致，检查健康检查配置与后端状态；
4. 若与近期发布时间吻合，优先回滚。

### 阿里云 SLB 七层实例 QPS 使用率超过80%[​](#阿里云-slb-七层实例-qps-使用率超过80 "阿里云 SLB 七层实例 QPS 使用率超过80%的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
AliyunSlb_InstanceQpsUtilization{} > 80
```

处置步骤:

1. 在控制台确认 QPS 曲线与实例规格的性能上限；
2. 确认是正常业务增长还是异常流量；
3. 正常增长的升级 SLB 规格（性能保障型可指定上限）；
4. 异常流量的接入 WAF/DDoS 防护限流。

### 阿里云 SLB 实例最大连接数使用率超过80%[​](#阿里云-slb-实例最大连接数使用率超过80 "阿里云 SLB 实例最大连接数使用率超过80%的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
AliyunSlb_InstanceMaxConnectionUtilization{} > 80
```

处置步骤:

1. 在控制台确认最大连接数与新建连接数曲线；
2. 确认后端是否响应变慢导致连接堆积——连接数高常是后端慢的表征；
3. 后端正常的升级 SLB 规格；
4. 检查客户端是否未复用连接。

### 阿里云 SLB 每秒Drop连接数超过10[​](#阿里云-slb-每秒drop连接数超过10 "阿里云 SLB 每秒Drop连接数超过10的直接链接")

S2 警告 · 持续 5 分钟 · 触发条件:

```
AliyunSlb_DropConnection{} > 10
```

处置步骤:

1. 在控制台对照丢弃曲线与该实例规格的连接数/带宽上限，确认是哪一项触顶；
2. 触顶的立即升级实例规格——性能共享型实例尤其容易在高峰触顶；
3. 确认是否存在异常流量把配额吃满；
4. 升配后持续观察丢弃是否归零。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Alibaba Cloud 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/AliYun）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/AliYun%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `aliyun` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/aliyun)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
