---
title: "Configuration reference"
sidebar_label: "Configuration reference"
description: "Every key in config.toml and etc/edge/edge.toml, with defaults and which process reads it."
---

Configuration lives in the `etc/` directory next to the binary. `n9e`, `n9e-alert` and `n9e-pushgw`
read `config.toml`; `n9e-edge` reads `etc/edge/edge.toml`.

Point them elsewhere with `--configs`, or the `N9E_CONFIGS` environment variable:

```bash
./n9e --configs /etc/n9e
N9E_CONFIGS=/etc/n9e ./n9e
```

## Sections with conditions attached

- **`[EmbeddedTSDB]` is handled by Center only.** `n9e-edge`, `n9e-alert` and `n9e-pushgw` read the
  same `etc` directory and ignore this section.
- **`[DB] DBType = "sqlite"` and `[Redis] RedisType = "miniredis"` are testing defaults.** miniredis
  is an in-process stand-in that several instances cannot share. Production needs the real thing —
  see [Choosing a metadata database](../install/databases.md).
- **Turning on `[HTTP.ProxyAuth]` disables JWT login entirely**; it is a one-way switch.
- Lines starting with `#` are often **commented-out examples of keys**, not prose. The table marks
  those as "commented out by default".

Field encryption: pass `--crypto-key` and sensitive fields in the config file can be stored encrypted.

## Full list

<!-- generated:gen-config-reference -->
## config.toml (Center / Alert / Pushgw)

### `[Global]`

| Key | Default | Notes |
|---|---|---|
| `RunMode` | `"release"` |  |

### `[Log]`

| Key | Default | Notes |
|---|---|---|
| `Dir` | `"logs"` | log write dir |
| `Level` | `"INFO"` | log level: DEBUG INFO WARNING ERROR |
| `Output` | `"stdout"` | stdout, stderr, file |
| `KeepHours` | `4` (commented out by default) | rotate by time |
| `RotateNum` | `3` (commented out by default) | rotate by size |
| `RotateSize` | `256` (commented out by default) | unit: MB |

### `[HTTP]`

| Key | Default | Notes |
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

| Key | Default | Notes |
|---|---|---|
| `Enable` | `false` |  |

### `[HTTP.APIForAgent]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `true` |  |
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` (commented out by default) | [HTTP.APIForAgent.BasicAuth] |

### `[HTTP.APIForService]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `false` |  |

### `[HTTP.APIForService.BasicAuth]`

| Key | Default | Notes |
|---|---|---|
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` |  |

### `[HTTP.JWTAuth]`

| Key | Default | Notes |
|---|---|---|
| `AccessExpired` | `1500` | unit: min |
| `RefreshExpired` | `10080` | unit: min |
| `RedisKeyPrefix` | `"/jwt/"` |  |

### `[HTTP.ProxyAuth]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `false` | if proxy auth enabled, jwt auth is disabled |
| `HeaderUserNameKey` | `"X-User-Name"` | username key in http proxy header |
| `DefaultRoles` | `["Standard"]` |  |

### `[HTTP.TokenAuth]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `true` |  |

### `[HTTP.RSA]`

| Key | Default | Notes |
|---|---|---|
| `OpenRSA` | `false` | open RSA |

### `[HTTP.A2A]`

| Key | Default | Notes |
|---|---|---|
| `Disable` | `false` (commented out by default) | The /a2a and /mcp endpoints are enabled by default and reuse HTTP.TokenAuth (X-User-Token). Both also accept OAuth access tokens (Authorization: Bearer) when the built-in authorization server (MCPAuth) or external-IdP resource-server auth (RSAuth) is enabled. |
| `DisableMCP` | `false` (commented out by default) |  |
| `MCPToolsets` | `["alerts", "dashboards"]` (commented out by default) | MCPToolsets: enabled toolset whitelist for the /mcp endpoint. Empty = all default toolsets (metrics included). Valid names:   alerts, targets, datasource, mutes, busi_groups, notify_rules,   alert_subscribes, event_pipelines, users, metrics, logs, dashboards, roles List names explicitly to restrict (unknown names are ignored, never widened). |
| `MCPEnableWriteTools` | `false` (commented out by default) | MCPEnableWriteTools: /mcp exposes read-only tools by default; set true to also register write tools (create/update/delete) — an explicit opt-in. |

