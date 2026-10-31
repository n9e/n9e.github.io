# 用夜莺监控 GitLab

GitLab 软件包内置多个 exporter，分别抓主机、Rails/Sidekiq、Gitaly、Workhorse、PostgreSQL、Redis 和 NGINX 的指标，模板有五张仪表盘。

最后校对于 2026-10-31

GitLab Linux Package 自带一整套 exporter：node\_exporter（主机）、gitlab\_exporter（Rails 与 Sidekiq）、Gitaly、Workhorse、postgres\_exporter、redis\_exporter 和 NGINX VTS。模板里的五张仪表盘（总览、机器性能、NGINX、PostgreSQL、Redis）各用其中一部分，要完整使用需要把这些端点都抓下来，而不是只抓一个 `/metrics`。

规则覆盖 Sidekiq 队列积压、Gitaly 与 Workhorse 错误率、数据库连接与 Redis 内存、HTTP 5xx 和主机资源。

## 模板里有什么[​](#模板里有什么 "模板里有什么的直接链接")

* **5 张仪表盘**，共 52 个面板
* **9 条告警规则**，每条附处置步骤

## 怎么接入[​](#怎么接入 "怎么接入的直接链接")

外部 Categraf 抓取时，在 `/etc/gitlab/gitlab.rb` 里让各 exporter 监听可达地址，并用防火墙只允许采集节点访问：

```
prometheus['enable'] = false

node_exporter['listen_address'] = '0.0.0.0:9100'

gitlab_workhorse['prometheus_listen_addr'] = '0.0.0.0:9229'

gitlab_exporter['listen_address'] = '0.0.0.0'

gitlab_exporter['listen_port'] = '9168'

redis_exporter['listen_address'] = '0.0.0.0:9121'

postgres_exporter['listen_address'] = '0.0.0.0:9187'

gitaly['configuration'] = { prometheus_listen_addr: '0.0.0.0:9236' }
```

