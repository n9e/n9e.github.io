---
title: "已有日志库或数据库"
sidebar_label: "已有日志库或数据库"
description: "用和指标同一套规则体系，对 ElasticSearch、Loki、ClickHouse、MySQL 这类日志库和数据库做告警。"
last_reviewed: 2026-10-10
---

这条路的终点：一条规则跑在你的日志库或业务库上，越界了就产生事件。
和指标告警是同一套规则体系，只是查询语言不同。大约 15 分钟。

## 开源版支持哪些

| 类别 | 类型 | 查询方式 |
|---|---|---|
| 时序 | Prometheus、VictoriaMetrics、Thanos、Mimir | PromQL |
| 时序 | TDengine、IoTDB | SQL |
| 日志 | ElasticSearch、OpenSearch | DSL / Lucene |
| 日志 | Loki | LogQL |
| 日志 | VictoriaLogs | LogsQL |
| 日志 / 分析 | ClickHouse、Doris | SQL |
| 数据库 | MySQL、PostgreSQL | SQL |

一共 11 种。列表以产品里 **集成中心 → 数据源 → 新增** 的实际选项为准。

## 1. 注册数据源

**集成中心 → 数据源 → 新增**，选类型。不同类型要填的东西不一样：

- **ElasticSearch / OpenSearch**：集群地址（可以填多个）、版本号，认证按需；
- **Loki**：地址**必须带 `/loki` 后缀**，比如 `http://loki:3100/loki`，不带会直接被挡下来；
- **VictoriaLogs**：地址即可；
- **ClickHouse**：节点地址（`host:port`）、用户名、密码，协议选 `native` 或 `http`；
- **MySQL / PostgreSQL**：地址、库名、用户名、密码。给一个**只读账号**就够了，
  规则只会执行 SELECT；
- **TDengine**：REST 地址（默认 6041 端口）加用户名密码。

点 **保存并测试**，测试不通过不入库。

## 2. 想清楚「查什么」

日志和数据库的规则，本质是「按周期跑一个查询，把返回的数字和阈值比」。所以你要先想清楚：

- 查询返回的是**一个数**（比如「最近 5 分钟 ERROR 条数」）还是**一组数**
  （比如「按 service 分组的 ERROR 条数」）；
- 一组数的话，用哪个字段做分组——那个字段会变成事件的标签，决定同一类告警怎么合并。

SQL 类数据源要特别注意查询代价：规则是**周期性**执行的，一条要跑 30 秒的 SQL
每分钟跑一次会把库压垮。先在库上手动跑一遍，看清楚执行时间。

## 3. 写规则

**告警通知 → 规则管理 → 新增**，数据源选你刚建的那个。表单会按数据源类型切换成对应的
查询编辑器——ES 是 DSL，Loki 是 LogQL，SQL 类就是 SQL 输入框。

设好评估周期、持续时长、级别，保存。

想先确认查询和阈值对不对，用规则页上的 **试触发**：它拿真实数据跑一遍，
把每个阶段的结果摊开给你看，不用等真的越界。

## 4. 验证

**告警通知 → 告警事件** 看有没有事件。有事件说明「数据源 → 查询 → 判定 → 事件」通了。

## 下一步

- 各类数据源的完整字段说明：[接入数据](../../data/overview.mdx)
- 日志规则怎么写：[日志告警规则](../../alerting/log-rules.md)
- SQL 规则怎么写：[SQL 告警规则](../../alerting/sql-rules.md)
