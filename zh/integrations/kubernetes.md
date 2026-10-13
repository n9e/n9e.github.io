# 用夜莺监控 Kubernetes

抓 apiserver、kubelet、controller-manager、scheduler、kube-proxy、CoreDNS、kube-state-metrics 和 node-exporter 的原生 /metrics，模板覆盖控制面到 Pod 的每一层。

最后校对于 2026-10-13

Kubernetes 的每个组件都自带 Prometheus 格式的 `/metrics`，推荐用 Categraf 的 `prometheus` 插件直接抓取，再部署 kube-state-metrics（工作负载状态）和 node-exporter（节点资源）。旧的 Categraf kubernetes 插件已废弃，但模板里的仪表盘和规则照常可用。

| 数据源                  | 常用端点                                                                 | 覆盖的模板                                   |
| ----------------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| kube-apiserver          | `https://<api-server>:6443/metrics`                                      | API Server                                   |
| kubelet                 | `https://<node>:10250/metrics`、`/metrics/cadvisor`、`/metrics/resource` | Kubelet、Node、Pod、Container                |
| kube-controller-manager | `https://<control-plane>:10257/metrics`                                  | Controller Manager                           |
| kube-scheduler          | `https://<control-plane>:10259/metrics`                                  | Scheduler                                    |
| kube-proxy              | `http://<node>:10249/metrics`                                            | Proxy                                        |
| kube-state-metrics      | `http://<service>:8080/metrics`                                          | Deployment、StatefulSet、DaemonSet、Pod 状态 |
| CoreDNS                 | `http://<coredns>:9153/metrics`                                          | CoreDNS                                      |
| node-exporter           | `http://<node>:9100/metrics`                                             | Node 资源                                    |

这是模板数量最多的一个集成：仪表盘覆盖控制面各组件、节点、Deployment、StatefulSet、DaemonSet、Pod、容器和 CoreDNS；规则覆盖 Pod 反复重启与 Pending、副本数不足、节点 NotReady 与资源压力、apiserver 延迟与错误率、etcd 与调度失败、证书到期；指标说明按组件逐条解释。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **17 张仪表盘**，共 470 个面板
* **154 条告警规则**，每条附处置步骤
* **305 条指标说明**

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

