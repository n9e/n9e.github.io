# 用夜莺通过 SNMP 监控网络设备

配置 OID 就能采任意网络设备，还能把 OID 的值当标签用；模板带 Cisco、Juniper 和通用交换机的仪表盘与几十条规则。

最后校对于 2026-10-28

Categraf 从 v0.2.13 起集成了 Telegraf 的 snmp 插件。核心逻辑是：要采什么指标，配置对应的 OID；`[[instances.field]]` 采单个值，`[[instances.table]]` 按表采多行，表里的某些 OID（比如接口名）可以作为标签。通用 OID（接口流量、错误、状态）对绝大多数设备都有效，CPU、内存这类私有 OID 则按厂商和型号配置。

模板带通用交换机状态汇总、设备流量视图、接入交换机、Cisco 和 Juniper 设备详情几张仪表盘，规则覆盖接口 down、流量逼近带宽、错包与丢包、CPU 与内存过高、设备不可达。需要为不同型号积累配置时，模板目录里的 `Cisco.toml` 是个起点。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **9 张仪表盘**，共 74 个面板
* **37 条告警规则**，每条附处置步骤
* **5 条指标说明**
* **Categraf 采集配置**：`input.snmp`

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

1. [安装 Categraf](https://n9e.github.io/zh/docs/data/categraf/install.md)，按需启用下面的插件。每个配置放到对应的 `conf/input.<插件名>/` 目录，改好地址和凭据后重启 Categraf。

   `conf/input.snmp/Cisco.toml`

   ```
   [[instances]]



   agents = ["udp://127.0.0.1"]



   timeout = "5s"



   version = 2



   ## Path to mib files

   ## Used by the gosmi translator.

   ## To add paths when translating with netsnmp, use the MIBDIRS environment variable

   ##path = ["/usr/share/snmp/DCN"]

   ##translator = "gosmi"



   community = "public"



   agent_host_tag = "DCN"



   retries = 3



   max_repetitions = 100



   ##运行时间

   [[instances.field]]

   oid = "1.3.6.1.2.1.1.3.0"

   name = "sys_uptime"

   conversion = "float(2)"



   [[instances.field]]

   oid = "1.3.6.1.4.1.6339.100.1.11.10.0"

   name = "cpu_usage"



   [[instances.field]]

   oid = "1.3.6.1.4.1.6339.100.1.11.6.0"

   name = "mem_max"



   [[instances.field]]

   oid = "1.3.6.1.4.1.6339.100.1.11.7.0"

   name = "mem_use"



   #端口总和

   [[instances.field]]

   name = "TotalPorts"

   oid = "1.3.6.1.4.1.6339.100.3.1.0"



   ##设备名称

   [[instances.field]]

   oid = "1.3.6.1.2.1.1.5.0"

   name = "sys_name"

   is_tag = true



   ##产品型号

   [[instances.field]]

   name = "sys_pm"

   oid = "1.3.6.1.4.1.6339.100.25.1.1.1.0"

   is_tag = true



   #本机IP

   [[instances.field]]

   name = "LocalIP"

   oid = "1.3.6.1.2.1.4.20.1.1"

   is_tag = true



   #接口表信息

   [[instances.table]]

   name = "interface"

   inherit_tags = ["sys_name","sys_pm","LocalIP"]



   #各个端口

   [[instances.table.field]]

   name = "ifDescr"

   oid = "1.3.6.1.2.1.2.2.1.2"

   is_tag = true



   [[instances.table.field]]

   name = "ifSpeed"

   oid = "1.3.6.1.2.1.2.2.1.5"

   conversion = "float(6)"

   #is_tag = true



   [[instances.table.field]]

   name = "ifOperStatus"

   oid = "1.3.6.1.2.1.2.2.1.8"

   #is_tag = true



   [[instances.table.field]]

   name = "ifOutOctets"

   oid = "1.3.6.1.2.1.2.2.1.16"



   [[instances.table.field]]

   name = "ifInOctets"

   oid = "1.3.6.1.2.1.2.2.1.10"



   #聚合状态

   #oid = "1.3.6.1.4.1.6339.100.14.2.1.4.1.1.*"



   #聚合端口

   #oid = "1.3.6.1.4.1.6339.100.14.3.1.2"
   ```

   `conf/input.snmp/snmp.toml`

   ```
   # Retrieves SNMP values from remote agents

   [[instances]]

   ## Agent addresses to retrieve values from.

   ##   format:  agents = ["<scheme://><hostname>:<port>"]

   ##   scheme:  optional, either udp, udp4, udp6, tcp, tcp4, tcp6.

   ##            default is udp

   ##   port:    optional

   ##   example: agents = ["udp://127.0.0.1:161"]

   ##            agents = ["tcp://127.0.0.1:161"]

   ##            agents = ["udp4://v4only-snmp-agent"]

   #agents = ["udp://127.0.0.1:161"]

   agents = [

       #

   ]



   ## Timeout for each request.

   # timeout = "5s"



   ## SNMP version; can be 1, 2, or 3.

   # version = 2



   ## Unconnected UDP socket

   ## When true, SNMP responses are accepted from any address not just

   ## the requested address. This can be useful when gathering from

   ## redundant/failover systems.

   # unconnected_udp_socket = false



   ## Path to mib files

   ## Used by the gosmi translator.

   ## To add paths when translating with netsnmp, use the MIBDIRS environment variable

   # path = ["/usr/share/snmp/mibs"]



   ## SNMP community string.

   # community = "public"



   ## Agent host tag

   # agent_host_tag = "agent_host"



   ## Number of retries to attempt.

   # retries = 3



   ## The GETBULK max-repetitions parameter.

   # max_repetitions = 10



   ## SNMPv3 authentication and encryption options.

   ##

   ## Security Name.

   # sec_name = "myuser"

   ## Authentication protocol; one of "MD5", "SHA", "SHA224", "SHA256", "SHA384", "SHA512" or "".

   # auth_protocol = "MD5"

   ## Authentication password.

   # auth_password = "pass"

   ## Security Level; one of "noAuthNoPriv", "authNoPriv", or "authPriv".

   # sec_level = "authNoPriv"

   ## Context Name.

   # context_name = ""

   ## Privacy protocol used for encrypted messages; one of "DES", "AES", "AES192", "AES192C", "AES256", "AES256C", or "".

   ### Protocols "AES192", "AES192", "AES256", and "AES256C" require the underlying net-snmp tools

   ### to be compiled with --enable-blumenthal-aes (http://www.net-snmp.org/docs/INSTALL.html)

   # priv_protocol = ""

   ## Privacy password used for encrypted messages.

   # priv_password = ""



   ## Add fields and tables defining the variables you wish to collect.  This

   ## example collects the system uptime and interface variables.  Reference the

   ## full plugin documentation for configuration details.



   #[[instances.field]]

   #oid = "RFC1213-MIB::sysUpTime.0"

   #name = "uptime"



   #[[instances.field]]

   #oid = "RFC1213-MIB::sysName.0"

   #name = "source"

   #is_tag = true

   # filters = ["A:ifIndex:^2$","B:ifOperStatus:1", "C:ifDescr:^eno*"]

   # filters_expression = "(A && B) || C"



   #[[instances.table]]

   #oid = "IF-MIB::ifTable"

   #name = "interface"

   #inherit_tags = ["source"]



   #[[instances.table.field]]

   #oid = "IF-MIB::ifDescr"

   #name = "ifDescr"

   #is_tag = true
   ```

2. 在夜莺「集成中心」里找到 SNMP，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。

3. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                 | 面板数 |
| ---------------------- | ------ |
| Device Traffic View    | 1      |
| Juniper网络设备详情    | 14     |
| SNMP 网络设备状态汇总  | 6      |
| SNMP Stats             | 15     |
| 各个接入交换机         | 7      |
| 网络交换机监控大盘     | 2      |
| 华为网络设备详情       | 14     |
| 网络设备端口流量视图   | 1      |
| 网络设备详情通用仪表盘 | 14     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 37 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

规则按采集方式分组，用哪种采集器就导哪一组。

### Categraf 采集（25）[​](#categraf-采集25 "Categraf 采集（25）的直接链接")

#### H3C 电源状态异常[​](#h3c-电源状态异常 "H3C 电源状态异常的直接链接")

正常状态为2 连续3次 != 2则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_power_status{Brand='H3C'} != 2
```

处置步骤:

1. 登录设备用 display power 确认是哪个电源槽位异常；
2. 到机房现场确认电源模块指示灯与供电线路、PDU 输出；
3. 线路正常则判定为电源模块硬件故障，走备件更换流程；
4. 更换前确认另一路供电正常，避免操作中整机断电。

#### H3C设备 CPU使用率大于70%[​](#h3c设备-cpu使用率大于70 "H3C设备 CPU使用率大于70%的直接链接")

连续10分钟cpu利用率大于70%

S2 警告 · 持续 10 分钟 · 触发条件:

```
snmp_system_cpuuse{Brand='H3C'}>70
```

处置步骤:

1. 登录设备用 display cpu-usage（华为/H3C）或 show system processes（Juniper）看是哪个进程占用高；
2. 常见根因是路由震荡、ARP/广播风暴、ACL 规则过多或被扫描；
3. 用 display interface brief 看是否有端口流量异常，配合抓包定位广播风暴源；
4. 确认后隔离异常端口或优化配置，持续高负载则评估设备是否已到容量上限。

#### H3C设备 内存使用率大于70%[​](#h3c设备-内存使用率大于70 "H3C设备 内存使用率大于70%的直接链接")

连续2分钟内存利用率大于70%

S2 警告 · 持续 2 分钟 · 触发条件:

```
snmp_system_memuse{Brand='H3C'}>70
```

处置步骤:

1. 登录设备用 display memory-usage 看内存分布；
2. 检查路由表与 ARP 表规模是否异常膨胀（display ip routing-table statistics、display arp statistics）；
3. 常见根因是路由泄漏、ARP 攻击或长期未重启的内存碎片；
4. 优化路由聚合与 ARP 老化时间，必要时安排窗口重启设备。

#### H3C设备 风扇状态异常[​](#h3c设备-风扇状态异常 "H3C设备 风扇状态异常的直接链接")

正常状态为2 连续3次!= 2则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_fan_status{Brand='H3C'} != 2
```

处置步骤:

1. 登录设备用 display fan 确认异常的风扇槽位；
2. 同时用 display temperature 确认当前温度是否已经上升；
3. 到现场确认风扇是否卡死、滤网是否积灰，清灰后复测；
4. 确认为硬件故障的尽快更换风扇模块，温度已高的先降低设备负载或加强机房散热。

#### ICMP 超时[​](#icmp-超时 "ICMP 超时的直接链接")

0 = 未响应 1 = 响应 1分钟内所有请求都无响应，认为设备失联

S1 紧急 · 持续 3 分钟 · 触发条件:

```
max_over_time(snmp_icmp_up{}[1m]) == 0
```

处置步骤:

1. 从其他网段再 ping 一次以排除单点路径问题，并用 traceroute 定位在哪一跳断开；
2. 尝试 SSH/Telnet 登录设备，能登录说明是 ICMP 被策略拦截而非设备故障；
3. 完全不可达的到现场确认设备电源与指示灯；
4. 确认该设备承载的业务是否已切到冗余路径，未切的优先恢复流量。

#### Incoming 带宽使用率高[​](#incoming-带宽使用率高 "Incoming 带宽使用率高的直接链接")

snmp\_interface\_incoming 表示入流量的累计值，单位为字节每秒， rate(snmp\_interface\_incoming{}\[1m]) \* 8，表示每秒的入流量，单位为bit/s snmp\_interface\_speed 表示接口的最大传输速率

本判断条件表示实际入流量大于带宽的90%

S2 警告 · 持续 3 分钟 · 触发条件:

```
(rate(snmp_interface_incoming{}[1m]) * 8 / 10^9) > ((snmp_interface_speed{}/ 10^3) *0.9) and snmp_interface_speed >0
```

处置步骤:

1. 从告警标签取设备与接口，用 display interface <接口> 确认实际速率与峰值；
2. 用 NetFlow/sFlow 或在上层设备抓流量，定位是哪些源/目的占用了主要带宽；
3. 确认是正常业务增长、备份任务还是异常流量（攻击、环路）；
4. 正常增长的扩容链路或做链路聚合，异常的先限流或隔离。

#### Interface Down[​](#interface-down "Interface Down的直接链接")

SNMP采集指标说明： snmp\_interface\_admin\_status： up = 1 ,down = 2，testing = 3 告警规则： 最近一次snmp\_interface\_admin\_status == up 最近14天up过至少1次（offset 1h是防止down变up瞬间，发生告警） 最近1次 ostatus != 1 60秒检测一次，连续满足3次触发告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_interface_admin_status{ifname!~'^(vlan|Vlanif|VLAN|V|irb|gr-).*'} == 1 and min_over_time(snmp_interface_ostatus{ifname!~'^(vlan|Vlanif|VLAN|V|irb|gr-).*'}[14d] offset 1h)  == 1 and snmp_interface_ostatus{ifname!~'^(vlan|Vlanif|VLAN|V|irb|gr-).*'} != 1
```

处置步骤:

1. 从告警标签取设备与 ifname，登录设备用 display interface <接口> 看 down 的原因与错包计数；
2. 到现场确认网线/光模块是否松动，光模块可用 display transceiver 看收发光功率；
3. 对端设备侧同步确认接口状态，双方都 down 才能定位是链路还是单侧问题；
4. 确认是否有冗余链路已接管，无冗余的优先恢复。

#### Juniper设备 CPU使用率大于70%[​](#juniper设备-cpu使用率大于70 "Juniper设备 CPU使用率大于70%的直接链接")

连续10分钟cpu利用率大于70%

S2 警告 · 持续 10 分钟 · 触发条件:

```
snmp_system_cpuuse{Brand='Juniper'}  > 70
```

处置步骤:

1. 登录设备用 display cpu-usage（华为/H3C）或 show system processes（Juniper）看是哪个进程占用高；
2. 常见根因是路由震荡、ARP/广播风暴、ACL 规则过多或被扫描；
3. 用 display interface brief 看是否有端口流量异常，配合抓包定位广播风暴源；
4. 确认后隔离异常端口或优化配置，持续高负载则评估设备是否已到容量上限。

#### Juniper设备 内存使用率大于70%[​](#juniper设备-内存使用率大于70 "Juniper设备 内存使用率大于70%的直接链接")

连续2分钟内存利利用率大于70%

S2 警告 · 持续 2 分钟 · 触发条件:

```
snmp_system_memuse{Brand='Juniper'}  > 70
```

处置步骤:

1. 登录设备用 display memory-usage 看内存分布；
2. 检查路由表与 ARP 表规模是否异常膨胀（display ip routing-table statistics、display arp statistics）；
3. 常见根因是路由泄漏、ARP 攻击或长期未重启的内存碎片；
4. 优化路由聚合与 ARP 老化时间，必要时安排窗口重启设备。

#### Juniper设备 电源状态异常[​](#juniper设备-电源状态异常 "Juniper设备 电源状态异常的直接链接")

正常状态为2，异常状态为6 连续3次 == 6则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_power_status{Brand='Juniper'}  == 6
```

处置步骤:

1. 登录设备用 display power 确认是哪个电源槽位异常；
2. 到机房现场确认电源模块指示灯与供电线路、PDU 输出；
3. 线路正常则判定为电源模块硬件故障，走备件更换流程；
4. 更换前确认另一路供电正常，避免操作中整机断电。

#### Juniper设备 风扇状态异常[​](#juniper设备-风扇状态异常 "Juniper设备 风扇状态异常的直接链接")

正常状态为2或5，异常状态为6 连续3次== 6则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_fan_status{Brand='Juniper'}  == 6
```

处置步骤:

1. 登录设备用 display fan 确认异常的风扇槽位；
2. 同时用 display temperature 确认当前温度是否已经上升；
3. 到现场确认风扇是否卡死、滤网是否积灰，清灰后复测；
4. 确认为硬件故障的尽快更换风扇模块，温度已高的先降低设备负载或加强机房散热。

#### Outgoing 带宽使用率高[​](#outgoing-带宽使用率高 "Outgoing 带宽使用率高的直�接链接")

snmp\_interface\_outgoing 表示出流量的累计值，单位为字节每秒， rate(snmp\_interface\_outcoming{}\[1m]) \* 8，表示每秒的出流量，单位为bit/s snmp\_interface\_speed 表示接口的最大传输速率

本判断条件表示实际入流量大于带宽的90%

S2 警告 · 持续 3 分钟 · 触发条件:

```
(rate(snmp_interface_outgoing{}[1m]) * 8 / 10^9) > ((snmp_interface_speed{}/ 10^3) *0.9) and snmp_interface_speed >0
```

处置步骤:

1. 从告警标签取设备与接口，用 display interface <接口> 确认实际速率与峰值；
2. 用 NetFlow/sFlow 或在上层设备抓流量，定位是哪些源/目的占用了主要带宽；
3. 确认是正常业务增长、备份任务还是异常流量（攻击、环路）；
4. 正常增长的扩容链路或做链路聚合，异常的先限流或隔离。

#### Ruijie设备 电源状态异常[​](#ruijie设备-电源状态异常 "Ruijie设备 电源状态异常的直接链接")

正常状态为4，异常状态为??? 连续3次 != 4则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_power_status{Brand='Ruijie'} != 4
```

处置步骤:

1. 登录设备用 display power 确认是哪个电源槽位异常；
2. 到机房现场确认电源模块指示灯与供电线路、PDU 输出；
3. 线路正常则判定为电源模块硬件故障，走备件更换流程；
4. 更换前确认另一路供电正常，避免操作中整机断电。

#### Ruijie设备 风扇状态异常[​](#ruijie设备-风扇状态异常 "Ruijie设备 风扇状态异常的直接链接")

正常状态为4或者6 连续3次!= 4且不等于6 则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_fan_status{Brand='Ruijie'} != 4 and snmp_system_fan_status{Brand='Ruijie'} != 6
```

处置步骤:

1. 登录设备用 display fan 确认异常的风扇槽位；
2. 同时用 display temperature 确认当前温度是否已经上升；
3. 到现场确认风扇是否卡死、滤网是否积灰，清灰后复测；
4. 确认为硬件故障的尽快更换风扇模块，温度已高的先降低设备负载或加强机房散热。

#### Ruijie设备CPU使用率大于70%[​](#ruijie设备cpu使用率大于70 "Ruijie设备CPU使用率大于70%的直接链接")

连续10分钟cpu利用率大于70%

S2 警告 · 持续 10 分钟 · 触发条件:

```
snmp_system_cpuuse{Brand='Ruijie'} > 70
```

处置步骤:

1. 登录设备用 display cpu-usage（华为/H3C）或 show system processes（Juniper）看是哪个进程占用高；
2. 常见根因是路由震荡、ARP/广播风暴、ACL 规则过多或被扫描；
3. 用 display interface brief 看是否有端口流量异常，配合抓包定位广播风暴源；
4. 确认后隔离异常端口或优化配置，持续高负载则评估设备是否已到容量上限。

#### Ruijie设备内存使用率大于70%[​](#ruijie设备内存使用率大于70 "Ruijie设备内存使用率大于70%的直接链接")

连续2分钟内存利用率大于70%

S2 警告 · 持续 2 分钟 · 触发条件:

```
snmp_system_memuse{Brand='Ruijie'} > 70
```

处置步骤:

1. 登录设备用 display memory-usage 看内存分布；
2. 检查路由表与 ARP 表规模是否异常膨胀（display ip routing-table statistics、display arp statistics）；
3. 常见根因是路由泄漏、ARP 攻击或长期未重启的内存碎片；
4. 优化路由聚合与 ARP 老化时间，必要时安排窗口重启设备。

#### 入方向 CRC 错误[​](#入方向-crc-错误 "入方向 CRC 错误的直接链接")

incoming\_errors：端口历史错包总数， incoming\_ucastpkts：端口历史数据包总数

1. incoming\_errors一分钟变化值 大于100
2. incoming\_errors一分钟变化值 除以 incoming\_ucastpkts一分钟变化值 大于 1%
3. 60秒检测一次，连续5次满足，则告警

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(snmp_interface_incoming_errors{}[2m]) > 100 and rate(snmp_interface_incoming_errors{}[2m]) / rate(snmp_interface_incoming_ucastpkts{}[2m]) > 0.01
```

处置步骤:

1. 从告警标签取设备与接口，用 display interface <接口> 看 CRC/errors 计数的增长速度；
2. 检查网线/光模块，光口用 display transceiver 看收发光功率是否在规格范围内；
3. 确认两端协商的速率与双工模式一致——不一致是经典错包源；
4. 换线或换模块后清零计数（reset counters interface）复测确认。

#### 出方向 CRC 错误[​](#出方向-crc-错误 "出方向 CRC 错误的直接链接")

outgoing\_errors：端口历史错包总数， outgoing\_ucastpkts：端口历史数据包总数

1. outgoing\_errors一分钟变化值 大于100
2. outgoing\_errors一分钟变化值 除以 outgoing\_ucastpkts一分钟变化值 大于 1%
3. 60秒检测一次，连续5次满足，则告警

S2 警告 · 持续 5 分钟 · 触发条件:

```
rate(snmp_interface_outgoing_errors{}[2m]) > 100 and rate(snmp_interface_outgoing_errors{}[2m]) / rate(snmp_interface_outgoing_ucastpkts{}[2m]) > 0.01
```

处置步骤:

1. 从告警标签取设备与接口，用 display interface <接口> 看 CRC/errors 计数的增长速度；
2. 检查网线/光模块，光口用 display transceiver 看收发光功率是否在规格范围内；
3. 确认两端协商的速率与双工模式一致——不一致是经典错包源；
4. 换线或换模块后清零计数（reset counters interface）复测确认。

#### 华为设备CPU使用率大于70%[​](#华为设备cpu使用率大于70 "华为设备CPU使用率大于70%的直接链接")

连续10分钟cpu利用率大于70%

S2 警告 · 持续 10 分钟 · 触发条件:

```
snmp_system_cpuuse{Brand='Huawei'} > 70
```

处置步骤:

1. 登录设备用 display cpu-usage（华为/H3C）或 show system processes（Juniper）看是哪个进程占用高；
2. 常见根因是路由震荡、ARP/广播风暴、ACL 规则过多或被扫描；
3. 用 display interface brief 看是否有端口流量异常，配合抓包定位广播风暴源；
4. 确认后隔离异常端口或优化配置，持续高负载则评估设备是否已到容量上限。

#### 华为设备内存使用率大于70%[​](#华为设备内存使用率大于70 "华为设备内存使用率大于70%的直接链接")

连续2分钟内存利用率大于70%

S2 警告 · 持续 2 分钟 · 触发条件:

```
snmp_system_memuse{Brand='Huawei'} > 70
```

处置步骤:

1. 登录设备用 display memory-usage 看内存分布；
2. 检查路由表与 ARP 表规模是否异常膨胀（display ip routing-table statistics、display arp statistics）；
3. 常见根因是路由泄漏、ARP 攻击或长期未重启的内存碎片；
4. 优化路由聚合与 ARP 老化时间，必要时安排窗口重启设备。

#### 华为设备电源状态异常[​](#华为设备电源状态异常 "华为设备电源状态异常的直接链接")

正常状态为1，异常状态为2 连续3次 != 1 则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_power_status{Brand='Huawei'} != 1
```

处置步骤:

1. 登录设备用 display power 确认是哪个电源槽位异常；
2. 到机房现场确认电源模块指示灯与供电线路、PDU 输出；
3. 线路正常则判定为电源模块硬件故障，走备件更换流程；
4. 更换前确认另一路供电正常，避免操作中整机断电。

#### 华为设备风扇状态异常[​](#华为设备风扇状态异常 "华为设备风扇状态异常的直接链接")

正常状态为1 连续3次!=1,则告警

S2 警告 · 持续 3 分钟 · 触发条件:

```
snmp_system_fan_status{Brand='Huawei'} != 1
```

处置步骤:

1. 登录设备用 display fan 确认异常的风扇槽位；
2. 同时用 display temperature 确认当前温度是否已经上升；
3. 到现场确认风扇是否卡死、滤网是否积灰，清灰后复测；
4. 确认为硬件故障的尽快更换风扇模块，温度已高的先降低设备负载或加强机房散热。

#### 设备中断[​](#设备中断 "设备中断的直接链接")

snmp\_uptime 表示设备运行时间，单位10ms

delta(snmp\_uptime{}/100 \[2m]) 表示设备2分钟内没有uptime 更新

S1 紧急 · 持续 1 分钟 · 触发条件:

```
delta(snmp_uptime{}/100 [2m]) == 0
```

处置步骤:

1. 手工 snmpwalk 一次设备的 sysUpTime，确认设备是否真的还在响应；
2. 能响应说明是采集侧问题，检查 categraf 的 snmp 配置、社区串与超时设置；
3. 不响应则按设备失联处理，确认设备电源与管理网；
4. 恢复后确认历史数据缺口，注意盲区期间没有告警。

#### 设备失去连接[​](#设备失去连接 "设备失去连接的直接链接")

未响应 == 0，响应 == 1 检测频率60秒,连续3次snmp和icmp都为0，则触发告警 如未恢复，24h后会再次发送

S2 警告 · 持续 1 分钟 · 触发条件:

```
max_over_time(snmp_icmp_up{}[3m]) == 0 and max_over_time(snmp_up{}[3m]) == 0
```

处置步骤:

1. 立即确认该设备下挂业务是否已切到冗余设备，未切的优先处理流量；
2. 到现场确认设备电源、指示灯与控制台是否有输出；
3. 能进控制台的查看是否处于重启或异常状态，收集日志；
4. 硬件故障的走备件更换，期间保持业务在冗余路径上。

#### 设备重启[​](#设备重启 "设备重启的直接链接")

设备启动时间小于 600.00秒则告警

S2 警告 · 持续 1 分钟 · 触发条件:

```
resets(snmp_uptime{}[10m]) == 1 and resets(snmp_enginetime{}[10m]) == 1
```

处置步骤:

1. 登录设备用 display version 确认运行时长，用 display logbuffer 或 display trapbuffer 查重启原因；
2. 区分人工重启、掉电、还是异常复位（内存耗尽、软件缺陷）；
3. 异常复位的收集日志并联系厂商，同时确认是否需要升级固件；
4. 确认重启后所有接口与路由邻居已恢复正常。

### 通用规则（12）[​](#通用规则12 "通用规则（12）的直接链接")

#### Abnormal fan status[​](#abnormal-fan-status "Abnormal fan status的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
count_over_time(snmp_h3c_system_fan_status == 1[3m]) == count_over_time(snmp_h3c_system_fan_status[3m]) or count_over_time(snmp_h3c_system_fan_present == 1[3m]) == count_over_time(snmp_h3c_system_fan_present[3m])
```

处置步骤:

1. 登录设备用 display fan 确认异常的风扇槽位；
2. 同时用 display temperature 确认当前温度是否已经上升；
3. 到现场确认风扇是否卡死、滤网是否积灰，清灰后复测；
4. 确认为硬件故障的尽快更换风扇模块，温度已高的先降低设备负载或加强机房散热。

#### Abnormal power status[​](#abnormal-power-status "Abnormal power status的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
count_over_time(snmp_h3c_system_power_status == 1[3m]) == count_over_time(snmp_h3c_system_power_status[3m]) or count_over_time(snmp_h3c_system_power_present == 1[3m]) == count_over_time(snmp_h3c_system_power_present[3m])
```

处置步骤:

1. 登录设备用 display power 确认是哪个电源槽位异常；
2. 到机房现场确认电源模块指示灯与供电线路、PDU 输出；
3. 线路正常则判定为电源模块硬件故障，走备件更换流程；
4. 更换前确认另一路供电正常，避免操作中整机断电。

#### Abnormal temperature[​](#abnormal-temperature "Abnormal temperature的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
min_over_time(snmp_h3c_system_temperature_value[3m]) >70
```

处置步骤:

1. 登录设备用 display temperature 确认是哪个传感器高温及告警门限；
2. 用 display fan 确认风扇是否全部正常；
3. 到现场检查机柜进风温度、滤网积灰与前后风道是否被遮挡；
4. 清灰整理后复测，仍不下降的降低设备负载并联系厂商检查散热组件。

#### CPU Usage Over 70%[​](#cpu-usage-over-70 "CPU Usage Over 70%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
min_over_time(snmp_huawei_system_cpuuse[3m] offset 0m) >70
```

处置步骤:

1. 登录设备用 display cpu-usage（华为/H3C）或 show system processes（Juniper）看是哪个进程占用高；
2. 常见根因是路由震荡、ARP/广播风暴、ACL 规则过多或被扫描；
3. 用 display interface brief 看是否有端口流量异常，配合抓包定位广播风暴源；
4. 确认后隔离异常端口或优化配置，持续高负载则评估设备是否已到容量上限。

#### Memory Usage Over 70%[​](#memory-usage-over-70 "Memory Usage Over 70%的直接链接")

S2 警告 · 持续 1 分钟 · 触发条件:

```
min_over_time(snmp_huawei_system_memuse[3m] offset 0m) >70
```

处置步骤:

1. 登录设备用 display memory-usage 看内存分布；
2. 检查路由表与 ARP 表规模是否异常膨胀（display ip routing-table statistics、display arp statistics）；
3. 常见根因是路由泄漏、ARP 攻击或长期未重启的内存碎片；
4. 优化路由聚合与 ARP 老化时间，必要时安排窗口重启设备。

#### Bgp Down[​](#bgp-down "Bgp Down的直接链接")

1.peer\_status 倒数第二次=6(established) 2.peer\_status最近5分钟内有变化 3.admin\_status == 2（up）

S3 提醒 · 触发条件:

```
snmp_juniper_bgp_prefix_peer_status offset 1m == 6 and delta(snmp_juniper_bgp_prefix_peer_status[5m]) != 0 and snmp_juniper_bgp_prefix_admin_status == 2
```

处置步骤:

1. 登录设备用 show bgp neighbor \<peer> 看会话状态与最后一次断开原因；
2. 检查到邻居的三层连通性（ping/traceroute）与 TCP 179 端口是否可达；
3. 网络正常则核对双方的 AS 号、认证密码、前缀数量限制（超限会主动断开）；
4. 确认流量是否已由其他邻居承载，未承载的优先恢复。

#### Bgp peer flap[​](#bgp-peer-flap "Bgp peer flap的直接链接")

1.

S3 提醒 · 触发条件:

```
delta(snmp_juniper_bgp_prefix_peer_up_count[1h]) >= 3
```

处置步骤:

1. 用 show bgp neighbor \<peer> 看历次断开原因；
2. 链路层不稳定的检查接口错包与光功率；
3. 前缀数超限导致的反复断开，需调整 maximum-prefix 或在对端做路由聚合；
4. 确认是否已配置 BGP damping 抑制震荡，未配置的评估是否启用。

#### SNMP 探测失败（设备在线）[​](#snmp-探测失败设备在线 "SNMP 探测失败（设备在线）的直接链接")

设备 ICMP 可达但 SNMP 探测持续失败。 说明不是设备宕机，而是 SNMP 服务未启用、ACL 拦截、UDP 161 不通或凭据（团体字/v3 认证）错误。

S2 警告 · 持续 3 分钟 · 触发条件:

```
max_over_time(snmp_icmp_up{}[3m]) == 1 and max_over_time(snmp_up{}[3m]) == 0
```

处置步骤:

1. 在设备上确认 SNMP 服务已启用且团体字/v3 用户配置正确；
2. 检查设备 ACL 与中间防火墙是否放行采集机到设备的 UDP 161；
3. 在采集机上用 snmpwalk 手工验证凭据；
4. 若近期变更过凭据，同步更新平台上该设备的 SNMP 认证配置并使用页面「测试」验证。

#### SNMP 采集中断（曾有数据）[​](#snmp-采集中断曾有数据 "SNMP 采集中断（曾有数据）的直接链接")

设备 SNMP 探测在过去 1 小时内有过成功记录，但最近 10 分钟没有任何 snmp\_up 样本。 常见原因：采集 Agent 离线或配置被移除、设备被停用、网络中断。与「探测失败」不同，这代表采集链路整体没有产出数据。

S2 警告 · 触发条件:

```
max_over_time(snmp_up{}[1h]) == 1 unless max_over_time(snmp_up{}[10m])
```

处置步骤:

1. 到网络设备列表查看该设备健康列：区分是采集 Agent 失联还是设备探测失败；
2. 确认所配采集 Agent（categraf）进程与心跳正常；
3. 确认设备未被停用采集、采集模板仍在关联；
4. 网络设备详情页可发起「测试」快速验证采集链路。

#### Bandwidth Usage Too High[​](#bandwidth-usage-too-high "Bandwidth Usage Too High的直接链接")

1.流量值： delta(snmp\_network\_status\_incoming \[1m]) #delta() 函数用于计算时间序列数据的增量（差值） /8 转换倍数 min\_over\_time(metric\_name \[3m]) 3 max\_over\_time(snmp\_network\_status\_speed \[30m])/1000 \* 0.7 \* 1024 \* 1024 \* 1024 取物理端口的70%，90%做告警

S3 提醒 · 持续 2 分钟 · 触发条件:

```
min_over_time(delta(snmp_network_status_incoming[3m]) * 8 / 180 / 1024 / 1024 [3m]) > snmp_network_status_speed / 1000 * 0.7 * 1024 * 1024 * 1024 and snmp_network_status_speed > 0



min_over_time(delta(snmp_network_status_incoming[3m]) * 8 / 180 / 1024 / 1024 [3m]) > snmp_network_status_speed / 1000 * 0.9 * 1024 * 1024 * 1024 and snmp_network_status_speed > 0
```

处置步骤:

1. 从告警标签取设备与接口，用 display interface <接口> 确认实际速率与峰值；
2. 用 NetFlow/sFlow 或在上层设备抓流量，定位是哪些源/目的占用了主要带宽；
3. 确认是正常业务增长、备份任务还是异常流量（攻击、环路）；
4. 正常增长的扩容链路或做链路聚合，异常的先限流或隔离。

#### CRC Error[​](#crc-error "CRC Error的直接链接")

incoming\_errors：端口历史错包总数，incoming\_ucastpkts：端口历史数据包总数

1. incoming\_errors\[1m] 的delta值 >100
2. incoming\_errors\[1m] 的delta值 除以 incoming\_ucastpkts\[1m] 的delta值 > 0.001

S3 提醒 · 持续 2 分钟 · 触发条件:

```
delta(snmp_network_status_incoming_errors[1m]) > 100 and delta(snmp_network_status_incoming_errors[1m]) / delta(snmp_network_status_incoming_ucastpkts[1m]) > 0.001



delta(snmp_network_status_incoming_errors[1m]) > 100 and delta(snmp_network_status_incoming_errors[1m]) / delta(snmp_network_status_incoming_ucastpkts[1m]) > 0.01
```

处置步骤:

1. 从告警标签取设备与接口，用 display interface <接口> 看 CRC/errors 计数的增长速度；
2. 检查网线/光模块，光口用 display transceiver 看收发光功率是否在规格范围内；
3. 确认两端协商的速率与双工模式一致——不一致是经典错包源；
4. 换线或换模块后清零计数（reset counters interface）复测确认。

#### Interface Down[​](#interface-down-1 "Interface Down的直接链接")

1. admin == 1
2. ops status最近3次都为2(down)，最近第四次为1(up)

S3 提醒 · 持续 2 分钟 · 触发条件:

```
snmp_network_status_admin_status == 1 and snmp_network_status_ostatus offset 4m == 1 and min_over_time(snmp_network_status_ostatus[3m]) == 2
```

处置步骤:

1. 从告警标签取设备与 ifname，登录设备用 display interface <接口> 看 down 的原因与错包计数；
2. 到现场确认网线/光模块是否松动，光模块可用 display transceiver 看收发光功率；
3. 对端设备侧同步确认接口状态，双方都 down 才能定位是链路还是单侧问题；
4. 确认是否有冗余链路已接管，无冗余的优先恢复。

## 指标说明[​](#指标说明 "指标说明的直接链接")

共 5 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标                                | 含义                                                                                                                                                                                                                                                                                  | 单位  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `snmp_interface_admin_status`       | SNMP 接口管理状态 — SNMP 接口管理状态， MIB 名称为 ifAdminStatus。 up(1)：接口在管理上是启用的，设备被配置为让该接口处于工作状态。 down(2)：接口在管理上是关闭的，设备被配置为不让该接口进行数据传输或工作。 testing(3)：接口处于测试模式。在实际应用中比较少见，但在标准定义中存在。 |       |
| `snmp_interface_ostatus`            | SNMP 接口运行状态 — 接口运行状态 up(1)：接口当前处于正常工作状态，可以收发数据。 down(2)：接口当前无法工作，可能是物理链路断开、配置问题或硬件故障等原因。 testing(3)：接口在测试模式，暂时不处理正常数据流，一般较少见。                                                             |       |
| `snmp_interface_outgoing_ucastpkts` | 接口在发送方向上发送的单播数据包的总数 — 接口在发送方向上发送的单播数据包的总数                                                                                                                                                                                                       |       |
| `snmp_interface_outgoing_errors`    | 接口在数据发送过程中发生的错误总数 — 接口在数据发送过程中发生的错误数量。这种错误通常包括网络层或链路层的问题，如包的损坏、校验错误、或由于其他原因导致数据无法正常发送。                                                                                                             |       |
| `snmp_interface_speed`              | 接口带宽 — snmp\_interface\_speed 是 SNMP（简单网络管理协议）中的一个对象，用于表示网络接口的速率或带宽，通常以 比特每秒（bps） 为单位。它指示网络接口的最大数据传输速率，即接口能够在理想状态下处理的最大流量。                                                                      | bit/s |

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[SNMP 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/SNMP）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/SNMP%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [Categraf `snmp` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/snmp)：完整配置项和指标列表。
* [Switch Legacy：交换机零配置采集](https://n9e.github.io/zh/integrations/switch-legacy.md)
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
