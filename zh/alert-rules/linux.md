# Linux 告警规则：76 条 PromQL 规则与处置步骤

76 条开箱可用的 Linux 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 node\_exporter, Categraf, Telegraf。可下载为 Prometheus 规则文件，或导入夜莺。

最后校对于 2026-10-31

Linux 服务器与 Kubernetes 节点的主机级告警规则：内存耗尽与内存压力、磁盘和 inode 将满（含「24 小时内将写满」的预测）、磁盘延迟、网络错误、丢包与带宽打满、CPU 负载与被宿主机抢占、OOM Kill、conntrack 表与文件句柄耗尽、时钟偏移、系统服务崩溃、进程消失，以及 PING、端口、HTTP 探测失败。node\_exporter 一组用的是标准 `node_*` 指标名；Categraf 和 Telegraf 两组针对用这两种 agent 采集的主机，覆盖同样的问题。

## 概览[​](#概览 "概览的直接链接")

* **76 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
* **指标来源**：node\_exporter, Categraf, Telegraf
* **下载**：[`linux.yml`](https://n9e.github.io/zh/alert-rules/linux.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
* 阈值只是起点，启用前请按自己的环境调整。

## 规则一览[​](#规则一览 "规则一览的直接链接")

| 规则                                                                                                           | 级别 | 持续     |
| -------------------------------------------------------------------------------------------------------------- | ---- | -------- |
| 主机内存不足                                                                                                   | 警告 | 2 分钟   |
| 主机内存有压力                                                                                                 | 警告 | 2 分钟   |
| 主机入口网络吞吐量异常                                                                                         | 警告 | 5 分钟   |
| 主机出口网络吞吐量异常                                                                                         | 警告 | 5 分钟   |
| 主机磁盘读取速率异常                                                                                           | 警告 | 5 分钟   |
| 主机磁盘写入速率异常                                                                                           | 警告 | 2 分钟   |
| 主机磁盘空间不足                                                                                               | 警告 | 2 分钟   |
| 主机磁盘将在 24 小时内填满                                                                                     | 警告 | 2 分钟   |
| 文件系统inode使用率高                                                                                          | 警告 | 2 分钟   |
| 文件系统inode将在24小时内填满                                                                                  | 警告 | 2 分钟   |
| 主机磁盘读取延迟异常                                                                                           | 警告 | 2 分钟   |
| 主机磁盘写入延迟异常                                                                                           | 警告 | 2 分钟   |
| 节点cpu负载高                                                                                                  | 警告 | —        |
| 有其他云主机窃取cpu                                                                                            | 警告 | —        |
| 主机上下文切换异常                                                                                             | 警告 | —        |
| 主机交换内存快满了                                                                                             | 警告 | 2 分钟   |
| 主机系统服务崩溃                                                                                               | 警告 | —        |
| 主机内核版本偏差                                                                                               | 警告 | 360 分钟 |
| 检测到 HostOomKill                                                                                             | 警告 | —        |
| 主机网络接收错误                                                                                               | 警告 | 2 分钟   |
| 主机网络出口错误                                                                                               | 警告 | 2 分钟   |
| 主机网络接口饱和                                                                                               | 警告 | 1 分钟   |
| conntrack数量接近极限                                                                                          | 警告 | 5 分钟   |
| 主机时钟偏差                                                                                                   | 警告 | 2 分钟   |
| 主机时钟不同步                                                                                                 | 警告 | 2 分钟   |
| 节点文件系统空间填满-S2                                                                                        | 警告 | 60 分钟  |
| 节点文件系统空间填满-S1                                                                                        | 紧急 | 60 分钟  |
| 节点磁盘快满了-S2-space-5                                                                                      | 警告 | 60 分钟  |
| 节点磁盘快满了-S1-space-3                                                                                      | 紧急 | 60 分钟  |
| 节点磁盘快满了-S2-inodes-40                                                                                    | 警告 | 60 分钟  |
| 节点磁盘快满了-S1-inodes-20                                                                                    | 紧急 | 60 分钟  |
| 节点磁盘快满了-S2-inodes-5                                                                                     | 警告 | 60 分钟  |
| 节点磁盘快满了-S1-inodes-3                                                                                     | 紧急 | 60 分钟  |
| 使用的节点Conntrack条目数量高                                                                                  | 警告 | —        |
| 节点文本文件收集器抓取错误                                                                                     | 警告 | —        |
| 节点网络接口抖动                                                                                               | 警告 | 2 分钟   |
| A certain disk is unable to read/write normally                                                                | 紧急 | 1 分钟   |
| Disk needs to be cleaned - utilization has reached 92% - node exporter                                         | 紧急 | 1 分钟   |
| Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter | 警告 | 1 分钟   |
| Insufficient file handles - usage exceeds 90% - node exporter                                                  | 警告 | 1 分钟   |
| Insufficient inode resources - usage exceeds 90% - node exporter                                               | 警告 | 1 分钟   |
| Insufficient memory resources - utilization is greater than 75% - node exporter                                | 警告 | 1 分钟   |
| Insufficient memory resources - utilization is greater than 95% - node exporter                                | 紧急 | 1 分钟   |
| Packet loss in the inbound direction of the network card - node exporter                                       | 警告 | 1 分钟   |
| Packet loss in the outbound direction of the network card - node exporter                                      | 警告 | 1 分钟   |
| System conntrack needs to be adjusted - usage exceeds 80% - node exporter                                      | 警告 | 1 分钟   |
| System experiences OOM - node exporter                                                                         | 警告 | 1 分钟   |
| Too many running processes - exceeding 3000 - node exporter                                                    | 警告 | 1 分钟   |
| Conntrack表的使用率超过80%                                                                                     | 警告 | 1 分钟   |
| CPU利用率较高                                                                                                  | 提醒 | 1 分钟   |
| HTTP地址探测失败                                                                                               | 警告 | 1 分钟   |
| IO比较繁忙                                                                                                     | 警告 | 1 分钟   |
| NTP时间偏移太大                                                                                                | 警告 | 1 分钟   |
| PING地址探测失败                                                                                               | 警告 | 1 分钟   |
| TME\_WAIT状态的连接超过2万，可能需要关注                                                                       | 警告 | 1 分钟   |
| 内存利用率比较高                                                                                               | 提醒 | 1 分钟   |
| 文件句柄使用率超过90%                                                                                          | 警告 | 1 分钟   |
| 每个CPU Core的平均负载任务超过3                                                                                | 警告 | 1 分钟   |
| 硬盘监控 - inode使用率超过90%                                                                                  | 警告 | 1 分钟   |
| 硬盘监控 - 大于200G的盘，空间不足了                                                                            | 提醒 | 1 分钟   |
| 硬盘监控 - 小于200G的盘，空间不足了                                                                            | 提醒 | 1 分钟   |
| 硬盘监控 - 设备有报错                                                                                          | 警告 | 1 分钟   |
| 硬盘监控 - 预测硬盘会在未来4小时内写满                                                                         | 紧急 | 1 分钟   |
| 系统有OOM产生                                                                                                  | 警告 | —        |
| 网卡监控 - 入方向有丢包                                                                                        | 提醒 | 1 分钟   |
| 网卡监控 - 入方向有错包                                                                                        | 提醒 | 1 分钟   |
| 网卡监控 - 出方向有丢包                                                                                        | 提醒 | 1 分钟   |
| 网卡监控 - 出方向有错包                                                                                        | 提醒 | 1 分钟   |
| 网络地址探活失败                                                                                               | 警告 | 1 分钟   |
| 进程监控-有进程数为0，某进程可能挂了                                                                           | 紧急 | 1 分钟   |
| 进程监控-进程句柄限制过小                                                                                      | 提醒 | 1 分钟   |
| 进程监控-进程总量超过600                                                                                       | 警告 | 1 分钟   |
| Machine load - high CPU, please pay attention - telegraf                                                       | 提醒 | 1 分钟   |
| Machine load - high memory, please pay attention - telegraf                                                    | 警告 | 1 分钟   |
| Process monitoring - lookup failure - telegraf                                                                 | 紧急 | 1 分钟   |
| there are processes with 0 count, a certain process may have crashed - telegraf                                | 紧急 | 1 分钟   |

## node\_exporter（48）[​](#node_exporter48 "node_exporter（48）的直接链接")

### 主机内存不足[​](#主机内存不足 "主机内存不足的直接链接")

节点内存不足 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10
```

处置步骤:

1. 登录节点用 free -h 确认 available 与 swap；
2. ps aux --sort=-%mem | head 找出占用最高的进程；
3. K8s 节点上优先用 kubectl top pod -A --sort-by=memory 定位是哪个 Pod；
4. 泄漏的在应用侧定位，容量不足的迁走部分 Pod 或扩容节点。

### 主机内存有压力[​](#主机内存有压力 "主机内存有压力的直接链接")

节点内存压力大 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
rate(node_vmstat_pgmajfault[1m]) > 1000
```

处置步骤:

1. 用 vmstat 1 看 si/so 列确认是否已在 swap；
2. 用 sar -B 或 /proc/vmstat 看 pgmajfault 的增长；
3. 定位占用最高的进程或 Pod 并评估是否可迁走；
4. 确认 swap 配置——K8s 节点通常应关闭 swap，开启会掩盖内存问题。

### 主机入口网络吞吐量异常[​](#主机入口网络吞吐量异常 "主机入口网络吞吐量异常的直接链接")

主机异常网络吞吐量 入 (instance {{ $labels.instance }})

警告 · 5 分钟 · 触发条件:

```
sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100
```

处置步骤:

1. 用 iftop 或 nethogs 定位占用带宽最高的进程/连接；
2. K8s 节点上确认是否有 Pod 在做大量数据传输（备份、数据同步、镜像拉取）；
3. 确认是否已跑满网卡带宽，是则限流或错峰；
4. 异常流量的排查是否有配置错误导致的流量环路。

### 主机出口网络吞吐量异常[​](#主机出口网络吞吐量异常 "主机出口网络吞吐量异常的直接链接")

主机异常网络吞吐量 出 (instance {{ $labels.instance }})

警告 · 5 分钟 · 触发条件:

```
sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100
```

处置步骤:

1. 用 iftop 或 nethogs 定位占用带宽最高的进程/连接；
2. K8s 节点上确认是否有 Pod 在做大量数据传输（备份、数据同步、镜像拉取）；
3. 确认是否已跑满网卡带宽，是则限流或错峰；
4. 异常流量的排查是否有配置错误导致的流量环路。

### 主机磁盘读取速率异常[​](#主机磁盘读取速率异常 "主机磁盘读取速率异常的直接链接")

主机异常磁盘读取率 (instance {{ $labels.instance }})

警告 · 5 分钟 · 触发条件:

```
sum by (instance) (rate(node_disk_read_bytes_total[2m])) / 1024 / 1024 > 50
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util；
2. 用 iotop -oP 找出 IO 最高的进程；
3. K8s 节点常见是容器日志写入、镜像拉取解压、或某个 Pod 的数据写入；
4. 可延后的任务错峰执行，持续高负载的换 SSD 或分散数据。

### 主机磁盘写入速率异常[​](#主机磁盘写入速率异常 "主机磁盘写入速率异常的直接链接")

主机异常磁盘写入率 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
sum by (instance) (rate(node_disk_written_bytes_total[2m])) / 1024 / 1024 > 50
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util；
2. 用 iotop -oP 找出 IO 最高的进程；
3. K8s 节点常见是容器日志写入、镜像拉取解压、或某个 Pod 的数据写入；
4. 可延后的任务错峰执行，持续高负载的换 SSD 或分散数据。

### 主机磁盘空间不足[​](#主机磁盘空间不足 "主机磁盘空间不足的直接链接")

主机磁盘空间不足 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 逐层找占用大的目录；
2. 容器运行时目录（/var/lib/containerd 或 /var/lib/docker）用 crictl rmi --prune 清理无用镜像；
3. 清理容器日志（/var/log/pods），并确认日志轮转配置生效；
4. 用 lsof +L1 检查已删除但句柄未释放的文件。

### 主机磁盘将在 24 小时内填满[​](#主机磁盘将在-24-小时内填满 "主机磁盘将在 24 小时内填满的直接链接")

主机磁盘将在 24 小时内填满 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) predict_linear(node_filesystem_avail_bytes{fstype!~"tmpfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

处置步骤:

1. 用 du -x --max-depth=1 找出增长最快的目录；
2. 确认增长来源是正常业务还是异常（应用死循环打日志、备份堆积）；
3. 清理无用镜像与容器日志；
4. 增长确实来自业务的，安排扩容磁盘或迁移数据，不要等到写满。

### 文件系统inode使用率高[​](#文件系统inode使用率高 "文件系统inode使用率高的直接链接")

主机不足 inode (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 文件系统inode将在24小时内填满[​](#文件系统inode将在24小时内填满 "文件系统inode将在24小时内填满的直接链接")

主机 inode 将在 24 小时内填满 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and predict_linear(node_filesystem_files_free{mountpoint="/rootfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

处置步骤:

1. 用 df -i 确认挂载点；
2. 逐层统计文件数找出小文件最多的目录；
3. K8s 节点常见是容器层与日志碎片，清理无用镜像通常能释放大量 inode；
4. 长期可提高 inode 密度或把小文件业务隔离到独立分区。

### 主机磁盘读取延迟异常[​](#主机磁盘读取延迟异常 "主机磁盘读取延迟异常的直接链接")

主机异常磁盘读取延迟 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m]) > 0.1 and rate(node_disk_reads_completed_total[1m]) > 0
```

处置步骤:

1. 用 iostat -x 1 看 r\_await/w\_await 与队列深度；
2. 延迟高但 IOPS 不高的怀疑磁盘硬件问题，用 smartctl -a 检查；
3. IOPS 也高的按磁盘饱和处理，定位高 IO 进程；
4. 云盘的确认是否触及规格的 IOPS/吞吐上限被限流。

### 主机磁盘写入延迟异常[​](#主机磁盘写入延迟异常 "主机磁盘写入延迟异常的直接链接")

主机异常磁盘写入延迟 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
rate(node_disk_write_time_seconds_total[1m]) / rate(node_disk_writes_completed_total[1m]) > 0.1 and rate(node_disk_writes_completed_total[1m]) > 0
```

处置步骤:

1. 用 iostat -x 1 看 r\_await/w\_await 与队列深度；
2. 延迟高但 IOPS 不高的怀疑磁盘硬件问题，用 smartctl -a 检查；
3. IOPS 也高的按磁盘饱和处理，定位高 IO 进程；
4. 云盘的确认是否触及规格的 IOPS/吞吐上限被限流。

### 节点cpu负载高[​](#节点cpu负载高 "节点cpu负载高的直接链接")

主机 CPU 负载高 (instance {{ $labels.instance }})

警告 · — · 触发条件:

```
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟趋势判断是突发还是持续；
2. top 里看 %wa，高说明瓶颈在磁盘而非 CPU；
3. vmstat 1 用 r/b 列区分 CPU 密集与 IO 阻塞；
4. K8s 节点上用 kubectl top pod 定位高负载 Pod 并考虑迁走。

### 有其他云主机窃取cpu[​](#有其他云主机窃取cpu "有其他云主机窃取cpu的直接链接")

Host CPU steal noisy neighbor (instance {{ $labels.instance }})

警告 · — · 触发条件:

```
avg by(instance) (rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100 > 10
```

处置步骤:

1. 用 top 或 vmstat 确认 st 列的持续水位；
2. 这是宿主机层面的资源争抢，虚拟机内部无法根治；
3. 云环境下联系云厂商或更换实例规格（独享型规格无 steal）；
4. 自建虚拟化的检查宿主机超卖比例并迁移虚机。

### 主机上下文切换异常[​](#主机上下文切换异常 "主机上下文切换异常的直接链接")

主机上下文切换 (instance {{ $labels.instance }})

警告 · — · 触发条件:

```
(rate(node_context_switches_total[5m])) / (count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})) > 1000
```

处置步骤:

1. 用 vmstat 1 确认 cs 列的水位；
2. 用 pidstat -w 1 找出切换最频繁的进程；
3. 常见根因是线程数过多、锁竞争激烈、或大量短生命周期进程；
4. 应用侧收敛线程池大小、优化锁粒度是根本解法。

### 主机交换内存快满了[​](#主机交换内存快满了 "主机交换内存快满了的直接链接")

主机交换内存已满 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80
```

处置步骤:

1. 用 free -h 与 swapon -s 确认 swap 使用情况；
2. 用 smem 或 /proc/\<pid>/status 的 VmSwap 找出换出最多的进程；
3. K8s 节点原则上应关闭 swap，开启会掩盖真实的内存压力并让 QoS 失效；
4. 根因是内存不足，按内存告警路径处理。

### 主机系统服务崩溃[​](#主机系统服务崩溃 "主机系统服务崩溃的直接链接")

主机 systemd 服务崩溃 (instance {{ $labels.instance }})

警告 · — · 触发条件:

```
node_systemd_unit_state{state="failed"} == 1
```

处置步骤:

1. systemctl --failed 列出失败单元；
2. journalctl -u \<unit> -n 100 --no-pager 定位原因；
3. K8s 节点上重点关注 kubelet、containerd、kube-proxy 这几个关键单元；
4. 修复后 systemctl reset-failed 清理状态并确认恢复。

### 主机内核版本偏差[​](#主机内核版本偏差 "主机内核版本偏差的直接链接")

主机内核版本偏差 (instance {{ $labels.instance }})

警告 · 360 分钟 · 触发条件:

```
count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1
```

处置步骤:

1. 用 kubectl get node -o wide 对比各节点内核版本；
2. 确认差异是升级过程中的临时状态还是长期存在；
3. 逐步把落后节点的内核升级对齐；
4. 升级前确认容器运行时与 CNI 插件对目标内核版本的兼容性。

### 检测到 HostOomKill[​](#检测到-hostoomkill "检测到 HostOomKill的直接链接")

检测到主机 OOM 终止 (instance {{ $labels.instance }})

警告 · — · 触发条件:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀进程与当时内存；
2. 对照 kubectl get pod -A 找出对应的 Pod，看是否是 limit 设置过低；
3. 节点整体内存紧张的迁走部分 Pod 或扩容；
4. 反复被杀的必须在应用侧定位内存泄漏，只调 limit 会反复复发。

### 主机网络接收错误[​](#主机网络接收错误 "主机网络接收错误的直接链接")

主机网络接收错误 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
rate(node_network_receive_errs_total[2m]) / rate(node_network_receive_packets_total[2m]) > 0.01
```

处置步骤:

1. 用 ip -s link show <网卡> 与 ethtool -S <网卡> 确认错包计数与类型；
2. 确认协商速率与双工模式和对端一致；
3. 检查网线/光模块，云环境下提工单给云厂商；
4. 有冗余的先把流量切走。

### 主机网络出口错误[​](#主机网络出口错误 "主机网络出口错误的直接链接")

主机网络传输错误 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
rate(node_network_transmit_errs_total[2m]) / rate(node_network_transmit_packets_total[2m]) > 0.01
```

处置步骤:

1. 用 ip -s link show <网卡> 与 ethtool -S <网卡> 确认错包计数与类型；
2. 确认协商速率与双工模式和对端一致；
3. 检查网线/光模块，云环境下提工单给云厂商；
4. 有冗余的先把流量切走。

### 主机网络接口饱和[​](#主机网络接口饱和 "主机网络接口饱和的直接链接")

主机网络接口饱和 (instance {{ $labels.instance }})

警告 · 1 分钟 · 触发条件:

```
(rate(node_network_receive_bytes_total{device!~"^tap.*"}[1m]) + rate(node_network_transmit_bytes_total{device!~"^tap.*"}[1m])) / node_network_speed_bytes{device!~"^tap.*"} > 0.8 < 10000
```

处置步骤:

1. 用 iftop/nethogs 定位占用带宽最高的连接；
2. K8s 节点上确认是否有大流量 Pod 或正在拉取大镜像；
3. 可错峰的任务调整执行时间；
4. 确需更高带宽的升级网卡或迁移部分工作负载。

### conntrack数量接近极限[​](#conntrack数量接近极限 "conntrack数量接近极限的直接链接")

主机连接限制 (instance {{ $labels.instance }})

警告 · 5 分钟 · 触发条件:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit > 0.8
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认水位；
2. K8s 节点上 kube-proxy 的 iptables 模式会产生大量 conntrack 条目，Pod 密度高时尤其明显；
3. 调大 nf\_conntrack\_max 并同步调大 buckets；
4. 长期可评估切换到 IPVS 模式减少 conntrack 压力。

### 主机时钟偏差[​](#主机时钟偏差 "主机时钟偏差的直接链接")

主机时钟偏差 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
(node_timex_offset_seconds > 0.05 and deriv(node_timex_offset_seconds[5m]) >= 0) or (node_timex_offset_seconds < -0.05 and deriv(node_timex_offset_seconds[5m]) <= 0)
```

处置步骤:

1. 用 chronyc tracking 确认偏移量与上游源状态；
2. 确认 chronyd/ntpd 服务在运行且开机自启；
3. 检查到 NTP 服务器的网络是否放行 123/UDP；
4. 偏移过大用 chronyc makestep 强制对时，之后确认所有节点时间一致。

### 主机时钟不同步[​](#主机时钟不同步 "主机时钟不同步的直接链接")

主机时钟不同步 (instance {{ $labels.instance }})

警告 · 2 分钟 · 触发条件:

```
min_over_time(node_timex_sync_status[1m]) == 0 and node_timex_maxerror_seconds >= 16
```

处置步骤:

1. 用 chronyc tracking 确认偏移量与上游源状态；
2. 确认 chronyd/ntpd 服务在运行且开机自启；
3. 检查到 NTP 服务器的网络是否放行 123/UDP；
4. 偏移过大用 chronyc makestep 强制对时，之后确认所有节点时间一致。

### 节点文件系统空间填满-S2[​](#节点文件系统空间填满-s2 "节点文件系统空间填满-S2的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up.

警告 · 60 分钟 · 触发条件:

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

### 节点文件系统空间填满-S1[​](#节点文件系统空间填满-s1 "节点文件系统空间填满-S1的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up fast.

紧急 · 60 分钟 · 触发条件:

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

### 节点磁盘快满了-S2-space-5[​](#节点磁盘快满了-s2-space-5 "节点磁盘快满了-S2-space-5的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

警告 · 60 分钟 · 触发条件:

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

### 节点磁盘快满了-S1-space-3[​](#节点磁盘快满了-s1-space-3 "节点磁盘快满了-S1-space-3的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

紧急 · 60 分钟 · 触发条件:

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

### 节点磁盘快满了-S2-inodes-40[​](#节点磁盘快满了-s2-inodes-40 "节点磁盘快满了-S2-inodes-40的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up.

警告 · 60 分钟 · 触发条件:

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

### 节点磁盘快满了-S1-inodes-20[​](#节点磁盘快满了-s1-inodes-20 "节点磁盘快满了-S1-inodes-20的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up fast.

紧急 · 60 分钟 · 触发条件:

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

### 节点磁盘快满了-S2-inodes-5[​](#节点磁盘快满了-s2-inodes-5 "节点磁盘快满了-S2-inodes-5的直接�链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

警告 · 60 分钟 · 触发条件:

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

### 节点磁盘快满了-S1-inodes-3[​](#节点磁盘快满了-s1-inodes-3 "节点磁盘快满了-S1-inodes-3的直接链接")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

紧急 · 60 分钟 · 触发条件:

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

### 使用的节点Conntrack条目数量高[​](#使用的节点conntrack条目数量高 "使用的节点Conntrack条目数量高的直接链接")

{{ $value | humanizePercentage }} of conntrack entries are used.

警告 · — · 触发条件:

```
(node_nf_conntrack_entries / node_nf_conntrack_entries_limit) > 0.75
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认水位；
2. K8s 节点上 kube-proxy 的 iptables 模式会产生大量 conntrack 条目，Pod 密度高时尤其明显；
3. 调大 nf\_conntrack\_max 并同步调大 buckets；
4. 长期可评估切换到 IPVS 模式减少 conntrack 压力。

### 节点文本文件收集器抓取错误[​](#节点文本文件收集器抓取错误 "节点文本文件收集器抓取错误的直接链接")

Node Exporter text file collector failed to scrape.

警告 · — · 触发条件:

```
node_textfile_scrape_error{job="node-exporter"} == 1
```

处置步骤:

1. 检查 textfile 目录下的 .prom 文件权限与格式；
2. 写入方通常是 cron 脚本，确认脚本执行成功且用原子写（先写 .tmp 再 mv）；
3. 格式错误的用 promtool check metrics 校验；
4. 清理残留的临时文件，它们会导致解析失败。

### 节点网络接口抖动[​](#节点网络接口抖动 "节点网络接口抖动的直接链接")

Network interface "{{ $labels.device }}" changing it's up status often on node-exporter {{ $labels.namespace }}/{{ $labels.pod }}"

警告 · 2 分钟 · 触发条件:

```
changes(node_network_up{job="node-exporter",device!~"veth.+"}[2m]) > 2
```

处置步骤:

1. 用 dmesg -T | grep -i 'link is' 看抖动时间线；
2. 检查网线/光模块，抖动多为物理层接触不良；
3. 确认协商速率与双工模式和对端一致；
4. 联系网络侧确认交换机端口状态，云环境下提工单。

### A certain disk is unable to read/write normally[​](#a-certain-disk-is-unable-to-readwrite-normally "A certain disk is unable to read/write normally的直接链接")

紧急 · 1 分钟 · 触发条件:

```
(node_filesystem_device_error{mountpoint!~"/var/lib/.*",mountpoint!~"/run.*"}) > 0
```

处置步骤:

1. 用 dmesg -T | grep -iE 'i/o error|ata|scsi' 看内核报的具体错误与设备名；
2. 用 smartctl -a /dev/sdX 看 SMART 属性，重点关注 Reallocated\_Sector\_Ct 与 Current\_Pending\_Sector；
3. 确认该盘上的数据是否有副本或备份，优先保证数据安全再处理硬件；
4. 确认为硬件故障的，安排停机换盘，RAID 环境下先确认阵列降级状态再操作。

### Disk needs to be cleaned - utilization has reached 92% - node exporter[​](#disk-needs-to-be-cleaned---utilization-has-reached-92---node-exporter "Disk needs to be cleaned - utilization has reached 92% - node exporter的直接链接")

紧急 · 1 分钟 · 触发条件:

```
(100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) ) > 92
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 <挂载点> | sort -h 找出占用最大的目录；
2. 系统盘常见是 /var/log 与容器镜像层（docker system df 看占用，docker system prune 清理）；
3. 用 lsof +L1 检查已删除但句柄未释放的文件；
4. 长期需扩容或把大数据目录迁到独立磁盘。

### Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter[​](#insufficient-computational-resources---average-load-per-core-of-the-machine-is-greater-than-10---node-exporter "Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
avg (node_load1) by (instance)/count(count(node_cpu_seconds_total) by (cpu,instance)) by (instance) >10
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟负载趋势，判断是突发还是持续；
2. 用 top 看 %wa（IO 等待）——高说明瓶颈在磁盘而非 CPU，按磁盘 IO 处理；
3. 用 vmstat 1 看 r（运行队列）与 b（阻塞）列区分 CPU 密集与 IO 阻塞；
4. 定位到具体进程后按 CPU 或 IO 的路径继续排查，必要时扩容。

### Insufficient file handles - usage exceeds 90% - node exporter[​](#insufficient-file-handles---usage-exceeds-90---node-exporter "Insufficient file handles - usage exceeds 90% - node exporter的直接链接")

You can increase the file handle limit or expand the capacity

警告 · 1 分钟 · 触发条件:

```
(node_filefd_allocated/node_filefd_maximum*100) > 90
```

处置步骤:

1. 用 cat /proc/sys/fs/file-nr 确认已分配与上限；
2. 用 lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head 找出占用句柄最多的进程；
3. 应急调大：sysctl -w fs.file-max=<更大值>，并检查该进程的 ulimit -n 与 systemd LimitNOFILE；
4. 根因通常是连接或文件未关闭，需在应用侧修复泄漏。

