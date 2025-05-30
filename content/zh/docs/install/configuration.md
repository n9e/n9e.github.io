---
title: "配置讲解"
description: "讲解夜莺监控的配置文件，对各个配置项的作用做详细讲解"
lead: ""
date: 2025-02-27T11:00:00+08:00
lastmod: 2025-02-27T11:00:00+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 500
toc: true
---

中心端 n9e 的配置文件是 `etc/config.toml`，边缘告警引擎 n9e-edge 的配置文件是 `etc/edge/edge.toml`。这里我们先分块讲解 n9e 的配置文件。

## Global

```toml
[Global]
RunMode = "release"
```

这是夜莺研发人员用的配置项，普通用户不需要关心，永远保持 `release` 即可。

## Log

```toml
[Log]
# stdout, stderr, file
Output = "stdout"
# log write dir
Dir = "logs"
# log level: DEBUG INFO WARNING ERROR
Level = "DEBUG"
# # rotate by time
# KeepHours = 4
# # rotate by size
# RotateNum = 3
# # unit: MB
# RotateSize = 256
```

- `Output`：日志输出方式，支持 `stdout`、`stderr`、`file`，只有在 `file` 模式下才会把日志输出到文件，才会用到下面的其他配置项
- `Dir`：日志文件的存放目录
- `Level`：日志级别，支持 `DEBUG`、`INFO`、`WARNING`、`ERROR`
- `KeepHours`：日志文件保留时间，单位小时。日志既可以按照时间切分，也可以按照大小切分，如果按照时间切分，就用这个配置项，每小时一个日志文件，如果按照大小切分，就用下面两个配置项
- `RotateNum`：日志文件保留数量
- `RotateSize`：日志文件大小，单位 MB

## HTTP

```toml
[HTTP]
# http listening address
Host = "0.0.0.0"
# http listening port
Port = 17000
# https cert file path
CertFile = ""
# https key file path
KeyFile = ""
# whether print access log
PrintAccessLog = false
# whether enable pprof
PProf = true
# expose prometheus /metrics?
ExposeMetrics = true
# http graceful shutdown timeout, unit: s
ShutdownTimeout = 30
# max content length: 64M
MaxContentLength = 67108864
# http server read timeout, unit: s
ReadTimeout = 20
# http server write timeout, unit: s
WriteTimeout = 40
# http server idle timeout, unit: s
IdleTimeout = 120
```

- `Host`：HTTP 服务监听地址，一般都是 `0.0.0.0`，表示监听所有网卡
- `Port`：HTTP 服务监听端口
- `CertFile`：HTTPS cert 文件路径
- `KeyFile`：HTTPS key 文件路径
- `PrintAccessLog`：是否打印访问日志
- `PProf`：是否开启 pprof，如果开启的话，在 `/api/debug/pprof/` 下可以看到 pprof 的信息
- `ExposeMetrics`：是否暴露 Prometheus 的 `/metrics` 接口，用于暴露夜莺自身的监控指标
- `ShutdownTimeout`：HTTP 服务优雅关闭超时时间，单位秒
- `MaxContentLength`：HTTP 请求最大长度，单位字节
- `ReadTimeout`：HTTP 读超时时间，单位秒
- `WriteTimeout`：HTTP 写超时时间，单位秒
- `IdleTimeout`：HTTP 空闲超时时间，单位秒


### HTTP.ShowCaptcha

```toml
[HTTP.ShowCaptcha]
Enable = false
```

- `Enable`：是否开启验证码功能

### HTTP.APIForAgent

```toml
[HTTP.APIForAgent]
Enable = true
# [HTTP.APIForAgent.BasicAuth]
# user001 = "ccc26da7b9aba533cbb263a36c07dcc5"
```

- `Enable`：是否开启 Agent 的 API 接口，正常来讲必然是要开启的，所以这个配置项一般都是 `true`
- `BasicAuth`：Agent 的 API 接口支持 BasicAuth，这里配置 BasicAuth 用户名和密码，一般内网通信的话，不需要配置 BasicAuth，如果是公网通信的话，建议配置 BasicAuth，而且，密码一定不要使用默认的，容易被攻击

### HTTP.APIForService

```toml
[HTTP.APIForService]
Enable = false
[HTTP.APIForService.BasicAuth]
user001 = "ccc26da7b9aba533cbb263a36c07dcc5"
```

