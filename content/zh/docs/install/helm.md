---
title: "Helm"
description: "使用 Helm chart 安装夜莺监控（Nightingale），将夜莺监控部署在 Kubernetes 中。"
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2025-05-31T11:11:47.328+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 400
toc: true
---

你可以使用 [n9e helm chart](https://github.com/flashcatcloud/n9e-helm) 在 Kubernetes 集群中运行夜莺。

默认的夜莺用户名是 `root`，密码是 `root.2020`。

不过，我们不建议您把夜莺部署到 Kubernetes 中，因为监控系统太过重要，如果 Kubernetes 集群出现问题，可能会导致监控系统无法正常工作。而此时您可能希望通过监控数据排查 Kubernetes 的问题，导致循环依赖。尤其是，其他团队此时想使用监控系统发现用不了，可能会来怼你。
