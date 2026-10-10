---
title: "配置项"
sidebar_label: "配置项"
description: "config.toml 与 etc/edge/edge.toml 的每一个键：默认值、由哪个进程读取。"
---

配置文件在二进制同级的 `etc/` 目录下。`n9e`、`n9e-alert`、`n9e-pushgw` 读 `config.toml`，
`n9e-edge` 读 `etc/edge/edge.toml`。

用 `--configs` 换目录，或者用环境变量 `N9E_CONFIGS`：

```bash
./n9e --configs /etc/n9e
N9E_CONFIGS=/etc/n9e ./n9e
```

## 有几段是有前提的

- **`[EmbeddedTSDB]` 只有 Center 会处理。** `n9e-edge` / `n9e-alert` / `n9e-pushgw`
  读同一个 `etc` 目录，但会忽略这一段。
- **`[DB] DBType = "sqlite"` 和 `[Redis] RedisType = "miniredis"` 是测试用的默认值。**
  miniredis 是进程内的假 Redis，多实例没法共享。生产要换成真的，见[数据库选型](../install/databases.md)。
- **`[HTTP.ProxyAuth]` 打开后 JWT 登录整体停用**，是单向开关。
- 带 `#` 的行是**默认注释掉的配置项样例**，不是说明文字——下表里标了「默认注释掉」。

字段加密：`--crypto-key` 指定密钥后，配置文件里的敏感字段可以存密文。

## 完整清单

<!-- generated:gen-config-reference -->
## config.toml（Center / Alert / Pushgw）

### `[Global]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `RunMode` | `"release"` |  |

### `[Log]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Dir` | `"logs"` | log write dir |
| `Level` | `"INFO"` | log level: DEBUG INFO WARNING ERROR |
| `Output` | `"stdout"` | stdout, stderr, file |
| `KeepHours` | `4` （默认注释掉） | rotate by time |
| `RotateNum` | `3` （默认注释掉） | rotate by size |
| `RotateSize` | `256` （默认注释掉） | unit: MB |

### `[HTTP]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Host` | `"0.0.0.0"` | http listening address |
| `Port` | `17000` | http listening port |
| `CertFile` | `""` | https cert file path |
| `KeyFile` | `""` | https key file path |
| `PrintAccessLog` | `false` | whether print access log |
| `PProf` | `true` | whether enable pprof |
| `ExposeMetrics` | `true` | expose prometheus /metrics? |
| `ShutdownTimeout` | `30` | http graceful shutdown timeout, unit: s |
| `MaxContentLength` | `67108864` | max content length: 64M |
| `ReadTimeout` | `20` | http server read timeout, unit: s |
| `WriteTimeout` | `40` | http server write timeout, unit: s |
| `IdleTimeout` | `120` | http server idle timeout, unit: s |

### `[HTTP.ShowCaptcha]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `false` |  |

### `[HTTP.APIForAgent]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `true` |  |
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` （默认注释掉） | [HTTP.APIForAgent.BasicAuth] |

### `[HTTP.APIForService]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `false` |  |

### `[HTTP.APIForService.BasicAuth]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` |  |

### `[HTTP.JWTAuth]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `AccessExpired` | `1500` | unit: min |
| `RefreshExpired` | `10080` | unit: min |
| `RedisKeyPrefix` | `"/jwt/"` |  |

### `[HTTP.ProxyAuth]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `false` | if proxy auth enabled, jwt auth is disabled |
| `HeaderUserNameKey` | `"X-User-Name"` | username key in http proxy header |
| `DefaultRoles` | `["Standard"]` |  |

### `[HTTP.TokenAuth]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `true` |  |

### `[HTTP.RSA]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `OpenRSA` | `false` | open RSA |