### Insufficient inode resources - usage exceeds 90% - node exporter[​](#insufficient-inode-resources---usage-exceeds-90---node-exporter "Insufficient inode resources - usage exceeds 90% - node exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
(100 - ((node_filesystem_files_free * 100) / node_filesystem_files))>90
```

处置步骤:

1. 用 df -i 确认是哪个挂载点的 inode 吃紧；
2. 用 for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head 逐层找出小文件最多的目录；
3. 常见来源是 session 文件、邮件队列、缓存碎片、未清理的容器层——按业务确认后批量删除；
4. 长期可在格式化时调大 inode 密度，或把小文件业务迁到独立分区。

### Insufficient memory resources - utilization is greater than 75% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-75---node-exporter "Insufficient memory resources - utilization is greater than 75% - node exporter的直接链接")

Expansion or upgrading of configuration is required

警告 · 1 分钟 · 触发条件:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 75
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
2. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
3. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop\_caches 释放 page cache（生产慎用）；
4. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### Insufficient memory resources - utilization is greater than 95% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-95---node-exporter "Insufficient memory resources - utilization is greater than 95% - node exporter的直接链接")

紧急 · 1 分钟 · 触发条件:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 95
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
2. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
3. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop\_caches 释放 page cache（生产慎用）；
4. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### Packet loss in the inbound direction of the network card - node exporter[​](#packet-loss-in-the-inbound-direction-of-the-network-card---node-exporter "Packet loss in the inbound direction of the network card - node exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
rate(node_network_receive_drop_total{device=~"e.*"}[1m]) > 3
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 RX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体丢包原因（rx\_no\_buffer、rx\_missed\_errors 等）；
3. 环形缓冲区不足可用 ethtool -G <网卡> rx <更大值> 调大，并检查 net.core.netdev\_max\_backlog；
4. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

### Packet loss in the outbound direction of the network card - node exporter[​](#packet-loss-in-the-outbound-direction-of-the-network-card---node-exporter "Packet loss in the outbound direction of the network card - node exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
rate(node_network_transmit_drop_total{device=~"e.*"}[1m]) > 3
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 TX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体计数，并用 tc -s qdisc show dev <网卡> 看队列是否溢出；
3. 发送队列不足可调大 txqueuelen 与 ethtool -G <网卡> tx；
4. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

### System conntrack needs to be adjusted - usage exceeds 80% - node exporter[​](#system-conntrack-needs-to-be-adjusted---usage-exceeds-80---node-exporter "System conntrack needs to be adjusted - usage exceeds 80% - node exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit*100 > 80
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认当前水位；
2. 用 conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn 看连接集中在哪类协议或来源；
3. 应急调大：sysctl -w net.netfilter.nf\_conntrack\_max=<更大值>，并同步调大 nf\_conntrack\_buckets；
4. 同时缩短 nf\_conntrack\_tcp\_timeout\_time\_wait 等超时，或对不需要跟踪的流量用 iptables raw 表 NOTRACK。

### System experiences OOM - node exporter[​](#system-experiences-oom---node-exporter "System experiences OOM - node exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀的是哪个进程、当时占用多少内存；
2. 用 free -h 与该进程的内存曲线判断是内存泄漏还是配置的上限过高；
3. 给关键进程调整 oom\_score\_adj 降低被杀优先级，同时给次要进程设 cgroup 内存上限；
4. 根因是泄漏的要在应用侧抓堆定位，只扩内存会反复复发。

### Too many running processes - exceeding 3000 - node exporter[​](#too-many-running-processes---exceeding-3000---node-exporter "Too many running processes - exceeding 3000 - node exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
node_procs_running > 3000
```

