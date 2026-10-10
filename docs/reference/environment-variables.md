---
title: "Environment variables"
sidebar_label: "Environment variables"
description: "The environment variables Nightingale reads, and why config keys cannot be overridden that way."
---

**First, the thing to be clear about: Nightingale has no mechanism for overriding arbitrary config
keys from the environment.** There is no `N9E_DB_DSN`. Configuration comes from the toml files under
`etc/` and nowhere else.

The containerised answer is to **mount a config file**, not to pile up environment variables — which
is exactly what the compose bundles do (`./etc-nightingale:/app/etc`).

## Variables Nightingale reads

| Variable | Purpose | Default |
|---|---|---|
| `N9E_CONFIGS` | Center's config directory; same as `--configs` | `etc` |
| `N9E_ALERT_CONFIGS` | Config directory for `n9e-alert` | `etc` |
| `N9E_PUSHGW_CONFIGS` | Config directory for `n9e-pushgw` | `etc` |
| `N9E_EDGE_CONFIGS` | Config directory for `n9e-edge` | `etc/edge` |
| `N9E_PROXY_URL` | Proxy for outbound HTTP | empty |
| `N9E_GRAFANA_IMPORT_ALLOWLIST` | Allowed addresses when importing from Grafana | empty |
| `N9E_SKILL_GATEWAY` | Egress gateway socket for the Skill sandbox (Linux sandbox) | empty |

## Variables you will see in the compose bundles

These belong to **other containers**, not to Nightingale — worth knowing when reading a compose
file:

| Variable | Belongs to |
|---|---|
| `MYSQL_ROOT_PASSWORD` | the mysql container |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `PGDATA` | the postgres container |
| `WAIT_HOSTS` | the wait-for-dependencies entrypoint |
| `HOST_PROC` / `HOST_SYS` / `HOST_MOUNT_PREFIX` | the categraf container, for collecting from the host |
| `GIN_MODE` / `TZ` | generic |

## Varying configuration per environment

Three approaches, best first:

1. **One config file per environment**, selected with `N9E_CONFIGS` or `--configs`. Plainest, and
   the easiest to audit.
2. **Template plus render at start**: have the container entrypoint substitute variables into the
   toml (envsubst or similar) before launching the process.
3. **Encrypted fields**: store sensitive values encrypted in the config file against a
   `--crypto-key`, and keep the key itself in the environment or a secret manager. See
   [Secret management](../security/secrets.md).

## Related

- [Configuration reference](./configuration.md)
- [CLI reference](./cli.md)
- [Docker Compose](../install/docker-compose.md)
