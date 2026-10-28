# 用夜莺监控 TiDB

TiDB、PD、TiKV 都通过 /metrics 暴露 Prometheus 指标，模板覆盖 SQL 延迟、Region 调度、存储和节点健康。

最后校对于 2026-10-28

TiDB 集群的各组件都自带 Prometheus 指标端点：TiDB Server 在 10080、PD 在 2379、TiKV 在 20180，TiFlash、TiCDC 等按各自配置。用 Categraf 的 `prometheus` 插件逐个抓取，或者直接把 TiUP 部署时自带的 Prometheus 接成夜莺数据源。

仪表盘依赖 `k8s_cluster`、`tidb_cluster`、`job` 和 `instance` 四个标签，非 Kubernetes 部署也要给前两个标签固定值。规则覆盖 TiDB 查询失败与慢查询、PD Region 异常、TiKV 存储和 Raft 延迟、组件宕机。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 58 个面板
* **28 条告警规则**，每条附处置步骤

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](https://n9e.github.io/zh/docs/data/prometheus.md)，模板同样能用。

```
# conf/input.prometheus/tidb.toml

interval = 15



[[instances]]

urls = ["http://<tidb>:10080/metrics"]

labels = { job = "tidb", k8s_cluster = "", tidb_cluster = "prod" }



[[instances]]

urls = ["http://<pd>:2379/metrics"]

labels = { job = "pd", k8s_cluster = "", tidb_cluster = "prod" }



[[instances]]

urls = ["http://<tikv>:20180/metrics"]

labels = { job = "tikv", k8s_cluster = "", tidb_cluster = "prod" }
```

1. 在夜莺「集成中心」里找到 TiDB，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘        | 面板数 |
| ------------- | ------ |
| tidb-Overview | 58     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 28 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### TiDB-CPU 使用率大于 80%[​](#tidb-cpu-使用率大于-80 "TiDB-CPU 使用率大于 80%的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) by(instance) * 100 <= 20
```

处置步骤:

1. 用 top -H 定位是 tidb-server、tikv-server 还是其他进程占用；
2. TiKV 高 CPU 常见于 coprocessor 请求过多，查 TiDB 慢日志找扫描量大的 SQL；
3. TiDB 高 CPU 常见于复杂计算或大量小查询，看 Grafana 的 TiDB Query Summary；
4. 优化 SQL 后仍高则扩容节点。

### TiDB-Node\_exporter\_is\_down[​](#tidb-node_exporter_is_down "TiDB-Node_exporter_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="node_exporter"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-PD 写盘延迟大于 1s ，leader 写盘慢会导致 leader 切换[​](#tidb-pd-写盘延迟大于-1s-leader-写盘慢会导致-leader-切换 "TiDB-PD 写盘延迟大于 1s ，leader 写盘慢会导致 leader 切换的直接链接")

TiDB(中控)

S3 提醒 · 持续 1 分钟 · 触发条件:

```
histogram_quantile(0.99, sum(rate(etcd_disk_wal_fsync_duration_seconds_bucket[1m])) by (instance,job,le) ) > 1
```

处置步骤:

1. 在 PD 节点用 iostat -x 1 确认磁盘 util 与 await，PD 必须用 SSD；
2. 确认 PD 数据目录未与 TiKV 数据盘混用；
3. 检查是否有其他进程在抢占该盘 IO；
4. 磁盘性能确实不足的，迁移 PD 到独立 SSD 是唯一根本解法。

### TiDB-PD 无 leader[​](#tidb-pd-无-leader "TiDB-PD 无 leader的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
sum(etcd_server_is_leader) !=1
```

处置步骤:

1. 用 pd-ctl member 查看各 PD 成员状态，确认存活节点是否已不足多数派；
2. 不足多数派的立即恢复宕掉的 PD 节点；
3. 节点都活着却选不出 leader 的，检查 PD 之间的网络连通性与时钟偏移；
4. 查各 PD 的日志定位选举失败原因，必要时按官方文档做 PD 恢复。

### TiDB-PD 节点之间网络延迟大于 1s[​](#tidb-pd-节点之间网络延迟大于-1s "TiDB-PD 节点之间网络延迟大于 1s的直接链接")

TiDB(中控)

S3 提醒 · 持续 1 分钟 · 触发条件:

```
histogram_quantile(0.99, sum(rate(etcd_network_peer_round_trip_time_seconds_bucket[1m])) by (To,instance,job,le) ) > 1
```

处置步骤:

1. 在 PD 节点间用 mtr 确认延迟与丢包出现在哪一跳；
2. 确认 PD 节点是否被跨机房部署——PD 对网络延迟非常敏感，应同机房；
3. 检查网卡是否有错包丢包、带宽是否打满；
4. 联系网络侧排查，期间避免做大规模数据迁移加重网络压力。

### TiDB-TCP 连接数大于 50000[​](#tidb-tcp-连接数大于-50000 "TiDB-TCP 连接数大于 50000的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
node_netstat_Tcp_CurrEstab > 50000
```

处置步骤:

1. 用 ss -s 看连接状态分布，确认是 ESTABLISHED 还是 TIME\_WAIT 为主；
2. 用 ss -tan | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn 定位连接来源；
3. 应用侧未复用连接的改用连接池；
4. TIME\_WAIT 为主的开启 tcp\_tw\_reuse 并调大端口范围。

### TiDB-TiDB\_server\_is\_down[​](#tidb-tidb_server_is_down "TiDB-TiDB_server_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="tidb"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-blackbox\_is\_down[​](#tidb-blackbox_is_down "TiDB-blackbox_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="blackbox_exporter"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-drainer\_server\_is\_down[​](#tidb-drainer_server_is_down "TiDB-drainer_server_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="drainer"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-grafana\_is\_down[​](#tidb-grafana_is_down "TiDB-grafana_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="grafana"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-pd\_server\_is\_down[​](#tidb-pd_server_is_down "TiDB-pd_server_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="pd"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-pump\_server\_is\_down[​](#tidb-pump_server_is_down "TiDB-pump_server_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="pump"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-tidb CPU 使用率超过可用 CPU的 80%[​](#tidb-tidb-cpu-使用率超过可用-cpu的-80 "TiDB-tidb CPU 使用率超过可用 CPU的 80%的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(process_cpu_seconds_total{job="tidb"}[1m]) > tidb_server_maxprocs{job="tidb"} * 0.8
```

处置步骤:

1. 看 Grafana 的 TiDB Query Summary 找 QPS 与耗时最高的语句类型；
2. 用 TiDB 慢日志定位具体 SQL，检查是否缺索引导致大量数据回表；
3. 确认 tidb\_server\_maxprocs 配置是否与容器/机器规格匹配；
4. 优化 SQL 后仍高则扩容 tidb-server 实例。

### TiDB-tidb 最近 15 分钟加载 schema 出现错误[​](#tidb-tidb-最近-15-分钟加载-schema-出现错误 "TiDB-tidb 最近 15 分钟加载 schema 出现错误的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
increase(tidb_session_schema_lease_error_total{type="outdated"}[15m]) > 0
```

处置步骤:

1. 查该 tidb-server 的日志搜 schema lease 相关报错；
2. 常见根因是该实例与 PD/TiKV 网络不稳，或 GC 压力大导致租约续期失败；
3. 确认是否有长时间运行的大事务阻塞 schema 变更；
4. 单实例问题可先摘流量重启该实例，全局问题需排查 PD 与网络。

### TiDB-tidb 最近五分钟出现跳过 binlog[​](#tidb-tidb-最近五分钟出现跳过-binlog "TiDB-tidb 最近五分钟出现跳过 binlog的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase( tidb_server_critical_error_total[5m] ) > 0
```

处置步骤:

1. 查 tidb-server 日志搜 critical error 与 binlog 相关记录，确认跳过的原因与范围；
2. 检查 pump/drainer 是否可用——写不进 binlog 是最常见原因；
3. 确认下游数据是否已缺失，必要时用工具做数据校验与补齐；
4. 修复 binlog 链路后持续观察，确认不再跳过。

### TiDB-tidb 最近十分钟加载 schema 失败大于 10 次[​](#tidb-tidb-最近十分钟加载-schema-失败大于-10-次 "TiDB-tidb 最近十分钟加载 schema 失败大于 10 次的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
increase( tidb_domain_load_schema_total{type="failed"}[10m] ) > 10
```

处置步骤:

1. 查该实例日志确认失败的具体报错；
2. 排查到 PD/TiKV 的网络连通性与延迟；
3. 确认是否有 DDL 长时间卡住（ADMIN SHOW DDL JOBS）阻塞了 schema 版本推进；
4. 卡住的 DDL 可用 ADMIN CANCEL DDL JOBS 取消后重做。

### TiDB-tiflash\_server\_is\_down[​](#tidb-tiflash_server_is_down "TiDB-tiflash_server_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="tiflash"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-tikv 5分钟内内存增长大于 5G[​](#tidb-tikv-5分钟内内存增长大于-5g "TiDB-tikv 5分钟内内存增长大于 5G的直接链接")

TiDB(中控)

S3 提醒 · 持续 1 分钟 · 触发条件:

```
process_resident_memory_bytes{job=~"tikv",instance=~".*"} - (process_resident_memory_bytes{job=~"tikv",instance=~".*"} offset 5m) > 5*1024*1024*1024
```

处置步骤:

1. 用 TiDB 慢日志与 Grafana 的 TiKV Coprocessor 面板定位是否有超大范围扫描的 SQL；
2. 必要时 KILL 该查询止血；
3. 检查 block-cache-size 配置是否超过物理内存的合理比例（建议不超过 45%）；
4. 若为实例刚启动的正常预热，可忽略但需确认后续趋于平稳。

### TiDB-tikv 发生重启[​](#tidb-tikv-发生重启 "TiDB-tikv 发生重启的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
changes(process_start_time_seconds{job="tikv"}[5m]) > 0
```

处置步骤:

1. 查 tikv 日志尾部与 dmesg -T | grep -i 'killed process'，区分崩溃、被 OOM 杀死、人工重启；
2. OOM 的核对 block-cache-size 与机器内存；
3. panic 的收集日志并对照 TiDB 版本的已知问题；
4. 重启后用 pd-ctl store 确认该 store 已恢复 Up 且 region 已重新均衡。

### TiDB-tikv 可用空间低于 20%[​](#tidb-tikv-可用空间低于-20 "TiDB-tikv 可用空间低于 20%的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
sum(tikv_store_size_bytes{type="available"}) by (instance) / sum(tikv_store_size_bytes{type="capacity"}) by (instance) < 0.2
```

处置步骤:

1. 用 pd-ctl store 看各 store 的容量与使用率，确认是个别还是普遍；
2. 个别节点满的检查 region 是否分布不均，用 pd-ctl 调整调度；
3. 普遍满的必须扩容 TiKV 节点；
4. 确认 GC 是否正常运行（GC life time 是否被设得过长导致旧版本堆积）。

### TiDB-tikv\_server\_is\_down[​](#tidb-tikv_server_is_down "TiDB-tikv_server_is_down的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
probe_success{group="tikv"} == 0
```

处置步骤:

1. 从告警标签取实例地址，先 ping/ssh 确认机器存活；
2. 到该节点确认对应进程是否运行、日志中有无 panic 或 OOM；
3. 进程存活但探测失败的排查端口监听与防火墙；
4. 用 tiup cluster display <集群名> 看整体拓扑状态，确认剩余节点是否仍满足多数派。

### TiDB-内存使用大于 80%[​](#tidb-内存使用大于-80 "TiDB-内存使用大于 80%的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
(((node_memory_MemTotal_bytes-node_memory_MemFree_bytes-node_memory_Cached_bytes)/(node_memory_MemTotal_bytes)*100)) >= 80
```

处置步骤:

1. 用 ps aux --sort=-%mem | head 确认是哪个进程占用最高；
2. TiKV 内存高优先核对 block-cache-size；TiDB 内存高排查是否有大查询未设 mem-quota-query；
3. 设置 tidb\_mem\_quota\_query 限制单查询内存；
4. 确认无泄漏后仍不足的，扩内存或迁移实例。

### TiDB-挂载点状态变为只读[​](#tidb-挂载点状态变为只读 "TiDB-挂载点状态变为只读的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
node_filesystem_readonly{fstype=~"(ext.|xfs)"} == 1
```

处置步骤:

1. 用 dmesg -T | grep -iE 'i/o error|remount|read-only' 确认触发原因；
2. 用 smartctl -a /dev/sdX 检查磁盘健康，多数是坏道；
3. 立即把该节点上的服务下线（pd-ctl store delete 或 tiup 摘除），避免继续尝试写入；
4. 换盘后重新加入集群并等待数据回补。

### TiDB-文件系统 inode 使用率大于 80%[​](#tidb-文件系统-inode-使用率大于-80 "TiDB-文件系统 inode 使用率大于 80%的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
node_filesystem_files_free{fstype=~"(ext.|xfs)"} / node_filesystem_files{fstype=~"(ext.|xfs)"} * 100 < 20
```

处置步骤:

1. 用 df -i 确认是哪个挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. TiDB 场景常见是日志文件未轮转清理，先清理旧日志；
4. 长期可调整日志保留策略或格式化时提高 inode 密度。

### TiDB-磁盘使用率大于 80%[​](#tidb-磁盘使用率大于-80 "TiDB-磁盘使用率大于 80%的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
node_filesystem_avail_bytes{fstype=~"(ext.|xfs)", mountpoint!~"/boot"} / node_filesystem_size_bytes{fstype=~"(ext.|xfs)", mountpoint!~"/boot"} * 100 <= 20
```

处置步骤:

1. 用 df -h 与 du -x --max-depth=1 定位占用最大的目录；
2. TiDB 节点常见是日志与慢日志堆积，先清理；
3. TiKV 数据盘满的需扩容或加节点，并确认 GC 正常运行；
4. 用 lsof +L1 检查已删除但句柄未释放的文件。

### TiDB-网卡-入向有丢包[​](#tidb-网卡-入向有丢包 "TiDB-网卡-入向有丢包的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_in[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 与 ethtool -S <网卡> 确认丢包计数与原因；
2. 环形缓冲区不足的用 ethtool -G <网卡> rx 调大；
3. 确认带宽是否打满——大规模 region 迁移会打满网卡；
4. 必要时用 pd-ctl 调低调度并发（leader-schedule-limit、region-schedule-limit）。

### TiDB-网卡-出向有丢包[​](#tidb-网卡-出向有丢包 "TiDB-网卡-出向有丢包的直接链接")

TiDB(中控)

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_out[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 与 ethtool -S <网卡> 确认发送侧丢包；
2. 调大 txqueuelen 与发送队列；
3. 确认是否跑满带宽，必要时降低 PD 调度并发；
4. 排查网卡驱动与对端交换机端口状态。

### TiDB-集群中出现状态为 down 的 tikv 数量大于 0[​](#tidb-集群中出现状态为-down-的-tikv-数量大于-0 "TiDB-集群中出现状态为 down 的 tikv 数量大于 0的直接链接")

TiDB(中控)

S1 紧急 · 持续 1 分钟 · 触发条件:

```
(sum(pd_cluster_status{type="store_down_count"}) by (instance) > 0) and (sum(etcd_server_is_leader) by (instance) > 0)
```

处置步骤:

1. 用 pd-ctl store 确认是哪个 store、down 了多久；
2. 到该节点确认 tikv 进程与磁盘状态；
3. 短时间内能恢复的尽快拉起，避免 PD 触发大规模副本补充造成额外负载；
4. 确实无法恢复的用 pd-ctl store delete \<id> 优雅下线，让数据有序迁走。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[TiDB 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/TiDB）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/TiDB%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