处置步骤:

1. 用 ps -eo ppid | sort | uniq -c | sort -rn | head 找出 fork 子进程最多的父进程；
2. 确认是正常的多进程模型（如 php-fpm、nginx worker）还是失控 fork；
3. 失控的先停掉该父进程止血，再修复代码里的 fork 逻辑；
4. 正常业务增长则调整 worker 数配置并评估是否需要扩容。

## Categraf（24）[​](#categraf24 "Categraf（24）的直接链接")

适用于用 Categraf 采集的主机和实例，指标名遵循 Categraf 插件。

本组 24 条中有 8 条规则对用 Telegraf 采集的实例同样适用，指标名完全一致。

### Conntrack表的使用率超过80%[​](#conntrack表的使用率超过80 "Conntrack表的使用率超过80%的直接链接")

警告 · 1 分钟 · 触发条件:

```
conntrack_ip_conntrack_count / conntrack_ip_conntrack_max > 0.8
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认当前水位；
2. 用 conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn 看连接集中在哪类协议或来源；
3. 应急调大：sysctl -w net.netfilter.nf\_conntrack\_max=<更大值>，并同步调大 nf\_conntrack\_buckets；
4. 同时缩短 nf\_conntrack\_tcp\_timeout\_time\_wait 等超时，或对不需要跟踪的流量用 iptables raw 表 NOTRACK。

### CPU利用率较高[​](#cpu利用率较高 "CPU利��用率较高的直接链接")

提醒 · 1 分钟 · 触发条件:

```
cpu_usage_active>75



