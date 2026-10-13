---
title: "用夜莺零配置监控交换机（Switch Legacy）"
sidebar_label: "Switch (legacy)"
description: "给一组 IP 就能自动识别设备型号，采 CPU、内存和每个端口的流量、错包与状态，只支持 SNMP v2c。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Switch_Legacy
toc_max_heading_level: 2
mdx:
  format: md
---

switch_legacy 插件 fork 自 swcollector，面向「只想把交换机快速接进来」的场景：配置里给 IP 列表（单个、网段或范围），插件自动探测设备型号，用通用 OID 采集 CPU、内存使用率以及每个网口的流量、包数、错包、丢包和 up/down 状态，不用自己写 OID。

只支持 SNMP v2c，认证就是一个 community 字符串。把 `switch_id_label` 设为 `ident`，交换机会以 IP 为标识自动出现在夜莺的监控对象列表里。需要自定义 OID 或 SNMP v3 时换 [SNMP 集成](/integrations/snmp)。规则覆盖端口 down、流量逼近带宽、错包升高和设备不可达。

## 模板里有什么

- **1 张仪表盘**，共 14 个面板
- **7 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.switch_legacy`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.switch_legacy/switch_legacy.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.switch_legacy started` 就说明插件已加载。

   ```toml
   # # collect interval
   # interval = "300s"

   switch_id_label = "ip"

   [mappings]
   "192.168.88.160" = "switch001.bj"
   "192.168.88.161" = "switch002.bj"

   [[instances]]
   # # interval = global.interval * interval_times
   # interval_times = 1

   # use global unique string to specify instance
   # labels = { region="beijing" }

   ips = [
   #     "172.16.2.1",
   #     "172.16.4/24",
   #     "192.168.56.102-192.168.56.120"
   ]

   community = "public"

   # whether use index tag
   index_tag = false

   ignore_ifaces = ["Nu", "NU", "Vlan", "Vl"]

   concurrency_for_address = 1000
   concurrency_for_request = 4

   ping_enable = true
   ping_mode_fastping = true
   ping_timeout_ms = 300
   ping_retries = 4

   # true: use gosnmp, false: use snmpwalk
   snmp_mode_gosnmp = true
   snmp_timeout_ms = 1000
   snmp_retries = 5

   gather_ping_metrics = true
   gather_flow_metrics = true
   gather_cpu_metrics = true
   gather_mem_metrics = true
   gather_oper_status = false
   gather_pkt = false
   gather_broadcast_pkt = false
   gather_multicast_pkt = false
   gather_discards = false
   gather_errors = false
   gather_unknown_protos = false
   gather_out_qlen = false

   # ignore metrics if limit > 0 and collected value > limit
   speed_limit = 0
   pkt_limit = 0
   broadcast_pkt_limit = 0
   multicast_pkt_limit = 0
   discards_pkt_limit = 0
   errors_pkt_limit = 0
   unknown_protos_pkt_limit = 0
   out_qlen_pkt_limit = 0

   # [[instances.customs]]
   # metric = "AnyconnectSession"
   # tags = {}
   # oid = "1.3.6.1.4.1.9.9.392.1.3.35.0"

   # [[instances.customs]]
   # metric = "ConnectionStat"
   # tags = {}
   # oid = "1.3.6.1.4.1.9.9.147.1.2.2.2.1.5.40.6"

   # [[instances.customs]]
   # metric = "TempStatus"
   # tags = {}
   # oid = "1.3.6.1.4.1.9.9.13.1.3.1.3.1004"
   ```

1. 在夜莺「集成中心」里找到 Switch (legacy)，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| 网络交换机 | 14 |

## 内置告警规则

共 7 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### 交换机不可达

S1 紧急 · 持续 2 分钟 · 触发条件:

```promql
switch_legacy_ping_up == 0
```

处置步骤:

