---
title: "Linux 机器监控"
sidebar_label: "Linux 机器监控"
description: "用 Categraf 采集 Linux 指标，区分心跳与时序写入，并排查机器可见但查询无数据和失联告警。"
---

这页办完，你会在夜莺中查到 Linux 主机指标，并知道为什么“设备在线”和“仪表盘有数据”需要分别验证。
采集命令以 **Categraf v0.5.17、夜莺 v9** 为例。

## 采集和接入 {#collect}

先按[安装与注册](../data/categraf/install.md)配置 `writers` 和 `heartbeat`。
主机基础指标由 `cpu`、`mem`、`disk`、`diskio`、`net`、`system` 等输入插件采集；配置文件放在 `conf/input.<插件名>/`。

在 Categraf 安装目录验证单独的插件：

```bash
./categraf --test --inputs cpu:mem:disk
```

**预期结果**：终端打印对应指标，不出现权限、路径或插件配置错误。
这只证明本机采集成功；继续在夜莺即时查询里选择接收数据的时序库，确认 CPU 和内存指标持续更新。

## 设备在线，仪表盘却没数据 {#no-data}

两条链路分开看：

| 链路 | 用途 |
|---|---|
| `heartbeat` → `/v1/n9e/heartbeat` | 设备元信息与存活状态 |
| `writers` → `/prometheus/v1/write` → 时序库 | 查询、仪表盘和指标告警使用的时序样本 |

夜莺 v9 **可以使用内置时序库**，旧文“夜莺只转发、不存储”不再适用于所有部署。
使用外置存储时才继续检查 `Pushgw.Writers` 的写入目标及后端接收配置。

按顺序检查：

1. `--test` 是否输出指标。没有输出，先修采集配置。
2. `conf/config.toml` 的 `writers` 是否指向实际夜莺或 Edge 地址。
3. Categraf 日志是否有 401、连接失败或 `write ... samples failed`。
4. 夜莺写入目标是否正常。Prometheus 接收 Remote Write 时需要启用相应接收功能。
5. 即时查询是否选中了正确的数据源，机器和服务器的时钟是否一致。
6. 仪表盘变量是否过滤了业务组、`ident` 或 `instance`。

```bash
sudo journalctl -u categraf.service -n 100 --no-pager
```

**预期结果**：在正确时序库中直接查询能看到样本；再处理仪表盘变量，避免把展示过滤误当成采集故障。
详细排查见[数据源连上了但查不到数据](../troubleshooting/no-data.md)。

## 机器失联监控 {#missing-host}

使用 Prometheus 主动抓取 Node Exporter 时，可用抓取产生的 `up` 判断成功与否。
Categraf 的 Remote Write 是主动推送，**不会自动产生 Prometheus 抓取的 `up`**。

对 Categraf 主机使用夜莺规则编辑器里的 **Host 类型规则**配置失联检测；先限定需要监控的主机、标签或业务组，再设置失联时长。
测试时只对一台测试主机停止采集并恢复，确认事件触发和恢复，而不是直接影响全部生产主机。

**预期结果**：超过配置时长的测试主机产生失联事件，恢复心跳后规则恢复。
也可以使用独立的 Ping 或端口探测，区别是它们验证网络可达性或服务端口，不证明采集器正常。

## 下一步 {#next}

- [对象与心跳](../data/categraf/targets.md)
- [导入仪表盘与规则](../data/integrations/import.md)
