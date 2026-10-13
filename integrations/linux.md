# Monitor Linux with Nightingale

CPU, memory, disk, network, processes and kernel parameters out of the box; templates cover Categraf, node\_exporter and Telegraf metric names.

Last reviewed 2026-10-13

Linux hosts are where most monitoring starts. Categraf's cpu, mem, disk, diskio, net, netstat, kernel and processes inputs are enabled by default and report as soon as the agent starts. The configs listed below are the plugins that have options worth tuning.

The templates come in three sets, written against Categraf, node\_exporter and Telegraf metric names respectively. Import the set that matches your collector; mixing them produces empty panels. The rules cover the things that actually page people: disks predicted to fill up, busy IO, conntrack exhaustion, clock drift and hosts going silent.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 dashboards**, 71 panels in total
* **60 alert rules**, each with runbook steps
* **132 metric descriptions**
* **Categraf collector config**: `input.arp_packet`, `input.kernel_vmstat`, `input.logs-agent`, `input.netstat`, `input.node_exporter`, `input.ntp`, `input.processes`, `input.sshd`, `input.supervisor`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

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

2. Open the integration center in Nightingale, find Linux, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                                                                                                                               | Panels |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Common Machine Metrics (to only see machines of the current business group, change the dashboard variable ident to the host-ident type) | 22     |
| Machine Inventory Table View (Categraf as collector)                                                                                    | 3      |
| Machine Process Count (Categraf as collector)                                                                                           | 4      |
| Host Table NG                                                                                                                           | 1      |
| Common Machine Metrics (NodeExporter as collector)                                                                                      | 41     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

