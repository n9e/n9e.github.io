---
title: "Redis"
description: "Redis 监控数据的采集有多种方式，可以使用 Categraf、Redis-Exporter、Cprobe 等各类工具，其原理都是类似的，无非就是连到 Redis 实例上，执行 info 之类的命令获取监控数据"
date: 2025-06-05T14:22:57+08:00
lastmod: 2025-06-05T14:22:57+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5300
toc: true
---

> 对于监控系统，基础功能的强弱确实非常关键，但是如何在不同的场景落地实践，则更为关键。在《监控实践》章节，搜罗各类监控实践经验，会以不同的组件分门别类，您如果对某个组件有好的实践经验，欢迎提 PR，把您的文章链接附到对应的组件目录下。

- [Categraf 采集 Redis 监控数据](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/redis/)
- [使用 Cprobe 监控 MySQL、Redis、MongoDB、Oracle、Postgres 等](https://mp.weixin.qq.com/s/6dEgijH-nWddbK8yCEUUOA)

## Redis 监控采集原理

不管使用 Categraf 还是 Redis-Exporter 采集 Redis 的监控数据，原理都是类似的，通过 Redis 连接地址、用户名密码等信息连到 Redis 上，执行 `info` 之类的命令获取监控数据。

## 如何接入 Redis-Exporter

有些用户用了 Categraf 采集机器指标、进程指标、自定义插件，但是没有使用 Categraf 采集 Redis 的监控数据，而是使用了 Redis-Exporter。然后就比较困惑：如何把 Redis-Exporter 采集的数据接入到夜莺中？

有两个办法：

- 直接在你的时序库里配置 Scrape 规则，抓取 Redis-Exporter 的数据
- 使用 Categraf 的 input.prometheus 插件，抓取 Redis-Exporter 的数据
