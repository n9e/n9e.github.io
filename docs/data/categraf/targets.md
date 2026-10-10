---
title: "Targets and heartbeat"
sidebar_label: "Targets and heartbeat"
description: "Categraf sends a heartbeat with host metadata every ten seconds; the target list shows status and tags from it, and hosts are assigned to business groups by hand."
---

**Infrastructure → Hosts** is Nightingale's machine inventory. This page covers how a machine gets
into that list, where each column comes from, and how to tag hosts and attach them to business
groups.

## What the heartbeat does

Every `[heartbeat] interval` seconds (10 by default) Categraf posts a packet of host metadata to
Nightingale's `POST /v1/n9e/heartbeat`:

| Field | Source |
|---|---|
| `hostname` | `[global] hostname`, or `os.Hostname()` when empty |
| `agent_version` | The categraf version |
| `os` / `arch` | Operating system and CPU architecture |
| `cpu_num` / `cpu_util` / `mem_util` | Core count, CPU and memory utilisation |
| `host_ip` | The detected local IP |
| `global_labels` | Whatever is in `[global.labels]` |
| `extend_info` | CPU model, total memory, NICs, kernel version, filesystems and more |
| `unixtime` | Send time, which Nightingale uses to compute the clock offset |

**`hostname` is this machine's unique identity** (the **Identifier** column). Nightingale keys its
record on it, so it has to be globally unique — two machines sharing a hostname collapse into one
record whose metadata flips on alternating heartbeats, **and nothing warns you**.

An `interval` below 4 is raised to 4, and the real cadence is slightly longer than the configured
value because computing CPU utilisation samples for a few seconds first.

`hostname` accepts placeholders: `$hostname`, `$ip`, `$sn` (BIOS serial), plus environment
variables — e.g. `hostname = "prod-$ip"`.

**The very first heartbeat records almost nothing.** Nightingale consults its in-memory cache before
deciding which fields to update, and a brand-new host is not in it yet — so Agent version, OS,
Source IP and Reported tags stay empty until a heartbeat arrives after the next cache refresh. Blank
columns right after an install are expected; look again in a minute.

## What the host list shows

Twelve columns. Custom tags, Business groups and Note are what you set in Nightingale; everything
else comes from the heartbeat:

| Column | Meaning |
|---|---|
| Identifier | The hostname, unique |
| Status | Heartbeat freshness — see the next section |
| Agent version | The categraf version |
| Reported tags | The agent's `[global.labels]`. Requires categraf v0.3.80 or later |
| Custom tags | Tags you attached to this host in Nightingale |
| Business groups | Which business groups it belongs to |
| Updated at | Most recent heartbeat |
| Memory / CPU | Utilisation. `unknown` means this host has never reported metadata |
| Time offset | The Nightingale server's clock **minus** the categraf host's clock |
| Source IP | Where the heartbeat request came from |
| Note | Your own description, appended to alert events |

The left-hand panel gives the aggregate view: total hosts, alive / dead, version distribution, and
preset filters (All hosts / Ungrouped hosts) plus the business group tree. **Ungrouped hosts** is
worth a look — freshly installed machines that were never attached to a group collect there and are
easy to miss.

The **Identifier** header carries a dropdown that copies the identifiers of the current page, all
hosts, or the selected ones, which saves a lot of typing during bulk work.

## How status is decided

By the age of the most recent heartbeat:

| Since last heartbeat | Status |
|---|---|
| Under 60s | Healthy |
| 60–180s | In between |
| Over 180s, or never | Dead |

One thing that misleads people: **the Updated at column is not the heartbeat time.** In v9 the
heartbeat timestamp is written only to Redis (with a 24-hour expiry); the database's `update_at`
changes only when the metadata itself changes. So Updated at can read 40 minutes ago while the
status is healthy — that is not a bug. Judge liveness by the **Status** column.

A corollary: **lose the Redis data and every host reads as dead** until the next round of
heartbeats refills it.

`unknown` CPU / memory is a different signal: it means the host has **never reported metadata at
all**, usually because writers were configured but the heartbeat was not.

## Two kinds of tag

Nightingale keeps host tags in two buckets with different origins and different behaviour:

- **Reported tags** come from the agent's `[global.labels]` and are replaced wholesale on every
  heartbeat. Changing them means editing the config on the host;
- **Custom tags** are set in the UI as `k=v`, several separated by spaces. Select hosts, then
  **Batch operations → Bind tags** / **Unbind tags**.

**On a key collision the reported tag wins**, and the custom tag with that key is dropped. So you
cannot use a custom tag to override a value the agent reports.

Both kinds end up attached to that host's metrics (Nightingale applies them as it forwards), so once
tagged you can filter and aggregate on them in PromQL.

## Assigning hosts to business groups

Business groups are Nightingale's unit of ownership and permission: alert rules and dashboards hang
off them. A host in no business group is covered by no group's rules.

Select hosts → **Batch operations → Update business group**. One host can belong to several groups.

The same menu holds **Update note** (the note is appended to alert events from that host) and
**Batch delete**. A deleted host whose agent is still running is recreated by its next heartbeat —
**to really decommission a machine, stop categraf first, then delete the record**.

## Alerting on the host itself

Host-liveness alerts do not go through the time series database; they use a dedicated Host rule
type. **Alerts & Notifications → Alert rules → Add**, data source type **Host**, with three triggers:

| Trigger | Meaning |
|---|---|
| Host unreachable | No heartbeat for N seconds |
| Cluster hosts unreachable | More than X% unreachable within N seconds — separates "one box died" from "the rack died" |
| Time offset | Clock offset above N milliseconds |

The cluster trigger is worth configuring: one host going quiet and a whole data center going quiet
call for entirely different responses, and separating them saves a misdiagnosis.

## Next

- The host doesn't appear, or the status is wrong: [Troubleshooting](./troubleshooting.md)
- What business groups are: [Business groups](../../concepts/business-groups.md)
- Writing rules for these hosts: [Your first alert rule](../../alerting/first-rule.md)
- From one host to its key metrics: [Object quick view](../../query/object-view.md)
