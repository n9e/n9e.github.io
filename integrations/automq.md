# Monitor AutoMQ with Nightingale

AutoMQ exposes metrics through an OTel Collector or its own Prometheus endpoint; templates cover cluster overview, brokers, topics, consumer groups and detail.

Last reviewed 2026-10-31

AutoMQ is a Kafka-compatible messaging system with separated compute and storage. It sends metrics to an OTel Collector's Prometheus exporter or exposes Prometheus-format data on its own endpoint (8890 in the reference test). Scrape that with the Categraf `prometheus` input, using whatever port your deployment configures.

The template ships five dashboards (cluster overview, broker, topic, consumer group and detail) and metric descriptions for requests, throughput, latency, storage and object-store operations. The rules cover brokers going offline, request error rate, consumer lag and failed storage operations.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **5 dashboards**, 97 panels in total
* **12 alert rules**, each with runbook steps
* **59 metric descriptions**
* **Categraf collector config**: `input.prometheus`

## How to connect[​](#how-to-connect "Direct link to How to connect")

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](https://n9e.github.io/docs/data/prometheus.md) and the templates work as they are.

1. [Install Categraf](https://n9e.github.io/docs/data/categraf/install.md), put the config below in `conf/input.prometheus/采集OTEL-COLLECTOR的样例.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.prometheus started` once the plugin is loaded.

   ```
   interval = 15



   [[instances]]

   urls = [

        "http://<automq-or-otel-collector>:8890/metrics"

   ]



   # AutoMQ metrics already contain an instance label; do not overwrite it.

   url_label_key = "otel_collector"

   url_label_value = "{{.Host}}"

   labels = { source = "automq" }
   ```

2. Open the integration center in Nightingale, find AutoMQ, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.

3. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard        | Panels |
| ---------------- | ------ |
| Broker Metrics   | 13     |
| Cluster Overview | 12     |
| Detailed Metrics | 60     |
| Group Metrics    | 2      |
| Topic Metrics    | 10     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

12 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### Kafka active controller count abnormal[​](#kafka-active-controller-count-abnormal "Direct link to Kafka active controller count abnormal")

S2 Warning · for 1 min · Trigger:

```
sum(kafka_controller_active_count) by (job) != 1
```

Runbook:

1. On each broker confirm the process is alive and can reach the controller quorum;
2. In KRaft mode run kafka-metadata-quorum.sh --bootstrap-server \<broker> describe --status to check the quorum;
3. When the count is 0, restore the failed controller nodes first — the cluster elects automatically once the majority is back;
4. When it is above 1, investigate the network partition and then stop the minority side so the cluster reconverges.

### Kafka broker has too many connections[​](#kafka-broker-has-too-many-connections "Direct link to Kafka broker has too many connections")

S2 Warning · for 1 min · Trigger:

```
sum(kafka_server_connection_count) by (job, instance) > 1000
```

Runbook:

1. Run ss -tn state established '( sport = :9092 )' | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn to see which clients the connections come from;
2. Tell more client instances apart from a connection leak (producers/consumers not being reused);
3. As an emergency measure raise the broker's file handle limit;
4. For the root cause, make clients reuse connections and confirm there is no short-lived reconnect pattern.

### Kafka fetch request latency high[​](#kafka-fetch-request-latency-high "Direct link to Kafka fetch request latency high")

S2 Warning · for 1 min · Trigger:

```
kafka_request_time_99p_milliseconds{type="Fetch"} > 1000
```

Runbook:

1. Check broker disk IO and page cache hit rate — slow Fetch usually means cold data being read from disk;
2. Check whether a consumer is replaying from a very old offset and pulling large amounts of cold data;
3. Check whether network bandwidth is saturated;
4. If it persists, add brokers or memory to raise the page cache hit rate.

### Kafka partition count too high[​](#kafka-partition-count-too-high "Direct link to Kafka partition count too high")

S1 Critical · for 1 min · Trigger:

```
kafka_partition_count > 5000
```

Runbook:

1. Run kafka-topics.sh --bootstrap-server \<broker> --describe to count partitions per topic and find the ones that are clearly oversized;
2. Check whether the partition count matches actual throughput — many topics are sized by guesswork;
3. Partitions can only be added, never removed, so shrinking means creating a new topic and migrating;
4. Delete long-idle abandoned topics — that is the quickest win.

### Kafka produce request latency high[​](#kafka-produce-request-latency-high "Direct link to Kafka produce request latency high")

S2 Warning · for 1 min · Trigger:

```
kafka_request_time_99p_milliseconds{type="Produce"} > 100
```

Runbook:

1. Check broker disk write latency and whether network bandwidth is saturated;
2. Check the acks setting — with acks=all latency follows the slowest replica, so look for lagging replicas;
3. Run kafka-topics.sh --describe --under-replicated-partitions to confirm replication is healthy;
4. If the storage side is clearly the bottleneck, add brokers or move to faster disks.

### Kafka fetch requests exceed 1000 per second[​](#kafka-fetch-requests-exceed-1000-per-second "Direct link to Kafka fetch requests exceed 1000 per second")

S2 Warning · for 1 min · Trigger:

```
sum(rate(kafka_request_count_total{type="Fetch"}[1m])) by (job, instance) > 1000
```

Runbook:

1. Check the consumer count together with fetch.min.bytes / fetch.max.wait.ms — values that are too small cause busy high-frequency polling;
2. Raising fetch.min.bytes makes consumers batch their fetches and significantly reduces request count;
3. Check whether consumers are spinning (polling frequently with no data);
4. Combine with broker CPU to judge whether to scale out.

### Kafka produce requests exceed 1000 per second[​](#kafka-produce-requests-exceed-1000-per-second "Direct link to Kafka produce requests exceed 1000 per second")

S2 Warning · for 1 min · Trigger:

```
sum(rate(kafka_request_count_total{type="Produce"}[1m])) by (job, instance) > 1000
```

Runbook:

1. Check the producer's batch.size and linger.ms — values that are too small mean one request per message;
2. Raising linger.ms lets the producer batch and dramatically reduces the request count;
3. Check whether producers have compression enabled (compression.type);
4. Combine with broker CPU to judge whether to scale out.

### Kafka consumer lag high[​](#kafka-consumer-lag-high "Direct link to Kafka consumer lag high")

S2 Warning · for 1 min · Trigger:

```
sum(max(kafka_log_end_offset) by (job, topic, partition)) by (job, topic)

- on (topic) group_left (consumer_group)

sum(max(kafka_group_commit_offset) by (job, consumer_group, topic, partition)) by (job, consumer_group, topic) > 10000
```

Runbook:

1. Take topic and consumer\_group from the alert labels and run kafka-consumer-groups.sh --describe --group \<group> to see the LAG distribution per partition;
2. Lag concentrated on a few partitions means data skew — check the producer's partition key;
3. Evenly spread lag means slow consumers: check the consumer logs for abnormal retries, then add consumer instances (never beyond the partition count);
4. Confirm the consumers have not all dropped out.

### Kafka S3 request failure rate high[​](#kafka-s3-request-failure-rate-high "Direct link to Kafka S3 request failure rate high")

S1 Critical · for 1 min · Trigger:

```
sum(rate(kafka_stream_operation_latency_count{operation_type="S3Request", status="failed"}[1m])) by (job, operation_name) > 0.1
```

Runbook:

1. Take operation\_name from the alert labels to identify which operation is failing (upload, download, delete);
2. Find the matching S3 error code in the broker log and separate permissions (403), throttling (503 SlowDown) and network timeouts;
3. For throttling, ask the object storage side to raise the quota or reduce write concurrency;
4. For permissions, verify the AK/SK and bucket policy; for network issues, check connectivity and bandwidth to the object store.

### Kafka request error rate too high[​](#kafka-request-error-rate-too-high "Direct link to Kafka request error rate too high")

S1 Critical · for 1 min · Trigger:

```
sum(rate(kafka_request_error_count_total{error!="NONE"}[1m])) by (job, instance, error) > 0.1
```

Runbook:

1. Take the error field from the alert labels to identify the error type;
2. NOT\_LEADER\_OR\_FOLLOWER usually means partition leaders are moving — check whether the cluster is rebalancing;
3. For REQUEST\_TIMED\_OUT, check broker load and disk IO;
4. For authentication/authorization errors, verify the client's ACLs and credentials.

### Kafka cluster inbound network traffic high[​](#kafka-cluster-inbound-network-traffic-high "Direct link to Kafka cluster inbound network traffic high")

S2 Warning · for 1 min · Trigger:

```
sum(rate(kafka_broker_network_io_bytes_total{direction="in"}[1m])) by (job) > 50 * 1024 * 1024



sum(rate(kafka_broker_network_io_bytes_total{direction="in"}[1m])) by (job) > 20 * 1024 * 1024
```

Runbook:

1. Use kafka-topics.sh together with per-topic traffic metrics to find the highest-traffic topic;
2. Determine whether it is natural growth or a client resending abnormally;
3. If producers have no compression, enable compression.type=lz4/zstd — that usually cuts bandwidth immediately;
4. Once confirmed, add brokers or NIC bandwidth as needed.

### Kafka cluster outbound network traffic high[​](#kafka-cluster-outbound-network-traffic-high "Direct link to Kafka cluster outbound network traffic high")

S2 Warning · for 1 min · Trigger:

```
sum(rate(kafka_broker_network_io_bytes_total{direction="out"}[1m])) by (job) > 50 * 1024 * 1024



sum(rate(kafka_broker_network_io_bytes_total{direction="out"}[1m])) by (job) > 20 * 1024 * 1024
```

Runbook:

1. Identify the topics and consumer groups with the highest consume traffic;
2. Check whether a consumer group is doing a full replay from the beginning — this is the most common cause of an outbound traffic spike;
3. Check whether there are far more consumers than needed, and whether groups consuming the same topic can be merged;
4. Add brokers or NIC bandwidth as needed.

## Metric reference[​](#metric-reference "Direct link to Metric reference")

59 metrics, the ones the dashboards and rules above are built on.

| Metric                                                                                                                                                                                                                                     | Meaning                                                                     | Unit    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------- |
| `sum by(job, instance) (rate(kafka_network_io_bytes_total{direction="in"}[1m]))`                                                                                                                                                           | Broker node inbound network IO rate                                         | bytes/s |
| `sum by(job, instance) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                          | Broker node outbound network IO rate                                        | bytes/s |
| `kafka_partition_count`                                                                                                                                                                                                                    | The number of partitions currently allocated to the Broker node             | count   |
| `sum by(job, instance) (rate(kafka_message_count_total[1m]))`                                                                                                                                                                              | Broker node message throughput per second                                   | count   |
| `sum by(job, consumer_group, topic) (max by(job, consumer_group, topic, partition) (kafka_group_commit_offset))`                                                                                                                           | Consumer Group Commit Offset Sum                                            |         |
| `sum by(job, consumer_group, topic, partition) (rate(kafka_group_commit_offset[1m]))`                                                                                                                                                      | Consumer Group commit offset rate (per instance)                            |         |
| `sum by (job) (kafka_group_count)`                                                                                                                                                                                                         | Consumer Group Quantity Sum                                                 | count   |
| `max by(job, consumer_group, topic, partition) (kafka_group_commit_offset)`                                                                                                                                                                | Consumer Group Maximum commit offset                                        |         |
| `kafka_request_time_50p_milliseconds`                                                                                                                                                                                                      | 50th quantile of Fetch request processing time                              | ms      |
| `kafka_request_time_99p_milliseconds`                                                                                                                                                                                                      | 99th quantile of Fetch request processing time                              | ms      |
| `avg by(job, instance) (kafka_request_time_99p_milliseconds)`                                                                                                                                                                              | 99th quantile of Fetch request processing time (per instance)               | ms      |
| `kafka_request_time_mean_milliseconds`                                                                                                                                                                                                     | Average of Fetch request processing time                                    | ms      |
| `kafka_request_time_max_milliseconds`                                                                                                                                                                                                      | Maximum Fetch request processing time                                       | ms      |
| `sum by(job, instance) (rate(kafka_topic_request_failed_total[1m]))`                                                                                                                                                                       | Fetch request failure rate (per instance)                                   | req/s   |
| `sum by(job) (kafka_controller_active_count)`                                                                                                                                                                                              | Kafka Controller active status count                                        | count   |
| `kafka_request_time_50p_milliseconds`                                                                                                                                                                                                      | 50th Quantile of Processing Time for Produce requests                       | ms      |
| `kafka_request_time_99p_milliseconds`                                                                                                                                                                                                      | 99th quantile of processing time for Produce requests                       | ms      |
| `avg by(job, instance) (kafka_request_time_99p_milliseconds)`                                                                                                                                                                              | 99th quantile of Produce request processing time (per instance)             | ms      |
| `kafka_request_time_mean_milliseconds`                                                                                                                                                                                                     | Average Produce request processing time                                     | ms      |
| `kafka_request_time_max_milliseconds`                                                                                                                                                                                                      | The maximum processing time of the Produce request                          | ms      |
| `sum by(job, instance) (rate(kafka_topic_request_failed_total[1m]))`                                                                                                                                                                       | Produce request failure rate (per instance)                                 | req/s   |
| `max by(job, consumer_group, topic, partition) (kafka_group_commit_offset)`                                                                                                                                                                | Maximum commit offsets for each Consumer Group and Topic                    |         |
| `max by(job, topic, partition) (kafka_log_end_offset)`                                                                                                                                                                                     | Maximum end of log offset for each Topic partition                          |         |
| `sum by(job, instance, topic) (rate(kafka_request_count_total[1m]))`                                                                                                                                                                       | Fetch request rate of an instance                                           | req/s   |
| `sum by(job, instance, topic) (rate(kafka_request_count_total[1m]))`                                                                                                                                                                       | Instance's Produce request rate                                             | req/s   |
| `sum by (job) (kafka_group_dead_count)`                                                                                                                                                                                                    | Total number of dead Consumer Groups                                        | count   |
| `sum by (job) (max by(job, topic, partition) (kafka_log_size))`                                                                                                                                                                            | Sum of log sizes                                                            | bytes   |
| `sum by(job, topic) (max by(job, topic, partition) (kafka_log_end_offset{})) - on(job, topic) group_left(consumer_group) sum by(job, consumer_group, topic) (max by(job, consumer_group, topic, partition) (kafka_group_commit_offset{}))` | Log consumption delay lag                                                   |         |
| `sum by(job, topic) (max by(job, topic, partition) (kafka_log_end_offset))`                                                                                                                                                                | End of log offset sum                                                       |         |
| `max by(job, topic, partition) (kafka_log_end_offset)`                                                                                                                                                                                     | End of Log Max Offset                                                       |         |
| `sum by (job) (kafka_group_preparing_rebalance_count)`                                                                                                                                                                                     | Sum number of Consumer Groups in preparation for rebalance                  | count   |
| `sum by (job) (kafka_group_completing_rebalance_count)`                                                                                                                                                                                    | Sum number of Consumer Groups waiting for status allocation by Leader       | count   |
| `sum by(job, topic) (rate(kafka_network_io_bytes_total{direction="in"}[1m]))`                                                                                                                                                              | Broker node inbound network IO rate per topic sum by (topic)                | bytes/s |
| `sum by(job, topic, instance) (rate(kafka_network_io_bytes_total{direction="in"}[1m]))`                                                                                                                                                    | Broker node inbound network IO rate per topic sum by (topic, instance)      | bytes/s |
| `sum by(job, topic) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                             | Broker node outbound network IO rate per topic sum by (topic)               | bytes/s |
| `sum by(job, topic, instance) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                   | Broker node outbound network IO rate per topic sum by (topic, instance)     | bytes/s |
| `sum by(job, topic, partition) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                  | Broker node outbound network IO rate per topic sum by (topic, partition)    | bytes/s |
| `sum by(job, topic) (rate(kafka_message_count_total{direction="in"}[1m]))`                                                                                                                                                                 | Broker node message throughput per topic (inbound) sum by (topic)           | msg/s   |
| `sum by(job, topic, instance) (rate(kafka_message_count_total{direction="in"}[1m]))`                                                                                                                                                       | Broker node message throughput per topic (inbound) sum by (topic, instance) | msg/s   |
| `sum by(job) (rate(kafka_network_io_bytes_total[1m]))`                                                                                                                                                                                     | Broker node network IO rate per Topic (cluster level)                       | bytes/s |
| `sum by(job, topic) (kafka_log_size)`                                                                                                                                                                                                      | Log size per Topic                                                          | bytes   |
| `sum by(job, topic, type) (rate(kafka_message_count_total[1m]))`                                                                                                                                                                           | Message throughput per topic sum by (topic, type)                           | msg/s   |
| `sum by(job, topic, type) (rate(kafka_topic_request_count_total[1m]))`                                                                                                                                                                     | Request count per topic sum by (topic, type)                                | req/s   |
| `sum by(job, instance) (rate(kafka_network_io_bytes_total{direction="out"}[1m]))`                                                                                                                                                          | Broker node outbound network IO rate per instance (instance level)          | bytes/s |
| `sum by(job, instance) (kafka_partition_count)`                                                                                                                                                                                            | Number of Broker node partitions per instance                               | count   |
| `sum by(job, instance) (rate(kafka_message_count_total{direction="in"}[1m]))`                                                                                                                                                              | Broker node message throughput per instance (inbound)                       | msg/s   |
| `sum by(job, instance) (rate(kafka_request_count_total{type="Fetch"}[1m]))`                                                                                                                                                                | Fetch request rate per instance                                             | req/s   |
| `sum by(job, instance) (rate(kafka_request_count_total{type="Produce"}[1m]))`                                                                                                                                                              | Produce request rate per instance                                           | req/s   |
| `sum by(job, instance) (kafka_server_connection_count)`                                                                                                                                                                                    | Number of connections currently established by nodes per instance           | count   |
| `kafka_broker_active_count`                                                                                                                                                                                                                | Number of active brokers                                                    | count   |
| `sum by (job) (kafka_group_stable_count)`                                                                                                                                                                                                  | Sum of the number of steady-state Consumer Groups                           | count   |
| `sum by (job) (kafka_group_empty_count)`                                                                                                                                                                                                   | Sum number of empty Consumer Groups                                         | count   |
| `kafka_server_connection_count`                                                                                                                                                                                                            | Number of connections currently established by the node                     | count   |
| `kafka_broker_fenced_count`                                                                                                                                                                                                                | Number of Brokers fenced                                                    | count   |
| `sum by (job) (rate(kafka_request_error_count_total[1m]))`                                                                                                                                                                                 | Request error count sum                                                     | count   |
| `rate(kafka_request_error_count_total[1m])`                                                                                                                                                                                                | Request error count rate                                                    | count   |
| `sum by(job, instance) (rate(kafka_request_error_count_total[1m]))`                                                                                                                                                                        | Request error count rate (per instance)                                     | req/s   |
| `kafka_topic_count`                                                                                                                                                                                                                        | Total number of cluster topics                                              | count   |
| `kafka_partition_total_count`                                                                                                                                                                                                              | Total number of cluster partitions                                          | count   |

## Related[​](#related "Direct link to Related")

* [AutoMQ template source](https://github.com/ccfos/nightingale/tree/main/integrations/AutoMQ): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Categraf `prometheus` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/prometheus): every config option and the full metric list.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
