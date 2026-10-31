# Monitor BIND DNS with Nightingale

Collects query counts, response codes, cache and memory contexts from BIND's statistics channel (XML v3); rules watch rising SERVFAIL and unreachable servers.

Last reviewed 2026-10-31

The BIND input is ported from Telegraf and reads the statistics channel of named (`http://localhost:8053/xml/v3` by default): incoming queries by type, responses by rcode, recursive clients, socket and network counters, cache state per view and memory context usage.

Configure `statistics-channels` in `named.conf` and restrict who can reach it. The rules cover rising SERVFAIL and REFUSED ratios, recursive clients near the limit, query volume dropping and named being unreachable.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 alert rules**, each with runbook steps
* **Categraf collector config**: `input.bind`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.bind/bind.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.bind started` once the plugin is loaded.

   ```
   [[instances]]

   urls = [

       # "http://localhost:8053/xml/v3",

   ]

   gather_memory_contexts = true

   gather_views = true

   timeout = "5s"

   # labels={app="bind"}
   ```

2. Open the integration center in Nightingale, find Bind, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### BIND SERVFAIL response ratio too high[​](#bind-servfail-response-ratio-too-high "Direct link to BIND SERVFAIL response ratio too high")

S2 Warning · for 5 min · Trigger:

```
sum without (type) (rate(bind_counter_SERVFAIL[5m])) / (sum without (type) (rate(bind_counter_Response[5m])) > 0) * 100 > 5
```

Runbook:

1. Run rndc querylog to turn on query logging (remember to run it again to turn it off afterwards) and find the domains that dominate the errors in the named log;
2. Run dig +trace @127.0.0.1 \<domain> against that domain to tell whether the upstream authoritative server is unreachable, DNSSEC validation is failing, or a forwarder is broken;
3. For DNSSEC failures, verify with dig +cd first, then fix the trust anchor or temporarily add a negative-trust-anchor for that zone;
4. For forwarder problems, check that the servers in forwarders are reachable and switch to a backup DNS server.

### BIND recursive clients approaching the limit[​](#bind-recursive-clients-approaching-the-limit "Direct link to BIND recursive clients approaching the limit")

S2 Warning · for 3 min · Trigger:

```
sum without (type) (bind_counter_RecursClients) > 900
```

Runbook:

1. Run rndc status to see the live recursive client count and the configured limit;
2. Spot-check a few slow domains with dig +trace to determine whether a slow upstream authoritative server is causing recursive requests to pile up;
3. Once confirmed, raise recursive-clients in options (re-checking memory) and run rndc reload;
4. If malicious queries are filling the quota, configure response-rate-limit and tighten the source networks allowed by allow-recursion.

### BIND hit the recursive client limit and is dropping queries[​](#bind-hit-the-recursive-client-limit-and-is-dropping-queries "Direct link to BIND hit the recursive client limit and is dropping queries")

S1 Critical · for 1 min · Trigger:

```
sum without (type) (increase(bind_counter_RecLimitDropped[5m])) > 0
```

Runbook:

1. Run rndc status immediately to confirm recursive client usage;
2. Run rndc recursing to dump the queries currently being resolved and identify the domain or client consuming the quota;
3. As an emergency measure raise recursive-clients and run rndc reload to restore service;
4. Afterwards check the health of the upstream authoritative servers for the domain you identified, or restrict the offending source IPs with allow-recursion or RRL.

### BIND recursive query timeout ratio too high[​](#bind-recursive-query-timeout-ratio-too-high "Direct link to BIND recursive query timeout ratio too high")

S2 Warning · for 5 min · Trigger:

```
sum without (type) (rate(bind_counter_QueryTimeout[5m])) / ((sum without (type) (rate(bind_counter_Queryv4[5m])) + sum without (type) (rate(bind_counter_Queryv6[5m]))) > 0) * 100 > 10
```

Runbook:

1. Run rndc dumpdb -all and inspect the dump file for slow upstream servers;
2. From the BIND host run dig @\<authoritative IP> plus ping/mtr to separate an upstream outage from packet loss on this host's egress;
3. If IPv6 is unreachable and causing the timeouts, add -4 to the named start-up arguments or disable outbound IPv6 queries;
4. Longer term, add forwarders and enable forward first to reduce the share of queries recursed directly to authoritative servers.

### BIND is dropping queries[​](#bind-is-dropping-queries "Direct link to BIND is dropping queries")

S2 Warning · for 1 min · Trigger:

```
sum without (type) (increase(bind_counter_QryDropped[5m])) > 0
```

Runbook:

1. Look for client-related dropped entries in the named log and identify the source IPs and query names being dropped;
2. If the source is a legitimate business network, check whether the allow-query / allow-recursion ACLs are missing that range;
3. If the sources are scattered and the query names look random, treat it as a random-subdomain attack: enable response-rate-limit and consider adding a fetches-per-zone limit;
4. After changing the configuration, validate it with named-checkconf before running rndc reload.

## Related[​](#related "Direct link to Related")

* [Bind template source](https://github.com/ccfos/nightingale/tree/main/integrations/Bind): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `bind` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/bind): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