cpu_usage_active>85



cpu_usage_active>95
```

处置步骤:

1. 用 top -H 或 pidstat 1 找出占用最高的进程与线程；
2. 用 perf top 或对应语言的 profiler（Java 用 arthas/async-profiler，Go 用 pprof）定位热点函数；
3. 区分是业务量自然增长还是代码异常（死循环、正则回溯、频繁 GC）；
4. 业务量增长则扩容或限流，代码问题则修复后发布。

### HTTP地址探测失败[​](#http地址探测失败 "HTTP地址探测失败的直接链接")

警告 · 1 分钟 · 触发条件:

```
http_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 curl -sv <目标URL> 复现，看是连接失败、超时还是状态码不符；
2. 连接失败则先确认目标端口通、进程活；
3. 状态码不符则看目标服务日志定位；
4. 确认探测配置里的超时、期望状态码、证书校验设置是否与实际相符，避免配置导致的误报。

### IO比较繁忙[​](#io比较繁忙 "IO比较繁忙的直接链接")

警告 · 1 分钟 · 触发条件:

```
rate(diskio_io_time[1m])/10 > 99
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util 的具体数值；
2. 用 iotop -oP 或 pidstat -d 1 找出占用 IO 最高的进程；
3. 常见元凶是数据库大查询、备份任务、日志刷盘——把可延后的任务错峰执行；
4. 若是持续高负载而非突发，考虑换 SSD 或把热数据分散到多块盘。

### NTP时间偏移太大[​](#ntp时间偏移太大 "NTP时间偏移太大的直接链接")

警告 · 1 分钟 · 触发条件:

```
ntp_offset_ms > 1000 or ntp_offset_ms < -1000
```

处置步骤:

1. 用 chronyc tracking（或 ntpq -p）确认当前偏移量与上游源状态；
2. 上游不可达则检查网络与防火墙是否放行 123/UDP；
3. 用 chronyc sources -v 确认是否所有源都被标记为不可用，必要时更换 NTP 服务器；
4. 偏移过大时 chrony 会拒绝平滑校正，需用 chronyc makestep 强制对时（注意对时间敏感的业务先做好准备）。

### PING地址探测失败[​](#ping地址探测失败 "PING地址探测失败的直接链接")

警告 · 1 分钟 · 触发条件:

```
ping_result_code != 0
```

处置步骤:

1. 在采集机上手工 ping -c 5 <目标> 复现，再用 mtr -n <目标> 定位丢包出现在哪一跳；
2. 目标机若存活，确认它是否禁 ICMP（很多安全策略会禁），是则该探测本身不适用，应改用端口探测；
3. 中间跳丢包的联系网络侧排查；
4. 确认目标机自身是否宕机或网卡故障。

### TME\_WAIT状态的连接超过2万，可能需要关注[​](#tme_wait状态的连接超过2万可能需要关注 "TME_WAIT状态的连接超过2万，可能需要关注的直接链接")

警告 · 1 分钟 · 触发条件:

```
netstat_tcp_time_wait > 20000
```

处置步骤:

1. 用 ss -s 确认各状态连接数分布；
2. 用 ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn 看集中在哪个目标；
3. 根因通常是短连接过多——在应用侧改用长连接或连接池，这是最有效的手段；
4. 应急可开启 net.ipv4.tcp\_tw\_reuse=1 并调大 net.ipv4.ip\_local\_port\_range（不要开 tcp\_tw\_recycle，NAT 环境下会丢包）。

### 内存利用率比较高[​](#内存利用率比较高 "内存利用率比较高的直接链接")

提醒 · 1 分钟 · 触发条件:

```
mem_available_percent < 25



