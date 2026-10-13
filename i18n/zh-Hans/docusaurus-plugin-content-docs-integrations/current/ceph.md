---
title: "用夜莺监控 Ceph"
sidebar_label: "Ceph"
description: "开启 Ceph 的 prometheus mgr 模块后直接抓 9283 端口，模板覆盖集群健康、OSD、PG、池容量和 IOPS。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Ceph
toc_max_heading_level: 2
mdx:
  format: md
---

Ceph 的 mgr 自带 prometheus 模块：`ceph mgr module enable prometheus` 之后在 9283 端口暴露 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门插件。

模板里的仪表盘覆盖集群健康状态、OSD 在线与容量、PG 状态分布、各存储池的用量与 IOPS、MON 法定人数。规则覆盖集群 HEALTH_WARN/ERR、OSD down、PG 异常、池容量逼近上限和 MON 失去法定人数。

## 模板里有什么

- **1 张仪表盘**，共 57 个面板
- **15 条告警规则**，每条附处置步骤

## 怎么接入

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](/docs/data/prometheus)，模板同样能用。

```toml
# conf/input.prometheus/ceph.toml
[[instances]]
urls = ["http://<ceph-mgr>:9283/metrics"]
labels = { service = "ceph", cluster = "ceph-cluster-001" }
```

1. 在夜莺「集成中心」里找到 Ceph，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| Ceph - Cluster By Categraf | 57 |

## 内置告警规则

共 15 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### CephErrorState

Ceph is in Error state longer than 5m, please check status of pools and OSDs

S1 紧急 · 持续 5 分钟 · 触发条件:

```promql
ceph_health_status > 1
```

处置步骤:

1. 立即用 ceph health detail 看具体是哪一项 ERR；
1. 常见为 PG inactive/incomplete、OSD 大量 down、或 full osd 导致集群只读；
1. 先恢复 down 的 OSD 或释放已满 OSD 的空间，这是绝大多数 ERR 的根因；
1. 恢复期间不要执行扩缩容或调整 crush map，避免加重数据迁移。

### CephOsdReweighted

OSD \{\{ $labels.ceph_daemon\}\} on cluster \{\{ $labels.cluster\}\} was reweighted for too long. Please either create silent or fix that issue

S2 警告 · 持续 60 分钟 · 触发条件:

```promql
ceph_osd_weight < 1
```

处置步骤:

1. 用 ceph osd tree 确认是哪个 OSD 被降权、当前权重多少；
1. 确认是人工 reweight 还是 reweight-by-utilization 自动调整；
1. 若故障已恢复，用 ceph osd reweight \<id> 1.0 恢复权重让数据回填；
1. 若是为了平衡容量而降权，评估是否该改用 balancer 模块统一处理。

### CephOSDUtilization

Osd free space for  \{\{ $labels.osd \}\} is higher tan 90%. Please validate why its so big, reweight or add storage

S1 紧急 · 持续 1 分钟 · 触发条件:

```promql
ceph_osd_utilization > 90
```

处置步骤:

1. 用 ceph osd df 看各 OSD 使用率分布，确认是个别 OSD 偏高还是整体接近满；
1. 个别偏高的用 ceph balancer status 确认均衡器是否开启，未开启则 ceph balancer on；
1. 整体接近满的必须扩容 OSD，或先删除无用的 pool/快照释放空间；
1. 应急可临时调高 mon_osd_full_ratio 争取时间，但这是危险操作，必须同时进行扩容。

### CephPgActivating

Some groups are activating for too long on \{\{ $labels.cluster \}\}. Those PGs are unavailable for too long!

S1 紧急 · 持续 5 分钟 · 触发条件:

```promql
ceph_pg_activating > 0
```

处置步骤:

1. 用 ceph -s 与 ceph health detail 看集群整体状态和具体告警项；
1. 用 ceph pg dump_stuck 与 ceph pg \<pgid> query 定位卡住的 PG 及其原因；
1. 多数情况根因是 OSD down 或磁盘满——先恢复 OSD 或释放空间，PG 会自动回到 active+clean；
1. 恢复期间用 ceph -w 持续观察，避免同时做其他会加重负载的操作。

### CephPgBackfillTooFull

Some groups are located on full OSD on cluster \{\{ $labels.cluster \}\}. Those PGs can be unavailable shortly. Please check OSDs, change weight or reconfigure CRUSH rules.

S2 警告 · 持续 5 分钟 · 触发条件:

```promql
ceph_pg_backfill_toofull > 0
```

处置步骤:

1. 用 ceph osd df 找出空间不足的 OSD；
1. 释放空间或扩容 OSD 是根本解法；
1. 应急可调高 osd_backfill_full_ratio 让回填继续，但要确认磁盘确实还有余量；
1. 回填完成前避免再有 OSD 下线，否则冗余会进一步降低。

### CephPgDown

Some groups are down (unavailable) for too long on \{\{ $labels.cluster \}\}. Please ensure that all the data are available

S1 紧急 · 持续 3 分钟 · 触发条件:

```promql
ceph_pg_down > 0
```

处置步骤:

1. 用 ceph pg \<pgid> query 看 down 的原因，重点看 blocked_by 指向哪些 OSD；
1. 把这些 OSD 恢复上线是最直接的解法——通常是磁盘或主机故障；
1. OSD 确实无法恢复时，需要评估 osd lost 操作的数据丢失风险后再执行；
1. 全程记录操作，涉及数据丢失的决策要有人复核。

### CephPgIncomplete

Some groups are incomplete (unavailable) for too long on \{\{ $labels.cluster \}\}. Please ensure that all the data are available

S1 紧急 · 持续 2 分钟 · 触发条件:

