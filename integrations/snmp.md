---
title: "Monitor network devices over SNMP with Nightingale"
sidebar_label: "SNMP"
description: "Collect any network device by listing OIDs, with OID values usable as labels; the template ships Cisco, Juniper and generic switch dashboards and dozens of rules."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/SNMP
toc_max_heading_level: 2
mdx:
  format: md
---

Categraf has included Telegraf's snmp input since v0.2.13. The idea is simple: list the OIDs for the metrics you want. `[[instances.field]]` reads single values, `[[instances.table]]` walks a table into multiple rows, and selected OIDs in a table (interface names, say) can become labels. Generic OIDs for interface traffic, errors and state work on almost every device; vendor-specific OIDs for CPU and memory are configured per vendor and model.

The template ships dashboards for a generic switch overview, device traffic, access switches, and Cisco and Juniper device detail. The rules cover interfaces going down, traffic near bandwidth, errors and discards, high CPU and memory, and unreachable devices. The `Cisco.toml` in the template directory is a starting point for per-model configs.

## What's in the template

- **9 dashboards**, 74 panels in total
- **37 alert rules**, each with runbook steps
- **5 metric descriptions**
- **Categraf collector config**: `input.snmp`

## How to connect

1. [Install Categraf](/docs/data/categraf/install) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

   `conf/input.snmp/Cisco.toml`

   ```toml
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

   ```toml
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

1. Open the integration center in Nightingale, find SNMP, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Device Traffic View | 1 |
| Juniper Network Device Detail | 14 |
| SNMP Network Device Status Summary | 6 |
| SNMP Stats | 15 |
| Access switches | 7 |
| Network Switch Monitoring Dashboard | 2 |
| Huawei Network Device Detail | 14 |
| Network Device Port Traffic View | 1 |
| Network Device Detail - Generic Dashboard | 14 |

## Bundled alert rules

37 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (25)

#### H3C power supply state abnormal

Normal state is 2
alert after 3 consecutive checks != 2

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_power_status{Brand='H3C'} != 2
```

Runbook:

1. Log in and run display power to identify the faulty power slot;
1. On site, check the power module indicator, the supply line and the PDU output;
1. If the line is fine, treat it as a power module hardware fault and start the replacement process;
1. Before replacing, confirm the other feed is healthy so the device does not lose power mid-operation.

#### H3C device CPU usage exceeds 70%

CPU usage above 70% for 10 consecutive minutes

S2 Warning · for 10 min · Trigger:

```promql
snmp_system_cpuuse{Brand='H3C'}>70
```

Runbook:

1. Log in and run display cpu-usage (Huawei/H3C) or show system processes (Juniper) to see which process is busy;
1. Common root causes are route flapping, an ARP/broadcast storm, an excessive number of ACL rules, or being scanned;
1. Use display interface brief to spot abnormal port traffic and capture packets to find the broadcast storm source;
1. Isolate the offending port or tune the configuration; if load stays high, evaluate whether the device has hit its capacity limit.

#### H3C device memory usage exceeds 70%

Memory usage above 70% for 2 consecutive minutes

S2 Warning · for 2 min · Trigger:

```promql
snmp_system_memuse{Brand='H3C'}>70
```

Runbook:

1. Log in and run display memory-usage to see the memory breakdown;
1. Check whether the routing table or ARP table has grown abnormally (display ip routing-table statistics, display arp statistics);
1. Common root causes are route leaks, ARP attacks, or fragmentation on a device that has not been restarted for a long time;
1. Improve route aggregation and ARP ageing, and schedule a maintenance window restart if needed.

#### H3C device fan state abnormal

Normal state is 2
alert after 3 consecutive checks != 2

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_fan_status{Brand='H3C'} != 2
```

Runbook:

1. Log in and run display fan to identify the faulty fan slot;
1. At the same time run display temperature to confirm whether temperature has already risen;
1. On site, check whether the fan is seized and whether the filter is clogged; clean and retest;
1. Replace the fan module promptly once a hardware fault is confirmed; if temperature is already high, reduce device load or improve room cooling first.

#### ICMP timeout

0 = no response
1 = responding
If all requests within 1 minute get no response, the device is considered lost

S1 Critical · for 3 min · Trigger:

```promql
max_over_time(snmp_icmp_up{}[1m]) == 0
```

