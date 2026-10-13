---
title: "Monitor LDAP (OpenLDAP, 389ds) with Nightingale"
sidebar_label: "Ldap"
description: "Reads the LDAP server's cn=Monitor backend for connections, operation counters, waiters and thread state; supports OpenLDAP and 389 Directory Server."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Ldap
toc_max_heading_level: 2
mdx:
  format: md
---

The LDAP input queries the server's monitoring backend (`cn=Monitor`) for current and total connections, counters for bind, search, modify, add, delete and other operations, pending reads and writes, thread pool state and uptime. OpenLDAP and 389ds dialects are both supported, with slightly different metric names.

The server must have the monitor backend enabled (`olcDatabase=monitor` on OpenLDAP) and allow the monitoring account to read it. StartTLS and LDAPS are supported. The rules cover abnormal connection counts, rising operation errors, growing bind failures and the service being unreachable.

## What's in the template

- **5 alert rules**, each with runbook steps
- **Categraf collector config**: `input.ldap`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.ldap/ldap.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.ldap started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   [[instances]]
   # # append some labels for series
   # labels = { region="cloud", product="n9e" }

   # # interval = global.interval * interval_times
   # interval_times = 1

   ## Server to monitor
   ## The scheme determines the mode to use for connection with
   ##    ldap://...      -- unencrypted (non-TLS) connection
   ##    ldaps://...     -- TLS connection
   ##    starttls://...  --  StartTLS connection
   ## If no port is given, the default ports, 389 for ldap and starttls and
   ## 636 for ldaps, are used.
   #server = "ldap://localhost"

   ## Server dialect, can be "openldap" or "389ds"
   # dialect = "openldap"

   # DN and password to bind with
   ## If bind_dn is empty an anonymous bind is performed.
   bind_dn = ""
   bind_password = ""

   ## Reverse the field names constructed from the monitoring DN
   # reverse_field_names = false

   ## Optional TLS Config
   # use_tls = false
   # tls_ca = "/etc/categraf/ca.pem"
   # tls_cert = "/etc/categraf/cert.pem"
   # tls_key = "/etc/categraf/key.pem"
   ## Use TLS but skip chain & host verification
   # insecure_skip_verify = false
   ```

1. Open the integration center in Nightingale, find Ldap, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### OpenLDAP connections approaching the file descriptor limit

S2 Warning · for 3 min · Trigger:

```promql
openldap_current_connections / (openldap_max_file_descriptors_connections > 0) * 100 > 80
```

Runbook:

1. Run ldapsearch -x -D \<bind_dn> -w \<pw> -b 'cn=Connections,cn=Monitor' to list current connections and find the client IP holding the most;
1. Many connections from a single application means it is not reusing or closing connections; push the application team to use a connection pool;
1. As a stopgap raise slapd's ulimit -n (LimitNOFILE under systemd) and restart;
1. Also check whether olcIdleTimeout is configured, since without it idle connections hold descriptors forever.

### OpenLDAP requests backing up

S2 Warning · for 3 min · Trigger:

```promql
openldap_pending_threads > 0
```

Runbook:

1. Run ldapsearch -x -D \<bind_dn> -w \<pw> -b 'cn=Operations,cn=Monitor' to see which operation type (Search/Bind/Modify) dominates;
1. When Search dominates, hunt slow queries: enable loglevel stats in slapd.conf and find the SRCH filters with high duration in the log, then index the matching attributes (olcDbIndex);
1. After adding indexes rebuild them with slapindex (slapd must be stopped first);
1. If indexing is not the problem, raise olcThreads (default 16) and check whether CPU core count has become the bottleneck.

### OpenLDAP thread pool saturated

S2 Warning · for 3 min · Trigger:

```promql
openldap_active_threads / (openldap_max_threads > 0) * 100 > 90
```

Runbook:

1. Run ldapsearch -x -D \<bind_dn> -w \<pw> -b 'cn=Threads,cn=Monitor' to see the live Active and Max values;
1. Enable stats logging to locate slow operations, paying particular attention to unindexed substring filters such as (cn=*abc*) that force a full scan;
1. Add olcDbIndex for the frequently filtered attributes and rebuild with slapindex; this is the most effective way to shed load;
1. If indexing is already complete and it is still saturated, raise olcThreads or add read-only replicas (syncrepl consumers) to offload queries.

### OpenLDAP completed operations lagging behind initiated

S2 Warning · for 5 min · Trigger:

```promql
openldap_operations_initiated - openldap_operations_completed > 100
```

Runbook:

1. Run ldapsearch -x -D \<bind_dn> -w \<pw> -b 'cn=Operations,cn=Monitor' and compare Initiated with Completed per operation type to find where things are stuck;
1. If Modify/Add are stuck, check backend database locks and disk IO (iostat -x 1); the mdb backend blocks easily under write amplification;
1. If Search is stuck, follow the slow-query path and add indexes;
1. If replication (syncrepl) is holding the provider back, check the connectivity and lag of each consumer and detach a broken consumer if necessary.

### OpenLDAP restarted recently

S3 Info · for 1 min · Trigger:

```promql
openldap_uptime_time < 300
```

Runbook:

1. First confirm whether this was a planned change;
1. If unplanned, run journalctl -u slapd --since '-30min' to find the cause;
1. Run dmesg -T | grep -i 'killed process' to check for an OOM kill; an oversized olcDbMaxSize on the mdb backend is a common trigger;
1. After the restart verify service with ldapsearch -x -b '' -s base namingContexts and confirm replicas have caught up.

## Related

- [Ldap template source](https://github.com/ccfos/nightingale/tree/main/integrations/Ldap): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `ldap` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/ldap): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
