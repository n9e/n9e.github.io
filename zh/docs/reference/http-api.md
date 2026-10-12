# HTTP API

页面本身跑在上面的那套 API：认证、按对象分的端点、以及为什么没有 OpenAPI 文档。

最后校对于 2026-10-11

夜莺的 Web 界面**完全跑在一套公开的 HTTP API 上**——你在界面上能做的每一件事， 都有对应的接口。这是好消息：自动化不需要另一套 API，界面用什么你就用什么。

**当前没有 OpenAPI / Swagger 文档。** 权威来源是路由表本身： `ccfos/nightingale/center/router/router.go`，413 个 `/api/n9e/*` 接口都注册在那里。 想知道某个操作对应哪个接口，最快的办法是**打开浏览器开发者工具的网络面板，在界面上做一遍**。

## 两组 API[​](#两组-api "两组 API的直接链接")

| 分组     | 前缀         | 认证                  | 用途                                  |
| -------- | ------------ | --------------------- | ------------------------------------- |
| 页面 API | `/api/n9e/*` | JWT 或 `X-User-Token` | 人和自动化都用这一组，413 个接口      |
| 服务 API | `/v1/n9e/*`  | basic auth            | 给外部系统集成用，91 个接口，默认关闭 |

服务 API 由 `[HTTP.APIForService]` 控制，默认 `Enable = false`。 边缘模式需要把它打开。

## 认证[​](#认证 "认证的直接链接")

**推荐用个人 Token。** 在界面右下角头像菜单里生成，长期有效直到删除：

```
curl -H "X-User-Token: <token>" \

     --noproxy '*' \

     http://n9e:17000/api/n9e/busi-groups
```

也可以用账号密码换 JWT：

```
curl -X POST http://n9e:17000/api/n9e/auth/login \

     -H 'Content-Type: application/json' \

     -d '{"username":"root","password":"<password>"}'

# 取响应里的 dat.access_token，之后用 Authorization: Bearer <token>
```

**Token 没有独立权限**——它就是「以那个用户的身份行动」。给自动化用的 Token 应该建一个最小权限的专用账号再生成，见[Token 与凭据轮换](https://n9e.github.io/zh/zh/docs/security/tokens.md)。

## 响应形状[​](#响应形状 "响应形状的直接链接")

成功和失败都是 200，靠 body 里的 `err` 字段区分：

```
{"dat": {...}, "err": "", "request_id": "..."}

{"err": "some message", "request_id": "..."}
```

列表接口的 `dat` 有两种形状，**写脚本时两种都要处理**： 有的直接是数组，有的是 `{"list": [...], "total": N}`。

## ⚠️ 状态码不能当作「接口存在」的证据[​](#️-状态码不能当作接口存在的证据 "⚠️ 状态码不能当作「接口存在」的证据的直接链接")

**未匹配的 `/api/n9e/*` 路径会返回 200 加一个 HTML 页面**（前端的单页应用入口）， 不是 404。所以：

```
# 这条什么也证明不了——路径写错了也是 200

curl -o /dev/null -w '%{http_code}' http://n9e:17000/api/n9e/does-not-exist
```

判断接口是否存在，要看响应体是不是 JSON，或者直接查路由表。 这条坑在[排障](https://n9e.github.io/zh/zh/docs/troubleshooting/no-data.md)里还会再遇到。

## 常用端点[​](#常用端点 "常用端点的直接链接")

按对象分，完整清单看路由表：

| 对象         | 端点                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| 业务组       | `GET/POST /busi-groups`、`PUT/DELETE /busi-group/:id`                                                           |
| 告警规则     | `GET/POST /busi-group/:id/alert-rules`、`POST /busi-group/:id/alert-rules/import`、`GET /alert-rule/:arid/pure` |
| 活跃告警     | `GET /alert-cur-events/list`、`GET /alert-cur-events/card`、`DELETE /alert-cur-events`                          |
| 历史告警     | `GET /alert-his-events/list`                                                                                    |
| 屏蔽规则     | `GET/POST /busi-group/:id/alert-mutes`                                                                          |
| 订阅规则     | `GET/POST /busi-group/:id/alert-subscribes`                                                                     |
| 数据源       | `POST /datasource/list`、`POST /datasource/upsert`、`DELETE /datasource/`                                       |
| 仪表盘       | `GET/POST /busi-group/:id/boards`、`GET/PUT /board/:bid`、`POST /busi-groups/boards/clones`                     |
| 对象（机器） | `GET /targets`、`PUT /targets/bgids`、`PUT /targets/note`、`POST /targets/tags`                                 |
| 通知规则     | `GET/POST /notify-rules`、`PUT /notify-rule/:id`                                                                |
| 通知媒介     | `GET/POST /notify-channel-configs`、`PUT /notify-channel-config/:id`                                            |
| 消息模板     | `GET/POST /message-templates`、`PUT /message-template/:id`                                                      |
| 工作流       | `GET /event-pipelines`、`POST/PUT /event-pipeline`                                                              |
| 用户与团队   | `GET/POST /users`、`GET/POST /user-groups`、`GET /roles`                                                        |
| 集成模板     | `GET /builtin-components`、`GET /builtin-payloads`                                                              |

**新增类接口有几个收的是数组不是单个对象**：`/notify-channel-configs`、 `/message-templates`、`/notify-rules` 都是。传单个对象会报 `cannot unmarshal object into Go value of type []...`。

## 没有创建事件的接口[​](#没有创建事件的接口 "没有创建事件的接口的直接链接")

`/alert-cur-events` 和 `/alert-his-events` **只有查询和删除**，没有创建。 事件只能由告警引擎判定产生。要造测试数据，就建一条必然触发的规则。

## 数据写入[​](#data-ingestion "数据写入的直接链接")

采集器请求与页面管理 API 是不同链路。`[HTTP.APIForAgent].Enable` 控制接收入口， 指标写入内置存储或配置的外置目标。页面登录 JWT 不能替代采集器凭据。

| 格式                    | 接收入口                      | 配置说明                                                                                                                                   |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Prometheus Remote Write | `POST /prometheus/v1/write`   | [Telegraf](https://n9e.github.io/zh/zh/docs/agent/telegraf.md)、[Categraf](https://n9e.github.io/zh/zh/docs/data/categraf/remote-write.md) |
| OpenTSDB JSON           | `POST /opentsdb/put`          | [数据写入协议](https://n9e.github.io/zh/zh/docs/reference/write-protocols.md)                                                              |
| Datadog v1 series       | `POST /datadog/api/v1/series` | [Datadog Agent 兼容说明](https://n9e.github.io/zh/zh/docs/agent/datadog-agent.md)                                                          |

开启认证时，Remote Write 和 OpenTSDB 使用 Agent BasicAuth；Datadog v1 series 则将 `api_key` 与其中的密码值匹配。先确认认证和实际写入目标，再在时序库中查询， 不能把 HTTP 响应成功直接当成数据已经可查询。

## 相关[​](#相关 "相关的直接链接")

* [Token 与凭据轮换](https://n9e.github.io/zh/zh/docs/security/tokens.md)
* [权限矩阵](https://n9e.github.io/zh/zh/docs/reference/permissions.md)
* [MCP 工具](https://n9e.github.io/zh/zh/docs/reference/mcp-tools.md)（同一套权限模型的另一个入口）
