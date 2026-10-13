# Monitor GitLab with Nightingale

The GitLab package bundles several exporters for the host, Rails/Sidekiq, Gitaly, Workhorse, PostgreSQL, Redis and NGINX; the template ships five dashboards.

Last reviewed 2026-10-13

The GitLab Linux Package comes with a full set of exporters: node\_exporter (host), gitlab\_exporter (Rails and Sidekiq), Gitaly, Workhorse, postgres\_exporter, redis\_exporter and NGINX VTS. The five dashboards (overview, machine performance, NGINX, PostgreSQL, Redis) each use part of that set, so scrape all of these endpoints rather than a single `/metrics`.

The rules cover Sidekiq queue backlog, Gitaly and Workhorse error rates, database connections and Redis memory, HTTP 5xx and host resources.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 dashboards**, 52 panels in total
* **9 alert rules**, each with runbook steps

## How to connect[​](#how-to-connect "Direct link to How to connect")

For an external Categraf, make the exporters listen on reachable addresses in `/etc/gitlab/gitlab.rb` and firewall them to the collector node:

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

After `gitlab-ctl reconfigure`, list each port in the `urls` of the Categraf `prometheus` input with `job = "gitlab"` in `labels`. If you keep GitLab's bundled Prometheus, [adding it as a data source](https://n9e.github.io/docs/data/prometheus.md) works too.

1. Open the integration center in Nightingale, find Gitlab, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                    | Panels |
| ---------------------------- | ------ |
| GitLab - Machine Performance | 10     |
| GitLab - NGINX VTS           | 7      |
| GitLab - Overview            | 10     |
| GitLab - PostgreSQL          | 15     |
| GitLab - Redis               | 10     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

9 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### HighgRPCResourceExhaustedRate[​](#highgrpcresourceexhaustedrate "Direct link to HighgRPCResourceExhaustedRate")

High gRPC ResourceExhausted error rate

S2 Warning · for 60 min · Trigger:

```
sum without (grpc_code, grpc_method, grpc_service, grpc_type) (

  rate(grpc_server_handled_total{grpc_code="ResourceExhausted"}[5m])

) / sum without (grpc_code, grpc_method, grpc_service, grpc_type) (

  rate(grpc_server_handled_total[5m])

) * 100 > 1
```

Runbook:

1. On the Gitaly node, check the logs to see which RPCs are being limited (gitaly\_concurrency\_limiting related);
2. Use gitlab-ctl status plus node CPU/IO to confirm Gitaly is overloaded;
3. Determine whether an oversized repository or a misbehaving client is pulling repeatedly, and throttle that source temporarily;
4. If capacity is genuinely short, raise Gitaly's concurrency limits and add nodes.

### HighPumaUtilization[​](#highpumautilization "Direct link to HighPumaUtilization")

Puma instance {{ $labels.instance }} has more than 90% thread utilization ({{ $value | printf "%.1f" }}%) over the last 60 minutes.

S2 Warning · for 60 min · Trigger:

```
instance:puma_utilization:ratio * 100 > 90
```

Runbook:

1. On the GitLab node run gitlab-ctl status to check the puma process and look for timeouts in /var/log/gitlab/puma/;
2. Combine with the PumaQueueing alert to judge the queue depth;
3. Short term, raise puma\['worker\_processes'] and max\_threads then run gitlab-ctl reconfigure;
4. Look for slow requests (large MR diffs, big repository pages) holding workers for a long time and rate limit them if needed.

### PostgresDatabaseDeadlocks[​](#postgresdatabasedeadlocks "Direct link to PostgresDatabaseDeadlocks")

Postgres database has deadlocks

S2 Warning · Trigger:

```
increase(pg_stat_database_deadlocks[5m]) > 0
```

Runbook:

1. On PostgreSQL confirm log\_lock\_waits=on and take the full SQL of both deadlock participants from the log;
2. Join pg\_locks with pg\_stat\_activity to identify which two tables are waiting on each other;
3. In GitLab this commonly comes from CI concurrently updating the same records — reduce concurrency or upgrade GitLab (upstream frequently fixes these);
4. Check whether a long transaction is amplifying the deadlock probability.

