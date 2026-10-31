---
title: "用夜莺监控 Linux"
sidebar_label: "Linux"
description: "CPU、内存、磁盘、网络、进程到内核参数，Categraf 装上就有数据，模板覆盖 Categraf、node_exporter 和 Telegraf 三种采集口径。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Linux
toc_max_heading_level: 2
mdx:
  format: md
---

Linux 主机是绝大多数监控的起点。Categraf 自带的 cpu、mem、disk、diskio、net、netstat、kernel、processes 等插件默认开启，装好就上报，不用额外配置；下面列出的是那些有可调项的插件。

模板里的仪表盘和规则分三套：按 Categraf 指标名写的、按 node_exporter 指标名写的、按 Telegraf 指标名写的。用哪种采集器就导哪一套，混用会看到空面板。规则覆盖了磁盘写满预测、IO 繁忙、conntrack 表、时间漂移、失联等运维上真正会半夜被叫醒的场景。

## 模板里有什么

- **5 张仪表盘**，共 71 个面板
- **60 条告警规则**，每条附处置步骤
- **132 条指标说明**
- **Categraf 采集配置**：`input.arp_packet`、`input.kernel_vmstat`、`input.logs-agent`、`input.netstat`、`input.node_exporter`、`input.ntp`、`input.processes`、`input.sshd`、`input.supervisor`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.arp_packet/arp_packet.toml`

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   #eth_device="ens192"
   ```

   `conf/input.kernel_vmstat/kernel_vmstat.toml`

   ```toml
   # # collect interval
   # interval = 15

   # file: /proc/vmstat
   [white_list]
   oom_kill = 1
   nr_free_pages = 0
   nr_alloc_batch = 0
   nr_inactive_anon = 0
   nr_active_anon = 0
   nr_inactive_file = 0
   nr_active_file = 0
   nr_unevictable = 0
   nr_mlock = 0
   nr_anon_pages = 0
   nr_mapped = 0
   nr_file_pages = 0
   nr_dirty = 0
   nr_writeback = 0
   nr_slab_reclaimable = 0
   nr_slab_unreclaimable = 0
   nr_page_table_pages = 0
   nr_kernel_stack = 0
   nr_unstable = 0
   nr_bounce = 0
   nr_vmscan_write = 0
   nr_vmscan_immediate_reclaim = 0
   nr_writeback_temp = 0
   nr_isolated_anon = 0
   nr_isolated_file = 0
   nr_shmem = 0
   nr_dirtied = 0
   nr_written = 0
   numa_hit = 0
   numa_miss = 0
   numa_foreign = 0
   numa_interleave = 0
   numa_local = 0
   numa_other = 0
   workingset_refault = 0
   workingset_activate = 0
   workingset_nodereclaim = 0
   nr_anon_transparent_hugepages = 0
   nr_free_cma = 0
   nr_dirty_threshold = 0
   nr_dirty_background_threshold = 0
   pgpgin = 0
   pgpgout = 0
   pswpin = 0
   pswpout = 0
   pgalloc_dma = 0
   pgalloc_dma32 = 0
   pgalloc_normal = 0
   pgalloc_movable = 0
   pgfree = 0
   pgactivate = 0
   pgdeactivate = 0
   pgfault = 0
   pgmajfault = 0
   pglazyfreed = 0
   pgrefill_dma = 0
   pgrefill_dma32 = 0
   pgrefill_normal = 0
   pgrefill_movable = 0
   pgsteal_kswapd_dma = 0
   pgsteal_kswapd_dma32 = 0
   pgsteal_kswapd_normal = 0
   pgsteal_kswapd_movable = 0
   pgsteal_direct_dma = 0
   pgsteal_direct_dma32 = 0
   pgsteal_direct_normal = 0
   pgsteal_direct_movable = 0
   pgscan_kswapd_dma = 0
   pgscan_kswapd_dma32 = 0
   pgscan_kswapd_normal = 0
   pgscan_kswapd_movable = 0
   pgscan_direct_dma = 0
   pgscan_direct_dma32 = 0
   pgscan_direct_normal = 0
   pgscan_direct_movable = 0
   pgscan_direct_throttle = 0
   zone_reclaim_failed = 0
   pginodesteal = 0
   slabs_scanned = 0
   kswapd_inodesteal = 0
   kswapd_low_wmark_hit_quickly = 0
   kswapd_high_wmark_hit_quickly = 0
   pageoutrun = 0
   allocstall = 0
   pgrotated = 0
   drop_pagecache = 0
   drop_slab = 0
   numa_pte_updates = 0
   numa_huge_pte_updates = 0
   numa_hint_faults = 0
   numa_hint_faults_local = 0
   numa_pages_migrated = 0
   pgmigrate_success = 0
   pgmigrate_fail = 0
   compact_migrate_scanned = 0
   compact_free_scanned = 0
   compact_isolated = 0
   compact_stall = 0
   compact_fail = 0
   compact_success = 0
   htlb_buddy_alloc_success = 0
   htlb_buddy_alloc_fail = 0
   unevictable_pgs_culled = 0
   unevictable_pgs_scanned = 0
   unevictable_pgs_rescued = 0
   unevictable_pgs_mlocked = 0
   unevictable_pgs_munlocked = 0
   unevictable_pgs_cleared = 0
   unevictable_pgs_stranded = 0
   thp_fault_alloc = 0
   thp_fault_fallback = 0
   thp_collapse_alloc = 0
   thp_collapse_alloc_failed = 0
   thp_split = 0
   thp_zero_page_alloc = 0
   thp_zero_page_alloc_failed = 0
   balloon_inflate = 0
   balloon_deflate = 0
   balloon_migrate = 0
   ```

   `conf/input.logs-agent/logs-agent.toml`

   ```toml
   [logs]
   ## just a placholder
   api_key = ""
   ## enable log collect or not
   enable = true
   ## the server receive logs, http/tcp/kafka, only kafka brokers can be multiple ip:ports with concatenation character ","
   send_to = "127.0.0.1:17878"
   ## send logs with protocol: http/tcp/kafka
   send_type = "http"
   topic = "flashcatcloud"
   ## send logs with compression or not 
   use_compress = false
   ## use ssl or not
   send_with_tls = false
   ## send logs in batchs
   batch_wait = 5
   ## save offset in this path 
   run_path = "/opt/categraf/run"
   ## max files can be open 
   open_files_limit = 100
   ## scan config file in 10 seconds
   scan_period = 10
   ## read buffer of udp 
   frame_size = 9000

   ## channal size, default 100
   ## 读取日志缓冲区，行数
   chan_size = 1000
   ## pipeline num , default 4
   ## 有多少线程处理日志
   pipeline=4
   ## configuration for kafka
   ## 指定kafka版本
   kafka_version="3.3.2"
   # 默认0 表示串行,如果对日志顺序有要求,保持默认配置
   batch_max_concurrence = 0
   # 最大并发批次, 默认100
   batch_max_size=100
   # 每次最大发送的内容上限 默认1000000
   batch_max_content_size=1000000
   # client timeout in seconds
   producer_timeout= 10

   # 是否开启sasl模式
   sasl_enable = false
   sasl_user = "admin"
   sasl_password = "admin"
   # PLAIN
   sasl_mechanism= "PLAIN"
   # v1
   sasl_version=1
   # set true
   sasl_handshake = true
   # optional
   # sasl_auth_identity=""
   #
   ##
   # v0.3.39以上版本新增,是否开启pod日志采集
   enable_collect_container=false

   # 是否采集所有pod的stdout stderr
   collect_container_all = true
     ## glog processing rules
     # [[logs.Processing_rules]]
     ## single log configure
     [[logs.items]]
     ## file/journald/tcp/udp
     type = "file"
     ## type=file, path is required; type=journald/tcp/udp, port is required
     path = "/opt/tomcat/logs/*.txt"
     source = "tomcat"
     service = "my_service"
   ```

   `conf/input.netstat/netstat.toml`

   ```toml
   # # collect interval
   # interval = 15

   disable_summary_stats = false
   ## if machine has many network connections, use this plugin may exhaust your cpu resource, disable connection stat to avoid this
   disable_connection_stats = true

   tcp_ext = false
   ip_ext = false
   ```

   `conf/input.node_exporter/node_exporter.toml`

   ```toml
   #collectors=[
   #    "--path.procfs=/hostfs/proc",
   #    "--path.sysfs=/hostfs/sys",
   #    "--path.rootfs=/hostfs",
   #    "--collector.arp",
   #    "--collector.bcache",
   #    "--collector.bonding",
   #    "--collector.btrfs",
   #    "--collector.conntrack",
   #    "--collector.cpu",
   #    "--collector.cpufreq",
   #    "--collector.diskstats",
   #    "--collector.dmi",
   #    "--collector.edac",
   #    "--collector.entropy",
   #    "--collector.fibrechannel",
   #    "--collector.filefd",
   #    "--collector.filesystem",
   #    "--collector.hwmon",
   #    "--collector.infiniband",
   #    "--collector.ipvs",
   #    "--collector.loadavg",
   #    "--collector.mdadm",
   #    "--collector.meminfo",
   #    "--collector.netclass",
   #    "--collector.netdev",
   #    "--collector.netstat",
   #    "--collector.nfs",
   #    "--collector.nfsd",
   #    "--collector.nvme",
   #    "--collector.os",
   #    "--collector.powersupplyclass",
   #    "--collector.pressure",
   #    "--collector.rapl",
   #    "--collector.schedstat",
   #    "--collector.selinux",
   #    "--collector.sockstat",
   #    "--collector.softnet",
   #    "--collector.stat",
   #    "--collector.tapestats",
   #    "--collector.textfile",
   #    "--collector.thermal_zone",
   #    "--collector.time",
   #    "--collector.timex",
   #    "--collector.udp_queues",
   #    "--collector.uname",
   #    "--collector.vmstat",
   #    "--collector.xfs",
   #    "--collector.zfs",
   #    "--collector.processes"
   #]
   #[[relabel_configs]]
   #source_labels = ["agent_hostname"]
   #target_label = "instance"
   #action = "replace"
   collectors=[]
   ```

   `conf/input.ntp/ntp.toml`

   ```toml
   # # collect interval
   # interval = 15

   # # ntp servers
   # ntp_servers = ["ntp.aliyun.com"]

   # # response time out seconds
   # timeout = 5
   ```

   `conf/input.processes/processes.toml`

   ```toml
   # # collect interval
   # interval = 15

   # # force use ps command to gather
   # force_ps = false

   # # force use /proc to gather
   # force_proc = false
   ```

   `conf/input.sshd/sshd.toml`

   ```toml
   # interval = 15

   #[[instances]]
   # # append labels
   # labels = { region="cloud", product="n9e" }

   # # whether to enable username label in metrics
   # # when enabled, metrics will include username labels for detailed tracking
   # # default: false
   # enable_username = false

   # # whether to enable client_ip label in metrics
   # # when enabled, metrics will include client_ip labels for detailed tracking
   # # default: false
   # enable_ip = false
   ```

   `conf/input.supervisor/supervisor.toml`

   ```toml
   # Gathers information about processes that running under supervisor using XML-RPC API
   [[instances]]
   ## Url of supervisor's XML-RPC endpoint if basic auth enabled in supervisor http server,
   ## than you have to add credentials to url (ex. http://login:pass@localhost:9001/RPC2)
   # url = "http://login:pass@localhost:9001/RPC2"
   ## With settings below you can manage gathering additional information about processes
   ## If both of them empty, then all additional information will be collected.
   ## Currently supported supported additional metrics are: pid, rc
   # metrics_include = []
   # metrics_exclude = ["pid", "rc"]
   ```