mem_available_percent < 15



mem_available_percent < 5
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
2. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
3. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop\_caches 释放 page cache（生产慎用）；
4. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### 文件句柄使用率超过90%[​](#文件句柄使用率超过90 "文件句柄使用率超过90%的直接链接")

警告 · 1 分钟 · 触发条件:

```
linux_sysctl_fs_file_nr/linux_sysctl_fs_file_max>0.9
```

处置步骤:

1. 用 cat /proc/sys/fs/file-nr 确认已分配与上限；
2. 用 lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head 找出占用句柄最多的进程；
3. 应急调大：sysctl -w fs.file-max=<更大值>，并检查该进程的 ulimit -n 与 systemd LimitNOFILE；
4. 根因通常是连接或文件未关闭，需在应用侧修复泄漏。

### 每个CPU Core的平均负载任务超过3[​](#每个cpu-core的平均负载任务超过3 "每个CPU Core的平均负载任务超过3的直接链接")

警告 · 1 分钟 · 触发条件:

```
system_load_norm_1>3
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟负载趋势，判断是突发还是持续；
2. 用 top 看 %wa（IO 等待）——高说明瓶颈在磁盘而非 CPU，按磁盘 IO 处理；
3. 用 vmstat 1 看 r（运行队列）与 b（阻塞）列区分 CPU 密集与 IO 阻塞；
4. 定位到具体进程后按 CPU 或 IO 的路径继续排查，必要时扩容。

### 硬盘监控 - inode使用率超过90%[​](#硬盘监控---inode使用率超过90 "硬盘监控 - inode使用率超过90%的直接链接")

警告 · 1 分钟 · 触发条件:

```
disk_inodes_used/disk_inodes_total >0.9
```

处置步骤:

1. 用 df -i 确认是哪个挂载点的 inode 吃紧；
2. 用 for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head 逐层找出小文件最多的目录；
3. 常见来源是 session 文件、邮件队列、缓存碎片、未清理的容器层——按业务确认后批量删除；
4. 长期可在格式化时调大 inode 密度，或把小文件业务迁到独立分区。

### 硬盘监控 - 大于200G的盘，空间不足了[​](#硬盘监控---大于200g的盘空间不足了 "硬盘监控 - 大于200G的盘，空间不足了的直接链接")

提醒 · 1 分钟 · 触发条件:

```
disk_free/1024/1024/1024 < 20 and disk_total/1024/1024/1024 >= 200



