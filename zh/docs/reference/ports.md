# 端口与网络流向

所有监听端口与所有出向连接，一张表就能写出防火墙规则。

最后校对于 2026-10-10

## 监听（入向）[​](#监听入向 "监听（入向）的直接链接")

| 端口  | 进程                       | 配置项                                | 谁会连它                                 |
| ----- | -------------------------- | ------------------------------------- | ---------------------------------------- |
| 17000 | `n9e`（Center）            | `[HTTP] Port`                         | 浏览器、API 客户端、MCP 客户端、Categraf |
| 19000 | `n9e-edge`                 | `[HTTP] Port`（`etc/edge/edge.toml`） | 边缘机房本地的浏览器和采集器             |
| 20090 | `n9e` / `n9e-edge` 的 ibex | `[Ibex] RPCListen`                    | Categraf 的自愈 agent                    |

## 17000 上挂着什么[​](#17000-上挂着什么 "17000 上挂着什么的直接链接")

**写入端点和管理端点在同一个端口上**，这是做网络收口时最要紧的一点：

| 路径                     | 用途                         | 谁该访问                   |
| ------------------------ | ---------------------------- | -------------------------- |
| `/`                      | Web UI                       | 人                         |
| `/api/n9e/*`             | 前端跑的那套 API             | 人、自动化脚本             |
| `/prometheus/v1/write`   | Prometheus Remote Write 写入 | 采集器                     |
| `/opentsdb/put`          | OpenTSDB 协议写入            | 采集器                     |
| `/openfalcon/push`       | Open-Falcon 协议写入         | 采集器                     |
| `/datadog/api/v1/series` | Datadog Agent 写入           | 采集器                     |
| `/v1/n9e/heartbeat`      | 采集器心跳                   | 采集器                     |
| `/prometheus`            | 内置时序库的查询接口         | 夜莺自己（默认只接受本机） |
| `/mcp`、`/a2a`           | MCP / A2A 端点               | AI 客户端                  |
| `/metrics`               | 自身指标                     | 你的监控系统               |

所以**不能简单地「把 17000 放到公网」**。要么整个放在网关后面按路径分流， 要么把采集器网络和用户网络分开。见[网络与 TLS 加固](https://n9e.github.io/zh/zh/docs/security/network-tls.md)。

## 出向[​](#出向 "出向的直接链接")

| 目标               | 地址来自                       | 什么时候需要                          |
| ------------------ | ------------------------------ | ------------------------------------- |
| MySQL / PostgreSQL | `[DB] DSN`                     | 生产部署（测试用 SQLite 时不需要）    |
| Redis              | `[Redis] Address`              | 生产部署（测试用 miniredis 时不需要） |
| 各类数据源         | 数据源配置                     | 每次规则判定、每次查询                |
| 外部时序库         | `[[Pushgw.Writers]] Url`       | 关掉内置时序库、或做双写时            |
| 通知媒介           | 媒介配置里的 URL / SMTP 服务器 | 每次发通知                            |
| 大模型             | LLM 配置里的 API 地址          | 用 Nightingale AI 时                  |

## 边缘模式[​](#边缘模式 "边缘模式的直接链接")

`n9e-edge` 要能连到中心的 17000（拉规则配置），中心需要开 `[HTTP.APIForService] Enable = true`。边缘和中心的其余流向见[边缘机房](https://n9e.github.io/zh/zh/docs/install/edge.md)。

## 相关[​](#相关 "相关的直接链接")

* [配置项](https://n9e.github.io/zh/zh/docs/reference/configuration.md)
* [网络与 TLS 加固](https://n9e.github.io/zh/zh/docs/security/network-tls.md)
* [生产拓扑参考](https://n9e.github.io/zh/zh/docs/operations/topology.md)
