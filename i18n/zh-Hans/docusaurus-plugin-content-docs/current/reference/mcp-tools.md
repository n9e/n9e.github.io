---
title: "MCP 工具"
sidebar_label: "MCP 工具"
description: "13 个工具集共 74 个工具的参数，以及读写之分。"
last_reviewed: 2026-10-10
---

`/mcp` 端点默认启用，内置在 n9e 进程里，不需要单独部署 MCP server（独立的 `n9e-mcp-server` 已弃用，它的工具集库现在随 n9e 一起发布）。这页是完整清单。

怎么连、怎么鉴权见[启用 MCP 端点](../ai/mcp-endpoint.md)；
权限边界见[MCP 的权限继承](../ai/permissions.md)。

## 两个开关

```toml
[HTTP.A2A]
# 默认只注册只读工具，写工具（新建/修改/删除）要显式打开
MCPEnableWriteTools = false
# 留空 = 全部默认工具集；写不认识的名字会被忽略，不会意外放大权限
# MCPToolsets = ["alerts", "dashboards"]
```

**下面标了「写」的工具，在默认配置下根本不会被注册。** 这是有意的：
MCP 客户端拿到的权限就是 Token 所属用户的权限，写工具一开，模型就能真的改你的告警配置。

## 清单

<!-- generated:gen-mcp-reference -->
共 **74 个工具**，分属 **13 个工具集**，其中 32 个是写工具。

写工具默认**不注册**，要在 `[HTTP.A2A]` 里显式打开 `MCPEnableWriteTools = true`。

### `alert_subscribes`

Alert subscription management tools for event handling

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_alert_subscribes` | 读 | List alert subscriptions for a business group |
| `list_alert_subscribes_by_gids` | 读 | List alert subscriptions across multiple business groups |
| `get_alert_subscribe` | 读 | Get details of a specific alert subscription by ID |

这个工具集全是只读的。

### `alerts`

Alert management tools for viewing and managing alerts

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_active_alerts` | 读 | List active alert events with optional filters. Use this to view currently firing alerts. |
| `get_active_alert` | 读 | Get details of a specific active alert event by ID |
| `list_history_alerts` | 读 | List historical alert events with optional filters |
| `get_history_alert` | 读 | Get details of a specific historical alert event by ID |
| `list_alert_rules` | 读 | List alert rules for a business group |
| `get_alert_rule` | 读 | Get details of a specific alert rule by ID |
| `create_alert_rule` | **写** | Create a new alert rule in a business group. Pass the full rule body in 'rule' (mirror the structure returned by get_alert_rule, omit id/create_at/update_at). |
| `update_alert_rule` | **写** | Update an existing alert rule. Pass the full rule body (typically: get_alert_rule, modify fields, then submit). |
| `import_alert_rules` | **写** | Bulk import alert rules into a business group from a JSON array (matches the n9e import format). |
| `import_prom_rules` | **写** | Import Prometheus alerting rules (YAML or JSON) into a business group. Wraps n9e's /alert-rules/import-prom-rule endpoint. |
| `clone_alert_rules_to_bgs` | **写** | Clone the given alert rules into one or more target business groups. |
| `toggle_alert_rules` | **写** | Enable or disable a batch of alert rules. Uses n9e's PUT .../alert-rules/fields with &#123;disabled:0\|1}. |

### `busi_groups`

