# Monitor Windows with Nightingale

Categraf reports the same metric names on Windows as on Linux, so host dashboards and rules carry over; extra dashboards cover AD, DNS and ADFS via windows\_exporter.

Last reviewed 2026-10-28

Categraf runs on Windows too, and the basic CPU, memory, disk and network metrics keep the same names as on Linux. Host-level alert rules and dashboards therefore do not need a separate Windows edition.

The template also ships a set of dashboards written against windows\_exporter metric names, covering Windows Server itself plus Active Directory, DNS and ADFS. Import the "by Categraf" dashboard if you collect with Categraf, or the "exporter" set if you run windows\_exporter.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **6 dashboards**, 203 panels in total
* **14 alert rules**, each with runbook steps

## How to connect[​](#how-to-connect "Direct link to How to connect")

Categraf installs as a Windows service; see [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md). The basic inputs are on by default, so no Windows-specific collector config is needed. For windows\_exporter, scrape `http://<host>:9182/metrics` with the Categraf `prometheus` input, or [add your existing Prometheus as a data source](https://n9e.github.io/docs/data/prometheus.md).

1. Open the integration center in Nightingale, find Windows, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                            | Panels |
| ------------------------------------ | ------ |
| Active Directory Federation Services | 53     |
| Active Directory                     | 67     |
| DNS                                  | 18     |
| Windows Server                       | 21     |
| Windows Host by Categraf             | 24     |
| Windows - exporter                   | 20     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

14 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (8)[​](#collected-by-categraf-8 "Direct link to Collected by Categraf (8)")

#### Hard disk - expected to be written full in 4 hours - categraf \[Windows][​](#hard-disk---expected-to-be-written-full-in-4-hours---categraf-windows "Direct link to Hard disk - expected to be written full in 4 hours - categraf \[Windows]")

S1 Critical · for 1 min · Trigger:

```
predict_linear(disk_free{platform=~"windows"}[1h], 4*3600) < 0
```

Runbook:

1. Identify the drive letter in Explorer or with Get-PSDrive;
2. Run Get-ChildItem \<drive>:\ -Recurse -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20 to find the fastest-growing large files;
3. Start with logs, temporary files (run cleanmgr) and the Windows Update cache at C:\Windows\SoftwareDistribution\Download;
4. Confirm whether something abnormal is writing (an application looping on logs, backups piling up) — without fixing the root cause, cleanup only buys time.

#### Hard disk - IO is a bit busy - categraf \[Windows][​](#hard-disk---io-is-a-bit-busy---categraf-windows "Direct link to Hard disk - IO is a bit busy - categraf \[Windows]")

S2 Warning · for 1 min · Trigger:

```
rate(diskio_io_time{platform=~"windows"}[1m])/10 > 99
```

Runbook:

1. Open Resource Monitor (resmon), go to the Disk tab and sort by response time to see which disk and which file;
2. Run Get-Counter '\PhysicalDisk(\*)\Avg. Disk sec/Transfer' to check average response time;
3. Use Resource Monitor to find the process doing the most IO — usually a database, a backup job or an antivirus full scan;
4. Move deferrable work off peak; if the load is sustained, consider SSDs or spreading the data.

#### Lost connection with monitoring target - categraf \[Windows][​](#lost-connection-with-monitoring-target---categraf-windows "Direct link to Lost connection with monitoring target - categraf \[Windows]")

Trigger:

```
```

Runbook:

1. First confirm the machine itself is alive (ping, Remote Desktop) — if it is down, handle it as a host outage;
2. If it is alive, run Get-Service categraf to check the service state and Start-Service categraf if it is stopped;
3. Check the logs under the categraf log directory — the usual causes are a config error or network/auth failure to the server;
4. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

#### Machine load - high memory, please pay attention - categraf\[Windows][​](#machine-load---high-memory-please-pay-attention---categrafwindows "Direct link to Machine load - high memory, please pay attention - categraf\[Windows]")

S3 Info · for 1 min · Trigger:

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

#### packet loss in the inbound direction - categraf\[Windows][​](#packet-loss-in-the-inbound-direction---categrafwindows "Direct link to packet loss in the inbound direction - categraf\[Windows]")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_in{platform=~"windows"}[1m]) > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm inbound discard and error counters are growing;
2. Use Get-NetAdapterAdvancedProperty to check the Receive Buffers setting and raise it if it is small;
3. Use Get-NetAdapter to confirm the negotiated speed and duplex match the peer;
4. Update the NIC driver and ask the network team for the switch port's drop counters.

#### packet loss in the outbound direction - categraf \[Windows][​](#packet-loss-in-the-outbound-direction---categraf-windows "Direct link to packet loss in the outbound direction - categraf \[Windows]")

S3 Info · for 1 min · Trigger:

```
increase(net_drop_out{platform=~"windows"}[1m]) > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm outbound discard and error counters are growing;
2. Use Get-NetAdapterAdvancedProperty to check the Transmit Buffers setting;
3. Check whether the link is saturated (Resource Monitor's Network tab) — if so throttle or add bandwidth;
4. Update the NIC driver and check the peer switch port state.

#### Disk larger than 200G is running out of space \[Windows][​](#disk-larger-than-200g-is-running-out-of-space-windows "Direct link to Disk larger than 200G is running out of space \[Windows]")

S3 Info · for 1 min · Trigger:

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

#### Disk smaller than 200G is running out of space \[Windows][​](#disk-smaller-than-200g-is-running-out-of-space-windows "Direct link to Disk smaller than 200G is running out of space \[Windows]")

S3 Info · for 1 min · Trigger:

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

### Collected by an exporter (6)[​](#collected-by-an-exporter-6 "Direct link to Collected by an exporter (6)")

#### High CPU utilization - exporter[​](#high-cpu-utilization---exporter "Direct link to High CPU utilization - exporter")

S2 Warning · for 1 min · Trigger:

```
100 * sum by (instance) (rate(windows_cpu_time_total{mode != 'idle'}[5m])) / count by (instance) (windows_cpu_core_frequency_mhz) > 80
```

Runbook:

1. Open Task Manager, or run Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 to find the busiest processes;
2. Use Resource Monitor (resmon) to see whether user or kernel time dominates — high kernel time points at drivers or antivirus;
3. Tell traffic growth apart from a program fault (infinite loop, frequent GC);
4. For growth, scale out or rate limit; for a fault, restart the service and fix it.

#### High memory usage rate - exporter[​](#high-memory-usage-rate---exporter "Direct link to High memory usage rate - exporter")

S2 Warning · for 1 min · Trigger:

```
100 * (windows_cs_physical_memory_bytes - windows_os_physical_memory_free_bytes) / windows_cs_physical_memory_bytes  > 80
```

Runbook:

1. Run Get-Process | Sort-Object WS -Descending | Select-Object -First 10 to find the largest consumers;
2. Use perfmon to watch Available MBytes and Pages/sec — a sustained high Pages/sec means it is already paging heavily;
3. Determine whether it is growth or a process leak — a leak must be located in the application, a restart only helps temporarily;
4. Confirm the page file is sized sensibly and add memory if needed.

#### machine reboot in the last 15 minutes - exporter[​](#machine-reboot-in-the-last-15-minutes---exporter "Direct link to machine reboot in the last 15 minutes - exporter")

S3 Info · for 1 min · Trigger:

```
time() - windows_system_system_up_time  < 900
```

Runbook:

1. Run Get-EventLog -LogName System -Newest 50, or use Event Viewer to look for Event ID 6008 (unexpected shutdown) and 1074 (planned shutdown and its initiator) to find the cause;
2. If Windows Update triggered it, evaluate adjusting the update window and restart policy;
3. If it was a bugcheck or power loss, check the minidump and hardware logs;
4. Confirm critical services started automatically after the reboot (check startup type with Get-Service).

#### packet loss issue in the inbound direction - exporter[​](#packet-loss-issue-in-the-inbound-direction---exporter "Direct link to packet loss issue in the inbound direction - exporter")

S2 Warning · for 1 min · Trigger:

```
100 * rate(windows_net_packets_received_errors[5m]) / (rate(windows_net_packets_received_errors[5m]) + rate(windows_net_packets_received_total[5m])>0)  > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm inbound error counters are growing;
2. Use Get-NetAdapter to confirm the negotiated speed and duplex match the peer;
3. Check the cable/optical module, swapping the cable or port to cross-check;
4. Update the NIC driver and ask the network team for the switch port's error counters.

#### packet loss issue in the outbound direction - exporter[​](#packet-loss-issue-in-the-outbound-direction---exporter "Direct link to packet loss issue in the outbound direction - exporter")

S2 Warning · for 1 min · Trigger:

```
100 * rate(windows_net_packets_outbound_errors[5m]) / (rate(windows_net_packets_outbound_errors[5m]) + rate(windows_net_packets_sent_total[5m])>0)  > 0
```

Runbook:

1. Run Get-NetAdapterStatistics to confirm outbound error counters are growing;
2. Use Get-NetAdapter to confirm speed and duplex match the peer;
3. Check the cable/optical module and cross-check by swapping;
4. Update the NIC driver and confirm whether the link is saturated and needs more bandwidth.

#### The hard disk is almost full - exporter[​](#the-hard-disk-is-almost-full---exporter "Direct link to The hard disk is almost full - exporter")

S1 Critical · for 1 min · Trigger:

```
100 * (windows_logical_disk_size_bytes - windows_logical_disk_free_bytes) / windows_logical_disk_size_bytes  > 90
```

Runbook:

1. Identify the drive letter with Get-PSDrive or Explorer;
2. Use a tool like TreeSize, or Get-ChildItem -Recurse | Sort-Object Length -Descending | Select-Object -First 20, to find the large files;
3. Start with logs, temporary files (cleanmgr) and the Windows Update cache (C:\Windows\SoftwareDistribution\Download);
4. Longer term, expand the disk or move the data directory to another volume.

## Related[​](#related "Direct link to Related")

* [Windows template source](https://github.com/ccfos/nightingale/tree/main/integrations/Windows): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