Runbook:

1. Ping again from another subnet to rule out a single-path problem, and use traceroute to find where it breaks;
1. Try SSH/Telnet to the device — if you can log in, ICMP is being blocked by policy rather than the device being down;
1. If it is completely unreachable, go on site and check the power and indicator lights;
1. Confirm whether the services behind it have failed over to a redundant path, and restore traffic first if not.

#### Incoming bandwidth usage high

snmp_interface_incoming is the cumulative inbound traffic in bytes per second; rate(snmp_interface_incoming\{\}[1m]) * 8 gives inbound traffic per second in bit/s
snmp_interface_speed is the maximum transmission rate of the interface

This condition means actual inbound traffic exceeds 90% of the bandwidth

S2 Warning · for 3 min · Trigger:

```promql
(rate(snmp_interface_incoming{}[1m]) * 8 / 10^9) > ((snmp_interface_speed{}/ 10^3) *0.9) and snmp_interface_speed >0
```

Runbook:

1. Take the device and port from the alert labels and run display interface \<port> to confirm the actual rate and peak;
1. Use NetFlow/sFlow or capture traffic on the upstream device to find which sources/destinations consume the bandwidth;
1. Determine whether it is normal growth, a backup job, or abnormal traffic (attack, loop);
1. For genuine growth, upgrade the link or use link aggregation; for abnormal traffic, rate limit or isolate it first.

#### Interface Down

SNMP metric notes:
snmp_interface_admin_status: up = 1, down = 2, testing = 3
Alert rule:
latest snmp_interface_admin_status == up
was up at least once in the last 14 days (offset 1h avoids alerting right at the down-to-up transition)
latest ostatus != 1
checked every 60s, alert after 3 consecutive matches

S2 Warning · for 3 min · Trigger:

```promql
snmp_interface_admin_status{ifname!~'^(vlan|Vlanif|VLAN|V|irb|gr-).*'} == 1 and min_over_time(snmp_interface_ostatus{ifname!~'^(vlan|Vlanif|VLAN|V|irb|gr-).*'}[14d] offset 1h)  == 1 and snmp_interface_ostatus{ifname!~'^(vlan|Vlanif|VLAN|V|irb|gr-).*'} != 1
```

Runbook:

1. Take the device and ifname from the alert labels, log in and run display interface \<port> for the down reason and error counters;
1. On site, check whether the cable or optical module is loose — for optics use display transceiver to read the TX/RX power;
1. Confirm the port state on the peer device as well: only when both sides are down can you tell a link fault from a one-sided fault;
1. Confirm whether a redundant link has taken over, and restore first if there is none.

#### Juniper device CPU usage exceeds 70%

CPU usage above 70% for 10 consecutive minutes

S2 Warning · for 10 min · Trigger:

```promql
snmp_system_cpuuse{Brand='Juniper'}  > 70
```

Runbook:

1. Log in and run display cpu-usage (Huawei/H3C) or show system processes (Juniper) to see which process is busy;
1. Common root causes are route flapping, an ARP/broadcast storm, an excessive number of ACL rules, or being scanned;
1. Use display interface brief to spot abnormal port traffic and capture packets to find the broadcast storm source;
1. Isolate the offending port or tune the configuration; if load stays high, evaluate whether the device has hit its capacity limit.

#### Juniper device memory usage exceeds 70%

Memory usage above 70% for 2 consecutive minutes

S2 Warning · for 2 min · Trigger:

```promql
snmp_system_memuse{Brand='Juniper'}  > 70
```

Runbook:

1. Log in and run display memory-usage to see the memory breakdown;
1. Check whether the routing table or ARP table has grown abnormally (display ip routing-table statistics, display arp statistics);
1. Common root causes are route leaks, ARP attacks, or fragmentation on a device that has not been restarted for a long time;
1. Improve route aggregation and ARP ageing, and schedule a maintenance window restart if needed.

#### Juniper device power supply state abnormal

