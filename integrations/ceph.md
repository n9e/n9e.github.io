---
title: "Monitor Ceph with Nightingale"
sidebar_label: "Ceph"
description: "Enable Ceph's prometheus mgr module and scrape port 9283; templates cover cluster health, OSDs, PGs, pool capacity and IOPS."
last_reviewed: 2026-10-13
custom_edit_url: https://github.com/ccfos/nightingale/tree/main/integrations/Ceph
toc_max_heading_level: 2
mdx:
  format: md
---

Ceph's mgr ships a prometheus module: after `ceph mgr module enable prometheus`, `/metrics` is served on port 9283 and the Categraf `prometheus` input scrapes it without any dedicated plugin.

The dashboard covers cluster health, OSD availability and capacity, PG state distribution, usage and IOPS per pool, and MON quorum. The rules cover HEALTH_WARN and HEALTH_ERR, OSDs down, abnormal PGs, pools near capacity and loss of MON quorum.

## What's in the template

- **1 dashboard**, 57 panels in total
- **15 alert rules**, each with runbook steps

## How to connect

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](/docs/data/prometheus) and the templates work as they are.

```toml
# conf/input.prometheus/ceph.toml
[[instances]]
urls = ["http://<ceph-mgr>:9283/metrics"]
labels = { service = "ceph", cluster = "ceph-cluster-001" }
```

1. Open the integration center in Nightingale, find Ceph, and [import the dashboards and alert rules](/docs/data/integrations/import) into a business group.
1. Imported rules start disabled. [Check that the metrics are arriving](/docs/data/integrations/verify) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards

| Dashboard | Panels |
| --- | ---: |
| Ceph - Cluster By Categraf | 57 |

## Bundled alert rules

15 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### CephErrorState

Ceph is in Error state longer than 5m, please check status of pools and OSDs

S1 Critical · for 5 min · Trigger:

```promql
ceph_health_status > 1
```

Runbook:

1. Immediately run ceph health detail to see which ERR item it is;
1. Common ones are inactive/incomplete PGs, many down OSDs, or a full OSD forcing the cluster read-only;
1. Restore the down OSDs or free space on the full OSD first — this is the root cause of the vast majority of ERRs;
1. Do not scale or adjust the crush map during recovery, as it worsens data migration.

### CephOsdReweighted

OSD \{\{ $labels.ceph_daemon\}\} on cluster \{\{ $labels.cluster\}\} was reweighted for too long. Please either create silent or fix that issue

S2 Warning · for 60 min · Trigger:

```promql
ceph_osd_weight < 1
```

Runbook:

1. Run ceph osd tree to see which OSD is down-weighted and to what;
1. Determine whether it was a manual reweight or an automatic reweight-by-utilization;
1. If the fault is resolved, run ceph osd reweight \<id> 1.0 to restore the weight and let data backfill;
1. If it was down-weighted to balance capacity, consider using the balancer module instead.

### CephOSDUtilization

Osd free space for  \{\{ $labels.osd \}\} is higher tan 90%. Please validate why its so big, reweight or add storage

S1 Critical · for 1 min · Trigger:

```promql
ceph_osd_utilization > 90
```

Runbook:

1. Run ceph osd df to see the utilization spread and whether it is one OSD or the cluster as a whole;
1. For a single hot OSD, check ceph balancer status and run ceph balancer on if it is disabled;
1. If the cluster as a whole is near full you must add OSDs, or first delete unused pools/snapshots to free space;
1. Temporarily raising mon_osd_full_ratio buys time but is a dangerous operation and must be paired with real expansion.

### CephPgActivating

Some groups are activating for too long on \{\{ $labels.cluster \}\}. Those PGs are unavailable for too long!

S1 Critical · for 5 min · Trigger:

```promql
ceph_pg_activating > 0
```

Runbook:

1. Run ceph -s and ceph health detail for the overall state and the specific warnings;
1. Use ceph pg dump_stuck and ceph pg \<pgid> query to locate the stuck PGs and why;
1. In most cases the root cause is a down OSD or a full disk — restore the OSD or free space and the PGs return to active+clean automatically;
1. Watch with ceph -w during recovery and avoid other operations that add load.

### CephPgBackfillTooFull

Some groups are located on full OSD on cluster \{\{ $labels.cluster \}\}. Those PGs can be unavailable shortly. Please check OSDs, change weight or reconfigure CRUSH rules.

S2 Warning · for 5 min · Trigger:

```promql
ceph_pg_backfill_toofull > 0
```

Runbook:

1. Run ceph osd df to find the OSDs short on space;
1. Freeing space or adding OSDs is the real fix;
1. As an emergency measure raise osd_backfill_full_ratio so backfill continues, but only if the disks genuinely have headroom;
1. Avoid taking further OSDs offline before backfill completes, or redundancy drops further.

### CephPgDown

Some groups are down (unavailable) for too long on \{\{ $labels.cluster \}\}. Please ensure that all the data are available

S1 Critical · for 3 min · Trigger:

```promql
ceph_pg_down > 0
```

Runbook:

1. Run ceph pg \<pgid> query to see why it is down, focusing on which OSDs blocked_by points to;
1. Bringing those OSDs back online is the most direct fix — usually a disk or host failure;
1. If an OSD genuinely cannot be recovered, assess the data loss risk of an osd lost operation before running it;
1. Record every step: decisions involving data loss should be reviewed by a second person.

### CephPgIncomplete

Some groups are incomplete (unavailable) for too long on \{\{ $labels.cluster \}\}. Please ensure that all the data are available

