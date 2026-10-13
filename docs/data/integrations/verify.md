---
title: "Verify incoming data"
sidebar_label: "Verify incoming data"
description: "A quiet imported rule may just mean no data arrived; query the metric name the template lists in the Metrics explorer to confirm the component's metrics are in."
last_reviewed: 2026-10-10
---

import { figures } from '@site/src/data/figures';

An imported alert rule that stays quiet means one of two things: everything is fine, or **the data
never arrived**. Those look identical from the outside, so spend two minutes confirming the metrics
are really there before you trust the rules.

This page gives three checkpoints, from the host outwards, and what you should see at each one.

## 1. Which metric to look for

Start by knowing what to search for. A component drawer's **Metrics** tab lists exactly what that
component produces: **Integrations → Components → open a component → Metrics**, with metric name,
unit and PromQL in the table.

The same data is browsable across components under **Explorer → Metrics → Built-in metrics**, where
the columns are Component type / Category / Name / Unit / PromQL / Operations.

Only {figures.integrationsWithMetrics} of the {figures.integrations} components ship metric descriptions. Without one, guess from the plugin name:
Categraf plugins almost always prefix their metrics with the plugin name — `mysql` produces
`mysql_*`, `redis` produces `redis_*`, `nginx` produces `nginx_*`.

## 2. On the host: is the plugin collecting

The checkpoint closest to the source, on the machine running Categraf:

```bash
cd /path/to/categraf
./categraf --configs /path/to/categraf/conf --test --inputs mysql
```

`--test` prints collected metrics to stdout and **sends nothing to Nightingale**. The output looks
like this:

```
1788432166 18:42:46 mysql_global_status_threads_connected agent_hostname=n9e-web-01 instance=n9e-10.2.3.4:3306 5
```

Metric lines mean the plugin config is right. **Two caveats**: the process does not exit on its own,
so Ctrl-C once you have seen output; and `--test` **does not disable the heartbeat** — it still
reports to Nightingale, so don't run it casually in production.

Not a single line? See [Troubleshooting](../categraf/troubleshooting.md).

## 3. In Nightingale: did the metrics arrive

**Explorer → Metrics**, pick the source that holds host metrics (on a default install that is
`embedded-tsdb`), and query one of the names you just saw:

```promql
mysql_global_status_threads_connected
```

**What you should see**: one or more lines, each carrying an `agent_hostname` label, with values in
the same range you saw on the host.

If nothing comes back, widen the net to tell "this metric is missing" from "this host is missing":

```promql
# no metrics from this component at all?
{__name__=~"mysql_.*"}

# is this host reporting anything?
{agent_hostname="n9e-web-01"}
```

If the second one is empty too, the problem is not the plugin but the write path — back to
[Categraf troubleshooting](../categraf/troubleshooting.md).

## 4. The wizard's automatic check

If you came through **Infrastructure → Hosts → Set up collection**, its fourth step, **Verify data**,
does all of the above for you.

It polls a sentinel metric every 5 seconds; it usually appears within a minute of the command
succeeding. Two optional inputs:

- **Data source**: defaults to the Prometheus source the server matched from the write config. If
  nothing shows up there, switch to the one that actually stores your host metrics;
- **Target hosts** (optional): pick the hosts you ran the command on to confirm each individually;
  leave it empty to watch for any newly reporting host.

What the outcomes mean:

| Message | Meaning |
|---|---|
| Waiting for xxx metrics, checking every 5 seconds | Still waiting; normal |
| N new host(s) reporting xxx metrics | Done |
| N host(s) already reporting these metrics | Those were reporting before the check started |
| The check fell back to the xxx prefix | The exact sentinel kept returning nothing, so it matched on the prefix; existing reporters cannot be distinguished in this mode |
| This component has no fixed metric names | For `exec`, `mtail` and friends the names come from your own script, so nothing can be checked automatically |
| Timed out | See the next section |

**If you only changed the config on an existing host, nothing counts as "new" here** — continuously
reported metrics mean it took effect.

## 5. Still nothing

Work through the three leads the timeout message gives, in order:

1. **Did the command actually succeed?** The wizard's command test-runs the plugin with
   `categraf --test` first and stops there if it fails;
2. **Is categraf still running on the host?**
   ```bash
   journalctl -u categraf -n 50
   ```
3. **Search differently**: look for the `mysql_` prefix in the Metrics explorer, in case the metric
   name is not what you assumed.

One level up, confirm the host has a heartbeat at all: **Infrastructure → Hosts** shows Alive / Dead
in the left-hand overview, and the **Updated at** column carries the last heartbeat. No heartbeat
means Categraf is not running, or cannot reach Nightingale.

One more case worth calling out on its own: **the wrong data source**. Metrics went into A and you
are querying B. Host metrics land in the embedded store (`embedded-tsdb`) by default; if you
configured `Pushgw.Writers` to forward to an external store, query that source instead.

## Next

- Data is in, now tune the thresholds: [Import dashboards and rules](./import.md)
- Data is not in: [Categraf troubleshooting](../categraf/troubleshooting.md)
- The data source itself is the problem: [Why does a data source connect but return no data?](../../troubleshooting/no-data.md)
