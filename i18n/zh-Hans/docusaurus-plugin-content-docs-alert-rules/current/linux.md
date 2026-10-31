---
title: "Linux 告警规则：76 条 PromQL 规则与处置步骤"
sidebar_label: "Linux"
sidebar_position: 3
description: "76 条开箱可用的 Linux 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 node_exporter, Categraf, Telegraf。可下载为 Prometheus 规则文件，或导入夜莺。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes
toc_max_heading_level: 2
mdx:
  format: md
---

Linux 服务器与 Kubernetes 节点的主机级告警规则：内存耗尽与内存压力、磁盘和 inode 将满（含「24 小时内将写满」的预测）、磁盘延迟、网络错误、丢包与带宽打满、CPU 负载与被宿主机抢占、OOM Kill、conntrack 表与文件句柄耗尽、时钟偏移、系统服务崩溃、进程消失，以及 PING、端口、HTTP 探测失败。node_exporter 一组用的是标准 `node_*` 指标名；Categraf 和 Telegraf 两组针对用这两种 agent 采集的主机，覆盖同样的问题。

## 概览

- **76 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
- **指标来源**：node_exporter, Categraf, Telegraf
- **下载**：[`linux.yml`](pathname:///alert-rules/linux.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
- 阈值只是起点，启用前请按自己的环境调整。

## 规则一览

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| 主机内存不足 | 警告 | 2 分钟 |
| 主机内存有压力 | 警告 | 2 分钟 |
| 主机入口网络吞吐量异常 | 警告 | 5 分钟 |
| 主机出口网络吞吐量异常 | 警告 | 5 分钟 |
| 主机磁盘读取速率异常 | 警告 | 5 分钟 |
| 主机磁盘写入速率异常 | 警告 | 2 分钟 |
| 主机磁盘空间不足 | 警告 | 2 分钟 |
| 主机磁盘将在 24 小时内填满 | 警告 | 2 分钟 |
| 文件系统inode使用率高 | 警告 | 2 分钟 |
| 文件系统inode将在24小时内填满 | 警告 | 2 分钟 |
| 主机磁盘读取延迟异常 | 警告 | 2 分钟 |
| 主机磁盘写入延迟异常 | 警告 | 2 分钟 |
| 节点cpu负载高 | 警告 | — |
| 有其他云主机窃取cpu | 警告 | — |
| 主机上下文切换异常 | 警告 | — |
| 主机交换内存快满了 | 警告 | 2 分钟 |
| 主机系统服务崩溃 | 警告 | — |
| 主机内核版本偏差 | 警告 | 360 分钟 |
| 检测到 HostOomKill | 警告 | — |
| 主机网络接收错误 | 警告 | 2 分钟 |
| 主机网络出口错误 | 警告 | 2 分钟 |
| 主机网络接口饱和 | 警告 | 1 分钟 |
| conntrack数量接近极限 | 警告 | 5 分钟 |
| 主机时钟偏差 | 警告 | 2 分钟 |
| 主机时钟不同步 | 警告 | 2 分钟 |
| 节点文件系统空间填满-S2 | 警告 | 60 分钟 |
| 节点文件系统空间填满-S1 | 紧急 | 60 分钟 |
| 节点磁盘快满了-S2-space-5 | 警告 | 60 分钟 |
| 节点磁盘快满了-S1-space-3 | 紧急 | 60 分钟 |
| 节点磁盘快满了-S2-inodes-40 | 警告 | 60 分钟 |
| 节点磁盘快满了-S1-inodes-20 | 紧急 | 60 分钟 |
| 节点磁盘快满了-S2-inodes-5 | 警告 | 60 分钟 |
| 节点磁盘快满了-S1-inodes-3 | 紧急 | 60 分钟 |
| 使用的节点Conntrack条目数量高 | 警告 | — |
| 节点文本文件收集器抓取错误 | 警告 | — |
| 节点网络接口抖动 | 警告 | 2 分钟 |
| A certain disk is unable to read/write normally | 紧急 | 1 分钟 |
| Disk needs to be cleaned - utilization has reached 92% - node exporter | 紧急 | 1 分钟 |
| Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter | 警告 | 1 分钟 |
| Insufficient file handles - usage exceeds 90% - node exporter | 警告 | 1 分钟 |
| Insufficient inode resources - usage exceeds 90% - node exporter | 警告 | 1 分钟 |
| Insufficient memory resources - utilization is greater than 75% - node exporter | 警告 | 1 分钟 |
| Insufficient memory resources - utilization is greater than 95% - node exporter | 紧急 | 1 分钟 |
| Packet loss in the inbound direction of the network card - node exporter | 警告 | 1 分钟 |
| Packet loss in the outbound direction of the network card - node exporter | 警告 | 1 分钟 |
| System conntrack needs to be adjusted - usage exceeds 80% - node exporter | 警告 | 1 分钟 |
| System experiences OOM - node exporter | 警告 | 1 分钟 |
| Too many running processes - exceeding 3000 - node exporter | 警告 | 1 分钟 |
| Conntrack表的使用率超过80% | 警告 | 1 分钟 |
| CPU利用率较高 | 提醒 | 1 分钟 |
| HTTP地址探测失败 | 警告 | 1 分钟 |
| IO比较繁忙 | 警告 | 1 分钟 |
| NTP时间偏移太大 | 警告 | 1 分钟 |
| PING地址探测失败 | 警告 | 1 分钟 |
| TME_WAIT状态的连接超过2万，可能需要关注 | 警告 | 1 分钟 |
| 内存利用率比较高 | 提醒 | 1 分钟 |
| 文件句柄使用率超过90% | 警告 | 1 分钟 |
| 每个CPU Core的平均负载任务超过3 | 警告 | 1 分钟 |
| 硬盘监控 - inode使用率超过90% | 警告 | 1 分钟 |
| 硬盘监控 - 大于200G的盘，空间不足了 | 提醒 | 1 分钟 |
| 硬盘监控 - 小于200G的盘，空间不足了 | 提醒 | 1 分钟 |
| 硬盘监控 - 设备有报错 | 警告 | 1 分钟 |
| 硬盘监控 - 预测硬盘会在未来4小时内写满 | 紧急 | 1 分钟 |
| 系统有OOM产生 | 警告 | — |
| 网卡监控 - 入方向有丢包 | 提醒 | 1 分钟 |
| 网卡监控 - 入方向有错包 | 提醒 | 1 分钟 |
| 网卡监控 - 出方向有丢包 | 提醒 | 1 分钟 |
| 网卡监控 - 出方向有错包 | 提醒 | 1 分钟 |
| 网络地址探活失败 | 警告 | 1 分钟 |
| 进程监控-有进程数为0，某进程可能挂了 | 紧急 | 1 分钟 |
| 进程监控-进程句柄限制过小 | 提醒 | 1 分钟 |
| 进程监控-进程总量超过600 | 警告 | 1 分钟 |
| Machine load - high CPU, please pay attention - telegraf | 提醒 | 1 分钟 |
| Machine load - high memory, please pay attention - telegraf | 警告 | 1 分钟 |
| Process monitoring - lookup failure - telegraf | 紧急 | 1 分钟 |
| there are processes with 0 count, a certain process may have crashed - telegraf | 紧急 | 1 分钟 |

## node_exporter（48）

### 主机内存不足

节点内存不足 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10
```

处置步骤:

1. 登录节点用 free -h 确认 available 与 swap；
1. ps aux --sort=-%mem | head 找出占用最高的进程；
1. K8s 节点上优先用 kubectl top pod -A --sort-by=memory 定位是哪个 Pod；
1. 泄漏的在应用侧定位，容量不足的迁走部分 Pod 或扩容节点。

### 主机内存有压力

节点内存压力大 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
rate(node_vmstat_pgmajfault[1m]) > 1000
```

处置步骤:

1. 用 vmstat 1 看 si/so 列确认是否已在 swap；
1. 用 sar -B 或 /proc/vmstat 看 pgmajfault 的增长；
1. 定位占用最高的进程或 Pod 并评估是否可迁走；
1. 确认 swap 配置——K8s 节点通常应关闭 swap，开启会掩盖内存问题。

### 主机入口网络吞吐量异常

主机异常网络吞吐量 入 (instance \{\{ $labels.instance \}\})

警告 · 5 分钟 · 触发条件:

```promql
sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100
```

处置步骤:

1. 用 iftop 或 nethogs 定位占用带宽最高的进程/连接；
1. K8s 节点上确认是否有 Pod 在做大量数据传输（备份、数据同步、镜像拉取）；
1. 确认是否已跑满网卡带宽，是则限流或错峰；
1. 异常流量的排查是否有配置错误导致的流量环路。

### 主机出口网络吞吐量异常

主机异常网络吞吐量 出 (instance \{\{ $labels.instance \}\})

警告 · 5 分钟 · 触发条件:

```promql
sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100
```

处置步骤:

1. 用 iftop 或 nethogs 定位占用带宽最高的进程/连接；
1. K8s 节点上确认是否有 Pod 在做大量数据传输（备份、数据同步、镜像拉取）；
1. 确认是否已跑满网卡带宽，是则限流或错峰；
1. 异常流量的排查是否有配置错误导致的流量环路。

### 主机磁盘读取速率异常

主机异常磁盘读取率 (instance \{\{ $labels.instance \}\})

警告 · 5 分钟 · 触发条件:

```promql
sum by (instance) (rate(node_disk_read_bytes_total[2m])) / 1024 / 1024 > 50
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util；
1. 用 iotop -oP 找出 IO 最高的进程；
1. K8s 节点常见是容器日志写入、镜像拉取解压、或某个 Pod 的数据写入；
1. 可延后的任务错峰执行，持续高负载的换 SSD 或分散数据。

### 主机磁盘写入速率异常

主机异常磁盘写入率 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
sum by (instance) (rate(node_disk_written_bytes_total[2m])) / 1024 / 1024 > 50
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util；
1. 用 iotop -oP 找出 IO 最高的进程；
1. K8s 节点常见是容器日志写入、镜像拉取解压、或某个 Pod 的数据写入；
1. 可延后的任务错峰执行，持续高负载的换 SSD 或分散数据。

### 主机磁盘空间不足

主机磁盘空间不足 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 逐层找占用大的目录；
1. 容器运行时目录（/var/lib/containerd 或 /var/lib/docker）用 crictl rmi --prune 清理无用镜像；
1. 清理容器日志（/var/log/pods），并确认日志轮转配置生效；
1. 用 lsof +L1 检查已删除但句柄未释放的文件。

### 主机磁盘将在 24 小时内填满

主机磁盘将在 24 小时内填满 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) predict_linear(node_filesystem_avail_bytes{fstype!~"tmpfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

处置步骤:

1. 用 du -x --max-depth=1 找出增长最快的目录；
1. 确认增长来源是正常业务还是异常（应用死循环打日志、备份堆积）；
1. 清理无用镜像与容器日志；
1. 增长确实来自业务的，安排扩容磁盘或迁移数据，不要等到写满。

### 文件系统inode使用率高

主机不足 inode (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

处置步骤:

1. 用 df -i 确认挂载点；
1. 逐层统计文件数找出小文件最多的目录；
1. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
1. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 文件系统inode将在24小时内填满

主机 inode 将在 24 小时内填满 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and predict_linear(node_filesystem_files_free{mountpoint="/rootfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

处置步骤:

1. 用 df -i 确认挂载点；
1. 逐层统计文件数找出小文件最多的目录；
1. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
1. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 主机磁盘读取延迟异常

主机异常磁盘读取延迟 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m]) > 0.1 and rate(node_disk_reads_completed_total[1m]) > 0
```

处置步骤:

1. 用 iostat -x 1 看 r_await/w_await 与队列深度；
1. 延迟高但 IOPS 不高的怀疑磁盘硬件问题，用 smartctl -a 检查；
1. IOPS 也高的按磁盘饱和处理，定位高 IO 进程；
1. 云盘的确认是否触及规格的 IOPS/吞吐上限被限流。

### 主机磁盘写入延迟异常

主机异常磁盘写入延迟 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
rate(node_disk_write_time_seconds_total[1m]) / rate(node_disk_writes_completed_total[1m]) > 0.1 and rate(node_disk_writes_completed_total[1m]) > 0
```

处置步骤:

1. 用 iostat -x 1 看 r_await/w_await 与队列深度；
1. 延迟高但 IOPS 不高的怀疑磁盘硬件问题，用 smartctl -a 检查；
1. IOPS 也高的按磁盘饱和处理，定位高 IO 进程；
1. 云盘的确认是否触及规格的 IOPS/吞吐上限被限流。

### 节点cpu负载高

主机 CPU 负载高 (instance \{\{ $labels.instance \}\})

警告 · — · 触发条件:

```promql
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟趋势判断是突发还是持续；
1. top 里看 %wa，高说明瓶颈在磁盘而非 CPU；
1. vmstat 1 用 r/b 列区分 CPU 密集与 IO 阻塞；
1. K8s 节点上用 kubectl top pod 定位高负载 Pod 并考虑迁走。

### 有其他云主机窃取cpu

Host CPU steal noisy neighbor (instance \{\{ $labels.instance \}\})

警告 · — · 触发条件:

```promql
avg by(instance) (rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100 > 10
```

处置步骤:

1. 用 top 或 vmstat 确认 st 列的持续水位；
1. 这是宿主机层面的资源争抢，虚拟机内部无法根治；
1. 云环境下联系云厂商或更换实例规格（独享型规格无 steal）；
1. 自建虚拟化的检查宿主机超卖比例并迁移虚机。

### 主机上下文切换异常

主机上下文切换 (instance \{\{ $labels.instance \}\})

警告 · — · 触发条件:

```promql
(rate(node_context_switches_total[5m])) / (count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})) > 1000
```

处置步骤:

1. 用 vmstat 1 确认 cs 列的水位；
1. 用 pidstat -w 1 找出切换最频繁的进程；
1. 常见根因是线程数过多、锁竞争激烈、或大量短生命周期进程；
1. 应用侧收敛线程池大小、优化锁粒度是根本解法。

### 主机交换内存快满了

主机交换内存已满 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80
```

处置步骤:

1. 用 free -h 与 swapon -s 确认 swap 使用情况；
1. 用 smem 或 /proc/\<pid>/status 的 VmSwap 找出换出最多的进程；
1. K8s 节点原则上应关闭 swap，开启会掩盖真实的内存压力并让 QoS 失效；
1. 根因是内存不足，按内存告警路径处理。

### 主机系统服务崩溃

主机 systemd 服务崩溃 (instance \{\{ $labels.instance \}\})

警告 · — · 触发条件:

```promql
node_systemd_unit_state{state="failed"} == 1
```

处置步骤:

1. systemctl --failed 列出失败单元；
1. journalctl -u \<unit> -n 100 --no-pager 定位原因；
1. K8s 节点上重点关注 kubelet、containerd、kube-proxy 这几个关键单元；
1. 修复后 systemctl reset-failed 清理状态并确认恢复。

### 主机内核版本偏差

主机内核版本偏差 (instance \{\{ $labels.instance \}\})

警告 · 360 分钟 · 触发条件:

```promql
count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1
```

处置步骤:

1. 用 kubectl get node -o wide 对比各节点内核版本；
1. 确认差异是升级过程中的临时状态还是长期存在；
1. 逐步把落后节点的内核升级对齐；
1. 升级前确认容器运行时与 CNI 插件对目标内核版本的兼容性。

### 检测到 HostOomKill

检测到主机 OOM 终止 (instance \{\{ $labels.instance \}\})

警告 · — · 触发条件:

```promql
increase(node_vmstat_oom_kill[1m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀进程与当时内存；
1. 对照 kubectl get pod -A 找出对应的 Pod，看是否是 limit 设置过低；
1. 节点整体内存紧张的迁走部分 Pod 或扩容；
1. 反复被杀的必须在应用侧定位内存泄漏，只调 limit 会反复复发。

### 主机网络接收错误

主机网络接收错误 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
rate(node_network_receive_errs_total[2m]) / rate(node_network_receive_packets_total[2m]) > 0.01
```

处置步骤:

1. 用 ip -s link show \<网卡> 与 ethtool -S \<网卡> 确认错包计数与类型；
1. 确认协商速率与双工模式和对端一致；
1. 检查网线/光模块，云环境下提工单给云厂商；
1. 有冗余的先把流量切走。

### 主机网络出口错误

主机网络传输错误 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
rate(node_network_transmit_errs_total[2m]) / rate(node_network_transmit_packets_total[2m]) > 0.01
```

处置步骤:

1. 用 ip -s link show \<网卡> 与 ethtool -S \<网卡> 确认错包计数与类型；
1. 确认协商速率与双工模式和对端一致；
1. 检查网线/光模块，云环境下提工单给云厂商；
1. 有冗余的先把流量切走。

### 主机网络接口饱和

主机网络接口饱和 (instance \{\{ $labels.instance \}\})

警告 · 1 分钟 · 触发条件:

```promql
(rate(node_network_receive_bytes_total{device!~"^tap.*"}[1m]) + rate(node_network_transmit_bytes_total{device!~"^tap.*"}[1m])) / node_network_speed_bytes{device!~"^tap.*"} > 0.8 < 10000
```

处置步骤:

1. 用 iftop/nethogs 定位占用带宽最高的连接；
1. K8s 节点上确认是否有大流量 Pod 或正在拉取大镜像；
1. 可错峰的任务调整执行时间；
1. 确需更高带宽的升级网卡或迁移部分工作负载。

### conntrack数量接近极限

主机连接限制 (instance \{\{ $labels.instance \}\})

警告 · 5 分钟 · 触发条件:

```promql
node_nf_conntrack_entries / node_nf_conntrack_entries_limit > 0.8
```

处置步骤:

1. 用 sysctl net.netfilter.nf_conntrack_count 与 nf_conntrack_max 确认水位；
1. K8s 节点上 kube-proxy 的 iptables 模式会产生大量 conntrack 条目，Pod 密度高时尤其明显；
1. 调大 nf_conntrack_max 并同步调大 buckets；
1. 长期可评估切换到 IPVS 模式减少 conntrack 压力。

### 主机时钟偏差

主机时钟偏差 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
(node_timex_offset_seconds > 0.05 and deriv(node_timex_offset_seconds[5m]) >= 0) or (node_timex_offset_seconds < -0.05 and deriv(node_timex_offset_seconds[5m]) <= 0)
```

处置步骤:

1. 用 chronyc tracking 确认偏移量与上游源状态；
1. 确认 chronyd/ntpd 服务在运行且开机自启；
1. 检查到 NTP 服务器的网络是否放行 123/UDP；
1. 偏移过大用 chronyc makestep 强制对时，之后确认所有节点时间一致。

### 主机时钟不同步

主机时钟不同步 (instance \{\{ $labels.instance \}\})

警告 · 2 分钟 · 触发条件:

```promql
min_over_time(node_timex_sync_status[1m]) == 0 and node_timex_maxerror_seconds >= 16
```

处置步骤:

1. 用 chronyc tracking 确认偏移量与上游源状态；
1. 确认 chronyd/ntpd 服务在运行且开机自启；
1. 检查到 NTP 服务器的网络是否放行 123/UDP；
1. 偏移过大用 chronyc makestep 强制对时，之后确认所有节点时间一致。

### 节点文件系统空间填满-S2

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left and is filling up.

警告 · 60 分钟 · 触发条件:

```promql
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
1. 确认增长来源是正常业务还是异常（应用死循环打日志、备份堆积）；
1. 清理无用镜像与容器日志；
1. 增长确实来自业务的，安排扩容磁盘或迁移数据，不要等到写满。

### 节点文件系统空间填满-S1

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left and is filling up fast.

紧急 · 60 分钟 · 触发条件:

```promql
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
1. 确认增长来源是正常业务还是异常（应用死循环打日志、备份堆积）；
1. 清理无用镜像与容器日志；
1. 增长确实来自业务的，安排扩容磁盘或迁移数据，不要等到写满。

### 节点磁盘快满了-S2-space-5

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left.

警告 · 60 分钟 · 触发条件:

```promql
(
  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 5
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 逐层找占用大的目录；
1. 容器运行时目录（/var/lib/containerd 或 /var/lib/docker）用 crictl rmi --prune 清理无用镜像；
1. 清理容器日志（/var/log/pods），并确认日志轮转配置生效；
1. 用 lsof +L1 检查已删除但句柄未释放的文件。

### 节点磁盘快满了-S1-space-3

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left.

紧急 · 60 分钟 · 触发条件:

```promql
(
  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 3
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 逐层找占用大的目录；
1. 容器运行时目录（/var/lib/containerd 或 /var/lib/docker）用 crictl rmi --prune 清理无用镜像；
1. 清理容器日志（/var/log/pods），并确认日志轮转配置生效；
1. 用 lsof +L1 检查已删除但句柄未释放的文件。

### 节点磁盘快满了-S2-inodes-40

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left and is filling up.

警告 · 60 分钟 · 触发条件:

```promql
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
1. 逐层统计文件数找出小文件最多的目录；
1. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
1. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 节点磁盘快满了-S1-inodes-20

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left and is filling up fast.

紧急 · 60 分钟 · 触发条件:

```promql
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
1. 逐层统计文件数找出小文件最多的目录；
1. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
1. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 节点磁盘快满了-S2-inodes-5

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left.

警告 · 60 分钟 · 触发条件:

```promql
(
  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 5
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

处置步骤:

1. 用 df -i 确认挂载点；
1. 逐层统计文件数找出小文件最多的目录；
1. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
1. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 节点磁盘快满了-S1-inodes-3

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left.

紧急 · 60 分钟 · 触发条件:

```promql
(
  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 3
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

处置步骤:

1. 用 df -i 确认挂载点；
1. 逐层统计文件数找出小文件最多的目录；
1. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
1. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 使用的节点Conntrack条目数量高

\{\{ $value | humanizePercentage \}\} of conntrack entries are used.

警告 · — · 触发条件:

```promql
(node_nf_conntrack_entries / node_nf_conntrack_entries_limit) > 0.75
```

处置步骤:

1. 用 sysctl net.netfilter.nf_conntrack_count 与 nf_conntrack_max 确认水位；
1. K8s 节点上 kube-proxy 的 iptables 模式会产生大量 conntrack 条目，Pod 密度高时尤其明显；
1. 调大 nf_conntrack_max 并同步调大 buckets；
1. 长期可评估切换到 IPVS 模式减少 conntrack 压力。

### 节点文本文件收集器抓取错误

Node Exporter text file collector failed to scrape.

警告 · — · 触发条件:

```promql
node_textfile_scrape_error{job="node-exporter"} == 1
```

处置步骤:

1. 检查 textfile 目录下的 .prom 文件权限与格式；
1. 写入方通常是 cron 脚本，确认脚本执行成功且用原子写（先写 .tmp 再 mv）；
1. 格式错误的用 promtool check metrics 校验；
1. 清理残留的临时文件，它们会导致解析失败。

### 节点网络接口抖动

Network interface "\{\{ $labels.device \}\}" changing it's up status often on node-exporter \{\{ $labels.namespace \}\}/\{\{ $labels.pod \}\}"

警告 · 2 分钟 · 触发条件:

```promql
changes(node_network_up{job="node-exporter",device!~"veth.+"}[2m]) > 2
```

处置步骤:

1. 用 dmesg -T | grep -i 'link is' 看抖动时间线；
1. 检查网线/光模块，抖动多为物理层接触不良；
1. 确认协商速率与双工模式和对端一致；
1. 联系网络侧确认交换机端口状态，云环境下提工单。

### A certain disk is unable to read/write normally

紧急 · 1 分钟 · 触发条件:

```promql
(node_filesystem_device_error{mountpoint!~"/var/lib/.*",mountpoint!~"/run.*"}) > 0
```

处置步骤:

1. 用 dmesg -T | grep -iE 'i/o error|ata|scsi' 看内核报的具体错误与设备名；
1. 用 smartctl -a /dev/sdX 看 SMART 属性，重点关注 Reallocated_Sector_Ct 与 Current_Pending_Sector；
1. 确认该盘上的数据是否有副本或备份，优先保证数据安全再处理硬件；
1. 确认为硬件故障的，安排停机换盘，RAID 环境下先确认阵列降级状态再操作。

### Disk needs to be cleaned - utilization has reached 92% - node exporter

紧急 · 1 分钟 · 触发条件:

```promql
(100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) ) > 92
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 \<挂载点> | sort -h 找出占用最大的目录；
1. 系统盘常见是 /var/log 与容器镜像层（docker system df 看占用，docker system prune 清理）；
1. 用 lsof +L1 检查已删除但句柄未释放的文件；
1. 长期需扩容或把大数据目录迁到独立磁盘。

### Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter

警告 · 1 分钟 · 触发条件:

```promql
avg (node_load1) by (instance)/count(count(node_cpu_seconds_total) by (cpu,instance)) by (instance) >10
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟负载趋势，判断是突发还是持续；
1. 用 top 看 %wa（IO 等待）——高说明瓶颈在磁盘而非 CPU，按磁盘 IO 处理；
1. 用 vmstat 1 看 r（运行队列）与 b（阻塞）列区分 CPU 密集与 IO 阻塞；
1. 定位到具体进程后按 CPU 或 IO 的路径继续排查，必要时扩容。

### Insufficient file handles - usage exceeds 90% - node exporter

You can increase the file handle limit or expand the capacity

警告 · 1 分钟 · 触发条件:

```promql
(node_filefd_allocated/node_filefd_maximum*100) > 90
```

处置步骤:

1. 用 cat /proc/sys/fs/file-nr 确认已分配与上限；
1. 用 lsof | awk '\{print $2\}' | sort | uniq -c | sort -rn | head 找出占用句柄最多的进程；
1. 应急调大：sysctl -w fs.file-max=\<更大值>，并检查该进程的 ulimit -n 与 systemd LimitNOFILE；
1. 根因通常是连接或文件未关闭，需在应用侧修复泄漏。

### Insufficient inode resources - usage exceeds 90% - node exporter

警告 · 1 分钟 · 触发条件:

```promql
(100 - ((node_filesystem_files_free * 100) / node_filesystem_files))>90
```

处置步骤:

1. 用 df -i 确认是哪个挂载点的 inode 吃紧；
1. 用 for d in /path/*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head 逐层找出小文件最多的目录；
1. 常见来源是 session 文件、邮件队列、缓存碎片、未清理的容器层——按业务确认后批量删除；
1. 长期可在格式化时调大 inode 密度，或把小文件业务迁到独立分区。

### Insufficient memory resources - utilization is greater than 75% - node exporter

Expansion or upgrading of configuration is required

警告 · 1 分钟 · 触发条件:

```promql
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 75
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
1. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
1. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop_caches 释放 page cache（生产慎用）；
1. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### Insufficient memory resources - utilization is greater than 95% - node exporter

紧急 · 1 分钟 · 触发条件:

```promql
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 95
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
1. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
1. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop_caches 释放 page cache（生产慎用）；
1. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### Packet loss in the inbound direction of the network card - node exporter

警告 · 1 分钟 · 触发条件:

```promql
rate(node_network_receive_drop_total{device=~"e.*"}[1m]) > 3
```

处置步骤:

1. 用 ip -s link show \<网卡> 确认 RX dropped/errors 的增长；
1. 用 ethtool -S \<网卡> 看具体丢包原因（rx_no_buffer、rx_missed_errors 等）；
1. 环形缓冲区不足可用 ethtool -G \<网卡> rx \<更大值> 调大，并检查 net.core.netdev_max_backlog；
1. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

### Packet loss in the outbound direction of the network card - node exporter

警告 · 1 分钟 · 触发条件:

```promql
rate(node_network_transmit_drop_total{device=~"e.*"}[1m]) > 3
```

处置步骤:

1. 用 ip -s link show \<网卡> 确认 TX dropped/errors 的增长；
1. 用 ethtool -S \<网卡> 看具体计数，并用 tc -s qdisc show dev \<网卡> 看队列是否溢出；
1. 发送队列不足可调大 txqueuelen 与 ethtool -G \<网卡> tx；
1. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

### System conntrack needs to be adjusted - usage exceeds 80% - node exporter

警告 · 1 分钟 · 触发条件:

```promql
node_nf_conntrack_entries / node_nf_conntrack_entries_limit*100 > 80
```

处置步骤:

1. 用 sysctl net.netfilter.nf_conntrack_count 与 nf_conntrack_max 确认当前水位；
1. 用 conntrack -L | awk '\{print $4\}' | sort | uniq -c | sort -rn 看连接集中在哪类协议或来源；
1. 应急调大：sysctl -w net.netfilter.nf_conntrack_max=\<更大值>，并同步调大 nf_conntrack_buckets；
1. 同时缩短 nf_conntrack_tcp_timeout_time_wait 等超时，或对不需要跟踪的流量用 iptables raw 表 NOTRACK。

### System experiences OOM - node exporter

警告 · 1 分钟 · 触发条件:

```promql
increase(node_vmstat_oom_kill[1m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀的是哪个进程、当时占用多少内存；
1. 用 free -h 与该进程的内存曲线判断是内存泄漏还是配置的上限过高；
1. 给关键进程调整 oom_score_adj 降低被杀优先级，同时给次要进程设 cgroup 内存上限；
1. 根因是泄漏的要在应用侧抓堆定位，只扩内存会反复复发。

### Too many running processes - exceeding 3000 - node exporter

警告 · 1 分钟 · 触发条件:

```promql
node_procs_running > 3000
```

处置步骤:

1. 用 ps -eo ppid | sort | uniq -c | sort -rn | head 找出 fork 子进程最多的父进程；
1. 确认是正常的多进程模型（如 php-fpm、nginx worker）还是失控 fork；
1. 失控的先停掉该父进程止血，再修复代码里的 fork 逻辑；
1. 正常业务增长则调整 worker 数配置并评估是否需要扩容。

## Categraf（24）

适用于用 Categraf 采集的主机和实例，指标名遵循 Categraf 插件。

本组 24 条中有 8 条规则对用 Telegraf 采集的实例同样适用，指标名完全一致。

### Conntrack表的使用率超过80%

警告 · 1 分钟 · 触发条件:

```promql
conntrack_ip_conntrack_count / conntrack_ip_conntrack_max > 0.8
```

处置步骤:

1. 用 sysctl net.netfilter.nf_conntrack_count 与 nf_conntrack_max 确认当前水位；
1. 用 conntrack -L | awk '\{print $4\}' | sort | uniq -c | sort -rn 看连接集中在哪类协议或来源；
1. 应急调大：sysctl -w net.netfilter.nf_conntrack_max=\<更大值>，并同步调大 nf_conntrack_buckets；
1. 同时缩短 nf_conntrack_tcp_timeout_time_wait 等超时，或对不需要跟踪的流量用 iptables raw 表 NOTRACK。

### CPU利用率较高

提醒 · 1 分钟 · 触发条件:

```promql
cpu_usage_active>75

cpu_usage_active>85

cpu_usage_active>95
```

处置步骤:

1. 用 top -H 或 pidstat 1 找出占用最高的进程与线程；
1. 用 perf top 或对应语言的 profiler（Java 用 arthas/async-profiler，Go 用 pprof）定位热点函数；
1. 区分是业务量自然增长还是代码异常（死循环、正则回溯、频繁 GC）；
1. 业务量增长则扩容或限流，代码问题则修复后发布。

### HTTP地址探测失败

警告 · 1 分钟 · 触发条件:

```promql
http_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 curl -sv \<目标URL> 复现，看是连接失败、超时还是状态码不符；
1. 连接失败则先确认目标端口通、进程活；
1. 状态码不符则看目标服务日志定位；
1. 确认探测配置里的超时、期望状态码、证书校验设置是否与实际相符，避免配置导致的误报。

### IO比较繁忙

警告 · 1 分钟 · 触发条件:

```promql
rate(diskio_io_time[1m])/10 > 99
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util 的具体数值；
1. 用 iotop -oP 或 pidstat -d 1 找出占用 IO 最高的进程；
1. 常见元凶是数据库大查询、备份任务、日志刷盘——把可延后的任务错峰执行；
1. 若是持续高负载而非突发，考虑换 SSD 或把热数据分散到多块盘。

### NTP时间偏移太大

警告 · 1 分钟 · 触发条件:

```promql
ntp_offset_ms > 1000 or ntp_offset_ms < -1000
```

处置步骤:

1. 用 chronyc tracking（或 ntpq -p）确认当前偏移量与上游源状态；
1. 上游不可达则检查网络与防火墙是否放行 123/UDP；
1. 用 chronyc sources -v 确认是否所有源都被标记为不可用，必要时更换 NTP 服务器；
1. 偏移过大时 chrony 会拒绝平滑校正，需用 chronyc makestep 强制对时（注意对时间敏感的业务先做好准备）。

### PING地址探测失败

警告 · 1 分钟 · 触发条件:

```promql
ping_result_code != 0
```

处置步骤:

1. 在采集机上手工 ping -c 5 \<目标> 复现，再用 mtr -n \<目标> 定位丢包出现在哪一跳；
1. 目标机若存活，确认它是否禁 ICMP（很多安全策略会禁），是则该探测本身不适用，应改用端口探测；
1. 中间跳丢包的联系网络侧排查；
1. 确认目标机自身是否宕机或网卡故障。

### TME_WAIT状态的连接超过2万，可能需要关注

警告 · 1 分钟 · 触发条件:

```promql
netstat_tcp_time_wait > 20000
```

处置步骤:

1. 用 ss -s 确认各状态连接数分布；
1. 用 ss -tan state time-wait | awk '\{print $4\}' | cut -d: -f1 | sort | uniq -c | sort -rn 看集中在哪个目标；
1. 根因通常是短连接过多——在应用侧改用长连接或连接池，这是最有效的手段；
1. 应急可开启 net.ipv4.tcp_tw_reuse=1 并调大 net.ipv4.ip_local_port_range（不要开 tcp_tw_recycle，NAT 环境下会丢包）。

### 内存利用率比较高

提醒 · 1 分钟 · 触发条件:

```promql
mem_available_percent < 25

mem_available_percent < 15

mem_available_percent < 5
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
1. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
1. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop_caches 释放 page cache（生产慎用）；
1. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### 文件句柄使用率超过90%

警告 · 1 分钟 · 触发条件:

```promql
linux_sysctl_fs_file_nr/linux_sysctl_fs_file_max>0.9
```

处置步骤:

1. 用 cat /proc/sys/fs/file-nr 确认已分配与上限；
1. 用 lsof | awk '\{print $2\}' | sort | uniq -c | sort -rn | head 找出占用句柄最多的进程；
1. 应急调大：sysctl -w fs.file-max=\<更大值>，并检查该进程的 ulimit -n 与 systemd LimitNOFILE；
1. 根因通常是连接或文件未关闭，需在应用侧修复泄漏。

### 每个CPU Core的平均负载任务超过3

警告 · 1 分钟 · 触发条件:

```promql
system_load_norm_1>3
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟负载趋势，判断是突发还是持续；
1. 用 top 看 %wa（IO 等待）——高说明瓶颈在磁盘而非 CPU，按磁盘 IO 处理；
1. 用 vmstat 1 看 r（运行队列）与 b（阻塞）列区分 CPU 密集与 IO 阻塞；
1. 定位到具体进程后按 CPU 或 IO 的路径继续排查，必要时扩容。

### 硬盘监控 - inode使用率超过90%

警告 · 1 分钟 · 触发条件:

```promql
disk_inodes_used/disk_inodes_total >0.9
```

处置步骤:

1. 用 df -i 确认是哪个挂载点的 inode 吃紧；
1. 用 for d in /path/*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head 逐层找出小文件最多的目录；
1. 常见来源是 session 文件、邮件队列、缓存碎片、未清理的容器层——按业务确认后批量删除；
1. 长期可在格式化时调大 inode 密度，或把小文件业务迁到独立分区。

### 硬盘监控 - 大于200G的盘，空间不足了

提醒 · 1 分钟 · 触发条件:

```promql
disk_free/1024/1024/1024 < 20 and disk_total/1024/1024/1024 >= 200

disk_free/1024/1024/1024 < 10 and disk_total/1024/1024/1024 >= 200

disk_free/1024/1024/1024 < 2 and disk_total/1024/1024/1024 >= 200
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 \<挂载点> | sort -h 找出占用最大的目录；
1. 清理日志与过期数据，注意用 lsof +L1 检查已删除但未释放的文件；
1. 评估是否该把数据目录迁到独立磁盘或加盘扩容；
1. 若是数据库或对象存储的数据盘，按业务侧的归档策略下沉冷数据。

### 硬盘监控 - 小于200G的盘，空间不足了

提醒 · 1 分钟 · 触发条件:

```promql
disk_used_percent > 90 and disk_total/1024/1024/1024 < 200

disk_used_percent > 95 and disk_total/1024/1024/1024 < 200

disk_used_percent > 99 and disk_total/1024/1024/1024 < 200
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 \<挂载点> | sort -h 找出占用最大的目录；
1. 系统盘常见是 /var/log 与容器镜像层（docker system df 看占用，docker system prune 清理）；
1. 用 lsof +L1 检查已删除但句柄未释放的文件；
1. 长期需扩容或把大数据目录迁到独立磁盘。

### 硬盘监控 - 设备有报错

警告 · 1 分钟 · 触发条件:

```promql
disk_device_error>0
```

处置步骤:

1. 用 dmesg -T | grep -iE 'i/o error|ata|scsi' 看内核报的具体错误与设备名；
1. 用 smartctl -a /dev/sdX 看 SMART 属性，重点关注 Reallocated_Sector_Ct 与 Current_Pending_Sector；
1. 确认该盘上的数据是否有副本或备份，优先保证数据安全再处理硬件；
1. 确认为硬件故障的，安排停机换盘，RAID 环境下先确认阵列降级状态再操作。

### 硬盘监控 - 预测硬盘会在未来4小时内写满

紧急 · 1 分钟 · 触发条件:

```promql
predict_linear(disk_free[1h], 4*3600) < 0
```

处置步骤:

1. 用 df -h 确认是哪个挂载点，再用 du -x --max-depth=1 \<挂载点> | sort -h 逐层找出增长最快的目录；
1. 优先清理日志（journalctl --vacuum-size=500M、清 *.log.N）与临时文件，这是最快见效的；
1. 用 lsof +L1 找出已删除但句柄未释放的文件，重启对应进程才能真正释放空间；
1. 确认是否有异常写入（应用死循环打日志、备份任务堆积），不解决根因清理只是拖延。

### 系统有OOM产生

警告 · — · 触发条件:

```promql
increase(kernel_vmstat_oom_kill[2m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀的是哪个进程、当时占用多少内存；
1. 用 free -h 与该进程的内存曲线判断是内存泄漏还是配置的上限过高；
1. 给关键进程调整 oom_score_adj 降低被杀优先级，同时给次要进程设 cgroup 内存上限；
1. 根因是泄漏的要在应用侧抓堆定位，只扩内存会反复复发。

### 网卡监控 - 入方向有丢包

提醒 · 1 分钟 · 触发条件:

```promql
increase(net_drop_in[1m]) > 0
```

处置步骤:

1. 用 ip -s link show \<网卡> 确认 RX dropped/errors 的增长；
1. 用 ethtool -S \<网卡> 看具体丢包原因（rx_no_buffer、rx_missed_errors 等）；
1. 环形缓冲区不足可用 ethtool -G \<网卡> rx \<更大值> 调大，并检查 net.core.netdev_max_backlog；
1. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

### 网卡监控 - 入方向有错包

提醒 · 1 分钟 · 触发条件:

```promql
increase(net_err_in[1m]) > 0
```

处置步骤:

1. 用 ethtool -S \<网卡> 看 rx_crc_errors、rx_frame_errors 等具体计数；
1. 用 ethtool \<网卡> 确认协商的速率与双工模式是否与对端一致（半双工是经典错包源）；
1. 检查网线/光模块，必要时换线或换口做交叉验证；
1. 联系网络侧确认交换机对应端口的错包计数。

### 网卡监控 - 出方向有丢包

提醒 · 1 分钟 · 触发条件:

```promql
increase(net_drop_out[1m]) > 0
```

处置步骤:

1. 用 ip -s link show \<网卡> 确认 TX dropped/errors 的增长；
1. 用 ethtool -S \<网卡> 看具体计数，并用 tc -s qdisc show dev \<网卡> 看队列是否溢出；
1. 发送队列不足可调大 txqueuelen 与 ethtool -G \<网卡> tx；
1. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

### 网卡监控 - 出方向有错包

提醒 · 1 分钟 · 触发条件:

```promql
increase(net_err_out[1m]) > 0
```

处置步骤:

1. 用 ethtool -S \<网卡> 看 tx_errors、tx_carrier_errors 等具体计数；
1. 用 ethtool \<网卡> 确认速率与双工模式与对端一致；
1. 检查网线/光模块并做交叉验证；
1. 确认网卡驱动与固件版本，必要时升级。

### 网络地址探活失败

警告 · 1 分钟 · 触发条件:

```promql
net_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 telnet \<目标> \<端口> 或 nc -vz \<目标> \<端口> 复现；
1. 到目标机用 ss -lntp | grep \<端口> 确认进程是否在监听；
1. 进程在监听则排查防火墙、安全组、以及是否只绑定了 127.0.0.1；
1. 进程不在则按该服务自身的恢复流程拉起。

### 进程监控-有进程数为0，某进程可能挂了

紧急 · 1 分钟 · 触发条件:

```promql
procstat_lookup_count == 0
```

处置步骤:

1. 用 ps -ef | grep \<进程关键字> 确认确实不在，排除采集侧的匹配规则写错；
1. 查该进程的日志与 dmesg -T | grep -i 'killed process'，区分自身崩溃、被 OOM 杀死还是人工停止；
1. 按服务自身流程拉起，并确认 systemd 的 Restart 策略是否生效；
1. 若反复退出，先定位根因再拉起，避免陷入重启循环。

### 进程监控-进程句柄限制过小

提醒 · 1 分钟 · 触发条件:

```promql
procstat_rlimit_num_fds_soft < 2048
```

处置步骤:

1. 用 cat /proc/\<pid>/limits 确认 Max open files 的软硬上限；
1. systemd 管理的服务在 unit 文件里加 LimitNOFILE=65535 后 systemctl daemon-reload 并重启；
1. 非 systemd 的在启动脚本里加 ulimit -n 65535，或改 /etc/security/limits.conf；
1. 注意软上限修改后必须重启进程才生效。

### 进程监控-进程总量超过600

警告 · 1 分钟 · 触发条件:

```promql
processes_total > 600
```

处置步骤:

1. 用 ps -eo ppid | sort | uniq -c | sort -rn | head 找出 fork 子进程最多的父进程；
1. 确认是正常的多进程模型（如 php-fpm、nginx worker）还是失控 fork；
1. 失控的先停掉该父进程止血，再修复代码里的 fork 逻辑；
1. 正常业务增长则调整 worker 数配置并评估是否需要扩容。

## Telegraf（4）

适用于用 Telegraf 采集、以 Prometheus 格式输出的主机。

### Machine load - high CPU, please pay attention - telegraf

提醒 · 1 分钟 · 触发条件:

```promql
cpu_usage_idle{cpu="cpu-total"} < 25
```

处置步骤:

1. 用 top -H 或 pidstat 1 找出占用最高的进程与线程；
1. 用 perf top 或对应语言的 profiler（Java 用 arthas/async-profiler，Go 用 pprof）定位热点函数；
1. 区分是业务量自然增长还是代码异常（死循环、正则回溯、频繁 GC）；
1. 业务量增长则扩容或限流，代码问题则修复后发布。

### Machine load - high memory, please pay attention - telegraf

警告 · 1 分钟 · 触发条件:

```promql
mem_available_percent < 25
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
1. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
1. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop_caches 释放 page cache（生产慎用）；
1. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### Process monitoring - lookup failure - telegraf

紧急 · 1 分钟 · 触发条件:

```promql
procstat_lookup_result_code != 0
```

处置步骤:

1. 在采集机上按配置的匹配方式手工执行 ps/pgrep 复现；
1. 进程确实不在则按服务恢复流程处理；
1. 进程在但探测失败，检查 procstat 配置的 pid_file、exe、pattern 是否写错，以及采集账号是否有权限读取 /proc；
1. 容器环境下确认 categraf 是否挂载了宿主机的 /proc。

### there are processes with 0 count, a certain process may have crashed - telegraf

紧急 · 1 分钟 · 触发条件:

```promql
procstat_lookup_running == 0
```

处置步骤:

1. 用 ps -ef | grep \<进程关键字> 确认确实不在，排除采集侧的匹配规则写错；
1. 查该进程的日志与 dmesg -T | grep -i 'killed process'，区分自身崩溃、被 OOM 杀死还是人工停止；
1. 按服务自身流程拉起，并确认 systemd 的 Restart 策略是否生效；
1. 若反复退出，先定位根因再拉起，避免陷入重启循环。

## 怎么使用这些规则

- **用 Prometheus 或 vmalert**：下载 [`linux.yml`](pathname:///alert-rules/linux.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页；有单独页面的规则指向它自己的页面。
- **用夜莺**：同样的规则内置在 [Kubernetes](/integrations/kubernetes)、[Linux](/integrations/linux) 集成模板里。在集成中心把规则[导入到业务组](/docs/data/integrations/import)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可

不少规则表达式改编自 [awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts)（CC BY 4.0）。 处置步骤和其余规则来自夜莺的集成模板（[Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes)、[Linux](https://github.com/ccfos/nightingale/tree/main/integrations/Linux)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接

- [用夜莺监控 Kubernetes](/integrations/kubernetes)：采集配置、仪表盘与指标说明
- [用夜莺监控 Linux](/integrations/linux)：采集配置、仪表盘与指标说明
- [在夜莺里写指标告警规则](/docs/alerting/metric-rules)
- [全部告警规则](/alert-rules)
