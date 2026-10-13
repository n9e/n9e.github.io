---
title: "TCP/UDP port probes with Nightingale"
sidebar_label: "Net Response"
description: "Checks whether a local or remote port accepts connections and responds as expected; result codes 0 to 4 mean success, timeout, connection failure, read failure and content mismatch."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Net_Response
toc_max_heading_level: 2
mdx:
  format: md
---

The net_response input opens a TCP connection or exchanges a UDP packet with each `host:port` in `targets`, optionally sending a payload and matching the reply against `expect`. The outcome is reported as `net_response_result_code`: 0 success, 1 timeout, 2 connection failed, 3 read failed, 4 response mismatch, along with the connect time.

It answers "can this port be reached from here right now", which is a different question from process liveness or ping reachability. The rules cover unreachable ports and probes taking too long.

## What's in the template

- **2 dashboards**, 3 panels in total
- **1 alert rule**, each with runbook steps
- **2 metric descriptions**
- **Categraf collector config**: `input.net_response`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.net_response/net_response.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.net_response started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   [mappings]
   # "127.0.0.1:22"= {region="local",ssh="test"}
   # "127.0.0.1:22"= {region="local",ssh="redis"}

   [[instances]]
   targets = [
   #     "127.0.0.1:22",
   #     "localhost:6379",
   #     ":9090"
   ]

   # # append some labels for series
   # labels = { region="cloud", product="n9e" }

   # # interval = global.interval * interval_times
   # interval_times = 1

   ## Protocol, must be "tcp" or "udp"
   ## NOTE: because the "udp" protocol does not respond to requests, it requires
   ## a send/expect string pair (see below).
   # protocol = "tcp"

   ## Set timeout
   # timeout = "1s"

   ## Set read timeout (only used if expecting a response)
   # read_timeout = "1s"

   ## The following options are required for UDP checks. For TCP, they are
   ## optional. The plugin will send the given string to the server and then
   ## expect to receive the given 'expect' string back.
   ## string sent to the server
   # send = "ssh"
   ## expected string in answer
   # expect = "ssh"
   ```

1. Open the integration center in Nightingale, find Net Response, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Net Response Dashboard | 2 |
| TCP detection by UlricQin | 1 |

## Bundled alert rules

1 rule. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Network address probe failed

S2 Warning · for 1 min · Trigger:

```promql
net_response_result_code != 0
```

Runbook:

1. Reproduce it on the collector host with nc -vz \<target> \<port> or telnet \<target> \<port>;
1. On the target host run ss -lntp | grep \<port> to confirm a process is listening;
1. If it is listening, check the firewall, security groups and whether it is bound only to 127.0.0.1;
1. If nothing is listening, start the service through its own procedure and confirm the upstream load balancer has taken it out of rotation.

## Metric reference

2 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `net_response_result_code` | NET Probe Result Status Code — A value of 0 means normal, and a value greater than 0 means abnormal. The meanings of each value are as follows: -0: Success 1: Timeout 2: ConnectionFailed -3: ReadFailed 4: StringMismatch |  |
| `net_response_response_time` | NET probe time-consuming | s |

## Related

- [Net Response template source](https://github.com/ccfos/nightingale/tree/main/integrations/Net_Response): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `net_response` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/net_response): every config option and the full metric list.
- [Walkthrough: port and connectivity probes](/docs/practice/port)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
