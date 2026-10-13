---
title: "Monitor HAProxy with Nightingale"
sidebar_label: "HAProxy"
description: "Reads HAProxy's CSV stats page or Runtime API for sessions, queues, errors and health state per frontend, backend and server."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/HAProxy
toc_max_heading_level: 2
mdx:
  format: md
---

The HAProxy input reads the CSV output of the stats page (`/stats;csv`) or the Runtime API Unix socket. It collects current and maximum sessions, queue length, request rate, status code classes, connection and response errors, retries and redispatches at frontend, backend and server level, plus the health-check result of every backend server. Verified against real backend traffic.

The rules cover backend servers marked DOWN, backends with no servers left, queue buildup, rising 5xx and HAProxy itself being unreachable.

## What's in the template

- **1 dashboard**, 10 panels in total
- **8 alert rules**, each with runbook steps
- **Categraf collector config**: `input.haproxy`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.haproxy/haproxy.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.haproxy started` once the plugin is loaded.

   ```toml
   [[instances]]
   # URI on which to scrape HAProxy.
   # e.g. 
   # uri = "http://localhost:5000/baz?stats;csv"
   # uri = "http://user:pass@haproxy.example.com/haproxy?stats;csv"
   # uri = "unix:/run/haproxy/admin.sock"
   uri = ""

   # Flag that enables SSL certificate verification for the scrape URI
   ssl_verify = false

   # Comma-separated list of exported server metrics. See http://cbonte.github.io/haproxy-dconv/configuration-1.5.html#9.1
   server_metric_fields = ""

   # Comma-separated list of exported server states to exclude. See https://cbonte.github.io/haproxy-dconv/1.8/management.html#9.1, field 17 status
   server_exclude_states = ""

   # Timeout for trying to get stats from HAProxy.
   timeout = "5s"

   # Flag that enables using HTTP proxy settings from environment variables ($http_proxy, $https_proxy, $no_proxy)
   proxy_from_env = false
   ```

1. Open the integration center in Nightingale, find HAProxy, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| HAProxy By Categraf | 10 |

## Bundled alert rules

8 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### HAProxy instance unreachable

S1 Critical · for 1 min · Trigger:

```promql
haproxy_up == 0
```

Runbook:

1. Log in to the host and run systemctl status haproxy to confirm the process is alive;
1. If it is alive, verify the stats endpoint by hand with curl -s http://\<host>:\<port>/stats\;csv and check whether an ACL or firewall is blocking it;
1. If it is not running, validate the config first with haproxy -c -f /etc/haproxy/haproxy.cfg, then start it and check /var/log/haproxy.log for the exit reason;
1. Confirm the VIP layer (keepalived or similar) has failed over, otherwise move traffic to the standby node by hand.

### HAProxy backend entirely unavailable

S1 Critical · for 1 min · Trigger:

```promql
haproxy_backend_up == 0
```

Runbook:

1. Take the backend name from the alert labels and run echo 'show stat' | socat stdio /var/run/haproxy.sock to see the state and down reason of every server in that backend;
1. curl each backend address from the HAProxy host to tell a collective backend failure apart from a HAProxy-to-backend network problem;
1. If the backends are healthy, check whether the backend's check configuration (probe path, timeout, rise/fall) is too aggressive;
1. If it cannot be recovered quickly, switch traffic to a standby backend or a degraded page.

### HAProxy backend server unavailable

S2 Warning · for 1 min · Trigger:

```promql
haproxy_server_up == 0
```

Runbook:

1. Take backend and server from the alert labels and log in to that backend host to confirm the application process and port are alive;
1. curl the backend address from the HAProxy host to tell an application failure apart from a network problem;
1. For an application failure, follow that application's own recovery procedure, then confirm HAProxy has automatically added it back (haproxy_server_up returns to 1);
1. Run echo 'show stat' | socat stdio /var/run/haproxy.sock to see how many servers are still available in the backend, and scale out immediately if headroom is low.

### HAProxy backend 5xx ratio too high

S1 Critical · for 3 min · Trigger:

```promql
sum by (backend) (rate(haproxy_backend_http_responses_total{code="5xx"}[5m])) / sum by (backend) (rate(haproxy_backend_http_responses_total[5m])) > 0.05
```

Runbook:

1. Take the backend name from the alert labels and first determine whether every server is erroring or only one (compare haproxy_server_http_responses_total\{code="5xx"\});
1. If it is one server, remove it from the backend to stop the bleeding;
1. If all of them are erroring, check the backend application logs for the root cause (dependency timeouts, exhausted connection pool, a bug from a release);
1. If it lines up with a recent release, roll back first rather than keep investigating.

### HAProxy backend requests queueing

S2 Warning · for 5 min · Trigger:

```promql
haproxy_backend_current_queue > 0
```

Runbook:

1. Take the backend name from the alert labels and compare with haproxy_backend_http_response_time_average_seconds to tell a slower backend apart from rising concurrency;
1. If the backend got slower, investigate on the application side (slow queries, GC, dependency timeouts);
1. If concurrency rose, check whether maxconn on the backend and its servers is set too low, raise it and reload;
1. If backend capacity is genuinely insufficient, add more servers.

### HAProxy frontend sessions approaching the limit

S2 Warning · for 5 min · Trigger:

```promql
haproxy_frontend_limit_sessions > 0 and haproxy_frontend_current_sessions / haproxy_frontend_limit_sessions > 0.8
```

Runbook:

1. Take the frontend name from the alert labels and determine whether this is natural traffic growth or abnormal traffic (slow connections, crawlers);
1. For natural growth, raise the frontend maxconn and the global maxconn, confirm the system ulimit -n and memory are sufficient, then reload;
1. For abnormal traffic, add a stick-table rate limit on the frontend or block the source IPs outright;
1. Check whether many connections are sitting idle for a long time and tighten timeout client.

### HAProxy backend response time too high

S2 Warning · for 5 min · Trigger:

```promql
haproxy_backend_http_response_time_average_seconds > 1
```

Runbook:

1. Take the backend name from the alert labels and compare haproxy_backend_http_connect_time_average_seconds with http_queue_time_average_seconds to tell slow connects, long queueing and slow backend processing apart;
1. For long queueing, handle it as request queueing (raise maxconn or scale out);
1. For slow processing, investigate on the application side (slow queries, GC, downstream timeouts);
1. You may raise timeout server temporarily so requests are not cut off while you investigate, but do not treat it as a long-term fix.

### HAProxy backend connection errors

S2 Warning · for 3 min · Trigger:

```promql
increase(haproxy_backend_connection_errors_total[5m]) > 0
```

Runbook:

1. Take the backend name from the alert labels and run echo 'show stat' | socat stdio /var/run/haproxy.sock to see which server's connection errors are growing;
1. telnet or curl that backend address from the HAProxy host to tell a closed port, a refused connection and a connect timeout apart;
1. If the backend process is healthy, check the network in between, the security groups, and whether the backend's backlog/somaxconn is saturated;
1. Check whether the backend's timeout connect is set too short and causing false positives.

## Related

- [HAProxy template source](https://github.com/ccfos/nightingale/tree/main/integrations/HAProxy): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `haproxy` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/haproxy): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
