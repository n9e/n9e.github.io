# Monitor Kubernetes with Nightingale

Scrapes the native /metrics of the apiserver, kubelet, controller-manager, scheduler, kube-proxy, CoreDNS, kube-state-metrics and node-exporter; templates cover every layer from control plane to Pod.

Last reviewed 2026-10-28

Every Kubernetes component exposes Prometheus-format `/metrics`. The recommended path is to scrape them directly with the Categraf `prometheus` input and deploy kube-state-metrics (workload state) and node-exporter (node resources). The old Categraf kubernetes input is deprecated, but the dashboards and rules in this template keep working.

| Source                  | Typical endpoint                                                         | Templates it feeds                            |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| kube-apiserver          | `https://<api-server>:6443/metrics`                                      | API Server                                    |
| kubelet                 | `https://<node>:10250/metrics`, `/metrics/cadvisor`, `/metrics/resource` | Kubelet, Node, Pod, Container                 |
| kube-controller-manager | `https://<control-plane>:10257/metrics`                                  | Controller Manager                            |
| kube-scheduler          | `https://<control-plane>:10259/metrics`                                  | Scheduler                                     |
| kube-proxy              | `http://<node>:10249/metrics`                                            | Proxy                                         |
| kube-state-metrics      | `http://<service>:8080/metrics`                                          | Deployment, StatefulSet, DaemonSet, Pod state |
| CoreDNS                 | `http://<coredns>:9153/metrics`                                          | CoreDNS                                       |
| node-exporter           | `http://<node>:9100/metrics`                                             | Node resources                                |

This is the largest template in the catalog. Dashboards cover each control-plane component, nodes, Deployments, StatefulSets, DaemonSets, Pods, containers and CoreDNS. Rules cover crash-looping and Pending Pods, missing replicas, NotReady nodes and resource pressure, apiserver latency and error rate, etcd and scheduling failures, and expiring certificates. The metric reference explains the metrics component by component.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **17 dashboards**, 470 panels in total
* **154 alert rules**, each with runbook steps
* **305 metric descriptions**

