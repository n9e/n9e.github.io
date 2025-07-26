---
title: "Configuration"
description: "Explanation of the configuration files for Nightingale monitoring, with detailed descriptions of each configuration item"
lead: ""
date: 2025-07-26T14:14:47.456+08:00
lastmod: 2025-07-26T14:14:47.456+08:00
draft: false
images: []
menu:
  docs:
    parent: "install"
weight: 500
toc: true
---

The configuration file for the central n9e is `etc/config.toml`, and the configuration file for the edge alert engine n9e-edge is `etc/edge/edge.toml`. Here we first explain the n9e configuration file in sections.

## Global

```toml
[Global]
RunMode = "release"
```

This is a configuration item used by Nightingale developers; ordinary users don't need to care about it. It should always remain `release`.

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

- `Output`: Log output method, supporting `stdout`, `stderr`, `file`. Only in `file` mode will logs be output to files, and the following configuration items will be used.
- `Dir`: Directory for storing log files
- `Level`: Log level, supporting `DEBUG`, `INFO`, `WARNING`, `ERROR`
- `KeepHours`: Log file retention time in hours. Logs can be rotated by time or size. If rotated by time, use this configuration item (one log file per hour); if rotated by size, use the following two configuration items.
- `RotateNum`: Number of retained log files
- `RotateSize`: Log file size in MB

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

- `Host`: HTTP service listening address, usually `0.0.0.0` to listen on all network interfaces
- `Port`: HTTP service listening port
- `CertFile`: HTTPS certificate file path
- `KeyFile`: HTTPS key file path
- `PrintAccessLog`: Whether to print access logs
- `PProf`: Whether to enable pprof. If enabled, pprof information can be viewed at `/api/debug/pprof/`
- `ExposeMetrics`: Whether to expose Prometheus's `/metrics` interface for exposing Nightingale's own monitoring metrics
- `ShutdownTimeout`: HTTP service graceful shutdown timeout in seconds
- `MaxContentLength`: Maximum HTTP request length in bytes
- `ReadTimeout`: HTTP read timeout in seconds
- `WriteTimeout`: HTTP write timeout in seconds
- `IdleTimeout`: HTTP idle timeout in seconds


### HTTP.ShowCaptcha

```toml
[HTTP.ShowCaptcha]
Enable = false
```

- `Enable`: Whether to enable the captcha function

### HTTP.APIForAgent

```toml
[HTTP.APIForAgent]
Enable = true
# [HTTP.APIForAgent.BasicAuth]
# user001 = "ccc26da7b9aba533cbb263a36c07dcc5"
```

- `Enable`: Whether to enable the API interface for Agent. Normally, this must be enabled, so this configuration item is generally `true`.
- `BasicAuth`: The Agent's API interface supports BasicAuth. Configure BasicAuth username and password here. For internal network communication, BasicAuth is not required; for public network communication, it is recommended to configure BasicAuth, and the password must not use the default one to avoid attacks.
- In the example above, `user001` is the BasicAuth username, and `ccc26da7b9aba533cbb263a36c07dcc5` is the BasicAuth password. To configure multiple users, you can add more entries, for example:

```toml
[HTTP.APIForAgent.BasicAuth]
user001 = "ccc26da7b9aba533cbb263a36c07dcc5"
user002 = "d4f5e6a7b8c9d0e1f2g3h4i5j6k7l8m9"
```

Note: If you configure BasicAuth, the corresponding username and password must also be configured in the Agent's `n9e` configuration file; otherwise, the Agent cannot connect to the central n9e.

The default configuration has Enable set to `true` and `HTTP.APIForAgent.BasicAuth` empty, indicating that the API interfaces for Agent are enabled without BasicAuth.

### HTTP.APIForService

```toml
[HTTP.APIForService]
Enable = false
[HTTP.APIForService.BasicAuth]
user001 = "ccc26da7b9aba533cbb263a36c07dcc5"
```

- `Enable`: Whether to enable the API interface for Service. The edge alert engine n9e-edge communicates with the central n9e through these interfaces. So if you use n9e-edge, this needs to be enabled (set to `true`).
- `BasicAuth`: The Service's API interface supports BasicAuth. Configure BasicAuth username and password here. For internal network communication, BasicAuth is not required; for public network communication, it is recommended to configure BasicAuth, and the password must not use the default one to avoid attacks.
- In the example above, `user001` is the BasicAuth username, and `ccc26da7b9aba533cbb263a36c07dcc5` is the BasicAuth password. To configure multiple users, you can add more entries, for example:

```toml
[HTTP.APIForService.BasicAuth]
user001 = "ccc26da7b9aba533cbb263a36c07dcc5"
user002 = "d4f5e6a7b8c9d0e1f2g3h4i5j6k7l8m9"
```

Note: If you configure BasicAuth, the corresponding username and password must also be configured in the n9e-edge configuration file; otherwise, n9e-edge cannot connect to the central n9e.
The default configuration has Enable set to `false`, meaning the API interfaces for other Services are not enabled, and n9e-edge cannot connect to the central n9e.

