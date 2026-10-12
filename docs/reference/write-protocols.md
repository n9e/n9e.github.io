---
title: "Data write protocols"
sidebar_label: "Data write protocols"
description: "Prometheus Remote Write, OpenTSDB, Datadog and Falcon: endpoints, payloads and label handling."
last_reviewed: 2026-10-10
---

The ingest side is called Pushgw and lives inside the Center process (it can also run on its own as
`n9e-pushgw`). **It does not store data long-term** — what arrives is forwarded to one or more TSDBs
per `[[Pushgw.Writers]]`, plus the embedded TSDB when that is on.

You do not have to use it. Your existing Prometheus can keep scraping while Nightingale only
queries, and alerting works the same. The difference between the two shapes is in
[Where it fits](../get-started/where-it-fits.md).

## Endpoints

All on Center's port 17000:

| Protocol | Endpoint | Who uses it |
|---|---|---|
| Prometheus Remote Write | `POST /prometheus/v1/write` | Categraf, Prometheus, vmagent, Grafana Agent |
| OpenTSDB | `POST /opentsdb/put` | Legacy OpenTSDB pipelines |
| Open-Falcon | `POST /openfalcon/push` | Collectors migrated from Open-Falcon |
| Datadog | `POST /datadog/api/v1/series` | Datadog Agent |
| Collector heartbeat | `POST /v1/n9e/heartbeat` | Categraf — this is what fills the host list |

The Datadog Agent also hits `/datadog/api/v1/check_run`, `/datadog/api/v1/metadata` and
`/datadog/intake/`, all of which Nightingale accepts.

## Authentication

The write endpoints are governed by `[HTTP.APIForAgent]`, which is on by default and **requires no
authentication**. To add basic auth:

```toml
[HTTP.APIForAgent]
Enable = true
[HTTP.APIForAgent.BasicAuth]
user001 = "<your own password>"
```

The sample credentials shipped in the config file are public knowledge — do not keep them.

Set the matching credentials on the collector side, e.g. Categraf's `[[writers]] basic_auth_user`
and `basic_auth_pass`.

## How labels are handled

- Labels already on a series in the Remote Write payload are **kept as they are**;
- Categraf's `[global.labels]` are attached to every series it sends;
- `hostname` (or `agent_hostname`) becomes the host identifier in the host list, which is the
  `ident` label you will match on in rules and events;
- Pushgw can drop named samples — see the `DropSample` settings under `[Pushgw]`.

## Where it forwards to

```toml
[[Pushgw.Writers]]
Url = "http://victoriametrics:8428/api/v1/write"

# several are allowed; each gets a copy
[[Pushgw.Writers]]
Url = "http://prometheus:9090/api/v1/write"
```

Forwarding to Prometheus requires **Prometheus to be started with
`--web.enable-remote-write-receiver`** (older versions: `--enable-feature=remote-write-receiver`).
Without it `/api/v1/write` is not listening at all and Nightingale's forwarding gets a 404.

The embedded TSDB and an external one can be written at the same time — that overlap is the
migration window, see [External TSDB and dual-write migration](../install/external-tsdb.md).

## Related

- [Categraf remote write](../data/categraf/remote-write.md)
- [Pushgw queue and dual write](../operations/pushgw.md)
- [Ports and network flows](./ports.md)