Normal state is 2, abnormal state is 6
alert after 3 consecutive checks == 6

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_power_status{Brand='Juniper'}  == 6
```

Runbook:

1. Log in and run display power to identify the faulty power slot;
1. On site, check the power module indicator, the supply line and the PDU output;
1. If the line is fine, treat it as a power module hardware fault and start the replacement process;
1. Before replacing, confirm the other feed is healthy so the device does not lose power mid-operation.

#### Juniper device fan state abnormal

Normal state is 2 or 5, abnormal state is 6
alert after 3 consecutive checks == 6

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_fan_status{Brand='Juniper'}  == 6
```

Runbook:

1. Log in and run display fan to identify the faulty fan slot;
1. At the same time run display temperature to confirm whether temperature has already risen;
1. On site, check whether the fan is seized and whether the filter is clogged; clean and retest;
1. Replace the fan module promptly once a hardware fault is confirmed; if temperature is already high, reduce device load or improve room cooling first.

#### Outgoing bandwidth usage high

snmp_interface_outgoing is the cumulative outbound traffic in bytes per second; rate(snmp_interface_outcoming\{\}[1m]) * 8 gives outbound traffic per second in bit/s
snmp_interface_speed is the maximum transmission rate of the interface

This condition means actual outbound traffic exceeds 90% of the bandwidth

S2 Warning · for 3 min · Trigger:

```promql
(rate(snmp_interface_outgoing{}[1m]) * 8 / 10^9) > ((snmp_interface_speed{}/ 10^3) *0.9) and snmp_interface_speed >0
```

Runbook:

1. Take the device and port from the alert labels and run display interface \<port> to confirm the actual rate and peak;
1. Use NetFlow/sFlow or capture traffic on the upstream device to find which sources/destinations consume the bandwidth;
1. Determine whether it is normal growth, a backup job, or abnormal traffic (attack, loop);
1. For genuine growth, upgrade the link or use link aggregation; for abnormal traffic, rate limit or isolate it first.

#### Ruijie device power supply state abnormal

Normal state is 4, abnormal state is ???
alert after 3 consecutive checks != 4

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_power_status{Brand='Ruijie'} != 4
```

Runbook:

1. Log in and run display power to identify the faulty power slot;
1. On site, check the power module indicator, the supply line and the PDU output;
1. If the line is fine, treat it as a power module hardware fault and start the replacement process;
1. Before replacing, confirm the other feed is healthy so the device does not lose power mid-operation.

#### Ruijie device fan state abnormal

Normal state is 4 or 6
alert after 3 consecutive checks != 4 and != 6

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_fan_status{Brand='Ruijie'} != 4 and snmp_system_fan_status{Brand='Ruijie'} != 6
```

Runbook:

1. Log in and run display fan to identify the faulty fan slot;
1. At the same time run display temperature to confirm whether temperature has already risen;
1. On site, check whether the fan is seized and whether the filter is clogged; clean and retest;
1. Replace the fan module promptly once a hardware fault is confirmed; if temperature is already high, reduce device load or improve room cooling first.

#### Ruijie device CPU usage exceeds 70%

CPU usage above 70% for 10 consecutive minutes

S2 Warning · for 10 min · Trigger:

```promql
snmp_system_cpuuse{Brand='Ruijie'} > 70
```

Runbook:

1. Log in and run display cpu-usage (Huawei/H3C) or show system processes (Juniper) to see which process is busy;
1. Common root causes are route flapping, an ARP/broadcast storm, an excessive number of ACL rules, or being scanned;
1. Use display interface brief to spot abnormal port traffic and capture packets to find the broadcast storm source;
1. Isolate the offending port or tune the configuration; if load stays high, evaluate whether the device has hit its capacity limit.

#### Ruijie device memory usage exceeds 70%

Memory usage above 70% for 2 consecutive minutes

S2 Warning · for 2 min · Trigger:

```promql
snmp_system_memuse{Brand='Ruijie'} > 70
```

Runbook:

1. Log in and run display memory-usage to see the memory breakdown;
1. Check whether the routing table or ARP table has grown abnormally (display ip routing-table statistics, display arp statistics);
1. Common root causes are route leaks, ARP attacks, or fragmentation on a device that has not been restarted for a long time;
1. Improve route aggregation and ARP ageing, and schedule a maintenance window restart if needed.

#### Inbound CRC errors

incoming_errors: cumulative port error packets,
incoming_ucastpkts: cumulative port packets

1. 1-minute delta of incoming_errors above 100
2. 1-minute delta of incoming_errors divided by 1-minute delta of incoming_ucastpkts above 1%
3. checked every 60s, alert after 5 consecutive matches

