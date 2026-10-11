---
title: "Telegraf 对接"
sidebar_label: "Telegraf 对接"
description: "使用 Telegraf HTTP 输出与 Prometheus Remote Write 把指标写入夜莺，并核验认证、存储和实际数据。"
---

这页办完，你会把已有 Telegraf 的指标写进夜莺使用的时序库，不需要更换采集器。
示例使用 **Telegraf 1.36.3、夜莺 v9**；Telegraf 负责采集，夜莺接收后写入内置时序库或配置的外置存储。

## 开始之前 {#before-you-start}

- 夜莺已启动，Telegraf 所在机器能访问 `http://<夜莺地址>:17000`。
- `[HTTP.APIForAgent]` 的 `Enable` 为 `true`。
- 已确认使用[内置时序库](../install/embedded-tsdb.md)，或正确配置了[外置写入目标](../install/external-tsdb.md)。

用现有 Telegraf 安装即可。新安装参考 [Telegraf 官方安装说明](https://docs.influxdata.com/telegraf/v1/install/)，不要继续使用旧文里的 1.20.4 下载脚本。

## 配置输出 {#configure-output}

把下面内容合入 `telegraf.conf`，替换地址。`outputs.http` 是输出插件，`prometheusremotewrite` 是序列化格式。

```toml
[agent]
interval = "15s"
flush_interval = "15s"

[[outputs.http]]
url = "http://127.0.0.1:17000/prometheus/v1/write"
method = "POST"
data_format = "prometheusremotewrite"
[outputs.http.headers]
Content-Type = "application/x-protobuf"
Content-Encoding = "snappy"
X-Prometheus-Remote-Write-Version = "0.1.0"

[[inputs.cpu]]
percpu = false
totalcpu = true
collect_cpu_time = false
report_active = true

[[inputs.mem]]
```

如夜莺配置了 `[HTTP.APIForAgent.BasicAuth]`，在 `[outputs.http.headers]` **之前**的 `[[outputs.http]]` 中增加 `username`、`password`，与服务端一致。未开启认证时无需填写。

已有配置里如果仍启用了默认 InfluxDB 输出，确认是否需要它，避免额外输出失败混淆排查。
旧 OpenTSDB 接口仍属于兼容协议，字段和指标命名与 Remote Write 不同，迁移时要核对原有仪表盘。

## 验证采集和写入 {#verify}

```bash
telegraf --config /etc/telegraf/telegraf.conf --test
telegraf --config /etc/telegraf/telegraf.conf --once
```

**预期结果**：`--test` 显示 CPU、内存采集结果；`--once` 完成一次采集和输出，没有 401、404 或连接失败。`--test` 本身不验证向夜莺写入。

在夜莺即时查询里选择实际接收数据的时序库，查询 `cpu_usage_active`；应出现带 Telegraf 标签的数据。
确认后，按现有服务方式重启 Telegraf。安装了官方 systemd 单元的机器可以执行 `sudo systemctl restart telegraf`。

Telegraf 不会上报 Categraf 的 heartbeat 元信息；看到时序数据，不等于具备同样的对象注册和自愈能力。
Histogram / Summary 的批量序列化还有边界，见 [1.36.3 格式说明](https://github.com/influxdata/telegraf/blob/v1.36.3/plugins/serializers/prometheusremotewrite/README.md)。

## 下一步 {#next}

- [数据写入协议](../reference/write-protocols.md)
- [创建第一条告警](../alerting/first-rule.md)
