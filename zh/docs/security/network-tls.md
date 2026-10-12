# 网络与 TLS 加固

终结 TLS、限制写入端点、哪些端口绝不能暴露到公网。

这页办完你会得到：一份能直接写成防火墙规则和网关配置的收口方案， 以及一份「默认配置下哪些东西不用登录就能拿到」的清单——后者决定了前者能不能省。

## 17000 上挂了什么[​](#17000-上挂了什么 "17000 上挂了什么的直接链接")

一句话：**全部**。Web 界面、`/api/n9e/*`、四种协议的写入端点、采集器心跳、 内置时序库的查询接口、`/mcp` 和 `/a2a`、`/metrics`，都在同一个端口上。 逐条清单在[端口与网络流向](https://n9e.github.io/zh/zh/docs/reference/ports.md)。

另外两个端口：`n9e-edge` 的 19000，ibex 自愈的 20090（gRPC）。它们都只面向机房内部。

因为写入端点和管理端点共用一个端口，**「把 17000 放到公网」不是一个可选项**。 要么整体放到网关后面按路径切，要么把采集器网络和用户网络分开。

## 默认配置下，不登录能拿到什么[​](#默认配置下不登录能拿到什么 "默认配置下，不登录能拿到什么的直接链接")

先做这个检查，再决定网络怎么划。`[Center.AnonymousAccess]` 的两个开关**默认都是 `true`**：

```
[Center.AnonymousAccess]

PromQuerier = true

AlertDetail = true
```

`PromQuerier = true` 的时候，下面这些接口**根本没有挂登录校验**：数据源全反代 `/api/n9e/proxy/:id/*`、`/v2/query-batch`、`/ds-query`、`/logs-query`、`/datasource/brief`， 以及 ES、Loki、TDengine、IoTDB、VictoriaLogs 的元数据接口。自己验一下：

```
curl https://<你的夜莺地址>/api/n9e/datasource/brief
```

预期结果：**返回 200 和全站数据源清单**，一个凭据都不用带。账号密码、证书和请求头 已经被抹掉了，但名字、类型和连接地址还在；更要紧的是同一批路由里的反代接口， 意味着任何能连上这个端口的人都能对你的数据源发查询。

`AlertDetail = true` 是同一回事，让告警事件详情可以匿名打开。

这两个开关是为「即时查询的图表分享链接」和「事件详情分享」服务的。所以只有两条路： **要么关掉它们，要么就按「17000 是公开的」来设计网络。** 关掉之后， 仪表盘的限时分享链接照常工作——那条通道走的是独立的板级 token，不依赖这两个开关， 断掉的只有 `/chart/<id>` 那种临时图表链接（见[匿名限时分享](https://n9e.github.io/zh/zh/docs/query/sharing.md)）。

## 1. 让夜莺自己跑 HTTPS[​](#1-让夜莺自己跑-https "1. 让夜莺自己跑 HTTPS的直接链接")

`[HTTP]` 里 `CertFile` 和 `KeyFile` **两个都填**，端口不变，协议切成 HTTPS：

```
[HTTP]

Host = "0.0.0.0"

Port = 17000

CertFile = "/etc/n9e/tls/server.crt"

KeyFile = "/etc/n9e/tls/server.key"
```

最低版本是 TLS 1.2，写死在代码里。只填一个等于没填，进程照常跑明文。

预期结果：重启后 `curl -I https://<你的夜莺地址>/ping` 返回 200， 同一个地址的 http 请求不再被受理。

证书是进程启动时读进去的，**换证书要重启进程**，没有热加载。 `n9e-edge` 在 `etc/edge/edge.toml` 里有同名的一组字段。

切到 HTTPS 之后，这几个地方的地址要跟着改：采集器的写入地址、 `[[Pushgw.Writers]] Url`、以及内置时序库自动注册的那个数据源。

## 2. 放到网关后面，按路径切[​](#2-放到网关后面按路径切 "2. 放到网关后面，按路径切的直接链接")

比自己跑 TLS 更常见的做法是前面放一层网关，顺便按路径分流：

| 路径                                                                                                       | 放给谁         |
| ---------------------------------------------------------------------------------------------------------- | -------------- |
| `/`、`/api/n9e/*`                                                                                          | 人             |
| `/prometheus/v1/write`、`/opentsdb/put`、`/openfalcon/push`、`/datadog/api/v1/series`、`/v1/n9e/heartbeat` | 采集器         |
| `/mcp`、`/a2a`                                                                                             | AI 客户端      |
| `/metrics`、`/api/debug/pprof/*`                                                                           | 只给内网自监控 |

如果认证也想交给网关，用 `[HTTP.ProxyAuth]`：网关认完把用户名放在请求头里传进来， 第一次进来时按 `DefaultRoles` 自动建账号。

```
[HTTP.ProxyAuth]

Enable = true

HeaderUserNameKey = "X-User-Name"

DefaultRoles = ["Standard"]
```

两个后果要先接受：

* **开了它，JWT 登录整体停用。** 没有「两种都行」的中间态， 要么全走网关，要么全走夜莺自己的登录页。
* **谁能绕过网关直连 17000 并自己设这个头，谁就是那个用户。** 所以这个开关只有在「17000 只对网关开放」的前提下才成立—— 用防火墙保证，或者把 `[HTTP] Host` 从 `0.0.0.0` 改成只有网关能到的那个地址。

## 3. 给采集器写入加上认证[​](#3-给采集器写入加上认证 "3. 给采集器写入加上认证的直接链接")

`[HTTP.APIForAgent] Enable = true` 是默认值，而**下面的 `BasicAuth` 两行默认是注释掉的**。 也就是说心跳和写入端点开箱即用，不要求任何凭据。

```
[HTTP.APIForAgent]

Enable = true

[HTTP.APIForAgent.BasicAuth]

n9e-agent = "<换成你自己生成的口令>"
```

改完之后所有采集器都要同步这组凭据，否则心跳全断。轮换顺序见 [Token 与凭据轮换](https://n9e.github.io/zh/zh/docs/security/tokens.md)。

`[HTTP.APIForService]` 是另一组，**默认 `Enable = false`**。关着的时候 `/v1/n9e` 这一整组路由 根本没有挂上去，所以配置文件里自带的那组示例账号密码目前是失效的。边缘模式、 独立部署的 alert 进程、以及变量解密都需要开它——开之前先把那组示例密码换掉。

## 4. 内置时序库的 /prometheus[​](#4-内置时序库的-prometheus "4. 内置时序库的 /prometheus的直接链接")

`/prometheus/api/v1/*` 既能查也能**写**（remote write）。它默认只接受本机请求， 判断条件是 `BasicAuthUser` 和 `DatasourceUrl` **两个都为空**：

```
[EmbeddedTSDB]

BasicAuthUser = ""

BasicAuthPass = ""

# DatasourceUrl = ""

# EnableAdminAPI = false
```

只要配了其中**任何一个**，本机限制就解除。这里有个容易踩的坑：`DatasourceUrl` 的本意是 把自动注册的那个数据源地址换成 VIP 或域名，但设置它会**顺带把这组端点对全网打开**。 只填 `DatasourceUrl` 不填 BasicAuth，等于给所有人开了无认证的指标读取和样本注入。 要远程访问就把 `BasicAuthUser` / `BasicAuthPass` 一起配上。

`EnableAdminAPI` 默认 false，打开会注册 `delete_series` 和 `clean_tombstones`—— 配好 BasicAuth 再打开。

## 5. 关掉不打算暴露的东西[​](#5-关掉不打算暴露的东西 "5. 关掉不打算暴露的东西的直接链接")

| 配置项                           | 默认                    | 怎么处理                                                                       |
| -------------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `[HTTP] PProf`                   | `true`                  | `/api/debug/pprof/*` 能拉走堆和 goroutine 栈。对外的实例关掉，或者在网关上拦住 |
| `[HTTP] ExposeMetrics`           | `true`                  | `/metrics`。留给自监控，别放公网                                               |
| `[Center.AnonymousAccess]`       | 两个都 `true`           | 见本页第二节                                                                   |
| `[HTTP.A2A] MCPEnableWriteTools` | `false`                 | 保持 false，`/mcp` 就只注册只读工具                                            |
| `[HTTP.JWTAuth] AccessExpired`   | `1500`（分钟，25 小时） | 会话有效期，敏感环境调短                                                       |
| `[HTTP.JWTAuth] RefreshExpired`  | `10080`（分钟，7 天）   | 同上                                                                           |
| `[HTTP.ShowCaptcha] Enable`      | `false`                 | 登录页验证码。登录页对外可达时打开                                             |

出向连接（数据库、Redis、各类数据源、通知媒介、大模型）的清单在 [端口与网络流向](https://n9e.github.io/zh/zh/docs/reference/ports.md)，防火墙的出方向照那张表写。 Redis 和 `[[Pushgw.Writers]]` 各自带一组 TLS 选项，跨机房时用得上。

## 下一步[​](#下一步 "下一步的直接链接")

* 完整的端口和流向表：[端口与网络流向](https://n9e.github.io/zh/zh/docs/reference/ports.md)
* 把配置文件里的凭证换成密文：[密钥管理](https://n9e.github.io/zh/zh/docs/security/secrets.md)
* 上线前逐项过一遍：[安全检查清单](https://n9e.github.io/zh/zh/docs/security/checklist.md)
