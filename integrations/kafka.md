---
title: "Monitor Kafka with Nightingale"
sidebar_label: "Kafka"
description: "Broker metrics come from JMX, consumer lag from the embedded kafka_exporter logic; templates come in Categraf and exporter editions, rules watch lag, offline partitions and shrinking ISR."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Kafka
toc_max_heading_level: 2
mdx:
  format: md
---

Kafka's core broker metrics are exposed over JMX; collect those with jolokia or jmx_exporter. The Categraf `kafka` input fills the gap JMX cannot: consumer group lag, per-partition offsets and consumption rate. It is forked from the davidmparrott flavour of kafka_exporter, whose metric names differ slightly from the danielqsj flavour; set `rename_uncommit_offset_to_lag = true` to switch to the more common `kafka_consumergroup_lag` naming.

Dashboards come in Categraf and kafka_exporter editions. The rules cover steadily growing consumer lag, offline partitions, under-replicated partitions, shrinking ISR and brokers dropping out.

## What's in the template

- **2 dashboards**, 24 panels in total
- **5 alert rules**, each with runbook steps
- **6 metric descriptions**
- **Categraf collector config**: `input.kafka`

## How to connect

1. [Install Categraf](/docs/data/categraf/install), put the config below in `conf/input.kafka/kafka.toml`, fill in your own address and credentials, and restart Categraf. The startup log prints `input: local.kafka started` once the plugin is loaded.

   ```toml
   # # collect interval
   # interval = 15

   ############################################################################
   # !!! uncomment [[instances]] to enable this plugin
   [[instances]]
   # # interval = global.interval * interval_times
   # interval_times = 1

   # append some labels to metrics
   # cluster is a preferred tag with the cluster name. If none is provided, the first of kafka_uris will be used
   labels = { cluster="kafka-cluster-01" }

   # log level only for kafka exporter
   log_level = "error"

   # Address (host:port) of Kafka server.
   # kafka_uris = ["127.0.0.1:9092","127.0.0.1:9092","127.0.0.1:9092"]
   kafka_uris = []

   # Connect using SASL/PLAIN
   # Default is false
   # use_sasl = false

   # Only set this to false if using a non-Kafka SASL proxy
   # Default is true
   # use_sasl_handshake = false

   # SASL user name
   # sasl_username = "username"

   # SASL user password
   # sasl_password = "password"

   # The SASL SCRAM SHA algorithm sha256 or sha512 as mechanism
   # sasl_mechanism = ""

   # Connect using TLS
   # use_tls = false

   # The optional certificate authority file for TLS client authentication
   # ca_file = ""

   # The optional certificate file for TLS client authentication
   # cert_file = ""

   # The optional key file for TLS client authentication
   # key_file = ""

   # If true, the server's certificate will not be checked for validity. This will make your HTTPS connections insecure
   # insecure_skip_verify = true

   # Kafka broker version
   # Default is 2.0.0
   # kafka_version = "2.0.0"

   # if you need to use a group from zookeeper
   # Default is false
   # use_zookeeper_lag = false

   # Address array (hosts) of zookeeper server.
   # zookeeper_uris = []

   # Metadata refresh interval
   # Default is 1m
   # metadata_refresh_interval = "1m"

   # Whether show the offset/lag for all consumer group, otherwise, only show connected consumer groups, default is true
   # Default is true
   # offset_show_all = true

   # If true, all scrapes will trigger kafka operations otherwise, they will share results. WARN: This should be disabled on large clusters
   # Default is false
   # allow_concurrency = false

   # Maximum number of offsets to store in the interpolation table for a partition
   # Default is 1000
   # max_offsets = 1000

   # How frequently should the interpolation table be pruned, in seconds.
   # Default is 30
   # prune_interval_seconds = 30

   # Regex filter for topics to be monitored
   # Default is ".*"
   # topics_filter_regex = ".*"

   # Regex filter for consumer groups to be monitored
   # Default is ".*"
   # groups_filter_regex = ".*"

   # if rename  kafka_consumergroup_uncommitted_offsets to kafka_consumergroup_lag
   # Default is false
   # rename_uncommit_offset_to_lag = false

   # if disable calculating lag rate
   # Default is false
   # disable_calculate_lag_rate = false
   ```

1. Open the integration center in Nightingale, find Kafka, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Kafka By Categraf | 12 |
| Kafka - exporter | 12 |

## Bundled alert rules

5 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