60 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (35)[​](#collected-by-categraf-35 "Direct link to Collected by Categraf (35)")

#### Conntrack table usage exceeds 80%[​](#conntrack-table-usage-exceeds-80 "Direct link to Conntrack table usage exceeds 80%")

S2 Warning · for 1 min · Trigger:

```
conntrack_ip_conntrack_count / conntrack_ip_conntrack_max > 0.8
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to see the current level;
2. Run conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn to see which protocol or source the entries concentrate on;
3. As an emergency measure raise it: sysctl -w net.netfilter.nf\_conntrack\_max=\<larger value>, raising nf\_conntrack\_buckets to match;
4. Also shorten timeouts such as nf\_conntrack\_tcp\_timeout\_time\_wait, or mark traffic that needs no tracking NOTRACK in the iptables raw table.

#### CPU usage high[​](#cpu-usage-high "Direct link to CPU usage high")

S3 Info · for 1 min · Trigger:

```
cpu_usage_active>75



cpu_usage_active>85



cpu_usage_active>95
```

Runbook:

1. Run top -H or pidstat 1 to find the busiest processes and threads;
2. Use perf top or a language profiler (arthas/async-profiler for Java, pprof for Go) to locate the hot functions;
3. Tell natural traffic growth apart from a code problem (infinite loop, regex backtracking, frequent GC);
4. For growth, scale out or rate limit; for a code problem, fix and release.

#### HTTP probe failed[​](#http-probe-failed "Direct link to HTTP probe failed")

S2 Warning · for 1 min · Trigger:

```
http_response_result_code != 0
```

Runbook:

1. Reproduce it by hand on the collector host with curl -sv \<target URL> and see whether it is a connection failure, a timeout or an unexpected status code;
2. For a connection failure, first confirm the target port is reachable and the process is alive;
3. For an unexpected status code, check the target service logs;
4. Confirm the probe's timeout, expected status code and certificate verification settings match reality, so the config itself is not causing the alert.

#### IO busy[​](#io-busy "Direct link to IO busy")

S2 Warning · for 1 min · Trigger:

```
rate(diskio_io_time[1m])/10 > 99
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util values;
2. Run iotop -oP or pidstat -d 1 to find the process doing the most IO;
3. The usual culprits are large database queries, backup jobs and log flushing — move deferrable work off peak;
4. If it is sustained rather than a spike, consider SSDs or spreading hot data across disks.

#### NTP time offset too large[​](#ntp-time-offset-too-large "Direct link to NTP time offset too large")

S2 Warning · for 1 min · Trigger:

```
ntp_offset_ms > 1000 or ntp_offset_ms < -1000
```

Runbook:

1. Run chronyc tracking (or ntpq -p) to see the current offset and upstream source state;
2. If upstream is unreachable, check the network and whether the firewall allows 123/UDP;
3. Run chronyc sources -v to see whether every source is marked unusable, and switch NTP servers if needed;
4. When the offset is large chrony refuses to slew, so use chronyc makestep to step the clock (prepare time-sensitive workloads first).

#### PING probe failed[​](#ping-probe-failed "Direct link to PING probe failed")

S2 Warning · for 1 min · Trigger:

```
ping_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with ping -c 5 \<target>, then use mtr -n \<target> to find which hop is dropping packets;
2. If the target host is alive, check whether it blocks ICMP (many security policies do) — if so this probe does not apply and you should switch to a port probe;
3. For loss at an intermediate hop, involve the network team;
4. Confirm the target host itself is not down or suffering a NIC failure.

#### TIME\_WAIT connections exceed 20000, worth attention[​](#time_wait-connections-exceed-20000-worth-attention "Direct link to TIME_WAIT connections exceed 20000, worth attention")

S2 Warning · for 1 min · Trigger:

```
netstat_tcp_time_wait > 20000
```

Runbook:

1. Run ss -s to see the connection state distribution;
2. Run ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn to see which peer they concentrate on;
3. The root cause is usually too many short-lived connections — switching the application to long-lived connections or a pool is by far the most effective fix;
4. As an emergency measure enable net.ipv4.tcp\_tw\_reuse=1 and widen net.ipv4.ip\_local\_port\_range (do not enable tcp\_tw\_recycle — it drops packets behind NAT).

#### Memory usage high[​](#memory-usage-high "Direct link to Memory usage high")

S3 Info · for 1 min · Trigger:

```
mem_available_percent < 25



mem_available_percent < 15



mem_available_percent < 5
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

#### File handle usage exceeds 90%[​](#file-handle-usage-exceeds-90 "Direct link to File handle usage exceeds 90%")

S2 Warning · for 1 min · Trigger:

```
linux_sysctl_fs_file_nr/linux_sysctl_fs_file_max>0.9
```

Runbook:

1. Run cat /proc/sys/fs/file-nr to see allocated versus the limit;
2. Run lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head to find the processes holding the most handles;
3. As an emergency measure raise it with sysctl -w fs.file-max=\<larger value>, and check the process's ulimit -n and systemd LimitNOFILE;
4. The root cause is usually connections or files never closed — fix the leak in the application.

#### Machine monitoring - agent lost for more than 60 seconds[​](#machine-monitoring---agent-lost-for-more-than-60-seconds "Direct link to Machine monitoring - agent lost for more than 60 seconds")

Trigger:

```
```

Runbook:

1. First confirm the machine itself is alive with ping and ssh — if it is down, handle it as a host outage;
2. If it is alive, run systemctl status categraf to check the agent process and journalctl -u categraf -n 100 to locate the cause;
3. Common causes are an agent crash, a config error, or network/auth failure to the server — verify by curling the server's write endpoint by hand;
4. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

#### Machine monitoring - time offset exceeds 3 seconds, attention[​](#machine-monitoring---time-offset-exceeds-3-seconds-attention "Direct link to Machine monitoring - time offset exceeds 3 seconds, attention")

for 1 min · Trigger:

```
```

Runbook:

1. Run date and chronyc tracking to check the local time and the offset;
2. Confirm chronyd/ntpd is running, and if not, start it and enable it at boot;
3. Check that 123/UDP to the NTP server is allowed, switching to an internal NTP source if needed;
4. When the offset is large, use chronyc makestep to step the clock, preparing time-sensitive workloads first.

#### Average load per CPU core exceeds 3[​](#average-load-per-cpu-core-exceeds-3 "Direct link to Average load per CPU core exceeds 3")

S2 Warning · for 1 min · Trigger:

```
system_load_norm_1>3
```

Runbook:

1. Run uptime to see the 1/5/15 minute load trend and judge spike versus sustained;
2. Run top and look at %wa (IO wait) — high means the bottleneck is disk rather than CPU, so follow the disk IO path;
3. Run vmstat 1 and use the r (run queue) and b (blocked) columns to separate CPU-bound from IO-blocked;
4. Once you have the specific process, continue down the CPU or IO path and scale out if needed.

#### Disk monitoring - inode usage exceeds 90%[​](#disk-monitoring---inode-usage-exceeds-90 "Direct link to Disk monitoring - inode usage exceeds 90%")

S2 Warning · for 1 min · Trigger:

```
disk_inodes_used/disk_inodes_total >0.9
```

Runbook:

1. Run df -i to see which mount point is short on inodes;
2. Drill down with for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head to find the directories with the most small files;
3. Common sources are session files, mail queues, cache fragments and uncleaned container layers — confirm with the owner and bulk delete;
4. Longer term, raise inode density at format time or move small-file workloads to a dedicated partition.

#### Disk monitoring - disk larger than 200G is running out of space[​](#disk-monitoring---disk-larger-than-200g-is-running-out-of-space "Direct link to Disk monitoring - disk larger than 200G is running out of space")

S3 Info · for 1 min · Trigger:

```
disk_free/1024/1024/1024 < 20 and disk_total/1024/1024/1024 >= 200



disk_free/1024/1024/1024 < 10 and disk_total/1024/1024/1024 >= 200



disk_free/1024/1024/1024 < 2 and disk_total/1024/1024/1024 >= 200
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
2. Clean up logs and expired data, and use lsof +L1 to check for deleted-but-unreleased files;
3. Evaluate whether the data directory should move to its own disk or the disk should be expanded;
4. For a database or object-store data disk, tier cold data off according to the business archiving policy.

#### Disk monitoring - disk smaller than 200G is running out of space[​](#disk-monitoring---disk-smaller-than-200g-is-running-out-of-space "Direct link to Disk monitoring - disk smaller than 200G is running out of space")

S3 Info · for 1 min · Trigger:

```
disk_used_percent > 90 and disk_total/1024/1024/1024 < 200



disk_used_percent > 95 and disk_total/1024/1024/1024 < 200



disk_used_percent > 99 and disk_total/1024/1024/1024 < 200
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
2. On a system disk the usual suspects are /var/log and container image layers (docker system df to inspect, docker system prune to clean);
3. Use lsof +L1 to check for deleted-but-unreleased file handles;
4. Longer term, expand the disk or move large data directories to a dedicated disk.

#### Disk monitoring - device errors reported[​](#disk-monitoring---device-errors-reported "Direct link to Disk monitoring - device errors reported")

S2 Warning · for 1 min · Trigger:

```
disk_device_error>0
```

Runbook:

1. Run dmesg -T | grep -iE 'i/o error|ata|scsi' to see the exact kernel error and device name;
2. Run smartctl -a /dev/sdX and focus on Reallocated\_Sector\_Ct and Current\_Pending\_Sector;
3. Confirm the data on that disk has a replica or backup — data safety comes before hardware work;
4. Once confirmed a hardware fault, schedule downtime to swap the disk; in a RAID array, check the degraded state first.

#### Disk monitoring - disk predicted to be full within 4 hours[​](#disk-monitoring---disk-predicted-to-be-full-within-4-hours "Direct link to Disk monitoring - disk predicted to be full within 4 hours")

S1 Critical · for 1 min · Trigger:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

Runbook:

1. Run df -h to identify the mount point, then drill down with du -x --max-depth=1 \<mount> | sort -h to find the fastest-growing directory;
2. Start with logs (journalctl --vacuum-size=500M, rotate out \*.log.N) and temporary files — that is the quickest win;
3. Use lsof +L1 to find deleted files whose handles are still open; the owning process must be restarted to actually free the space;
4. Confirm whether something abnormal is writing (an application looping on logs, backups piling up) — without fixing the root cause, cleanup only buys time.

#### OOM occurred on the system[​](#oom-occurred-on-the-system "Direct link to OOM occurred on the system")

S2 Warning · Trigger:

```
increase(kernel_vmstat_oom_kill[2m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
2. Use free -h and that process's memory history to tell a leak apart from a limit set too high;
3. Lower oom\_score\_adj for critical processes and set cgroup memory limits on secondary ones;
4. If it is a leak, capture a heap profile in the application — adding memory alone will just postpone the recurrence.

#### NIC monitoring - inbound packet loss[​](#nic-monitoring---inbound-packet-loss "Direct link to NIC monitoring - inbound packet loss")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_in[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
2. Run ethtool -S \<nic> to see the specific drop reason (rx\_no\_buffer, rx\_missed\_errors, etc.);
3. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev\_max\_backlog;
4. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

#### NIC monitoring - inbound packet errors[​](#nic-monitoring---inbound-packet-errors "Direct link to NIC monitoring - inbound packet errors")

S3 Info · for 1 min · Trigger:

```
increase(net_err_in[1m]) > 0
```

Runbook:

1. Run ethtool -S \<nic> and look at rx\_crc\_errors, rx\_frame\_errors and similar counters;
2. Run ethtool \<nic> to confirm the negotiated speed and duplex match the peer (half duplex is the classic source of errors);
3. Check the cable/optical module, swapping the cable or port to cross-check;
4. Ask the network team for the error counters on the corresponding switch port.

#### NIC monitoring - outbound packet loss[​](#nic-monitoring---outbound-packet-loss "Direct link to NIC monitoring - outbound packet loss")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_out[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
2. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
3. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
4. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

#### NIC monitoring - outbound packet errors[​](#nic-monitoring---outbound-packet-errors "Direct link to NIC monitoring - outbound packet errors")

S3 Info · for 1 min · Trigger:

```
increase(net_err_out[1m]) > 0
```

Runbook:

1. Run ethtool -S \<nic> and look at tx\_errors, tx\_carrier\_errors and similar counters;
2. Run ethtool \<nic> to confirm speed and duplex match the peer;
3. Check the cable/optical module and cross-check by swapping;
4. Verify the NIC driver and firmware versions and upgrade if needed.

#### Network probe failed[​](#network-probe-failed "Direct link to Network probe failed")

S2 Warning · for 1 min · Trigger:

```
net_response_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with telnet \<target> \<port> or nc -vz \<target> \<port>;
2. On the target host, run ss -lntp | grep \<port> to confirm a process is listening;
3. If it is listening, check the firewall, security groups, and whether it is bound only to 127.0.0.1;
4. If nothing is listening, start the service through its own recovery procedure.

#### Process monitoring - a process count is 0, the process may be down[​](#process-monitoring---a-process-count-is-0-the-process-may-be-down "Direct link to Process monitoring - a process count is 0, the process may be down")

S1 Critical · for 1 min · Trigger:

```
procstat_lookup_count == 0
```

Runbook:

1. Run ps -ef | grep \<process keyword> to confirm it is really gone and rule out a wrong match rule on the collector side;
2. Check that process's log and dmesg -T | grep -i 'killed process' to tell a crash, an OOM kill and a manual stop apart;
3. Start it through the service's own procedure and confirm the systemd Restart policy is effective;
4. If it keeps exiting, find the root cause before starting it again to avoid a restart loop.

#### Process monitoring - process file handle limit too small[​](#process-monitoring---process-file-handle-limit-too-small "Direct link to Process monitoring - process file handle limit too small")

S3 Info · for 1 min · Trigger:

```
procstat_rlimit_num_fds_soft < 2048
```

Runbook:

1. Run cat /proc/\<pid>/limits to see the soft and hard Max open files;
2. For systemd services, add LimitNOFILE=65535 to the unit file, then systemctl daemon-reload and restart;
3. For non-systemd, add ulimit -n 65535 to the startup script or edit /etc/security/limits.conf;
4. Note the process must be restarted for a changed soft limit to take effect.

#### Process monitoring - total processes exceed 600[​](#process-monitoring---total-processes-exceed-600 "Direct link to Process monitoring - total processes exceed 600")

S2 Warning · for 1 min · Trigger:

```
processes_total > 600
```

Runbook:

1. Run ps -eo ppid | sort | uniq -c | sort -rn | head to find the parent forking the most children;
2. Determine whether this is a normal multi-process model (php-fpm, nginx workers) or a runaway fork;
3. For a runaway, stop that parent to stop the bleeding, then fix the fork logic in the code;
4. For genuine growth, tune the worker count and evaluate whether to scale out.

#### Hard disk - expected to be written full in 4 hours - categraf[​](#hard-disk---expected-to-be-written-full-in-4-hours---categraf "Direct link to Hard disk - expected to be written full in 4 hours - categraf")

S1 Critical · for 1 min · Trigger:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

Runbook:

1. Run df -h to identify the mount point, then drill down with du -x --max-depth=1 \<mount> | sort -h to find the fastest-growing directory;
2. Start with logs (journalctl --vacuum-size=500M, rotate out \*.log.N) and temporary files — that is the quickest win;
3. Use lsof +L1 to find deleted files whose handles are still open; the owning process must be restarted to actually free the space;
4. Confirm whether something abnormal is writing (an application looping on logs, backups piling up) — without fixing the root cause, cleanup only buys time.

#### Hard disk - IO is a bit busy - categraf[​](#hard-disk---io-is-a-bit-busy---categraf "Direct link to Hard disk - IO is a bit busy - categraf")

S2 Warning · for 1 min · Trigger:

```
rate(diskio_io_time[1m])/10 > 99
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util values;
2. Run iotop -oP or pidstat -d 1 to find the process doing the most IO;
3. The usual culprits are large database queries, backup jobs and log flushing — move deferrable work off peak;
4. If it is sustained rather than a spike, consider SSDs or spreading hot data across disks.

#### Lost connection with monitoring target - categraf[​](#lost-connection-with-monitoring-target---categraf "Direct link to Lost connection with monitoring target - categraf")

Trigger:

```
```

Runbook:

1. First confirm the machine itself is alive with ping and ssh — if it is down, handle it as a host outage;
2. If it is alive, run systemctl status categraf to check the agent process and journalctl -u categraf -n 100 to locate the cause;
3. Common causes are an agent crash, a config error, or network/auth failure to the server — verify by curling the server's write endpoint by hand;
4. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

#### Machine load - high memory, please pay attention - categraf[​](#machine-load---high-memory-please-pay-attention---categraf "Direct link to Machine load - high memory, please pay attention - categraf")

S3 Info · for 1 min · Trigger:

```
mem_available_percent < 25



mem_available_percent < 15



mem_available_percent < 5
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

#### number of TME\_WAIT exceeds 20,000 - categraf[​](#number-of-tme_wait-exceeds-20000---categraf "Direct link to number of TME_WAIT exceeds 20,000 - categraf")

S2 Warning · for 1 min · Trigger:

```
netstat_tcp_time_wait > 20000
```

Runbook:

1. Run ss -s to see the connection state distribution;
2. Run ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn to see which peer they concentrate on;
3. The root cause is usually too many short-lived connections — switching the application to long-lived connections or a pool is by far the most effective fix;
4. As an emergency measure enable net.ipv4.tcp\_tw\_reuse=1 and widen net.ipv4.ip\_local\_port\_range (do not enable tcp\_tw\_recycle — it drops packets behind NAT).

#### packet loss in the inbound direction - categraf[​](#packet-loss-in-the-inbound-direction---categraf "Direct link to packet loss in the inbound direction - categraf")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_in[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
2. Run ethtool -S \<nic> to see the specific drop reason (rx\_no\_buffer, rx\_missed\_errors, etc.);
3. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev\_max\_backlog;
4. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

#### packet loss in the outbound direction - categraf[​](#packet-loss-in-the-outbound-direction---categraf "Direct link to packet loss in the outbound direction - categraf")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_out[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
2. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
3. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
4. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

#### Disk larger than 200G is running out of space[​](#disk-larger-than-200g-is-running-out-of-space "Direct link to Disk larger than 200G is running out of space")

S3 Info · for 1 min · Trigger:

```
disk_free/1024/1024/1024 < 20 and disk_total/1024/1024/1024 >= 200



disk_free/1024/1024/1024 < 10 and disk_total/1024/1024/1024 >= 200



disk_free/1024/1024/1024 < 2 and disk_total/1024/1024/1024 >= 200
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
2. Clean up logs and expired data, and use lsof +L1 to check for deleted-but-unreleased files;
3. Evaluate whether the data directory should move to its own disk or the disk should be expanded;
4. For a database or object-store data disk, tier cold data off according to the business archiving policy.

#### Disk smaller than 200G is running out of space[​](#disk-smaller-than-200g-is-running-out-of-space "Direct link to Disk smaller than 200G is running out of space")

S3 Info · for 1 min · Trigger:

```
disk_used_percent > 90 and disk_total/1024/1024/1024 < 200



disk_used_percent > 95 and disk_total/1024/1024/1024 < 200



disk_used_percent > 99 and disk_total/1024/1024/1024 < 200
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
2. On a system disk the usual suspects are /var/log and container image layers (docker system df to inspect, docker system prune to clean);
3. Use lsof +L1 to check for deleted-but-unreleased file handles;
4. Longer term, expand the disk or move large data directories to a dedicated disk.

### Collected by an exporter (12)[​](#collected-by-an-exporter-12 "Direct link to Collected by an exporter (12)")

#### A certain disk is unable to read/write normally[​](#a-certain-disk-is-unable-to-readwrite-normally "Direct link to A certain disk is unable to read/write normally")

S1 Critical · for 1 min · Trigger:

```
(node_filesystem_device_error{mountpoint!~"/var/lib/.*",mountpoint!~"/run.*"}) > 0
```

Runbook:

1. Run dmesg -T | grep -iE 'i/o error|ata|scsi' to see the exact kernel error and device name;
2. Run smartctl -a /dev/sdX and focus on Reallocated\_Sector\_Ct and Current\_Pending\_Sector;
3. Confirm the data on that disk has a replica or backup — data safety comes before hardware work;
4. Once confirmed a hardware fault, schedule downtime to swap the disk; in a RAID array, check the degraded state first.

#### Disk needs to be cleaned - utilization has reached 92% - node exporter[​](#disk-needs-to-be-cleaned---utilization-has-reached-92---node-exporter "Direct link to Disk needs to be cleaned - utilization has reached 92% - node exporter")

S1 Critical · for 1 min · Trigger:

```
(100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) ) > 92
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
2. On a system disk the usual suspects are /var/log and container image layers (docker system df to inspect, docker system prune to clean);
3. Use lsof +L1 to check for deleted-but-unreleased file handles;
4. Longer term, expand the disk or move large data directories to a dedicated disk.

#### Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter[​](#insufficient-computational-resources---average-load-per-core-of-the-machine-is-greater-than-10---node-exporter "Direct link to Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter")

S2 Warning · for 1 min · Trigger:

```
avg (node_load1) by (instance)/count(count(node_cpu_seconds_total) by (cpu,instance)) by (instance) >10
```

Runbook:

1. Run uptime to see the 1/5/15 minute load trend and judge spike versus sustained;
2. Run top and look at %wa (IO wait) — high means the bottleneck is disk rather than CPU, so follow the disk IO path;
3. Run vmstat 1 and use the r (run queue) and b (blocked) columns to separate CPU-bound from IO-blocked;
4. Once you have the specific process, continue down the CPU or IO path and scale out if needed.

#### Insufficient file handles - usage exceeds 90% - node exporter[​](#insufficient-file-handles---usage-exceeds-90---node-exporter "Direct link to Insufficient file handles - usage exceeds 90% - node exporter")

You can increase the file handle limit or expand the capacity

S2 Warning · for 1 min · Trigger:

```
(node_filefd_allocated/node_filefd_maximum*100) > 90
```

Runbook:

1. Run cat /proc/sys/fs/file-nr to see allocated versus the limit;
2. Run lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head to find the processes holding the most handles;
3. As an emergency measure raise it with sysctl -w fs.file-max=\<larger value>, and check the process's ulimit -n and systemd LimitNOFILE;
4. The root cause is usually connections or files never closed — fix the leak in the application.

#### Insufficient inode resources - usage exceeds 90% - node exporter[​](#insufficient-inode-resources---usage-exceeds-90---node-exporter "Direct link to Insufficient inode resources - usage exceeds 90% - node exporter")

S2 Warning · for 1 min · Trigger:

```
(100 - ((node_filesystem_files_free * 100) / node_filesystem_files))>90
```

Runbook:

1. Run df -i to see which mount point is short on inodes;
2. Drill down with for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head to find the directories with the most small files;
3. Common sources are session files, mail queues, cache fragments and uncleaned container layers — confirm with the owner and bulk delete;
4. Longer term, raise inode density at format time or move small-file workloads to a dedicated partition.

#### Insufficient memory resources - utilization is greater than 75% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-75---node-exporter "Direct link to Insufficient memory resources - utilization is greater than 75% - node exporter")

Expansion or upgrading of configuration is required

S2 Warning · for 1 min · Trigger:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 75
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

#### Insufficient memory resources - utilization is greater than 95% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-95---node-exporter "Direct link to Insufficient memory resources - utilization is greater than 95% - node exporter")

S1 Critical · for 1 min · Trigger:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 95
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

#### Packet loss in the inbound direction of the network card - node exporter[​](#packet-loss-in-the-inbound-direction-of-the-network-card---node-exporter "Direct link to Packet loss in the inbound direction of the network card - node exporter")

S2 Warning · for 1 min · Trigger:

```
rate(node_network_receive_drop_total{device=~"e.*"}[1m]) > 3
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
2. Run ethtool -S \<nic> to see the specific drop reason (rx\_no\_buffer, rx\_missed\_errors, etc.);
3. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev\_max\_backlog;
4. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

#### Packet loss in the outbound direction of the network card - node exporter[​](#packet-loss-in-the-outbound-direction-of-the-network-card---node-exporter "Direct link to Packet loss in the outbound direction of the network card - node exporter")

S2 Warning · for 1 min · Trigger:

```
rate(node_network_transmit_drop_total{device=~"e.*"}[1m]) > 3
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
2. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
3. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
4. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

#### System conntrack needs to be adjusted - usage exceeds 80% - node exporter[​](#system-conntrack-needs-to-be-adjusted---usage-exceeds-80---node-exporter "Direct link to System conntrack needs to be adjusted - usage exceeds 80% - node exporter")

S2 Warning · for 1 min · Trigger:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit*100 > 80
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to see the current level;
2. Run conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn to see which protocol or source the entries concentrate on;
3. As an emergency measure raise it: sysctl -w net.netfilter.nf\_conntrack\_max=\<larger value>, raising nf\_conntrack\_buckets to match;
4. Also shorten timeouts such as nf\_conntrack\_tcp\_timeout\_time\_wait, or mark traffic that needs no tracking NOTRACK in the iptables raw table.

#### System experiences OOM - node exporter[​](#system-experiences-oom---node-exporter "Direct link to System experiences OOM - node exporter")

S2 Warning · for 1 min · Trigger:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
2. Use free -h and that process's memory history to tell a leak apart from a limit set too high;
3. Lower oom\_score\_adj for critical processes and set cgroup memory limits on secondary ones;
4. If it is a leak, capture a heap profile in the application — adding memory alone will just postpone the recurrence.

#### Too many running processes - exceeding 3000 - node exporter[​](#too-many-running-processes---exceeding-3000---node-exporter "Direct link to Too many running processes - exceeding 3000 - node exporter")

S2 Warning · for 1 min · Trigger:

```
node_procs_running > 3000
```

Runbook:

1. Run ps -eo ppid | sort | uniq -c | sort -rn | head to find the parent forking the most children;
2. Determine whether this is a normal multi-process model (php-fpm, nginx workers) or a runaway fork;
3. For a runaway, stop that parent to stop the bleeding, then fix the fork logic in the code;
4. For genuine growth, tune the worker count and evaluate whether to scale out.

### Collected by Telegraf (13)[​](#collected-by-telegraf-13 "Direct link to Collected by Telegraf (13)")

#### Address is unreachable by PING, please pay attention - telegraf[​](#address-is-unreachable-by-ping-please-pay-attention---telegraf "Direct link to Address is unreachable by PING, please pay attention - telegraf")

S1 Critical · for 1 min · Trigger:

```
ping_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with ping -c 5 \<target>, then use mtr -n \<target> to find which hop is dropping packets;
2. If the target host is alive, check whether it blocks ICMP (many security policies do) — if so this probe does not apply and you should switch to a port probe;
3. For loss at an intermediate hop, involve the network team;
4. Confirm the target host itself is not down or suffering a NIC failure.

#### Hard disk - expected to be written full in 4 hours - telegraf[​](#hard-disk---expected-to-be-written-full-in-4-hours---telegraf "Direct link to Hard disk - expected to be written full in 4 hours - telegraf")

S1 Critical · for 1 min · Trigger:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

Runbook:

1. Run df -h to identify the mount point, then drill down with du -x --max-depth=1 \<mount> | sort -h to find the fastest-growing directory;
2. Start with logs (journalctl --vacuum-size=500M, rotate out \*.log.N) and temporary files — that is the quickest win;
3. Use lsof +L1 to find deleted files whose handles are still open; the owning process must be restarted to actually free the space;
4. Confirm whether something abnormal is writing (an application looping on logs, backups piling up) — without fixing the root cause, cleanup only buys time.

#### Hard disk - IO is very busy - telegraf[​](#hard-disk---io-is-very-busy---telegraf "Direct link to Hard disk - IO is very busy - telegraf")

S2 Warning · for 1 min · Trigger:

```
rate(diskio_io_time[1m])/10 > 99
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util values;
2. Run iotop -oP or pidstat -d 1 to find the process doing the most IO;
3. The usual culprits are large database queries, backup jobs and log flushing — move deferrable work off peak;
4. If it is sustained rather than a spike, consider SSDs or spreading hot data across disks.

#### Lost connection with monitoring target - telegraf[​](#lost-connection-with-monitoring-target---telegraf "Direct link to Lost connection with monitoring target - telegraf")

Trigger:

```
```

Runbook:

1. First confirm the machine itself is alive with ping and ssh — if it is down, handle it as a host outage;
2. If it is alive, run systemctl status categraf to check the agent process and journalctl -u categraf -n 100 to locate the cause;
3. Common causes are an agent crash, a config error, or network/auth failure to the server — verify by curling the server's write endpoint by hand;
4. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

#### Machine load - high CPU, please pay attention - telegraf[​](#machine-load---high-cpu-please-pay-attention---telegraf "Direct link to Machine load - high CPU, please pay attention - telegraf")

S3 Info · for 1 min · Trigger:

```
cpu_usage_idle{cpu="cpu-total"} < 25
```

Runbook:

1. Run top -H or pidstat 1 to find the busiest processes and threads;
2. Use perf top or a language profiler (arthas/async-profiler for Java, pprof for Go) to locate the hot functions;
3. Tell natural traffic growth apart from a code problem (infinite loop, regex backtracking, frequent GC);
4. For growth, scale out or rate limit; for a code problem, fix and release.

#### Machine load - high memory, please pay attention - telegraf[​](#machine-load---high-memory-please-pay-attention---telegraf "Direct link to Machine load - high memory, please pay attention - telegraf")

S2 Warning · for 1 min · Trigger:

```
mem_available_percent < 25
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

#### Network connection - number of TME\_WAIT exceeds 20,000 - telegraf[​](#network-connection---number-of-tme_wait-exceeds-20000---telegraf "Direct link to Network connection - number of TME_WAIT exceeds 20,000 - telegraf")

S2 Warning · for 1 min · Trigger:

```
netstat_tcp_time_wait > 20000
```

Runbook:

1. Run ss -s to see the connection state distribution;
2. Run ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn to see which peer they concentrate on;
3. The root cause is usually too many short-lived connections — switching the application to long-lived connections or a pool is by far the most effective fix;
4. As an emergency measure enable net.ipv4.tcp\_tw\_reuse=1 and widen net.ipv4.ip\_local\_port\_range (do not enable tcp\_tw\_recycle — it drops packets behind NAT).

#### packet loss in the inbound direction - telegraf[​](#packet-loss-in-the-inbound-direction---telegraf "Direct link to packet loss in the inbound direction - telegraf")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_in[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
2. Run ethtool -S \<nic> to see the specific drop reason (rx\_no\_buffer, rx\_missed\_errors, etc.);
3. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev\_max\_backlog;
4. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

#### packet loss in the outbound direction - telegraf[​](#packet-loss-in-the-outbound-direction---telegraf "Direct link to packet loss in the outbound direction - telegraf")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_out[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
2. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
3. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
4. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

#### Port detection failed, please pay attention - telegraf[​](#port-detection-failed-please-pay-attention---telegraf "Direct link to Port detection failed, please pay attention - telegraf")

S1 Critical · for 1 min · Trigger:

```
net_response_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with telnet \<target> \<port> or nc -vz \<target> \<port>;
2. On the target host, run ss -lntp | grep \<port> to confirm a process is listening;
3. If it is listening, check the firewall, security groups, and whether it is bound only to 127.0.0.1;
4. If nothing is listening, start the service through its own recovery procedure.

#### process handle limit is too small - telegraf[​](#process-handle-limit-is-too-small---telegraf "Direct link to process handle limit is too small - telegraf")

S3 Info · for 1 min · Trigger:

```
procstat_rlimit_num_fds_soft < 2048
```

Runbook:

1. Run cat /proc/\<pid>/limits to see the soft and hard Max open files;
2. For systemd services, add LimitNOFILE=65535 to the unit file, then systemctl daemon-reload and restart;
3. For non-systemd, add ulimit -n 65535 to the startup script or edit /etc/security/limits.conf;
4. Note the process must be restarted for a changed soft limit to take effect.

#### Process monitoring - lookup failure - telegraf[​](#process-monitoring---lookup-failure---telegraf "Direct link to Process monitoring - lookup failure - telegraf")

S1 Critical · for 1 min · Trigger:

```
procstat_lookup_result_code != 0
```

Runbook:

1. Reproduce the configured match by hand on the collector host with ps/pgrep;
2. If the process is genuinely gone, follow the service's recovery procedure;
3. If the process exists but the probe fails, check the procstat pid\_file / exe / pattern settings and whether the collector account can read /proc;
4. In containers, confirm categraf mounts the host's /proc.

#### there are processes with 0 count, a certain process may have crashed - telegraf[​](#there-are-processes-with-0-count-a-certain-process-may-have-crashed---telegraf "Direct link to there are processes with 0 count, a certain process may have crashed - telegraf")

S1 Critical · for 1 min · Trigger:

```
procstat_lookup_running == 0
```

Runbook:

1. Run ps -ef | grep \<process keyword> to confirm it is really gone and rule out a wrong match rule on the collector side;
2. Check that process's log and dmesg -T | grep -i 'killed process' to tell a crash, an OOM kill and a manual stop apart;
3. Start it through the service's own procedure and confirm the systemd Restart policy is effective;
4. If it keeps exiting, find the root cause before starting it again to avoid a restart loop.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

132 metrics, the ones the dashboards and rules above are built on.

| Metric                                                                                                                             | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Unit    |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `cpu_usage_guest`                                                                                                                  | CPU Guest time ratio — The proportion of time the CPU spends running the virtual CPU for the Guest OS. Label `cpu = "cpu-total"`, indicating the statistical value of the whole machine; Tag `CPU = "0"`, indicating the statistical value of CPU number 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | %       |
| `cpu_usage_iowait`                                                                                                                 | CPU iowait time ratio — Represents the proportion of time the CPU spends waiting for I/O operations (input/output) to complete; Tag `cpu = "cpu-total"`, indicating the iowait occupancy rate of the whole machine; Tag `CPU = "0"`, indicating iowait usage rate of CPU # 0                                                                                                                                                                                                                                                                                                                                                                                                                                                               | %       |
| `cpu_usage_steal`                                                                                                                  | CPU Steal time ratio — Represents the proportion of time that the virtual machine (Guest OS) CPU time is used by the virtualization manager (Hypervisor) to run other virtual machines. The value of this indicator in the physical machine is 0, which is useless; If the value of this indicator in the virtual machine is greater than 10 for a long time, it means that the competition is serious. \[Reference] (<https://mp.weixin.qq.com/s/zlrfMNrDHJVE5lkTVow5zA>); Label `cpu = "cpu-total"`, indicating the statistical value of the whole machine; Tag `CPU = "0"`, indicating the statistical value of CPU number 0                                                                                                            | %       |
| `cpu_usage_nice`                                                                                                                   | Time proportion of CPU low-priority processes — In Linux systems, each process has a "nice" value, which usually ranges from-20 to 19. The default nice value is 0. A negative nice value indicates high priority (faster CPU access), while a positive nice value indicates low priority (slower CPU access). This indicator counts the time proportion of processes with nice values of 1-19. Tag `cpu = "cpu-total"`, indicating the statistical value of the whole machine; Tag `CPU = "0"`, indicating the statistical value of CPU number 0                                                                                                                                                                                          | %       |
| `cpu_usage_system`                                                                                                                 | CPU core mode time ratio — Represents the time ratio of CPU core mode; Tag `cpu = "cpu-total"`, indicating the statistical value of the whole machine; Tag `CPU = "0"`, indicating the statistical value of CPU number 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | %       |
| `cpu_usage_active`                                                                                                                 | CPU utilization — -Tag `CPU = "CPU-total"`, indicating the CPU utilization of the whole machine; Tag `CPU = "0"`, indicating single-core utilization of CPU # 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | %       |
| `cpu_usage_user`                                                                                                                   | CPU user mode time ratio — Indicates the time ratio of CPU user mode; Tag `cpu = "cpu-total"`, indicating the statistical value of the whole machine; Tag `CPU = "0"`, indicating the statistical value of CPU number 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `cpu_usage_irq`                                                                                                                    | CPU hard interrupt time ratio — Indicates the proportion of time spent by the CPU handling hard interrupts; Tag `cpu = "cpu-total"`, indicating the statistical value of the whole machine; Tag `CPU = "0"`, indicating the statistical value of CPU number 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | %       |
| `cpu_usage_idle`                                                                                                                   | CPU idle rate — -Tag `CPU = "CPU-total"`, indicating the CPU idle rate of the whole machine; Tag `CPU = "0"`, indicating the single core idle rate of CPU # 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | %       |
| `cpu_usage_softirq`                                                                                                                | CPU soft interrupt time ratio — Indicates the proportion of time the CPU takes to process soft interrupts; Tag `cpu = "cpu-total"`, indicating the statistical value of the whole machine; Tag `CPU = "0"`, indicating the statistical value of CPU number 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | %       |
| `netstat_tcp_established`                                                                                                          | Number of network links with ESTABLISHED status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |         |
| `netstat_tcp_fin_wait1`                                                                                                            | Number of network links in FIN \_ WAIT1 state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |         |
| `netstat_tcp_fin_wait2`                                                                                                            | Number of network links in FIN \_ WAIT2 state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |         |
| `100 * conntrack_ip_conntrack_count / conntrack_ip_conntrack_max`                                                                  | IP conntrack usage — If it is full, you will usually see errors such as: conntrack table full in the system log. You can adjust the maximum value of the system to solve the problem                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | %       |
| `netstat_tcp_last_ack`                                                                                                             | Number of network links in LAST \_ ACK state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |         |
| `netstat_tcp_listen`                                                                                                               | Number of network links in LISTEN status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |         |
| `100 * conntrack_nf_conntrack_count / conntrack_nf_conntrack_max`                                                                  | NF conntrack usage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | %       |
| `increase(kernel_vmstat_oom_kill[1m])`                                                                                             | OOM number statistics within 1 minute — Taken from `/proc/vmstat `, requires a higher version of the kernel, if I remember correctly, it should be 4.13 or above                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |         |
| `netstat_tcp_syn_recv`                                                                                                             | Number of network links in SYN \_ RECV state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |         |
| `netstat_tcp_syn_sent`                                                                                                             | Number of network links in SYN \_ SENT state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |         |
| `netstat_tcp_time_wait`                                                                                                            | Number of network links in TIME \_ WAIT state — The default configuration of `disable _ connection _ stats` in the categraf configuration file `conf/input.netstat/netstat.toml` is true because on machines with many network connections, obtaining the number of connections in each state will consume more CPU, so the default disable is dropped.                                                                                                                                                                                                                                                                                                                                                                                    |         |
| `netstat_tcp_tw`                                                                                                                   | Number of network links in TIME \_ WAIT state (recommended) — Read from `/proc/net/sockstat `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `(mem_swap_total - mem_swap_free)/mem_swap_total * 100 and mem_swap_total > 0`                                                     | Swap space usage — Swap space usage. The computational atom is taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | %       |
| `mem_swap_total - mem_swap_free`                                                                                                   | Swap space usage — Swap space usage. The computational atom is taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | bytes   |
| `mem_swap_total`                                                                                                                   | Total swap space — Total amount of swap space. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | bytes   |
| `mem_swap_free`                                                                                                                    | Swap space free amount — Swap space free amount. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | bytes   |
| `mem_buffered`                                                                                                                     | Memory Buffered amount — The amount of memory used as a buffer. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | bytes   |
| `mem_cached`                                                                                                                       | Memory Cached amount — The amount of memory used as a file cache. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | bytes   |
| `mem_used_percent`                                                                                                                 | Memory usage — Memory usage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | %       |
| `100 - mem_available_percent`                                                                                                      | Memory usage (based on MemAvailable) — Memory usage. Calculation based on MemAvailable is more accurate, but older versions of Linux do not support it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `mem_used`                                                                                                                         | Memory usage — Memory usage = Total-Free-Buffered-Cached                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | bytes   |
| `mem_available_percent`                                                                                                            | Memory availability — The amount of available memory that can be immediately allocated to the process divided by the total amount of memory. The values of numerator and denominator are taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | %       |
| `mem_available`                                                                                                                    | Memory Availability — The amount of available memory that can be immediately allocated to a process. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | bytes   |
| `mem_total`                                                                                                                        | Total memory — Total amount of memory. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | bytes   |
| `mem_active`                                                                                                                       | Memory activity — This field indicates the total amount of memory currently actively used, that is, the memory pages that the system has recently visited and is expected to be used again soon. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | bytes   |
| `mem_free`                                                                                                                         | Free memory amount — Amount of unused memory. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | bytes   |
| `mem_inactive`                                                                                                                     | Memory inactivity — The amount of memory that was not used in some way in the previous sampling period. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | bytes   |
| `netstat_udp_socket`                                                                                                               | Number of current UDP connections                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |         |
| `disk_inodes_used / disk_inodes_total * 100`                                                                                       | Hard disk inode usage — If you store a lot of small files, you need to pay attention to inode usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | %       |
| `disk_inodes_used`                                                                                                                 | Hard disk inode usage — If you store a lot of small files, you need to pay attention to inode usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |         |
| `disk_inodes_free`                                                                                                                 | Remaining amount of hard disk inode — If you store a lot of small files, you need to pay attention to inode usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `disk_inodes_total`                                                                                                                | Total amount of hard disk inode — If you store a lot of small files, you need to pay attention to inode usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `irate(diskio_write_time[2m])/irate(diskio_writes[2m])`                                                                            | Hard disk IO-Write request average time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | ms      |
| `diskio_write_time`                                                                                                                | Hard Drive IO-Time the write request waits to be processed — The time a write request waits on disk. Multiple write requests waiting simultaneously increase this number. For example, if 8 requests all wait an average of 1000 milliseconds, 8000 is reported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ms      |
| `diskio_weighted_io_time`                                                                                                          | Hard Disk IO-Weighted IO Processing Time — As long as the device is processing IO, no matter how many are processed at the same time, diskio \_ IO \_ time will be incremented; The number of simultaneously processed IOs is multiplied by time to obtain a weighted value: diskio \_ weighted \_ IO \_ time.                                                                                                                                                                                                                                                                                                                                                                                                                             | ms      |
| `irate(diskio_io_time[2m])/1000*100`                                                                                               | Hard Disk IO-Time Dimension Utilization — Count the proportion of hard disk IO time in the time dimension. For example, if the value is 50%, it means that 50% of the time is processing IO, and if the value is 100%, it means that IO has been processing all the time. However, note that modern disk devices have the ability to process multiple I/O requests in parallel, so even if the value is 100%, the hard disk may still be able to receive new processing requests. For example, someone has two hands and has been working with one hand in the last minute. From the time dimension, the utilization rate is 100%, but even if it is 100%, he can do it if he is given more work, because he still has one hand available. | %       |
| `irate(diskio_write_bytes[2m])`                                                                                                    | Hard disk IO-bytes written per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | bytes/s |
| `irate(diskio_writes{}[2m])`                                                                                                       | Hard drive IO-writes per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |         |
| `irate(diskio_merged_writes[2m])`                                                                                                  | Hard Disk IO-Number of merged write requests per second — Adjacent reads and writes may be merged for efficiency. So two 4K reads may turn into an 8K read before finally handing it over to disk, so it will be counted (and queued) to have only one I/O. These fields let you know how often this happens.                                                                                                                                                                                                                                                                                                                                                                                                                              |         |
| `irate(diskio_merged_reads[2m])`                                                                                                   | Hard disk IO-merge read requests per second — Adjacent reads and writes may be merged for efficiency. So two 4K reads may turn into an 8K read before finally handing it over to disk, so it will be counted (and queued) to have only one I/O. These fields let you know how often this happens.                                                                                                                                                                                                                                                                                                                                                                                                                                          |         |
| `irate(diskio_read_bytes[2m])`                                                                                                     | Hard Drive IO-bytes read per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | bytes/s |
| `irate(diskio_reads{}[2m])`                                                                                                        | Hard drive IO-Reads per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `diskio_io_time`                                                                                                                   | Hard Disk IO-Time the hard disk takes to process IO — The time it takes for the hard disk to process IO, in milliseconds. Assuming that 500 milliseconds are processing IO in the last 1 second, this value will be increased by 500. This is a monotonically increasing Counter value, which will continue to rise after the operating system is started. In actual use, this indicator is generally used to calculate the hard disk IO UTIL (percentage of time dimension).                                                                                                                                                                                                                                                              | ms      |
| `diskio_iops_in_progress`                                                                                                          | Hard Disk IO-Number of IO being processed by the device driver — The number of requests that have been currently assigned to the device driver and have not been completed, Gauge type. If I/O requests have entered the queue, but have not been assigned to the device driver, they are not counted.                                                                                                                                                                                                                                                                                                                                                                                                                                     |         |
| `irate(diskio_read_time[2m])/irate(diskio_reads[2m])`                                                                              | Hard disk IO-Read request average time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ms      |
| `diskio_read_time`                                                                                                                 | Hard Drive IO-Time for read requests to be processed — The time the read request waits on disk. Multiple read requests waiting simultaneously increase this number. For example, if 5 requests all wait an average of 100 milliseconds, 500 is reported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ms      |
| `irate(diskio_weighted_io_time[1m])/1000`                                                                                          | Hard Disk IO-Queue Depth — Assuming that there is a weighted waiting time of 5000 ms in the past 1000 ms, it is equivalent to an average of 5 IO requests waiting, that is, the queue depth is 5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |         |
| `disk_used_percent`                                                                                                                | Hard Drive Usage — Hard disk space usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | %       |
| `disk_used`                                                                                                                        | Hard drive usage — Use the SI standard to render data, consistent with the df command.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | bytes   |
| `disk_device_error`                                                                                                                | Is there an error in reading hard disk information — 0 means normal, no error; A non-0 indicates an error occurred in obtaining hard disk information.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |         |
| `disk_free`                                                                                                                        | Remaining hard disk — Use the SI standard to render data, consistent with the df command.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | bytes   |
| `disk_total`                                                                                                                       | Total hard disk — Use the SI standard to render data, consistent with the df command.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | bytes   |
| `system_n_cpus`                                                                                                                    | Number of CPU cores — Number of CPU logical cores.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `system_uptime`                                                                                                                    | System startup time — How long has the operating system been booted, in seconds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | s       |
| `system_load1`                                                                                                                     | System load average-last 1 minute — Taken from `/proc/loadavg `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |         |
| `system_load15`                                                                                                                    | System load average-last 15 minutes — Taken from `/proc/loadavg `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `system_load5`                                                                                                                     | System load average-last 5 minutes — Taken from `/proc/loadavg `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |         |
| `system_load_norm_1`                                                                                                               | System Load Average (Single Core)-Last 1 Minute — Equivalent to `system _ load1/system _ n _ cpus`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `system_load_norm_15`                                                                                                              | System Load Average (Single Core)-Last 15 Minutes — Equivalent to `system _ load15/system _ n _ cpus`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |         |
| `system_load_norm_5`                                                                                                               | System Load Average (Single Core)-Last 5 Minutes — Equivalent to `system _ load5/system _ n _ cpus`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |         |
| `irate(net_drop_in[2m])`                                                                                                           | Number of packets dropped per second in the incoming direction (receiving) of the network card — The original indicator net \_ drop \_ in indicates the total number of packets dropped (received) by each network card after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `irate(net_packets_recv[2m])`                                                                                                      | NIC incoming (receiving) packets per second — The original indicator net \_ packets \_ recv indicates the total number of incoming (received) data packets by each network card after the operating system is booted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |         |
| `irate(net_err_in[2m])`                                                                                                            | Number of wrong packets per second in the incoming direction (receiving) of the network card — The original indicator net \_ err \_ in indicates the total number of error packets in (received) by each network card after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |         |
| `irate(net_drop_out[2m])`                                                                                                          | Number of packets discarded per second in the outbound direction (sending) of the network card — The original indicator net \_ drop \_ out indicates the total number of packets discarded (sent) by each network card outbound after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |         |
| `irate(net_packets_sent[2m])`                                                                                                      | Number of packets per second in the outgoing direction (sent) of the network card — The original indicator net \_ packets \_ sent indicates the total number of outbound (sent) data packets from each network card after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |         |
| `irate(net_err_out[2m])`                                                                                                           | Number of wrong packets per second in the outgoing direction (sending) of the network card — The original indicator net \_ errr \_ out indicates the total number of error packets sent out by each network card after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |         |
| `irate(net_bytes_sent[2m]) * 8`                                                                                                    | The amount of bits sent per second by the network card — The original indicator net \_ bytes \_ sent represents the total number of bytes sent after the operating system is started. Because the network card traffic is used to using bits as the unit, it is converted in the expression.                                                                                                                                                                                                                                                                                                                                                                                                                                               | bit/s   |
| `irate(net_bytes_recv[2m]) * 8`                                                                                                    | The number of bits received by the network card per second — The original indicator net \_ bytes \_ recv represents the total number of bytes received after the operating system is started. Because the network card traffic is used to using bits as the unit, it is converted in the expression.                                                                                                                                                                                                                                                                                                                                                                                                                                       | bit/s   |
| `processes_dead`                                                                                                                   | Number of processes-Number of processes in the "dead" state — The number of processes in the "dead" state, which is represented by the X status code on Linux.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `processes_paging`                                                                                                                 | Number of Processes-Number of processes in the "Paging" state — The number of processes in the "paging" state, which is represented by the W status code on Linux.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `processes_stopped`                                                                                                                | Number of Processes-Number of stopped processes — The number of processes stopped, represented by the T status code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |         |
| `processes_zombies`                                                                                                                | Number of processes-Number of zombie processes — Number of zombie processes, represented by the Z status code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `processes_total`                                                                                                                  | Number of processes-total — The total number of processes on the instance.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |         |
| `processes_unknown`                                                                                                                | Number of Processes-Number of processes with unknown status — Number of processes with unknown status.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |         |
| `processes_sleeping`                                                                                                               | Number of processes-Number of processes that are sleeping — Number of sleeping processes, represented by the S status code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |         |
| `processes_running`                                                                                                                | Number of Processes-Number of processes running — The number of processes running, represented by the R status code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |         |
| `processes_idle`                                                                                                                   | Number of processes-Number of idle — Number of processes that are idle (sleeping for more than 20 seconds).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |         |
| `processes_total_threads`                                                                                                          | Number of Processes-Total Threads — The number of bus threads that make up the process. This metric applies only to Linux instances.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |         |
| `processes_blocked`                                                                                                                | Number of processes-Number of blocked processes — Number of blocked processes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |         |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="steal"}[2m]) ) * 100`                                                 | CPU Steal time ratio (average of the whole machine)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="system"}[2m]) ) * 100`                                                | CPU core mode time ratio (average of the whole machine)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `avg without (mode,cpu) ( 1 - irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100`                                              | CPU utilization (machine average)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="user"}[2m]) ) * 100`                                                  | CPU user mode time ratio (average of the whole machine)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="irq"}[2m]) ) * 100`                                                   | Proportion of CPU hard interrupt time (average of the whole machine)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="idle"}[2m]) ) * 100`                                                  | CPU idle rate (overall machine average)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `avg without (mode,cpu) ( irate(node_cpu_seconds_total{mode="softirq"}[2m]) ) * 100`                                               | Proportion of CPU soft interrupt time (average of the whole machine)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | %       |
| `(node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes)/node_memory_SwapTotal_bytes * 100 and node_memory_SwapTotal_bytes > 0` | Swap space usage — Swap space usage. The computational atom is taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | %       |
| `node_memory_SwapTotal_bytes`                                                                                                      | Total swap space — Total amount of swap space. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | bytes   |
| `node_memory_SwapFree_bytes`                                                                                                       | Swap space free amount — Exchange space free amount. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | bytes   |
| `node_memory_Buffers_bytes`                                                                                                        | Memory Buffered amount — The amount of memory used as a buffer. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | bytes   |
| `node_memory_Cached_bytes`                                                                                                         | Memory Cached amount — The amount of memory used as file cache. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | bytes   |
| `(1 - (node_memory_MemAvailable_bytes{} / node_memory_MemTotal_bytes{})) * 100`                                                    | Memory usage (based on MemAvailable) — Memory usage. Calculation based on MemAvailable is more accurate, but older versions of Linux do not support it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | %       |
| `node_memory_MemAvailable_bytes`                                                                                                   | Memory Availability — The amount of available memory that can be immediately allocated to a process. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | bytes   |
| `node_memory_MemTotal_bytes`                                                                                                       | Total memory — Total amount of memory. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | bytes   |
| `node_memory_MemFree_bytes`                                                                                                        | Free memory amount — Amount of unused memory. Taken from `/proc/meminfo `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | bytes   |
| `node_filefd_allocated / node_filefd_maximum * 100`                                                                                | File handle-allocated proportion                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | %       |
| `node_filefd_allocated`                                                                                                            | File Handle-Amount Allocated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | count   |
| `node_filefd_maximum`                                                                                                              | File handle-total allocable quantity                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | count   |
| `irate(node_disk_io_time_seconds_total[2m]) * 100`                                                                                 | Hard Disk IO-Time Dimension Utilization — Count the proportion of hard disk IO time in the time dimension. For example, if the value is 50%, it means that 50% of the time is processing IO, and if the value is 100%, it means that IO has been processing all the time. However, note that modern disk devices have the ability to process multiple I/O requests in parallel, so even if the value is 100%, the hard disk may still be able to receive new processing requests. For example, someone has two hands and has been working with one hand in the last minute. From the time dimension, the utilization rate is 100%, but even if it is 100%, he can do it if he is given more work, because he still has one hand available. | %       |
| `irate(node_disk_written_bytes_total[2m])`                                                                                         | Hard disk IO-bytes written per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | bytes/s |
| `irate(node_disk_writes_completed_total{}[2m])`                                                                                    | Hard drive IO-writes per second — Writes per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |         |
| `irate(node_disk_read_bytes_total[2m])`                                                                                            | Hard Drive IO-bytes read per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | bytes/s |
| `irate(node_disk_reads_completed_total{}[2m])`                                                                                     | Hard drive IO-Reads per second — Reads per second                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |         |
| `100 - ((node_filesystem_avail_bytes{} * 100) / node_filesystem_size_bytes{})`                                                     | Hard Drive Usage — Hard disk space usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | %       |
| `node_filesystem_free_bytes`                                                                                                       | Remaining hard disk — Use the SI standard to render data, consistent with the df command.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | bytes   |
| `node_filesystem_avail_bytes`                                                                                                      | Hard Drive Availability — Use the SI standard to render data, consistent with the df command.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | bytes   |
| `node_filesystem_size_bytes`                                                                                                       | Total hard disk — Use the SI standard to render data, consistent with the df command.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | bytes   |
| `count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                                   | Number of CPU cores — Number of CPU logical cores.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `node_load1`                                                                                                                       | System load average-last 1 minute — Taken from `/proc/loadavg `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |         |
| `node_load15`                                                                                                                      | System load average-last 15 minutes — Taken from `/proc/loadavg `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |         |
| `node_load5`                                                                                                                       | System load average-last 5 minutes — Taken from `/proc/loadavg `.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |         |
| `node_load1 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                      | System Load Average (Single Core)-Last 1 Minute                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |         |
| `node_load15 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                     | System Load Average (Single Core)-Last 15 Minutes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |         |
| `node_load5 / count(node_cpu_seconds_total{mode="idle"}) without (cpu, mode)`                                                      | System Load Average (Single Core)-Last 5 Minutes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |         |
| `irate(node_network_receive_drop_total[2m])`                                                                                       | Number of packets dropped per second in the incoming direction (receiving) of the network card — The original indicator node \_ network \_ receive \_ drop \_ total indicates the total number of packets dropped (received) by each network card after the operating system starts.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |         |
| `irate(node_network_receive_packets_total[2m])`                                                                                    | NIC incoming (receiving) packets per second — The original indicator node \_ network \_ receive \_ packets \_ total indicates the total number of data packets incoming (received) by each network card after the operating system is booted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |         |
| `irate(node_network_receive_errs_total[2m])`                                                                                       | Number of wrong packets per second in the incoming direction (receiving) of the network card — The original indicator node \_ network \_ receive \_ errs \_ total indicates the total number of error packets incoming (received) by each network card after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                              |         |
| `irate(node_network_transmit_drop_total[2m])`                                                                                      | Number of packets discarded per second in the outbound direction (sending) of the network card — The original indicator node \_ network \_ transmit \_ drop \_ total indicates the total number of packets discarded (sent) by each network card after the operating system starts.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |         |
| `irate(node_network_transmit_packets_total[2m])`                                                                                   | Number of packets per second in the outgoing direction (sent) of the network card — The original indicator node \_ network \_ transmit \_ packets \_ total indicates the total number of outbound (sent) data packets from each network card after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |         |
| `irate(node_network_transmit_errs_total[2m])`                                                                                      | Number of wrong packets per second in the outgoing direction (sending) of the network card — The original indicator node \_ network \_ transmit \_ errs \_ total indicates the total number of error packets sent out (sent) by each network card after the operating system is started.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |         |
| `irate(node_network_transmit_bytes_total[2m]) * 8`                                                                                 | The amount of bits sent per second by the network card — The original indicator node \_ network \_ transmit \_ bytes \_ total represents the total number of bytes sent after the operating system starts. Because the network card traffic is used to using bits as a unit, it is converted in the expression.                                                                                                                                                                                                                                                                                                                                                                                                                            | bit/s   |
| `irate(node_network_receive_bytes_total[2m]) * 8`                                                                                  | The number of bits received by the network card per second — The original indicator node \_ network \_ received \_ bytes \_ total represents the total number of bytes received after the operating system is started. Because the network card traffic is used to using bits as a unit, it is converted in the expression.                                                                                                                                                                                                                                                                                                                                                                                                                | bit/s   |

## Related[​](#related "Direct link to Related")

* [Linux template source](https://github.com/ccfos/nightingale/tree/main/integrations/Linux): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `arp_packet` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/arp_packet): every config option and the full metric list.
* [Categraf `kernel_vmstat` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/kernel_vmstat): every config option and the full metric list.
* [Categraf `netstat` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/netstat): every config option and the full metric list.
* [Categraf `node_exporter` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/node_exporter): every config option and the full metric list.
* [Categraf `ntp` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/ntp): every config option and the full metric list.
* [Categraf `processes` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/processes): every config option and the full metric list.
* [Categraf `supervisor` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/supervisor): every config option and the full metric list.
* [Walkthrough: monitor Linux hosts](https://n9e.github.io/docs/practice/linux.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