这类组件自己就暴露 Prometheus 格式的 `/metrics`，用 Categraf 的 `prometheus` 插件抓取即可，不需要专门的插件。如果你已经有 Prometheus 或 VictoriaMetrics 在抓这些端点，直接把它[接成夜莺的数据源](https://n9e.github.io/zh/docs/data/prometheus.md)，模板同样能用。

控制面组件的端点需要 ServiceAccount token 或客户端证书，Categraf 以 DaemonSet 部署在集群内时用 `bearer_token_file` 读取挂载的 token。K3s 等发行版的 scheduler、controller-manager 和 kube-proxy 可能只监听 loopback，要在控制面节点本机采集；不要为了方便把这些无鉴权端点暴露到公网。

1. 在夜莺「集成中心」里找到 Kubernetes，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                               | 面板数 |
| ------------------------------------ | ------ |
| Kubernetes / API Server              | 13     |
| Kubernetes / Controller Manager      | 22     |
| Kubernetes / Deployment / Container  | 44     |
| Kubernetes / Kube State Metrics      | 21     |
| Kubernetes / Kubelet Metrics         | 13     |
| Kubernetes / Pod                     | 48     |
| Kubernetes / Scheduler               | 20     |
| Kubernetes / Statefulset / Container | 44     |
| Kubernetes / CoreDNS                 | 11     |
| Kubernetes / Daemonset               | 10     |
| Kubernetes / Deployment              | 33     |
| Kubernetes / Etcd                    | 20     |
| Kubernetes / Container by categraf   | 5      |
| Kubernetes / Node                    | 93     |
| Kubernetes / Cluster Overview        | 35     |
| Kubernetes / Proxy                   | 11     |
| Kubernetes / StatefulSet             | 27     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 154 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Exporter 采集（36）[​](#exporter-采集36 "Exporter 采集（36）的直接链接")

#### 主机内存不足[​](#主机内存不足 "主机内存不足的直接链接")

节点内存不足 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10
```

处置步骤:

1. 登录节点用 free -h 确认 available 与 swap；
2. ps aux --sort=-%mem | head 找出占用最高的进程；
3. K8s 节点上优先用 kubectl top pod -A --sort-by=memory 定位是哪个 Pod；
4. 泄漏的在应用侧定位，容量不足的迁走部分 Pod 或扩容节点。

#### 主机内存有压力[​](#主机内存有压力 "主机内存有压力的直接链接")

节点内存压力大 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
rate(node_vmstat_pgmajfault[1m]) > 1000
```

处置步骤:

1. 用 vmstat 1 看 si/so 列确认是否已在 swap；
2. 用 sar -B 或 /proc/vmstat 看 pgmajfault 的增长；
3. 定位占用最高的进程或 Pod 并评估是否可迁走；
4. 确认 swap 配置——K8s 节点通常应关闭 swap，开启会掩盖内存问题。

#### 主机入口网络吞吐量异常[​](#主机入口网络吞吐量异常 "主机入口网络吞吐量异常的直接链接")

主机异常网络吞吐量 入 (instance {{ $labels.instance }})

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100
```

处置步骤:

1. 用 iftop 或 nethogs 定位占用带宽最高的进程/连接；
2. K8s 节点上确认是否有 Pod 在做大量数据传输（备份、数据同步、镜像拉取）；
3. 确认是否已跑满网卡带宽，是则限流或错峰；
4. 异常流量的排查是否有配置错误导致的流量环路。

#### 主机出口网络吞吐量异常[​](#主机出口网络吞吐量异常 "主机出口网络吞吐量异常的直接链接")

主机异常网络吞吐量 出 (instance {{ $labels.instance }})

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100
```

处置步骤:

1. 用 iftop 或 nethogs 定位占用带宽最高的进程/连接；
2. K8s 节点上确认是否有 Pod 在做大量数据传输（备份、数据同步、镜像拉取）；
3. 确认是否已跑满网卡带宽，是则限流或错峰；
4. 异常流量的排查是否有配置错误导致的流量环路。

#### 主机磁盘读取速率异常[​](#主机磁盘读取速率异常 "主机磁盘读取速率异常的直接链接")

主机异常磁盘读取率 (instance {{ $labels.instance }})

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum by (instance) (rate(node_disk_read_bytes_total[2m])) / 1024 / 1024 > 50
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util；
2. 用 iotop -oP 找出 IO 最高的进程；
3. K8s 节点常见是容器日志写入、镜像拉取解压、或某个 Pod 的数据写入；
4. 可延后的任务错峰执行，持续高负载的换 SSD 或分散数据。

#### 主机磁盘写入速率异常[​](#主机磁盘写入速�率异常 "主机磁盘写入速率异常的直接链接")

主机异常磁盘写入率 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
sum by (instance) (rate(node_disk_written_bytes_total[2m])) / 1024 / 1024 > 50
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util；
2. 用 iotop -oP 找出 IO 最高的进程；
3. K8s 节点常见是容器日志写入、镜像拉取解压、或某个 Pod 的数据写入；
4. 可延后的任务错峰执行，持续高负载的换 SSD 或分散数据。

#### 主机磁盘空间不足[​](#主机磁盘空间不足 "主机磁盘空间不足的直接链接")

主机磁盘空间不足 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 逐层找占用大的目录；
2. 容器运行时目录（/var/lib/containerd 或 /var/lib/docker）用 crictl rmi --prune 清理无用镜像；
3. 清理容器日志（/var/log/pods），并确认日志轮转配置生效；
4. 用 lsof +L1 检查已删除但句柄未释放的文件。

#### 主机磁盘将在 24 小时内填满[​](#主机磁盘将在-24-小时内填满 "主机磁盘将在 24 小时内填满的直接链接")

主机磁盘将在 24 小时内填满 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) predict_linear(node_filesystem_avail_bytes{fstype!~"tmpfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

处置步骤:

1. 用 du -x --max-depth=1 找出增长最快的目录；
2. 确认增长来源是正常业务还是异常（应用死循环打日志、备份堆积）；
3. 清理无用镜像与容器日志；
4. 增长确实来自业务的，安排扩容磁盘或迁移数据，不要等到写满。

#### 文件系统inode使用率高[​](#文件系统inode使用率高 "文件系统inode使用率高的直接链接")

主机不足 inode (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

#### 文件系统inode将在24小时内填满[​](#文件系统inode将在24小时内填满 "文件系统inode将在24小时内填满的直接链接")

主机 inode 将在 24 小时内填满 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and predict_linear(node_filesystem_files_free{mountpoint="/rootfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

#### 主机磁盘读取延迟异常[​](#主机磁盘读取延迟异常 "主机磁盘读取延迟异常的直接链接")

主机异常磁盘读取延迟 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m]) > 0.1 and rate(node_disk_reads_completed_total[1m]) > 0
```

处置步骤:

1. 用 iostat -x 1 看 r\_await/w\_await 与队列深度；
2. 延迟高但 IOPS 不高的怀疑磁盘硬件问题，用 smartctl -a 检查；
3. IOPS 也高的按磁盘饱和处理，定位高 IO 进程；
4. 云盘的确认是否触及规格的 IOPS/吞吐上限被限流。

#### 主机磁盘写入延迟异常[​](#主机磁盘写入延迟异常 "主机磁盘写入延迟异常的直接链接")

主机异常磁盘写入延迟 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
rate(node_disk_write_time_seconds_total[1m]) / rate(node_disk_writes_completed_total[1m]) > 0.1 and rate(node_disk_writes_completed_total[1m]) > 0
```

处置步骤:

1. 用 iostat -x 1 看 r\_await/w\_await 与队列深度；
2. 延迟高但 IOPS 不高的怀疑磁盘硬件问题，用 smartctl -a 检查；
3. IOPS 也高的按磁盘饱和处理，定位高 IO 进程；
4. 云盘的确认是否触及规格的 IOPS/吞吐上限被限流。

#### 节点cpu负载高[​](#节点cpu负载高 "节点cpu负载高的直接链接")

主机 CPU 负载高 (instance {{ $labels.instance }})

S2 警告 · 触发条件:

```
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟趋势判断是突发还是持续；
2. top 里看 %wa，高说明瓶颈在磁盘而非 CPU；
3. vmstat 1 用 r/b 列区分 CPU 密集与 IO 阻塞；
4. K8s 节点上用 kubectl top pod 定位高负载 Pod 并考虑迁走。

#### 有其他云主机窃取cpu[​](#有其他云主机窃取cpu "有其他云主机窃取cpu的直接链接")

Host CPU steal noisy neighbor (instance {{ $labels.instance }})

S2 警告 · 触发条件:

```
avg by(instance) (rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100 > 10
```

处置步骤:

1. 用 top 或 vmstat 确认 st 列的持续水位；
2. 这是宿主机层面的资源争抢，虚拟机内部无法根治；
3. 云环境下联系云厂商或更换实例规格（独享型规格无 steal）；
4. 自建虚拟化的检查宿主机超卖比例并迁移虚机。

#### 主机上下文切换异常[​](#主机上下文切换异常 "主机上下文切换异常的直接链接")

主机上下文切换 (instance {{ $labels.instance }})

S2 警告 · 触发条件:

```
(rate(node_context_switches_total[5m])) / (count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})) > 1000
```

处置步骤:

1. 用 vmstat 1 确认 cs 列的水位；
2. 用 pidstat -w 1 找出切换最频繁的进程；
3. 常见根因是线程数过多、锁竞争激烈、或大量短生命周期进程；
4. 应用侧收敛线程池大小、优化锁粒度是根本解法。

#### 主机交换内存快满了[​](#主机交换内存快满了 "主机交换内存快满了的直接链接")

主机交换内存已满 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80
```

处置步骤:

1. 用 free -h 与 swapon -s 确认 swap 使用情况；
2. 用 smem 或 /proc/\<pid>/status 的 VmSwap 找出换出最多的进程；
3. K8s 节点原则上应关闭 swap，开启会掩盖真实的内存压力并让 QoS 失效；
4. 根因是内存不足，按内存告警路径处理。

#### 主机系统服务崩溃[​](#主机系统服务崩溃 "主机系统服务崩溃的直接链接")

主机 systemd 服务崩溃 (instance {{ $labels.instance }})

S2 警告 · 触发条件:

```
node_systemd_unit_state{state="failed"} == 1
```

处置步骤:

1. systemctl --failed 列出失败单元；
2. journalctl -u \<unit> -n 100 --no-pager 定位原因；
3. K8s 节点上重点关注 kubelet、containerd、kube-proxy 这几个关键单元；
4. 修复后 systemctl reset-failed 清理状态并确认恢复。

#### 主机内核版本偏差[​](#主机内核版本偏差 "主机内核版本偏差的直接链接")

主机内核版本偏差 (instance {{ $labels.instance }})

S2 警告 · 持续 360 分钟 · 触发条件:

```
count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1
```

处置步骤:

1. 用 kubectl get node -o wide 对比各节点内核版本；
2. 确认差异是升级过程中的临时状态还是长期存在；
3. 逐步把落后节点的内核升级对齐；
4. 升级前确认容器运行时与 CNI 插件对目标内核版本的兼容性。

#### 检测到 HostOomKill[​](#检测到-hostoomkill "检测到 HostOomKill的直接链接")

检测到主机 OOM 终止 (instance {{ $labels.instance }})

S2 警告 · 触发条件:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀进程与当时内存；
2. 对照 kubectl get pod -A 找出对应的 Pod，看是否是 limit 设置过低；
3. 节点整体内存紧张的迁走部分 Pod 或扩容；
4. 反复被杀的必须在应用侧定位内存泄漏，只调 limit 会反复复发。

#### 主机网络接收错误[​](#主机网络接收错误 "主机网络接收错误的直接链接")

主机网络接收错误 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
rate(node_network_receive_errs_total[2m]) / rate(node_network_receive_packets_total[2m]) > 0.01
```

处置步骤:

1. 用 ip -s link show <网卡> 与 ethtool -S <网卡> 确认错包计数与类型；
2. 确认协商速率与双工模式和对端一致；
3. 检查网线/光模块，云环境下提工单给云厂商；
4. 有冗余的先把流量切走。

#### 主机网络出口错误[​](#主机网络出口错误 "主机网络出口错误的直接链接")

主机网络传输错误 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
rate(node_network_transmit_errs_total[2m]) / rate(node_network_transmit_packets_total[2m]) > 0.01
```

处置步骤:

1. 用 ip -s link show <网卡> 与 ethtool -S <网卡> 确认错包计数与类型；
2. 确认协商速率与双工模式和对端一致；
3. 检查网线/光模块，云环境下提工单给云厂商；
4. 有冗余的先把流量切走。

#### 主机网络接口饱和[​](#主机网络接口饱和 "主机网络接口饱和的直接链接")

主机网络接口饱和 (instance {{ $labels.instance }})

S2 警告 · 持续 1 分钟 · 触发条件:

```
(rate(node_network_receive_bytes_total{device!~"^tap.*"}[1m]) + rate(node_network_transmit_bytes_total{device!~"^tap.*"}[1m])) / node_network_speed_bytes{device!~"^tap.*"} > 0.8 < 10000
```

处置步骤:

1. 用 iftop/nethogs 定位占用带宽最高的连接；
2. K8s 节点上确认是否有大流量 Pod 或正在拉取大镜像；
3. 可错峰的任务调整执行时间；
4. 确需更高带宽的升级网卡或迁移部分工作负载。

#### conntrack数量接近极限[​](#conntrack数量接近极限 "conntrack数量接近极限的直接链接")

主机连接限制 (instance {{ $labels.instance }})

S2 警告 · 持续 5 分钟 · 触发条件:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit > 0.8
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认水位；
2. K8s 节点上 kube-proxy 的 iptables 模式会产生大量 conntrack 条目，Pod 密度高时尤其明显；
3. 调大 nf\_conntrack\_max 并同步调大 buckets；
4. 长期可评估切换到 IPVS 模式减少 conntrack 压力。

#### 主机时钟偏差[​](#主机时钟偏差 "主机时钟偏差的直接链接")

主机时钟偏差 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
(node_timex_offset_seconds > 0.05 and deriv(node_timex_offset_seconds[5m]) >= 0) or (node_timex_offset_seconds < -0.05 and deriv(node_timex_offset_seconds[5m]) <= 0)
```

处置步骤:

1. 用 chronyc tracking 确认偏移量与上游源状态；
2. 确认 chronyd/ntpd 服务在运行且开机自启；
3. 检查到 NTP 服务器的网络是否放行 123/UDP；
4. 偏移过大用 chronyc makestep 强制对时，之后确认所有节点时间一致。

#### 主机时钟不同步[​](#主机时钟不同步 "主机时钟不同步的直接链接")

主机时钟不同步 (instance {{ $labels.instance }})

S2 警告 · 持续 2 分钟 · 触发条件:

```
min_over_time(node_timex_sync_status[1m]) == 0 and node_timex_maxerror_seconds >= 16
```

处置步骤:

1. 用 chronyc tracking 确认偏移量与上游源状态；
2. 确认 chronyd/ntpd 服务在运行且开机自启；
3. 检查到 NTP 服务器的网络是否放行 123/UDP；
4. 偏移过大用 chronyc makestep 强制对时，之后确认所有节点时间一致。

#### 节点文件系统空间填满-S2[​](#节点文件系统空间填满-s2 "节点文件系统空间填满-S2的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up.

S2 警告 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 40

and

  predict_linear(node_filesystem_avail_bytes{job="node-exporter",fstype!=""}[6h], 24*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 du -x --max-depth=1 找出增长最快的目录；
2. 确认增长来源是正常业务还是异常（应用死循环打日志、备份堆积）；
3. 清理无用镜像与容器日志；
4. 增长确实来自业务的，安排扩容磁盘或迁移数据，不要等到写满。

#### 节点文件系统空间填满-S1[​](#节点文件系统空间填满-s1 "节点文件系统空间填满-S1的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up fast.

S1 紧急 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 15

and

  predict_linear(node_filesystem_avail_bytes{job="node-exporter",fstype!=""}[6h], 4*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 du -x --max-depth=1 找出增长最快的目录；
2. 确认增长来源是正常业务还是异常（应用死循环打日志、备份堆积）；
3. 清理无用镜像与容器日志；
4. 增长确实来自业务的，安排扩容磁盘或迁移数据，不要等到写满。

#### 节点磁盘快满了-S2-space-5[​](#节点磁盘快满了-s2-space-5 "节点磁盘快满了-S2-space-5的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

S2 警告 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 5

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 逐层找占用大的目录；
2. 容器运行时目录（/var/lib/containerd 或 /var/lib/docker）用 crictl rmi --prune 清理无用镜像；
3. 清理容器日志（/var/log/pods），并确认日志轮转配置生效；
4. 用 lsof +L1 检查已删除但句柄未释放的文件。

#### 节点磁盘快满了-S1-space-3[​](#节点磁盘快满了-s1-space-3 "节点磁盘快满了-S1-space-3的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

S1 紧急 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 3

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 逐层找占用大的目录；
2. 容器运行时目录（/var/lib/containerd 或 /var/lib/docker）用 crictl rmi --prune 清理无用镜像；
3. 清理容器日志（/var/log/pods），并确认日志轮转配置生效；
4. 用 lsof +L1 检查已删除但句柄未释放的文件。

#### 节点磁盘快满了-S2-inodes-40[​](#节点磁盘快满了-s2-inodes-40 "节点磁盘快满了-S2-inodes-40的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up.

S2 警告 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 40

and

  predict_linear(node_filesystem_files_free{job="node-exporter",fstype!=""}[6h], 24*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

#### 节点磁盘快满了-S1-inodes-20[​](#节点磁盘快满了-s1-inodes-20 "节点磁盘快满了-S1-inodes-20的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up fast.

S1 紧急 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 20

and

  predict_linear(node_filesystem_files_free{job="node-exporter",fstype!=""}[6h], 4*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

#### 节点磁盘快满了-S2-inodes-5[​](#节点磁盘快满了-s2-inodes-5 "节点磁盘快满了-S2-inodes-5的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

S2 警告 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 5

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

#### 节点磁盘快满了-S1-inodes-3[​](#节点磁盘快满了-s1-inodes-3 "节点磁盘快满了-S1-inodes-3的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

S1 紧急 · 持续 60 分钟 · 触发条件:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 3

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

#### 使用的节点Conntrack条目数量高[​](#使用的节点conntrack条目数量高 "使用的节点Conntrack条目数量高的直接链接")

{{ $value | humanizePercentage }} of conntrack entries are used.

S2 警告 · 触发条件:

```
(node_nf_conntrack_entries / node_nf_conntrack_entries_limit) > 0.75
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认水位；
2. K8s 节点上 kube-proxy 的 iptables 模式会产生大量 conntrack 条目，Pod 密度高时尤其明显；
3. 调大 nf\_conntrack\_max 并同步调大 buckets；
4. 长期可评估切换到 IPVS 模式减少 conntrack 压力。

#### 节点文本文件收集器抓取错误[​](#节点文本文件收集器抓取错误 "节点文本文件收集器抓取错误的直接链接")

Node Exporter text file collector failed to scrape.

S2 警告 · 触发条件:

```
node_textfile_scrape_error{job="node-exporter"} == 1
```

处置步骤:

1. 检查 textfile 目录下的 .prom 文件权限与格式；
2. 写入方通常是 cron 脚本，确认脚本执行成功且用原子写（先写 .tmp 再 mv）；
3. 格式错误的用 promtool check metrics 校验；
4. 清理残留的临时文件，它们会导致解析失败。

#### 节点网络接口抖动[​](#节点网络接口抖动 "节点网络接口抖动的直接链接")

Network interface "{{ $labels.device }}" changing it's up status often on node-exporter {{ $labels.namespace }}/{{ $labels.pod }}"

S2 警告 · 持续 2 分钟 · 触发条件:

```
changes(node_network_up{job="node-exporter",device!~"veth.+"}[2m]) > 2
```

处置步骤:

1. 用 dmesg -T | grep -i 'link is' 看抖动时间线；
2. 检查网线/光模块，抖动多为物理层接触不良；
3. 确认协商速率与双工模式和对端一致；
4. 联系网络侧确认交换机端口状态，云环境下提工单。

### 通用规则（118）[​](#通用规则118 "通用规则（118）的直接链接")

#### Deployment Pod 可用性不足70%（replica超过9个pod）[​](#deployment-pod-可用性不足70replica超过9个pod "Deployment Pod 可用性不足70%（replica超过9个pod）的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
kube_deployment_status_replicas_unavailable and kube_deployment_status_replicas_available{} / kube_deployment_status_replicas{} * 100 < 70 and kube_deployment_status_replicas{} > 9
```

处置步骤:

1. kubectl describe deploy \<name> -n \<ns> 看 Conditions 与 Events；
2. kubectl get pod -n \<ns> -l \<selector> 看未就绪 Pod 的状态与原因；
3. 常见为资源不足无法调度、镜像拉取失败、就绪探针不通过；
4. 按 Pod 的具体状态排查，资源不足的扩容节点或调低 requests。

#### Job执行失败[​](#job执行失败 "Job执行失败的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
kube_job_status_failed{} > 0
```

处置步骤:

1. kubectl get job \<job> -n \<ns> 看失败次数，再 kubectl logs job/\<job> 看失败原因；
2. kubectl describe job 看 Events，确认是否因 backoffLimit 耗尽而放弃；
3. 修复根因后 kubectl delete job 再重新提交，或让 CronJob 下次调度重跑；
4. 确认该任务失败是否有下游影响（数据未产出、清理未执行），需要时手工补做。

#### Pod启动超时[​](#pod启动超时 "Pod启动超时的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
kube_pod_container_status_waiting_reason{} == 1
```

处置步骤:

1. kubectl describe pod \<pod> -n \<ns> 看 Events 的时间戳，定位卡在拉镜像、挂载卷还是初始化容器；
2. 拉镜像慢的检查镜像大小与仓库带宽，考虑预热镜像或用本地仓库；
3. 挂载卷慢的排查 PV/CSI 驱动状态；
4. 应用自身启动慢的优化启动逻辑，并把就绪探针的 initialDelaySeconds 调到合理值。

#### Pod状态异常[​](#pod状态异常 "Pod状态异常的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
kube_pod_status_phase{phase=~"Pending|Unknown|Failed"} > 0
```

处置步骤:

1. kubectl get pod \<pod> -n \<ns> -o wide 看 STATUS 与 READY，再 kubectl describe pod 看 Events；
2. Pending 多为资源不足或调度约束（节点亲和、污点、PVC 未绑定）；ImagePullBackOff 查镜像地址与拉取凭据；
3. Running 但未 Ready 的看就绪探针配置与 kubectl logs \<pod> 里的启动报错；
4. 确认副本数是否已不足以承载流量，不足的先扩容其他健康副本。

#### Pod频繁重启[​](#pod频繁重启 "Pod频繁重启的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(kube_pod_container_status_restarts_total{}[5m]) > 3
```

处置步骤:

1. kubectl logs \<pod> -n \<ns> --previous 看上一次退出前的日志，这是最关键的一步；
2. kubectl describe pod 看退出码与 Events：137 通常是 OOM 或被 kill，1/2 多为应用自身启动失败；
3. 配置或依赖问题（连不上数据库、ConfigMap/Secret 缺失）先修依赖再拉起；
4. OOM 的对照 resources.limits.memory 与实际用量调整，或修复应用内存泄漏。

#### 容器CPU使用率超过80%[​](#容器cpu使用率超过80 "容器CPU使用率超过80%的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
100 * (sum(rate(container_cpu_usage_seconds_total{id!="/"}[2m])) by (pod_name,namespace,container) / sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.*)")) by (pod_name,namespace,container)) > 80 and sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.)")) by (pod_name,namespace,container) != 0
```

处置步骤:

1. kubectl top pod \<pod> -n \<ns> --containers 确认实际用量与 limit 的比值；
2. 对照 CPUThrottlingHigh 指标确认是否已经在被限流；
3. 业务量增长的调大 resources.limits.cpu 或做水平扩容（HPA）；
4. 用量异常的在应用侧抓 CPU profile 定位热点，避免只靠加配额掩盖问题。

#### 容器内存超过80%[​](#容器内存超过80 "容器内存超过80%的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
(sum(container_memory_working_set_bytes{id!="/"}) BY (instance,name,container,pod_name,namespace) / sum(container_spec_memory_limit_bytes{id!="/"} > 0) BY (instance,name,container,pod_name,namespace) * 100) > 80
```

处置步骤:

1. kubectl top pod \<pod> -n \<ns> --containers 确认用量与 limit；
2. 对照历史曲线判断是持续爬升（疑似泄漏）还是业务高峰的正常波动；
3. 正常波动的调大 resources.limits.memory 并预留余量；
4. 持续爬升的在应用侧抓堆定位泄漏，扩配额只是拖延。

#### Node CPU使用率超过90%[​](#node-cpu使用率超过90 "Node CPU使用率超过90%的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
100-cpu_usage_idle{cpu="cpu-total"} > 90
```

处置步骤:

1. kubectl top node 确认整体分布，kubectl top pod -A --sort-by=cpu 找出占用最高的 Pod；
2. 确认该节点是否被调度了过多高负载 Pod，必要时用 kubectl drain 迁走部分；
3. 检查 Pod 的 requests 是否设置过低导致超卖；
4. 集群整体水位高的扩容节点。

#### Node内存使用率超过90%[​](#node内存使用率超过90 "Node内存使用率超过90%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
mem_used_percent > 90
```

处置步骤:

1. kubectl top node 与 kubectl top pod -A --sort-by=memory 定位占用最高的 Pod；
2. 检查是否有 Pod 未设 memory limit 在无限增长；
3. 用 kubectl drain 迁走部分 Pod 缓解，注意先确认目标节点有余量；
4. 检查 kubelet 的驱逐阈值配置是否合理，集群整体紧张的扩容节点。

#### Node状态异常[​](#node状态异常 "Node状态异常的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
kube_node_status_condition{condition="Ready",status="true"} == 0
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 与 Events，确认是 MemoryPressure、DiskPressure 还是 kubelet 失联；
2. 登录节点确认 kubelet 与容器运行时进程状态（systemctl status kubelet containerd）；
3. kubelet 日志用 journalctl -u kubelet -n 200 定位；
4. 节点短期无法恢复的执行 kubectl drain 让 Pod 尽快迁走，避免等待驱逐超时。

#### Node磁盘使用率超过90%[​](#node磁盘使用率超过90 "Node磁盘使用率超过90%的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
disk_used_percent > 90
```

处置步骤:

1. 登录节点用 df -h 定位挂载点，通常是 /var/lib/docker 或 /var/lib/containerd；
2. 执行 crictl rmi --prune 或 docker system prune 清理无用镜像层，这是最快见效的；
3. 检查是否有 Pod 在往 emptyDir 或宿主机路径写大量数据；
4. 清理后确认 kubelet 的 DiskPressure 污点已自动移除。

#### KubeClientCertificateExpiration-S2[​](#kubeclientcertificateexpiration-s2 "KubeClientCertificateExpiration-S2的直接链接")

A client certificate used to authenticate to the apiserver is expiring in less than 7.0 days.

S2 警告 · 触发条件:

```
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### KubeClientCertificateExpiration-S1[​](#kubeclientcertificateexpiration-s1 "KubeClientCertificateExpiration-S1的直接链接")

A client certificate used to authenticate to the apiserver is expiring in less than 24.0 hours.

S1 紧急 · 触发条件:

```
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 86400
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### AggregatedAPIErrors[​](#aggregatedapierrors "AggregatedAPIErrors的直接链接")

An aggregated API {{ $labels.name }}/{{ $labels.namespace }} has reported errors. The number of errors have increased for it in the past five minutes. High values indicate that the availability of the service changes too often.

S2 警告 · 触发条件:

```
sum by(name, namespace)(increase(aggregator_unavailable_apiservice_count[5m])) > 2
```

处置步骤:

1. kubectl get apiservice 看哪个 APIService 处于 False 状态；
2. kubectl describe apiservice \<name> 看具体报错；
3. 后端服务不可用的检查对应 Deployment/Service 是否健康（常见是 metrics-server）；
4. 证书问题的核对 CA bundle 配置。

#### AggregatedAPIDown[​](#aggregatedapidown "AggregatedAPIDown的直接链接")

An aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.

S2 警告 · 持续 5 分钟 · 触发条件:

```
(1 - max by(name, namespace)(avg_over_time(aggregator_unavailable_apiservice[10m]))) * 100 < 85
```

处置步骤:

1. kubectl get apiservice 确认是哪个 APIService；
2. kubectl -n \<ns> get pod 检查其后端 Pod 是否健康；
3. 查看该 Pod 日志定位启动或运行错误；
4. 恢复后用 kubectl top node 之类命令验证功能已回来。

#### KubeAPIDown[​](#kubeapidown "KubeAPIDown的直接链接")

KubeAPI has disappeared from Prometheus target discovery.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
absent(up{job="apiserver"} == 1)
```

处置步骤:

1. 在控制面节点确认 kube-apiserver 进程/静态 Pod 状态与日志；
2. 多副本部署确认是否只挂了部分实例，负载均衡是否已把故障实例摘除；
3. 常见根因是 etcd 不可用、证书过期、资源耗尽；
4. 优先恢复 etcd 与证书，apiserver 本身通常会自动恢复。

#### KubeAPIErrorBudgetBurn-S1-120秒[​](#kubeapierrorbudgetburn-s1-120秒 "KubeAPIErrorBudgetBurn-S1-120秒的直接链接")

The API server is burning too much error budget.

S1 紧急 · 持续 2 分钟 · 触发条件:

```
sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)

and

sum(apiserver_request:burnrate5m) > (14.40 * 0.01000)
```

处置步骤:

1. 看 apiserver 的错误码与延迟分布，确认是读还是写请求在劣化；
2. 写请求劣化优先排查 etcd 的磁盘延迟——这是最常见根因；
3. 读请求劣化排查是否有客户端在做大范围 LIST（无 resourceVersion 的全量列举）；
4. 定位到异常客户端的对其限流，并考虑开启 APF（API Priority and Fairness）。

#### KubeAPIErrorBudgetBurn-S1-900秒[​](#kubeapierrorbudgetburn-s1-900秒 "KubeAPIErrorBudgetBurn-S1-900秒的直接链接")

The API server is burning too much error budget.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
sum(apiserver_request:burnrate6h) > (6.00 * 0.01000)

and

sum(apiserver_request:burnrate30m) > (6.00 * 0.01000)
```

处置步骤:

1. 看 apiserver 的错误码与延迟分布，确认是读还是写请求在劣化；
2. 写请求劣化优先排查 etcd 的磁盘延迟——这是最常见根因；
3. 读请求劣化排查是否有客户端在做大范围 LIST（无 resourceVersion 的全量列举）；
4. 定位到异常客户端的对其限流，并考虑开启 APF（API Priority and Fairness）。

#### KubeAPIErrorBudgetBurn-S2-3600秒[​](#kubeapierrorbudgetburn-s2-3600秒 "KubeAPIErrorBudgetBurn-S2-3600秒的直接链接")

The API server is burning too much error budget.

S2 警告 · 持续 60 分钟 · 触发条件:

```
sum(apiserver_request:burnrate1d) > (3.00 * 0.01000)

and

sum(apiserver_request:burnrate2h) > (3.00 * 0.01000)
```

处置步骤:

1. 看 apiserver 的错误码与延迟分布，确认是读还是写请求在劣化；
2. 写请求劣化优先排查 etcd 的磁盘延迟——这是最常见根因；
3. 读请求劣化排查是否有客户端在做大范围 LIST（无 resourceVersion 的全量列举）；
4. 定位到异常客户端的对其限流，并考虑开启 APF（API Priority and Fairness）。

#### KubeAPIErrorBudgetBurn-S2-10800秒[​](#kubeapierrorbudgetburn-s2-10800秒 "KubeAPIErrorBudgetBurn-S2-10800秒的直接链接")

The API server is burning too much error budget.

S2 警告 · 持续 180 分钟 · 触发条件:

```
sum(apiserver_request:burnrate3d) > (1.00 * 0.01000)

and

sum(apiserver_request:burnrate6h) > (1.00 * 0.01000)
```

处置步骤:

1. 看 apiserver 的错误码与延迟分布，确认是读还是写请求在劣化；
2. 写请求劣化优先排查 etcd 的磁盘延迟——这是最常见根因；
3. 读请求劣化排查是否有客户端在做大范围 LIST（无 resourceVersion 的全量列举）；
4. 定位到异常客户端的对其限流，并考虑开启 APF（API Priority and Fairness）。

#### Deployment副本异常[​](#deployment副本异常 "Deployment副本异常的直接链接")

Deployment {{ $labels.deployment }} in namespace {{ $labels.namespace }} has mismatched replicas.

S2 警告 · 持续 10 分钟 · 触发条件:

```
kube_deployment_spec_replicas{job="kube-state-metrics"} != kube_deployment_status_replicas_available{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe deploy \<name> -n \<ns> 看 Conditions 与 Events；
2. kubectl get pod -n \<ns> -l \<selector> 看未就绪 Pod 的状态与原因；
3. 常见为资源不足无法调度、镜像拉取失败、就绪探针不通过；
4. 按 Pod 的具体状态排查，资源不足的扩容节点或调低 requests。

#### StatefulSet副本异常[​](#statefulset副本异常 "StatefulSet副本异常的直接链接")

StatefulSet {{ $labels.statefulset }} in namespace {{ $labels.namespace }} has mismatched replicas.

S2 警告 · 持续 10 分钟 · 触发条件:

```
kube_statefulset_status_replicas_ready{job="kube-state-metrics"} != kube_statefulset_spec_replicas{job="kube-state-metrics"}
```

处置步骤:

1. kubectl get pod -n \<ns> -l \<selector> 按序号看是哪个副本卡住；
2. kubectl describe pod 排查该副本的 PVC 是否绑定成功——这是有状态服务最常见的卡点；
3. 存储问题排查 PV/StorageClass 与 CSI 驱动；
4. 应用自身问题看 kubectl logs，修复后 StatefulSet 会自动继续。

#### DaemonSet未就绪Pod[​](#daemonset未就绪pod "DaemonSet未就绪Pod的直接链接")

DaemonSet {{ $labels.daemonset }} in namespace {{ $labels.namespace }} has unready pods.

S2 警告 · 持续 10 分钟 · 触发条件:

```
kube_daemonset_status_number_ready{job="kube-state-metrics"} < kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe ds \<name> -n \<ns> 看 Events 与期望/实际数量；
2. 对比节点的污点与 DaemonSet 的容忍配置——污点不匹配是最常见原因；
3. 检查 nodeSelector/affinity 是否把节点排除在外；
4. 资源不足导致的调低 DaemonSet 的 requests 或释放节点资源。

#### HPA扩容失败[​](#hpa扩容失败 "HPA扩容失败的直接链接")

HPA {{ $labels.hpa }} in namespace {{ $labels.namespace }} has scale up failures.

S2 警告 · 持续 5 分钟 · 触发条件:

```
kube_hpa_status_failed_scale_up_total{job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl describe hpa \<name> -n \<ns> 看 Conditions 里的具体原因；
2. ScalingLimited 说明触及了 min/max 边界；FailedGetScale 说明目标工作负载有问题；
3. 指标获取失败的检查 metrics-server 或自定义指标适配器是否健康；
4. 资源不足导致新副本 Pending 的，扩容节点。

#### Pod处于Failed状态[​](#pod处于failed状态 "Pod处于Failed状态的直接链接")

Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has failed.

S2 警告 · 持续 5 分钟 · 触发条件:

```
kube_pod_status_phase{job="kube-state-metrics",phase="Failed"} == 1
```

处置步骤:

1. kubectl get pod \<pod> -n \<ns> -o wide 看 STATUS 与 READY，再 kubectl describe pod 看 Events；
2. Pending 多为资源不足或调度约束（节点亲和、污点、PVC 未绑定）；ImagePullBackOff 查镜像地址与拉取凭据；
3. Running 但未 Ready 的看就绪探针配置与 kubectl logs \<pod> 里的启动报错；
4. 确认副本数是否已不足以承载流量，不足的先扩容其他健康副本。

#### Job执行失败[​](#job执行失败-1 "Job执行失败的直接链接")

Job {{ $labels.job\_name }} in namespace {{ $labels.namespace }} has failed.

S2 警告 · 持续 5 分钟 · 触发条件:

```
kube_job_status_failed{job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl get job \<job> -n \<ns> 看失败次数，再 kubectl logs job/\<job> 看失败原因；
2. kubectl describe job 看 Events，确认是否因 backoffLimit 耗尽而放弃；
3. 修复根因后 kubectl delete job 再重新提交，或让 CronJob 下次调度重跑；
4. 确认该任务失败是否有下游影响（数据未产出、清理未执行），需要时手工补做。

#### CPUThrottlingHigh[​](#cputhrottlinghigh "CPUThrottlingHigh的直接链接")

{{ $value | humanizePercentage }} throttling of CPU in namespace {{ $labels.namespace }} for container {{ $labels.container }} in pod {{ $labels.pod }}.

S3 提醒 · 持续 15 分钟 · 触发条件:

```
sum(increase(container_cpu_cfs_throttled_periods_total{container!="", }[5m])) by (container, pod, namespace)

  /

sum(increase(container_cpu_cfs_periods_total{}[5m])) by (container, pod, namespace)

  > ( 25 / 100 )
```

处置步骤:

1. kubectl top pod \<pod> -n \<ns> --containers 对照 resources.limits.cpu；
2. 注意 Java 等运行时若未感知 cgroup limit 会开过多线程加剧限流，确认 JVM 版本与参数；
3. 调大 limits.cpu，或改用 HPA 水平扩容分摊；
4. limit 设置远高于 request 时容易被超卖挤占，评估是否把两者设置得更接近。

#### KubeAggregatedAPIDown[​](#kubeaggregatedapidown "KubeAggregatedAPIDown的直接链接")

Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.

S2 警告 · 持续 5 分钟 · 触发条件:

```
(1 - max by(name, namespace, cluster)(avg_over_time(aggregator_unavailable_apiservice{job="apiserver"}[10m]))) * 100 < 85
```

处置步骤:

1. kubectl get apiservice 确认是哪个 APIService；
2. kubectl -n \<ns> get pod 检查其后端 Pod 是否健康；
3. 查看该 Pod 日志定位启动或运行错误；
4. 恢复后用 kubectl top node 之类命令验证功能已回来。

#### KubeAggregatedAPIErrors[​](#kubeaggregatedapierrors "KubeAggregatedAPIErrors的直接链接")

Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has reported errors. It has appeared unavailable {{ $value | humanize }} times averaged over the past 10m.

S2 警告 · 触发条件:

```
sum by(name, namespace, cluster)(increase(aggregator_unavailable_apiservice_total{job="apiserver"}[10m])) > 4
```

处置步骤:

1. kubectl get apiservice 看哪个处于 False 状态；
2. kubectl describe apiservice \<name> 看具体报错；
3. 后端服务不可用的检查对应 Deployment/Service；
4. 证书问题的核对 CA bundle 配置。

#### KubeAPIDown[​](#kubeapidown-1 "KubeAPIDown的直接链接")

KubeAPI has disappeared from Prometheus target discovery.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
absent(up{job="apiserver"} == 1)
```

处置步骤:

1. 在控制面节点确认 kube-apiserver 进程/静态 Pod 状态与日志；
2. 多副本部署确认是否只挂了部分实例，负载均衡是否已把故障实例摘除；
3. 常见根因是 etcd 不可用、证书过期、资源耗尽；
4. 优先恢复 etcd 与证书，apiserver 本身通常会自动恢复。

#### KubeAPIErrorBudgetBurn[​](#kubeapierrorbudgetburn "KubeAPIErrorBudgetBurn的直接链接")

The API server is burning too much error budget.

S1 紧急 · 持续 2 分钟 · 触发条件:

```
sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)

and

sum(apiserver_request:burnrate5m) > (14.40 * 0.01000)
```

处置步骤:

1. 看 apiserver 的错误码与延迟分布，确认是读还是写请求在劣化；
2. 写请求劣化优先排查 etcd 的磁盘延迟——这是最常见根因；
3. 读请求劣化排查是否有客户端在做大范围 LIST（无 resourceVersion 的全量列举）；
4. 定位到异常客户端的对其限流，并考虑开启 APF（API Priority and Fairness）。

#### KubeAPITerminatedRequests[​](#kubeapiterminatedrequests "KubeAPITerminatedRequests的直接链接")

The kubernetes apiserver has terminated {{ $value | humanizePercentage }} of its incoming requests.

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m]))  / (  sum(rate(apiserver_request_total{job="apiserver"}[10m])) + sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m])) ) > 0.20
```

处置步骤:

1. 查看 apiserver 的 apiserver\_flowcontrol 相关指标，确认是哪个 flow schema 在被限流；
2. 定位发起大量请求的客户端（通常是某个 Operator 或脚本在做全量 LIST）；
3. 对该客户端限流或优化其请求模式；
4. 确需更高配额的调整 FlowSchema 与 PriorityLevelConfiguration。

#### KubeClientCertificateExpiration[​](#kubeclientcertificateexpiration "KubeClientCertificateExpiration的直接链接")

A client certificate used to authenticate to kubernetes apiserver is expiring in less than 7.0 days.

S2 警告 · 持续 5 分钟 · 触发条件:

```
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### KubeClientErrors[​](#kubeclienterrors "KubeClientErrors的直接链接")

Kubernetes API server client '{{ $labels.job }}/{{ $labels.instance }}' is experiencing {{ $value | humanizePercentage }} errors.'

S2 警告 · 持续 15 分钟 · 触发条件:

```
(sum(rate(rest_client_requests_total{job="apiserver",code=~"5.."}[5m])) by (cluster, instance, job, namespace)

  /

sum(rate(rest_client_requests_total{job="apiserver"}[5m])) by (cluster, instance, job, namespace))

> 0.01
```

处置步骤:

1. 从告警标签定位是哪个组件/实例在报错；
2. 看该组件日志中的具体错误码：401/403 是 RBAC 权限问题，429 是被限流，5xx 是 apiserver 侧问题；
3. 权限问题核对 ServiceAccount 的 Role/ClusterRoleBinding；
4. 限流问题确认该组件是否在做高频 LIST，优化为 Watch 或加 resourceVersion。

#### KubeContainerWaiting[​](#kubecontainerwaiting "KubeContainerWaiting的直接链接")

pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour.

S2 警告 · 持续 60 分钟 · 触发条件:

```
sum by (namespace, pod, container, cluster) (kube_pod_container_status_waiting_reason{job="kube-state-metrics"}) > 0
```

处置步骤:

1. kubectl describe pod \<pod> -n \<ns> 看 Waiting 的 Reason；
2. ImagePullBackOff 检查镜像名、tag 与拉取凭据（imagePullSecrets）；
3. CreateContainerConfigError 检查引用的 ConfigMap/Secret 是否存在；
4. CrashLoopBackOff 按崩溃循环路径处理，看 --previous 日志。

#### KubeControllerManagerDown[​](#kubecontrollermanagerdown "KubeControllerManagerDown的直接链接")

KubeControllerManager has disappeared from Prometheus target discovery.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
absent(up{job="kube-controller-manager"} == 1)
```

处置步骤:

1. 在控制面节点确认 kube-controller-manager 静态 Pod 或进程状态与日志；
2. 多副本部署确认 leader 选举是否正常切换；
3. 常见根因是 apiserver 不可用或证书过期；
4. 恢复后确认副本数异常的工作负载开始自动修复。

#### KubeCPUOvercommit[​](#kubecpuovercommit "KubeCPUOvercommit的直接链接")

Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure.

S2 警告 · 持续 10 分钟 · 触发条件:

```
sum(namespace_cpu:kube_pod_container_resource_requests:sum{job="kube-state-metrics",}) by (cluster) - (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0

and

(sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
```

处置步骤:

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
2. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
3. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
4. 冗余确实不足的扩容节点。

#### KubeCPUQuotaOvercommit[​](#kubecpuquotaovercommit "KubeCPUQuotaOvercommit的直接链接")

Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Namespaces.

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(cpu|requests.cpu)"})) by (cluster)

  /

sum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"}) by (cluster)

  > 1.5
```

处置步骤:

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
2. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
3. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
4. 冗余确实不足的扩容节点。

#### KubeDaemonSetMisScheduled[​](#kubedaemonsetmisscheduled "KubeDaemonSetMisScheduled的直接链接")

{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_daemonset_status_number_misscheduled{job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl get pod -n \<ns> -l \<selector> -o wide 看被误调度到哪些节点；
2. 检查 DaemonSet 的 nodeSelector/affinity 与节点标签是否匹配；
3. 通常是节点标签被改动或 DaemonSet 配置更新导致，修正后多余 Pod 会被自动清理；
4. 未自动清理的手工删除对应 Pod。

#### KubeDaemonSetNotScheduled[​](#kubedaemonsetnotscheduled "KubeDaemonSetNotScheduled的直接链接")

{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are not scheduled.

S2 警告 · 持续 10 分钟 · 触发条件:

```
kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  -

kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl describe ds \<name> -n \<ns> 看 Events 与期望/实际数量；
2. 对比节点的污点与 DaemonSet 的容忍配置——污点不匹配是最常见原因；
3. 检查 nodeSelector/affinity 是否把节点排除在外；
4. 资源不足导致的调低 DaemonSet 的 requests 或释放节点资源。

#### KubeDaemonSetRolloutStuck[​](#kubedaemonsetrolloutstuck "KubeDaemonSetRolloutStuck的直接链接")

DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} has not finished or progressed for at least 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(

  (

    kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  ) or (

    kube_daemonset_status_number_misscheduled{job="kube-state-metrics"}

      !=

    0

  ) or (

    kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  ) or (

    kube_daemonset_status_number_available{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  )

) and (

  changes(kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}[5m])

    ==

  0

)
```

处置步骤:

1. kubectl rollout status ds/\<name> -n \<ns> 看卡在哪些节点；
2. kubectl describe pod 排查新版本 Pod 为何未就绪；
3. 短期无法修复的用 kubectl rollout undo ds/\<name> 回滚；
4. 检查 updateStrategy 的 maxUnavailable 配置是否过于保守。

#### KubeDeploymentGenerationMismatch[​](#kubedeploymentgenerationmismatch "KubeDeploymentGenerationMismatch的直接链接")

Deployment generation for {{ $labels.namespace }}/{{ $labels.deployment }} does not match, this indicates that the Deployment has failed but has not been rolled back.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_deployment_status_observed_generation{job="kube-state-metrics"}

  !=

kube_deployment_metadata_generation{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe \<kind> \<name> -n \<ns> 对比 generation 与 observedGeneration；
2. 检查 kube-controller-manager 是否健康——控制器不工作是最常见原因；
3. 看 controller-manager 日志中与该对象相关的报错；
4. 确认 apiserver 与 etcd 正常，控制器恢复后 generation 会自动追平。

#### KubeDeploymentReplicasMismatch[​](#kubedeploymentreplicasmismatch "KubeDeploymentReplicasMismatch的直接链接")

Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(

  kube_deployment_spec_replicas{job="kube-state-metrics"}

    >

  kube_deployment_status_replicas_available{job="kube-state-metrics"}

) and (

  changes(kube_deployment_status_replicas_updated{job="kube-state-metrics"}[10m])

    ==

  0

)
```

处置步骤:

1. kubectl describe deploy \<name> -n \<ns> 看 Conditions 与 Events；
2. kubectl get pod -n \<ns> -l \<selector> 看未就绪 Pod 的状态与原因；
3. 常见为资源不足无法调度、镜像拉取失败、就绪探针不通过；
4. 按 Pod 的具体状态排查，资源不足的扩容节点或调低 requests。

#### KubeDeploymentRolloutStuck[​](#kubedeploymentrolloutstuck "KubeDeploymentRolloutStuck的直接链接")

Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_deployment_status_condition{condition="Progressing", status="false",job="kube-state-metrics"}

!= 0
```

处置步骤:

1. kubectl rollout status deploy/\<name> -n \<ns> 确认卡在第几个副本；
2. kubectl describe pod 看新版本 Pod 为何未就绪（镜像、探针、资源）；
3. 短期无法修复的用 kubectl rollout undo deploy/\<name> 回滚到上一版本；
4. 修复后重新发布，并检查 maxSurge/maxUnavailable 配置是否合理。

#### KubeHpaMaxedOut[​](#kubehpamaxedout "KubeHpaMaxedOut的直接链接")

HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }} has been running at max replicas for longer than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  ==

kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe hpa \<name> -n \<ns> 看当前指标值与目标值的差距；
2. 确认集群是否还有资源支撑更多副本（节点余量）；
3. 有余量的调大 maxReplicas；没余量的先扩容节点；
4. 同时评估单副本的处理能力是否偏低，优化应用比无限扩副本更有效。

#### KubeHpaReplicasMismatch[​](#kubehpareplicasmismatch "KubeHpaReplicasMismatch的直接链接")

HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }} has not matched the desired number of replicas for longer than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(kube_horizontalpodautoscaler_status_desired_replicas{job="kube-state-metrics"}

  !=

kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"})

  and

(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  >

kube_horizontalpodautoscaler_spec_min_replicas{job="kube-state-metrics"})

  and

(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  <

kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"})

  and

changes(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}[15m]) == 0
```

处置步骤:

1. kubectl describe hpa \<name> -n \<ns> 看 Conditions 里的具体原因；
2. ScalingLimited 说明触及了 min/max 边界；FailedGetScale 说明目标工作负载有问题；
3. 指标获取失败的检查 metrics-server 或自定义指标适配器是否健康；
4. 资源不足导致新副本 Pending 的，扩容节点。

#### KubeJobFailed[​](#kubejobfailed "KubeJobFailed的直接链接")

Job {{ $labels.namespace }}/{{ $labels.job\_name }} failed to complete. Removing failed job after investigation should clear this alert.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_job_failed{job="kube-state-metrics"}  > 0
```

处置步骤:

1. kubectl get job \<job> -n \<ns> 看失败次数，再 kubectl logs job/\<job> 看失败原因；
2. kubectl describe job 看 Events，确认是否因 backoffLimit 耗尽而放弃；
3. 修复根因后 kubectl delete job 再重新提交，或让 CronJob 下次调度重跑；
4. 确认该任务失败是否有下游影响（数据未产出、清理未执行），需要时手工补做。

#### KubeJobNotCompleted[​](#kubejobnotcompleted "KubeJobNotCompleted的直接链接")

Job {{ $labels.namespace }}/{{ $labels.job\_name }} is taking more than {{ "43200" | humanizeDuration }} to complete.

S2 警告 · 触发条件:

```
time() - max by(namespace, job_name, cluster) (kube_job_status_start_time{job="kube-state-metrics"}

  and

kube_job_status_active{job="kube-state-metrics"} > 0) > 43200
```

处置步骤:

1. kubectl get job \<job> -n \<ns> 看已运行时长与完成数；
2. kubectl logs job/\<job> 看是否卡在某一步；
3. 确认是任务本身耗时长还是卡死——卡死的 kubectl delete job 后修复再重跑；
4. 给 Job 设置合理的 activeDeadlineSeconds，避免无限期挂起。

#### KubeletClientCertificateExpiration[​](#kubeletclientcertificateexpiration "KubeletClientCertificateExpiration的直接链接")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 警告 · 触发条件:

```
kubelet_certificate_manager_client_ttl_seconds < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### KubeletClientCertificateRenewalErrors[​](#kubeletclientcertificaterenewalerrors "KubeletClientCertificateRenewalErrors的直接链接")

Kubelet on node {{ $labels.node }} has failed to renew its client certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0
```

处置步骤:

1. 看 kubelet 日志中 certificate rotation 相关报错；
2. 检查 CSR 是否处于 Pending 未审批：kubectl get csr，必要时手工 kubectl certificate approve；
3. 确认集群是否开启了 CSR 自动审批控制器（kube-controller-manager 的 --cluster-signing-cert-file 配置）；
4. 修复后确认新 CSR 能被自动审批并签发。

#### KubeletDown[​](#kubeletdown "KubeletDown的直接链接")

Kubelet has disappeared from Prometheus target discovery.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
absent(up{job="kubelet", metrics_path="/metrics"} == 1)
```

处置步骤:

1. 登录节点执行 systemctl status kubelet 确认进程状态；
2. journalctl -u kubelet -n 200 --no-pager 定位退出或报错原因；
3. 常见为证书过期、配置错误、容器运行时不可用；
4. 恢复后确认节点回到 Ready，并检查期间是否有 Pod 被误驱逐。

#### KubeletPlegDurationHigh[​](#kubeletplegdurationhigh "KubeletPlegDurationHigh的直接链接")

The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of {{ $value }} seconds on node {{ $labels.node }}.

S2 警告 · 持续 5 分钟 · 触发条件:

```
node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10
```

处置步骤:

1. 登录节点用 crictl ps 与 crictl info 确认容器运行时响应速度；
2. 检查节点上容器数量是否过多、磁盘 IO 是否打满——这两者是 PLEG 变慢的主因；
3. 容器运行时卡顿的可尝试重启 containerd（会短暂影响该节点）；
4. 持续存在的考虑降低该节点的 Pod 密度。

#### KubeletPodStartUpLatencyHigh[​](#kubeletpodstartuplatencyhigh "KubeletPodStartUpLatencyHigh的直接链接")

Kubelet Pod startup 99th percentile latency is {{ $value }} seconds on node {{ $labels.node }}.

S2 警告 · 持续 15 分钟 · 触发条件:

```
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le)) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

处置步骤:

1. kubectl describe pod \<pod> -n \<ns> 看 Events 的时间戳，定位卡在拉镜像、挂载卷还是初始化容器；
2. 拉镜像慢的检查镜像大小与仓库带宽，考虑预热镜像或用本地仓库；
3. 挂载卷慢的排查 PV/CSI 驱动状态；
4. 应用自身启动慢的优化启动逻辑，并把就绪探针的 initialDelaySeconds 调到合理值。

#### KubeletServerCertificateExpiration[​](#kubeletservercertificateexpiration "KubeletServerCertificateExpiration的直接链接")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 警告 · 触发条件:

```
kubelet_certificate_manager_server_ttl_seconds < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### KubeletServerCertificateRenewalErrors[​](#kubeletservercertificaterenewalerrors "KubeletServerCertificateRenewalErrors的直接链接")

Kubelet on node {{ $labels.node }} has failed to renew its server certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(kubelet_server_expiration_renew_errors[5m]) > 0
```

处置步骤:

1. 看 kubelet 日志中 certificate rotation 相关报错；
2. 检查 CSR 是否处于 Pending 未审批：kubectl get csr，必要时手工 kubectl certificate approve；
3. 确认集群是否开启了 CSR 自动审批控制器（kube-controller-manager 的 --cluster-signing-cert-file 配置）；
4. 修复后确认新 CSR 能被自动审批并签发。

#### KubeletTooManyPods[​](#kubelettoomanypods "KubeletTooManyPods的直接链接")

Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.

S3 提醒 · 持续 15 分钟 · 触发条件:

```
count by(cluster, node) (

  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})

)

