# 用夜莺监控 SMART

调用 smartctl 读取 HDD、SSD 和 NVMe 的 S.M.A.R.T. 健康属性，在硬盘真正坏掉之前看到重映射扇区、温度和剩余寿命。

最后校对于 2026-10-31

S.M.A.R.T. 是硬盘和固态盘内建的自检机制。Categraf 的 smart 插件执行 `smartctl`（以及 NVMe 的 `nvme` 工具）读取这些属性，输出 `smart_device` 整体健康指标和 `smart_attribute` 逐项属性，重映射扇区、待处理扇区、温度、通电时间、SSD 磨损这些指标都在其中。

模板里的规则盯的是会导致数据丢失的前兆：健康检查失败、重映射扇区增长、温度过高。需要主机上装有 smartmontools，并给 Categraf 执行 smartctl 的权限（通常是 sudo 免密）。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **1 张仪表盘**，共 20 个面板
* **6 条告警规则**，每条附处置步骤
* **14 条指标说明**
* **Categraf 采集配置**：`input.smart`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.smart/smart.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.smart started` 就说明插件已加载。

   ```
   # Read metrics from storage devices supporting S.M.A.R.T.

   [[instances]]

       ## Optionally specify the path to the smartctl executable

       # path_smartctl = "/usr/bin/smartctl"



       ## Optionally specify the path to the nvme-cli executable

       # path_nvme = "/usr/bin/nvme"



       ## Optionally specify if vendor specific attributes should be propagated for NVMe disk case

       ## ["auto-on"] - automatically find and enable additional vendor specific disk info

       ## ["vendor1", "vendor2", ...] - e.g. "Intel" enable additional Intel specific disk info

       #  enable_extensions = ["auto-on"]



       ## On most platforms used cli utilities requires root access.

       ## Setting 'use_sudo' to true will make use of sudo to run smartctl or nvme-cli.

       ## Sudo must be configured to allow the telegraf user to run smartctl or nvme-cli

       ## without a password.

       # use_sudo = true



       ## Skip checking disks in this power mode. Defaults to

       ## "standby" to not wake up disks that have stopped rotating.

       ## See --nocheck in the man pages for smartctl.

       ## smartctl version 5.41 and 5.42 have faulty detection of

       ## power mode and might require changing this value to

       ## "never" depending on your disks.

       # nocheck = "standby"



       ## Gather all returned S.M.A.R.T. attribute metrics and the detailed

       ## information from each drive into the 'smart_attribute' measurement.

       # attributes = true



       ## Optionally specify devices to exclude from reporting if disks auto-discovery is performed.

       # excludes = [ "/dev/pass6" ]



       ## Optionally specify devices and device type, if unset

       ## a scan (smartctl --scan and smartctl --scan -d nvme) for S.M.A.R.T. devices will be done

       ## and all found will be included except for the excluded in excludes.

       # devices = [ "/dev/ada0 -d atacam", "/dev/nvme0"]

       # devices = ["dev/nvme0 -d nvme", "/dev/nvme0"]



       ## Timeout for the cli command to complete.

         timeout = "30s"



       ## Optionally call smartctl and nvme-cli with a specific concurrency policy.

       ## By default, smartctl and nvme-cli are called in separate threads (goroutines) to gather disk attributes.

       ## Some devices (e.g. disks in RAID arrays) may have access limitations that require sequential reading of

       ## SMART data - one individual array drive at the time. In such case please set this configuration option

       ## to "sequential" to get readings for all drives.

       ## valid options: concurrent, sequential

       # read_method = "concurrent"
   ```

2. 在夜莺「集成中心」里找到 SMART，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘              | 面板数 |
| ------------------- | ------ |
| S.M.A.R.T Dashboard | 20     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 6 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### SMART设备健康状态异常[​](#smart设备健康状态异常 "SMART设备健康状态异常的直接链接")

硬盘自身检测的整体健康状态为不健康，存在严重故障风险，需立即处理

S1 紧急 · 持续 1 分钟 · 触发条件:

```
smart_device_health_ok == 0
```

处置步骤:

1. 用 smartctl -a /dev/sdX 看完整属性，重点关注 Reallocated\_Sector\_Ct、Current\_Pending\_Sector、Offline\_Uncorrectable；
2. 立即确认该盘上的数据有副本或已备份——这是最优先的动作；
3. RAID 环境下确认阵列状态，先让阵列把该盘踢出并用热备重建；
4. 安排停机换盘，不要继续往这块盘写数据。

### SSD介质磨损百分比≥90%[​](#ssd介质磨损百分比90 "SSD介质磨损百分比≥90%的直接链接")

SSD闪存芯片磨损程度接近耗尽，随时可能发生故障，需立即备份数据并更换硬盘

S1 紧急 · 持续 1 分钟 · 触发条件:

```
smart_attribute_media_wear_percentage >= 90
```

处置步骤:

1. 用 smartctl -a /dev/sdX 确认 Media\_Wearout\_Indicator / Percentage\_Used 与 Total\_LBAs\_Written；
2. 结合写入速率估算剩余寿命，据此排换盘窗口；
3. 确认该盘上的数据有副本，并提前准备迁移方案；
4. 复盘写入放大来源（日志级别、频繁小写入、无 TRIM），避免新盘重蹈覆辙。

### 硬盘温度超过65℃[​](#硬盘温度超过65 "硬盘温度超过65℃的直接链接")

硬盘运行温度过高，会加速硬件老化甚至导致直接故障，需立即检查散热

S1 紧急 · 持续 3 分钟 · 触发条件:

```
smart_device_temp_c > 65
```

处置步骤:

1. 用 smartctl -a /dev/sdX 确认温度与厂商标称的工作温度上限；
2. 检查机箱风道、风扇转速与滤网积灰，机房环境温度是否正常；
3. 确认盘位安装位置是否过于密集、相邻盘是否同样高温；
4. 短期可降低该盘的 IO 压力（错峰备份、迁移热数据）为处理争取时间。

### CRC错误计数1小时内持续增长[​](#crc错误计数1小时内持续增长 "CRC错误计数1小时内持续增长的直接链接")

数据传输链路CRC校验失败次数增加，可能是接口、线缆或硬盘控制器故障前兆

S1 紧急 · 持续 60 分钟 · 触发条件:

```
increase(smart_attribute_crc_error_count[1h]) > 0
```

处置步骤:

1. 用 smartctl -a /dev/sdX 确认 UDMA\_CRC\_Error\_Count 的增长速度；
2. 停机检查并重新插拔 SATA/SAS 数据线与电源线，优先直接换一根线；
3. 换线后观察计数是否停止增长——SMART 计数不会自动归零，看增量而非绝对值；
4. 换线无效则怀疑背板或 HBA 卡，逐个替换定位。

### SSD擦除失败计数增长[​](#ssd擦除失败计数增长 "SSD擦除失败计数增长的直接链接")

SSD闪存块擦除失败，意味着闪存芯片老化，存在数据写入故障风险

S1 紧急 · 持续 1 分钟 · 触发条件:

```
increase(smart_attribute_erase_fail_count[1h]) > 0
```

处置步骤:

1. 用 smartctl -a /dev/sdX 确认 Erase\_Fail\_Count 与 Reallocated/Available\_Reservd\_Space 的剩余余量；
2. 备用块余量下降说明盘已接近寿命终点，立即确认数据有副本；
3. 排换盘计划，不要等到写入完全失败；
4. 换盘前降低该盘写入压力，避免加速恶化。

### SSD编程失败计数增长[​](#ssd编程失败计数增长 "SSD编程失败计数增长的直接链接")

SSD闪存块写入失败，闪存芯片健康度急剧下降，需立即备份数据

S1 紧急 · 持续 1 分钟 · 触发条件:

```
increase(smart_attribute_program_fail_count[1h]) > 0
```

处置步骤:

1. 用 smartctl -a /dev/sdX 确认 Program\_Fail\_Count 与备用块剩余比例；
2. 立即确认该盘数据有副本或备份，这是最优先动作；
3. 尽快排换盘，编程失败通常伴随数据静默损坏风险；
4. 换盘前把该盘设为只读或迁走热数据，避免继续写入。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 14 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                               | 含义                                                                                      | 单位 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---- |
| `smart_attribute_crc_error_count`                  | CRC错误计数 — 硬盘数据传输过程中循环冗余校验（CRC）失败的次数。                           |      |
| `smart_attribute_end_to_end_error_detection_count` | 端到端错误检测计数 — 硬盘内部数据传输的端到端校验失败次数，关联固件或物理存储单元健康度。 |      |
| `smart_attribute_erase_fail_count`                 | 擦除失败计数 — 固态硬盘（SSD）擦除闪存块时失败的次数，预示闪存芯片老化。                  |      |
| `smart_attribute_host_reads`                       | 主机读取次数 — 操作系统从硬盘读取数据的总次数，属于硬盘使用量统计指标。                   |      |
| `smart_attribute_media_wear_percentage`            | 介质磨损百分比 — 固态硬盘（SSD）专用指标，反映闪存芯片的磨损程度，100%表示完全磨损。      | %    |
| `smart_attribute_pll_lock_loss_count`              | PLL失锁计数 — 锁相环（PLL）时钟同步失锁的次数，异常可能导致数据传输不稳定。               |      |
| `smart_attribute_program_fail_count`               | 编程失败计数 — 固态硬盘（SSD）向闪存块写入数据时失败的次数，反映闪存寿命。                |      |
| `smart_attribute_retry_buffer_overflow_count`      | 重试缓冲区溢出计数 — 硬盘读写失败后重试时，缓冲区溢出的次数，预示读写性能下降。           |      |
| `smart_attribute_thermal_throttle_status`          | 热节流状态 — 硬盘因温度过高触发自动降速保护的状态，1为已触发，0为未触发。                 |      |
| `smart_attribute_timed_workload_timer`             | 定时工作负载计时器 — 记录硬盘在特定负载模式下的运行累计时间，评估硬盘工作强度。           | s    |
| `smart_attribute_wear_leveling_count`              | 磨损均衡计数 — 固态硬盘（SSD）磨损均衡算法的执行次数，延长硬盘整体寿命。                  |      |
| `smart_device_exit_status`                         | 设备退出状态 — 硬盘SMART检测的退出状态码，0为正常完成，非0为检测异常。                    |      |
| `smart_device_health_ok`                           | 设备健康状态 — 硬盘整体健康状态标识，1为健康，0为不健康。                                 |      |
| `smart_device_temp_c`                              | 设备温度 — 硬盘当前运行温度，主流硬盘安全工作范围为0-60℃。                                | ℃    |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[SMART 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/SMART）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/SMART%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `smart` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/smart)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
