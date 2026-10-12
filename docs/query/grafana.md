---
title: "Use Grafana with Nightingale"
sidebar_label: "Use Grafana with Nightingale"
description: "Keep Grafana for visualisation: point it at the same stores, and hand alerting to Nightingale."
last_reviewed: 2026-10-10
---

Where this page ends: your Grafana dashboards untouched, and Nightingale alerting on the same
stores. No data is migrated and no panel is rebuilt.

## Splitting the work

| This | Goes to | Why |
|---|---|---|
| Charting and ad-hoc exploration | Grafana | You already have dozens of panels; rebuilding them buys nothing |
| Alert evaluation | Nightingale | Rules carry business-group ownership, muting and subscriptions, and every evaluation leaves a record |
| Notification routing and noise control | Nightingale | Notification rules, media types, templates and workflows are one coherent set |
| Closing the loop on events | Nightingale | Active events, history and self-healing live in one place |

The split rests on one condition: **both sides look at the same data**. Sections 1 and 2 below
are the two directions — pick the one that matches where your metrics live.

## 1. Point both sides at the same stores

If metrics are already in Prometheus / VictoriaMetrics / Thanos, this is the least work:
register the same query endpoint your Grafana data source uses in Nightingale too.

**Integrations → Data sources → Add → Prometheus**, same URL. Field by field, see
[Prometheus](../data/prometheus.md).

Two things to watch:

- The two sides **do not need matching names**. Nightingale's alert rules pick the source by
  its Nightingale name.
- If the Grafana data source uses Server (proxy) access, that URL is reached from the Grafana
  host. **The Nightingale host must be able to reach it too**, or the data source test fails.

## 2. The other direction: let Grafana query Nightingale's embedded TSDB

If your metrics only live in Nightingale's embedded TSDB (Categraf pushes straight to
Nightingale), Grafana can query it — the embedded store exposes a standard Prometheus query
API at `http://<nightingale>:17000/prometheus`.

But **that endpoint only accepts requests from the local machine by default**. To let Grafana
reach it from another host, configure basic auth first:

```toml
[EmbeddedTSDB]
Enable = true
BasicAuthUser = "grafana"
BasicAuthPass = "<pick your own>"
```

Setting these lifts the local-only restriction, and the auto-registered `embedded-tsdb` data
source switches from `127.0.0.1` to the detected host IP with the same credentials attached.
Restart Nightingale to apply.

Then add a **Prometheus** data source in Grafana:

```
URL        http://<nightingale IP>:17000/prometheus
Auth       Basic auth, with the user and password above
```

Save and test; a result for `up` means it works.

This route suits small deployments only. The embedded store is a single-instance local-disk
option, good to roughly 100k active series — see
[Embedded TSDB and external storage](../concepts/storage.md) for the limits. Once you outgrow
it and move to an external store, go back to section 1 and point both sides there.

## 3. Move alerting to Nightingale

PromQL in a Nightingale rule is the same PromQL you write in a Grafana panel; the only
difference is that the threshold goes into the expression itself (`... > 1`).

- Start from scratch: [Create the first rule](../alerting/first-rule.md)
- Bring existing Grafana alert rules across: [Migrate from Grafana alerting](../migration/from-grafana-alerting.md)
- Run both in parallel before cutting over: [Coexisting with what you already run](../migration/coexistence.md)

## Bring Grafana dashboards into Nightingale

The **Import** dialog on the dashboard list has four tabs; two of them concern Grafana:

| Tab | What it does |
|---|---|
| **Import Grafana dashboard URL** (recommended) | Converts nothing. It creates an iframe-mode dashboard that embeds your Grafana page. You supply a name, ident, tags and the Grafana dashboard URL |
| **Import Grafana dashboard (not recommended)** | Beta. Converts Grafana dashboard JSON into Nightingale's own model |

The limits of the second one are stated in the dialog itself: **only dashboards using
Prometheus data sources, and only the chart types and features Nightingale supports**. JSON
older than v7 is rejected outright; v7 to v8 warns first and lets you continue. Anything
non-trivial needs manual cleanup afterwards — "not recommended" is not politeness.

A third option is to hang all of Grafana off the side menu; see
[Share, embed and integrate external systems](./embedding.md).

## Let Grafana be embedded

Both of the last two options need an iframe, and Grafana refuses to be framed by default.
Edit `grafana.ini`:

```ini
[security]
allow_embedding = true
```

That is enough when both run on the same domain. **Across domains** you also have to let
Grafana's session cookie travel in a third-party context:

```ini
[security]
allow_embedding = true
cookie_secure = true      ; requires HTTPS
cookie_samesite = none    ; allow the cookie on cross-site requests
```

`cookie_secure = true` means Grafana must be served over HTTPS; if it is plain HTTP today,
put a reverse proxy with a certificate in front of it. The classic symptom of missing these
two lines is that you are logged into Nightingale on the outside while the framed Grafana
keeps showing its login page.

If you would rather viewers did not log into Grafana at all, turn on anonymous read-only
access:

```ini
[auth.anonymous]
enabled = true
org_name = Main Org.
org_role = Viewer
```

Restart Grafana to apply.

## Next

- Every field on the data source form: [Prometheus](../data/prometheus.md)
- Build boards in Nightingale itself: [Build a dashboard](./dashboards.md)
- Hang external systems off the side menu: [Share, embed and integrate external systems](./embedding.md)
