# Data write protocols

Prometheus Remote Write, OpenTSDB, Datadog and Falcon: endpoints, payloads and label handling.

The ingest side is called Pushgw and lives inside the Center process (it can also run on its own as `n9e-pushgw`). **It does not store data long-term** — what arrives is forwarded to one or more TSDBs per `[[Pushgw.Writers]]`, plus the embedded TSDB when that is on.

You do not have to use it. Your existing Prometheus can keep scraping while Nightingale only queries, and alerting works the same. The difference between the two shapes is in [Where it fits](https://n9e.github.io/docs/get-started/where-it-fits.md).

## Endpoints[​](#endpoints "Direct link to Endpoints")

All on Center's port 17000:

| Protocol                | Endpoint                      | Who uses it                                  |
| ----------------------- | ----------------------------- | -------------------------------------------- |
| Prometheus Remote Write | `POST /prometheus/v1/write`   | Categraf, Prometheus, vmagent, Grafana Agent |
| OpenTSDB                | `POST /opentsdb/put`          | Legacy OpenTSDB pipelines                    |
| Open-Falcon             | `POST /openfalcon/push`       | Collectors migrated from Open-Falcon         |
| Datadog                 | `POST /datadog/api/v1/series` | Datadog Agent                                |
| Collector heartbeat     | `POST /v1/n9e/heartbeat`      | Categraf — this is what fills the host list  |

The Datadog Agent also hits `/datadog/api/v1/check_run`, `/datadog/api/v1/metadata` and `/datadog/intake/`, all of which Nightingale accepts.

## Authentication[​](#authentication "Direct link to Authentication")

The write endpoints are governed by `[HTTP.APIForAgent]`, which is on by default and **requires no authentication**. To add basic auth:

```
[HTTP.APIForAgent]

Enable = true

[HTTP.APIForAgent.BasicAuth]

user001 = "<your own password>"
```

The sample credentials shipped in the config file are public knowledge — do not keep them.

Set the matching credentials on the collector side, e.g. Categraf's `[[writers]] basic_auth_user` and `basic_auth_pass`.

## How labels are handled[​](#how-labels-are-handled "Direct link to How labels are handled")

* Labels already on a series in the Remote Write payload are **kept as they are**;
* Categraf's `[global.labels]` are attached to every series it sends;
* `hostname` (or `agent_hostname`) becomes the host identifier in the host list, which is the `ident` label you will match on in rules and events;
* Pushgw can drop named samples — see the `DropSample` settings under `[Pushgw]`.

## Where it forwards to[​](#where-it-forwards-to "Direct link to Where it forwards to")

```
[[Pushgw.Writers]]

Url = "http://victoriametrics:8428/api/v1/write"



# several are allowed; each gets a copy

[[Pushgw.Writers]]

Url = "http://prometheus:9090/api/v1/write"
```

Forwarding to Prometheus requires **Prometheus to be started with `--web.enable-remote-write-receiver`** (older versions: `--enable-feature=remote-write-receiver`). Without it `/api/v1/write` is not listening at all and Nightingale's forwarding gets a 404.

The embedded TSDB and an external one can be written at the same time — that overlap is the migration window, see [External TSDB and dual-write migration](https://n9e.github.io/docs/install/external-tsdb.md).

## Related[​](#related "Direct link to Related")

* [Categraf remote write](https://n9e.github.io/docs/data/categraf/remote-write.md)
* [Pushgw queue and dual write](https://n9e.github.io/docs/operations/pushgw.md)
* [Ports and network flows](https://n9e.github.io/docs/reference/ports.md)
