# 端口与网络流向（写 reference/ports 和 security/network-tls 时用）

从 `ccfos/nightingale/etc/config.toml`、`etc/edge/edge.toml` 抽出来的，
版本升级后重新 `grep -rnE '^\s*(Port|RPCListen|Listen|Address)\s*=' etc/config.toml etc/edge/edge.toml` 核对。

## 监听（入向）

| 端口 | 进程 | 配置项 | 谁会连它 |
|---|---|---|---|
| 17000 | `n9e`（Center） | `[HTTP] Port` | 浏览器、API 客户端、MCP 客户端、Categraf（写入 + 心跳） |
| 19000 | `n9e-edge` | `[HTTP] Port`（edge.toml） | 边缘机房本地的浏览器和采集器 |
| 20090 | `n9e` / `n9e-edge` 的 ibex | `[Ibex] RPCListen` | Categraf 的自愈 agent |

Center 的 17000 上同时挂着：Web UI、`/api/n9e/*`、`/prometheus/v1/write`（remote write 写入）、
`/v1/n9e/heartbeat`（心跳）、`/prometheus`（内置时序库的查询接口）、`/mcp`、`/a2a`、`/metrics`。

**写入端点和管理端点在同一个端口上**，这是做网络收口时要注意的地方——
不能简单地「把 17000 放到公网」。

## 出向

| 目标 | 默认地址 | 什么时候需要 |
|---|---|---|
| MySQL / PostgreSQL | `[DB] DSN` | 生产部署（测试用 SQLite 时不需要） |
| Redis | `[Redis] Address`，默认 `127.0.0.1:6379` | 生产部署（测试用 miniredis 时不需要） |
| 各类数据源 | 数据源配置里的地址 | 每次规则判定、每次查询 |
| 外部时序库 | `[[Pushgw.Writers]] Url` | 关掉内置时序库、或做双写时 |
| 通知媒介 | 媒介配置里的 URL / SMTP | 每次发通知 |
| 大模型 | LLM 配置里的 API 地址 | 用 Nightingale AI 时 |

边缘模式下 `n9e-edge` 还要能连到中心的 17000（拉规则配置），
中心也要能连边缘——具体方向见 `install/edge.md`。
