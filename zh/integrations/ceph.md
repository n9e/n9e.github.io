# 用夜莺监控 Ceph

开启 Ceph 的 prometheus mgr 模块后直接抓 9283 端口，模板覆盖集群健康、OSD、PG、池容量和 IOPS。

最后校对于 2026-10-13

Ceph 的 mgr 自带 prometheus 模块：`ceph mgr module enable prometheus` 之后在 9283 端口暴露 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门插件。

模板里的仪表盘覆盖集群健康状态、OSD 在线与容量、PG 状态分布、各存储池的用量与 IOPS、MON 法定人数。规则覆盖集群 HEALTH\_WARN/ERR、OSD down、PG 异常、池容量逼近上限和 MON 失去法定人数。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 57 个面板
* **15 条告警规则**，每条附处置步骤

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](https://n9e.github.io/zh/docs/data/prometheus.md)，模板同样能用。

```
# conf/input.prometheus/ceph.toml

[[instances]]

urls = ["http://<ceph-mgr>:9283/metrics"]

labels = { service = "ceph", cluster = "ceph-cluster-001" }
```

1. 在夜莺「集成中心」里找到 Ceph，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                     | 面板数 |
| -------------------------- | ------ |
| Ceph - Cluster By Categraf | 57     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 15 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### CephErrorState[​](#cepherrorstate "CephErrorState的直接链接")

Ceph is in Error state longer than 5m, please check status of pools and OSDs

S1 紧急 · 持续 5 分钟 · 触发条件:

```
ceph_health_status > 1
```

处置步骤:

1. 立即用 ceph health detail 看具体是哪一项 ERR；
2. 常见为 PG inactive/incomplete、OSD 大量 down、或 full osd 导致集群只读；
3. 先恢复 down 的 OSD 或释放已满 OSD 的空间，这是绝大多数 ERR 的根因；
4. 恢复期间不要执行扩缩容或调整 crush map，避免加重数据迁移。

### CephOsdReweighted[​](#cephosdreweighted "CephOsdReweighted的直接链接")

OSD {{ $labels.ceph\_daemon}} on cluster {{ $labels.cluster}} was reweighted for too long. Please either create silent or fix that issue

S2 警告 · 持续 60 分钟 · 触发条件:

```
ceph_osd_weight < 1
```

处置步骤:

1. 用 ceph osd tree 确认是哪个 OSD 被降权、当前权重多少；
2. 确认是人工 reweight 还是 reweight-by-utilization 自动调整；
3. 若故障已恢复，用 ceph osd reweight \<id> 1.0 恢复权重让数据回填；
4. 若是为了平衡容量而降权，评估是否该改用 balancer 模块统一处理。

### CephOSDUtilization[​](#cephosdutilization "CephOSDUtilization的直接链接")

Osd free space for {{ $labels.osd }} is higher tan 90%. Please validate why its so big, reweight or add storage

S1 紧急 · 持续 1 分钟 · 触发条件:

```
ceph_osd_utilization > 90
```

处置步骤:

1. 用 ceph osd df 看各 OSD 使用率分布，确认是个别 OSD 偏高还是整体接近满；
2. 个别偏高的用 ceph balancer status 确认均衡器是否开启，未开启则 ceph balancer on；
3. 整体接近满的必须扩容 OSD，或先删除无用的 pool/快照释放空间；
4. 应急可临时调高 mon\_osd\_full\_ratio 争取时间，但这是危险操作，必须同时进行扩容。

### CephPgActivating[​](#cephpgactivating "CephPgActivating的直接链接")

Some groups are activating for too long on {{ $labels.cluster }}. Those PGs are unavailable for too long!

S1 紧急 · 持续 5 分钟 · 触发条件:

```
ceph_pg_activating > 0
```

处置步骤:

1. 用 ceph -s 与 ceph health detail 看集群整体状态和具体告警项；
2. 用 ceph pg dump\_stuck 与 ceph pg \<pgid> query 定位卡住的 PG 及其原因；
3. 多数情况根因是 OSD down 或磁盘满——先恢复 OSD 或释放空间，PG 会自动回到 active+clean；
4. 恢复期间用 ceph -w 持续观察，避免同时做其他会加重负载的操作。

### CephPgBackfillTooFull[​](#cephpgbackfilltoofull "CephPgBackfillTooFull的直接链接")

Some groups are located on full OSD on cluster {{ $labels.cluster }}. Those PGs can be unavailable shortly. Please check OSDs, change weight or reconfigure CRUSH rules.

S2 警告 · 持续 5 分钟 · 触发条件:

```
ceph_pg_backfill_toofull > 0
```

处置步骤:

1. 用 ceph osd df 找出空间不足的 OSD；
2. 释放空间或扩容 OSD 是根本解法；
3. 应急可调高 osd\_backfill\_full\_ratio 让回填继续，但要确认磁盘确实还有余量；
4. 回填完成前避免再有 OSD 下线，否则冗余会进一步降低。

### CephPgDown[​](#cephpgdown "CephPgDown的直接链接")

Some groups are down (unavailable) for too long on {{ $labels.cluster }}. Please ensure that all the data are available

S1 紧急 · 持续 3 分钟 · 触发条件:

```
ceph_pg_down > 0
```

处置步骤:

1. 用 ceph pg \<pgid> query 看 down 的原因，重点看 blocked\_by 指向哪些 OSD；
2. 把这些 OSD 恢复上线是最直接的解法——通常是磁盘或主机故障；
3. OSD 确实无法恢复时，需要评估 osd lost 操作的数据丢失风险后再执行；
4. 全程记录操作，涉及数据丢失的决策要有人复核。

### CephPgIncomplete[​](#cephpgincomplete "CephPgIncomplete的直接链接")

Some groups are incomplete (unavailable) for too long on {{ $labels.cluster }}. Please ensure that all the data are available

S1 紧急 · 持续 2 分钟 · 触发条件:

```
ceph_pg_incomplete > 0
```

处置步骤:

1. 用 ceph -s 与 ceph health detail 看集群整体状态和具体告警项；
2. 用 ceph pg dump\_stuck 与 ceph pg \<pgid> query 定位卡住的 PG 及其原因；
3. 多数情况根因是 OSD down 或磁盘满——先恢复 OSD 或释放空间，PG 会自动回到 active+clean；
4. 恢复期间用 ceph -w 持续观察，避免同时做其他会加重负载的操作。

### CephPgInconsistent[​](#cephpginconsistent "CephPgInconsistent的直接链接")

Some groups are inconsistent for too long on {{ $labels.cluster }}. Data is available but inconsistent across nodes

S2 警告 · 持续 1 分钟 · 触发条件:

```
ceph_pg_inconsistent > 0
```

处置步骤:

1. 用 ceph health detail 找出不一致的 PG，再用 rados list-inconsistent-obj \<pgid> 看具体对象；
2. 用 ceph pg repair \<pgid> 触发修复，Ceph 会用权威副本覆盖；
3. 修复前确认坏的是哪一份——若主副本本身损坏，需先确认权威副本可靠；
4. 反复出现不一致的 OSD 要查磁盘 SMART，多为坏道，应换盘。

### CephPgUnavailable[​](#cephpgunavailable "CephPgUnavailable的直接链接")

Some groups are unavailable on {{ $labels.cluster }}. Please check their detailed status and current configuration.

S1 紧急 · 持续 5 分钟 · 触发条件:

```
ceph_pg_total - ceph_pg_active > 0
```

处置步骤:

1. 用 ceph -s 与 ceph health detail 看集群整体状态和具体告警项；
2. 用 ceph pg dump\_stuck 与 ceph pg \<pgid> query 定位卡住的 PG 及其原因；
3. 多数情况根因是 OSD down 或磁盘满——先恢复 OSD 或释放空间，PG 会自动回到 active+clean；
4. 恢复期间用 ceph -w 持续观察，避免同时做其他会加重负载的操作。

### CephTargetDown[​](#cephtargetdown "CephTargetDown的直接链接")

CEPH target down for more than 2m, please check - it could be a either exporter crash or a whole cluster crash

S1 紧急 · 持续 10 分钟 · 触发条件:

```
up{job="ceph"} == 0
```

处置步骤:

1. 确认 ceph exporter / mgr 所在节点是否存活，进程是否运行；
2. 用 ceph -s 在任一 mon 节点手工确认集群本身是否健康；
3. mgr 挂了会导致大量指标缺失，用 ceph mgr fail 触发切换到备用 mgr；
4. 恢复采集后确认历史数据缺口，注意盲区期间没有告警。

### CephWarnState[​](#cephwarnstate "CephWarnState的直接链接")

Ceph is in Warn state longer than 30m, please check status of pools and OSDs

S2 警告 · 持续 30 分钟 · 触发条件:

```
ceph_health_status == 1
```

处置步骤:

1. 用 ceph health detail 看具体是哪些 WARN 项；
2. 常见为 OSD 单点 down、PG 未 clean、时钟偏移、pool 未设置 pg\_autoscale；
3. 逐项按提示处理，Ceph 的 health detail 通常已给出明确指引；
4. 处理完确认 ceph -s 回到 HEALTH\_OK。

### MonitorAvailableStorage[​](#monitoravailablestorage "MonitorAvailableStorage的直接链接")

Monitor storage for {{ $labels.monitor }} less than 30% - please check why its too high

S2 警告 · 持续 1 分钟 · 触发条件:

```
ceph_monitor_avail_percent < 30
```

处置步骤:

1. 用 df -h 确认 /var/lib/ceph/mon 所在分区的余量；
2. mon 目录膨胀最常见的原因是集群长期不 clean 导致 osdmap 无法裁剪——先解决集群 health 问题；
3. 用 ceph tell mon.\<id> compact 触发 rocksdb 压缩释放空间；
4. 长期需给 mon 单独分配更大的磁盘。

### MonitorClockSkewTooHigh[​](#monitorclockskewtoohigh "MonitorClockSkewTooHigh的直接链接")

Monitor clock skew detected on {{ $labels.monitor }} - please check ntp and hardware clock settings

S2 警告 · 持续 1 分钟 · 触发条件:

```
abs(ceph_monitor_clock_skew_seconds) > 0.1
```

处置步骤:

1. 在各 mon 节点用 chronyc tracking 确认偏移量与上游源状态；
2. 确认所有 mon 节点用的是同一组 NTP 源；
3. chronyd 未运行的启动并设开机自启，偏移过大的用 chronyc makestep 强制对时；
4. 对完时后用 ceph -s 确认 clock skew 告警消失。

### OsdApplyLatencyTooHigh[​](#osdapplylatencytoohigh "OsdApplyLatencyTooHigh的直接链接")

OSD latency for {{ $labels.osd }} is too high. Please check if it doesn't stuck in weird state

S2 警告 · 持续 90 秒 · 触发条件:

```
ceph_osd_perf_apply_latency_seconds > 10
```

处置步骤:

1. 用 ceph osd perf 看各 OSD 的 commit/apply 延迟，定位是个别还是普遍；
2. 个别 OSD 高延迟的，到该节点用 iostat -x 1 与 smartctl 检查磁盘健康与是否已打满；
3. 普遍高延迟的确认是否正在做大规模 recovery/backfill，可调低 osd\_max\_backfills 降低影响；
4. 磁盘故障的按换盘流程处理。

### OsdDown[​](#osddown "OsdDown的直接链接")

OSD is down longer than 30 min, please check what's the status

S2 警告 · 持续 30 分钟 · 触发条件:

```
ceph_osd_up == 0
```

处置步骤:

1. 用 ceph osd tree 确认是哪个 OSD、在哪个节点；
2. 到该节点用 systemctl status ceph-osd@\<id> 与其日志定位原因（磁盘故障、OOM、进程崩溃）；
3. 磁盘正常的直接拉起 OSD；磁盘故障的走换盘流程并 ceph osd out 让数据迁走；
4. 恢复期间用 ceph -s 观察 recovery 进度，避免同时下线更多 OSD。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Ceph 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Ceph）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Ceph%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
