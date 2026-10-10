---
title: "Offline deployment"
sidebar_label: "Offline deployment"
description: "Install on hosts without internet access: packages, images and integration templates to fetch in advance."
---

Once installed, Nightingale needs no internet of its own — the release package is self-contained,
carrying the integration templates, the built-in dashboards, even the collector installer. The only
thing to plan is how to get the package inside.

## What to fetch in advance

Download these on a machine with internet access, then copy them across:

| Item | Where from | Notes |
|---|---|---|
| `n9e-v<version>-linux-<arch>.tar.gz` | GitHub releases | ~280 MB, already contains `etc/`, `integrations/`, `agents/categraf/` |
| `checksums.txt` | Same | Verify it on the inside; do not install a truncated package |
| MySQL / Redis media | Your own channel | Not needed if you use instances you already run |
| External TSDB | Your own channel | Not needed if you use the embedded store |

For Docker, pull and `docker save` the images too:

```bash
docker pull flashcatcloud/nightingale:9.1.1
docker pull flashcatcloud/categraf:latest
docker save flashcatcloud/nightingale:9.1.1 flashcatcloud/categraf:latest -o n9e-images.tar
```

The compose bundles also use `mysql:8`, `redis:6.2` and `victoriametrics/victoria-metrics` — pull
whatever the bundle you picked lists.

## From the binary package

Once the file is inside, the steps are **exactly the same** as online — see
[Binary packages](./binary.md): extract, edit `etc/config.toml`, add the systemd unit, start.

Three things are worth confirming, because they are the parts you never notice when online:

- **the schema needs no network.** `n9e` runs AutoMigrate at startup and downloads nothing;
- **the integration templates are already in the package.** `integrations/` holds the dashboards,
  alert rules and collector configs shipped with the version, and that is what the templates page
  reads;
- **so is the collector installer.** `agents/categraf/` carries the categraf packages for the
  version, and the install command shown in the UI downloads from Nightingale's own port 17000, not
  from GitHub.

**Expected result**: on a fully disconnected machine, `./n9e` starts, the login works, the templates
page lists the built-in templates, and the collector can be downloaded.

## From Docker

```bash
docker load -i n9e-images.tar
```

Then follow [Docker Compose](./docker-compose.md), replacing every `image:` with the tags you
loaded and dropping `:latest` — it means nothing offline and invites a pull failure on the next
restart.

## Building from source

Building on the inside works too, with one thing to watch in `fe.sh`: **when `./pub` does not exist,
it downloads the frontend bundle from GitHub**. Extract the frontend package into `pub/` at the
repository root beforehand and `make` stays offline:

```bash
tar zxf n9e-fe-<version>.tar.gz    # produces pub/
make
```

Go modules are the same story — `go mod download` in advance, or point at an internal module proxy.

## What still needs the internet afterwards

None of this blocks the install, but it decides what you can use:

| Feature | Needs to reach |
|---|---|
| Notification channels | DingTalk, Feishu, WeCom, mail and SMS gateway endpoints |
| Nightingale AI | The LLM API endpoint; a self-hosted model on the internal network is fine |
| Alert callbacks and workflows | The callback targets |
| Upgrading | Repeating the download-and-carry step each time |

At startup the process also detects its outbound IP to build its instance identity. That is only a
routing-table lookup — no packets are sent and no connectivity is required; when it fails, the
hostname is used instead. To remove the uncertainty entirely, set `[Alert.Heartbeat] IP` explicitly.

## Next

- [Binary packages](./binary.md)
- [Upgrade](./upgrade.md) — offline upgrades start with the same carry step
- [Production readiness checklist](../get-started/production-checklist.md)
