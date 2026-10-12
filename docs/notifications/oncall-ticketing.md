---
title: "PagerDuty / FlashDuty / Jira"
sidebar_label: "PagerDuty / FlashDuty / Jira"
description: "Hand events to an on-call platform or open a ticket, with the field mapping each one expects."
last_reviewed: 2026-10-10
---

Where this page ends: Nightingale events enter FlashDuty's or PagerDuty's on-call flow, or turn
into a Jira ticket — rather than sitting in a chat room waiting for someone to notice.

## Three approaches, three different things

| | FlashDuty | PagerDuty | Jira / JSM |
|---|---|---|---|
| Card in the type panel | Yes, and the open-source edition **ships a media type** | Yes, but you create it | No — use Import |
| Message template | **None**; the raw event JSON is sent | **None**; the backend builds an Events API v2 payload | Yes, built-in `Jira` / `JSMAlert` |
| Recovery | The target reads `is_recovered` from the event | A `resolve` event closes it by `dedup_key` | JSM closes by alias; Jira only opens tickets |
| What you pick in the rule | **Channels** (multi-select) | **Service/Integration** (multi-select) | Ordinary HTTP parameters |

What the first two have in common: **deduplication, scheduling and escalation happen on the
other side**. Do not stack another layer of filtering in Nightingale — hand the events over as
they are.

## FlashDuty: shipped with the open-source edition

**Alerts & Notifications → Media types**, and edit the built-in `FlashDuty`.

First, in the FlashDuty console's integration centre, create an alert-event integration of type
"Nightingale". You get a push URL shaped like
`https://api.flashcat.cloud/event/push/alert/n9e?integration_key=<key>`.

On the media type, fill in:

| Field | Notes |
|---|---|
| URL | **The whole push URL**, including `integration_key` — not just the key |
| Proxy | If you need one to reach the internet |
| Timeout | Milliseconds, 5000 by default |
| Retries | 3 by default |

Back in the notification rule, selecting this media type reveals a **Channels** multi-select
populated from FlashDuty. Leaving it empty uses the integration's own default; picking several
sends one request per channel.

**There is no message template dropdown here** — FlashDuty receives the raw JSON array of event
objects and does its own formatting.

One thing worth knowing: on the FlashDuty path, **anything that leaves the machine counts as
success**. A 5xx from the target is neither retried nor recorded as a failure; the status code
and response body are stored verbatim. That is deliberate — re-sending would break FlashDuty's
deduplication. So when debugging FlashDuty, read the **response body** in the notification
record; the status "success" tells you nothing.

## PagerDuty: there is a card for it

Two different credentials are involved, and telling them apart is the point of this section:

- **REST API Key** — goes on the **media type**. Nightingale uses it only to list your Services
  and Integrations so the notification rule can offer a dropdown.
- **Integration Key (routing key)** — **you never copy it by hand.** Once you tick a
  Service/Integration in the notification rule, Nightingale fetches the matching routing key
  itself.

On the PagerDuty side:

1. **Services → Service Directory → New Service**, choose an Escalation Policy, and set the
   integration type to **Events API v2**;
2. Avatar → My Profile → User Settings → API Access → **Create API User Token**. Read-only is
   enough.

On the media type, fill in the API Key, proxy, timeout (5000 ms by default) and retries (3).
**There is no URL and no body** — the endpoint is hard-coded to
`https://events.pagerduty.com/v2/enqueue` and the payload is assembled by the backend.

In the notification rule, **Service/Integration** is mandatory. Pick none and the send fails
immediately with `pagerduty requires at least one routing key in sendtos`.

PagerDuty also judges responses differently from a plain HTTP media type: only 200 and 202 are
success, and **any other status is retried** (retry times + 1 attempts in total).

:::note The test dialog asks for an Integration Key
The service dropdown depends on a saved media type id, so it is unavailable while you are still
editing. The **Test** dialog therefore asks you to type an Integration Key. This affects the
test only; once saved, the notification rule resolves keys for you.
:::

## What PagerDuty receives

