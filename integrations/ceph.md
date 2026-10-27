# Monitor Ceph with Nightingale

Enable Ceph's prometheus mgr module and scrape port 9283; templates cover cluster health, OSDs, PGs, pool capacity and IOPS.

Last reviewed 2026-10-27

Ceph's mgr ships a prometheus module: after `ceph mgr module enable prometheus`, `/metrics` is served on port 9283 and the Categraf `prometheus` input scrapes it without any dedicated plugin.

The dashboard covers cluster health, OSD availability and capacity, PG state distribution, usage and IOPS per pool, and MON quorum. The rules cover HEALTH\_WARN and HEALTH\_ERR, OSDs down, abnormal PGs, pools near capacity and loss of MON quorum.

## What's in the template[​](#whats-in-the-template "Direct link to What's in the template")

* **1 dashboard**, 57 panels in total
* **15 alert rules**, each with runbook steps

## How to connect[​](#how-to-connect "Direct link to How to connect")

These components expose Prometheus-format `/metrics` themselves, so the Categraf `prometheus` input scrapes them without a dedicated plugin. If a Prometheus or VictoriaMetrics instance is already scraping them, [add it as a Nightingale data source](https://n9e.github.io/docs/data/prometheus.md) and the templates work as they are.

```
# conf/input.prometheus/ceph.toml

[[instances]]

urls = ["http://<ceph-mgr>:9283/metrics"]

labels = { service = "ceph", cluster = "ceph-cluster-001" }
```

1. Open the integration center in Nightingale, find Ceph, and [import the dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md) into a business group.
2. Imported rules start disabled. [Check that the metrics are arriving](https://n9e.github.io/docs/data/integrations/verify.md) first, then enable the rules one by one with thresholds that fit your environment.

## Bundled dashboards[​](#bundled-dashboards "Direct link to Bundled dashboards")

| Dashboard                  | Panels |
| -------------------------- | ------ |
| Ceph - Cluster By Categraf | 57     |

## Bundled alert rules[​](#bundled-alert-rules "Direct link to Bundled alert rules")

15 rules. Each lists its trigger condition (PromQL) and the steps to take when it fires. Thresholds are meant to be adjusted after import.

### CephErrorState[​](#cepherrorstate "Direct link to CephErrorState")

Ceph is in Error state longer than 5m, please check status of pools and OSDs

S1 Critical · for 5 min · Trigger:

```
ceph_health_status > 1
```

Runbook:

1. Immediately run ceph health detail to see which ERR item it is;
2. Common ones are inactive/incomplete PGs, many down OSDs, or a full OSD forcing the cluster read-only;
3. Restore the down OSDs or free space on the full OSD first — this is the root cause of the vast majority of ERRs;
4. Do not scale or adjust the crush map during recovery, as it worsens data migration.

### CephOsdReweighted[​](#cephosdreweighted "Direct link to CephOsdReweighted")

OSD {{ $labels.ceph\_daemon}} on cluster {{ $labels.cluster}} was reweighted for too long. Please either create silent or fix that issue

S2 Warning · for 60 min · Trigger:

```
ceph_osd_weight < 1
```

Runbook:

1. Run ceph osd tree to see which OSD is down-weighted and to what;
2. Determine whether it was a manual reweight or an automatic reweight-by-utilization;
3. If the fault is resolved, run ceph osd reweight \<id> 1.0 to restore the weight and let data backfill;
4. If it was down-weighted to balance capacity, consider using the balancer module instead.

### CephOSDUtilization[​](#cephosdutilization "Direct link to CephOSDUtilization")

Osd free space for {{ $labels.osd }} is higher tan 90%. Please validate why its so big, reweight or add storage

S1 Critical · for 1 min · Trigger:

```
ceph_osd_utilization > 90
```

Runbook:

1. Run ceph osd df to see the utilization spread and whether it is one OSD or the cluster as a whole;
2. For a single hot OSD, check ceph balancer status and run ceph balancer on if it is disabled;
3. If the cluster as a whole is near full you must add OSDs, or first delete unused pools/snapshots to free space;
4. Temporarily raising mon\_osd\_full\_ratio buys time but is a dangerous operation and must be paired with real expansion.

### CephPgActivating[​](#cephpgactivating "Direct link to CephPgActivating")

Some groups are activating for too long on {{ $labels.cluster }}. Those PGs are unavailable for too long!

S1 Critical · for 5 min · Trigger:

```
ceph_pg_activating > 0
```

Runbook:

1. Run ceph -s and ceph health detail for the overall state and the specific warnings;
2. Use ceph pg dump\_stuck and ceph pg \<pgid> query to locate the stuck PGs and why;
3. In most cases the root cause is a down OSD or a full disk — restore the OSD or free space and the PGs return to active+clean automatically;
4. Watch with ceph -w during recovery and avoid other operations that add load.

### CephPgBackfillTooFull[​](#cephpgbackfilltoofull "Direct link to CephPgBackfillTooFull")

Some groups are located on full OSD on cluster {{ $labels.cluster }}. Those PGs can be unavailable shortly. Please check OSDs, change weight or reconfigure CRUSH rules.

S2 Warning · for 5 min · Trigger:

```
ceph_pg_backfill_toofull > 0
```

Runbook:

1. Run ceph osd df to find the OSDs short on space;
2. Freeing space or adding OSDs is the real fix;
3. As an emergency measure raise osd\_backfill\_full\_ratio so backfill continues, but only if the disks genuinely have headroom;
4. Avoid taking further OSDs offline before backfill completes, or redundancy drops further.

### CephPgDown[​](#cephpgdown "Direct link to CephPgDown")

Some groups are down (unavailable) for too long on {{ $labels.cluster }}. Please ensure that all the data are available

S1 Critical · for 3 min · Trigger:

```
ceph_pg_down > 0
```

Runbook:

1. Run ceph pg \<pgid> query to see why it is down, focusing on which OSDs blocked\_by points to;
2. Bringing those OSDs back online is the most direct fix — usually a disk or host failure;
3. If an OSD genuinely cannot be recovered, assess the data loss risk of an osd lost operation before running it;
4. Record every step: decisions involving data loss should be reviewed by a second person.

### CephPgIncomplete[​](#cephpgincomplete "Direct link to CephPgIncomplete")

Some groups are incomplete (unavailable) for too long on {{ $labels.cluster }}. Please ensure that all the data are available

S1 Critical · for 2 min · Trigger:

```
ceph_pg_incomplete > 0
```

Runbook:

1. Run ceph -s and ceph health detail for the overall state and the specific warnings;
2. Use ceph pg dump\_stuck and ceph pg \<pgid> query to locate the stuck PGs and why;
3. In most cases the root cause is a down OSD or a full disk — restore the OSD or free space and the PGs return to active+clean automatically;
4. Watch with ceph -w during recovery and avoid other operations that add load.

### CephPgInconsistent[​](#cephpginconsistent "Direct link to CephPgInconsistent")

Some groups are inconsistent for too long on {{ $labels.cluster }}. Data is available but inconsistent across nodes

S2 Warning · for 1 min · Trigger:

```
ceph_pg_inconsistent > 0
```

Runbook:

1. Use ceph health detail to find the inconsistent PGs, then rados list-inconsistent-obj \<pgid> for the specific objects;
2. Run ceph pg repair \<pgid> to trigger repair — Ceph overwrites from the authoritative copy;
3. Before repairing, confirm which copy is bad: if the primary itself is corrupt, verify the authoritative copy is trustworthy first;
4. An OSD that repeatedly produces inconsistencies should have its SMART checked — it is usually bad sectors and the disk should be replaced.

### CephPgUnavailable[​](#cephpgunavailable "Direct link to CephPgUnavailable")

Some groups are unavailable on {{ $labels.cluster }}. Please check their detailed status and current configuration.

S1 Critical · for 5 min · Trigger:

```
ceph_pg_total - ceph_pg_active > 0
```

Runbook:

1. Run ceph -s and ceph health detail for the overall state and the specific warnings;
2. Use ceph pg dump\_stuck and ceph pg \<pgid> query to locate the stuck PGs and why;
3. In most cases the root cause is a down OSD or a full disk — restore the OSD or free space and the PGs return to active+clean automatically;
4. Watch with ceph -w during recovery and avoid other operations that add load.

### CephTargetDown[​](#cephtargetdown "Direct link to CephTargetDown")

CEPH target down for more than 2m, please check - it could be a either exporter crash or a whole cluster crash

S1 Critical · for 10 min · Trigger:

```
up{job="ceph"} == 0
```

Runbook:

1. Confirm the node running ceph exporter / mgr is alive and the process is running;
2. Run ceph -s on any mon node to confirm by hand whether the cluster itself is healthy;
3. A failed mgr causes many metrics to disappear — run ceph mgr fail to switch to the standby mgr;
4. After collection resumes, note the data gap and remember there were no alerts during the blind window.

### CephWarnState[​](#cephwarnstate "Direct link to CephWarnState")

Ceph is in Warn state longer than 30m, please check status of pools and OSDs

S2 Warning · for 30 min · Trigger:

```
ceph_health_status == 1
```

Runbook:

1. Run ceph health detail to see exactly which WARN items are present;
2. Common ones are a single down OSD, PGs not clean, clock skew and pools without pg\_autoscale;
3. Work through them following the guidance — Ceph's health detail usually gives explicit instructions;
4. Once done, confirm ceph -s returns to HEALTH\_OK.

### MonitorAvailableStorage[​](#monitoravailablestorage "Direct link to MonitorAvailableStorage")

Monitor storage for {{ $labels.monitor }} less than 30% - please check why its too high

S2 Warning · for 1 min · Trigger:

```
ceph_monitor_avail_percent < 30
```

Runbook:

1. Run df -h to check the free space on the partition holding /var/lib/ceph/mon;
2. The most common reason the mon directory grows is a cluster that has been unclean for a long time, preventing osdmap trimming — fix the cluster health first;
3. Run ceph tell mon.\<id> compact to trigger rocksdb compaction and reclaim space;
4. Longer term, give mon its own larger disk.

### MonitorClockSkewTooHigh[​](#monitorclockskewtoohigh "Direct link to MonitorClockSkewTooHigh")

Monitor clock skew detected on {{ $labels.monitor }} - please check ntp and hardware clock settings

S2 Warning · for 1 min · Trigger:

```
abs(ceph_monitor_clock_skew_seconds) > 0.1
```

Runbook:

1. On each mon node run chronyc tracking to check the offset and upstream source state;
2. Confirm every mon node uses the same set of NTP sources;
3. Start chronyd where it is not running and enable it at boot; where the offset is large, use chronyc makestep to step the clock;
4. After correcting the time, confirm with ceph -s that the clock skew warning is gone.

### OsdApplyLatencyTooHigh[​](#osdapplylatencytoohigh "Direct link to OsdApplyLatencyTooHigh")

OSD latency for {{ $labels.osd }} is too high. Please check if it doesn't stuck in weird state

S2 Warning · for 90s · Trigger:

```
ceph_osd_perf_apply_latency_seconds > 10
```

Runbook:

1. Run ceph osd perf to see commit/apply latency per OSD and whether it is isolated or widespread;
2. For a single slow OSD, go to that node and use iostat -x 1 and smartctl to check disk health and saturation;
3. If it is widespread, check whether a large recovery/backfill is running and lower osd\_max\_backfills to reduce the impact;
4. For a failing disk, follow the replacement procedure.

### OsdDown[​](#osddown "Direct link to OsdDown")

OSD is down longer than 30 min, please check what's the status

S2 Warning · for 30 min · Trigger:

```
ceph_osd_up == 0
```

Runbook:

1. Run ceph osd tree to identify the OSD and its node;
2. On that node use systemctl status ceph-osd@\<id> and its logs to find the cause (disk failure, OOM, process crash);
3. If the disk is fine, just start the OSD; if the disk failed, follow the replacement procedure and ceph osd out to migrate data away;
4. Watch recovery progress with ceph -s and avoid taking more OSDs offline.

## Related[​](#related "Direct link to Related")

* [Ceph template source](https://github.com/ccfos/nightingale/tree/main/integrations/Ceph): the raw JSON for dashboards, rules and collector config. Pull requests welcome.
* [Import dashboards and alert rules](https://n9e.github.io/docs/data/integrations/import.md)
* [Verify that metrics are stored](https://n9e.github.io/docs/data/integrations/verify.md)
* [All integrations](https://n9e.github.io/integrations.md)
