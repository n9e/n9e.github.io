---
title: "限制与默认值"
sidebar_label: "限制与默认值"
description: "硬限制、软限制与默认大小：队列长度、超时、保留期。"
---

这页汇总那些「不改也能跑、但规模上来会撞上」的数字。完整配置见[配置项](./configuration.md)。

## HTTP

| 项 | 默认 | 配置项 |
|---|---:|---|
| 请求体上限 | 64 MiB | `[HTTP] MaxContentLength` |
| 读超时 | 20s | `[HTTP] ReadTimeout` |
| 写超时 | 40s | `[HTTP] WriteTimeout` |
| 空闲超时 | 120s | `[HTTP] IdleTimeout` |
| 优雅退出超时 | 30s | `[HTTP] ShutdownTimeout` |

批量导入告警规则、导入大仪表盘 JSON 时最容易撞上请求体上限。

## 元数据库

| 项 | 默认 | 配置项 |
|---|---:|---|
| 最大连接数 | 150 | `[DB] MaxOpenConns` |
| 最大空闲连接 | 50 | `[DB] MaxIdleConns` |
| 连接最长存活 | 7200s | `[DB] MaxLifetime` |

多实例部署时这个数要乘以实例数，别超过数据库自己的 `max_connections`。

## 内置时序库

| 项 | 默认 | 配置项 |
|---|---:|---|
| 数据保留期 | 15d | `[EmbeddedTSDB] RetentionDuration` |
| 磁盘上限 | 10 GiB | `[EmbeddedTSDB] MaxBytes` |
| 查询超时 | 1m | `[EmbeddedTSDB] QueryTimeout` |

超过 `MaxBytes` 时**从最旧的块开始删**。

真正的硬限制不是这几个数字，而是**它只存在于单个 Center 进程的本地磁盘上**：
多副本部署时每个副本只有一部分数据。适用范围大致到 10 万活跃序列，
再往上换外部时序库。见[内置时序库的单实例限制](../operations/embedded-tsdb-limits.md)。

## 写入与转发

| 项 | 默认 | 配置项 |
|---|---:|---|
| 转发队列长度 | 1000000 | `[Pushgw] QueueMaxSize` |
| 转发请求超时 | 10000ms | `[[Pushgw.Writers]] Timeout` |
| 建连超时 | 3000ms | `[[Pushgw.Writers]] DialTimeout` |

队列满了会丢数据。队列长度持续接近上限，说明下游时序库写不动了，
盯 `n9e_alert_alert_queue_size` 这类指标能提前发现，见[内置指标](./built-in-metrics.md)。

## 告警判定

| 项 | 默认 | 在哪 |
|---|---|---|
| 执行频率 | `@every 60s` | 规则表单 |
| 持续时长 | 60s | 规则表单 |
| 留观时长 | 0（立即恢复） | 规则表单 |
| 重复通知间隔 | 60 分钟 | 规则表单 |
| 最大发送次数 | 0（不限） | 规则表单 |

## 数据保留

| 数据 | 默认保留 | 配置项 |
|---|---:|---|
| 通知记录 | 7 天 | `[Center] CleanNotifyRecordDay` |
| 工作流执行记录 | 7 天 | 清理任务内置 |
| 内置时序库数据 | 15 天 | `[EmbeddedTSDB] RetentionDuration` |
| 历史告警事件 | 默认永久保留 | `[Center] CleanAlertHisEventDay` |

**历史告警事件默认永久保留。** 开关是有的，只是默认注释掉了，`<= 0` 就是永久保留。
把 `CleanAlertHisEventDay` 设成天数，每天凌晨 2 点会分批删掉更早的事件；不设就要自己规划这张表的增长。

## 相关

- [配置项](./configuration.md)
- [容量规划](../operations/capacity.md)
- [性能与积压现象](../troubleshooting/performance.md)
