---
title: "Datadog-Agent"
description: "Use Datadog-Agent as collector for Nightingale"
lead: ""
date: 2022-05-12T13:26:54+01:00
lastmod: 2025-01-26T10:55:54+08:00
draft: false
images: []
menu:
  docs:
    parent: "agent"
weight: 720
toc: true
---

## Configuration

Mofidy the configuration item `dd_url` in the file `/etc/datadog-agent/datadog.yaml`.

```yaml
dd_url: http://nightingale-address/datadog
```

`nightingale-address` is your Nightingale address.

## Restart

Restart the Datadog-Agent.

```bash
systemctl restart datadog-agent
```