### PostgresDown[​](#postgresdown "Direct link to PostgresDown")

The Postgres service {{ $labels.job }} instance {{ $labels.instance }} is not responding for more than 50% of the time for 5 minutes.

S2 Warning · Trigger:

```
avg_over_time(pg_up[5m]) * 100 < 50
```

Runbook:

1. Log in to the PostgreSQL node and confirm the process is alive (gitlab-ctl status postgresql or systemctl status postgresql);
2. If it is alive, connect by hand with psql to tell a hung instance from a network or pg\_hba problem;
3. If it is not running, read the tail of the PG log (full disk, full WAL directory, OOM) before starting it;
4. If a standby exists, assess whether to fail over.

### PumaQueueing[​](#pumaqueueing "Direct link to PumaQueueing")

Puma instance {{ $labels.instance }} is queueing requests with an average of {{ $value | printf "%.1f" }} over the last 30 minutes.

S2 Warning · Trigger:

```
avg_over_time(puma_queued_connections[30m]) > 1
```

Runbook:

1. Combine with HighPumaUtilization to confirm worker utilization;
2. Check /var/log/gitlab/puma/puma\_stdout.log and the gitlab-rails log for the slowest request paths;
3. Short term, raise puma\['worker\_processes'] and run gitlab-ctl reconfigure;
4. Longer term, find the root cause of the slow requests (large repositories, large MRs, unindexed queries) and add nodes if needed.

### RedisDown[​](#redisdown "Direct link to RedisDown")

The Redis service {{ $labels.job }} instance {{ $labels.instance }} is not responding for more than 50% of the time for 5 minutes.

S2 Warning · Trigger:

```
avg_over_time(redis_up[5m]) * 100 < 50
```

Runbook:

1. Log in to the Redis node and check the process with gitlab-ctl status redis or systemctl status redis;
2. If it is alive, verify with redis-cli ping to tell a hang from a network or password problem;
3. If it is not running, check the logs (OOM, or a full disk breaking the RDB write) before starting it;
4. After recovery, check whether the Sidekiq queues are backed up and watch them drain.

### ServiceDown[​](#servicedown "Direct link to ServiceDown")

The service {{ $labels.job }} instance {{ $labels.instance }} is not responding for more than 50% of the time for 5 minutes.

S2 Warning · Trigger:

```
avg_over_time(up[5m]) * 100 < 50
```

Runbook:

1. Take job/instance from the alert labels to identify the component (gitaly/puma/sidekiq/registry, etc.);
2. On that node run gitlab-ctl status to check the process state;
3. Use gitlab-ctl tail \<service> to find the exit reason in the logs;
4. After restarting, run gitlab-rake gitlab:check for an overall health check.

### SidekiqJobsQueuing[​](#sidekiqjobsqueuing "Direct link to SidekiqJobsQueuing")

Sidekiq has jobs queued

S2 Warning · for 60 min · Trigger:

```
sum by (name) (sidekiq_queue_size) > 0
```

Runbook:

1. Take name from the alert labels to identify the backed-up queue;
2. Check queue depth and failed jobs in the GitLab admin Background Jobs page or via gitlab-rails runner;
3. Confirm the Sidekiq process is alive and that concurrency is not set too low (sidekiq\['max\_concurrency']);
4. If it is caused by mass job failures and retries, find the failure root cause (Redis/PG problems, external timeouts) before clearing them.

### WorkhorseHighErrorRate[​](#workhorsehigherrorrate "Direct link to WorkhorseHighErrorRate")

Workhorse has high error rates

S2 Warning · Trigger:

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

Runbook:

1. Run gitlab-ctl tail gitlab-workhorse to see the exact errors and the failing routes;
2. The usual root cause is a puma timeout or Gitaly being unavailable — confirm both are healthy first;
3. For large-file issues, check disk space and temporary directory permissions;
4. If it lines up with a recent upgrade, roll back first.

## Related[​](#related "Direct link to Related")

* [Gitlab template source](https://github.com/ccfos/nightingale/tree/main/integrations/Gitlab): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