- `Enable`：是否开启 Service 的 API 接口，边缘告警引擎 n9e-edge 和中心 n9e 通信就依赖中心端的这部分接口，所以如果你用到了 n9e-edge，就需要启用，即设置为 `true`
- `BasicAuth`：Service 的 API 接口支持 BasicAuth，这里配置 BasicAuth 用户名和密码，一般内网通信的话，不需要配置 BasicAuth，如果是公网通信的话，建议配置 BasicAuth，而且，密码一定一定不要使用默认的，容易被攻击

### HTTP.JWTAuth

```toml
[HTTP.JWTAuth]
# unit: min
AccessExpired = 1500
# unit: min
RefreshExpired = 10080
RedisKeyPrefix = "/jwt/"
```

夜莺的认证使用 jwt 的方式，这里配置 jwt 的过期时间，单位分钟，`AccessExpired` 是 access token 的过期时间，`RefreshExpired` 是 refresh token 的过期时间。jwt 机制下这俩 token 的作用可以问一下 GPT，这里不再赘述。夜莺会把部分 jwt 相关的信息存到 redis 中，`RedisKeyPrefix` 是 redis 的 key 前缀，一般不用改。

### HTTP.ProxyAuth

```toml
[HTTP.ProxyAuth]
# if proxy auth enabled, jwt auth is disabled
Enable = false
# username key in http proxy header
HeaderUserNameKey = "X-User-Name"
DefaultRoles = ["Standard"]
```

如果你想把夜莺嵌入到你自己的系统中，可以考虑使用 ProxyAuth 方式，类似 Grafana 的 ProxyAuth。相当于用户在你自己的系统中登录，你可以拿到用户名，然后把用户名放到 `X-User-Name` 这个 Header 中传给夜莺，夜莺就会认为这个用户已经登录了。`DefaultRoles` 是默认角色，如果你不传角色，夜莺就会把这个用户当做 `Standard` 角色处理。

实际上据我观察，目前并没有社区用户使用这个功能，所以请慎重使用。

### HTTP.RSA

```toml
[HTTP.RSA]
OpenRSA = false
```

夜莺在登录的时候，用户密码的传说是明文的，如果夜莺站点是 HTTPS 的倒是还好，如果是 HTTP 的，就建议开启 RSA 加密，这样用户密码就不会明文传输了。

## DB

```toml
[DB]
# mysql postgres sqlite
DBType = "sqlite"
# postgres: host=%s port=%s user=%s dbname=%s password=%s sslmode=%s
# postgres: DSN="host=127.0.0.1 port=5432 user=root dbname=n9e_v6 password=1234 sslmode=disable"
# mysql: DSN="root:1234@tcp(localhost:3306)/n9e_v6?charset=utf8mb4&parseTime=True&loc=Local"
DSN = "n9e.db"
# enable debug mode or not
Debug = false
# unit: s
MaxLifetime = 7200
# max open connections
MaxOpenConns = 32
# max idle connections
MaxIdleConns = 8
```

DBType 和 DSN 是最为关键的，两个配置联动。DBType 支持 `mysql`、`postgres`、`sqlite` 三种数据库，DSN 是数据库连接信息，如果是 sqlite，就是数据库文件路径，如果是 mysql 或 postgres，就是数据库连接信息。

夜莺从 v8 版本开始，默认 DBType 设置的是 `sqlite`，这样方便用户快速体验，不需要安装数据库。但是，生产环境中，还请使用 `mysql` 或 `postgres`。

Postgres 和 MySQL 的 DSN 配置可以参考注释中的例子。其他配置是数据库连接相关的配置，根据自己的环境来修改即可。一般中小型环境，`MaxOpenConns` 设置为 32，`MaxIdleConns` 设置为 8 就可以了。

## Redis

```toml
[Redis]
# standalone cluster sentinel miniredis
RedisType = "miniredis"
# address, ip:port or ip1:port,ip2:port for cluster and sentinel(SentinelAddrs)
Address = "127.0.0.1:6379"
# Username = ""
# Password = ""
# DB = 0
# UseTLS = false
# TLSMinVersion = "1.2"
# Mastername for sentinel type
# MasterName = "mymaster"
# SentinelUsername = ""
# SentinelPassword = ""
```