S2 Warning · for 5 min · Trigger:

```promql
rate(snmp_interface_incoming_errors{}[2m]) > 100 and rate(snmp_interface_incoming_errors{}[2m]) / rate(snmp_interface_incoming_ucastpkts{}[2m]) > 0.01
```

Runbook:

1. Take the device and port from the alert labels and run display interface \<port> to see how fast CRC/errors are growing;
1. Check the cable and optical module; for optical ports use display transceiver to confirm TX/RX power is within spec;
1. Confirm the negotiated speed and duplex match on both ends — a mismatch is the classic source of errors;
1. After replacing the cable or module, clear the counters (reset counters interface) and retest.

#### Outbound CRC errors

outgoing_errors: cumulative port error packets,
outgoing_ucastpkts: cumulative port packets

1. 1-minute delta of outgoing_errors above 100
2. 1-minute delta of outgoing_errors divided by 1-minute delta of outgoing_ucastpkts above 1%
3. checked every 60s, alert after 5 consecutive matches

S2 Warning · for 5 min · Trigger:

```promql
rate(snmp_interface_outgoing_errors{}[2m]) > 100 and rate(snmp_interface_outgoing_errors{}[2m]) / rate(snmp_interface_outgoing_ucastpkts{}[2m]) > 0.01
```

Runbook:

1. Take the device and port from the alert labels and run display interface \<port> to see how fast CRC/errors are growing;
1. Check the cable and optical module; for optical ports use display transceiver to confirm TX/RX power is within spec;
1. Confirm the negotiated speed and duplex match on both ends — a mismatch is the classic source of errors;
1. After replacing the cable or module, clear the counters (reset counters interface) and retest.

#### Huawei device CPU usage exceeds 70%

CPU usage above 70% for 10 consecutive minutes

S2 Warning · for 10 min · Trigger:

```promql
snmp_system_cpuuse{Brand='Huawei'} > 70
```

Runbook:

1. Log in and run display cpu-usage (Huawei/H3C) or show system processes (Juniper) to see which process is busy;
1. Common root causes are route flapping, an ARP/broadcast storm, an excessive number of ACL rules, or being scanned;
1. Use display interface brief to spot abnormal port traffic and capture packets to find the broadcast storm source;
1. Isolate the offending port or tune the configuration; if load stays high, evaluate whether the device has hit its capacity limit.

#### Huawei device memory usage exceeds 70%

Memory usage above 70% for 2 consecutive minutes

S2 Warning · for 2 min · Trigger:

```promql
snmp_system_memuse{Brand='Huawei'} > 70
```

Runbook:

1. Log in and run display memory-usage to see the memory breakdown;
1. Check whether the routing table or ARP table has grown abnormally (display ip routing-table statistics, display arp statistics);
1. Common root causes are route leaks, ARP attacks, or fragmentation on a device that has not been restarted for a long time;
1. Improve route aggregation and ARP ageing, and schedule a maintenance window restart if needed.

#### Huawei device power supply state abnormal

