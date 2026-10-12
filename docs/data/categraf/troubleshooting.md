---
title: "Categraf troubleshooting"
sidebar_label: "Troubleshooting"
description: "Categraf problems come in three symptoms — host missing, host present but no metrics, one plugin silent — and the log has the answer, even for errors not marked E!."
last_reviewed: 2026-10-10
---

Almost every Categraf-side problem is visible in the log — provided you know where to look and
**which errors are not logged at `E!` level**. This page is organised by symptom: the host doesn't
appear, the host is there but has no metrics, one plugin has no data.

## Start with the log

`[log] file_name` defaults to `"stdout"`, which under systemd means the journal:

```bash
journalctl -u categraf -n 100 --no-pager
journalctl -u categraf -f          # follow
```

To write to a file instead, edit `conf/config.toml`:

```toml
[log]
file_name = "/var/log/categraf/categraf.log"
max_size = 100     # MB
max_age = 1        # days
max_backups = 1
```

The level is the first token on each line: `I!` info, `W!` warning, `E!` error, `F!` fatal.

**Here is the trap: write failures are logged at `W!`, not `E!`.** Grepping only for `E!` misses the
single most common problem — data that never leaves the host. Search for `W!`, or for `push data`:

```bash
journalctl -u categraf | grep -E 'W!|E!|F!'
```

Also: **the line about a config that failed to load goes to stderr regardless of `[log]`.** If you
redirected logs to a file, the process won't start, and the file is empty, look at stderr (the
journal has it):

```
F! failed to init config: ...
```

## The host does not appear in the host list

In order:

**1. Is the process alive?**

```bash
systemctl status categraf
```

**2. Is the heartbeat enabled?** In `conf/config.toml`:

```toml
[heartbeat]
enable = true
url = "http://10.0.0.10:17000/v1/n9e/heartbeat"
```

**The bundled sample points at a development host left over from packaging, which will never be yours** — forgetting to change it
is the most common cause of all.

**3. Is the heartbeat getting out?** Search the log for:

```
E! failed to do heartbeat: ...
E! heartbeat status code: 401  response: ...
```

- **connection refused / timeout** — a network problem; try `curl -v <nightingale>` from this host;
- **401** — the server has BasicAuth on, so `[heartbeat] basic_auth_user/pass` must be filled in;
- **404** — the wrong URL; the path must be `/v1/n9e/heartbeat`. It can also mean the server has
  `[HTTP.APIForAgent] Enable` turned off.

**4. No log lines at all?** Run it in the foreground with just the heartbeat:

```bash
/opt/categraf/categraf --configs /opt/categraf/conf --debug --inputs heartbeat
```

**5. It appeared and then vanished.** Check for a hostname collision — two machines sharing a
hostname produce a single record whose metadata alternates between them, **with no warning at all**.
Watch whether the **Source IP** and **Agent version** columns flip between two values.

## The host is there but there are no metrics

Heartbeat and write are two independent paths; one working says nothing about the other.

**1. Is the write URL right?**

```toml
[[writers]]
url = "http://10.0.0.10:17000/prometheus/v1/write"
```

The path is `/prometheus/v1/write`, not `/prometheus/api/v1/write` — that second one is a time
series database endpoint, not Nightingale's pushgw.

**2. Are there write failures in the log?** One failure produces three lines, all `W!`:

```
W! push data with remote write request got error: Post "http://...": dial tcp ...: connection refused response body:
W! post to http://... got error: ...
W! example timeseries: labels:<name:"__name__" value:"mem_total" > ...
```

The third line samples one series from the failed batch, showing what was lost. A non-2xx response
reads:

```
W! post to <url> got error: push data with remote write request got status code: 401, response body:
```

**Remember there is no retry** — that batch is gone. So when you see these lines, fixing the cause
does not bring the missing window back.

**3. The queue is full.**

```
E! write 1000 samples failed, please increase queue size(1000000)
```

You are producing faster than you can ship. **Check whether the backend is slow or unreachable
first**; raising `[writer_opt] chan_size` while the backend is down only delays the loss.

**4. You are querying the wrong source.** Metrics went into A, you looked in B. They land in the
embedded store (data source `embedded-tsdb`) by default; with `Pushgw.Writers` configured, query the
forwarded-to source instead.

## One plugin has no data

**1. Is the plugin enabled?** Look in the startup log:

```
I! input: local.mysql started
E! input: local.jolokia_agent_kafka not supported
```

`not supported` means the `conf/input.<name>/` directory matches no plugin. The bundled
`input.jolokia_agent_kafka/`, `input.jolokia_agent_misc/` and `input.amd_rocm_smi/` are exactly
that — delete them.

**2. No log line at all?** That is the classic instance-plugin symptom: with a required field unset,
the plugin is skipped silently — **no error and no `started`**. Only `--debug` shows it:

```
W! no instances for input:mysql
```

Every bundled sample config ships fully commented out, so "I have an `input.mysql` directory but no
data" almost always means no field in `[[instances]]` was filled in.

**3. Test-run it on its own.**

```bash
/opt/categraf/categraf --configs /opt/categraf/conf --test --inputs mysql
```

Give `--configs` an **absolute path**: Categraf changes its working directory to the binary's own
directory at startup, so a relative path resolves under the install directory, not your shell's.

Metric lines mean the plugin is fine and the problem is on the write side. No lines means it cannot
reach the target or lacks permission, and the error usually says which.

While you are here: **`--test` does not disable the heartbeat**, so running it casually on a
production host still refreshes that host's record in the host list.

**4. A plugin panic.**

```
E! mysql : gather metrics panic: ... <stack>
```

The panic is recovered, the reader survives, and collection resumes next interval. Take the stack to
[categraf issues](https://github.com/flashcatcloud/categraf/issues).

## The data arrived but the labels are wrong

- **`agent_hostname` is missing** — `[global] omit_hostname` is true, or the plugin's `labels`
  explicitly occupies that key;
- **To remove a label**, set its value to `"-"`, e.g. `labels = { region = "-" }`;
- **Host tags set in Nightingale don't appear on the metrics** — those are applied by Nightingale as
  it forwards, so Categraf must write to Nightingale (not straight to a TSDB), and the server's
  `Pushgw.LabelRewrite` must be on;
- **A reported tag and a custom tag share a key** — the reported one wins and the custom one is
  dropped.

## A checklist

For a freshly installed host with no data, this order usually pins it down:

1. `systemctl status categraf` — is the process alive;
2. `journalctl -u categraf | grep -E 'W!|E!|F!'` — anything obviously broken;
3. Are the two URLs in `conf/config.toml` still the addresses the sample shipped with;
4. `curl -v <nightingale>` from this host — is the network open;
5. Is the host in the host list, and what do Updated at and Status show;
6. `categraf --configs <absolute path> --test --inputs <plugin>` — can the plugin collect at all;
7. In **Explorer → Metrics**, query `{agent_hostname="<hostname>"}` — and try another data source.

One more for container deployments: **the image's `N9E_HOST` environment variable does nothing** (the
placeholder address its entrypoint substitutes no longer exists in the current `config.toml`), so
mount or edit `config.toml` yourself.

## Next

- The host shows as dead: [Categraf offline](../../troubleshooting/categraf-offline.md)
- The source connects but returns nothing: [No data](../../troubleshooting/no-data.md)
- The write path in detail: [Remote write](./remote-write.md)
- Plugin configuration in detail: [Input plugins](./plugins.md)
