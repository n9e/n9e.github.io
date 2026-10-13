---
title: "用夜莺监控 GitLab"
sidebar_label: "Gitlab"
description: "GitLab 软件包内置多个 exporter，分别抓主机、Rails/Sidekiq、Gitaly、Workhorse、PostgreSQL、Redis 和 NGINX 的指标，模板有五张仪表盘。"
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Gitlab
toc_max_heading_level: 2
mdx:
  format: md
---

GitLab Linux Package 自带一整套 exporter：node_exporter（主机）、gitlab_exporter（Rails 与 Sidekiq）、Gitaly、Workhorse、postgres_exporter、redis_exporter 和 NGINX VTS。模板里的五张仪表盘（总览、机器性能、NGINX、PostgreSQL、Redis）各用其中一部分，要完整使用需要把这些端点都抓下来，而不是只抓一个 `/metrics`。

规则覆盖 Sidekiq 队列积压、Gitaly 与 Workhorse 错误率、数据库连接与 Redis 内存、HTTP 5xx 和主机资源。

## 模板里有什么

- **5 张仪表盘**，共 52 个面板
- **9 条告警规则**，每条附处置步骤

## 怎么接入

外部 Categraf 抓取时，在 `/etc/gitlab/gitlab.rb` 里让各 exporter 监听可达地址，并用防火墙只允许采集节点访问：

```ruby
prometheus['enable'] = false
node_exporter['listen_address'] = '0.0.0.0:9100'
gitlab_workhorse['prometheus_listen_addr'] = '0.0.0.0:9229'
gitlab_exporter['listen_address'] = '0.0.0.0'
gitlab_exporter['listen_port'] = '9168'
redis_exporter['listen_address'] = '0.0.0.0:9121'
postgres_exporter['listen_address'] = '0.0.0.0:9187'
gitaly['configuration'] = { prometheus_listen_addr: '0.0.0.0:9236' }
```

`gitlab-ctl reconfigure` 后，用 Categraf 的 `prometheus` 插件把这些端口逐个配进 `urls`，`labels` 里统一给 `job = "gitlab"`。如果保留了 GitLab 自带的 Prometheus，也可以直接把它[接成数据源](/docs/data/prometheus)。

1. 在夜莺「集成中心」里找到 Gitlab，把仪表盘和告警规则[导入到业务组](/docs/data/integrations/import)。
1. 导入的告警规则默认是停用的。先[确认指标已经入库](/docs/data/integrations/verify)，再按自己环境的阈值逐条启用。

## 内置仪表盘

| 仪表盘 | 面板数 |
| --- | ---: |
| GitLab - Machine Performance | 10 |
| GitLab - NGINX VTS | 7 |
| GitLab - Overview | 10 |
| GitLab - PostgreSQL | 15 |
| GitLab - Redis | 10 |

## 内置告警规则

共 9 条。每条给出触发条件（PromQL）和告警后的处置步骤，导入后可以直接改阈值。

### HighgRPCResourceExhaustedRate

High gRPC ResourceExhausted error rate

S2 警告 · 持续 60 分钟 · 触发条件:

```promql
sum without (grpc_code, grpc_method, grpc_service, grpc_type) (
  rate(grpc_server_handled_total{grpc_code="ResourceExhausted"}[5m])
) / sum without (grpc_code, grpc_method, grpc_service, grpc_type) (
  rate(grpc_server_handled_total[5m])
) * 100 > 1
```

处置步骤:

1. 在 Gitaly 节点看日志确认是哪类 RPC 被限流（gitaly_concurrency_limiting 相关）；
1. 用 gitlab-ctl status 与节点 CPU/IO 确认 Gitaly 是否已过载；
1. 定位是否有超大仓库或异常客户端在反复拉取，必要时临时限制该来源；
1. 容量确实不足则调大 Gitaly 的并发限制并扩容节点。

### HighPumaUtilization

Puma instance \{\{ $labels.instance \}\} has more than 90% thread utilization (\{\{ $value | printf "%.1f" \}\}%) over the last 60 minutes.

S2 警告 · 持续 60 分钟 · 触发条件:

```promql
instance:puma_utilization:ratio * 100 > 90
```

处置步骤:

1. 在 GitLab 节点用 gitlab-ctl status 确认 puma 进程状态，看 /var/log/gitlab/puma/ 下日志有无超时；
1. 结合 PumaQueueing 告警判断排队深度；
1. 短期可调大 puma['worker_processes'] 与 max_threads 后 gitlab-ctl reconfigure；
1. 排查是否有慢请求（大 MR diff、大仓库页面）长时间占住 worker，必要时限流。

