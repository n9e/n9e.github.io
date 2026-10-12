---
title: "VictoriaMetrics"
sidebar_label: "VictoriaMetrics"
description: "VictoriaMetrics 按 Prometheus 类型接入，再把时序库类型设为 VictoriaMetrics；单机版与集群版的地址写法不同。"
last_reviewed: 2026-10-10
---

先说一句免得你在类型列表里找：**开源版没有「VictoriaMetrics」这个数据源类型**。
VictoriaMetrics 实现了 Prometheus 的查询 API，所以它用 **Prometheus** 类型接入，
再把表单里的「时序库类型」改成 `VictoriaMetrics`。

这页说清三件事：单机版和集群版的地址怎么填、那个「时序库类型」到底改变了什么、
以及夜莺自己也往 VM 里写数据时该怎么配。

## 单机版和集群版的地址不一样

VictoriaMetrics 集群版把读和写拆成了两个组件，地址完全不同，填错就是「连得上但查不到」。

| 用途 | 单机版 | 集群版 |
|---|---|---|
| 数据源 **URL**（查询，vmselect） | `http://{vm}:8428/` | `http://{vmselect}:8481/select/0/prometheus/` |
| 写入地址（vminsert） | `http://{vm}:8428/api/v1/write` | `http://{vminsert}:8480/insert/0/prometheus/api/v1/write` |

集群版路径里的 `0` 是租户 ID（`accountID`）。多租户环境下每个租户配一个数据源，
路径里换成各自的租户 ID。

其余字段和 [Prometheus](./prometheus.md) 完全一样：名称、超时、用户名密码、跳过 SSL 验证、
自定义 HTTP 标头。

## 把「时序库类型」设成 VictoriaMetrics

表单最下面那个 **时序库类型** 下拉框，选 `VictoriaMetrics`。它不影响查询本身，
但改变两处行为：

- **仪表盘变量**。`label_values(metric, label)` 这类变量在查询窗口短于一天时，
  会改走另一个 series 接口取值。VictoriaMetrics 的数据可见性比 Prometheus 略滞后，
  不换接口的话，短时间窗的变量下拉框经常是空的；
- **删除序列**。夜莺删序列时会按 VictoriaMetrics 的接口形态发请求；
  集群版的 URL 里如果带着 `/select/<租户ID>/prometheus`，它会自动换成
  `/delete/<租户ID>/prometheus/...`。

留成 `Prometheus` 不会报错，只是上面这两件事会按 Prometheus 的方式做。

## 夜莺也往 VM 里写数据时

上面讲的都是**读**。如果 Categraf 把指标推给夜莺、夜莺再转发到 VictoriaMetrics，
那还有一条**写**路径要配，它在配置文件里，不在数据源表单里：

```toml
[Pushgw]
# 用数据库里挂在机器上的标签，而不是序列自带的标签
LabelRewrite = true
ForceUseServerTS = true

[[Pushgw.Writers]]
# 单机版
Url = "http://victoriametrics:8428/api/v1/write"
# 集群版则是
# Url = "http://vminsert:8480/insert/0/prometheus/api/v1/write"
# BasicAuthUser = ""
# BasicAuthPass = ""
# Timeout = 10000
```

两个字段容易搞混，记住这条：**数据源 URL 指向 vmselect，`Pushgw.Writers` 指向 vminsert。**
数据源表单里那个 **Remote Write URL** 是第三个东西——它只给[记录规则](../query/recording-rules.md)
回写结果用，和 Categraf 的数据流无关。

`[[Pushgw.Writers]]` 可以和 [`[EmbeddedTSDB]`](./embedded-tsdb.md) 同时开着，两边都写，
这就是从内置库迁到 VictoriaMetrics 的过渡窗口。详见
[外部时序库与双写迁移](../install/external-tsdb.md)。

## 验证

1. 点 **测试连通性并保存**。夜莺会请求一次 `<URL>/api/v1/query?query=1%2B1`，
   通了才入库。集群版报 404，基本可以确定 URL 少了 `/select/0/prometheus/` 这一段；
2. **数据查询 → 指标**，选中这个数据源，跑 `up` 或任意一个你确定存在的指标，看到曲线即可；
3. 如果是夜莺在写：等一个采集周期（Categraf 默认 15 秒），再查一次
   `cpu_usage_active`，能查到就说明写路径也通了。

## 下一步

- 用它写第一条规则：[第一条告警规则](../alerting/first-rule.md)
- 从内置时序库迁过来：[外部时序库与双写迁移](../install/external-tsdb.md)
- 表单字段逐个解释：[Prometheus](./prometheus.md)
