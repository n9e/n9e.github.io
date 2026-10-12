# 上生产前的检查清单

真正上线前要改掉的东西：默认密码、外置数据库、时序库选型、高可用、备份与自监控。

最后校对于 2026-10-10

单机跑起来很容易，但那套默认配置**不适合生产**。这页是上线前要逐条过一遍的清单。

## 必须做[​](#必须做 "必须做的直接链接")

### 改掉默认密码[​](#改掉默认密码 "改掉默认密码的直接链接")

装完的默认账号是 `root` / `root.2020`，**这是公开信息**。 第一件事就是登录后改密码，或者建一个新的管理员账号再把 root 停掉。

同理，`etc/config.toml` 里 `[HTTP.APIForService.BasicAuth]` 那组示例凭据 （`user001` / `ccc26da7b9aba533cbb263a36c07dcc5`）也是公开的，用到就得换。

### 换掉 SQLite 和进程内 Redis[​](#换掉-sqlite-和进程内-redis "换掉 SQLite 和进程内 Redis的直接链接")

默认配置用的是 SQLite 文件和 miniredis（进程内的假 Redis）， 它们只够单进程测试用，进程一挂数据没有第二份，也不可能多实例共享。

```
[DB]

DBType = "mysql"

DSN = "n9e:<password>@tcp(mysql:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"



[Redis]

RedisType = "standalone"

Address = "redis:6379"
```

PostgreSQL 也支持，`DBType = "postgres"`。

### 决定时序库[​](#决定时序库 "决定时序库的直接链接")

内置时序库默认开着，数据存在**单个 Center 进程的本地磁盘**上。这决定了两件事：

* 多副本部署时每个副本只有一部分数据，所以**要做高可用就必须关掉它**；
* 规模上去（大致 10 万活跃序列以上）它也扛不住。

上生产基本都要换成外部时序库：

```
[EmbeddedTSDB]

Enable = false



[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"
```

迁移期可以两个都开着做双写，等新库数据攒够了再关掉内置的。

## 强烈建议[​](#强烈建议 "强烈建议的直接链接")

### 多实例[​](#多实例 "多实例的直接链接")

多台机器各跑一个 `n9e`，配置文件保持一致，连同一套 MySQL 和 Redis。 告警规则会自动在实例间分派，一条规则只在一个实例上跑，不会重复告警； 某个实例挂了，它的规则会被别的实例接管。

### 备份[​](#备份 "备份的直接链接")

至少要备的是**元数据库**——用户、业务组、告警规则、仪表盘、通知配置全在里面。 配置文件（`etc/`）也要进版本管理。内置时序库的数据要不要备份，取决于你是否还依赖它。

备份得定期演练恢复，没验证过的备份等于没有。

### 自监控[​](#自监控 "自监控的直接链接")

告警系统自己挂了，是不会给你发告警的。每个进程都在 `/metrics` 上暴露自身指标， 把夜莺自己也接进来，至少盯住：进程存活、告警判定是否在按周期执行、通知投递失败数。

见[监控夜莺自身](https://n9e.github.io/zh/zh/docs/operations/self-monitoring.md)。

### 决定匿名访问要不要留着[​](#决定匿名访问要不要留着 "决定匿名访问要不要留着的直接链接")

`[Center.AnonymousAccess]` 的两个开关**默认都是 `true`**：

```
[Center.AnonymousAccess]

PromQuerier = true

AlertDetail = true
```

开着的时候，**查询和代理相关的接口不需要登录**。实测：不带任何凭据 `GET /api/n9e/datasource/brief` 会返回全部数据源的名字、类型和连接地址（密码是打码的）， `GET /api/n9e/proxy/<数据源 id>/api/v1/query?query=<PromQL>` 直接返回查询结果。

它默认开着是为了让仪表盘的匿名分享链接能用。如果你不需要这个能力，就关掉； 需要的话，**这个端口就绝对不能直接暴露在公网上**。

### 收口网络[​](#收口网络 "收口网络的直接链接")

写入端点（`/prometheus/v1/write`、`/v1/n9e/heartbeat`）和管理端口不该直接暴露在公网上。 需要外网访问就放在网关后面，配好 TLS。见[网络与 TLS 加固](https://n9e.github.io/zh/zh/docs/security/network-tls.md)。

### 把凭据挪出配置文件[​](#把凭据挪出配置文件 "把凭据挪出配置文件的直接链接")

数据库密码、通知媒介的 token、大模型 API Key 都不该硬编码在 `config.toml` 里。 见[凭据管理](https://n9e.github.io/zh/zh/docs/security/secrets.md)。

## 上线之后[​](#上线之后 "上线之后的直接链接")

* 通知链路要**真的验证过一次**：从规则触发到手机响，不要等真出事才发现媒介配错了；
* 至少配一条「采集器失联」类的规则，否则数据断了你是不知道的；
* 把升级和回滚的步骤先走一遍：[升级](https://n9e.github.io/zh/zh/docs/install/upgrade.md)、[回退](https://n9e.github.io/zh/zh/docs/install/rollback.md)。
