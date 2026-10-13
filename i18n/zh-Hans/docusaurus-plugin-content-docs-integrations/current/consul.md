---
title: "用夜莺监控 Consul"
sidebar_label: "Consul"
description: "通过 Consul API 采集所有注册服务的健康检查状态，哪个服务在哪个节点上 critical 或 warning 一目了然。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Consul
toc_max_heading_level: 2
mdx:
  format: md
---

Consul 插件调用 Consul 的健康检查 API，把每一项注册的 health check 转成指标：服务名、节点、检查名、当前状态（passing、warning、critical）。它不采集 Consul 自身的 telemetry（那部分 Consul 可以通过 StatsD 或自带的 Prometheus 端点输出），专注于「注册在 Consul 里的服务有没有挂」这一个问题。

规则覆盖服务实例进入 critical、整个服务没有健康实例、节点失联、检查长期 warning 和 Consul 本身不可达。支持 ACL token 和 TLS。

## 模板里有什么

- **7 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.consul`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.consul/consul.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.consul started` 就说明插件已加载。

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
     ## Consul server address
     # address = "localhost:8500"

     ## URI scheme for the Consul server, one of "http", "https"
     # scheme = "http"

     ## ACL token used in every request
     # token = ""

     ## HTTP Basic Authentication username and password.
     # username = ""
     # password = ""

     ## Data center to query the health checks from
     # datacenter = ""

     ## Allows any Consul server (non-leader) to service a read.
     ## Default is true
     # allow_stale = true

     ## Forces the read to be fully consistent.
     ## Default is false
     # require_consistent = false

     ## Prefix from which to expose key/value pairs.
     # kv_prefix = ""

     ## Regex that determines which keys to expose.
     ## Default is ".*"
     # kv_filter = ".*"

     ## Optional TLS Config
     # tls_ca = "/etc/telegraf/ca.pem"
     # tls_cert = "/etc/telegraf/cert.pem"
     # tls_key = "/etc/telegraf/key.pem"
     ## Use TLS but skip chain & host verification
     # insecure_skip_verify = true
   ```

1. 在夜莺「集成中心」里找到 Consul，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置告警规则

共 7 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### Consul 实例不可达

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
consul_up == 0
```

处置步骤:

1. 登录主机执行 systemctl status consul 与 consul members 确认进程与集群视图；
1. 进程存活则执行 curl -s http://127.0.0.1:8500/v1/status/leader 验证 API 是否可用，403 说明采集用的 ACL Token 权限不足或已过期；
1. 进程不在则查看 journalctl -u consul 定位退出原因（常见为 raft 数据目录损坏、端口占用）；
1. 恢复前先确认其余节点仍构成多数派，避免误操作导致集群失去仲裁。

### Consul 集群没有 Leader

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
consul_raft_leader == 0
```

处置步骤:

1. 在每个 server 节点执行 consul operator raft list-peers，确认存活的 server 数是否已不足多数派；
1. 存活数不足时优先把宕掉的 server 拉起来恢复仲裁，不要急于做 peers.json 恢复；
1. 存活数够但仍选不出主，检查 server 之间 8300/8301 端口连通性与时钟偏差（chronyc tracking）；
1. 确认无法自动恢复时，再按官方 outage recovery 流程用 raft/peers.json 手工重建 peer 列表。

### Consul Autopilot 判定集群不健康

S1 紧急 · 持续 3 分钟 · 触发条件:

```promql
consul_autopilot_healthy == 0
```

处置步骤:

1. 执行 consul operator autopilot state 查看每个 server 的 Healthy 与 LastContact；
1. 对 Healthy=false 的节点检查进程存活与到 Leader 的网络延迟；
1. LastIndex 落后很多说明该节点在追日志，观察是否持续收敛，磁盘 IO 慢是常见原因（用 iostat -x 1 确认）；
1. 节点确认报废时执行 consul force-leave \<node> 或 consul operator raft remove-peer 把它移出集群。

### Consul 集群容错度归零

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
consul_autopilot_failure_tolerance == 0
```

处置步骤:

1. 执行 consul operator raft list-peers 统计当前健康 server 数（3 节点集群容错 1，5 节点容错 2）；
1. 有节点异常则优先修复该节点而不是新增节点，避免 peer 数变成偶数；
1. 确实需要扩容时按奇数扩到 5 台，并确认新节点 raft 追平后容错度恢复；
1. 修复期间避免做任何滚动重启或版本升级操作。

### Consul 服务健康检查 critical

categraf 对同一条检查会按 passing/warning/critical/maintenance 各推一个同名同标签的样本，落库后数值会互相覆盖，因此这里用 status 标签的存在性判断而不是比较数值。

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
count by (address, node, service_name, check_name) (consul_health_service_status{status="critical"}) > 0
```

处置步骤:

1. 从告警标签取 node 与 service_name，执行 consul catalog nodes -service=\<service_name> 确认还剩几个健康实例，只剩一个时立即扩容；
1. 登录 node 执行 curl -s http://127.0.0.1:8500/v1/health/checks/\<service_name> 看 Output 字段里的具体失败原因；
1. 按 Output 排查对应进程与端口（检查脚本超时、HTTP 返回码不符、TCP 拒绝连接）；
1. 若是检查本身配置有误（超时过短、路径写错），修 service 定义后执行 consul reload。

### Consul 节点健康检查 critical

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
count by (address, node, check_name) (consul_health_node_status{status="critical"}) > 0
```

处置步骤:

1. 从告警标签取 node，执行 consul members 确认该节点的 Serf 状态是 alive 还是 failed；
1. failed 说明 gossip 不通，检查 8301（LAN）端口的双向连通性与安全组，以及主机是否已宕机；
1. 节点正常但 serfHealth 反复抖动，通常是网络丢包或主机负载过高导致 gossip 超时，用 mtr 与 uptime 确认；
1. 节点已确认下线则执行 consul force-leave \<node> 清理，避免残留条目持续告警。

### Consul 集群成员失联

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
consul_serf_lan_member_status != 1
```

处置步骤:

1. 从 member 标签取节点名，执行 consul members 确认它当前的状态；
1. Failed 状态先确认主机是否存活、consul 进程是否在跑；
1. 主机正常则检查 8301 端口 TCP/UDP 双向连通与 MTU（gossip 依赖 UDP，MTU 不一致会导致间歇失联）；
1. 节点确实已下线则执行 consul force-leave \<node>，Left 状态的残留条目 72 小时后会自动清理。

## 相关链接

- [Consul 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Consul）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `consul` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/consul)：完整配置项和指标列表。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
