---
title: "Monitor Systemd with Nightingale"
sidebar_label: "Systemd"
description: "Reads systemd unit state, restart counts and startup time over D-Bus, so failed or flapping services page you right away."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Systemd
toc_max_heading_level: 2
mdx:
  format: md
---

The systemd input talks to systemd over D-Bus and collects each unit's active state, enabled flag, restart count, task count and startup time. Unlike a plain process check, it tells "the service exists but is failed" apart from "the service keeps getting restarted".

All units are collected by default, minus the noisy automount, device, mount, scope and slice types. In production, narrow it down with `unit_include` to the services you actually care about. Requires Linux with systemd 212 or newer.

## What's in the template

- **1 dashboard**, 7 panels in total
- **3 alert rules**, each with runbook steps
- **12 metric descriptions**
- **Categraf collector config**: `input.systemd`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.systemd/systemd.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.systemd started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   # 是否启用 systemd 插件
   enable = true

   # 包含的 unit 正则表达式，默认为 ".+"（所有unit）
   unit_include = '''.+'''

   # 排除的 unit 正则表达式，默认排除 automount、device、mount、scope、slice 类型
   unit_exclude = '''.+\.(automount|device|mount|scope|slice)'''

   # 是否采集 service unit 的启动时间信息（单位：秒）
   enable_start_time_metrics = true

   # 是否采集 service unit task 的 metrics
   enable_task_metrics = true

   # 是否采集 service unit 重启次数信息
   enable_restarts_metrics = true

   # 是否使用私有 systemd 连接
   systemd_private = true
   ```

1. Open the integration center in Nightingale, find Systemd, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Systemd Monitoring Dashboard | 7 |

## Bundled alert rules

3 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Service state abnormal

S2 Warning · for 3 min · Trigger:

```promql
systemd_unit_state{state!="active"} == 1
```

Runbook:

1. Run systemctl --failed to list every failed unit, then systemctl status \<unit> for its state and recent logs;
1. Use journalctl -u \<unit> -n 100 --no-pager to find the exit reason;
1. For configuration problems, fix the config before systemctl restart \<unit>;
1. For repeated failures, check systemctl show \<unit> -p NRestarts for a restart loop and find the root cause before restarting again.

### Service restarting frequently

S2 Warning · for 3 min · Trigger:

```promql
increase(systemd_service_restart_total[5m]) > 3
```

Runbook:

1. Run journalctl -u \<unit> -n 200 --no-pager to see the error before each exit;
1. Check the exit code and whether it was OOM-killed (dmesg -T | grep -i 'killed process');
1. If an unready dependency is the cause (cannot reach the database, mount not finished), add After=/Requires= to the unit and fix the dependency;
1. While investigating you can systemctl stop the service so it does not flood the disk with logs.

### System state abnormal

S2 Warning · for 3 min · Trigger:

```promql
systemd_system_running == 0
```

Runbook:

1. Run systemctl status for the overall state, then systemctl --failed to list the failed units;
1. Use journalctl -u \<unit> on each to find and fix the failure;
1. Confirm whether the failed units affect critical services — some are unrelated one-shot jobs whose state can be cleared with systemctl reset-failed;
1. After fixing, confirm systemctl is-system-running returns running.

## Metric reference

12 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `systemd_service_restart_total` | Total Service Restarts |  |
| `systemd_socket_accepted_connections_total` | Total Accepted Socket Connections |  |
| `systemd_socket_current_connections` | Current Socket Connections |  |
| `systemd_socket_refused_connections_total` | Total Refused Socket Connections |  |
| `systemd_system_running` | System Running State — Whether the system is in running state (1 = running, 0 = not running) |  |
| `systemd_timer_last_trigger_seconds` | Timer Last Trigger Timestamp |  |
| `systemd_unit_start_time_seconds` | Unit Start Timestamp — Unix timestamp | ms |
| `systemd_unit_state` | Unit State — The state value is one of activating \| active \| deactivating \| failed \| inactive |  |
| `systemd_unit_tasks_current` | Current Task Count |  |
| `systemd_unit_tasks_max` | Maximum Task Limit |  |
| `systemd_units` | Systemd Units — Total number of units in each state. The state is one of activating \| active \| deactivating \| failed \| inactive |  |
| `systemd_version` | Systemd Version Information |  |

## Related

- [Systemd template source](https://github.com/ccfos/nightingale/tree/main/integrations/Systemd): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `systemd` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/systemd): every config option and the full metric list.
- [Walkthrough: processes and ports](/docs/practice/proc)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
