# 用夜莺监控 Windows

Categraf 在 Windows 上采集的指标和 Linux 同名，主机仪表盘与规则可以复用；另有按 windows\_exporter 指标写的 AD、DNS、ADFS 仪表盘。

最后校对于 2026-10-13

Categraf 同样支持 Windows，而且 CPU、内存、磁盘、网络这些基础指标的命名和 Linux 保持一致，所以主机类的告警规则和仪表盘不用为 Windows 另写一份。

模板里还有一组按 windows\_exporter 指标名写的仪表盘，覆盖 Windows Server 本身以及 Active Directory、DNS、ADFS 这几个常见的 Windows 服务。用 Categraf 就导「by Categraf」那张，用 windows\_exporter 就导「exporter」那组。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **6 张仪表盘**，共 203 个面板
* **14 条告警规则**，每条附处置步骤

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

Categraf 的 Windows 版本以服务方式安装，步骤见 [Categraf 安装](https://n9e.github.io/zh/docs/data/categraf/install.md)。基础插件默认开启，不需要为 Windows 单独写采集配置。用 windows\_exporter 的话，用 Categraf 的 `prometheus` 插件抓 `http://<host>:9182/metrics`，或把已有的 Prometheus [接成数据源](https://n9e.github.io/zh/docs/data/prometheus.md)。

1. 在夜莺「集成中心」里找到 Windows，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                               | 面板数 |
| ------------------------------------ | ------ |
| Active Directory Federation Services | 53     |
| Active Directory                     | 67     |
| DNS                                  | 18     |
| Windows Server                       | 21     |
| Windows Host by Categraf             | 24     |
| Windows - exporter                   | 20     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 14 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（8）[​](#categraf-采集8 "Categraf 采集（8）的直接链接")

#### Hard disk - expected to be written full in 4 hours - categraf \[Windows][​](#hard-disk---expected-to-be-written-full-in-4-hours---categraf-windows "Hard disk - expected to be written full in 4 hours - categraf \[Windows]的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
predict_linear(disk_free{platform=~"windows"}[1h], 4*3600) < 0
```

处置步骤:

1. 在资源管理器或用 Get-PSDrive 确认是哪个盘符；
2. 用 Get-ChildItem <盘符>\ -Recurse -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20 找出增长最快的大文件；
3. 优先清理日志、临时文件（运行 cleanmgr）与 Windows 更新缓存 C:\Windows\SoftwareDistribution\Download；
4. 确认是否有异常写入（应用死循环打日志、备份任务堆积），不解决根因清理只是拖延。

#### Hard disk - IO is a bit busy - categraf \[Windows][​](#hard-disk---io-is-a-bit-busy---categraf-windows "Hard disk - IO is a bit busy - categraf \[Windows]的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(diskio_io_time{platform=~"windows"}[1m])/10 > 99
```

处置步骤:

1. 打开资源监视器（resmon）的「磁盘」页，按「响应时间」排序看是哪块盘、哪个文件；
2. 用 Get-Counter '\PhysicalDisk(\*)\Avg. Disk sec/Transfer' 确认平均响应时间；
3. 在资源监视器里定位 IO 最高的进程，常见是数据库、备份任务、杀毒软件全盘扫描；
4. 可延后的任务错峰执行，持续高负载则考虑换 SSD 或分散数据。

#### Lost connection with monitoring target - categraf \[Windows][​](#lost-connection-with-monitoring-target---categraf-windows "Lost connection with monitoring target - categraf \[Windows]的直接链接")

触发条件:

```
```

处置步骤:

1. 先确认机器本身是否存活（ping、远程桌面），宕机要按宕机处理；
2. 机器存活则用 Get-Service categraf 确认服务状态，未运行则 Start-Service categraf；
3. 看 categraf 日志目录下的日志定位，常见是配置错误或到服务端的网络/认证不通；
4. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

#### Machine load - high memory, please pay attention - categraf\[Windows][​](#machine-load---high-memory-please-pay-attention---categrafwindows "Machine load - high memory, please pay attention - categraf\[Windows]的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
mem_available_percent{platform=~"windows"} < 25



mem_available_percent{platform=~"windows"} < 15



mem_available_percent{platform=~"windows"} < 5
```

处置步骤:

1. 运行 Get-Process | Sort-Object WS -Descending | Select-Object -First 10 找出占用最高的进程；
2. 用 perfmon 看 Available MBytes 与 Pages/sec，Pages/sec 持续高说明已在频繁换页；
3. 判断是业务增长还是进程泄漏——泄漏需在应用侧定位，重启只是临时缓解；
4. 确认页面文件大小配置合理，必要时扩内存。

#### packet loss in the inbound direction - categraf\[Windows][​](#packet-loss-in-the-inbound-direction---categrafwindows "packet loss in the inbound direction - categraf\[Windows]的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_in{platform=~"windows"}[1m]) > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认收包丢弃与错误计数的增长；
2. 用 Get-NetAdapterAdvancedProperty 检查接收缓冲区（Receive Buffers）设置，偏小可调大；
3. 用 Get-NetAdapter 确认协商速率与双工模式和对端一致；
4. 更新网卡驱动，并联系网络侧确认交换机端口的丢包计数。

#### packet loss in the outbound direction - categraf \[Windows][​](#packet-loss-in-the-outbound-direction---categraf-windows "packet loss in the outbound direction - categraf \[Windows]的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_out{platform=~"windows"}[1m]) > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认发包丢弃与错误计数的增长；
2. 用 Get-NetAdapterAdvancedProperty 检查发送缓冲区（Transmit Buffers）设置；
3. 确认是否已跑满带宽（资源监视器「网络」页），是则限流或扩带宽；
4. 更新网卡驱动并检查对端交换机端口状态。

#### 大于200G的盘，空间不足了\[Windows][​](#大于200g的盘空间不足了windows "大于200G的盘，空间不足了\[Windows]的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
disk_free{platform=~"windows"}/1024/1024/1024 < 20 and disk_total{platform=~"windows"}/1024/1024/1024 >= 200



disk_free{platform=~"windows"}/1024/1024/1024 < 10 and disk_total{platform=~"windows"}/1024/1024/1024 >= 200



disk_free{platform=~"windows"}/1024/1024/1024 < 2 and disk_total{platform=~"windows"}/1024/1024/1024 >= 200
```

处置步骤:

1. 用 Get-PSDrive 确认盘符与剩余空间；
2. 用 TreeSize 之类工具或 Get-ChildItem <盘符>\ -Recurse -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20 找出占用最大的文件与目录；
3. 清理日志与过期数据，数据盘按业务侧归档策略下沉冷数据；
4. 评估是否需要扩容磁盘或把数据目录迁到其他卷。

#### 小于200G的盘，空间不足了\[Windows][​](#小于200g的盘空间不足了windows "小于200G的盘，空间不足了\[Windows]的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
disk_used_percent{platform=~"windows"} > 90 and disk_total{platform=~"windows"}/1024/1024/1024 < 200



disk_used_percent{platform=~"windows"} > 95 and disk_total{platform=~"windows"}/1024/1024/1024 < 200



disk_used_percent{platform=~"windows"} > 99 and disk_total{platform=~"windows"}/1024/1024/1024 < 200
```

处置步骤:

1. 用 Get-PSDrive 确认盘符与剩余空间；
2. 系统盘常见占用是 Windows 更新缓存（C:\Windows\SoftwareDistribution\Download）、休眠文件 hiberfil.sys、页面文件；
3. 运行 cleanmgr /sdclean 做磁盘清理，必要时用 powercfg /h off 关闭休眠释放空间；
4. 长期需扩容或把大数据目录迁到其他卷。

### Exporter 采集（6）[​](#exporter-采集6 "Exporter 采集（6）的直接链接")

#### High CPU utilization - exporter[​](#high-cpu-utilization---exporter "High CPU utilization - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
100 * sum by (instance) (rate(windows_cpu_time_total{mode != 'idle'}[5m])) / count by (instance) (windows_cpu_core_frequency_mhz) > 80
```

处置步骤:

1. 打开任务管理器或运行 Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 找出占用最高的进程；
2. 用资源监视器（resmon）看是用户态还是内核态占用高，内核态高要排查驱动与杀毒软件；
3. 区分业务量增长与程序异常（死循环、频繁 GC）；
4. 业务增长则扩容或限流，异常则重启对应服务并修复。

#### High memory usage rate - exporter[​](#high-memory-usage-rate---exporter "High memory usage rate - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
100 * (windows_cs_physical_memory_bytes - windows_os_physical_memory_free_bytes) / windows_cs_physical_memory_bytes  > 80
```

处置步骤:

1. 运行 Get-Process | Sort-Object WS -Descending | Select-Object -First 10 找出占用最高的进程；
2. 用 perfmon 看 Available MBytes 与 Pages/sec，Pages/sec 持续高说明已在频繁换页；
3. 判断是业务增长还是进程泄漏——泄漏需在应用侧定位，重启只是临时缓解；
4. 确认页面文件大小配置合理，必要时扩内存。

#### machine reboot in the last 15 minutes - exporter[​](#machine-reboot-in-the-last-15-minutes---exporter "machine reboot in the last 15 minutes - exporter的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
time() - windows_system_system_up_time  < 900
```

处置步骤:

1. 用 Get-EventLog -LogName System -Newest 50 或事件查看器查 Event ID 6008（意外关机）、1074（计划关机及发起者）确认原因；
2. 是自动更新触发的，评估是否调整更新窗口与重启策略；
3. 是蓝屏或掉电，检查 minidump 与硬件日志；
4. 确认重启后关键服务已自动启动（Get-Service 检查启动类型）。

#### packet loss issue in the inbound direction - exporter[​](#packet-loss-issue-in-the-inbound-direction---exporter "packet loss issue in the inbound direction - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
100 * rate(windows_net_packets_received_errors[5m]) / (rate(windows_net_packets_received_errors[5m]) + rate(windows_net_packets_received_total[5m])>0)  > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认收包错误计数的增长；
2. 用 Get-NetAdapter 确认协商速率与双工模式和对端一致；
3. 检查网线/光模块，必要时换线或换口交叉验证；
4. 更新网卡驱动，并联系网络侧确认交换机端口的错包计数。

#### packet loss issue in the outbound direction - exporter[​](#packet-loss-issue-in-the-outbound-direction---exporter "packet loss issue in the outbound direction - exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
100 * rate(windows_net_packets_outbound_errors[5m]) / (rate(windows_net_packets_outbound_errors[5m]) + rate(windows_net_packets_sent_total[5m])>0)  > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认发包错误计数的增长；
2. 用 Get-NetAdapter 确认速率与双工模式和对端一致；
3. 检查网线/光模块并做交叉验证；
4. 更新网卡驱动，确认是否已跑满带宽需要扩容。

#### The hard disk is almost full - exporter[​](#the-hard-disk-is-almost-full---exporter "The hard disk is almost full - exporter的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
100 * (windows_logical_disk_size_bytes - windows_logical_disk_free_bytes) / windows_logical_disk_size_bytes  > 90
```

处置步骤:

1. 用 Get-PSDrive 或资源管理器确认是哪个盘符；
2. 用 TreeSize 之类工具或 Get-ChildItem -Recurse | Sort-Object Length -Descending | Select-Object -First 20 找出大文件；
3. 优先清理日志、临时文件（cleanmgr）、Windows 更新缓存（C:\Windows\SoftwareDistribution\Download）；
4. 长期需扩容磁盘或把数据目录迁到其他卷。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Windows 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Windows）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Windows%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
