# Center、Alert、Edge、Pushgw 与 Categraf

绝大多数部署只需要 n9e 一个进程；n9e-alert、n9e-pushgw 是可拆出的角色，n9e-edge 给多机房用，Categraf 在采集侧。

最后校对于 2026-10-10

夜莺的发布包里有好几个二进制，但**绝大多数部署只需要一个**。这页说清楚谁是谁。

## 一句话对照[​](#一句话对照 "一句话对照的直接链接")

| 进程            | 负责                                             | 什么时候需要单独部署         |
| --------------- | ------------------------------------------------ | ---------------------------- |
| `n9e`（Center） | Web、API、告警判定、数据写入、通知发送、MCP 端点 | 总是需要。默认它一个人全干了 |
| `n9e-alert`     | 只跑告警判定                                     | 想把判定和 Web 分开扛压力时  |
| `n9e-pushgw`    | 只收数据写入并转发                               | 写入量大、想单独扩容时       |
| `n9e-edge`      | 在边缘机房本地判定告警                           | 多机房且到中心的网络不可靠时 |
| `categraf`      | 采集器，装在被监控机器上                         | 需要采集主机、中间件指标时   |

`n9e` 已经包含了 alert 和 pushgw 的能力。拆出来是**性能选项**，不是必需步骤。 一开始就上三个进程，只会让你多两份配置要对齐。

## Center 是默认答案[​](#center-是默认答案 "Center 是默认答案的直接链接")

`n9e` 进程同时承担：

* **Web 与 API**——你看到的整个界面，以及前端调的那套 HTTP API；
* **告警判定引擎**——按周期查询数据源、判断是否越界、产生事件；
* **Pushgw**——接收 remote write / OpenTSDB / Datadog / Falcon 协议的数据， 按 `Pushgw.Writers` 转发给一个或多个时序库；
* **通知发送**——把事件按通知规则送到各媒介；
* **MCP / A2A 端点**——`/mcp` 和 `/a2a`，默认就是开的。

集群就是多跑几个 `n9e`，配置一致、共享 MySQL 和 Redis，规则会自动分派。

## Edge 是唯一真正的架构变化[​](#edge-是唯一真正的架构变化 "Edge 是唯一真正的架构变化的直接链接")

`n9e-edge` 解决的是一个具体问题：中心机房的判定引擎去查边缘机房的时序库， 网络一抖告警就不准，链路断了就完全不告警。

Edge 部署在边缘机房，规则仍由中心统一管理并下发，但查询和判定发生在边缘本地。 断网期间边缘继续判定、继续发通知；恢复后再和中心同步。

见[边缘机房](https://n9e.github.io/zh/docs/install/edge.md)和[Edge 断网时的行为](https://n9e.github.io/zh/docs/operations/edge-partition.md)。

## Categraf 是采集侧[​](#categraf-是采集侧 "Categraf 是采集侧的直接链接")

`categraf` 不是夜莺的一部分，是配套的采集器（独立仓库、独立版本）。 它装在被监控的机器上，采集操作系统和各类中间件的指标，通过 remote write 推给夜莺。

不用它也行——你已有的 Prometheus、Telegraf、各类 exporter、Datadog Agent 都能把数据交给夜莺，或者干脆让夜莺去查你已有的时序库。

## 最小和常见部署[​](#最小和常见部署 "最小和常见部署的直接链接")

**最小可用**：一个 `n9e`。元数据 SQLite、Redis 用进程内的、指标进内置时序库。 适合试用，不适合生产。

**常见生产**：两三个 `n9e` + MySQL + Redis + 一个外部时序库（VictoriaMetrics 居多）， 被监控机器上装 categraf。

**多机房**：上面这套放中心，每个网络不好的边缘机房加一个 `n9e-edge` 和一个本地时序库。

## 相关[​](#相关 "相关的直接链接")

* [系统架构](https://n9e.github.io/zh/docs/concepts/architecture.md)
* [安装部署](https://n9e.github.io/zh/docs/install/overview.md)
* [生产拓扑参考](https://n9e.github.io/zh/docs/operations/topology.md)