### `[HTTP.A2A]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Disable` | `false` （默认注释掉） | The /a2a and /mcp endpoints are enabled by default and reuse HTTP.TokenAuth (X-User-Token). Both also accept OAuth access tokens (Authorization: Bearer) when the built-in authorization server (MCPAuth) or external-IdP resource-server auth (RSAuth) is enabled. |
| `DisableMCP` | `false` （默认注释掉） |  |
| `MCPToolsets` | `["alerts", "dashboards"]` （默认注释掉） | MCPToolsets: enabled toolset whitelist for the /mcp endpoint. Empty = all default toolsets (metrics included). Valid names:   alerts, targets, datasource, mutes, busi_groups, notify_rules,   alert_subscribes, event_pipelines, users, metrics, logs, dashboards, roles List names explicitly to restrict (unknown names are ignored, never widened). |
| `MCPEnableWriteTools` | `false` （默认注释掉） | MCPEnableWriteTools: /mcp exposes read-only tools by default; set true to also register write tools (create/update/delete) — an explicit opt-in. |

### `[DB]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `DBType` | `"sqlite"` | mysql postgres sqlite |
| `DSN` | `"n9e.db"` | postgres: host=%s port=%s user=%s dbname=%s password=%s sslmode=%s postgres: DSN="host=127.0.0.1 port=5432 user=root dbname=n9e_v6 password=1234 sslmode=disable" mysql: DSN="root:1234@tcp(localhost:3306)/n9e_v6?charset=utf8mb4&collation=utf8mb4_general_ci&parseTime=True&loc=Local" |
| `Debug` | `false` | enable debug mode or not |
| `MaxLifetime` | `7200` | unit: s |
| `MaxOpenConns` | `150` | max open connections |
| `MaxIdleConns` | `50` | max idle connections |

### `[Redis]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Address` | `"127.0.0.1:6379"` | address, ip:port or ip1:port,ip2:port for cluster and sentinel(SentinelAddrs) |
| `Username` | `""` （默认注释掉） |  |
| `Password` | `""` （默认注释掉） |  |
| `DB` | `0` （默认注释掉） |  |
| `UseTLS` | `false` （默认注释掉） |  |
| `TLSMinVersion` | `"1.2"` （默认注释掉） |  |
| `RedisType` | `"miniredis"` | standalone cluster sentinel miniredis |
| `MasterName` | `"mymaster"` （默认注释掉） | Mastername for sentinel type |
| `SentinelUsername` | `""` （默认注释掉） |  |
| `SentinelPassword` | `""` （默认注释掉） |  |

### `[Alert.Heartbeat]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `IP` | `""` | auto detect if blank |
| `Interval` | `1000` | unit ms |
| `EngineName` | `"default"` |  |
| `NotifyConcurrency` | `10` （默认注释掉） | [Alert.Alerting] |
| `Disable` | `false` （默认注释掉） | eval execution records: what each rule evaluation queried and judged, stored on local disk of the alert engine, queryable on the rule page [Alert.EvalLog] |
| `Dir` | `"logs/evallog"` （默认注释掉） | records dir, defaults to &lt;[Log] Dir>/evallog |
| `RetentionHours` | `192` （默认注释掉） |  |
| `MaxSeriesPerQuery` | `100` （默认注释掉） |  |
| `MaxPointsPerSeries` | `60` （默认注释掉） |  |
| `MaxRecordBytes` | `262144` （默认注释掉） |  |
| `PerRuleDailyMB` | `1024` （默认注释掉） |  |
| `QueueSize` | `512` （默认注释掉） | write queue length; also caps memory retained when the disk stalls (the queue holds in-memory records, ~200KB each at the default caps) |
| `MaxDiskGB` | `20` （默认注释掉） |  |
| `MaxQueryBytes` | `33554432` （默认注释掉） | read-side caps: keep query load off the eval loop. MaxQueryBytes is the serialized-bytes budget of one query's result; a query that hits it returns the newest records it fits plus an explicit "truncated" note. Raising it costs roughly MaxConcurrentQueries x MaxQueryBytes x 3.7 of extra heap on this engine (decoded records measure ~2.7x their on-disk bytes, plus one marshalled copy in the handler), and it must stay below the 48MB per-node response cap on the center side. |
| `MaxConcurrentQueries` | `2` （默认注释掉） |  |

