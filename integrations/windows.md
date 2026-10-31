---
title: "Monitor Windows with Nightingale"
sidebar_label: "Windows"
description: "Categraf reports the same metric names on Windows as on Linux, so host dashboards and rules carry over; extra dashboards cover AD, DNS and ADFS via windows_exporter."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Windows
toc_max_heading_level: 2
mdx:
  format: md
---

Categraf runs on Windows too, and the basic CPU, memory, disk and network metrics keep the same names as on Linux. Host-level alert rules and dashboards therefore do not need a separate Windows edition.

The template also ships a set of dashboards written against windows_exporter metric names, covering Windows Server itself plus Active Directory, DNS and ADFS. Import the "by Categraf" dashboard if you collect with Categraf, or the "exporter" set if you run windows_exporter.

## What's in the template

- **6 dashboards**, 203 panels in total
- **14 alert rules**, each with runbook steps

## How to connect

Categraf installs as a Windows service; see [Install Categraf](/docs/data/categraf/install). The basic inputs are on by default, so no Windows-specific collector config is needed. For windows_exporter, scrape `http://<host>:9182/metrics` with the Categraf `prometheus` input, or [add your existing Prometheus as a data source](/docs/data/prometheus).

1. Open the integration center in Nightingale, find Windows, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Active Directory Federation Services | 53 |
| Active Directory | 67 |
| DNS | 18 |
| Windows Server | 21 |
| Windows Host by Categraf | 24 |
| Windows - exporter | 20 |

## Bundled alert rules

14 rules, disabled on import so you can enable them one by one with your own thresholds. The PromQL condition and runbook steps for the 13 rules in the table below are in the alert rule library: [Windows alert rules](/alert-rules/windows).

| Rule | Severity | For |
| --- | --- | --- |
| Hard disk - expected to be written full in 4 hours - categraf [Windows] | S1 Critical | 1m |
| Hard disk - IO is a bit busy - categraf [Windows] | S2 Warning | 1m |
| Machine load - high memory, please pay attention - categraf[Windows] | S3 Info | 1m |
| packet loss in the inbound direction - categraf[Windows] | S3 Info | 1m |
| packet loss in the outbound direction - categraf [Windows] | S3 Info | 1m |
| Disk larger than 200G is running out of space [Windows] | S3 Info | 1m |
| Disk smaller than 200G is running out of space [Windows] | S3 Info | 1m |
| High CPU utilization - exporter | S2 Warning | 1m |
| High memory usage rate - exporter | S2 Warning | 1m |
| machine reboot in the last 15 minutes - exporter | S3 Info | 1m |
| packet loss issue in the inbound direction - exporter | S2 Warning | 1m |
| packet loss issue in the outbound direction - exporter | S2 Warning | 1m |
| The hard disk is almost full - exporter | S1 Critical | 1m |

### Other rules (1)

These rules are not in the alert rule library, so they are listed here in full.

#### Lost connection with monitoring target - categraf [Windows]

Runbook:

1. First confirm the machine itself is alive (ping, Remote Desktop) — if it is down, handle it as a host outage;
1. If it is alive, run Get-Service categraf to check the service state and Start-Service categraf if it is stopped;
1. Check the logs under the categraf log directory — the usual causes are a config error or network/auth failure to the server;
1. After recovery, confirm the data is continuous, and note that failures during the blind window produced no alerts at all.

## Related

- [Windows template source](https://github.com/ccfos/nightingale/tree/main/integrations/Windows): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
