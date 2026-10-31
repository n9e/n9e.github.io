---
title: "用夜莺监控 Windows"
sidebar_label: "Windows"
description: "Categraf 在 Windows 上采集的指标和 Linux 同名，主机仪表盘与规则可以复用；另有按 windows_exporter 指标写的 AD、DNS、ADFS 仪表盘。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Windows
toc_max_heading_level: 2
mdx:
  format: md
---

Categraf 同样支持 Windows，而且 CPU、内存、磁盘、网络这些基础指标的命名和 Linux 保持一致，所以主机类的告警规则和仪表盘不用为 Windows 另写一份。

模板里还有一组按 windows_exporter 指标名写的仪表盘，覆盖 Windows Server 本身以及 Active Directory、DNS、ADFS 这几个常见的 Windows 服务。用 Categraf 就导「by Categraf」那张，用 windows_exporter 就导「exporter」那组。

## 模板里有什么

- **6 张仪表盘**，共 203 个面板
- **14 条告警规则**，每条附处置步骤

## 怎么接入

Categraf 的 Windows 版本以服务方式安装，步骤见 [Categraf 安装](/docs/data/categraf/install)。基础插件默认开启，不需要为 Windows 单独写采集配置。用 windows_exporter 的话，用 Categraf 的 `prometheus` 插件抓 `http://<host>:9182/metrics`，或把已有的 Prometheus [接成数据源](/docs/data/prometheus)。

1. 在夜莺「集成中心」里找到 Windows，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| Active Directory Federation Services | 53 |
| Active Directory | 67 |
| DNS | 18 |
| Windows Server | 21 |
| Windows Host by Categraf | 24 |
| Windows - exporter | 20 |

## 内置告警规则

共 14 条，导入后默认停用，按自己环境的阈值逐条启用。下表 13 条规则的触发条件（PromQL）和处置步骤收录在告警规则库：[Windows 告警规则](/alert-rules/windows)。

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| Hard disk - expected to be written full in 4 hours - categraf [Windows] | S1 紧急 | 1 分钟 |
| Hard disk - IO is a bit busy - categraf [Windows] | S2 警告 | 1 分钟 |
| Machine load - high memory, please pay attention - categraf[Windows] | S3 提醒 | 1 分钟 |
| packet loss in the inbound direction - categraf[Windows] | S3 提醒 | 1 分钟 |
| packet loss in the outbound direction - categraf [Windows] | S3 提醒 | 1 分钟 |
| 大于200G的盘，空间不足了[Windows] | S3 提醒 | 1 分钟 |
| 小于200G的盘，空间不足了[Windows] | S3 提醒 | 1 分钟 |
| High CPU utilization - exporter | S2 警告 | 1 分钟 |
| High memory usage rate - exporter | S2 警告 | 1 分钟 |
| machine reboot in the last 15 minutes - exporter | S3 提醒 | 1 分钟 |
| packet loss issue in the inbound direction - exporter | S2 警告 | 1 分钟 |
| packet loss issue in the outbound direction - exporter | S2 警告 | 1 分钟 |
| The hard disk is almost full - exporter | S1 紧急 | 1 分钟 |

### 其余规则（1）

这些规则没有收进告警规则库，完整内容列在这里。

#### Lost connection with monitoring target - categraf [Windows]

处置步骤:

1. 先确认机器本身是否存活（ping、远程桌面），宕机要按宕机处理；
1. 机器存活则用 Get-Service categraf 确认服务状态，未运行则 Start-Service categraf；
1. 看 categraf 日志目录下的日志定位，常见是配置错误或到服务端的网络/认证不通；
1. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

## 相关链接

- [Windows 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Windows）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
