# Reference

Lookup material — configuration keys, the HTTP API, MCP tools, notification variables, write protocols and built-in metrics. Generated from the source tree wherever possible.

## [Configuration reference](https://n9e.github.io/docs/reference/configuration.md)

[Every key in config.toml and etc/edge/edge.toml, with defaults and which process reads it.](https://n9e.github.io/docs/reference/configuration.md)

## [Environment variables](https://n9e.github.io/docs/reference/environment-variables.md)

[The environment variables Nightingale reads, and why config keys cannot be overridden that way.](https://n9e.github.io/docs/reference/environment-variables.md)

## [CLI reference](https://n9e.github.io/docs/reference/cli.md)

[The command line is thin: every process takes three flags, configuration lives in the toml files under etc/, and there are no subcommands for managing rules.](https://n9e.github.io/docs/reference/cli.md)

## [HTTP API](https://n9e.github.io/docs/reference/http-api.md)

[The API the UI runs on: authentication, endpoints by object, and why there is no OpenAPI document.](https://n9e.github.io/docs/reference/http-api.md)

## [MCP tool reference](https://n9e.github.io/docs/reference/mcp-tools.md)

[All 74 tools across 13 toolsets with parameters, and which are read versus write.](https://n9e.github.io/docs/reference/mcp-tools.md)

## [Permission matrix](https://n9e.github.io/docs/reference/permissions.md)

[Every permission point, which built-in roles hold it, and the menu or API it guards.](https://n9e.github.io/docs/reference/permissions.md)

## [Notification variables](https://n9e.github.io/docs/reference/notification-variables.md)

[The event fields and helper functions available inside a message template.](https://n9e.github.io/docs/reference/notification-variables.md)

## [Data write protocols](https://n9e.github.io/docs/reference/write-protocols.md)

[Prometheus Remote Write, OpenTSDB, Datadog and Falcon: endpoints, payloads and label handling.](https://n9e.github.io/docs/reference/write-protocols.md)

## [Integration schema](https://n9e.github.io/docs/reference/integration-schema.md)

[The file layout of an integration template, so you can write and contribute one.](https://n9e.github.io/docs/reference/integration-schema.md)

## [Built-in metrics](https://n9e.github.io/docs/reference/built-in-metrics.md)

[What each Nightingale process exposes about itself on /metrics.](https://n9e.github.io/docs/reference/built-in-metrics.md)

## [Ports and network flows](https://n9e.github.io/docs/reference/ports.md)

[Every listening port and every outbound connection, so a firewall rule set can be written from one table.](https://n9e.github.io/docs/reference/ports.md)

## [Limits and defaults](https://n9e.github.io/docs/reference/limits.md)

[Hard limits, soft limits and default sizes: queue lengths, timeouts, retention.](https://n9e.github.io/docs/reference/limits.md)

## [Compatibility matrix](https://n9e.github.io/docs/reference/compatibility.md)

[What is known to work with which versions, and why there is no official support matrix here.](https://n9e.github.io/docs/reference/compatibility.md)