Redis 除了用于存储 jwt 相关的登录认证信息，还用于存放机器的心跳上报的 metadata。夜莺中支持的机器失联告警规则，就是根据 Redis 中机器的心跳时间来判断的，如果很长时间没有心跳了，就认为机器失联了。

RedisType 支持 `standalone`、`cluster`、`sentinel`、`miniredis` 四种，从夜莺 v8 版本开始，夜莺默认使用 `miniredis`，这样方便用户快速体验，不需要安装 Redis。但是，生产环境中，还请使用其他模式。

Address 是 Redis 的连接地址，根据 RedisType 的不同，配置方式也不同：

- `standalone`：RedisType 是 `standalone` 时，Address 就是 Redis 实例的地址，格式是 `ip:port`
- `cluster`：RedisType 是 `cluster` 时，Address 就是 Redis 集群的地址，格式是 `ip1:port,ip2:port`
- `sentinel`：RedisType 是 `sentinel` 时，Address 就是 Redis Sentinel 的地址，格式是 `ip1:port,ip2:port`，哨兵模式下，还需要配置 `MasterName`、`SentinelUsername`、`SentinelPassword`
- `UseTLS`：是否使用 TLS
- `TLSMinVersion`：TLS 最小版本，只有在 `UseTLS` 为 `true` 时才生效

## Alert

夜莺从某个版本开始，为了降低部署复杂度，把 webapi 和告警引擎模块合并在一起了，Alert 这里的配置项是告警引擎的配置项。

### Alert.Heartbeat

```toml
[Alert.Heartbeat]
# auto detect if blank
IP = ""
# unit ms
Interval = 1000
EngineName = "default"
```

- `IP`：告警引擎的 IP 地址，如果是空的话，夜莺会自动探测。每个告警引擎都会写心跳信息到 MySQL，这样一来，每个告警引擎都知道所有活着的告警引擎列表，进而就可以做告警规则的分片处理了。比如有 100 条告警规则，有两个 n9e 组成集群，那么每个 n9e 大概会处理 50 条告警规则，当其中一个告警引擎挂掉的时候，另一个告警引擎就会接管这 100 条告警规则。
- `Interval`：心跳间隔，单位毫秒
- `EngineName`：告警引擎的名字，一般中心端就维持 `default` 即可，边缘告警引擎 n9e-edge 的话，可以自定义 EngineName，比如 `edge1`、`edge2` 等。相同 EngineName 的告警引擎会被认为是一个集群。

## Center

中心端 n9e 的特有配置，边缘告警引擎 n9e-edge 没有这些配置项。即老版本的 n9e-webapi 相关的特有的配置。

```toml
[Center]
MetricsYamlFile = "./etc/metrics.yaml"
I18NHeaderKey = "X-Language"

[Center.AnonymousAccess]
PromQuerier = true
AlertDetail = true
```

- `MetricsYamlFile`：指标配置文件路径，你在快捷视图里看到的指标的解释说明就是来自这个配置文件。后来上线了指标视图，这个配置文件就不那么重要了，甚至后面计划下掉快捷视图的功能。
- `I18NHeader`：这是一个研发人员用的配置项，普通用户不需要关心。
- `Center.AnonymousAccess`：匿名访问相关的配置项。PromQuerier 是指是否允许匿名查询各数据源的接口，AlertDetail 是指是否允许匿名查看告警详情。内网环境可以开启，公网环境一定要关闭。

仪表盘有个公开访问的功能，甚至可以设置为不需要登录就可以访问，但是这个前提是 PromQuerier 需要设置为 `true`，即如果 `PromQuerier = false`，那么即使设置了仪表盘为公开访问，也是需要登录的。

## Pushgw

夜莺虽然不直接存储监控数据，但是提供了多种接收监控数据的接口，比如 Prometheus remote write 协议的接口、OpenTSDB 协议的接口等。接收到数据之后，夜莺会把监控数据转发给后端时序库，所以这里夜莺就相当于一个 Pushgateway，跟 Pushgateway 相关的配置项就在 `Pushgw` 下面了。

```toml
[Pushgw]
# use target labels in database instead of in series
LabelRewrite = true
ForceUseServerTS = true
```