### HTTP.JWTAuth

```toml
[HTTP.JWTAuth]
# unit: min
AccessExpired = 1500
# unit: min
RefreshExpired = 10080
RedisKeyPrefix = "/jwt/"
```

Nightingale uses JWT for authentication. Here configure JWT expiration times in minutes: `AccessExpired` is the expiration time of the access token, and `RefreshExpired` is the expiration time of the refresh token. For the roles of these two tokens in JWT mechanism, you can ask GPT for details, which will not be elaborated here. Nightingale stores some JWT-related information in Redis, and `RedisKeyPrefix` is the prefix for Redis keys, which generally does not need to be changed.

### HTTP.ProxyAuth

```toml
[HTTP.ProxyAuth]
# if proxy auth enabled, jwt auth is disabled
Enable = false
# username key in http proxy header
HeaderUserNameKey = "X-User-Name"
DefaultRoles = ["Standard"]
```

If you want to embed Nightingale into your own system, you can consider using ProxyAuth, similar to Grafana's ProxyAuth. It means that after a user logs in to your system, you can get the username and put it in the `X-User-Name` header to pass to Nightingale, and Nightingale will consider the user logged in. `DefaultRoles` is the default role; if you don't pass roles, Nightingale will treat the user as having the `Standard` role.

In fact, according to observations, no community users are currently using this function, so please use it with caution.

### HTTP.RSA

```toml
[HTTP.RSA]
OpenRSA = false
```

When logging in to Nightingale, user passwords are transmitted in plain text. If the Nightingale site uses HTTPS, it's fine; if it's HTTP, it's recommended to enable RSA encryption to prevent plain text transmission of user passwords.

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

DBType and DSN are the most critical, and the two configurations are linked. DBType supports three databases: `mysql`, `postgres`, and `sqlite`. DSN is the database connection information; for sqlite, it's the database file path; for mysql or postgres, it's the database connection information.

Starting from version v8, Nightingale sets DBType to `sqlite` by default to facilitate users' quick experience without installing a database. However, in production environments, please use `mysql` or `postgres`.

For DSN configurations of Postgres and MySQL, you can refer to the examples in the comments. Other configurations are related to database connections and can be modified according to your environment. For general small and medium-sized environments, setting `MaxOpenConns` to 32 and `MaxIdleConns` to 8 is sufficient.

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

Redis is used not only to store JWT-related login authentication information but also to store metadata reported by machine heartbeats. The machine offline alert rules supported in Nightingale judge based on the heartbeat time of machines in Redis. If there is no heartbeat for a long time, the machine is considered offline.

> If Redis responds slowly, it may cause false judgments of offline alerts. That is, the machine is actually alive, but the heartbeat information in Redis is not updated in time, eventually leading Nightingale to mistakenly judge the machine as offline. Starting from version V8.beta11, monitoring indicators related to Redis operations have been added. These indicators need to be paid attention to to detect slow Redis response issues in time.

RedisType supports four types: `standalone`, `cluster`, `sentinel`, and `miniredis`. Starting from Nightingale v8, Nightingale uses `miniredis` by default to facilitate users' quick experience without installing Redis. However, in production environments, please use other modes.

Address is the Redis connection address, and the configuration method varies according to RedisType:

- `standalone`: When RedisType is `standalone`, Address is the address of the Redis instance in the format `ip:port`
- `cluster`: When RedisType is `cluster`, Address is the address of the Redis cluster in the format `ip1:port,ip2:port`
- `sentinel`: When RedisType is `sentinel`, Address is the address of Redis Sentinel in the format `ip1:port,ip2:port`. In sentinel mode, `MasterName`, `SentinelUsername`, and `SentinelPassword` also need to be configured
- `UseTLS`: Whether to use TLS
- `TLSMinVersion`: Minimum TLS version, which takes effect only when `UseTLS` is `true`

## Alert

Starting from a certain version, Nightingale merged the webapi and alert engine modules to reduce deployment complexity. The configuration items here under Alert are for the alert engine.

### Alert.Heartbeat

```toml
[Alert.Heartbeat]
# auto detect if blank
IP = ""
# unit ms
Interval = 1000
EngineName = "default"
```

- `IP`: The IP address of the alert engine. If empty, Nightingale will automatically detect it. Each alert engine writes heartbeat information to MySQL, so that each alert engine knows the list of all alive alert engines, and then can perform sharding processing of alert rules. For example, with 100 alert rules and a cluster of two n9e instances, each n9e will process approximately 50 rules. When one alert engine goes down, the other will take over all 100 rules.
- `Interval`: Heartbeat interval in milliseconds
- `EngineName`: The name of the alert engine. Generally, the central end maintains `default`; for the edge alert engine n9e-edge, you can customize the EngineName, such as `edge1`, `edge2`, etc. Alert engines with the same EngineName are considered a cluster.

## Center

Unique configurations for the central n9e, not present in the edge alert engine n9e-edge. These are the unique configurations related to the old version of n9e-webapi.

