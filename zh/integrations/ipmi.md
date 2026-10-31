# 用夜莺监控 IPMI

通过 IPMI 读取服务器带外的温度、风扇、电压、电源和传感器状态，本地或远程 BMC 都能采。

最后校对于 2026-10-31

IPMI 插件从 ipmi\_exporter 移植而来，原理是执行 FreeIPMI 的一系列命令并把输出转换成指标：温度、风扇转速、电压、功耗、各传感器的健康状态，以及机箱电源状态。这些数据来自 BMC，操作系统挂了也能读到。

可以在服务器本机采集，也可以在一台采集机上配置多个远端 BMC 的地址和账号集中采集。前提是 IPMI 本身已经配置正确、`ipmimonitoring` 这类命令能拿到输出，否则插件没有数据可转。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **3 张仪表盘**，共 31 个面板
* **4 条告警规则**，每条附处置步骤
* **19 条指标说明**
* **Categraf 采集配置**：`input.ipmi`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，把下面的配置放到 `conf/input.ipmi/conf.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.ipmi started` 就说明插件已加载。

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

2. 在夜莺「集成中心」里找到 IPMI，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘              | 面板数 |
| ------------------- | ------ |
| IPMI                | 12     |
| IPMI by Categraf    | 12     |
| IPMI for Prometheus | 7      |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 4 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### CPU温度超过90[​](#cpu温度超过90 "CPU温度超过90的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
ipmi_cpu1_temp{} > 90 or ipmi_cpu2_temp{} > 90
```

处置步骤:

1. 用 ipmitool sdr type temperature 确认各温度传感器的实际读数与门限；
2. 检查机箱风扇是否全部正常转动（ipmitool sdr type fan）、滤网与散热片是否积灰；
3. 确认机房空调与冷通道温度是否正常，同机柜其他机器是否同样高温；
4. 短期可降低该机负载或迁走关键业务，为停机除尘/换风扇争取时间。

### CPU电压异常[​](#cpu电压异常 "CPU电压异常的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
count by (agent_hostname, server) ({__name__=~"ipmi_vcpu[0-9]+", status_code=~"lcr|ucr"}) > 0
```

处置步骤:

1. 用 ipmitool sdr type voltage 看各电压传感器的读数与上下门限，确认偏离方向；
2. 检查电源模块状态（ipmitool sdr type 'Power Supply'），双电源机型确认是否有一路失效；
3. 检查供电线路与 PDU 输出是否稳定，同机柜是否有其他机器同时报警；
4. 确认为电源模块故障的安排更换，期间把关键业务迁走。

### 风扇转速异常[​](#风扇转速异常 "风扇转速异常的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
count by (agent_hostname, server) ({__name__=~"ipmi_fan[0-9]+", status_code=~"lcr|lnc|unc|ucr"}) > 0
```

处置步骤:

1. 用 ipmitool sdr type fan 看每个风扇的转速与门限，定位是哪一颗异常；
2. 转速为 0 或远低于同型号其他风扇的，基本可判定风扇故障，安排更换；
3. 全部风扇都在高转速则说明进风温度或负载过高，检查机房温度、滤网积灰与风道遮挡；
4. 换风扇前先用 ipmitool sdr type temperature 确认温度是否已经上来，必要时先迁走业务。

### 主板温度超过90[​](#主板温度超过90 "主板温度超过90的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
ipmi_system_temp > 90 or ipmi_pch_temp > 90
```

处置步骤:

1. 用 ipmitool sdr type temperature 确认是哪个传感器高温及其门限；
2. 检查机箱风扇与风道，重点看主板区域是否有线缆遮挡进风；
3. 确认机房空调与机柜内温度，以及机器是否被塞在密闭位置；
4. 除尘并整理线缆后复测，仍不下降则联系厂商检查散热组件。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 19 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                | 含义                                                                                     | 单位  |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ----- |
| `ipmi_bmc_info`                     | IPMI BMC 信息 — 包含BMC固件版本、制造商ID、系统固件版本等信息的常量指标。                |       |
| `ipmi_chassis_cooling_fault_state`  | IPMI 机箱冷却故障状态 — 机箱冷却/风扇故障状态，1为无故障，0为有故障。                    |       |
| `ipmi_chassis_drive_fault_state`    | IPMI 机箱磁盘故障状态 — 磁盘故障状态，1为无故障，0为有故障。                             |       |
| `ipmi_chassis_power_state`          | IPMI 机箱电源状态 — 表示机箱电源状态，1为电源开启，0为电源关闭。                         |       |
| `ipmi_current_amperes`              | IPMI 电流（安培） — 电流传感器测量的电流值，单位为安培。                                 | A     |
| `ipmi_current_state`                | IPMI 电流传感器状态 — 电流传感器的状态，0为正常，1为警告，2为临界，NaN为不可用。         |       |
| `ipmi_dcmi_power_consumption_watts` | IPMI DCMI 功率消耗（瓦特） — 通过DCMI收集的当前功率消耗值，单位为瓦特。                  | W     |
| `ipmi_fan_speed_rpm`                | IPMI 风扇转速（转/分钟） — 风扇转速传感器测量的转速值，单位为转/分钟。                   | RPM   |
| `ipmi_fan_speed_state`              | IPMI 风扇转速传感器状态 — 风扇转速传感器的状态，0为正常，1为警告，2为临界，NaN为不可用。 |       |
| `ipmi_power_state`                  | IPMI 功率传感器状态 — 功率传感器的状态，0为正常，1为警告，2为临界，NaN为不可用。         |       |
| `ipmi_scrape_duration_seconds`      | IPMI 抓取持续时间（秒） — 抓取IPMI数据所花费的时间，单位为秒。                           | s     |
| `ipmi_sel_free_space_bytes`         | IPMI SEL 剩余空间（字节） — 系统事件日志（SEL）的剩余可用空间，单位为字节。              | bytes |
| `ipmi_sel_logs_count`               | IPMI SEL 日志数量 — 系统事件日志（SEL）中的事件日志条目总数。                            |       |
| `ipmi_sensor_state`                 | IPMI 传感器状态 — 未明确分类的通用传感器的状态，0为正常，1为警告，2为临界，NaN为不可用。 |       |
| `ipmi_temperature_celsius`          | IPMI 温度（摄氏度） — 温度传感器测量的温度值，单位为摄氏度。                             | °C    |
| `ipmi_temperature_state`            | IPMI 温度传感器状态 — 温度传感器的状态，0为正常，1为警告，2为临界，NaN为不可用。         |       |
| `ipmi_up`                           | IPMI 收集器状态 — 指示指定收集器是否成功从远程主机获取数据，1为成功，0为失败。           |       |
| `ipmi_up`                           | IPMI 采集状态 — 抓取元数据指标，1表示抓取成功，0表示失败。                               |       |
| `ipmi_voltage_state`                | IPMI 电压传感器状态 — 电压传感器的状态，0为正常，1为警告，2为临界，NaN为不可用。         |       |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[IPMI 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/IPMI）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/IPMI%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `ipmi` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/ipmi)：完整配置项和指标列表。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
