# MCP tool reference

All 74 tools across 13 toolsets with parameters, and which are read versus write.

Last reviewed 2026-10-10

The `/mcp` endpoint is on by default and is built into the n9e process; there is no separate MCP server to deploy (the standalone `n9e-mcp-server` binary is deprecated, its toolset library now ships inside n9e). This page is the full list.

How to connect and authenticate is in [Enable the MCP endpoint](https://n9e.github.io/docs/ai/mcp-endpoint.md); the permission boundary is in [Permission inheritance](https://n9e.github.io/docs/ai/permissions.md).

## Two switches[​](#two-switches "Direct link to Two switches")

```
[HTTP.A2A]

# read-only tools are registered by default; write tools (create/update/delete) are an opt-in

MCPEnableWriteTools = false

# empty = all default toolsets; unknown names are ignored, so the list never widens by accident

# MCPToolsets = ["alerts", "dashboards"]
```

**Tools marked "write" below are not registered at all under the default configuration.** That is deliberate: an MCP client holds exactly its token owner's permissions, so enabling write tools lets a model genuinely change your alerting configuration.

## The list[​](#the-list "Direct link to The list")

**74 tools** across **13 toolsets**, 32 of them write tools.

Write tools are **not registered by default** — set `MCPEnableWriteTools = true` under `[HTTP.A2A]` to expose them.

### `alert_subscribes`[​](#alert_subscribes "Direct link to alert_subscribes")

Alert subscription management tools for event handling

| Tool                            | Access | What it does                                             |
| ------------------------------- | ------ | -------------------------------------------------------- |
| `list_alert_subscribes`         | read   | List alert subscriptions for a business group            |
| `list_alert_subscribes_by_gids` | read   | List alert subscriptions across multiple business groups |
| `get_alert_subscribe`           | read   | Get details of a specific alert subscription by ID       |

This toolset is read-only.

### `alerts`[​](#alerts "Direct link to alerts")

Alert management tools for viewing and managing alerts

| Tool                       | Access    | What it does                                                                                                                                                       |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_active_alerts`       | read      | List active alert events with optional filters. Use this to view currently firing alerts.                                                                          |
| `get_active_alert`         | read      | Get details of a specific active alert event by ID                                                                                                                 |
| `list_history_alerts`      | read      | List historical alert events with optional filters                                                                                                                 |
| `get_history_alert`        | read      | Get details of a specific historical alert event by ID                                                                                                             |
| `list_alert_rules`         | read      | List alert rules for a business group                                                                                                                              |
| `get_alert_rule`           | read      | Get details of a specific alert rule by ID                                                                                                                         |
| `create_alert_rule`        | **write** | Create a new alert rule in a business group. Pass the full rule body in 'rule' (mirror the structure returned by get\_alert\_rule, omit id/create\_at/update\_at). |
| `update_alert_rule`        | **write** | Update an existing alert rule. Pass the full rule body (typically: get\_alert\_rule, modify fields, then submit).                                                  |
| `import_alert_rules`       | **write** | Bulk import alert rules into a business group from a JSON array (matches the n9e import format).                                                                   |
| `import_prom_rules`        | **write** | Import Prometheus alerting rules (YAML or JSON) into a business group. Wraps n9e's /alert-rules/import-prom-rule endpoint.                                         |
| `clone_alert_rules_to_bgs` | **write** | Clone the given alert rules into one or more target business groups.                                                                                               |
| `toggle_alert_rules`       | **write** | Enable or disable a batch of alert rules. Uses n9e's PUT .../alert-rules/fields with {disabled:0\|1}.                                                              |

### `busi_groups`[​](#busi_groups "Direct link to busi_groups")

Business group management tools

| Tool               | Access | What it does                                                 |
| ------------------ | ------ | ------------------------------------------------------------ |
| `list_busi_groups` | read   | List all business groups that the current user has access to |

This toolset is read-only.

### `dashboards`[​](#dashboards "Direct link to dashboards")

Dashboard (board) management: list/get/create/update/clone

| Tool                      | Access    | What it does                                                                                                                        |
| ------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `list_dashboards`         | read      | List dashboards. Pass group\_id for a single business group, or gids (comma-separated) to query multiple.                           |
| `get_dashboard`           | read      | Get a dashboard's metadata by ID. Use get\_dashboard\_pure if you also need the panel configs.                                      |
| `get_dashboard_pure`      | read      | Get a dashboard including its full panel JSON. Uses an extended response size cap (64MB) — large boards return their entire layout. |
| `create_dashboard`        | **write** | Create a new dashboard inside a business group.                                                                                     |
| `update_dashboard_meta`   | **write** | Update a dashboard's name and tags (PUT /board/{bid}). Use update\_dashboard\_panels to change the panel JSON.                      |
| `update_dashboard_panels` | **write** | Replace a dashboard's panel JSON (PUT /board/{bid}/configs). 'configs' must be a JSON string.                                       |
| `set_dashboard_public`    | **write** | Toggle a dashboard's public visibility (PUT /board/{bid}/public).                                                                   |
| `clone_dashboard`         | **write** | Clone a dashboard into the same business group (POST /busi-group/{gid}/board/{bid}/clone).                                          |

### `datasource`[​](#datasource "Direct link to datasource")

Datasource management tools (Prometheus/VictoriaMetrics/Loki/ES/...)

| Tool                      | Access    | What it does                                                                                                                                                     |
| ------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_datasources`        | read      | List all available datasources (sanitized brief view — no auth secrets)                                                                                          |
| `list_datasources_full`   | read      | List datasources with full configuration including auth (admin perspective). Pass an optional filter body matching n9e's /datasource/list payload.               |
| `get_datasource`          | read      | Get full configuration of a single datasource by ID (POST /datasource/desc).                                                                                     |
| `list_datasource_plugins` | read      | List supported datasource plugin types (Prometheus, Loki, ES, Tencent CLS, ...).                                                                                 |
| `upsert_datasource`       | **write** | Create or update a datasource. n9e runs a connectivity check as part of upsert — a successful response implies the datasource is reachable. Omit 'id' to create. |
| `set_datasource_status`   | **write** | Enable or disable one or more datasources (POST /datasource/status/update).                                                                                      |

### `event_pipelines`[​](#event_pipelines "Direct link to event_pipelines")

Event pipeline/workflow management tools for event processing

| Tool                                 | Access | What it does                                                           |
| ------------------------------------ | ------ | ---------------------------------------------------------------------- |
| `list_event_pipelines`               | read   | List all event pipelines/workflows that the current user has access to |
| `get_event_pipeline`                 | read   | Get details of a specific event pipeline/workflow by ID                |
| `list_event_pipeline_executions`     | read   | List execution records for a specific event pipeline                   |
| `list_all_event_pipeline_executions` | read   | List all event pipeline execution records across all pipelines         |
| `get_event_pipeline_execution`       | read   | Get details of a specific pipeline execution by execution ID           |

This toolset is read-only.

### `logs`[​](#logs "Direct link to logs")

Logs query tools (Loki/Elasticsearch/OpenSearch) via n9e logs-query

| Tool               | Access | What it does                                                                                                                                                                                                                   |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `query_logs`       | read   | Query logs from a datasource (Loki/ES/OS) via n9e's plugin-dispatched /logs-query endpoint. Pass 'body' as the n9e query payload (must include datasource\_id and the engine-specific query). Time range > 7 days is rejected. |
| `list_log_indices` | read   | List indices for an Elasticsearch (default) or OpenSearch datasource. Body must include datasource\_id.                                                                                                                        |
| `list_log_fields`  | read   | List fields for an Elasticsearch (default) or OpenSearch index. Body must include datasource\_id and the index name.                                                                                                           |

This toolset is read-only.

### `metrics`[​](#metrics "Direct link to metrics")

Metrics query tools (PromQL instant/range) via n9e query APIs

| Tool            | Access | What it does                                                                                                                                                                                                        |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query_instant` | read   | Run a PromQL instant query against a Prometheus-compatible datasource. Returns the result series array (each item: metric labels + \[timestamp, value]).                                                            |
| `query_range`   | read   | Run a PromQL range query against a Prometheus-compatible datasource. The 'step' is auto-adjusted upward when the result would exceed max\_points (default 1000) per series, and 'truncated' is set in the response. |

This toolset is read-only.

### `mutes`[​](#mutes "Direct link to mutes")

Alert mute/silence management tools

| Tool          | Access    | What it does                                                                                                                                               |
| ------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_mutes`  | read      | List alert mutes/silences for a business group                                                                                                             |
| `get_mute`    | read      | Get details of a specific alert mute by ID                                                                                                                 |
| `create_mute` | **write** | Create a new alert mute/silence rule. Use mute\_time\_type=0 for time range mode (btime/etime), or mute\_time\_type=1 for periodic mode (periodic\_mutes). |
| `update_mute` | **write** | Update an existing alert mute/silence rule                                                                                                                 |

### `notify_rules`[​](#notify_rules "Direct link to notify_rules")

Notification rule, channel and template management

| Tool                             | Access    | What it does                                                                                         |
| -------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `list_notify_rules`              | read      | List all notification rules that the current user has access to                                      |
| `get_notify_rule`                | read      | Get details of a specific notification rule by ID                                                    |
| `list_notify_channels`           | read      | List all notification channel configurations (full payload — admin perspective)                      |
| `get_notify_channel`             | read      | Get a single notification channel configuration by ID                                                |
| `list_notify_templates`          | read      | List all notification templates                                                                      |
| `create_notify_rules`            | **write** | Create one or more notification rules (n9e endpoint accepts an array)                                |
| `update_notify_rule`             | **write** | Update an existing notification rule by ID                                                           |
| `test_notify_rule`               | **write** | Send a test notification using the supplied notify-rule body without persisting it.                  |
| `create_notify_channel`          | **write** | Create a notification channel configuration (e.g. webhook, dingtalk, feishu).                        |
| `update_notify_channel`          | **write** | Update an existing notification channel configuration                                                |
| `create_notify_template`         | **write** | Create a notification template                                                                       |
| `update_notify_template`         | **write** | Update a notification template (full body)                                                           |
| `update_notify_template_content` | **write** | Update only the rendered content of a notification template (lighter than update\_notify\_template). |

### `roles`[​](#roles "Direct link to roles")

Role and permission management (n9e RBAC)

| Tool                   | Access    | What it does                                                                                      |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `list_roles`           | read      | List all roles defined in the system.                                                             |
| `list_operations`      | read      | List every operation (permission) the system understands.                                         |
| `list_role_operations` | read      | List operations bound to a specific role.                                                         |
| `create_role`          | **write** | Create a new role.                                                                                |
| `update_role`          | **write** | Update a role's metadata (PUT /roles).                                                            |
| `bind_role_operations` | **write** | Replace the operations bound to a role (PUT /role/{id}/ops). Send the full ops list, not a delta. |

### `targets`[​](#targets "Direct link to targets")

Target/Host management tools for viewing monitored objects

| Tool           | Access | What it does                                       |
| -------------- | ------ | -------------------------------------------------- |
| `list_targets` | read   | List monitored targets/hosts with optional filters |

This toolset is read-only.

### `users`[​](#users "Direct link to users")

User and user group management tools

| Tool                     | Access    | What it does                                                                                                                                          |
| ------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_users`             | read      | List users with optional filters                                                                                                                      |
| `get_user`               | read      | Get details of a specific user by ID                                                                                                                  |
| `list_user_groups`       | read      | List user groups/teams that the current user has access to                                                                                            |
| `get_user_group`         | read      | Get details of a specific user group including its members                                                                                            |
| `create_user`            | **write** | Create a new user. The body should at minimum include username, password, and roles.                                                                  |
| `update_user_profile`    | **write** | Update a user's profile. The 'roles' field on the body assigns roles to the user (n9e v8 stores roles on the user row, no dedicated assign endpoint). |
| `reset_user_password`    | **write** | Reset a user's password. Requires admin privileges on the n9e side.                                                                                   |
| `create_user_group`      | **write** | Create a new user group (team).                                                                                                                       |
| `update_user_group`      | **write** | Update a user group's metadata (name, note).                                                                                                          |
| `add_user_group_members` | **write** | Add user(s) to a user group.                                                                                                                          |