1. 在夜莺「集成中心」里找到 Linux，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| 机器常用指标（如果只想看当前业务组内的机器修改大盘变量 ident 的变量类型为机器标识即可） | 22 |
| 机器台账表格视图（使用 Categraf 作为采集器） | 3 |
| 机器进程数量统计（使用 Categraf 作为采集器） | 4 |
| Host Table NG | 1 |
| 机器常用指标（使用 NodeExporter 作为采集器） | 41 |

## 内置告警规则

共 60 条，导入后默认停用，按自己环境的阈值逐条启用。下表 56 条规则的触发条件（PromQL）和处置步骤收录在告警规则库：[Linux 告警规则](/alert-rules/linux)。

| 规则 | 级别 | 持续 |
| --- | --- | --- |
| Conntrack表的使用率超过80% | S2 警告 | 1 分钟 |
| CPU利用率较高 | S3 提醒 | 1 分钟 |
| HTTP地址探测失败 | S2 警告 | 1 分钟 |
| IO比较繁忙 | S2 警告 | 1 分钟 |
| NTP时间偏移太大 | S2 警告 | 1 分钟 |
| PING地址探测失败 | S2 警告 | 1 分钟 |
| TME_WAIT状态的连接超过2万，可能需要关注 | S2 警告 | 1 分钟 |
| 内存利用率比较高 | S3 提醒 | 1 分钟 |
| 文件句柄使用率超过90% | S2 警告 | 1 分钟 |
| 每个CPU Core的平均负载任务超过3 | S2 警告 | 1 分钟 |
| 硬盘监控 - inode使用率超过90% | S2 警告 | 1 分钟 |
| 硬盘监控 - 大于200G的盘，空间不足了 | S3 提醒 | 1 分钟 |
| 硬盘监控 - 小于200G的盘，空间不足了 | S3 提醒 | 1 分钟 |
| 硬盘监控 - 设备有报错 | S2 警告 | 1 分钟 |
| 硬盘监控 - 预测硬盘会在未来4小时内写满 | S1 紧急 | 1 分钟 |
| 系统有OOM产生 | S2 警告 | — |
| 网卡监控 - 入方向有丢包 | S3 提醒 | 1 分钟 |
| 网卡监控 - 入方向有错包 | S3 提醒 | 1 分钟 |
| 网卡监控 - 出方向有丢包 | S3 提醒 | 1 分钟 |
| 网卡监控 - 出方向有错包 | S3 提醒 | 1 分钟 |
| 网络地址探活失败 | S2 警告 | 1 分钟 |
| 进程监控-有进程数为0，某进程可能挂了 | S1 紧急 | 1 分钟 |
| 进程监控-进程句柄限制过小 | S3 提醒 | 1 分钟 |
| 进程监控-进程总量超过600 | S2 警告 | 1 分钟 |
| Hard disk - expected to be written full in 4 hours - categraf | S1 紧急 | 1 分钟 |
| Hard disk - IO is a bit busy - categraf | S2 警告 | 1 分钟 |
| Machine load - high memory, please pay attention - categraf | S3 提醒 | 1 分钟 |
| number of TME_WAIT exceeds 20,000 - categraf | S2 警告 | 1 分钟 |
| packet loss in the inbound direction - categraf | S3 提醒 | 1 分钟 |
| packet loss in the outbound direction - categraf | S3 提醒 | 1 分钟 |
| 大于200G的盘，空间不足了 | S3 提醒 | 1 分钟 |
| 小于200G的盘，空间不足了 | S3 提醒 | 1 分钟 |
| A certain disk is unable to read/write normally | S1 紧急 | 1 分钟 |
| Disk needs to be cleaned - utilization has reached 92% - node exporter | S1 紧急 | 1 分钟 |
| Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter | S2 警告 | 1 分钟 |
| Insufficient file handles - usage exceeds 90% - node exporter | S2 警告 | 1 分钟 |
| Insufficient inode resources - usage exceeds 90% - node exporter | S2 警告 | 1 分钟 |
| Insufficient memory resources - utilization is greater than 75% - node exporter | S2 警告 | 1 分钟 |
| Insufficient memory resources - utilization is greater than 95% - node exporter | S1 紧急 | 1 分钟 |
| Packet loss in the inbound direction of the network card - node exporter | S2 警告 | 1 分钟 |
| Packet loss in the outbound direction of the network card - node exporter | S2 警告 | 1 分钟 |
| System conntrack needs to be adjusted - usage exceeds 80% - node exporter | S2 警告 | 1 分钟 |
| System experiences OOM - node exporter | S2 警告 | 1 分钟 |
| Too many running processes - exceeding 3000 - node exporter | S2 警告 | 1 分钟 |
| Address is unreachable by PING, please pay attention - telegraf | S1 紧急 | 1 分钟 |
| Hard disk - expected to be written full in 4 hours - telegraf | S1 紧急 | 1 分钟 |
| Hard disk - IO is very busy - telegraf | S2 警告 | 1 分钟 |
| Machine load - high CPU, please pay attention - telegraf | S3 提醒 | 1 分钟 |
| Machine load - high memory, please pay attention - telegraf | S2 警告 | 1 分钟 |
| Network connection - number of TME_WAIT exceeds 20,000 - telegraf | S2 警告 | 1 分钟 |
| packet loss in the inbound direction - telegraf | S3 提醒 | 1 分钟 |
| packet loss in the outbound direction - telegraf | S3 提醒 | 1 分钟 |
| Port detection failed, please pay attention - telegraf | S1 紧急 | 1 分钟 |
| process handle limit is too small - telegraf | S3 提醒 | 1 分钟 |
| Process monitoring - lookup failure - telegraf | S1 紧急 | 1 分钟 |
| there are processes with 0 count, a certain process may have crashed - telegraf | S1 紧急 | 1 分钟 |

