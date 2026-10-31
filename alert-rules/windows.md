# Windows alert rules for Prometheus: 13 rules with runbooks

13 ready-to-use Windows alert rules in PromQL, each with severity, duration and runbook steps. Metrics from windows\_exporter, Categraf. Download as a Prometheus rules file or import into Nightingale.

Last reviewed 2026-10-31

Windows Server alert rules for high CPU and memory usage, disks that are full or predicted to fill within 4 hours, busy disk IO, inbound and outbound packet loss, an unexpected reboot, and a host whose collector has gone silent. The exporter group uses prometheus-community/windows\_exporter metric names (`windows_*`); the Categraf group covers hosts collected by Categraf on Windows.

## At a glance[​](#at-a-glance "Direct link to At a glance")

* **13 rules**, each with a PromQL condition, a severity, a `for` duration and runbook steps
* **Metrics from**: windows\_exporter, Categraf
* **Download**: [`windows.yml`](https://n9e.github.io/alert-rules/windows.yml), a standard Prometheus rules file (`groups:` format), checked with `promtool check rules`
* Thresholds are starting points. Adjust them to your environment before enabling the rules.

## Rule list[​](#rule-list "Direct link to Rule list")

| Rule                                                                     | Severity | For |
| ------------------------------------------------------------------------ | -------- | --- |
| High CPU utilization - exporter                                          | Warning  | 1m  |
| High memory usage rate - exporter                                        | Warning  | 1m  |
| machine reboot in the last 15 minutes - exporter                         | Info     | 1m  |
| packet loss issue in the inbound direction - exporter                    | Warning  | 1m  |
| packet loss issue in the outbound direction - exporter                   | Warning  | 1m  |
| The hard disk is almost full - exporter                                  | Critical | 1m  |
| Hard disk - expected to be written full in 4 hours - categraf \[Windows] | Critical | 1m  |
| Hard disk - IO is a bit busy - categraf \[Windows]                       | Warning  | 1m  |
| Machine load - high memory, please pay attention - categraf\[Windows]    | Info     | 1m  |
| packet loss in the inbound direction - categraf\[Windows]                | Info     | 1m  |
| packet loss in the outbound direction - categraf \[Windows]              | Info     | 1m  |
| Disk larger than 200G is running out of space \[Windows]                 | Info     | 1m  |
| Disk smaller than 200G is running out of space \[Windows]                | Info     | 1m  |

## Prometheus exporter (6)[​](#prometheus-exporter-6 "Direct link to Prometheus exporter (6)")

### High CPU utilization - exporter[​](#high-cpu-utilization---exporter "Direct link to High CPU utilization - exporter")

Warning · 1m · Trigger:

```
100 * sum by (instance) (rate(windows_cpu_time_total{mode != 'idle'}[5m])) / count by (instance) (windows_cpu_core_frequency_mhz) > 80
```

Runbook:

1. Open Task Manager, or run Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 to find the busiest processes;
2. Use Resource Monitor (resmon) to see whether user or kernel time dominates — high kernel time points at drivers or antivirus;
3. Tell traffic growth apart from a program fault (infinite loop, frequent GC);
4. For growth, scale out or rate limit; for a fault, restart the service and fix it.

### High memory usage rate - exporter[​](#high-memory-usage-rate---exporter "Direct link to High memory usage rate - exporter")

Warning · 1m · Trigger:

```
100 * (windows_cs_physical_memory_bytes - windows_os_physical_memory_free_bytes) / windows_cs_physical_memory_bytes  > 80
```

Runbook:

1. Run Get-Process | Sort-Object WS -Descending | Select-Object -First 10 to find the largest consumers;
2. Use perfmon to watch Available MBytes and Pages/sec — a sustained high Pages/sec means it is already paging heavily;
3. Determine whether it is growth or a process leak — a leak must be located in the application, a restart only helps temporarily;
4. Confirm the page file is sized sensibly and add memory if needed.

### machine reboot in the last 15 minutes - exporter[​](#machine-reboot-in-the-last-15-minutes---exporter "Direct link to machine reboot in the last 15 minutes - exporter")

Info · 1m · Trigger:

```
time() - windows_system_system_up_time  < 900
```

Runbook:

1. Run Get-EventLog -LogName System -Newest 50, or use Event Viewer to look for Event ID 6008 (unexpected shutdown) and 1074 (planned shutdown and its initiator) to find the cause;
2. If Windows Update triggered it, evaluate adjusting the update window and restart policy;
3. If it was a bugcheck or power loss, check the minidump and hardware logs;
4. Confirm critical services started automatically after the reboot (check startup type with Get-Service).

### packet loss issue in the inbound direction - exporter[​](#packet-loss-issue-in-the-inbound-direction---exporter "Direct link to packet loss issue in the inbound direction - exporter")

Warning · 1m · Trigger:

```
100 * rate(windows_net_packets_received_errors[5m]) / (rate(windows_net_packets_received_errors[5m]) + rate(windows_net_packets_received_total[5m])>0)  > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm inbound error counters are growing;
2. Use Get-NetAdapter to confirm the negotiated speed and duplex match the peer;
3. Check the cable/optical module, swapping the cable or port to cross-check;
4. Update the NIC driver and ask the network team for the switch port's error counters.

### packet loss issue in the outbound direction - exporter[​](#packet-loss-issue-in-the-outbound-direction---exporter "Direct link to packet loss issue in the outbound direction - exporter")

Warning · 1m · Trigger:

```
100 * rate(windows_net_packets_outbound_errors[5m]) / (rate(windows_net_packets_outbound_errors[5m]) + rate(windows_net_packets_sent_total[5m])>0)  > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm outbound error counters are growing;
2. Use Get-NetAdapter to confirm speed and duplex match the peer;
3. Check the cable/optical module and cross-check by swapping;
4. Update the NIC driver and confirm whether the link is saturated and needs more bandwidth.

### The hard disk is almost full - exporter[​](#the-hard-disk-is-almost-full---exporter "Direct link to The hard disk is almost full - exporter")

Critical · 1m · Trigger:

```
100 * (windows_logical_disk_size_bytes - windows_logical_disk_free_bytes) / windows_logical_disk_size_bytes  > 90
```

Runbook:

1. Identify the drive letter with Get-PSDrive or Explorer;
2. Use a tool like TreeSize, or Get-ChildItem -Recurse | Sort-Object Length -Descending | Select-Object -First 20, to find the large files;
3. Start with logs, temporary files (cleanmgr) and the Windows Update cache (C:\Windows\SoftwareDistribution\Download);
4. Longer term, expand the disk or move the data directory to another volume.

## Categraf (7)[​](#categraf-7 "Direct link to Categraf (7)")

For hosts and instances collected by Categraf; metric names follow Categraf plugins.

### Hard disk - expected to be written full in 4 hours - categraf \[Windows][​](#hard-disk---expected-to-be-written-full-in-4-hours---categraf-windows "Direct link to Hard disk - expected to be written full in 4 hours - categraf \[Windows]")

Critical · 1m · Trigger:

```
predict_linear(disk_free{platform=~"windows"}[1h], 4*3600) < 0
```

Runbook:

1. Identify the drive letter in Explorer or with Get-PSDrive;
2. Run Get-ChildItem \<drive>:\ -Recurse -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20 to find the fastest-growing large files;
3. Start with logs, temporary files (run cleanmgr) and the Windows Update cache at C:\Windows\SoftwareDistribution\Download;
4. Confirm whether something abnormal is writing (an application looping on logs, backups piling up) — without fixing the root cause, cleanup only buys time.

### Hard disk - IO is a bit busy - categraf \[Windows][​](#hard-disk---io-is-a-bit-busy---categraf-windows "Direct link to Hard disk - IO is a bit busy - categraf \[Windows]")

Warning · 1m · Trigger:

```
rate(diskio_io_time{platform=~"windows"}[1m])/10 > 99
```

Runbook:

1. Open Resource Monitor (resmon), go to the Disk tab and sort by response time to see which disk and which file;
2. Run Get-Counter '\PhysicalDisk(\*)\Avg. Disk sec/Transfer' to check average response time;
3. Use Resource Monitor to find the process doing the most IO — usually a database, a backup job or an antivirus full scan;
4. Move deferrable work off peak; if the load is sustained, consider SSDs or spreading the data.

### Machine load - high memory, please pay attention - categraf\[Windows][​](#machine-load---high-memory-please-pay-attention---categrafwindows "Direct link to Machine load - high memory, please pay attention - categraf\[Windows]")

Info · 1m · Trigger:

```
mem_available_percent{platform=~"windows"} < 25



mem_available_percent{platform=~"windows"} < 15



mem_available_percent{platform=~"windows"} < 5
```

Runbook:

1. Run Get-Process | Sort-Object WS -Descending | Select-Object -First 10 to find the largest consumers;
2. Use perfmon to watch Available MBytes and Pages/sec — a sustained high Pages/sec means it is already paging heavily;
3. Determine whether it is growth or a process leak — a leak must be located in the application, a restart only helps temporarily;
4. Confirm the page file is sized sensibly and add memory if needed.

### packet loss in the inbound direction - categraf\[Windows][​](#packet-loss-in-the-inbound-direction---categrafwindows "Direct link to packet loss in the inbound direction - categraf\[Windows]")

Info · 1m · Trigger:

```
increase(net_drop_in{platform=~"windows"}[1m]) > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm inbound discard and error counters are growing;
2. Use Get-NetAdapterAdvancedProperty to check the Receive Buffers setting and raise it if it is small;
3. Use Get-NetAdapter to confirm the negotiated speed and duplex match the peer;
4. Update the NIC driver and ask the network team for the switch port's drop counters.

### packet loss in the outbound direction - categraf \[Windows][​](#packet-loss-in-the-outbound-direction---categraf-windows "Direct link to packet loss in the outbound direction - categraf \[Windows]")

Info · 1m · Trigger:

```
increase(net_drop_out{platform=~"windows"}[1m]) > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm outbound discard and error counters are growing;
2. Use Get-NetAdapterAdvancedProperty to check the Transmit Buffers setting;
3. Check whether the link is saturated (Resource Monitor's Network tab) — if so throttle or add bandwidth;
4. Update the NIC driver and check the peer switch port state.

### Disk larger than 200G is running out of space \[Windows][​](#disk-larger-than-200g-is-running-out-of-space-windows "Direct link to Disk larger than 200G is running out of space \[Windows]")

Info · 1m · Trigger:

```
disk_free{platform=~"windows"}/1024/1024/1024 < 20 and disk_total{platform=~"windows"}/1024/1024/1024 >= 200



disk_free{platform=~"windows"}/1024/1024/1024 < 10 and disk_total{platform=~"windows"}/1024/1024/1024 >= 200



disk_free{platform=~"windows"}/1024/1024/1024 < 2 and disk_total{platform=~"windows"}/1024/1024/1024 >= 200
```

Runbook:

1. Run Get-PSDrive to confirm the drive letter and free space;
2. Use a tool like TreeSize, or Get-ChildItem \<drive>:\ -Recurse -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20, to find the largest files and directories;
3. Clean up logs and expired data, and tier cold data off data disks per the business archiving policy;
4. Evaluate whether to expand the disk or move the data directory to another volume.

### Disk smaller than 200G is running out of space \[Windows][​](#disk-smaller-than-200g-is-running-out-of-space-windows "Direct link to Disk smaller than 200G is running out of space \[Windows]")

Info · 1m · Trigger:

```
disk_used_percent{platform=~"windows"} > 90 and disk_total{platform=~"windows"}/1024/1024/1024 < 200



disk_used_percent{platform=~"windows"} > 95 and disk_total{platform=~"windows"}/1024/1024/1024 < 200



disk_used_percent{platform=~"windows"} > 99 and disk_total{platform=~"windows"}/1024/1024/1024 < 200
```

Runbook:

1. Run Get-PSDrive to confirm the drive letter and free space;
2. On a system disk the usual consumers are the Windows Update cache (C:\Windows\SoftwareDistribution\Download), the hibernation file hiberfil.sys and the page file;
3. Run cleanmgr /sdclean for disk cleanup, and powercfg /h off to disable hibernation and reclaim space if appropriate;
4. Longer term, expand the disk or move large data directories to another volume.

## How to use these rules[​](#how-to-use-these-rules "Direct link to How to use these rules")

* **With Prometheus or vmalert**: download [`windows.yml`](https://n9e.github.io/alert-rules/windows.yml), add it to `rule_files` (or `-rule` for vmalert), check the metric names against your exporter version, and tune thresholds. Severity is set as a `severity` label (critical / warning / info), and `runbook_url` points back to this page.
* **With Nightingale**: the same rules ship in the [Windows](https://n9e.github.io/integrations/windows.md) integration template. Open the integration center, [import the rules into a business group](https://n9e.github.io/docs/data/integrations/import.md), and enable them one by one. Nightingale keeps the runbook with each alert and can evaluate the rules against Prometheus, VictoriaMetrics and other data sources.

## Sources and license[​](#sources-and-license "Direct link to Sources and license")

The runbook steps and the remaining rules come from Nightingale's integration templates ([Windows](https://github.com/ccfos/nightingale/tree/main/integrations/Windows), Apache-2.0). Corrections are welcome as pull requests there.

## Related[​](#related "Direct link to Related")

* [Monitor Windows with Nightingale](https://n9e.github.io/integrations/windows.md): collector config, dashboards and metric reference
* [Write a metric rule in Nightingale](https://n9e.github.io/docs/alerting/metric-rules.md)
* [All alert rules](https://n9e.github.io/alert-rules.md)
