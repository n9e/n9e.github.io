---
title: "用夜莺监控 EMQX"
sidebar_label: "EMQX"
description: "通过 EMQX Dashboard API 采集节点状态、连接数、订阅、消息收发与丢弃，支持 v3、v4、v5 三代版本。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/EMQX
toc_max_heading_level: 2
mdx:
  format: md
---

EMQX 插件调用 Dashboard API（默认 18083）采集：先从 `/nodes` 拿到每个节点的版本、运行状态、连接数、进程与内存，再采集集群级的订阅数、路由、消息收发与丢弃计数、会话与保留消息。一个集群写多个节点地址会随机挑一个可用的连，多个集群拆成多个 `[[instances]]`。

配置里的 `version` 要和 EMQX 的大版本对应（v3/v4/v5），API 需要 Dashboard 账号。规则覆盖节点离线、连接数突降、消息丢弃升高和进程数逼近上限。

## 模板里有什么

- **9 条告警规则**，每条附处置步骤
- **Categraf 采集配置**：`input.emqx`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.emqx/emqx.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.emqx started` 就说明插件已加载。

   ```toml
   [[instances]]
   ## emqx的dashboard地址，ip:port, 单个集群监控使用逗号分割多个IP,会随机挑一个可用ip进行连接请求
   ## 多个集群，拆分到多个instance配置
   address="http://192.168.11.12:18083"
   ## 指定emqx的版本，支持v3/v4/v5, 分别对应emqx的3.X/4.X/5.X 版本
   version="v3"
   ## api需要鉴权，输入用户名和密码
   username="admin"
   password="public"
   ```

1. 在夜莺「集成中心」里找到 EMQX，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置告警规则

共 9 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### EMQX 节点不在运行状态

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
emqx_node_status != 1
```

处置步骤:

1. 从告警标签取 node，登录该主机执行 emqx ctl status 与 systemctl status emqx 确认进程状态；
1. 进程存活但状态异常的查看 log/emqx.log.1 尾部，常见为 Erlang 虚拟机内存耗尽或磁盘写满导致节点自保；
1. 进程不在则先执行 df -h 与 free -g 排除资源问题再启动；
1. 恢复后执行 emqx ctl cluster status 确认该节点已重新加入集群，并观察连接数是否回流。

### EMQX 集群存在已停止的节点

S1 紧急 · 持续 2 分钟 · 触发条件:

```promql
emqx_cluster_node_stopped > 0
```

处置步骤:

1. 从告警标签取 cluster，在任一存活节点执行 emqx ctl cluster status 确认哪些节点 stopped；
1. 登录停止的节点按单节点故障排查（进程、内存、磁盘、日志）；
1. 节点短期无法恢复的，执行 emqx ctl cluster force-leave \<node> 把它移出集群，避免路由表持续尝试同步；
1. 恢复期间关注剩余节点的连接数与内存，必要时先扩容再让设备重连。

### EMQX 连接数逼近文件描述符上限

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
emqx_node_connections / (emqx_node_max_fds > 0) * 100 > 80
```

处置步骤:

1. 从告警标签取 node，执行 emqx ctl listeners 查看各监听器的当前连接与最大连接配置；
1. 执行 cat /proc/$(pgrep -f beam.smp)/limits | grep 'open files' 确认实际 fd 上限；
1. 调大 systemd 的 LimitNOFILE 与 emqx.conf 中 node.max_ports，重启后生效，注意评估内存（每连接约占几十 KB）；
1. 若是异常客户端疯狂重连占用连接，先在网关侧限流并检查客户端的重连退避策略。

### EMQX Erlang 进程数逼近上限

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
emqx_node_process_used / (emqx_node_process_available > 0) * 100 > 80
```

处置步骤:

1. 从告警标签取 node，执行 emqx ctl vm 查看 process/used 与 process/limit 的实时值；
1. 对比连接数增长趋势，确认是正常业务增长还是会话泄漏（大量 clean_session=false 的持久会话不断累积）；
1. 持久会话堆积的检查 session 过期时间配置，并用 emqx ctl sessions list 抽查；
1. 确实需要更大容量的调大 emqx.conf 中 node.process_limit 并重启，同时评估内存。

### EMQX 节点内存使用率过高

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
emqx_node_memory_used_bytes / (emqx_node_memory_total_bytes > 0) * 100 > 85
```

处置步骤:

1. 从告警标签取 node，执行 emqx ctl vm memory 查看各部分内存占用（processes/binary/ets）；
1. binary 占比高通常是消息积压在会话队列里，检查是否有消费不及时的订阅者，用 emqx ctl topics list 确认热点主题；
1. processes 占比高多为会话数过多，按 Erlang 进程告警的思路处理持久会话；
1. 应急可调低 mqueue_max_len 限制单会话队列长度，避免个别慢消费者拖垮整个节点。

### EMQX 消息丢弃激增

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(emqx_messages_dropped[5m]) > 1
```

处置步骤:

1. 从告警标签取 node，执行 emqx ctl metrics | grep dropped 区分丢弃原因（queue_full / no_subscribers / expired）；
1. queue_full 的说明订阅端消费太慢，先排查消费者，再评估调大 mqueue_max_len；
1. no_subscribers 的确认发布端主题拼写是否正确、订阅端是否已断开；
1. expired 的检查消息的 Message Expiry Interval 与实际投递时延是否匹配。

### EMQX 客户端认证失败激增

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(emqx_packets_connack_auth_error[5m]) > 1
```

处置步骤:

1. 从告警标签取 node，查看 log/emqx.log 中的认证失败记录，确认失败的 clientid 与来源 IP 分布；
1. 来源集中且 clientid 规律的多为认证后端故障，检查 emqx ctl authn list 配置的数据源（MySQL/Redis/HTTP）是否可达；
1. 来源分散且 clientid 随机的判定为暴力破解，在防火墙或网关侧限流并开启黑名单；
1. 确认是凭据批量过期导致的，先临时放行再推动设备侧更新凭据。

### EMQX 规则引擎动作失败率过高

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
rate(emqx_actions_failure[5m]) / ((rate(emqx_actions_success[5m]) + rate(emqx_actions_failure[5m])) > 0) * 100 > 5
```

处置步骤:

1. 从告警标签取 node，在 Dashboard 的规则引擎页面查看各规则的失败计数，定位失败的规则与动作；
1. 查看 log/emqx.log 里该动作的报错，区分是下游不可达、超时还是数据格式不匹配；
1. 下游不可达的先修下游并确认桥接的连接池与超时配置合理；
1. 数据格式问题的检查规则 SQL 的字段映射，修改后用 Dashboard 的测试功能验证再发布。

### EMQX 节点近期发生过重启

S3 提醒 · 持续 1 分钟 · 触发条件:

```promql
emqx_node_uptime_seconds < 300
```

处置步骤:

1. 先确认是否是计划内发布或扩缩容；
1. 非计划则查看 log/emqx.log.1 与 journalctl -u emqx --since '-30min' 定位退出原因；
1. 执行 dmesg -T | grep -i 'killed process' 排除被 OOM 杀掉的可能，是则按内存告警处理；
1. 重启后关注连接数回升曲线与 CPU，必要时在网关侧对重连做限速，避免风暴打垮刚恢复的节点。

## 相关链接

- [EMQX 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/EMQX）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
