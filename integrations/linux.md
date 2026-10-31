---
title: "Monitor Linux with Nightingale"
sidebar_label: "Linux"
description: "CPU, memory, disk, network, processes and kernel parameters out of the box; templates cover Categraf, node_exporter and Telegraf metric names."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Linux
toc_max_heading_level: 2
mdx:
  format: md
---

Linux hosts are where most monitoring starts. Categraf's cpu, mem, disk, diskio, net, netstat, kernel and processes inputs are enabled by default and report as soon as the agent starts. The configs listed below are the plugins that have options worth tuning.

The templates come in three sets, written against Categraf, node_exporter and Telegraf metric names respectively. Import the set that matches your collector; mixing them produces empty panels. The rules cover the things that actually page people: disks predicted to fill up, busy IO, conntrack exhaustion, clock drift and hosts going silent.

## What's in the template

- **5 dashboards**, 71 panels in total
- **60 alert rules**, each with runbook steps
- **132 metric descriptions**
- **Categraf collector config**: `input.arp_packet`, `input.kernel_vmstat`, `input.logs-agent`, `input.netstat`, `input.node_exporter`, `input.ntp`, `input.processes`, `input.sshd`, `input.supervisor`

## How to connect

1. [Install Categraf](/docs/data/categraf/install) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

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

1. Open the integration center in Nightingale, find Linux, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Common Machine Metrics (to only see machines of the current business group, change the dashboard variable ident to the host-ident type) | 22 |
| Machine Inventory Table View (Categraf as collector) | 3 |
| Machine Process Count (Categraf as collector) | 4 |
| Host Table NG | 1 |
| Common Machine Metrics (NodeExporter as collector) | 41 |

## Bundled alert rules

60 rules, disabled on import so you can enable them one by one with your own thresholds. The PromQL condition and runbook steps for the 56 rules in the table below are in the alert rule library: [Linux alert rules](/alert-rules/linux).

