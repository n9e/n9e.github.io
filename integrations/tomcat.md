---
title: "Monitor Tomcat with Nightingale"
sidebar_label: "Tomcat"
description: "Reads the /manager/status/all endpoint of the Manager app for JVM memory, per-connector threads and requests, traffic and errors; needs the manager-gui role."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Tomcat
toc_max_heading_level: 2
mdx:
  format: md
---

The Tomcat input calls the Manager app's `/manager/status/all` endpoint and parses JVM heap and memory pool usage, thread pool size and busy count per connector (HTTP, AJP), request counts, processing time, errors and bytes sent and received.

The endpoint requires authentication: add a user with the manager-gui role in `tomcat-users.xml` and relax the RemoteAddrValve in `webapps/manager/META-INF/context.xml`, which only allows localhost by default, or you get a 403. The rules cover thread pool exhaustion, heap near the limit, rising error rate and unreachable instances.

## What's in the template

- **1 dashboard**, 12 panels in total
- **6 alert rules**, each with runbook steps
- **Categraf collector config**: `input.tomcat`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.tomcat/tomcat.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.tomcat started` once the plugin is loaded.

   ```toml
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

1. Open the integration center in Nightingale, find Tomcat, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Tomcat - categraf | 12 |

## Bundled alert rules

6 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Tomcat instance unreachable

S1 Critical · for 1 min · Trigger:

```promql
tomcat_up == 0
```

Runbook:

1. Log in to the host and run ps -ef | grep catalina and ss -lntp | grep 8080 to check the process and port;
1. If the process is alive, verify with curl -u \<user>:\<pass> 'http://127.0.0.1:8080/manager/status?XML=true'; a 401/403 means the manager account or a RemoteAddrValve restriction is blocking the collector's IP;
1. If the process is gone, check the tail of logs/catalina.out for the cause (port conflict, insufficient memory, application start-up failure);
1. Confirm the upstream load balancer has removed this node before restarting so traffic stops arriving.

### Tomcat thread pool nearly saturated

S1 Critical · for 3 min · Trigger:

```promql
tomcat_connector_current_threads_busy / (tomcat_connector_max_threads > 0) * 100 > 85
```

Runbook:

1. Take name (the connector name) from the alert labels, capture thread stacks with jstack \<pid>, and count which method the http-nio-* threads are stuck in;
1. Many threads blocked on the database or an outbound HTTP call means a slow downstream: fix it and add timeouts to the call;
1. As a stopgap raise maxThreads for that connector in server.xml, re-checking memory and the downstream capacity;
1. Longer term add circuit breaking around external dependencies (for example Resilience4j) so downstream flapping cannot saturate the Tomcat thread pool.

### Tomcat request error rate too high

S2 Warning · for 5 min · Trigger:

```promql
rate(tomcat_connector_error_count[5m]) / (rate(tomcat_connector_request_count[5m]) > 0) * 100 > 5
```

Runbook:

1. Run grep -E ' (5[0-9]\{2\}|4[0-9]\{2\}) ' logs/localhost_access_log.*.txt | awk '\{print $7\}' | sort | uniq -c | sort -rn | head to find the URLs where the errors concentrate;
1. For 5xx, look for the matching exception stack in logs/catalina.out and the application logs;
1. 4xx concentrated on a few endpoints usually means a caller changed parameters or authentication; confirm with the calling team;
1. If the errors come from dependency timeouts, add timeouts and fallbacks to those calls first so the errors stop amplifying.

### Tomcat average request duration too long

S2 Warning · for 5 min · Trigger:

```promql
rate(tomcat_connector_processing_time[5m]) / (rate(tomcat_connector_request_count[5m]) > 0) > 1000
```

Runbook:

1. Confirm the access log pattern includes %D, then run awk '\{print $NF, $7\}' localhost_access_log.*.txt | sort -rn | head -20 to find the slowest URLs;
1. Capture jstack \<pid> three times in a row and diff them to find methods that persist across captures;
1. If threads are stuck on the database, check slow queries and connection pool waits (threads block in getConnection when the pool is exhausted);
1. If they are stuck in GC, confirm the Full GC frequency with jstat -gcutil \<pid> 1s and then resize the heap or hunt the memory leak based on heap usage.

### Tomcat JVM heap usage too high

S2 Warning · for 5 min · Trigger:

```promql
(tomcat_jvm_memory_total - tomcat_jvm_memory_free) / (tomcat_jvm_memory_max > 0) * 100 > 85
```

Runbook:

1. Run jstat -gcutil \<pid> 1s 10 and watch the Full GC frequency and the old-generation occupancy after collection; if it stays high after collection there is a leak;
1. Run jmap -histo:live \<pid> | head -30 to rank objects and identify the class growing abnormally;
1. If you suspect a leak, dump the heap with jmap -dump:live,format=b,file=/tmp/heap.hprof \<pid> and analyse the reference chain in MAT;
1. If it is simply undersized, raise -Xmx after checking physical memory, leaving room for off-heap memory.

### Tomcat old generation usage too high

S2 Warning · for 5 min · Trigger:

```promql
tomcat_jvm_memorypool_used{name=~".*Old Gen|Tenured Gen"} / (tomcat_jvm_memorypool_max{name=~".*Old Gen|Tenured Gen"} > 0) * 100 > 90
```

Runbook:

1. Run jstat -gcold \<pid> 1s 10 and watch whether the old generation drops after each Full GC;
1. If it does not, run jmap -histo:live \<pid> | head -30 to find the largest object types;
1. The usual leak sources are static collections, uncleaned ThreadLocals, and class loader leaks from repeated hot deployments; jcmd \<pid> GC.class_stats helps confirm;
1. Once a leak is ruled out, consider raising -Xmx or switching to G1 and tuning -XX:MaxGCPauseMillis.

## Related

- [Tomcat template source](https://github.com/ccfos/nightingale/tree/main/integrations/Tomcat): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `tomcat` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/tomcat): every config option and the full metric list.
- [Walkthrough: monitor Java applications](/docs/practice/java)
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
