NIGHTINGALE DOCSv9.3.0

# Nightingale docs

Point Nightingale at the Prometheus, log stores and databases you already run, then set up rules, noise reduction, routing and delivery. Every step is written down here.

Why isn't my alert rule firing?

[Bring it up in 5 minutes](https://n9e.github.io/docs/get-started/quick-start.md)[Live demo](https://play.n9e.io/api/n9e/auth/demo-login)

## CONNECTGet your data in, and get a rule evaluating it

[I already have monitoring dataRegister Prometheus, ES or ClickHouse — queried in place→](https://n9e.github.io/docs/data/overview.md)[Nothing is collecting yetCategraf: one agent, 100+ plugins→](https://n9e.github.io/docs/get-started/choose-your-path/categraf.md)[I need to write my first alert ruleRules, severities, business groups, test fire→](https://n9e.github.io/docs/alerting/overview.md)

## DELIVERCut the noise, then get what is left to a person

[There are far too many alertsMute rules, subscriptions and event pipelines→](https://n9e.github.io/docs/events/overview.md)[Alerts have to reach whoever is on call20 channels, and the rules that pick between them→](https://n9e.github.io/docs/notifications/overview.md)[Which variables can a message template use?Template variables, write protocols, built-in metrics→](https://n9e.github.io/docs/reference/notification-variables.md)

## OPERATEKeep it running, and let an AI client drive it

[I'm deploying to productionCompose, binaries, Helm and upgrades→](https://n9e.github.io/docs/install/overview.md)[The link to my data center is unreliableRun n9e-edge so alerts fire and deliver through a partition→](https://n9e.github.io/docs/install/edge.md)[I want an AI client to drive NightingaleMCP setup, authentication, and the write-tool switch→](https://n9e.github.io/docs/ai/overview.md)

REFERENCE

## Configuration, API and template variables

[Configuration](https://n9e.github.io/docs/reference/configuration.md)[HTTP API](https://n9e.github.io/docs/reference/http-api.md)[MCP tools](https://n9e.github.io/docs/reference/mcp-tools.md)[Template variables](https://n9e.github.io/docs/reference/notification-variables.md)[Write protocols](https://n9e.github.io/docs/reference/write-protocols.md)[Built-in metrics](https://n9e.github.io/docs/reference/built-in-metrics.md)

RELEASES AND HELP

[Release notes](https://github.com/ccfos/nightingale/releases)[Comparisons](https://n9e.github.io/comparisons.md)[Integrations](https://n9e.github.io/integrations.md)[Open an issue](https://github.com/ccfos/nightingale/issues)[Slack](https://join.slack.com/t/n9e/shared_invite/zt-4ejx42fd0-S9aVULH4FTdH~jEAz80U7g)
