---
title: "插件脚本"
description: "本文介绍 Categraf 的自定义监控插件脚本的机制。插件脚本使用 Shell、Python、Go 等都可以，把执行文件的路径告诉 Categraf 即可，Categraf 就会按照配置的时间间隔周期性执行这些脚本，把输出的内容作为监控数据采集。"
date: 2025-06-05T14:49:37+08:00
lastmod: 2025-06-05T14:49:37+08:00
draft: false
images: []
menu:
  docs:
    parent: "practice"
weight: 5110
toc: true
---

> 对于监控系统，基础功能的强弱确实非常关键，但是如何在不同的场景落地实践，则更为关键。在《监控实践》章节，搜罗各类监控实践经验，会以不同的组件分门别类，您如果对某个组件有好的实践经验，欢迎提 PR，把您的文章链接附到对应的组件目录下。

Categraf 虽然已经内置了很多采集插件，但是总会有一些自定义监控数据采集的需求场景，此时可以考虑使用 Categraf 的 input.exec 插件。这个插件可以执行用户指定的脚本（可以是 Shell、Python、Perl 等脚本，也可以是 Go、C++ 的二进制，只要是个可执行文件就行），然后截获脚本的 stdout，解析为监控数据。

- [EXEC 插件使用文档](https://flashcat.cloud/docs/content/flashcat-monitor/categraf/plugin/exec/)

之前有些社区用户提供了一些插件脚本样例，可以参考：[Categraf Exec 插件脚本样例](https://github.com/flashcatcloud/categraf/tree/main/inputs/exec/scripts)。也欢迎大家继续提交样例。
