# Monitor IPMI with Nightingale

Reads out-of-band temperature, fan, voltage, power and sensor state over IPMI, from the local BMC or remote ones.

Last reviewed 2026-10-27

The IPMI input is ported from ipmi\_exporter. It runs a set of FreeIPMI commands and turns the output into metrics: temperatures, fan speeds, voltages, power draw, the health of every sensor and the chassis power state. The data comes from the BMC, so it is still available when the operating system is down.

Collect locally on each server, or point one collector at a list of remote BMC addresses and credentials. IPMI itself must already be configured so that commands such as `ipmimonitoring` return output; otherwise there is nothing to convert.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **3 dashboards**, 31 panels in total
* **4 alert rules**, each with runbook steps
* **19 metric descriptions**
* **Categraf collector config**: `input.ipmi`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.ipmi/conf.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.ipmi started` once the plugin is loaded.

   ```
   # Read metrics from the bare metal servers via freeipmi

   [[instances]]

   # target指定是本地采集还是远程采集

   #target="localhost"

   # 指定采集的用户名和密码，这里务必保证ipmi命令能获取正确输出，不是网上查到一个用户名 密码就可以。

   #user = "user"

   #pass = "1234"



   # ipmi协议版本，支持1.5 和 2.0

   #driver = "LAN_2_0"



   # 指定特权用户名

   #privilege = "user"



   ## session-timeout, ms

   #timeout = 100000



   # 支持的采集器  bmc, bmc-watchdog, ipmi, chassis, dcmi, sel，sm-lan-mode

   # 默认使用 bmc, ipmi, chassis和dcmi，建议保持下列配置便于仪表盘更好的展示

   collectors = [ "bmc", "ipmi", "chassis", "sel", "dcmi"]



   # 不关注的传感器，指定id 排除掉

   #exclude_sensor_ids = [ 2, 29, 32, 50, 52, 55 ]



   # 如果你想使用定制化的参数覆盖内置的命令，可以修改以下内容； 建议保持注释

   #[instances.collector_cmd]

   #ipmi = "sudo"

   #sel = "sudo"

   #[instances.default_args]

   #ipmi = [ "--bridge-sensors" ]

   #[instances.custom_args]

   #ipmi = [ "--bridge-sensors" ]

   #sel = [ "ipmi-sel" ]
   ```

2. Open the integration center in Nightingale, find IPMI, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard           | Panels |
| ------------------- | ------ |
| IPMI                | 12     |
| IPMI by Categraf    | 12     |
| IPMI for Prometheus | 7      |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

4 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### CPU temperature exceeds 90[​](#cpu-temperature-exceeds-90 "Direct link to CPU temperature exceeds 90")

S2 Warning · for 1 min · Trigger:

```
ipmi_cpu1_temp{} > 90 or ipmi_cpu2_temp{} > 90
```

Runbook:

1. Run ipmitool sdr type temperature to see the actual readings and thresholds of each temperature sensor;
2. Check that all chassis fans are spinning (ipmitool sdr type fan) and that filters and heatsinks are not clogged with dust;
3. Confirm the room air conditioning and cold aisle temperature are normal and whether other machines in the same rack are also hot;
4. Short term, reduce load on this machine or move critical workloads off to buy time for a dust-clean or fan replacement.

### Abnormal CPU voltage[​](#abnormal-cpu-voltage "Direct link to Abnormal CPU voltage")

S2 Warning · for 1 min · Trigger:

```
count by (agent_hostname, server) ({__name__=~"ipmi_vcpu[0-9]+", status_code=~"lcr|ucr"}) > 0
```

Runbook:

1. Run ipmitool sdr type voltage to see each voltage sensor's reading against its upper and lower thresholds and which way it deviates;
2. Check the power supply status (ipmitool sdr type 'Power Supply'); on dual-PSU machines confirm whether one feed has failed;
3. Check the power line and PDU output stability, and whether other machines in the same rack are alarming at the same time;
4. If a PSU is confirmed faulty, schedule a replacement and move critical workloads off meanwhile.

### Abnormal fan speed[​](#abnormal-fan-speed "Direct link to Abnormal fan speed")

S2 Warning · for 1 min · Trigger:

```
count by (agent_hostname, server) ({__name__=~"ipmi_fan[0-9]+", status_code=~"lcr|lnc|unc|ucr"}) > 0
```

Runbook:

1. Run ipmitool sdr type fan to see each fan's speed and thresholds and identify the faulty one;
2. A fan reading 0 or far below its peers is almost certainly failed — schedule a replacement;
3. If every fan is running fast, intake temperature or load is too high: check room temperature, dust in the filters and any airflow obstruction;
4. Before swapping fans, run ipmitool sdr type temperature to see whether temperatures have already risen, and move workloads off if needed.

### Motherboard temperature exceeds 90[​](#motherboard-temperature-exceeds-90 "Direct link to Motherboard temperature exceeds 90")

S2 Warning · for 1 min · Trigger:

```
ipmi_system_temp > 90 or ipmi_pch_temp > 90
```

Runbook:

1. Run ipmitool sdr type temperature to identify which sensor is hot and what its threshold is;
2. Check the chassis fans and airflow, especially whether cabling is blocking intake around the motherboard;
3. Confirm the room air conditioning and in-rack temperature, and whether the machine is wedged into an enclosed spot;
4. Clean the dust, tidy the cabling and re-measure; if it still does not drop, contact the vendor to inspect the heatsink assembly.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

19 metrics, the ones the dashboards and rules above are built on.

| Metric                              | Meaning                                                                                                                                      | Unit  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `ipmi_bmc_info`                     | IPMI BMC Info — A constant metric containing information such as BMC firmware revision, manufacturer ID, and system firmware version.        |       |
| `ipmi_chassis_cooling_fault_state`  | IPMI Chassis Cooling Fault State — Indicates the chassis cooling/fan fault state, 1 for no fault, 0 for fault.                               |       |
| `ipmi_chassis_drive_fault_state`    | IPMI Chassis Drive Fault State — Indicates the drive fault state, 1 for no fault, 0 for fault (may be reversed in native Go implementation). |       |
| `ipmi_chassis_power_state`          | IPMI Chassis Power State — Indicates the chassis power state, 1 for power on, 0 for power off.                                               |       |
| `ipmi_current_amperes`              | IPMI Current (Amperes) — Current measured by current sensors, in Amperes.                                                                    | A     |
| `ipmi_current_state`                | IPMI Current Sensor State — State of current sensors, 0 for nominal, 1 for warning, 2 for critical, NaN for N/A.                             |       |
| `ipmi_dcmi_power_consumption_watts` | IPMI DCMI Power Consumption (Watts) — Current power consumption collected via DCMI, in Watts.                                                | W     |
| `ipmi_fan_speed_rpm`                | IPMI Fan Speed (RPM) — Speed measured by fan speed sensors, in rotations per minute.                                                         | RPM   |
| `ipmi_fan_speed_state`              | IPMI Fan Speed Sensor State — State of fan speed sensors, 0 for nominal, 1 for warning, 2 for critical, NaN for N/A.                         |       |
| `ipmi_power_state`                  | IPMI Power Sensor State — State of power sensors, 0 for nominal, 1 for warning, 2 for critical, NaN for N/A.                                 |       |
| `ipmi_scrape_duration_seconds`      | IPMI Scrape Duration (Seconds) — The time taken to retrieve IPMI data, in seconds.                                                           | s     |
| `ipmi_sel_free_space_bytes`         | IPMI SEL Free Space (Bytes) — Free space remaining for new entries in the System Event Log (SEL), in bytes.                                  | bytes |
| `ipmi_sel_logs_count`               | IPMI SEL Logs Count — Total number of event log entries in the System Event Log (SEL).                                                       |       |
| `ipmi_sensor_state`                 | IPMI Sensor State — State of generic unclassified sensors, 0 for nominal, 1 for warning, 2 for critical, NaN for N/A.                        |       |
| `ipmi_temperature_celsius`          | IPMI Temperature (Celsius) — Temperature measured by temperature sensors, in degrees Celsius.                                                | °C    |
| `ipmi_temperature_state`            | IPMI Temperature Sensor State — State of temperature sensors, 0 for nominal, 1 for warning, 2 for critical, NaN for N/A.                     |       |
| `ipmi_up`                           | IPMI Collector Status — Indicates if the specified collector successfully retrieved data from the remote host, 1 for success, 0 for failure. |       |
| `ipmi_up`                           | IPMI Collection Status — Scrape metadata metric. 1 indicates successful collection, 0 indicates failure.                                     |       |
| `ipmi_voltage_state`                | IPMI Voltage Sensor State — State of voltage sensors, 0 for nominal, 1 for warning, 2 for critical, NaN for N/A.                             |       |

## Related[​](#related "Direct link to Related")

* [IPMI template source](https://github.com/ccfos/nightingale/tree/main/integrations/IPMI): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `ipmi` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/ipmi): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
