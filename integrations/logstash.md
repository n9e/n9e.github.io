# Monitor Logstash with Nightingale

Collects pipeline event in/out and filter time, queue state and JVM health from Logstash's node API; rules watch event backlog and JVM pressure.

Last reviewed 2026-10-13

Logstash serves an HTTP API on port 9600 by default. The input reads `_node/stats`: input, filter and output event counts and durations per pipeline, persistent queue capacity and backlog, JVM heap, GC and threads, and process CPU and file descriptors.

If the API has Basic Auth or TLS enabled, configure the username, password and certificates accordingly. The throughput, queue and pipeline panels only show non-zero data once Logstash actually processes events. The rules cover stalled event processing, a steadily growing queue, heap near the limit and Logstash being unreachable.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 11 panels in total
* **6 alert rules**, each with runbook steps
* **Categraf collector config**: `input.logstash`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.logstash/logstash.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.logstash started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   # Read metrics exposed by Logstash

   [[instances]]

   # # interval = global.interval * interval_times

   # interval_times = 1



   # append labels

   # labels = { instance="x" }



   ## The URL of the exposed Logstash API endpoint.

   # url = "http://127.0.0.1:9600"

   url = ""



   ## Use Logstash 5 single pipeline API, set to true when monitoring

   ## Logstash 5.

   # single_pipeline = false



   ## Enable optional collection components.  Can contain

   ## "pipelines", "process", and "jvm".

   # collect = ["pipelines", "process", "jvm"]



   ## Timeout for HTTP requests.

   # timeout = "5s"



   ## Optional HTTP Basic Auth credentials.

   # username = "username"

   # password = "pa$$word"



   ## Optional HTTP headers.

   # [inputs.logstash.headers]

   #   "X-Special-Header" = "Special-Value"



   ## Optional TLS Config

   # use_tls = false

   # tls_min_version = "1.2"

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = true
   ```

2. Open the integration center in Nightingale, find Logstash, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard | Panels |
| --------- | ------ |
| logstash  | 11     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

6 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Logstash pipeline stopped emitting[​](#logstash-pipeline-stopped-emitting "Direct link to Logstash pipeline stopped emitting")

S1 Critical · for 5 min · Trigger:

```
rate(logstash_events_out[5m]) == 0 and rate(logstash_events_in[5m]) > 0
```

Runbook:

1. Run curl -s localhost:9600/\_node/stats/pipelines?pretty to find the pipeline whose events.out is not increasing;
2. For that pipeline, look at the per-plugin event breakdown; the blockage is usually in an output (Elasticsearch rejecting writes, Kafka unreachable);
3. Check logstash-plain.log for retry/backoff errors and confirm whether the downstream is returning 429 or timing out;
4. After the downstream recovers, watch events.out come back; if it stays flat, restart Logstash and check whether the persistent queue is corrupted.

### Logstash JVM heap usage too high[​](#logstash-jvm-heap-usage-too-high "Direct link to Logstash JVM heap usage too high")

S2 Warning · for 5 min · Trigger:

```
logstash_jvm_mem_heap_used_in_bytes / (logstash_jvm_mem_heap_max_in_bytes > 0) * 100 > 85
```

Runbook:

1. Run curl -s localhost:9600/\_node/stats/jvm?pretty to confirm heap\_used\_percent and GC counts;
2. The most common trigger is an oversized pipeline.batch.size; estimate memory as batch.size x worker count x average event size and lower it;
3. Check for filters that cache large amounts of state in memory (aggregate, ruby) and cap their cache size;
4. Only once the configuration is sane should you raise -Xmx in jvm.options, generally staying under half of physical memory and under 8 GB.

### Logstash old generation GC too frequent[​](#logstash-old-generation-gc-too-frequent "Direct link to Logstash old generation GC too frequent")

S2 Warning · for 5 min · Trigger:

```
rate(logstash_jvm_gc_collectors_old_collection_count[5m]) * 60 > 1
```

Runbook:

1. Run curl -s localhost:9600/\_node/stats/jvm?pretty and compare the growth of old collection\_count and collection\_time\_in\_millis;
2. Start with the heap alert path: lower pipeline.batch.size and check stateful filters;
3. Run jmap -histo:live \<pid> | head -30 to see the object distribution; when abnormal it is usually a build-up of event objects;
4. After tuning, confirm the old GC rate falls; if it does not, split the pipeline or scale Logstash horizontally.

### Logstash queue push latency too high[​](#logstash-queue-push-latency-too-high "Direct link to Logstash queue push latency too high")

S2 Warning · for 5 min · Trigger:

```
rate(logstash_events_queue_push_duration_in_millis[5m]) / (rate(logstash_events_in[5m]) > 0) > 100
```

Runbook:

1. Run curl -s localhost:9600/\_node/stats/pipelines?pretty and compare duration\_in\_millis across plugins to find the biggest contributor;
2. If the time is concentrated in an output, investigate the downstream first (Elasticsearch write rejection rate, bulk queue); when the downstream is the root cause, fix it there rather than in Logstash;
3. If it is concentrated in filters, focus on grok: replace complex regexes with dissect or add anchors to avoid catastrophic backtracking;
4. If the host CPU is already saturated, raising pipeline.workers will not help and you need to scale out.

### Logstash per-event processing time too long[​](#logstash-per-event-processing-time-too-long "Direct link to Logstash per-event processing time too long")

S2 Warning · for 5 min · Trigger:

```
rate(logstash_events_duration_in_millis[5m]) / (rate(logstash_events_out[5m]) > 0) > 100
```

Runbook:

1. Run curl -s localhost:9600/\_node/stats/pipelines?pretty and sort plugins by duration\_in\_millis to find the slow one;
2. Slow grok is the usual cause: load-test with --config.debug on a small sample and replace broad regexes with dissect;
3. Filters that make external lookups (jdbc\_streaming, elasticsearch, dns) must have caching enabled and timeouts set;
4. After tuning, re-run the same sample set and compare duration to confirm the improvement is real.

### Logstash process CPU usage too high[​](#logstash-process-cpu-usage-too-high "Direct link to Logstash process CPU usage too high")

S3 Info · for 10 min · Trigger:

```
logstash_process_cpu_percent > 90
```

Runbook:

1. Run curl -s localhost:9600/\_node/stats/pipelines?pretty to find the pipeline and plugin burning the most CPU;
2. Capture stacks with jstack \<pid>; many threads inside regex methods point to grok overhead;
3. If it is still high after tuning filters, check whether pipeline.workers exceeds the real CPU core count and is causing context-switch overhead;
4. If the host is genuinely at its limit, scale out and spread the load at the collection layer.

## Related[​](#related "Direct link to Related")

* [Logstash template source](https://github.com/ccfos/nightingale/tree/main/integrations/Logstash): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `logstash` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/logstash): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
