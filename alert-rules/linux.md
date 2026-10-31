---
title: "Linux alert rules for Prometheus: 76 rules with runbooks"
sidebar_label: "Linux"
sidebar_position: 3
description: "76 ready-to-use Linux alert rules in PromQL, each with severity, duration and runbook steps. Metrics from node_exporter, Categraf, Telegraf. Download as a Prometheus rules file or import into Nightingale."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes
toc_max_heading_level: 2
mdx:
  format: md
---

Host-level alert rules for Linux servers and Kubernetes nodes: memory exhaustion and pressure, disks and inodes running out (including "will fill up within 24 hours" predictions), disk latency, network errors, packet loss and saturation, CPU load and steal, OOM kills, conntrack and file-handle exhaustion, clock skew, crashed system services, missing processes, and failed PING, port and HTTP probes. The node_exporter group uses standard `node_*` metric names; the Categraf and Telegraf groups cover the same ground for hosts collected by those agents.

## At a glance

- **76 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
- **Metrics from**: node_exporter, Categraf, Telegraf
- **Download**: [`linux.yml`](pathname:///alert-rules/linux.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
- Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list

| Rule | Severity | For |
| --- | --- | --- |
| Host out of memory | Warning | 2m |
| Host under memory pressure | Warning | 2m |
| Host inbound network throughput abnormal | Warning | 5m |
| Host outbound network throughput abnormal | Warning | 5m |
| Host disk read rate abnormal | Warning | 5m |
| Host disk write rate abnormal | Warning | 2m |
| Host out of disk space | Warning | 2m |
| Host disk will fill up within 24 hours | Warning | 2m |
| Filesystem inode usage high | Warning | 2m |
| Filesystem inodes will fill up within 24 hours | Warning | 2m |
| Host disk read latency abnormal | Warning | 2m |
| Host disk write latency abnormal | Warning | 2m |
| Node CPU load high | Warning | — |
| CPU stolen by other cloud guests | Warning | — |
| Host context switching abnormal | Warning | — |
| Host swap almost full | Warning | 2m |
| Host system service crashed | Warning | — |
| Host kernel version deviation | Warning | 360m |
| HostOomKill detected | Warning | — |
| Host network receive errors | Warning | 2m |
| Host network transmit errors | Warning | 2m |
| Host network interface saturated | Warning | 1m |
| Conntrack entries approaching the limit | Warning | 5m |
| Host clock skew | Warning | 2m |
| Host clock not synchronising | Warning | 2m |
| Node filesystem filling up - S2 | Warning | 60m |
| Node filesystem filling up - S1 | Critical | 60m |
| Node disk almost full - S2 - space - 5 | Warning | 60m |
| Node disk almost full - S1 - space - 3 | Critical | 60m |
| Node disk almost full - S2 - inodes - 40 | Warning | 60m |
| Node disk almost full - S1 - inodes - 20 | Critical | 60m |
| Node disk almost full - S2 - inodes - 5 | Warning | 60m |
| Node disk almost full - S1 - inodes - 3 | Critical | 60m |
| Node conntrack entries usage high | Warning | — |
| Node textfile collector scrape errors | Warning | — |
| Node network interface flapping | Warning | 2m |
| A certain disk is unable to read/write normally | Critical | 1m |
| Disk needs to be cleaned - utilization has reached 92% - node exporter | Critical | 1m |
| Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter | Warning | 1m |
| Insufficient file handles - usage exceeds 90% - node exporter | Warning | 1m |
| Insufficient inode resources - usage exceeds 90% - node exporter | Warning | 1m |
| Insufficient memory resources - utilization is greater than 75% - node exporter | Warning | 1m |
| Insufficient memory resources - utilization is greater than 95% - node exporter | Critical | 1m |
| Packet loss in the inbound direction of the network card - node exporter | Warning | 1m |
| Packet loss in the outbound direction of the network card - node exporter | Warning | 1m |
| System conntrack needs to be adjusted - usage exceeds 80% - node exporter | Warning | 1m |
| System experiences OOM - node exporter | Warning | 1m |
| Too many running processes - exceeding 3000 - node exporter | Warning | 1m |
| Conntrack table usage exceeds 80% | Warning | 1m |
| CPU usage high | Info | 1m |
| HTTP probe failed | Warning | 1m |
| IO busy | Warning | 1m |
| NTP time offset too large | Warning | 1m |
| PING probe failed | Warning | 1m |
| TIME_WAIT connections exceed 20000, worth attention | Warning | 1m |
| Memory usage high | Info | 1m |
| File handle usage exceeds 90% | Warning | 1m |
| Average load per CPU core exceeds 3 | Warning | 1m |
| Disk monitoring - inode usage exceeds 90% | Warning | 1m |
| Disk monitoring - disk larger than 200G is running out of space | Info | 1m |
| Disk monitoring - disk smaller than 200G is running out of space | Info | 1m |
| Disk monitoring - device errors reported | Warning | 1m |
| Disk monitoring - disk predicted to be full within 4 hours | Critical | 1m |
| OOM occurred on the system | Warning | — |
| NIC monitoring - inbound packet loss | Info | 1m |
| NIC monitoring - inbound packet errors | Info | 1m |
| NIC monitoring - outbound packet loss | Info | 1m |
| NIC monitoring - outbound packet errors | Info | 1m |
| Network probe failed | Warning | 1m |
| Process monitoring - a process count is 0, the process may be down | Critical | 1m |
| Process monitoring - process file handle limit too small | Info | 1m |
| Process monitoring - total processes exceed 600 | Warning | 1m |
| Machine load - high CPU, please pay attention - telegraf | Info | 1m |
| Machine load - high memory, please pay attention - telegraf | Warning | 1m |
| Process monitoring - lookup failure - telegraf | Critical | 1m |
| there are processes with 0 count, a certain process may have crashed - telegraf | Critical | 1m |

## node_exporter (48)

### Host out of memory

Node out of memory (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10
```

Runbook:

1. On the node run free -h to check available memory and swap;
1. Run ps aux --sort=-%mem | head for the biggest consumers;
1. On Kubernetes nodes, prefer kubectl top pod -A --sort-by=memory to find the Pod;
1. For a leak, fix it in the application; for capacity, move Pods off or add nodes.

### Host under memory pressure

Node under memory pressure (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
rate(node_vmstat_pgmajfault[1m]) > 1000
```

Runbook:

1. Run vmstat 1 and check the si/so columns for swapping;
1. Use sar -B or /proc/vmstat to watch pgmajfault growth;
1. Find the heaviest process or Pod and assess whether it can be moved;
1. Review the swap setting — Kubernetes nodes normally have swap disabled, since enabling it masks memory problems.

### Host inbound network throughput abnormal

Host unusual network throughput in (instance \{\{ $labels.instance \}\})

Warning · 5m · Trigger:

```promql
sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100
```

Runbook:

1. Use iftop or nethogs to find the processes/connections consuming the most bandwidth;
1. On Kubernetes nodes, check whether a Pod is doing bulk data transfer (backup, data sync, image pull);
1. Confirm whether the NIC is saturated and throttle or reschedule if so;
1. For abnormal traffic, check for a misconfiguration causing a traffic loop.

### Host outbound network throughput abnormal

Host unusual network throughput out (instance \{\{ $labels.instance \}\})

Warning · 5m · Trigger:

```promql
sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100
```

Runbook:

1. Use iftop or nethogs to find the processes/connections consuming the most bandwidth;
1. On Kubernetes nodes, check whether a Pod is doing bulk data transfer (backup, data sync, image pull);
1. Confirm whether the NIC is saturated and throttle or reschedule if so;
1. For abnormal traffic, check for a misconfiguration causing a traffic loop.

### Host disk read rate abnormal

Host unusual disk read rate (instance \{\{ $labels.instance \}\})

Warning · 5m · Trigger:

```promql
sum by (instance) (rate(node_disk_read_bytes_total[2m])) / 1024 / 1024 > 50
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util;
1. Run iotop -oP to find the process doing the most IO;
1. On Kubernetes nodes it is usually container log writes, image pull/unpack, or one Pod's data writes;
1. Move deferrable work off peak; for sustained load, consider SSDs or spreading the data.

### Host disk write rate abnormal

Host unusual disk write rate (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
sum by (instance) (rate(node_disk_written_bytes_total[2m])) / 1024 / 1024 > 50
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util;
1. Run iotop -oP to find the process doing the most IO;
1. On Kubernetes nodes it is usually container log writes, image pull/unpack, or one Pod's data writes;
1. Move deferrable work off peak; for sustained load, consider SSDs or spreading the data.

### Host out of disk space

Host out of disk space (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

Runbook:

1. Run df -h to find the mount point and du -x --max-depth=1 to drill into the largest directories;
1. For the container runtime directory (/var/lib/containerd or /var/lib/docker) run crictl rmi --prune to clean unused images;
1. Clean container logs (/var/log/pods) and confirm log rotation is working;
1. Use lsof +L1 for deleted files whose handles are still open.

### Host disk will fill up within 24 hours

Host disk will fill up within 24 hours (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) predict_linear(node_filesystem_avail_bytes{fstype!~"tmpfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

Runbook:

1. Run du -x --max-depth=1 to find the fastest-growing directory;
1. Determine whether the growth is normal business or abnormal (an application looping on logs, backups piling up);
1. Prune unused images and container logs;
1. If the growth is genuine, plan disk expansion or data migration — do not wait until it is full.

### Filesystem inode usage high

Host out of inodes (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

Runbook:

1. Run df -i to find the mount point;
1. Count files level by level to find the directories with the most small files;
1. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
1. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Filesystem inodes will fill up within 24 hours

Host inodes will fill up within 24 hours (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and predict_linear(node_filesystem_files_free{mountpoint="/rootfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

Runbook:

1. Run df -i to find the mount point;
1. Count files level by level to find the directories with the most small files;
1. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
1. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Host disk read latency abnormal

Host unusual disk read latency (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m]) > 0.1 and rate(node_disk_reads_completed_total[1m]) > 0
```

Runbook:

1. Run iostat -x 1 and look at r_await/w_await and queue depth;
1. High latency with low IOPS suggests a disk hardware problem — check with smartctl -a;
1. If IOPS is also high, treat it as disk saturation and find the heavy IO process;
1. For cloud disks, check whether the specification's IOPS/throughput ceiling triggered throttling.

### Host disk write latency abnormal

Host unusual disk write latency (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
rate(node_disk_write_time_seconds_total[1m]) / rate(node_disk_writes_completed_total[1m]) > 0.1 and rate(node_disk_writes_completed_total[1m]) > 0
```

Runbook:

1. Run iostat -x 1 and look at r_await/w_await and queue depth;
1. High latency with low IOPS suggests a disk hardware problem — check with smartctl -a;
1. If IOPS is also high, treat it as disk saturation and find the heavy IO process;
1. For cloud disks, check whether the specification's IOPS/throughput ceiling triggered throttling.

### Node CPU load high

Host high CPU load (instance \{\{ $labels.instance \}\})

Warning · — · Trigger:

```promql
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
```

Runbook:

1. Run uptime to see the 1/5/15 minute trend and judge spike versus sustained;
1. Check %wa in top — high means the bottleneck is disk rather than CPU;
1. Use the r/b columns in vmstat 1 to separate CPU-bound from IO-blocked;
1. On Kubernetes nodes use kubectl top pod to find the heavy Pods and consider moving them.

### CPU stolen by other cloud guests

Host CPU steal noisy neighbor (instance \{\{ $labels.instance \}\})

Warning · — · Trigger:

```promql
avg by(instance) (rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100 > 10
```

Runbook:

1. Use top or vmstat to confirm the sustained level of the st column;
1. This is contention at the hypervisor level and cannot be fixed from inside the VM;
1. In the cloud, contact the provider or move to a dedicated instance type (no steal);
1. On self-hosted virtualization, check the host's overcommit ratio and migrate VMs.

### Host context switching abnormal

Host context switching (instance \{\{ $labels.instance \}\})

Warning · — · Trigger:

```promql
(rate(node_context_switches_total[5m])) / (count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})) > 1000
```

Runbook:

1. Run vmstat 1 and check the cs column;
1. Run pidstat -w 1 to find the processes switching most;
1. Common root causes are too many threads, heavy lock contention, or many short-lived processes;
1. Reducing thread pool sizes and lock granularity in the application is the real fix.

### Host swap almost full

Host swap is full (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80
```

Runbook:

1. Run free -h and swapon -s to check swap usage;
1. Use smem or VmSwap in /proc/\<pid>/status to find the processes swapped out most;
1. Kubernetes nodes should generally have swap disabled — leaving it on masks real memory pressure and breaks QoS;
1. The root cause is insufficient memory, so follow the memory alert path.

### Host system service crashed

Host systemd service crashed (instance \{\{ $labels.instance \}\})

Warning · — · Trigger:

```promql
node_systemd_unit_state{state="failed"} == 1
```

Runbook:

1. Run systemctl --failed to list the failed units;
1. Use journalctl -u \<unit> -n 100 --no-pager to find the cause;
1. On Kubernetes nodes pay special attention to kubelet, containerd and kube-proxy;
1. After fixing, run systemctl reset-failed and confirm recovery.

### Host kernel version deviation

Host kernel version deviation (instance \{\{ $labels.instance \}\})

Warning · 360m · Trigger:

```promql
count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1
```

Runbook:

1. Run kubectl get node -o wide to compare kernel versions;
1. Determine whether the difference is temporary (mid-upgrade) or long standing;
1. Bring the lagging nodes' kernels in line step by step;
1. Before upgrading, confirm the container runtime and CNI plugin support the target kernel.

### HostOomKill detected

Host OOM kill detected (instance \{\{ $labels.instance \}\})

Warning · — · Trigger:

```promql
increase(node_vmstat_oom_kill[1m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
1. Match it against kubectl get pod -A to find the Pod and whether its limit is set too low;
1. If the node is tight overall, move Pods off or add capacity;
1. Repeated kills require finding the application memory leak — raising the limit alone will just recur.

### Host network receive errors

Host network receive errors (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
rate(node_network_receive_errs_total[2m]) / rate(node_network_receive_packets_total[2m]) > 0.01
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> for the error counters and types;
1. Confirm the negotiated speed and duplex match the peer;
1. Check the cable/optical module, or open a cloud provider ticket;
1. If redundancy exists, move traffic away first.

### Host network transmit errors

Host network transmit errors (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
rate(node_network_transmit_errs_total[2m]) / rate(node_network_transmit_packets_total[2m]) > 0.01
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> for the error counters and types;
1. Confirm the negotiated speed and duplex match the peer;
1. Check the cable/optical module, or open a cloud provider ticket;
1. If redundancy exists, move traffic away first.

### Host network interface saturated

Host network interface saturated (instance \{\{ $labels.instance \}\})

Warning · 1m · Trigger:

```promql
(rate(node_network_receive_bytes_total{device!~"^tap.*"}[1m]) + rate(node_network_transmit_bytes_total{device!~"^tap.*"}[1m])) / node_network_speed_bytes{device!~"^tap.*"} > 0.8 < 10000
```

Runbook:

1. Use iftop/nethogs to find the connections consuming the most bandwidth;
1. On Kubernetes nodes, check for high-traffic Pods or large image pulls;
1. Move deferrable jobs off peak;
1. If more bandwidth is genuinely needed, upgrade the NIC or move some workloads.

### Conntrack entries approaching the limit

Host conntrack limit (instance \{\{ $labels.instance \}\})

Warning · 5m · Trigger:

```promql
node_nf_conntrack_entries / node_nf_conntrack_entries_limit > 0.8
```

Runbook:

1. Run sysctl net.netfilter.nf_conntrack_count and nf_conntrack_max to check the level;
1. On Kubernetes nodes, kube-proxy in iptables mode creates many conntrack entries, especially at high Pod density;
1. Raise nf_conntrack_max and the bucket count together;
1. Longer term, consider switching to IPVS mode to reduce conntrack pressure.

### Host clock skew

Host clock skew (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
(node_timex_offset_seconds > 0.05 and deriv(node_timex_offset_seconds[5m]) >= 0) or (node_timex_offset_seconds < -0.05 and deriv(node_timex_offset_seconds[5m]) <= 0)
```

Runbook:

1. Run chronyc tracking to check the offset and upstream source state;
1. Confirm chronyd/ntpd is running and enabled at boot;
1. Check that 123/UDP to the NTP server is allowed;
1. For a large offset use chronyc makestep, then confirm all nodes agree on the time.

### Host clock not synchronising

Host clock not synchronising (instance \{\{ $labels.instance \}\})

Warning · 2m · Trigger:

```promql
min_over_time(node_timex_sync_status[1m]) == 0 and node_timex_maxerror_seconds >= 16
```

Runbook:

1. Run chronyc tracking to check the offset and upstream source state;
1. Confirm chronyd/ntpd is running and enabled at boot;
1. Check that 123/UDP to the NTP server is allowed;
1. For a large offset use chronyc makestep, then confirm all nodes agree on the time.

### Node filesystem filling up - S2

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left and is filling up.

Warning · 60m · Trigger:

```promql
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
1. Determine whether the growth is normal business or abnormal (an application looping on logs, backups piling up);
1. Prune unused images and container logs;
1. If the growth is genuine, plan disk expansion or data migration — do not wait until it is full.

### Node filesystem filling up - S1

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left and is filling up fast.

Critical · 60m · Trigger:

```promql
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
1. Determine whether the growth is normal business or abnormal (an application looping on logs, backups piling up);
1. Prune unused images and container logs;
1. If the growth is genuine, plan disk expansion or data migration — do not wait until it is full.

### Node disk almost full - S2 - space - 5

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left.

Warning · 60m · Trigger:

```promql
(
  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 5
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

Runbook:

1. Run df -h to find the mount point and du -x --max-depth=1 to drill into the largest directories;
1. For the container runtime directory (/var/lib/containerd or /var/lib/docker) run crictl rmi --prune to clean unused images;
1. Clean container logs (/var/log/pods) and confirm log rotation is working;
1. Use lsof +L1 for deleted files whose handles are still open.

### Node disk almost full - S1 - space - 3

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available space left.

Critical · 60m · Trigger:

```promql
(
  node_filesystem_avail_bytes{job="node-exporter",fstype!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!=""} * 100 < 3
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

Runbook:

1. Run df -h to find the mount point and du -x --max-depth=1 to drill into the largest directories;
1. For the container runtime directory (/var/lib/containerd or /var/lib/docker) run crictl rmi --prune to clean unused images;
1. Clean container logs (/var/log/pods) and confirm log rotation is working;
1. Use lsof +L1 for deleted files whose handles are still open.

### Node disk almost full - S2 - inodes - 40

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left and is filling up.

Warning · 60m · Trigger:

```promql
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
1. Count files level by level to find the directories with the most small files;
1. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
1. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node disk almost full - S1 - inodes - 20

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left and is filling up fast.

Critical · 60m · Trigger:

```promql
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
1. Count files level by level to find the directories with the most small files;
1. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
1. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node disk almost full - S2 - inodes - 5

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left.

Warning · 60m · Trigger:

```promql
(
  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 5
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

Runbook:

1. Run df -i to find the mount point;
1. Count files level by level to find the directories with the most small files;
1. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
1. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node disk almost full - S1 - inodes - 3

Filesystem on \{\{ $labels.device \}\} at \{\{ $labels.instance \}\} has only \{\{ printf "%.2f" $value \}\}% available inodes left.

Critical · 60m · Trigger:

```promql
(
  node_filesystem_files_free{job="node-exporter",fstype!=""} / node_filesystem_files{job="node-exporter",fstype!=""} * 100 < 3
and
  node_filesystem_readonly{job="node-exporter",fstype!=""} == 0
)
```

Runbook:

1. Run df -i to find the mount point;
1. Count files level by level to find the directories with the most small files;
1. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
1. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

### Node conntrack entries usage high

\{\{ $value | humanizePercentage \}\} of conntrack entries are used.

Warning · — · Trigger:

```promql
(node_nf_conntrack_entries / node_nf_conntrack_entries_limit) > 0.75
```

Runbook:

1. Run sysctl net.netfilter.nf_conntrack_count and nf_conntrack_max to check the level;
1. On Kubernetes nodes, kube-proxy in iptables mode creates many conntrack entries, especially at high Pod density;
1. Raise nf_conntrack_max and the bucket count together;
1. Longer term, consider switching to IPVS mode to reduce conntrack pressure.

### Node textfile collector scrape errors

Node Exporter text file collector failed to scrape.

Warning · — · Trigger:

```promql
node_textfile_scrape_error{job="node-exporter"} == 1
```

Runbook:

1. Check the permissions and format of the .prom files in the textfile directory;
1. The writer is usually a cron script — confirm it succeeds and writes atomically (write .tmp then mv);
1. Validate format errors with promtool check metrics;
1. Clean up leftover temporary files, which break parsing.

### Node network interface flapping

Network interface "\{\{ $labels.device \}\}" changing it's up status often on node-exporter \{\{ $labels.namespace \}\}/\{\{ $labels.pod \}\}"

Warning · 2m · Trigger:

```promql
changes(node_network_up{job="node-exporter",device!~"veth.+"}[2m]) > 2
```

Runbook:

1. Run dmesg -T | grep -i 'link is' for the flap timeline;
1. Check the cable and optical module — flapping usually means a bad physical connection;
1. Confirm the negotiated speed and duplex match the peer;
1. Ask the network team about the switch port state, or open a ticket in the cloud.

### A certain disk is unable to read/write normally

Critical · 1m · Trigger:

```promql
(node_filesystem_device_error{mountpoint!~"/var/lib/.*",mountpoint!~"/run.*"}) > 0
```

Runbook:

1. Run dmesg -T | grep -iE 'i/o error|ata|scsi' to see the exact kernel error and device name;
1. Run smartctl -a /dev/sdX and focus on Reallocated_Sector_Ct and Current_Pending_Sector;
1. Confirm the data on that disk has a replica or backup — data safety comes before hardware work;
1. Once confirmed a hardware fault, schedule downtime to swap the disk; in a RAID array, check the degraded state first.

### Disk needs to be cleaned - utilization has reached 92% - node exporter

Critical · 1m · Trigger:

```promql
(100 - ((node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes) ) > 92
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
1. On a system disk the usual suspects are /var/log and container image layers (docker system df to inspect, docker system prune to clean);
1. Use lsof +L1 to check for deleted-but-unreleased file handles;
1. Longer term, expand the disk or move large data directories to a dedicated disk.

### Insufficient computational resources - average load per core of the machine is greater than 10 - node exporter

Warning · 1m · Trigger:

```promql
avg (node_load1) by (instance)/count(count(node_cpu_seconds_total) by (cpu,instance)) by (instance) >10
```

Runbook:

1. Run uptime to see the 1/5/15 minute load trend and judge spike versus sustained;
1. Run top and look at %wa (IO wait) — high means the bottleneck is disk rather than CPU, so follow the disk IO path;
1. Run vmstat 1 and use the r (run queue) and b (blocked) columns to separate CPU-bound from IO-blocked;
1. Once you have the specific process, continue down the CPU or IO path and scale out if needed.

### Insufficient file handles - usage exceeds 90% - node exporter

You can increase the file handle limit or expand the capacity

Warning · 1m · Trigger:

```promql
(node_filefd_allocated/node_filefd_maximum*100) > 90
```

Runbook:

1. Run cat /proc/sys/fs/file-nr to see allocated versus the limit;
1. Run lsof | awk '\{print $2\}' | sort | uniq -c | sort -rn | head to find the processes holding the most handles;
1. As an emergency measure raise it with sysctl -w fs.file-max=\<larger value>, and check the process's ulimit -n and systemd LimitNOFILE;
1. The root cause is usually connections or files never closed — fix the leak in the application.

### Insufficient inode resources - usage exceeds 90% - node exporter

Warning · 1m · Trigger:

```promql
(100 - ((node_filesystem_files_free * 100) / node_filesystem_files))>90
```

Runbook:

1. Run df -i to see which mount point is short on inodes;
1. Drill down with for d in /path/*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head to find the directories with the most small files;
1. Common sources are session files, mail queues, cache fragments and uncleaned container layers — confirm with the owner and bulk delete;
1. Longer term, raise inode density at format time or move small-file workloads to a dedicated partition.

### Insufficient memory resources - utilization is greater than 75% - node exporter

Expansion or upgrading of configuration is required

Warning · 1m · Trigger:

```promql
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 75
```

Runbook:

1. Run free -h to check available memory and swap usage;
1. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
1. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop_caches frees page cache (use with care in production);
1. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

### Insufficient memory resources - utilization is greater than 95% - node exporter

Critical · 1m · Trigger:

```promql
(node_memory_MemTotal_bytes - node_memory_MemFree_bytes - (node_memory_Cached_bytes + node_memory_Buffers_bytes))/node_memory_MemTotal_bytes*100 > 95
```

Runbook:

1. Run free -h to check available memory and swap usage;
1. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
1. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop_caches frees page cache (use with care in production);
1. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

### Packet loss in the inbound direction of the network card - node exporter

Warning · 1m · Trigger:

```promql
rate(node_network_receive_drop_total{device=~"e.*"}[1m]) > 3
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
1. Run ethtool -S \<nic> to see the specific drop reason (rx_no_buffer, rx_missed_errors, etc.);
1. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev_max_backlog;
1. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

### Packet loss in the outbound direction of the network card - node exporter

Warning · 1m · Trigger:

```promql
rate(node_network_transmit_drop_total{device=~"e.*"}[1m]) > 3
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
1. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
1. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
1. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

### System conntrack needs to be adjusted - usage exceeds 80% - node exporter

Warning · 1m · Trigger:

```promql
node_nf_conntrack_entries / node_nf_conntrack_entries_limit*100 > 80
```

Runbook:

1. Run sysctl net.netfilter.nf_conntrack_count and nf_conntrack_max to see the current level;
1. Run conntrack -L | awk '\{print $4\}' | sort | uniq -c | sort -rn to see which protocol or source the entries concentrate on;
1. As an emergency measure raise it: sysctl -w net.netfilter.nf_conntrack_max=\<larger value>, raising nf_conntrack_buckets to match;
1. Also shorten timeouts such as nf_conntrack_tcp_timeout_time_wait, or mark traffic that needs no tracking NOTRACK in the iptables raw table.

### System experiences OOM - node exporter

Warning · 1m · Trigger:

```promql
increase(node_vmstat_oom_kill[1m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
1. Use free -h and that process's memory history to tell a leak apart from a limit set too high;
1. Lower oom_score_adj for critical processes and set cgroup memory limits on secondary ones;
1. If it is a leak, capture a heap profile in the application — adding memory alone will just postpone the recurrence.

### Too many running processes - exceeding 3000 - node exporter

Warning · 1m · Trigger:

```promql
node_procs_running > 3000
```

Runbook:

1. Run ps -eo ppid | sort | uniq -c | sort -rn | head to find the parent forking the most children;
1. Determine whether this is a normal multi-process model (php-fpm, nginx workers) or a runaway fork;
1. For a runaway, stop that parent to stop the bleeding, then fix the fork logic in the code;
1. For genuine growth, tune the worker count and evaluate whether to scale out.

## Categraf (24)

For hosts and instances collected by Categraf; metric names follow Categraf plugins.

8 of the 24 rules in this group also apply unchanged to instances collected by Telegraf, which produces the same metric names.

### Conntrack table usage exceeds 80%

Warning · 1m · Trigger:

```promql
conntrack_ip_conntrack_count / conntrack_ip_conntrack_max > 0.8
```

Runbook:

1. Run sysctl net.netfilter.nf_conntrack_count and nf_conntrack_max to see the current level;
1. Run conntrack -L | awk '\{print $4\}' | sort | uniq -c | sort -rn to see which protocol or source the entries concentrate on;
1. As an emergency measure raise it: sysctl -w net.netfilter.nf_conntrack_max=\<larger value>, raising nf_conntrack_buckets to match;
1. Also shorten timeouts such as nf_conntrack_tcp_timeout_time_wait, or mark traffic that needs no tracking NOTRACK in the iptables raw table.

### CPU usage high

Info · 1m · Trigger:

```promql
cpu_usage_active>75

cpu_usage_active>85

cpu_usage_active>95
```

Runbook:

1. Run top -H or pidstat 1 to find the busiest processes and threads;
1. Use perf top or a language profiler (arthas/async-profiler for Java, pprof for Go) to locate the hot functions;
1. Tell natural traffic growth apart from a code problem (infinite loop, regex backtracking, frequent GC);
1. For growth, scale out or rate limit; for a code problem, fix and release.

### HTTP probe failed

Warning · 1m · Trigger:

```promql
http_response_result_code != 0
```

Runbook:

1. Reproduce it by hand on the collector host with curl -sv \<target URL> and see whether it is a connection failure, a timeout or an unexpected status code;
1. For a connection failure, first confirm the target port is reachable and the process is alive;
1. For an unexpected status code, check the target service logs;
1. Confirm the probe's timeout, expected status code and certificate verification settings match reality, so the config itself is not causing the alert.

### IO busy

Warning · 1m · Trigger:

```promql
rate(diskio_io_time[1m])/10 > 99
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util values;
1. Run iotop -oP or pidstat -d 1 to find the process doing the most IO;
1. The usual culprits are large database queries, backup jobs and log flushing — move deferrable work off peak;
1. If it is sustained rather than a spike, consider SSDs or spreading hot data across disks.

### NTP time offset too large

Warning · 1m · Trigger:

```promql
ntp_offset_ms > 1000 or ntp_offset_ms < -1000
```

Runbook:

1. Run chronyc tracking (or ntpq -p) to see the current offset and upstream source state;
1. If upstream is unreachable, check the network and whether the firewall allows 123/UDP;
1. Run chronyc sources -v to see whether every source is marked unusable, and switch NTP servers if needed;
1. When the offset is large chrony refuses to slew, so use chronyc makestep to step the clock (prepare time-sensitive workloads first).

### PING probe failed

Warning · 1m · Trigger:

```promql
ping_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with ping -c 5 \<target>, then use mtr -n \<target> to find which hop is dropping packets;
1. If the target host is alive, check whether it blocks ICMP (many security policies do) — if so this probe does not apply and you should switch to a port probe;
1. For loss at an intermediate hop, involve the network team;
1. Confirm the target host itself is not down or suffering a NIC failure.

### TIME_WAIT connections exceed 20000, worth attention

Warning · 1m · Trigger:

```promql
netstat_tcp_time_wait > 20000
```

Runbook:

1. Run ss -s to see the connection state distribution;
1. Run ss -tan state time-wait | awk '\{print $4\}' | cut -d: -f1 | sort | uniq -c | sort -rn to see which peer they concentrate on;
1. The root cause is usually too many short-lived connections — switching the application to long-lived connections or a pool is by far the most effective fix;
1. As an emergency measure enable net.ipv4.tcp_tw_reuse=1 and widen net.ipv4.ip_local_port_range (do not enable tcp_tw_recycle — it drops packets behind NAT).

### Memory usage high

Info · 1m · Trigger:

```promql
mem_available_percent < 25

mem_available_percent < 15

mem_available_percent < 5
```

Runbook:

1. Run free -h to check available memory and swap usage;
1. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
1. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop_caches frees page cache (use with care in production);
1. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

### File handle usage exceeds 90%

Warning · 1m · Trigger:

```promql
linux_sysctl_fs_file_nr/linux_sysctl_fs_file_max>0.9
```

Runbook:

1. Run cat /proc/sys/fs/file-nr to see allocated versus the limit;
1. Run lsof | awk '\{print $2\}' | sort | uniq -c | sort -rn | head to find the processes holding the most handles;
1. As an emergency measure raise it with sysctl -w fs.file-max=\<larger value>, and check the process's ulimit -n and systemd LimitNOFILE;
1. The root cause is usually connections or files never closed — fix the leak in the application.

### Average load per CPU core exceeds 3

Warning · 1m · Trigger:

```promql
system_load_norm_1>3
```

Runbook:

1. Run uptime to see the 1/5/15 minute load trend and judge spike versus sustained;
1. Run top and look at %wa (IO wait) — high means the bottleneck is disk rather than CPU, so follow the disk IO path;
1. Run vmstat 1 and use the r (run queue) and b (blocked) columns to separate CPU-bound from IO-blocked;
1. Once you have the specific process, continue down the CPU or IO path and scale out if needed.

### Disk monitoring - inode usage exceeds 90%

Warning · 1m · Trigger:

```promql
disk_inodes_used/disk_inodes_total >0.9
```

Runbook:

1. Run df -i to see which mount point is short on inodes;
1. Drill down with for d in /path/*; do echo "$(find $d | wc -l) $d"; done | sort -rn | head to find the directories with the most small files;
1. Common sources are session files, mail queues, cache fragments and uncleaned container layers — confirm with the owner and bulk delete;
1. Longer term, raise inode density at format time or move small-file workloads to a dedicated partition.

### Disk monitoring - disk larger than 200G is running out of space

Info · 1m · Trigger:

```promql
disk_free/1024/1024/1024 < 20 and disk_total/1024/1024/1024 >= 200

disk_free/1024/1024/1024 < 10 and disk_total/1024/1024/1024 >= 200

disk_free/1024/1024/1024 < 2 and disk_total/1024/1024/1024 >= 200
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
1. Clean up logs and expired data, and use lsof +L1 to check for deleted-but-unreleased files;
1. Evaluate whether the data directory should move to its own disk or the disk should be expanded;
1. For a database or object-store data disk, tier cold data off according to the business archiving policy.

### Disk monitoring - disk smaller than 200G is running out of space

Info · 1m · Trigger:

```promql
disk_used_percent > 90 and disk_total/1024/1024/1024 < 200

disk_used_percent > 95 and disk_total/1024/1024/1024 < 200

disk_used_percent > 99 and disk_total/1024/1024/1024 < 200
```

Runbook:

1. Run df -h to find the mount point, then du -x --max-depth=1 \<mount> | sort -h to find the largest directories;
1. On a system disk the usual suspects are /var/log and container image layers (docker system df to inspect, docker system prune to clean);
1. Use lsof +L1 to check for deleted-but-unreleased file handles;
1. Longer term, expand the disk or move large data directories to a dedicated disk.

### Disk monitoring - device errors reported

Warning · 1m · Trigger:

```promql
disk_device_error>0
```

Runbook:

1. Run dmesg -T | grep -iE 'i/o error|ata|scsi' to see the exact kernel error and device name;
1. Run smartctl -a /dev/sdX and focus on Reallocated_Sector_Ct and Current_Pending_Sector;
1. Confirm the data on that disk has a replica or backup — data safety comes before hardware work;
1. Once confirmed a hardware fault, schedule downtime to swap the disk; in a RAID array, check the degraded state first.

### Disk monitoring - disk predicted to be full within 4 hours

Critical · 1m · Trigger:

```promql
predict_linear(disk_free[1h], 4*3600) < 0
```

Runbook:

1. Run df -h to identify the mount point, then drill down with du -x --max-depth=1 \<mount> | sort -h to find the fastest-growing directory;
1. Start with logs (journalctl --vacuum-size=500M, rotate out *.log.N) and temporary files — that is the quickest win;
1. Use lsof +L1 to find deleted files whose handles are still open; the owning process must be restarted to actually free the space;
1. Confirm whether something abnormal is writing (an application looping on logs, backups piling up) — without fixing the root cause, cleanup only buys time.

### OOM occurred on the system

Warning · — · Trigger:

```promql
increase(kernel_vmstat_oom_kill[2m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
1. Use free -h and that process's memory history to tell a leak apart from a limit set too high;
1. Lower oom_score_adj for critical processes and set cgroup memory limits on secondary ones;
1. If it is a leak, capture a heap profile in the application — adding memory alone will just postpone the recurrence.

### NIC monitoring - inbound packet loss

Info · 1m · Trigger:

```promql
increase(net_drop_in[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm RX dropped/errors are growing;
1. Run ethtool -S \<nic> to see the specific drop reason (rx_no_buffer, rx_missed_errors, etc.);
1. If ring buffers are too small, raise them with ethtool -G \<nic> rx \<larger value> and check net.core.netdev_max_backlog;
1. If softirq CPU is also high (%si in top), enable RPS/RSS to spread interrupts across cores.

### NIC monitoring - inbound packet errors

Info · 1m · Trigger:

```promql
increase(net_err_in[1m]) > 0
```

Runbook:

1. Run ethtool -S \<nic> and look at rx_crc_errors, rx_frame_errors and similar counters;
1. Run ethtool \<nic> to confirm the negotiated speed and duplex match the peer (half duplex is the classic source of errors);
1. Check the cable/optical module, swapping the cable or port to cross-check;
1. Ask the network team for the error counters on the corresponding switch port.

### NIC monitoring - outbound packet loss

Info · 1m · Trigger:

```promql
increase(net_drop_out[1m]) > 0
```

Runbook:

1. Run ip -s link show \<nic> to confirm TX dropped/errors are growing;
1. Run ethtool -S \<nic> for the specific counters and tc -s qdisc show dev \<nic> to see whether the queue is overflowing;
1. If the transmit queue is too small, raise txqueuelen and ethtool -G \<nic> tx;
1. Check whether the link is saturated — if so throttle or add bandwidth, otherwise investigate the NIC driver and peer device.

### NIC monitoring - outbound packet errors

Info · 1m · Trigger:

```promql
increase(net_err_out[1m]) > 0
```

Runbook:

1. Run ethtool -S \<nic> and look at tx_errors, tx_carrier_errors and similar counters;
1. Run ethtool \<nic> to confirm speed and duplex match the peer;
1. Check the cable/optical module and cross-check by swapping;
1. Verify the NIC driver and firmware versions and upgrade if needed.

### Network probe failed

Warning · 1m · Trigger:

```promql
net_response_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with telnet \<target> \<port> or nc -vz \<target> \<port>;
1. On the target host, run ss -lntp | grep \<port> to confirm a process is listening;
1. If it is listening, check the firewall, security groups, and whether it is bound only to 127.0.0.1;
1. If nothing is listening, start the service through its own recovery procedure.

### Process monitoring - a process count is 0, the process may be down

Critical · 1m · Trigger:

```promql
procstat_lookup_count == 0
```

Runbook:

1. Run ps -ef | grep \<process keyword> to confirm it is really gone and rule out a wrong match rule on the collector side;
1. Check that process's log and dmesg -T | grep -i 'killed process' to tell a crash, an OOM kill and a manual stop apart;
1. Start it through the service's own procedure and confirm the systemd Restart policy is effective;
1. If it keeps exiting, find the root cause before starting it again to avoid a restart loop.

### Process monitoring - process file handle limit too small

Info · 1m · Trigger:

```promql
procstat_rlimit_num_fds_soft < 2048
```

Runbook:

1. Run cat /proc/\<pid>/limits to see the soft and hard Max open files;
1. For systemd services, add LimitNOFILE=65535 to the unit file, then systemctl daemon-reload and restart;
1. For non-systemd, add ulimit -n 65535 to the startup script or edit /etc/security/limits.conf;
1. Note the process must be restarted for a changed soft limit to take effect.

### Process monitoring - total processes exceed 600

Warning · 1m · Trigger:

```promql
processes_total > 600
```

Runbook:

1. Run ps -eo ppid | sort | uniq -c | sort -rn | head to find the parent forking the most children;
1. Determine whether this is a normal multi-process model (php-fpm, nginx workers) or a runaway fork;
1. For a runaway, stop that parent to stop the bleeding, then fix the fork logic in the code;
1. For genuine growth, tune the worker count and evaluate whether to scale out.

## Telegraf (4)

For hosts collected by Telegraf with Prometheus-style output.

### Machine load - high CPU, please pay attention - telegraf

Info · 1m · Trigger:

```promql
cpu_usage_idle{cpu="cpu-total"} < 25
```

Runbook:

1. Run top -H or pidstat 1 to find the busiest processes and threads;
1. Use perf top or a language profiler (arthas/async-profiler for Java, pprof for Go) to locate the hot functions;
1. Tell natural traffic growth apart from a code problem (infinite loop, regex backtracking, frequent GC);
1. For growth, scale out or rate limit; for a code problem, fix and release.

### Machine load - high memory, please pay attention - telegraf

Warning · 1m · Trigger:

```promql
mem_available_percent < 25
```

Runbook:

1. Run free -h to check available memory and swap usage;
1. Run ps aux --sort=-%mem | head to find the largest consumers and compare against their memory history to judge whether it is a leak;
1. If the kernel is slow to reclaim, sync; echo 1 > /proc/sys/vm/drop_caches frees page cache (use with care in production);
1. Determine whether it is growth or a process leak — a leak must be located with a heap profile, not just a restart.

### Process monitoring - lookup failure - telegraf

Critical · 1m · Trigger:

```promql
procstat_lookup_result_code != 0
```

Runbook:

1. Reproduce the configured match by hand on the collector host with ps/pgrep;
1. If the process is genuinely gone, follow the service's recovery procedure;
1. If the process exists but the probe fails, check the procstat pid_file / exe / pattern settings and whether the collector account can read /proc;
1. In containers, confirm categraf mounts the host's /proc.

### there are processes with 0 count, a certain process may have crashed - telegraf

Critical · 1m · Trigger:

```promql
procstat_lookup_running == 0
```

Runbook:

1. Run ps -ef | grep \<process keyword> to confirm it is really gone and rule out a wrong match rule on the collector side;
1. Check that process's log and dmesg -T | grep -i 'killed process' to tell a crash, an OOM kill and a manual stop apart;
1. Start it through the service's own procedure and confirm the systemd Restart policy is effective;
1. If it keeps exiting, find the root cause before starting it again to avoid a restart loop.

## How to use these rules

- **With Prometheus or vmalert**: download [`linux.yml`](pathname:///alert-rules/linux.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page, or to the rule's own page where it has one.
- **With Nightingale**: the same rules ship in the [Kubernetes](/integrations/kubernetes) and [Linux](/integrations/linux) integration template. Open the integration center, [import the rules into a business group](/docs/data/integrations/import), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license

Many rule expressions are adapted from [awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts) (CC BY 4.0). The runbook steps and the remaining rules come from Nightingale's integration templates ([Kubernetes](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes), [Linux](https://github.com/ccfos/nightingale/tree/main/integrations/Linux), Apache-2.0). Corrections are welcome as pull requests there.

## Related

- [Monitor Kubernetes with Nightingale](/integrations/kubernetes): collector config, dashboards and metric reference
- [Monitor Linux with Nightingale](/integrations/linux): collector config, dashboards and metric reference
- [Write a metric rule in Nightingale](/docs/alerting/metric-rules)
- [All alert rules](/alert-rules)
