---
title: "Loki / VictoriaLogs"
sidebar_label: "Loki / VictoriaLogs"
description: "注册日志存储，写 LogQL 或 LogsQL 查询，按条数或匹配结果告警。"
last_reviewed: 2026-10-10
---

这页办完你会得到：一个接好的 Loki 或 VictoriaLogs，一条能在日志检索里查出日志的查询，
以及一条「五分钟内某关键词出现超过 N 次」的告警规则。

两者在夜莺里的定位一样——都是日志存储，都能在**数据查询 → 日志**里检索，
都能配日志类告警规则。区别只在查询语言和地址写法。

有一条共同的限制先说在前面：**这两类数据源都不能用来做仪表盘面板**，
仪表盘的数据源下拉框里选不到它们。要画图就把统计结果落成指标，或者用别的存储。

## Loki：URL 必须带 `/loki`

**集成中心 → 数据源 → 新增 → Loki**。

| 字段 | 填什么 |
|---|---|
| 名称 | 必填 |
| URL | **必须带 `/loki` 后缀**，比如 `http://loki:3100/loki`。表单里的占位符就是 `http://localhost:3100/loki` |
| 超时(单位:ms) | 默认 10000 |
| 用户名 / 密码 | Loki 前面挂了认证网关时填 |
| 自定义HTTP标头 | 多租户模式下在这里加 `X-Scope-OrgID`，值是租户 ID |

<Shot src="/img/docs/data/form-loki.zh" alt="Loki 数据源表单" />

URL 少了 `/loki` 是最常见的错。点 **测试连通性并保存** 时夜莺会请求
`<URL>/api/v1/labels`，返回 404 而且 URL 里没有 `/loki`，它会直接把补好的地址提示给你：
`/loki suffix is miss, please add /loki to the url: ...`。

怎么判断要不要租户 ID：不带租户头直接请求一次 Loki，
返回 `no org id` 就说明开了多租户，得加 `X-Scope-OrgID`。

## VictoriaLogs：地址与返回条数

**集成中心 → 数据源 → 新增 → VictoriaLogs**。

| 字段 | 填什么 |
|---|---|
| 名称 | 必填 |
| HTTP | 服务地址，`http://localhost:9428/`。**不需要**额外的路径后缀 |
| 超时(单位:ms) | 默认 10000 |
| 返回的最大日志条数 | 默认 500。检索时单次最多返回多少条，调大了浏览器会卡 |
| 用户名 / 密码 | 开了认证就填 |
| 自定义HTTP标头 | 网关需要额外头时填 |

<Shot src="/img/docs/data/form-victorialogs.zh" alt="VictoriaLogs 数据源表单" />

## 查询：LogQL 与 LogsQL

**数据查询 → 日志**，选中数据源，两者的查询编辑器不一样。

**Loki 用 LogQL。** 编辑器有两种写法：直接手写查询，或者用构建器一格一格填——
标签、行过滤、解析器、字段筛选、数量限制、区间聚合。手写的话：

```logql
# 查出容器里所有 401 的日志行
{container="checkout"} | json | status="401"

# 最近 5 分钟 401 出现了多少次
count_over_time({container="checkout"} |= "401" [5m])
```

LogQL 的选择器 `{label="value"}` 是必须的，不能空查。行过滤有四个操作符：
`|=` 包含、`!=` 不含、`|~` 正则匹配、`!~` 正则不匹配；
`| json` / `| logfmt` / `| pattern` 用来从日志里解析出字段再聚合。

**VictoriaLogs 用 LogsQL。** 查询框里直接写查询条件，右边可以限制返回条数，
结果支持分组、表格、JSON 三种视图。要把结果画成时序图，得指定**值字段**
（参与绘图的数值列，可多个）和**标签字段**（区分曲线的列）。

```logsql
_stream:{app="checkout"} AND status:401
```

查不到先看时间范围，再看写日志的那一侧（Promtail / Vector / vlogscli）是不是真的在写。

## 按条数或匹配结果告警

**告警通知 → 规则管理 → 新增**，数据源类型选 Loki 或 VictoriaLogs。

日志类规则的判定不是直接对日志行做的，而是对**查询统计出来的数字**做的。
最常用的形态就一句话：**最近 N 分钟里某个条件的日志条数超过阈值**。

Loki 的写法是把统计写进查询本身：

```logql
count_over_time({container="checkout"} |= "ERROR" [5m])
```

告警条件写 `$A > 0`，就是「最近 5 分钟出现过 ERROR 就告警」。把关键词换成
业务错误码、异常栈的特征串，这条规则形态可以直接复用。

VictoriaLogs 的写法是查询出结果之后，用值字段挑出那一列数字，再写阈值。

配完点 **数据预览**，先确认查询返回的数字符合预期，再定阈值。

## 排障

**保存时报 404。** Loki 的 URL 漏了 `/loki`。

**保存通过但查不到日志。** 按这个顺序查：

1. 多租户模式没加 `X-Scope-OrgID`（Loki）；
2. LogQL 少了标签选择器——`{}` 里必须至少有一个匹配条件；
3. 时间范围太窄；
4. 写日志的那一侧根本没在写。用 `logcli`（Loki）或直接 curl VictoriaLogs 的查询接口确认一下。

**规则不触发。** 先在日志检索里把同一条查询跑一遍，确认它真的返回了非零结果；
再检查数据源有没有关联告警引擎集群。

## 下一步

- 日志规则的完整写法：[日志类告警规则](../alerting/log-rules.md)
- 检索技巧：[日志检索与索引模式](../query/log-explorer.md)
- 换成 ES：[ElasticSearch / OpenSearch](./elasticsearch.md)
