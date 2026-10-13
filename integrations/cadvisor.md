---
title: "Monitor cAdvisor with Nightingale"
sidebar_label: "cAdvisor"
description: "Scrapes the cAdvisor built into kubelet or a standalone one for per-container CPU, memory, filesystem and network metrics; in kubelet mode it can attach Pod labels and annotations."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/cAdvisor
toc_max_heading_level: 2
mdx:
  format: md
---

The cAdvisor input collects the `container_*` metrics that cAdvisor exposes: per-container CPU usage and throttling, memory working set and OOM events, filesystem reads and writes, network traffic and drops. Two ways to connect: `type = "kubelet"` scrapes the kubelet's `/metrics/cadvisor` (port 10250, authenticated) and can attach Pod labels and annotations to the metrics; `type = "cadvisor"` scrapes a standalone cAdvisor (port 8080 by default).

The dashboard shows resource usage per container and the metric reference explains each `container_*` metric. The rules cover CPU throttling, memory near the limit, OOM kills and network drops.

## What's in the template

- **1 dashboard**, 5 panels in total
- **6 alert rules**, each with runbook steps
- **45 metric descriptions**
- **Categraf collector config**: `input.cadvisor`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.cadvisor/cadvisor.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.cadvisor started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   # url = "https://1.2.3.4:10250"
   # type = "kubelet"
   ## url = "http://1.2.3.4:8080/metrics"
   ## type = "cadvisor"

   # url_label_key = "instance"
   # url_label_value = "{{.Host}}"
   # bearer_token_string = "eyJlonglongxxxx.eyJlonglongyyyy.oQsXlonglongZZZ"
   ## bearer_token_file = "/path/to/token/file"

   # ignore_label_keys = ["id","name", "container_label*"]
   ## choose_label_keys = ["id"]

   # timeout = "3s"

   # use_tls = true
   ## tls_min_version = "1.2"
   ## tls_ca = "/etc/categraf/ca.pem"
   ## tls_cert = "/etc/categraf/cert.pem"
   ## tls_key = "/etc/categraf/key.pem"
   ## Use TLS but skip chain & host verification
   ## insecure_skip_verify = true
   ```

1. Open the integration center in Nightingale, find cAdvisor, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| cAdvisor | 5 |

## Bundled alert rules

6 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Container memory approaching its limit

S1 Critical · for 5 min · Trigger:

```promql
container_memory_working_set_bytes{name!=""} / (container_spec_memory_limit_bytes{name!=""} > 0) * 100 > 90
```

Runbook:

1. Take name from the alert labels and run docker stats \<name> or kubectl top pod to confirm live usage;
1. Use the application's own memory analysis inside the container (jmap -histo:live for Java, pprof heap for Go) to separate normal growth from a leak;
1. If the limit is simply too small, raise it and redeploy, adjusting the application's own heap ceiling to match (-Xmx must leave room for off-heap memory);
1. If it is a leak, estimate the remaining runway from the growth rate and add an automatic restart as a stopgap while you investigate the code.

### Container OOM killed

S1 Critical · for 1 min · Trigger:

```promql
increase(container_oom_events_total{name!=""}[10m]) > 0
```

Runbook:

1. Take name from the alert labels and confirm the OOMKilled state via the State.OOMKilled field in docker inspect \<name> output or with kubectl describe pod;
1. Run dmesg -T | grep -i 'killed process' to find the killed process and its memory usage at the time;
1. Compare that usage against the limit and raise the limit if it is clearly too small;
1. If usage looks abnormal, investigate it as a memory leak; for Java, -Xmx must be smaller than the container limit with room for off-heap memory or an OOM is guaranteed.

### Container CPU heavily throttled

S2 Warning · for 5 min · Trigger:

```promql
rate(container_cpu_cfs_throttled_periods_total{name!=""}[5m]) / (rate(container_cpu_cfs_periods_total{name!=""}[5m]) > 0) * 100 > 25
```

Runbook:

1. Take name from the alert labels and confirm the growth of nr_throttled and throttled_usec with cat /sys/fs/cgroup/cpu.stat (cgroup v2);
1. Compare actual CPU usage against the limit; being throttled while below the limit usually means bursts are being sliced up by the 100 ms period, so raise the limit slightly or lower in-period concurrency;
1. A common trigger is a JVM or Go runtime sizing thread pools from the host core count; set GOMAXPROCS or -XX:ActiveProcessorCount to match the limit;
1. If more compute is genuinely needed, raise the CPU limit and watch the throttling ratio fall.

### Container filesystem usage too high

S2 Warning · for 5 min · Trigger:

```promql
container_fs_usage_bytes{name!=""} / (container_fs_limit_bytes{name!=""} > 0) * 100 > 85
```

Runbook:

1. Take name and device from the alert labels and run docker exec \<name> du -sh /* 2>/dev/null | sort -rh | head to find the biggest consumers;
1. In the vast majority of cases application logs are not being rotated: configure logrotate or switch to writing to stdout and let the runtime rotate them;
1. If the writable layer is filling up, mount a volume for directories that need persistence rather than writing into the layer;
1. As an emergency measure run docker system prune to reclaim host space from unused images and stopped containers.

### Container restarting repeatedly

S2 Warning · for 5 min · Trigger:

```promql
changes(container_start_time_seconds{name!=""}[1h]) > 3
```

Runbook:

1. Take name from the alert labels and run docker logs --tail 200 \<name> or kubectl logs --previous to read the logs from before the last exit;
1. Run docker inspect \<name> and check State.ExitCode and State.OOMKilled in the output to distinguish an OOM, a deliberate application exit, and a failing health check;
1. Handle OOMKilled as a memory alert; for a non-zero exit code, find the start-up failure in the application logs (missing configuration, dependency not ready);
1. If a health check is the cause, confirm the probe's initial delay is longer than the real start-up time and raise the start period if needed.

### Container network receive packet drops

S3 Info · for 5 min · Trigger:

```promql
rate(container_network_receive_packets_dropped_total{name!=""}[5m]) > 1
```

Runbook:

1. Take name from the alert labels and run docker exec \<name> cat /proc/net/dev plus ss -s to check drops and queue state;
1. If the receive queue is overflowing, raise the kernel's net.core.netdev_max_backlog and the application's accept queue (somaxconn);
1. Check whether the host NIC is also dropping packets (ethtool -S \<nic> | grep -i drop); if the problem is at the host level, do not chase it inside the container;
1. If traffic genuinely exceeds the container's networking capacity, evaluate switching to host networking or raising the bandwidth allocation.

## Metric reference

45 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `irate(container_cpu_system_seconds_total{image!="", image!~".*pause.*"}[3m]) * 100` | Container CPU utilization (system) | % |
| `irate(container_cpu_user_seconds_total{image!="", image!~".*pause.*"}[3m]) * 100` | Container CPU utilization (user) | % |
| `sum( irate(container_cpu_usage_seconds_total{image!="", image!~".*pause.*"}[3m]) ) by (pod,namespace,container,image) / sum( container_spec_cpu_quota/container_spec_cpu_period ) by (pod,namespace,container,image)` | Container CPU utilization (overall, the value will not be greater than 100) — Only containers with limit set can calculate this utilization | % |
| `irate(container_cpu_usage_seconds_total{image!="", image!~".*pause.*"}[3m]) * 100` | Container CPU utilization (overall, value may be greater than 100) — If 200%, it means that 2 cores are occupied | % |
| `irate(container_cpu_cfs_periods_total{}[3m])` | How many periods does the container CPU have per second |  |
| `irate(container_cpu_cfs_throttled_periods_total{}[3m])` | The amount of periods that the container CPU is throttle per second — If the container limits the CPU and the app requires too many algorithms, it will be suppressed. container _ CPU _ cfs _ throttled _ periods _ total counts how many periods have been suppressed in total. If suppression occurs recently, it needs attention. Some delay-sensitive apps are particularly affected. If it is suppressed, there is a high probability that it needs to be upgraded. |  |
| `irate(container_cpu_cfs_throttled_periods_total{}[3m]) / irate(container_cpu_cfs_periods_total{}[3m]) * 100` | The proportion of container CPU being throttle — If this value is greater than 0, pay attention | % |
| `container_fs_usage_bytes / container_fs_limit_bytes * 100` | Container filesystem usage | % |
| `container_fs_usage_bytes` | Container filesystem usage | bytes |
| `container_fs_io_current` | Container filesystem Current IO times |  |
| `container_fs_limit_bytes` | Container filesystem Total | bytes |
| `container_fs_inodes_free` | Container inode free amount | count |
| `container_fs_inodes_total` | Container inode total | count |
| `100 - container_fs_inodes_free / container_fs_inodes_total * 100` | Container inode usage | % |
| `sum(irate(container_fs_writes_bytes_total[3m])) by (namespace, pod)` | Container IO writes bytes per second | bytes/s |
| `sum(irate(container_fs_reads_bytes_total[3m])) by (namespace, pod)` | Container IO reads bytes per second | bytes/s |
| `container_memory_cache{image!="", image!~".*pause.*"}` | Container memory cache amount | bytes |
| `100 * container_memory_usage_bytes/container_spec_memory_limit_bytes and container_spec_memory_limit_bytes != 0` | Container memory Usage (Usage) — If there is a large number of file IO and a large number of container _ memory _ cache, the size of container _ memory _ usage _ bytes and container _ memory _ working _ set _ bytes will be different | % |
| `100 * container_memory_working_set_bytes/container_spec_memory_limit_bytes and container_spec_memory_limit_bytes != 0` | Container memory usage rate (Working Set) — If there is a large number of file IO and a large number of container _ memory _ cache, the size of container _ memory _ usage _ bytes and container _ memory _ working _ set _ bytes will be different | % |
| `container_memory_mapped_file{image!="", image!~".*pause.*"}` | Container memory usage (mapped _ file) | bytes |
| `container_memory_rss{image!="", image!~".*pause.*"}` | Container memory usage (RSS) | bytes |
| `container_memory_swap{image!="", image!~".*pause.*"}` | Container memory usage (Swap) | bytes |
| `container_memory_usage_bytes{image!="", image!~".*pause.*"}` | Container memory Usage — If there is a large number of file IO and a large number of container _ memory _ cache, the size of container _ memory _ usage _ bytes and container _ memory _ working _ set _ bytes will be different | bytes |
| `container_memory_working_set_bytes{image!="", image!~".*pause.*"}` | Container memory usage (Working Set) — If there is a large number of file IO and a large number of container _ memory _ cache, the size of container _ memory _ usage _ bytes and container _ memory _ working _ set _ bytes will be different | bytes |
| `rate(container_memory_failures_total{}[3m])` | Container memory allocation failures (per second) |  |
| `container_spec_memory_limit_bytes{image!="", image!~".*pause.*"}` | Container memory limit | bytes |
| `sum(irate(container_network_transmit_bytes_total[3m])) by (namespace, pod) * 8` | Container net sends bits per second | bit/s |
| `sum(irate(container_network_transmit_bytes_total[3m])) by (namespace, pod)` | Container net sends bytes per second | bytes/s |
| `irate(container_network_transmit_packets_total[3m])` | Number of packets sent per second by container net | count |
| `irate(container_network_transmit_packets_dropped_total[3m])` | Number of drop packets sent by container net per second | count |
| `irate(container_network_transmit_errors_total[3m])` | Number of wrong packets sent by container net per second | count |
| `sum(irate(container_network_receive_bytes_total[3m])) by (namespace, pod) * 8` | The amount of bits received by the container net per second | bit/s |
| `sum(irate(container_network_receive_bytes_total[3m])) by (namespace, pod)` | Container net receives bytes per second | bytes/s |
| `irate(container_network_receive_packets_total[3m])` | Number of packets received per second by container net | count |
| `irate(container_network_receive_packets_dropped_total[3m])` | Number of drop packets received by container net per second | count |
| `irate(container_network_receive_errors_total[3m])` | Number of wrong packets received by container net per second | count |
| `container_threads_max{image!="", image!~".*pause.*"}` | The maximum number of threads the container is allowed to run |  |
| `container_ulimits_soft{image!="", image!~".*pause.*"}` | Process No. 1 soft ulimit value in container — Soft ulimit value for process # 1 inside the container. If-1, there is no limit. |  |
| `container_start_time_seconds{image!="", image!~".*pause.*"}` | How long the container has been running | s |
| `container_sockets{image!="", image!~".*pause.*"}` | Number of currently open sockets in the container |  |
| `container_file_descriptors{image!="", image!~".*pause.*"}` | Container Number of currently open file handles |  |
| `container_threads{image!="", image!~".*pause.*"}` | Number of threads currently running in the container |  |
| `container_processes{image!="", image!~".*pause.*"}` | Number of processes currently running in the container |  |
| `container_accelerator_memory_total_bytes` | Container Total GPU Accelerator Available Memory | bytes |
| `container_accelerator_memory_used_bytes` | The amount of GPU accelerator card memory the container is using | bytes |

## Related

- [cAdvisor template source](https://github.com/ccfos/nightingale/tree/main/integrations/cAdvisor): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `cadvisor` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/cadvisor): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
