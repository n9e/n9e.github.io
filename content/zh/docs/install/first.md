---
title: "开始之前"
description: "安装夜莺之前必读的内容"
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2020-11-12T13:26:54+01:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 605
toc: true
---

各种环境的选型建议：

- 快速体验测试，使用 Docker compose 方式
- 公司大规模使用了 Kubernetes，可以选中 Helm 方式
- 最稳定的部署方式，还是二进制
- 小规模使用，比如 1000 台机器以下，用 Prometheus 做存储即可，超过 1000 台机器，选择 VictoriaMetrics 可能更合适

后面章节会讲解各种方式如何部署，也可参考下面的两篇文章，里边有视频演示：

- [【连载】说透运维监控系统-2.1安装夜莺监控系统](https://mp.weixin.qq.com/s/iEC4pfL1TgjMDOWYh8H-FA)
- [【连载】说透运维监控系统-2.2监控系统典型架构以及夜莺分布式部署方案](https://mp.weixin.qq.com/s/zJU4nAr9MALXYr8woLTuUw)