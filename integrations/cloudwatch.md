# Monitor AWS CloudWatch with Nightingale

Pulls metric statistics from any CloudWatch namespace through the API, so EC2, RDS, ELB and Lambda all fit; the template ships an RDS dashboard and common rules.

Last reviewed 2026-10-28

The CloudWatch input is ported from Telegraf. It calls the GetMetricData API to pull statistics per namespace (`AWS/EC2`, `AWS/RDS`, `AWS/ELB` and so on), with dimension filters to limit collection to the resources you care about. Authentication follows the standard credential chain: `role_arn`, explicit access keys, a named profile, environment variables, the shared credentials file and the EC2 instance profile, tried in that order.

CloudWatch bills per API call, so choose the interval and namespace scope with the invoice in mind. The template ships an RDS dashboard, and the rules cover EC2 status check failures, sustained high CPU, RDS connections and storage, ELB 5xx and unhealthy backends.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 19 panels in total
* **8 alert rules**, each with runbook steps
* **Categraf collector config**: `input.cloudwatch`

## How to connect[​](#how-to-connect "Direct link to How to connect")

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.cloudwatch/cloud.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.cloudwatch started` once the plugin is loaded.

   ```
   interval="5m"

   [[instances]]

     ## Amazon Region

     # list of region and endpoint, see https://docs.aws.amazon.com/general/latest/gr/cw_region.html

     region = "us-east-1"



     ## Amazon Credentials

     ## Credentials are loaded in the following order

     ## 1) Web identity provider credentials via STS if role_arn and

     ##    web_identity_token_file are specified

     ## 2) Assumed credentials via STS if role_arn is specified

     ## 3) explicit credentials from 'access_key' and 'secret_key'

     ## 4) shared profile from 'profile'

     ## 5) environment variables

     ## 6) shared credentials file

     ## 7) EC2 Instance Profile

     # access_key = ""

     # secret_key = ""

     # token = ""

     # role_arn = ""

     # web_identity_token_file = ""

     # role_session_name = ""

     # profile = ""

     # shared_credential_file = ""



     ## Endpoint to make request against, the correct endpoint is automatically

     ## determined and this option should only be set if you wish to override the

     ## default.

     ##   ex: endpoint_url = "http://localhost:8000"

     endpoint_url = "https://monitoring.ap-southeast-1.amazonaws.com"



     ## Set http_proxy

     # use_system_proxy = false

     # http_proxy_url = "http://localhost:8888"



     ## The minimum period for CloudWatch metrics is 1 minute (60s). However not

     ## all metrics are made available to the 1 minute period. Some are collected

     ## at 3 minute, 5 minute, or larger intervals.

     ## See https://aws.amazon.com/cloudwatch/faqs/#monitoring.

     ## Note that if a period is configured that is smaller than the minimum for a

     ## particular metric, that metric will not be returned by the CloudWatch API

     ## and will not be collected by Telegraf.

     #

     ## Collection Delay (required)

     ## Must account for metrics availability via CloudWatch API

     delay = "5m"



     ## Requested CloudWatch aggregation Period (required)

     ## Must be a multiple of 60s.

     period = "5m"



     ## Recommended if "delay" and "period" are both within 3 hours of request

     ## time. Invalid values will be ignored. Recently Active feature will only

     ## poll for CloudWatch ListMetrics values that occurred within the last 3h.

     ## If enabled, it will reduce total API usage of the CloudWatch ListMetrics

     ## API and require less memory to retain.

     ## Do not enable if "period" or "delay" is longer than 3 hours, as it will

     ## not return data more than 3 hours old.

     ## See https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_ListMetrics.html

     #recently_active = "PT3H"



     ## Configure the TTL for the internal cache of metrics.

     # cache_ttl = "1h"



     ## Metric Statistic Namespaces (required)

     # namespaces = ["AWS/EC2"]



     ## Maximum requests per second. Note that the global default AWS rate limit

     ## is 50 reqs/sec, so if you define multiple namespaces, these should add up

     ## to a maximum of 50.

     ## See http://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_limits.html

     # ratelimit = 25



     ## Timeout for http requests made by the cloudwatch client.

     # timeout = "5s"



     ## Batch Size

     ## The size of each batch to send requests to CloudWatch. 500 is the

     ## suggested largest size. If a request gets to large (413 errors), consider

     ## reducing this amount.

     # batch_size = 500



     ## Namespace-wide statistic filters. These allow fewer queries to be made to

     ## cloudwatch.

     # statistic_include = ["average", "sum", "minimum", "maximum", sample_count"]

     # statistic_exclude = []



     ## Metrics to Pull

     ## Defaults to all Metrics in Namespace if nothing is provided

     ## Refreshes Namespace available metrics every 1h

     #[[instances.metrics]]

     #  names = ["Latency", "RequestCount"]

     #

     #  ## Statistic filters for Metric.  These allow for retrieving specific

     #  ## statistics for an individual metric.

     #  # statistic_include = ["average", "sum", "minimum", "maximum", sample_count"]

     #  # statistic_exclude = []

     #

     #  ## Dimension filters for Metric.

     #  ## All dimensions defined for the metric names must be specified in order

     #  ## to retrieve the metric statistics.

     #  ## 'value' has wildcard / 'glob' matching support such as 'p-*'.

     #  [[instances.metrics.dimensions]]

     #    name = "LoadBalancerName"

     #    value = "p-example"
   ```

2. Open the integration center in Nightingale, find CloudWatch, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard        | Panels |
| ---------------- | ------ |
| AWS RDS Telegraf | 19     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

8 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### RDS instance CPU utilization too high[​](#rds-instance-cpu-utilization-too-high "Direct link to RDS instance CPU utilization too high")

S2 Warning · for 10 min · Trigger:

```
cloudwatch_aws_rds_cpu_utilization_average > 85
```

Runbook:

1. Take db\_instance\_identifier and region from the alert labels and sort by Top SQL in Performance Insights to find the statements burning the most CPU;
2. Run EXPLAIN on the statements you find; a full scan from a missing index is the most common cause;
3. Confirm no unusual batch jobs or analytical queries are hitting the primary, and move them to a read replica if they are;
4. Only after optimisation should you upgrade the instance class, and that change must be made inside a maintenance window.

### RDS instance free storage space low[​](#rds-instance-free-storage-space-low "Direct link to RDS instance free storage space low")

S1 Critical · for 5 min · Trigger:

```
cloudwatch_aws_rds_free_storage_space_average < 10737418240
```

Runbook:

1. Take db\_instance\_identifier from the alert labels and confirm the allocated and used capacity in the console;
2. Expand storage immediately (Modify > Allocated storage); RDS scaling is online but has a 6-hour cooldown, so do not wait until it is full;
3. At the same time reclaim space: drop stale temporary tables, shorten binlog retention (call mysql.rds\_set\_configuration('binlog retention hours', N)), and archive historical partitions;
4. Longer term enable Storage Autoscaling with a sensible upper bound.

### RDS instance IO burst balance low[​](#rds-instance-io-burst-balance-low "Direct link to RDS instance IO burst balance low")

S1 Critical · for 5 min · Trigger:

```
cloudwatch_aws_rds_burst_balance_average < 20
```

Runbook:

1. Take db\_instance\_identifier from the alert labels and compare ReadIOPS/WriteIOPS in CloudWatch against the volume's baseline IOPS to size the overrun;
2. Reduce IO at the source first: use Performance Insights to find the queries with the most physical reads and add indexes;
3. As an emergency measure switch the storage type to gp3 or io1/io2 for guaranteed IOPS; the gp3 change can be made online;
4. Growing the volume also raises baseline IOPS, but is usually less cost-effective than moving to gp3.

### RDS instance freeable memory low[​](#rds-instance-freeable-memory-low "Direct link to RDS instance freeable memory low")

S2 Warning · for 5 min · Trigger:

```
cloudwatch_aws_rds_freeable_memory_average < 536870912
```

Runbook:

1. Take db\_instance\_identifier from the alert labels and review the memory-related wait events in Performance Insights;
2. Check whether innodb\_buffer\_pool\_size (MySQL) or shared\_buffers (PostgreSQL) in the parameter group is set too large; anything above 75% of instance memory tends to trigger this;
3. Excessive connections also consume memory: confirm the application uses a connection pool and that max\_connections is not far above what you actually need;
4. Only once the configuration is sane should you move to an instance class with more memory.

### RDS instance read latency too high[​](#rds-instance-read-latency-too-high "Direct link to RDS instance read latency too high")

S2 Warning · for 10 min · Trigger:

```
cloudwatch_aws_rds_read_latency_average > 0.05
```

Runbook:

1. Take db\_instance\_identifier from the alert labels and compare ReadIOPS and BurstBalance for the same period to rule out an exhausted IO burst balance first;
2. If IOPS are not saturated but latency is high, check whether a large scan is flushing the buffer pool and use Performance Insights to find the SQL with the most physical reads;
3. Adding indexes to cut physical reads is the most effective fix, followed by moving analytical queries to a read replica;
4. If the workload is reasonable and latency is still high, upgrade the storage type to gp3/io1 for more predictable latency.

### RDS instance write latency too high[​](#rds-instance-write-latency-too-high "Direct link to RDS instance write latency too high")

S2 Warning · for 10 min · Trigger:

```
cloudwatch_aws_rds_write_latency_average > 0.05
```

Runbook:

1. Take db\_instance\_identifier from the alert labels and first check whether Multi-AZ is enabled, since synchronous replication makes write latency higher than a single-AZ instance and that is expected;
2. Compare WriteIOPS against the volume's IOPS ceiling and handle saturation via the burst balance / storage type path;
3. Check whether a large transaction or bulk import is running; splitting it into smaller batches reduces latency substantially;
4. If binlog/WAL write amplification is obvious, confirm sync\_binlog and innodb\_flush\_log\_at\_trx\_commit actually match the durability the business requires.

### RDS instance disk queue backing up[​](#rds-instance-disk-queue-backing-up "Direct link to RDS instance disk queue backing up")

S2 Warning · for 10 min · Trigger:

```
cloudwatch_aws_rds_disk_queue_depth_average > 10
```

Runbook:

1. Take db\_instance\_identifier from the alert labels and look at ReadIOPS/WriteIOPS together with BurstBalance to see whether the IOPS ceiling has been reached;
2. Sort by IO wait in Performance Insights to find the SQL generating the IO and optimise those statements first;
3. Confirm that backups, snapshots, and index rebuilds do not overlap the business peak;
4. If the workload genuinely needs more IOPS, switch to gp3 and set IOPS and throughput explicitly.

### RDS instance swap usage too high[​](#rds-instance-swap-usage-too-high "Direct link to RDS instance swap usage too high")

S3 Info · for 15 min · Trigger:

```
cloudwatch_aws_rds_swap_usage_average > 268435456
```

Runbook:

1. Take db\_instance\_identifier from the alert labels and read it together with FreeableMemory to see how long the memory pressure has lasted;
2. Check whether the buffer pool parameters in the parameter group are set too large and whether the connection count exceeds expectations;
3. Look for large sorts or large temporary tables consuming memory, locate them in Performance Insights, and optimise them;
4. If configuration and queries are both reasonable and swapping continues, move to an instance class with more memory.

## Related[​](#related "Direct link to Related")

* [CloudWatch template source](https://github.com/ccfos/nightingale/tree/main/integrations/CloudWatch): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `cloudwatch` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/cloudwatch): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
