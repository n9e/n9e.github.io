---
title: "Connect Telegraf"
sidebar_label: "Connect Telegraf"
description: "Send Telegraf metrics to Nightingale with HTTP output and Prometheus Remote Write, then verify the stored data."
last_reviewed: 2026-10-11
---

By the end of this page, your existing Telegraf will write metrics to the store used by Nightingale.
The example targets **Telegraf 1.36.3 and Nightingale v9**. Nightingale writes received metrics to its embedded TSDB or a configured external store.

## Before you start {#before-you-start}

- Nightingale is running and reachable from the Telegraf host on port 17000.
- `[HTTP.APIForAgent].Enable` is `true`.
- Choose the [embedded TSDB](../install/embedded-tsdb.md) or configure an [external writer](../install/external-tsdb.md).

Keep your existing Telegraf installation. For a new installation, use the [official instructions](https://docs.influxdata.com/telegraf/v1/install/) rather than the old 1.20.4 download script.

## Configure the output {#configure-output}

Merge this into `telegraf.conf` and replace the URL. `outputs.http` is the output plugin; `prometheusremotewrite` is its serialization format.

```toml
[agent]
interval = "15s"
flush_interval = "15s"

[[outputs.http]]
url = "http://127.0.0.1:17000/prometheus/v1/write"
method = "POST"
data_format = "prometheusremotewrite"
[outputs.http.headers]
Content-Type = "application/x-protobuf"
Content-Encoding = "snappy"
X-Prometheus-Remote-Write-Version = "0.1.0"

[[inputs.cpu]]
percpu = false
totalcpu = true
collect_cpu_time = false
report_active = true

[[inputs.mem]]
```

If Nightingale configures `[HTTP.APIForAgent.BasicAuth]`, add matching `username` and `password` inside `[[outputs.http]]`, **before** its headers table. Leave them out when authentication is disabled.

Review any default InfluxDB output already enabled in the file; an unrelated failing output can obscure the result.
OpenTSDB remains a compatibility protocol, but its metric names differ. Check existing dashboards when switching formats.

## Verify collection and delivery {#verify}

```bash
telegraf --config /etc/telegraf/telegraf.conf --test
telegraf --config /etc/telegraf/telegraf.conf --once
```

**Expected result**: `--test` shows CPU and memory samples; `--once` performs collection and delivery without authentication, routing or connection errors. `--test` alone does not test delivery.

In Nightingale's metrics explorer, select the destination store and query `cpu_usage_active`. You should see series with Telegraf tags.
Then restart the existing service. An installation with the official systemd unit can use `sudo systemctl restart telegraf`.

Telegraf does not send Categraf heartbeat metadata. Receiving metrics does not grant the same target-registration or self-healing capabilities.
See the [1.36.3 format documentation](https://github.com/influxdata/telegraf/blob/v1.36.3/plugins/serializers/prometheusremotewrite/README.md) for Histogram and Summary batching limitations.

## Next {#next}

- [Data ingestion protocols](../reference/write-protocols.md)
- [Create your first alert](../alerting/first-rule.md)