1. 从告警标签取设备标识，从另一台机器执行 ping 与 traceroute 二次确认，排除采集端自身网络问题；
1. 能 ping 通说明是采集端到设备的路径问题，检查中间链路与 ACL；
1. ping 不通则联系机房确认设备电源与指示灯状态，并尝试通过 Console 口登录；
1. 确认设备故障的立即切换到冗余链路（检查堆叠/VRRP 是否已自动切换），并安排备件更换。

### 交换机 CPU 使用率过高

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
switch_legacy_cpu_util > 80
```

处置步骤:

1. 登录设备执行 display cpu-usage（华为）或 show processes cpu sorted（Cisco）确认是哪个进程占用；
1. 占用高的常见是 ARP/广播风暴或大量报文上送 CPU，执行 display cpu-defend statistics 查看上送情况；
1. 广播风暴的定位源端口并配置风暴抑制（storm-control），同时检查是否存在环路（STP 状态）；
1. 协议进程占用高的检查路由表规模与邻居数量，必要时做路由聚合。

### 交换机内存使用率过高

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
switch_legacy_mem_util > 80
```

处置步骤:

1. 登录设备执行 display memory-usage 或 show memory statistics 确认占用分布；
1. 检查 MAC 表、ARP 表、路由表规模是否已接近设备规格上限；
1. 表项异常膨胀的排查是否存在 MAC 泛洪攻击，配置端口安全限制单端口 MAC 学习数量；
1. 确属业务规模增长的，评估设备规格是否需要升级，并清理不再使用的配置与 ACL。

### 交换机端口状态频繁翻转

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
changes(switch_legacy_if_oper_status[10m]) > 2
```

处置步骤:

1. 从告警标签取端口标识，登录设备执行 display interface \<端口> 查看 up/down 次数与最后一次翻转时间；
1. 优先怀疑物理层：检查光模块收发光功率（display transceiver diagnosis）是否在门限内，以及光纤与接头是否松动；
1. 电口翻转的检查网线质量与两端的速率/双工协商是否一致；
1. 排除物理问题后检查对端设备是否在反复重启，必要时先 shutdown 该端口避免持续引发全网重收敛。

### 交换机端口入向错包

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(switch_legacy_if_in_errors[5m]) > 1
```

处置步骤:

1. 从告警标签取端口标识，执行 display interface \<端口> 查看 CRC、Frame、Giants 等错误计数明细；
1. CRC 错误为主的基本是物理问题：更换网线/光纤、清洁光模块接头、确认线缆长度未超标；
1. 检查两端速率与双工是否协商一致，半双工与全双工不匹配会产生大量冲突错包；
1. 更换线缆后执行 reset counters interface \<端口> 清零计数，观察是否不再增长。

### 交换机端口入向带宽利用率过高

S2 警告 · 持续 10 分钟 · 触发条件:

```promql
switch_legacy_if_in_speed_percent > 80
```

处置步骤:

1. 从告警标签取端口标识，执行 display interface \<端口> 确认实时速率与端口协商速率；
1. 用 NetFlow/sFlow 或在服务器侧抓包，确认流量由哪些业务贡献，排除异常流量（备份任务、数据同步跑错时段）；
1. 确属正常业务增长的，评估做链路聚合（Eth-Trunk / port-channel）扩容；
1. 短期可对非关键流量配置 QoS 限速，保障关键业务带宽。

### 交换机端口出向带宽利用率过高

S2 警告 · 持续 10 分钟 · 触发条件:

```promql
switch_legacy_if_out_speed_percent > 80
```

处置步骤:

1. 从告警标签取端口标识，执行 display interface \<端口> 查看出方向速率与队列丢弃计数；
1. 上联口打满的优先做链路聚合扩容，这是最直接的解法；
1. 用流量分析确认是否有大流量业务应该走其他路径，必要时调整路由或做流量工程；
1. 扩容前可对次要业务配置 QoS 队列限速，先保住关键业务。

## 相关链接

- [Switch (legacy) 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Switch_Legacy）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `switch_legacy` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/switch_legacy)：完整配置项和指标列表。
- [SNMP：按 OID 自定义采集](/integrations/snmp)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
