---
title: "Categraf"
description: "Use Categraf as collector for Nightingale"
lead: ""
date: 2022-05-12T13:26:54+01:00
lastmod: 2025-08-08T10:32:43.773+08:00
draft: false
images: []
menu:
  docs:
    parent: "agent"
weight: 700
toc: true
---

[Categraf](https://github.com/flashcatcloud/categraf) is an agent which can collect metrics and logs. Categraf uses `prometheus remote write` as data push protocol, so it can push metrics to Nightingale.

## Configuration

Configuration file of categraf: `conf/config.toml`

```toml
[writer_opt]
# default: 2000
batch = 2000
# channel(as queue) size
chan_size = 10000

[[writers]]
url = "http://N9E:17000/prometheus/v1/write"

# Basic auth username
basic_auth_user = ""

# Basic auth password
basic_auth_pass = ""

# timeout settings, unit: ms
timeout = 5000
dial_timeout = 2500
max_idle_conns_per_host = 100

[heartbeat]
enable = true

# report os version cpu.util mem.util metadata
url = "http://N9E:17000/v1/n9e/heartbeat"

# interval, unit: s
interval = 10

# Basic auth username
basic_auth_user = ""

# Basic auth password
basic_auth_pass = ""

## Optional headers
# headers = ["X-From", "categraf", "X-Xyz", "abc"]

# timeout settings, unit: ms
timeout = 5000
dial_timeout = 2500
max_idle_conns_per_host = 100
```

We highly recommend that you use Categraf as collector for Nightingale.

## FAQ

### 1. How to collect multiple instances?

For example, if there are multiple MySQL instances or multiple processes to monitor, how should the configuration be done?

Most plugin sample configurations in Categraf include a `[[instances]]` configuration section. For any plugin with this section, you can monitor multiple targets by adding more `[[instances]]` sections. Categraf's configuration files are in toml format, where double square brackets indicate an array. Take the configuration sample of the MySQL plugin as an example:

```toml
[[instances]]
address = "10.1.2.3:3306"
username = "categraf"
password = "XXXXXXXX"
labels = { instance="n9e-mysql-01" }

[[instances]]
address = "10.1.2.4:3306"
username = "categraf"
password = "XXXXXXXX"
labels = { instance="n9e-mysql-02" }
```

Another example is the configuration sample of the process monitoring plugin procstat:

```toml
[[instances]]
search_exec_substring = "mysqld"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]

[[instances]]
search_exec_substring = "n9e-plus"
gather_total = true
gather_per_pid = true
gather_more_metrics = [
    "threads",
    "fd",
    "io",
    "uptime",
    "cpu",
    "mem",
    "limit",
]
```
