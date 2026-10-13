---
title: "用夜莺监控 Logstash"
sidebar_label: "Logstash"
description: "通过 Logstash 的节点 API 采集 pipeline 的事件进出与过滤耗时、队列和 JVM 状态，规则盯事件堆积和 JVM 压力。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Logstash
toc_max_heading_level: 2
mdx:
  format: md
---

Logstash 默认在 9600 端口提供 HTTP API，插件抓 `_node/stats`：每个 pipeline 的输入、过滤、输出事件数与耗时，持久化队列的容量与积压，JVM 堆、GC 与线程，以及进程的 CPU 和文件描述符。

API 开了 Basic Auth 或 TLS 就同步配置用户名、密码和证书。模板里事件吞吐、队列和 pipeline 面板只有在 Logstash 真正处理事件后才有非零数据。规则覆盖事件处理停滞、队列持续增长、JVM 堆逼近上限和 Logstash 不可达。

## 模板里有什么

- **1 张仪表盘**，共 11 个面板
- **6 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.logstash`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.logstash/logstash.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.logstash started` 就说明插件已加载。

   ```toml
   # # collect interval
   # interval = 15

   # Read metrics exposed by Logstash
   [[instances]]
   # # interval = global.interval * interval_times
   # interval_times = 1

   # append labels
   # labels = { instance="x" }

   ## The URL of the exposed Logstash API endpoint.
   # url = "http://127.0.0.1:9600"
   url = ""

   ## Use Logstash 5 single pipeline API, set to true when monitoring
   ## Logstash 5.
   # single_pipeline = false

   ## Enable optional collection components.  Can contain
   ## "pipelines", "process", and "jvm".
   # collect = ["pipelines", "process", "jvm"]

   ## Timeout for HTTP requests.
   # timeout = "5s"

   ## Optional HTTP Basic Auth credentials.
   # username = "username"
   # password = "pa$$word"

   ## Optional HTTP headers.
   # [inputs.logstash.headers]
   #   "X-Special-Header" = "Special-Value"

   ## Optional TLS Config
   # use_tls = false
   # tls_min_version = "1.2"
   # tls_ca = "/etc/categraf/ca.pem"
   # tls_cert = "/etc/categraf/cert.pem"
   # tls_key = "/etc/categraf/key.pem"
   ## Use TLS but skip chain & host verification
   # insecure_skip_verify = true
   ```

1. 在夜莺「集成中心」里找到 Logstash，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| logstash | 11 |

## 内置告警规则

共 6 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Logstash 管道停止输出

S1 紧急 · 持续 5 分钟 · 触发条件:

```promql
rate(logstash_events_out[5m]) == 0 and rate(logstash_events_in[5m]) > 0
```

处置步骤:

1. 执行 curl -s localhost:9600/_node/stats/pipelines?pretty 找出 events.out 不增长的 pipeline；
1. 对该 pipeline 看各 plugin 的 events 明细，卡住的通常是 output（Elasticsearch 拒写、Kafka 不可达）；
1. 查看 logstash-plain.log 里的 retry/backoff 报错，确认下游是否 429 或连接超时；
1. 下游恢复后观察 events.out 是否回升，仍不动则重启 Logstash 并检查持久化队列是否损坏。

### Logstash JVM 堆内存使用率过高

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
logstash_jvm_mem_heap_used_in_bytes / (logstash_jvm_mem_heap_max_in_bytes > 0) * 100 > 85
```

处置步骤:

1. 执行 curl -s localhost:9600/_node/stats/jvm?pretty 确认 heap_used_percent 与 GC 次数；
1. 最常见诱因是 pipeline.batch.size 配得过大，先按 batch.size × worker 数 × 单事件大小估算内存占用并调小；
1. 检查是否有 aggregate、ruby 等在内存里缓存大量状态的 filter，限制其缓存规模；
1. 确认配置合理后再调大 jvm.options 里的 -Xmx，一般不超过物理内存的一半且不超过 8GB。

### Logstash 老年代 GC 频繁

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(logstash_jvm_gc_collectors_old_collection_count[5m]) * 60 > 1
```

处置步骤:

1. 执行 curl -s localhost:9600/_node/stats/jvm?pretty 对比 old collection_count 与 collection_time_in_millis 的增速；
1. 先按堆内存告警的思路调小 pipeline.batch.size 并检查有状态 filter；
1. 用 jmap -histo:live \<pid> | head -30 看堆里对象分布，异常时通常是某类事件对象堆积；
1. 调整后观察 old GC 频率是否回落，仍高则考虑拆分 pipeline 或横向扩容 Logstash 实例。

### Logstash 入队等待时间过长

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(logstash_events_queue_push_duration_in_millis[5m]) / (rate(logstash_events_in[5m]) > 0) > 100
```

处置步骤:

1. 执行 curl -s localhost:9600/_node/stats/pipelines?pretty 对比各 plugin 的 duration_in_millis，找出耗时占比最高的那个；
1. 耗时集中在 output 的先查下游（Elasticsearch 写入拒绝率、bulk 队列），下游是根因时优化下游而不是 Logstash；
1. 耗时集中在 filter 的重点看 grok：把复杂正则改成 dissect 或加锚点，避免回溯爆炸；
1. 单机 CPU 已打满则调大 pipeline.workers 无效，需要横向扩容实例。

### Logstash 单事件处理耗时过长

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(logstash_events_duration_in_millis[5m]) / (rate(logstash_events_out[5m]) > 0) > 100
```

处置步骤:

1. 执行 curl -s localhost:9600/_node/stats/pipelines?pretty 按 plugin 的 duration_in_millis 排序定位慢插件；
1. grok 慢是最常见原因，用 --config.debug 配合小样本压测，把宽泛正则替换为 dissect；
1. 涉及外部查询的 filter（jdbc_streaming、elasticsearch、dns）要确认已开启缓存并设置超时；
1. 优化后用同一批样本回归对比 duration，确认确实降下来。

### Logstash 进程 CPU 使用率过高

S3 提醒 · 持续 10 分钟 · 触发条件:

```promql
logstash_process_cpu_percent > 90
```

处置步骤:

1. 执行 curl -s localhost:9600/_node/stats/pipelines?pretty 找出 CPU 消耗最大的 pipeline 与 plugin；
1. 用 jstack \<pid> 抓栈，大量线程停在正则相关方法说明是 grok 开销；
1. 优化 filter 后仍高的，确认 pipeline.workers 是否超过实际 CPU 核数导致上下文切换开销；
1. 单机确实到顶则横向扩容并在采集端做负载分流。

## 相关链接

- [Logstash 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Logstash）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `logstash` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/logstash)：完整配置项和指标列表。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