Normal state is 1, abnormal state is 2
alert after 3 consecutive checks != 1

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_power_status{Brand='Huawei'} != 1
```

Runbook:

1. Log in and run display power to identify the faulty power slot;
1. On site, check the power module indicator, the supply line and the PDU output;
1. If the line is fine, treat it as a power module hardware fault and start the replacement process;
1. Before replacing, confirm the other feed is healthy so the device does not lose power mid-operation.

#### Huawei device fan state abnormal

Normal state is 1
alert after 3 consecutive checks != 1

S2 Warning · for 3 min · Trigger:

```promql
snmp_system_fan_status{Brand='Huawei'} != 1
```

Runbook:

1. Log in and run display fan to identify the faulty fan slot;
1. At the same time run display temperature to confirm whether temperature has already risen;
1. On site, check whether the fan is seized and whether the filter is clogged; clean and retest;
1. Replace the fan module promptly once a hardware fault is confirmed; if temperature is already high, reduce device load or improve room cooling first.

#### Device interrupted

snmp_uptime is the device uptime in units of 10ms

delta(snmp_uptime\{\}/100 [2m]) means the device has not updated its uptime within 2 minutes

S1 Critical · for 1 min · Trigger:

```promql
delta(snmp_uptime{}/100 [2m]) == 0
```

Runbook:

1. Run an snmpwalk of the device's sysUpTime by hand to confirm whether it is still responding;
1. If it responds, the problem is on the collector side — check categraf's snmp configuration, community string and timeouts;
1. If it does not respond, treat it as a device outage and check power and the management network;
1. After recovery, note the data gap — there were no alerts during the blind window.

#### Device lost connection

no response == 0, responding == 1
checked every 60s; alert when both snmp and icmp are 0 for 3 consecutive checks
if not recovered, the alert repeats after 24h

S2 Warning · for 1 min · Trigger:

```promql
max_over_time(snmp_icmp_up{}[3m]) == 0 and max_over_time(snmp_up{}[3m]) == 0
```

Runbook:

1. Immediately confirm whether the services behind the device have failed over to redundant equipment, and handle traffic first if not;
1. On site, check the device power, indicators and whether the console produces output;
1. If you can reach the console, check whether it is rebooting or in an abnormal state and collect logs;
1. For a hardware fault, start the replacement process and keep traffic on the redundant path meanwhile.

#### Device rebooted

Alert when device uptime is below 600.00 seconds

S2 Warning · for 1 min · Trigger:

```promql
resets(snmp_uptime{}[10m]) == 1 and resets(snmp_enginetime{}[10m]) == 1
```

Runbook:

1. Log in and run display version for the uptime, and display logbuffer or display trapbuffer for the restart reason;
1. Separate a manual restart, a power loss and an abnormal reset (memory exhaustion, software defect);
1. For an abnormal reset, collect logs, contact the vendor and consider a firmware upgrade;
1. Confirm all interfaces and routing neighbours recovered after the restart.

### General rules (12)

#### Abnormal fan status

S2 Warning · for 1 min · Trigger:

```promql
count_over_time(snmp_h3c_system_fan_status == 1[3m]) == count_over_time(snmp_h3c_system_fan_status[3m]) or count_over_time(snmp_h3c_system_fan_present == 1[3m]) == count_over_time(snmp_h3c_system_fan_present[3m])
```

Runbook:

1. Log in and run display fan to identify the faulty fan slot;
1. At the same time run display temperature to confirm whether temperature has already risen;
1. On site, check whether the fan is seized and whether the filter is clogged; clean and retest;
1. Replace the fan module promptly once a hardware fault is confirmed; if temperature is already high, reduce device load or improve room cooling first.

#### Abnormal power status

S2 Warning · for 1 min · Trigger:

```promql
count_over_time(snmp_h3c_system_power_status == 1[3m]) == count_over_time(snmp_h3c_system_power_status[3m]) or count_over_time(snmp_h3c_system_power_present == 1[3m]) == count_over_time(snmp_h3c_system_power_present[3m])
```

Runbook:

1. Log in and run display power to identify the faulty power slot;
1. On site, check the power module indicator, the supply line and the PDU output;
1. If the line is fine, treat it as a power module hardware fault and start the replacement process;
1. Before replacing, confirm the other feed is healthy so the device does not lose power mid-operation.

#### Abnormal temperature

S2 Warning · for 1 min · Trigger:

```promql
min_over_time(snmp_h3c_system_temperature_value[3m]) >70
```

Runbook:

1. Log in and run display temperature to identify the hot sensor and its alarm threshold;
1. Run display fan to confirm all fans are healthy;
1. On site, check cabinet intake temperature, filter dust and whether front/rear airflow is obstructed;
1. Clean and tidy, then retest; if it still does not drop, reduce device load and contact the vendor about the cooling assembly.

#### CPU Usage Over 70%

S2 Warning · for 1 min · Trigger:

```promql
min_over_time(snmp_huawei_system_cpuuse[3m] offset 0m) >70
```

Runbook:

1. Log in and run display cpu-usage (Huawei/H3C) or show system processes (Juniper) to see which process is busy;
1. Common root causes are route flapping, an ARP/broadcast storm, an excessive number of ACL rules, or being scanned;
1. Use display interface brief to spot abnormal port traffic and capture packets to find the broadcast storm source;
1. Isolate the offending port or tune the configuration; if load stays high, evaluate whether the device has hit its capacity limit.

#### Memory Usage Over 70%

S2 Warning · for 1 min · Trigger:

```promql
min_over_time(snmp_huawei_system_memuse[3m] offset 0m) >70
```

Runbook:

1. Log in and run display memory-usage to see the memory breakdown;
1. Check whether the routing table or ARP table has grown abnormally (display ip routing-table statistics, display arp statistics);
1. Common root causes are route leaks, ARP attacks, or fragmentation on a device that has not been restarted for a long time;
1. Improve route aggregation and ARP ageing, and schedule a maintenance window restart if needed.

#### Bgp Down

1. the 2nd latest peer_status = 6 (established)
2. peer_status changed within the last 5 minutes
3. admin_status == 2 (up)

S3 Info · Trigger:

```promql
snmp_juniper_bgp_prefix_peer_status offset 1m == 6 and delta(snmp_juniper_bgp_prefix_peer_status[5m]) != 0 and snmp_juniper_bgp_prefix_admin_status == 2
```

Runbook:

1. Log in and run show bgp neighbor \<peer> for the session state and the last disconnect reason;
1. Check layer-3 connectivity to the neighbour (ping/traceroute) and whether TCP 179 is reachable;
1. If the network is fine, verify the AS numbers, authentication password and prefix limits on both sides (exceeding the limit disconnects deliberately);
1. Confirm whether the traffic is already carried by another neighbour, and restore it first if not.

#### Bgp peer flap

1.

S3 Info · Trigger:

```promql
delta(snmp_juniper_bgp_prefix_peer_up_count[1h]) >= 3
```

Runbook:

1. Run show bgp neighbor \<peer> to see the reasons for previous disconnects;
1. For link-layer instability, check interface errors and optical power;
1. For repeated disconnects caused by exceeding the prefix limit, adjust maximum-prefix or aggregate routes on the peer side;
1. Check whether BGP damping is configured to suppress flapping, and evaluate enabling it if not.

#### SNMP probe failed (device online)

The device is reachable by ICMP but the SNMP probe keeps failing.
This means the device is not down: SNMP is not enabled, an ACL is blocking it, UDP 161 is unreachable, or the credentials (community string / v3 authentication) are wrong.

S2 Warning · for 3 min · Trigger:

```promql
max_over_time(snmp_icmp_up{}[3m]) == 1 and max_over_time(snmp_up{}[3m]) == 0
```

Runbook:

1. On the device, confirm SNMP is enabled and the community string / v3 user is configured correctly;
1. Check whether the device ACL and any firewall in between allow UDP 161 from the collector to the device;
1. On the collector host, verify the credentials by hand with snmpwalk;
1. If the credentials changed recently, update the SNMP authentication settings of this device on the platform as well and verify with Test on the page.

#### SNMP collection interrupted (previously had data)

The SNMP probe of this device succeeded at some point in the last hour, but there has been no snmp_up sample in the last 10 minutes.
Common causes: the collection agent is offline or its configuration was removed, the device was disabled, or the network is down. Unlike a probe failure, this means the collection link as a whole produces no data at all.

S2 Warning · Trigger:

```promql
max_over_time(snmp_up{}[1h]) == 1 unless max_over_time(snmp_up{}[10m])
```

Runbook:

1. Open the network device list and read the Health column of this device to tell an unreachable collection agent from a failed device probe;
1. Confirm the configured collection agent (categraf) process and heartbeat are healthy;
1. Confirm collection is not disabled for the device and the collect templates are still attached;
1. On the device detail page, run Test to quickly verify the collection link.

#### Bandwidth Usage Too High

1. traffic value:
delta(snmp_network_status_incoming [1m])
#delta() computes the increment (difference) of the time series
/8 unit conversion factor
min_over_time(metric_name [3m])
3 
max_over_time(snmp_network_status_speed [30m])/1000 * 0.7 * 1024 * 1024 * 1024 
alert at 70% and 90% of the physical port capacity

S3 Info · for 2 min · Trigger:

```promql
min_over_time(delta(snmp_network_status_incoming[3m]) * 8 / 180 / 1024 / 1024 [3m]) > snmp_network_status_speed / 1000 * 0.7 * 1024 * 1024 * 1024 and snmp_network_status_speed > 0

