---
title: "Oracle"
description: "Oracle 监控数据的采集有多种方式，可以使用 Categraf、Cprobe 等各类工具，其原理都是类似的，无非就是连到 Oracle 实例上，执行相关命令获取监控数据"
date: 2025-07-25T17:41:46+08:00
lastmod: 2025-07-25T17:41:46+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5400
toc: true
---

> 对于监控系统，基础功能的强弱确实非常关键，但是如何在不同的场景落地实践，则更为关键。在《监控实践》章节，搜罗各类监控实践经验，会以不同的组件分门别类，您如果对某个组件有好的实践经验，欢迎提 PR，把您的文章链接附到对应的组件目录下。

Oracle 监控数据的采集有多种方式，可以使用 [Categraf](https://github.com/flashcatcloud/categraf)、[Cprobe](https://github.com/cprobe/cprobe) 等各类工具，其原理都是类似的，无非就是连到 Oracle 实例上，执行相关命令获取监控数据。本文以 Categraf v0.4.15 以上版本为例，介绍 Oracle 监控数据的采集配置方法。

## Oracle 插件配置概述

Categraf 的所有插件配置，默认都在 `conf` 目录下，Oracle 的配置目录是 `conf/input.oracle`，该目录下有两个配置文件：

- `oracle.toml`：Oracle 插件的主配置文件，配置不同 Oracle 实例的连接、认证信息；Categraf 可以同时连接多个 Oracle 实例，配置文件中可以配置多个实例的连接信息，即不同的 `[[instances]]` 配置段。
- `metric.toml`：Oracle 插件通过执行各类 SQL 采集 Oracle 监控数据，有些 SQL 是通用的，希望所有的 Oracle 实例都去执行采集，有些 SQL 是特定实例的，只有特定实例才去执行采集，通用的 SQL 都在 `metric.toml` 中配置，特定实例的 SQL 在 `oracle.toml` 中配置。

## oracle.toml

oracle.toml 配置样例如下：

```toml
# 默认的采集频率，下面配置的所有的 oracle 的实例默认都会使用这个采集频率
# 如果某个实例需要不同的采集频率，可以在实例配置中使用 interval_times 来调整
# 各个实例的最终采集频率 = interval * interval_times
# 如果这里的 interval 也没有配置，那就使用 Categraf 全局配置中的 interval（默认是 15 秒）
# 单位是秒，所以默认是 15 秒采集一次监控数据
interval = 15

# 这是第一个 Oracle 实例的配置，使用一大块 [[instances]] 来配置
# [[instances]] 使用双中括号包裹，双中括号在 TOML 中表示数组
# 即可以配置多个 [[instances]] 区块，也就是可以配置多个 Oracle 实例
[[instances]]
address = "10.1.2.3:1521/orcl"
username = "monitor"
password = "123456"
is_sys_dba = false
is_sys_oper = false
disable_connection_pool = false
max_open_connections = 5
# 这个实例最终的采集频率是 interval * interval_times
interval_times = 1
# 这里可以为当前实例附加一些维度标签，这些维度标签最终会附加到当前实例的监控数据上面
labels = { region="cloud" }

# instances 下面的 metrics 配置段，表示当前实例需要采集的监控数据
# 注意，这个 metrics 配置段是当前实例特有的，其他实例不会去执行这些 SQL
[[instances.metrics]]
mesurement = "sessions"
label_fields = [ "status", "type" ]
metric_fields = [ "value" ]
timeout = "3s"
request = '''
SELECT status, type, COUNT(*) as value FROM v$session GROUP BY status, type
'''

[[instances]]
address = "192.168.10.10:1521/orcl"
username = "monitor"
password = "123456"
is_sys_dba = false
is_sys_oper = false
disable_connection_pool = false
max_open_connections = 5
labels = { region="local" }

# 第二个实例下面没有对应的 instances.metrics 配置段，说明没有独属于这个实例的采集 SQL
# 即：第二个实例仅会执行 metric.toml 中配置的通用 SQL
```

Oracle 监控数据采集原理：周期性执行 SQL，把返回的结果转换为 Prometheus 时序数据格式，发送到服务端。SQL 执行的结果是多行多列的二维表格，那我们就需要通过配置告诉 Categraf，哪些列作为时序数据的标签（label），哪些列作为时序数据的值（metric value）。

- mesurement: 自定义的一个指标前缀
- request: 查询监控数据的 SQL 语句
- label_fields: SQL 查到的内容，会有多列，哪些列作为时序数据的 label
- metric_fields: SQL 查到的内容，会有多列，哪些列作为时序数据的值
- field_to_append: 是否要把某列的内容附到监控指标名称里，作为指标的后缀
- timeout: SQL 执行的超时时间
- ignore_zero_result: 是否忽略查询结果中值为 0 的行，如果不忽略（设置为 false）且没有查到数据的话会打印一行错误日志，如果忽略了（设置为 true），则查不到数据的时候不会打印错误日志

*注：建议不要使用sys用户来进行采集，因为在oracle 12c及之后版本，go-ora的ping方法在判断oracle up状态时，不准确。*

## metric.toml

这里配置了一些常用的 Oracle 监控数据采集 SQL，Categraf 会定期执行这些 SQL，获取所有 Oracle 实例的监控数据。这里的 SQL 具体含义、作用，可能 Oracle DBA 才比较熟悉，欢迎各位 Oracle DBA 写文章分享这些 SQL 的含义和作用，完事可以把您的文章链接提个 PR 放到本页文档里，让更多人受益。