```promql
ceph_pg_incomplete > 0
```

处置步骤:

1. 用 ceph -s 与 ceph health detail 看集群整体状态和具体告警项；
1. 用 ceph pg dump_stuck 与 ceph pg \<pgid> query 定位卡住的 PG 及其原因；
1. 多数情况根因是 OSD down 或磁盘满——先恢复 OSD 或释放空间，PG 会自动回到 active+clean；
1. 恢复期间用 ceph -w 持续观察，避免同时做其他会加重负载的操作。

### CephPgInconsistent

Some groups are inconsistent for too long on \{\{ $labels.cluster \}\}. Data is available but inconsistent across nodes

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
ceph_pg_inconsistent > 0
```

处置步骤:

1. 用 ceph health detail 找出不一致的 PG，再用 rados list-inconsistent-obj \<pgid> 看具体对象；
1. 用 ceph pg repair \<pgid> 触发修复，Ceph 会用权威副本覆盖；
1. 修复前确认坏的是哪一份——若主副本本身损坏，需先确认权威副本可靠；
1. 反复出现不一致的 OSD 要查磁盘 SMART，多为坏道，应换盘。

### CephPgUnavailable

Some groups are unavailable on \{\{ $labels.cluster \}\}. Please check their detailed status and current configuration.

S1 紧急 · 持续 5 分钟 · 触发条件:

```promql
ceph_pg_total - ceph_pg_active > 0
```

处置步骤:

1. 用 ceph -s 与 ceph health detail 看集群整体状态和具体告警项；
1. 用 ceph pg dump_stuck 与 ceph pg \<pgid> query 定位卡住的 PG 及其原因；
1. 多数情况根因是 OSD down 或磁盘满——先恢复 OSD 或释放空间，PG 会自动回到 active+clean；
1. 恢复期间用 ceph -w 持续观察，避免同时做其他会加重负载的操作。

### CephTargetDown

CEPH target down for more than 2m, please check - it could be a either exporter crash or a whole cluster crash

S1 紧急 · 持续 10 分钟 · 触发条件:

```promql
up{job="ceph"} == 0
```

处置步骤:

1. 确认 ceph exporter / mgr 所在节点是否存活，进程是否运行；
1. 用 ceph -s 在任一 mon 节点手工确认集群本身是否健康；
1. mgr 挂了会导致大量指标缺失，用 ceph mgr fail 触发切换到备用 mgr；
1. 恢复采集后确认历史数据缺口，注意盲区期间没有告警。

### CephWarnState

Ceph is in Warn state longer than 30m, please check status of pools and OSDs

S2 警告 · 持续 30 分钟 · 触发条件:

```promql
ceph_health_status == 1
```

处置步骤:

1. 用 ceph health detail 看具体是哪些 WARN 项；
1. 常见为 OSD 单点 down、PG 未 clean、时钟偏移、pool 未设置 pg_autoscale；
1. 逐项按提示处理，Ceph 的 health detail 通常已给出明确指引；
1. 处理完确认 ceph -s 回到 HEALTH_OK。

### MonitorAvailableStorage

Monitor storage for \{\{ $labels.monitor \}\} less than 30% - please check why its too high

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
ceph_monitor_avail_percent < 30
```

处置步骤:

1. 用 df -h 确认 /var/lib/ceph/mon 所在分区的余量；
1. mon 目录膨胀最常见的原因是集群长期不 clean 导致 osdmap 无法裁剪——先解决集群 health 问题；
1. 用 ceph tell mon.\<id> compact 触发 rocksdb 压缩释放空间；
1. 长期需给 mon 单独分配更大的磁盘。

### MonitorClockSkewTooHigh

Monitor clock skew detected on  \{\{ $labels.monitor \}\} - please check ntp and hardware clock settings

S2 警告 · 持续 1 分钟 · 触发条件:

```promql
abs(ceph_monitor_clock_skew_seconds) > 0.1
```

处置步骤:

1. 在各 mon 节点用 chronyc tracking 确认偏移量与上游源状态；
1. 确认所有 mon 节点用的是同一组 NTP 源；
1. chronyd 未运行的启动并设开机自启，偏移过大的用 chronyc makestep 强制对时；
1. 对完时后用 ceph -s 确认 clock skew 告警消失。

### OsdApplyLatencyTooHigh

OSD latency for \{\{ $labels.osd \}\} is too high. Please check if it doesn't stuck in weird state

S2 警告 · 持续 90 秒 · 触发条件:

```promql
ceph_osd_perf_apply_latency_seconds > 10
```

处置步骤:

1. 用 ceph osd perf 看各 OSD 的 commit/apply 延迟，定位是个别还是普遍；
1. 个别 OSD 高延迟的，到该节点用 iostat -x 1 与 smartctl 检查磁盘健康与是否已打满；
1. 普遍高延迟的确认是否正在做大规模 recovery/backfill，可调低 osd_max_backfills 降低影响；
1. 磁盘故障的按换盘流程处理。

### OsdDown

OSD is down longer than 30 min, please check what's the status

S2 警告 · 持续 30 分钟 · 触发条件:

```promql
ceph_osd_up == 0
```

处置步骤:

1. 用 ceph osd tree 确认是哪个 OSD、在哪个节点；
1. 到该节点用 systemctl status ceph-osd@\<id> 与其日志定位原因（磁盘故障、OOM、进程崩溃）；
1. 磁盘正常的直接拉起 OSD；磁盘故障的走换盘流程并 ceph osd out 让数据迁走；
1. 恢复期间用 ceph -s 观察 recovery 进度，避免同时下线更多 OSD。

## 相关链接

- [Ceph 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Ceph）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
