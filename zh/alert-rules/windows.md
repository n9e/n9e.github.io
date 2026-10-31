# Windows 告警规则：13 条 PromQL 规则与处置步骤

13 条开箱可用的 Windows 告警规则（PromQL），每条附级别、持续时间和处置步骤。指标来自 windows\_exporter, Categraf。可下载为 Prometheus 规则文件，或导入夜莺。

最后校对于 2026-10-31

Windows Server 告警规则：CPU 与内存使用率过高、磁盘已满或预计 4 小时内写满、磁盘 IO 繁忙、出入方向丢包、近期发生重启，以及采集端失联。exporter 一组使用 prometheus-community/windows\_exporter 的指标名（`windows_*`）；Categraf 一组针对在 Windows 上用 Categraf 采集的主机。

## 概览[​](#概览 "概览的直接链接")

* **13 条规则**，每条都有 PromQL 触发条件、级别、持续时间（`for`）和处置步骤
* **指标来源**：windows\_exporter, Categraf
* **下载**：[`windows.yml`](https://n9e.github.io/zh/alert-rules/windows.yml)，标准 Prometheus 规则文件（`groups:` 格式），已用 `promtool check rules` 校验
* 阈值只是起点，启用前请按自己的环境调整。

## 规则一览[​](#规则一览 "规则一览的直接链接")

| 规则                                                                     | 级别 | 持续   |
| ------------------------------------------------------------------------ | ---- | ------ |
| High CPU utilization - exporter                                          | 警告 | 1 分钟 |
| High memory usage rate - exporter                                        | 警告 | 1 分钟 |
| machine reboot in the last 15 minutes - exporter                         | 提醒 | 1 分钟 |
| packet loss issue in the inbound direction - exporter                    | 警告 | 1 分钟 |
| packet loss issue in the outbound direction - exporter                   | 警告 | 1 分钟 |
| The hard disk is almost full - exporter                                  | 紧急 | 1 分钟 |
| Hard disk - expected to be written full in 4 hours - categraf \[Windows] | 紧急 | 1 分钟 |
| Hard disk - IO is a bit busy - categraf \[Windows]                       | 警告 | 1 分钟 |
| Machine load - high memory, please pay attention - categraf\[Windows]    | 提醒 | 1 分钟 |
| packet loss in the inbound direction - categraf\[Windows]                | 提醒 | 1 分钟 |
| packet loss in the outbound direction - categraf \[Windows]              | 提醒 | 1 分钟 |
| 大于200G的盘，空间不足了\[Windows]                                       | 提醒 | 1 分钟 |
| 小于200G的盘，空间不足了\[Windows]                                       | 提醒 | 1 分钟 |

## Prometheus exporter（6）[​](#prometheus-exporter6 "Prometheus exporter（6）的直接链接")

### High CPU utilization - exporter[​](#high-cpu-utilization---exporter "High CPU utilization - exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
100 * sum by (instance) (rate(windows_cpu_time_total{mode != 'idle'}[5m])) / count by (instance) (windows_cpu_core_frequency_mhz) > 80
```

处置步骤:

1. 打开任务管理器或运行 Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 找出占用最高的进程；
2. 用资源监视器（resmon）看是用户态还是内核态占用高，内核态高要排查驱动与杀毒软件；
3. 区分业务量增长与程序异常（死循环、频繁 GC）；
4. 业务增长则扩容或限流，异常则重启对应服务并修复。

### High memory usage rate - exporter[​](#high-memory-usage-rate---exporter "High memory usage rate - exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
100 * (windows_cs_physical_memory_bytes - windows_os_physical_memory_free_bytes) / windows_cs_physical_memory_bytes  > 80
```

处置步骤:

1. 运行 Get-Process | Sort-Object WS -Descending | Select-Object -First 10 找出占用最高的进程；
2. 用 perfmon 看 Available MBytes 与 Pages/sec，Pages/sec 持续高说明已在频繁换页；
3. 判断是业务增长还是进程泄漏——泄漏需在应用侧定位，重启只是临时缓解；
4. 确认页面文件大小配置合理，必要时扩内存。

### machine reboot in the last 15 minutes - exporter[​](#machine-reboot-in-the-last-15-minutes---exporter "machine reboot in the last 15 minutes - exporter的直接链接")

提醒 · 1 分钟 · 触发条件:

```
time() - windows_system_system_up_time  < 900
```

处置步骤:

1. 用 Get-EventLog -LogName System -Newest 50 或事件查看器查 Event ID 6008（意外关机）、1074（计划关机及发起者）确认原因；
2. 是自动更新触发的，评估是否调整更新窗口与重启策略；
3. 是蓝屏或掉电，检查 minidump 与硬件日志；
4. 确认重启后关键服务已自动启动（Get-Service 检查启动类型）。

### packet loss issue in the inbound direction - exporter[​](#packet-loss-issue-in-the-inbound-direction---exporter "packet loss issue in the inbound direction - exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
100 * rate(windows_net_packets_received_errors[5m]) / (rate(windows_net_packets_received_errors[5m]) + rate(windows_net_packets_received_total[5m])>0)  > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认收包错误计数的增长；
2. 用 Get-NetAdapter 确认协商速率与双工模式和对端一致；
3. 检查网线/光模块，必要时换线或换口交叉验证；
4. 更新网卡驱动，并联系网络侧确认交换机端口的错包计数。

### packet loss issue in the outbound direction - exporter[​](#packet-loss-issue-in-the-outbound-direction---exporter "packet loss issue in the outbound direction - exporter的直接链接")

警告 · 1 分钟 · 触发条件:

```
100 * rate(windows_net_packets_outbound_errors[5m]) / (rate(windows_net_packets_outbound_errors[5m]) + rate(windows_net_packets_sent_total[5m])>0)  > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认发包错误计数的增长；
2. 用 Get-NetAdapter 确认速率与双工模式和对端一致；
3. 检查网线/光模块并做交叉验证；
4. 更新网卡驱动，确认是否已跑满带宽需要扩容。

### The hard disk is almost full - exporter[​](#the-hard-disk-is-almost-full---exporter "The hard disk is almost full - exporter的直接链接")

紧急 · 1 分钟 · 触发条件:

```
100 * (windows_logical_disk_size_bytes - windows_logical_disk_free_bytes) / windows_logical_disk_size_bytes  > 90
```

处置步骤:

1. 用 Get-PSDrive 或资源管理器确认是哪个盘符；
2. 用 TreeSize 之类工具或 Get-ChildItem -Recurse | Sort-Object Length -Descending | Select-Object -First 20 找出大文件；
3. 优先清理日志、临时文件（cleanmgr）、Windows 更新缓存（C:\Windows\SoftwareDistribution\Download）；
4. 长期需扩容磁盘或把数据目录迁到其他卷。

## Categraf（7）[​](#categraf7 "Categraf（7）的直接链接")

适用于用 Categraf 采集的主机和实例，指标名遵循 Categraf 插件。

### Hard disk - expected to be written full in 4 hours - categraf \[Windows][​](#hard-disk---expected-to-be-written-full-in-4-hours---categraf-windows "Hard disk - expected to be written full in 4 hours - categraf \[Windows]的直接链接")

紧急 · 1 分钟 · 触发条件:

```
predict_linear(disk_free{platform=~"windows"}[1h], 4*3600) < 0
```

处置步骤:

1. 在资源管理器或用 Get-PSDrive 确认是哪个盘符；
2. 用 Get-ChildItem <盘符>\ -Recurse -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20 找出增长最快的大文件；
3. 优先清理日志、临时文件（运行 cleanmgr）与 Windows 更新缓存 C:\Windows\SoftwareDistribution\Download；
4. 确认是否有异常写入（应用死循环打日志、备份任务堆积），不解决根因清理只是拖延。

### Hard disk - IO is a bit busy - categraf \[Windows][​](#hard-disk---io-is-a-bit-busy---categraf-windows "Hard disk - IO is a bit busy - categraf \[Windows]的直接链接")

警告 · 1 分钟 · 触发条件:

```
rate(diskio_io_time{platform=~"windows"}[1m])/10 > 99
```

处置步骤:

1. 打开资源监视器（resmon）的「磁盘」页，按「响应时间」排序看是哪块盘、哪个文件；
2. 用 Get-Counter '\PhysicalDisk(\*)\Avg. Disk sec/Transfer' 确认平均响应时间；
3. 在资源监视器里定位 IO 最高的进程，常见是数据库、备份任务、杀毒软件全盘扫描；
4. 可延后的任务错峰执行，持续高负载则考虑换 SSD 或分散数据。

### Machine load - high memory, please pay attention - categraf\[Windows][​](#machine-load---high-memory-please-pay-attention---categrafwindows "Machine load - high memory, please pay attention - categraf\[Windows]的直接链接")

提醒 · 1 分钟 · 触发条件:

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

### packet loss in the inbound direction - categraf\[Windows][​](#packet-loss-in-the-inbound-direction---categrafwindows "packet loss in the inbound direction - categraf\[Windows]的直接链接")

提醒 · 1 分钟 · 触发条件:

```
increase(net_drop_in{platform=~"windows"}[1m]) > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认收包丢弃与错误计数的增长；
2. 用 Get-NetAdapterAdvancedProperty 检查接收缓冲区（Receive Buffers）设置，偏小可调大；
3. 用 Get-NetAdapter 确认协商速率与双工模式和对端一致；
4. 更新网卡驱动，并联系网络侧确认交换机端口的丢包计数。

### packet loss in the outbound direction - categraf \[Windows][​](#packet-loss-in-the-outbound-direction---categraf-windows "packet loss in the outbound direction - categraf \[Windows]的直接链接")

提醒 · 1 分钟 · 触发条件:

```
increase(net_drop_out{platform=~"windows"}[1m]) > 0
```

处置步骤:

1. 运行 Get-NetAdapterStatistics 确认发包丢弃与错误计数的增长；
2. 用 Get-NetAdapterAdvancedProperty 检查发送缓冲区（Transmit Buffers）设置；
3. 确认是否已跑满带宽（资源监视器「网络」页），是则限流或扩带宽；
4. 更新网卡驱动并检查对端交换机端口状态。

### 大于200G的盘，空间不足了\[Windows][​](#大于200g的盘空间不足了windows "大于200G的盘，空间不足了\[Windows]的直接链接")

提醒 · 1 分钟 · 触发条件:

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

### 小于200G的盘，空间不足了\[Windows][​](#小于200g的盘空间不足了windows "小于200G的盘，空间不足了\[Windows]的直接链接")

提醒 · 1 分钟 · 触发条件:

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

## 怎么使用这些规则[​](#怎么使用这些规则 "怎么使用这些规则的直接链接")

* **用 Prometheus 或 vmalert**：下载 [`windows.yml`](https://n9e.github.io/zh/alert-rules/windows.yml)，加到 `rule_files`（vmalert 用 `-rule` 参数），对照自己的 exporter 版本核对指标名，再调整阈值。级别写在 `severity` 标签里（critical / warning / info），`runbook_url` 指回本页。
* **用夜莺**：同样的规则内置在 [Windows](https://n9e.github.io/zh/integrations/windows.md) 集成模板里。在集成中心把规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)，再逐条启用。夜莺会把处置步骤带进每条告警，规则可以对 Prometheus、VictoriaMetrics 等多种数据源求值。

## 来源与许可[​](#来源与许可 "来源与许可的直接链接")

处置步骤和其余规则来自夜莺的集成模板（[Windows](https://github.com/ccfos/nightingale/tree/main/integrations/Windows)，Apache-2.0），欢迎在那里提 PR 修正。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* [用夜莺监控 Windows](https://n9e.github.io/zh/integrations/windows.md)：采集配置、仪表盘与指标说明
* [在夜莺里写指标告警规则](https://n9e.github.io/zh/docs/alerting/metric-rules.md)
* [全部告警规则](https://n9e.github.io/zh/alert-rules.md)
