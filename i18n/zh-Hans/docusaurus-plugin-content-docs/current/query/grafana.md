---
title: "与 Grafana 配合"
sidebar_label: "与 Grafana 配合"
description: "可视化继续用 Grafana：指向同一批存储，把告警交给夜莺。"
last_reviewed: 2026-10-10
---

这页办完你会得到：Grafana 里的大盘一个不动，夜莺在同一批存储上跑告警。
不需要迁数据，也不需要把面板重画一遍。

## 怎么分工

| 这件事 | 交给谁 | 为什么 |
|---|---|---|
| 画图、临时探索 | Grafana | 你已经攒了几十上百个面板，重做不划算 |
| 告警判定 | 夜莺 | 规则带业务组归属、屏蔽、订阅，判定过程有执行记录 |
| 通知路由与降噪 | 夜莺 | 通知规则、媒介、模板、工作流是一整套 |
| 事件闭环 | 夜莺 | 活跃事件、历史事件、自愈动作在一个地方 |

这个分工成立的前提只有一条：**两边看的是同一批数据**。下面第 1 节和第 2 节是两个
方向，按你的存储在哪儿选一个。

## 1. 两边指向同一批存储

指标已经在 Prometheus / VictoriaMetrics / Thanos 里的，这是最省事的做法：把
Grafana 数据源里那个查询地址，在夜莺里也注册一份。

**集成中心 → 数据源 → 新增 → Prometheus**，URL 填同一个地址，具体字段见
[Prometheus](../data/prometheus.md)。

两点提醒：

- 两边的数据源**名字不用一样**。夜莺的告警规则按夜莺这边的名字选数据源。
- Grafana 的 Prometheus 数据源如果用的是 Server（proxy）访问模式，那个地址是从
  Grafana 所在机器发起的；夜莺所在机器**也要能直连它**，否则数据源测试就过不去。

## 2. 反过来：让 Grafana 查夜莺的内置时序库

指标只存在夜莺的内置时序库里（Categraf 直接推给夜莺）的，Grafana 也能查它——
内置库对外暴露的就是标准的 Prometheus 查询 API，地址是
`http://<夜莺地址>:17000/prometheus`。

但**这个端点默认只接受本机请求**。要让 Grafana 从别的机器查，先配一组 basic auth：

```toml
[EmbeddedTSDB]
Enable = true
BasicAuthUser = "grafana"
BasicAuthPass = "<换成你自己的>"
```

配上之后本机限制就解除了，自动注册的 `embedded-tsdb` 数据源地址也会从 `127.0.0.1`
换成探测到的本机 IP，并带上这组认证。重启夜莺生效。

然后在 Grafana 里新建一个 **Prometheus** 类型数据源：

```
URL        http://<夜莺的 IP>:17000/prometheus
Auth       Basic auth，用户名密码填上面那组
```

保存并测试，能查到 `up` 就通了。

这条路只适合小规模。内置库是单实例本地盘、大约 10 万活跃序列以内的方案，
边界见[内置时序库与外部存储](../concepts/storage.md)。规模上来换成外部时序库之后，
回到第 1 节，两边都指向外部库更简单。

## 3. 把告警搬到夜莺

夜莺规则里写的 PromQL 和 Grafana 面板里的是同一套写法，区别只是阈值判定写进表达式
本身（`... > 1`）。

- 从零写第一条：[创建第一条告警规则](../alerting/first-rule.md)
- 把已有的 Grafana 告警规则搬过来：[从 Grafana 告警迁移](../migration/from-grafana-alerting.md)
- 不想一次切干净、想先并行跑一段：[与既有系统并存](../migration/coexistence.md)

## 把 Grafana 大盘接进夜莺

仪表盘列表页的 **导入** 里有四个 tab，其中两个和 Grafana 有关：

| tab | 做什么 |
|---|---|
| **Grafana 仪表盘链接（推荐）** | 不转换任何东西，建一个 iframe 模式的仪表盘，直接嵌你的 Grafana 页面。填名称、英文标识、分类标签和 Grafana 仪表盘链接 |
| **导入 Grafana 仪表盘（不推荐）** | Beta。把 Grafana 的 dashboard JSON 转成夜莺自己的模型 |

后者的限制界面上就写着：**只支持 Prometheus 类型数据源的仪表盘，以及夜莺支持的
图表类型和功能**。低于 v7 的 dashboard JSON 直接拒绝，v7 到 v8 之间会先警告再让你
选择继续。稍微复杂一点的大盘转过来都要手工收尾——「不推荐」不是客套话。

第三种做法是把整个 Grafana 挂成一个侧栏入口，见[嵌入与被集成](./embedding.md)。

## 让 Grafana 允许被嵌入

上面后两种做法都要 iframe，而 Grafana 默认是禁止被嵌的。改 `grafana.ini`：

```ini
[security]
allow_embedding = true
```

同域名部署到这里就够了。**跨域名**还得让 Grafana 的会话 Cookie 能在第三方上下文里
带上：

```ini
[security]
allow_embedding = true
cookie_secure = true      ; 要求 HTTPS
cookie_samesite = none    ; 允许跨站请求携带 cookie
```

`cookie_secure = true` 之后 Grafana 必须走 HTTPS；原来是 HTTP 的，在前面加一层带
证书的反向代理即可。不加这两行的典型现象是：外层夜莺已经登录了，iframe 里的 Grafana
却一直显示登录页。

不想让访客登录 Grafana 的，也可以开匿名只读：

```ini
[auth.anonymous]
enabled = true
org_name = Main Org.
org_role = Viewer
```

改完重启 Grafana 生效。

## 下一步

- 注册数据源的完整字段：[Prometheus](../data/prometheus.md)
- 在夜莺里自己建盘：[创建仪表盘](./dashboards.md)
- 把外部系统挂进侧栏：[嵌入与被集成](./embedding.md)
