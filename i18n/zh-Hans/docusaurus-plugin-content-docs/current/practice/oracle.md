---
title: "Oracle 监控"
sidebar_label: "Oracle 监控"
description: "配置 Categraf Oracle 实例与采集 SQL，将结果中的标签列和数值列转成指标，并验证数据库权限。"
---

这页办完，你会从 Oracle 采到时序指标，并理解通用 SQL 和单实例 SQL 放在哪里。
示例依据 **Categraf v0.5.17** 的 Oracle 配置，采集结果写到夜莺 v9 使用的时序库。

## 配置文件 {#configuration-files}

- `conf/input.oracle/oracle.toml`：连接信息和 `[[instances]]`，可配置多个 Oracle 目标。
- `conf/input.oracle/metric.toml`：通用采集 SQL，各实例共用。
- `[[instances.metrics]]`：仅对它所属的实例执行的 SQL。

使用已有[安装与注册](../data/categraf/install.md)中的写入配置，不需要再建一个 Oracle 时序库。

## 单实例配置 {#configure}

在 `oracle.toml` 中配置一个具有对应视图查询权限的监控账号：

```toml
interval = 15

[[instances]]
address = "127.0.0.1:1521/ORCLPDB1"
username = "monitor"
password = "replace-with-monitor-password"
is_sys_dba = false
is_sys_oper = false
max_open_connections = 5
labels = { instance = "oracle-local:1521" }

[[instances.metrics]]
mesurement = "sessions"
label_fields = ["status", "type"]
metric_fields = ["value"]
timeout = "3s"
request = '''
SELECT status, type, COUNT(*) AS value
FROM v$session GROUP BY status, type
'''
```

替换服务名、密码和实例标签。`mesurement` 的拼写是该插件的实际配置键，不要改成 `measurement`。
`status`、`type` 是标签，`value` 是数值；SQL 的列名必须与配置一致。

不要直接使用 SYS 账号。让 DBA 按启用的 SQL 授予所需视图权限；自定义会话查询需要访问 `v$session`，其他内置 SQL 可能还需要别的视图。
不要把一次查询需要的权限当成全部采集的权限清单。

## 验证 {#verify}

```bash
./categraf --test --inputs oracle
```

**预期结果**：打印 Oracle 指标，没有连接、权限或列映射错误。
如果报 ORA 错误，先确认服务名和账号，再确认具体失败 SQL 需要的权限。

确认本地采集后，重启现有服务，在夜莺选择正确时序库，检查 `oracle_` 指标和 `instance` 标签。
多实例必须有可区分的标签，避免相同时间序列相互覆盖。

## 通用 SQL 与查询开销 {#shared-queries}

将需要所有实例执行的 SQL 放进 `metric.toml`，特定实例查询仍放在其 `[[instances.metrics]]` 下。
上线前由 DBA 检查执行计划和采集频率，避免频繁扫描大表。
配置字段及公共 SQL 见 [Oracle 配置目录](https://github.com/flashcatcloud/categraf/tree/v0.5.17/conf/input.oracle)。

## 下一步 {#next}

- [输入插件](../data/categraf/plugins.md)
- [导入仪表盘与规则](../data/integrations/import.md)
