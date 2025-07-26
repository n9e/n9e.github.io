---
title: "Helm"
description: "Use Helm chart to install Nightingale monitoring (Nightingale) and deploy it in Kubernetes."
lead: ""
date: 2020-11-12T13:26:54+01:00
lastmod: 2025-07-26T14:05:04.555+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 400
toc: true
---

You can run Nightingale using the [n9e helm chart](https://github.com/flashcatcloud/n9e-helm) to deploy it in a Kubernetes cluster.

The default username for Nightingale is `root`, and the password is `root.2020`.

However, we do not recommend deploying Nightingale in Kubernetes because the monitoring system is too critical. If the Kubernetes cluster encounters issues, it may cause the monitoring system to malfunction. At that time, you might want to use the monitoring data to troubleshoot Kubernetes issues, leading to a circular dependency. Especially when other teams find that they cannot use the monitoring system, they may come to you with complaints.
