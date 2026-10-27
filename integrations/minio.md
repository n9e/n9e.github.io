# Monitor MinIO with Nightingale

MinIO ships a Prometheus endpoint; scrape the cluster, bucket and node paths together or the object, bucket, process and disk panels stay empty.

Last reviewed 2026-10-27

MinIO exposes Prometheus metrics under `/minio/v2/metrics/` on three paths: `cluster`, `bucket` and `node`. The two bundled dashboards use all three families, so scraping `/cluster` alone leaves the object count, bucket usage, process and disk panels without data.

The endpoint requires a Bearer Token by default. `MINIO_PROMETHEUS_AUTH_TYPE=public` is fine for a test environment; in production keep authentication on, configure the token in Categraf, and do not expose the endpoint to the internet. The rules cover nodes offline, disks offline or near capacity, S3 request error rate and failed health checks.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **2 dashboards**, 64 panels in total
* **2 alert rules**, each with runbook steps

## How to connect[​](#how-to-connect "Direct link to How to connect")

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](https://n9e.github.io/docs/data/prometheus.md) and the templates work as they are.

```
# conf/input.prometheus/minio.toml

[[instances]]

urls = ["http://127.0.0.1:9000/minio/v2/metrics/cluster"]

labels = { job = "minio", instance = "minio-01:9000" }



[[instances]]

urls = ["http://127.0.0.1:9000/minio/v2/metrics/bucket"]

labels = { job = "minio", instance = "minio-01:9000" }



[[instances]]

urls = ["http://127.0.0.1:9000/minio/v2/metrics/node"]

labels = { job = "minio", instance = "minio-01:9000" }
```

1. Open the integration center in Nightingale, find MinIO, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                   | Panels |
| --------------------------- | ------ |
| MinIO Dashboard             | 32     |
| MinIO Dashboard New Version | 32     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

2 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### DisksOffline[​](#disksoffline "Direct link to DisksOffline")

Disks down in MinIO deployment

S2 Warning · for 10 min · Trigger:

```
avg_over_time(minio_cluster_disk_offline_total{}[5m]) > 0
```

Runbook:

1. Run mc admin info \<alias> to identify which node and which disk went offline and how much redundancy the cluster has left;
2. On that node use dmesg -T | grep -iE 'i/o error|ata|scsi' and smartctl -a to tell a dropped disk, a bad disk and a lost mount apart;
3. For a lost mount, remount it and MinIO will pick it up automatically; for a bad disk, replace it and run mc admin heal -r \<alias>;
4. Avoid heavy writes during healing and confirm remaining redundancy still exceeds the erasure-code parity count.

### NodesOffline[​](#nodesoffline "Direct link to NodesOffline")

Node down in MinIO deployment

S2 Warning · for 10 min · Trigger:

```
avg_over_time(minio_cluster_nodes_offline_total{}[5m]) > 0
```

Runbook:

1. Run mc admin info \<alias> to identify the offline node, then ping/ssh to confirm the machine is alive;
2. If it is alive, run systemctl status minio and check the logs — the usual causes are OOM, a failed disk mount or an expired certificate;
3. For intra-cluster network failures check networking and security groups: MinIO nodes must reach each other;
4. Once the node is back, run mc admin heal -r \<alias> and watch the healing progress.

## Related[​](#related "Direct link to Related")

* [MinIO template source](https://github.com/ccfos/nightingale/tree/main/integrations/MinIO): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