Rules are grouped by collector; import the group that matches how you collect.

### Collected by Categraf (3)

#### Kafka partitions are under-replicated

S2 Warning · for 1 min · Trigger:

```promql
max by (topic) (kafka_topic_partition_under_replicated_partition) > 0
```

Runbook:

1. Take topic from the alert labels and run kafka-topics.sh --describe --topic \<topic> --bootstrap-server \<broker>, comparing Isr against Replicas to find which broker holds the missing replica;
1. Check that broker's server.log for a full disk, GC pauses or network timeouts;
1. If the broker is down, bring it back and the replicas will catch up automatically;
1. If it cannot catch up for a long time, use kafka-reassign-partitions.sh to move the replica to a healthy broker.

#### Kafka broker count dropped

S1 Critical · for 1 min · Trigger:

```promql
delta(kafka_brokers[10m]) < 0
```

Runbook:

1. Run kafka-broker-api-versions.sh --bootstrap-server \<broker> to list the currently online brokers and compare against the configuration to find the missing node;
1. On that node, confirm the process is alive and check server.log for OOM or disk errors;
1. After bringing it back, run kafka-topics.sh --describe --under-replicated-partitions to confirm the replicas caught up;
1. If the node cannot be fixed soon, use kafka-reassign-partitions.sh to move its partitions away and restore redundancy.

#### Kafka consumer group lag exceeds 10000 messages

S2 Warning · for 1 min · Trigger:

```promql
max by (topic, consumergroup) (kafka_consumergroup_uncommitted_offsets) > 10000
```

Runbook:

1. Take consumergroup and topic from the alert labels and run kafka-consumer-groups.sh --describe --group \<group> --bootstrap-server \<broker> to see the LAG distribution per partition;
1. Lag concentrated on a few partitions means data skew — check the partition key on the producer side;
1. Evenly spread lag means consumers are slow: first check the consumer logs for abnormal retries, then scale out consumer instances (never beyond the partition count) or make per-message processing faster;
1. Confirm the consumers have not all dropped out (MEMBERS at 0 means you must start the consumers first).

### Collected by an exporter (2)

#### Kafka consumer group lag exceeds 10000 messages - exporter

S2 Warning · for 1 min · Trigger:

```promql
max by (topic, consumergroup) (kafka_consumergroup_lag) > 10000
```

Runbook:

1. Take consumergroup and topic from the alert labels and run kafka-consumer-groups.sh --describe --group \<group> --bootstrap-server \<broker> to see the LAG distribution per partition;
1. Lag concentrated on a few partitions means data skew — check the partition key on the producer side;
1. Evenly spread lag means consumers are slow: first check the consumer logs for abnormal retries, then scale out consumer instances (never beyond the partition count) or make per-message processing faster;
1. Confirm the consumers have not all dropped out (MEMBERS at 0 means you must start the consumers first).

#### Kafka under-replicated partitions - exporter

S2 Warning · for 1 min · Trigger:

```promql
max by (topic) (kafka_topic_partition_under_replicated_partition) > 0
```

Runbook:

1. Take topic from the alert labels and run kafka-topics.sh --describe --topic \<topic> --bootstrap-server \<broker>, comparing Isr against Replicas to find which broker holds the missing replica;
1. Check that broker's server.log for a full disk, GC pauses or network timeouts;
1. If the broker is down, bring it back and the replicas will catch up automatically;
1. If it cannot catch up for a long time, use kafka-reassign-partitions.sh to move the replica to a healthy broker.

## Metric reference

6 metrics, the ones the dashboards and rules above are built on.

| Metric | Meaning | Unit |
| --- | --- | --- |
| `kafka_brokers` | Number of Brokers |  |
| `kafka_topic_partition_under_replicated_partition` | Number of out-of-sync copies of Partition |  |
| `kafka_topic_partition_replicas` | Number of Partition copies |  |
| `sum(irate(kafka_consumergroup_current_offset[3m])) without (partition)` | Each Topic consumes messages per second |  |
| `sum(irate(kafka_topic_partition_current_offset[3m])) without (partition)` | Production message volume per second per Topic |  |
| `kafka_topic_partitions` | Number of Partitions for each Topic |  |

## Related

- [Kafka template source](https://github.com/ccfos/nightingale/tree/main/integrations/Kafka): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Categraf `kafka` plugin docs](https://github.com/flashcatcloud/categraf/tree/main/inputs/kafka): every config option and the full metric list.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
