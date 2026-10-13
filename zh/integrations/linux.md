# 用夜莺监控 Linux

CPU、内存、磁盘、网络、进程到内核参数，Categraf 装上就有数据，模板覆盖 Categraf、node\_exporter 和 Telegraf 三种采集口径。

最后校对于 2026-10-13

Linux 主机是绝大多数监控的起点。Categraf 自带的 cpu、mem、disk、diskio、net、netstat、kernel、processes 等插件默认开启，装好就上报，不用额外配置；下面列出的是那些有可调项的插件。

模板里的仪表盘和规则分三套：按 Categraf 指标名写的、按 node\_exporter 指标名写的、按 Telegraf 指标名写的。用哪种采集器就导哪一套，混用会看到空面板。规则覆盖了磁盘写满预测、IO 繁忙、conntrack 表、时间漂移、失联等运维上真正会半夜被叫醒的场景。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 张仪表盘**，共 71 个面板
* **60 条告警规则**，每条附处置步骤
* **132 条指标说明**
* **Categraf 采集配置**：`input.arp_packet`、`input.kernel_vmstat`、`input.logs-agent`、`input.netstat`、`input.node_exporter`、`input.ntp`、`input.processes`、`input.sshd`、`input.supervisor`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.arp_packet/arp_packet.toml`

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   #eth_device="ens192"
   ```

   `conf/input.kernel_vmstat/kernel_vmstat.toml`

   ```
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

   ```
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

   ```
   # # collect interval

   # interval = 15



   disable_summary_stats = false

   ## if machine has many network connections, use this plugin may exhaust your cpu resource, disable connection stat to avoid this

   disable_connection_stats = true



   tcp_ext = false

   ip_ext = false
   ```

   `conf/input.node_exporter/node_exporter.toml`

   ```
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

   ```
   # # collect interval

   # interval = 15



   # # ntp servers

   # ntp_servers = ["ntp.aliyun.com"]



   # # response time out seconds

   # timeout = 5
   ```

   `conf/input.processes/processes.toml`

   ```
   # # collect interval

   # interval = 15



   # # force use ps command to gather

   # force_ps = false



   # # force use /proc to gather

   # force_proc = false
   ```

   `conf/input.sshd/sshd.toml`

   ```
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

   ```
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

2. 在夜莺「集成中心」里找到 Linux，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                                                                                  | 面板数 |
| --------------------------------------------------------------------------------------- | ------ |
| 机器常用指标（如果只想看当前业务组内的机器修改大盘变量 ident 的变量类型为机器标识即可） | 22     |
| 机器台账表格视图（使用 Categraf 作为采集器）                                            | 3      |
| 机器进程数量统计（使用 Categraf 作为采集器）                                            | 4      |
| Host Table NG                                                                           | 1      |
| 机器常用指标（使用 NodeExporter 作为采集器）                                            | 41     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 60 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（35）[​](#categraf-采集35 "Categraf 采集（35）的直接链接")

#### Conntrack表的使用率超过80%[​](#conntrack表的使用率超过80 "Conntrack表的使用率超过80%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
conntrack_ip_conntrack_count / conntrack_ip_conntrack_max > 0.8
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认当前水位；
2. 用 conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn 看连接集中在哪类协议或来源；
3. 应急调大：sysctl -w net.netfilter.nf\_conntrack\_max=<更大值>，并同步调大 nf\_conntrack\_buckets；
4. 同时缩短 nf\_conntrack\_tcp\_timeout\_time\_wait 等超时，或对不需要跟踪的流量用 iptables raw 表 NOTRACK。

#### CPU利用率较高[​](#cpu利用率较高 "CPU利用率较高的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

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

#### HTTP地址探测失败[​](#http地址探测失败 "HTTP地址探测失败的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
http_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 curl -sv <目标URL> 复现，看是连接失败、超时还是状态码不符；
2. 连接失败则先确认目标端口通、进程活；
3. 状态码不符则看目标服务日志定位；
4. 确认探测配置里的超时、期望状态码、证书校验设置是否与实际相符，避免配置导致的误报。

#### IO比较繁忙[​](#io比较繁忙 "IO比较繁忙的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(diskio_io_time[1m])/10 > 99
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util 的具体数值；
2. 用 iotop -oP 或 pidstat -d 1 找出占用 IO 最高的进程；
3. 常见元凶是数据库大查询、备份任务、日志刷盘——把可延后的任务错峰执行；
4. 若是持续高负载而非突发，考虑换 SSD 或把热数据分散到多块盘。

#### NTP时间偏移太大[​](#ntp时间偏移太大 "NTP时间偏移太大的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
ntp_offset_ms > 1000 or ntp_offset_ms < -1000
```

处置步骤:

1. 用 chronyc tracking（或 ntpq -p）确认当前偏移量与上游源状态；
2. 上游不可达则检查网络与防火墙是否放行 123/UDP；
3. 用 chronyc sources -v 确认是否所有源都被标记为不可用，必要时更换 NTP 服务器；
4. 偏移过大时 chrony 会拒绝平滑校正，需用 chronyc makestep 强制对时（注意对时间敏感的业务先做好准备）。

#### PING地址探测失败[​](#ping地址探测失败 "PING地址探测失败的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
ping_result_code != 0
```

处置步骤:

1. 在采集机上手工 ping -c 5 <目标> 复现，再用 mtr -n <目标> 定位丢包出现在哪一跳；
2. 目标机若存活，确认它是否禁 ICMP（很多安全策略会禁），是则该探测本身不适用，应改用端口探测；
3. 中间跳丢包的联系网络侧排查；
4. 确认目标机自身是否宕机或网卡故障。

#### TME\_WAIT状态的连接超过2万，可能需要关注[​](#tme_wait状态的连接超过2万可能需要关注 "TME_WAIT状态的连接超过2万，可能需要关注的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
netstat_tcp_time_wait > 20000
```

处置步骤:

1. 用 ss -s 确认各状态连接数分布；
2. 用 ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn 看集中在哪个目标；
3. 根因通常是短连接过多——在应用侧改用长连接或连接池，这是最有效的手段；
4. 应急可开启 net.ipv4.tcp\_tw\_reuse=1 并调大 net.ipv4.ip\_local\_port\_range（不要开 tcp\_tw\_recycle，NAT 环境下会丢包）。

#### 内存利用率比较高[​](#内存利用率比较高 "内存利用率比较高的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

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

#### 文件句柄使用率超过90%[​](#文件句柄使用率超过90 "文件句柄使用率超过90%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
linux_sysctl_fs_file_nr/linux_sysctl_fs_file_max>0.9
```

处置步骤:

1. 用 cat /proc/sys/fs/file-nr 确认已分配与上限；
2. 用 lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head 找出占用句柄最多的进程；
3. 应急调大：sysctl -w fs.file-max=<更大值>，并检查该进程的 ulimit -n 与 systemd LimitNOFILE；
4. 根因通常是连接或文件未关闭，需在应用侧修复泄漏。

#### 机器监控 - agent失联超过60秒[​](#机器监控---agent失联超过60秒 "机器监控 - agent失联超过60秒的直接链接")

触发条件:

```
```

处置步骤:

1. 先用 ping 与 ssh 确认机器本身是否存活，机器宕机要按宕机处理；
2. 机器存活则用 systemctl status categraf 确认 agent 进程，看日志 journalctl -u categraf -n 100 定位；
3. 常见原因是 agent 崩溃、配置错误、或到服务端的网络/认证不通——用 curl 手工打一次服务端的写入接口验证；
4. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

#### 机器监控 - 时间偏移超过3秒，请注意[​](#机器监控---时间偏移超过3秒请注意 "机器监控 - 时间偏移超过3秒，请注意的直接链接")

持续 1 分钟 · 触发条件:

```
```

处置步骤:

1. 用 date 与 chronyc tracking 确认本机时间与偏移量；
2. 确认 chronyd/ntpd 服务是否在运行，未运行则启动并设为开机自启；
3. 检查到 NTP 服务器的网络是否放行 123/UDP，必要时换用内网 NTP 源；
4. 偏移过大时用 chronyc makestep 强制对时，对时间敏感的业务先做好准备。

#### 每个CPU Core的平均负载任务超过3[​](#每个cpu-core的平均负载任务超过3 "每个CPU Core的平均负载任务超过3的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
system_load_norm_1>3
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟负载趋势，判断是突发还是持续；
2. 用 top 看 %wa（IO 等待）——高说明瓶颈在磁盘而非 CPU，按磁盘 IO 处理；
3. 用 vmstat 1 看 r（运行队列）与 b（阻塞）列区分 CPU 密集与 IO 阻塞；
4. 定位到具体进程后按 CPU 或 IO 的路径继续排查，必要时扩容。

#### 硬盘监控 - inode使用率超过90%[​](#硬盘监控---inode使用率超过90 "硬盘监控 - inode使用率超过90%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
disk_inodes_used/disk_inodes_total >0.9
```

