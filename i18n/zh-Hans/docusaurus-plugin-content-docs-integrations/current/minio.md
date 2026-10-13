---
title: "用夜莺监控 MinIO"
sidebar_label: "MinIO"
description: "MinIO 自带 Prometheus 端点，要同时抓 cluster、bucket 和 node 三个路径，模板才能把对象、Bucket、进程和磁盘面板填满。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/MinIO
toc_max_heading_level: 2
mdx:
  format: md
---

MinIO 在 `/minio/v2/metrics/` 下按 `cluster`、`bucket`、`node` 三个路径暴露 Prometheus 指标。模板里的两张仪表盘同时用到三类指标，只抓 `/cluster` 会导致对象数、Bucket 用量、进程和磁盘面板缺数据。

指标端点默认需要 Bearer Token 鉴权；测试环境可以设 `MINIO_PROMETHEUS_AUTH_TYPE=public`，生产环境保留鉴权并在 Categraf 里配置 token，不要把端点暴露到公网。规则覆盖节点离线、磁盘离线与容量逼近上限、S3 请求错误率和健康检查失败。

## 模板里有什么

- **2 张仪表盘**，共 64 个面板
- **2 条告警规则**，每条附处置步骤

## 怎么接入

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](/docs/data/prometheus)，模板同样能用。

```toml
# conf/input.prometheus/minio.toml
[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/cluster"]
labels = { job = "minio", instance = "minio-01:9000" }

[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/bucket"]
labels = { job = "minio", instance = "minio-01:9000" }

[[instances]]
urls = ["http://127.0.0.1:9000/minio/v2/metrics/node"]
labels = { job = "minio", instance = "minio-01:9000" }
```

1. 在夜莺「集成中心」里找到 MinIO，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| MinIO Dashboard | 32 |
| MinIO Dashboard New Version | 32 |

## 内置告警规则

共 2 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### DisksOffline

Disks down in MinIO deployment

S2 警告 · 持续 10 分钟 · 触发条件:

```promql
avg_over_time(minio_cluster_disk_offline_total{}[5m]) > 0
```

处置步骤:

1. 用 mc admin info \<alias> 确认离线的是哪个节点的哪块盘，以及集群还剩多少冗余；
1. 到该节点用 dmesg -T | grep -iE 'i/o error|ata|scsi' 与 smartctl -a 判断是掉盘、坏盘还是挂载丢失；
1. 挂载丢失的重新挂载后 MinIO 会自动纳管；坏盘的换盘后用 mc admin heal -r \<alias> 触发修复；
1. 修复期间避免大量写入，并确认剩余冗余仍高于 EC 校验块数。

### NodesOffline

Node down in MinIO deployment

S2 警告 · 持续 10 分钟 · 触发条件:

```promql
avg_over_time(minio_cluster_nodes_offline_total{}[5m]) > 0
```

处置步骤:

1. 用 mc admin info \<alias> 确认离线节点，并 ping / ssh 确认机器是否存活；
1. 机器存活则用 systemctl status minio 看进程与日志，常见是 OOM、磁盘挂载失败、证书过期；
1. 集群内网不通的排查网络与安全组，MinIO 节点间需要互通；
1. 节点恢复后用 mc admin heal -r \<alias> 触发数据修复并观察进度。

## 相关链接

- [MinIO 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/MinIO）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
