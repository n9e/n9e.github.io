# Monitor Redis with Nightingale

Runs INFO against Redis to collect memory, hit ratio, connections, slowlog and replication state; includes a Sentinel input and templates for redis\_exporter.

Last reviewed 2026-10-31

The Redis input connects to the instance, runs `INFO` and parses the result into memory usage and fragmentation, keyspace hit ratio, connected and blocked clients, persistence state and replication status. Add one `[[instances]]` block per instance and give each an `instance` label; the dashboards filter on it.

For Sentinel deployments the `redis_sentinel` input collects the topology from the sentinel's point of view. Dashboards come in Categraf and redis\_exporter editions; the rules cover memory nearing maxmemory, dropping hit ratio, abnormal connection counts, broken replication and restarts.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **3 dashboards**, 47 panels in total
* **13 alert rules**, each with runbook steps
* **Categraf collector config**: `input.redis`, `input.redis_sentinel`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md) and enable the plugins you need. Each config goes in its own `conf/input.<plugin>/` directory; fill in addresses and credentials, then restart Categraf.

   `conf/input.redis/redis.toml`

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # address = "127.0.0.1:6379"

   # username = ""

   # password = ""

   # pool_size = 2



   # # Optional. Specify redis commands to retrieve values

   # commands = [

   #     {command = ["get", "sample-key1"], metric = "custom_metric_name1"},

   #     {command = ["get", "sample-key2"], metric = "custom_metric_name2"}

   # ]



   # # interval = global.interval * interval_times

   # interval_times = 1



   # important! use global unique string to specify instance

   # labels = { instance="n9e-10.2.3.4:6379" }



   ## Optional TLS Config

   # use_tls = false

   # tls_min_version = "1.2"

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = true
   ```

   `conf/input.redis_sentinel/redis_sentinel.toml`

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # [protocol://][:password]@address[:port]

   # e.g. servers = ["tcp://localhost:26379"]

   servers = []



   # # interval = global.interval * interval_times

   # interval_times = 1

   # add some dimension data by labels

   # labels = {}



   ## Optional TLS Config

   # use_tls = false

   # tls_min_version = "1.2"

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = true
   ```

2. Open the integration center in Nightingale, find Redis, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                 | Panels |
| ------------------------- | ------ |
| Redis by address          | 16     |
| Redis by instance         | 16     |
| Redis Overview - exporter | 15     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

13 rules, disabled on import so you can enable them one by one with your own thresholds. The PromQL condition and runbook steps for every rule are in the alert rule library: [Redis alert rules](https://n9e.github.io/alert-rules/redis.md).

| Rule                                                      | Severity   | For |
| --------------------------------------------------------- | ---------- | --- |
| High Redis eviction rate                                  | S2 Warning | 1m  |
| High Redis memory usage rate                              | S2 Warning | 1m  |
| High Redis Ping latency (above 100 milliseconds)          | S2 Warning | 1m  |
| Low Redis hit rate                                        | S2 Warning | 1m  |
| Redis connection refused                                  | S2 Warning | —   |
| Redis has just been restarted, please be aware            | S3 Info    | —   |
| High Redis client connection count - exporter             | S2 Warning | 1m  |
| High Redis eviction rate - exporter                       | S2 Warning | 1m  |
| High Redis latency - exporter                             | S2 Warning | 1m  |
| High Redis memory usage rate - exporter                   | S2 Warning | 1m  |
| Low Redis hit rate - exporter                             | S2 Warning | 1m  |
| Redis connection refused - exporter                       | S2 Warning | —   |
| Redis has just been restarted, please be aware - exporter | S3 Info    | —   |

## Related[​](#related "Direct link to Related")

* [Redis template source](https://github.com/ccfos/nightingale/tree/main/integrations/Redis): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `redis` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis): every config option and the full metric list.
* [Categraf `redis_sentinel` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/redis_sentinel): every config option and the full metric list.
* [Walkthrough: monitor Redis](https://n9e.github.io/docs/practice/redis.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