```toml
[Center]
MetricsYamlFile = "./etc/metrics.yaml"
I18NHeaderKey = "X-Language"

[Center.AnonymousAccess]
PromQuerier = true
AlertDetail = true
```

- `MetricsYamlFile`: Path to the metric configuration file. The explanations of metrics you see in the quick view come from this configuration file. Later, the metric view was launched, making this configuration file less important, and even the quick view function is planned to be removed.
- `I18NHeader`: This is a configuration item for developers; ordinary users don't need to care about it.
- `Center.AnonymousAccess`: Configuration items related to anonymous access. PromQuerier indicates whether to allow anonymous query of interfaces of various data sources; AlertDetail indicates whether to allow anonymous viewing of alert details. It can be enabled in internal network environments but must be disabled in public network environments.

The dashboard has a public access function, which can even be set to be accessible without login, but this requires PromQuerier to be set to `true`. That is, if `PromQuerier = false`, even if the dashboard is set to public access, login is still required.

## Pushgw

Although Nightingale does not directly store monitoring data, it provides multiple interfaces for receiving monitoring data, such as interfaces for the Prometheus remote write protocol, OpenTSDB protocol, etc. After receiving the data, Nightingale forwards the monitoring data to the backend time-series database, so Nightingale acts as a Pushgateway here, and the configuration items related to Pushgateway are under `Pushgw`.

```toml
[Pushgw]
# use target labels in database instead of in series
LabelRewrite = true
ForceUseServerTS = true
```

- `LabelRewrite`: Nightingale has a machine management menu where you can tag machines, and these tags are attached to time-series data related to the machines. However, if a tag in the reported data conflicts with a tag in machine management, which one takes precedence? If `LabelRewrite` is `true`, the tag in machine management takes precedence; otherwise, the reported tag takes precedence.
- `ForceUseServerTS`: Whether to force the use of the server's timestamp to overwrite the timestamp of the received monitoring data. Previously, there was no this configuration item. Due to confusion caused by uncalibrated machine time in many companies, Nightingale provides this configuration. It is recommended to enable it to uniformly use the server's timestamp.

### Pushgw.DebugSample

```toml
[Pushgw.DebugSample]
ident = "xx"
__name__ = "cpu_usage_active"
```

This configuration is for debugging and troubleshooting. It is actually a filter condition for monitoring metrics. If the metrics reported to Nightingale meet this filter condition, they will be printed to the log. Generally, no configuration is needed; it can be commented out.

### Pushgw.WriterOpt

```toml
[Pushgw.WriterOpt]
QueueMaxSize = 1000000
QueuePopSize = 1000
QueueNumber = 0
```

This part of the configuration is commented out by default because normally users don't need to pay attention to it. If Nightingale receives too much data, which gets congested in memory and eventually leads to metric loss, you need to consider adjusting the configuration here.

Nightingale creates QueueNumber queues in memory. After receiving monitoring data, it puts the data into these queues. The default configuration of QueueNumber is 0, indicating that the specific number is not specified, and queues are created according to the number of CPU cores. The maximum capacity of each queue is QueueMaxSize, which defaults to 1000000, meaning each queue can store up to 1 million data entries.

Each queue corresponds to a goroutine, which fetches QueuePopSize metrics from the queue each time. The default is 1000, meaning 1000 data entries are fetched from the queue each time and written to the backend time-series database as a batch. This takes full advantage of multi-core CPU performance. Therefore, the number of QueueNumber is essentially equal to the concurrency of writing to the backend time-series database.

### Pushgw.Writers

Here configure the remote write addresses of the backend time-series databases. All time-series databases supporting the remote write protocol can be configured here. Generally, only one needs to be configured; if you want to write to multiple time-series databases simultaneously, you can configure multiple.

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

- `Url`: Remote write address of the time-series database
- `BasicAuth`: If the time-series database requires BasicAuth authentication, configure the BasicAuth username and password here
- `Headers`: If the time-series database requires additional headers, configure them here
- `Timeout`: Write timeout in milliseconds
- `DialTimeout`: Connection timeout in milliseconds

#### Pushgw.Writers.WriteRelabels

Data written to the time-series database can undergo relabeling before writing. This configuration item is for relabeling, similar to Prometheus's relabel configuration items, except that Prometheus uses yaml format while Nightingale uses toml format.

## Ibex

Configuration items for the fault self-healing engine Ibex, i.e., the function for remote script execution. Originally, this function was a separate module called ibex, which was later merged into n9e, so this configuration item is also in n9e.

```toml
[Ibex]
Enable = true
RPCListen = "0.0.0.0:20090"
```

- `Enable`: Whether to enable the Ibex server function
- `RPCListen`: RPC service listening address of Ibex

## n9e-edge configuration

The configuration file for the edge alert engine n9e-edge is `etc/edge/edge.toml`, and most configurations are the same as those of the central n9e. For more information, you can refer to this article: 《[Nightingale Monitoring - Edge Alert Engine Architecture Detailed Explanation](https://flashcat.cloud/blog/n9e-edge-intro/)》.