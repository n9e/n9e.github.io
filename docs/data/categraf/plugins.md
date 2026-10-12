# Input plugins

Categraf ships over ninety input plugins; a config file in conf/input.\<name> enables one, and a single plugin can run alone in the foreground for testing.

Categraf ships more than ninety input plugins covering operating systems, databases, middleware, network probes and containers. This page covers how to turn one on, where its config lives, and how to run it in the foreground to check it.

## Where the config files live[​](#where-the-config-files-live "Direct link to Where the config files live")

Everything sits under `conf/`, one directory per plugin:

```
/opt/categraf/

├── categraf

└── conf/

    ├── config.toml            # global: writers, heartbeat, global

    ├── logs.toml              # log collection, off by default

    ├── input.cpu/cpu.toml

    ├── input.mem/mem.toml

    ├── input.mysql/mysql.toml

    └── input.<plugin>/...
```

The directory must be named `input.<plugin>`, where the plugin name is Categraf's own identifier (`mysql`, `redis`, `http_response`, …). Every `.toml` / `.yaml` / `.yml` / `.json` file inside is **read and concatenated**, so splitting one plugin's config across several files is fine.

`*.toml` files sitting **directly** in `conf/` are treated as global config — that is how `config.toml` and `logs.toml` get loaded.

## What counts as enabled[​](#what-counts-as-enabled "Direct link to What counts as enabled")

**The directory is the switch.** Not an `enable = true` setting, and not the presence of a file — an entirely empty `conf/input.mem/` directory still starts the `mem` plugin with its defaults.

Conversely, to stop collecting something, **delete or rename the whole `input.<plugin>/` directory**.

The startup log tells you the outcome directly:

```
I! input: local.cpu started

I! input: local.mem started

E! input: local.nosuchplugin not supported
```

`not supported` means the directory name matches no compiled-in plugin. The bundled `input.jolokia_agent_kafka/`, `input.jolokia_agent_misc/` and `input.amd_rocm_smi/` are exactly this case — sample configs rather than usable plugin names. Delete them.

## Plugin-level and instance-level plugins[​](#plugin-level-and-instance-level-plugins "Direct link to Plugin-level and instance-level plugins")

Two shapes, distinguished by whether the config has `[[instances]]`:

**Without `[[instances]]`** — `cpu`, `mem`, `disk`, `system`. They read the local machine, connect to nothing, and their config is essentially just an `interval`:

```
# conf/input.cpu/cpu.toml

# interval = 15

# collect_per_cpu = false
```

**With `[[instances]]`** — `mysql`, `redis`, `http_response`. They connect to something, so you write one block per target. Double brackets are TOML's array syntax:

```
# conf/input.mysql/mysql.toml

[[instances]]

address = "10.2.3.4:3306"

username = "categraf"

password = "xxxxxx"

extra_status_metrics = true

gather_slave_status = true

labels = { instance = "n9e-mysql-01" }



[[instances]]

address = "10.2.3.5:3306"

username = "categraf"

password = "xxxxxx"

labels = { instance = "n9e-mysql-02" }
```

The `instance` label matters: it must be **globally unique**, because the bundled dashboards and alert rules use it to tell instances apart.

**An easy trap**: if an instance plugin is missing a required field (mysql's `address` still commented out, say), the plugin produces **no log line at all** — no error, no `started`. Only `--debug` reveals it:

```
W! no instances for input:mysql
```

Every bundled sample config **ships fully commented out**, which is exactly this state. So "I have an `input.mysql` directory, why is there no data" almost always means no field in `[[instances]]` was filled in.

## Keys every plugin understands[​](#keys-every-plugin-understands "Direct link to Keys every plugin understands")

Whatever the plugin, these keys work:

| Key                   | Level    | Meaning                                                                                        |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `interval`            | plugin   | This plugin's collection period, in seconds. Falls back to `[global] interval` (15 by default) |
| `interval_times`      | instance | Effective period = global interval × this multiplier                                           |
| `labels`              | either   | Extra labels. A value of `"-"` **removes** that label                                          |
| `metrics_pass`        | either   | Allow-list with wildcards; only matching metrics survive                                       |
| `metrics_drop`        | either   | Deny-list; matching metrics are dropped                                                        |
| `metrics_name_prefix` | either   | Prefix added to metric names                                                                   |
| `processor_enum`      | either   | Enum mapping, turning string states into numbers                                               |
| `relabel_configs`     | either   | Prometheus-style relabelling                                                                   |

Labels merge in this order: instance `labels` → `[global.labels]` (only for keys not already set) → `agent_hostname` (only if unused and `omit_hostname = false`).

Trimming with `metrics_drop` is the cheapest optimisation there is — for instance dropping Go runtime metrics from a Prometheus scrape:

```
[[instances]]

urls = ["http://localhost:9100/metrics"]

ignore_metrics = ["go_*", "process_*"]
```

## Running one plugin in the foreground[​](#running-one-plugin-in-the-foreground "Direct link to Running one plugin in the foreground")

After editing a config, test-run it rather than restarting blind:

```
/opt/categraf/categraf --configs /opt/categraf/conf --test --inputs mysql
```

* Give `--configs` an **absolute path**. Categraf changes its working directory to the binary's own directory at startup, so a relative path rarely resolves where you think;
* `--inputs` runs only the plugins listed, separated by **colons**: `--inputs cpu:mem:mysql`;
* `--test` prints collected metrics to stdout and **sends nothing to the writers**.

The output is timestamp, wall clock, metric name, sorted labels, value:

```
1788432166 18:42:46 cpu_usage_active agent_hostname=n9e-web-01 cpu=cpu-total env=prod 90.40

1788432151 18:42:31 mem_used_percent agent_hostname=n9e-web-01 env=prod 79.85
```

Two things to watch:

1. **The process never exits.** Ctrl-C once you have seen output. Plugins that need a delta (cpu) produce nothing on the first cycle — wait for the second;
2. **`--test` does not disable the heartbeat.** It still reports according to `[heartbeat]`, so a casual `--test` creates or refreshes a host in the Hosts list. To avoid that, set `[heartbeat] enable = false` first, or use a separate conf directory.

`--debug` prints the same lines, with one difference: **`--debug` still ships them**. Use `--debug` to investigate a live problem, `--test` to validate a config.

To apply a config change without a restart:

```
systemctl reload categraf      # equivalent to sending the process SIGHUP
```

## Serving configs from a central place[​](#serving-configs-from-a-central-place "Direct link to Serving configs from a central place")

Rather than editing files host by host, Categraf can pull its config over HTTP:

```
[global]

providers = ["http"]



[http_provider]

remote_url = "http://config-server/categraf/configs"

timeout = 5

reload_interval = 120
```

It periodically issues `GET <remote_url>?agent=categraf&host=<hostname>` and rebuilds its inputs from the response. `providers` accepts only `local` and `http`; anything else panics at startup.

Note this is Categraf's own feature, not a service Nightingale provides — you implement the config server. For pushing collector config from the Nightingale side, see [Install collector configuration](https://n9e.github.io/docs/data/integrations/collector-config.md).

## Next[​](#next "Direct link to Next")

* Onboard a component in one go (config + dashboards + rules): [Install collector configuration](https://n9e.github.io/docs/data/integrations/collector-config.md)
* Where metrics go and how: [Remote write](https://n9e.github.io/docs/data/categraf/remote-write.md)
* Plugin errors, missing data: [Troubleshooting](https://n9e.github.io/docs/data/categraf/troubleshooting.md)