## How to connect[​](#how-to-connect "Direct link to How to connect")

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](https://n9e.github.io/docs/data/prometheus.md) and the templates work as they are.

Control-plane endpoints need a ServiceAccount token or client certificate; when Categraf runs as a DaemonSet inside the cluster, use `bearer_token_file` to read the mounted token. On distributions such as K3s, the scheduler, controller-manager and kube-proxy may listen on loopback only, so collect them on the control-plane node itself. Do not expose these unauthenticated endpoints to the internet for convenience.

1. Open the integration center in Nightingale, find Kubernetes, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                            | Panels |
| ------------------------------------ | ------ |
| Kubernetes / API Server              | 13     |
| Kubernetes / Controller Manager      | 22     |
| Kubernetes / Deployment / Container  | 44     |
| Kubernetes / Kube State Metrics      | 21     |
| Kubernetes / Kubelet Metrics         | 13     |
| Kubernetes / Pod                     | 48     |
| Kubernetes / Scheduler               | 20     |
| Kubernetes / Statefulset / Container | 44     |
| Kubernetes / CoreDNS                 | 11     |
| Kubernetes / Daemonset               | 10     |
| Kubernetes / Deployment              | 33     |
| Kubernetes / Etcd                    | 20     |
| Kubernetes / Container by categraf   | 5      |
| Kubernetes / Node                    | 93     |
| Kubernetes / Cluster Overview        | 35     |
| Kubernetes / Proxy                   | 11     |
| Kubernetes / StatefulSet             | 27     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

154 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by an exporter (36)[​](#collected-by-an-exporter-36 "Direct link to Collected by an exporter (36)")

#### Host out of memory[​](#host-out-of-memory "Direct link to Host out of memory")

Node out of memory (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10
```

Runbook:

1. On the node run free -h to check available memory and swap;
2. Run ps aux --sort=-%mem | head for the biggest consumers;
3. On Kubernetes nodes, prefer kubectl top pod -A --sort-by=memory to find the Pod;
4. For a leak, fix it in the application; for capacity, move Pods off or add nodes.

#### Host under memory pressure[​](#host-under-memory-pressure "Direct link to Host under memory pressure")

Node under memory pressure (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
rate(node_vmstat_pgmajfault[1m]) > 1000
```

Runbook:

1. Run vmstat 1 and check the si/so columns for swapping;
2. Use sar -B or /proc/vmstat to watch pgmajfault growth;
3. Find the heaviest process or Pod and assess whether it can be moved;
4. Review the swap setting — Kubernetes nodes normally have swap disabled, since enabling it masks memory problems.

#### Host inbound network throughput abnormal[​](#host-inbound-network-throughput-abnormal "Direct link to Host inbound network throughput abnormal")

Host unusual network throughput in (instance {{ $labels.instance }})

S2 Warning · for 5 min · Trigger:

```
sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100
```

Runbook:

1. Use iftop or nethogs to find the processes/connections consuming the most bandwidth;
2. On Kubernetes nodes, check whether a Pod is doing bulk data transfer (backup, data sync, image pull);
3. Confirm whether the NIC is saturated and throttle or reschedule if so;
4. For abnormal traffic, check for a misconfiguration causing a traffic loop.

#### Host outbound network throughput abnormal[​](#host-outbound-network-throughput-abnormal "Direct link to Host outbound network throughput abnormal")

Host unusual network throughput out (instance {{ $labels.instance }})

S2 Warning · for 5 min · Trigger:

```
sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100
```

Runbook:

1. Use iftop or nethogs to find the processes/connections consuming the most bandwidth;
2. On Kubernetes nodes, check whether a Pod is doing bulk data transfer (backup, data sync, image pull);
3. Confirm whether the NIC is saturated and throttle or reschedule if so;
4. For abnormal traffic, check for a misconfiguration causing a traffic loop.

#### Host disk read rate abnormal[​](#host-disk-read-rate-abnormal "Direct link to Host disk read rate abnormal")

Host unusual disk read rate (instance {{ $labels.instance }})

S2 Warning · for 5 min · Trigger:

```
sum by (instance) (rate(node_disk_read_bytes_total[2m])) / 1024 / 1024 > 50
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util;
2. Run iotop -oP to find the process doing the most IO;
3. On Kubernetes nodes it is usually container log writes, image pull/unpack, or one Pod's data writes;
4. Move deferrable work off peak; for sustained load, consider SSDs or spreading the data.

#### Host disk write rate abnormal[​](#host-disk-write-rate-abnormal "Direct link to Host disk write rate abnormal")

Host unusual disk write rate (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
sum by (instance) (rate(node_disk_written_bytes_total[2m])) / 1024 / 1024 > 50
```

Runbook:

1. Run iostat -x 1 to see which disk it is and the actual await and %util;
2. Run iotop -oP to find the process doing the most IO;
3. On Kubernetes nodes it is usually container log writes, image pull/unpack, or one Pod's data writes;
4. Move deferrable work off peak; for sustained load, consider SSDs or spreading the data.

#### Host out of disk space[​](#host-out-of-disk-space "Direct link to Host out of disk space")

Host out of disk space (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

Runbook:

1. Run df -h to find the mount point and du -x --max-depth=1 to drill into the largest directories;
2. For the container runtime directory (/var/lib/containerd or /var/lib/docker) run crictl rmi --prune to clean unused images;
3. Clean container logs (/var/log/pods) and confirm log rotation is working;
4. Use lsof +L1 for deleted files whose handles are still open.

#### Host disk will fill up within 24 hours[​](#host-disk-will-fill-up-within-24-hours "Direct link to Host disk will fill up within 24 hours")

Host disk will fill up within 24 hours (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10 and ON (instance, device, mountpoint) predict_linear(node_filesystem_avail_bytes{fstype!~"tmpfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly == 0
```

Runbook:

1. Run du -x --max-depth=1 to find the fastest-growing directory;
2. Determine whether the growth is normal business or abnormal (an application looping on logs, backups piling up);
3. Prune unused images and container logs;
4. If the growth is genuine, plan disk expansion or data migration — do not wait until it is full.

#### Filesystem inode usage high[​](#filesystem-inode-usage-high "Direct link to Filesystem inode usage high")

Host out of inodes (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

#### Filesystem inodes will fill up within 24 hours[​](#filesystem-inodes-will-fill-up-within-24-hours "Direct link to Filesystem inodes will fill up within 24 hours")

Host inodes will fill up within 24 hours (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
node_filesystem_files_free{mountpoint ="/rootfs"} / node_filesystem_files{mountpoint="/rootfs"} * 100 < 10 and predict_linear(node_filesystem_files_free{mountpoint="/rootfs"}[1h], 24 * 3600) < 0 and ON (instance, device, mountpoint) node_filesystem_readonly{mountpoint="/rootfs"} == 0
```

Runbook:

1. Run df -i to find the mount point;
2. Count files level by level to find the directories with the most small files;
3. On Kubernetes nodes it is usually container layers and log fragments — pruning unused images typically frees a lot of inodes;
4. Longer term, raise inode density or isolate small-file workloads to a dedicated partition.

#### Host disk read latency abnormal[​](#host-disk-read-latency-abnormal "Direct link to Host disk read latency abnormal")

Host unusual disk read latency (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m]) > 0.1 and rate(node_disk_reads_completed_total[1m]) > 0
```

Runbook:

1. Run iostat -x 1 and look at r\_await/w\_await and queue depth;
2. High latency with low IOPS suggests a disk hardware problem — check with smartctl -a;
3. If IOPS is also high, treat it as disk saturation and find the heavy IO process;
4. For cloud disks, check whether the specification's IOPS/throughput ceiling triggered throttling.

#### Host disk write latency abnormal[​](#host-disk-write-latency-abnormal "Direct link to Host disk write latency abnormal")

Host unusual disk write latency (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
rate(node_disk_write_time_seconds_total[1m]) / rate(node_disk_writes_completed_total[1m]) > 0.1 and rate(node_disk_writes_completed_total[1m]) > 0
```

Runbook:

1. Run iostat -x 1 and look at r\_await/w\_await and queue depth;
2. High latency with low IOPS suggests a disk hardware problem — check with smartctl -a;
3. If IOPS is also high, treat it as disk saturation and find the heavy IO process;
4. For cloud disks, check whether the specification's IOPS/throughput ceiling triggered throttling.

#### Node CPU load high[​](#node-cpu-load-high "Direct link to Node CPU load high")

Host high CPU load (instance {{ $labels.instance }})

S2 Warning · Trigger:

```
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
```

Runbook:

1. Run uptime to see the 1/5/15 minute trend and judge spike versus sustained;
2. Check %wa in top — high means the bottleneck is disk rather than CPU;
3. Use the r/b columns in vmstat 1 to separate CPU-bound from IO-blocked;
4. On Kubernetes nodes use kubectl top pod to find the heavy Pods and consider moving them.

#### CPU stolen by other cloud guests[​](#cpu-stolen-by-other-cloud-guests "Direct link to CPU stolen by other cloud guests")

Host CPU steal noisy neighbor (instance {{ $labels.instance }})

S2 Warning · Trigger:

```
avg by(instance) (rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100 > 10
```

Runbook:

1. Use top or vmstat to confirm the sustained level of the st column;
2. This is contention at the hypervisor level and cannot be fixed from inside the VM;
3. In the cloud, contact the provider or move to a dedicated instance type (no steal);
4. On self-hosted virtualization, check the host's overcommit ratio and migrate VMs.

#### Host context switching abnormal[​](#host-context-switching-abnormal "Direct link to Host context switching abnormal")

Host context switching (instance {{ $labels.instance }})

S2 Warning · Trigger:

```
(rate(node_context_switches_total[5m])) / (count without(cpu, mode) (node_cpu_seconds_total{mode="idle"})) > 1000
```

Runbook:

1. Run vmstat 1 and check the cs column;
2. Run pidstat -w 1 to find the processes switching most;
3. Common root causes are too many threads, heavy lock contention, or many short-lived processes;
4. Reducing thread pool sizes and lock granularity in the application is the real fix.

#### Host swap almost full[​](#host-swap-almost-full "Direct link to Host swap almost full")

Host swap is full (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80
```

Runbook:

1. Run free -h and swapon -s to check swap usage;
2. Use smem or VmSwap in /proc/\<pid>/status to find the processes swapped out most;
3. Kubernetes nodes should generally have swap disabled — leaving it on masks real memory pressure and breaks QoS;
4. The root cause is insufficient memory, so follow the memory alert path.

#### Host system service crashed[​](#host-system-service-crashed "Direct link to Host system service crashed")

Host systemd service crashed (instance {{ $labels.instance }})

S2 Warning · Trigger:

```
node_systemd_unit_state{state="failed"} == 1
```

Runbook:

1. Run systemctl --failed to list the failed units;
2. Use journalctl -u \<unit> -n 100 --no-pager to find the cause;
3. On Kubernetes nodes pay special attention to kubelet, containerd and kube-proxy;
4. After fixing, run systemctl reset-failed and confirm recovery.

#### Host kernel version deviation[​](#host-kernel-version-deviation "Direct link to Host kernel version deviation")

Host kernel version deviation (instance {{ $labels.instance }})

S2 Warning · for 360 min · Trigger:

```
count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1
```

Runbook:

1. Run kubectl get node -o wide to compare kernel versions;
2. Determine whether the difference is temporary (mid-upgrade) or long standing;
3. Bring the lagging nodes' kernels in line step by step;
4. Before upgrading, confirm the container runtime and CNI plugin support the target kernel.

#### HostOomKill detected[​](#hostoomkill-detected "Direct link to HostOomKill detected")

Host OOM kill detected (instance {{ $labels.instance }})

S2 Warning · Trigger:

```
increase(node_vmstat_oom_kill[1m]) > 0
```

Runbook:

1. Run dmesg -T | grep -i 'killed process' to see which process was killed and how much memory it held;
2. Match it against kubectl get pod -A to find the Pod and whether its limit is set too low;
3. If the node is tight overall, move Pods off or add capacity;
4. Repeated kills require finding the application memory leak — raising the limit alone will just recur.

#### Host network receive errors[​](#host-network-receive-errors "Direct link to Host network receive errors")

Host network receive errors (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
rate(node_network_receive_errs_total[2m]) / rate(node_network_receive_packets_total[2m]) > 0.01
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> for the error counters and types;
2. Confirm the negotiated speed and duplex match the peer;
3. Check the cable/optical module, or open a cloud provider ticket;
4. If redundancy exists, move traffic away first.

#### Host network transmit errors[​](#host-network-transmit-errors "Direct link to Host network transmit errors")

Host network transmit errors (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
rate(node_network_transmit_errs_total[2m]) / rate(node_network_transmit_packets_total[2m]) > 0.01
```

Runbook:

1. Run ip -s link show \<nic> and ethtool -S \<nic> for the error counters and types;
2. Confirm the negotiated speed and duplex match the peer;
3. Check the cable/optical module, or open a cloud provider ticket;
4. If redundancy exists, move traffic away first.

#### Host network interface saturated[​](#host-network-interface-saturated "Direct link to Host network interface saturated")

Host network interface saturated (instance {{ $labels.instance }})

S2 Warning · for 1 min · Trigger:

```
(rate(node_network_receive_bytes_total{device!~"^tap.*"}[1m]) + rate(node_network_transmit_bytes_total{device!~"^tap.*"}[1m])) / node_network_speed_bytes{device!~"^tap.*"} > 0.8 < 10000
```

Runbook:

1. Use iftop/nethogs to find the connections consuming the most bandwidth;
2. On Kubernetes nodes, check for high-traffic Pods or large image pulls;
3. Move deferrable jobs off peak;
4. If more bandwidth is genuinely needed, upgrade the NIC or move some workloads.

#### Conntrack entries approaching the limit[​](#conntrack-entries-approaching-the-limit "Direct link to Conntrack entries approaching the limit")

Host conntrack limit (instance {{ $labels.instance }})

S2 Warning · for 5 min · Trigger:

```
node_nf_conntrack_entries / node_nf_conntrack_entries_limit > 0.8
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to check the level;
2. On Kubernetes nodes, kube-proxy in iptables mode creates many conntrack entries, especially at high Pod density;
3. Raise nf\_conntrack\_max and the bucket count together;
4. Longer term, consider switching to IPVS mode to reduce conntrack pressure.

#### Host clock skew[​](#host-clock-skew "Direct link to Host clock skew")

Host clock skew (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
(node_timex_offset_seconds > 0.05 and deriv(node_timex_offset_seconds[5m]) >= 0) or (node_timex_offset_seconds < -0.05 and deriv(node_timex_offset_seconds[5m]) <= 0)
```

Runbook:

1. Run chronyc tracking to check the offset and upstream source state;
2. Confirm chronyd/ntpd is running and enabled at boot;
3. Check that 123/UDP to the NTP server is allowed;
4. For a large offset use chronyc makestep, then confirm all nodes agree on the time.

#### Host clock not synchronising[​](#host-clock-not-synchronising "Direct link to Host clock not synchronising")

Host clock not synchronising (instance {{ $labels.instance }})

S2 Warning · for 2 min · Trigger:

```
min_over_time(node_timex_sync_status[1m]) == 0 and node_timex_maxerror_seconds >= 16
```

Runbook:

1. Run chronyc tracking to check the offset and upstream source state;
2. Confirm chronyd/ntpd is running and enabled at boot;
3. Check that 123/UDP to the NTP server is allowed;
4. For a large offset use chronyc makestep, then confirm all nodes agree on the time.

#### Node filesystem filling up - S2[​](#node-filesystem-filling-up---s2 "Direct link to Node filesystem filling up - S2")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up.

S2 Warning · for 60 min · Trigger:

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

#### Node filesystem filling up - S1[​](#node-filesystem-filling-up---s1 "Direct link to Node filesystem filling up - S1")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up fast.

S1 Critical · for 60 min · Trigger:

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

#### Node disk almost full - S2 - space - 5[​](#node-disk-almost-full---s2---space---5 "Direct link to Node disk almost full - S2 - space - 5")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

S2 Warning · for 60 min · Trigger:

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

#### Node disk almost full - S1 - space - 3[​](#node-disk-almost-full---s1---space---3 "Direct link to Node disk almost full - S1 - space - 3")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.

S1 Critical · for 60 min · Trigger:

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

#### Node disk almost full - S2 - inodes - 40[​](#node-disk-almost-full---s2---inodes---40 "Direct link to Node disk almost full - S2 - inodes - 40")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up.

S2 Warning · for 60 min · Trigger:

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

#### Node disk almost full - S1 - inodes - 20[​](#node-disk-almost-full---s1---inodes---20 "Direct link to Node disk almost full - S1 - inodes - 20")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up fast.

S1 Critical · for 60 min · Trigger:

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

#### Node disk almost full - S2 - inodes - 5[​](#node-disk-almost-full---s2---inodes---5 "Direct link to Node disk almost full - S2 - inodes - 5")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

S2 Warning · for 60 min · Trigger:

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

#### Node disk almost full - S1 - inodes - 3[​](#node-disk-almost-full---s1---inodes---3 "Direct link to Node disk almost full - S1 - inodes - 3")

Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.

S1 Critical · for 60 min · Trigger:

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

#### Node conntrack entries usage high[​](#node-conntrack-entries-usage-high "Direct link to Node conntrack entries usage high")

{{ $value | humanizePercentage }} of conntrack entries are used.

S2 Warning · Trigger:

```
(node_nf_conntrack_entries / node_nf_conntrack_entries_limit) > 0.75
```

Runbook:

1. Run sysctl net.netfilter.nf\_conntrack\_count and nf\_conntrack\_max to check the level;
2. On Kubernetes nodes, kube-proxy in iptables mode creates many conntrack entries, especially at high Pod density;
3. Raise nf\_conntrack\_max and the bucket count together;
4. Longer term, consider switching to IPVS mode to reduce conntrack pressure.

#### Node textfile collector scrape errors[​](#node-textfile-collector-scrape-errors "Direct link to Node textfile collector scrape errors")

Node Exporter text file collector failed to scrape.

S2 Warning · Trigger:

```
node_textfile_scrape_error{job="node-exporter"} == 1
```

Runbook:

1. Check the permissions and format of the .prom files in the textfile directory;
2. The writer is usually a cron script — confirm it succeeds and writes atomically (write .tmp then mv);
3. Validate format errors with promtool check metrics;
4. Clean up leftover temporary files, which break parsing.

#### Node network interface flapping[​](#node-network-interface-flapping "Direct link to Node network interface flapping")

Network interface "{{ $labels.device }}" changing it's up status often on node-exporter {{ $labels.namespace }}/{{ $labels.pod }}"

S2 Warning · for 2 min · Trigger:

```
changes(node_network_up{job="node-exporter",device!~"veth.+"}[2m]) > 2
```

Runbook:

1. Run dmesg -T | grep -i 'link is' for the flap timeline;
2. Check the cable and optical module — flapping usually means a bad physical connection;
3. Confirm the negotiated speed and duplex match the peer;
4. Ask the network team about the switch port state, or open a ticket in the cloud.

### General rules (118)[​](#general-rules-118 "Direct link to General rules (118)")

#### Deployment Pod availability below 70% (replicas above 9 pods)[​](#deployment-pod-availability-below-70-replicas-above-9-pods "Direct link to Deployment Pod availability below 70% (replicas above 9 pods)")

S1 Critical · for 1 min · Trigger:

```
kube_deployment_status_replicas_unavailable and kube_deployment_status_replicas_available{} / kube_deployment_status_replicas{} * 100 < 70 and kube_deployment_status_replicas{} > 9
```

Runbook:

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
2. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
3. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
4. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

#### Job failed[​](#job-failed "Direct link to Job failed")

S3 Info · for 1 min · Trigger:

```
kube_job_status_failed{} > 0
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
2. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
3. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
4. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

#### Pod startup timeout[​](#pod-startup-timeout "Direct link to Pod startup timeout")

S2 Warning · for 1 min · Trigger:

```
kube_pod_container_status_waiting_reason{} == 1
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
2. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
3. For slow mounts, check the PV/CSI driver state;
4. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

#### Pod state abnormal[​](#pod-state-abnormal "Direct link to Pod state abnormal")

S1 Critical · for 1 min · Trigger:

```
kube_pod_status_phase{phase=~"Pending|Unknown|Failed"} > 0
```

Runbook:

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
2. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
3. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
4. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

#### Pod restarting frequently[​](#pod-restarting-frequently "Direct link to Pod restarting frequently")

S2 Warning · for 1 min · Trigger:

```
increase(kube_pod_container_status_restarts_total{}[5m]) > 3
```

Runbook:

1. Run kubectl logs \<pod> -n \<ns> --previous to see the log before the last exit — this is the key step;
2. Run kubectl describe pod for the exit code and Events: 137 usually means OOM or killed, 1/2 usually means the application failed to start;
3. For config or dependency problems (unreachable database, missing ConfigMap/Secret), fix the dependency first;
4. For OOM, compare resources.limits.memory against actual usage, or fix the application's memory leak.

#### Container CPU usage exceeds 80%[​](#container-cpu-usage-exceeds-80 "Direct link to Container CPU usage exceeds 80%")

S3 Info · for 1 min · Trigger:

```
100 * (sum(rate(container_cpu_usage_seconds_total{id!="/"}[2m])) by (pod_name,namespace,container) / sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.*)")) by (pod_name,namespace,container)) > 80 and sum(label_replace(kube_pod_container_resource_limits_cpu_cores{},"pod_name","$1","pod","(.)")) by (pod_name,namespace,container) != 0
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers to compare actual usage against the limit;
2. Check the CPUThrottlingHigh metric to confirm whether it is already being throttled;
3. For genuine growth, raise resources.limits.cpu or scale out with an HPA;
4. For abnormal usage, capture a CPU profile in the application rather than papering over it with more quota.

#### Container memory usage exceeds 80%[​](#container-memory-usage-exceeds-80 "Direct link to Container memory usage exceeds 80%")

S3 Info · for 1 min · Trigger:

```
(sum(container_memory_working_set_bytes{id!="/"}) BY (instance,name,container,pod_name,namespace) / sum(container_spec_memory_limit_bytes{id!="/"} > 0) BY (instance,name,container,pod_name,namespace) * 100) > 80
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers to compare usage against the limit;
2. Check the history curve to tell a steady climb (likely a leak) from a normal traffic peak;
3. For normal peaks, raise resources.limits.memory with headroom;
4. For a steady climb, capture a heap profile in the application — raising the quota only postpones it.

#### Node CPU usage exceeds 90%[​](#node-cpu-usage-exceeds-90 "Direct link to Node CPU usage exceeds 90%")

S3 Info · for 1 min · Trigger:

```
100-cpu_usage_idle{cpu="cpu-total"} > 90
```

Runbook:

1. Run kubectl top node for the overall picture and kubectl top pod -A --sort-by=cpu for the biggest consumers;
2. Check whether too many high-load Pods landed on this node and drain some if needed;
3. Check whether Pod requests are set too low, causing overcommit;
4. If the cluster is running hot overall, add nodes.

#### Node memory usage exceeds 90%[​](#node-memory-usage-exceeds-90 "Direct link to Node memory usage exceeds 90%")

S2 Warning · for 1 min · Trigger:

```
mem_used_percent > 90
```

Runbook:

1. Run kubectl top node and kubectl top pod -A --sort-by=memory to find the biggest consumers;
2. Check for Pods without a memory limit growing without bound;
3. Use kubectl drain to move some Pods off, confirming the target nodes have headroom;
4. Review the kubelet eviction thresholds, and add nodes if the cluster is tight overall.

#### Node not ready[​](#node-not-ready "Direct link to Node not ready")

S1 Critical · for 1 min · Trigger:

```
kube_node_status_condition{condition="Ready",status="true"} == 0
```

Runbook:

1. Run kubectl describe node \<node> for Conditions and Events to tell MemoryPressure, DiskPressure and a lost kubelet apart;
2. Log in to the node and check kubelet and the container runtime (systemctl status kubelet containerd);
3. Use journalctl -u kubelet -n 200 to locate the problem;
4. If the node cannot recover soon, run kubectl drain so the Pods move promptly instead of waiting for the eviction timeout.

#### Node disk usage exceeds 90%[​](#node-disk-usage-exceeds-90 "Direct link to Node disk usage exceeds 90%")

S3 Info · for 1 min · Trigger:

```
disk_used_percent > 90
```

Runbook:

1. On the node run df -h to find the mount point, usually /var/lib/docker or /var/lib/containerd;
2. Run crictl rmi --prune or docker system prune to clean unused image layers — the fastest win;
3. Check whether a Pod is writing large amounts of data to an emptyDir or hostPath;
4. After cleaning, confirm the kubelet DiskPressure taint was removed automatically.

#### KubeClientCertificateExpiration-S2[​](#kubeclientcertificateexpiration-s2 "Direct link to KubeClientCertificateExpiration-S2")

A client certificate used to authenticate to the apiserver is expiring in less than 7.0 days.

S2 Warning · Trigger:

```
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### KubeClientCertificateExpiration-S1[​](#kubeclientcertificateexpiration-s1 "Direct link to KubeClientCertificateExpiration-S1")

A client certificate used to authenticate to the apiserver is expiring in less than 24.0 hours.

S1 Critical · Trigger:

```
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 86400
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### AggregatedAPIErrors[​](#aggregatedapierrors "Direct link to AggregatedAPIErrors")

An aggregated API {{ $labels.name }}/{{ $labels.namespace }} has reported errors. The number of errors have increased for it in the past five minutes. High values indicate that the availability of the service changes too often.

S2 Warning · Trigger:

```
sum by(name, namespace)(increase(aggregator_unavailable_apiservice_count[5m])) > 2
```

Runbook:

1. Run kubectl get apiservice to see which APIService is False;
2. Run kubectl describe apiservice \<name> for the specific error;
3. If the backing service is down, check its Deployment/Service health (commonly metrics-server);
4. For certificate problems, verify the CA bundle configuration.

#### AggregatedAPIDown[​](#aggregatedapidown "Direct link to AggregatedAPIDown")

An aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.

S2 Warning · for 5 min · Trigger:

```
(1 - max by(name, namespace)(avg_over_time(aggregator_unavailable_apiservice[10m]))) * 100 < 85
```

Runbook:

1. Run kubectl get apiservice to identify the APIService;
2. Run kubectl -n \<ns> get pod to check its backing Pods;
3. Read that Pod's logs for startup or runtime errors;
4. After recovery, verify with something like kubectl top node that the functionality is back.

#### KubeAPIDown[​](#kubeapidown "Direct link to KubeAPIDown")

KubeAPI has disappeared from Prometheus target discovery.

S1 Critical · for 15 min · Trigger:

```
absent(up{job="apiserver"} == 1)
```

Runbook:

1. On the control plane node, check the kube-apiserver process/static Pod state and logs;
2. For multi-replica deployments, confirm whether only some instances are down and whether the load balancer removed the faulty ones;
3. Common root causes are unavailable etcd, expired certificates and resource exhaustion;
4. Restore etcd and certificates first — apiserver usually recovers on its own.

#### KubeAPIErrorBudgetBurn-S1-120s[​](#kubeapierrorbudgetburn-s1-120s "Direct link to KubeAPIErrorBudgetBurn-S1-120s")

The API server is burning too much error budget.

S1 Critical · for 2 min · Trigger:

```
sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)

and

sum(apiserver_request:burnrate5m) > (14.40 * 0.01000)
```

Runbook:

1. Look at the apiserver error code and latency distribution to tell read from write degradation;
2. For write degradation, check etcd disk latency first — that is the most common root cause;
3. For read degradation, look for clients doing wide LIST calls (full enumeration without a resourceVersion);
4. Rate limit the offending client and consider enabling APF (API Priority and Fairness).

#### KubeAPIErrorBudgetBurn-S1-900s[​](#kubeapierrorbudgetburn-s1-900s "Direct link to KubeAPIErrorBudgetBurn-S1-900s")

The API server is burning too much error budget.

S1 Critical · for 15 min · Trigger:

```
sum(apiserver_request:burnrate6h) > (6.00 * 0.01000)

and

sum(apiserver_request:burnrate30m) > (6.00 * 0.01000)
```

Runbook:

1. Look at the apiserver error code and latency distribution to tell read from write degradation;
2. For write degradation, check etcd disk latency first — that is the most common root cause;
3. For read degradation, look for clients doing wide LIST calls (full enumeration without a resourceVersion);
4. Rate limit the offending client and consider enabling APF (API Priority and Fairness).

#### KubeAPIErrorBudgetBurn-S2-3600s[​](#kubeapierrorbudgetburn-s2-3600s "Direct link to KubeAPIErrorBudgetBurn-S2-3600s")

The API server is burning too much error budget.

S2 Warning · for 60 min · Trigger:

```
sum(apiserver_request:burnrate1d) > (3.00 * 0.01000)

and

sum(apiserver_request:burnrate2h) > (3.00 * 0.01000)
```

Runbook:

1. Look at the apiserver error code and latency distribution to tell read from write degradation;
2. For write degradation, check etcd disk latency first — that is the most common root cause;
3. For read degradation, look for clients doing wide LIST calls (full enumeration without a resourceVersion);
4. Rate limit the offending client and consider enabling APF (API Priority and Fairness).

#### KubeAPIErrorBudgetBurn-S2-10800s[​](#kubeapierrorbudgetburn-s2-10800s "Direct link to KubeAPIErrorBudgetBurn-S2-10800s")

The API server is burning too much error budget.

S2 Warning · for 180 min · Trigger:

```
sum(apiserver_request:burnrate3d) > (1.00 * 0.01000)

and

sum(apiserver_request:burnrate6h) > (1.00 * 0.01000)
```

Runbook:

1. Look at the apiserver error code and latency distribution to tell read from write degradation;
2. For write degradation, check etcd disk latency first — that is the most common root cause;
3. For read degradation, look for clients doing wide LIST calls (full enumeration without a resourceVersion);
4. Rate limit the offending client and consider enabling APF (API Priority and Fairness).

#### Deployment replicas mismatch[​](#deployment-replicas-mismatch "Direct link to Deployment replicas mismatch")

Deployment {{ $labels.deployment }} in namespace {{ $labels.namespace }} has mismatched replicas.

S2 Warning · for 10 min · Trigger:

```
kube_deployment_spec_replicas{job="kube-state-metrics"} != kube_deployment_status_replicas_available{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
2. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
3. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
4. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

#### StatefulSet replicas mismatch[​](#statefulset-replicas-mismatch "Direct link to StatefulSet replicas mismatch")

StatefulSet {{ $labels.statefulset }} in namespace {{ $labels.namespace }} has mismatched replicas.

S2 Warning · for 10 min · Trigger:

```
kube_statefulset_status_replicas_ready{job="kube-state-metrics"} != kube_statefulset_spec_replicas{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl get pod -n \<ns> -l \<selector> and check by ordinal which replica is stuck;
2. Run kubectl describe pod to check whether its PVC bound successfully — this is the most common sticking point for stateful services;
3. For storage problems, check the PV/StorageClass and the CSI driver;
4. For application problems check kubectl logs; once fixed, the StatefulSet continues automatically.

#### DaemonSet has unready Pods[​](#daemonset-has-unready-pods "Direct link to DaemonSet has unready Pods")

DaemonSet {{ $labels.daemonset }} in namespace {{ $labels.namespace }} has unready pods.

S2 Warning · for 10 min · Trigger:

```
kube_daemonset_status_number_ready{job="kube-state-metrics"} < kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe ds \<name> -n \<ns> for Events and desired/current counts;
2. Compare node taints against the DaemonSet's tolerations — a taint mismatch is the most common cause;
3. Check whether nodeSelector/affinity excludes those nodes;
4. For resource shortage, lower the DaemonSet's requests or free node resources.

#### HPA scaling failed[​](#hpa-scaling-failed "Direct link to HPA scaling failed")

HPA {{ $labels.hpa }} in namespace {{ $labels.namespace }} has scale up failures.

S2 Warning · for 5 min · Trigger:

```
kube_hpa_status_failed_scale_up_total{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe hpa \<name> -n \<ns> and read the reason in Conditions;
2. ScalingLimited means it hit the min/max boundary; FailedGetScale means the target workload has a problem;
3. For metric failures, check whether metrics-server or the custom metrics adapter is healthy;
4. If new replicas stay Pending for lack of resources, add nodes.

#### Pod in Failed state[​](#pod-in-failed-state "Direct link to Pod in Failed state")

Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has failed.

S2 Warning · for 5 min · Trigger:

```
kube_pod_status_phase{job="kube-state-metrics",phase="Failed"} == 1
```

Runbook:

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
2. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
3. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
4. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

#### Job failed[​](#job-failed-1 "Direct link to Job failed")

Job {{ $labels.job\_name }} in namespace {{ $labels.namespace }} has failed.

S2 Warning · for 5 min · Trigger:

```
kube_job_status_failed{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
2. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
3. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
4. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

#### CPUThrottlingHigh[​](#cputhrottlinghigh "Direct link to CPUThrottlingHigh")

{{ $value | humanizePercentage }} throttling of CPU in namespace {{ $labels.namespace }} for container {{ $labels.container }} in pod {{ $labels.pod }}.

S3 Info · for 15 min · Trigger:

```
sum(increase(container_cpu_cfs_throttled_periods_total{container!="", }[5m])) by (container, pod, namespace)

  /

sum(increase(container_cpu_cfs_periods_total{}[5m])) by (container, pod, namespace)

  > ( 25 / 100 )
```

Runbook:

1. Run kubectl top pod \<pod> -n \<ns> --containers and compare against resources.limits.cpu;
2. Note that runtimes like Java that do not detect the cgroup limit may spawn too many threads and worsen throttling — check the JVM version and flags;
3. Raise limits.cpu, or scale out horizontally with an HPA;
4. A limit far above the request is easily squeezed by overcommit — consider bringing them closer together.

#### KubeAggregatedAPIDown[​](#kubeaggregatedapidown "Direct link to KubeAggregatedAPIDown")

Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.

S2 Warning · for 5 min · Trigger:

```
(1 - max by(name, namespace, cluster)(avg_over_time(aggregator_unavailable_apiservice{job="apiserver"}[10m]))) * 100 < 85
```

Runbook:

1. Run kubectl get apiservice to identify the APIService;
2. Run kubectl -n \<ns> get pod to check its backing Pods;
3. Read that Pod's logs for startup or runtime errors;
4. After recovery, verify with something like kubectl top node that the functionality is back.

#### KubeAggregatedAPIErrors[​](#kubeaggregatedapierrors "Direct link to KubeAggregatedAPIErrors")

Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has reported errors. It has appeared unavailable {{ $value | humanize }} times averaged over the past 10m.

S2 Warning · Trigger:

```
sum by(name, namespace, cluster)(increase(aggregator_unavailable_apiservice_total{job="apiserver"}[10m])) > 4
```

Runbook:

1. Run kubectl get apiservice to see which one is False;
2. Run kubectl describe apiservice \<name> for the specific error;
3. If the backing service is down, check its Deployment/Service;
4. For certificate problems, verify the CA bundle configuration.

#### KubeAPIDown[​](#kubeapidown-1 "Direct link to KubeAPIDown")

KubeAPI has disappeared from Prometheus target discovery.

S1 Critical · for 15 min · Trigger:

```
absent(up{job="apiserver"} == 1)
```

Runbook:

1. On the control plane node, check the kube-apiserver process/static Pod state and logs;
2. For multi-replica deployments, confirm whether only some instances are down and whether the load balancer removed the faulty ones;
3. Common root causes are unavailable etcd, expired certificates and resource exhaustion;
4. Restore etcd and certificates first — apiserver usually recovers on its own.

#### KubeAPIErrorBudgetBurn[​](#kubeapierrorbudgetburn "Direct link to KubeAPIErrorBudgetBurn")

The API server is burning too much error budget.

S1 Critical · for 2 min · Trigger:

```
sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)

and

sum(apiserver_request:burnrate5m) > (14.40 * 0.01000)
```

Runbook:

1. Look at the apiserver error code and latency distribution to tell read from write degradation;
2. For write degradation, check etcd disk latency first — that is the most common root cause;
3. For read degradation, look for clients doing wide LIST calls (full enumeration without a resourceVersion);
4. Rate limit the offending client and consider enabling APF (API Priority and Fairness).

#### KubeAPITerminatedRequests[​](#kubeapiterminatedrequests "Direct link to KubeAPITerminatedRequests")

The kubernetes apiserver has terminated {{ $value | humanizePercentage }} of its incoming requests.

S2 Warning · for 5 min · Trigger:

```
sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m]))  / (  sum(rate(apiserver_request_total{job="apiserver"}[10m])) + sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m])) ) > 0.20
```

Runbook:

1. Check the apiserver\_flowcontrol metrics to see which flow schema is being throttled;
2. Identify the client making the flood of requests (usually an Operator or script doing full LIST calls);
3. Rate limit that client or fix its request pattern;
4. If more capacity is genuinely needed, tune the FlowSchema and PriorityLevelConfiguration.

#### KubeClientCertificateExpiration[​](#kubeclientcertificateexpiration "Direct link to KubeClientCertificateExpiration")

A client certificate used to authenticate to kubernetes apiserver is expiring in less than 7.0 days.

S2 Warning · for 5 min · Trigger:

```
apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### KubeClientErrors[​](#kubeclienterrors "Direct link to KubeClientErrors")

Kubernetes API server client '{{ $labels.job }}/{{ $labels.instance }}' is experiencing {{ $value | humanizePercentage }} errors.'

S2 Warning · for 15 min · Trigger:

```
(sum(rate(rest_client_requests_total{job="apiserver",code=~"5.."}[5m])) by (cluster, instance, job, namespace)

  /

sum(rate(rest_client_requests_total{job="apiserver"}[5m])) by (cluster, instance, job, namespace))

> 0.01
```

Runbook:

1. Use the alert labels to identify the component/instance that is erroring;
2. Read the specific error code in that component's log: 401/403 is an RBAC problem, 429 is throttling, 5xx is an apiserver-side problem;
3. For permissions, verify the ServiceAccount's Role/ClusterRoleBinding;
4. For throttling, check whether the component is doing high-frequency LIST calls and switch to Watch or add a resourceVersion.

#### KubeContainerWaiting[​](#kubecontainerwaiting "Direct link to KubeContainerWaiting")

pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour.

S2 Warning · for 60 min · Trigger:

```
sum by (namespace, pod, container, cluster) (kube_pod_container_status_waiting_reason{job="kube-state-metrics"}) > 0
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and read the Waiting Reason;
2. For ImagePullBackOff, check the image name, tag and pull credentials (imagePullSecrets);
3. For CreateContainerConfigError, check the referenced ConfigMap/Secret exists;
4. For CrashLoopBackOff, follow the crash loop path and read the --previous logs.

#### KubeControllerManagerDown[​](#kubecontrollermanagerdown "Direct link to KubeControllerManagerDown")

KubeControllerManager has disappeared from Prometheus target discovery.

S1 Critical · for 15 min · Trigger:

```
absent(up{job="kube-controller-manager"} == 1)
```

Runbook:

1. On the control plane node, check the kube-controller-manager static Pod or process state and logs;
2. For multi-replica deployments, confirm leader election is failing over correctly;
3. Common root causes are an unavailable apiserver or expired certificates;
4. After recovery, confirm workloads with wrong replica counts start self-healing.

#### KubeCPUOvercommit[​](#kubecpuovercommit "Direct link to KubeCPUOvercommit")

Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure.

S2 Warning · for 10 min · Trigger:

```
sum(namespace_cpu:kube_pod_container_resource_requests:sum{job="kube-state-metrics",}) by (cluster) - (sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0

and

(sum(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster) - max(kube_node_status_allocatable{job="kube-state-metrics",resource="cpu"}) by (cluster)) > 0
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
2. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
3. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
4. If headroom is genuinely insufficient, add nodes.

#### KubeCPUQuotaOvercommit[​](#kubecpuquotaovercommit "Direct link to KubeCPUQuotaOvercommit")

Cluster {{ $labels.cluster }} has overcommitted CPU resource requests for Namespaces.

S2 Warning · for 5 min · Trigger:

```
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(cpu|requests.cpu)"})) by (cluster)

  /

sum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"}) by (cluster)

  > 1.5
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
2. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
3. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
4. If headroom is genuinely insufficient, add nodes.

#### KubeDaemonSetMisScheduled[​](#kubedaemonsetmisscheduled "Direct link to KubeDaemonSetMisScheduled")

{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run.

S2 Warning · for 15 min · Trigger:

```
kube_daemonset_status_number_misscheduled{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl get pod -n \<ns> -l \<selector> -o wide to see which nodes they landed on;
2. Check whether the DaemonSet's nodeSelector/affinity matches the node labels;
3. This usually follows a node label change or a DaemonSet update — after correcting it the extra Pods are cleaned up automatically;
4. Delete any leftovers manually.

#### KubeDaemonSetNotScheduled[​](#kubedaemonsetnotscheduled "Direct link to KubeDaemonSetNotScheduled")

{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are not scheduled.

S2 Warning · for 10 min · Trigger:

```
kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  -

kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe ds \<name> -n \<ns> for Events and desired/current counts;
2. Compare node taints against the DaemonSet's tolerations — a taint mismatch is the most common cause;
3. Check whether nodeSelector/affinity excludes those nodes;
4. For resource shortage, lower the DaemonSet's requests or free node resources.

#### KubeDaemonSetRolloutStuck[​](#kubedaemonsetrolloutstuck "Direct link to KubeDaemonSetRolloutStuck")

DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} has not finished or progressed for at least 15 minutes.

S2 Warning · for 15 min · Trigger:

```
(

  (

    kube_daemonset_status_current_number_scheduled{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  ) or (

    kube_daemonset_status_number_misscheduled{job="kube-state-metrics"}

      !=

    0

  ) or (

    kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  ) or (

    kube_daemonset_status_number_available{job="kube-state-metrics"}

      !=

    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics"}

  )

) and (

  changes(kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics"}[5m])

    ==

  0

)
```

Runbook:

1. Run kubectl rollout status ds/\<name> -n \<ns> to see which nodes are stuck;
2. Run kubectl describe pod to see why the new Pod is not ready;
3. If it cannot be fixed quickly, kubectl rollout undo ds/\<name>;
4. Check whether the updateStrategy maxUnavailable is too conservative.

#### KubeDeploymentGenerationMismatch[​](#kubedeploymentgenerationmismatch "Direct link to KubeDeploymentGenerationMismatch")

Deployment generation for {{ $labels.namespace }}/{{ $labels.deployment }} does not match, this indicates that the Deployment has failed but has not been rolled back.

S2 Warning · for 15 min · Trigger:

```
kube_deployment_status_observed_generation{job="kube-state-metrics"}

  !=

kube_deployment_metadata_generation{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe \<kind> \<name> -n \<ns> and compare generation with observedGeneration;
2. Check whether kube-controller-manager is healthy — a stalled controller is the most common cause;
3. Look for errors about this object in the controller-manager log;
4. Confirm apiserver and etcd are healthy; once the controller recovers, generation catches up automatically.

#### KubeDeploymentReplicasMismatch[​](#kubedeploymentreplicasmismatch "Direct link to KubeDeploymentReplicasMismatch")

Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
(

  kube_deployment_spec_replicas{job="kube-state-metrics"}

    >

  kube_deployment_status_replicas_available{job="kube-state-metrics"}

) and (

  changes(kube_deployment_status_replicas_updated{job="kube-state-metrics"}[10m])

    ==

  0

)
```

Runbook:

1. Run kubectl describe deploy \<name> -n \<ns> for Conditions and Events;
2. Run kubectl get pod -n \<ns> -l \<selector> to see the state and reason of the unready Pods;
3. Common causes are insufficient resources for scheduling, image pull failures, and failing readiness probes;
4. Follow the Pod's specific state; for resource shortage, add nodes or lower requests.

#### KubeDeploymentRolloutStuck[​](#kubedeploymentrolloutstuck "Direct link to KubeDeploymentRolloutStuck")

Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
kube_deployment_status_condition{condition="Progressing", status="false",job="kube-state-metrics"}

!= 0
```

Runbook:

1. Run kubectl rollout status deploy/\<name> -n \<ns> to see which replica it is stuck on;
2. Run kubectl describe pod to see why the new Pod is not ready (image, probe, resources);
3. If it cannot be fixed quickly, kubectl rollout undo deploy/\<name> to roll back;
4. After fixing, redeploy and review whether maxSurge/maxUnavailable are sensible.

#### KubeHpaMaxedOut[​](#kubehpamaxedout "Direct link to KubeHpaMaxedOut")

HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }} has been running at max replicas for longer than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  ==

kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe hpa \<name> -n \<ns> to see the gap between the current and target metric;
2. Confirm the cluster still has resources for more replicas (node headroom);
3. With headroom, raise maxReplicas; without it, add nodes first;
4. Also assess whether per-replica capacity is too low — optimising the application beats scaling replicas indefinitely.

#### KubeHpaReplicasMismatch[​](#kubehpareplicasmismatch "Direct link to KubeHpaReplicasMismatch")

HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }} has not matched the desired number of replicas for longer than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
(kube_horizontalpodautoscaler_status_desired_replicas{job="kube-state-metrics"}

  !=

kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"})

  and

(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  >

kube_horizontalpodautoscaler_spec_min_replicas{job="kube-state-metrics"})

  and

(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}

  <

kube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics"})

  and

changes(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics"}[15m]) == 0
```

Runbook:

1. Run kubectl describe hpa \<name> -n \<ns> and read the reason in Conditions;
2. ScalingLimited means it hit the min/max boundary; FailedGetScale means the target workload has a problem;
3. For metric failures, check whether metrics-server or the custom metrics adapter is healthy;
4. If new replicas stay Pending for lack of resources, add nodes.

#### KubeJobFailed[​](#kubejobfailed "Direct link to KubeJobFailed")

Job {{ $labels.namespace }}/{{ $labels.job\_name }} failed to complete. Removing failed job after investigation should clear this alert.

S2 Warning · for 15 min · Trigger:

```
kube_job_failed{job="kube-state-metrics"}  > 0
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for the failure count, then kubectl logs job/\<job> for the reason;
2. Run kubectl describe job for Events and whether it gave up after exhausting backoffLimit;
3. After fixing the root cause, kubectl delete job and resubmit, or let the CronJob run again on schedule;
4. Confirm whether the failure has downstream impact (missing output, skipped cleanup) and redo it manually if needed.

#### KubeJobNotCompleted[​](#kubejobnotcompleted "Direct link to KubeJobNotCompleted")

Job {{ $labels.namespace }}/{{ $labels.job\_name }} is taking more than {{ "43200" | humanizeDuration }} to complete.

S2 Warning · Trigger:

```
time() - max by(namespace, job_name, cluster) (kube_job_status_start_time{job="kube-state-metrics"}

  and

kube_job_status_active{job="kube-state-metrics"} > 0) > 43200
```

Runbook:

1. Run kubectl get job \<job> -n \<ns> for elapsed time and completions;
2. Run kubectl logs job/\<job> to see where it is stuck;
3. Determine whether the task is genuinely long-running or hung — for a hang, kubectl delete job, fix it and rerun;
4. Set a sensible activeDeadlineSeconds so Jobs cannot hang indefinitely.

#### KubeletClientCertificateExpiration[​](#kubeletclientcertificateexpiration "Direct link to KubeletClientCertificateExpiration")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 Warning · Trigger:

```
kubelet_certificate_manager_client_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### KubeletClientCertificateRenewalErrors[​](#kubeletclientcertificaterenewalerrors "Direct link to KubeletClientCertificateRenewalErrors")

Kubelet on node {{ $labels.node }} has failed to renew its client certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 Warning · for 15 min · Trigger:

```
increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
2. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
3. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
4. After fixing, confirm new CSRs are auto-approved and signed.

#### KubeletDown[​](#kubeletdown "Direct link to KubeletDown")

Kubelet has disappeared from Prometheus target discovery.

S1 Critical · for 15 min · Trigger:

```
absent(up{job="kubelet", metrics_path="/metrics"} == 1)
```

Runbook:

1. On the node run systemctl status kubelet to check the process;
2. Use journalctl -u kubelet -n 200 --no-pager to find the exit or error reason;
3. Common causes are expired certificates, config errors and an unavailable container runtime;
4. After recovery, confirm the node is Ready again and check whether Pods were wrongly evicted meanwhile.

#### KubeletPlegDurationHigh[​](#kubeletplegdurationhigh "Direct link to KubeletPlegDurationHigh")

The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of {{ $value }} seconds on node {{ $labels.node }}.

S2 Warning · for 5 min · Trigger:

```
node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10
```

Runbook:

1. On the node run crictl ps and crictl info to gauge container runtime responsiveness;
2. Check whether the node has too many containers and whether disk IO is saturated — these are the main causes of slow PLEG;
3. For a stalled runtime, consider restarting containerd (briefly affects that node);
4. If it persists, reduce the Pod density on that node.

#### KubeletPodStartUpLatencyHigh[​](#kubeletpodstartuplatencyhigh "Direct link to KubeletPodStartUpLatencyHigh")

Kubelet Pod startup 99th percentile latency is {{ $value }} seconds on node {{ $labels.node }}.

S2 Warning · for 15 min · Trigger:

```
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le)) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
2. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
3. For slow mounts, check the PV/CSI driver state;
4. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

#### KubeletServerCertificateExpiration[​](#kubeletservercertificateexpiration "Direct link to KubeletServerCertificateExpiration")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 Warning · Trigger:

```
kubelet_certificate_manager_server_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### KubeletServerCertificateRenewalErrors[​](#kubeletservercertificaterenewalerrors "Direct link to KubeletServerCertificateRenewalErrors")

Kubelet on node {{ $labels.node }} has failed to renew its server certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 Warning · for 15 min · Trigger:

```
increase(kubelet_server_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
2. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
3. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
4. After fixing, confirm new CSRs are auto-approved and signed.

#### KubeletTooManyPods[​](#kubelettoomanypods "Direct link to KubeletTooManyPods")

Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.

S3 Info · for 15 min · Trigger:

```
count by(cluster, node) (

  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})

)

/

max by(cluster, node) (

  kube_node_status_capacity{job="kube-state-metrics",resource="pods"} != 1

) > 0.95
```

Runbook:

1. Run kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l for the actual count;
2. Compare against the kubelet maxPods setting (110 by default);
3. Use kubectl drain or scheduling policy to move some Pods to other nodes;
4. If you genuinely need higher density, raise maxPods but reassess node CPU/memory/PLEG pressure at the same time.

#### KubeMemoryOvercommit[​](#kubememoryovercommit "Direct link to KubeMemoryOvercommit")

Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure.

S2 Warning · for 10 min · Trigger:

```
sum(namespace_memory:kube_pod_container_resource_requests:sum{}) by (cluster) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0

and

(sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)) > 0
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
2. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
3. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
4. If headroom is genuinely insufficient, add nodes.

#### KubeMemoryQuotaOvercommit[​](#kubememoryquotaovercommit "Direct link to KubeMemoryQuotaOvercommit")

Cluster {{ $labels.cluster }} has overcommitted memory resource requests for Namespaces.

S2 Warning · for 5 min · Trigger:

```
sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(memory|requests.memory)"})) by (cluster)

  /

sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) by (cluster)

  > 1.5
```

Runbook:

1. Run kubectl describe node | grep -A5 'Allocated resources' to sum up allocation per node;
2. This is a capacity planning signal rather than an immediate outage — assess whether there is still headroom to absorb a node failure;
3. Check for Pods with requests set far above actual usage; lowering them frees a lot of schedulable capacity;
4. If headroom is genuinely insufficient, add nodes.

#### KubeNodeNotReady[​](#kubenodenotready "Direct link to KubeNodeNotReady")

{{ $labels.node }} has been unready for more than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0
```

Runbook:

1. Run kubectl describe node \<node> for Conditions and Events to tell MemoryPressure, DiskPressure and a lost kubelet apart;
2. Log in to the node and check kubelet and the container runtime (systemctl status kubelet containerd);
3. Use journalctl -u kubelet -n 200 to locate the problem;
4. If the node cannot recover soon, run kubectl drain so the Pods move promptly instead of waiting for the eviction timeout.

#### KubeNodeReadinessFlapping[​](#kubenodereadinessflapping "Direct link to KubeNodeReadinessFlapping")

The readiness status of node {{ $labels.node }} has changed {{ $value }} times in the last 15 minutes.

S2 Warning · for 15 min · Trigger:

```
sum(changes(kube_node_status_condition{job="kube-state-metrics",status="true",condition="Ready"}[15m])) by (cluster, node) > 2
```

Runbook:

1. Run kubectl describe node \<node> and read the timeline of Condition changes;
2. On the node, check the kubelet log — common root causes are resource pressure, a stalled container runtime, or an unstable network to apiserver;
3. While it flaps, kubectl cordon the node so no new Pods land on it;
4. Uncordon only after the root cause is fixed — do not repeatedly restart kubelet during the flapping.

#### KubeNodeUnreachable[​](#kubenodeunreachable "Direct link to KubeNodeUnreachable")

{{ $labels.node }} is unreachable and some workloads may be rescheduled.

S2 Warning · for 15 min · Trigger:

```
(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1
```

Runbook:

1. First confirm the machine is alive with ping/ssh — if it is down, handle it as a host outage;
2. If it is alive, investigate the node's network and certificates to apiserver (the kubelet log states the error clearly);
3. Check whether any single-replica critical service runs on that node and start it elsewhere first;
4. After recovery, confirm the node is Ready again and Pod states are normal.

#### KubePersistentVolumeErrors[​](#kubepersistentvolumeerrors "Direct link to KubePersistentVolumeErrors")

The persistent volume {{ $labels.persistentvolume }} has status {{ $labels.phase }}.

S1 Critical · for 5 min · Trigger:

```
kube_persistentvolume_status_phase{phase=~"Failed|Pending",job="kube-state-metrics"} > 0
```

Runbook:

1. Run kubectl describe pv \<pv> and kubectl describe pvc \<pvc> -n \<ns> and read the errors in Events;
2. Common causes are an unavailable storage backend, insufficient capacity, or wrong StorageClass parameters;
3. Check whether the CSI driver Pods are healthy (usually in kube-system);
4. For a storage backend failure, follow that system's own procedure — Pods stay Pending meanwhile.

#### KubePersistentVolumeFillingUp[​](#kubepersistentvolumefillingup "Direct link to KubePersistentVolumeFillingUp")

The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free.

S1 Critical · for 1 min · Trigger:

```
(

  kubelet_volume_stats_available_bytes{job="kubelet", metrics_path="/metrics"}

    /

  kubelet_volume_stats_capacity_bytes{job="kubelet", metrics_path="/metrics"}

) < 0.03

and

kubelet_volume_stats_used_bytes{job="kubelet", metrics_path="/metrics"} > 0

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

Runbook:

1. Run kubectl get pvc -n \<ns> to find the PVC and PV;
2. kubectl exec into a Pod using the volume and use du to find the largest directories;
3. Clean up logs and temporary data;
4. If the StorageClass supports online expansion, kubectl edit pvc and raise spec.resources.requests.storage; otherwise migrate the data.

#### KubePersistentVolumeInodesFillingUp[​](#kubepersistentvolumeinodesfillingup "Direct link to KubePersistentVolumeInodesFillingUp")

The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} only has {{ $value | humanizePercentage }} free inodes.

S1 Critical · for 1 min · Trigger:

```
(

  kubelet_volume_stats_inodes_free{job="kubelet", metrics_path="/metrics"}

    /

  kubelet_volume_stats_inodes{job="kubelet", metrics_path="/metrics"}

) < 0.03

and

kubelet_volume_stats_inodes_used{job="kubelet", metrics_path="/metrics"} > 0

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1

unless on(namespace, persistentvolumeclaim)

kube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1
```

Runbook:

1. kubectl exec into a Pod using the volume and run df -i;
2. Count files level by level to find the directories with the most small files;
3. Clean up useless small files (cache fragments, temporary files);
4. If it cannot be reduced, expand the volume or change storage type.

#### KubePodCrashLooping[​](#kubepodcrashlooping "Direct link to KubePodCrashLooping")

Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: "CrashLoopBackOff").

S2 Warning · for 15 min · Trigger:

```
max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics"}[5m]) >= 1
```

Runbook:

1. Run kubectl logs \<pod> -n \<ns> --previous to see the log before the last exit — this is the key step;
2. Run kubectl describe pod for the exit code and Events: 137 usually means OOM or killed, 1/2 usually means the application failed to start;
3. For config or dependency problems (unreachable database, missing ConfigMap/Secret), fix the dependency first;
4. For OOM, compare resources.limits.memory against actual usage, or fix the application's memory leak.

#### KubePodNotReady[​](#kubepodnotready "Direct link to KubePodNotReady")

Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
sum by (namespace, pod, cluster) (

  max by(namespace, pod, cluster) (

    kube_pod_status_phase{job="kube-state-metrics", phase=~"Pending|Unknown|Failed"}

  ) * on(namespace, pod, cluster) group_left(owner_kind) topk by(namespace, pod, cluster) (

    1, max by(namespace, pod, owner_kind, cluster) (kube_pod_owner{owner_kind!="Job"})

  )

) > 0
```

Runbook:

1. Run kubectl get pod \<pod> -n \<ns> -o wide for STATUS and READY, then kubectl describe pod for Events;
2. Pending usually means insufficient resources or scheduling constraints (affinity, taints, unbound PVC); for ImagePullBackOff check the image address and pull credentials;
3. Running but not Ready — check the readiness probe and kubectl logs \<pod> for startup errors;
4. Confirm whether the replica count is now too low to carry traffic, and scale healthy replicas first if so.

#### KubeQuotaAlmostFull[​](#kubequotaalmostfull "Direct link to KubeQuotaAlmostFull")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

S3 Info · for 15 min · Trigger:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  > 0.9 < 1
```

Runbook:

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
2. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
3. Check for stopped-but-uncleaned resources still holding quota;
4. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

#### KubeQuotaExceeded[​](#kubequotaexceeded "Direct link to KubeQuotaExceeded")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

S2 Warning · for 15 min · Trigger:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  > 1
```

Runbook:

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
2. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
3. Check for stopped-but-uncleaned resources still holding quota;
4. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

#### KubeQuotaFullyUsed[​](#kubequotafullyused "Direct link to KubeQuotaFullyUsed")

Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.

S3 Info · for 15 min · Trigger:

```
kube_resourcequota{job="kube-state-metrics", type="used"}

  / ignoring(instance, job, type)

(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)

  == 1
```

Runbook:

1. Run kubectl describe quota -n \<ns> to see which item (cpu/memory/pods/storage) topped out;
2. Use kubectl get pod -n \<ns> -o custom-columns to sum requests per workload and find the biggest consumers;
3. Check for stopped-but-uncleaned resources still holding quota;
4. If more quota is genuinely needed, ask the cluster admin to adjust the ResourceQuota.

#### KubeSchedulerDown[​](#kubeschedulerdown "Direct link to KubeSchedulerDown")

KubeScheduler has disappeared from Prometheus target discovery.

S1 Critical · for 15 min · Trigger:

```
absent(up{job="kube-scheduler"} == 1)
```

Runbook:

1. On the control plane node, check the kube-scheduler static Pod or process state and logs;
2. For multi-replica deployments, confirm whether it merely lost leadership and another replica can take over;
3. Common root causes are an unavailable apiserver or certificate problems;
4. After recovery, confirm Pending Pods start being scheduled.

#### KubeStatefulSetGenerationMismatch[​](#kubestatefulsetgenerationmismatch "Direct link to KubeStatefulSetGenerationMismatch")

StatefulSet generation for {{ $labels.namespace }}/{{ $labels.statefulset }} does not match, this indicates that the StatefulSet has failed but has not been rolled back.

S2 Warning · for 15 min · Trigger:

```
kube_statefulset_status_observed_generation{job="kube-state-metrics"}

  !=

kube_statefulset_metadata_generation{job="kube-state-metrics"}
```

Runbook:

1. Run kubectl describe \<kind> \<name> -n \<ns> and compare generation with observedGeneration;
2. Check whether kube-controller-manager is healthy — a stalled controller is the most common cause;
3. Look for errors about this object in the controller-manager log;
4. Confirm apiserver and etcd are healthy; once the controller recovers, generation catches up automatically.

#### KubeStatefulSetReplicasMismatch[​](#kubestatefulsetreplicasmismatch "Direct link to KubeStatefulSetReplicasMismatch")

StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
(

  kube_statefulset_status_replicas_ready{job="kube-state-metrics"}

    !=

  kube_statefulset_status_replicas{job="kube-state-metrics"}

) and (

  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[10m])

    ==

  0

)
```

Runbook:

1. Run kubectl get pod -n \<ns> -l \<selector> and check by ordinal which replica is stuck;
2. Run kubectl describe pod to check whether its PVC bound successfully — this is the most common sticking point for stateful services;
3. For storage problems, check the PV/StorageClass and the CSI driver;
4. For application problems check kubectl logs; once fixed, the StatefulSet continues automatically.

#### KubeStatefulSetUpdateNotRolledOut[​](#kubestatefulsetupdatenotrolledout "Direct link to KubeStatefulSetUpdateNotRolledOut")

StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} update has not been rolled out.

S2 Warning · for 15 min · Trigger:

```
(

  max without (revision) (

    kube_statefulset_status_current_revision{job="kube-state-metrics"}

      unless

    kube_statefulset_status_update_revision{job="kube-state-metrics"}

  )

    *

  (

    kube_statefulset_replicas{job="kube-state-metrics"}

      !=

    kube_statefulset_status_replicas_updated{job="kube-state-metrics"}

  )

)  and (

  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics"}[5m])

    ==

  0

)
```

Runbook:

1. Run kubectl rollout status sts/\<name> -n \<ns> to see which replica it is stuck on;
2. StatefulSets update in order, so one stuck replica blocks all the rest — focus on the one currently updating;
3. Run kubectl describe pod to find why it is not ready (PVC, probe, image);
4. If it cannot be fixed quickly, kubectl rollout undo.

#### KubeVersionMismatch[​](#kubeversionmismatch "Direct link to KubeVersionMismatch")

There are {{ $value }} different semantic versions of Kubernetes components running.

S2 Warning · for 15 min · Trigger:

```
count by (cluster) (count by (git_version, cluster) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"},"git_version","$1","git_version","(v[0-9]*.[0-9]*).*"))) > 1
```

Runbook:

1. Run kubectl get node -o wide for kubelet versions and kubectl version for the control plane;
2. Confirm the skew is within the officially supported window (kubelet must not exceed apiserver and must not lag by more than two minor versions);
3. This usually means an unfinished upgrade — bring the lagging nodes up to date;
4. Before upgrading, confirm workload compatibility with the new API versions.

#### Node not ready[​](#node-not-ready-1 "Direct link to Node not ready")

{{ $labels.node }} has been unready for more than 15 minutes.

S2 Warning · for 15 min · Trigger:

```
kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0
```

Runbook:

1. Run kubectl describe node \<node> for Conditions and Events to tell MemoryPressure, DiskPressure and a lost kubelet apart;
2. Log in to the node and check kubelet and the container runtime (systemctl status kubelet containerd);
3. Use journalctl -u kubelet -n 200 to locate the problem;
4. If the node cannot recover soon, run kubectl drain so the Pods move promptly instead of waiting for the eviction timeout.

#### Node unreachable[​](#node-unreachable "Direct link to Node unreachable")

{{ $labels.node }} is unreachable and some workloads may be rescheduled.

S2 Warning · for 15 min · Trigger:

```
(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1
```

Runbook:

1. First confirm the machine is alive with ping/ssh — if it is down, handle it as a host outage;
2. If it is alive, investigate the node's network and certificates to apiserver (the kubelet log states the error clearly);
3. Check whether any single-replica critical service runs on that node and start it elsewhere first;
4. After recovery, confirm the node is Ready again and Pod states are normal.

#### Node running too many Pods[​](#node-running-too-many-pods "Direct link to Node running too many Pods")

Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.

S2 Warning · for 15 min · Trigger:

```
count by(node) (

  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})

)

/

max by(node) (

  kube_node_status_capacity_pods{job="kube-state-metrics"} != 1

) > 0.95
```

Runbook:

1. Run kubectl get pod -A -o wide --field-selector spec.nodeName=\<node> | wc -l for the actual count;
2. Compare against the kubelet maxPods setting (110 by default);
3. Use kubectl drain or scheduling policy to move some Pods to other nodes;
4. If you genuinely need higher density, raise maxPods but reassess node CPU/memory/PLEG pressure at the same time.

#### Node readiness flapping[​](#node-readiness-flapping "Direct link to Node readiness flapping")

The readiness status of node {{ $labels.node }} has changed {{ $value }} times in the last 15 minutes.

S2 Warning · for 15 min · Trigger:

```
sum(changes(kube_node_status_condition{status="true",condition="Ready"}[15m])) by (node) > 2
```

Runbook:

1. Run kubectl describe node \<node> and read the timeline of Condition changes;
2. On the node, check the kubelet log — common root causes are resource pressure, a stalled container runtime, or an unstable network to apiserver;
3. While it flaps, kubectl cordon the node so no new Pods land on it;
4. Uncordon only after the root cause is fixed — do not repeatedly restart kubelet during the flapping.

#### PLEG relisting duration high[​](#pleg-relisting-duration-high "Direct link to PLEG relisting duration high")

The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of {{ $value }} seconds on node {{ $labels.node }}.

S2 Warning · for 5 min · Trigger:

```
node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10
```

Runbook:

1. On the node run crictl ps and crictl info to gauge container runtime responsiveness;
2. Check whether the node has too many containers and whether disk IO is saturated — these are the main causes of slow PLEG;
3. For a stalled runtime, consider restarting containerd (briefly affects that node);
4. If it persists, reduce the Pod density on that node.

#### Pod startup duration high[​](#pod-startup-duration-high "Direct link to Pod startup duration high")

Kubelet Pod startup 99th percentile latency is {{ $value }} seconds on node {{ $labels.node }}.

S2 Warning · for 15 min · Trigger:

```
histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (instance, le)) * on(instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60
```

Runbook:

1. Run kubectl describe pod \<pod> -n \<ns> and use the Event timestamps to see whether it is stuck pulling the image, mounting a volume, or in an init container;
2. For slow pulls, check image size and registry bandwidth, and consider pre-warming images or a local registry;
3. For slow mounts, check the PV/CSI driver state;
4. If the application itself starts slowly, optimise startup and set a sensible readiness probe initialDelaySeconds.

#### Client certificate expiring - S2[​](#client-certificate-expiring---s2 "Direct link to Client certificate expiring - S2")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 Warning · Trigger:

```
kubelet_certificate_manager_client_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### Client certificate expiring - S1[​](#client-certificate-expiring---s1 "Direct link to Client certificate expiring - S1")

Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S1 Critical · Trigger:

```
kubelet_certificate_manager_client_ttl_seconds < 86400
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### Server certificate expiring - S2[​](#server-certificate-expiring---s2 "Direct link to Server certificate expiring - S2")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S2 Warning · Trigger:

```
kubelet_certificate_manager_server_ttl_seconds < 604800
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### Server certificate expiring - S1[​](#server-certificate-expiring---s1 "Direct link to Server certificate expiring - S1")

Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.

S1 Critical · Trigger:

```
kubelet_certificate_manager_server_ttl_seconds < 86400
```

Runbook:

1. Run kubeadm certs check-expiration (kubeadm clusters) or openssl x509 -noout -dates to confirm the expiry;
2. On kubeadm clusters run kubeadm certs renew all and restart the control plane components;
3. kubelet client certificates usually rotate automatically — if not, check the rotateCertificates setting and CSR approval;
4. After renewal, verify the components loaded the new certificate (restart them) and re-check every node.

#### Client certificate renewal errors[​](#client-certificate-renewal-errors "Direct link to Client certificate renewal errors")

Kubelet on node {{ $labels.node }} has failed to renew its client certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 Warning · for 15 min · Trigger:

```
increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
2. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
3. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
4. After fixing, confirm new CSRs are auto-approved and signed.

#### Server certificate renewal errors[​](#server-certificate-renewal-errors "Direct link to Server certificate renewal errors")

Kubelet on node {{ $labels.node }} has failed to renew its server certificate ({{ $value | humanize }} errors in the last 5 minutes).

S2 Warning · for 15 min · Trigger:

```
increase(kubelet_server_expiration_renew_errors[5m]) > 0
```

Runbook:

1. Check the kubelet log for certificate rotation errors;
2. Check whether CSRs are stuck Pending: kubectl get csr, and approve manually with kubectl certificate approve if needed;
3. Confirm the cluster has a CSR auto-approval controller (kube-controller-manager's --cluster-signing-cert-file setting);
4. After fixing, confirm new CSRs are auto-approved and signed.

#### Kubelet down[​](#kubelet-down "Direct link to Kubelet down")

Kubelet has disappeared from Prometheus target discovery.

S1 Critical · for 15 min · Trigger:

```
absent(up{job="kubelet"} == 1)
```

Runbook:

1. On the node run systemctl status kubelet to check the process;
2. Use journalctl -u kubelet -n 200 --no-pager to find the exit or error reason;
3. Common causes are expired certificates, config errors and an unavailable container runtime;
4. After recovery, confirm the node is Ready again and check whether Pods were wrongly evicted meanwhile.

#### ConfigReloaderSidecarErrors[​](#configreloadersidecarerrors "Direct link to ConfigReloaderSidecarErrors")

Errors encountered while the {{$labels.pod}} config-reloader sidecar attempts to sync config in {{$labels.namespace}} namespace. As a result, configuration for service running in {{$labels.pod}} may be stale and cannot be updated anymore.

S2 Warning · for 10 min · Trigger:

```
max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0
```

Runbook:

1. Run kubectl logs \<pod> -c config-reloader -n \<ns> for the specific error;
2. It is usually a config syntax error causing the reload to be rejected;
3. Validate with promtool check config / amtool check-config;
4. After fixing, confirm the reload succeeded and verify the new config on Prometheus's /config page.

#### PrometheusOperatorListErrors[​](#prometheusoperatorlisterrors "Direct link to PrometheusOperatorListErrors")

Errors while performing List operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

S2 Warning · for 15 min · Trigger:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[10m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_list_operations_total{job="prometheus-operator",namespace="monitoring"}[10m]))) > 0.4
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

