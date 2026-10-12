---
title: "HTTP API"
sidebar_label: "HTTP API"
description: "The API the UI runs on: authentication, endpoints by object, and why there is no OpenAPI document."
last_reviewed: 2026-10-11
---

The Nightingale web UI **runs entirely on a public HTTP API** — everything you can do in the
interface has an endpoint behind it. That is good news: automation does not need a second API, it
uses the same one the UI does.

**There is no OpenAPI / Swagger document today.** The authority is the routing table itself,
`ccfos/nightingale/center/router/router.go`, where all 413 `/api/n9e/*` endpoints are registered.
The fastest way to find the endpoint for an action is to **open your browser's network panel and
perform the action in the UI**.

## Two groups

| Group | Prefix | Auth | Purpose |
|---|---|---|---|
| Page API | `/api/n9e/*` | JWT or `X-User-Token` | What people and automation use — 413 endpoints |
| Service API | `/v1/n9e/*` | basic auth | For integrating external systems — 91 endpoints, off by default |

The service API is governed by `[HTTP.APIForService]`, `Enable = false` by default. Edge mode
requires turning it on.

<span id="搞定认证" />

## Authentication

**Prefer a personal token.** Generate one from the avatar menu; it is long-lived until deleted:

```bash
curl -H "X-User-Token: <token>" \
     http://n9e:17000/api/n9e/busi-groups
```

Or exchange credentials for a JWT:

```bash
curl -X POST http://n9e:17000/api/n9e/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"username":"root","password":"<password>"}'
# take dat.access_token from the response, then send Authorization: Bearer <token>
```

**A token has no permissions of its own** — it acts as its owner. Generate automation tokens from a
dedicated least-privilege account; see [Tokens and credential rotation](../security/tokens.md).

## Response shape

Both success and failure return 200; the `err` field in the body is what distinguishes them:

```json
{"dat": {...}, "err": "", "request_id": "..."}
{"err": "some message", "request_id": "..."}
```

List endpoints return `dat` in **two different shapes**, and a script has to handle both: sometimes
a bare array, sometimes `{"list": [...], "total": N}`.

## Warning: a status code does not prove an endpoint exists

**An unmatched `/api/n9e/*` path returns 200 and an HTML page** — the single-page app's entry point,
not a 404. So:

```bash
# this proves nothing; a typo returns 200 too
curl -o /dev/null -w '%{http_code}' http://n9e:17000/api/n9e/does-not-exist
```

To tell whether an endpoint exists, check that the response is JSON, or read the routing table.
This trap comes back in [troubleshooting](../troubleshooting/no-data.md).

## Common endpoints

By object; the routing table has the complete list:

| Object | Endpoints |
|---|---|
| Business groups | `GET/POST /busi-groups`, `PUT/DELETE /busi-group/:id` |
| Alert rules | `GET/POST /busi-group/:id/alert-rules`, `POST /busi-group/:id/alert-rules/import`, `GET /alert-rule/:arid/pure` |
| Active events | `GET /alert-cur-events/list`, `GET /alert-cur-events/card`, `DELETE /alert-cur-events` |
| Historical events | `GET /alert-his-events/list` |
| Mute rules | `GET/POST /busi-group/:id/alert-mutes` |
| Subscriptions | `GET/POST /busi-group/:id/alert-subscribes` |
| Data sources | `POST /datasource/list`, `POST /datasource/upsert`, `DELETE /datasource/` |
| Dashboards | `GET/POST /busi-group/:id/boards`, `GET/PUT /board/:bid`, `POST /busi-groups/boards/clones` |
| Targets | `GET /targets`, `PUT /targets/bgids`, `PUT /targets/note`, `POST /targets/tags` |
| Notification rules | `GET/POST /notify-rules`, `PUT /notify-rule/:id` |
| Media types | `GET/POST /notify-channel-configs`, `PUT /notify-channel-config/:id` |
| Message templates | `GET/POST /message-templates`, `PUT /message-template/:id` |
| Workflows | `GET /event-pipelines`, `POST/PUT /event-pipeline` |
| Users and teams | `GET/POST /users`, `GET/POST /user-groups`, `GET /roles` |
| Integration templates | `GET /builtin-components`, `GET /builtin-payloads` |

**A few create endpoints take an array rather than a single object**: `/notify-channel-configs`,
`/message-templates` and `/notify-rules`. Posting a bare object fails with
`cannot unmarshal object into Go value of type []...`.

## There is no create-event endpoint

`/alert-cur-events` and `/alert-his-events` **only list and delete**. Events come from rule
evaluation and nowhere else. To produce test data, write a rule that is certain to fire.

<span id="数据推送类" />

## Data ingestion {#data-ingestion}

Collector requests are separate from the management API. They are enabled by
`[HTTP.APIForAgent].Enable` and write metrics into the embedded store or configured
external writers. A web-login JWT is not the collector credential.

| Format | Receiver | Guide |
|---|---|---|
| Prometheus Remote Write | `POST /prometheus/v1/write` | [Telegraf](../agent/telegraf.md), [Categraf](../data/categraf/remote-write.md) |
| OpenTSDB JSON | `POST /opentsdb/put` | [Data ingestion protocols](./write-protocols.md) |
| Datadog v1 series | `POST /datadog/api/v1/series` | [Datadog Agent compatibility](../agent/datadog-agent.md) |

Remote Write and OpenTSDB use the configured Agent BasicAuth when enabled.
Datadog v1 series instead matches `api_key` against its password values. Check
authentication and the actual destination store before treating an HTTP response
as proof that a sample is queryable.

## Related

- [Tokens and credential rotation](../security/tokens.md)
- [Permission matrix](./permissions.md)
- [MCP tool reference](./mcp-tools.md) — the same permission model, a different door