| Rule | Severity | For |
| --- | --- | --- |
| Conntrack table usage exceeds 80% | S2 Warning | 1m |
| CPU usage high | S3 Info | 1m |
| HTTP probe failed | S2 Warning | 1m |
| IO busy | S2 Warning | 1m |
| NTP time offset too large | S2 Warning | 1m |
| PING probe failed | S2 Warning | 1m |
| TIME_WAIT connections exceed 20000, worth attention | S2 Warning | 1m |
| Memory usage high | S3 Info | 1m |
| File handle usage exceeds 90% | S2 Warning | 1m |
| Average load per CPU core exceeds 3 | S2 Warning | 1m |
| Disk monitoring - inode usage exceeds 90% | S2 Warning | 1m |
| Disk monitoring - disk larger than 200G is running out of space | S3 Info | 1m |
| Disk monitoring - disk smaller than 200G is running out of space | S3 Info | 1m |
| Disk monitoring - device errors reported | S2 Warning | 1m |
| Disk monitoring - disk predicted to be full within 4 hours | S1 Critical | 1m |
| OOM occurred on the system | S2 Warning | — |
| NIC monitoring - inbound packet loss | S3 Info | 1m |
| NIC monitoring - inbound packet errors | S3 Info | 1m |
| NIC monitoring - outbound packet loss | S3 Info | 1m |
| NIC monitoring - outbound packet errors | S3 Info | 1m |
| Network probe failed | S2 Warning | 1m |
| Process monitoring - a process count is 0, the process may be down | S1 Critical | 1m |
| Process monitoring - process file handle limit too small | S3 Info | 1m |
| Process monitoring - total processes exceed 600 | S2 Warning | 1m |
| Hard disk - expected to be written full in 4 hours - categraf | S1 Critical | 1m |
| Hard disk - IO is a bit busy - categraf | S2 Warning | 1m |
| Machine load - high memory, please pay attention - categraf | S3 Info | 1m |
| number of TME_WAIT exceeds 20,000 - categraf | S2 Warning | 1m |
| packet loss in the inbound direction - categraf | S3 Info | 1m |
| packet loss in the outbound direction - categraf | S3 Info | 1m |
| Disk larger than 200G is running out of space | S3 Info | 1m |
| Disk smaller than 200G is running out of space | S3 Info | 1m |
| A certain disk is unable to read/write normally | S1 Critical | 1m |
| Disk needs to be cleaned - utilization has reached 92% - node exporter | S1 Critical | 1m |
| Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter | S2 Warning | 1m |
| Insufficient file handles - usage exceeds 90% - node exporter | S2 Warning | 1m |
| Insufficient inode resources - usage exceeds 90% - node exporter | S2 Warning | 1m |
| Insufficient memory resources - utilization is greater than 75% - node exporter | S2 Warning | 1m |
| Insufficient memory resources - utilization is greater than 95% - node exporter | S1 Critical | 1m |
| Packet loss in the inbound direction of the network card - node exporter | S2 Warning | 1m |
| Packet loss in the outbound direction of the network card - node exporter | S2 Warning | 1m |
| System conntrack needs to be adjusted - usage exceeds 80% - node exporter | S2 Warning | 1m |
| System experiences OOM - node exporter | S2 Warning | 1m |
| Too many running processes - exceeding 3000 - node exporter | S2 Warning | 1m |
| Address is unreachable by PING, please pay attention - telegraf | S1 Critical | 1m |
| Hard disk - expected to be written full in 4 hours - telegraf | S1 Critical | 1m |
| Hard disk - IO is very busy - telegraf | S2 Warning | 1m |
| Machine load - high CPU, please pay attention - telegraf | S3 Info | 1m |
| Machine load - high memory, please pay attention - telegraf | S2 Warning | 1m |
| Network connection - number of TME_WAIT exceeds 20,000 - telegraf | S2 Warning | 1m |
| packet loss in the inbound direction - telegraf | S3 Info | 1m |
| packet loss in the outbound direction - telegraf | S3 Info | 1m |
| Port detection failed, please pay attention - telegraf | S1 Critical | 1m |
| process handle limit is too small - telegraf | S3 Info | 1m |
| Process monitoring - lookup failure - telegraf | S1 Critical | 1m |
| there are processes with 0 count, a certain process may have crashed - telegraf | S1 Critical | 1m |

### Other rules (4)

These rules are not in the alert rule library, so they are listed here in full.

#### Machine monitoring - agent lost for more than 60 seconds

Runbook:

1. First confirm the machine itself is alive with ping and ssh — if it is down, handle it as a host outage;
1. If it is alive, run systemctl status categraf to check the agent process and journalctl -u categraf -n 100 to locate the cause;
1. Common causes are an agent crash, a config error, or network/auth failure to the server — verify by curling the server's write endpoint by hand;
1. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

#### Machine monitoring - time offset exceeds 3 seconds, attention

for 1 min

Runbook:

1. Run date and chronyc tracking to check the local time and the offset;
1. Confirm chronyd/ntpd is running, and if not, start it and enable it at boot;
1. Check that 123/UDP to the NTP server is allowed, switching to an internal NTP source if needed;
1. When the offset is large, use chronyc makestep to step the clock, preparing time-sensitive workloads first.

#### Lost connection with monitoring target - categraf

Runbook:

1. First confirm the machine itself is alive with ping and ssh — if it is down, handle it as a host outage;
1. If it is alive, run systemctl status categraf to check the agent process and journalctl -u categraf -n 100 to locate the cause;
1. Common causes are an agent crash, a config error, or network/auth failure to the server — verify by curling the server's write endpoint by hand;
1. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

#### Lost connection with monitoring target - telegraf

Runbook:

1. First confirm the machine itself is alive with ping and ssh — if it is down, handle it as a host outage;
1. If it is alive, run systemctl status categraf to check the agent process and journalctl -u categraf -n 100 to locate the cause;
1. Common causes are an agent crash, a config error, or network/auth failure to the server — verify by curling the server's write endpoint by hand;
1. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

