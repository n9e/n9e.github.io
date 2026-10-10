---
title: "Install and register"
sidebar_label: "Install and register"
description: "Install the agent, set the Nightingale write URL, and confirm the host shows up under Targets."
---

Where this page ends: Categraf running on the target host, that host visible under
**Infrastructure → Hosts**, with CPU, memory and OS metadata attached. About five minutes.

[Categraf](https://github.com/flashcatcloud/categraf) is the collector Nightingale recommends: one
binary, 90-odd input plugins, pushing metrics over Prometheus Remote Write. Nightingale collects
nothing itself.

## Before you start

- The target host **can reach the Nightingale address** (`http://<nightingale>:17000` by default);
- Root access;
- Nightingale is up — if not, start at [Quick start](../../get-started/quick-start.md).

## Path 1: one-click install from the Hosts page

**Infrastructure → Hosts**, then **Install Categraf** at the top right.

**1. Check the server address.** The first field is **Nightingale address**, defaulting to what the
server detected for itself. **The monitored host must be able to reach it** — behind a reverse proxy
this is often wrong (a dropped port, or https flattened to http), so correct it if it is.

**2. Copy the command and run it on the target host as root.** It looks like this:

```bash
curl -sSfL 'http://10.0.0.10:17000/api/n9e/agents/categraf/install.sh' \
  | sudo bash -s -- --server 'http://10.0.0.10:17000' --download-base 'http://10.0.0.10:17000'
```

If the server has basic auth enabled, the dialog shows a username and password pair and folds them
into the command as `-u` and `--auth` — without them the installed agent cannot report.

If piping into bash makes you uncomfortable, **Advanced** offers the stepwise version: download,
read it with `less`, then run it.

The dialog also tells you where the package comes from: *"The package is served by nightingale
itself; the host needs no internet access"* means it is bundled, while *"No bundled package on this
server"* means the host needs internet access.

**3. Wait for it to report.** The second step polls every 5 seconds; *"N new host(s) reported"*
means you are done. Close the dialog and the host list refreshes.

Windows hosts do not use this path — install by hand.

## Path 2: install it by hand

Download the archive for your architecture from
[GitHub Releases](https://github.com/flashcatcloud/categraf/releases):

```bash
mkdir -p /opt/categraf && cd /opt/categraf
# e.g. categraf-v0.5.17-linux-amd64.tar.gz
tar xzf categraf-<version>-linux-amd64.tar.gz --strip-components=1
```

That gives you the `categraf` binary plus a `conf/` directory holding `config.toml`, `logs.toml` and
a set of `input.<plugin>/` subdirectories.

## The two settings that matter: writers and heartbeat

Edit `conf/config.toml`. Only two places need changing. **The sample config ships pointing at
a development host left over from packaging — you must replace it.**

```toml
[[writers]]
# metrics go here. In edge mode, point this at n9e-edge instead
url = "http://10.0.0.10:17000/prometheus/v1/write"
basic_auth_user = ""
basic_auth_pass = ""
timeout = 5000
dial_timeout = 2500
max_idle_conns_per_host = 100

[heartbeat]
enable = true
# the heartbeat lands here; it is what puts the host in the Hosts list
url = "http://10.0.0.10:17000/v1/n9e/heartbeat"
interval = 10
```

They do different jobs, and dropping either one costs you something:

| Configuration | What you lose |
|---|---|
| Heartbeat off only | The host still appears (recognised from its metrics), but CPU, memory and OS metadata all read as unknown |
| Writers off only | Metadata is complete but there are no metrics, and the tags attached to the host cannot be applied to any series |
| Both off | The host does not appear at all |

Nightingale's agent endpoints (write and heartbeat) are **unauthenticated by default**, so leave
`basic_auth_user` / `basic_auth_pass` empty. Fill them in only when the server has BasicAuth enabled
under `[HTTP.APIForAgent]`.

Two more settings worth doing while you are here:

```toml
[global]
# collection interval, seconds
interval = 15
# machine name; empty means os.Hostname(). Supports $hostname / $ip / $sn and env vars
hostname = ""

[global.labels]
# labels attached to every metric from this host
# region = "bj"
# env = "prod"
```

`hostname` is this machine's **unique identity** in Nightingale (the **Identifier** column in the
host list). Two machines sharing a hostname collapse into one record whose metadata flips back and
forth on alternating heartbeats — **and nothing warns you**. Keep it globally unique.

## Run it as a service

Categraf manages its own service registration; there is no unit file to write:

```bash
cd /opt/categraf
./categraf --install     # generates and registers a systemd service named categraf
./categraf --start
./categraf --status
```

The generated unit sets `WorkingDirectory` to the binary's directory, passes
`-configs <dir>/conf`, and uses `Restart=on-failure`. `--remove` unregisters it.

Logs go to stdout by default, which under systemd means the journal:

```bash
journalctl -u categraf -n 50
```

To write to a file instead, set `[log] file_name` in `conf/config.toml` to a path (rotation is
handled for you).

**One trap worth knowing**: at startup Categraf changes its working directory to the directory
holding its own binary. So a relative `--configs` resolves against **the binary's directory**, not
your shell's. When calling it from anywhere else, always use absolute paths:

```bash
/opt/categraf/categraf --configs /opt/categraf/conf --test --inputs cpu
```

## Confirm the host shows up under Hosts

**Infrastructure → Hosts** should now show a row whose **Identifier** is your hostname.

These columns come from the heartbeat, so they tell you at a glance whether it is getting through:

| Column | Meaning |
|---|---|
| Status | Heartbeat freshness |
| Agent version | The categraf version |
| Reported tags | Whatever is in `[global.labels]` |
| Updated at | The most recent heartbeat |
| Memory / CPU | Metadata; unknown here means the heartbeat is not arriving |
| Time offset | The Nightingale server's clock minus this host's clock |
| Source IP | Where the heartbeat request came from |

The Alive / Dead / Unknown counters in the left-hand overview find problem hosts quickly.

Then confirm metrics arrived too: **Explorer → Metrics**, source `embedded-tsdb`, and query:

```promql
cpu_usage_active
```

A line carrying an `agent_hostname` label means both paths work.

## Next

- Start collecting middleware and databases: [Input plugins](./plugins.md)
- Onboard a whole component at once: [Install collector configuration](../integrations/collector-config.md)
- The write path in detail: [Remote write](./remote-write.md)
- No host, or no data: [Troubleshooting](./troubleshooting.md)