S1 Critical · for 2 min · Trigger:

```promql
ceph_pg_incomplete > 0
```

Runbook:

1. Run ceph -s and ceph health detail for the overall state and the specific warnings;
1. Use ceph pg dump_stuck and ceph pg \<pgid> query to locate the stuck PGs and why;
1. In most cases the root cause is a down OSD or a full disk — restore the OSD or free space and the PGs return to active+clean automatically;
1. Watch with ceph -w during recovery and avoid other operations that add load.

### CephPgInconsistent

Some groups are inconsistent for too long on \{\{ $labels.cluster \}\}. Data is available but inconsistent across nodes

S2 Warning · for 1 min · Trigger:

```promql
ceph_pg_inconsistent > 0
```

Runbook:

1. Use ceph health detail to find the inconsistent PGs, then rados list-inconsistent-obj \<pgid> for the specific objects;
1. Run ceph pg repair \<pgid> to trigger repair — Ceph overwrites from the authoritative copy;
1. Before repairing, confirm which copy is bad: if the primary itself is corrupt, verify the authoritative copy is trustworthy first;
1. An OSD that repeatedly produces inconsistencies should have its SMART checked — it is usually bad sectors and the disk should be replaced.

### CephPgUnavailable

Some groups are unavailable on \{\{ $labels.cluster \}\}. Please check their detailed status and current configuration.

S1 Critical · for 5 min · Trigger:

```promql
ceph_pg_total - ceph_pg_active > 0
```

Runbook:

1. Run ceph -s and ceph health detail for the overall state and the specific warnings;
1. Use ceph pg dump_stuck and ceph pg \<pgid> query to locate the stuck PGs and why;
1. In most cases the root cause is a down OSD or a full disk — restore the OSD or free space and the PGs return to active+clean automatically;
1. Watch with ceph -w during recovery and avoid other operations that add load.

### CephTargetDown

CEPH target down for more than 2m, please check - it could be a either exporter crash or a whole cluster crash

S1 Critical · for 10 min · Trigger:

```promql
up{job="ceph"} == 0
```

Runbook:

1. Confirm the node running ceph exporter / mgr is alive and the process is running;
1. Run ceph -s on any mon node to confirm by hand whether the cluster itself is healthy;
1. A failed mgr causes many metrics to disappear — run ceph mgr fail to switch to the standby mgr;
1. After collection resumes, note the data gap and remember there were no alerts during the blind window.

### CephWarnState

Ceph is in Warn state longer than 30m, please check status of pools and OSDs

S2 Warning · for 30 min · Trigger:

```promql
ceph_health_status == 1
```

Runbook:

1. Run ceph health detail to see exactly which WARN items are present;
1. Common ones are a single down OSD, PGs not clean, clock skew and pools without pg_autoscale;
1. Work through them following the guidance — Ceph's health detail usually gives explicit instructions;
1. Once done, confirm ceph -s returns to HEALTH_OK.

### MonitorAvailableStorage

Monitor storage for \{\{ $labels.monitor \}\} less than 30% - please check why its too high

S2 Warning · for 1 min · Trigger:

```promql
ceph_monitor_avail_percent < 30
```

Runbook:

1. Run df -h to check the free space on the partition holding /var/lib/ceph/mon;
1. The most common reason the mon directory grows is a cluster that has been unclean for a long time, preventing osdmap trimming — fix the cluster health first;
1. Run ceph tell mon.\<id> compact to trigger rocksdb compaction and reclaim space;
1. Longer term, give mon its own larger disk.

### MonitorClockSkewTooHigh

Monitor clock skew detected on  \{\{ $labels.monitor \}\} - please check ntp and hardware clock settings

S2 Warning · for 1 min · Trigger:

```promql
abs(ceph_monitor_clock_skew_seconds) > 0.1
```

Runbook:

1. On each mon node run chronyc tracking to check the offset and upstream source state;
1. Confirm every mon node uses the same set of NTP sources;
1. Start chronyd where it is not running and enable it at boot; where the offset is large, use chronyc makestep to step the clock;
1. After correcting the time, confirm with ceph -s that the clock skew warning is gone.

### OsdApplyLatencyTooHigh

OSD latency for \{\{ $labels.osd \}\} is too high. Please check if it doesn't stuck in weird state

S2 Warning · for 90s · Trigger:

```promql
ceph_osd_perf_apply_latency_seconds > 10
```

Runbook:

1. Run ceph osd perf to see commit/apply latency per OSD and whether it is isolated or widespread;
1. For a single slow OSD, go to that node and use iostat -x 1 and smartctl to check disk health and saturation;
1. If it is widespread, check whether a large recovery/backfill is running and lower osd_max_backfills to reduce the impact;
1. For a failing disk, follow the replacement procedure.

### OsdDown

OSD is down longer than 30 min, please check what's the status

S2 Warning · for 30 min · Trigger:

```promql
ceph_osd_up == 0
```

Runbook:

1. Run ceph osd tree to identify the OSD and its node;
1. On that node use systemctl status ceph-osd@\<id> and its logs to find the cause (disk failure, OOM, process crash);
1. If the disk is fine, just start the OSD; if the disk failed, follow the replacement procedure and ceph osd out to migrate data away;
1. Watch recovery progress with ceph -s and avoid taking more OSDs offline.

## Related

- [Ceph template source](https://github.com/ccfos/nightingale/tree/main/integrations/Ceph): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
- [Import dashboards and alert rules](/docs/data/integrations/import)
- [Verify that metrics are stored](/docs/data/integrations/verify)
- [All integrations](/integrations)