| PagerDuty field | Where it comes from |
|---|---|
| `event_action` | `resolve` for recovery events, `trigger` otherwise |
| `dedup_key` | The event hash |
| `payload.summary` | Rule name |
| `payload.source` | Data source name |
| `payload.severity` | S1 → `critical`, S2 → `error`, S3 → `warning` |
| `payload.group` | Business group name |
| `payload.component` | The host object attached to the event, empty when there is none |
| `payload.timestamp` | Trigger time, RFC3339 |
| `payload.custom_details` | Labels, annotations, rule id and note, PromQL, host ident, data source id, first trigger time and more |
| `links` | Event detail link, mute link |

Two consequences worth planning around:

- **Only `critical` escalates to a phone call by default.** S2 and S3 map to `error` and
  `warning`. If you want them to page, remap priority in PagerDuty's Event Rules rather than
  inflating the severity in Nightingale.
- **Picking several services fans out.** N services means N events, and PagerDuty bills per
  event.

## Jira / JSM: create the media type by import

There is no Jira card in the type panel, but the **built-in templates include `Jira` and
`JSMAlert`**. Use **Import** on the media types list to create a media type whose `ident` is
`jira` or `jsm_alert`, and the matching built-in template becomes selectable in the
notification rule.

**Jira** (opening a ticket) looks roughly like this:

- URL: `https://<service account email>:<API token>@api.atlassian.com/ex/jira/<CloudID>/rest/api/3/issue`
- POST, with `Content-Type: application/json`
- Custom parameter: `project_key`
- Body: create an issue, with `fields.project.key` from `{{$params.project_key}}`, `summary`
  from `{{$event.RuleName}}`, the description wrapping `{{$tpl.content}}` in ADF, and
  `eventHash={{$event.Hash}}` among the `labels`

Do not hard-code the credential in the URL — write `{{.jira_token}}` and keep the value in
[Variables](../security/variables.md). This path **opens tickets but never closes them**; to
close the loop, write your own reconciliation against the `eventHash` label.

**JSM Alert** (Jira Service Management alerts, formerly Opsgenie) does close the loop:

- URL: `https://api.atlassian.com/jsm/ops/integration/v2/alerts`, with
  `/<event hash>/close?identifierType=alias` appended for recovery events — **one media type
  handles both create and close**
- Header: `Authorization: GenieKey {{$params.api_key}}`
- Custom parameter: `api_key`
- The body branches on `IsRecovered`: recovery sends `note` + `source`, firing sends `message`,
  `description`, `alias`, `priority`, `tags` and `details`

Mind the region: global is `api.atlassian.com`, the EU is `api.eu.atlassian.com`. The wrong
host answers 401.

## Recovery deduplicates on the event hash

PagerDuty's `dedup_key` and JSM's `alias` are both Nightingale's **event hash**. It is derived
from the alert rule and the event's dimension labels, which means:

- Changing the rule id or the grouping dimensions changes the hash, so **the old alert can
  never be closed** and stays open on the other platform;
- A recovery event has to actually happen. If the rule has "notify on recovery" turned off, the
  target never receives a `resolve`.

## Common errors

| Error | Cause |
|---|---|
| `pagerduty requires at least one routing key in sendtos` | No Service/Integration selected in the notification rule |
| The PagerDuty service dropdown is empty | Wrong or under-privileged API key, or no egress from the server |
| `401` / `403` (PagerDuty) | The routing key is invalid, or the integration is disabled |
| `400 Event object is invalid` (PagerDuty) | Malformed payload; this should not happen — please open an issue |
| `401` (JSM) | The API key's region does not match the URL's region |
| `404` (JSM close) | No such alert on the other side, usually because the hash changed |
| FlashDuty channels do not load | The integration URL is wrong, or only the key was filled in |

## Next

- The event arrives but reads badly: [Templates and variables](./templates.md)
- Where to look when nothing goes out: [Retries and delivery status](./delivery.md)
- Deduplicate here or over there: [Noise reduction and routing model](../concepts/noise-routing.md)
