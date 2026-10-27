# Monitor Apache with Nightingale

Reads the server-status?auto output of mod\_status for request rate, busy and idle workers, CPU and traffic; rules watch worker exhaustion and unreachable servers.

Last reviewed 2026-10-27

With `mod_status` enabled, Apache httpd serves a machine-readable status page at `/server-status?auto`. The input scrapes it for total accesses and traffic, requests per second, busy and idle workers, CPU load, uptime and the distribution of worker states.

The rules cover idle workers running out, requests queuing, httpd being unreachable and restarts. Remember to restrict who can reach the status page.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 alert rules**, each with runbook steps
* **Categraf collector config**: `input.apache`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.apache/apache.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.apache started` once the plugin is loaded.

   ```
   [[instances]]



   # https://statuslist.app/apache/apache-status-page-simple-setup-guide/

   # scrape_uri = "http://localhost/server-status/?auto"

   # host_override = ""

   # insecure = false

   # custom_headers = {}

   # log_level = "info"
   ```

2. Open the integration center in Nightingale, find Apache, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Apache instance unreachable[​](#apache-instance-unreachable "Direct link to Apache instance unreachable")

S1 Critical · for 1 min · Trigger:

```
apache_up == 0
```

Runbook:

1. Log in to the host and run systemctl status httpd (or apache2) to confirm whether the master process is alive;
2. If the process is alive, run curl -s '<http://127.0.0.1/server-status?auto>' to verify by hand whether the status page is blocked by a Require directive or a firewall;
3. If the process is gone, run httpd -t to validate the configuration before starting it, and check the tail of error\_log for the cause (port already in use, expired certificate, module load failure are common);
4. Confirm the upstream load balancer has removed this node so traffic stops being sent to it.

### Apache idle workers exhausted[​](#apache-idle-workers-exhausted "Direct link to Apache idle workers exhausted")

S1 Critical · for 3 min · Trigger:

```
apache_workers{state="idle"} == 0
```

Runbook:

1. Run curl -s '<http://127.0.0.1/server-status?auto>' and read the Scoreboard to see which state workers are stuck in (W = sending reply, meaning a slow backend; R = reading request, meaning slow clients);
2. If they are stuck in W, first check whether the backend (PHP-FPM, database, upstream API) has slowed down, and use tail -f access\_log to find the slow URLs from the response-time column;
3. As a stopgap, raise MaxRequestWorkers and ServerLimit and reload gracefully, but re-check memory first (per-worker memory x concurrency must not exceed physical memory);
4. If slow clients are holding workers, enable mod\_reqtimeout and lower KeepAliveTimeout.

### Apache worker utilization too high[​](#apache-worker-utilization-too-high "Direct link to Apache worker utilization too high")

S2 Warning · for 5 min · Trigger:

```
sum without (state) (apache_workers{state="busy"}) / sum without (state) (apache_scoreboard) * 100 > 85
```

Runbook:

1. Run curl -s '<http://127.0.0.1/server-status?auto>' and compare BusyWorkers against the open\_slot headroom in the Scoreboard;
2. Use tail -n 10000 access\_log | awk to rank URLs by count and latency, and decide whether this is genuine traffic growth or one slow endpoint holding workers;
3. For traffic growth, scale out instances or raise MaxRequestWorkers (recalculating ServerLimit against memory);
4. For a slow endpoint, fix the backend first and apply mod\_reqtimeout or rate limiting to that URL so a single endpoint cannot drain the whole process pool.

### Apache average request duration too long[​](#apache-average-request-duration-too-long "Direct link to Apache average request duration too long")

S2 Warning · for 5 min · Trigger:

```
rate(apache_duration_ms_total[5m]) / (rate(apache_accesses_total[5m]) > 0) > 1000
```

Runbook:

1. Confirm the access\_log LogFormat includes %D (microsecond duration), then run awk '{print $NF, $7}' access\_log | sort -rn | head -20 to find the slowest URLs;
2. If the slow URLs are dynamic requests, move on to the backend (PHP-FPM slowlog, application logs, database slow queries);
3. If static assets are slow, check disk IO and whether sendfile or caching was accidentally disabled;
4. While investigating, apply mod\_ratelimit or degrade that URL so workers are not held indefinitely.

### Apache restarted recently[​](#apache-restarted-recently "Direct link to Apache restarted recently")

S3 Info · for 1 min · Trigger:

```
apache_uptime_seconds_total < 300
```

Runbook:

1. First confirm whether this was a planned release by checking change records and shell history;
2. If unplanned, run journalctl -u httpd --since '-30min' and tail -200 error\_log to determine whether it was a segfault, an OOM, or a configuration error;
3. For an OOM kill, confirm with dmesg -T | grep -i 'killed process' and lower MaxRequestWorkers based on real per-worker memory;
4. For repeated crashes, keep core dumps (CoreDumpDirectory) and bisect by disabling third-party modules one at a time.

## Related[​](#related "Direct link to Related")

* [Apache template source](https://github.com/ccfos/nightingale/tree/main/integrations/Apache): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `apache` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/apache): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