处置步骤:

1. 用 df -i 确认是哪个挂载点的 inode 吃紧；
2. 用 for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head 逐层找出小文件最多的目录；
3. 常见来源是 session 文件、邮件队列、缓存碎片、未清理的容器层——按业务确认后批量删除；
4. 长期可在格式化时调大 inode 密度，或把小文件业务迁到独立分区。

#### 硬盘监控 - 大于200G的盘，空间不足了[​](#硬盘监控---大于200g的盘空间不足了 "硬盘监控 - 大于200G的盘，空间不足了的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

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

#### 硬盘监控 - 小于200G的盘，空间不足了[​](#硬盘监控---小于200g的盘空间不足了 "硬盘监控 - 小于200G的盘，空间不足了的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

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

#### 硬盘监控 - 设备有报错[​](#硬盘监控---设备有报错 "硬盘监控 - 设备有报错的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
disk_device_error>0
```

处置步骤:

1. 用 dmesg -T | grep -iE 'i/o error|ata|scsi' 看内核报的具体错误与设备名；
2. 用 smartctl -a /dev/sdX 看 SMART 属性，重点关注 Reallocated\_Sector\_Ct 与 Current\_Pending\_Sector；
3. 确认该盘上的数据是否有副本或备份，优先保证数据安全再处理硬件；
4. 确认为硬件故障的，安排停机换盘，RAID 环境下先确认阵列降级状态再操作。

#### 硬盘监控 - 预测硬盘会在未来4小时内写满[​](#硬盘监控---预测硬盘会在未来4小时内写满 "硬盘监控 - 预测硬盘会在未来4小时内写满的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

处置步骤:

1. 用 df -h 确认是哪个挂载点，再用 du -x --max-depth=1 <挂载点> | sort -h 逐层找出增长最快的目录；
2. 优先清理日志（journalctl --vacuum-size=500M、清 \*.log.N）与临时文件，这是最快见效的；
3. 用 lsof +L1 找出已删除但句柄未释放的文件，重启对应进程才能真正释放空间；
4. 确认是否有异常写入（应用死循环打日志、备份任务堆积），不解决根因清理只是拖延。

#### 系统有OOM产生[​](#系统有oom产生 "系统有OOM产生的直接链接")

S2 警告 · 触发条件:

```
increase(kernel_vmstat_oom_kill[2m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀的是哪个进程、当时占用多少内存；
2. 用 free -h 与该进程的内存曲线判断是内存泄漏还是配置的上限过高；
3. 给关键进程调整 oom\_score\_adj 降低被杀优先级，同时给次要进程设 cgroup 内存上限；
4. 根因是泄漏的要在应用侧抓堆定位，只扩内存会反复复发。

#### 网卡监控 - 入方向有丢包[​](#网卡监控---入方向有丢包 "网卡监控 - 入方向有丢包的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_in[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 RX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体丢包原因（rx\_no\_buffer、rx\_missed\_errors 等）；
3. 环形缓冲区不足可用 ethtool -G <网卡> rx <更大值> 调大，并检查 net.core.netdev\_max\_backlog；
4. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

#### 网卡监控 - 入方向有错包[​](#网卡监控---入方向有错包 "网卡监控 - 入方向有错包的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_err_in[1m]) > 0
```

处置步骤:

1. 用 ethtool -S <网卡> 看 rx\_crc\_errors、rx\_frame\_errors 等具体计数；
2. 用 ethtool <网卡> 确认协商的速率与双工模式是否与对端一致（半双工是经典错包源）；
3. 检查网线/光模块，必要时换线或换口做交叉验证；
4. 联系网络侧确认交换机对应端口的错包计数。

#### 网卡监控 - 出方向有丢包[​](#网卡监控---出方向有丢包 "网卡监控 - 出方向有丢包的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_out[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 TX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体计数，并用 tc -s qdisc show dev <网卡> 看队列是否溢出；
3. 发送队列不足可调大 txqueuelen 与 ethtool -G <网卡> tx；
4. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

#### 网卡监控 - 出方向有错包[​](#网卡监控---出方向有错包 "网卡监控 - 出方向有错包的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_err_out[1m]) > 0
```

处置步骤:

1. 用 ethtool -S <网卡> 看 tx\_errors、tx\_carrier\_errors 等具体计数；
2. 用 ethtool <网卡> 确认速率与双工模式与对端一致；
3. 检查网线/光模块并做交叉验证；
4. 确认网卡驱动与固件版本，必要时升级。

#### 网络地址探活失败[​](#网络地址探活失败 "网络地址探活失败的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
net_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 telnet <目标> <端口> 或 nc -vz <目标> <端口> 复现；
2. 到目标机用 ss -lntp | grep <端口> 确认进程是否在监听；
3. 进程在监听则排查防火墙、安全组、以及是否只绑定了 127.0.0.1；
4. 进程不在则按该服务自身的恢复流程拉起。

#### 进程监控-有进程数为0，某进程可能挂了[​](#进程监控-有进程数为0某进程可能挂了 "进程监控-有进程数为0，某进程可能挂了的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
procstat_lookup_count == 0
```

处置步骤:

1. 用 ps -ef | grep <进程关键字> 确认确实不在，排除采集侧的匹配规则写错；
2. 查该进程的日志与 dmesg -T | grep -i 'killed process'，区分自身崩溃、被 OOM 杀死还是人工停止；
3. 按服务自身流程拉起，并确认 systemd 的 Restart 策略是否生效；
4. 若反复退出，先定位根因再拉起，避免陷入重启循环。

#### 进程监控-进程句柄限制过小[​](#进程监控-进程句柄限制过小 "进程监控-进程句柄限制过小的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
procstat_rlimit_num_fds_soft < 2048
```

处置步骤:

1. 用 cat /proc/\<pid>/limits 确认 Max open files 的软硬上限；
2. systemd 管理的服务在 unit 文件里加 LimitNOFILE=65535 后 systemctl daemon-reload 并重启；
3. 非 systemd 的在启动脚本里加 ulimit -n 65535，或改 /etc/security/limits.conf；
4. 注意软上限修改后必须重启进程才生效。

#### 进程监控-进程总量超过600[​](#进程监控-进程总量超过600 "进程监控-进程总量超过600的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
processes_total > 600
```

处置步骤:

1. 用 ps -eo ppid | sort | uniq -c | sort -rn | head 找出 fork 子进程最多的父进程；
2. 确认是正常的多进程模型（如 php-fpm、nginx worker）还是失控 fork；
3. 失控的先停掉该父进程止血，再修复代码里的 fork 逻辑；
4. 正常业务增长则调整 worker 数配置并评估是否需要扩容。

#### Hard disk - expected to be written full in 4 hours - categraf[​](#hard-disk---expected-to-be-written-full-in-4-hours---categraf "Hard disk - expected to be written full in 4 hours - categraf的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

处置步骤:

1. 用 df -h 确认是哪个挂载点，再用 du -x --max-depth=1 <挂载点> | sort -h 逐层找出增长最快的目录；
2. 优先清理日志（journalctl --vacuum-size=500M、清 \*.log.N）与临时文件，这是最快见效的；
3. 用 lsof +L1 找出已删除但句柄未释放的文件，重启对应进程才能真正释放空间；
4. 确认是否有异常写入（应用死循环打日志、备份任务堆积），不解决根因清理只是拖延。

#### Hard disk - IO is a bit busy - categraf[​](#hard-disk---io-is-a-bit-busy---categraf "Hard disk - IO is a bit busy - categraf的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(diskio_io_time[1m])/10 > 99
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util 的具体数值；
2. 用 iotop -oP 或 pidstat -d 1 找出占用 IO 最高的进程；
3. 常见元凶是数据库大查询、备份任务、日志刷盘——把可延后的任务错峰执行；
4. 若是持续高负载而非突发，考虑换 SSD 或把热数据分散到多块盘。

#### Lost connection with monitoring target - categraf[​](#lost-connection-with-monitoring-target---categraf "Lost connection with monitoring target - categraf的直接链接")

触发条件:

```
```

处置步骤:

1. 先用 ping 与 ssh 确认机器本身是否存活，机器宕机要按宕机处理；
2. 机器存活则用 systemctl status categraf 确认 agent 进程，看日志 journalctl -u categraf -n 100 定位；
3. 常见原因是 agent 崩溃、配置错误、或到服务端的网络/认证不通——用 curl 手工打一次服务端的写入接口验证；
4. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

#### Machine load - high memory, please pay attention - categraf[​](#machine-load---high-memory-please-pay-attention---categraf "Machine load - high memory, please pay attention - categraf的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

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

#### number of TME\_WAIT exceeds 20,000 - categraf[​](#number-of-tme_wait-exceeds-20000---categraf "number of TME_WAIT exceeds 20,000 - categraf的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
netstat_tcp_time_wait > 20000
```

处置步骤:

1. 用 ss -s 确认各状态连接数分布；
2. 用 ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn 看集中在哪个目标；
3. 根因通常是短连接过多——在应用侧改用长连接或连接池，这是最有效的手段；
4. 应急可开启 net.ipv4.tcp\_tw\_reuse=1 并调大 net.ipv4.ip\_local\_port\_range（不要开 tcp\_tw\_recycle，NAT 环境下会丢包）。

#### packet loss in the inbound direction - categraf[​](#packet-loss-in-the-inbound-direction---categraf "packet loss in the inbound direction - categraf的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_in[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 RX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体丢包原因（rx\_no\_buffer、rx\_missed\_errors 等）；
3. 环形缓冲区不足可用 ethtool -G <网卡> rx <更大值> 调大，并检查 net.core.netdev\_max\_backlog；
4. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

#### packet loss in the outbound direction - categraf[​](#packet-loss-in-the-outbound-direction---categraf "packet loss in the outbound direction - categraf的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_out[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 TX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体计数，并用 tc -s qdisc show dev <网卡> 看队列是否溢出；
3. 发送队列不足可调大 txqueuelen 与 ethtool -G <网卡> tx；
4. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

#### 大于200G的盘，空间不足了[​](#大于200g的盘空间不足了 "大于200G的盘，空间不足了的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

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

#### 小于200G的盘，空间不足了[​](#小于200g的盘空间不足了 "小于200G的盘，空间不足了的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

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

### Exporter 采集（12）[​](#exporter-采集12 "Exporter 采集（12）的直接链接")

#### A certain disk is unable to read/write normally[​](#a-certain-disk-is-unable-to-readwrite-normally "A certain disk is unable to read/write normally的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
(node_filesystem_device_error{mountpoint!~"/var/lib/.*",mountpoint!~"/run.*"}) > 0
```

处置步骤:

1. 用 dmesg -T | grep -iE 'i/o error|ata|scsi' 看内核报的具体错误与设备名；
2. 用 smartctl -a /dev/sdX 看 SMART 属性，重点关注 Reallocated\_Sector\_Ct 与 Current\_Pending\_Sector；
3. 确认该盘上的数据是否有副本或备份，优先保证数据安全再处理硬件；
4. 确认为硬件故障的，安排停机换盘，RAID 环境下先确认阵列降级状态再操作。

#### Disk needs to be cleaned - utilization has reached 92% - node exporter[​](#disk-needs-to-be-cleaned---utilization-has-reached-92---node-exporter "Disk needs to be cleaned - utilization has reached 92% - node exporter的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
(100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) ) > 92
```

处置步骤:

1. 用 df -h 定位挂载点，用 du -x --max-depth=1 <挂载点> | sort -h 找出占用最大的目录；
2. 系统盘常见是 /var/log 与容器镜像层（docker system df 看占用，docker system prune 清理）；
3. 用 lsof +L1 检查已删除但句柄未释放的文件；
4. 长期需扩容或把大数据目录迁到独立磁盘。

#### Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter[​](#insufficient-computational-resources---average-load-per-core-of-the-machine-is-greater-than-10---node-exporter "Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
avg (node_load1) by (instance)/count(count(node_cpu_seconds_total) by (cpu,instance)) by (instance) >10
```

处置步骤:

1. 用 uptime 看 1/5/15 分钟负载趋势，判断是突发还是持续；
2. 用 top 看 %wa（IO 等待）——高说明瓶颈在磁盘而非 CPU，按磁盘 IO 处理；
3. 用 vmstat 1 看 r（运行队列）与 b（阻塞）列区分 CPU 密集与 IO 阻塞；
4. 定位到具体进程后按 CPU 或 IO 的路径继续排查，必要时扩容。

#### Insufficient file handles - usage exceeds 90% - node exporter[​](#insufficient-file-handles---usage-exceeds-90---node-exporter "Insufficient file handles - usage exceeds 90% - node exporter的直接链接")

You can increase the file handle limit or expand the capacity

S2 警告 · 持续 1 分钟 · 触发条件:

```
(node_filefd_allocated/node_filefd_maximum*100) > 90
```

处置步骤:

1. 用 cat /proc/sys/fs/file-nr 确认已分配与上限；
2. 用 lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head 找出占用句柄最多的进程；
3. 应急调大：sysctl -w fs.file-max=<更大值>，并检查该进程的 ulimit -n 与 systemd LimitNOFILE；
4. 根因通常是连接或文件未关闭，需在应用侧修复泄漏。

#### Insufficient inode resources - usage exceeds 90% - node exporter[​](#insufficient-inode-resources---usage-exceeds-90---node-exporter "Insufficient inode resources - usage exceeds 90% - node exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
(100 - ((node_filesystem_files_free * 100) / node_filesystem_files))>90
```

处置步骤:

1. 用 df -i 确认是哪个挂载点的 inode 吃紧；
2. 用 for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head 逐层找出小文件最多的目录；
3. 常见来源是 session 文件、邮件队列、缓存碎片、未清理的容器层——按业务确认后批量删除；
4. 长期可在格式化时调大 inode 密度，或把小文件业务迁到独立分区。

#### Insufficient memory resources - utilization is greater than 75% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-75---node-exporter "Insufficient memory resources - utilization is greater than 75% - node exporter的直接链接")

Expansion or upgrading of configuration is required

S2 警告 · 持续 1 分钟 · 触发条件:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 75
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
2. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
3. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop\_caches 释放 page cache（生产慎用）；
4. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

#### Insufficient memory resources - utilization is greater than 95% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-95---node-exporter "Insufficient memory resources - utilization is greater than 95% - node exporter的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 95
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
2. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
3. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop\_caches 释放 page cache（生产慎用）；
4. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

#### Packet loss in the inbound direction of the network card - node exporter[​](#packet-loss-in-the-inbound-direction-of-the-network-card---node-exporter "Packet loss in the inbound direction of the network card - node exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(node_network_receive_drop_total{device=~"e.*"}[1m]) > 3
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 RX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体丢包原因（rx\_no\_buffer、rx\_missed\_errors 等）；
3. 环形缓冲区不足可用 ethtool -G <网卡> rx <更大值> 调大，并检查 net.core.netdev\_max\_backlog；
4. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

#### Packet loss in the outbound direction of the network card - node exporter[​](#packet-loss-in-the-outbound-direction-of-the-network-card---node-exporter "Packet loss in the outbound direction of the network card - node exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(node_network_transmit_drop_total{device=~"e.*"}[1m]) > 3
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 TX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体计数，并用 tc -s qdisc show dev <网卡> 看队列是否溢出；
3. 发送队列不足可调大 txqueuelen 与 ethtool -G <网卡> tx；
4. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

#### System conntrack needs to be adjusted - usage exceeds 80% - node exporter[​](#system-conntrack-needs-to-be-adjusted---usage-exceeds-80---node-exporter "System conntrack needs to be adjusted - usage exceeds 80% - node exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit*100 > 80
```

处置步骤:

1. 用 sysctl net.netfilter.nf\_conntrack\_count 与 nf\_conntrack\_max 确认当前水位；
2. 用 conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn 看连接集中在哪类协议或来源；
3. 应急调大：sysctl -w net.netfilter.nf\_conntrack\_max=<更大值>，并同步调大 nf\_conntrack\_buckets；
4. 同时缩短 nf\_conntrack\_tcp\_timeout\_time\_wait 等超时，或对不需要跟踪的流量用 iptables raw 表 NOTRACK。

#### System experiences OOM - node exporter[​](#system-experiences-oom---node-exporter "System experiences OOM - node exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

处置步骤:

1. 用 dmesg -T | grep -i 'killed process' 确认被杀的是哪个进程、当时占用多少内存；
2. 用 free -h 与该进程的内存曲线判断是内存泄漏还是配置的上限过高；
3. 给关键进程调整 oom\_score\_adj 降低被杀优先级，同时给次要进程设 cgroup 内存上限；
4. 根因是泄漏的要在应用侧抓堆定位，只扩内存会反复复发。

#### Too many running processes - exceeding 3000 - node exporter[​](#too-many-running-processes---exceeding-3000---node-exporter "Too many running processes - exceeding 3000 - node exporter的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
node_procs_running > 3000
```

处置步骤:

1. 用 ps -eo ppid | sort | uniq -c | sort -rn | head 找出 fork 子进程最多的父进程；
2. 确认是正常的多进程模型（如 php-fpm、nginx worker）还是失控 fork；
3. 失控的先停掉该父进程止血，再修复代码里的 fork 逻辑；
4. 正常业务增长则调整 worker 数配置并评估是否需要扩容。

### Telegraf 采集（13）[​](#telegraf-采集13 "Telegraf 采集（13）的直接链接")

#### Address is unreachable by PING, please pay attention - telegraf[​](#address-is-unreachable-by-ping-please-pay-attention---telegraf "Address is unreachable by PING, please pay attention - telegraf的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
ping_result_code != 0
```

处置步骤:

1. 在采集机上手工 ping -c 5 <目标> 复现，再用 mtr -n <目标> 定位丢包出现在哪一跳；
2. 目标机若存活，确认它是否禁 ICMP（很多安全策略会禁），是则该探测本身不适用，应改用端口探测；
3. 中间跳丢包的联系网络侧排查；
4. 确认目标机自身是否宕机或网卡故障。

#### Hard disk - expected to be written full in 4 hours - telegraf[​](#hard-disk---expected-to-be-written-full-in-4-hours---telegraf "Hard disk - expected to be written full in 4 hours - telegraf的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

处置步骤:

1. 用 df -h 确认是哪个挂载点，再用 du -x --max-depth=1 <挂载点> | sort -h 逐层找出增长最快的目录；
2. 优先清理日志（journalctl --vacuum-size=500M、清 \*.log.N）与临时文件，这是最快见效的；
3. 用 lsof +L1 找出已删除但句柄未释放的文件，重启对应进程才能真正释放空间；
4. 确认是否有异常写入（应用死循环打日志、备份任务堆积），不解决根因清理只是拖延。

#### Hard disk - IO is very busy - telegraf[​](#hard-disk---io-is-very-busy---telegraf "Hard disk - IO is very busy - telegraf的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
rate(diskio_io_time[1m])/10 > 99
```

处置步骤:

1. 用 iostat -x 1 确认是哪块盘、await 与 %util 的具体数值；
2. 用 iotop -oP 或 pidstat -d 1 找出占用 IO 最高的进程；
3. 常见元凶是数据库大查询、备份任务、日志刷盘——把可延后的任务错峰执行；
4. 若是持续高负载而非突发，考虑换 SSD 或把热数据分散到多块盘。

#### Lost connection with monitoring target - telegraf[​](#lost-connection-with-monitoring-target---telegraf "Lost connection with monitoring target - telegraf的直接链接")

触发条件:

```
```

处置步骤:

1. 先用 ping 与 ssh 确认机器本身是否存活，机器宕机要按宕机处理；
2. 机器存活则用 systemctl status categraf 确认 agent 进程，看日志 journalctl -u categraf -n 100 定位；
3. 常见原因是 agent 崩溃、配置错误、或到服务端的网络/认证不通——用 curl 手工打一次服务端的写入接口验证；
4. 恢复后确认数据已连续，注意盲区期间的故障不会有历史告警。

#### Machine load - high CPU, please pay attention - telegraf[​](#machine-load---high-cpu-please-pay-attention---telegraf "Machine load - high CPU, please pay attention - telegraf的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
cpu_usage_idle{cpu="cpu-total"} < 25
```

处置步骤:

1. 用 top -H 或 pidstat 1 找出占用最高的进程与线程；
2. 用 perf top 或对应语言的 profiler（Java 用 arthas/async-profiler，Go 用 pprof）定位热点函数；
3. 区分是业务量自然增长还是代码异常（死循环、正则回溯、频繁 GC）；
4. 业务量增长则扩容或限流，代码问题则修复后发布。

#### Machine load - high memory, please pay attention - telegraf[​](#machine-load---high-memory-please-pay-attention---telegraf "Machine load - high memory, please pay attention - telegraf的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
mem_available_percent < 25
```

处置步骤:

1. 用 free -h 确认 available 与 swap 使用情况；
2. 用 ps aux --sort=-%mem | head 找出占用最高的进程，对比它们的历史内存曲线判断是否泄漏；
3. 内核回收不及时可用 sync; echo 1 > /proc/sys/vm/drop\_caches 释放 page cache（生产慎用）；
4. 确认是业务增长还是进程泄漏——泄漏要在应用侧抓堆定位，不能只靠重启。

#### Network connection - number of TME\_WAIT exceeds 20,000 - telegraf[​](#network-connection---number-of-tme_wait-exceeds-20000---telegraf "Network connection - number of TME_WAIT exceeds 20,000 - telegraf的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
netstat_tcp_time_wait > 20000
```

处置步骤:

1. 用 ss -s 确认各状态连接数分布；
2. 用 ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn 看集中在哪个目标；
3. 根因通常是短连接过多——在应用侧改用长连接或连接池，这是最有效的手段；
4. 应急可开启 net.ipv4.tcp\_tw\_reuse=1 并调大 net.ipv4.ip\_local\_port\_range（不要开 tcp\_tw\_recycle，NAT 环境下会丢包）。

#### packet loss in the inbound direction - telegraf[​](#packet-loss-in-the-inbound-direction---telegraf "packet loss in the inbound direction - telegraf的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_in[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 RX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体丢包原因（rx\_no\_buffer、rx\_missed\_errors 等）；
3. 环形缓冲区不足可用 ethtool -G <网卡> rx <更大值> 调大，并检查 net.core.netdev\_max\_backlog；
4. 若伴随 CPU 软中断偏高（top 里 %si），开启 RPS/RSS 把中断分散到多核。

#### packet loss in the outbound direction - telegraf[​](#packet-loss-in-the-outbound-direction---telegraf "packet loss in the outbound direction - telegraf的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
increase(net_drop_out[1m]) > 0
```

处置步骤:

1. 用 ip -s link show <网卡> 确认 TX dropped/errors 的增长；
2. 用 ethtool -S <网卡> 看具体计数，并用 tc -s qdisc show dev <网卡> 看队列是否溢出；
3. 发送队列不足可调大 txqueuelen 与 ethtool -G <网卡> tx；
4. 确认是否已跑满带宽——是则限流或扩带宽，不是则排查网卡驱动与对端设备。

#### Port detection failed, please pay attention - telegraf[​](#port-detection-failed-please-pay-attention---telegraf "Port detection failed, please pay attention - telegraf的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
net_response_result_code != 0
```

处置步骤:

1. 在采集机上手工 telnet <目标> <端口> 或 nc -vz <目标> <端口> 复现；
2. 到目标机用 ss -lntp | grep <端口> 确认进程是否在监听；
3. 进程在监听则排查防火墙、安全组、以及是否只绑定了 127.0.0.1；
4. 进程不在则按该服务自身的恢复流程拉起。

#### process handle limit is too small - telegraf[​](#process-handle-limit-is-too-small---telegraf "process handle limit is too small - telegraf的直接链接")

S3 提醒 · 持续 1 分钟 · 触发条件:

```
procstat_rlimit_num_fds_soft < 2048
```

处置步骤:

1. 用 cat /proc/\<pid>/limits 确认 Max open files 的软硬上限；
2. systemd 管理的服务在 unit 文件里加 LimitNOFILE=65535 后 systemctl daemon-reload 并重启；
3. 非 systemd 的在启动脚本里加 ulimit -n 65535，或改 /etc/security/limits.conf；
4. 注意软上限修改后必须重启进程才生效。

#### Process monitoring - lookup failure - telegraf[​](#process-monitoring---lookup-failure---telegraf "Process monitoring - lookup failure - telegraf的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
procstat_lookup_result_code != 0
```

处置步骤:

1. 在采集机上按配置的匹配方式手工执行 ps/pgrep 复现；
2. 进程确实不在则按服务恢复流程处理；
3. 进程在但探测失败，检查 procstat 配置的 pid\_file、exe、pattern 是否写错，以及采集账号是否有权限读取 /proc；
4. 容器环境下确认 categraf 是否挂载了宿主机的 /proc。

#### there are processes with 0 count, a certain process may have crashed - telegraf[​](#there-are-processes-with-0-count-a-certain-process-may-have-crashed---telegraf "there are processes with 0 count, a certain process may have crashed - telegraf的直接链接")

S1 紧急 · 持续 1 分钟 · 触发条件:

```
procstat_lookup_running == 0
```

处置步骤:

1. 用 ps -ef | grep <进程关键字> 确认确实不在，排除采集侧的匹配规则写错；
2. 查该进程的日志与 dmesg -T | grep -i 'killed process'，区分自身崩溃、被 OOM 杀死还是人工停止；
3. 按服务自身流程拉起，并确认 systemd 的 Restart 策略是否生效；
4. 若反复退出，先定位根因再拉起，避免陷入重启循环。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 132 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                                                                                                               | 含义                                                                                                                                                                                                                                                                                                                                                                                                      | 单位    |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `cpu_usage_guest`                                                                                                                  | CPU Guest 时间占比 — CPU 为 Guest OS 运行虚拟 CPU 的时间占比。 - 标签 `cpu="cpu-total"`，表示整机的统计值 - 标签 `cpu="0"`，表示 0 号 CPU 的统计值                                                                                                                                                                                                                                                        | %       |
| `cpu_usage_iowait`                                                                                                                 | CPU iowait 时间占比 — 表示 CPU 花费在等待 I/O 操作（输入/输出）完成的时间比例 - 标签 `cpu="cpu-total"`，表示整机的 iowait 占用率 - 标签 `cpu="0"`，表示 0 号 CPU 的 iowait 占用率                                                                                                                                                                                                                         | %       |
| `cpu_usage_steal`                                                                                                                  | CPU Steal 时间占比 — 表示虚拟机（Guest OS）CPU 时间被虚拟化管理器（Hypervisor）用于运行其他虚拟机的时间比例。物理机中这个指标值是 0，没有用处；虚拟机中这个指标值长时间大于 10 表示争抢严重。[参考资料](https://mp.weixin.qq.com/s/zlrfMNrDHJVE5lkTVow5zA) - 标签 `cpu="cpu-total"`，表示整机的统计值 - 标签 `cpu="0"`，表示 0 号 CPU 的统计值                                                            | %       |
| `cpu_usage_nice`                                                                                                                   | CPU 低优先级进程的时间占比 — 在Linux系统中，每个进程都有一个“nice”值，这个值的范围通常是从-20到19。默认的 nice 值为0。负的 nice 值表示高优先级（更快的 CPU 访问），而正的 nice 值表示低优先级（更慢的 CPU 访问）。该指标统计 nice 值为 1-19 的进程的时间占比。 - 标签 `cpu="cpu-total"`，表示整机的统计值 - 标签 `cpu="0"`，表示 0 号 CPU 的统计值                                                        | %       |
| `cpu_usage_system`                                                                                                                 | CPU 内核态时间占比 — 表示 CPU 内核态的时间占比 - 标签 `cpu="cpu-total"`，表示整机的统计值 - 标签 `cpu="0"`，表示 0 号 CPU 的统计值                                                                                                                                                                                                                                                                        | %       |
| `cpu_usage_active`                                                                                                                 | CPU 利用率 — - 标签 `cpu="cpu-total"`，表示整机的 CPU 利用率 - 标签 `cpu="0"`，表示 0 号 CPU 的单核利用率                                                                                                                                                                                                                                                                                                 | %       |
| `cpu_usage_user`                                                                                                                   | CPU 用户态时间占比 — 表示 CPU 用户态的时间占比 - 标签 `cpu="cpu-total"`，表示整机的统计值 - 标签 `cpu="0"`，表示 0 号 CPU 的统计值                                                                                                                                                                                                                                                                        | %       |
| `cpu_usage_irq`                                                                                                                    | CPU 硬中断时间占比 — 表示 CPU 处理硬中断的时间占比 - 标签 `cpu="cpu-total"`，表示整机的统计值 - 标签 `cpu="0"`，表示 0 号 CPU 的统计值                                                                                                                                                                                                                                                                    | %       |
| `cpu_usage_idle`                                                                                                                   | CPU 空闲率 — - 标签 `cpu="cpu-total"`，表示整机的 CPU 空闲率 - 标签 `cpu="0"`，表示 0 号 CPU 的单核空闲率                                                                                                                                                                                                                                                                                                 | %       |
| `cpu_usage_softirq`                                                                                                                | CPU 软中断时间占比 — 表示 CPU 处理软中断的时间占比 - 标签 `cpu="cpu-total"`，表示整机的统计值 - 标签 `cpu="0"`，表示 0 号 CPU 的统计值                                                                                                                                                                                                                                                                    | %       |
| `netstat_tcp_established`                                                                                                          | ESTABLISHED 状态的网络链接数                                                                                                                                                                                                                                                                                                                                                                              |         |
| `netstat_tcp_fin_wait1`                                                                                                            | FIN\_WAIT1 状态的网络链接数                                                                                                                                                                                                                                                                                                                                                                               |         |
| `netstat_tcp_fin_wait2`                                                                                                            | FIN\_WAIT2 状态的网络链接数                                                                                                                                                                                                                                                                                                                                                                               |         |
| `100 * conntrack_ip_conntrack_count / conntrack_ip_conntrack_max`                                                                  | IP conntrack 使用率 — 如果用满了，通常会在系统日志中看到：conntrack table full 这样的报错，可以调整系统最大值解决                                                                                                                                                                                                                                                                                         | %       |
| `netstat_tcp_last_ack`                                                                                                             | LAST\_ACK 状态的网络链接数                                                                                                                                                                                                                                                                                                                                                                                |         |
| `netstat_tcp_listen`                                                                                                               | LISTEN 状态的网络链接数                                                                                                                                                                                                                                                                                                                                                                                   |         |
| `100 * conntrack_nf_conntrack_count / conntrack_nf_conntrack_max`                                                                  | NF conntrack 使用率                                                                                                                                                                                                                                                                                                                                                                                       | %       |
| `increase(kernel_vmstat_oom_kill[1m])`                                                                                             | 1分钟内 OOM 次数统计 — 取自 `/proc/vmstat`，需要较高版本的内核，没记错的话应该是 4.13 以上版本                                                                                                                                                                                                                                                                                                            |         |
| `netstat_tcp_syn_recv`                                                                                                             | SYN\_RECV 状态的网络链接数                                                                                                                                                                                                                                                                                                                                                                                |         |
| `netstat_tcp_syn_sent`                                                                                                             | SYN\_SENT 状态的网络链接数                                                                                                                                                                                                                                                                                                                                                                                |         |
| `netstat_tcp_time_wait`                                                                                                            | TIME\_WAIT 状态的网络链接数 — categraf 配置文件 `conf/input.netstat/netstat.toml` 中 `disable_connection_stats` 默认配置为 true，是因为在网络连接比较多的机器上，获取各个状态的连接数会耗费较多 CPU，所以默认 disable 掉了。                                                                                                                                                                              |         |
| `netstat_tcp_tw`                                                                                                                   | TIME\_WAIT 状态的网络链接数（推荐） — 读取自 `/proc/net/sockstat`。                                                                                                                                                                                                                                                                                                                                       |         |
| `(mem_swap_total - mem_swap_free)/mem_swap_total * 100 and mem_swap_total > 0`                                                     | 交换空间使用率 — 交换空间使用率。计算原子取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                           | %       |
| `mem_swap_total - mem_swap_free`                                                                                                   | 交换空间使用量 — 交换空间使用量。计算原子取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                           | bytes   |
| `mem_swap_total`                                                                                                                   | 交换空间总量 — 交换空间总量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `mem_swap_free`                                                                                                                    | 交换空间空闲量 — 交换空间空闲量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                   | bytes   |
| `mem_buffered`                                                                                                                     | 内存 Buffered 量 — 用作缓冲区的内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                             | bytes   |
| `mem_cached`                                                                                                                       | 内存 Cached 量 — 用作文件缓存的内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                             | bytes   |
| `mem_used_percent`                                                                                                                 | 内存使用率 — 内存使用率                                                                                                                                                                                                                                                                                                                                                                                   | %       |
| `100 - mem_available_percent`                                                                                                      | 内存使用率（基于MemAvailable） — 内存使用率。基于 MemAvailable 计算更准确，但是老版本的 Linux 不支持。                                                                                                                                                                                                                                                                                                    | %       |
| `mem_used`                                                                                                                         | 内存使用量 — 内存使用量 = Total - Free - Buffered - Cached                                                                                                                                                                                                                                                                                                                                                | bytes   |
| `mem_available_percent`                                                                                                            | 内存可用率 — 可以立即分配给进程的可用内存量除以内存总量。分子分母的值均取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                             | %       |
| `mem_available`                                                                                                                    | 内存可用量 — 可以立即分配给进程的可用内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `mem_total`                                                                                                                        | 内存总量 — 内存总量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                               | bytes   |
| `mem_active`                                                                                                                       | 内存活跃量 — 这个字段表示当前活跃使用的内存总量，即系统最近访问过并且预计很快会再次使用的内存页面。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                 | bytes   |
| `mem_free`                                                                                                                         | 内存空闲量 — 未使用的内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `mem_inactive`                                                                                                                     | 内存非活跃量 — 在上一采样周期未以某种方式使用的内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                             | bytes   |
| `netstat_udp_socket`                                                                                                               | 当前 UDP 连接数                                                                                                                                                                                                                                                                                                                                                                                           |         |
| `disk_inodes_used / disk_inodes_total * 100`                                                                                       | 硬盘 inode 使用率 — 如果存储了很多小文件，需要注意 inode 使用情况。                                                                                                                                                                                                                                                                                                                                       | %       |
| `disk_inodes_used`                                                                                                                 | 硬盘 inode 使用量 — 如果存储了很多小文件，需要注意 inode 使用情况。                                                                                                                                                                                                                                                                                                                                       |         |
| `disk_inodes_free`                                                                                                                 | 硬盘 inode 剩余量 — 如果存储了很多小文件，需要注意 inode 使用情况。                                                                                                                                                                                                                                                                                                                                       |         |
| `disk_inodes_total`                                                                                                                | 硬盘 inode 总量 — 如果存储了很多小文件，需要注意 inode 使用情况。                                                                                                                                                                                                                                                                                                                                         |         |
| `irate(diskio_write_time[2m])/irate(diskio_writes[2m])`                                                                            | 硬盘 IO - 写请求平均耗时                                                                                                                                                                                                                                                                                                                                                                                  | ms      |
| `diskio_write_time`                                                                                                                | 硬盘 IO - 写请求等待处理的时间 — 写入请求在磁盘上等待的时间。同时等待的多个写入请求会增加该数字。例如，如果 8 个请求均平均等待 1000 毫秒，则报告 8000。                                                                                                                                                                                                                                                   | ms      |
| `diskio_weighted_io_time`                                                                                                          | 硬盘 IO - 加权 IO 处理时间 — 只要设备在处理 IO，不管同时处理了几个，diskio\_io\_time 就会递增；同时处理的 IO 数量乘以时间就得到加权的值：diskio\_weighted\_io\_time。                                                                                                                                                                                                                                     | ms      |
| `irate(diskio_io_time[2m])/1000*100`                                                                                               | 硬盘 IO - 时间维度 Utilization — 在时间维度统计硬盘 IO 时间占比，比如该值是 50%，表示有 50% 的时间是在处理 IO，该值 100%，表示一直在处理 IO，但是注意，现代磁盘设备具备并行处理多个 I/O 请求的能力，所以即便该值是 100%，可能硬盘还是可以接收新的处理请求。 比如某人有两只手，最近 1 分钟一直在用单手劳动，从时间维度来看，利用率是 100%，但即便是 100%，再给他更多的活，他也能干，因为他还有一只手可用。 | %       |
| `irate(diskio_write_bytes[2m])`                                                                                                    | 硬盘 IO - 每秒写入字节数量                                                                                                                                                                                                                                                                                                                                                                                | bytes/s |
| `irate(diskio_writes{}[2m])`                                                                                                       | 硬盘 IO - 每秒写次数                                                                                                                                                                                                                                                                                                                                                                                      |         |
| `irate(diskio_merged_writes[2m])`                                                                                                  | 硬盘 IO - 每秒合并写请求次数 — 相邻的读取和写入可能会为了效率而被合并。因此，在最终交给磁盘之前，两个4K的读取可能会变成一个8K的读取，因此它将被计数（和排队）为仅有一个I/O。这些字段让你知道这种情况发生的频率。                                                                                                                                                                                          |         |
| `irate(diskio_merged_reads[2m])`                                                                                                   | 硬盘 IO - 每秒合并读请求次数 — 相邻的读取和写入可能会为了效率而被合并。因此，在最终交给磁盘之前，两个4K的读取可能会变成一个8K的读取，因此它将被计数（和排队）为仅有一个I/O。这些字段让你知道这种情况发生的频率。                                                                                                                                                                                          |         |
| `irate(diskio_read_bytes[2m])`                                                                                                     | 硬盘 IO - 每秒读取字节数量                                                                                                                                                                                                                                                                                                                                                                                | bytes/s |
| `irate(diskio_reads{}[2m])`                                                                                                        | 硬盘 IO - 每秒读次数                                                                                                                                                                                                                                                                                                                                                                                      |         |
| `diskio_io_time`                                                                                                                   | 硬盘 IO - 硬盘在处理 IO 的时间 — 硬盘在处理 IO 的时间，单位是毫秒。假设最近 1 秒内有 500 毫秒是在处理 IO，这个值就要加 500，这是一个单调递增的 Counter 值，从操作系统启动之后就会一直涨。实际使用的时候，一般使用该指标计算硬盘 IO UTIL（时间维度的百分比）。                                                                                                                                             | ms      |
| `diskio_iops_in_progress`                                                                                                          | 硬盘 IO - 设备驱动程序正在处理的 IO 数量 — 当前已经分配给设备驱动程序并且尚未完成的请求数量，Gauge 类型。如果 I/O 请求已经进入队列，但是尚未分配给设备驱动程序，则不统计在内。                                                                                                                                                                                                                            |         |
| `irate(diskio_read_time[2m])/irate(diskio_reads[2m])`                                                                              | 硬盘 IO - 读请求平均耗时                                                                                                                                                                                                                                                                                                                                                                                  | ms      |
| `diskio_read_time`                                                                                                                 | 硬盘 IO - 读请求等待处理的时间 — 读取请求在磁盘上等待的时间。同时等待的多个读取请求会增加该数字。例如，如果 5 个请求均平均等待 100 毫秒，则报告 500。                                                                                                                                                                                                                                                     | ms      |
| `irate(diskio_weighted_io_time[1m])/1000`                                                                                          | 硬盘 IO - 队列深度 — 假设过去 1000 毫秒内有 5000 毫秒的加权等待时间，相当于平均有 5 个 IO 请求在等待，即队列深度为 5。                                                                                                                                                                                                                                                                                    |         |
| `disk_used_percent`                                                                                                                | 硬盘使用率 — 硬盘空间使用率。                                                                                                                                                                                                                                                                                                                                                                             | %       |
| `disk_used`                                                                                                                        | 硬盘使用量 — 使用 SI 标准渲染数据，和 df 命令保持一致。                                                                                                                                                                                                                                                                                                                                                   | bytes   |
| `disk_device_error`                                                                                                                | 硬盘信息读取是否出错 — 0 表示正常，没有出错；非 0 表示获取硬盘信息出错了。                                                                                                                                                                                                                                                                                                                                |         |
| `disk_free`                                                                                                                        | 硬盘剩余量 — 使用 SI 标准渲染数据，和 df 命令保持一致。                                                                                                                                                                                                                                                                                                                                                   | bytes   |
| `disk_total`                                                                                                                       | 硬盘总量 — 使用 SI 标准渲染数据，和 df 命令保持一致。                                                                                                                                                                                                                                                                                                                                                     | bytes   |
| `system_n_cpus`                                                                                                                    | 系统 CPU 核数 — CPU 逻辑核的数量。                                                                                                                                                                                                                                                                                                                                                                        |         |
| `system_uptime`                                                                                                                    | 系统启动时长 — 操作系统启动了多久，单位：秒。                                                                                                                                                                                                                                                                                                                                                             | s       |
| `system_load1`                                                                                                                     | 系统平均负载 - 最近 1 分钟 — 取自 `/proc/loadavg`。                                                                                                                                                                                                                                                                                                                                                       |         |
| `system_load15`                                                                                                                    | 系统平均负载 - 最近 15 分钟 — 取自 `/proc/loadavg`。                                                                                                                                                                                                                                                                                                                                                      |         |
| `system_load5`                                                                                                                     | 系统平均负载 - 最近 5 分钟 — 取自 `/proc/loadavg`。                                                                                                                                                                                                                                                                                                                                                       |         |
| `system_load_norm_1`                                                                                                               | 系统平均负载（单核） - 最近 1 分钟 — 相当于 `system_load1 / system_n_cpus`                                                                                                                                                                                                                                                                                                                                |         |
| `system_load_norm_15`                                                                                                              | 系统平均负载（单核） - 最近 15 分钟 — 相当于 `system_load15 / system_n_cpus`                                                                                                                                                                                                                                                                                                                              |         |
| `system_load_norm_5`                                                                                                               | 系统平均负载（单核） - 最近 5 分钟 — 相当于 `system_load5 / system_n_cpus`                                                                                                                                                                                                                                                                                                                                |         |
| `irate(net_drop_in[2m])`                                                                                                           | 网卡入方向（接收）每秒丢弃的数据包个数 — 原始指标 net\_drop\_in 表示操作系统启动之后各个网卡入方向（接收）丢弃的数据包总数。                                                                                                                                                                                                                                                                              |         |
| `irate(net_packets_recv[2m])`                                                                                                      | 网卡入方向（接收）每秒数据包数 — 原始指标 net\_packets\_recv 表示操作系统启动之后各个网卡入方向（接收）数据包总数。                                                                                                                                                                                                                                                                                       |         |
| `irate(net_err_in[2m])`                                                                                                            | 网卡入方向（接收）每秒错包数 — 原始指标 net\_err\_in 表示操作系统启动之后各个网卡入方向（接收）错包总数。                                                                                                                                                                                                                                                                                                 |         |
| `irate(net_drop_out[2m])`                                                                                                          | 网卡出方向（发送）每秒丢弃的数据包个数 — 原始指标 net\_drop\_out 表示操作系统启动之后各个网卡出方向（发送）丢弃的数据包总数。                                                                                                                                                                                                                                                                             |         |
| `irate(net_packets_sent[2m])`                                                                                                      | 网卡出方向（发送）每秒数据包数 — 原始指标 net\_packets\_sent 表示操作系统启动之后各个网卡出方向（发送）数据包总数。                                                                                                                                                                                                                                                                                       |         |
| `irate(net_err_out[2m])`                                                                                                           | 网卡出方向（发送）每秒错包数 — 原始指标 net\_err\_out 表示操作系统启动之后各个网卡出方向（发送）错包总数。                                                                                                                                                                                                                                                                                                |         |
| `irate(net_bytes_sent[2m]) * 8`                                                                                                    | 网卡每秒发送的 bit 量 — 原始指标 net\_bytes\_sent 表示操作系统启动之后发送的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。                                                                                                                                                                                                                                                       | bit/s   |
| `irate(net_bytes_recv[2m]) * 8`                                                                                                    | 网卡每秒接收的 bit 量 — 原始指标 net\_bytes\_recv 表示操作系统启动之后接收的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。                                                                                                                                                                                                                                                       | bit/s   |
| `processes_dead`                                                                                                                   | 进程数 - “僵死”状态的进程数 — 处于“僵死”状态的进程数，它是由 Linux 上的 X 状态代码表示的。                                                                                                                                                                                                                                                                                                                |         |
| `processes_paging`                                                                                                                 | 进程数 - “分页”状态的进程数 — 处于“分页”状态的进程数，它是由 Linux 上的 W 状态代码表示的。                                                                                                                                                                                                                                                                                                                |         |
| `processes_stopped`                                                                                                                | 进程数 - 停止的进程数 — 停止的进程数，由 T 状态代码表示。                                                                                                                                                                                                                                                                                                                                                 |         |
| `processes_zombies`                                                                                                                | 进程数 - 僵尸进程数 — 僵尸进程数，由 Z 状态代码表示。                                                                                                                                                                                                                                                                                                                                                     |         |
| `processes_total`                                                                                                                  | 进程数 - 总数 — 实例上的总进程数。                                                                                                                                                                                                                                                                                                                                                                        |         |
| `processes_unknown`                                                                                                                | 进程数 - 未知状态的进程数 — 未知状态的进程数。                                                                                                                                                                                                                                                                                                                                                            |         |
| `processes_sleeping`                                                                                                               | 进程数 - 正在睡眠的进程数 — 睡眠的进程数，由 S 状态代码表示。                                                                                                                                                                                                                                                                                                                                             |         |
| `processes_running`                                                                                                                | 进程数 - 正在运行的进程数 — 正在运行的进程数，由 R 状态代码表示。                                                                                                                                                                                                                                                                                                                                         |         |
| `processes_idle`                                                                                                                   | 进程数 - 空闲的数量 — 处于空闲状态 (睡眠超过 20 秒) 的进程数。                                                                                                                                                                                                                                                                                                                                            |         |
| `processes_total_threads`                                                                                                          | 进程数 - 线程总数 — 组成进程的总线程数。该指标仅适用于 Linux 实例。                                                                                                                                                                                                                                                                                                                                       |         |
| `processes_blocked`                                                                                                                | 进程数 - 被阻止的进程数 — 被阻止的进程数量。                                                                                                                                                                                                                                                                                                                                                              |         |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="steal"}[2m]) ) * 100`                                                 | CPU Steal 时间占比（整机平均）                                                                                                                                                                                                                                                                                                                                                                            | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="system"}[2m]) ) * 100`                                                | CPU 内核态时间占比（整机平均）                                                                                                                                                                                                                                                                                                                                                                            | %       |
| `avg without (mode,cpu) ( 1 - irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100`                                              | CPU 利用率（整机平均）                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="user"}[2m]) ) * 100`                                                  | CPU 用户态时间占比（整机平均）                                                                                                                                                                                                                                                                                                                                                                            | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="irq"}[2m]) ) * 100`                                                   | CPU 硬中断时间占比（整机平均）                                                                                                                                                                                                                                                                                                                                                                            | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100`                                                  | CPU 空闲率（整机平均）                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="softirq"}[2m]) ) * 100`                                               | CPU 软中断时间占比（整机平均）                                                                                                                                                                                                                                                                                                                                                                            | %       |
| `(node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes)/node_memory_SwapTotal_bytes * 100 and node_memory_SwapTotal_bytes > 0` | 交换空间使用率 — 交换空间使用率。计算原子取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                           | %       |
| `node_memory_SwapTotal_bytes`                                                                                                      | 交换空间总量 — 交换空间总量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `node_memory_SwapFree_bytes`                                                                                                       | 交换空间空闲量 — 交换空间空闲量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                   | bytes   |
| `node_memory_Buffers_bytes`                                                                                                        | 内存 Buffered 量 — 用作缓冲区的内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                             | bytes   |
| `node_memory_Cached_bytes`                                                                                                         | 内存 Cached 量 — 用作文件缓存的内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                             | bytes   |
| `(1 - (node_memory_MemAvailable_bytes{} / node_memory_MemTotal_bytes{})) * 100`                                                    | 内存使用率（基于MemAvailable） — 内存使用率。基于 MemAvailable 计算更准确，但是老版本的 Linux 不支持。                                                                                                                                                                                                                                                                                                    | %       |
| `node_memory_MemAvailable_bytes`                                                                                                   | 内存可用量 — 可以立即分配给进程的可用内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `node_memory_MemTotal_bytes`                                                                                                       | 内存总量 — 内存总量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                               | bytes   |
| `node_memory_MemFree_bytes`                                                                                                        | 内存空闲量 — 未使用的内存量。取自 `/proc/meminfo`。                                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `node_filefd_allocated / node_filefd_maximum * 100`                                                                                | 文件句柄 - 已分配占比                                                                                                                                                                                                                                                                                                                                                                                     | %       |
| `node_filefd_allocated`                                                                                                            | 文件句柄 - 已分配量                                                                                                                                                                                                                                                                                                                                                                                       | 个      |
| `node_filefd_maximum`                                                                                                              | 文件句柄 - 总可分配量                                                                                                                                                                                                                                                                                                                                                                                     | 个      |
| `irate(node_disk_io_time_seconds_total[2m]) * 100`                                                                                 | 硬盘 IO - 时间维度 Utilization — 在时间维度统计硬盘 IO 时间占比，比如该值是 50%，表示有 50% 的时间是在处理 IO，该值 100%，表示一直在处理 IO，但是注意，现代磁盘设备具备并行处理多个 I/O 请求的能力，所以即便该值是 100%，可能硬盘还是可以接收新的处理请求。 比如某人有两只手，最近 1 分钟一直在用单手劳动，从时间维度来看，利用率是 100%，但即便是 100%，再给他更多的活，他也能干，因为他还有一只手可用。 | %       |
| `irate(node_disk_written_bytes_total[2m])`                                                                                         | 硬盘 IO - 每秒写入字节数量                                                                                                                                                                                                                                                                                                                                                                                | bytes/s |
| `irate(node_disk_writes_completed_total{}[2m])`                                                                                    | 硬盘 IO - 每秒写次数 — 每秒写次数                                                                                                                                                                                                                                                                                                                                                                         |         |
| `irate(node_disk_read_bytes_total[2m])`                                                                                            | 硬盘 IO - 每秒读取字节数量                                                                                                                                                                                                                                                                                                                                                                                | bytes/s |
| `irate(node_disk_reads_completed_total{}[2m])`                                                                                     | 硬盘 IO - 每秒读次数 — 每秒读次数                                                                                                                                                                                                                                                                                                                                                                         |         |
| `100 - ((node_filesystem_avail_bytes{} * 100) / node_filesystem_size_bytes{})`                                                     | 硬盘使用率 — 硬盘空间使用率。                                                                                                                                                                                                                                                                                                                                                                             | %       |
| `node_filesystem_free_bytes`                                                                                                       | 硬盘剩余量 — 使用 SI 标准渲染数据，和 df 命令保持一致。                                                                                                                                                                                                                                                                                                                                                   | bytes   |
| `node_filesystem_avail_bytes`                                                                                                      | 硬盘可用量 — 使用 SI 标准渲染数据，和 df 命令保持一致。                                                                                                                                                                                                                                                                                                                                                   | bytes   |
| `node_filesystem_size_bytes`                                                                                                       | 硬盘总量 — 使用 SI 标准渲染数据，和 df 命令保持一致。                                                                                                                                                                                                                                                                                                                                                     | bytes   |
| `count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                                   | 系统 CPU 核数 — CPU 逻辑核的数量。                                                                                                                                                                                                                                                                                                                                                                        |         |
| `node_load1`                                                                                                                       | 系统平均负载 - 最近 1 分钟 — 取自 `/proc/loadavg`。                                                                                                                                                                                                                                                                                                                                                       |         |
| `node_load15`                                                                                                                      | 系统平均负载 - 最近 15 分钟 — 取自 `/proc/loadavg`。                                                                                                                                                                                                                                                                                                                                                      |         |
| `node_load5`                                                                                                                       | 系统平均负载 - 最近 5 分钟 — 取自 `/proc/loadavg`。                                                                                                                                                                                                                                                                                                                                                       |         |
| `node_load1 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                      | 系统平均负载（单核） - 最近 1 分钟                                                                                                                                                                                                                                                                                                                                                                        |         |
| `node_load15 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                     | 系统平均负载（单核） - 最近 15 分钟                                                                                                                                                                                                                                                                                                                                                                       |         |
| `node_load5 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                      | 系统平均负载（单核） - 最近 5 分钟                                                                                                                                                                                                                                                                                                                                                                        |         |
| `irate(node_network_receive_drop_total[2m])`                                                                                       | 网卡入方向（接收）每秒丢弃的数据包个数 — 原始指标 node\_network\_receive\_drop\_total 表示操作系统启动之后各个网卡入方向（接收）丢弃的数据包总数。                                                                                                                                                                                                                                                        |         |
| `irate(node_network_receive_packets_total[2m])`                                                                                    | 网卡入方向（接收）每秒数据包数 — 原始指标 node\_network\_receive\_packets\_total 表示操作系统启动之后各个网卡入方向（接收）数据包总数。                                                                                                                                                                                                                                                                   |         |
| `irate(node_network_receive_errs_total[2m])`                                                                                       | 网卡入方向（接收）每秒错包数 — 原始指标 node\_network\_receive\_errs\_total 表示操作系统启动之后各个网卡入方向（接收）错包总数。                                                                                                                                                                                                                                                                          |         |
| `irate(node_network_transmit_drop_total[2m])`                                                                                      | 网卡出方向（发送）每秒丢弃的数据包个数 — 原始指标 node\_network\_transmit\_drop\_total 表示操作系统启动之后各个网卡出方向（发送）丢弃的数据包总数。                                                                                                                                                                                                                                                       |         |
| `irate(node_network_transmit_packets_total[2m])`                                                                                   | 网卡出方向（发送）每秒数据包数 — 原始指标 node\_network\_transmit\_packets\_total 表示操作系统启动之后各个网卡出方向（发送）数据包总数。                                                                                                                                                                                                                                                                  |         |
| `irate(node_network_transmit_errs_total[2m])`                                                                                      | 网卡出方向（发送）每秒错包数 — 原始指标 node\_network\_transmit\_errs\_total 表示操作系统启动之后各个网卡出方向（发送）错包总数。                                                                                                                                                                                                                                                                         |         |
| `irate(node_network_transmit_bytes_total[2m]) * 8`                                                                                 | 网卡每秒发送的 bit 量 — 原始指标 node\_network\_transmit\_bytes\_total 表示操作系统启动之后发送的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。                                                                                                                                                                                                                                  | bit/s   |
| `irate(node_network_receive_bytes_total[2m]) * 8`                                                                                  | 网卡每秒接收的 bit 量 — 原始指标 node\_network\_receive\_bytes\_total 表示操作系统启动之后接收的 byte 总量，因为网卡流量习惯使用 bit 作为单位，所以在表达式中做了换算。                                                                                                                                                                                                                                   | bit/s   |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Linux 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Linux）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Linux%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `arp_packet` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/arp_packet)：完整配置项和指标列表。
* [Categraf `kernel_vmstat` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/kernel_vmstat)：完整配置项和指标列表。
* [Categraf `netstat` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/netstat)：完整配置项和指标列表。
* [Categraf `node_exporter` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/node_exporter)：完整配置项和指标列表。
* [Categraf `ntp` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/ntp)：完整配置项和指标列表。
* [Categraf `processes` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/processes)：完整配置项和指标列表。
* [Categraf `supervisor` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/supervisor)：完整配置项和指标列表。
* [实践：监控 Linux 主机](https://n9e.github.io/zh/docs/practice/linux.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
