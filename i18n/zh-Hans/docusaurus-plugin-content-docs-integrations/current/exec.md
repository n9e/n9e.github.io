---
title: "用脚本给夜莺上报自定义指标（Exec）"
sidebar_label: "Exec"
description: "现成插件覆盖不到的东西，写个脚本按 Prometheus、InfluxDB 行协议或 Open-Falcon 格式打印到 stdout，Categraf 负责采集和上报。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Exec
toc_max_heading_level: 2
mdx:
  format: md
---

exec 插件是 Categraf 的万能兜底：你写脚本，脚本把监控数据打印到标准输出，Categraf 定时执行并解析。脚本用什么语言无所谓，输出格式三选一：Prometheus 文本格式、InfluxDB 行协议（`measurement,label=v field=1`）或 Open-Falcon 的 JSON，由 `data_format` 指定。

适合业务自定义指标、遗留系统的状态检查、一次性的巡检脚本。注意脚本执行时间要短于采集周期，输出的值只能是数字。

## 模板里有什么

- **Categraf 采集配置**：`input.exec`

## 怎么接入

1. [安装 Categraf](/docs/data/categraf/install)，把下面的配置放到 `conf/input.exec/exec.toml`，按实际地址和凭据改好后重启 Categraf。启动日志里出现 `input: local.exec started` 就说明插件已加载。

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   # # commands, support glob
   commands = [
   #     "/opt/categraf/scripts/*.sh"
   ]

   # # timeout for each command to complete
   # timeout = 5

   # # interval = global.interval * interval_times
   # interval_times = 1

   # # choices: influx prometheus falcon
   # # influx stdout example: measurement,labelkey1=labelval1,labelkey2=labelval2 field1=1.2,field2=2.3
   # data_format = "influx"
   ```

## 相关链接

- [Exec 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Exec）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [Categraf `exec` 插件文档](https://github.com/flashcatcloud/categraf/tree/main/inputs/exec)：完整配置项和指标列表。
- [实践：用脚本采集自定义指标](/docs/practice/exec)
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
