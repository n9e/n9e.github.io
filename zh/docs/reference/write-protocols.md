# 数据写入协议

Prometheus Remote Write、OpenTSDB、Datadog、Falcon：端点、报文、标签处理。

夜莺接收数据的能力叫 Pushgw，在 Center 进程里（也可以拆成独立的 `n9e-pushgw`）。 **它不长期存数据**——收下来之后按 `[[Pushgw.Writers]]` 的配置转发给一个或多个时序库， 内置时序库开着的话也会写一份。

不用非得走这条路：你已有的 Prometheus 继续抓、夜莺只查询，同样能配告警。 两种接法的差别见[在可观测体系中的位置](https://n9e.github.io/zh/zh/docs/get-started/where-it-fits.md)。

## 端点[​](#端点 "端点的直接链接")

都在 Center 的 17000 端口上：

| 协议                    | 端点                          | 谁在用                                                     |
| ----------------------- | ----------------------------- | ---------------------------------------------------------- |
| Prometheus Remote Write | `POST /prometheus/v1/write`   | Categraf、Prometheus、VictoriaMetrics agent、Grafana Agent |
| OpenTSDB                | `POST /opentsdb/put`          | 老的 OpenTSDB 采集链路                                     |
| Open-Falcon             | `POST /openfalcon/push`       | 从 Open-Falcon 迁过来的采集器                              |
| Datadog                 | `POST /datadog/api/v1/series` | Datadog Agent                                              |
| 采集器心跳              | `POST /v1/n9e/heartbeat`      | Categraf（设备列表靠它）                                   |

Datadog Agent 还会打这几个端点，夜莺都接住了：`/datadog/api/v1/check_run`、 `/datadog/api/v1/metadata`、`/datadog/intake/`。

## 认证[​](#认证 "认证的直接链接")

写入端点受 `[HTTP.APIForAgent]` 控制，默认开着、**不要求认证**。 要加 basic auth：

```
[HTTP.APIForAgent]

Enable = true

[HTTP.APIForAgent.BasicAuth]

user001 = "<你自己的密码>"
```

注意配置文件里自带的那组示例凭据是公开信息，别直接用。

采集器侧对应地填上用户名密码，比如 Categraf 的 `[[writers]] basic_auth_user` / `basic_auth_pass`。

## 标签怎么处理[​](#标签怎么处理 "标签怎么处理的直接链接")

* Remote Write 报文里 series 自带的标签**原样保留**；
* Categraf 的 `[global.labels]` 会作为额外标签附在每条 series 上；
* `hostname`（或 `agent_hostname`）决定设备列表里的机器标识， 也就是后面规则和事件里的 `ident`；
* Pushgw 可以按配置丢弃指定的指标，见 `[Pushgw]` 段的 `DropSample` 相关配置。

## 转发给谁[​](#转发给谁 "转发给谁的直接链接")

```
[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"



# 可以配多个，同时写多份

[[Pushgw.Writers]]

Url = "http://prometheus:9090/api/v1/write"
```

转发给 Prometheus 的话，**Prometheus 启动参数要加 `--web.enable-remote-write-receiver`**（老版本是 `--enable-feature=remote-write-receiver`）， 否则 `/api/v1/write` 根本没在监听，夜莺转发时会收到 404。

内置时序库和外部时序库可以同时写，这就是迁移窗口， 见[外部时序库与双写迁移](https://n9e.github.io/zh/zh/docs/install/external-tsdb.md)。

## 相关[​](#相关 "相关的直接链接")

* [Categraf Remote Write](https://n9e.github.io/zh/zh/docs/data/categraf/remote-write.md)
* [Pushgw 队列与双写](https://n9e.github.io/zh/zh/docs/operations/pushgw.md)
* [端口与网络流向](https://n9e.github.io/zh/zh/docs/reference/ports.md)
