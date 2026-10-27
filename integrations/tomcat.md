# Monitor Tomcat with Nightingale

Reads the /manager/status/all endpoint of the Manager app for JVM memory, per-connector threads and requests, traffic and errors; needs the manager-gui role.

Last reviewed 2026-10-27

The Tomcat input calls the Manager app's `/manager/status/all` endpoint and parses JVM heap and memory pool usage, thread pool size and busy count per connector (HTTP, AJP), request counts, processing time, errors and bytes sent and received.

The endpoint requires authentication: add a user with the manager-gui role in `tomcat-users.xml` and relax the RemoteAddrValve in `webapps/manager/META-INF/context.xml`, which only allows localhost by default, or you get a 403. The rules cover thread pool exhaustion, heap near the limit, rising error rate and unreachable instances.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 12 panels in total
* **6 alert rules**, each with runbook steps
* **Categraf collector config**: `input.tomcat`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.tomcat/tomcat.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.tomcat started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   # Gather metrics from the Tomcat server status page.

   [[instances]]

   ## URL of the Tomcat server status

   # url = "http://127.0.0.1:8080/manager/status/all?XML=true"

   url = ""



   ## HTTP Basic Auth Credentials

   # username = "tomcat"

   # password = "s3cret"



   ## Request timeout

   # timeout = "5s"



   # # interval = global.interval * interval_times

   # interval_times = 1



   # important! use global unique string to specify instance

   # labels = { instance="192.168.1.2:8080", url="-" }



   ## Optional TLS Config

   # use_tls = false

   # tls_min_version = "1.2"

   # tls_ca = "/etc/categraf/ca.pem"

   # tls_cert = "/etc/categraf/cert.pem"

   # tls_key = "/etc/categraf/key.pem"

   ## Use TLS but skip chain & host verification

   # insecure_skip_verify = true
   ```

2. Open the integration center in Nightingale, find Tomcat, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard         | Panels |
| ----------------- | ------ |
| Tomcat - categraf | 12     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

6 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Tomcat instance unreachable[​](#tomcat-instance-unreachable "Direct link to Tomcat instance unreachable")

S1 Critical · for 1 min · Trigger:

```
tomcat_up == 0
```

Runbook:

1. Log in to the host and run ps -ef | grep catalina and ss -lntp | grep 8080 to check the process and port;
2. If the process is alive, verify with curl -u \<user>:\<pass> '<http://127.0.0.1:8080/manager/status?XML=true>'; a 401/403 means the manager account or a RemoteAddrValve restriction is blocking the collector's IP;
3. If the process is gone, check the tail of logs/catalina.out for the cause (port conflict, insufficient memory, application start-up failure);
4. Confirm the upstream load balancer has removed this node before restarting so traffic stops arriving.

### Tomcat thread pool nearly saturated[​](#tomcat-thread-pool-nearly-saturated "Direct link to Tomcat thread pool nearly saturated")

S1 Critical · for 3 min · Trigger:

```
tomcat_connector_current_threads_busy / (tomcat_connector_max_threads > 0) * 100 > 85
```

Runbook:

1. Take name (the connector name) from the alert labels, capture thread stacks with jstack \<pid>, and count which method the http-nio-\* threads are stuck in;
2. Many threads blocked on the database or an outbound HTTP call means a slow downstream: fix it and add timeouts to the call;
3. As a stopgap raise maxThreads for that connector in server.xml, re-checking memory and the downstream capacity;
4. Longer term add circuit breaking around external dependencies (for example Resilience4j) so downstream flapping cannot saturate the Tomcat thread pool.

### Tomcat request error rate too high[​](#tomcat-request-error-rate-too-high "Direct link to Tomcat request error rate too high")

S2 Warning · for 5 min · Trigger:

```
rate(tomcat_connector_error_count[5m]) / (rate(tomcat_connector_request_count[5m]) > 0) * 100 > 5
```

Runbook:

1. Run grep -E ' (5\[0-9]{2}|4\[0-9]{2}) ' logs/localhost\_access\_log.\*.txt | awk '{print $7}' | sort | uniq -c | sort -rn | head to find the URLs where the errors concentrate;
2. For 5xx, look for the matching exception stack in logs/catalina.out and the application logs;
3. 4xx concentrated on a few endpoints usually means a caller changed parameters or authentication; confirm with the calling team;
4. If the errors come from dependency timeouts, add timeouts and fallbacks to those calls first so the errors stop amplifying.

### Tomcat average request duration too long[​](#tomcat-average-request-duration-too-long "Direct link to Tomcat average request duration too long")

S2 Warning · for 5 min · Trigger:

```
rate(tomcat_connector_processing_time[5m]) / (rate(tomcat_connector_request_count[5m]) > 0) > 1000
```

Runbook:

1. Confirm the access log pattern includes %D, then run awk '{print $NF, $7}' localhost\_access\_log.\*.txt | sort -rn | head -20 to find the slowest URLs;
2. Capture jstack \<pid> three times in a row and diff them to find methods that persist across captures;
3. If threads are stuck on the database, check slow queries and connection pool waits (threads block in getConnection when the pool is exhausted);
4. If they are stuck in GC, confirm the Full GC frequency with jstat -gcutil \<pid> 1s and then resize the heap or hunt the memory leak based on heap usage.

### Tomcat JVM heap usage too high[​](#tomcat-jvm-heap-usage-too-high "Direct link to Tomcat JVM heap usage too high")

S2 Warning · for 5 min · Trigger:

```
(tomcat_jvm_memory_total - tomcat_jvm_memory_free) / (tomcat_jvm_memory_max > 0) * 100 > 85
```

Runbook:

1. Run jstat -gcutil \<pid> 1s 10 and watch the Full GC frequency and the old-generation occupancy after collection; if it stays high after collection there is a leak;
2. Run jmap -histo:live \<pid> | head -30 to rank objects and identify the class growing abnormally;
3. If you suspect a leak, dump the heap with jmap -dump:live,format=b,file=/tmp/heap.hprof \<pid> and analyse the reference chain in MAT;
4. If it is simply undersized, raise -Xmx after checking physical memory, leaving room for off-heap memory.

### Tomcat old generation usage too high[​](#tomcat-old-generation-usage-too-high "Direct link to Tomcat old generation usage too high")

S2 Warning · for 5 min · Trigger:

```
tomcat_jvm_memorypool_used{name=~".*Old Gen|Tenured Gen"} / (tomcat_jvm_memorypool_max{name=~".*Old Gen|Tenured Gen"} > 0) * 100 > 90
```

Runbook:

1. Run jstat -gcold \<pid> 1s 10 and watch whether the old generation drops after each Full GC;
2. If it does not, run jmap -histo:live \<pid> | head -30 to find the largest object types;
3. The usual leak sources are static collections, uncleaned ThreadLocals, and class loader leaks from repeated hot deployments; jcmd \<pid> GC.class\_stats helps confirm;
4. Once a leak is ruled out, consider raising -Xmx or switching to G1 and tuning -XX:MaxGCPauseMillis.

## Related[​](#related "Direct link to Related")

* [Tomcat template source](https://github.com/ccfos/nightingale/tree/main/integrations/Tomcat): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `tomcat` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/tomcat): every config option and the full metric list.
* [Walkthrough: monitor Java applications](https://n9e.github.io/docs/practice/java.md)
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