`gitlab-ctl reconfigure` 后，用 Categraf 的 `prometheus` 插件把这些端口逐个配进 `urls`，`labels` 里统一给 `job = "gitlab"`。如果保留了 GitLab 自带的 Prometheus，也可以直接把它[接成数据源](https://n9e.github.io/zh/docs/data/prometheus.md)。

1. 在夜莺「集成中心」里找到 Gitlab，把仪表盘和告警规则[导入到业务组](https://n9e.github.io/zh/docs/data/integrations/import.md)。
2. 导入的告警规则默认是停用的。先[确认指标已经入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)，再按自己环境的阈值逐条启用。

## 内置仪表盘[​](#内置仪表盘 "内置仪表盘的直接链接")

| 仪表盘                       | 面板数 |
| ---------------------------- | ------ |
| GitLab - Machine Performance | 10     |
| GitLab - NGINX VTS           | 7      |
| GitLab - Overview            | 10     |
| GitLab - PostgreSQL          | 15     |
| GitLab - Redis               | 10     |

## 内置告警规则[​](#内置告警规则 "内置告警规则的直接链接")

共 9 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### HighgRPCResourceExhaustedRate[​](#highgrpcresourceexhaustedrate "HighgRPCResourceExhaustedRate的直接链接")

High gRPC ResourceExhausted error rate

S2 警告 · 持续 60 分钟 · 触发条件:

```
sum without (grpc_code, grpc_method, grpc_service, grpc_type) (

  rate(grpc_server_handled_total{grpc_code="ResourceExhausted"}[5m])

) / sum without (grpc_code, grpc_method, grpc_service, grpc_type) (

  rate(grpc_server_handled_total[5m])

) * 100 > 1
```

处置步骤:

1. 在 Gitaly 节点看日志确认是哪类 RPC 被限流（gitaly\_concurrency\_limiting 相关）；
2. 用 gitlab-ctl status 与节点 CPU/IO 确认 Gitaly 是否已过载；
3. 定位是否有超大仓库或异常客户端在反复拉取，必要时临时限制该来源；
4. 容量确实不足则调大 Gitaly 的并发限制并扩容节点。

### HighPumaUtilization[​](#highpumautilization "HighPumaUtilization的直接链接")

Puma instance {{ $labels.instance }} has more than 90% thread utilization ({{ $value | printf "%.1f" }}%) over the last 60 minutes.

S2 警告 · 持续 60 分钟 · 触发条件:

```
instance:puma_utilization:ratio * 100 > 90
```

处置步骤:

1. 在 GitLab 节点用 gitlab-ctl status 确认 puma 进程状态，看 /var/log/gitlab/puma/ 下日志有无超时；
2. 结合 PumaQueueing 告警判断排队深度；
3. 短期可调大 puma\['worker\_processes'] 与 max\_threads 后 gitlab-ctl reconfigure；
4. 排查是否有慢请求（大 MR diff、大仓库页面）长时间占住 worker，必要时限流。

### PostgresDatabaseDeadlocks[​](#postgresdatabasedeadlocks "PostgresDatabaseDeadlocks的直接链接")

Postgres database has deadlocks

S2 警告 · 触发条件:

```
increase(pg_stat_database_deadlocks[5m]) > 0
```

处置步骤:

1. 在 PG 上确认 log\_lock\_waits=on，从日志里取死锁双方的完整 SQL；
2. 关联 pg\_locks 与 pg\_stat\_activity 确认是哪两张表互相等待；
3. GitLab 场景常见于 CI 并发更新同一批记录——降低并发或升级 GitLab 版本（上游常修此类问题）；
4. 检查是否有长事务放大了死锁概率。

### PostgresDown[​](#postgresdown "PostgresDown的直接链接")

The Postgres service {{ $labels.job }} instance {{ $labels.instance }} is not responding for more than 50% of the time for 5 minutes.

S2 警告 · 触发条件:

```
avg_over_time(pg_up[5m]) * 100 < 50
```

处置步骤:

1. 登录 PG 节点确认进程存活（gitlab-ctl status postgresql 或 systemctl status postgresql）；
2. 进程存活则用 psql 手工连一次，区分实例夯住与网络/pg\_hba 问题；
3. 进程不在则看 PG 日志尾部定位（磁盘满、WAL 目录写满、OOM）再拉起；
4. 有备库的评估是否需要切换。

### PumaQueueing[​](#pumaqueueing "PumaQueueing的直接链接")

Puma instance {{ $labels.instance }} is queueing requests with an average of {{ $value | printf "%.1f" }} over the last 30 minutes.

S2 警告 · 触发条件:

```
avg_over_time(puma_queued_connections[30m]) > 1
```

处置步骤:

1. 结合 HighPumaUtilization 确认 worker 利用率；
2. 看 /var/log/gitlab/puma/puma\_stdout.log 与 gitlab-rails 日志找耗时最长的请求路径；
3. 短期调大 puma\['worker\_processes'] 后 gitlab-ctl reconfigure；
4. 长期排查慢请求根因（大仓库、大 MR、未加索引的查询），必要时扩容节点。

### RedisDown[​](#redisdown "RedisDown的直接链接")

The Redis service {{ $labels.job }} instance {{ $labels.instance }} is not responding for more than 50% of the time for 5 minutes.

S2 警告 · 触发条件:

```
avg_over_time(redis_up[5m]) * 100 < 50
```

处置步骤:

1. 登录 Redis 节点用 gitlab-ctl status redis 或 systemctl status redis 确认进程；
2. 进程存活则 redis-cli ping 手工验证，区分夯住与网络/密码问题；
3. 进程不在则看日志定位（OOM、磁盘满导致 RDB 写失败）再拉起；
4. 恢复后确认 Sidekiq 队列是否积压，必要时观察消费进度。

### ServiceDown[​](#servicedown "ServiceDown的直接链接")

The service {{ $labels.job }} instance {{ $labels.instance }} is not responding for more than 50% of the time for 5 minutes.

S2 警告 · 触发条件:

```
avg_over_time(up[5m]) * 100 < 50
```

处置步骤:

1. 从告警标签取 job/instance 定位是哪个组件（gitaly/puma/sidekiq/registry 等）；
2. 在对应节点用 gitlab-ctl status 确认进程状态；
3. 用 gitlab-ctl tail \<service> 看日志定位退出原因；
4. 拉起后用 gitlab-rake gitlab:check 做一次整体健康检查。

### SidekiqJobsQueuing[​](#sidekiqjobsqueuing "SidekiqJobsQueuing的直接链接")

Sidekiq has jobs queued

S2 警告 · 持续 60 分钟 · 触发条件:

```
sum by (name) (sidekiq_queue_size) > 0
```

处置步骤:

1. 从告警标签取 name 确认是哪个队列积压；
2. 在 GitLab 管理后台的 Background Jobs 页或用 gitlab-rails runner 看队列深度与失败任务；
3. 确认 Sidekiq 进程是否存活、并发数配置是否偏小（sidekiq\['max\_concurrency']）；
4. 大量任务失败重试导致的，先定位失败根因（Redis/PG 异常、外部依赖超时）再清理。

### WorkhorseHighErrorRate[​](#workhorsehigherrorrate "WorkhorseHighErrorRate的直接链接")

Workhorse has high error rates

S2 警告 · 触发条件:

```
(

  sum without (job, code) (

    job_route_method_code:gitlab_workhorse_http_request_duration_seconds_count:rate5m{code=~"5.."}

  ) /

  sum without (job,code) (

    job_route_method_code:gitlab_workhorse_http_request_duration_seconds_count:rate5m

  ) < 10

) * 100 > 50
```

处置步骤:

1. 用 gitlab-ctl tail gitlab-workhorse 看具体报错与出错的路由；
2. 常见根因是后端 puma 超时或 Gitaly 不可用——先确认这两者健康；
3. 大文件相关的检查磁盘空间与临时目录权限；
4. 若与近期升级时间吻合，优先回滚。

## 相关链接[​](#相关链接 "相关链接的直接链接")

* \[Gitlab 模板源文件]\([https://github.com/ccfos/nightingale/tree/main/integrations/Gitlab）：仪表盘、规则和采集配置的](https://github.com/ccfos/nightingale/tree/main/integrations/Gitlab%EF%BC%89%EF%BC%9A%E4%BB%AA%E8%A1%A8%E7%9B%98%E3%80%81%E8%A7%84%E5%88%99%E5%92%8C%E9%87%87%E9%9B%86%E9%85%8D%E7%BD%AE%E7%9A%84) JSON 原文，欢迎提 PR。
* [导入仪表盘和告警规则](https://n9e.github.io/zh/docs/data/integrations/import.md)
* [核对指标是否入库](https://n9e.github.io/zh/docs/data/integrations/verify.md)
* [全部集成目录](https://n9e.github.io/zh/integrations.md)
