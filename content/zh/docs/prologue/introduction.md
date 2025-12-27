---
title: "夜莺项目介绍"
description: "夜莺监控（Nightingale）是一款专注于告警的监控类开源项目。与 Grafana 类似，夜莺采用数据源集成方式，支持对接多种现有数据源。两者的区别在于：Grafana 侧重于数据可视化，而夜莺侧重于告警引擎、告警事件的处理和分发。"
date: 2025-01-25T08:48:57+08:00
lastmod: 2025-05-30T21:37:28+08:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 100
toc: true
---

夜莺监控（Nightingale）是一款专注于告警的监控类开源项目。与 Grafana 类似，夜莺也采用数据源集成方式，支持对接多种现有数据源。两者的区别在于：Grafana 侧重于数据可视化，而夜莺侧重于告警引擎、告警事件的处理和分发。

夜莺监控项目最初由滴滴公司开发和开源，并于 2022 年 5 月 11 日捐赠予中国计算机学会开源技术发展委员会（CCF ODC），成为 CCF ODC 成立后接受捐赠的第一个开源项目。

## 代码仓库

- 后端：[https://github.com/ccfos/nightingale](https://github.com/ccfos/nightingale)
- 前端：[https://github.com/n9e/fe](https://github.com/n9e/fe)

如果是前端交互问题，请在 [https://github.com/n9e/fe](https://github.com/n9e/fe) 提交 issue。其他问题请在 [https://github.com/ccfos/nightingale](https://github.com/ccfos/nightingale) 提交 issue。

## 工作原理

当用户已具备指标和日志数据采集能力时，可将现有存储系统（如 VictoriaMetrics、ElasticSearch 等）作为数据源接入夜莺，在夜莺中配置告警规则和通知规则，实现告警事件的生成和分发。**这种模式下，夜莺不采集数据、不存储数据，仅作为告警引擎**。

<img src="/img/prologue/intro/product-arch.png" alt="夜莺产品架构图"/>

如果您尚未采集监控数据，也可以使用 [Categraf](https://github.com/flashcatcloud/categraf) 作为采集器，Categraf 可以与夜莺丝滑对接。

Categraf 支持采集操作系统、网络设备、各类中间件和数据库的监控数据，通过 Remote Write 协议将数据推送至夜莺。这种模式下，夜莺仍然不存储监控数据，而是充当数据转发网关，将监控数据做一些处理然后转存至时序数据库（如 Prometheus、VictoriaMetrics 等）。

对于网络链路不稳定的边缘机房场景，为提升告警可用性，夜莺提供边缘机房告警引擎下沉部署模式。在此模式下，即使边缘机房与中心机房网络中断，告警功能仍可正常运行（具体可参考架构设计章节）。

<img src="/img/prologue/intro/edge-arch.png" alt="夜莺边缘架构"/>

上图中，机房 A 与中心机房网络链路稳定，因此直接由中心端的夜莺进程执行告警引擎功能；机房 B 与中心机房网络链路不稳定，因此在机房 B 部署 `n9e-edge` 作为告警引擎，对机房 B 的数据源进行告警判定。

## 告警降噪、升级与协同

夜莺的核心功能是告警引擎，负责生成**告警事件**、对事件做**二次处理**后根据**通知规则**进行灵活分发。系统内置支持 20 多种通知媒介，包括电话、短信、邮件、钉钉、飞书、企业微信、Slack 等。

对于以下高级需求场景，夜莺可能无法满足：

- 需要将企业内多套监控系统（比如各类云监控、Zabbix）产生的事件统一汇聚至单一平台，进行收敛降噪、响应处理和数据分析
- 需要支持人员排班、On-call 管理、告警认领、升级机制（避免遗漏）和协同处理

针对上述场景，强烈建议使用 **[FlashDuty](https://flashcat.cloud/product/flashcat-duty/)** 等专业的 On-call 管理产品，将云上、云下各类监控系统的告警统一汇聚，进行降噪、分发和响应管理。


## 相关资料与交流渠道

- 📚 [夜莺介绍 PPT](https://mp.weixin.qq.com/s/Mkwx_46xrltSq8NLqAIYow)：有助于了解夜莺的各项关键特性（PPT 链接位于文末）
- ❤️ [提问与 Bug 报告](https://github.com/ccfos/nightingale/issues/new?assignees=&labels=&projects=&template=question.yml)：请提供版本信息、问题描述、复现步骤、截图等详细信息，以便社区能够有效协助解决问题
- 🌟 社区交流：添加微信 `picobyte`（备注：`夜莺经验分享群`）加入微信群；如已在生产环境部署夜莺，可以加入资深监控用户群


## 关键特性

<img class="mb20" src="/img/prologue/intro/feat1.png" alt="夜莺告警规则"/>

- **告警规则管理**：支持告警规则、屏蔽规则、订阅规则、通知规则，内置 20 多种通知媒介，支持消息模板自定义
- **事件管道处理**：支持事件管道功能，对告警事件进行 Pipeline 处理，便于与自有系统进行自动化集成，例如为告警事件附加元信息、对事件进行 Relabel 操作
- **业务组与权限**：支持业务组概念，提供权限管理体系，实现规则、机器、仪表盘的分类管理
- **规则导入**：提供多种数据库和中间件的内置告警规则，可直接导入使用；也支持直接导入 Prometheus 告警规则
- **告警自愈**：支持告警自愈功能，告警触发后可自动执行预定义脚本，例如磁盘清理、现场信息采集等操作

<img class="mb20" src="/img/prologue/intro/feat2.png" alt="夜莺事件大盘"/>

- **历史事件存档**：完整存储历史告警事件，支持多维度查询和统计
- **灵活聚合分析**：支持灵活的聚合分组功能，便于直观查看企业告警事件分布情况

<img class="mb20" src="/img/prologue/intro/feat3.png" alt="夜莺集成中心"/>

- **集成中心**：内置常用操作系统、中间件、数据库的指标说明、仪表盘和告警规则（由社区贡献，可能良莠不齐）
- **多协议支持**：支持接收 Remote Write、OpenTSDB、Datadog、Falcon 等多种协议的数据，可与各类 Agent 对接
- **多数据源支持**：支持 Prometheus、ElasticSearch、Loki、TDEngine 等多种数据源，可对数据源中的数据进行告警配置
- **系统集成**：支持内嵌企业内部系统（如 Grafana、CMDB 等），并可配置内嵌系统的菜单可见性

<img class="mb20" src="/img/prologue/intro/feat4.png" alt="夜莺仪表盘"/>

- **仪表盘功能**：支持仪表盘功能，提供常见图表类型，并内置多种仪表盘模板
- **与 Grafana 的对比**：如已习惯使用 Grafana，建议继续使用 Grafana 进行数据可视化，Grafana 在可视化方面功能更为丰富。对于 Categraf 采集的机器监控数据，建议使用夜莺自带的仪表盘查看，因为 Categraf 的指标命名遵循 Telegraf 的命名规范，与 Node Exporter 不同，难以找到 Grafana 仪表盘模板
- **业务组联动**：由于夜莺采用业务组概念，机器可归属不同业务组，仪表盘支持与业务组联动，便于仅查看当前业务组内的机器数据

## 感谢众多企业信赖

夜莺拥有众多企业用户，以下仅展示部分用户案例，排名不分先后。

<img src="/img/prologue/intro/customers.png" alt="夜莺客户"/>

## 开源协议

夜莺监控项目采用 Apache License 2.0 协议开源。