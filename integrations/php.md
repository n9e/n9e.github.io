---
title: "Monitor PHP-FPM with Nightingale"
sidebar_label: "PHP"
description: "With pm.status_path enabled, the input reads the PHP-FPM pool status over HTTP or a Unix socket: active and idle processes, request queue, slow requests and max-children hits."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/PHP
toc_max_heading_level: 2
mdx:
  format: md
---

The PHP-FPM input is adapted from Telegraf's phpfpm plugin and reads the pool status page: accepted connections, listen queue length and maximum, idle and active processes, total processes, how often `max_children` was reached and the slow request count. These are the direct indicators of a saturated PHP application.

Enable `pm.status_path = /status` in `php-fpm.conf` or the pool config. Over HTTP the input supports timeouts, Basic Auth, custom headers and TLS; over a Unix socket, Categraf must run on the same host with read access to the socket. The rules cover a full process pool, listen queue backlog, rising slow requests and FPM being unreachable.

## What's in the template

- **5 alert rules**, each with runbook steps
- **Categraf collector config**: `input.phpfpm`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.phpfpm/phpfpm.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.phpfpm started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   ## An array of Nginx stub_status URI to gather stats.
   urls = [
   ## HTTP: the URL must start with http:// or https://, ie:
   #    "http://localhost/status",
   #    "https://www.baidu.com/phpfpm-status",
   ## fcgi: the URL must start with fcgi:// or cgi://, and port must be present, ie:
   #    "fcgi://127.0.0.1:9001",
   #    "cgi://192.168.0.1:9000/status",
   ## Unix socket: path to fpm socket, ie:
   #    "/run/php/php7.2-fpm.sock",
   ##    or using a custom fpm status path:
   #    "/var/run/php5-fpm.sock:/fpm-custom-status-path",
   ##    glob patterns are also supported:
   #    "/var/run/php*.sock"
   ]

   ## append some labels for series
   # labels = { region="cloud", product="n9e" }

   ## interval = global.interval * interval_times
   # interval_times = 1

   ## Set response_timeout (default 5 seconds),HTTP urls only
   response_timeout = "5s"

   ## Whether to follow redirects from the server (defaults to false),HTTP urls only
   # follow_redirects = false

   ## Optional HTTP Basic Auth Credentials,HTTP urls only
   #username = "admin"
   #password = "admin"

   ## Optional headers,HTTP urls only
   # headers = ["X-From", "categraf", "X-Xyz", "abc"]

   ## Optional TLS Config,only http
   # use_tls = false
   # tls_ca = "/etc/categraf/ca.pem"
   # tls_cert = "/etc/categraf/cert.pem"
   # tls_key = "/etc/categraf/key.pem"
   ## Use TLS but skip chain & host verification
   # insecure_skip_verify = false
   ```

1. Open the integration center in Nightingale, find PHP, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### PHP-FPM reached the max_children limit

S1 Critical · for 1 min · Trigger:

```promql
increase(phpfpm_max_children_reached[10m]) > 0
```

Runbook:

1. Take pool from the alert labels and run grep -i 'server reached pm.max_children' /var/log/php-fpm.log to see how often this happens;
1. Compute the average per-process memory with ps --no-headers -o rss -C php-fpm | awk '\{s+=$1\} END \{print s/NR/1024" MB"\}', then derive a safe max_children from available memory divided by that figure;
1. Raise pm.max_children to the computed value and run systemctl reload php-fpm; do not raise it blindly or you will trigger an OOM;
1. If per-process memory or duration is abnormal, use the slowlog to find the slow scripts and reduce concurrency demand at the source.

### PHP-FPM listen queue backing up

S2 Warning · for 3 min · Trigger:

```promql
phpfpm_listen_queue / (phpfpm_listen_queue_len > 0) * 100 > 30
```

Runbook:

1. Take pool from the alert labels and run curl -s http://127.0.0.1/status?full to see each worker's state and the URI it is serving;
1. Many workers stuck on the same URI means that endpoint has slowed down; use the slowlog and application logs to locate it (database slow queries and external API timeouts are the usual causes);
1. In the short term raise pm.max_children to add concurrency, after confirming there is enough memory;
1. If the queue itself is too small (listen.backlog defaults to 511), raise it for your concurrency level and raise the kernel's net.core.somaxconn to match.

### PHP-FPM idle processes exhausted

S2 Warning · for 3 min · Trigger:

```promql
phpfpm_idle_processes == 0
```

Runbook:

1. Run curl -s http://127.0.0.1/status?full and watch the request duration of each worker to find processes held by long requests;
1. Decide whether concurrency has grown or a slow script is holding workers: scale out or raise pm.max_children for the former, fix the script for the latter;
1. With pm=dynamic, check whether pm.start_servers and pm.min_spare_servers are too low, which prevents new workers being spawned fast enough at peak;
1. For sustained high load, switch to pm=static with a process count computed from memory to avoid fork churn.

### PHP-FPM slow requests increasing

S3 Info · for 1 min · Trigger:

```promql
increase(phpfpm_slow_requests[10m]) > 5
```

Runbook:

1. Run tail -100 /var/log/php-fpm/www-slow.log to read the full call stack of the slow requests; the top frame is where they are stuck;
1. Stacks stuck in PDO/mysqli point to the database, so check the slow query log and add indexes; stacks stuck in curl/file_get_contents need timeouts on the external call;
1. Stacks stuck in session_start are usually file-based session lock contention; switch to Redis sessions and call session_write_close early;
1. If request_slowlog_timeout is set too low and creates noise, adjust that parameter instead of ignoring the alert.

### PHP-FPM restarted recently

S3 Info · for 1 min · Trigger:

```promql
phpfpm_start_since < 300
```

Runbook:

1. First confirm whether this was a planned release or reload;
1. If unplanned, run journalctl -u php-fpm --since '-30min' and tail -200 /var/log/php-fpm.log to find the cause;
1. Run dmesg -T | grep -i 'killed process' to check for an OOM kill, and if so lower pm.max_children based on real per-process memory;
1. For repeated restarts, check whether an extension is segfaulting by ruling out third-party extensions one by one with php -m.

## Related

- [PHP template source](https://github.com/ccfos/nightingale/tree/main/integrations/PHP): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `phpfpm` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/phpfpm): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
