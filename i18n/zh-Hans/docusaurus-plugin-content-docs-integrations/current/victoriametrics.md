---
title: "用夜莺监控 VictoriaMetrics"
sidebar_label: "VictoriaMetrics"
description: "单机版和集群版都自带 /metrics，模板分别覆盖 vmsingle 以及 vmstorage、vmselect、vminsert 三个集群组件。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/VictoriaMetrics
toc_max_heading_level: 2
mdx:
  format: md
---

VictoriaMetrics 通常既是夜莺的时序库，也是需要被监控的对象。单机版在 8428 端口暴露 `/metrics`；集群版要分别抓 vmstorage（8482）、vmselect（8481）和 vminsert（8480），只抓一个组件看不到全貌。

模板分单机和集群两张仪表盘，规则覆盖写入拒绝、慢插入、查询超时、磁盘空间、存储节点离线和合并积压。

## 模板里有什么

- **2 张仪表盘**，共 85 个面板
- **9 条告警规则**，每条附处置步骤

## 怎么接入

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](/docs/data/prometheus)，模板同样能用。

```toml
# conf/input.prometheus/victoriametrics.toml
[[instances]]
urls = ["http://127.0.0.1:8428/metrics"]
url_label_key = "instance"
url_label_value = "{{.Host}}"
labels = { job = "victoriametrics", service = "vmsingle" }
```

集群版把 `urls` 换成各组件的地址，并把 `service` 标签分别设为 `vmstorage`、`vmselect`、`vminsert`。

1. 在夜莺「集成中心」里找到 VictoriaMetrics，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| VictoriaMetrics - Cluster | 56 |
| VictoriaMetrics - Single | 29 |

## 内置告警规则

共 9 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### vm error logging rate 大于0

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
sum by (job, level) (rate(vm_log_messages_total{level!="info"}[5m])) > 0
```

处置步骤:

1. 到对应实例查看日志（journalctl -u victoria-metrics 或容器日志），按 level 过滤看具体报错；
1. 常见为写入端数据格式错误、标签基数过高被拒、磁盘空间不足；
1. 基数问题用 /api/v1/status/tsdb 看 topN 的高基数指标并在写入端治理；
1. 磁盘问题按磁盘空间告警处理。

### vm-insert 和 vm-storage 组件之间连接的饱和度大于9

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
max(rate(vm_rpc_send_duration_seconds_total{job_name=~".+"}[5m])) by(addr) / 1000 > 9
```

处置步骤:

1. 看 vm-storage 侧的 CPU、磁盘 IO 与 vm_slow_row_inserts_total，确认瓶颈在计算还是磁盘；
1. 用 /api/v1/status/tsdb 看是否有高基数指标导致写入放大；
1. 短期可减少写入并发或对高基数指标做 relabel 丢弃；
1. 长期需扩容 vm-storage 节点或换更快的磁盘。

### vm-insert 实例端口异常

S1 紧急 · 持续 2 分钟 · 触发条件:

```promql
net_response_result_code{service="vm-insert"}!=0
```

处置步骤:

1. 从告警标签取实例地址，在采集机上手工 nc -vz \<地址> \<端口> 复现；
1. 到该机器确认对应进程是否存活、日志有无 panic 或 OOM；
1. 进程存活但端口不通的排查防火墙与监听地址配置；
1. 集群模式下确认剩余节点数是否仍满足读写要求，不足时优先恢复节点而非重启整个集群。

### vm-select 实例端口异常

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
net_response_result_code{service="vm-select"}!=0
```

处置步骤:

1. 从告警标签取实例地址，在采集机上手工 nc -vz \<地址> \<端口> 复现；
1. 到该机器确认对应进程是否存活、日志有无 panic 或 OOM；
1. 进程存活但端口不通的排查防火墙与监听地址配置；
1. 集群模式下确认剩余节点数是否仍满足读写要求，不足时优先恢复节点而非重启整个集群。

### vm-select请求查询延迟超过15s

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
max(vm_request_duration_seconds{job_name=~".+"}) by (path) > 15
```

处置步骤:

1. 从告警标签取 path 定位是哪类查询慢；
1. 用 /api/v1/status/top_queries 找出最慢与最频繁的查询；
1. 常见根因是查询时间跨度过大或高基数标签——在仪表盘上收窄时间范围、减少 group by 维度；
1. 存储侧确认磁盘 IO 与 CPU 是否打满，必要时扩容 vm-select/vm-storage。

### vm-storage 实例端口异常

S1 紧急 · 持续 2 分钟 · 触发条件:

```promql
net_response_result_code{service="vm-storage"} != 0
```

处置步骤:

1. 从告警标签取实例地址，在采集机上手工 nc -vz \<地址> \<端口> 复现；
1. 到该机器确认对应进程是否存活、日志有无 panic 或 OOM；
1. 进程存活但端口不通的排查防火墙与监听地址配置；
1. 集群模式下确认剩余节点数是否仍满足读写要求，不足时优先恢复节点而非重启整个集群。

### vminsert服务宕机

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
up{service=~"vminsert.+"} < 1
```

处置步骤:

1. 从告警标签取实例地址，在采集机上手工 nc -vz \<地址> \<端口> 复现；
1. 到该机器确认对应进程是否存活、日志有无 panic 或 OOM；
1. 进程存活但端口不通的排查防火墙与监听地址配置；
1. 集群模式下确认剩余节点数是否仍满足读写要求，不足时优先恢复节点而非重启整个集群。

### vmselect服务宕机

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
up{service=~"vmselect.+"} < 1
```

处置步骤:

1. 从告警标签取实例地址，在采集机上手工 nc -vz \<地址> \<端口> 复现；
1. 到该机器确认对应进程是否存活、日志有无 panic 或 OOM；
1. 进程存活但端口不通的排查防火墙与监听地址配置；
1. 集群模式下确认剩余节点数是否仍满足读写要求，不足时优先恢复节点而非重启整个集群。

### vmstorage服务宕机

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
up{service=~"vmstorage.+"} < 1
```

处置步骤:

1. 从告警标签取实例地址，在采集机上手工 nc -vz \<地址> \<端口> 复现；
1. 到该机器确认对应进程是否存活、日志有无 panic 或 OOM；
1. 进程存活但端口不通的排查防火墙与监听地址配置；
1. 集群模式下确认剩余节点数是否仍满足读写要求，不足时优先恢复节点而非重启整个集群。

## 相关链接

- [VictoriaMetrics 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/VictoriaMetrics）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [把 VictoriaMetrics 接成数据源](/docs/data/victoriametrics)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