### `[DB]`

| Key | Default | Notes |
|---|---|---|
| `DBType` | `"sqlite"` | mysql postgres sqlite |
| `DSN` | `"n9e.db"` | postgres: host=%s port=%s user=%s dbname=%s password=%s sslmode=%s postgres: DSN="host=127.0.0.1 port=5432 user=root dbname=n9e_v6 password=1234 sslmode=disable" mysql: DSN="root:1234@tcp(localhost:3306)/n9e_v6?charset=utf8mb4&collation=utf8mb4_general_ci&parseTime=True&loc=Local" |
| `Debug` | `false` | enable debug mode or not |
| `MaxLifetime` | `7200` | unit: s |
| `MaxOpenConns` | `150` | max open connections |
| `MaxIdleConns` | `50` | max idle connections |

### `[Redis]`

| Key | Default | Notes |
|---|---|---|
| `Address` | `"127.0.0.1:6379"` | address, ip:port or ip1:port,ip2:port for cluster and sentinel(SentinelAddrs) |
| `Username` | `""` (commented out by default) |  |
| `Password` | `""` (commented out by default) |  |
| `DB` | `0` (commented out by default) |  |
| `UseTLS` | `false` (commented out by default) |  |
| `TLSMinVersion` | `"1.2"` (commented out by default) |  |
| `RedisType` | `"miniredis"` | standalone cluster sentinel miniredis |
| `MasterName` | `"mymaster"` (commented out by default) | Mastername for sentinel type |
| `SentinelUsername` | `""` (commented out by default) |  |
| `SentinelPassword` | `""` (commented out by default) |  |

### `[Alert.Heartbeat]`

| Key | Default | Notes |
|---|---|---|
| `IP` | `""` | auto detect if blank |
| `Interval` | `1000` | unit ms |
| `EngineName` | `"default"` |  |
| `NotifyConcurrency` | `10` (commented out by default) | [Alert.Alerting] |
| `Disable` | `false` (commented out by default) | eval execution records: what each rule evaluation queried and judged, stored on local disk of the alert engine, queryable on the rule page [Alert.EvalLog] |
| `Dir` | `"logs/evallog"` (commented out by default) | records dir, defaults to &lt;[Log] Dir>/evallog |
| `RetentionHours` | `192` (commented out by default) |  |
| `MaxSeriesPerQuery` | `100` (commented out by default) |  |
| `MaxPointsPerSeries` | `60` (commented out by default) |  |
| `MaxRecordBytes` | `262144` (commented out by default) |  |
| `PerRuleDailyMB` | `1024` (commented out by default) |  |
| `QueueSize` | `512` (commented out by default) | write queue length; also caps memory retained when the disk stalls (the queue holds in-memory records, ~200KB each at the default caps) |
| `MaxDiskGB` | `20` (commented out by default) |  |
| `MaxQueryBytes` | `33554432` (commented out by default) | read-side caps: keep query load off the eval loop. MaxQueryBytes is the serialized-bytes budget of one query's result; a query that hits it returns the newest records it fits plus an explicit "truncated" note. Raising it costs roughly MaxConcurrentQueries x MaxQueryBytes x 3.7 of extra heap on this engine (decoded records measure ~2.7x their on-disk bytes, plus one marshalled copy in the handler), and it must stay below the 48MB per-node response cap on the center side. |
| `MaxConcurrentQueries` | `2` (commented out by default) |  |

### `[Center]`