#### PrometheusOperatorNodeLookupErrors[​](#prometheusoperatornodelookuperrors "Direct link to PrometheusOperatorNodeLookupErrors")

Errors while reconciling Prometheus in {{ $labels.namespace }} Namespace.

S2 Warning · for 10 min · Trigger:

```
rate(prometheus_operator_node_address_lookup_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]) > 0.1
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

#### PrometheusOperatorNotReady[​](#prometheusoperatornotready "Direct link to PrometheusOperatorNotReady")

Prometheus operator in {{ $labels.namespace }} namespace isn't ready to reconcile {{ $labels.controller }} resources.

S2 Warning · for 5 min · Trigger:

```
min by (cluster,controller,namespace) (max_over_time(prometheus_operator_ready{job="prometheus-operator",namespace="monitoring"}[5m]) == 0)
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

#### PrometheusOperatorReconcileErrors[​](#prometheusoperatorreconcileerrors "Direct link to PrometheusOperatorReconcileErrors")

{{ $value | humanizePercentage }} of reconciling operations failed for {{ $labels.controller }} controller in {{ $labels.namespace }} namespace.

S2 Warning · for 10 min · Trigger:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_errors_total{job="prometheus-operator",namespace="monitoring"}[5m]))) / (sum by (cluster,controller,namespace) (rate(prometheus_operator_reconcile_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.1
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

#### PrometheusOperatorRejectedResources[​](#prometheusoperatorrejectedresources "Direct link to PrometheusOperatorRejectedResources")

Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf "%0.0f" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources.

S2 Warning · for 5 min · Trigger:

```
min_over_time(prometheus_operator_managed_resources{state="rejected",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

#### PrometheusOperatorSyncFailed[​](#prometheusoperatorsyncfailed "Direct link to PrometheusOperatorSyncFailed")

Controller {{ $labels.controller }} in {{ $labels.namespace }} namespace fails to reconcile {{ $value }} objects.

S2 Warning · for 10 min · Trigger:

```
min_over_time(prometheus_operator_syncs{status="failed",job="prometheus-operator",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

#### PrometheusOperatorWatchErrors[​](#prometheusoperatorwatcherrors "Direct link to PrometheusOperatorWatchErrors")

Errors while performing watch operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.

S2 Warning · for 15 min · Trigger:

```
(sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_failed_total{job="prometheus-operator",namespace="monitoring"}[5m])) / sum by (cluster,controller,namespace) (rate(prometheus_operator_watch_operations_total{job="prometheus-operator",namespace="monitoring"}[5m]))) > 0.4
```

Runbook:

1. Run kubectl logs -n \<ns> deploy/prometheus-operator for the specific error;
2. For permission errors, verify the Operator's ClusterRole covers the required resources;
3. For Reconcile/Sync failures, check the corresponding CRD objects (kubectl describe servicemonitor/prometheusrule);
4. For rejected resources, kubectl describe shows the rejection reason, usually failed field validation.

#### ConfigReloaderSidecarErrors[​](#configreloadersidecarerrors-1 "Direct link to ConfigReloaderSidecarErrors")

Errors encountered while the {{$labels.pod}} config-reloader sidecar attempts to sync config in {{$labels.namespace}} namespace. As a result, configuration for service running in {{$labels.pod}} may be stale and cannot be updated anymore.

S2 Warning · for 10 min · Trigger:

```
max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0
```

Runbook:

1. Run kubectl logs \<pod> -c config-reloader -n \<ns> for the specific error;
2. It is usually a config syntax error causing the reload to be rejected;
3. Validate with promtool check config / amtool check-config;
4. After fixing, confirm the reload succeeded and verify the new config on Prometheus's /config page.

#### PrometheusBadConfig[​](#prometheusbadconfig "Direct link to PrometheusBadConfig")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration.

S1 Critical · for 10 min · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

max_over_time(prometheus_config_last_reload_successful{job="prometheus-k8s",namespace="monitoring"}[5m]) == 0
```

Runbook:

1. Find the config parse error line in kubectl logs or the instance log;
2. Validate locally with promtool check config prometheus.yml;
3. On Kubernetes the config is usually generated by the Operator — check ServiceMonitor/PrometheusRule for invalid fields;
4. After fixing, confirm /-/reload succeeded and the /config page shows the new configuration.

#### PrometheusDuplicateTimestamps[​](#prometheusduplicatetimestamps "Direct link to PrometheusDuplicateTimestamps")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with different values but duplicated timestamp.

S2 Warning · for 10 min · Trigger:

```
rate(prometheus_target_scrapes_sample_duplicate_timestamp_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the duplicated targets on the /targets page (the same instance appearing under several jobs);
2. Check whether ServiceMonitor/PodMonitor selectors are too broad and overlapping;
3. Tighten the selectors so each target is scraped by exactly one job;
4. After fixing, confirm the discard counter stops growing.

#### PrometheusErrorSendingAlertsToAnyAlertmanager[​](#prometheuserrorsendingalertstoanyalertmanager "Direct link to PrometheusErrorSendingAlertsToAnyAlertmanager")

{{ printf "%.1f" $value }}% minimum errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to any Alertmanager.

S1 Critical · for 15 min · Trigger:

```
min without (alertmanager) (

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring",alertmanager!~``}[5m])

)

* 100

> 3
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

#### PrometheusErrorSendingAlertsToSomeAlertmanagers[​](#prometheuserrorsendingalertstosomealertmanagers "Direct link to PrometheusErrorSendingAlertsToSomeAlertmanagers")

{{ printf "%.1f" $value }}% errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to Alertmanager {{$labels.alertmanager}}.

S2 Warning · for 15 min · Trigger:

```
(

  rate(prometheus_notifications_errors_total{job="prometheus-k8s",namespace="monitoring"}[5m])

/

  rate(prometheus_notifications_sent_total{job="prometheus-k8s",namespace="monitoring"}[5m])

)

* 100

> 1
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

#### PrometheusHighQueryLoad[​](#prometheushighqueryload "Direct link to PrometheusHighQueryLoad")

Prometheus {{$labels.namespace}}/{{$labels.pod}} query API has less than 20% available capacity in its query engine for the last 15 minutes.

S2 Warning · for 15 min · Trigger:

```
avg_over_time(prometheus_engine_queries{job="prometheus-k8s",namespace="monitoring"}[5m]) / max_over_time(prometheus_engine_queries_concurrent_max{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0.8
```

Runbook:

1. Check the query engine concurrency and queue metrics on the /status page;
2. Use topk-style queries or the query log to find the heaviest queries;
3. The usual root causes are high-cardinality labels and over-wide time ranges — narrow the range and reduce group by dimensions;
4. If it stays high after tuning, scale Prometheus or use federation/sharding.

#### PrometheusLabelLimitHit[​](#prometheuslabellimithit "Direct link to PrometheusLabelLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because some samples exceeded the configured label\_limit, label\_name\_length\_limit or label\_value\_length\_limit.

S2 Warning · for 15 min · Trigger:

```
increase(prometheus_target_scrape_pool_exceeded_label_limits_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the rejected targets and the specific reason on the /targets page;
2. On the target side, work out why the label count is so high — usually high-cardinality data (user ID, request ID) was made into labels;
3. Fix the metric design at the source, or drop the excess labels with metric\_relabel\_configs;
4. If more labels are genuinely needed, raise label\_limit after assessing the cardinality impact.

#### PrometheusMissingRuleEvaluations[​](#prometheusmissingruleevaluations "Direct link to PrometheusMissingRuleEvaluations")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has missed {{ printf "%.0f" $value }} rule group evaluations in the last 5m.

S2 Warning · for 15 min · Trigger:

```
increase(prometheus_rule_group_iterations_missed_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Check the log for rule evaluation timeout errors;
2. Find the rule group with the longest evaluation time, usually recording rules with heavy queries;
3. Split the rule group, lengthen evaluation\_interval, or optimise the queries in the rules;
4. If resources are short, scale Prometheus.

#### PrometheusNotConnectedToAlertmanagers[​](#prometheusnotconnectedtoalertmanagers "Direct link to PrometheusNotConnectedToAlertmanagers")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers.

S2 Warning · for 10 min · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

max_over_time(prometheus_notifications_alertmanagers_discovered{job="prometheus-k8s",namespace="monitoring"}[5m]) < 1
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

#### PrometheusNotificationQueueRunningFull[​](#prometheusnotificationqueuerunningfull "Direct link to PrometheusNotificationQueueRunningFull")

Alert notification queue of Prometheus {{$labels.namespace}}/{{$labels.pod}} is running full.

S2 Warning · for 15 min · Trigger:

```
# Without min_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  predict_linear(prometheus_notifications_queue_length{job="prometheus-k8s",namespace="monitoring"}[5m], 60 * 30)

>

  min_over_time(prometheus_notifications_queue_capacity{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

Runbook:

1. Check whether the Alertmanager instances are healthy and reachable;
2. Confirm Alertmanager discovery on the Prometheus /status page;
3. If the queue is full, check whether Alertmanager processing is stuck or the alert volume spiked abnormally;
4. After recovery, confirm Alertmanager actually received the alerts so nothing fails silently.

#### PrometheusNotIngestingSamples[​](#prometheusnotingestingsamples "Direct link to PrometheusNotIngestingSamples")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is not ingesting samples.

S2 Warning · for 10 min · Trigger:

```
(

  rate(prometheus_tsdb_head_samples_appended_total{job="prometheus-k8s",namespace="monitoring"}[5m]) <= 0

and

  (

    sum without(scrape_job) (prometheus_target_metadata_cache_entries{job="prometheus-k8s",namespace="monitoring"}) > 0

  or

    sum without(rule_group) (prometheus_rule_group_rules{job="prometheus-k8s",namespace="monitoring"}) > 0

  )

)
```

Runbook:

1. Check on the /targets page whether every target is down;
2. Check that service discovery is working (the /service-discovery page);
3. If a config error left the target list empty, treat it as a configuration problem;
4. This is total monitoring blindness and should be the highest priority.

#### PrometheusOutOfOrderTimestamps[​](#prometheusoutofordertimestamps "Direct link to PrometheusOutOfOrderTimestamps")

Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value }} samples/s with timestamps arriving out of order.

S2 Warning · for 10 min · Trigger:

```
rate(prometheus_target_scrapes_sample_out_of_order_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Identify which target is reporting out-of-order data;
2. The usual root causes are an unsynchronised clock on the target, or metrics aggregated from multiple sources with mixed timestamps;
3. Correct the target machine's clock first (chronyc);
4. For Pushgateway-style setups, review how the pusher handles timestamps.

#### PrometheusRemoteStorageFailures[​](#prometheusremotestoragefailures "Direct link to PrometheusRemoteStorageFailures")

Prometheus {{$labels.namespace}}/{{$labels.pod}} failed to send {{ printf "%.1f" $value }}% of the samples to {{ $labels.remote\_name}}:{{ $labels.url }}

S1 Critical · for 15 min · Trigger:

```
(

  (rate(prometheus_remote_storage_failed_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

/

  (

    (rate(prometheus_remote_storage_failed_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

  +

    (rate(prometheus_remote_storage_succeeded_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]) or rate(prometheus_remote_storage_samples_total{job="prometheus-k8s",namespace="monitoring"}[5m]))

  )

)

* 100

> 1
```

Runbook:

1. Check the Prometheus log for remote\_write or tsdb errors;
2. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
3. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
4. Confirm the queue backlog is draining; if not, raise queue\_config or reduce the write volume.

#### PrometheusRemoteWriteBehind[​](#prometheusremotewritebehind "Direct link to PrometheusRemoteWriteBehind")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf "%.1f" $value }}s behind for {{ $labels.remote\_name}}:{{ $labels.url }}.

S1 Critical · for 15 min · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])

- ignoring(remote_name, url) group_right

  max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="prometheus-k8s",namespace="monitoring"}[5m])

)

> 120
```

Runbook:

1. Check the Prometheus log for remote\_write or tsdb errors;
2. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
3. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
4. Confirm the queue backlog is draining; if not, raise queue\_config or reduce the write volume.

#### PrometheusRemoteWriteDesiredShards[​](#prometheusremotewritedesiredshards "Direct link to PrometheusRemoteWriteDesiredShards")

Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote\_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max\{instance="%s",job="prometheus-k8s",namespace="monitoring"\}` $labels.instance | query | first | value }}.

S2 Warning · for 15 min · Trigger:

```
# Without max_over_time, failed scrapes could create false negatives, see

# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.

(

  max_over_time(prometheus_remote_storage_shards_desired{job="prometheus-k8s",namespace="monitoring"}[5m])

>

  max_over_time(prometheus_remote_storage_shards_max{job="prometheus-k8s",namespace="monitoring"}[5m])

)
```

Runbook:

1. Check the Prometheus log for remote\_write or tsdb errors;
2. For remote write failures, confirm remote storage availability and credentials, and check for throttling;
3. For local storage failures, check disk space and permissions — a corrupted TSDB may require clearing the WAL;
4. Confirm the queue backlog is draining; if not, raise queue\_config or reduce the write volume.

#### PrometheusRuleFailures[​](#prometheusrulefailures "Direct link to PrometheusRuleFailures")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf "%.0f" $value }} rules in the last 5m.

S1 Critical · for 15 min · Trigger:

```
increase(prometheus_rule_evaluation_failures_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Check the log for the failing rule name and error;
2. Common causes are a query syntax error in the rule, a reference to a non-existent metric, or an oversized result;
3. Validate the rule files with promtool check rules;
4. After fixing, confirm the rule shows ok on the /rules page.

#### PrometheusScrapeBodySizeLimitHit[​](#prometheusscrapebodysizelimithit "Direct link to PrometheusScrapeBodySizeLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured body\_size\_limit.

S2 Warning · for 15 min · Trigger:

```
increase(prometheus_target_scrapes_exceeded_body_size_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the rejected targets on the /targets page;
2. curl that target's /metrics by hand to see the actual size and whether the metric count has ballooned;
3. High-cardinality metrics are the usual cause — fix at the source or drop with metric\_relabel\_configs;
4. If a higher limit is genuinely needed, raise body\_size\_limit.

#### PrometheusScrapeSampleLimitHit[​](#prometheusscrapesamplelimithit "Direct link to PrometheusScrapeSampleLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured sample\_limit.

S2 Warning · for 15 min · Trigger:

```
increase(prometheus_target_scrapes_exceeded_sample_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Find the rejected targets and their sample counts on the /targets page;
2. Run curl /metrics | wc -l by hand to confirm the actual scale;
3. High-cardinality metrics are the main cause — reduce label dimensions at the source or drop unneeded metrics with metric\_relabel\_configs;
4. If a higher limit is genuinely needed, raise sample\_limit after assessing storage and query impact.

#### PrometheusSDRefreshFailure[​](#prometheussdrefreshfailure "Direct link to PrometheusSDRefreshFailure")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to refresh SD with mechanism {{$labels.mechanism}}.

S2 Warning · for 20 min · Trigger:

```
increase(prometheus_sd_refresh_failures_total{job="prometheus-k8s",namespace="monitoring"}[10m]) > 0
```

Runbook:

1. Check the log for service discovery errors;
2. For Kubernetes SD, check that Prometheus's RBAC covers the required resources;
3. For other SD types (Consul, file, …), check backend reachability and credentials;
4. After fixing, confirm the target list is updated on the /service-discovery page.

#### PrometheusTargetLimitHit[​](#prometheustargetlimithit "Direct link to PrometheusTargetLimitHit")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because the number of targets exceeded the configured target\_limit.

S2 Warning · for 15 min · Trigger:

```
increase(prometheus_target_scrape_pool_exceeded_target_limit_total{job="prometheus-k8s",namespace="monitoring"}[5m]) > 0
```

Runbook:

1. Confirm the current target count against the limit on the /targets page;
2. Check whether the ServiceMonitor selector is too broad and picking up unwanted targets;
3. Tighten the selector or split across multiple Prometheus instances by business domain;
4. If more targets are genuinely needed, raise target\_limit and size the resources accordingly.

#### PrometheusTargetSyncFailure[​](#prometheustargetsyncfailure "Direct link to PrometheusTargetSyncFailure")

{{ printf "%.0f" $value }} targets in Prometheus {{$labels.namespace}}/{{$labels.pod}} have failed to sync because invalid configuration was supplied.

S1 Critical · for 5 min · Trigger:

```
increase(prometheus_target_sync_failed_total{job="prometheus-k8s",namespace="monitoring"}[30m]) > 0
```

Runbook:

1. Check the log for the specific target sync error;
2. It is usually a relabel misconfiguration producing an invalid target address;
3. Review recently changed ServiceMonitor/PodMonitor configurations;
4. After fixing, confirm the targets are healthy again on the /targets page.

#### PrometheusTSDBCompactionsFailing[​](#prometheustsdbcompactionsfailing "Direct link to PrometheusTSDBCompactionsFailing")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} compaction failures over the last 3h.

S2 Warning · for 240 min · Trigger:

```
increase(prometheus_tsdb_compactions_failed_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

Runbook:

1. Check the log for compaction errors;
2. The most common cause is insufficient disk space — confirm the free space first;
3. A corrupted block may need its directory deleted (losing that time range);
4. After fixing, confirm subsequent compactions complete successfully.

#### PrometheusTSDBReloadsFailing[​](#prometheustsdbreloadsfailing "Direct link to PrometheusTSDBReloadsFailing")

Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} reload failures over the last 3h.

S2 Warning · for 240 min · Trigger:

```
increase(prometheus_tsdb_reloads_failures_total{job="prometheus-k8s",namespace="monitoring"}[3h]) > 0
```

Runbook:

1. Check the log for reload errors and which block is involved;
2. It is usually a corrupted block or a permissions problem;
3. For permissions, fix the data directory owner; a corrupted block can only be deleted (losing that time range);
4. After fixing, restart Prometheus and confirm the data is queryable.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

305 metrics, the ones the dashboards and rules above are built on.

| Metric                                                                                                                                                                                                                                                                                                                                                              | Meaning                                                                                                                                                                                                                                                  | Unit |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `sum(rate(coredns_dns_requests_total{}[5m])) by (proto,instance)`                                                                                                                                                                                                                                                                                                   | CoreDNS Request Rate — Metric exposed by CoreDNS itself                                                                                                                                                                                                  |      |
| `sum(rate(coredns_dns_requests_total{}[5m])) by (type,instance)`                                                                                                                                                                                                                                                                                                    | CoreDNS Request Rate (by record type) — Metric exposed by CoreDNS itself                                                                                                                                                                                 |      |
| `sum(rate(coredns_dns_do_requests_total{}[5m])) by (instance)`                                                                                                                                                                                                                                                                                                      | CoreDNS Request Rate (DO flag) — Metric exposed by CoreDNS itself                                                                                                                                                                                        |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_request_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | CoreDNS UDP Request Packet Size P99 — Metric exposed by CoreDNS itself                                                                                                                                                                                   |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_request_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | CoreDNS UDP Request Packet Size P90 — Metric exposed by CoreDNS itself                                                                                                                                                                                   |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_request_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | CoreDNS UDP Request Packet Size P50 — Metric exposed by CoreDNS itself                                                                                                                                                                                   |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_request_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | CoreDNS TCP Request Packet Size P99 — Metric exposed by CoreDNS itself                                                                                                                                                                                   |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_request_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | CoreDNS TCP Request Packet Size P90 — Metric exposed by CoreDNS itself                                                                                                                                                                                   |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_request_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                  | CoreDNS TCP Request Packet Size P50 — Metric exposed by CoreDNS itself                                                                                                                                                                                   |      |
| `sum(rate(coredns_dns_responses_total{}[5m])) by(rcode,instance)`                                                                                                                                                                                                                                                                                                   | CoreDNS Response Rate (by response code) — Metric exposed by CoreDNS itself                                                                                                                                                                              |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_request_duration_seconds_bucket{}[5m])) by(le,job,instance))`                                                                                                                                                                                                                                                         | CoreDNS Response Latency P99 — Metric exposed by CoreDNS itself                                                                                                                                                                                          |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_request_duration_seconds_bucket{}[5m])) by(le,job,instance))`                                                                                                                                                                                                                                                         | CoreDNS Response Latency P90 — Metric exposed by CoreDNS itself                                                                                                                                                                                          |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_request_duration_seconds_bucket{}[5m])) by(le,job,instance))`                                                                                                                                                                                                                                                         | CoreDNS Response Latency P50 — Metric exposed by CoreDNS itself                                                                                                                                                                                          |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_response_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | CoreDNS UDP Response Packet Size P99 — Metric exposed by CoreDNS itself                                                                                                                                                                                  |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_response_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | CoreDNS UDP Response Packet Size P90 — Metric exposed by CoreDNS itself                                                                                                                                                                                  |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_response_size_bytes_bucket{proto="udp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | CoreDNS UDP Response Packet Size P50 — Metric exposed by CoreDNS itself                                                                                                                                                                                  |      |
| `histogram_quantile(0.99,sum(rate(coredns_dns_response_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | CoreDNS TCP Response Packet Size P99 — Metric exposed by CoreDNS itself                                                                                                                                                                                  |      |
| `histogram_quantile(0.90,sum(rate(coredns_dns_response_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | CoreDNS TCP Response Packet Size P90 — Metric exposed by CoreDNS itself                                                                                                                                                                                  |      |
| `histogram_quantile(0.50,sum(rate(coredns_dns_response_size_bytes_bucket{proto="tcp"}[5m])) by(le,proto,instance))`                                                                                                                                                                                                                                                 | CoreDNS TCP Response Packet Size P50 — Metric exposed by CoreDNS itself                                                                                                                                                                                  |      |
| `sum (coredns_cache_entries{}) by(type,instance)`                                                                                                                                                                                                                                                                                                                   | CoreDNS Cached DNS Records — Metric exposed by CoreDNS itself                                                                                                                                                                                            |      |
| `sum (rate(coredns_cache_hits_total{}[5m])) by (type,instance)`                                                                                                                                                                                                                                                                                                     | CoreDNS Cache Hit Rate — Metric exposed by CoreDNS itself                                                                                                                                                                                                |      |
| `sum (rate(coredns_cache_misses_total{}[5m])) by (type,instance)`                                                                                                                                                                                                                                                                                                   | CoreDNS Cache Miss Rate — Metric exposed by CoreDNS itself                                                                                                                                                                                               |      |
| `kube_cronjob_info`                                                                                                                                                                                                                                                                                                                                                 | CronJob Information — CronJob metric from kube-state-metrics                                                                                                                                                                                             |      |
| `kube_cronjob_labels`                                                                                                                                                                                                                                                                                                                                               | Kubernetes Labels Converted to Prometheus Labels — CronJob metric from kube-state-metrics                                                                                                                                                                |      |
| `kube_cronjob_created`                                                                                                                                                                                                                                                                                                                                              | Creation Unix Timestamp — CronJob metric from kube-state-metrics                                                                                                                                                                                         |      |
| `kube_cronjob_next_schedule_time`                                                                                                                                                                                                                                                                                                                                   | Next Schedule Time — CronJob metric from kube-state-metrics                                                                                                                                                                                              |      |
| `kube_cronjob_status_active`                                                                                                                                                                                                                                                                                                                                        | Currently Active Jobs — CronJob metric from kube-state-metrics                                                                                                                                                                                           |      |
| `kube_cronjob_status_last_schedule_time`                                                                                                                                                                                                                                                                                                                            | Last Successful Schedule Time — CronJob metric from kube-state-metrics                                                                                                                                                                                   |      |
| `kube_cronjob_spec_suspend`                                                                                                                                                                                                                                                                                                                                         | Suspend Flag — CronJob metric from kube-state-metrics                                                                                                                                                                                                    |      |
| `kube_cronjob_spec_starting_deadline_seconds`                                                                                                                                                                                                                                                                                                                       | Job Starting Deadline (seconds) — CronJob metric from kube-state-metrics                                                                                                                                                                                 |      |
| `apiserver_request_duration_seconds`                                                                                                                                                                                                                                                                                                                                | Request Duration Distribution by URL and Verb — Metric exposed by the apiserver itself Type: histogram                                                                                                                                                   |      |
| `apiserver_request_total`                                                                                                                                                                                                                                                                                                                                           | Total API Server Requests — Metric exposed by the apiserver itself Type: counter                                                                                                                                                                         |      |
| `apiserver_current_inflight_requests`                                                                                                                                                                                                                                                                                                                               | Current Inflight Requests — Metric exposed by the apiserver itself Type: gauge                                                                                                                                                                           |      |
| `apiserver_response_sizes`                                                                                                                                                                                                                                                                                                                                          | Response Size Distribution (bytes) — Metric exposed by the apiserver itself Type: histogram                                                                                                                                                              |      |
| `watch_cache_capacity`                                                                                                                                                                                                                                                                                                                                              | Watch Cache Capacity by Resource Type — Metric exposed by the apiserver itself Type: gauge                                                                                                                                                               |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | Total Process CPU Time (seconds) — Metric exposed by the apiserver itself Type: counter                                                                                                                                                                  |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | Resident Memory Usage (bytes) — Metric exposed by the apiserver itself Type: gauge                                                                                                                                                                       |      |
| `workqueue_adds_total`                                                                                                                                                                                                                                                                                                                                              | Total Workqueue Additions — Metric exposed by the apiserver itself Type: counter                                                                                                                                                                         |      |
| `workqueue_depth`                                                                                                                                                                                                                                                                                                                                                   | Workqueue Depth — Metric exposed by the apiserver itself Type: gauge                                                                                                                                                                                     |      |
| `kube_configmap_info`                                                                                                                                                                                                                                                                                                                                               | ConfigMap Information — ConfigMap metric from kube-state-metrics                                                                                                                                                                                         |      |
| `kube_configmap_created`                                                                                                                                                                                                                                                                                                                                            | Creation Unix Timestamp — ConfigMap metric from kube-state-metrics                                                                                                                                                                                       |      |
| `kube_configmap_metadata_resource_version`                                                                                                                                                                                                                                                                                                                          | ConfigMap Resource Version — ConfigMap metric from kube-state-metrics                                                                                                                                                                                    |      |
| `container_cpu_cfs_periods_total`                                                                                                                                                                                                                                                                                                                                   | Total CFS Scheduling Periods — Container metric exposed by cAdvisor Type: counter                                                                                                                                                                        |      |
| `container_cpu_cfs_throttled_periods_total`                                                                                                                                                                                                                                                                                                                         | Total Throttled CFS Periods — Container metric exposed by cAdvisor Type: counter                                                                                                                                                                         |      |
| `container_cpu_cfs_throttled_seconds_total`                                                                                                                                                                                                                                                                                                                         | Total CPU Throttled Time — Container metric exposed by cAdvisor Type: counter                                                                                                                                                                            |      |
| `container_file_descriptors`                                                                                                                                                                                                                                                                                                                                        | Open File Descriptors — Container metric exposed by cAdvisor Type: gauge                                                                                                                                                                                 |      |
| `container_memory_usage_bytes`                                                                                                                                                                                                                                                                                                                                      | Container Memory Usage (bytes) — Container metric exposed by cAdvisor Type: gauge                                                                                                                                                                        |      |
| `container_network_receive_bytes_total`                                                                                                                                                                                                                                                                                                                             | Total Network Receive Bytes — Container metric exposed by cAdvisor Type: counter                                                                                                                                                                         |      |
| `container_network_transmit_bytes_total`                                                                                                                                                                                                                                                                                                                            | Total Network Transmit Bytes — Container metric exposed by cAdvisor Type: counter                                                                                                                                                                        |      |
| `container_spec_cpu_period`                                                                                                                                                                                                                                                                                                                                         | Container CPU Scheduling Period — Container metric exposed by cAdvisor Type: gauge                                                                                                                                                                       |      |
| `container_spec_cpu_quota`                                                                                                                                                                                                                                                                                                                                          | Container CPU Quota — Container metric exposed by cAdvisor Type: gauge                                                                                                                                                                                   |      |
| `container_spec_memory_limit_bytes`                                                                                                                                                                                                                                                                                                                                 | Container Memory Limit (bytes) — Container metric exposed by cAdvisor Type: gauge                                                                                                                                                                        |      |
| `container_threads`                                                                                                                                                                                                                                                                                                                                                 | Current Thread Count — Container metric exposed by cAdvisor Type: gauge                                                                                                                                                                                  |      |
| `container_threads_max`                                                                                                                                                                                                                                                                                                                                             | Maximum Thread Count — Container metric exposed by cAdvisor Type: gauge                                                                                                                                                                                  |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | API Server Request Latency Distribution (by URL and Verb) — Metric of the controller-manager service itself. Type: histogram                                                                                                                             |      |
| `cronjob_controller_cronjob_job_creation_skew_duration_seconds`                                                                                                                                                                                                                                                                                                     | CronJob Creation-to-Run Time Distribution — Metric of the controller-manager service itself. Type: histogram                                                                                                                                             |      |
| `leader_election_master_status`                                                                                                                                                                                                                                                                                                                                     | Controller Leader Election Status (0: Backup, 1: Master) — Metric of the controller-manager service itself. Type: gauge                                                                                                                                  |      |
| `node_collector_zone_health`                                                                                                                                                                                                                                                                                                                                        | Healthy Node Ratio per Zone — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                               |      |
| `node_collector_zone_size`                                                                                                                                                                                                                                                                                                                                          | Node Count per Zone — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                                       |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | CPU Usage (Can Be Used as CPU Utilization) — Metric of the controller-manager service itself. Type: counter                                                                                                                                              |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | Open File Descriptors of Controller — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                       |      |
| `pv_collector_bound_pv_count`                                                                                                                                                                                                                                                                                                                                       | Currently Bound PV Count — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                                  |      |
| `pv_collector_unbound_pvc_count`                                                                                                                                                                                                                                                                                                                                    | Currently Unbound PVC Count — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                               |      |
| `pv_collector_bound_pvc_count`                                                                                                                                                                                                                                                                                                                                      | Currently Bound PVC Count — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                                 |      |
| `pv_collector_total_pv_count`                                                                                                                                                                                                                                                                                                                                       | Total PV Count — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                                            |      |
| `workqueue_adds_total`                                                                                                                                                                                                                                                                                                                                              | Total Tasks Accepted by Each Controller — Metric of the controller-manager service itself. Type: counter                                                                                                                                                 |      |
| `workqueue_depth`                                                                                                                                                                                                                                                                                                                                                   | Workqueue Depth per Controller (Number of Tasks in a Controller) — Metric of the controller-manager service itself. Type: gauge                                                                                                                          |      |
| `workqueue_queue_duration_seconds`                                                                                                                                                                                                                                                                                                                                  | Task Wait Time in Queue (by Controller) — Metric of the controller-manager service itself. Type: histogram                                                                                                                                               |      |
| `workqueue_work_duration_seconds`                                                                                                                                                                                                                                                                                                                                   | Task Processing Time From Dequeue to Completion (by Controller) — Metric of the controller-manager service itself. Type: histogram                                                                                                                       |      |
| `workqueue_retries_total`                                                                                                                                                                                                                                                                                                                                           | Total Task Retries in Workqueue — Metric of the controller-manager service itself. Type: counter                                                                                                                                                         |      |
| `workqueue_longest_running_processor_seconds`                                                                                                                                                                                                                                                                                                                       | Longest Running Task Processing Time — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                      |      |
| `endpoint_slice_controller_syncs`                                                                                                                                                                                                                                                                                                                                   | EndpointSlice Sync Count (1.20+) — Metric of the controller-manager service itself. Type: counter                                                                                                                                                        |      |
| `get_token_fail_count`                                                                                                                                                                                                                                                                                                                                              | Token Fetch Failure Count — Metric of the controller-manager service itself. Type: counter                                                                                                                                                               |      |
| `go_memstats_gc_cpu_fraction`                                                                                                                                                                                                                                                                                                                                       | GC CPU Fraction of Controller — Metric of the controller-manager service itself. Type: gauge                                                                                                                                                             |      |
| `kube_daemonset_created`                                                                                                                                                                                                                                                                                                                                            | Creation Unix Timestamp — DaemonSet metric from kube-state-metrics                                                                                                                                                                                       |      |
| `kube_daemonset_status_current_number_scheduled`                                                                                                                                                                                                                                                                                                                    | Nodes Running at Least One Daemon Pod — DaemonSet metric from kube-state-metrics                                                                                                                                                                         |      |
| `kube_daemonset_status_desired_number_scheduled`                                                                                                                                                                                                                                                                                                                    | Nodes That Should Run Daemon Pods — DaemonSet metric from kube-state-metrics                                                                                                                                                                             |      |
| `kube_daemonset_status_number_available`                                                                                                                                                                                                                                                                                                                            | Nodes with Available Daemon Pods — DaemonSet metric from kube-state-metrics                                                                                                                                                                              |      |
| `kube_daemonset_status_number_misscheduled`                                                                                                                                                                                                                                                                                                                         | Nodes Running Daemon Pods That Should Not — DaemonSet metric from kube-state-metrics                                                                                                                                                                     |      |
| `kube_daemonset_status_number_ready`                                                                                                                                                                                                                                                                                                                                | Nodes with Ready Daemon Pods — DaemonSet metric from kube-state-metrics                                                                                                                                                                                  |      |
| `kube_daemonset_status_number_unavailable`                                                                                                                                                                                                                                                                                                                          | Nodes with No Available Daemon Pods — DaemonSet metric from kube-state-metrics                                                                                                                                                                           |      |
| `kube_daemonset_updated_number_scheduled`                                                                                                                                                                                                                                                                                                                           | Nodes Running Updated Daemon Pods — DaemonSet metric from kube-state-metrics                                                                                                                                                                             |      |
| `kube_daemonset_metadata_generation`                                                                                                                                                                                                                                                                                                                                | Desired State Generation Sequence Number — DaemonSet metric from kube-state-metrics                                                                                                                                                                      |      |
| `kube_daemonset_labels`                                                                                                                                                                                                                                                                                                                                             | Kubernetes Labels Converted to Prometheus Labels — DaemonSet metric from kube-state-metrics                                                                                                                                                              |      |
| `kube_deployment_status_replicas`                                                                                                                                                                                                                                                                                                                                   | Replicas per Deployment — Deployment metric from kube-state-metrics.                                                                                                                                                                                     |      |
| `kube_deployment_status_replicas_available`                                                                                                                                                                                                                                                                                                                         | Available Replicas per Deployment — Deployment metric from kube-state-metrics.                                                                                                                                                                           |      |
| `kube_deployment_status_replicas_unavailable`                                                                                                                                                                                                                                                                                                                       | Unavailable Replicas per Deployment — Deployment metric from kube-state-metrics.                                                                                                                                                                         |      |
| `kube_deployment_status_replicas_updated`                                                                                                                                                                                                                                                                                                                           | Updated Replicas per Deployment — Deployment metric from kube-state-metrics.                                                                                                                                                                             |      |
| `kube_deployment_status_observed_generation`                                                                                                                                                                                                                                                                                                                        | Generation Observed by the Deployment Controller — Deployment metric from kube-state-metrics.                                                                                                                                                            |      |
| `kube_deployment_status_condition`                                                                                                                                                                                                                                                                                                                                  | Current Status Condition of Deployment — Deployment metric from kube-state-metrics.                                                                                                                                                                      |      |
| `kube_deployment_spec_replicas`                                                                                                                                                                                                                                                                                                                                     | Desired Pods for Deployment — Deployment metric from kube-state-metrics.                                                                                                                                                                                 |      |
| `kube_deployment_spec_paused`                                                                                                                                                                                                                                                                                                                                       | Deployment Paused (Not Processed by the Deployment Controller) — Deployment metric from kube-state-metrics.                                                                                                                                              |      |
| `kube_deployment_spec_strategy_rollingupdate_max_unavailable`                                                                                                                                                                                                                                                                                                       | Max Unavailable Replicas During Deployment Rolling Update — Deployment metric from kube-state-metrics.                                                                                                                                                   |      |
| `kube_deployment_spec_strategy_rollingupdate_max_surge`                                                                                                                                                                                                                                                                                                             | Max Surge Replicas During Deployment Rolling Update — Deployment metric from kube-state-metrics.                                                                                                                                                         |      |
| `kube_deployment_metadata_generation`                                                                                                                                                                                                                                                                                                                               | Sequence Number Representing a Specific Generation of the Desired State — Deployment metric from kube-state-metrics.                                                                                                                                     |      |
| `kube_deployment_labels`                                                                                                                                                                                                                                                                                                                                            | Kubernetes Labels Converted to Prometheus Labels — Deployment metric from kube-state-metrics.                                                                                                                                                            |      |
| `kube_deployment_created`                                                                                                                                                                                                                                                                                                                                           | Creation Unix Timestamp — Deployment metric from kube-state-metrics.                                                                                                                                                                                     |      |
| `kube_endpoint_address_not_ready`                                                                                                                                                                                                                                                                                                                                   | Not Ready Addresses in Endpoint — Endpoint metric from kube-state-metrics                                                                                                                                                                                |      |
| `kube_endpoint_address_available`                                                                                                                                                                                                                                                                                                                                   | Available Addresses in Endpoint — Endpoint metric from kube-state-metrics                                                                                                                                                                                |      |
| `kube_endpoint_info`                                                                                                                                                                                                                                                                                                                                                | Endpoint Information — Endpoint metric from kube-state-metrics                                                                                                                                                                                           |      |
| `kube_endpoint_labels`                                                                                                                                                                                                                                                                                                                                              | Kubernetes Labels Converted to Prometheus Labels — Endpoint metric from kube-state-metrics                                                                                                                                                               |      |
| `kube_endpoint_created`                                                                                                                                                                                                                                                                                                                                             | Creation Unix Timestamp — Endpoint metric from kube-state-metrics                                                                                                                                                                                        |      |
| `etcd_server_is_leader`                                                                                                                                                                                                                                                                                                                                             | Leader Indicator (1: leader, 0: learner) — Metric exposed by the etcd service itself Type: gauge                                                                                                                                                         |      |
| `etcd_server_health_success`                                                                                                                                                                                                                                                                                                                                        | Health Check Successes — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                         |      |
| `etcd_server_health_failures`                                                                                                                                                                                                                                                                                                                                       | Health Check Failures — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                          |      |
| `etcd_disk_defrag_inflight`                                                                                                                                                                                                                                                                                                                                         | Defragmentation In Progress (1: defragmenting, 0: not started) — Metric exposed by the etcd service itself Type: gauge                                                                                                                                   |      |
| `etcd_server_snapshot_apply_in_progress_total`                                                                                                                                                                                                                                                                                                                      | Snapshot Apply In Progress (1: in progress, 0: not) — Metric exposed by the etcd service itself Type: gauge                                                                                                                                              |      |
| `etcd_server_leader_changes_seen_total`                                                                                                                                                                                                                                                                                                                             | Cluster Leader Changes — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                         |      |
| `grpc_server_handled_total`                                                                                                                                                                                                                                                                                                                                         | gRPC Calls Total — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                               |      |
| `etcd_disk_wal_fsync_duration_seconds`                                                                                                                                                                                                                                                                                                                              | WAL Fsync Duration — Metric exposed by the etcd service itself Type: histogram                                                                                                                                                                           |      |
| `etcd_server_proposals_failed_total`                                                                                                                                                                                                                                                                                                                                | Failed Proposals Total (a proposal is one request going through the Raft protocol) — Metric exposed by the etcd service itself Type: counter                                                                                                             |      |
| `etcd_server_proposals_pending`                                                                                                                                                                                                                                                                                                                                     | Pending Proposals (a proposal is one request going through the Raft protocol) — Metric exposed by the etcd service itself Type: gauge                                                                                                                    |      |
| `etcd_server_read_indexes_failed_total`                                                                                                                                                                                                                                                                                                                             | Read Index Failures Total (v3 indexes every key to speed up range operations) — Metric exposed by the etcd service itself Type: counter                                                                                                                  |      |
| `etcd_server_slow_read_indexes_total`                                                                                                                                                                                                                                                                                                                               | Slow Read Indexes Total (stale index reads or read timeouts) — Metric exposed by the etcd service itself Type: counter                                                                                                                                   |      |
| `etcd_server_quota_backend_bytes`                                                                                                                                                                                                                                                                                                                                   | Backend Storage Quota (DB size limit, set via quota-backend-bytes; default 2G, officially recommended not to exceed 8G) — Metric exposed by the etcd service itself Type: gauge                                                                          |      |
| `etcd_mvcc_db_total_size_in_bytes`                                                                                                                                                                                                                                                                                                                                  | Allocated DB Size (in-use size + free size) — Metric exposed by the etcd service itself Type: gauge                                                                                                                                                      |      |
| `etcd_mvcc_db_total_size_in_use_in_bytes`                                                                                                                                                                                                                                                                                                                           | DB Size In Use — Metric exposed by the etcd service itself Type: gauge                                                                                                                                                                                   |      |
| `etcd_mvcc_range_total`                                                                                                                                                                                                                                                                                                                                             | Range Operations Total — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                         |      |
| `etcd_mvcc_put_total`                                                                                                                                                                                                                                                                                                                                               | Put Operations Total — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                           |      |
| `etcd_mvcc_txn_total`                                                                                                                                                                                                                                                                                                                                               | Transactions Total — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                             |      |
| `etcd_mvcc_delete_total`                                                                                                                                                                                                                                                                                                                                            | Delete Operations Total — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                        |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | etcd CPU Usage — Metric exposed by the etcd service itself Type: counter                                                                                                                                                                                 |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | etcd Memory Usage — Metric exposed by the etcd service itself Type: gauge                                                                                                                                                                                |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | etcd Open File Descriptors — Metric exposed by the etcd service itself Type: gauge                                                                                                                                                                       |      |
| `kube_job_info`                                                                                                                                                                                                                                                                                                                                                     | Job Information — Job metric from kube-state-metrics.                                                                                                                                                                                                    |      |
| `kube_job_labels`                                                                                                                                                                                                                                                                                                                                                   | Kubernetes Labels Converted to Prometheus Labels — Job metric from kube-state-metrics.                                                                                                                                                                   |      |
| `kube_job_owner`                                                                                                                                                                                                                                                                                                                                                    | Job Owner Information — Job metric from kube-state-metrics.                                                                                                                                                                                              |      |
| `kube_job_spec_parallelism`                                                                                                                                                                                                                                                                                                                                         | Maximum Desired Pods Running at Any Given Time — Job metric from kube-state-metrics.                                                                                                                                                                     |      |
| `kube_job_spec_completions`                                                                                                                                                                                                                                                                                                                                         | Desired Successful Pod Completions — Job metric from kube-state-metrics.                                                                                                                                                                                 |      |
| `kube_job_spec_active_deadline_seconds`                                                                                                                                                                                                                                                                                                                             | Active Deadline Relative to StartTime Before Termination (Seconds) — Job metric from kube-state-metrics.                                                                                                                                                 |      |
| `kube_job_status_active`                                                                                                                                                                                                                                                                                                                                            | Actively Running Pods — Job metric from kube-state-metrics.                                                                                                                                                                                              |      |
| `kube_job_status_succeeded`                                                                                                                                                                                                                                                                                                                                         | Pods That Reached Succeeded Phase — Job metric from kube-state-metrics.                                                                                                                                                                                  |      |
| `kube_job_status_failed`                                                                                                                                                                                                                                                                                                                                            | Pods That Reached Failed Phase — Job metric from kube-state-metrics.                                                                                                                                                                                     |      |
| `kube_job_status_start_time`                                                                                                                                                                                                                                                                                                                                        | Job Start Time (Acknowledged by the Job Manager) — Job metric from kube-state-metrics.                                                                                                                                                                   |      |
| `kube_job_status_completion_time`                                                                                                                                                                                                                                                                                                                                   | Job Completion Time — Job metric from kube-state-metrics.                                                                                                                                                                                                |      |
| `kube_job_complete`                                                                                                                                                                                                                                                                                                                                                 | Job Completed — Job metric from kube-state-metrics.                                                                                                                                                                                                      |      |
| `kube_job_failed`                                                                                                                                                                                                                                                                                                                                                   | Job Failed — Job metric from kube-state-metrics.                                                                                                                                                                                                         |      |
| `kube_job_created`                                                                                                                                                                                                                                                                                                                                                  | Creation Unix Timestamp — Job metric from kube-state-metrics.                                                                                                                                                                                            |      |
| `node_netstat_Tcp_CurrEstab * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                   | Current TCP Connections — Node indicators Type: \*                                                                                                                                                                                                       |      |
| `node_filefd_allocated * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                        | Number of file descriptors used — Node indicators Type: \*                                                                                                                                                                                               |      |
| `node_filefd_maximum * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                          | File Descriptor Maximum Limit — Node indicators Type: \*                                                                                                                                                                                                 |      |
| `100 - (node_filesystem_files_free * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} / node_filesystem_files * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} * 100)`                                                                                                                        | File system inode usage — Node indicators Type:-                                                                                                                                                                                                         |      |
| `100 - ((node_filesystem_avail_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} * 100) / node_filesystem_size_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                | File system usage — Node indicators Type:-                                                                                                                                                                                                               |      |
| `sum(node_filesystem_device_error * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}) by (mountpoint)`                                                                                                                                                                                                                            | Number of file system errors — Node indicators Type: \*                                                                                                                                                                                                  |      |
| `rate(node_disk_io_now[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                   | Disk IO usage — Node indicators Type: \*                                                                                                                                                                                                                 |      |
| `rate(node_disk_writes_completed_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                   | Disk Write IOPS — Node indicators Type: \*                                                                                                                                                                                                               |      |
| `rate(node_disk_written_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                      | Disk write rate — Node indicators Type: \*                                                                                                                                                                                                               |      |
| `rate(node_disk_reads_completed_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                    | Disk Read IOPS — Node indicators Type: \*                                                                                                                                                                                                                |      |
| `rate(node_disk_read_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                         | Disk read rate — Node indicators Type: \*                                                                                                                                                                                                                |      |
| `rate(node_context_switches_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                        | System context switching rate — Node indicators Type: \*                                                                                                                                                                                                 |      |
| `rate(node_intr_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | System interruption rate — Node indicators Type: \*                                                                                                                                                                                                      |      |
| `sum(rate(node_network_transmit_drop_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                              | Network transmission packet loss rate — Node indicators Type: \*                                                                                                                                                                                         |      |
| `sum(rate(node_network_transmit_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                             | Network transmission bandwidth — Node indicators Type: \*                                                                                                                                                                                                |      |
| `sum(rate(node_network_transmit_errs_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                              | Network transmission error rate — Node indicators Type: \*                                                                                                                                                                                               |      |
| `sum(rate(node_network_receive_drop_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                               | Network reception packet loss rate — Node indicators Type: \*                                                                                                                                                                                            |      |
| `sum(rate(node_network_receive_bytes_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                              | Network reception bandwidth — Node indicators Type: \*                                                                                                                                                                                                   |      |
| `sum(rate(node_network_receive_errs_total[5m]) * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                               | Network reception error rate — Node indicators Type: \*                                                                                                                                                                                                  |      |
| `node_nf_conntrack_entries * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | Number of network connection tracking entries — Node indicators Type: \*                                                                                                                                                                                 |      |
| `node_nf_conntrack_entries_limit * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                              | Network connection tracking restrictions — Node indicators Type: \*                                                                                                                                                                                      |      |
| `sum by (instance) (rate(node_cpu_seconds_total{mode!~"idle\|iowait\|steal"}[5m])) * on(instance) group_left(nodename) node_uname_info{nodename=~"$node_name"} *100`                                                                                                                                                                                                | Node CPU usage — Node indicators Type: by                                                                                                                                                                                                                |      |
| `node_load15 * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                                  | Node 15-minute load — Node indicators Type: \*                                                                                                                                                                                                           |      |
| `node_load1 * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                                   | Node 1 minute load — Node indicators Type: \*                                                                                                                                                                                                            |      |
| `node_load5 * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                                   | Node 5-minute load — Node indicators Type: \*                                                                                                                                                                                                            |      |
| `node_memory_SwapTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} - node_memory_SwapFree_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                | Node Swap usage — Node indicators Type: \*                                                                                                                                                                                                               |      |
| `node_memory_SwapTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                  | Total Node Swap — Node indicators Type: \*                                                                                                                                                                                                               |      |
| `sum(kube_pod_info * on(node) group_left(nodename) node_uname_info{nodename=~"$node_name"})`                                                                                                                                                                                                                                                                        | Number of Pods running on a node — Node indicators Type: \*                                                                                                                                                                                              |      |
| `sum(node_memory_MemTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"} - node_memory_MemAvailable_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}) / sum(node_memory_MemTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"})` | Node memory usage — Node indicators Type: \*                                                                                                                                                                                                             |      |
| `node_memory_MemAvailable_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                               | Node memory details-Available — Node indicators Type: \*                                                                                                                                                                                                 |      |
| `node_memory_MemTotal_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                   | Node Memory Details-Total — Node indicators Type: \*                                                                                                                                                                                                     |      |
| `node_memory_MemFree_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | Node memory details-free — Node indicators Type: \*                                                                                                                                                                                                      |      |
| `node_memory_Buffers_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                    | Node Memory Details-Buffer — Node indicators Type: \*                                                                                                                                                                                                    |      |
| `node_memory_Cached_bytes * on(instance, cluster) group_left(nodename) node_uname_info{nodename=~"$node_name"}`                                                                                                                                                                                                                                                     | Node Memory Details-Cache — Node indicators Type: \*                                                                                                                                                                                                     |      |
| `sum(container_fs_inodes_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                            | Number of Inodes — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                                   |      |
| `sum(container_tasks_state{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*", state="uninterruptible"}) by (name)`                                                                                                                                                                                                                                       | Number of uninterruptible tasks — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                    |      |
| `(sum(container_memory_cache{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name))`                                                                                                                                                                                                                                                             | Container cache use — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                                |      |
| `(sum(container_spec_cpu_quota{namespace="$namespace", pod=~"$pod_name"}/container_spec_cpu_period{namespace="$namespace", pod=~"$pod_name"}) by (name))`                                                                                                                                                                                                           | Container CPU Limit — Pod's own indicators Type: pod = \~ "$pod \_ name"}/container \_ spec \_ cpu \_ period {namespace = "$namespace",                                                                                                                  |      |
| `sum(container_cpu_load_average_10s{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                       | Container CPU load 10 — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                              |      |
| `sum(rate(container_cpu_usage_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)`                                                                                                                                                                                                                                       | Container CPU usage — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                                |      |
| `sum(rate(container_cpu_usage_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)/((sum(container_spec_cpu_quota{namespace="$namespace", pod=~"$pod_name"}/container_spec_cpu_period{namespace="$namespace", pod=~"$pod_name"}) by (name)))`                                                                             | Container CPU usage after normalization — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                            |      |
| `sum(container_fs_io_current{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                              | Container I/O — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                                      |      |
| `(sum(container_memory_rss{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name))`                                                                                                                                                                                                                                                               | Container RSS memory usage — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                         |      |
| `sum(container_spec_memory_limit_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                    | Container Memory Limit — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                             |      |
| `(sum(container_memory_usage_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name))`                                                                                                                                                                                                                                                       | Container memory usage — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                             |      |
| `((sum(container_memory_usage_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)) /(sum(container_spec_memory_limit_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)))*100`                                                                                                                               | Container memory usage — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                             |      |
| `sum(rate(container_cpu_system_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)`                                                                                                                                                                                                                                      | Container kernel mode CPU usage — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                    |      |
| `sum(rate(container_cpu_cfs_throttled_periods_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m]))by(name) *100`                                                                                                                                                                                                                               | The rate at which container CPU throttle occurs — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                    |      |
| `sum(container_oom_events_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                           | Number of OOM occurrences for container — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                            |      |
| `sum((time()-container_start_time_seconds{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"})) by (name)`                                                                                                                                                                                                                                                | Container startup time (hours) — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                     |      |
| `sum(container_fs_usage_bytes{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}) by (name)`                                                                                                                                                                                                                                                             | File system size used by the container — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                             |      |
| `sum(rate(container_cpu_user_seconds_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])*100) by(name)`                                                                                                                                                                                                                                        | Container user mode CPU usage — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                      |      |
| `sum(rate(container_fs_writes_bytes_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])) by(name)`                                                                                                                                                                                                                                             | File system write rate — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                             |      |
| `sum(rate(container_fs_reads_bytes_total{namespace="$namespace", pod=~"$pod_name", image!~".*pause.*"}[1m])) by(name)`                                                                                                                                                                                                                                              | File system read rate — Pod's own indicators Type: pod = \~ "$pod \_ name",                                                                                                                                                                              |      |
| `sum(rate(container_network_transmit_packets_dropped_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                     | Number of packets lost by network transmission — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                             |      |
| `sum(rate(container_network_transmit_packets_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                             | The network sends packets — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                                                  |      |
| `sum(rate(container_network_transmit_bytes_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                               | Network transmission rate — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                                                  |      |
| `sum(rate(container_network_transmit_errors_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                              | Number of network transmission errors — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                                      |      |
| `sum(rate(container_network_receive_packets_dropped_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                      | Number of packet losses received by network — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                                |      |
| `sum(rate(container_network_receive_packets_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                              | Number of packets received by network — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                                      |      |
| `sum(rate(container_network_receive_bytes_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                                | Network reception rate — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                                                     |      |
| `sum(rate(container_network_receive_errors_total{namespace="$namespace", pod=~"$pod_name"}[1m])) by(name, interface)`                                                                                                                                                                                                                                               | Number of network reception errors — Pod's own indicators Type: pod = \~ "$pod \_ name"} \[1m]))                                                                                                                                                         |      |
| `go_gc_duration_seconds`                                                                                                                                                                                                                                                                                                                                            | GC Duration — Metric of the kube-proxy service itself. Type: summary                                                                                                                                                                                     |      |
| `go_goroutines`                                                                                                                                                                                                                                                                                                                                                     | Goroutine Count — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                                                   |      |
| `go_threads`                                                                                                                                                                                                                                                                                                                                                        | Thread Count — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                                                      |      |
| `kubeproxy_network_programming_duration_seconds`                                                                                                                                                                                                                                                                                                                    | Time From Service/Pod Change to kube-proxy Rule Sync Completion (See kubernetes/community network\_programming\_latency.md) — Metric of the kube-proxy service itself. Type: histogram                                                                   |      |
| `kubeproxy_sync_proxy_rules_duration_seconds`                                                                                                                                                                                                                                                                                                                       | Proxy Rule Sync Duration — Metric of the kube-proxy service itself. Type: histogram                                                                                                                                                                      |      |
| `kubeproxy_sync_proxy_rules_endpoint_changes_pending`                                                                                                                                                                                                                                                                                                               | Pending Rule Syncs From Endpoint Changes — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                          |      |
| `kubeproxy_sync_proxy_rules_endpoint_changes_total`                                                                                                                                                                                                                                                                                                                 | Total Rule Syncs From Endpoint Changes — Metric of the kube-proxy service itself. Type: counter                                                                                                                                                          |      |
| `kubeproxy_sync_proxy_rules_iptables_restore_failures_total`                                                                                                                                                                                                                                                                                                        | Total iptables Restore Failures on Host — Metric of the kube-proxy service itself. Type: counter                                                                                                                                                         |      |
| `kubeproxy_sync_proxy_rules_last_queued_timestamp_seconds`                                                                                                                                                                                                                                                                                                          | Last Rule Sync Request Timestamp (Sync Is Hung if Much Larger Than kubeproxy\_sync\_proxy\_rules\_last\_timestamp\_seconds) — Metric of the kube-proxy service itself. Type: gauge                                                                       |      |
| `kubeproxy_sync_proxy_rules_last_timestamp_seconds`                                                                                                                                                                                                                                                                                                                 | Last Rule Sync Completion Timestamp — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                               |      |
| `kubeproxy_sync_proxy_rules_service_changes_pending`                                                                                                                                                                                                                                                                                                                | Pending Rule Syncs From Service Changes — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                           |      |
| `kubeproxy_sync_proxy_rules_service_changes_total`                                                                                                                                                                                                                                                                                                                  | Total Rule Syncs From Service Changes — Metric of the kube-proxy service itself. Type: counter                                                                                                                                                           |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | Total CPU Seconds (Used to Compute CPU Utilization) — Metric of the kube-proxy service itself. Type: counter                                                                                                                                             |      |
| `process_max_fds`                                                                                                                                                                                                                                                                                                                                                   | Max Open File Descriptors of Process — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                              |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | Current Open File Descriptors of Process — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                          |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | Resident Memory Usage — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                                             |      |
| `process_start_time_seconds`                                                                                                                                                                                                                                                                                                                                        | Process Start Timestamp — Metric of the kube-proxy service itself. Type: gauge                                                                                                                                                                           |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | API Server Request Latency (by URL and Verb) — Metric of the kube-proxy service itself. Type: histogram                                                                                                                                                  |      |
| `rest_client_requests_total`                                                                                                                                                                                                                                                                                                                                        | Total API Server Requests (by Code, Method, Host) — Metric of the kube-proxy service itself. Type: counter                                                                                                                                               |      |
| `go_gc_duration_seconds`                                                                                                                                                                                                                                                                                                                                            | GC Duration (Summary Metric) — Metric exposed by the kubelet service itself Type: summary                                                                                                                                                                |      |
| `go_goroutines`                                                                                                                                                                                                                                                                                                                                                     | Goroutine Count — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                                               |      |
| `go_threads`                                                                                                                                                                                                                                                                                                                                                        | Thread Count — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                                                  |      |
| `kubelet_cgroup_manager_duration_seconds`                                                                                                                                                                                                                                                                                                                           | Cgroup Operation Duration (by operation type) — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                             |      |
| `kubelet_containers_per_pod_count`                                                                                                                                                                                                                                                                                                                                  | Containers per Pod (count of spec.containers) — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                             |      |
| `kubelet_docker_operations_duration_seconds`                                                                                                                                                                                                                                                                                                                        | Docker Operation Duration (by operation type) — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                             |      |
| `kubelet_docker_operations_errors_total`                                                                                                                                                                                                                                                                                                                            | Docker Operation Errors Total (by operation type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                           |      |
| `kubelet_docker_operations_timeout_total`                                                                                                                                                                                                                                                                                                                           | Docker Operation Timeouts Total (by operation type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                         |      |
| `kubelet_docker_operations_total`                                                                                                                                                                                                                                                                                                                                   | Docker Operations Total (by operation type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                                 |      |
| `kubelet_eviction_stats_age_seconds`                                                                                                                                                                                                                                                                                                                                | Eviction Stats Age (by eviction signal) — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                                   |      |
| `kubelet_evictions`                                                                                                                                                                                                                                                                                                                                                 | Evictions Total (by eviction signal) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                                        |      |
| `kubelet_http_inflight_requests`                                                                                                                                                                                                                                                                                                                                    | Kubelet Inflight HTTP Requests (by method/path/server\_type, distinct from requests per second) — Metric exposed by the kubelet service itself Type: gauge                                                                                               |      |
| `kubelet_http_requests_duration_seconds`                                                                                                                                                                                                                                                                                                                            | Kubelet HTTP Request Duration (by method/path/server\_type) — Metric exposed by the kubelet service itself Type: histogram                                                                                                                               |      |
| `kubelet_http_requests_total`                                                                                                                                                                                                                                                                                                                                       | Kubelet HTTP Requests Total (by method/path/server\_type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                   |      |
| `kubelet_managed_ephemeral_containers`                                                                                                                                                                                                                                                                                                                              | Currently Managed Ephemeral Containers — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                        |      |
| `kubelet_network_plugin_operations_duration_seconds`                                                                                                                                                                                                                                                                                                                | Network Plugin Operation Duration (by operation\_type; always 0 when --feature-gates=EphemeralContainers=false) — Metric exposed by the kubelet service itself Type: histogram                                                                           |      |
| `kubelet_network_plugin_operations_errors_total`                                                                                                                                                                                                                                                                                                                    | Network Plugin Operation Errors Total (by operation\_type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                  |      |
| `kubelet_network_plugin_operations_total`                                                                                                                                                                                                                                                                                                                           | Network Plugin Operations Total (by operation\_type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                        |      |
| `kubelet_node_name`                                                                                                                                                                                                                                                                                                                                                 | Node Name — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                                                     |      |
| `kubelet_pleg_discard_events`                                                                                                                                                                                                                                                                                                                                       | PLEG (Pod Lifecycle Event Generator) Discarded Events — Metric exposed by the kubelet service itself Type: counter                                                                                                                                       |      |
| `kubelet_pleg_last_seen_seconds`                                                                                                                                                                                                                                                                                                                                    | PLEG Last Seen Timestamp — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                                      |      |
| `kubelet_pleg_relist_duration_seconds`                                                                                                                                                                                                                                                                                                                              | PLEG Relist Duration — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                                                      |      |
| `kubelet_pleg_relist_interval_seconds`                                                                                                                                                                                                                                                                                                                              | PLEG Relist Interval — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                                                      |      |
| `kubelet_pod_start_duration_seconds`                                                                                                                                                                                                                                                                                                                                | Pod Start Duration (from pending to running, i.e. from when kubelet sees the pod until all its containers are running; pod changes are watched from various source channels) — Metric exposed by the kubelet service itself Type: histogram              |      |
| `kubelet_pod_worker_duration_seconds`                                                                                                                                                                                                                                                                                                                               | Pod Worker Duration (by operation type: create/update/sync; a worker is kubelet's logical unit for handling a single pod) — Metric exposed by the kubelet service itself Type: histogram                                                                 |      |
| `kubelet_pod_worker_start_duration_seconds`                                                                                                                                                                                                                                                                                                                         | Pod Worker Start Duration (from kubelet seeing the pod to worker start) — Metric exposed by the kubelet service itself Type: histogram                                                                                                                   |      |
| `kubelet_run_podsandbox_duration_seconds`                                                                                                                                                                                                                                                                                                                           | Pod Sandbox Start Duration — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                                                |      |
| `kubelet_run_podsandbox_errors_total`                                                                                                                                                                                                                                                                                                                               | Pod Sandbox Start Errors Total — Metric exposed by the kubelet service itself Type: counter                                                                                                                                                              |      |
| `kubelet_running_containers`                                                                                                                                                                                                                                                                                                                                        | Running Containers (by container state: created/running/exited) — Metric exposed by the kubelet service itself Type: gauge                                                                                                                               |      |
| `kubelet_running_pods`                                                                                                                                                                                                                                                                                                                                              | Currently Running Pods — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                                        |      |
| `kubelet_runtime_operations_duration_seconds`                                                                                                                                                                                                                                                                                                                       | Container Runtime Operation Duration (container create/list/exec/remove/stop, etc.) — Metric exposed by the kubelet service itself Type: histogram                                                                                                       |      |
| `kubelet_runtime_operations_errors_total`                                                                                                                                                                                                                                                                                                                           | Container Runtime Operation Errors Total (by operation type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                |      |
| `kubelet_runtime_operations_total`                                                                                                                                                                                                                                                                                                                                  | Container Runtime Operations Total (by operation type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                                      |      |
| `kubelet_started_containers_errors_total`                                                                                                                                                                                                                                                                                                                           | Kubelet Started Container Errors Total (by code and container\_type) — Metric exposed by the kubelet service itself Type: counter                                                                                                                        |      |
| `kubelet_started_containers_total`                                                                                                                                                                                                                                                                                                                                  | Kubelet Started Containers Total — Metric exposed by the kubelet service itself Type: counter                                                                                                                                                            |      |
| `kubelet_started_pods_errors_total`                                                                                                                                                                                                                                                                                                                                 | Kubelet Started Pod Errors Total (counted only when sandbox creation fails) — Metric exposed by the kubelet service itself Type: counter                                                                                                                 |      |
| `kubelet_started_pods_total`                                                                                                                                                                                                                                                                                                                                        | Kubelet Started Pods Total — Metric exposed by the kubelet service itself Type: counter                                                                                                                                                                  |      |
| `process_cpu_seconds_total`                                                                                                                                                                                                                                                                                                                                         | CPU Usage — Metric exposed by the kubelet service itself Type: counter                                                                                                                                                                                   |      |
| `process_max_fds`                                                                                                                                                                                                                                                                                                                                                   | Max Allowed Open File Descriptors — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                             |      |
| `process_open_fds`                                                                                                                                                                                                                                                                                                                                                  | Currently Open File Descriptors — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                               |      |
| `process_resident_memory_bytes`                                                                                                                                                                                                                                                                                                                                     | Process Resident Memory Size — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                                  |      |
| `process_start_time_seconds`                                                                                                                                                                                                                                                                                                                                        | Process Start Time — Metric exposed by the kubelet service itself Type: gauge                                                                                                                                                                            |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | API Server Request Duration (by URL and request verb) — Metric exposed by the kubelet service itself Type: histogram                                                                                                                                     |      |
| `rest_client_requests_total`                                                                                                                                                                                                                                                                                                                                        | API Server Requests Total (by response code and request method) — Metric exposed by the kubelet service itself Type: counter                                                                                                                             |      |
| `storage_operation_duration_seconds`                                                                                                                                                                                                                                                                                                                                | Storage Operation Duration (by storage plugin such as configmap/emptydir/hostpath and operation\_name) — Metric exposed by the kubelet service itself Type: histogram                                                                                    |      |
| `volume_manager_total_volumes`                                                                                                                                                                                                                                                                                                                                      | Volumes Mounted on Node (by plugin\_name and state; plugin\_name includes "host-path", "empty-dir", "configmap", "projected"; state is desired\_state\_of\_world or actual\_state\_of\_world) — Metric exposed by the kubelet service itself Type: gauge |      |
| `kube_namespace_created`                                                                                                                                                                                                                                                                                                                                            | Creation Unix Timestamp — Namespace metric from kube-state-metrics                                                                                                                                                                                       |      |
| `kube_namespace_labels`                                                                                                                                                                                                                                                                                                                                             | Kubernetes Labels Converted to Prometheus Labels — Namespace metric from kube-state-metrics                                                                                                                                                              |      |
| `kube_namespace_status_condition`                                                                                                                                                                                                                                                                                                                                   | Namespace Condition — Namespace metric from kube-state-metrics                                                                                                                                                                                           |      |
| `kube_namespace_status_phase`                                                                                                                                                                                                                                                                                                                                       | Namespace Status Phase — Namespace metric from kube-state-metrics                                                                                                                                                                                        |      |
| `kube_node_info`                                                                                                                                                                                                                                                                                                                                                    | Cluster Node Information — Node metric from kube-state-metrics                                                                                                                                                                                           |      |
| `kube_node_labels`                                                                                                                                                                                                                                                                                                                                                  | Kubernetes Labels Converted to Prometheus Labels — Node metric from kube-state-metrics                                                                                                                                                                   |      |
| `kube_node_role`                                                                                                                                                                                                                                                                                                                                                    | Cluster Node Role — Node metric from kube-state-metrics                                                                                                                                                                                                  |      |
| `kube_node_spec_unschedulable`                                                                                                                                                                                                                                                                                                                                      | Whether Node Can Schedule New Pods — Node metric from kube-state-metrics                                                                                                                                                                                 |      |
| `kube_node_spec_taint`                                                                                                                                                                                                                                                                                                                                              | Cluster Node Taints — Node metric from kube-state-metrics                                                                                                                                                                                                |      |
| `kube_node_status_capacity`                                                                                                                                                                                                                                                                                                                                         | Node Resource Capacity — Node metric from kube-state-metrics                                                                                                                                                                                             |      |
| `kube_node_status_allocatable`                                                                                                                                                                                                                                                                                                                                      | Node Allocatable Resources — Node metric from kube-state-metrics                                                                                                                                                                                         |      |
| `kube_node_status_condition`                                                                                                                                                                                                                                                                                                                                        | Cluster Node Condition — Node metric from kube-state-metrics                                                                                                                                                                                             |      |
| `kube_node_created`                                                                                                                                                                                                                                                                                                                                                 | Creation Unix Timestamp — Node metric from kube-state-metrics                                                                                                                                                                                            |      |
| `rest_client_request_duration_seconds`                                                                                                                                                                                                                                                                                                                              | API Server Request Latency Distribution — Metric of the scheduler service itself. Type: histogram                                                                                                                                                        |      |
| `rest_client_requests_total`                                                                                                                                                                                                                                                                                                                                        | Total API Server Requests (by Host, Code, Method) — Metric of the scheduler service itself. Type: counter                                                                                                                                                |      |
| `leader_election_master_status`                                                                                                                                                                                                                                                                                                                                     | Scheduler Leader Election Status (0: Backup, 1: Master) — Metric of the scheduler service itself. Type: gauge                                                                                                                                            |      |
| `scheduler_queue_incoming_pods_total`                                                                                                                                                                                                                                                                                                                               | Pods Entering Scheduling Queue — Metric of the scheduler service itself. Type: counter                                                                                                                                                                   |      |
| `scheduler_preemption_attempts_total`                                                                                                                                                                                                                                                                                                                               | Scheduler Preemption Attempts — Metric of the scheduler service itself. Type: counter                                                                                                                                                                    |      |
| `scheduler_scheduler_cache_size`                                                                                                                                                                                                                                                                                                                                    | Scheduler Cache Size (Nodes, Pods, Assumed Pods) — Metric of the scheduler service itself. Type: gauge                                                                                                                                                   |      |
| `scheduler_pending_pods`                                                                                                                                                                                                                                                                                                                                            | Pending Pods (by Queue Type) — Metric of the scheduler service itself. Type: gauge                                                                                                                                                                       |      |
| `scheduler_plugin_execution_duration_seconds`                                                                                                                                                                                                                                                                                                                       | Plugin Execution Duration per Extension Point (by extension\_point, plugin, status) — Metric of the scheduler service itself. Type: histogram                                                                                                            |      |
| `scheduler_e2e_scheduling_duration_seconds`                                                                                                                                                                                                                                                                                                                         | E2E Scheduling Latency Distribution (Replaced by scheduling\_attempt\_duration\_seconds Since 1.23.0) — Metric of the scheduler service itself. Type: histogram                                                                                          |      |
| `scheduler_framework_extension_point_duration_seconds`                                                                                                                                                                                                                                                                                                              | Framework Extension Point Latency Distribution (by extension\_point, profile, status) — Metric of the scheduler service itself. Type: histogram                                                                                                          |      |
| `scheduler_pod_scheduling_attempts`                                                                                                                                                                                                                                                                                                                                 | Scheduling Attempts Distribution Before Pod Scheduled Successfully — Metric of the scheduler service itself. Type: histogram                                                                                                                             |      |
| `scheduler_schedule_attempts_total`                                                                                                                                                                                                                                                                                                                                 | Total Schedule Attempts by Result (unschedulable: Cannot Be Scheduled; error: Internal Scheduler Error) — Metric of the scheduler service itself. Type: counter                                                                                          |      |
| `scheduler_scheduler_goroutines`                                                                                                                                                                                                                                                                                                                                    | Goroutine Count by Function (e.g. Binding, Filter) — Metric of the scheduler service itself. Type: gauge                                                                                                                                                 |      |
| `scheduler_scheduling_algorithm_duration_seconds`                                                                                                                                                                                                                                                                                                                   | Scheduling Algorithm Latency Distribution — Metric of the scheduler service itself. Type: histogram                                                                                                                                                      |      |
| `scheduler_scheduling_attempt_duration_seconds`                                                                                                                                                                                                                                                                                                                     | Scheduling Algorithm + Binding Latency Distribution — Metric of the scheduler service itself. Type: histogram                                                                                                                                            |      |
| `scheduler_scheduler_goroutines`                                                                                                                                                                                                                                                                                                                                    | Scheduler Goroutine Count — Metric of the scheduler service itself. Type: gauge                                                                                                                                                                          |      |
| `kube_statefulset_status_replicas`                                                                                                                                                                                                                                                                                                                                  | Replicas per StatefulSet — StatefulSet metric from kube-state-metrics                                                                                                                                                                                    |      |
| `kube_statefulset_status_replicas_current`                                                                                                                                                                                                                                                                                                                          | Current Replicas per StatefulSet — StatefulSet metric from kube-state-metrics                                                                                                                                                                            |      |
| `kube_statefulset_status_replicas_ready`                                                                                                                                                                                                                                                                                                                            | Ready Replicas per StatefulSet — StatefulSet metric from kube-state-metrics                                                                                                                                                                              |      |
| `kube_statefulset_status_replicas_updated`                                                                                                                                                                                                                                                                                                                          | Updated Replicas per StatefulSet — StatefulSet metric from kube-state-metrics                                                                                                                                                                            |      |
| `kube_statefulset_status_observed_generation`                                                                                                                                                                                                                                                                                                                       | Generation Observed by StatefulSet Controller — StatefulSet metric from kube-state-metrics                                                                                                                                                               |      |
| `kube_statefulset_replicas`                                                                                                                                                                                                                                                                                                                                         | Desired Pod Count of StatefulSet — StatefulSet metric from kube-state-metrics                                                                                                                                                                            |      |
| `kube_statefulset_metadata_generation`                                                                                                                                                                                                                                                                                                                              | Desired State Generation Sequence Number — StatefulSet metric from kube-state-metrics                                                                                                                                                                    |      |
| `kube_statefulset_created`                                                                                                                                                                                                                                                                                                                                          | Creation Unix Timestamp — StatefulSet metric from kube-state-metrics                                                                                                                                                                                     |      |
| `kube_statefulset_labels`                                                                                                                                                                                                                                                                                                                                           | Kubernetes Labels Converted to Prometheus Labels — StatefulSet metric from kube-state-metrics                                                                                                                                                            |      |
| `kube_statefulset_status_current_revision`                                                                                                                                                                                                                                                                                                                          | StatefulSet Current Revision — StatefulSet metric from kube-state-metrics                                                                                                                                                                                |      |
| `kube_statefulset_status_update_revision`                                                                                                                                                                                                                                                                                                                           | StatefulSet Update Revision — StatefulSet metric from kube-state-metrics                                                                                                                                                                                 |      |

## Related[​](#related "Direct link to Related")

* [Kubernetes template source](https://github.com/ccfos/nightingale/tree/main/integrations/Kubernetes): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