/

max by(cluster, node) (

  kube_node_status_capacity{job="kube-state-metrics",resource="pods"} != 1

) > 0.95
```

处置步骤:

1. kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l 确认实际数量；
2. 对照 kubelet 的 maxPods 配置（默认 110）；
3. 用 kubectl drain 或调整调度策略把部分 Pod 迁到其他节点；
4. 确需更高密度的调大 maxPods，但要同步评估节点的 CPU/内存/PLEG 压力。

#### KubeMemoryOvercommit[​](#kubememoryovercommit "KubeMemoryOvercommit的直接链接")

Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure.

S2 警告 · 持续 10 分钟 · 触发条件:

```
sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

and

(sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
```

处置步骤:

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
2. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
3. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
4. 冗余确实不足的扩容节点。

#### KubeMemoryQuotaOvercommit[​](#kubememoryquotaovercommit "KubeMemoryQuotaOvercommit的直接链接")

Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Namespaces.

S2 警告 · 持续 5 分钟 · 触发条件:

```
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(memory|requests.memory)"})) by (cluster)

  /

sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)

  > 1.5
```

处置步骤:

1. kubectl describe node | grep -A5 'Allocated resources' 汇总各节点的分配率；
2. 这是容量规划信号而非即时故障——评估节点故障时是否还有冗余承接；
3. 检查是否有 Pod 的 requests 设置得过高（远超实际用量），下调可释放大量可调度容量；
4. 冗余确实不足的扩容节点。

#### KubeNodeNotReady[​](#kubenodenotready "KubeNodeNotReady的直接链接")

{{ $labels.node }} has been unready for more than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 与 Events，确认是 MemoryPressure、DiskPressure 还是 kubelet 失联；
2. 登录节点确认 kubelet 与容器运行时进程状态（systemctl status kubelet containerd）；
3. kubelet 日志用 journalctl -u kubelet -n 200 定位；
4. 节点短期无法恢复的执行 kubectl drain 让 Pod 尽快迁走，避免等待驱逐超时。

#### KubeNodeReadinessFlapping[​](#kubenodereadinessflapping "KubeNodeReadinessFlapping的直接链接")

The readiness status of node {{ $labels.node }} has changed {{ $value }} times in the last 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
sum(changes(kube_node_status_condition{job="kube-state-metrics",status="true",condition="Ready"}[15m])) by (cluster, node) > 2
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 的变更时间线；
2. 登录节点看 kubelet 日志，常见根因是资源压力、容器运行时卡顿、或到 apiserver 的网络不稳；
3. 抖动期间建议先 kubectl cordon 该节点，阻止新 Pod 调度上去；
4. 根因定位并修复后再 uncordon，不要在抖动中反复重启 kubelet。

#### KubeNodeUnreachable[​](#kubenodeunreachable "KubeNodeUnreachable的直接链接")

{{ $labels.node }} is unreachable and some workloads may be rescheduled.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1
```

