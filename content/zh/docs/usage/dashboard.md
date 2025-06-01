---
title: "仪表盘"
description: "夜莺监控（Nightingale）支持仪表盘功能，可以将监控数据以图表的形式展示出来。通过仪表盘，用户可以直观地查看各类监控指标的变化趋势和状态。"
date: 2025-06-01T19:03:43+08:00
lastmod: 2025-06-01T19:03:43+08:00
draft: false
images: []
menu:
  docs:
    parent: "usage"
weight: 1500
toc: true
---

夜莺监控虽然侧重点是告警，但是也支持仪表盘功能，虽然没有 Grafana 道行深，但是常见的图表类型都支持，可以满足日常使用。

## 快速导入

之前整理过机器的仪表盘，您可以直接导入使用，快速看到效果。导入的方式：

<img src="/img/usage/dashboard/01.png" alt="导入仪表盘"/>

不同的采集器采集的监控指标名字和标签各异，所以需要分别制作仪表盘。如果你使用的是 Categraf，可以导入如下两个仪表盘：

- 机器概览数据：[categraf-overview.json](https://github.com/ccfos/nightingale/blob/main/integrations/Linux/dashboards/categraf-overview.json)
- 机器详细数据：[categraf-detail.json](https://github.com/ccfos/nightingale/blob/main/integrations/Linux/dashboards/categraf-detail.json)

如果你使用的是 Node Exporter，可以导入如下仪表盘：

- Node 关键指标：[exporter-detail.json](https://github.com/ccfos/nightingale/blob/main/integrations/Linux/dashboards/exporter-detail.json)

实际上，这几个仪表盘都可以在夜莺的菜单 `集成中心-模板中心-搜索 Linux` 找到：

<img src="/img/usage/dashboard/02.png" alt="Linux 仪表盘"/>

Categraf 概览页面的仪表盘样例：

<img src="/img/usage/dashboard/03.png" alt="Categraf 概览页面"/>

Categraf 机器详细数据的仪表盘样例：

<img src="/img/usage/dashboard/04.png" alt="Categraf 详细数据"/>

模板中心已经内置了很多组件的仪表盘，但是质量参差不齐，回头腾出手来我们会挨个再整理一遍，力求开箱即用。不过组件实在是太多，人手有限，欢迎广大社区用户一起参与整理贡献，将您整理好的仪表盘提交到 Github 夜莺仓库的 integrations 目录下面的各个组件下的 dashboards 目录下，通过 PR 提交即可。

## 集成 Grafana

你也可以继续使用 Grafana 看图，毕竟各有所长，组合使用更佳。也可以通过夜莺菜单 `集成中心-系统集成`，直接把 Grafana 通过 iframe 的方式嵌入夜莺，不过 Grafana 默认不支持被别的系统嵌入，需要修改一些配置，具体要修改的内容如下：

1、启用 embedding

在 Grafana 配置文件中找到 `allow_embedding` 的配置项，设置为 `true`。

2、启用 anonymous

找到 `auth.anonymous` 配置段，把 `enabled` 设置为 `true`，`org_role` 设置为 `Viewer`，`org_name` 根据你自己的环境配置即可。

3、对于 HTTPS 的 Grafana

在 `security` 配置段，把 `cookie_secure` 设置为 `true`, `cookie_samesite` 设置为 `none`。

另外，不同版本的 Grafana 可能配置方式有差异，如果您发现文档有误，点击下面的 “Edit this page on GitHub” 可以直接编辑本页面，提交 PR 修改文档。