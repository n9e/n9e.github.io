---
title: "Custom collector scripts"
sidebar_label: "Custom collector scripts"
description: "Run a script with the Categraf exec input, emit Prometheus metrics, and verify permissions, timeouts and service execution."
last_reviewed: 2026-10-11
---

By the end of this page, a script will emit custom samples that Categraf sends to Nightingale's TSDB.
The example uses **Categraf v0.5.17 and Nightingale v9**. The executable may be Shell, Python or a compiled program.

## Write the script {#script}

Create `/opt/categraf/scripts/collect_demo.sh`:

```bash
#!/bin/sh
printf 'custom_check_success{check="demo"} 1\n'
```

```bash
chmod +x /opt/categraf/scripts/collect_demo.sh
/opt/categraf/scripts/collect_demo.sh
```

**Expected result**: stdout contains only the Prometheus metric line.
Send diagnostics to stderr rather than mixing prose with samples. Resolve nonzero process-exit errors before diagnosing delivery.

## Configure the exec input {#configure}

In `conf/input.exec/exec.toml`:

```toml
[[instances]]
commands = ["/opt/categraf/scripts/collect_demo.sh"]
timeout = 5
data_format = "prometheus"
```

The format must match stdout. The input also supports `influx` and `falcon`, but their formats are not interchangeable.
Command paths support globs; check which scripts they match before enabling them.
See the [exec input documentation](https://github.com/flashcatcloud/categraf/blob/v0.5.17/inputs/exec/README.md).

## Verify {#verify}

```bash
./categraf --test --inputs exec
```

**Expected result**: `custom_check_success` with `check="demo"` and value 1, without parsing or timeout errors.
Restart the existing service and query the metric in the destination store to confirm new samples continue arriving.

If foreground execution works but service execution fails, check the service account, permissions, working directory, PATH and environment.
Use absolute paths and bounded execution times instead of relying on an interactive shell.

## Design meaningful metrics {#metric-design}

The constant value 1 verifies the pipeline only. A real check should report its actual result, such as queue length or last-success time.
Emit an explicit failure value. No output and a value of zero require different alert conditions.

Avoid random IDs, timestamps and full error messages as labels; they create unbounded series.
Use Counter semantics for cumulative counts and Gauge semantics for current values. See [Prerequisites](../prologue/pre-knowledge.md).

## Next {#next}

- [Create your first alert](../alerting/first-rule.md)
- [Connected datasource with no data](../troubleshooting/no-data.md)