### 其余规则（4）

这些规则没有收进告警规则库，完整内容列在这里。

#### 机器监控 - agent失联超过60秒

处置步骤:

1. 先用 ping 与 ssh 确认机器本身是否存活，机器宕机要按宕机处理；
1. 机器存活则用 systemctl status categraf 确认 agent 进程，看日志 journalctl -u categraf -n 100 定位；
1. 常见原因是 agent 崩溃、配置错误、或到服务端的网络/认证不通——用 curl 手工打一次服务端的写入接口验证；
1. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

#### 机器监控 - 时间偏移超过3秒，请注意

持续 1 分钟

处置步骤:

1. 用 date 与 chronyc tracking 确认本机时间与偏移量；
1. 确认 chronyd/ntpd 服务是否在运行，未运行则启动并设为开机自启；
1. 检查到 NTP 服务器的网络是否放行 123/UDP，必要时换用内网 NTP 源；
1. 偏移过大时用 chronyc makestep 强制对时，对时间敏感的业务先做好准备。

#### Lost connection with monitoring target - categraf

处置步骤:

1. 先用 ping 与 ssh 确认机器本身是否存活，机器宕机要按宕机处理；
1. 机器存活则用 systemctl status categraf 确认 agent 进程，看日志 journalctl -u categraf -n 100 定位；
1. 常见原因是 agent 崩溃、配置错误、或到服务端的网络/认证不通——用 curl 手工打一次服务端的写入接口验证；
1. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