min_over_time(delta(snmp_network_status_incoming[3m]) * 8 / 180 / 1024 / 1024 [3m]) > snmp_network_status_speed / 1000 * 0.9 * 1024 * 1024 * 1024 and snmp_network_status_speed > 0
```

Runbook:

1. Take the device and port from the alert labels and run display interface \<port> to confirm the actual rate and peak;
1. Use NetFlow/sFlow or capture traffic on the upstream device to find which sources/destinations consume the bandwidth;
1. Determine whether it is normal growth, a backup job, or abnormal traffic (attack, loop);
1. For genuine growth, upgrade the link or use link aggregation; for abnormal traffic, rate limit or isolate it first.

#### CRC Error

incoming_errors: cumulative port error packets, incoming_ucastpkts: cumulative port packets
 
1. delta of incoming_errors[1m] > 100
2. delta of incoming_errors[1m] divided by delta of incoming_ucastpkts[1m] > 0.001

S3 Info · for 2 min · Trigger:

```promql
delta(snmp_network_status_incoming_errors[1m]) > 100 and delta(snmp_network_status_incoming_errors[1m]) / delta(snmp_network_status_incoming_ucastpkts[1m]) > 0.001

delta(snmp_network_status_incoming_errors[1m]) > 100 and delta(snmp_network_status_incoming_errors[1m]) / delta(snmp_network_status_incoming_ucastpkts[1m]) > 0.01
```

Runbook:

1. Take the device and port from the alert labels and run display interface \<port> to see how fast CRC/errors are growing;
1. Check the cable and optical module; for optical ports use display transceiver to confirm TX/RX power is within spec;
1. Confirm the negotiated speed and duplex match on both ends — a mismatch is the classic source of errors;
1. After replacing the cable or module, clear the counters (reset counters interface) and retest.

#### Interface Down

1. admin == 1
2. ops status was 2 (down) for the last 3 checks and 1 (up) on the 4th latest

S3 Info · for 2 min · Trigger:

```promql
snmp_network_status_admin_status == 1 and snmp_network_status_ostatus offset 4m == 1 and min_over_time(snmp_network_status_ostatus[3m]) == 2
```

Runbook:

1. Take the device and ifname from the alert labels, log in and run display interface \<port> for the down reason and error counters;
1. On site, check whether the cable or optical module is loose — for optics use display transceiver to read the TX/RX power;
1. Confirm the port state on the peer device as well: only when both sides are down can you tell a link fault from a one-sided fault;
1. Confirm whether a redundant link has taken over, and restore first if there is none.

## Metric reference

5 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `snmp_interface_admin_status` | SNMP Interface Admin Status — SNMP interface administrative status, MIB name is ifAdminStatus. up(1): The interface is administratively enabled, the device is configured to allow the interface to operate. down(2): The interface is administratively disabled, the device is configured to prevent data transmission or operation. testing(3): The interface is in testing mode. Rarely seen in practice but exists in standard definitions. |  |
| `snmp_interface_ostatus` | SNMP Interface Operational Status — Interface operational status up(1): The interface is currently in normal working state and can send/receive data. down(2): The interface is currently unable to work, possibly due to physical link disconnection, configuration issues, or hardware failure. testing(3): The interface is in testing mode and temporarily not processing normal data flow, generally rare. |  |
| `snmp_interface_outgoing_ucastpkts` | Total Unicast Packets Sent by Interface — The total number of unicast packets sent by the interface in the outgoing direction. |  |
| `snmp_interface_outgoing_errors` | Total Outgoing Errors on Interface — The number of errors that occurred during data transmission on the interface. These errors typically include network layer or link layer issues, such as packet corruption, checksum errors, or other reasons that prevent normal data transmission. |  |
| `snmp_interface_speed` | Interface Bandwidth — snmp_interface_speed is an object in SNMP (Simple Network Management Protocol) used to represent the speed or bandwidth of a network interface, typically in bits per second (bps). It indicates the maximum data transfer rate of the network interface, i.e., the maximum traffic the interface can handle under ideal conditions. | bit/s |

## Related

- [SNMP template source](https://github.com/ccfos/nightingale/tree/main/integrations/SNMP): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `snmp` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/snmp): every config option and the full metric list.
- [Switch Legacy: zero-config switch collection](/integrations/switch-legacy)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