处置步骤:

1. 先 ping / ssh 确认机器本身是否存活，机器宕机按宕机处理；
2. 机器存活则排查节点到 apiserver 的网络与证书（kubelet 日志里会有明确报错）；
3. 确认该节点上是否有单副本的关键服务，有的话优先在其他节点拉起；
4. 恢复后确认节点重新 Ready 且 Pod 状态正常。

#### KubePersistentVolumeErrors[​](#kubepersistentvolumeerrors "KubePersistentVolumeErrors的直接链接")

The persistent volume {{ $labels.persistentvolume }} has status {{ $labels.phase }}.

S1 紧急 · 持续 5 分钟 · 触发条件:

```
kube_persistentvolume_status_phase{phase=~"Failed|Pending",job="kube-state-metrics"} > 0
```

处置步骤:

1. kubectl describe pv \<pv> 与 kubectl describe pvc \<pvc> -n \<ns> 看 Events 里的具体报错；
2. 常见为存储后端不可用、容量不足、或 StorageClass 参数错误；
3. 检查 CSI 驱动 Pod 是否健康（通常在 kube-system 下）；
4. 后端存储故障的按存储系统自身流程处理，期间 Pod 会一直 Pending。

#### KubePersistentVolumeFillingUp[​](#kubepersistentvolumefillingup "KubePersistentVolumeFillingUp的直接链接")

The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free.

S1 紧急 · 持续 1 分钟 · 触发条件:

```
(

  kubelet_volume_stats_available_bytes{job="kubelet", metrics_path="/metrics"}

    /

  kubelet_volume_stats_capacity_bytes{job="kubelet", metrics_path="/metrics"}

) < 0.03

and

kubelet_volume_stats_used_bytes{job="kubelet", metrics_path="/metrics"} > 0

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

处置步骤:

1. kubectl get pvc -n \<ns> 定位对应的 PVC 与 PV；
2. 进到使用该卷的 Pod 里用 du 找出占用最大的目录（kubectl exec）；
3. 清理日志与临时数据；
4. StorageClass 支持在线扩容的直接 kubectl edit pvc 调大 spec.resources.requests.storage，不支持的需要迁移数据。

#### KubePersistentVolumeInodesFillingUp[​](#kubepersistentvolumeinodesfillingup "KubePersistentVolumeInodesFillingUp的直接链接")

The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} only has {{ $value | humanizePercentage }} free inodes.

S1 紧急 · 持续 1 分钟 · 触发条件:

```
(

  kubelet_volume_stats_inodes_free{job="kubelet", metrics_path="/metrics"}

    /

  kubelet_volume_stats_inodes{job="kubelet", metrics_path="/metrics"}

) < 0.03

and

kubelet_volume_stats_inodes_used{job="kubelet", metrics_path="/metrics"} > 0

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

处置步骤:

1. kubectl exec 进入使用该卷的 Pod，用 df -i 确认；
2. 逐层统计文件数找出小文件最多的目录；
3. 清理无用的小文件（缓存碎片、临时文件）；
4. 无法收敛的需要扩容或更换存储类型。

#### KubePodCrashLooping[​](#kubepodcrashlooping "KubePodCrashLooping的直接链接")

Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: "CrashLoopBackOff").

S2 警告 · 持续 15 分钟 · 触发条件:

```
max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics"}[5m]) >= 1
```

处置步骤:

1. kubectl logs \<pod> -n \<ns> --previous 看上一次退出前的日志，这是最关键的一步；
2. kubectl describe pod 看退出码与 Events：137 通常是 OOM 或被 kill，1/2 多为应用自身启动失败；
3. 配置或依赖问题（连不上数据库、ConfigMap/Secret 缺失）先修依赖再拉起；
4. OOM 的对照 resources.limits.memory 与实际用量调整，或修复应用内存泄漏。

#### KubePodNotReady[​](#kubepodnotready "KubePodNotReady的直接链接")

Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
sum by (namespace, pod, cluster) (

  max by(namespace, pod, cluster) (

    kube_pod_status_phase{job="kube-state-metrics", phase=~"Pending|Unknown|Failed"}

  ) * on(namespace, pod, cluster) group_left(owner_kind) topk by(namespace, pod, cluster) (

    1, max by(namespace, pod, owner_kind, cluster) (kube_pod_owner{owner_kind!="Job"})

  )

) > 0
```

处置步骤:

1. kubectl get pod \<pod> -n \<ns> -o wide 看 STATUS 与 READY，再 kubectl describe pod 看 Events；
2. Pending 多为资源不足或调度约束（节点亲和、污点、PVC 未绑定）；ImagePullBackOff 查镜像地址与拉取凭据；
3. Running 但未 Ready 的看就绪探针配置与 kubectl logs \<pod> 里的启动报错；
4. 确认副本数是否已不足以承载流量，不足的先扩容其他健康副本。

#### KubeQuotaAlmostFull[​](#kubequotaalmostfull "KubeQuotaAlmostFull的直接链接")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

S3 提醒 · 持续 15 分钟 · 触发条件:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  > 0.9 < 1
```

处置步骤:

1. kubectl describe quota -n \<ns> 看是哪一项（cpu/memory/pods/storage）触顶；
2. kubectl get pod -n \<ns> -o custom-columns 统计各工作负载的 requests 占用，找出大户；
3. 确认是否有已停止但未清理的资源仍占着配额；
4. 确需更多配额的联系集群管理员调整 ResourceQuota。

#### KubeQuotaExceeded[​](#kubequotaexceeded "KubeQuotaExceeded的直接链接")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  > 1
```

处置步骤:

1. kubectl describe quota -n \<ns> 看是哪一项（cpu/memory/pods/storage）触顶；
2. kubectl get pod -n \<ns> -o custom-columns 统计各工作负载的 requests 占用，找出大户；
3. 确认是否有已停止但未清理的资源仍占着配额；
4. 确需更多配额的联系集群管理员调整 ResourceQuota。

#### KubeQuotaFullyUsed[​](#kubequotafullyused "KubeQuotaFullyUsed的直接链接")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

S3 提醒 · 持续 15 分钟 · 触发条件:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  == 1
```

处置步骤:

1. kubectl describe quota -n \<ns> 看是哪一项（cpu/memory/pods/storage）触顶；
2. kubectl get pod -n \<ns> -o custom-columns 统计各工作负载的 requests 占用，找出大户；
3. 确认是否有已停止但未清理的资源仍占着配额；
4. 确需更多配额的联系集群管理员调整 ResourceQuota。

#### KubeSchedulerDown[​](#kubeschedulerdown "KubeSchedulerDown的直接链接")

KubeScheduler has disappeared from Prometheus target discovery.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
absent(up{job="kube-scheduler"} == 1)
```

处置步骤:

1. 在控制面节点确认 kube-scheduler 静态 Pod 或进程状态与日志；
2. 多副本部署的确认是否只是失去 leader，其他副本能否接管；
3. 常见根因是 apiserver 不可用或证书问题；
4. 恢复后确认 Pending 的 Pod 开始被调度。

#### KubeStatefulSetGenerationMismatch[​](#kubestatefulsetgenerationmismatch "KubeStatefulSetGenerationMismatch的直接链接")

StatefulSet generation for {{ $labels.namespace }}/{{ $labels.statefulset }} does not match, this indicates that the StatefulSet has failed but has not been rolled back.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_statefulset_status_observed_generation{job="kube-state-metrics"}

  !=

kube_statefulset_metadata_generation{job="kube-state-metrics"}
```

处置步骤:

1. kubectl describe \<kind> \<name> -n \<ns> 对比 generation 与 observedGeneration；
2. 检查 kube-controller-manager 是否健康——控制器不工作是最常见原因；
3. 看 controller-manager 日志中与该对象相关的报错；
4. 确认 apiserver 与 etcd 正常，控制器恢复后 generation 会自动追平。

#### KubeStatefulSetReplicasMismatch[​](#kubestatefulsetreplicasmismatch "KubeStatefulSetReplicasMismatch的直接链接")

StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(

  kube_statefulset_status_replicas_ready{job="kube-state-metrics"}

    !=

  kube_statefulset_status_replicas{job="kube-state-metrics"}

) and (

  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[10m])

    ==

  0

)
```

处置步骤:

1. kubectl get pod -n \<ns> -l \<selector> 按序号看是哪个副本卡住；
2. kubectl describe pod 排查该副本的 PVC 是否绑定成功——这是有状态服务最常见的卡点；
3. 存储问题排查 PV/StorageClass 与 CSI 驱动；
4. 应用自身问题看 kubectl logs，修复后 StatefulSet 会自动继续。

#### KubeStatefulSetUpdateNotRolledOut[​](#kubestatefulsetupdatenotrolledout "KubeStatefulSetUpdateNotRolledOut的直接链接")

StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} update has not been rolled out.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(

  max without (revision) (

    kube_statefulset_status_current_revision{job="kube-state-metrics"}

      unless

    kube_statefulset_status_update_revision{job="kube-state-metrics"}

  )

    *

  (

    kube_statefulset_replicas{job="kube-state-metrics"}

      !=

    kube_statefulset_status_replicas_updated{job="kube-state-metrics"}

  )

)  and (

  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[5m])

    ==

  0

)
```

处置步骤:

1. kubectl rollout status sts/\<name> -n \<ns> 看卡在第几个副本；
2. StatefulSet 按序更新，一个副本卡住会阻塞后续全部——重点看当前正在更新的那个；
3. kubectl describe pod 排查其未就绪原因（PVC、探针、镜像）；
4. 无法快速修复的用 kubectl rollout undo 回滚。

#### KubeVersionMismatch[​](#kubeversionmismatch "KubeVersionMismatch的直接链接")

There are {{ $value }} different semantic versions of Kubernetes components running.

S2 警告 · 持续 15 分钟 · 触发条件:

```
count by (cluster) (count by (git_version, cluster) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"},"git_version","$1","git_version","(v[0-9]*.[0-9]*).*"))) > 1
```

处置步骤:

1. kubectl get node -o wide 看各节点 kubelet 版本，kubectl version 看控制面版本；
2. 确认偏差是否在官方支持的版本偏斜范围内（kubelet 不得高于 apiserver，且落后不超过两个小版本）；
3. 通常是升级过程未完成，把落后的节点升级到位；
4. 升级前先确认工作负载对新版本 API 的兼容性。

#### Node状态异常[​](#node状态异常-1 "Node状态异常的直接链接")

{{ $labels.node }} has been unready for more than 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 与 Events，确认是 MemoryPressure、DiskPressure 还是 kubelet 失联；
2. 登录节点确认 kubelet 与容器运行时进程状态（systemctl status kubelet containerd）；
3. kubelet 日志用 journalctl -u kubelet -n 200 定位；
4. 节点短期无法恢复的执行 kubectl drain 让 Pod 尽快迁走，避免等待驱逐超时。

#### Node不可达[​](#node不可达 "Node不可达的直接链接")

{{ $labels.node }} is unreachable and some workloads may be rescheduled.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1
```

处置步骤:

1. 先 ping / ssh 确认机器本身是否存活，机器宕机按宕机处理；
2. 机器存活则排查节点到 apiserver 的网络与证书（kubelet 日志里会有明确报错）；
3. 确认该节点上是否有单副本的关键服务，有的话优先在其他节点拉起；
4. 恢复后确认节点重新 Ready 且 Pod 状态正常。

#### Node运行太多Pod[​](#node运行太多pod "Node运行太多Pod的直接链接")

Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.

S2 警告 · 持续 15 分钟 · 触发条件:

```
count by(node) (

  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})

)

/

max by(node) (

  kube_node_status_capacity_pods{job="kube-state-metrics"} != 1

) > 0.95
```

处置步骤:

1. kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l 确认实际数量；
2. 对照 kubelet 的 maxPods 配置（默认 110）；
3. 用 kubectl drain 或调整调度策略把部分 Pod 迁到其他节点；
4. 确需更高密度的调大 maxPods，但要同步评估节点的 CPU/内存/PLEG 压力。

#### Node状态抖动[​](#node状态抖动 "Node状态抖动的直接链接")

The readiness status of node {{ $labels.node }} has changed {{ $value }} times in the last 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
sum(changes(kube_node_status_condition{status="true",condition="Ready"}[15m])) by (node) > 2
```

处置步骤:

1. kubectl describe node \<node> 看 Conditions 的变更时间线；
2. 登录节点看 kubelet 日志，常见根因是资源压力、容器运行时卡顿、或到 apiserver 的网络不稳；
3. 抖动期间建议先 kubectl cordon 该节点，阻止新 Pod 调度上去；
4. 根因定位并修复后再 uncordon，不要在抖动中反复重启 kubelet。

#### PLEG耗时高[​](#pleg耗时高 "PLEG耗时高的直接链接")

The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of {{ $value }} seconds on node {{ $labels.node }}.

S2 警告 · 持续 5 分钟 · 触发条件:

```
node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10
```

处置步骤:

1. 登录节点用 crictl ps 与 crictl info 确认容器运行时响应速度；
2. 检查节点上容器数量是否过多、磁盘 IO 是否打满——这两者是 PLEG 变慢的主因；
3. 容器运行时卡顿的可尝试重启 containerd（会短暂影响该节点）；
4. 持续存在的考虑降低该节点的 Pod 密度。

#### Pod启动耗时高[​](#pod启动耗时高 "Pod��启动耗时高的直接链接")

Kubelet Pod startup 99th percentile latency is {{ $value }} seconds on node {{ $labels.node }}.

S2 警告 · 持续 15 分钟 · 触发条件:

```
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (instance, le)) * on(instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

处置步骤:

1. kubectl describe pod \<pod> -n \<ns> 看 Events 的时间戳，定位卡在拉镜像、挂载卷还是初始化容器；
2. 拉镜像慢的检查镜像大小与仓库带宽，考虑预热镜像或用本地仓库；
3. 挂载卷慢的排查 PV/CSI 驱动状态；
4. 应用自身启动慢的优化启动逻辑，并把就绪探针的 initialDelaySeconds 调到合理值。

#### 客户端证书过期-S2[​](#客户端证书过期-s2 "客户端证书过期-S2的直接链接")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 警告 · 触发条件:

```
kubelet_certificate_manager_client_ttl_seconds < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### 客户端证书过期-S1[​](#客户端证书过期-s1 "客户端证书过期-S1的直接链接")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S1 紧急 · 触发条件:

```
kubelet_certificate_manager_client_ttl_seconds < 86400
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### 服务端证书过期-S2[​](#服务端证书过期-s2 "服务端证书过期-S2的直接链接")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 警告 · 触发条件:

```
kubelet_certificate_manager_server_ttl_seconds < 604800
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### 服务端证书过期-S1[​](#服务端证书过期-s1 "服务端证书过期-S1的直接链接")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S1 紧急 · 触发条件:

```
kubelet_certificate_manager_server_ttl_seconds < 86400
```

处置步骤:

1. 用 kubeadm certs check-expiration（kubeadm 集群）或 openssl x509 -noout -dates 确认到期时间；
2. kubeadm 集群用 kubeadm certs renew all 续期后重启控制面组件；
3. kubelet 客户端证书通常自动轮换，未轮换的检查 rotateCertificates 配置与 CSR 审批是否正常；
4. 续期后务必验证组件已加载新证书（重启对应进程），并复查所有节点。

#### 客户端证书续签错误[​](#客户端证书续签错误 "客户端证书续签错误的直接链接")