## Metric reference

132 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `cpu_usage_guest` | CPU Guest time ratio — The proportion of time the CPU spends running the virtual CPU for the Guest OS. Label ` cpu = "cpu-total" `, indicating the statistical value of the whole machine; Tag ` CPU = "0" `, indicating the statistical value of CPU number 0 | % |
| `cpu_usage_iowait` | CPU iowait time ratio — Represents the proportion of time the CPU spends waiting for I/O operations (input/output) to complete; Tag ` cpu = "cpu-total" `, indicating the iowait occupancy rate of the whole machine; Tag ` CPU = "0" `, indicating iowait usage rate of CPU # 0 | % |
| `cpu_usage_steal` | CPU Steal time ratio — Represents the proportion of time that the virtual machine (Guest OS) CPU time is used by the virtualization manager (Hypervisor) to run other virtual machines. The value of this indicator in the physical machine is 0, which is useless; If the value of this indicator in the virtual machine is greater than 10 for a long time, it means that the competition is serious. [Reference] (https://mp.weixin.qq.com/s/zlrfMNrDHJVE5lkTVow5zA); Label ` cpu = "cpu-total" `, indicating the statistical value of the whole machine; Tag ` CPU = "0" `, indicating the statistical value of CPU number 0 | % |
| `cpu_usage_nice` | Time proportion of CPU low-priority processes — In Linux systems, each process has a "nice" value, which usually ranges from-20 to 19. The default nice value is 0. A negative nice value indicates high priority (faster CPU access), while a positive nice value indicates low priority (slower CPU access). This indicator counts the time proportion of processes with nice values of 1-19. Tag ` cpu = "cpu-total" `, indicating the statistical value of the whole machine; Tag ` CPU = "0" `, indicating the statistical value of CPU number 0 | % |
| `cpu_usage_system` | CPU core mode time ratio — Represents the time ratio of CPU core mode; Tag ` cpu = "cpu-total" `, indicating the statistical value of the whole machine; Tag ` CPU = "0" `, indicating the statistical value of CPU number 0 | % |
| `cpu_usage_active` | CPU utilization — -Tag ` CPU = "CPU-total" `, indicating the CPU utilization of the whole machine; Tag ` CPU = "0" `, indicating single-core utilization of CPU # 0 | % |
| `cpu_usage_user` | CPU user mode time ratio — Indicates the time ratio of CPU user mode; Tag ` cpu = "cpu-total" `, indicating the statistical value of the whole machine; Tag ` CPU = "0" `, indicating the statistical value of CPU number 0 | % |
| `cpu_usage_irq` | CPU hard interrupt time ratio — Indicates the proportion of time spent by the CPU handling hard interrupts; Tag ` cpu = "cpu-total" `, indicating the statistical value of the whole machine; Tag ` CPU = "0" `, indicating the statistical value of CPU number 0 | % |
| `cpu_usage_idle` | CPU idle rate — -Tag ` CPU = "CPU-total" `, indicating the CPU idle rate of the whole machine; Tag ` CPU = "0" `, indicating the single core idle rate of CPU # 0 | % |
| `cpu_usage_softirq` | CPU soft interrupt time ratio — Indicates the proportion of time the CPU takes to process soft interrupts; Tag ` cpu = "cpu-total" `, indicating the statistical value of the whole machine; Tag ` CPU = "0" `, indicating the statistical value of CPU number 0 | % |
| `netstat_tcp_established` | Number of network links with ESTABLISHED status |  |
| `netstat_tcp_fin_wait1` | Number of network links in FIN _ WAIT1 state |  |
| `netstat_tcp_fin_wait2` | Number of network links in FIN _ WAIT2 state |  |
| `100 * conntrack_ip_conntrack_count / conntrack_ip_conntrack_max` | IP conntrack usage — If it is full, you will usually see errors such as: conntrack table full in the system log. You can adjust the maximum value of the system to solve the problem | % |
| `netstat_tcp_last_ack` | Number of network links in LAST _ ACK state |  |
| `netstat_tcp_listen` | Number of network links in LISTEN status |  |
| `100 * conntrack_nf_conntrack_count / conntrack_nf_conntrack_max` | NF conntrack usage | % |
| `increase(kernel_vmstat_oom_kill[1m])` | OOM number statistics within 1 minute — Taken from `/proc/vmstat `, requires a higher version of the kernel, if I remember correctly, it should be 4.13 or above |  |
| `netstat_tcp_syn_recv` | Number of network links in SYN _ RECV state |  |
| `netstat_tcp_syn_sent` | Number of network links in SYN _ SENT state |  |
| `netstat_tcp_time_wait` | Number of network links in TIME _ WAIT state — The default configuration of ` disable _ connection _ stats ` in the categraf configuration file ` conf/input.netstat/netstat.toml ` is true because on machines with many network connections, obtaining the number of connections in each state will consume more CPU, so the default disable is dropped. |  |
| `netstat_tcp_tw` | Number of network links in TIME _ WAIT state (recommended) — Read from `/proc/net/sockstat `. |  |
| `(mem_swap_total - mem_swap_free)/mem_swap_total * 100 and mem_swap_total > 0` | Swap space usage — Swap space usage. The computational atom is taken from `/proc/meminfo `. | % |
| `mem_swap_total - mem_swap_free` | Swap space usage — Swap space usage. The computational atom is taken from `/proc/meminfo `. | bytes |
| `mem_swap_total` | Total swap space — Total amount of swap space. Taken from `/proc/meminfo `. | bytes |
| `mem_swap_free` | Swap space free amount — Swap space free amount. Taken from `/proc/meminfo `. | bytes |
| `mem_buffered` | Memory Buffered amount — The amount of memory used as a buffer. Taken from `/proc/meminfo `. | bytes |
| `mem_cached` | Memory Cached amount — The amount of memory used as a file cache. Taken from `/proc/meminfo `. | bytes |
| `mem_used_percent` | Memory usage — Memory usage | % |
| `100 - mem_available_percent` | Memory usage (based on MemAvailable) — Memory usage. Calculation based on MemAvailable is more accurate, but older versions of Linux do not support it. | % |
| `mem_used` | Memory usage — Memory usage = Total-Free-Buffered-Cached | bytes |
| `mem_available_percent` | Memory availability — The amount of available memory that can be immediately allocated to the process divided by the total amount of memory. The values of numerator and denominator are taken from `/proc/meminfo `. | % |
| `mem_available` | Memory Availability — The amount of available memory that can be immediately allocated to a process. Taken from `/proc/meminfo `. | bytes |
| `mem_total` | Total memory — Total amount of memory. Taken from `/proc/meminfo `. | bytes |
| `mem_active` | Memory activity — This field indicates the total amount of memory currently actively used, that is, the memory pages that the system has recently visited and is expected to be used again soon. Taken from `/proc/meminfo `. | bytes |
| `mem_free` | Free memory amount — Amount of unused memory. Taken from `/proc/meminfo `. | bytes |
| `mem_inactive` | Memory inactivity — The amount of memory that was not used in some way in the previous sampling period. Taken from `/proc/meminfo `. | bytes |
| `netstat_udp_socket` | Number of current UDP connections |  |
| `disk_inodes_used / disk_inodes_total * 100` | Hard disk inode usage — If you store a lot of small files, you need to pay attention to inode usage. | % |
| `disk_inodes_used` | Hard disk inode usage — If you store a lot of small files, you need to pay attention to inode usage. |  |
| `disk_inodes_free` | Remaining amount of hard disk inode — If you store a lot of small files, you need to pay attention to inode usage. |  |
| `disk_inodes_total` | Total amount of hard disk inode — If you store a lot of small files, you need to pay attention to inode usage. |  |
| `irate(diskio_write_time[2m])/irate(diskio_writes[2m])` | Hard disk IO-Write request average time | ms |
| `diskio_write_time` | Hard Drive IO-Time the write request waits to be processed — The time a write request waits on disk. Multiple write requests waiting simultaneously increase this number. For example, if 8 requests all wait an average of 1000 milliseconds, 8000 is reported. | ms |
| `diskio_weighted_io_time` | Hard Disk IO-Weighted IO Processing Time — As long as the device is processing IO, no matter how many are processed at the same time, diskio _ IO _ time will be incremented; The number of simultaneously processed IOs is multiplied by time to obtain a weighted value: diskio _ weighted _ IO _ time. | ms |
| `irate(diskio_io_time[2m])/1000*100` | Hard Disk IO-Time Dimension Utilization — Count the proportion of hard disk IO time in the time dimension. For example, if the value is 50%, it means that 50% of the time is processing IO, and if the value is 100%, it means that IO has been processing all the time. However, note that modern disk devices have the ability to process multiple I/O requests in parallel, so even if the value is 100%, the hard disk may still be able to receive new processing requests. For example, someone has two hands and has been working with one hand in the last minute. From the time dimension, the utilization rate is 100%, but even if it is 100%, he can do it if he is given more work, because he still has one hand available. | % |
| `irate(diskio_write_bytes[2m])` | Hard disk IO-bytes written per second | bytes/s |
| `irate(diskio_writes{}[2m])` | Hard drive IO-writes per second |  |
| `irate(diskio_merged_writes[2m])` | Hard Disk IO-Number of merged write requests per second — Adjacent reads and writes may be merged for efficiency. So two 4K reads may turn into an 8K read before finally handing it over to disk, so it will be counted (and queued) to have only one I/O. These fields let you know how often this happens. |  |
| `irate(diskio_merged_reads[2m])` | Hard disk IO-merge read requests per second — Adjacent reads and writes may be merged for efficiency. So two 4K reads may turn into an 8K read before finally handing it over to disk, so it will be counted (and queued) to have only one I/O. These fields let you know how often this happens. |  |
| `irate(diskio_read_bytes[2m])` | Hard Drive IO-bytes read per second | bytes/s |
| `irate(diskio_reads{}[2m])` | Hard drive IO-Reads per second |  |
| `diskio_io_time` | Hard Disk IO-Time the hard disk takes to process IO — The time it takes for the hard disk to process IO, in milliseconds. Assuming that 500 milliseconds are processing IO in the last 1 second, this value will be increased by 500. This is a monotonically increasing Counter value, which will continue to rise after the operating system is started. In actual use, this indicator is generally used to calculate the hard disk IO UTIL (percentage of time dimension). | ms |
| `diskio_iops_in_progress` | Hard Disk IO-Number of IO being processed by the device driver — The number of requests that have been currently assigned to the device driver and have not been completed, Gauge type. If I/O requests have entered the queue, but have not been assigned to the device driver, they are not counted. |  |
| `irate(diskio_read_time[2m])/irate(diskio_reads[2m])` | Hard disk IO-Read request average time | ms |
| `diskio_read_time` | Hard Drive IO-Time for read requests to be processed — The time the read request waits on disk. Multiple read requests waiting simultaneously increase this number. For example, if 5 requests all wait an average of 100 milliseconds, 500 is reported. | ms |
| `irate(diskio_weighted_io_time[1m])/1000` | Hard Disk IO-Queue Depth — Assuming that there is a weighted waiting time of 5000 ms in the past 1000 ms, it is equivalent to an average of 5 IO requests waiting, that is, the queue depth is 5. |  |
| `disk_used_percent` | Hard Drive Usage — Hard disk space usage. | % |
| `disk_used` | Hard drive usage — Use the SI standard to render data, consistent with the df command. | bytes |
| `disk_device_error` | Is there an error in reading hard disk information — 0 means normal, no error; A non-0 indicates an error occurred in obtaining hard disk information. |  |
| `disk_free` | Remaining hard disk — Use the SI standard to render data, consistent with the df command. | bytes |
| `disk_total` | Total hard disk — Use the SI standard to render data, consistent with the df command. | bytes |
| `system_n_cpus` | Number of CPU cores — Number of CPU logical cores. |  |
| `system_uptime` | System startup time — How long has the operating system been booted, in seconds. | s |
| `system_load1` | System load average-last 1 minute — Taken from `/proc/loadavg `. |  |
| `system_load15` | System load average-last 15 minutes — Taken from `/proc/loadavg `. |  |
| `system_load5` | System load average-last 5 minutes — Taken from `/proc/loadavg `. |  |
| `system_load_norm_1` | System Load Average (Single Core)-Last 1 Minute — Equivalent to ` system _ load1/system _ n _ cpus ` |  |
| `system_load_norm_15` | System Load Average (Single Core)-Last 15 Minutes — Equivalent to ` system _ load15/system _ n _ cpus ` |  |
| `system_load_norm_5` | System Load Average (Single Core)-Last 5 Minutes — Equivalent to ` system _ load5/system _ n _ cpus ` |  |
| `irate(net_drop_in[2m])` | Number of packets dropped per second in the incoming direction (receiving) of the network card — The original indicator net _ drop _ in indicates the total number of packets dropped (received) by each network card after the operating system is started. |  |
| `irate(net_packets_recv[2m])` | NIC incoming (receiving) packets per second — The original indicator net _ packets _ recv indicates the total number of incoming (received) data packets by each network card after the operating system is booted. |  |
| `irate(net_err_in[2m])` | Number of wrong packets per second in the incoming direction (receiving) of the network card — The original indicator net _ err _ in indicates the total number of error packets in (received) by each network card after the operating system is started. |  |
| `irate(net_drop_out[2m])` | Number of packets discarded per second in the outbound direction (sending) of the network card — The original indicator net _ drop _ out indicates the total number of packets discarded (sent) by each network card outbound after the operating system is started. |  |
| `irate(net_packets_sent[2m])` | Number of packets per second in the outgoing direction (sent) of the network card — The original indicator net _ packets _ sent indicates the total number of outbound (sent) data packets from each network card after the operating system is started. |  |
| `irate(net_err_out[2m])` | Number of wrong packets per second in the outgoing direction (sending) of the network card — The original indicator net _ errr _ out indicates the total number of error packets sent out by each network card after the operating system is started. |  |
| `irate(net_bytes_sent[2m]) * 8` | The amount of bits sent per second by the network card — The original indicator net _ bytes _ sent represents the total number of bytes sent after the operating system is started. Because the network card traffic is used to using bits as the unit, it is converted in the expression. | bit/s |
| `irate(net_bytes_recv[2m]) * 8` | The number of bits received by the network card per second — The original indicator net _ bytes _ recv represents the total number of bytes received after the operating system is started. Because the network card traffic is used to using bits as the unit, it is converted in the expression. | bit/s |
| `processes_dead` | Number of processes-Number of processes in the "dead" state — The number of processes in the "dead" state, which is represented by the X status code on Linux. |  |
| `processes_paging` | Number of Processes-Number of processes in the "Paging" state — The number of processes in the "paging" state, which is represented by the W status code on Linux. |  |
| `processes_stopped` | Number of Processes-Number of stopped processes — The number of processes stopped, represented by the T status code. |  |
| `processes_zombies` | Number of processes-Number of zombie processes — Number of zombie processes, represented by the Z status code. |  |
| `processes_total` | Number of processes-total — The total number of processes on the instance. |  |
| `processes_unknown` | Number of Processes-Number of processes with unknown status — Number of processes with unknown status. |  |
| `processes_sleeping` | Number of processes-Number of processes that are sleeping — Number of sleeping processes, represented by the S status code. |  |
| `processes_running` | Number of Processes-Number of processes running — The number of processes running, represented by the R status code. |  |
| `processes_idle` | Number of processes-Number of idle — Number of processes that are idle (sleeping for more than 20 seconds). |  |
| `processes_total_threads` | Number of Processes-Total Threads — The number of bus threads that make up the process. This metric applies only to Linux instances. |  |
| `processes_blocked` | Number of processes-Number of blocked processes — Number of blocked processes. |  |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="steal"}[2m]) ) * 100` | CPU Steal time ratio (average of the whole machine) | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="system"}[2m]) ) * 100` | CPU core mode time ratio (average of the whole machine) | % |
| `avg without (mode,cpu) ( 1 - irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100` | CPU utilization (machine average) | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="user"}[2m]) ) * 100` | CPU user mode time ratio (average of the whole machine) | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="irq"}[2m]) ) * 100` | Proportion of CPU hard interrupt time (average of the whole machine) | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100` | CPU idle rate (overall machine average) | % |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="softirq"}[2m]) ) * 100` | Proportion of CPU soft interrupt time (average of the whole machine) | % |
| `(node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes)/node_memory_SwapTotal_bytes * 100 and node_memory_SwapTotal_bytes > 0` | Swap space usage — Swap space usage. The computational atom is taken from `/proc/meminfo `. | % |
| `node_memory_SwapTotal_bytes` | Total swap space — Total amount of swap space. Taken from `/proc/meminfo `. | bytes |
| `node_memory_SwapFree_bytes` | Swap space free amount — Exchange space free amount. Taken from `/proc/meminfo `. | bytes |
| `node_memory_Buffers_bytes` | Memory Buffered amount — The amount of memory used as a buffer. Taken from `/proc/meminfo `. | bytes |
| `node_memory_Cached_bytes` | Memory Cached amount — The amount of memory used as file cache. Taken from `/proc/meminfo `. | bytes |
| `(1 - (node_memory_MemAvailable_bytes{} / node_memory_MemTotal_bytes{})) * 100` | Memory usage (based on MemAvailable) — Memory usage. Calculation based on MemAvailable is more accurate, but older versions of Linux do not support it. | % |
| `node_memory_MemAvailable_bytes` | Memory Availability — The amount of available memory that can be immediately allocated to a process. Taken from `/proc/meminfo `. | bytes |
| `node_memory_MemTotal_bytes` | Total memory — Total amount of memory. Taken from `/proc/meminfo `. | bytes |
| `node_memory_MemFree_bytes` | Free memory amount — Amount of unused memory. Taken from `/proc/meminfo `. | bytes |
| `node_filefd_allocated / node_filefd_maximum * 100` | File handle-allocated proportion | % |
| `node_filefd_allocated` | File Handle-Amount Allocated | count |
| `node_filefd_maximum` | File handle-total allocable quantity | count |
| `irate(node_disk_io_time_seconds_total[2m]) * 100` | Hard Disk IO-Time Dimension Utilization — Count the proportion of hard disk IO time in the time dimension. For example, if the value is 50%, it means that 50% of the time is processing IO, and if the value is 100%, it means that IO has been processing all the time. However, note that modern disk devices have the ability to process multiple I/O requests in parallel, so even if the value is 100%, the hard disk may still be able to receive new processing requests. For example, someone has two hands and has been working with one hand in the last minute. From the time dimension, the utilization rate is 100%, but even if it is 100%, he can do it if he is given more work, because he still has one hand available. | % |
| `irate(node_disk_written_bytes_total[2m])` | Hard disk IO-bytes written per second | bytes/s |
| `irate(node_disk_writes_completed_total{}[2m])` | Hard drive IO-writes per second — Writes per second |  |
| `irate(node_disk_read_bytes_total[2m])` | Hard Drive IO-bytes read per second | bytes/s |
| `irate(node_disk_reads_completed_total{}[2m])` | Hard drive IO-Reads per second — Reads per second |  |
| `100 - ((node_filesystem_avail_bytes{} * 100) / node_filesystem_size_bytes{})` | Hard Drive Usage — Hard disk space usage. | % |
| `node_filesystem_free_bytes` | Remaining hard disk — Use the SI standard to render data, consistent with the df command. | bytes |
| `node_filesystem_avail_bytes` | Hard Drive Availability — Use the SI standard to render data, consistent with the df command. | bytes |
| `node_filesystem_size_bytes` | Total hard disk — Use the SI standard to render data, consistent with the df command. | bytes |
| `count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | Number of CPU cores — Number of CPU logical cores. |  |
| `node_load1` | System load average-last 1 minute — Taken from `/proc/loadavg `. |  |
| `node_load15` | System load average-last 15 minutes — Taken from `/proc/loadavg `. |  |
| `node_load5` | System load average-last 5 minutes — Taken from `/proc/loadavg `. |  |
| `node_load1 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | System Load Average (Single Core)-Last 1 Minute |  |
| `node_load15 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | System Load Average (Single Core)-Last 15 Minutes |  |
| `node_load5 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)` | System Load Average (Single Core)-Last 5 Minutes |  |
| `irate(node_network_receive_drop_total[2m])` | Number of packets dropped per second in the incoming direction (receiving) of the network card — The original indicator node _ network _ receive _ drop _ total indicates the total number of packets dropped (received) by each network card after the operating system starts. |  |
| `irate(node_network_receive_packets_total[2m])` | NIC incoming (receiving) packets per second — The original indicator node _ network _ receive _ packets _ total indicates the total number of data packets incoming (received) by each network card after the operating system is booted. |  |
| `irate(node_network_receive_errs_total[2m])` | Number of wrong packets per second in the incoming direction (receiving) of the network card — The original indicator node _ network _ receive _ errs _ total indicates the total number of error packets incoming (received) by each network card after the operating system is started. |  |
| `irate(node_network_transmit_drop_total[2m])` | Number of packets discarded per second in the outbound direction (sending) of the network card — The original indicator node _ network _ transmit _ drop _ total indicates the total number of packets discarded (sent) by each network card after the operating system starts. |  |
| `irate(node_network_transmit_packets_total[2m])` | Number of packets per second in the outgoing direction (sent) of the network card — The original indicator node _ network _ transmit _ packets _ total indicates the total number of outbound (sent) data packets from each network card after the operating system is started. |  |
| `irate(node_network_transmit_errs_total[2m])` | Number of wrong packets per second in the outgoing direction (sending) of the network card — The original indicator node _ network _ transmit _ errs _ total indicates the total number of error packets sent out (sent) by each network card after the operating system is started. |  |
| `irate(node_network_transmit_bytes_total[2m]) * 8` | The amount of bits sent per second by the network card — The original indicator node _ network _ transmit _ bytes _ total represents the total number of bytes sent after the operating system starts. Because the network card traffic is used to using bits as a unit, it is converted in the expression. | bit/s |
| `irate(node_network_receive_bytes_total[2m]) * 8` | The number of bits received by the network card per second — The original indicator node _ network _ received _ bytes _ total represents the total number of bytes received after the operating system is started. Because the network card traffic is used to using bits as a unit, it is converted in the expression. | bit/s |

## Related

- [Linux template source](https://github.com/ccfos/nightingale/tree/main/integrations/Linux): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `arp_packet` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/arp_packet): every config option and the full metric list.
- [Categraf `kernel_vmstat` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/kernel_vmstat): every config option and the full metric list.
- [Categraf `netstat` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/netstat): every config option and the full metric list.
- [Categraf `node_exporter` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/node_exporter): every config option and the full metric list.
- [Categraf `ntp` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/ntp): every config option and the full metric list.
- [Categraf `processes` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/processes): every config option and the full metric list.
- [Categraf `supervisor` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/supervisor): every config option and the full metric list.
- [Walkthrough: monitor Linux hosts](/docs/practice/linux)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