### PostgresDatabaseDeadlocks

Postgres database has deadlocks

S2 警告 · 触发条件:

```promql
increase(pg_stat_database_deadlocks[5m]) > 0
```

处置步骤:

1. 在 PG 上确认 log_lock_waits=on，从日志里取死锁双方的完整 SQL；
1. 关联 pg_locks 与 pg_stat_activity 确认是哪两张表互相等待；
1. GitLab 场景常见于 CI 并发更新同一批记录——降低并发或升级 GitLab 版本（上游常修此类问题）；
1. 检查是否有长事务放大了死锁概率。

### PostgresDown

The Postgres service \{\{ $labels.job \}\} instance \{\{ $labels.instance \}\} is not responding for more than 50% of the time for 5 minutes.

S2 警告 · 触发条件:

```promql
avg_over_time(pg_up[5m]) * 100 < 50
```

处置步骤:

1. 登录 PG 节点确认进程存活（gitlab-ctl status postgresql 或 systemctl status postgresql）；
1. 进程存活则用 psql 手工连一次，区分实例夯住与网络/pg_hba 问题；
1. 进程不在则看 PG 日志尾部定位（磁盘满、WAL 目录写满、OOM）再拉起；
1. 有备库的评估是否需要切换。

### PumaQueueing

Puma instance \{\{ $labels.instance \}\} is queueing requests with an average of \{\{ $value | printf "%.1f" \}\} over the last 30 minutes.

S2 警告 · 触发条件:

```promql
avg_over_time(puma_queued_connections[30m]) > 1
```

处置步骤:

1. 结合 HighPumaUtilization 确认 worker 利用率；
1. 看 /var/log/gitlab/puma/puma_stdout.log 与 gitlab-rails 日志找耗时最长的请求路径；
1. 短期调大 puma['worker_processes'] 后 gitlab-ctl reconfigure；
1. 长期排查慢请求根因（大仓库、大 MR、未加索引的查询），必要时扩容节点。

### RedisDown

The Redis service \{\{ $labels.job \}\} instance \{\{ $labels.instance \}\} is not responding for more than 50% of the time for 5 minutes.

S2 警告 · 触发条件:

```promql
avg_over_time(redis_up[5m]) * 100 < 50
```

处置步骤:

1. 登录 Redis 节点用 gitlab-ctl status redis 或 systemctl status redis 确认进程；
1. 进程存活则 redis-cli ping 手工验证，区分夯住与网络/密码问题；
1. 进程不在则看日志定位（OOM、磁盘满导致 RDB 写失败）再拉起；
1. 恢复后确认 Sidekiq 队列是否积压，必要时观察消费进度。

### ServiceDown

The service \{\{ $labels.job \}\} instance \{\{ $labels.instance \}\} is not responding for more than 50% of the time for 5 minutes.

S2 警告 · 触发条件:

```promql
avg_over_time(up[5m]) * 100 < 50
```

处置步骤:

1. 从告警标签取 job/instance 定位是哪个组件（gitaly/puma/sidekiq/registry 等）；
1. 在对应节点用 gitlab-ctl status 确认进程状态；
1. 用 gitlab-ctl tail \<service> 看日志定位退出原因；
1. 拉起后用 gitlab-rake gitlab:check 做一次整体健康检查。

### SidekiqJobsQueuing

Sidekiq has jobs queued

S2 警告 · 持续 60 分钟 · 触发条件:

```promql
sum by (name) (sidekiq_queue_size) > 0
```

处置步骤:

1. 从告警标签取 name 确认是哪个队列积压；
1. 在 GitLab 管理后台的 Background Jobs 页或用 gitlab-rails runner 看队列深度与失败任务；
1. 确认 Sidekiq 进程是否存活、并发数配置是否偏小（sidekiq['max_concurrency']）；
1. 大量任务失败重试导致的，先定位失败根因（Redis/PG 异常、外部依赖超时）再清理。

### WorkhorseHighErrorRate

Workhorse has high error rates

S2 警告 · 触发条件:

```promql
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
1. 常见根因是后端 puma 超时或 Gitaly 不可用——先确认这两者健康；
1. 大文件相关的检查磁盘空间与临时目录权限；
1. 若与近期升级时间吻合，优先回滚。

## 相关链接

- [Gitlab 模板源文件](https://github.com/ccfos/nightingale/tree/main/integrations/Gitlab）：仪表盘、规则和采集配置的 JSON 原文，欢迎提 PR。
- [导入仪表盘和告警规则](/docs/data/integrations/import)
- [核对指标是否入库](/docs/data/integrations/verify)
- [全部集成目录](/integrations)