Kubelet on node {{ $labels.node }} has failed to renew its client certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0
```

处置步骤:

1. 看 kubelet 日志中 certificate rotation 相关报错；
2. 检查 CSR 是否处于 Pending 未审批：kubectl get csr，必要时手工 kubectl certificate approve；
3. 确认集群是否开启了 CSR 自动审批控制器（kube-controller-manager 的 --cluster-signing-cert-file 配置）；
4. 修复后确认新 CSR 能被自动审批并签发。

#### 服务证书续签错误[​](#服务证书续签错误 "服务证书续签错误的直接链接")

Kubelet on node {{ $labels.node }} has failed to renew its server certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(kubelet_server_expiration_renew_errors[5m]) > 0
```

处置步骤:

1. 看 kubelet 日志中 certificate rotation 相关报错；
2. 检查 CSR 是否处于 Pending 未审批：kubectl get csr，必要时手工 kubectl certificate approve；
3. 确认集群是否开启了 CSR 自动审批控制器（kube-controller-manager 的 --cluster-signing-cert-file 配置）；
4. 修复后确认新 CSR 能被自动审批并签发。

#### kubelet故障[​](#kubelet故障 "kubelet故障的直接链接")

Kubelet has disappeared from Prometheus target discovery.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
absent(up{job="kubelet"} == 1)
```

处置步骤:

1. 登录节点执行 systemctl status kubelet 确认进程状态；
2. journalctl -u kubelet -n 200 --no-pager 定位退出或报错原因；
3. 常见为证书过期、配置错误、容器运行时不可用；
4. 恢复后确认节点回到 Ready，并检查期间是否有 Pod 被误驱逐。

#### ConfigReloaderSidecarErrors[​](#configreloadersidecarerrors "ConfigReloaderSidecarErrors的直接链接")

Errors encountered while the {{$labels.pod}} config-reloader sidecar attempts to sync config in {{$labels.namespace}} namespace. As a result, configuration for service running in {{$labels.pod}} may be stale and cannot be updated anymore.

S2 警告 · 持续 10 分钟 · 触发条件:

```
max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0
```

处置步骤:

1. kubectl logs \<pod> -c config-reloader -n \<ns> 看具体报错；
2. 常见为配置文件语法错误导致 reload 被拒绝；
3. 用 promtool check config / amtool check-config 校验配置；
4. 修正后确认 reload 成功，并在 Prometheus 的 /config 页核对配置已更新。

#### PrometheusOperatorListErrors[​](#prometheusoperatorlisterrors "PrometheusOperatorListErrors的直接链接")

Errors while performing List operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[10m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_total{job="prometheus-operator",namespace="monitoring"}[10m]))) > 0.4
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

#### PrometheusOperatorNodeLookupErrors[​](#prometheusoperatornodelookuperrors "PrometheusOperatorNodeLookupErrors的直接链接")

Errors while reconciling Prometheus in {{ $labels.namespace }} Namespace.

S2 警告 · 持续 10 分钟 · 触发条件:

```
rate(prometheus_operator_node_address_lookup_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]) > 0.1
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

#### PrometheusOperatorNotReady[​](#prometheusoperatornotready "PrometheusOperatorNotReady的直接链接")

Prometheus operator in {{ $labels.namespace }} namespace isn't ready to reconcile {{ $labels.controller }} resources.

S2 警告 · 持续 5 分钟 · 触发条件:

```
min by (cluster,controller,namespace) (max_over_time(prometheus_operator_ready{job="prometheus-operator",namespace="monitoring"}[5m]) == 0)
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

#### PrometheusOperatorReconcileErrors[​](#prometheusoperatorreconcileerrors "PrometheusOperatorReconcileErrors的直接链接")

{{ $value | humanizePercentage }} of reconciling operations failed for {{ $labels.controller }} controller in {{ $labels.namespace }} namespace.

S2 警告 · 持续 10 分钟 · 触发条件:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]))) / (sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.1
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

#### PrometheusOperatorRejectedResources[​](#prometheusoperatorrejectedresources "PrometheusOperatorRejectedResources的直接链接")

Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf "%0.0f" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources.

S2 警告 · 持续 5 分钟 · 触发条件:

```
min_over_time(prometheus_operator_managed_resources{state="rejected",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

#### PrometheusOperatorSyncFailed[​](#prometheusoperatorsyncfailed "PrometheusOperatorSyncFailed的直接链接")

Controller {{ $labels.controller }} in {{ $labels.namespace }} namespace fails to reconcile {{ $value }} objects.

S2 警告 · 持续 10 分钟 · 触发条件:

```
min_over_time(prometheus_operator_syncs{status="failed",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

#### PrometheusOperatorWatchErrors[​](#prometheusoperatorwatcherrors "PrometheusOperatorWatchErrors的直接链接")

Errors while performing watch operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[5m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.4
```

处置步骤:

1. kubectl logs -n \<ns> deploy/prometheus-operator 看具体报错；
2. 权限类报错核对 Operator 的 ClusterRole 是否覆盖了所需资源；
3. Reconcile/Sync 失败的检查对应的 CRD 对象是否配置有误（kubectl describe servicemonitor/prometheusrule）；
4. 被拒绝的资源用 kubectl describe 看拒绝原因，通常是字段校验不通过。

#### ConfigReloaderSidecarErrors[​](#configreloadersidecarerrors-1 "ConfigReloaderSidecarErrors的直接链接")

Errors encountered while the {{$labels.pod}} config-reloader sidecar attempts to sync config in {{$labels.namespace}} namespace. As a result, configuration for service running in {{$labels.pod}} may be stale and cannot be updated anymore.

S2 警告 · 持续 10 分钟 · 触发条件:

```
max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0
```

处置步骤:

1. kubectl logs \<pod> -c config-reloader -n \<ns> 看具体报错；
2. 常见为配置文件语法错误导致 reload 被拒绝；
3. 用 promtool check config / amtool check-config 校验配置；
4. 修正后确认 reload 成功，并在 Prometheus 的 /config 页核对配置已更新。

#### PrometheusBadConfig[​](#prometheusbadconfig "PrometheusBadConfig的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration.

S1 紧急 · 持续 10 分钟 · 触发条件:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

max_over_time(prometheus_config_last_reload_successful{job="prometheus-k8s",namespace="monitoring"}[5m]) == 0
```

处置步骤:

1. kubectl logs 或实例日志里找配置解析报错的具体行；
2. 用 promtool check config prometheus.yml 本地校验；
3. K8s 上通常由 Operator 生成配置，检查 ServiceMonitor/PrometheusRule 是否有非法字段；
4. 修正后确认 /-/reload 成功且 /config 页显示新配置。

#### PrometheusDuplicateTimestamps[​](#prometheusduplicatetimestamps "PrometheusDuplicateTimestamps的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with different values but duplicated timestamp.

S2 警告 · 持续 10 分钟 · 触发条件:

```
rate(prometheus_target_scrapes_sample_duplicate_timestamp_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被重复抓取的目标（同一实例出现在多个 job 下）；
2. 检查 ServiceMonitor/PodMonitor 的 selector 是否过于宽泛导致重叠；
3. 收敛 selector 让每个目标只被一个 job 抓取；
4. 修正后确认丢弃计数不再增长。

#### PrometheusErrorSendingAlertsToAnyAlertmanager[​](#prometheuserrorsendingalertstoanyalertmanager "PrometheusErrorSendingAlertsToAnyAlertmanager的直接链接")

{{ printf "%.1f" $value }}% minimum errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to any Alertmanager.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
min without (alertmanager) (

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

)

* 100

> 3
```

处置步骤:

1. 检查 Alertmanager 实例是否健康、网络是否连通；
2. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
3. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
4. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

#### PrometheusErrorSendingAlertsToSomeAlertmanagers[​](#prometheuserrorsendingalertstosomealertmanagers "PrometheusErrorSendingAlertsToSomeAlertmanagers的直接链接")

{{ printf "%.1f" $value }}% errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to Alertmanager {{$labels.alertmanager}}.

S2 警告 · 持续 15 分钟 · 触发条件:

```
(

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring"}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring"}[5m])

)

* 100

> 1
```

处置步骤:

1. 检查 Alertmanager 实例是否健康、网络是否连通；
2. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
3. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
4. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

#### PrometheusHighQueryLoad[​](#prometheushighqueryload "PrometheusHighQueryLoad的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} query API has less than 20% available capacity in its query engine for the last 15 minutes.

S2 警告 · 持续 15 分钟 · 触发条件:

```
avg_over_time(prometheus_engine_queries{job="prometheus-k8s",namespace="monitoring"}[5m]) / max_over_time(prometheus_engine_queries_concurrent_max{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0.8
```

处置步骤:

1. 在 /status 页看查询引擎的并发与队列指标；
2. 用 topk 类查询或 query log 找出最重的查询；
3. 常见根因是高基数标签与过大的时间范围——收窄范围、减少 group by 维度；
4. 优化后仍高的扩容 Prometheus 或做联邦/分片。

#### PrometheusLabelLimitHit[​](#prometheuslabellimithit "PrometheusLabelLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because some samples exceeded the configured label\_limit, label\_name\_length\_limit or label\_value\_length\_limit.

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(prometheus_target_scrape_pool_exceeded_label_limits_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被拒绝的目标与具体原因；
2. 到目标侧确认为何标签数异常多，通常是把高基数信息（用户ID、请求ID）打成了标签；
3. 在目标侧修正指标设计，或用 metric\_relabel\_configs 丢弃多余标签；
4. 确需更多标签的调大 label\_limit，但要先评估基数影响。

#### PrometheusMissingRuleEvaluations[​](#prometheusmissingruleevaluations "PrometheusMissingRuleEvaluations的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has missed {{ printf "%.0f" $value }} rule group evaluations in the last 5m.

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(prometheus_rule_group_iterations_missed_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 看日志中 rule evaluation 相关的超时报错；
2. 找出评估耗时最长的规则组，通常是包含重查询的记录规则；
3. 拆分规则组、拉长 evaluation\_interval，或优化规则里的查询；
4. 资源不足的扩容 Prometheus。

#### PrometheusNotConnectedToAlertmanagers[​](#prometheusnotconnectedtoalertmanagers "PrometheusNotConnectedToAlertmanagers的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers.

S2 警告 · 持续 10 分钟 · 触发条件:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

max_over_time(prometheus_notifications_alertmanagers_discovered{job="prometheus-k8s",namespace="monitoring"}[5m]) < 1
```

处置步骤:

1. 检查 Alertmanager 实例是否健康、网络是否连通；
2. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
3. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
4. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

#### PrometheusNotificationQueueRunningFull[​](#prometheusnotificationqueuerunningfull "PrometheusNotificationQueueRunningFull的直接链接")

Alert notification queue of Prometheus {{$labels.namespace}}/{{$labels.pod}} is running full.

S2 警告 · 持续 15 分钟 · 触发条件:

```
# Without min_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  predict_linear(prometheus_notifications_queue_length{job="prometheus-k8s",namespace="monitoring"}[5m], 60 * 30)

>

  min_over_time(prometheus_notifications_queue_capacity{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

处置步骤:

1. 检查 Alertmanager 实例是否健康、网络是否连通；
2. 在 Prometheus 的 /status 页确认 Alertmanager 发现是否正常；
3. 队列满的排查 Alertmanager 处理是否卡住，或告警量是否异常暴涨；
4. 恢复后确认 Alertmanager 已收到告警，避免静默失败。

#### PrometheusNotIngestingSamples[​](#prometheusnotingestingsamples "PrometheusNotIngestingSamples的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not ingesting samples.

S2 警告 · 持续 10 分钟 · 触发条件:

```
(

  rate(prometheus_tsdb_head_samples_appended_total{job="prometheus-k8s",namespace="monitoring"}[5m]) <= 0

and

  (

    sum without(scrape_job) (prometheus_target_metadata_cache_entries{job="prometheus-k8s",namespace="monitoring"}) > 0

  or

    sum without(rule_group) (prometheus_rule_group_rules{job="prometheus-k8s",namespace="monitoring"}) > 0

  )

)
```

处置步骤:

1. 在 /targets 页确认是否所有目标都 down；
2. 检查服务发现是否正常（/service-discovery 页）；
3. 配置错误导致目标为空的按配置问题处理；
4. 这是监控体系的完全失明，应最高优先级处理。

#### PrometheusOutOfOrderTimestamps[​](#prometheusoutofordertimestamps "PrometheusOutOfOrderTimestamps的直�接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with timestamps arriving out of order.

S2 警告 · 持续 10 分钟 · 触发条件:

```
rate(prometheus_target_scrapes_sample_out_of_order_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 确认是哪个目标在上报乱序数据；
2. 常见根因是目标机器时钟不同步，或指标由多个来源汇聚后时间戳错乱；
3. 先校准目标机器时钟（chronyc）；
4. Pushgateway 类场景确认推送端的时间戳处理逻辑。

#### PrometheusRemoteStorageFailures[​](#prometheusremotestoragefailures "PrometheusRemoteStorageFailures的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} failed to send {{ printf "%.1f" $value }}% of the samples to {{ $labels.remote\_name}}:{{ $labels.url }}

S1 紧急 · 持续 15 分钟 · 触发条件:

```
(

  (rate(prometheus_remote_storage_failed_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

/

  (

    (rate(prometheus_remote_storage_failed_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

  +

    (rate(prometheus_remote_storage_succeeded_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

  )

)

* 100

> 1
```

处置步骤:

1. 看 Prometheus 日志中 remote\_write 或 tsdb 相关报错；
2. 远程写入失败的确认远端存储可用性与鉴权配置，并看是否触发了限流；
3. 本地存储失败的检查磁盘空间与权限，TSDB 损坏时可能需要清理 WAL；
4. 确认队列积压是否在下降，持续积压需要调大 queue\_config 或降低写入量。

#### PrometheusRemoteWriteBehind[​](#prometheusremotewritebehind "PrometheusRemoteWriteBehind的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf "%.1f" $value }}s behind for {{ $labels.remote\_name}}:{{ $labels.url }}.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])

- ignoring(remote_name, url) group_right

  max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])

)

> 120
```

处置步骤:

1. 看 Prometheus 日志中 remote\_write 或 tsdb 相关报错；
2. 远程写入失败的确认远端存储可用性与鉴权配置，并看是否触发了限流；
3. 本地存储失败的检查磁盘空间与权限，TSDB 损坏时可能需要清理 WAL；
4. 确认队列积压是否在下降，持续积压需要调大 queue\_config 或降低写入量。

#### PrometheusRemoteWriteDesiredShards[​](#prometheusremotewritedesiredshards "PrometheusRemoteWriteDesiredShards的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote\_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value }}.

S2 警告 · 持续 15 分钟 · 触发条件:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])

>

  max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

处置步骤:

1. 看 Prometheus 日志中 remote\_write 或 tsdb 相关报错；
2. 远程写入失败的确认远端存储可用性与鉴权配置，并看是否触发了限流；
3. 本地存储失败的检查磁盘空间与权限，TSDB 损坏时可能需要清理 WAL；
4. 确认队列积压是否在下降，持续积压需要调大 queue\_config 或降低写入量。

#### PrometheusRuleFailures[​](#prometheusrulefailures "PrometheusRuleFailures的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf "%.0f" $value }} rules in the last 5m.

S1 紧急 · 持续 15 分钟 · 触发条件:

```
increase(prometheus_rule_evaluation_failures_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 看日志中失败规则的名称与错误；
2. 常见为规则里的查询语法错误、引用了不存在的指标、或返回数据量过大；
3. 用 promtool check rules 校验规则文件；
4. 修正后确认 /rules 页该规则状态为 ok。

#### PrometheusScrapeBodySizeLimitHit[​](#prometheusscrapebodysizelimithit "PrometheusScrapeBodySizeLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured body\_size\_limit.

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(prometheus_target_scrapes_exceeded_body_size_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被拒绝的目标；
2. 手工 curl 该目标的 /metrics 看实际大小，确认是否指标数量异常膨胀；
3. 常见根因是高基数指标，在目标侧治理或用 metric\_relabel\_configs 丢弃；
4. 确需更大限制的调大 body\_size\_limit。

#### PrometheusScrapeSampleLimitHit[​](#prometheusscrapesamplelimithit "PrometheusScrapeSampleLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured sample\_limit.

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(prometheus_target_scrapes_exceeded_sample_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页找出被拒绝的目标与样本数；
2. 手工 curl /metrics | wc -l 确认实际规模；
3. 高基数指标是主因，在目标侧减少标签维度，或用 metric\_relabel\_configs 丢弃不需要的指标；
4. 确需更大限制的调大 sample\_limit，但要评估存储与查询压力。

#### PrometheusSDRefreshFailure[​](#prometheussdrefreshfailure "PrometheusSDRefreshFailure的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to refresh SD with mechanism {{$labels.mechanism}}.

S2 警告 · 持续 20 分钟 · 触发条件:

```
increase(prometheus_sd_refresh_failures_total{job="prometheus-k8s",namespace="monitoring"}[10m]) > 0
```

处置步骤:

1. 看日志中服务发现相关的报错；
2. K8s SD 的检查 Prometheus 的 RBAC 权限是否覆盖所需资源；
3. 其他 SD（Consul/文件等）的检查后端可达性与凭据；
4. 修复后在 /service-discovery 页确认目标列表已更新。

#### PrometheusTargetLimitHit[​](#prometheustargetlimithit "PrometheusTargetLimitHit的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because the number of targets exceeded the configured target\_limit.

S2 警告 · 持续 15 分钟 · 触发条件:

```
increase(prometheus_target_scrape_pool_exceeded_target_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

处置步骤:

1. 在 /targets 页确认当前目标数与限制；
2. 检查 ServiceMonitor 的 selector 是否过于宽泛，抓取了不需要的目标；
3. 收敛 selector 或按业务拆分到多个 Prometheus 实例；
4. 确需更多目标的调大 target\_limit 并评估资源。

#### PrometheusTargetSyncFailure[​](#prometheustargetsyncfailure "PrometheusTargetSyncFailure的直接链接")

{{ printf "%.0f" $value }} targets in Prometheus {{$labels.namespace}}/{{$labels.pod}} have failed to sync because invalid configuration was supplied.

S1 紧急 · 持续 5 分钟 · 触发条件:

```
increase(prometheus_target_sync_failed_total{job="prometheus-k8s",namespace="monitoring"}[30m]) > 0
```

处置步骤:

1. 看日志中 target sync 的具体报错；
2. 常见为 relabel 配置错误导致目标地址非法；
3. 检查最近变更的 ServiceMonitor/PodMonitor 配置；
4. 修正后在 /targets 页确认目标恢复正常。

#### PrometheusTSDBCompactionsFailing[​](#prometheustsdbcompactionsfailing "PrometheusTSDBCompactionsFailing的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} compaction failures over the last 3h.

S2 警告 · 持续 240 分钟 · 触发条件:

```
increase(prometheus_tsdb_compactions_failed_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

处置步骤:

1. 看日志中 compaction 相关报错；
2. 最常见是磁盘空间不足——先确认剩余空间；
3. 数据块损坏的可能需要删除损坏的 block 目录（会丢失该段数据）；
4. 修复后确认后续 compaction 成功完成。

#### PrometheusTSDBReloadsFailing[​](#prometheustsdbreloadsfailing "PrometheusTSDBReloadsFailing的直接链接")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} reload failures over the last 3h.

S2 警告 · 持续 240 分钟 · 触发条件:

```
increase(prometheus_tsdb_reloads_failures_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

处置步骤:

1. 看日志中 reload 相关报错与涉及的 block；
2. 常见为数据块损坏或权限问题；
3. 权限问题修正数据目录属主；损坏的 block 只能删除（会丢失该段数据）；
4. 修复后重启 Prometheus 并确认数据可查。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 305 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                                                                                                                                                                                                                                                                                                                                                | 含义                                                                                                                                                                                                                           | 单位 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| `sum(rate(coredns_dns_requests_total{}[5m])) by (proto,instance)`                                                                                                                                                                                                                                                                                                   | coreDNS请求速率 — CoreDNS自身指标                                                                                                                                                                                              |      |
| `sum(rate(coredns_dns_requests_total{}[5m])) by (type,instance)`                                                                                                                                                                                                                                                                                                    | coreDNS请求速率(记录类型分组) — CoreDNS自身指标                                                                                                                                                                                |      |
| `sum(rate(coredns_dns_do_requests_total{}[5m])) by (instance)`                                                                                                                                                                                                                                                                                                      | coreDNS请求速率(DO标志位) — CoreDNS自身指标                                                                                                                                                                                    |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_request_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | coreDNS UDP请求数据包大小 P99 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_request_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | coreDNS UDP请求数据包大小 P90 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_request_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | coreDNS UDP请求数据包大小 P50 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_request_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | coreDNS TCP请求数据包大小 P99 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_request_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | coreDNS TCP请求数据包大小 P90 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_request_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | coreDNS TCP请求数据包大小 P50 — CoreDNS自身指标                                                                                                                                                                                |      |
| `sum(rate(coredns_dns_responses_total{}[5m])) by(rcode,instance)`                                                                                                                                                                                                                                                                                                   | coreDNS响应速率(根据响应状态码分组) — CoreDNS自身指标                                                                                                                                                                          |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_request_duration_seconds_bucket{}[5m])) by(le,job,instance))`                                                                                                                                                                                                                                                         | coreDNS响应时延 P99 — CoreDNS自身指标                                                                                                                                                                                          |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_request_duration_seconds_bucket{}[5m])) by(le,job,instance))`                                                                                                                                                                                                                                                         | coreDNS响应时延 P90 — CoreDNS自身指标                                                                                                                                                                                          |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_request_duration_seconds_bucket{}[5m])) by(le,job,instance))`                                                                                                                                                                                                                                                         | coreDNS响应时延 P50 — CoreDNS自身指标                                                                                                                                                                                          |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_response_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | coreDNS UDP响应数据包大小 P99 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_response_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | coreDNS UDP响应数据包大小 P90 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_response_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | coreDNS UDP响应数据包大小 P50 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_response_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | coreDNS TCP响应数据包大小 P99 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_response_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | coreDNS TCP响应数据包大小 P90 — CoreDNS自身指标                                                                                                                                                                                |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_response_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | coreDNS TCP响应数据包大小 P50 — CoreDNS自身指标                                                                                                                                                                                |      |
| `sum (coredns_cache_entries{}) by(type,instance)`                                                                                                                                                                                                                                                                                                                   | coreDNS缓存的DNS记录数 — CoreDNS自身指标                                                                                                                                                                                       |      |
| `sum (rate(coredns_cache_hits_total{}[5m])) by (type,instance)`                                                                                                                                                                                                                                                                                                     | coreDNS缓存命中率 — CoreDNS自身指标                                                                                                                                                                                            |      |
| `sum (rate(coredns_cache_misses_total{}[5m])) by (type,instance)`                                                                                                                                                                                                                                                                                                   | coreDNS缓存丢失率 — CoreDNS自身指标                                                                                                                                                                                            |      |
| `kube_cronjob_info`                                                                                                                                                                                                                                                                                                                                                 | 关于cronjob的信息 — kube-state-metrics 的cronjob指标                                                                                                                                                                           |      |
| `kube_cronjob_labels`                                                                                                                                                                                                                                                                                                                                               | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的cronjob指标                                                                                                                                                          |      |
| `kube_cronjob_created`                                                                                                                                                                                                                                                                                                                                              | Unix创建时间戳 — kube-state-metrics 的cronjob指标                                                                                                                                                                              |      |
| `kube_cronjob_next_schedule_time`                                                                                                                                                                                                                                                                                                                                   | 下次应该安排cronjob。在lastScheduleTime之后的时间，或者在cron作业的创建时间之后（如果从未计划过）。使用它来确定作业是否延迟 — kube-state-metrics 的cronjob指标                                                                 |      |
| `kube_cronjob_status_active`                                                                                                                                                                                                                                                                                                                                        | 活动保持指向当前正在运行的作业的指针 — kube-state-metrics 的cronjob指标                                                                                                                                                        |      |
| `kube_cronjob_status_last_schedule_time`                                                                                                                                                                                                                                                                                                                            | LastScheduleTime保留有关上一次成功调度作业的时间的信息 — kube-state-metrics 的cronjob指标                                                                                                                                      |      |
| `kube_cronjob_spec_suspend`                                                                                                                                                                                                                                                                                                                                         | 挂起标志告诉控制器挂起后续执行 — kube-state-metrics 的cronjob指标                                                                                                                                                              |      |
| `kube_cronjob_spec_starting_deadline_seconds`                                                                                                                                                                                                                                                                                                                       | 如果由于任何原因错过了计划时间，则开始工作的最后期限（以秒为单位） — kube-state-metrics 的cronjob指标                                                                                                                          |      |
| `apiserver_request_duration_seconds`                                                                                                                                                                                                                                                                                                                                | apiserver响应的时间分布，按照url 和 verb 分类 — apiserver服务自身指标 类型: histogram                                                                                                                                          |      |
| `apiserver_request_total`                                                                                                                                                                                                                                                                                                                                           | apiserver的请求总数，按照verb、 version、 group、resource、scope、component、 http返回码分类统计 — apiserver服务自身指标 类型: counter                                                                                         |      |
| `apiserver_current_inflight_requests`                                                                                                                                                                                                                                                                                                                               | 最大并发请求数, 按mutating(非get list watch的请求)和readOnly(get list watch)分别限制 — apiserver服务自身指标 类型: gauge                                                                                                       |      |
| `apiserver_response_sizes`                                                                                                                                                                                                                                                                                                                                          | apiserver 响应大小，单位byte, 按照verb、 version、 group、resource、scope、component分类统计 — apiserver服务自身指标 类型: histogram                                                                                           |      |
| `watch_cache_capacity`                                                                                                                                                                                                                                                                                                                                              | 按照资源类型统计的watch缓存大小 — apiserver服务自身指标 类型: gauge                                                                                                                                                            |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | 每秒钟用户态和系统态cpu消耗时间, 计算apiserver进程的cpu的使用率 — apiserver服务自身指标 类型: counter                                                                                                                          |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | apiserver的内存使用量(单位:Byte) — apiserver服务自身指标 类型: gauge                                                                                                                                                           |      |
| `workqueue_adds_total`                                                                                                                                                                                                                                                                                                                                              | apiserver中包含的controller的工作队列，已处理的任务总数 — apiserver服务自身指标 类型: counter                                                                                                                                  |      |
| `workqueue_depth`                                                                                                                                                                                                                                                                                                                                                   | apiserver中包含的controller的工作队列深度，表示当前队列中要处理的任务的数量，数值越小越好 — apiserver服务自身指标 类型: gauge                                                                                                  |      |
| `kube_configmap_info`                                                                                                                                                                                                                                                                                                                                               | 有关configmap的信息 — kube-state-metrics 的configmap指标                                                                                                                                                                       |      |
| `kube_configmap_created`                                                                                                                                                                                                                                                                                                                                            | Unix创建时间戳 — kube-state-metrics 的configmap指标                                                                                                                                                                            |      |
| `kube_configmap_metadata_resource_version`                                                                                                                                                                                                                                                                                                                          | 表示configmap特定版本的资源版本 — kube-state-metrics 的configmap指标                                                                                                                                                           |      |
| `container_cpu_cfs_periods_total`                                                                                                                                                                                                                                                                                                                                   | cfs时间片总数, 完全公平调度的时间片总数(分配到cpu的时间片数) — cAdvisor暴露的容器指标 类型: counter                                                                                                                            |      |
| `container_cpu_cfs_throttled_periods_total`                                                                                                                                                                                                                                                                                                                         | 容器被throttle的时间片总数 — cAdvisor暴露的容器指标 类型: counter                                                                                                                                                              |      |
| `container_cpu_cfs_throttled_seconds_total`                                                                                                                                                                                                                                                                                                                         | 容器被throttle的时间 — cAdvisor暴露的容器指标 类型: counter                                                                                                                                                                    |      |
| `container_file_descriptors`                                                                                                                                                                                                                                                                                                                                        | 容器打开的fd数 — cAdvisor暴露的容器指标 类型: gauge                                                                                                                                                                            |      |
| `container_memory_usage_bytes`                                                                                                                                                                                                                                                                                                                                      | 容器内存使用量，单位byte — cAdvisor暴露的容器指标 类型: gauge                                                                                                                                                                  |      |
| `container_network_receive_bytes_total`                                                                                                                                                                                                                                                                                                                             | 容器入方向的流量 — cAdvisor暴露的容器指标 类型: counter                                                                                                                                                                        |      |
| `container_network_transmit_bytes_total`                                                                                                                                                                                                                                                                                                                            | 容器出方向的流量 — cAdvisor暴露的容器指标 类型: counter                                                                                                                                                                        |      |
| `container_spec_cpu_period`                                                                                                                                                                                                                                                                                                                                         | 容器的cpu调度单位时间 — cAdvisor暴露的容器指标 类型: gauge                                                                                                                                                                     |      |
| `container_spec_cpu_quota`                                                                                                                                                                                                                                                                                                                                          | 容器的cpu规格 ，除以单位调度时间可以计算核数 — cAdvisor暴露的容器指标 类型: gauge                                                                                                                                              |      |
| `container_spec_memory_limit_bytes`                                                                                                                                                                                                                                                                                                                                 | 容器的内存规格，单位byte — cAdvisor暴露的容器指标 类型: gauge                                                                                                                                                                  |      |
| `container_threads`                                                                                                                                                                                                                                                                                                                                                 | 容器当前的线程数 — cAdvisor暴露的容器指标 类型: gauge                                                                                                                                                                          |      |
| `container_threads_max`                                                                                                                                                                                                                                                                                                                                             | 允许容器启动的最大线程数 — cAdvisor暴露的容器指标 类型: gauge                                                                                                                                                                  |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | 请求apiserver的耗时分布，按照url+verb统计 — controller-manager服务自身指标 类型: histogram                                                                                                                                     |      |
| `cronjob_controller_cronjob_job_creation_skew_duration_seconds`                                                                                                                                                                                                                                                                                                     | cronjob 创建到运行的时间分布 — controller-manager服务自身指标 类型: histogram                                                                                                                                                  |      |
| `leader_election_master_status`                                                                                                                                                                                                                                                                                                                                     | 控制器的选举状态，0表示backup， 1表示master — controller-manager服务自身指标 类型: gauge                                                                                                                                       |      |
| `node_collector_zone_health`                                                                                                                                                                                                                                                                                                                                        | 每个zone的健康node占比 — controller-manager服务自身指标 类型: gauge                                                                                                                                                            |      |
| `node_collector_zone_size`                                                                                                                                                                                                                                                                                                                                          | 每个zone的node数 — controller-manager服务自身指标 类型: gauge                                                                                                                                                                  |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | cpu使用量（也可以理解为cpu使用率） — controller-manager服务自身指标 类型: counter                                                                                                                                              |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | 控制器打开的fd数 — controller-manager服务自身指标 类型: gauge                                                                                                                                                                  |      |
| `pv_collector_bound_pv_count`                                                                                                                                                                                                                                                                                                                                       | 当前绑定的pv数量 — controller-manager服务自身指标 类型: gauge                                                                                                                                                                  |      |
| `pv_collector_unbound_pvc_count`                                                                                                                                                                                                                                                                                                                                    | 当前没有绑定的pvc数量 — controller-manager服务自身指标 类型: gauge                                                                                                                                                             |      |
| `pv_collector_bound_pvc_count`                                                                                                                                                                                                                                                                                                                                      | 当前绑定的pvc数量 — controller-manager服务自身指标 类型: gauge                                                                                                                                                                 |      |
| `pv_collector_total_pv_count`                                                                                                                                                                                                                                                                                                                                       | pv总数量 — controller-manager服务自身指标 类型: gauge                                                                                                                                                                          |      |
| `workqueue_adds_total`                                                                                                                                                                                                                                                                                                                                              | 各个controller已接受的任务总数 — controller-manager服务自身指标 类型: counter                                                                                                                                                  |      |
| `workqueue_depth`                                                                                                                                                                                                                                                                                                                                                   | 各个controller队列深度，表示一个controller中的任务的数量 — controller-manager服务自身指标 类型: gauge                                                                                                                          |      |
| `workqueue_queue_duration_seconds`                                                                                                                                                                                                                                                                                                                                  | 任务在队列中的等待耗时,按照控制器分别统计 — controller-manager服务自身指标 类型: histogram                                                                                                                                     |      |
| `workqueue_work_duration_seconds`                                                                                                                                                                                                                                                                                                                                   | 任务出队到被处理完成的时间，按照控制分别统计 — controller-manager服务自身指标 类型: histogram                                                                                                                                  |      |
| `workqueue_retries_total`                                                                                                                                                                                                                                                                                                                                           | 任务进入队列重试的次数 — controller-manager服务自身指标 类型: counter                                                                                                                                                          |      |
| `workqueue_longest_running_processor_seconds`                                                                                                                                                                                                                                                                                                                       | 正在处理的任务中，最长耗时任务的处理时间 — controller-manager服务自身指标 类型: gauge                                                                                                                                          |      |
| `endpoint_slice_controller_syncs`                                                                                                                                                                                                                                                                                                                                   | endpoint\_slice 同步的数量(1.20以上) — controller-manager服务自身指标 类型: counter                                                                                                                                            |      |
| `get_token_fail_count`                                                                                                                                                                                                                                                                                                                                              | 获取token失败的次数 — controller-manager服务自身指标 类型: counter                                                                                                                                                             |      |
| `go_memstats_gc_cpu_fraction`                                                                                                                                                                                                                                                                                                                                       | controller gc的cpu使用率 — controller-manager服务自身指标 类型: gauge                                                                                                                                                          |      |
| `kube_daemonset_created`                                                                                                                                                                                                                                                                                                                                            | Unix创建时间戳 — kube-state-metrics 的daemonset指标                                                                                                                                                                            |      |
| `kube_daemonset_status_current_number_scheduled`                                                                                                                                                                                                                                                                                                                    | 运行至少一个且应该运行的守护程序容器的节点数 — kube-state-metrics 的daemonset指标                                                                                                                                              |      |
| `kube_daemonset_status_desired_number_scheduled`                                                                                                                                                                                                                                                                                                                    | 应该运行守护程序容器的节点数 — kube-state-metrics 的daemonset指标                                                                                                                                                              |      |
| `kube_daemonset_status_number_available`                                                                                                                                                                                                                                                                                                                            | 应该运行守护程序容器并具有一个或多个守护程序容器正在运行并且可用的节点数 — kube-state-metrics 的daemonset指标                                                                                                                  |      |
| `kube_daemonset_status_number_misscheduled`                                                                                                                                                                                                                                                                                                                         | 运行守护程序容器但不应该运行的节点数 — kube-state-metrics 的daemonset指标                                                                                                                                                      |      |
| `kube_daemonset_status_number_ready`                                                                                                                                                                                                                                                                                                                                | 应该运行守护程序容器并已运行一个或多个守护程序容器并准备就绪的节点数 — kube-state-metrics 的daemonset指标                                                                                                                      |      |
| `kube_daemonset_status_number_unavailable`                                                                                                                                                                                                                                                                                                                          | 应该运行守护程序容器且没有任何守护程序容器正在运行并且可用的节点数 — kube-state-metrics 的daemonset指标                                                                                                                        |      |
| `kube_daemonset_updated_number_scheduled`                                                                                                                                                                                                                                                                                                                           | 正在运行更新的守护程序pod的节点总数 — kube-state-metrics 的daemonset指标                                                                                                                                                       |      |
| `kube_daemonset_metadata_generation`                                                                                                                                                                                                                                                                                                                                | 代表所需状态的特定生成的序列号 — kube-state-metrics 的daemonset指标                                                                                                                                                            |      |
| `kube_daemonset_labels`                                                                                                                                                                                                                                                                                                                                             | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的daemonset指标                                                                                                                                                        |      |
| `kube_deployment_status_replicas`                                                                                                                                                                                                                                                                                                                                   | 每个deployment的副本数 — kube-state-metrics 的deployment指标                                                                                                                                                                   |      |
| `kube_deployment_status_replicas_available`                                                                                                                                                                                                                                                                                                                         | 每个deployment的可用副本数 — kube-state-metrics 的deployment指标                                                                                                                                                               |      |
| `kube_deployment_status_replicas_unavailable`                                                                                                                                                                                                                                                                                                                       | 每个deployment中不可用副本的数量 — kube-state-metrics 的deployment指标                                                                                                                                                         |      |
| `kube_deployment_status_replicas_updated`                                                                                                                                                                                                                                                                                                                           | 每个deployment的更新副本数 — kube-state-metrics 的deployment指标                                                                                                                                                               |      |
| `kube_deployment_status_observed_generation`                                                                                                                                                                                                                                                                                                                        | deployment控制器观察到的生成 — kube-state-metrics 的deployment指标                                                                                                                                                             |      |
| `kube_deployment_status_condition`                                                                                                                                                                                                                                                                                                                                  | 部署的当前状态condition — kube-state-metrics 的deployment指标                                                                                                                                                                  |      |
| `kube_deployment_spec_replicas`                                                                                                                                                                                                                                                                                                                                     | deployment所需的Pod数 — kube-state-metrics 的deployment指标                                                                                                                                                                    |      |
| `kube_deployment_spec_paused`                                                                                                                                                                                                                                                                                                                                       | deployment是否暂停，并且deployment控制器不会处理 — kube-state-metrics 的deployment指标                                                                                                                                         |      |
| `kube_deployment_spec_strategy_rollingupdate_max_unavailable`                                                                                                                                                                                                                                                                                                       | 滚动更新deployment期间的最大不可用副本数 — kube-state-metrics 的deployment指标                                                                                                                                                 |      |
| `kube_deployment_spec_strategy_rollingupdate_max_surge`                                                                                                                                                                                                                                                                                                             | 滚动更新deployment期间的最大不可用副本数 — kube-state-metrics 的deployment指标                                                                                                                                                 |      |
| `kube_deployment_metadata_generation`                                                                                                                                                                                                                                                                                                                               | 代表期望状态的特定生成的序列号 — kube-state-metrics 的deployment指标                                                                                                                                                           |      |
| `kube_deployment_labels`                                                                                                                                                                                                                                                                                                                                            | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的deployment指标                                                                                                                                                       |      |
| `kube_deployment_created`                                                                                                                                                                                                                                                                                                                                           | Unix创建时间戳 — kube-state-metrics 的deployment指标                                                                                                                                                                           |      |
| `kube_endpoint_address_not_ready`                                                                                                                                                                                                                                                                                                                                   | endpoint中not ready的addresses数 — kube-state-metrics 的endpoint指标                                                                                                                                                           |      |
| `kube_endpoint_address_available`                                                                                                                                                                                                                                                                                                                                   | endpoint中可用的addresses数 — kube-state-metrics 的endpoint指标                                                                                                                                                                |      |
| `kube_endpoint_info`                                                                                                                                                                                                                                                                                                                                                | 有关endpoint的信息 — kube-state-metrics 的endpoint指标                                                                                                                                                                         |      |
| `kube_endpoint_labels`                                                                                                                                                                                                                                                                                                                                              | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的endpoint指标                                                                                                                                                         |      |
| `kube_endpoint_created`                                                                                                                                                                                                                                                                                                                                             | Unix创建时间戳 — kube-state-metrics 的endpoint指标                                                                                                                                                                             |      |
| `etcd_server_is_leader`                                                                                                                                                                                                                                                                                                                                             | etcd leader 表示 ，1 leader 0 learner — etcd 服务自身指标 类型: gauge                                                                                                                                                          |      |
| `etcd_server_health_success`                                                                                                                                                                                                                                                                                                                                        | etcd server 健康检查成功次数 — etcd 服务自身指标 类型: counter                                                                                                                                                                 |      |
| `etcd_server_health_failures`                                                                                                                                                                                                                                                                                                                                       | etcd server 健康检查失败次数 — etcd 服务自身指标 类型: counter                                                                                                                                                                 |      |
| `etcd_disk_defrag_inflight`                                                                                                                                                                                                                                                                                                                                         | 是否启动数据压缩，1表示压缩，0表示没有启动压缩 — etcd 服务自身指标 类型: gauge                                                                                                                                                 |      |
| `etcd_server_snapshot_apply_in_progress_total`                                                                                                                                                                                                                                                                                                                      | 是否再快照中，1 快照中，0 没有 — etcd 服务自身指标 类型: gauge                                                                                                                                                                 |      |
| `etcd_server_leader_changes_seen_total`                                                                                                                                                                                                                                                                                                                             | 集群leader切换的次数 — etcd 服务自身指标 类型: counter                                                                                                                                                                         |      |
| `grpc_server_handled_total`                                                                                                                                                                                                                                                                                                                                         | grpc 调用总数 — etcd 服务自身指标 类型: counter                                                                                                                                                                                |      |
| `etcd_disk_wal_fsync_duration_seconds`                                                                                                                                                                                                                                                                                                                              | etcd wal同步耗时 — etcd 服务自身指标 类型: histogram                                                                                                                                                                           |      |
| `etcd_server_proposals_failed_total`                                                                                                                                                                                                                                                                                                                                | etcd proposal（提议）失败总次数(proposal就是完成raft协议的一次请求） — etcd 服务自身指标 类型: counter                                                                                                                         |      |
| `etcd_server_proposals_pending`                                                                                                                                                                                                                                                                                                                                     | etcd proposal（提议）pending总次数（proposal就是完成raft协议的一次请求） — etcd 服务自身指标 类型: gauge                                                                                                                       |      |
| `etcd_server_read_indexes_failed_total`                                                                                                                                                                                                                                                                                                                             | 读取索引失败的次数统计(v3索引为所有key都建了索引，索引是为了加快range操作) — etcd 服务自身指标 类型: counter                                                                                                                   |      |
| `etcd_server_slow_read_indexes_total`                                                                                                                                                                                                                                                                                                                               | 读取到过期索引或者读取超时的次数 — etcd 服务自身指标 类型: counter                                                                                                                                                             |      |
| `etcd_server_quota_backend_bytes`                                                                                                                                                                                                                                                                                                                                   | 当前后端的存储quota（db大小的上限）通过参数quota-backend-bytes调整大小，默认2G，官方建议不超过8G — etcd 服务自身指标 类型: gauge                                                                                               |      |
| `etcd_mvcc_db_total_size_in_bytes`                                                                                                                                                                                                                                                                                                                                  | etcd 分配的db大小（使用量大小+空闲大小） — etcd 服务自身指标 类型: gauge                                                                                                                                                       |      |
| `etcd_mvcc_db_total_size_in_use_in_bytes`                                                                                                                                                                                                                                                                                                                           | etcd db的使用量大小 — etcd 服务自身指标 类型: gauge                                                                                                                                                                            |      |
| `etcd_mvcc_range_total`                                                                                                                                                                                                                                                                                                                                             | etcd执行range的数量 — etcd 服务自身指标 类型: counter                                                                                                                                                                          |      |
| `etcd_mvcc_put_total`                                                                                                                                                                                                                                                                                                                                               | etcd执行put的数量 — etcd 服务自身指标 类型: counter                                                                                                                                                                            |      |
| `etcd_mvcc_txn_total`                                                                                                                                                                                                                                                                                                                                               | etcd实例执行事务的数量 — etcd 服务自身指标 类型: counter                                                                                                                                                                       |      |
| `etcd_mvcc_delete_total`                                                                                                                                                                                                                                                                                                                                            | etcd实例执行delete操作的数量 — etcd 服务自身指标 类型: counter                                                                                                                                                                 |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | etcd cpu使用量 — etcd 服务自身指标 类型: counter                                                                                                                                                                               |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | etcd 内存使用量 — etcd 服务自身指标 类型: gauge                                                                                                                                                                                |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | etcd 打开的fd数目 — etcd 服务自身指标 类型: gauge                                                                                                                                                                              |      |
| `kube_job_info`                                                                                                                                                                                                                                                                                                                                                     | 有关job的信息 — kube-state-metrics 的job指标                                                                                                                                                                                   |      |
| `kube_job_labels`                                                                                                                                                                                                                                                                                                                                                   | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的job指标                                                                                                                                                              |      |
| `kube_job_owner`                                                                                                                                                                                                                                                                                                                                                    | 有关job所有者的信息 — kube-state-metrics 的job指标                                                                                                                                                                             |      |
| `kube_job_spec_parallelism`                                                                                                                                                                                                                                                                                                                                         | 在任何给定时间，job应运行的pod的最大期望数量 — kube-state-metrics 的job指标                                                                                                                                                    |      |
| `kube_job_spec_completions`                                                                                                                                                                                                                                                                                                                                         | 运行job所需的成功完成的Pod数量 — kube-state-metrics 的job指标                                                                                                                                                                  |      |
| `kube_job_spec_active_deadline_seconds`                                                                                                                                                                                                                                                                                                                             | 在系统尝试终止job之前，作业相对于startTime的活动持续时间（以秒为单位） — kube-state-metrics 的job指标                                                                                                                          |      |
| `kube_job_status_active`                                                                                                                                                                                                                                                                                                                                            | 正在运行的pod数 — kube-state-metrics 的job指标                                                                                                                                                                                 |      |
| `kube_job_status_succeeded`                                                                                                                                                                                                                                                                                                                                         | 成功reached Phase的pod数量 — kube-state-metrics 的job指标                                                                                                                                                                      |      |
| `kube_job_status_failed`                                                                                                                                                                                                                                                                                                                                            | Failed reached Phase的pod数量 — kube-state-metrics 的job指标                                                                                                                                                                   |      |
| `kube_job_status_start_time`                                                                                                                                                                                                                                                                                                                                        | StartTime表示作业Job Manager job的时间 — kube-state-metrics 的job指标                                                                                                                                                          |      |
| `kube_job_status_completion_time`                                                                                                                                                                                                                                                                                                                                   | CompletionTime表示job完成的时间 — kube-state-metrics 的job指标                                                                                                                                                                 |      |
| `kube_job_complete`                                                                                                                                                                                                                                                                                                                                                 | job已完成执行 — kube-state-metrics 的job指标                                                                                                                                                                                   |      |
| `kube_job_failed`                                                                                                                                                                                                                                                                                                                                                   | job执行失败 — kube-state-metrics 的job指标                                                                                                                                                                                     |      |
| `kube_job_created`                                                                                                                                                                                                                                                                                                                                                  | Unix创建时间戳 — kube-state-metrics 的job指标                                                                                                                                                                                  |      |
| `node_netstat_Tcp_CurrEstab * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                   | TCP当前连接数 — 节点指标 类型: \*                                                                                                                                                                                              |      |
| `node_filefd_allocated * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                        | 文件描述符使用数 — 节点指标 类型: \*                                                                                                                                                                                           |      |
| `node_filefd_maximum * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                          | 文件描述符最大限制 — 节点指标 类型: \*                                                                                                                                                                                         |      |
| `100 - (node_filesystem_files_free * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} / node_filesystem_files * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} * 100)`                                                                                                                        | 文件系统inode使用率 — 节点指标 类型: -                                                                                                                                                                                         |      |
| `100 - ((node_filesystem_avail_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} * 100) / node_filesystem_size_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                | 文件系统使用率 — 节点指标 类型: -                                                                                                                                                                                              |      |
| `sum(node_filesystem_device_error * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}) by (mountpoint)`                                                                                                                                                                                                                            | 文件系统错误数 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `rate(node_disk_io_now[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                   | 磁盘IO使用率 — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `rate(node_disk_writes_completed_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                   | 磁盘写入IOPS — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `rate(node_disk_written_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                      | 磁盘写入速率 — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `rate(node_disk_reads_completed_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                    | 磁盘读取IOPS — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `rate(node_disk_read_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                         | 磁盘读取速率 — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `rate(node_context_switches_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                        | 系统上下文切换率 — 节点指标 类型: \*                                                                                                                                                                                           |      |
| `rate(node_intr_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | 系统中断率 — 节点指标 类型: \*                                                                                                                                                                                                 |      |
| `sum(rate(node_network_transmit_drop_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                              | 网络发送丢包率 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `sum(rate(node_network_transmit_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                             | 网络发送带宽 — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `sum(rate(node_network_transmit_errs_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                              | 网络发送错误率 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `sum(rate(node_network_receive_drop_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                               | 网络接收丢包率 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `sum(rate(node_network_receive_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                              | 网络接收带宽 — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `sum(rate(node_network_receive_errs_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                               | 网络接收错误率 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `node_nf_conntrack_entries * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | 网络连接跟踪条目数 — 节点指标 类型: \*                                                                                                                                                                                         |      |
| `node_nf_conntrack_entries_limit * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                              | 网络连接跟踪限制 — 节点指标 类型: \*                                                                                                                                                                                           |      |
| `sum by (instance) (rate(node_cpu_seconds_total{mode!~"idle\|iowait\|steal"}[5m])) * on(instance) group_left(nodename) node_uname_info{nodename=~"$node_name"} *100`                                                                                                                                                                                                | 节点 CPU 使用率 — 节点指标 类型: by                                                                                                                                                                                            |      |
| `node_load15 * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                                  | 节点15分钟负载 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `node_load1 * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                                   | 节点1分钟负载 — 节点指标 类型: \*                                                                                                                                                                                              |      |
| `node_load5 * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                                   | 节点5分钟负载 — 节点指标 类型: \*                                                                                                                                                                                              |      |
| `node_memory_SwapTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} - node_memory_SwapFree_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                | 节点Swap使用量 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `node_memory_SwapTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                  | 节点Swap总量 — 节点指标 类型: \*                                                                                                                                                                                               |      |
| `sum(kube_pod_info * on(node) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                                                                        | 节点上运行的Pod数量 — 节点指标 类型: \*                                                                                                                                                                                        |      |
| `sum(node_memory_MemTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} - node_memory_MemAvailable_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}) / sum(node_memory_MemTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})` | 节点内存使用率 — 节点指标 类型: \*                                                                                                                                                                                             |      |
| `node_memory_MemAvailable_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                               | 节点内存详细信息 - 可用 — 节点指标 类型: \*                                                                                                                                                                                    |      |
| `node_memory_MemTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                   | 节点内存详细信息 - 总量 — 节点指标 类型: \*                                                                                                                                                                                    |      |
| `node_memory_MemFree_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | 节点内存详细信息 - 空闲 — 节点指标 类型: \*                                                                                                                                                                                    |      |
| `node_memory_Buffers_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | 节点内存详细信息 - 缓冲区 — 节点指标 类型: \*                                                                                                                                                                                  |      |
| `node_memory_Cached_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                     | 节点内存详细信息 - 缓存 — 节点指标 类型: \*                                                                                                                                                                                    |      |
| `sum(container_fs_inodes_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                            | Inode数量 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                              |      |
| `sum(container_tasks_state{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*", state="uninterruptible"}) by (name)`                                                                                                                                                                                                                                       | 不可中断任务数量 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                       |      |
| `(sum(container_memory_cache{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name))`                                                                                                                                                                                                                                                             | 容器cache使用 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                          |      |
| `(sum(container_spec_cpu_quota{namespace="$namespace", pod=~"$pod_name"}/container_spec_cpu_period{namespace="$namespace", pod=~"$pod_name"}) by (name))`                                                                                                                                                                                                           | 容器CPU Limit — Pod自身指标 类型: pod=\~"$pod\_name"}/container\_spec\_cpu\_period{namespace="$namespace",                                                                                                                     |      |
| `sum(container_cpu_load_average_10s{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                       | 容器CPU load 10 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                        |      |
| `sum(rate(container_cpu_usage_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)`                                                                                                                                                                                                                                       | 容器CPU使用率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                          |      |
| `sum(rate(container_cpu_usage_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)/((sum(container_spec_cpu_quota{namespace="$namespace", pod=~"$pod_name"}/container_spec_cpu_period{namespace="$namespace", pod=~"$pod_name"}) by (name)))`                                                                             | 容器CPU归一化后使用率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                  |      |
| `sum(container_fs_io_current{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                              | 容器I/O — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                                |      |
| `(sum(container_memory_rss{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name))`                                                                                                                                                                                                                                                               | 容器RSS内存使用 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                        |      |
| `sum(container_spec_memory_limit_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                    | 容器内存 Limit — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                         |      |
| `(sum(container_memory_usage_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name))`                                                                                                                                                                                                                                                       | 容器内存使用 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                           |      |
| `((sum(container_memory_usage_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)) /(sum(container_spec_memory_limit_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)))*100`                                                                                                                               | 容器内存使用率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                         |      |
| `sum(rate(container_cpu_system_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)`                                                                                                                                                                                                                                      | 容器内核态CPU使用率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                    |      |
| `sum(rate(container_cpu_cfs_throttled_periods_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m]))by(name) *100`                                                                                                                                                                                                                               | 容器发生CPU throttle的比率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                             |      |
| `sum(container_oom_events_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                           | 容器发生OOM次数 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                        |      |
| `sum((time()-container_start_time_seconds{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"})) by (name)`                                                                                                                                                                                                                                                | 容器启动时长（小时） — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                   |      |
| `sum(container_fs_usage_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                             | 容器已使用的文件系统大小 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                               |      |
| `sum(rate(container_cpu_user_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)`                                                                                                                                                                                                                                        | 容器用户态CPU使用率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                    |      |
| `sum(rate(container_fs_writes_bytes_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])) by(name)`                                                                                                                                                                                                                                             | 文件系统写入速率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                       |      |
| `sum(rate(container_fs_reads_bytes_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])) by(name)`                                                                                                                                                                                                                                              | 文件系统读取速率 — Pod自身指标 类型: pod=\~"$pod\_name",                                                                                                                                                                       |      |
| `sum(rate(container_network_transmit_packets_dropped_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                     | 网络发送丢包数 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                  |      |
| `sum(rate(container_network_transmit_packets_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                             | 网络发送数据包 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                  |      |
| `sum(rate(container_network_transmit_bytes_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                               | 网络发送速率 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                    |      |
| `sum(rate(container_network_transmit_errors_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                              | 网络发送错误数 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                  |      |
| `sum(rate(container_network_receive_packets_dropped_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                      | 网络接收丢包数 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                  |      |
| `sum(rate(container_network_receive_packets_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                              | 网络接收数据包数 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                |      |
| `sum(rate(container_network_receive_bytes_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                                | 网络接收速率 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                    |      |
| `sum(rate(container_network_receive_errors_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                               | 网络接收错误数 — Pod自身指标 类型: pod=\~"$pod\_name"}\[1m]))                                                                                                                                                                  |      |
| `go_gc_duration_seconds`                                                                                                                                                                                                                                                                                                                                            | gc时间 — kube-proxy 服务自身指标 类型: summary                                                                                                                                                                                 |      |
| `go_goroutines`                                                                                                                                                                                                                                                                                                                                                     | goroutine数量 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                                            |      |
| `go_threads`                                                                                                                                                                                                                                                                                                                                                        | 线程数量 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                                                 |      |
| `kubeproxy_network_programming_duration_seconds`                                                                                                                                                                                                                                                                                                                    | service或者pod发生变化到kube-proxy规则同步完成时间指标含义较复杂，参照<https://github.com/kubernetes/community/blob/master/sig-scalability/slos/network_programming_latency.md> — kube-proxy 服务自身指标 类型: histogram      |      |
| `kubeproxy_sync_proxy_rules_duration_seconds`                                                                                                                                                                                                                                                                                                                       | 规则同步耗时 — kube-proxy 服务自身指标 类型: histogram                                                                                                                                                                         |      |
| `kubeproxy_sync_proxy_rules_endpoint_changes_pending`                                                                                                                                                                                                                                                                                                               | endpoint 发生变化后规则同步pending的次数 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                 |      |
| `kubeproxy_sync_proxy_rules_endpoint_changes_total`                                                                                                                                                                                                                                                                                                                 | endpoint 发生变化后规则同步的总次数 — kube-proxy 服务自身指标 类型: counter                                                                                                                                                    |      |
| `kubeproxy_sync_proxy_rules_iptables_restore_failures_total`                                                                                                                                                                                                                                                                                                        | 本机上 iptables restore 失败的总次数 — kube-proxy 服务自身指标 类型: counter                                                                                                                                                   |      |
| `kubeproxy_sync_proxy_rules_last_queued_timestamp_seconds`                                                                                                                                                                                                                                                                                                          | 最近一次规则同步的请求时间戳，如果比下一个指标 kubeproxy\_sync\_proxy\_rules\_last\_timestamp\_seconds 大很多，那说明同步 hung 住了 — kube-proxy 服务自身指标 类型: gauge                                                      |      |
| `kubeproxy_sync_proxy_rules_last_timestamp_seconds`                                                                                                                                                                                                                                                                                                                 | 最近一次规则同步的完成时间戳 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                             |      |
| `kubeproxy_sync_proxy_rules_service_changes_pending`                                                                                                                                                                                                                                                                                                                | service变化引起的规则同步pending数量 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                     |      |
| `kubeproxy_sync_proxy_rules_service_changes_total`                                                                                                                                                                                                                                                                                                                  | service变化引起的规则同步总数 — kube-proxy 服务自身指标 类型: counter                                                                                                                                                          |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | 利用这个指标统计cpu使用率 — kube-proxy 服务自身指标 类型: counter                                                                                                                                                              |      |
| `process_max_fds`                                                                                                                                                                                                                                                                                                                                                   | 进程可以打开的最大fd数 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                                   |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | 进程当前打开的fd数 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                                       |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | 统计内存使用大小 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                                         |      |
| `process_start_time_seconds`                                                                                                                                                                                                                                                                                                                                        | 进程启动时间戳 — kube-proxy 服务自身指标 类型: gauge                                                                                                                                                                           |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | 请求 apiserver 的耗时(按照url和verb统计) — kube-proxy 服务自身指标 类型: histogram                                                                                                                                             |      |
| `rest_client_requests_total`                                                                                                                                                                                                                                                                                                                                        | 请求 apiserver 的总数(按照code method host统计) — kube-proxy 服务自身指标 类型: counter                                                                                                                                        |      |
| `go_gc_duration_seconds`                                                                                                                                                                                                                                                                                                                                            | gc的时间统计(summary指标) — kubelet 服务自身指标 类型: summary                                                                                                                                                                 |      |
| `go_goroutines`                                                                                                                                                                                                                                                                                                                                                     | goroutine 数量 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                              |      |
| `go_threads`                                                                                                                                                                                                                                                                                                                                                        | 线程数量 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                                    |      |
| `kubelet_cgroup_manager_duration_seconds`                                                                                                                                                                                                                                                                                                                           | 操作cgroup的时长分布，按照操作类型统计 — kubelet 服务自身指标 类型: histogram                                                                                                                                                  |      |
| `kubelet_containers_per_pod_count`                                                                                                                                                                                                                                                                                                                                  | pod中container数量的统计(spec.containers的数量) — kubelet 服务自身指标 类型: histogram                                                                                                                                         |      |
| `kubelet_docker_operations_duration_seconds`                                                                                                                                                                                                                                                                                                                        | 操作docker的时长分布，按照操作类型统计 — kubelet 服务自身指标 类型: histogram                                                                                                                                                  |      |
| `kubelet_docker_operations_errors_total`                                                                                                                                                                                                                                                                                                                            | 操作docker的错误累计次数，按照操作类型统计 — kubelet 服务自身指标 类型: counter                                                                                                                                                |      |
| `kubelet_docker_operations_timeout_total`                                                                                                                                                                                                                                                                                                                           | 操作docker的超时统计，按照操作类型统计 — kubelet 服务自身指标 类型: counter                                                                                                                                                    |      |
| `kubelet_docker_operations_total`                                                                                                                                                                                                                                                                                                                                   | 操作docker的累计次数，按照操作类型统计 — kubelet 服务自身指标 类型: counter                                                                                                                                                    |      |
| `kubelet_eviction_stats_age_seconds`                                                                                                                                                                                                                                                                                                                                | 驱逐操作的时间分布，按照驱逐信号(原因)分类统计 — kubelet 服务自身指标 类型: histogram                                                                                                                                          |      |
| `kubelet_evictions`                                                                                                                                                                                                                                                                                                                                                 | 驱逐次数统计，按照驱逐信号(原因)统计 — kubelet 服务自身指标 类型: counter                                                                                                                                                      |      |
| `kubelet_http_inflight_requests`                                                                                                                                                                                                                                                                                                                                    | 请求kubelet的inflight请求数,按照method path server\_type统计, 注意与每秒的request数区别开 — kubelet 服务自身指标 类型: gauge                                                                                                   |      |
| `kubelet_http_requests_duration_seconds`                                                                                                                                                                                                                                                                                                                            | 请求kubelet的请求时间统计, 按照method path server\_type统计 — kubelet 服务自身指标 类型: histogram                                                                                                                             |      |
| `kubelet_http_requests_total`                                                                                                                                                                                                                                                                                                                                       | 请求kubelet的请求数统计,按照method path server\_type统计 — kubelet 服务自身指标 类型: counter                                                                                                                                  |      |
| `kubelet_managed_ephemeral_containers`                                                                                                                                                                                                                                                                                                                              | 当前kubelet管理的临时容器数量 — kubelet 服务自身指标 类型: gauge                                                                                                                                                               |      |
| `kubelet_network_plugin_operations_duration_seconds`                                                                                                                                                                                                                                                                                                                | 网络插件的操作耗时分布 ，按照操作类型(operation\_type)统计, 如果 --feature-gates=EphemeralContainers=false, 否则一直为0 — kubelet 服务自身指标 类型: histogram                                                                 |      |
| `kubelet_network_plugin_operations_errors_total`                                                                                                                                                                                                                                                                                                                    | 网络插件累计操作错误数统计，按照操作类型(operation\_type)统计 — kubelet 服务自身指标 类型: counter                                                                                                                             |      |
| `kubelet_network_plugin_operations_total`                                                                                                                                                                                                                                                                                                                           | 网络插件累计操作数统计，按照操作类型(operation\_type)统计 — kubelet 服务自身指标 类型: counter                                                                                                                                 |      |
| `kubelet_node_name`                                                                                                                                                                                                                                                                                                                                                 | node name — kubelet 服务自身指标 类型: gauge                                                                                                                                                                                   |      |
| `kubelet_pleg_discard_events`                                                                                                                                                                                                                                                                                                                                       | PLEG(pod lifecycle event generator) 丢弃的event数统计 — kubelet 服务自身指标 类型: counter                                                                                                                                     |      |
| `kubelet_pleg_last_seen_seconds`                                                                                                                                                                                                                                                                                                                                    | PLEG上次活跃的时间戳 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                        |      |
| `kubelet_pleg_relist_duration_seconds`                                                                                                                                                                                                                                                                                                                              | PLEG relist pod时间分布 — kubelet 服务自身指标 类型: histogram                                                                                                                                                                 |      |
| `kubelet_pleg_relist_interval_seconds`                                                                                                                                                                                                                                                                                                                              | PLEG relist 间隔时间分布 — kubelet 服务自身指标 类型: histogram                                                                                                                                                                |      |
| `kubelet_pod_start_duration_seconds`                                                                                                                                                                                                                                                                                                                                | pod启动时间(从pending到running)分布, kubelet watch到pod时到pod中contianer都running后, watch各种source channel的pod变更 — kubelet 服务自身指标 类型: histogram                                                                  |      |
| `kubelet_pod_worker_duration_seconds`                                                                                                                                                                                                                                                                                                                               | pod状态变化的时间分布， 按照操作类型(create update sync)统计, worker就是kubelet中处理一个pod的逻辑工作单位 — kubelet 服务自身指标 类型: histogram                                                                              |      |
| `kubelet_pod_worker_start_duration_seconds`                                                                                                                                                                                                                                                                                                                         | kubelet watch到pod到worker启动的时间分布 — kubelet 服务自身指标 类型: histogram                                                                                                                                                |      |
| `kubelet_run_podsandbox_duration_seconds`                                                                                                                                                                                                                                                                                                                           | 启动sandbox的时间分布 — kubelet 服务自身指标 类型: histogram                                                                                                                                                                   |      |
| `kubelet_run_podsandbox_errors_total`                                                                                                                                                                                                                                                                                                                               | 启动sanbox出现error的总数 — kubelet 服务自身指标 类型: counter                                                                                                                                                                 |      |
| `kubelet_running_containers`                                                                                                                                                                                                                                                                                                                                        | 当前containers运行状态的统计, 按照container状态统计，created running exited — kubelet 服务自身指标 类型: gauge                                                                                                                 |      |
| `kubelet_running_pods`                                                                                                                                                                                                                                                                                                                                              | 当前处于running状态pod数量 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                  |      |
| `kubelet_runtime_operations_duration_seconds`                                                                                                                                                                                                                                                                                                                       | 容器运行时的操作耗时(container在create list exec remove stop等的耗时) — kubelet 服务自身指标 类型: histogram                                                                                                                   |      |
| `kubelet_runtime_operations_errors_total`                                                                                                                                                                                                                                                                                                                           | 容器运行时的操作错误数统计(按操作类型统计) — kubelet 服务自身指标 类型: counter                                                                                                                                                |      |
| `kubelet_runtime_operations_total`                                                                                                                                                                                                                                                                                                                                  | 容器运行时的操作总数统计(按操作类型统计) — kubelet 服务自身指标 类型: counter                                                                                                                                                  |      |
| `kubelet_started_containers_errors_total`                                                                                                                                                                                                                                                                                                                           | kubelet启动容器错误总数统计(按code和container\_type统计) — kubelet 服务自身指标 类型: counter                                                                                                                                  |      |
| `kubelet_started_containers_total`                                                                                                                                                                                                                                                                                                                                  | kubelet启动容器总数 — kubelet 服务自身指标 类型: counter                                                                                                                                                                       |      |
| `kubelet_started_pods_errors_total`                                                                                                                                                                                                                                                                                                                                 | kubelet启动pod遇到的错误总数(只有创建sandbox遇到错误才会统计) — kubelet 服务自身指标 类型: counter                                                                                                                             |      |
| `kubelet_started_pods_total`                                                                                                                                                                                                                                                                                                                                        | kubelet启动的pod总数 — kubelet 服务自身指标 类型: counter                                                                                                                                                                      |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | 统计cpu使用率 — kubelet 服务自身指标 类型: counter                                                                                                                                                                             |      |
| `process_max_fds`                                                                                                                                                                                                                                                                                                                                                   | 允许进程打开的最大fd数 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                      |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | 当前打开的fd数量 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                            |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | 进程驻留内存大小 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                            |      |
| `process_start_time_seconds`                                                                                                                                                                                                                                                                                                                                        | 进程启动时间 — kubelet 服务自身指标 类型: gauge                                                                                                                                                                                |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | 请求apiserver的耗时统计(按照url和请求类型统计verb) — kubelet 服务自身指标 类型: histogram                                                                                                                                      |      |
| `rest_client_requests_total`                                                                                                                                                                                                                                                                                                                                        | 请求apiserver的总次数(按照返回码code和请求类型method统计) — kubelet 服务自身指标 类型: counter                                                                                                                                 |      |
| `storage_operation_duration_seconds`                                                                                                                                                                                                                                                                                                                                | 存储操作耗时(按照存储plugin(configmap emptydir hostpath 等 )和operation\_name分类统计) — kubelet 服务自身指标 类型: histogram                                                                                                  |      |
| `volume_manager_total_volumes`                                                                                                                                                                                                                                                                                                                                      | 本机挂载的volume数量统计(按照plugin\_name和state统计plugin\_name包括"host-path" "empty-dir" "configmap" "projected")state(desired\_state\_of\_world期状态/actual\_state\_of\_world实际状态) — kubelet 服务自身指标 类型: gauge |      |
| `kube_namespace_created`                                                                                                                                                                                                                                                                                                                                            | Unix创建时间戳 — kube-state-metrics 的namespace指标                                                                                                                                                                            |      |
| `kube_namespace_labels`                                                                                                                                                                                                                                                                                                                                             | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的namespace指标                                                                                                                                                        |      |
| `kube_namespace_status_condition`                                                                                                                                                                                                                                                                                                                                   | 命名空间的状态 — kube-state-metrics 的namespace指标                                                                                                                                                                            |      |
| `kube_namespace_status_phase`                                                                                                                                                                                                                                                                                                                                       | kubernetes命名空间状态阶段 — kube-state-metrics 的namespace指标                                                                                                                                                                |      |
| `kube_node_info`                                                                                                                                                                                                                                                                                                                                                    | 有关群集节点的信息 — kube-state-metrics 的node指标                                                                                                                                                                             |      |
| `kube_node_labels`                                                                                                                                                                                                                                                                                                                                                  | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的node指标                                                                                                                                                             |      |
| `kube_node_role`                                                                                                                                                                                                                                                                                                                                                    | 集群节点的角色 — kube-state-metrics 的node指标                                                                                                                                                                                 |      |
| `kube_node_spec_unschedulable`                                                                                                                                                                                                                                                                                                                                      | 节点是否可以调度新的Pod — kube-state-metrics 的node指标                                                                                                                                                                        |      |
| `kube_node_spec_taint`                                                                                                                                                                                                                                                                                                                                              | 群集节点的污点 — kube-state-metrics 的node指标                                                                                                                                                                                 |      |
| `kube_node_status_capacity`                                                                                                                                                                                                                                                                                                                                         | 节点不同资源的容量 — kube-state-metrics 的node指标                                                                                                                                                                             |      |
| `kube_node_status_allocatable`                                                                                                                                                                                                                                                                                                                                      | 可用于调度的节点的不同资源的可分配资源 — kube-state-metrics 的node指标                                                                                                                                                         |      |
| `kube_node_status_condition`                                                                                                                                                                                                                                                                                                                                        | 群集节点的状况 — kube-state-metrics 的node指标                                                                                                                                                                                 |      |
| `kube_node_created`                                                                                                                                                                                                                                                                                                                                                 | Unix创建时间戳 — kube-state-metrics 的node指标                                                                                                                                                                                 |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | 请求apiserver的延迟分布 — scheduler 服务自身指标 类型: histogram                                                                                                                                                               |      |
| `rest_client_requests_total`                                                                                                                                                                                                                                                                                                                                        | 请求apiserver的总数 ,按照host code method 统计 — scheduler 服务自身指标 类型: counter                                                                                                                                          |      |
| `leader_election_master_status`                                                                                                                                                                                                                                                                                                                                     | 调度器的选举状态，0表示backup， 1表示master — scheduler 服务自身指标 类型: gauge                                                                                                                                               |      |
| `scheduler_queue_incoming_pods_total`                                                                                                                                                                                                                                                                                                                               | 进入调度队列的pod数 — scheduler 服务自身指标 类型: counter                                                                                                                                                                     |      |
| `scheduler_preemption_attempts_total`                                                                                                                                                                                                                                                                                                                               | 调度器驱逐容器的次数 — scheduler 服务自身指标 类型: counter                                                                                                                                                                    |      |
| `scheduler_scheduler_cache_size`                                                                                                                                                                                                                                                                                                                                    | 调度器cache中node pod和绑定pod的数目 — scheduler 服务自身指标 类型: gauge                                                                                                                                                      |      |
| `scheduler_pending_pods`                                                                                                                                                                                                                                                                                                                                            | 调度pending的pod数量，按照queue type分别统计 — scheduler 服务自身指标 类型: gauge                                                                                                                                              |      |
| `scheduler_plugin_execution_duration_seconds`                                                                                                                                                                                                                                                                                                                       | 调度插件在每个扩展点的执行时间，按照extension\_point+plugin+status 分别统计 — scheduler 服务自身指标 类型: histogram                                                                                                           |      |
| `scheduler_e2e_scheduling_duration_seconds`                                                                                                                                                                                                                                                                                                                         | 调度延迟分布，1.23.0 以后会被scheduling\_attempt\_duration\_seconds替代 — scheduler 服务自身指标 类型: histogram                                                                                                               |      |
| `scheduler_framework_extension_point_duration_seconds`                                                                                                                                                                                                                                                                                                              | 调度框架的扩展点延迟分布,按extension\_point(扩展点Bind Filter Permit PreBind/PostBind PreFilter/PostFilter Reseve)+profile（调度器）+ status(调度成功) 统计 — scheduler 服务自身指标 类型: histogram                           |      |
| `scheduler_pod_scheduling_attempts`                                                                                                                                                                                                                                                                                                                                 | pod调度成功前，调度重试的次数分布 — scheduler 服务自身指标 类型: histogram                                                                                                                                                     |      |
| `scheduler_schedule_attempts_total`                                                                                                                                                                                                                                                                                                                                 | 按照调度结果统计的调度重试次数。 "unschedulable" 表示无法调度，"error"表示调度器内部错误 — scheduler 服务自身指标 类型: counter                                                                                                |      |
| `scheduler_scheduler_goroutines`                                                                                                                                                                                                                                                                                                                                    | 按照功能(binding filter之类)统计的goroutine数量 — scheduler 服务自身指标 类型: gauge                                                                                                                                           |      |
| `scheduler_scheduling_algorithm_duration_seconds`                                                                                                                                                                                                                                                                                                                   | 调度算法的耗时分布 — scheduler 服务自身指标 类型: histogram                                                                                                                                                                    |      |
| `scheduler_scheduling_attempt_duration_seconds`                                                                                                                                                                                                                                                                                                                     | 调度算法+binding的耗时分布 — scheduler 服务自身指标 类型: histogram                                                                                                                                                            |      |
| `scheduler_scheduler_goroutines`                                                                                                                                                                                                                                                                                                                                    | 调度器的goroutines数目 — scheduler 服务自身指标 类型: gauge                                                                                                                                                                    |      |
| `kube_statefulset_status_replicas`                                                                                                                                                                                                                                                                                                                                  | 每个StatefulSet的副本数 — kube-state-metrics 的statefulset指标                                                                                                                                                                 |      |
| `kube_statefulset_status_replicas_current`                                                                                                                                                                                                                                                                                                                          | 每个StatefulSet的当前副本数 — kube-state-metrics 的statefulset指标                                                                                                                                                             |      |
| `kube_statefulset_status_replicas_ready`                                                                                                                                                                                                                                                                                                                            | 每个StatefulSet的就绪副本数 — kube-state-metrics 的statefulset指标                                                                                                                                                             |      |
| `kube_statefulset_status_replicas_updated`                                                                                                                                                                                                                                                                                                                          | 每个StatefulSet的更新副本数 — kube-state-metrics 的statefulset指标                                                                                                                                                             |      |
| `kube_statefulset_status_observed_generation`                                                                                                                                                                                                                                                                                                                       | StatefulSet控制器观察到的生成 — kube-state-metrics 的statefulset指标                                                                                                                                                           |      |
| `kube_statefulset_replicas`                                                                                                                                                                                                                                                                                                                                         | StatefulSet所需的pod数 — kube-state-metrics 的statefulset指标                                                                                                                                                                  |      |
| `kube_statefulset_metadata_generation`                                                                                                                                                                                                                                                                                                                              | 表示StatefulSet所需状态的特定生成的序列号 — kube-state-metrics 的statefulset指标                                                                                                                                               |      |
| `kube_statefulset_created`                                                                                                                                                                                                                                                                                                                                          | Unix创建时间戳 — kube-state-metrics 的statefulset指标                                                                                                                                                                          |      |
| `kube_statefulset_labels`                                                                                                                                                                                                                                                                                                                                           | Kubernetes标签转换为Prometheus标签 — kube-state-metrics 的statefulset指标                                                                                                                                                      |      |
| `kube_statefulset_status_current_revision`                                                                                                                                                                                                                                                                                                                          | 指示用于按顺序\[0，currentReplicas）生成Pod的StatefulSet的版本 — kube-state-metrics 的statefulset指标                                                                                                                          |      |
| `kube_statefulset_status_update_revision`                                                                                                                                                                                                                                                                                                                           | 指示用于按顺序\[replicas-updatedReplicas，replicas]生成Pod的StatefulSet的版本 — kube-state-metrics 的statefulset指标                                                                                                           |      |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Kubernetes 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
