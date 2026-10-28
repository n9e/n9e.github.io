# Monitor DNS resolution quality with Nightingale

Resolves a list of domains against the local or a named DNS server and reports query time, return code and record count, so slow or failing resolution shows up immediately.

Last reviewed 2026-10-28

The dns\_query input resolves the names in `domains` against the configured DNS servers (the host's own resolver or external public ones), supporting A, AAAA, CNAME, MX, TXT and other record types. It reports query time, rcode, the number of records returned and the result values.

You rarely need it on every host; pick one or two probe points, list your business domains and critical third-party domains, and label by probe point and DNS server. The rules cover failed resolution, slow queries and unexpected return codes.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **4 alert rules**, each with runbook steps
* **5 metric descriptions**
* **Categraf collector config**: `input.dns_query`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.dns_query/dns_query.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.dns_query started` once the plugin is loaded.

   ```
   # # collect interval

   # interval = 15



   [[instances]]

   # # append some labels for series

   # labels = { region="cloud", product="n9e" }



   # # interval = global.interval * interval_times

   # interval_times = 1



   # # 

   auto_detect_local_dns_server  = false



   ## servers to query

   # servers = ["8.8.8.8"]

   servers = []



   ## Network is the network protocol name.

   # network = "udp"



   ## Domains or subdomains to query.

   # domains = ["."]



   ## Query record type.

   ## Possible values: A, AAAA, CNAME, MX, NS, PTR, TXT, SOA, SPF, SRV.

   # record_type = "A"



   ## Dns server port.

   # port = 53



   ## Query timeout in seconds.

   # timeout = 2
   ```

2. Open the integration center in Nightingale, find DNS Query, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

4 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### DNS response status code abnormal[​](#dns-response-status-code-abnormal "Direct link to DNS response status code abnormal")

S2 Warning · for 1 min · Trigger:

```
dns_query_rcode_value != 0
```

Runbook:

1. Reproduce it on the collector host with dig @\<DNS server> \<domain> and check the status and elapsed time;
2. Compare against a public resolver (e.g. dig @223.5.5.5) to tell a DNS server problem from a problem with the domain itself;
3. For a self-hosted resolver, check the service process, upstream forwarding config and network connectivity;
4. Verify the probe's domain, record type and timeout settings are sensible so the config itself is not causing the alert.

### DNS query response time exceeds 5 seconds[​](#dns-query-response-time-exceeds-5-seconds "Direct link to DNS query response time exceeds 5 seconds")

S2 Warning · for 1 min · Trigger:

```
dns_query_time_ms > 5000
```

Runbook:

1. Reproduce it on the collector host with dig @\<DNS server> \<domain> and check the status and elapsed time;
2. Compare against a public resolver (e.g. dig @223.5.5.5) to tell a DNS server problem from a problem with the domain itself;
3. For a self-hosted resolver, check the service process, upstream forwarding config and network connectivity;
4. Verify the probe's domain, record type and timeout settings are sensible so the config itself is not causing the alert.

### DNS query timeout[​](#dns-query-timeout "Direct link to DNS query timeout")

S2 Warning · for 1 min · Trigger:

```
dns_query_result_value == 1
```

Runbook:

1. Reproduce it on the collector host with dig @\<DNS server> \<domain> and check the status and elapsed time;
2. Compare against a public resolver (e.g. dig @223.5.5.5) to tell a DNS server problem from a problem with the domain itself;
3. For a self-hosted resolver, check the service process, upstream forwarding config and network connectivity;
4. Verify the probe's domain, record type and timeout settings are sensible so the config itself is not causing the alert.

### DNS query failure[​](#dns-query-failure "Direct link to DNS query failure")

S2 Warning · for 1 min · Trigger:

```
dns_query_result_value == 2
```

Runbook:

1. Reproduce it on the collector host with dig @\<DNS server> \<domain> and check the status and elapsed time;
2. Compare against a public resolver (e.g. dig @223.5.5.5) to tell a DNS server problem from a problem with the domain itself;
3. For a self-hosted resolver, check the service process, upstream forwarding config and network connectivity;
4. Verify the probe's domain, record type and timeout settings are sensible so the config itself is not causing the alert.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

5 metrics, the ones the dashboards and rules above are built on.

| Metric                           | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Unit |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `dns_query_rcode_value`          | DNS Response Code (RCODE) — 0 (NOERROR): the query succeeded with no error 1 (FORMERR): format error, the DNS server could not understand the query 2 (SERVFAIL): server failure, the DNS server encountered an internal error 3 (NXDOMAIN): the domain name does not exist 4 (NOTIMP): the query type is not supported 5 (REFUSED): the query was refused, usually for policy reasons. In monitoring, RCODE 0 means the query succeeded, while other values usually indicate an issue that needs attention |      |
| `dns_query_result_value`         | Custom Query Result — 0 means success, 1 means timeout, 2 means error.                                                                                                                                                                                                                                                                                                                                                                                                                                      |      |
| `dns_query_status_change`        | DNS Resolution Status Change — When expect\_query\_ips is configured for the corresponding domain, categraf compares the IP list in the response with the configured IP list and emits this metric. 0 means the responded IPs match the expected IPs, 1 means the responded IPs differ from the expected IPs.                                                                                                                                                                                               |      |
| `dns_query_status_change_detail` | DNS Resolution Change Detail — 0 means the responded IPs match the expected IPs, 1 means the responded IPs differ from the expected IPs. {ips="responded IP list", diff="responded IP list minus expected IP list"}                                                                                                                                                                                                                                                                                         |      |
| `dns_query_time_ms`              | Query Response Time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ms   |

## Related[​](#related "Direct link to Related")

* [DNS Query template source](https://github.com/ccfos/nightingale/tree/main/integrations/Dns_Query): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `dns_query` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/dns_query): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
