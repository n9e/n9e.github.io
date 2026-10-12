---
title: "CLI reference"
sidebar_label: "CLI reference"
description: "The command line is thin: every process takes three flags, configuration lives in the toml files under etc/, and there are no subcommands for managing rules."
last_reviewed: 2026-10-10
---

Nightingale's command line is **thin** — configuration lives in the toml files under `etc/`, and
there are three flags. There are no subcommands for managing alert rules and the like; that is what
the [HTTP API](./http-api.md) is for.

## The four service processes

`n9e` (Center), `n9e-alert`, `n9e-pushgw` and `n9e-edge` take exactly the same flags:

| Flag | Meaning | Default |
|---|---|---|
| `--configs <dir>` | Configuration directory. Also settable as `N9E_CONFIGS` | `etc` |
| `--crypto-key <key>` | Key for decrypting encrypted fields in the config file | empty |
| `--version` | Print the version and exit | |

```bash
./n9e --configs /etc/n9e
N9E_CONFIGS=/etc/n9e ./n9e
./n9e --version
```

A process needs only the `etc/` and `integrations/` directories next to the binary.

## `n9e-cli` is not an operations tool

The `n9e-cli` in the release does **one thing: migrate v5 configuration to v6**.

| Flag | Meaning |
|---|---|
| `--config <path>` | Path to a v5.x `webapi.conf` |
| `--upgrade` | Run the migration |
| `--version` | Print the version |

Useful if you are still on v5, irrelevant otherwise.

## Building from source

```bash
make            # download and embed the frontend, then build center
make build      # build center only (when the frontend is already embedded)
make build-edge
make build-alert
make build-pushgw
make build-cli
```

`make` starts with `fe.sh`, which copies `docker/initsql/a-n9e.sql` to `n9e.sql`, downloads the
frontend release from GitHub **only when `./pub` does not exist**, and then embeds `pub/` into
`front/statik` with `statik`. Drop your own `pub/` in place and nothing is downloaded.

## Related

- [Configuration reference](./configuration.md)
- [HTTP API](./http-api.md)
- [Binary packages](../install/binary.md)
