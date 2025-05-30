---
title: "Datadog-Agent"
description: "使用 Datadog-Agent 作为夜莺监控的采集器"
lead: ""
date: 2025-01-26T10:55:54+08:00
lastmod: 2025-01-26T10:55:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "agent"
weight: 900
toc: true
---

## 配置

Datadog-agent 的配置文件路径为 `/etc/datadog-agent/datadog.yaml`，修改配置文件中的 `dd_url` 项。

```yaml
dd_url: http://nightingale-address/datadog
```

`nightingale-address` 为你的夜莺地址。

## 重启

重启 Datadog-Agent。

```bash
systemctl restart datadog-agent
```
