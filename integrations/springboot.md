# Monitor Spring Boot applications with Nightingale

Add Actuator and micrometer-registry-prometheus and the application exposes /actuator/prometheus itself; the template ships JVM dashboards split by application name.

Last reviewed 2026-10-28

Spring Boot applications need no external agent. Add the `spring-boot-starter-actuator` and `micrometer-registry-prometheus` dependencies, expose the prometheus endpoint, and the application serves JVM, HTTP request, datasource pool, executor and custom metrics on `/actuator/prometheus`. Actuator is built on Micrometer underneath.

The two JVM dashboards are written against Actuator metric names (`jvm_memory_used_bytes`, `http_server_requests_seconds` and so on); one of them separates services by the `application` label. The rules cover heap near the limit, long GC pauses, rising HTTP 5xx and abnormal thread counts.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **2 dashboards**, 71 panels in total
* **5 alert rules**, each with runbook steps

## How to connect[​](#how-to-connect "Direct link to How to connect")

For Spring Boot 3.x, add to `application.properties`:

```
management.endpoints.web.exposure.include=health,info,prometheus

management.endpoint.prometheus.enabled=true

management.prometheus.metrics.export.enabled=true
```

On 2.x the last line is `management.metrics.export.prometheus.enabled=true`. Check that `http://localhost:8080/actuator/prometheus` responds, then scrape it with the Categraf `prometheus` input and set an `application` label to the service name. Do not set `exposure.include` to `*`.

1. Open the integration center in Nightingale, find SpringBoot, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                            | Panels |
| ------------------------------------ | ------ |
| JVM (Actuator) with application name | 37     |
| JVM Dashboard                        | 34     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### SpringBoot heap memory usage above 85%[​](#springboot-heap-memory-usage-above-85 "Direct link to SpringBoot heap memory usage above 85%")

S2 Warning · for 1 min · Trigger:

```
sum by (instance) (jvm_memory_used_bytes{area="heap"}) * 100 / sum by (instance) (jvm_memory_max_bytes{area="heap"}) > 85
```

Runbook:

1. Check jvm\_gc\_pause\_seconds to see whether full GC became more frequent and how long the pauses are;
2. Capture a heap with jmap -histo:live \<pid> or the arthas heapdump, then sort by object count to find the abnormally growing classes;
3. Tell traffic growth (raise -Xmx) apart from a memory leak (must be fixed in code — a bigger heap only postpones it);
4. You can restart the instance to recover, but capture the heap snapshot first or you lose the evidence.

### SpringBoot HTTP request latency exceeds 10s[​](#springboot-http-request-latency-exceeds-10s "Direct link to SpringBoot HTTP request latency exceeds 10s")

S2 Warning · for 1 min · Trigger:

```
max by (instance, uri) (http_server_requests_seconds_max{status!~"5.."}) > 10
```

Runbook:

1. Take uri from the alert labels to identify the endpoint;
2. Use arthas trace or APM distributed tracing to see which segment consumes the time (database, downstream RPC, or local computation);
3. For a slow database, follow the slow-query path and add indexes; for a slow downstream, check its state and add a circuit breaker or fallback;
4. Check whether the thread pool is saturated by slow requests and amplifying the queue — isolate the pool if so.

### SpringBoot HTTP errors[​](#springboot-http-errors "Direct link to SpringBoot HTTP errors")

S2 Warning · for 1 min · Trigger:

```
sum by (instance, uri) (rate(http_server_requests_seconds_count{status=~"5.."}[5m])) > 0
```

Runbook:

1. Take uri from the alert labels to identify the endpoint, then search the application log for stack traces on that path;
2. Tell total failure from partial failure — partial failure usually means one bad downstream instance or a data edge case;
3. If it lines up with a recent release, roll back rather than keep investigating;
4. Check whether downstream dependencies (database, cache, third-party APIs) are failing at the same time.

### SpringBoot non-heap memory usage above 85%[​](#springboot-non-heap-memory-usage-above-85 "Direct link to SpringBoot non-heap memory usage above 85%")

S2 Warning · for 1 min · Trigger:

```
sum by (instance) (jvm_memory_max_bytes{area="nonheap"}) > 0 and sum by (instance) (jvm_memory_used_bytes{area="nonheap"}) * 100 / sum by (instance) (jvm_memory_max_bytes{area="nonheap"}) > 85
```

Runbook:

1. Run jcmd \<pid> VM.native\_memory summary (requires NativeMemoryTracking) or the arthas memory command to see each region's usage;
2. Steadily growing Metaspace usually means a class loader leak — common with repeated hot deploys, dynamic proxies and script engines;
3. As an emergency measure raise -XX:MaxMetaspaceSize and restart;
4. For the root cause, look for a custom ClassLoader that is never released, and check jmap -clstats for an abnormal class loader count.

### SpringBoot event errors[​](#springboot-event-errors "Direct link to SpringBoot event errors")

S2 Warning · for 1 min · Trigger:

```
sum by (instance) (increase(logback_events_total{level="error"}[5m])) > 0
```

Runbook:

1. Take instance from the alert labels, then search your log system for ERROR-level stack traces in that time window;
2. Group by exception type to tell an intermittent problem (downstream jitter, timeout retries) from a reproducible one (code bug, misconfiguration);
3. Fix reproducible ones in code; for intermittent ones confirm retry and fallback logic actually works;
4. If the ERROR volume spiked in line with a release, roll back first.

## Related[​](#related "Direct link to Related")

* [SpringBoot template source](https://github.com/ccfos/nightingale/tree/main/integrations/SpringBoot): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Walkthrough: monitor Java applications](https://n9e.github.io/docs/practice/java.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
