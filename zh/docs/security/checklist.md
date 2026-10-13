# 安全检查清单

把夜莺开放给更多人之前要过一遍的清单。

最后校对于 2026-10-10

这页是前面几页的索引，按「什么时候该做」排。每一条都能在半分钟内确认， 展开的做法在链过去的那一页。

夜莺的默认配置是为「装完就能用」优化的，不是为「直接放给一屋子人用」优化的。 所以第一节的四条不是可选项。

## 1. 装完立刻做[​](#1-装完立刻做 "1. 装完立刻做的直接链接")

| 检查                                                                                                               | 展开                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **改掉 `root` 的默认口令。** `root.2020` 是公开信息，装完到改完之间这台机器是敞开的                                | [用户与团队](https://n9e.github.io/zh/docs/security/users-teams.md)      |
| **换掉配置文件自带的示例 BasicAuth。** `[HTTP.APIForService.BasicAuth]` 里那组账号密码是随代码发布的，所有人都知道 | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| **决定 `[Center.AnonymousAccess]` 关不关。** 两个开关默认都是 `true`，开着的时候数据源查询和反代接口不需要登录     | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| **给自己建一个带名字的管理员账号**，日常别用 `root` 干活——出事时才分得清是谁做的                                   | [用户与团队](https://n9e.github.io/zh/docs/security/users-teams.md)      |

## 2. 让同事进来之前[​](#2-让同事进来之前 "2. 让同事进来之前的直接链接")

这一节都是权限的事。记住权限是两层且的关系，只配一层的结果是「能登录，但什么都看不见」。

| 检查                                                                         | 展开                                                                    |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 团队建好了，人编进去了；业务组授权到团队并标了读写 / 只读                    | [业务组授权](https://n9e.github.io/zh/docs/security/business-groups.md) |
| 确认 `Standard` 对你们够用也不过宽——它带着完整的 `/busi-groups` 增删改权限   | [角色与权限矩阵](https://n9e.github.io/zh/docs/security/roles.md)       |
| 自动化和 AI 客户端用**专用账号**签发 Token，一个用途一个账号，不要用 `Admin` | [Token 与凭据轮换](https://n9e.github.io/zh/docs/security/tokens.md)    |
| 机器从「未归组」里分到了业务组，否则同事在设备列表里看不到它们               | [业务组授权](https://n9e.github.io/zh/docs/security/business-groups.md) |
| 每个人的邮箱 / 手机号 / 联系方式填了——取不到地址的通知是**静默丢弃**的       | [用户与团队](https://n9e.github.io/zh/docs/security/users-teams.md)     |
| 接了 SSO 的话，`DefaultTeams`（或默认团队）配了，且那个团队在业务组里有授权  | [SSO 与外部身份集成](https://n9e.github.io/zh/docs/security/sso.md)     |

## 3. 接外部流量之前[​](#3-接外部流量之前 "3. 接外部流量之前的直接链接")

| 检查                                                                              | 展开                                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| TLS 终结了：要么 `[HTTP] CertFile` + `KeyFile`，要么前面有网关                    | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| **按路径切流量**，没有把 17000 整个放出去——写入端点和管理端点在同一个端口上       | [端口与网络流向](https://n9e.github.io/zh/docs/reference/ports.md)       |
| 采集器写入加了 BasicAuth（`[HTTP.APIForAgent.BasicAuth]` 默认是注释掉的）         | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| 内置时序库：没有只配 `DatasourceUrl` 却不配 BasicAuth——那会把读和写一起对全网打开 | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| `[HTTP] PProf` 关了，`/metrics` 没放到公网                                        | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| `[HTTP.A2A] MCPEnableWriteTools` 保持 `false`，`/mcp` 只暴露只读工具              | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| JWT 有效期按需要调短了（默认访问 25 小时、刷新 7 天）                             | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| 登录页对外可达的话，`[HTTP.ShowCaptcha]` 打开了                                   | [网络与 TLS 加固](https://n9e.github.io/zh/docs/security/network-tls.md) |
| 「打印请求 Body 路径」里没有带凭证的路径，排查完的条目删掉了                      | [站点与用户变量](https://n9e.github.io/zh/docs/security/variables.md)    |
| 配置文件 `chmod 600`，六个可加密字段该加密的加密了                                | [密钥管理](https://n9e.github.io/zh/docs/security/secrets.md)            |

## 4. 验一遍[​](#4-验一遍 "4. 验一遍的直接链接")

清单能骗人，请求不会。换成你自己的地址跑这三条：

```
# 1. 匿名能不能列出数据源？

curl -i https://<你的夜莺地址>/api/n9e/datasource/brief



# 2. pprof 还开着吗？

curl -i https://<你的夜莺地址>/api/debug/pprof/



# 3. 采集器心跳要不要凭据？

curl -i -X POST https://<你的夜莺地址>/v1/n9e/heartbeat
```

期望的结果是**三条都失败**：401、403、404，或者干脆连不上。

拿到 `200` 分别意味着：

1. `[Center.AnonymousAccess] PromQuerier` 还是 `true`，或者这个地址压根没做网络收口—— 任何人都能对你的数据源发查询；
2. `[HTTP] PProf` 还是 `true`，堆和 goroutine 栈可以被拉走；
3. `[HTTP.APIForAgent.BasicAuth]` 还是空的，任何人都能往里写指标。

第 3 条有个例外要注意：拿到 **404** 只说明这个地址上根本没挂采集器接口组， **只有在你确认采集器是从别的地址写入时，它才算通过**。如果是，就换那个地址再跑一遍—— 否则写入通道是敞开的，只是你没往那儿看。

**默认配置下这三条都会返回 200。** 这不是环境坏了，这就是没配之前的样子。

## 5. 定期复查[​](#5-定期复查 "5. 定期复查的直接链接")

| 检查                                                             | 展开                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| 用户列表按**最后活跃时间**排一遍，清理离职账号和废弃的服务账号   | [用户与团队](https://n9e.github.io/zh/docs/security/users-teams.md)  |
| 每个服务账号名下应该只有一条 Token；多出来的是上一轮轮换没删干净 | [Token 与凭据轮换](https://n9e.github.io/zh/docs/security/tokens.md) |
| 仪表盘的公开设置和还没过期的分享链接过一遍——它们和密码是解耦的   | [匿名限时分享](https://n9e.github.io/zh/docs/query/sharing.md)       |
| 按凭据清单轮换一轮：口令、BasicAuth、数据源、SSO、媒介 Token     | [Token 与凭据轮换](https://n9e.github.io/zh/docs/security/tokens.md) |
| 每次升级之后，重新核对一遍端口和配置默认值                       | [端口与网络流向](https://n9e.github.io/zh/docs/reference/ports.md)   |

## 下一步[​](#下一步 "下一步的直接链接")

* 上生产还要看容量、高可用和备份：[生产环境检查清单](https://n9e.github.io/zh/docs/get-started/production-checklist.md)
* 权限模型本身：[认证、Token 与 RBAC 模型](https://n9e.github.io/zh/docs/concepts/auth-rbac.md)
* 逐条权限点：[权限矩阵](https://n9e.github.io/zh/docs/reference/permissions.md)