### `[Center]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `MetricsYamlFile` | `"./etc/metrics.yaml"` |  |
| `I18NHeaderKey` | `"X-Language"` |  |
| `AgentsDir` | `"agents/categraf"` （默认注释掉） | directory holding the bundled collector packages (categraf tar.gz) served by /api/n9e/agents/categraf/download; relative paths resolve against the workdir |
| `CleanAlertHisEventDay` | `365` （默认注释掉） | retention days of alert history events (table: alert_his_event) events older than this are deleted in batches daily at 02:00 &lt;= 0 means keep forever (default) |

### `[Center.AnonymousAccess]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `PromQuerier` | `true` |  |
| `AlertDetail` | `true` |  |

### `[EmbeddedTSDB]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `true` | built-in time series database. When enabled, metrics pushed by categraf are stored locally, no external TSDB (Prometheus/VictoriaMetrics) is needed to view data, a prometheus datasource named "embedded-tsdb" is auto registered. suitable for small scale (up to ~100k active series). for larger scale, disable this and configure [[Pushgw.Writers]] to an external TSDB, both can be enabled at the same time (dual write) during migration. NOTE: data is stored on the local disk of THIS center instance, so it only fits single-instance center deployment; with multiple center replicas each replica would hold a fragment of the data, disable this and use an external TSDB instead NOTE: this section is handled by the center process only. n9e-edge / n9e-alert / n9e-pushgw read the same etc directory but ignore it |
| `Dir` | `"data/tsdb"` | data directory |
| `RetentionDuration` | `"15d"` | how long to retain samples, e.g. 12h 7d 15d |
| `MaxBytes` | `"10GiB"` | max disk space used by data blocks, oldest blocks are deleted first when exceeded, e.g. 512MiB 10GiB. empty or 0 means unlimited |
| `OutOfOrderTimeWindow` | `"10m"` | tolerate out-of-order samples within this window (agent clock skew/resend) |
| `QueryTimeout` | `"1m"` | query engine settings |
| `QueryMaxSamples` | `50000000` |  |
| `LookbackDelta` | `"5m"` |  |
| `QueryMaxConcurrency` | `20` （默认注释掉） | max concurrent queries, extra queries are queued (default 20, same as prometheus --query.max-concurrency) |
| `BasicAuthUser` | `""` | optional basic auth of the /prometheus/api/v1/* endpoints (query and remote write), also written into the auto registered datasource and the internal write path. when left empty, these endpoints only accept requests from this machine and the auto registered datasource points at 127.0.0.1; set user/pass to allow remote access (e.g. n9e-edge, grafana, or agents writing to this endpoint directly), the datasource url then uses the detected ip |
| `BasicAuthPass` | `""` |  |
| `EnableAdminAPI` | `false` （默认注释掉） | register the destructive admin endpoints delete_series/clean_tombstones (default false, same as prometheus --web.enable-admin-api); configure BasicAuthUser/Pass before enabling this |
| `DatasourceUrl` | `""` （默认注释掉） | override the url of the auto registered datasource, e.g. a vip/domain in front of this instance; setting it also lifts the local-only restriction of the /prometheus/api/v1/* endpoints. default when basic auth is configured: http(s)://&lt;detected ip>:&lt;http port>/prometheus, otherwise http(s)://127.0.0.1:&lt;http port>/prometheus |

### `[Pushgw]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `LabelRewrite` | `true` | use target labels in database instead of in series |
| `ForceUseServerTS` | `true` |  |
| `ident` | `"xx"` （默认注释掉） | [Pushgw.DebugSample] |
| `QueueMaxSize` | `1000000` （默认注释掉） | [Pushgw.WriterOpt] |
| `QueuePopSize` | `1000` （默认注释掉） |  |
| `Url` | `"http://127.0.0.1:8480/insert/0/prometheus/api/v1/write"` （默认注释掉） | uncomment to forward samples to an external TSDB, can be enabled together with [EmbeddedTSDB] (dual write) [[Pushgw.Writers]] |
| `Url` | `"http://127.0.0.1:9090/api/v1/write"` （默认注释掉） |  |
| `BasicAuthUser` | `""` （默认注释掉） | Basic auth username |
| `BasicAuthPass` | `""` （默认注释掉） | Basic auth password |
| `Headers` | `["X-From", "n9e"]` （默认注释掉） | timeout settings, unit: ms |
| `Timeout` | `10000` （默认注释掉） |  |
| `DialTimeout` | `3000` （默认注释掉） |  |
| `TLSHandshakeTimeout` | `30000` （默认注释掉） |  |
| `ExpectContinueTimeout` | `1000` （默认注释掉） |  |
| `IdleConnTimeout` | `90000` （默认注释掉） |  |
| `KeepAlive` | `30000` （默认注释掉） | time duration, unit: ms |
| `MaxConnsPerHost` | `0` （默认注释掉） |  |
| `MaxIdleConns` | `100` （默认注释掉） |  |
| `MaxIdleConnsPerHost` | `100` （默认注释掉） |  |
| `UseTLS` | `false` （默认注释掉） | Optional TLS Config |
| `TLSCA` | `"/etc/n9e/ca.pem"` （默认注释掉） |  |
| `TLSCert` | `"/etc/n9e/cert.pem"` （默认注释掉） |  |
| `TLSKey` | `"/etc/n9e/key.pem"` （默认注释掉） |  |
| `InsecureSkipVerify` | `false` （默认注释掉） |  |
| `Action` | `"replace"` （默认注释掉） | [[Pushgw.Writers.WriteRelabels]] |
| `SourceLabels` | `["__address__"]` （默认注释掉） |  |
| `Regex` | `"([^:]+)(?::\\d+)?"` （默认注释掉） |  |
| `Replacement` | `"$1:80"` （默认注释掉） |  |
| `TargetLabel` | `"__address__"` （默认注释掉） |  |
| `Brokers` | `["127.0.0.1:9092"]` （默认注释掉） | [[Pushgw.KafkaWriters]] |
| `Topic` | `"n9e-metrics"` （默认注释掉） |  |
| `Enable` | `true` （默认注释掉） | [Pushgw.KafkaWriters.SASL] |
| `User` | `"admin"` （默认注释掉） |  |
| `Password` | `"admin"` （默认注释掉） |  |
| `Mechanism` | `"PLAIN"` （默认注释掉） |  |
| `Version` | `1` （默认注释掉） |  |
| `Handshake` | `true` （默认注释掉） |  |
| `AuthIdentity` | `""` （默认注释掉） |  |

### `[Ibex]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `true` |  |
| `RPCListen` | `"0.0.0.0:20090"` |  |

## edge.toml（n9e-edge）

### `[Global]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `RunMode` | `"release"` |  |

### `[CenterApi]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Addrs` | `["http://127.0.0.1:17000"]` |  |
| `BasicAuthUser` | `"user001"` |  |
| `BasicAuthPass` | `"ccc26da7b9aba533cbb263a36c07dcc5"` |  |
| `Timeout` | `9000` | unit: ms |

### `[Log]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Dir` | `"logs"` | log write dir |
| `Level` | `"DEBUG"` | log level: DEBUG INFO WARNING ERROR |
| `Output` | `"stdout"` | stdout, stderr, file |
| `KeepHours` | `4` （默认注释掉） | rotate by time |
| `RotateNum` | `3` （默认注释掉） | rotate by size |
| `RotateSize` | `256` （默认注释掉） | unit: MB |

### `[HTTP]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Host` | `"0.0.0.0"` | http listening address |
| `Port` | `19000` | http listening port |
| `CertFile` | `""` | https cert file path |
| `KeyFile` | `""` | https key file path |
| `PrintAccessLog` | `false` | whether print access log |
| `PProf` | `false` | whether enable pprof |
| `ExposeMetrics` | `true` | expose prometheus /metrics? |
| `ShutdownTimeout` | `30` | http graceful shutdown timeout, unit: s |
| `MaxContentLength` | `67108864` | max content length: 64M |
| `ReadTimeout` | `20` | http server read timeout, unit: s |
| `WriteTimeout` | `40` | http server write timeout, unit: s |
| `IdleTimeout` | `120` | http server idle timeout, unit: s |

### `[HTTP.APIForAgent]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `true` |  |
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` （默认注释掉） | [HTTP.APIForAgent.BasicAuth] |

### `[HTTP.APIForService]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `false` |  |

### `[HTTP.APIForService.BasicAuth]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` |  |

### `[Alert.Heartbeat]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `IP` | `""` | auto detect if blank |
| `Interval` | `1000` | unit ms |
| `EngineName` | `"edge"` |  |
| `NotifyConcurrency` | `10` （默认注释掉） | [Alert.Alerting] |
| `Disable` | `false` （默认注释掉） | eval execution records: what each rule evaluation queried and judged, stored on local disk of the alert engine, queryable on the rule page [Alert.EvalLog] |
| `Dir` | `"logs/evallog"` （默认注释掉） | records dir, defaults to &lt;[Log] Dir>/evallog |
| `RetentionHours` | `192` （默认注释掉） |  |
| `MaxDiskGB` | `20` （默认注释掉） |  |
| `MaxQueryBytes` | `33554432` （默认注释掉） | read-side caps: bytes budget per query, and concurrent queries allowed on this engine |
| `MaxConcurrentQueries` | `2` （默认注释掉） |  |

### `[Pushgw]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `LabelRewrite` | `true` | use target labels in database instead of in series |
| `BusiGroupLabelKey` | `"busigroup"` （默认注释掉） | default busigroup key name |
| `ForceUseServerTS` | `true` |  |
| `ident` | `"xx"` （默认注释掉） | [Pushgw.DebugSample] |
| `QueueMaxSize` | `1000000` （默认注释掉） | [Pushgw.WriterOpt] |
| `QueuePopSize` | `1000` （默认注释掉） |  |

### `[Pushgw.Writers]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Url` | `"http://127.0.0.1:8480/insert/0/prometheus/api/v1/write"` （默认注释掉） |  |
| `Url` | `"http://127.0.0.1:9090/api/v1/write"` |  |
| `BasicAuthUser` | `""` | Basic auth username |
| `BasicAuthPass` | `""` | Basic auth password |
| `Headers` | `["X-From", "n9e"]` | timeout settings, unit: ms |
| `Timeout` | `10000` |  |
| `DialTimeout` | `3000` |  |
| `TLSHandshakeTimeout` | `30000` |  |
| `ExpectContinueTimeout` | `1000` |  |
| `IdleConnTimeout` | `90000` |  |
| `KeepAlive` | `30000` | time duration, unit: ms |
| `MaxConnsPerHost` | `0` |  |
| `MaxIdleConns` | `100` |  |
| `MaxIdleConnsPerHost` | `100` |  |
| `UseTLS` | `false` （默认注释掉） | Optional TLS Config |
| `TLSCA` | `"/etc/n9e/ca.pem"` （默认注释掉） |  |
| `TLSCert` | `"/etc/n9e/cert.pem"` （默认注释掉） |  |
| `TLSKey` | `"/etc/n9e/key.pem"` （默认注释掉） |  |
| `InsecureSkipVerify` | `false` （默认注释掉） |  |
| `Action` | `"replace"` （默认注释掉） | [[Writers.WriteRelabels]] |
| `SourceLabels` | `["__address__"]` （默认注释掉） |  |
| `Regex` | `"([^:]+)(?::\\d+)?"` （默认注释掉） |  |
| `Replacement` | `"$1:80"` （默认注释掉） |  |
| `TargetLabel` | `"__address__"` （默认注释掉） |  |

### `[Ibex]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Enable` | `false` |  |
| `RPCListen` | `"0.0.0.0:20090"` |  |

### `[Redis]`

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `Address` | `"127.0.0.1:6379"` | address, ip:port or ip1:port,ip2:port for cluster and sentinel(SentinelAddrs) |
| `Username` | `""` （默认注释掉） |  |
| `Password` | `""` （默认注释掉） |  |
| `DB` | `0` （默认注释掉） |  |
| `UseTLS` | `false` （默认注释掉） |  |
| `TLSMinVersion` | `"1.2"` （默认注释掉） |  |
| `RedisType` | `"standalone"` | standalone cluster sentinel |
| `MasterName` | `"mymaster"` （默认注释掉） | Mastername for sentinel type |
| `SentinelUsername` | `""` （默认注释掉） |  |
| `SentinelPassword` | `""` （默认注释掉） |  |
<!-- /generated -->