Business group management tools

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_busi_groups` | 读 | List all business groups that the current user has access to |

这个工具集全是只读的。

### `dashboards`

Dashboard (board) management: list/get/create/update/clone

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_dashboards` | 读 | List dashboards. Pass group_id for a single business group, or gids (comma-separated) to query multiple. |
| `get_dashboard` | 读 | Get a dashboard's metadata by ID. Use get_dashboard_pure if you also need the panel configs. |
| `get_dashboard_pure` | 读 | Get a dashboard including its full panel JSON. Uses an extended response size cap (64MB) — large boards return their entire layout. |
| `create_dashboard` | **写** | Create a new dashboard inside a business group. |
| `update_dashboard_meta` | **写** | Update a dashboard's name and tags (PUT /board/&#123;bid}). Use update_dashboard_panels to change the panel JSON. |
| `update_dashboard_panels` | **写** | Replace a dashboard's panel JSON (PUT /board/&#123;bid}/configs). 'configs' must be a JSON string. |
| `set_dashboard_public` | **写** | Toggle a dashboard's public visibility (PUT /board/&#123;bid}/public). |
| `clone_dashboard` | **写** | Clone a dashboard into the same business group (POST /busi-group/&#123;gid}/board/&#123;bid}/clone). |

### `datasource`

Datasource management tools (Prometheus/VictoriaMetrics/Loki/ES/...)

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_datasources` | 读 | List all available datasources (sanitized brief view — no auth secrets) |
| `list_datasources_full` | 读 | List datasources with full configuration including auth (admin perspective). Pass an optional filter body matching n9e's /datasource/list payload. |
| `get_datasource` | 读 | Get full configuration of a single datasource by ID (POST /datasource/desc). |
| `list_datasource_plugins` | 读 | List supported datasource plugin types (Prometheus, Loki, ES, Tencent CLS, ...). |
| `upsert_datasource` | **写** | Create or update a datasource. n9e runs a connectivity check as part of upsert — a successful response implies the datasource is reachable. Omit 'id' to create. |
| `set_datasource_status` | **写** | Enable or disable one or more datasources (POST /datasource/status/update). |

### `event_pipelines`

Event pipeline/workflow management tools for event processing

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_event_pipelines` | 读 | List all event pipelines/workflows that the current user has access to |
| `get_event_pipeline` | 读 | Get details of a specific event pipeline/workflow by ID |
| `list_event_pipeline_executions` | 读 | List execution records for a specific event pipeline |
| `list_all_event_pipeline_executions` | 读 | List all event pipeline execution records across all pipelines |
| `get_event_pipeline_execution` | 读 | Get details of a specific pipeline execution by execution ID |

这个工具集全是只读的。

### `logs`

Logs query tools (Loki/Elasticsearch/OpenSearch) via n9e logs-query

| 工具 | 读/写 | 用途 |
|---|---|---|
| `query_logs` | 读 | Query logs from a datasource (Loki/ES/OS) via n9e's plugin-dispatched /logs-query endpoint. Pass 'body' as the n9e query payload (must include datasource_id and the engine-specific query). Time range > 7 days is rejected. |
| `list_log_indices` | 读 | List indices for an Elasticsearch (default) or OpenSearch datasource. Body must include datasource_id. |
| `list_log_fields` | 读 | List fields for an Elasticsearch (default) or OpenSearch index. Body must include datasource_id and the index name. |

这个工具集全是只读的。

### `metrics`

Metrics query tools (PromQL instant/range) via n9e query APIs

| 工具 | 读/写 | 用途 |
|---|---|---|
| `query_instant` | 读 | Run a PromQL instant query against a Prometheus-compatible datasource. Returns the result series array (each item: metric labels + [timestamp, value]). |
| `query_range` | 读 | Run a PromQL range query against a Prometheus-compatible datasource. The 'step' is auto-adjusted upward when the result would exceed max_points (default 1000) per series, and 'truncated' is set in the response. |

这个工具集全是只读的。

### `mutes`

Alert mute/silence management tools

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_mutes` | 读 | List alert mutes/silences for a business group |
| `get_mute` | 读 | Get details of a specific alert mute by ID |
| `create_mute` | **写** | Create a new alert mute/silence rule. Use mute_time_type=0 for time range mode (btime/etime), or mute_time_type=1 for periodic mode (periodic_mutes). |
| `update_mute` | **写** | Update an existing alert mute/silence rule |

### `notify_rules`

Notification rule, channel and template management

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_notify_rules` | 读 | List all notification rules that the current user has access to |
| `get_notify_rule` | 读 | Get details of a specific notification rule by ID |
| `list_notify_channels` | 读 | List all notification channel configurations (full payload — admin perspective) |
| `get_notify_channel` | 读 | Get a single notification channel configuration by ID |
| `list_notify_templates` | 读 | List all notification templates |
| `create_notify_rules` | **写** | Create one or more notification rules (n9e endpoint accepts an array) |
| `update_notify_rule` | **写** | Update an existing notification rule by ID |
| `test_notify_rule` | **写** | Send a test notification using the supplied notify-rule body without persisting it. |
| `create_notify_channel` | **写** | Create a notification channel configuration (e.g. webhook, dingtalk, feishu). |
| `update_notify_channel` | **写** | Update an existing notification channel configuration |
| `create_notify_template` | **写** | Create a notification template |
| `update_notify_template` | **写** | Update a notification template (full body) |
| `update_notify_template_content` | **写** | Update only the rendered content of a notification template (lighter than update_notify_template). |

### `roles`

Role and permission management (n9e RBAC)

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_roles` | 读 | List all roles defined in the system. |
| `list_operations` | 读 | List every operation (permission) the system understands. |
| `list_role_operations` | 读 | List operations bound to a specific role. |
| `create_role` | **写** | Create a new role. |
| `update_role` | **写** | Update a role's metadata (PUT /roles). |
| `bind_role_operations` | **写** | Replace the operations bound to a role (PUT /role/&#123;id}/ops). Send the full ops list, not a delta. |

### `targets`

Target/Host management tools for viewing monitored objects

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_targets` | 读 | List monitored targets/hosts with optional filters |

这个工具集全是只读的。

### `users`

User and user group management tools

| 工具 | 读/写 | 用途 |
|---|---|---|
| `list_users` | 读 | List users with optional filters |
| `get_user` | 读 | Get details of a specific user by ID |
| `list_user_groups` | 读 | List user groups/teams that the current user has access to |
| `get_user_group` | 读 | Get details of a specific user group including its members |
| `create_user` | **写** | Create a new user. The body should at minimum include username, password, and roles. |
| `update_user_profile` | **写** | Update a user's profile. The 'roles' field on the body assigns roles to the user (n9e v8 stores roles on the user row, no dedicated assign endpoint). |
| `reset_user_password` | **写** | Reset a user's password. Requires admin privileges on the n9e side. |
| `create_user_group` | **写** | Create a new user group (team). |
| `update_user_group` | **写** | Update a user group's metadata (name, note). |
| `add_user_group_members` | **写** | Add user(s) to a user group. |
<!-- /generated -->
