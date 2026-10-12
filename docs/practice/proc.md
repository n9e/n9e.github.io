---
title: "Monitor processes"
sidebar_label: "Monitor processes"
description: "Distinguish system process counts from a service’s resource usage and verify processes, procstat or application metrics."
last_reviewed: 2026-10-11
---

By the end of this page, you will distinguish excessive system process counts from a missing service and collect per-service resource metrics.
The configuration targets **Categraf v0.5.17 and Nightingale v9**.

## Choose the signal {#choose}

- `processes` counts system processes by state and helps detect runaway jobs.
- `procstat` matches a service and collects its count, CPU, memory and file descriptors.
- Application Prometheus metrics also describe requests, errors and runtime behavior. See [Java monitoring](./java.md).

An existing process does not prove that a service works; add [port or HTTP probes](./port.md) where needed.

## Configure procstat {#configure}

Edit `conf/input.procstat/procstat.toml`:

```toml
[[instances]]
search_exec_substring = "nginx"
gather_total = true
gather_per_pid = false
gather_more_metrics = ["cpu", "mem", "fd", "uptime"]
labels = { service = "nginx" }
```

Replace the match and confirm that it selects the intended service.
Add another `[[instances]]` for another service. Select one suitable matching method per instance.
`gather_per_pid = true` adds PID labels and can increase series counts when processes restart frequently.

## Verify and alert {#verify}

```bash
./categraf --test --inputs processes:procstat
```

**Expected result**: system counts and service metrics appear; the matched count agrees with the actual processes.
Restart the collector service and query `procstat_lookup_count` in Nightingale.

It is positive when matching processes exist and zero when none match. Verify on a test service before adding a sustained-duration alert to avoid noise from normal restarts.
If the host or collector disappears, samples may disappear instead of becoming zero. Add [missing-host detection](./linux.md#missing-host) separately.

## JVM and systemd environment {#jvm}

The `jvm` option in `gather_more_metrics` requires `jstat` on the target host.
If foreground testing works but systemd fails, check its PATH, the JDK location and permissions to inspect the process.
Use `sudo systemctl edit categraf.service` with the actual JDK path:

```ini
[Service]
Environment="PATH=/usr/lib/jvm/java-17-openjdk-amd64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

Restart and inspect the logs. Replace the example path if that JDK is not installed.
Configuration reference: [procstat v0.5.17](https://github.com/flashcatcloud/categraf/blob/v0.5.17/conf/input.procstat/procstat.toml).

## Next {#next}

- [Java application monitoring](./java.md)
- [Metric alert rules](../alerting/metric-rules.md)
