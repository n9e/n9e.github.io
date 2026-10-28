# Monitor SMART with Nightingale

Runs smartctl to read S.M.A.R.T. health attributes from HDDs, SSDs and NVMe drives, so you see reallocated sectors, temperature and wear before a disk actually dies.

Last reviewed 2026-10-28

S.M.A.R.T. is the self-monitoring built into hard drives and SSDs. The Categraf smart input runs `smartctl` (and the `nvme` tool for NVMe devices) and emits `smart_device` for overall health plus `smart_attribute` for individual attributes: reallocated sectors, pending sectors, temperature, power-on hours, SSD wear and more.

The bundled rules watch the precursors of data loss: failed health checks, growing reallocated-sector counts and high temperature. The host needs smartmontools installed and Categraf needs permission to run smartctl, usually via passwordless sudo.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 20 panels in total
* **6 alert rules**, each with runbook steps
* **14 metric descriptions**
* **Categraf collector config**: `input.smart`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.smart/smart.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.smart started` once the plugin is loaded.

   ```
   # Read metrics from storage devices supporting S.M.A.R.T.

   [[instances]]

       ## Optionally specify the path to the smartctl executable

       # path_smartctl = "/usr/bin/smartctl"



       ## Optionally specify the path to the nvme-cli executable

       # path_nvme = "/usr/bin/nvme"



       ## Optionally specify if vendor specific attributes should be propagated for NVMe disk case

       ## ["auto-on"] - automatically find and enable additional vendor specific disk info

       ## ["vendor1", "vendor2", ...] - e.g. "Intel" enable additional Intel specific disk info

       #  enable_extensions = ["auto-on"]



       ## On most platforms used cli utilities requires root access.

       ## Setting 'use_sudo' to true will make use of sudo to run smartctl or nvme-cli.

       ## Sudo must be configured to allow the telegraf user to run smartctl or nvme-cli

       ## without a password.

       # use_sudo = true



       ## Skip checking disks in this power mode. Defaults to

       ## "standby" to not wake up disks that have stopped rotating.

       ## See --nocheck in the man pages for smartctl.

       ## smartctl version 5.41 and 5.42 have faulty detection of

       ## power mode and might require changing this value to

       ## "never" depending on your disks.

       # nocheck = "standby"



       ## Gather all returned S.M.A.R.T. attribute metrics and the detailed

       ## information from each drive into the 'smart_attribute' measurement.

       # attributes = true



       ## Optionally specify devices to exclude from reporting if disks auto-discovery is performed.

       # excludes = [ "/dev/pass6" ]



       ## Optionally specify devices and device type, if unset

       ## a scan (smartctl --scan and smartctl --scan -d nvme) for S.M.A.R.T. devices will be done

       ## and all found will be included except for the excluded in excludes.

       # devices = [ "/dev/ada0 -d atacam", "/dev/nvme0"]

       # devices = ["dev/nvme0 -d nvme", "/dev/nvme0"]



       ## Timeout for the cli command to complete.

         timeout = "30s"



       ## Optionally call smartctl and nvme-cli with a specific concurrency policy.

       ## By default, smartctl and nvme-cli are called in separate threads (goroutines) to gather disk attributes.

       ## Some devices (e.g. disks in RAID arrays) may have access limitations that require sequential reading of

       ## SMART data - one individual array drive at the time. In such case please set this configuration option

       ## to "sequential" to get readings for all drives.

       ## valid options: concurrent, sequential

       # read_method = "concurrent"
   ```

2. Open the integration center in Nightingale, find SMART, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard           | Panels |
| ------------------- | ------ |
| S.M.A.R.T Dashboard | 20     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

6 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### SMART device health status abnormal[​](#smart-device-health-status-abnormal "Direct link to SMART device health status abnormal")

Disk self-assessed overall health is FAILED, serious failure risk, handle immediately

S1 Critical · for 1 min · Trigger:

```
smart_device_health_ok == 0
```

Runbook:

1. Run smartctl -a /dev/sdX for the full attribute list, focusing on Reallocated\_Sector\_Ct, Current\_Pending\_Sector and Offline\_Uncorrectable;
2. Immediately confirm the data on this disk has a replica or backup — this is the highest priority action;
3. In a RAID array, check the array state and let it evict this disk and rebuild onto a hot spare;
4. Schedule downtime to replace the disk and stop writing to it.

### SSD media wearout >= 90%[​](#ssd-media-wearout--90 "Direct link to SSD media wearout >= 90%")

SSD flash wearout is nearly exhausted and may fail at any time; back up data and replace the drive immediately

S1 Critical · for 1 min · Trigger:

```
smart_attribute_media_wear_percentage >= 90
```

Runbook:

1. Run smartctl -a /dev/sdX and check Media\_Wearout\_Indicator / Percentage\_Used together with Total\_LBAs\_Written;
2. Combine with the write rate to estimate remaining life and plan the replacement window;
3. Confirm the data on this disk has a replica and prepare the migration plan in advance;
4. Review the source of write amplification (log level, frequent small writes, no TRIM) so the replacement does not repeat it.

### Disk temperature exceeds 65 Celsius[​](#disk-temperature-exceeds-65-celsius "Direct link to Disk temperature exceeds 65 Celsius")

Disk operating temperature too high, which accelerates aging or causes outright failure; check cooling immediately

S1 Critical · for 3 min · Trigger:

```
smart_device_temp_c > 65
```

Runbook:

1. Run smartctl -a /dev/sdX and compare the temperature against the vendor's rated maximum;
2. Check chassis airflow, fan speeds and dust in the filters, plus the room's ambient temperature;
3. Check whether the bay layout is too dense and whether neighbouring disks are equally hot;
4. Short term, reduce IO pressure on this disk (shift backups off peak, move hot data) to buy time.

### CRC error count keeps growing within 1 hour[​](#crc-error-count-keeps-growing-within-1-hour "Direct link to CRC error count keeps growing within 1 hour")

Growing CRC failures on the data link, a possible precursor of interface, cable or disk controller failure

S1 Critical · for 60 min · Trigger:

```
increase(smart_attribute_crc_error_count[1h]) > 0
```

Runbook:

1. Run smartctl -a /dev/sdX and check how fast UDMA\_CRC\_Error\_Count is growing;
2. Take the machine down, reseat the SATA/SAS data and power cables, and preferably just replace the cable;
3. After replacing the cable, watch whether the counter stops growing — SMART counters never reset, so judge by the delta, not the absolute value;
4. If a new cable does not help, suspect the backplane or HBA and swap them one at a time.

### SSD erase fail count growing[​](#ssd-erase-fail-count-growing "Direct link to SSD erase fail count growing")

SSD flash block erase failures indicate aging flash chips and a risk of write failures

S1 Critical · for 1 min · Trigger:

```
increase(smart_attribute_erase_fail_count[1h]) > 0
```

Runbook:

1. Run smartctl -a /dev/sdX and check Erase\_Fail\_Count together with the remaining Reallocated/Available\_Reservd\_Space;
2. A shrinking spare block pool means the disk is near end of life — confirm the data has a replica immediately;
3. Schedule a replacement rather than waiting for writes to fail outright;
4. Reduce write pressure on the disk beforehand so it does not degrade faster.

### SSD program fail count growing[​](#ssd-program-fail-count-growing "Direct link to SSD program fail count growing")

SSD flash block program failures; flash chip health is degrading rapidly, back up data immediately

S1 Critical · for 1 min · Trigger:

```
increase(smart_attribute_program_fail_count[1h]) > 0
```

Runbook:

1. Run smartctl -a /dev/sdX and check Program\_Fail\_Count together with the remaining spare block ratio;
2. Immediately confirm the data on this disk has a replica or backup — this is the highest priority action;
3. Schedule a replacement soon: program failures often come with a risk of silent data corruption;
4. Before replacing it, make the disk read-only or move hot data off to stop further writes.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

14 metrics, the ones the dashboards and rules above are built on.

| Metric                                             | Meaning                                                                                                                                                                                                                              | Unit |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| `smart_attribute_crc_error_count`                  | SMART CRC Error Count — The number of Cyclic Redundancy Check (CRC) failures during hard disk data transmission, reflecting the reliability of the data transmission link.                                                           |      |
| `smart_attribute_end_to_end_error_detection_count` | SMART End-to-End Error Detection Count — The number of end-to-end verification failures in internal hard disk data transmission, associated with the health of hard disk firmware or physical storage units.                         |      |
| `smart_attribute_erase_fail_count`                 | SMART Erase Fail Count — The number of failures when a Solid State Drive (SSD) erases flash memory blocks; an excessive number may indicate flash chip aging or an increase in bad blocks.                                           |      |
| `smart_attribute_host_reads`                       | SMART Host Reads Count — The total number of times the operating system reads data from the hard disk, which is a statistical indicator of hard disk usage with no direct fault warning significance.                                |      |
| `smart_attribute_media_wear_percentage`            | SMART Media Wear Percentage — A core indicator dedicated to Solid State Drives (SSDs) that reflects the wear level of flash memory chips; the closer the value is to 100%, the shorter the lifespan.                                 | %    |
| `smart_attribute_pll_lock_loss_count`              | SMART PLL Lock Loss Count — The number of times the hard disk clock synchronization module (Phase-Locked Loop, PLL) loses lock, which can cause data transmission timing errors.                                                     |      |
| `smart_attribute_program_fail_count`               | SMART Program Fail Count — The number of failures when a Solid State Drive (SSD) writes data (program operation) to flash memory blocks, which is a core indicator of flash memory health.                                           |      |
| `smart_attribute_retry_buffer_overflow_count`      | SMART Retry Buffer Overflow Count — The number of times the data buffer overflows when the hard disk automatically retries after a read/write failure, indicating a decline in hard disk read/write performance or hardware failure. |      |
| `smart_attribute_thermal_throttle_status`          | SMART Thermal Throttle Status — The state where the hard disk triggers automatic speed reduction protection due to high temperature (1=triggered, 0=not triggered), which will cause slow read/write speeds after triggering.        |      |
| `smart_attribute_timed_workload_timer`             | SMART Timed Workload Timer — Accumulates the operating time of the hard disk in a preset load mode, used to evaluate the long-term working intensity of the hard disk and assist in judging the wear rate.                           | s    |
| `smart_attribute_wear_leveling_count`              | SMART Wear Leveling Count — An indicator dedicated to Solid State Drives (SSDs) that records the number of executions of the wear leveling algorithm to ensure uniform wear of flash memory blocks and extend lifespan.              |      |
| `smart_device_exit_status`                         | SMART Device Exit Status — The exit status code of the hard disk SMART self-test; 0 means the self-test is completed normally, and a non-zero value indicates self-test interruption or abnormality.                                 |      |
| `smart_device_health_ok`                           | SMART Device Health Status — The overall health status identifier of the hard disk; 1=healthy (no fault warning), 0=unhealthy (potential faults exist).                                                                              |      |
| `smart_device_temp_c`                              | SMART Device Temperature — The current operating temperature of the hard disk (in ℃); the safe operating range for mainstream hard disks is 0-60℃, and prolonged overheating will accelerate hardware aging.                         | ℃    |

## Related[​](#related "Direct link to Related")

* [SMART template source](https://github.com/ccfos/nightingale/tree/main/integrations/SMART): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `smart` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/smart): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
