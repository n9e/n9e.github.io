---
title: "安装前置说明"
description: "夜莺监控（Nightingale）支持多种不同的安装方式，包括二进制方式部署、Docker compose 方式部署、Helm 方式部署，到底选择哪一种？本文会给一些建议。"
lead: ""
date: 2025-05-31T08:47:52.812+08:00
lastmod: 2025-05-31T08:47:52.812+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 199
toc: true
---

常用的安装方式有：

- 二进制方式部署
- Docker compose 方式部署
- Helm 方式部署

首推二进制方式，原因：

- 夜莺只有一个二进制文件，没有太多依赖，管理起来比较简单，通常大家对 `systemd` 都比较熟悉，直接用 `systemd` 管理夜莺的进程就行了
- Docker compose 方式比二进制方式性能上稍差，而且 Docker compose 方式需要额外 Docker 相关的知识，还有国内网络导致的镜像拉取问题，有时也会比较难受
- Helm 方式用于部署在 Kubernetes 中，但是监控系统是个 `P0` 级的系统，所有系统都挂了，监控也不能挂，所以如果部署在 Kubernetes 中，那当 Kubernetes 挂的时候，监控也会挂，此时，别的团队可能会来怼你，怨你怎么不提前规划好

不管是哪种安装方式，安装完成后，夜莺的默认用户名是 `root`，密码是 `root.2020`。夜莺默认监听的端口是 `17000`，边缘模式下用的 `n9e-edge` 端口是 `19000`。