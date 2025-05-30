---
title: "学习夜莺的前置知识"
description: "夜莺监控（Nightingale）是一个开源的监控系统，本文介绍了学习夜莺前需要了解的一些基础知识和概念。监控方向的知识非常驳杂，希望各位读者能够耐心。"
date: 2025-05-30T22:03:32.092+08:00
lastmod: 2025-05-30T22:03:35.669+08:00
draft: false
images: []
menu:
  docs:
    parent: "prologue"
weight: 175
toc: true
---

夜莺监控（Nightingale）算是 Prometheus 大生态的一部分，所以很多 Prometheus 的概念和知识就是使用夜莺的前置知识，本文把关键知识做一个罗列，并给出相关学习资料，希望对你有所帮助。

## 基础知识

- Linux 知识，比如进程相关、网络相关、systemd 相关的等，可参考书籍《鸟哥的Linux私房菜》、视频教程《[面向研发工程师的Linux进阶知识](https://edu.51cto.com/course/31049.html)》
- 提问的技巧，可以参考著名黑客 Raymond 的《[提问的智慧](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md)》，在全球范围内传播甚广。Raymond 的文章很长，也可以参考这篇短文《[学会这招，技术问题再也难不倒你](https://mp.weixin.qq.com/s/eCoN4e8hoXfHtubNwbLMIQ)》

## 监控知识

- 基础的一些监控概念，可以参考这个专栏《[运维监控系统实战笔记](https://time.geekbang.org/column/intro/100522501)》，尤其是前面几篇基础内容
- Prometheus 的基础概念，可以参考 Prometheus 的[官网文档](https://prometheus.io/)，也可以参考这里的[中文知识](https://flashcat.cloud/docs/content/flashcat-partner/prometheus/quickstart/overview/)。
- Promql，非常非常非常重要，这是使用 Prometheus 和 Nightingale 的前提，可以参考《[Promql系列教程](https://flashcat.cloud/tags/promql/)》