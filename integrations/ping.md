---
title: "Ping probes with Nightingale"
sidebar_label: "Ping"
description: "Ping a list of targets from wherever Categraf runs and get packet loss, round-trip latency and jitter; the simplest liveness check there is."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Ping
toc_max_heading_level: 2
mdx:
  format: md
---

The ping input sends ICMP probes to the addresses in `targets` and reports packet loss, minimum, average, maximum and standard deviation RTT, and TTL. As long as the targets do not block ping, it is the cheapest liveness check; running one Categraf per site and pinging across sites also gives a picture of link quality.

Split targets into several `[[instances]]` blocks with labels such as `region` or `product`; the dashboards and rules filter on them. With many targets, raise the file descriptor limit of the Categraf process. The rules cover unreachable targets and rising packet loss.

## What's in the template

- **2 dashboards**, 6 panels in total
- **1 alert rule**, each with runbook steps
- **6 metric descriptions**
- **Categraf collector config**: `input.ping`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.ping/ping.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.ping started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   # send ping packets to
   targets = [
   #     "www.baidu.com",
   #     "127.0.0.1",
   #     "10.4.5.6",
   #     "10.4.5.7"
   ]

   # # append some labels for series
   # labels = { region="cloud", product="n9e" }

   # # interval = global.interval * interval_times
   # interval_times = 1

   ## Number of ping packets to send per interval.  Corresponds to the "-c"
   ## option of the ping command.
   # count = 1

   ## Time to wait between sending ping packets in seconds.  Operates like the
   ## "-i" option of the ping command.
   # ping_interval = 1.0

   ## If set, the time to wait for a ping response in seconds.  Operates like
   ## the "-W" option of the ping command.
   # timeout = 3.0

   ## Interface or source address to send ping from.  Operates like the -I or -S
   ## option of the ping command.
   # interface = ""

   ## Use only IPv6 addresses when resolving a hostname.
   # ipv6 = false

   ## Number of data bytes to be sent. Corresponds to the "-s"
   ## option of the ping command.
   # size = 56

   # max concurrency coroutine
   # concurrency = 50
   ```

1. Open the integration center in Nightingale, find Ping, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| PING detection by UlricQin | 1 |
| PING Dashboard 2.0 | 5 |

## Bundled alert rules

1 rule. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### PING address detection failed

S2 Warning · for 1 min · Trigger:

```promql
ping_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with ping -c 5 \<target>, then use mtr -n \<target> to find which hop drops packets;
1. If the target is alive, check whether it blocks ICMP — many security policies do, in which case this probe does not apply and you should switch to a port probe;
1. For loss at an intermediate hop, involve the network team;
1. Confirm the target host is not down or suffering a NIC failure.

## Metric reference

6 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `ping_ttl` | Ping ttl time — Time To Live refers to the limited time that a packet can "survive" in the network | s |
| `ping_percent_packet_loss` | Ping packet loss rate | % |
| `ping_average_response_ms` | Ping average time consumed | ms |
| `ping_result_code` | Ping probe result status code — A value of 0 is normal, and a non-0 value is abnormal. If the Ping fails, there should be an exception log in the Categraf log |  |
| `ping_maximum_response_ms` | Ping maximum time consumption | ms |
| `ping_minimum_response_ms` | Ping minimum time consumption | ms |

## Related

- [Ping template source](https://github.com/ccfos/nightingale/tree/main/integrations/Ping): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `ping` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/ping): every config option and the full metric list.
- [Walkthrough: port and connectivity probes](/docs/practice/port)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
