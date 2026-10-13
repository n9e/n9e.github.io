---
title: "用夜莺做 TCP/UDP 端口探测"
sidebar_label: "Net Response"
description: "探测本机或远端的端口是否可连、响应是否符合预期，结果码 0 到 4 分别表示成功、超时、连接失败、读失败和内容不匹配。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Net_Response
toc_max_heading_level: 2
mdx:
  format: md
---

net_response 插件对 `targets` 里的 `host:port` 做 TCP 连接或 UDP 收发探测，可选发送一段数据并用 `expect` 匹配响应。结果上报为 `net_response_result_code`：0 成功、1 超时、2 连接失败、3 读失败、4 响应内容不匹配，同时上报连接耗时。

它回答的是「这个端口此刻能不能从这里连上」，和进程存活、Ping 可达是三个不同的问题。规则覆盖端口不可连和探测耗时过长。

## 模板里有什么

- **2 张仪表盘**，共 3 个面板
- **1 条告警规则**，每条附处置步骤
- **2 条指标说明**
- **Categraf 采集配置**：`input.net_response`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.net_response/net_response.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.net_response started` 就说明插件已加载。

   ```toml
   # # collect interval
   # interval = 15

   [mappings]
   # "127.0.0.1:22"= {region="local",ssh="test"}
   # "127.0.0.1:22"= {region="local",ssh="redis"}

   [[instances]]
   targets = [
   #     "127.0.0.1:22",
   #     "localhost:6379",
   #     ":9090"
   ]

   # # append some labels for series
   # labels = { region="cloud", product="n9e" }

   # # interval = global.interval * interval_times
   # interval_times = 1

   ## Protocol, must be "tcp" or "udp"
   ## NOTE: because the "udp" protocol does not respond to requests, it requires
   ## a send/expect string pair (see below).
   # protocol = "tcp"

   ## Set timeout
   # timeout = "1s"

   ## Set read timeout (only used if expecting a response)
   # read_timeout = "1s"

   ## The following options are required for UDP checks. For TCP, they are
   ## optional. The plugin will send the given string to the server and then
   ## expect to receive the given 'expect' string back.
   ## string sent to the server
   # send = "ssh"
   ## expected string in answer
   # expect = "ssh"
   ```

1. 在夜莺「集成中心」里找到 Net Response，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| Net Response Dashboard | 2 |
| TCP detection by UlricQin | 1 |

## 内置告警规则

共 1 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Network address probe failed

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
net_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 nc -vz \<目标> \<端口> 或 telnet \<目标> \<端口> 复现；
1. 到目标机用 ss -lntp | grep \<端口> 确认进程是否在监听；
1. 在监听则排查防火墙、安全组、以及是否只绑定了 127.0.0.1；
1. 未监听则按该服务自身流程拉起，并确认上游负载均衡已把它摘除。

## 指标说明

共 2 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标 | 含义 | 单位 |
| --- | --- | --- |
| `net_response_result_code` | NET 探测结果状态码 — 0 值表示正常，大于 0 就是异常，各个值的含义如下：; 0: Success; 1: Timeout; 2: ConnectionFailed; 3: ReadFailed; 4: StringMismatch |  |
| `net_response_response_time` | NET 探测耗时 | s |

## 相关链接

- [Net Response 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Net_Response）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `net_response` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/net_response)：完整配置项和指标列表。
- [实践：端口与连通性探测](/docs/practice/port)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
