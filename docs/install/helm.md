---
title: "Helm / Kubernetes"
sidebar_label: "Helm / Kubernetes"
description: "A community-maintained Helm chart deploys Nightingale on Kubernetes with MySQL, Redis, Prometheus and Categraf; values can point it at databases outside the cluster."
---

A community-maintained Helm chart brings up Nightingale in Kubernetes together with MySQL, Redis,
Prometheus and Categraf. Two things are worth settling before you install it.

## Decide whether it belongs in Kubernetes at all

Monitoring is a P0 system: **when the Kubernetes cluster is in trouble is exactly when you need
monitoring alive**. Deploying Nightingale into the cluster it monitors creates a circular
dependency — the cluster goes, and the tool you would debug it with goes with it.

Either use a separate infrastructure cluster, or install on machines outside the cluster with
[binary packages](./binary.md). This is a topology decision, not a criticism of the chart.

## The state of the chart

The chart lives at [flashcatcloud/n9e-helm](https://github.com/flashcatcloud/n9e-helm), maintained
separately from the main repository. From chart `0.4.0` on, its master branch tracks v9:

- `Chart.yaml` says chart version `0.4.0`, `appVersion: 9.1.1`;
- `values.yaml` defaults the image to `flashcatcloud/nightingale:9.1.1`;
- the rendered `config.toml` is a v9 config: it has an `[EmbeddedTSDB]` section but keeps it
  **off** — the chart ships Prometheus as the time-series store, and the embedded TSDB only suits a
  single `n9e` replica. It also enables `[HTTP.TokenAuth]` (needed by `/mcp` and `/a2a`) and turns
  off anonymous access to PromQL queries and alert details, matching upstream defaults.

**Packaged releases have not caught up yet.** The newest chart in the Helm repository at
`https://flashcatcloud.github.io/n9e-helm` is still v8's `v8.0.0-beta12`, so `helm repo add` gets
you v8. To install v9, install from a clone of master, as in the next section.

Coming from an older chart, switch to the new one and run `helm upgrade`; `n9e` fills in the
schema with AutoMigrate on startup. See [Upgrade](./upgrade.md) for what to check first.

## Install

Requires Kubernetes 1.20+ and Helm v3.2.0+.

```bash
git clone https://github.com/flashcatcloud/n9e-helm.git
helm install nightingale ./n9e-helm -n n9e --create-namespace
```

**Expected result**: `kubectl get pod -n n9e` shows the nginx, database, redis, prometheus, n9e and
categraf pods reaching Running, and `root` / `root.2020` signs in through whichever exposure you
chose.

To remove it:

```bash
helm uninstall nightingale -n n9e
```

The bundled database and Redis are StatefulSets whose volumes come from `volumeClaimTemplates`, so
**`helm uninstall` leaves them behind**. Deleting the data means deleting those PVCs by hand.

## In-cluster or external dependencies

Database, Redis, Prometheus and Categraf each have a `type: internal | external` switch. `internal`
makes the chart run its own (MySQL 5.7 / Redis 6.2 / Prometheus StatefulSets), which is fine for a
trial. In production, point them at what you already run:

```yaml
database:
  type: external
  external:
    host: "mysql.example.internal"
    port: "3306"
    name: "n9e_v6"
    username: "n9e"
    password: "<password>"

redis:
  type: external
  external:
    addr: "redis.example.internal:6379"
    mode: "standalone"     # standalone | cluster | sentinel

prometheus:
  type: external
  external:
    host: "victoriametrics.example.internal"
    port: "8428"
```

`prometheus.external` is really the **remote-write receiver**: any Prometheus-compatible store fits,
VictoriaMetrics included. A separate `n9e.victoriaMetrics.enabled` switch adds a **second** write
target, for dual write.

With external databases the matching `persistence` PVCs are no longer needed.

## Exposing it

`expose.type` is one of `ingress` (default), `clusterIP`, `nodePort`, `loadBalancer`. Set
`externalURL` to `scheme://domain[:port]` matching that choice — it only appears in the
post-install notes and does not affect routing, so a wrong value fails silently and misleads the
next person.

```yaml
expose:
  type: ingress
  ingress:
    hosts:
      web: n9e.example.com
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: n9e-tls

externalURL: https://n9e.example.com
```

`certSource` is `auto` (self-signed), `secret` (an existing `tls.crt` / `tls.key`), or `none` (the
certificate lives on the ingress controller).

## Next

- [Choosing a metadata database](./databases.md)
- [Production readiness checklist](../get-started/production-checklist.md)
- [Binary packages](./binary.md) — deploying outside the cluster
