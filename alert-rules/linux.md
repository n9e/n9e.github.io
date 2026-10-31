# Linux alert rules for Prometheus: 76 rules with runbooks

76 ready-to-use Linux alert rules in PromQL, each with severity, duration and runbook steps. Metrics from node\_exporter, Categraf, Telegraf. Download as a Prometheus rules file or import into Nightingale.

Last reviewed 2026-10-31

Host-level alert rules for Linux servers and Kubernetes nodes: memory exhaustion and pressure, disks and inodes running out (including "will fill up within 24 hours" predictions), disk latency, network errors, packet loss and saturation, CPU load and steal, OOM kills, conntrack and file-handle exhaustion, clock skew, crashed system services, missing processes, and failed PING, port and HTTP probes. The node\_exporter group uses standard `node_*` metric names; the Categraf and Telegraf groups cover the same ground for hosts collected by those agents.

## At a glance[​](#at-a-glance "Direct link to At a glance")

* **76 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
* **Metrics from**: node\_exporter, Categraf, Telegraf
* **Download**: [`linux.yml`](https://n9e.github.io/alert-rules/linux.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
* Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list[​](#rule-list "Direct link to Rule list")

| Rule                                                                                                           | Severity | For  |
| -------------------------------------------------------------------------------------------------------------- | -------- | ---- |
| Host out of memory                                                                                             | Warning  | 2m   |
| Host under memory pressure                                                                                     | Warning  | 2m   |
| Host inbound network throughput abnormal                                                                       | Warning  | 5m   |
| Host outbound network throughput abnormal                                                                      | Warning  | 5m   |
| Host disk read rate abnormal                                                                                   | Warning  | 5m   |
| Host disk write rate abnormal                                                                                  | Warning  | 2m   |
| Host out of disk space                                                                                         | Warning  | 2m   |
| Host disk will fill up within 24 hours                                                                         | Warning  | 2m   |
| Filesystem inode usage high                                                                                    | Warning  | 2m   |
| Filesystem inodes will fill up within 24 hours                                                                 | Warning  | 2m   |
| Host disk read latency abnormal                                                                                | Warning  | 2m   |
| Host disk write latency abnormal                                                                               | Warning  | 2m   |
| Node CPU load high                                                                                             | Warning  | —    |
| CPU stolen by other cloud guests                                                                               | Warning  | —    |
| Host context switching abnormal                                                                                | Warning  | —    |
| Host swap almost full                                                                                          | Warning  | 2m   |
| Host system service crashed                                                                                    | Warning  | —    |
| Host kernel version deviation                                                                                  | Warning  | 360m |
| HostOomKill detected                                                                                           | Warning  | —    |
| Host network receive errors                                                                                    | Warning  | 2m   |
| Host network transmit errors                                                                                   | Warning  | 2m   |
| Host network interface saturated                                                                               | Warning  | 1m   |
| Conntrack entries approaching the limit                                                                        | Warning  | 5m   |
| Host clock skew                                                                                                | Warning  | 2m   |
| Host clock not synchronising                                                                                   | Warning  | 2m   |
| Node filesystem filling up - S2                                                                                | Warning  | 60m  |
| Node filesystem filling up - S1                                                                                | Critical | 60m  |
| Node disk almost full - S2 - space - 5                                                                         | Warning  | 60m  |
| Node disk almost full - S1 - space - 3                                                                         | Critical | 60m  |
| Node disk almost full - S2 - inodes - 40                                                                       | Warning  | 60m  |
| Node disk almost full - S1 - inodes - 20                                                                       | Critical | 60m  |
| Node disk almost full - S2 - inodes - 5                                                                        | Warning  | 60m  |
| Node disk almost full - S1 - inodes - 3                                                                        | Critical | 60m  |
| Node conntrack entries usage high                                                                              | Warning  | —    |
| Node textfile collector scrape errors                                                                          | Warning  | —    |
| Node network interface flapping                                                                                | Warning  | 2m   |
| A certain disk is unable to read/write normally                                                                | Critical | 1m   |
| Disk needs to be cleaned - utilization has reached 92% - node exporter                                         | Critical | 1m   |
| Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter | Warning  | 1m   |
| Insufficient file handles - usage exceeds 90% - node exporter                                                  | Warning  | 1m   |
| Insufficient inode resources - usage exceeds 90% - node exporter                                               | Warning  | 1m   |
| Insufficient memory resources - utilization is greater than 75% - node exporter                                | Warning  | 1m   |
| Insufficient memory resources - utilization is greater than 95% - node exporter                                | Critical | 1m   |
| Packet loss in the inbound direction of the network card - node exporter                                       | Warning  | 1m   |
| Packet loss in the outbound direction of the network card - node exporter                                      | Warning  | 1m   |
| System conntrack needs to be adjusted - usage exceeds 80% - node exporter                                      | Warning  | 1m   |
| System experiences OOM - node exporter                                                                         | Warning  | 1m   |
| Too many running processes - exceeding 3000 - node exporter                                                    | Warning  | 1m   |
| Conntrack table usage exceeds 80%                                                                              | Warning  | 1m   |
| CPU usage high                                                                                                 | Info     | 1m   |
| HTTP probe failed                                                                                              | Warning  | 1m   |
| IO busy                                                                                                        | Warning  | 1m   |
| NTP time offset too large                                                                                      | Warning  | 1m   |
| PING probe failed                                                                                              | Warning  | 1m   |
| TIME\_WAIT connections exceed 20000, worth attention                                                           | Warning  | 1m   |
| Memory usage high                                                                                              | Info     | 1m   |
| File handle usage exceeds 90%                                                                                  | Warning  | 1m   |
| Average load per CPU core exceeds 3                                                                            | Warning  | 1m   |
| Disk monitoring - inode usage exceeds 90%                                                                      | Warning  | 1m   |
| Disk monitoring - disk larger than 200G is running out of space                                                | Info     | 1m   |
| Disk monitoring - disk smaller than 200G is running out of space                                               | Info     | 1m   |
| Disk monitoring - device errors reported                                                                       | Warning  | 1m   |
| Disk monitoring - disk predicted to be full within 4 hours                                                     | Critical | 1m   |
| OOM occurred on the system                                                                                     | Warning  | —    |
| NIC monitoring - inbound packet loss                                                                           | Info     | 1m   |
| NIC monitoring - inbound packet errors                                                                         | Info     | 1m   |
| NIC monitoring - outbound packet loss                                                                          | Info     | 1m   |
| NIC monitoring - outbound packet errors                                                                        | Info     | 1m   |
| Network probe failed                                                                                           | Warning  | 1m   |
| Process monitoring - a process count is 0, the process may be down                                             | Critical | 1m   |
| Process monitoring - process file handle limit too small                                                       | Info     | 1m   |
| Process monitoring - total processes exceed 600                                                                | Warning  | 1m   |
| Machine load - high CPU, please pay attention - telegraf                                                       | Info     | 1m   |
| Machine load - high memory, please pay attention - telegraf                                                    | Warning  | 1m   |
| Process monitoring - lookup failure - telegraf                                                                 | Critical | 1m   |
| there are processes with 0 count, a certain process may have crashed - telegraf                                | Critical | 1m   |

## node\_exporter (48)[​](#node_exporter-48 "Direct link to node_exporter (48)")

### Host out of memory[​](#host-out-of-memory "Direct link to Host out of memory")

Node out of memory (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10
```

Runbook:

1. On the node run free -h to check available memory and swap;
2. Run ps aux --sort=-%mem | head for the biggest consumers;
3. On Kubernetes nodes, prefer kubectl top pod -A --sort-by=memory to find the Pod;
4. For a leak, fix it in the application; for capacity, move Pods off or add nodes.

### Host under memory pressure[​](#host-under-memory-pressure "Direct link to Host under memory pressure")

Node under memory pressure (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
rate(node_vmstat_pgmajfault[1m]) > 1000
```

Runbook:

1. Run vmstat 1 and check the si/so columns for swapping;
2. Use sar -B or /proc/vmstat to watch pgmajfault growth;
3. Find the heaviest process or Pod and assess whether it can be moved;
4. Review the swap setting — Kubernetes nodes normally have swap disabled, since enabling it masks memory problems.

### Host inbound network throughput abnormal[​](#host-inbound-network-throughput-abnormal "Direct link to Host inbound network throughput abnormal")

Host unusual network throughput in (instance {{ $labels.instance }})

Warning · 5m · Trigger:

```
sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100
```

Runbook:

1. Use iftop or nethogs to find the processes/connections consuming the most bandwidth;
2. On Kubernetes nodes, check whether a Pod is doing bulk data transfer (backup, data sync, image pull);
3. Confirm whether the NIC is saturated and throttle or reschedule if so;
4. For abnormal traffic, check for a misconfiguration causing a traffic loop.

### Host outbound network throughput abnormal[​](#host-outbound-network-throughput-abnormal "Direct link to Host outbound network throughput abnormal")

Host unusual network throughput out (instance {{ $labels.instance }})

Warning · 5m · Trigger:

```
sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100
```

Runbook:

1. Use iftop or nethogs to find the processes/connections consuming the most bandwidth;
2. On Kubernetes nodes, check whether a Pod is doing bulk data transfer (backup, data sync, image pull);
3. Confirm whether the NIC is saturated and throttle or reschedule if so;
4. For abnormal traffic, check for a misconfiguration causing a traffic loop.

### Host disk read rate abnormal[​](#host-disk-read-rate-abnormal "Direct link to Host disk read rate abnormal")

Host unusual disk read rate (instance {{ $labels.instance }})

Warning · 5m · Trigger:

```
sum by (instance) (rate(node_disk_read_bytes_total[2m])) / 1024 / 1024 > 50
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util;
2. Run iotop -oP to find the process doing the most IO;
3. On Kubernetes nodes it is usually container log writes, image pull/unpack, or one Pod's data writes;
4. Move deferrable work off peak; for sustained load, consider SSDs or spreading the data.

### Host disk write rate abnormal[​](#host-disk-write-rate-abnormal "Direct link to Host disk write rate abnormal")

Host unusual disk write rate (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
sum by (instance) (rate(node_disk_written_bytes_total[2m])) / 1024 / 1024 > 50
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util;
2. Run iotop -oP to find the process doing the most IO;
3. On Kubernetes nodes it is usually container log writes, image pull/unpack, or one Pod's data writes;
4. Move deferrable work off peak; for sustained load, consider SSDs or spreading the data.

### Host out of disk space[​](#host-out-of-disk-space "Direct link to Host out of disk space")

Host out of disk space (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

Runbook:

1. Run df -h to find the mount point and du -x --max-depth=1 to drill into the largest directories;
2. For the container runtime directory (/var/lib/containerd or /var/lib/docker) run crictl rmi --prune to clean unused images;
3. Clean container logs (/var/log/pods) and confirm log rotation is working;
4. Use lsof +L1 for deleted files whose handles are still open.

### Host disk will fill up within 24 hours[​](#host-disk-will-fill-up-within-24-hours "Direct link to Host disk will fill up within 24 hours")

Host disk will fill up within 24 hours (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) predict_linear(node_filesystem_avail_bytes{fstype!~"tmpfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

Runbook:

1. Run du -x --max-depth=1 to find the fastest-growing directory;
2. Determine whether the growth is normal business or abnormal (an application looping on logs, backups piling up);
3. Prune unused images and container logs;
4. If the growth is genuine, plan disk expansion or data migration — do not wait until it is full.

### Filesystem inode usage high[​](#filesystem-inode-usage-high "Direct link to Filesystem inode usage high")

Host out of inodes (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Filesystem inodes will fill up within 24 hours[​](#filesystem-inodes-will-fill-up-within-24-hours "Direct link to Filesystem inodes will fill up within 24 hours")

Host inodes will fill up within 24 hours (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and predict_linear(node_filesystem_files_free{mountpoint="/rootfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Host disk read latency abnormal[​](#host-disk-read-latency-abnormal "Direct link to Host disk read latency abnormal")

Host unusual disk read latency (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m]) > 0.1 and rate(node_disk_reads_completed_total[1m]) > 0
```

Runbook:

1. Run iostat -x 1 and look at r\_await/w\_await and queue depth;
2. High latency with low IOPS suggests a disk hardware problem — check with smartctl -a;
3. If IOPS is also high, treat it as disk saturation and find the heavy IO process;
4. For cloud disks, check whether the specification's IOPS/throughput ceiling triggered throttling.

### Host disk write latency abnormal[​](#host-disk-write-latency-abnormal "Direct link to Host disk write latency abnormal")

Host unusual disk write latency (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
rate(node_disk_write_time_seconds_total[1m]) / rate(node_disk_writes_completed_total[1m]) > 0.1 and rate(node_disk_writes_completed_total[1m]) > 0
```

Runbook:

1. Run iostat -x 1 and look at r\_await/w\_await and queue depth;
2. High latency with low IOPS suggests a disk hardware problem — check with smartctl -a;
3. If IOPS is also high, treat it as disk saturation and find the heavy IO process;
4. For cloud disks, check whether the specification's IOPS/throughput ceiling triggered throttling.

### Node CPU load high[​](#node-cpu-load-high "Direct link to Node CPU load high")

Host high CPU load (instance {{ $labels.instance }})

Warning · — · Trigger:

```
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
```

Runbook:

1. Run uptime to see the 1/5/15 minute trend and judge spike versus sustained;
2. Check %wa in top — high means the bottleneck is disk rather than CPU;
3. Use the r/b columns in vmstat 1 to separate CPU-bound from IO-blocked;
4. On Kubernetes nodes use kubectl top pod to find the heavy Pods and consider moving them.

### CPU stolen by other cloud guests[​](#cpu-stolen-by-other-cloud-guests "Direct link to CPU stolen by other cloud guests")

Host CPU steal noisy neighbor (instance {{ $labels.instance }})

Warning · — · Trigger:

```
avg by(instance) (rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100 > 10
```

Runbook:

1. Use top or vmstat to confirm the sustained level of the st column;
2. This is contention at the hypervisor level and cannot be fixed from inside the VM;
3. In the cloud, contact the provider or move to a dedicated instance type (no steal);
4. On self-hosted virtualization, check the host's overcommit ratio and migrate VMs.

### Host context switching abnormal[​](#host-context-switching-abnormal "Direct link to Host context switching abnormal")

Host context switching (instance {{ $labels.instance }})

Warning · — · Trigger:

```
(rate(node_context_switches_total[5m])) / (count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})) > 1000
```

Runbook:

1. Run vmstat 1 and check the cs column;
2. Run pidstat -w 1 to find the processes switching most;
3. Common root causes are too many threads, heavy lock contention, or many short-lived processes;
4. Reducing thread pool sizes and lock granularity in the application is the real fix.

### Host swap almost full[​](#host-swap-almost-full "Direct link to Host swap almost full")

Host swap is full (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80
```

Runbook:

1. Run free -h and swapon -s to check swap usage;
2. Use smem or VmSwap in /proc/\<pid>/status to find the processes swapped out most;
3. Kubernetes nodes should generally have swap disabled — leaving it on masks real memory pressure and breaks QoS;
4. The root cause is insufficient memory, so follow the memory alert path.

### Host system service crashed[​](#host-system-service-crashed "Direct link to Host system service crashed")

Host systemd service crashed (instance {{ $labels.instance }})

Warning · — · Trigger:

```
node_systemd_unit_state{state="failed"} == 1
```

Runbook:

1. Run systemctl --failed to list the failed units;
2. Use journalctl -u \<unit> -n 100 --no-pager to find the cause;
3. On Kubernetes nodes pay special attention to kubelet, containerd and kube-proxy;
4. After fixing, run systemctl reset-failed and confirm recovery.

### Host kernel version deviation[​](#host-kernel-version-deviation "Direct link to Host kernel version deviation")

Host kernel version deviation (instance {{ $labels.instance }})

Warning · 360m · Trigger:

```
count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1
```

Runbook:

1. Run kubectl get node -o wide to compare kernel versions;
2. Determine whether the difference is temporary (mid-upgrade) or long standing;
3. Bring the lagging nodes' kernels in line step by step;
4. Before upgrading, confirm the container runtime and CNI plugin support the target kernel.

### HostOomKill detected[​](#hostoomkill-detected "Direct link to HostOomKill detected")

Host OOM kill detected (instance {{ $labels.instance }})

Warning · — · Trigger:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
2. Match it against kubectl get pod -A to find the Pod and whether its limit is set too low;
3. If the node is tight overall, move Pods off or add capacity;
4. Repeated kills require finding the application memory leak — raising the limit alone will just recur.

### Host network receive errors[​](#host-network-receive-errors "Direct link to Host network receive errors")

Host network receive errors (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
rate(node_network_receive_errs_total[2m]) / rate(node_network_receive_packets_total[2m]) > 0.01
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> for the error counters and types;
2. Confirm the negotiated speed and duplex match the peer;
3. Check the cable/optical module, or open a cloud provider ticket;
4. If redundancy exists, move traffic away first.

### Host network transmit errors[​](#host-network-transmit-errors "Direct link to Host network transmit errors")

Host network transmit errors (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
rate(node_network_transmit_errs_total[2m]) / rate(node_network_transmit_packets_total[2m]) > 0.01
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> for the error counters and types;
2. Confirm the negotiated speed and duplex match the peer;
3. Check the cable/optical module, or open a cloud provider ticket;
4. If redundancy exists, move traffic away first.

### Host network interface saturated[​](#host-network-interface-saturated "Direct link to Host network interface saturated")

Host network interface saturated (instance {{ $labels.instance }})

Warning · 1m · Trigger:

```
(rate(node_network_receive_bytes_total{device!~"^tap.*"}[1m]) + rate(node_network_transmit_bytes_total{device!~"^tap.*"}[1m])) / node_network_speed_bytes{device!~"^tap.*"} > 0.8 < 10000
```

Runbook:

1. Use iftop/nethogs to find the connections consuming the most bandwidth;
2. On Kubernetes nodes, check for high-traffic Pods or large image pulls;
3. Move deferrable jobs off peak;
4. If more bandwidth is genuinely needed, upgrade the NIC or move some workloads.

### Conntrack entries approaching the limit[​](#conntrack-entries-approaching-the-limit "Direct link to Conntrack entries approaching the limit")

Host conntrack limit (instance {{ $labels.instance }})

Warning · 5m · Trigger:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit > 0.8
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to check the level;
2. On Kubernetes nodes, kube-proxy in iptables mode creates many conntrack entries, especially at high Pod density;
3. Raise nf\_conntrack\_max and the bucket count together;
4. Longer term, consider switching to IPVS mode to reduce conntrack pressure.

### Host clock skew[​](#host-clock-skew "Direct link to Host clock skew")

Host clock skew (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
(node_timex_offset_seconds > 0.05 and deriv(node_timex_offset_seconds[5m]) >= 0) or (node_timex_offset_seconds < -0.05 and deriv(node_timex_offset_seconds[5m]) <= 0)
```

Runbook:

1. Run chronyc tracking to check the offset and upstream source state;
2. Confirm chronyd/ntpd is running and enabled at boot;
3. Check that 123/UDP to the NTP server is allowed;
4. For a large offset use chronyc makestep, then confirm all nodes agree on the time.

### Host clock not synchronising[​](#host-clock-not-synchronising "Direct link to Host clock not synchronising")

Host clock not synchronising (instance {{ $labels.instance }})

Warning · 2m · Trigger:

```
min_over_time(node_timex_sync_status[1m]) == 0 and node_timex_maxerror_seconds >= 16
```

Runbook:

1. Run chronyc tracking to check the offset and upstream source state;
2. Confirm chronyd/ntpd is running and enabled at boot;
3. Check that 123/UDP to the NTP server is allowed;
4. For a large offset use chronyc makestep, then confirm all nodes agree on the time.

### Node filesystem filling up - S2[​](#node-filesystem-filling-up---s2 "Direct link to Node filesystem filling up - S2")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up.

Warning · 60m · Trigger:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 40

and

  predict_linear(node_filesystem_avail_bytes{job="node-exporter",fstype!=""}[6h], 24*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run du -x --max-depth=1 to find the fastest-growing directory;
2. Determine whether the growth is normal business or abnormal (an application looping on logs, backups piling up);
3. Prune unused images and container logs;
4. If the growth is genuine, plan disk expansion or data migration — do not wait until it is full.

### Node filesystem filling up - S1[​](#node-filesystem-filling-up---s1 "Direct link to Node filesystem filling up - S1")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up fast.

Critical · 60m · Trigger:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 15

and

  predict_linear(node_filesystem_avail_bytes{job="node-exporter",fstype!=""}[6h], 4*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run du -x --max-depth=1 to find the fastest-growing directory;
2. Determine whether the growth is normal business or abnormal (an application looping on logs, backups piling up);
3. Prune unused images and container logs;
4. If the growth is genuine, plan disk expansion or data migration — do not wait until it is full.

### Node disk almost full - S2 - space - 5[​](#node-disk-almost-full---s2---space---5 "Direct link to Node disk almost full - S2 - space - 5")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

Warning · 60m · Trigger:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 5

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run df -h to find the mount point and du -x --max-depth=1 to drill into the largest directories;
2. For the container runtime directory (/var/lib/containerd or /var/lib/docker) run crictl rmi --prune to clean unused images;
3. Clean container logs (/var/log/pods) and confirm log rotation is working;
4. Use lsof +L1 for deleted files whose handles are still open.

### Node disk almost full - S1 - space - 3[​](#node-disk-almost-full---s1---space---3 "Direct link to Node disk almost full - S1 - space - 3")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

Critical · 60m · Trigger:

```
(

  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 3

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run df -h to find the mount point and du -x --max-depth=1 to drill into the largest directories;
2. For the container runtime directory (/var/lib/containerd or /var/lib/docker) run crictl rmi --prune to clean unused images;
3. Clean container logs (/var/log/pods) and confirm log rotation is working;
4. Use lsof +L1 for deleted files whose handles are still open.

### Node disk almost full - S2 - inodes - 40[​](#node-disk-almost-full---s2---inodes---40 "Direct link to Node disk almost full - S2 - inodes - 40")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up.

Warning · 60m · Trigger:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 40

and

  predict_linear(node_filesystem_files_free{job="node-exporter",fstype!=""}[6h], 24*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node disk almost full - S1 - inodes - 20[​](#node-disk-almost-full---s1---inodes---20 "Direct link to Node disk almost full - S1 - inodes - 20")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up fast.

Critical · 60m · Trigger:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 20

and

  predict_linear(node_filesystem_files_free{job="node-exporter",fstype!=""}[6h], 4*60*60) < 0

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node disk almost full - S2 - inodes - 5[​](#node-disk-almost-full---s2---inodes---5 "Direct link to Node disk almost full - S2 - inodes - 5")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

Warning · 60m · Trigger:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 5

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node disk almost full - S1 - inodes - 3[​](#node-disk-almost-full---s1---inodes---3 "Direct link to Node disk almost full - S1 - inodes - 3")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

Critical · 60m · Trigger:

```
(

  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 3

and

  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0

)
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node conntrack entries usage high[​](#node-conntrack-entries-usage-high "Direct link to Node conntrack entries usage high")

{{ $value | humanizePercentage }} of conntrack entries are used.

Warning · — · Trigger:

```
(node_nf_conntrack_entries / node_nf_conntrack_entries_limit) > 0.75
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to check the level;
2. On Kubernetes nodes, kube-proxy in iptables mode creates many conntrack entries, especially at high Pod density;
3. Raise nf\_conntrack\_max and the bucket count together;
4. Longer term, consider switching to IPVS mode to reduce conntrack pressure.

### Node textfile collector scrape errors[​](#node-textfile-collector-scrape-errors "Direct link to Node textfile collector scrape errors")

Node Exporter text file collector failed to scrape.

Warning · — · Trigger:

```
node_textfile_scrape_error{job="node-exporter"} == 1
```

Runbook:

1. Check the permissions and format of the .prom files in the textfile directory;
2. The writer is usually a cron script — confirm it succeeds and writes atomically (write .tmp then mv);
3. Validate format errors with promtool check metrics;
4. Clean up leftover temporary files, which break parsing.

### Node network interface flapping[​](#node-network-interface-flapping "Direct link to Node network interface flapping")

Network interface "{{ $labels.device }}" changing it's up status often on node-exporter {{ $labels.namespace }}/{{ $labels.pod }}"

Warning · 2m · Trigger:

```
changes(node_network_up{job="node-exporter",device!~"veth.+"}[2m]) > 2
```

Runbook:

1. Run dmesg -T | grep -i 'link is' for the flap timeline;
2. Check the cable and optical module — flapping usually means a bad physical connection;
3. Confirm the negotiated speed and duplex match the peer;
4. Ask the network team about the switch port state, or open a ticket in the cloud.

### A certain disk is unable to read/write normally[​](#a-certain-disk-is-unable-to-readwrite-normally "Direct link to A certain disk is unable to read/write normally")

Critical · 1m · Trigger:

```
(node_filesystem_device_error{mountpoint!~"/var/lib/.*",mountpoint!~"/run.*"}) > 0
```

Runbook:

1. Run dmesg -T | grep -iE 'i/o error|ata|scsi' to see the exact kernel error and device name;
2. Run smartctl -a /dev/sdX and focus on Reallocated\_Sector\_Ct and Current\_Pending\_Sector;
3. Confirm the data on that disk has a replica or backup — data safety comes before hardware work;
4. Once confirmed a hardware fault, schedule downtime to swap the disk; in a RAID array, check the degraded state first.

### Disk needs to be cleaned - utilization has reached 92% - node exporter[​](#disk-needs-to-be-cleaned---utilization-has-reached-92---node-exporter "Direct link to Disk needs to be cleaned - utilization has reached 92% - node exporter")

Critical · 1m · Trigger:

```
(100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) ) > 92
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
2. On a system disk the usual suspects are /var/log and container image layers (docker system df to inspect, docker system prune to clean);
3. Use lsof +L1 to check for deleted-but-unreleased file handles;
4. Longer term, expand the disk or move large data directories to a dedicated disk.

### Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter[​](#insufficient-computational-resources---average-load-per-core-of-the-machine-is-greater-than-10---node-exporter "Direct link to Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter")

Warning · 1m · Trigger:

```
avg (node_load1) by (instance)/count(count(node_cpu_seconds_total) by (cpu,instance)) by (instance) >10
```

Runbook:

1. Run uptime to see the 1/5/15 minute load trend and judge spike versus sustained;
2. Run top and look at %wa (IO wait) — high means the bottleneck is disk rather than CPU, so follow the disk IO path;
3. Run vmstat 1 and use the r (run queue) and b (blocked) columns to separate CPU-bound from IO-blocked;
4. Once you have the specific process, continue down the CPU or IO path and scale out if needed.

### Insufficient file handles - usage exceeds 90% - node exporter[​](#insufficient-file-handles---usage-exceeds-90---node-exporter "Direct link to Insufficient file handles - usage exceeds 90% - node exporter")

You can increase the file handle limit or expand the capacity

Warning · 1m · Trigger:

```
(node_filefd_allocated/node_filefd_maximum*100) > 90
```

Runbook:

1. Run cat /proc/sys/fs/file-nr to see allocated versus the limit;
2. Run lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head to find the processes holding the most handles;
3. As an emergency measure raise it with sysctl -w fs.file-max=\<larger value>, and check the process's ulimit -n and systemd LimitNOFILE;
4. The root cause is usually connections or files never closed — fix the leak in the application.

### Insufficient inode resources - usage exceeds 90% - node exporter[​](#insufficient-inode-resources---usage-exceeds-90---node-exporter "Direct link to Insufficient inode resources - usage exceeds 90% - node exporter")

Warning · 1m · Trigger:

```
(100 - ((node_filesystem_files_free * 100) / node_filesystem_files))>90
```

Runbook:

1. Run df -i to see which mount point is short on inodes;
2. Drill down with for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head to find the directories with the most small files;
3. Common sources are session files, mail queues, cache fragments and uncleaned container layers — confirm with the owner and bulk delete;
4. Longer term, raise inode density at format time or move small-file workloads to a dedicated partition.

### Insufficient memory resources - utilization is greater than 75% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-75---node-exporter "Direct link to Insufficient memory resources - utilization is greater than 75% - node exporter")

Expansion or upgrading of configuration is required

Warning · 1m · Trigger:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 75
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

### Insufficient memory resources - utilization is greater than 95% - node exporter[​](#insufficient-memory-resources---utilization-is-greater-than-95---node-exporter "Direct link to Insufficient memory resources - utilization is greater than 95% - node exporter")

Critical · 1m · Trigger:

```
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 95
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

### Packet loss in the inbound direction of the network card - node exporter[​](#packet-loss-in-the-inbound-direction-of-the-network-card---node-exporter "Direct link to Packet loss in the inbound direction of the network card - node exporter")

Warning · 1m · Trigger:

```
rate(node_network_receive_drop_total{device=~"e.*"}[1m]) > 3
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
2. Run ethtool -S \<nic> to see the specific drop reason (rx\_no\_buffer, rx\_missed\_errors, etc.);
3. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev\_max\_backlog;
4. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

### Packet loss in the outbound direction of the network card - node exporter[​](#packet-loss-in-the-outbound-direction-of-the-network-card---node-exporter "Direct link to Packet loss in the outbound direction of the network card - node exporter")

Warning · 1m · Trigger:

```
rate(node_network_transmit_drop_total{device=~"e.*"}[1m]) > 3
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
2. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
3. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
4. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

### System conntrack needs to be adjusted - usage exceeds 80% - node exporter[​](#system-conntrack-needs-to-be-adjusted---usage-exceeds-80---node-exporter "Direct link to System conntrack needs to be adjusted - usage exceeds 80% - node exporter")

Warning · 1m · Trigger:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit*100 > 80
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to see the current level;
2. Run conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn to see which protocol or source the entries concentrate on;
3. As an emergency measure raise it: sysctl -w net.netfilter.nf\_conntrack\_max=\<larger value>, raising nf\_conntrack\_buckets to match;
4. Also shorten timeouts such as nf\_conntrack\_tcp\_timeout\_time\_wait, or mark traffic that needs no tracking NOTRACK in the iptables raw table.

### System experiences OOM - node exporter[​](#system-experiences-oom---node-exporter "Direct link to System experiences OOM - node exporter")

Warning · 1m · Trigger:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
2. Use free -h and that process's memory history to tell a leak apart from a limit set too high;
3. Lower oom\_score\_adj for critical processes and set cgroup memory limits on secondary ones;
4. If it is a leak, capture a heap profile in the application — adding memory alone will just postpone the recurrence.

### Too many running processes - exceeding 3000 - node exporter[​](#too-many-running-processes---exceeding-3000---node-exporter "Direct link to Too many running processes - exceeding 3000 - node exporter")

Warning · 1m · Trigger:

```
node_procs_running > 3000
```

Runbook:

1. Run ps -eo ppid | sort | uniq -c | sort -rn | head to find the parent forking the most children;
2. Determine whether this is a normal multi-process model (php-fpm, nginx workers) or a runaway fork;
3. For a runaway, stop that parent to stop the bleeding, then fix the fork logic in the code;
4. For genuine growth, tune the worker count and evaluate whether to scale out.

## Categraf (24)[​](#categraf-24 "Direct link to Categraf (24)")

For hosts and instances collected by Categraf; metric names follow Categraf plugins.

8 of the 24 rules in this group also apply unchanged to instances collected by Telegraf, which produces the same metric names.

### Conntrack table usage exceeds 80%[​](#conntrack-table-usage-exceeds-80 "Direct link to Conntrack table usage exceeds 80%")

Warning · 1m · Trigger:

```
conntrack_ip_conntrack_count / conntrack_ip_conntrack_max > 0.8
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to see the current level;
2. Run conntrack -L | awk '{print $4}' | sort | uniq -c | sort -rn to see which protocol or source the entries concentrate on;
3. As an emergency measure raise it: sysctl -w net.netfilter.nf\_conntrack\_max=\<larger value>, raising nf\_conntrack\_buckets to match;
4. Also shorten timeouts such as nf\_conntrack\_tcp\_timeout\_time\_wait, or mark traffic that needs no tracking NOTRACK in the iptables raw table.

### CPU usage high[​](#cpu-usage-high "Direct link to CPU usage high")

Info · 1m · Trigger:

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

### HTTP probe failed[​](#http-probe-failed "Direct link to HTTP probe failed")

Warning · 1m · Trigger:

```
http_response_result_code != 0
```

Runbook:

1. Reproduce it by hand on the collector host with curl -sv \<target URL> and see whether it is a connection failure, a timeout or an unexpected status code;
2. For a connection failure, first confirm the target port is reachable and the process is alive;
3. For an unexpected status code, check the target service logs;
4. Confirm the probe's timeout, expected status code and certificate verification settings match reality, so the config itself is not causing the alert.

### IO busy[​](#io-busy "Direct link to IO busy")

Warning · 1m · Trigger:

```
rate(diskio_io_time[1m])/10 > 99
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util values;
2. Run iotop -oP or pidstat -d 1 to find the process doing the most IO;
3. The usual culprits are large database queries, backup jobs and log flushing — move deferrable work off peak;
4. If it is sustained rather than a spike, consider SSDs or spreading hot data across disks.

### NTP time offset too large[​](#ntp-time-offset-too-large "Direct link to NTP time offset too large")

Warning · 1m · Trigger:

```
ntp_offset_ms > 1000 or ntp_offset_ms < -1000
```

Runbook:

1. Run chronyc tracking (or ntpq -p) to see the current offset and upstream source state;
2. If upstream is unreachable, check the network and whether the firewall allows 123/UDP;
3. Run chronyc sources -v to see whether every source is marked unusable, and switch NTP servers if needed;
4. When the offset is large chrony refuses to slew, so use chronyc makestep to step the clock (prepare time-sensitive workloads first).

### PING probe failed[​](#ping-probe-failed "Direct link to PING probe failed")

Warning · 1m · Trigger:

```
ping_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with ping -c 5 \<target>, then use mtr -n \<target> to find which hop is dropping packets;
2. If the target host is alive, check whether it blocks ICMP (many security policies do) — if so this probe does not apply and you should switch to a port probe;
3. For loss at an intermediate hop, involve the network team;
4. Confirm the target host itself is not down or suffering a NIC failure.

### TIME\_WAIT connections exceed 20000, worth attention[​](#time_wait-connections-exceed-20000-worth-attention "Direct link to TIME_WAIT connections exceed 20000, worth attention")

Warning · 1m · Trigger:

```
netstat_tcp_time_wait > 20000
```

Runbook:

1. Run ss -s to see the connection state distribution;
2. Run ss -tan state time-wait | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn to see which peer they concentrate on;
3. The root cause is usually too many short-lived connections — switching the application to long-lived connections or a pool is by far the most effective fix;
4. As an emergency measure enable net.ipv4.tcp\_tw\_reuse=1 and widen net.ipv4.ip\_local\_port\_range (do not enable tcp\_tw\_recycle — it drops packets behind NAT).

### Memory usage high[​](#memory-usage-high "Direct link to Memory usage high")

Info · 1m · Trigger:

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

### File handle usage exceeds 90%[​](#file-handle-usage-exceeds-90 "Direct link to File handle usage exceeds 90%")

Warning · 1m · Trigger:

```
linux_sysctl_fs_file_nr/linux_sysctl_fs_file_max>0.9
```

Runbook:

1. Run cat /proc/sys/fs/file-nr to see allocated versus the limit;
2. Run lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head to find the processes holding the most handles;
3. As an emergency measure raise it with sysctl -w fs.file-max=\<larger value>, and check the process's ulimit -n and systemd LimitNOFILE;
4. The root cause is usually connections or files never closed — fix the leak in the application.

### Average load per CPU core exceeds 3[​](#average-load-per-cpu-core-exceeds-3 "Direct link to Average load per CPU core exceeds 3")

Warning · 1m · Trigger:

```
system_load_norm_1>3
```

Runbook:

1. Run uptime to see the 1/5/15 minute load trend and judge spike versus sustained;
2. Run top and look at %wa (IO wait) — high means the bottleneck is disk rather than CPU, so follow the disk IO path;
3. Run vmstat 1 and use the r (run queue) and b (blocked) columns to separate CPU-bound from IO-blocked;
4. Once you have the specific process, continue down the CPU or IO path and scale out if needed.

### Disk monitoring - inode usage exceeds 90%[​](#disk-monitoring---inode-usage-exceeds-90 "Direct link to Disk monitoring - inode usage exceeds 90%")

Warning · 1m · Trigger:

```
disk_inodes_used/disk_inodes_total >0.9
```

Runbook:

1. Run df -i to see which mount point is short on inodes;
2. Drill down with for d in /path/\*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head to find the directories with the most small files;
3. Common sources are session files, mail queues, cache fragments and uncleaned container layers — confirm with the owner and bulk delete;
4. Longer term, raise inode density at format time or move small-file workloads to a dedicated partition.

### Disk monitoring - disk larger than 200G is running out of space[​](#disk-monitoring---disk-larger-than-200g-is-running-out-of-space "Direct link to Disk monitoring - disk larger than 200G is running out of space")

Info · 1m · Trigger:

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

### Disk monitoring - disk smaller than 200G is running out of space[​](#disk-monitoring---disk-smaller-than-200g-is-running-out-of-space "Direct link to Disk monitoring - disk smaller than 200G is running out of space")

Info · 1m · Trigger:

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

### Disk monitoring - device errors reported[​](#disk-monitoring---device-errors-reported "Direct link to Disk monitoring - device errors reported")

Warning · 1m · Trigger:

```
disk_device_error>0
```

Runbook:

1. Run dmesg -T | grep -iE 'i/o error|ata|scsi' to see the exact kernel error and device name;
2. Run smartctl -a /dev/sdX and focus on Reallocated\_Sector\_Ct and Current\_Pending\_Sector;
3. Confirm the data on that disk has a replica or backup — data safety comes before hardware work;
4. Once confirmed a hardware fault, schedule downtime to swap the disk; in a RAID array, check the degraded state first.

### Disk monitoring - disk predicted to be full within 4 hours[​](#disk-monitoring---disk-predicted-to-be-full-within-4-hours "Direct link to Disk monitoring - disk predicted to be full within 4 hours")

Critical · 1m · Trigger:

```
predict_linear(disk_free[1h], 4*3600) < 0
```

Runbook:

1. Run df -h to identify the mount point, then drill down with du -x --max-depth=1 \<mount> | sort -h to find the fastest-growing directory;
2. Start with logs (journalctl --vacuum-size=500M, rotate out \*.log.N) and temporary files — that is the quickest win;
3. Use lsof +L1 to find deleted files whose handles are still open; the owning process must be restarted to actually free the space;
4. Confirm whether something abnormal is writing (an application looping on logs, backups piling up) — without fixing the root cause, cleanup only buys time.

### OOM occurred on the system[​](#oom-occurred-on-the-system "Direct link to OOM occurred on the system")

Warning · — · Trigger:

```
increase(kernel_vmstat_oom_kill[2m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
2. Use free -h and that process's memory history to tell a leak apart from a limit set too high;
3. Lower oom\_score\_adj for critical processes and set cgroup memory limits on secondary ones;
4. If it is a leak, capture a heap profile in the application — adding memory alone will just postpone the recurrence.

### NIC monitoring - inbound packet loss[​](#nic-monitoring---inbound-packet-loss "Direct link to NIC monitoring - inbound packet loss")

Info · 1m · Trigger:

```
increase(net_drop_in[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
2. Run ethtool -S \<nic> to see the specific drop reason (rx\_no\_buffer, rx\_missed\_errors, etc.);
3. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev\_max\_backlog;
4. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

### NIC monitoring - inbound packet errors[​](#nic-monitoring---inbound-packet-errors "Direct link to NIC monitoring - inbound packet errors")

Info · 1m · Trigger:

```
increase(net_err_in[1m]) > 0
```

Runbook:

1. Run ethtool -S \<nic> and look at rx\_crc\_errors, rx\_frame\_errors and similar counters;
2. Run ethtool \<nic> to confirm the negotiated speed and duplex match the peer (half duplex is the classic source of errors);
3. Check the cable/optical module, swapping the cable or port to cross-check;
4. Ask the network team for the error counters on the corresponding switch port.

### NIC monitoring - outbound packet loss[​](#nic-monitoring---outbound-packet-loss "Direct link to NIC monitoring - outbound packet loss")

Info · 1m · Trigger:

```
increase(net_drop_out[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
2. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
3. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
4. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

### NIC monitoring - outbound packet errors[​](#nic-monitoring---outbound-packet-errors "Direct link to NIC monitoring - outbound packet errors")

Info · 1m · Trigger:

```
increase(net_err_out[1m]) > 0
```

Runbook:

1. Run ethtool -S \<nic> and look at tx\_errors, tx\_carrier\_errors and similar counters;
2. Run ethtool \<nic> to confirm speed and duplex match the peer;
3. Check the cable/optical module and cross-check by swapping;
4. Verify the NIC driver and firmware versions and upgrade if needed.

### Network probe failed[​](#network-probe-failed "Direct link to Network probe failed")

Warning · 1m · Trigger:

```
net_response_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with telnet \<target> \<port> or nc -vz \<target> \<port>;
2. On the target host, run ss -lntp | grep \<port> to confirm a process is listening;
3. If it is listening, check the firewall, security groups, and whether it is bound only to 127.0.0.1;
4. If nothing is listening, start the service through its own recovery procedure.

### Process monitoring - a process count is 0, the process may be down[​](#process-monitoring---a-process-count-is-0-the-process-may-be-down "Direct link to Process monitoring - a process count is 0, the process may be down")

Critical · 1m · Trigger:

```
procstat_lookup_count == 0
```

Runbook:

1. Run ps -ef | grep \<process keyword> to confirm it is really gone and rule out a wrong match rule on the collector side;
2. Check that process's log and dmesg -T | grep -i 'killed process' to tell a crash, an OOM kill and a manual stop apart;
3. Start it through the service's own procedure and confirm the systemd Restart policy is effective;
4. If it keeps exiting, find the root cause before starting it again to avoid a restart loop.

### Process monitoring - process file handle limit too small[​](#process-monitoring---process-file-handle-limit-too-small "Direct link to Process monitoring - process file handle limit too small")

Info · 1m · Trigger:

```
procstat_rlimit_num_fds_soft < 2048
```

Runbook:

1. Run cat /proc/\<pid>/limits to see the soft and hard Max open files;
2. For systemd services, add LimitNOFILE=65535 to the unit file, then systemctl daemon-reload and restart;
3. For non-systemd, add ulimit -n 65535 to the startup script or edit /etc/security/limits.conf;
4. Note the process must be restarted for a changed soft limit to take effect.

### Process monitoring - total processes exceed 600[​](#process-monitoring---total-processes-exceed-600 "Direct link to Process monitoring - total processes exceed 600")

Warning · 1m · Trigger:

```
processes_total > 600
```

Runbook:

1. Run ps -eo ppid | sort | uniq -c | sort -rn | head to find the parent forking the most children;
2. Determine whether this is a normal multi-process model (php-fpm, nginx workers) or a runaway fork;
3. For a runaway, stop that parent to stop the bleeding, then fix the fork logic in the code;
4. For genuine growth, tune the worker count and evaluate whether to scale out.

## Telegraf (4)[​](#telegraf-4 "Direct link to Telegraf (4)")

For hosts collected by Telegraf with Prometheus-style output.

### Machine load - high CPU, please pay attention - telegraf[​](#machine-load---high-cpu-please-pay-attention---telegraf "Direct link to Machine load - high CPU, please pay attention - telegraf")

Info · 1m · Trigger:

```
cpu_usage_idle{cpu="cpu-total"} < 25
```

Runbook:

1. Run top -H or pidstat 1 to find the busiest processes and threads;
2. Use perf top or a language profiler (arthas/async-profiler for Java, pprof for Go) to locate the hot functions;
3. Tell natural traffic growth apart from a code problem (infinite loop, regex backtracking, frequent GC);
4. For growth, scale out or rate limit; for a code problem, fix and release.

### Machine load - high memory, please pay attention - telegraf[​](#machine-load---high-memory-please-pay-attention---telegraf "Direct link to Machine load - high memory, please pay attention - telegraf")

Warning · 1m · Trigger:

```
mem_available_percent < 25
```

Runbook:

1. Run free -h to check available memory and swap usage;
2. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
3. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop\_caches frees page cache (use with care in production);
4. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

### Process monitoring - lookup failure - telegraf[​](#process-monitoring---lookup-failure---telegraf "Direct link to Process monitoring - lookup failure - telegraf")

Critical · 1m · Trigger:

```
procstat_lookup_result_code != 0
```

Runbook:

1. Reproduce the configured match by hand on the collector host with ps/pgrep;
2. If the process is genuinely gone, follow the service's recovery procedure;
3. If the process exists but the probe fails, check the procstat pid\_file / exe / pattern settings and whether the collector account can read /proc;
4. In containers, confirm categraf mounts the host's /proc.

### there are processes with 0 count, a certain process may have crashed - telegraf[​](#there-are-processes-with-0-count-a-certain-process-may-have-crashed---telegraf "Direct link to there are processes with 0 count, a certain process may have crashed - telegraf")

Critical · 1m · Trigger:

```
procstat_lookup_running == 0
```

Runbook:

1. Run ps -ef | grep \<process keyword> to confirm it is really gone and rule out a wrong match rule on the collector side;
2. Check that process's log and dmesg -T | grep -i 'killed process' to tell a crash, an OOM kill and a manual stop apart;
3. Start it through the service's own procedure and confirm the systemd Restart policy is effective;
4. If it keeps exiting, find the root cause before starting it again to avoid a restart loop.

## How to use these rules[​](#how-to-use-these-rules "Direct link to How to use these rules")

* **With Prometheus or vmalert**: download [`linux.yml`](https://n9e.github.io/alert-rules/linux.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
* **With Nightingale**: the same rules ship in the [Kubernetes](https://n9e.github.io/integrations/kubernetes.md) and [Linux](https://n9e.github.io/integrations/linux.md) integration template. Open the integration center, [import the rules into a business group](https://n9e.github.io/docs/data/integrations/import.md), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

Many rule expressions are adapted from [awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts) (CC BY 4.0). The runbook steps and the remaining rules come from Nightingale's integration templates ([Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes), [Linux](https://github.com/ccfos/nightingale/tree/main/integrations/Linux), Apache-2.0). Corrections are welcome as pull requests there.

## Related[​](#related "Direct link to Related")

* [Monitor Kubernetes with Nightingale](https://n9e.github.io/integrations/kubernetes.md): collector config, dashboards and metric reference
* [Monitor Linux with Nightingale](https://n9e.github.io/integrations/linux.md): collector config, dashboards and metric reference
* [Write a metric rule in Nightingale](https://n9e.github.io/docs/alerting/metric-rules.md)
* [All alert rules](https://n9e.github.io/alert-rules.md)