#### Lost connection with monitoring target - telegraf

处置步骤:

1. 先用 ping 与 ssh 确认机器本身是否存活，机器宕机要按宕机处理；
1. 机器存活则用 systemctl status categraf 确认 agent 进程，看日志 journalctl -u categraf -n 100 定位；
1. 常见原因是 agent 崩溃、配置错误、或到服务端的网络/认证不通——用 curl 手工打一次服务端的写入接口验证；
1. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

## 指标说明

共 132 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标 | 含义 | 单位 |
| --- | --- | --- |
| `cpu_usage_guest` | CPU Guest 时间占比 — CPU 为 Guest OS 运行虚拟 CPU 的时间占比。 标签 `cpu="cpu-total"`，表示整机的统计值; 标签 `cpu="0"`，表示 0 号 CPU 的统计值 | % |
| `cpu_usage_iowait` | CPU iowait 时间占比 — 表示 CPU 花费在等待 I/O 操作（输入/输出）完成的时间比例; 标签 `cpu="cpu-total"`，表示整机的 iowait 占用率; 标签 `cpu="0"`，表示 0 号 CPU 的 iowait 占用率 | % |
| `cpu_usage_steal` | CPU Steal 时间占比 — 表示虚拟机（Guest OS）CPU 时间被虚拟化管理器（Hypervisor）用于运行其他虚拟机的时间比例。物理机中这个指标值是 0，没有用处；虚拟机中这个指标值长时间大于 10 表示争抢严重。[参考资料](https://mp.weixin.qq.com/s/zlrfMNrDHJVE5lkTVow5zA); 标签 `cpu="cpu-total"`，表示整机的统计值; 标签 `cpu="0"`，表示 0 号 CPU 的统计值 | % |
| `cpu_usage_nice` | CPU 低优先级进程的时间占比 — 在Linux系统中，每个进程都有一个“nice”值，这个值的范围通常是从-20到19。默认的 nice 值为0。负的 nice 值表示高优先级（更快的 CPU 访问），而正的 nice 值表示低优先级（更慢的 CPU 访问）。该指标统计 nice 值为 1-19 的进程的时间占比。 标签 `cpu="cpu-total"`，表示整机的统计值; 标签 `cpu="0"`，表示 0 号 CPU 的统计值 | % |
| `cpu_usage_system` | CPU 内核态时间占比 — 表示 CPU 内核态的时间占比; 标签 `cpu="cpu-total"`，表示整机的统计值; 标签 `cpu="0"`，表示 0 号 CPU 的统计值 | % |
| `cpu_usage_active` | CPU 利用率 — - 标签 `cpu="cpu-total"`，表示整机的 CPU 利用率; 标签 `cpu="0"`，表示 0 号 CPU 的单核利用率 | % |
| `cpu_usage_user` | CPU 用户态时间占比 — 表示 CPU 用户态的时间占比; 标签 `cpu="cpu-total"`，表示整机的统计值; 标签 `cpu="0"`，表示 0 号 CPU 的统计值 | % |
| `cpu_usage_irq` | CPU 硬中断时间占比 — 表示 CPU 处理硬中断的时间占比; 标签 `cpu="cpu-total"`，表示整机的统计值; 标签 `cpu="0"`，表示 0 号 CPU 的统计值 | % |
| `cpu_usage_idle` | CPU 空闲率 — - 标签 `cpu="cpu-total"`，表示整机的 CPU 空闲率; 标签 `cpu="0"`，表示 0 号 CPU 的单核空闲率 | % |
| `cpu_usage_softirq` | CPU 软中断时间占比 — 表示 CPU 处理软中断的时间占比; 标签 `cpu="cpu-total"`，表示整机的统计值; 标签 `cpu="0"`，表示 0 号 CPU 的统计值 | % |
| `netstat_tcp_established` | ESTABLISHED 状态的网络链接数 |  |
| `netstat_tcp_fin_wait1` | FIN_WAIT1 状态的网络链接数 |  |
| `netstat_tcp_fin_wait2` | FIN_WAIT2 状态的网络链接数 |  |
| `100 * conntrack_ip_conntrack_count / conntrack_ip_conntrack_max` | IP conntrack 使用率 — 如果用满了，通常会在系统日志中看到：conntrack table full 这样的报错，可以调整系统最大值解决 | % |
| `netstat_tcp_last_ack` | LAST_ACK 状态的网络链接数 |  |
| `netstat_tcp_listen` | LISTEN 状态的网络链接数 |  |
| `100 * conntrack_nf_conntrack_count / conntrack_nf_conntrack_max` | NF conntrack 使用率 | % |
| `increase(kernel_vmstat_oom_kill[1m])` | 1分钟内 OOM 次数统计 — 取自 `/proc/vmstat`，需要较高版本的内核，没记错的话应该是 4.13 以上版本 |  |
| `netstat_tcp_syn_recv` | SYN_RECV 状态的网络链接数 |  |
| `netstat_tcp_syn_sent` | SYN_SENT 状态的网络链接数 |  |
| `netstat_tcp_time_wait` | TIME_WAIT 状态的网络链接数 — categraf 配置文件 `conf/input.netstat/netstat.toml` 中 `disable_connection_stats` 默认配置为 true，是因为在网络连接比较多的机器上，获取各个状态的连接数会耗费较多 CPU，所以默认 disable 掉了。 |  |
| `netstat_tcp_tw` | TIME_WAIT 状态的网络链接数（推荐） — 读取自 `/proc/net/sockstat`。 |  |
| `(mem_swap_total - mem_swap_free)/mem_swap_total * 100 and mem_swap_total > 0` | 交换空间使用率 — 交换空间使用率。计算原子取自 `/proc/meminfo`。 | % |
| `mem_swap_total - mem_swap_free` | 交换空间使用量 — 交换空间使用量。计算原子取自 `/proc/meminfo`。 | bytes |
| `mem_swap_total` | 交换空间总量 — 交换空间总量。取自 `/proc/meminfo`。 | bytes |
| `mem_swap_free` | 交换空间空闲量 — 交换空间空闲量。取自 `/proc/meminfo`。 | bytes |
| `mem_buffered` | 内存 Buffered 量 — 用作缓冲区的内存量。取自 `/proc/meminfo`。 | bytes |
| `mem_cached` | 内存 Cached 量 — 用作文件缓存的内存量。取自 `/proc/meminfo`。 | bytes |
| `mem_used_percent` | 内存使用率 — 内存使用率 | % |
| `100 - mem_available_percent` | 内存使用率（基于MemAvailable） — 内存使用率。基于 MemAvailable 计算更准确，但是老版本的 Linux 不支持。 | % |
| `mem_used` | 内存使用量 — 内存使用量 = Total - Free - Buffered - Cached | bytes |
| `mem_available_percent` | 内存可用率 — 可以立即分配给进程的可用内存量除以内存总量。分子分母的值均取自 `/proc/meminfo`。 | % |
| `mem_available` | 内存可用量 — 可以立即分配给进程的可用内存量。取自 `/proc/meminfo`。 | bytes |
| `mem_total` | 内存总量 — 内存总量。取自 `/proc/meminfo`。 | bytes |
| `mem_active` | 内存活跃量 — 这个字段表示当前活跃使用的内存总量，即系统最近访问过并且预计很快会再次使用的内存页面。取自 `/proc/meminfo`。 | bytes |
| `mem_free` | 内存空闲量 — 未使用的内存量。取自 `/proc/meminfo`。 | bytes |
| `mem_inactive` | 内存非活跃量 — 在上一采样周期未以某种方式使用的内存量。取自 `/proc/meminfo`。 | bytes |
| `netstat_udp_socket` | 当前 UDP 连接数 |  |
| `disk_inodes_used / disk_inodes_total * 100` | 硬盘 inode 使用率 — 如果存储了很多小文件，需要注意 inode 使用情况。 | % |
| `disk_inodes_used` | 硬盘 inode 使用量 — 如果存储了很多小文件，需要注意 inode 使用情况。 |  |
| `disk_inodes_free` | 硬盘 inode 剩余量 — 如果存储了很多小文件，需要注意 inode 使用情况。 |  |
| `disk_inodes_total` | 硬盘 inode 总量 — 如果存储了很多小文件，需要注意 inode 使用情况。 |  |
| `irate(diskio_write_time[2m])/irate(diskio_writes[2m])` | 硬盘 IO - 写请求平均耗时 | ms |
| `diskio_write_time` | 硬盘 IO - 写请求等待处理的时间 — 写入请求在磁盘上等待的时间。同时等待的多个写入请求会增加该数字。例如，如果 8 个请求均平均等待 1000 毫秒，则报告 8000。 | ms |
| `diskio_weighted_io_time` | 硬盘 IO - 加权 IO 处理时间 — 只要设备在处理 IO，不管同时处理了几个，diskio_io_time 就会递增；同时处理的 IO 数量乘以时间就得到加权的值：diskio_weighted_io_time。 | ms |
| `irate(diskio_io_time[2m])/1000*100` | 硬盘 IO - 时间维度 Utilization — 在时间维度统计硬盘 IO 时间占比，比如该值是 50%，表示有 50% 的时间是在处理 IO，该值 100%，表示一直在处理 IO，但是注意，现代磁盘设备具备并行处理多个 I/O 请求的能力，所以即便该值是 100%，可能硬盘还是可以接收新的处理请求。 比如某人有两只手，最近 1 分钟一直在用单手劳动，从时间维度来看，利用率是 100%，但即便是 100%，再给他更多的活，他也能干，因为他还有一只手可用。 | % |
| `irate(diskio_write_bytes[2m])` | 硬盘 IO - 每秒写入字节数量 | bytes/s |
| `irate(diskio_writes{}[2m])` | 硬盘 IO - 每秒写次数 |  |
| `irate(diskio_merged_writes[2m])` | 硬盘 IO - 每秒合并写请求次数 — 相邻的读取和写入可能会为了效率而被合并。因此，在最终交给磁盘之前，两个4K的读取可能会变成一个8K的读取，因此它将被计数（和排队）为仅有一个I/O。这些字段让你知道这种情况发生的频率。 |  |
| `irate(diskio_merged_reads[2m])` | 硬盘 IO - 每秒合并读请求次数 — 相邻的读取和写入可能会为了效率而被合并。因此，在最终交给磁盘之前，两个4K的读取可能会变成一个8K的读取，因此它将被计数（和排队）为仅有一个I/O。这些字段让你知道这种情况发生的频率。 |  |
| `irate(diskio_read_bytes[2m])` | 硬盘 IO - 每秒读取字节数量 | bytes/s |
| `irate(diskio_reads{}[2m])` | 硬盘 IO - 每秒读次数 |  |
| `diskio_io_time` | 硬盘 IO - 硬盘在处理 IO 的时间 — 硬盘在处理 IO 的时间，单位是毫秒。假设最近 1 秒内有 500 毫秒是在处理 IO，这个值就要加 500，这是一个单调递增的 Counter 值，从操作系统启动之后就会一直涨。实际使用的时候，一般使用该指标计算硬盘 IO UTIL（时间维度的百分比）。 | ms |
| `diskio_iops_in_progress` | 硬盘 IO - 设备驱动程序正在处理的 IO 数量 — 当前已经分配给设备驱动程序并且尚未完成的请求数量，Gauge 类型。如果 I/O 请求已经进入队列，但是尚未分配给设备驱动程序，则不统计在内。 |  |
| `irate(diskio_read_time[2m])/irate(diskio_reads[2m])` | 硬盘 IO - 读请求平均耗时 | ms |
| `diskio_read_time` | 硬盘 IO - 读请求等待处理的时间 — 读取请求在磁盘上等待的时间。同时等待的多个读取请求会增加该数字。例如，如果 5 个请求均平均等待 100 毫秒，则报告 500。 | ms |
| `irate(diskio_weighted_io_time[1m])/1000` | 硬盘 IO - 队列深度 — 假设过去 1000 毫秒内有 5000 毫秒的加权等待时间，相当于平均有 5 个 IO 请求在等待，即队列深度为 5。 |  |
| `disk_used_percent` | 硬盘使用率 — 硬盘空间使用率。 | % |
| `disk_used` | 硬盘使用量 — 使用 SI 标准渲染数据，和 df 命令保持一致。 | bytes |
| `disk_device_error` | 硬盘信息读取是否出错 — 0 表示正常，没有出错；非 0 表示获取硬盘信息出错了。 |  |
| `disk_free` | 硬盘剩余量 — 使用 SI 标准渲染数据，和 df 命令保持一致。 | bytes |
| `disk_total` | 硬盘总量 — 使用 SI 标准渲染数据，和 df 命令保持一致。 | bytes |
| `system_n_cpus` | 系统 CPU 核数 — CPU 逻辑核的数量。 |  |
| `system_uptime` | 系统启动时长 — 操作系统启动了多久，单位：秒。 | s |
| `system_load1` | 系统平均负载 - 最近 1 分钟 — 取自 `/proc/loadavg`。 |  |
| `system_load15` | 系统平均负载 - 最近 15 分钟 — 取自 `/proc/loadavg`。 |  |
| `system_load5` | 系统平均负载 - 最近 5 分钟 — 取自 `/proc/loadavg`。 |  |
| `system_load_norm_1` | 系统平均负载（单核） - 最近 1 分钟 — 相当于 `system_load1 / system_n_cpus` |  |
| `system_load_norm_15` | 系统平均负载（单核） - 最近 15 分钟 — 相当于 `system_load15 / system_n_cpus` |  |
| `system_load_norm_5` | 系统平均负载（单核） - 最近 5 分钟 — 相当于 `system_load5 / system_n_cpus` |  |
| `irate(net_drop_in[2m])` | 网卡入方向（接收）每秒丢弃的数据包个数 — 原始指标 net_drop_in 表示操作系统启动之后各个网卡入方向（接收）丢弃的数据包总数。 |  |
| `irate(net_packets_recv[2m])` | 网卡入方向（接收）每秒数据包数 — 原始指标 net_packets_recv 表示操作系统启动之后各个网卡入方向（接收）数据包总数。 |  |
| `irate(net_err_in[2m])` | 网卡入方向（接收）每秒错包数 — 原始指标 net_err_in 表示操作系统启动之后各个网卡入方向（接收）错包总数。 |  |
| `irate(net_drop_out[2m])` | 网卡出方向（发送）每秒丢弃的数据包个数 — 原始指标 net_drop_out 表示操作系统启动之后各个网卡出方向（发送）丢弃的数据包总数。 |  |
| `irate(net_packets_sent[2m])` | 网卡出方向（发送）每秒数据包数 — 原始指标 net_packets_sent 表示操作系统启动之后各个网卡出方向（发送）数据包总数。 |  |
| `irate(net_err_out[2m])` | 网卡出方向（发送）每秒错包数 — 原始指标 net_err_out 表示操作系统启动之后各个网卡出方向（发送）错包总数。 |  |
| `irate(net_bytes_sent[2m]) * 8` | 网卡每秒发送的 bit 量 — 原始指标 net_bytes_sent 表示操作系统启动之后发送的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。 | bit/s |
| `irate(net_bytes_recv[2m]) * 8` | 网卡每秒接收的 bit 量 — 原始指标 net_bytes_recv 表示操作系统启动之后接收的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。 | bit/s |
| `processes_dead` | 进程数 - “僵死”状态的进程数 — 处于“僵死”状态的进程数，它是由 Linux 上的 X 状态代码表示的。 |  |
| `processes_paging` | 进程数 - “分页”状态的进程数 — 处于“分页”状态的进程数，它是由 Linux 上的 W 状态代码表示的。 |  |
| `processes_stopped` | 进程数 - 停止的进程数 — 停止的进程数，由 T 状态代码表示。 |  |
| `processes_zombies` | 进程数 - 僵尸进程数 — 僵尸进程数，由 Z 状态代码表示。 |  |
| `processes_total` | 进程数 - 总数 — 实例上的总进程数。 |  |
| `processes_unknown` | 进程数 - 未知状态的进程数 — 未知状态的进程数。 |  |
| `processes_sleeping` | 进程数 - 正在睡眠的进程数 — 睡眠的进程数，由 S 状态代码表示。 |  |
| `processes_running` | 进程数 - 正在运行的进程数 — 正在运行的进程数，由 R 状态代码表示。 |  |
| `processes_idle` | 进程数 - 空闲的数量 — 处于空闲状态 (睡眠超过 20 秒) 的进程数。 |  |
| `processes_total_threads` | 进程数 - 线程总数 — 组成进程的总线程数。该指标仅适用于 Linux 实例。 |  |
| `processes_blocked` | 进程数 - 被阻止的进程数 — 被阻止的进程数量。 |  |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="steal"}[2m]) ) * 100` | CPU Steal 时间占比（整机平均） | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="system"}[2m]) ) * 100` | CPU 内核态时间占比（整机平均） | % |
| `avg without (mode,cpu) ( 1 - irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100` | CPU 利用率（整机平均） | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="user"}[2m]) ) * 100` | CPU 用户态时间占比（整机平均） | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="irq"}[2m]) ) * 100` | CPU 硬中断时间占比（整机平均） | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100` | CPU 空闲率（整机平均） | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="softirq"}[2m]) ) * 100` | CPU 软中断时间占比（整机平均） | % |
| `(node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes)/node_memory_SwapTotal_bytes * 100 and node_memory_SwapTotal_bytes > 0` | 交换空间使用率 — 交换空间使用率。计算原子取自 `/proc/meminfo`。 | % |
| `node_memory_SwapTotal_bytes` | 交换空间总量 — 交换空间总量。取自 `/proc/meminfo`。 | bytes |
| `node_memory_SwapFree_bytes` | 交换空间空闲量 — 交换空间空闲量。取自 `/proc/meminfo`。 | bytes |
| `node_memory_Buffers_bytes` | 内存 Buffered 量 — 用作缓冲区的内存量。取自 `/proc/meminfo`。 | bytes |
| `node_memory_Cached_bytes` | 内存 Cached 量 — 用作文件缓存的内存量。取自 `/proc/meminfo`。 | bytes |
| `(1 - (node_memory_MemAvailable_bytes{} / node_memory_MemTotal_bytes{})) * 100` | 内存使用率（基于MemAvailable） — 内存使用率。基于 MemAvailable 计算更准确，但是老版本的 Linux 不支持。 | % |
| `node_memory_MemAvailable_bytes` | 内存可用量 — 可以立即分配给进程的可用内存量。取自 `/proc/meminfo`。 | bytes |
| `node_memory_MemTotal_bytes` | 内存总量 — 内存总量。取自 `/proc/meminfo`。 | bytes |
| `node_memory_MemFree_bytes` | 内存空闲量 — 未使用的内存量。取自 `/proc/meminfo`。 | bytes |
| `node_filefd_allocated / node_filefd_maximum * 100` | 文件句柄 - 已分配占比 | % |
| `node_filefd_allocated` | 文件句柄 - 已分配量 | 个 |
| `node_filefd_maximum` | 文件句柄 - 总可分配量 | 个 |
| `irate(node_disk_io_time_seconds_total[2m]) * 100` | 硬盘 IO - 时间维度 Utilization — 在时间维度统计硬盘 IO 时间占比，比如该值是 50%，表示有 50% 的时间是在处理 IO，该值 100%，表示一直在处理 IO，但是注意，现代磁盘设备具备并行处理多个 I/O 请求的能力，所以即便该值是 100%，可能硬盘还是可以接收新的处理请求。 比如某人有两只手，最近 1 分钟一直在用单手劳动，从时间维度来看，利用率是 100%，但即便是 100%，再给他更多的活，他也能干，因为他还有一只手可用。 | % |
| `irate(node_disk_written_bytes_total[2m])` | 硬盘 IO - 每秒写入字节数量 | bytes/s |
| `irate(node_disk_writes_completed_total{}[2m])` | 硬盘 IO - 每秒写次数 — 每秒写次数 |  |
| `irate(node_disk_read_bytes_total[2m])` | 硬盘 IO - 每秒读取字节数量 | bytes/s |
| `irate(node_disk_reads_completed_total{}[2m])` | 硬盘 IO - 每秒读次数 — 每秒读次数 |  |
| `100 - ((node_filesystem_avail_bytes{} * 100) / node_filesystem_size_bytes{})` | 硬盘使用率 — 硬盘空间使用率。 | % |
| `node_filesystem_free_bytes` | 硬盘剩余量 — 使用 SI 标准渲染数据，和 df 命令保持一致。 | bytes |
| `node_filesystem_avail_bytes` | 硬盘可用量 — 使用 SI 标准渲染数据，和 df 命令保持一致。 | bytes |
| `node_filesystem_size_bytes` | 硬盘总量 — 使用 SI 标准渲染数据，和 df 命令保持一致。 | bytes |
| `count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | 系统 CPU 核数 — CPU 逻辑核的数量。 |  |
| `node_load1` | 系统平均负载 - 最近 1 分钟 — 取自 `/proc/loadavg`。 |  |
| `node_load15` | 系统平均负载 - 最近 15 分钟 — 取自 `/proc/loadavg`。 |  |
| `node_load5` | 系统平均负载 - 最近 5 分钟 — 取自 `/proc/loadavg`。 |  |
| `node_load1 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | 系统平均负载（单核） - 最近 1 分钟 |  |
| `node_load15 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | 系统平均负载（单核） - 最近 15 分钟 |  |
| `node_load5 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | 系统平均负载（单核） - 最近 5 分钟 |  |
| `irate(node_network_receive_drop_total[2m])` | 网卡入方向（接收）每秒丢弃的数据包个数 — 原始指标 node_network_receive_drop_total 表示操作系统启动之后各个网卡入方向（接收）丢弃的数据包总数。 |  |
| `irate(node_network_receive_packets_total[2m])` | 网卡入方向（接收）每秒数据包数 — 原始指标 node_network_receive_packets_total 表示操作系统启动之后各个网卡入方向（接收）数据包总数。 |  |
| `irate(node_network_receive_errs_total[2m])` | 网卡入方向（接收）每秒错包数 — 原始指标 node_network_receive_errs_total 表示操作系统启动之后各个网卡入方向（接收）错包总数。 |  |
| `irate(node_network_transmit_drop_total[2m])` | 网卡出方向（发送）每秒丢弃的数据包个数 — 原始指标 node_network_transmit_drop_total 表示操作系统启动之后各个网卡出方向（发送）丢弃的数据包总数。 |  |
| `irate(node_network_transmit_packets_total[2m])` | 网卡出方向（发送）每秒数据包数 — 原始指标 node_network_transmit_packets_total 表示操作系统启动之后各个网卡出方向（发送）数据包总数。 |  |
| `irate(node_network_transmit_errs_total[2m])` | 网卡出方向（发送）每秒错包数 — 原始指标 node_network_transmit_errs_total 表示操作系统启动之后各个网卡出方向（发送）错包总数。 |  |
| `irate(node_network_transmit_bytes_total[2m]) * 8` | 网卡每秒发送的 bit 量 — 原始指标 node_network_transmit_bytes_total 表示操作系统启动之后发送的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。 | bit/s |
| `irate(node_network_receive_bytes_total[2m]) * 8` | 网卡每秒接收的 bit 量 — 原始指标 node_network_receive_bytes_total 表示操作系统启动之后接收的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。 | bit/s |

## 相关链接

- [Linux 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Linux）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `arp_packet` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/arp_packet)：完整配置项和指标列表。
- [Categraf `kernel_vmstat` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/kernel_vmstat)：完整配置项和指标列表。
- [Categraf `netstat` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/netstat)：完整配置项和指标列表。
- [Categraf `node_exporter` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/node_exporter)：完整配置项和指标列表。
- [Categraf `ntp` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/ntp)：完整配置项和指标列表。
- [Categraf `processes` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/processes)：完整配置项和指标列表。
- [Categraf `supervisor` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/supervisor)：完整配置项和指标列表。
- [实践：监控 Linux 主机](/docs/practice/linux)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
