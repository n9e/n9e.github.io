---
title: "夜莺对比 Prometheus"
description: "夜莺监控（Nightingale）和 Prometheus 的关系，是一个经常被讨论的话题，实际这二者是一个协同互补的关系，本文会详细介绍二者的区别和联系。"
date: 2025-05-30T21:37:49.448+08:00
lastmod: 2025-05-30T21:37:42.702+08:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 150
toc: true
---

夜莺监控（Nightingale）与 Grafana 类似，支持对接多种数据源。Prometheus 是最常用的数据源（其他兼容 Prometheus 接口的数据源，如 VictoriaMetrics、Thanos、M3DB 等，均可视为 Prometheus 类型数据源），因此夜莺与 Prometheus 关系密切。

## 适用场景

在以下场景中，建议考虑使用夜莺监控：

- **多数据源统一管理**：存在多套时序数据库（如 Prometheus、VictoriaMetrics 等），需要统一的平台管理各类告警规则，并具备权限管控能力
- **高可用告警引擎**：Prometheus 的告警引擎为单点架构，存在单机故障导致告警功能不可用的风险
- **多数据源告警**：除 Prometheus 外，还需要支持 ElasticSearch、Loki、ClickHouse 等其他数据源的告警能力
- **灵活的告警配置**：需要更灵活的告警规则配置，包括生效时间控制、事件 Relabel、与 CMDB 系统联动、告警联动自愈脚本等功能

## 典型技术架构

在实际生产环境中，企业通常采用组合技术方案，各组件发挥其优势：

- **数据采集层**：采用多种 agent 和 exporter 组合方案，主要使用 Categraf（特别适用于机器监控场景，与夜莺无缝集成），同时辅以各类 Exporter
- **数据存储层**：时序数据库主要采用 VictoriaMetrics。VictoriaMetrics 兼容 Prometheus 接口，性能更优且提供集群版本，对于大多数企业而言，单机版本即可满足需求
- **告警引擎层**：使用夜莺作为告警引擎，支持多团队协作管理，内置开箱即用的告警规则模板，提供灵活的告警规则配置能力，通过事件 Pipeline 机制实现与 CMDB 等系统的集成
- **可视化层**：使用 Grafana 进行数据可视化，提供丰富的图表类型和展示效果，社区资源丰富，可从 Grafana 官方站点获取大量现成的仪表盘模板
- **告警事件管理**：使用 [FlashDuty](https://flashcat.cloud/product/flashduty/) 进行告警事件的 On-call 分发，支持对接 Zabbix、Prometheus、夜莺、各云监控平台、Elastalert 等各类监控系统，统一收敛降噪、排班、认领升级、响应、派发等告警处理流程

