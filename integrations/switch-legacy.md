---
title: "Monitor switches with zero config (Switch Legacy) in Nightingale"
sidebar_label: "Switch (legacy)"
description: "Give it a list of IPs and it detects the device model and collects CPU, memory and per-port traffic, errors and state; SNMP v2c only."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Switch_Legacy
toc_max_heading_level: 2
mdx:
  format: md
---

The switch_legacy input is forked from swcollector and targets the "just get the switches in quickly" case. List IPs in the config (single addresses, subnets or ranges), and the input detects the device model and uses generic OIDs to collect CPU and memory usage plus traffic, packets, errors, discards and up/down state for every port. No OIDs to write.

It supports SNMP v2c only, so authentication is a single community string. Set `switch_id_label` to `ident` and each switch appears in Nightingale's host list keyed by its IP. For custom OIDs or SNMP v3, use the [SNMP integration](/integrations/snmp) instead. The rules cover ports going down, traffic near bandwidth, rising errors and unreachable devices.

## What's in the template

- **1 dashboard**, 14 panels in total
- **7 alert rules**, each with runbook steps
- **Categraf collector config**: `input.switch_legacy`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.switch_legacy/switch_legacy.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.switch_legacy started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = "300s"

   switch_id_label = "ip"

   [mappings]
   "192.168.88.160" = "switch001.bj"
   "192.168.88.161" = "switch002.bj"

   [[instances]]
   # # interval = global.interval * interval_times
   # interval_times = 1

   # use global unique string to specify instance
   # labels = { region="beijing" }

   ips = [
   #     "172.16.2.1",
   #     "172.16.4/24",
   #     "192.168.56.102-192.168.56.120"
   ]

   community = "public"

   # whether use index tag
   index_tag = false

   ignore_ifaces = ["Nu", "NU", "Vlan", "Vl"]

   concurrency_for_address = 1000
   concurrency_for_request = 4

   ping_enable = true
   ping_mode_fastping = true
   ping_timeout_ms = 300
   ping_retries = 4

   # true: use gosnmp, false: use snmpwalk
   snmp_mode_gosnmp = true
   snmp_timeout_ms = 1000
   snmp_retries = 5

   gather_ping_metrics = true
   gather_flow_metrics = true
   gather_cpu_metrics = true
   gather_mem_metrics = true
   gather_oper_status = false
   gather_pkt = false
   gather_broadcast_pkt = false
   gather_multicast_pkt = false
   gather_discards = false
   gather_errors = false
   gather_unknown_protos = false
   gather_out_qlen = false

   # ignore metrics if limit > 0 and collected value > limit
   speed_limit = 0
   pkt_limit = 0
   broadcast_pkt_limit = 0
   multicast_pkt_limit = 0
   discards_pkt_limit = 0
   errors_pkt_limit = 0
   unknown_protos_pkt_limit = 0
   out_qlen_pkt_limit = 0

   # [[instances.customs]]
   # metric = "AnyconnectSession"
   # tags = {}
   # oid = "1.3.6.1.4.1.9.9.392.1.3.35.0"

   # [[instances.customs]]
   # metric = "ConnectionStat"
   # tags = {}
   # oid = "1.3.6.1.4.1.9.9.147.1.2.2.2.1.5.40.6"

   # [[instances.customs]]
   # metric = "TempStatus"
   # tags = {}
   # oid = "1.3.6.1.4.1.9.9.13.1.3.1.3.1004"
   ```

1. Open the integration center in Nightingale, find Switch (legacy), and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Network Switch | 14 |

## Bundled alert rules

7 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Switch unreachable

S1 Critical · for 2 min · Trigger:

```promql
switch_legacy_ping_up == 0
```

Runbook:

1. Take the device identifier from the alert labels and double-check with ping and traceroute from a different machine to rule out a problem on the collector side;
1. If it does ping from elsewhere, the problem is on the path from the collector; check the intermediate links and ACLs;
1. If it does not ping at all, ask the data centre to check the power and status LEDs and try logging in over the console port;
1. Once the device is confirmed failed, switch to the redundant link (check whether stacking/VRRP already failed over) and arrange a replacement.

### Switch CPU utilization too high

S2 Warning · for 5 min · Trigger:

```promql
switch_legacy_cpu_util > 80
```

Runbook:

1. Log in to the device and run display cpu-usage (Huawei) or show processes cpu sorted (Cisco) to see which process is consuming CPU;
1. High usage is commonly an ARP or broadcast storm, or heavy punting of packets to the CPU; check with display cpu-defend statistics;
1. For a broadcast storm, locate the source port and configure storm-control, and check for a loop at the same time (STP state);
1. If a protocol process is the consumer, check the routing table size and neighbour count and apply route summarisation if needed.

### Switch memory utilization too high

S2 Warning · for 5 min · Trigger:

```promql
switch_legacy_mem_util > 80
```

Runbook:

1. Log in to the device and run display memory-usage or show memory statistics to see the breakdown;
1. Check whether the MAC table, ARP table, and routing table sizes are approaching the device's specification limits;
1. If entries are growing abnormally, check for a MAC flooding attack and configure port security to cap MAC learning per port;
1. If this is genuine business growth, evaluate whether the device model needs upgrading and clean up unused configuration and ACLs.

### Switch port flapping

S2 Warning · for 1 min · Trigger:

```promql
changes(switch_legacy_if_oper_status[10m]) > 2
```

Runbook:

1. Take the port identifier from the alert labels, log in to the device, and run display interface \<port> to see the up/down count and the last transition time;
1. Suspect the physical layer first: check whether the optical module's transmit and receive power (display transceiver diagnosis) are within thresholds and whether the fibre and connectors are loose;
1. For copper ports, check cable quality and whether speed/duplex negotiation matches on both ends;
1. Once physical problems are ruled out, check whether the peer device is restarting repeatedly, and shut down the port if necessary to stop it triggering network-wide reconvergence.

### Switch port inbound errors

S2 Warning · for 5 min · Trigger:

```promql
rate(switch_legacy_if_in_errors[5m]) > 1
```

Runbook:

1. Take the port identifier from the alert labels and run display interface \<port> to see the detailed CRC, Frame, and Giants error counters;
1. Predominantly CRC errors are essentially always physical: replace the cable or fibre, clean the optical connectors, and confirm the cable length is within spec;
1. Check that speed and duplex negotiation match on both ends, since a half/full duplex mismatch produces large numbers of collision errors;
1. After replacing the cable, clear the counters with reset counters interface \<port> and confirm they stop growing.

### Switch port inbound bandwidth utilization too high

S2 Warning · for 10 min · Trigger:

```promql
switch_legacy_if_in_speed_percent > 80
```

Runbook:

1. Take the port identifier from the alert labels and run display interface \<port> to confirm the live rate against the negotiated port speed;
1. Use NetFlow/sFlow, or capture on the server side, to identify which workloads generate the traffic and rule out anomalies (backup jobs or data sync running in the wrong window);
1. If this is genuine business growth, evaluate link aggregation (Eth-Trunk / port-channel) to add capacity;
1. In the short term apply QoS rate limiting to non-critical traffic to protect the important flows.

### Switch port outbound bandwidth utilization too high

S2 Warning · for 10 min · Trigger:

```promql
switch_legacy_if_out_speed_percent > 80
```

Runbook:

1. Take the port identifier from the alert labels and run display interface \<port> to see the outbound rate and queue drop counters;
1. For a saturated uplink, link aggregation is the most direct fix;
1. Use traffic analysis to confirm whether high-volume workloads should be taking a different path, and adjust routing or apply traffic engineering if so;
1. Before adding capacity, apply QoS queue rate limiting to secondary traffic to protect the critical business.

## Related

- [Switch (legacy) template source](https://github.com/ccfos/nightingale/tree/main/integrations/Switch_Legacy): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `switch_legacy` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/switch_legacy): every config option and the full metric list.
- [SNMP: custom collection by OID](/integrations/snmp)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