disk_free/1024/1024/1024 < 10 and disk_total/1024/1024/1024 >= 200



disk_free/1024/1024/1024 < 2 and disk_total/1024/1024/1024 >= 200
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 <挂载点> | sort -h 找出占用最大的目录；
2. 清理日志与过期数据，注意用 lsof +L1 检查已删除但未释放的文件；
3. 评估是否该把数据目录迁到独立磁盘或加盘扩容；
4. 若是数据库或对象存储的数据盘，按业务侧的归档策略下沉冷数据。

### 硬盘监控 - 小于200G的盘，空间不足了[​](#硬盘监控---小于200g的盘空间不足了 "硬盘监控 - 小于200G的盘，空间不足了的直接链接")

提醒 · 1 分钟 · 触发条件:

```
disk_used_percent > 90 and disk_total/1024/1024/1024 < 200



disk_used_percent > 95 and disk_total/1024/1024/1024 < 200



disk_used_percent > 99 and disk_total/1024/1024/1024 < 200
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 <挂载点> | sort -h 找出占用最大的目录；
2. 系统盘常见是 /var/log 与容器镜像层（docker system df 看占用，docker system prune 清理）；
3. 用 lsof +L1 检查已删除但句柄未释放的文件；
4. 长期需扩容或把大数据目录迁到独立磁盘。

### 硬盘监控 - 设备有报错[​](#硬盘监控---设备有报错 "硬盘监控 - 设备有报错的直接链接")

警告 · 1 分钟 · 触发条件:

```
disk_device_error>0
```

处置步骤:

1. 用 dmesg -T | grep -iE 'i/o error|ata|scsi' 看内核报的具体错误与设备名；
2. 用 smartctl -a /dev/sdX 看 SMART 属性，重点关注 Reallocated\_Sector\_Ct 与 Current\_Pending\_Sector；
3. 确认该盘上的数据是否有副本或备份，优先保证数据安全再处理硬件；
4. 确认为硬件故障的，安排停机换盘，RAID 环境下先确认阵列降级状态再操作。

### 硬盘监控 - 预测硬盘会在未来4小时内写满[​](#硬盘监控---预测硬盘会在未来4小时内写满 "硬盘监控 - 预测硬盘会在未来4小时内写满的直接链接")

紧急 · 1 分钟 · 触发条件:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

处置步骤:

1. 用 df -h 确认是哪个挂载点，再用 du -x --max-depth=1 <挂载点> | sort -h 逐层找出增长最快的目录；
2. 优先清理日志（journalctl --vacuum-size=500M、清 \*.log.N）与临时文件，这是最快见效的；
3. 用 lsof +L1 找出已删除但句柄未释放的文件，重启对应进程才能真正释放空间；
4. 确认是否有异常写入（应用死循环打日志、备份任务堆积），不解决根因清理只是拖延。

### 系统有OOM产生[​](#系统有oom产生 "系统有OOM产生的直接链接")

警告 · — · 触发条件:

```
increase(kernel_vmstat_oom_kill[2m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀的是哪个进程、当时占用多少内存；
2. 用 free -h 与该进程的内存曲线判断是内存泄漏还是配置的上限过高；
3. 给关键进程调整 oom\_score\_adj 降低被杀优先级，同时给次要进程设 cgroup 内存上限；
4. 根因是泄漏的要在应用侧抓堆定位，只扩内存会反复复发。

### 网卡监控 - 入方向有丢包[​](#网卡监控---入方向有丢包 "网卡监控 - 入方向有丢包的直接链接")

提醒 · 1 分钟 · 触发条件:

```
increase(net_drop_in[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 RX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体丢包原因（rx\_no\_buffer、rx\_missed\_errors 等）；
3. 环形缓冲区不足可用 ethtool -G <网卡> rx <更大值> 调大，并检查 net.core.netdev\_max\_backlog；
4. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

### 网卡监控 - 入方向有错包[​](#网卡监控---入方向有错包 "网卡监控 - 入方向有错包的直接链接")

提醒 · 1 分钟 · 触发条件:

```
increase(net_err_in[1m]) > 0
```

处置步骤:

1. 用 ethtool -S <网卡> 看 rx\_crc\_errors、rx\_frame\_errors 等具体计数；
2. 用 ethtool <网卡> 确认协商的速率与双工模式是否与对端一致（半双工是经典错包源）；
3. 检查网线/光模块，必要时换线或换口做交叉验证；
4. 联系网络侧确认交换机对应端口的错包计数。

### 网卡监控 - 出方向有丢包[​](#网卡监控---出方向有丢包 "网卡监控 - 出方向有丢包的直接链接")

提醒 · 1 分钟 · 触发条件:

```
increase(net_drop_out[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 TX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体计数，并用 tc -s qdisc show dev <网卡> 看队列是否溢出；
3. 发送队列不足可调大 txqueuelen 与 ethtool -G <网卡> tx；
4. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

### 网卡监控 - 出方向有错包[​](#网卡监控---出方向有错包 "网卡监控 - 出方向有错包的直接链接")

提醒 · 1 分钟 · 触发条件:

```
increase(net_err_out[1m]) > 0
```

处置步骤:

1. 用 ethtool -S <网卡> 看 tx\_errors、tx\_carrier\_errors 等具体计数；
2. 用 ethtool <网卡> 确认速率与双工模式与对端一致；
3. 检查网线/光模块并做交叉验证；
4. 确认网卡驱动与固件版本，必要时升级。

### 网络地址探活失败[​](#网络地址探活失败 "网络地址探活失败的直接链接")

警告 · 1 分钟 · 触发条件:

```
net_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 telnet <目标> <端口> 或 nc -vz <目标> <端口> 复现；
2. 到目标机用 ss -lntp | grep <端口> 确认进程是否在监听；
3. 进程在监听则排查防火墙、安全组、以及是否只绑定了 127.0.0.1；
4. 进程不在则按该服务自身的恢复流程拉起。

### 进程监控-有进程数为0，某进程可能挂了[​](#进程监控-有进程数为0某进程可能挂了 "进程监控-有进程数为0，某进程可能挂了的直接链接")

紧急 · 1 分钟 · 触发条件:

```
procstat_lookup_count == 0
```

处置步骤:

1. 用 ps -ef | grep <进程关键字> 确认确实不在，排除采集侧的匹配规则写错；
2. 查该进程的日志与 dmesg -T | grep -i 'killed process'，区分自身崩溃、被 OOM 杀死还是人工停止；
3. 按服务自身流程拉起，并确认 systemd 的 Restart 策略是否生效；
4. 若反复退出，先定位根因再拉起，避免陷入重启循环。

### 进程监控-进程句柄限制过小[​](#进程监控-进程句柄限制过小 "进程监控-进程句柄限制过小的直接链接")

提醒 · 1 分钟 · 触发条件:

```
procstat_rlimit_num_fds_soft < 2048
```

处置步骤:

1. 用 cat /proc/\<pid>/limits 确认 Max open files 的软硬上限；
2. systemd 管理的服务在 unit 文件里加 LimitNOFILE=65535 后 systemctl daemon-reload 并重启；
3. 非 systemd 的在启动脚本里加 ulimit -n 65535，或改 /etc/security/limits.conf；
4. 注意软上限修改后必须重启进程才生效。

### 进程监控-进程总量超过600[​](#进程监控-进程总量超过600 "进程监控-进程总量超过600的直接链接")

警告 · 1 分钟 · 触发条件:

```
processes_total > 600
```

处置步骤:

1. 用 ps -eo ppid | sort | uniq -c | sort -rn | head 找出 fork 子进程最多的父进程；
2. 确认是正常的多进程模型（如 php-fpm、nginx worker）还是失控 fork；
3. 失控的先停掉该父进程止血，再修复代码里的 fork 逻辑；
4. 正常业务增长则调整 worker 数配置并评估是否需要扩容。

## Telegraf（4）[​](#telegraf4 "Telegraf（4）的直接链接")

适用于用 Telegraf 采集、以 Prometheus 格式输出的主机。

### Machine load - high CPU, please pay attention - telegraf[​](#machine-load---high-cpu-please-pay-attention---telegraf "Machine load - high CPU, please pay attention - telegraf的直接链接")

提醒 · 1 分钟 · 触发条件:

```
cpu_usage_idle{cpu="cpu-total"} < 25
```

处置步骤:

1. 用 top -H 或 pidstat 1 找出占用最高的进程与线程；
2. 用 perf top 或对应语言的 profiler（Java 用 arthas/async-profiler，Go 用 pprof）定位热点函数；
3. 区分是业务量自然增长还是代码异常（死循环、正则回溯、频繁 GC）；
4. 业务量增长则扩容或限流，代码问题则修复后发布。

### Machine load - high memory, please pay attention - telegraf[​](#machine-load---high-memory-please-pay-attention---telegraf "Machine load - high memory, please pay attention - telegraf的直接链接")

警告 · 1 分钟 · 触发条件:

```
mem_available_percent < 25
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
2. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
3. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop\_caches 释放 page cache（生产慎用）；
4. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

### Process monitoring - lookup failure - telegraf[​](#process-monitoring---lookup-failure---telegraf "Process monitoring - lookup failure - telegraf的直接链接")

紧急 · 1 分钟 · 触发条件:

```
procstat_lookup_result_code != 0
```

处置步骤:

1. 在采集机上按配置的匹配方式手工执行 ps/pgrep 复现；
2. 进程确实不在则按服务恢复流程处理；
3. 进程在但探测失败，检查 procstat 配置的 pid\_file、exe、pattern 是否写错，以及采集账号是否有权限读取 /proc；
4. 容器环境下确认 categraf 是否挂载了宿主机的 /proc。

### there are processes with 0 count, a certain process may have crashed - telegraf[​](#there-are-processes-with-0-count-a-certain-process-may-have-crashed---telegraf "there are processes with 0 count, a certain process may have crashed - telegraf的直接链接")

紧急 · 1 分钟 · 触发条件:

```
procstat_lookup_running == 0
```

处置步骤:

1. 用 ps -ef | grep <进程关键字> 确认确实不在，排除采集侧的匹配规则写错；
2. 查该进程的日志与 dmesg -T | grep -i 'killed process'，区分自身崩溃、被 OOM 杀死还是人工停止；
3. 按服务自身流程拉起，并确认 systemd 的 Restart 策略是否生效；
4. 若反复退出，先定位根因再拉起，避免陷入重启循环。

## 怎么使用这些规则[​](#怎么使用这些规则 "怎么使用这些规则的直接链接")

* **用 Prometheus 或 vmalert**：下载 [`linux.yml`](https://n9e.github.io/zh/alert-rules/linux.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页；有单独页面的规则指向它自己的页面。
* **用夜莺**：同样的规则内置在 [Kubernetes](https://n9e.github.io/zh/integrations/kubernetes.md)、[Linux](https://n9e.github.io/zh/integrations/linux.md) 集成模板里。在集成中心把规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

不少规则表达式改编自 [awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts)（CC BY 4.0）。 处置步骤和其余规则来自夜莺的集成模板（[Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes)、[Linux](https://github.com/ccfos/nightingale/tree/main/integrations/Linux)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* [用夜莺监控 Kubernetes](https://n9e.github.io/zh/integrations/kubernetes.md)：采集配置、仪表盘与指标说明
* [用夜莺监控 Linux](https://n9e.github.io/zh/integrations/linux.md)：采集配置、仪表盘与指标说明
* [在夜莺里写指标告警规则](https://n9e.github.io/zh/docs/alerting/metric-rules.md)
* [全部告警规则](https://n9e.github.io/zh/alert-rules.md)
