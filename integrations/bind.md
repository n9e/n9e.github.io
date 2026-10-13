---
title: "Monitor BIND DNS with Nightingale"
sidebar_label: "Bind"
description: "Collects query counts, response codes, cache and memory contexts from BIND's statistics channel (XML v3); rules watch rising SERVFAIL and unreachable servers."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Bind
toc_max_heading_level: 2
mdx:
  format: md
---

The BIND input is ported from Telegraf and reads the statistics channel of named (`http://localhost:8053/xml/v3` by default): incoming queries by type, responses by rcode, recursive clients, socket and network counters, cache state per view and memory context usage.

Configure `statistics-channels` in `named.conf` and restrict who can reach it. The rules cover rising SERVFAIL and REFUSED ratios, recursive clients near the limit, query volume dropping and named being unreachable.

## What's in the template

- **5 alert rules**, each with runbook steps
- **Categraf collector config**: `input.bind`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.bind/bind.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.bind started` once the plugin is loaded.

   ```toml
   [[instances]]
   urls = [
       # "http://localhost:8053/xml/v3",
   ]
   gather_memory_contexts = true
   gather_views = true
   timeout = "5s"
   # labels={app="bind"}
   ```

1. Open the integration center in Nightingale, find Bind, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### BIND SERVFAIL response ratio too high

S2 Warning · for 5 min · Trigger:

```promql
sum without (type) (rate(bind_counter_SERVFAIL[5m])) / (sum without (type) (rate(bind_counter_Response[5m])) > 0) * 100 > 5
```

Runbook:

1. Run rndc querylog to turn on query logging (remember to run it again to turn it off afterwards) and find the domains that dominate the errors in the named log;
1. Run dig +trace @127.0.0.1 \<domain> against that domain to tell whether the upstream authoritative server is unreachable, DNSSEC validation is failing, or a forwarder is broken;
1. For DNSSEC failures, verify with dig +cd first, then fix the trust anchor or temporarily add a negative-trust-anchor for that zone;
1. For forwarder problems, check that the servers in forwarders are reachable and switch to a backup DNS server.

### BIND recursive clients approaching the limit

S2 Warning · for 3 min · Trigger:

```promql
sum without (type) (bind_counter_RecursClients) > 900
```

Runbook:

1. Run rndc status to see the live recursive client count and the configured limit;
1. Spot-check a few slow domains with dig +trace to determine whether a slow upstream authoritative server is causing recursive requests to pile up;
1. Once confirmed, raise recursive-clients in options (re-checking memory) and run rndc reload;
1. If malicious queries are filling the quota, configure response-rate-limit and tighten the source networks allowed by allow-recursion.

### BIND hit the recursive client limit and is dropping queries

S1 Critical · for 1 min · Trigger:

```promql
sum without (type) (increase(bind_counter_RecLimitDropped[5m])) > 0
```

Runbook:

1. Run rndc status immediately to confirm recursive client usage;
1. Run rndc recursing to dump the queries currently being resolved and identify the domain or client consuming the quota;
1. As an emergency measure raise recursive-clients and run rndc reload to restore service;
1. Afterwards check the health of the upstream authoritative servers for the domain you identified, or restrict the offending source IPs with allow-recursion or RRL.

### BIND recursive query timeout ratio too high

S2 Warning · for 5 min · Trigger:

```promql
sum without (type) (rate(bind_counter_QueryTimeout[5m])) / ((sum without (type) (rate(bind_counter_Queryv4[5m])) + sum without (type) (rate(bind_counter_Queryv6[5m]))) > 0) * 100 > 10
```

Runbook:

1. Run rndc dumpdb -all and inspect the dump file for slow upstream servers;
1. From the BIND host run dig @\<authoritative IP> plus ping/mtr to separate an upstream outage from packet loss on this host's egress;
1. If IPv6 is unreachable and causing the timeouts, add -4 to the named start-up arguments or disable outbound IPv6 queries;
1. Longer term, add forwarders and enable forward first to reduce the share of queries recursed directly to authoritative servers.

### BIND is dropping queries

S2 Warning · for 1 min · Trigger:

```promql
sum without (type) (increase(bind_counter_QryDropped[5m])) > 0
```

Runbook:

1. Look for client-related dropped entries in the named log and identify the source IPs and query names being dropped;
1. If the source is a legitimate business network, check whether the allow-query / allow-recursion ACLs are missing that range;
1. If the sources are scattered and the query names look random, treat it as a random-subdomain attack: enable response-rate-limit and consider adding a fetches-per-zone limit;
1. After changing the configuration, validate it with named-checkconf before running rndc reload.

## Related

- [Bind template source](https://github.com/ccfos/nightingale/tree/main/integrations/Bind): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `bind` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/bind): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
