---
title: "Trigger self-healing with ibex / webhook"
sidebar_label: "Trigger self-healing with ibex / webhook"
description: "Run a script on the affected host through ibex, or call a webhook, when a specific event fires."
last_reviewed: 2026-10-10
---

Where this page ends: when an alert fires, Nightingale runs a script **on the host that has the
problem**, and you can read the result, per-host stdout / stderr and exit code in the UI.

Entry point: **Alerts & Notifications → Self-healing**, with two tabs — **Self-healing scripts**
(`/job-tpls`) and **Task history** (`/job-tasks`).

## Before you start

Self-healing uses the built-in ibex module — nothing extra to deploy — but the switch has to be
on at both ends.

**Server side**: check this block in `etc/config.toml` (it ships enabled):

```toml
[Ibex]
Enable = true
RPCListen = "0.0.0.0:20090"
```

Restart Nightingale if you changed it. 20090 is the RPC port agents use to pull script tasks and
report results back; it is separate from the HTTP port and needs its own firewall rule.

**Target hosts**: turn ibex on in categraf's `conf/config.toml` and point it at the server:

```toml
[ibex]
enable = true
## ibex flush interval
interval = "1000ms"
## n9e ibex server rpc address
servers = ["127.0.0.1:20090"]
## temp script dir
meta_dir = "./meta"
```

`servers` is a list — give it every instance you run and categraf picks the lowest-latency one,
switching if that instance dies. Past ten thousand hosts, raise `interval` (to `2500ms`, say) so
you do not overload the server. Restart categraf afterwards.

The open-source categraf already includes ibex; no different build is needed. A host without
categraf cannot run self-healing scripts — the script form states this prerequisite too.

## 1. Write a self-healing script

**Alerts & Notifications → Self-healing → Self-healing scripts**, click **Create**:

| Field | What it means |
|---|---|
| Title | What this script does |
| Tags | Used for classification |
| Account | Account used to run the script. Use root with caution |
| Batch | Concurrency. 0 (default) runs on all hosts at once, 1 sequentially, 2 two at a time |
| Tolerance | Failed hosts to tolerate. 0 (default) suspends the task as soon as one fails |
| Timeout | Per-host timeout in seconds, 30 by default |
| Host | Host list. **Leave it empty for self-healing** — the event decides the host |
| Pause | Pause after a given host completes |
| Script | The script body |
| Args | Parameters appended to the script, separated by double commas: `arg1,,arg2` |

The script gets the event's labels: when an alert creates the task, all of the event's labels are
assembled into one JSON object and **fed to the script on stdin**, together with
`alert_severity` (the numeric severity), `alert_trigger_value` and `is_recovered`. In a shell
script:

```bash
tags=$(cat)
ident=$(echo "$tags" | jq -r .ident)
```

## 2. Attach it to an alert rule

**Alerts & Notifications → Alert rules**, edit a rule, find **Self-healing template** in the
notification section and click the plus:

- **Template**: the one you just created (the dropdown lists this business group's templates
  only);
- **Host**: **normally leave it empty**. Empty means the host comes from the event's `ident`
  label — "run it on whichever host has the problem". Filling it pins execution to those hosts.

One rule can carry several rows, executed in order when it fires. If you cannot see the
Self-healing section at all, your role lacks the self-healing script permission — see
[Roles](../security/roles.md).

## 3. Fire it once and check Task history

Make the rule actually fire (a rule that must be true is quickest — see
[Test fire a rule](../alerting/test-fire.md)), then go to
**Self-healing → Task history**.

Expected result: a new task titled "template title FH: host". Opening it shows:

- The target host list and each host's status;
- Per-host stdout / stderr;
- The exit code — 0 succeeded, anything else failed;
- How long it took.

If nothing appears, work through the next section.

## When it does not run

- **Recovery events do not run it.** Only a firing alert triggers self-healing.
- **A subscribed copy does not run it.** Self-healing hangs off the source rule and runs once;
  another team subscribing to the alert does not fire the script a second time. See
  [Alert subscriptions](./subscriptions.md).
- **No host, no run.** With Host empty and no `ident` label on the event, this run is skipped.
  The log says `event_callback_ibex: failed to get host`.
- **Insufficient permission stops it.** The backend checks the triple "template's business group
  – target host – account" **as the person who last modified the template**. If that person has
  no rights on the host, the task is never dispatched. Whoever edits a template must have access
  to the target hosts.
- **ibex not enabled in categraf on the target.** The task is created but nobody picks it up, so
  the status never advances.

## When a webhook is all you need

If you do not need to run a command on a host and only want to tell an external system to act,
use the **Webhook callback** processor in a workflow: it POSTs the whole event to your URL and
ignores the response. Good for opening tickets, triggering CI/CD, or calling an automation
platform.

For how to configure it, see [Event pipelines](./pipelines.md). If you also want to change the
event with what the endpoint returns, the event update processor is the one you want — the
difference is in [Rewrite labels and enrich context](./relabel-enrich.md).

## Next

- What else happens between event and person: [Noise reduction and routing model](../concepts/noise-routing.md)
- Run the script only for specific events: [Conditional routing](./routing.md)
- Which ports to open: [Ports](../reference/ports.md)
