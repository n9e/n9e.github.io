---
title: "夜莺介绍"
description: "夜莺（ Nightingale ）是一款国产开源、云原生监控系统"
lead: "夜莺监控（ Nightingale ）是一款国产、开源云原生监控分析系统，采用 All-In-One 的设计，集数据采集、可视化、监控告警、数据分析于一体。于 2020 年 3 月 20 日，在 github 上发布 v1 版本，已累计迭代 60 多个版本。从 v5 版本开始与 Prometheus、VictoriaMetrics、Grafana、Telegraf、Datadog 等生态紧密协同集成，提供开箱即用的企业级监控分析和告警能力，已有众多企业选择将 Prometheus + AlertManager + Grafana 的组合方案升级为使用夜莺监控。夜莺监控，由滴滴开发和开源，并于 2022 年 5 月 11 日，捐赠予中国计算机学会开源发展委员会（CCF ODC），为 CCF ODC 成立后接受捐赠的第一个开源项目。夜莺监控的核心开发团队，也是Open-Falcon项目原核心研发人员。"
date: 2020-10-06T08:48:57+00:00
lastmod: 2020-10-06T08:48:57+00:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 100
toc: true
---

## 项目代码

- 后端：[💡 https://github.com/ccfos/nightingale](https://github.com/ccfos/nightingale)
- 前端：[💡 https://github.com/n9e/fe-v5](https://github.com/n9e/fe-v5)

欢迎大家在[Github](https://github.com/ccfos/nightingale)上关注夜莺项目，及时获取项目更新动态，有任何问题，也欢迎提交 Issue，以及提交 PR，开源社区，需要大家一起参与才能有蓬勃的生命力。

## 产品介绍

💡下载夜莺功能介绍材料（可用于你在团队内部分享/推广夜莺监控），点击以下链接下载：
- [PDF版本](https://sourl.cn/spsLFC)


<img src="/images/arch-product.png">
<br />
<br />

Nightingale 可以接收各种采集器上报的监控数据，转存到时序库（可以支持Prometheus、M3DB、VictoriaMetrics、Thanos等），并提供告警规则、屏蔽规则、订阅规则的配置能力，提供监控数据的查看能力，提供告警自愈机制（告警触发之后自动回调某个webhook地址或者执行某个脚本），提供历史告警事件的存储管理、分组查看的能力。

## 系统截图

<img src="/images/intro.gif">

## 系统架构

<img src="/images/arch-system.png">
<br />
<br />

夜莺 v5 的设计非常简单，核心是 server 和 webapi 两个模块，webapi 无状态，放到中心端，承接前端请求，将用户配置写入数据库；server 是告警引擎和数据转发模块，一般随着时序库走，一个时序库就对应一套 server，每套 server 可以只用一个实例，也可以多个实例组成集群，server 可以接收 Categraf、Telegraf、Grafana-Agent、Datadog-Agent、Falcon-Plugins 上报的数据，写入后端时序库，周期性从数据库同步告警规则，然后查询时序库做告警判断。每套 server 依赖一个 redis。

## 产品对比

### Zabbix

Zabbix 是一款老牌的监控系统，对机器和网络设备的监控覆盖很全，比如支持 AIX 系统，常见的开源监控都是支持 Linux、Windows，AIX 较少能够支持，Zabbix 用户群体广泛，国内很多公司基于 Zabbix 做商业化服务，不过 Zabbix 使用数据库做存储，容量有限，今年推出的 TimescaleDB 对容量有较大提升，大家可以尝试下；其次 Zabbix 整个产品设计是面向静态资产的，在云原生场景下显得力不从心。

### Open-Falcon

因为开发 Open-Falcon 和 Nightingale 的是一拨人，所以很多社区伙伴会比较好奇，为何要新做一个监控开源软件。核心点是 Open-Falcon 和 Nightingale 的差异点实在是太大了，Nightingale 并非是 Open-Falcon 设计逻辑的一个延续，就看做两个不同的软件就好。

Open-Falcon 是 14 年开发的，当时是想解决 Zabbix 的一些容量问题，可以看做是物理机时代的产物，整个设计偏向运维视角，虽然数据结构上已经开始设计了标签，但是查询语法还是比较简单，无法应对比较复杂的场景。

Nightingale 直接支持 PromQL，支持 Prometheus、M3DB、VictoriaMetrics 多种时序库，支持 Categraf、Telegraf、Datadog-Agent、Grafana-Agent 做监控数据采集，支持 Grafana 看图，整个设计更加云原生。

### Prometheus

Nightingale 可以简单看做是 Prometheus 的一个企业级版本，把 Prometheus 当做 Nightingale 的一个内部组件（时序库），当然，也不是必须的，时序库除了 Prometheus，还可以使用 VictoriaMetrics、M3DB 等，各种 Exporter 采集器也可以继续使用。

Nightingale 可以接入多个 Prometheus，可以允许用户在页面上配置告警规则、屏蔽规则、订阅规则，在页面上查看告警事件、做告警事件聚合统计，配置告警自愈机制，管理监控对象，配置监控大盘等，就把 Nightingale 看做是 Prometheus 的一个 WEBUI 也是可以的，不过实际上，它远远不止是一个 WEBUI，用一下就会深有感触。

## 加入社区

<img src="/images/wx.jpg" width="240">
<br />
<br />

公众号有加入交流群的方式、答疑方式，也会定期分享夜莺知识、云原生监控知识，欢迎关注。

## 企业版

对于开源，开放源代码只是第一步，仅仅是个开始。我们深知，只有建立了健康、良性、具有特定利益共同体的社区，聚集了一批志同道合的开发者，那么开源项目才具备了长期发展的基础，才会有蓬勃的生命力。

开源项目的背后，核心在于社区，离不开开放的治理架构。CCF 开源发展委员会具有开放、中立、创新、产学研融合等特点，且有开源领域和学界泰斗级别的大师领衔，是中国开源的幸事，我们相信，夜莺监控项目加入到CCF开源大家庭，在计算机学会的支持和带动下，在国产开源云原生监控领域，填补空白，做精做强。让夜莺监控项目，成为中国开源项目的标杆，成为国内开源社区治理的标杆，也成为开源与产学研创新结合的标杆，创造出更大的社会价值。

此外，商业公司也是开源项目和开源社区成功的背后最重要的一支力量，[北京快猫星云科技有限公司](https://flashcat.cloud/)，一家云原生智能运维科技公司，秉承着让监控分析变简单的初心和使命，致力于打造先进的云原生监控分析平台，结合人工智能技术，提升云原生时代数字化服务的稳定性保障能力。快猫星云团队是开源项目夜莺监控的主要贡献者，快猫星云的产品也是基于开源夜莺的引擎构建的，也欢迎有商业化服务需求的公司能够支持快猫团队，采购商业版本的产品或开源技术支持服务，长期共赢。


## 社区版 vs 企业版

- 欢迎查阅由[快猫星云](https://flashcat.cloud)提供的企业级解决方案，在产品功能和技术支持方面提供企业级的服务，具体请查阅 => [夜莺社区版和企业版的区别](/docs/prologue/opensource-vs-enterprise/)；
- 欢迎下载快猫星云 Flashcat 平台的介绍材料 => [PDF版本](https://sourl.cn/G5iZCT)；
- Flashcat 平台一分钟视频介绍：https://flashcat.cloud/videos/flashcat.mp4 ；
- 如果你想进一步试用和体验 Flashcat 平台 http://demo.flashcat.cloud，可以添加微信小助手 `flashcats`，获取账号在线体验账号；