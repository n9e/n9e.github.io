---
title: "Install collector configuration"
sidebar_label: "Install collector configuration"
description: "Copy a template's collector config into Categraf and start collecting the component's metrics."
last_reviewed: 2026-10-10
---

Where this page ends: the target host has a new `conf/input.<plugin>/<plugin>.toml`, Categraf is
collecting that component's metrics, and you have confirmed they reached Nightingale.

This assumes Categraf is **already installed** on the host — if not, start at
[Install and register](../categraf/install.md). Nightingale collects nothing itself; it only tells
you what to put into Categraf.

## Two paths

The open-source edition offers two; pick one:

| | Collection wizard | Instructions in the template center |
|---|---|---|
| Entry point | **Infrastructure → Hosts → Set up collection** | **Integrations → Components → pick a component → Instructions** |
| Coverage | 55 common components | 86 components |
| How it lands on the host | Generates a command you run there | You create the file, paste, restart |
| Best for | Common components, repeated across many hosts | Components the wizard doesn't cover, or heavy customisation |

## Path 1: the collection wizard

**Infrastructure → Hosts**, then **Set up collection** at the top right. Four steps:

**1. Pick component.** Filter by category (All / Databases / Middleware / Web services / Network
probes / Host & processes / Other) or just search. Taking MySQL as the example, click its card.

**2. Configure.** Two modes:

- **Form mode**: field by field. MySQL asks for **Address** (required), username, password, whether
  to collect extra status metrics, and an **Instance label** — that last one matters: it is attached
  to every metric of this instance as the `instance` label, the built-in dashboards depend on it,
  and it must be **globally unique**;
- **Edit toml**: edit the generated config directly. Switching back to form mode discards those
  manual edits.

Leave **Collect interval (seconds)** empty to use the global default of 15s. For several instances
of the same component (three MySQL servers, say), click **Add instance** rather than writing three
configs.

The **Generated config preview** on the right always shows exactly what will be written.

**3. Run command.** The wizard hands you a command of this shape:

```bash
curl -sSfL 'http://<nightingale>/api/n9e/agents/categraf/collect.sh' \
  | sudo bash -s -- --input 'mysql' --conf-b64 '<base64-encoded config>'
```

**Run it on the target host as root.** The same command can be run on any number of hosts.

If piping straight into bash makes you uncomfortable, the wizard also offers the stepwise version:
`curl -o collect-config.sh`, read it with `less`, then
`sudo bash collect-config.sh --input ... --conf-b64 ...`.

The command embeds the whole config base64-encoded. **It may contain passwords — do not share it
over untrusted channels.**

**4. Verify data.** The wizard watches for a sentinel metric, polling every 5 seconds; it normally
appears within a minute of the command succeeding. See [Verify incoming data](./verify.md).

## Path 2: the Instructions tab in the template center

**Integrations → Components**, click a component card, and the first tab is **Instructions**.

It is a Markdown document explaining how that component is collected: which Categraf file to edit,
what each setting means, what prerequisites exist. For MySQL it tells you to write
`conf/input.mysql/mysql.toml` and gives you a config you can copy wholesale:

```toml
[[instances]]
address = "127.0.0.1:3306"
username = "root"
password = "1234"

# turn on for the full set of global status metrics
extra_status_metrics = true
# replication state matters, so it is collected by default
gather_slave_status = true

# a globally unique identifier attached to every metric of this instance
labels = { instance="n9e-10.2.3.4:3306" }
```

Three steps to apply it:

1. Create `conf/input.mysql/mysql.toml` under the Categraf directory, paste the config, and change
   the address and credentials to yours;
2. Test-run it once to check both the config and the connection:
   ```bash
   ./categraf --test --inputs mysql
   ```
3. Restart Categraf to pick it up.

The Instructions tab is **documentation for a human, not a config pushed to the agent** — the
open-source edition does not deliver it to your hosts, so that last mile is yours (or the wizard's).

The **Edit** button on that tab has no effect on the 86 bundled components: their content comes from
the `integrations` directory Nightingale ships with, and edits are not persisted.

## What the command does

The wizard's command is not a black box. It does three things:

1. Writes `conf/input.<plugin>/<plugin>.toml`, **backing up any existing file**;
2. Test-runs the plugin with `categraf --test`, and stops there if it fails;
3. Restarts Categraf once the test passes.

So a broken config stops at step 2 rather than leaving you with an agent that won't start.

## Next

- Install this component's dashboards and rules too: [Import dashboards and rules](./import.md)
- Confirm the metrics really arrived: [Verify incoming data](./verify.md)
- Writing plugin configs by hand: [Input plugins](../categraf/plugins.md)
- Nothing showed up: [Categraf troubleshooting](../categraf/troubleshooting.md)