- `LabelRewrite`：夜莺有个机器管理的菜单，可以给机器打标签，并且这些标签会附加到机器相关的时序数据里。但是，如果上报的数据中有个标签和机器管理里的标签冲突了，以哪个为准呢？如果 `LabelRewrite` 为 `true`，就以机器管理里的标签为准，否则以上报的标签为准。
- `ForceUseServerTS`：是否强制使用服务端的时间戳，来覆盖接收到的监控数据的时间戳。之前没有这个配置项，由于很多公司的机器时间没有校准导致各种困惑，所以夜莺提供了这个配置，建议开启，统一使用服务端的时间戳得了。

### Pushgw.DebugSample

```toml
[Pushgw.DebugSample]
ident = "xx"
__name__ = "cpu_usage_active"
```

这个配置是为了调试、排查问题用的。这个配置其实是一个监控指标的过滤条件，如果上报给夜莺的指标符合这个过滤条件，就会打印到日志中。一般不需要配置，注释掉即可。

### Pushgw.WriterOpt

```toml
[Pushgw.WriterOpt]
QueueMaxSize = 100000
QueuePopSize = 3000
AllQueueMaxSize = 5000000
# fresh time, unit ms
# AllQueueMaxSizeInterval = 200
```

这是一些流控配置，夜莺会在内存里创建很多队列，用于缓存接收到的监控数据，然后再批量写入到后端时序库。通常是每个机器一个队列，所以队列的数量就是机器的数量。

- `QueueMaxSize`：单个队列的最大长度。
- `QueuePopSize`：单次从队列里取出的指标量，即每个请求写入到后端时序库的指标量。
- `AllQueueMaxSize`：所有队列总长度限制，如果超出这个长度，说明队列堆积，就会拒绝接收监控数据。
- `AllQueueMaxSizeInterval`：队列堆积检测的时间间隔，单位毫秒。维持默认即可。

如果有些监控数据没有带上 agent_hostname 标签（即后来服务端 rename 之后的 ident 标签），那就没法归到某个机器队列了。这种情况下，夜莺会把数据归到指标名字对应的队列里。但是指标的数量很多，这样会在内存里建立太多队列，有两个解法：

- 当前解法：取指标名字的前两个字符，作为队列的标识，这样就会把相同前两个字符的指标归到同一个队列里，这样队列数量就会减少很多。
- 未来解法：会提前创建固定数量（可配）的队列，然后把指标名字的 hash 值对队列数量取模，计算对应关系。预计会从 v8.0.0-beta7 版本开始改成这种方式。

### Pushgw.Writers

这里是配置后端时序库的 remote write 写入地址，所有支持 remote write 协议的时序库都可以配置在这里。一般来讲，只需要配置一个即可，如果你想同时写入多个时序库，可以配置多个。

```toml
[[Pushgw.Writers]]
Url = "http://127.0.0.1:9090/api/v1/write"
BasicAuthUser = "xx"
BasicAuthPass = "xx"

[[Pushgw.Writers]]
Url = "http://127.0.0.1:8482/api/v1/write"
BasicAuthUser = "xx"
BasicAuthPass = "xx"
```

- `Url`：时序库的 remote write 写入地址
- `BasicAuth`：如果时序库需要 BasicAuth 认证，可以配置 BasicAuth 的用户名和密码
- `Headers`：如果时序库需要额外的 Header，可以配置在这里
- `Timeout`：写入超时时间，单位是毫秒
- `DialTimeout`：连接超时时间，单位是毫秒

#### Pushgw.Writers.WriteRelabels

写往时序库的数据，在写入之前可以做 relabel 的操作，这个配置项就是 relabel 的配置项。和 Prometheus 的 relabel 配置项类似，只不过 Prometheus 用的 yaml 格式，夜莺用的 toml 格式。

## Ibex

故障自愈引擎 Ibex 的配置项。即远程执行脚本的那个功能。原本这个功能是单独拆开的一个模块叫 ibex，后来合并到 n9e 里了，所以这个配置项也在 n9e 里。

```toml
[Ibex]
Enable = true
RPCListen = "0.0.0.0:20090"
```

- `Enable`：是否开启 Ibex 功能
- `RPCListen`：Ibex 的 RPC 服务监听地址

## n9e-edge 的配置

边缘告警引擎 n9e-edge 的配置文件是 `etc/edge/edge.toml`，大部分配置和中心 n9e 的配置相同。更多信息可以参考这篇文章：《[夜莺监控 - 边缘告警引擎架构详解](https://flashcat.cloud/blog/n9e-edge-intro/)》。
