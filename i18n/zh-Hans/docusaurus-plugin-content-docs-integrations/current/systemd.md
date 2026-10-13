---
title: "用夜莺监控 Systemd"
sidebar_label: "Systemd"
description: "通过 D-Bus 读取 systemd unit 的状态、重启次数和启动耗时，服务挂了或反复拉起都能第一时间告警。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Systemd
toc_max_heading_level: 2
mdx:
  format: md
---

systemd 插件通过 D-Bus 接口和 systemd 通信，采集每个 unit 的运行状态、是否 enabled、重启次数、任务数和启动耗时。相比只看进程是否存在，它能分辨「服务在但处于 failed」和「服务被反复拉起」这两种更隐蔽的故障。

默认采集所有 unit，并排除 automount、device、mount、scope、slice 这些噪音类型；生产上建议用 `unit_include` 只保留自己关心的服务。需要 Linux 且 systemd 212 以上。

## 模板里有什么

- **1 张仪表盘**，共 7 个面板
- **3 条告警规则**，每条附处置步骤
- **12 条指标说明**
- **Categraf 采集配置**：`input.systemd`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.systemd/systemd.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.systemd started` 就说明插件已加载。

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

1. 在夜莺「集成中心」里找到 Systemd，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| Sytemd 监控仪表盘 | 7 |

## 内置告警规则

共 3 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### 服务状态异常

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
systemd_unit_state{state!="active"} == 1
```

处置步骤:

1. 用 systemctl --failed 列出所有异常单元，再用 systemctl status \<unit> 看具体状态与最近日志；
1. 用 journalctl -u \<unit> -n 100 --no-pager 定位退出原因；
1. 配置问题先修复配置再 systemctl restart \<unit>；
1. 反复失败的用 systemctl show \<unit> -p NRestarts 确认是否已陷入重启循环，先定位根因不要盲目重启。

### 服务频繁重启

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
increase(systemd_service_restart_total[5m]) > 3
```

处置步骤:

1. 用 journalctl -u \<unit> -n 200 --no-pager 看每次退出前的报错；
1. 检查退出码与是否被 OOM 杀死（dmesg -T | grep -i 'killed process'）；
1. 依赖未就绪导致的（连不上数据库、挂载未完成），在 unit 里补 After=/Requires= 并修复依赖；
1. 定位期间可临时 systemctl stop 该服务，避免持续刷日志占满磁盘。

### 系统状态异常

S2 警告 · 持续 3 分钟 · 触发条件:

```promql
systemd_system_running == 0
```

处置步骤:

1. 用 systemctl status 看整体状态，再用 systemctl --failed 列出失败的单元；
1. 逐个用 journalctl -u \<unit> 定位失败原因并修复；
1. 确认失败单元是否影响关键业务——有些是无关的一次性任务，可用 systemctl reset-failed 清理状态；
1. 修复后再次确认 systemctl is-system-running 返回 running。

## 指标说明

共 12 条，和仪表盘、告警规则里用到的指标一一对应。

| 指标 | 含义 | 单位 |
| --- | --- | --- |
| `systemd_service_restart_total` | 服务重启总次数 |  |
| `systemd_socket_accepted_connections_total` | socket 接受的连接总数 |  |
| `systemd_socket_current_connections` | socket 当前连接数 |  |
| `systemd_socket_refused_connections_total` | socket 拒绝的连接总数 |  |
| `systemd_system_running` | 服务运行状态 — 系统是否处于运行状态（1=运行，0=非运行） |  |
| `systemd_timer_last_trigger_seconds` | timer 上次触发时间戳 |  |
| `systemd_unit_start_time_seconds` | unit 启动时间戳 — Unix时间戳 | ms |
| `systemd_unit_state` | unit 的状态信息 — state值为activating\| active\| deactivating\| failed\| inactive |  |
| `systemd_unit_tasks_current` | 当前任务数量 |  |
| `systemd_unit_tasks_max` | 最大任务数量限制 |  |
| `systemd_units` | systemd_units — 各状态下的 unit 总数. state状态为activating\|active\|deactivating\|failed\|inactive |  |
| `systemd_version` | systemd 版本信息 |  |

## 相关链接

- [Systemd 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Systemd）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `systemd` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/systemd)：完整配置项和指标列表。
- [实践：进程与端口监控](/docs/practice/proc)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
