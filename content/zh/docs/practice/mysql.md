---
title: "MySQL"
description: "本文介绍如何对 MySQL 做监控，MySQL 作为国内最常用的数据库之一，使用广泛资料也很多。对 MySQL 的监控分两个方面，一个是 MySQL 的性能数据的监控，另一个是 MySQL 的业务数据的监控"
date: 2025-06-03T15:22:57+08:00
lastmod: 2025-06-03T15:22:57+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5200
toc: true
---

> 对于监控系统，基础功能的强弱确实非常关键，但是如何在不同的场景落地实践，则更为关键。在《监控实践》章节，搜罗各类监控实践经验，会以不同的组件分门别类，您如果对某个组件有好的实践经验，欢迎提 PR，把您的文章链接附到对应的组件目录下。

- [使用 Categraf 监控 MySQL 的入门教程](https://mp.weixin.qq.com/s/v9us3-Dkafa_UR42WxReDg)
- [根据夜莺模板中心的引导，建设 MySQL 监控](https://mp.weixin.qq.com/s/NNSNc7TOo2y6tRy10zgYow)
- [如何发现及处理 MySQL 主从延迟问题](https://mp.weixin.qq.com/s/Ca0qleA9XFqf1y3BiW8PfQ)
- [MySQL 监控原理讲解](https://mp.weixin.qq.com/s/v72AZf9-yUXblbQxAck7dw)
- [使用 Exporter 监控 MySQL](https://mp.weixin.qq.com/s/gyqXh1ZGnoOC6jg6xOp-IA)
- [解决 MySQL 的 max_prepared_stmt_count 问题](https://mp.weixin.qq.com/s/YkzDo81OqGoDhbXLqQsvHw)

除了 MySQL 的性能数据的监控，我们也可以自定义 SQL 来监控 MySQL 中的数据（通过 Categraf 的 [mysql](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/mysql/) 插件即可做到），这通常会有两个用途：

- 扩展性能监控指标，默认的性能监控数据不够用的话，可以通过这种方式来扩展
- 监控业务数据，这个场景就极为广泛了，比如监控订单数据、用户数据等。这个场景容易被大家忽略，但有时有奇效

