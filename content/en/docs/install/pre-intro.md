---
title: "Pre-Introduction"
description: "Nightingale supports various installation methods, including binary deployment, Docker Compose deployment, and Helm deployment. Which one should you choose? This article provides some suggestions."
lead: ""
date: 2025-07-26T13:42:33.831+08:00
lastmod: 2025-07-26T13:42:33.831+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 199
toc: true
---

Common installation methods include:

- Binary deployment
- Docker Compose deployment
- Helm deployment

The recommended method is binary deployment, for the following reasons:

- Nightingale consists of a single binary file with minimal dependencies, making it easier to manage. Most users are familiar with `systemd`, so you can simply use `systemd` to manage the Nightingale process.
- Docker Compose deployment may have slightly lower performance compared to binary deployment, and it requires additional knowledge of Docker. Additionally, issues with pulling images due to network restrictions in China can be troublesome.
- Helm deployment is suitable for Kubernetes environments, but since monitoring systems are critical (`P0` level), if Kubernetes goes down, the monitoring system will also be affected. This can lead to complaints from other teams about the lack of planning.

Regardless of the installation method, after installation, the default username for Nightingale is `root`, and the password is `root.2020`. Nightingale listens on port `17000` by default, and in edge mode, the `n9e-edge` port is `19000`.

If you are using edge mode, please be sure to read the [Edge Mode Documentation](/docs/install/binary/#edge-mode) section.