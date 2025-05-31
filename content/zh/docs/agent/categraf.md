---
title: "Categraf"
description: "使用 Categraf 作为夜莺监控的采集器，采集指标、日志等数据，和夜莺项目丝滑对接。Categraf 是一个开源的采集器，支持 Prometheus remote write 协议。通过 Prometheus remote write 协议，Categraf 可以将指标数据推送到夜莺监控。Categraf 还可以采集日志数据，并将其写入 Kafka。"
lead: ""
date: 2025-01-26T10:55:54+08:00
lastmod: 2025-05-31T17:39:29.974+08:00
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
