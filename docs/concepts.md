* [](https://n9e.github.io/index.md)
* Architecture and concepts

# Architecture and concepts

The mental model behind the product: which processes exist, how a data source becomes an alert, and how events are thinned out on their way to a person.

## [System architecture](https://n9e.github.io/docs/concepts/architecture.md)

[The core is one n9e process: no dependencies for testing, MySQL and Redis for production, several instances sharing them for a cluster, and n9e-edge for multi-site.](https://n9e.github.io/docs/concepts/architecture.md)

## [Processes and roles](https://n9e.github.io/docs/concepts/components.md)

[Most deployments need only the n9e process; n9e-alert and n9e-pushgw are roles that can be split out, n9e-edge serves multi-site setups, Categraf collects on hosts.](https://n9e.github.io/docs/concepts/components.md)

## [Storage](https://n9e.github.io/docs/concepts/storage.md)

[Nightingale ships with an embedded TSDB for onboarding; this page explains its limits and when to switch to Prometheus or VictoriaMetrics.](https://n9e.github.io/docs/concepts/storage.md)

## [Business groups](https://n9e.github.io/docs/concepts/business-groups.md)

[Business groups are the permission boundary: every rule, target and dashboard belongs to one, and membership decides who can see or change it.](https://n9e.github.io/docs/concepts/business-groups.md)

## [Core object model](https://n9e.github.io/docs/concepts/data-model.md)

[The three objects everything else hangs off: a data source is queried by a rule, and a rule that trips produces an event.](https://n9e.github.io/docs/concepts/data-model.md)

## [Lifecycle and severity](https://n9e.github.io/docs/concepts/alert-lifecycle.md)

[An event is identified by rule plus label set and passes through firing, ongoing and recovered; S1 / S2 / S3 change nothing mechanically — they signal urgency.](https://n9e.github.io/docs/concepts/alert-lifecycle.md)

## [Labels and annotations](https://n9e.github.io/docs/concepts/labels-annotations.md)

[Labels decide which event this is; annotations decide what the notification says. They are not interchangeable.](https://n9e.github.io/docs/concepts/labels-annotations.md)

## [Evaluation and recovery](https://n9e.github.io/docs/concepts/evaluation.md)

[A rule does not fire on the first high value: three timing parameters and a small state machine decide when it first fires, when it recovers and whether it flaps.](https://n9e.github.io/docs/concepts/evaluation.md)

## [Noise reduction and routing model](https://n9e.github.io/docs/concepts/noise-routing.md)

[Mute rules, subscriptions, pipelines and notification rules are not alternatives: they act on an event in a fixed order, which is why a muted alert can still page.](https://n9e.github.io/docs/concepts/noise-routing.md)

## [Authentication and permissions](https://n9e.github.io/docs/concepts/auth-rbac.md)

[Two layers: roles decide which pages and endpoints are reachable, business-group membership decides which data can be touched; UI, HTTP API and MCP share the model.](https://n9e.github.io/docs/concepts/auth-rbac.md)

[Previous](https://n9e.github.io/docs/get-started/production-checklist.md)

[Production readiness checklist](https://n9e.github.io/docs/get-started/production-checklist.md)

[Next](https://n9e.github.io/docs/concepts/architecture.md)

[System architecture](https://n9e.github.io/docs/concepts/architecture.md)

© 2026 Nightingale Contributors · Apache-2.0 License

[English](https://n9e.github.io/docs/concepts.md)[简体中文](https://n9e.github.io/zh/docs/concepts)
