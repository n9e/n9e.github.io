---
sidebar_label: 产品简介
title: 夜莺监控（Nightingale）是什么
description: "夜莺监控（Nightingale，n9e）是开源告警引擎：复用已有数据源做规则判定、降噪和分发，也可在小规模单 Center 部署中使用内置时序库。"
last_reviewed: 2026-10-15
---

import { figures } from '@site/src/data/figures';

夜莺监控（Nightingale，简称 **n9e**）是一个开源告警引擎，由中国计算机学会开源发展技术委员会（CCF ODTC）
托管，代码在 [GitHub](https://github.com/ccfos/nightingale)，Apache-2.0 许可。它可以直接查询你已有的
Prometheus、日志库和数据库，做告警判定、降噪和通知分发，数据不用搬、采集器不用换。

没有外部时序库时，小规模单 Center 部署也可以使用内置时序库。多 Center 或更大规模部署应使用外部时序库，
适用范围与切换方式见[内置时序库与外部存储](../concepts/storage.md)。

## 它负责哪一层

| 层次 | 夜莺 |
|---|---|
| 存储 | 可复用 Prometheus、VictoriaMetrics、ElasticSearch、ClickHouse；内置时序库适合小规模单 Center 部署 |
| 采集 | ❌ —— Categraf、Telegraf、Datadog Agent、各类 exporter 都能写入 |
| **告警规则、降噪、分发** | ✅ **这一层才是它的主场** |
| 仪表盘 | ✅ 内置，但 Grafana 依然是一等公民 |

## 数据怎么流转

接一个数据源，在其上写一条规则，产生的事件依次经过屏蔽规则、订阅规则、事件 Pipeline，最后落到
通知媒介。v9 起同一个进程还是 MCP Server，AI 客户端可以用自然语言把这一整套跑通。

- **{figures.datasourceTypes} 数据源类型** —— 指标、日志、SQL 类数据库统一接入
- **{figures.notificationChannels} 份内置消息模板** —— 钉钉、飞书、企业微信、电话、短信、Slack、PagerDuty……
  其中 6 个媒介开箱即用，其余照模板填自己的地址
- **{figures.integrations} 个内置集成模板** —— 采集配置、仪表盘、告警规则成套导入
- **{figures.mcpTools} 个 MCP 工具**，分属 {figures.mcpToolsets} 个工具集

Apache-2.0 全功能开源。

下一步：[快速开始](./quick-start.md)。
