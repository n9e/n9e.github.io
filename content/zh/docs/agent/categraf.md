---
title: "Categraf"
description: "使用 Categraf 作为夜莺监控的采集器，采集指标、日志等数据，和夜莺项目丝滑对接。Categraf 是一个开源的采集器，支持 Prometheus remote write 协议。通过 Prometheus remote write 协议，Categraf 可以将指标数据推送到夜莺监控。Categraf 还可以采集日志数据，并将其写入 Kafka。"
lead: ""
date: 2025-01-26T10:55:54+08:00
lastmod: 2025-08-08T10:32:43.773+08:00
draft: false
images: []
menu:
  docs:
    parent: "agent"
weight: 700
toc: true
---

[Categraf](https://github.com/flashcatcloud/categraf) 是一个可以采集指标和日志的代理。Categraf 使用 `prometheus remote write` 作为指标数据推送协议，因此可以将指标推送到夜莺，日志的话，Categraf 是对接写给 Kafka。

## 配置

Categraf 的配置文件: `conf/config.toml`

```toml
[writer_opt]
# default: 2000
batch = 2000
# channel(as queue) size
chan_size = 10000

[[writers]]
url = "http://N9E:17000/prometheus/v1/write"

# Basic auth username
basic_auth_user = ""

# Basic auth password
basic_auth_pass = ""

# timeout settings, unit: ms
timeout = 5000
dial_timeout = 2500
max_idle_conns_per_host = 100

[heartbeat]
enable = true

# report os version cpu.util mem.util metadata
url = "http://N9E:17000/v1/n9e/heartbeat"

# interval, unit: s
interval = 10

# Basic auth username
basic_auth_user = ""

# Basic auth password
basic_auth_pass = ""

## Optional headers
# headers = ["X-From", "categraf", "X-Xyz", "abc"]

# timeout settings, unit: ms
timeout = 5000
dial_timeout = 2500
max_idle_conns_per_host = 100
```

我们建议您使用 Categraf 采集机器的 CPU、内存等常规指标，因为 Categraf 和夜莺的对接最为丝滑。Categraf 会自动采集机器的元信息并且和夜莺对接提供告警自愈能力。

至于 MySQL、Redis、Oracle、ElasticSearch、Kafka 等各类监控对象的数据采集，您也可以使用 Categraf，也可以使用您熟悉的其他采集器。

## 边缘模式

如果您采用了夜莺的边缘模式，即在某个边缘机房部署了 n9e-edge 组件，那边缘机房的 Categraf 就可以直接将数据推送到边缘机房的 n9e-edge 组件上，不需要推送到中心机房的夜莺。即：Categraf 配置文件中的 writer 和 heartbeat 的两个 url 都改为边缘机房的 n9e-edge 地址即可。

## FAQ

### 1.如何监控多个目标？

比如有多个 MySQL 实例要监控，或者有多个进程要监控，应该如何配置？

Categraf 大部分插件的样例配置里都有一个 `[[instances]]` 的配置段，但凡有这个配置段的插件，就可以通过增加 `[[instances]]` 来监控多个目标。Categraf 的配置文件是 toml 格式，双中括号表示数组。比如 MySQL 插件的配置样例：

```toml
[[instances]]
address = "10.1.2.3:3306"
username = "categraf"
password = "XXXXXXXX"
labels = { instance="n9e-mysql-01" }

[[instances]]
address = "10.1.2.4:3306"
username = "categraf"
password = "XXXXXXXX"
labels = { instance="n9e-mysql-02" }
```

再比如进程监控插件 procstat 的配置样例：

```toml
[[instances]]
search_exec_substring = "mysqld"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]

[[instances]]
search_exec_substring = "n9e-plus"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]
```

### 2.配置了采集插件，但是页面上没有查到数据

细化拆解，需要确认：

- 数据采集环节
- 数据传输环节

以 `http_response` 插件为例，通过如下命令可以查看 categraf 是否采集到了数据：

```shell
./categraf --test --inputs http_response
```

如果正常输出 `http_response_` 打头的指标，且没有报错，则表示采集成功。

数据传输链路是：`categraf -> nightingale -> tsdb`，所以要查看 categraf 的日志和 nightingale 的日志。参考 [这里](https://flashcat.cloud/docs/content/flashcat-monitor/nightingale-v6/faq/how-to-check-logs/) 的方法查看日志。