| Key | Default | Notes |
|---|---|---|
| `MetricsYamlFile` | `"./etc/metrics.yaml"` |  |
| `I18NHeaderKey` | `"X-Language"` |  |
| `AgentsDir` | `"agents/categraf"` (commented out by default) | directory holding the bundled collector packages (categraf tar.gz) served by /api/n9e/agents/categraf/download; relative paths resolve against the workdir |
| `CleanAlertHisEventDay` | `365` (commented out by default) | retention days of alert history events (table: alert_his_event) events older than this are deleted in batches daily at 02:00 &lt;= 0 means keep forever (default) |

### `[Center.AnonymousAccess]`

| Key | Default | Notes |
|---|---|---|
| `PromQuerier` | `true` |  |
| `AlertDetail` | `true` |  |

### `[EmbeddedTSDB]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `true` | built-in time series database. When enabled, metrics pushed by categraf are stored locally, no external TSDB (Prometheus/VictoriaMetrics) is needed to view data, a prometheus datasource named "embedded-tsdb" is auto registered. suitable for small scale (up to ~100k active series). for larger scale, disable this and configure [[Pushgw.Writers]] to an external TSDB, both can be enabled at the same time (dual write) during migration. NOTE: data is stored on the local disk of THIS center instance, so it only fits single-instance center deployment; with multiple center replicas each replica would hold a fragment of the data, disable this and use an external TSDB instead NOTE: this section is handled by the center process only. n9e-edge / n9e-alert / n9e-pushgw read the same etc directory but ignore it |
| `Dir` | `"data/tsdb"` | data directory |
| `RetentionDuration` | `"15d"` | how long to retain samples, e.g. 12h 7d 15d |
| `MaxBytes` | `"10GiB"` | max disk space used by data blocks, oldest blocks are deleted first when exceeded, e.g. 512MiB 10GiB. empty or 0 means unlimited |
| `OutOfOrderTimeWindow` | `"10m"` | tolerate out-of-order samples within this window (agent clock skew/resend) |
| `QueryTimeout` | `"1m"` | query engine settings |
| `QueryMaxSamples` | `50000000` |  |
| `LookbackDelta` | `"5m"` |  |
| `QueryMaxConcurrency` | `20` (commented out by default) | max concurrent queries, extra queries are queued (default 20, same as prometheus --query.max-concurrency) |
| `BasicAuthUser` | `""` | optional basic auth of the /prometheus/api/v1/* endpoints (query and remote write), also written into the auto registered datasource and the internal write path. when left empty, these endpoints only accept requests from this machine and the auto registered datasource points at 127.0.0.1; set user/pass to allow remote access (e.g. n9e-edge, grafana, or agents writing to this endpoint directly), the datasource url then uses the detected ip |
| `BasicAuthPass` | `""` |  |
| `EnableAdminAPI` | `false` (commented out by default) | register the destructive admin endpoints delete_series/clean_tombstones (default false, same as prometheus --web.enable-admin-api); configure BasicAuthUser/Pass before enabling this |
| `DatasourceUrl` | `""` (commented out by default) | override the url of the auto registered datasource, e.g. a vip/domain in front of this instance; setting it also lifts the local-only restriction of the /prometheus/api/v1/* endpoints. default when basic auth is configured: http(s)://&lt;detected ip>:&lt;http port>/prometheus, otherwise http(s)://127.0.0.1:&lt;http port>/prometheus |

### `[Pushgw]`

| Key | Default | Notes |
|---|---|---|
| `LabelRewrite` | `true` | use target labels in database instead of in series |
| `ForceUseServerTS` | `true` |  |
| `ident` | `"xx"` (commented out by default) | [Pushgw.DebugSample] |
| `QueueMaxSize` | `1000000` (commented out by default) | [Pushgw.WriterOpt] |
| `QueuePopSize` | `1000` (commented out by default) |  |
| `Url` | `"http://127.0.0.1:8480/insert/0/prometheus/api/v1/write"` (commented out by default) | uncomment to forward samples to an external TSDB, can be enabled together with [EmbeddedTSDB] (dual write) [[Pushgw.Writers]] |
| `Url` | `"http://127.0.0.1:9090/api/v1/write"` (commented out by default) |  |
| `BasicAuthUser` | `""` (commented out by default) | Basic auth username |
| `BasicAuthPass` | `""` (commented out by default) | Basic auth password |
| `Headers` | `["X-From", "n9e"]` (commented out by default) | timeout settings, unit: ms |
| `Timeout` | `10000` (commented out by default) |  |
| `DialTimeout` | `3000` (commented out by default) |  |
| `TLSHandshakeTimeout` | `30000` (commented out by default) |  |
| `ExpectContinueTimeout` | `1000` (commented out by default) |  |
| `IdleConnTimeout` | `90000` (commented out by default) |  |
| `KeepAlive` | `30000` (commented out by default) | time duration, unit: ms |
| `MaxConnsPerHost` | `0` (commented out by default) |  |
| `MaxIdleConns` | `100` (commented out by default) |  |
| `MaxIdleConnsPerHost` | `100` (commented out by default) |  |
| `UseTLS` | `false` (commented out by default) | Optional TLS Config |
| `TLSCA` | `"/etc/n9e/ca.pem"` (commented out by default) |  |
| `TLSCert` | `"/etc/n9e/cert.pem"` (commented out by default) |  |
| `TLSKey` | `"/etc/n9e/key.pem"` (commented out by default) |  |
| `InsecureSkipVerify` | `false` (commented out by default) |  |
| `Action` | `"replace"` (commented out by default) | [[Pushgw.Writers.WriteRelabels]] |
| `SourceLabels` | `["__address__"]` (commented out by default) |  |
| `Regex` | `"([^:]+)(?::\\d+)?"` (commented out by default) |  |
| `Replacement` | `"$1:80"` (commented out by default) |  |
| `TargetLabel` | `"__address__"` (commented out by default) |  |
| `Brokers` | `["127.0.0.1:9092"]` (commented out by default) | [[Pushgw.KafkaWriters]] |
| `Topic` | `"n9e-metrics"` (commented out by default) |  |
| `Enable` | `true` (commented out by default) | [Pushgw.KafkaWriters.SASL] |
| `User` | `"admin"` (commented out by default) |  |
| `Password` | `"admin"` (commented out by default) |  |
| `Mechanism` | `"PLAIN"` (commented out by default) |  |
| `Version` | `1` (commented out by default) |  |
| `Handshake` | `true` (commented out by default) |  |
| `AuthIdentity` | `""` (commented out by default) |  |

### `[Ibex]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `true` |  |
| `RPCListen` | `"0.0.0.0:20090"` |  |

## edge.toml (n9e-edge)

### `[Global]`

| Key | Default | Notes |
|---|---|---|
| `RunMode` | `"release"` |  |

### `[CenterApi]`

| Key | Default | Notes |
|---|---|---|
| `Addrs` | `["http://127.0.0.1:17000"]` |  |
| `BasicAuthUser` | `"user001"` |  |
| `BasicAuthPass` | `"ccc26da7b9aba533cbb263a36c07dcc5"` |  |
| `Timeout` | `9000` | unit: ms |

### `[Log]`

| Key | Default | Notes |
|---|---|---|
| `Dir` | `"logs"` | log write dir |
| `Level` | `"DEBUG"` | log level: DEBUG INFO WARNING ERROR |
| `Output` | `"stdout"` | stdout, stderr, file |
| `KeepHours` | `4` (commented out by default) | rotate by time |
| `RotateNum` | `3` (commented out by default) | rotate by size |
| `RotateSize` | `256` (commented out by default) | unit: MB |

### `[HTTP]`

| Key | Default | Notes |
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

| Key | Default | Notes |
|---|---|---|
| `Enable` | `true` |  |
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` (commented out by default) | [HTTP.APIForAgent.BasicAuth] |

### `[HTTP.APIForService]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `false` |  |

### `[HTTP.APIForService.BasicAuth]`

| Key | Default | Notes |
|---|---|---|
| `user001` | `"ccc26da7b9aba533cbb263a36c07dcc5"` |  |

### `[Alert.Heartbeat]`

| Key | Default | Notes |
|---|---|---|
| `IP` | `""` | auto detect if blank |
| `Interval` | `1000` | unit ms |
| `EngineName` | `"edge"` |  |
| `NotifyConcurrency` | `10` (commented out by default) | [Alert.Alerting] |
| `Disable` | `false` (commented out by default) | eval execution records: what each rule evaluation queried and judged, stored on local disk of the alert engine, queryable on the rule page [Alert.EvalLog] |
| `Dir` | `"logs/evallog"` (commented out by default) | records dir, defaults to &lt;[Log] Dir>/evallog |
| `RetentionHours` | `192` (commented out by default) |  |
| `MaxDiskGB` | `20` (commented out by default) |  |
| `MaxQueryBytes` | `33554432` (commented out by default) | read-side caps: bytes budget per query, and concurrent queries allowed on this engine |
| `MaxConcurrentQueries` | `2` (commented out by default) |  |

### `[Pushgw]`

| Key | Default | Notes |
|---|---|---|
| `LabelRewrite` | `true` | use target labels in database instead of in series |
| `BusiGroupLabelKey` | `"busigroup"` (commented out by default) | default busigroup key name |
| `ForceUseServerTS` | `true` |  |
| `ident` | `"xx"` (commented out by default) | [Pushgw.DebugSample] |
| `QueueMaxSize` | `1000000` (commented out by default) | [Pushgw.WriterOpt] |
| `QueuePopSize` | `1000` (commented out by default) |  |

### `[Pushgw.Writers]`

| Key | Default | Notes |
|---|---|---|
| `Url` | `"http://127.0.0.1:8480/insert/0/prometheus/api/v1/write"` (commented out by default) |  |
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
| `UseTLS` | `false` (commented out by default) | Optional TLS Config |
| `TLSCA` | `"/etc/n9e/ca.pem"` (commented out by default) |  |
| `TLSCert` | `"/etc/n9e/cert.pem"` (commented out by default) |  |
| `TLSKey` | `"/etc/n9e/key.pem"` (commented out by default) |  |
| `InsecureSkipVerify` | `false` (commented out by default) |  |
| `Action` | `"replace"` (commented out by default) | [[Writers.WriteRelabels]] |
| `SourceLabels` | `["__address__"]` (commented out by default) |  |
| `Regex` | `"([^:]+)(?::\\d+)?"` (commented out by default) |  |
| `Replacement` | `"$1:80"` (commented out by default) |  |
| `TargetLabel` | `"__address__"` (commented out by default) |  |

### `[Ibex]`

| Key | Default | Notes |
|---|---|---|
| `Enable` | `false` |  |
| `RPCListen` | `"0.0.0.0:20090"` |  |

### `[Redis]`

| Key | Default | Notes |
|---|---|---|
| `Address` | `"127.0.0.1:6379"` | address, ip:port or ip1:port,ip2:port for cluster and sentinel(SentinelAddrs) |
| `Username` | `""` (commented out by default) |  |
| `Password` | `""` (commented out by default) |  |
| `DB` | `0` (commented out by default) |  |
| `UseTLS` | `false` (commented out by default) |  |
| `TLSMinVersion` | `"1.2"` (commented out by default) |  |
| `RedisType` | `"standalone"` | standalone cluster sentinel |
| `MasterName` | `"mymaster"` (commented out by default) | Mastername for sentinel type |
| `SentinelUsername` | `""` (commented out by default) |  |
| `SentinelPassword` | `""` (commented out by default) |  |
<!-- /generated -->
