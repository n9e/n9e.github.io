---
title: "Permission matrix"
sidebar_label: "Permission matrix"
description: "Every permission point, which built-in roles hold it, and the menu or API it guards."
last_reviewed: 2026-10-10
---

Permission points are the **first layer** of the model. The second is business-group membership,
and the two are combined with AND:

```
may edit this alert rule  =  my role holds the "edit alert rule" permission point
                             AND
                             one of my teams has write on the business group
                             that owns the rule
```

The model itself is in [Authentication and permissions](../concepts/auth-rbac.md); this page is the
lookup table.

## Three built-in roles

| Role | Reach |
|---|---|
| `Admin` | Skips the permission check — holds every point, and is not bounded by business-group membership either |
| `Standard` | Everyday users. Holds most points |
| `Guest` | Read-only observer. A dozen or so query points |

Custom roles are created under **Organization → Roles** by ticking the points you want.

A user can hold several roles at once; permissions are the union.

## The list

Points marked "menu visibility only" guard no endpoint — they decide whether a sidebar item shows,
and the backend will not reject a request for lack of one. The points that list endpoints are the
real gate.

<!-- generated:gen-permissions-reference -->
**96 permission points.** The `Admin` role is not in this table — it skips the
permission check in code, so it holds every point and is not bounded by business-group
membership either.

A permission point is only the first layer. Whether you may act on a given object also
depends on whether one of your teams has write on the business group that owns it — the
two are combined with AND.

| Permission point | Standard | Guest | Guards |
|---|:---:|:---:|---|
| `/ai-config/llm-configs` |  |  | `GET /ai-llm-configs`<br/>`GET /ai-llm-config/:id`<br/>`POST /ai-llm-configs`<br/>`PUT /ai-llm-config/:id`<br/>`DELETE /ai-llm-config/:id`<br/>`POST /ai-llm-config/test` |
| `/ai-config/skills` |  |  | `GET /ai-skills`<br/>`GET /ai-skill/:id`<br/>`POST /ai-skills`<br/>`PUT /ai-skill/:id`<br/>`DELETE /ai-skill/:id`<br/>`POST /ai-skills/import`<br/>`PUT /ai-skill/:id/import`<br/>`POST /ai-skills/git/install`<br/>`PUT /ai-skill/:id/git/install`<br/>`POST /ai-skill/:id/git/update`<br/>`GET /ai-skill-file/:fileId`<br/>`DELETE /ai-skill-file/:fileId` |
| `/alert-cur-events` | ✅ |  | (menu visibility only) |
| `/alert-cur-events/del` | ✅ |  | `DELETE /alert-cur-events` |
| `/alert-his-events` | ✅ |  | (menu visibility only) |
| `/alert-mutes` | ✅ |  | `GET /busi-groups/alert-mutes`<br/>`GET /busi-group/:id/alert-mutes`<br/>`GET /busi-group/:id/alert-mute/:amid` |
| `/alert-mutes/add` | ✅ |  | `POST /busi-group/:id/alert-mutes/preview`<br/>`POST /busi-group/:id/alert-mutes`<br/>`POST /alert-mute-tryrun` |
| `/alert-mutes/del` | ✅ |  | `DELETE /busi-group/:id/alert-mutes` |
| `/alert-mutes/put` |  |  | `PUT /busi-group/:id/alert-mute/:amid`<br/>`PUT /busi-group/:id/alert-mutes/fields` |
| `/alert-rules` | ✅ |  | `GET /busi-groups/alert-rules`<br/>`GET /busi-group/:id/alert-rules`<br/>`GET /alert-rule/:arid`<br/>`GET /alert-rule/:arid/pure`<br/>`GET /alert-rule/:arid/eval-records` |
| `/alert-rules-built-in` | ✅ |  | (menu visibility only) |
| `/alert-rules/add` | ✅ |  | `POST /busi-group/:id/alert-rules`<br/>`POST /busi-group/:id/alert-rules/import`<br/>`POST /busi-group/:id/alert-rules/clone`<br/>`POST /busi-groups/alert-rules/clones`<br/>`POST /busi-group/alert-rules/notify-tryrun`<br/>`POST /busi-group/alert-rules/enable-tryrun`<br/>`POST /busi-group/:id/alert-rule/test-fire` |
| `/alert-rules/del` | ✅ |  | `DELETE /busi-group/:id/alert-rules` |
| `/alert-rules/put` | ✅ |  | `PUT /busi-group/:id/alert-rules/fields`<br/>`PUT /busi-group/:id/alert-rule/:arid`<br/>`PUT /busi-group/alert-rule/validate` |
| `/alert-subscribes` | ✅ |  | `GET /busi-groups/alert-subscribes`<br/>`GET /busi-group/:id/alert-subscribes`<br/>`GET /alert-subscribe/:sid` |
| `/alert-subscribes/add` | ✅ |  | `POST /busi-group/:id/alert-subscribes`<br/>`POST /alert-subscribe/alert-subscribes-tryrun` |
| `/alert-subscribes/del` | ✅ |  | `DELETE /busi-group/:id/alert-subscribes` |
| `/alert-subscribes/put` | ✅ |  | `PUT /busi-group/:id/alert-subscribes` |
| `/builtin-metrics/add` |  |  | `POST /builtin-metrics` |
| `/builtin-metrics/del` |  |  | `DELETE /builtin-metrics` |
| `/builtin-metrics/put` |  |  | `PUT /builtin-metrics` |
| `/busi-groups` | ✅ |  | (menu visibility only) |
| `/busi-groups/add` | ✅ |  | `POST /busi-groups` |
| `/busi-groups/del` | ✅ |  | `DELETE /busi-group/:id` |
| `/busi-groups/put` | ✅ |  | `PUT /busi-group/:id`<br/>`POST /busi-group/:id/members`<br/>`DELETE /busi-group/:id/members` |
| `/components/add` |  |  | `POST /builtin-components`<br/>`POST /builtin-payloads` |
| `/components/del` |  |  | `DELETE /builtin-components`<br/>`DELETE /builtin-payloads` |
| `/components/put` |  |  | `PUT /builtin-components`<br/>`PUT /builtin-payloads` |
| `/dashboards` | ✅ |  | `GET /busi-groups/public-boards`<br/>`GET /busi-groups/boards`<br/>`GET /busi-group/:id/boards` |
| `/dashboards-built-in` | ✅ |  | (menu visibility only) |
| `/dashboards/add` | ✅ |  | `POST /busi-group/:id/boards`<br/>`POST /busi-group/:id/board/:bid/clone`<br/>`POST /busi-groups/boards/clones` |
| `/dashboards/del` | ✅ |  | `DELETE /boards`<br/>`DELETE /dashboard-annotation/:id` |
| `/dashboards/put` | ✅ |  | `PUT /board/:bid`<br/>`PUT /board/:bid/configs`<br/>`PUT /board/:bid/public`<br/>`POST /dashboard-annotations`<br/>`PUT /dashboard-annotation/:id` |
| `/embedded-dashboards` |  |  | `GET /embedded-dashboards` |
| `/embedded-dashboards/put` |  |  | `PUT /embedded-dashboards` |
| `/embedded-product/add` |  |  | `POST /embedded-product` |
| `/embedded-product/delete` |  |  | `DELETE /embedded-product/:id` |
| `/embedded-product/put` |  |  | `PUT /embedded-products/weights`<br/>`PUT /embedded-product/:id/hide`<br/>`PUT /embedded-product/:id` |
| `/event-pipelines` |  |  | `GET /event-pipelines`<br/>`GET /event-pipeline/:id`<br/>`POST /event-pipeline-tryrun`<br/>`POST /event-processor-tryrun`<br/>`POST /event-pipeline/:id/trigger`<br/>`POST /event-pipeline/:id/stream`<br/>`GET /event-pipeline-executions`<br/>`GET /event-pipeline/:id/executions`<br/>`GET /event-pipeline/:id/execution/:exec_id`<br/>`GET /event-pipeline-execution/:exec_id`<br/>`GET /event-pipeline/:id/execution-stats` |
| `/event-pipelines/add` |  |  | `POST /event-pipeline` |
| `/event-pipelines/del` |  |  | `DELETE /event-pipelines` |
| `/event-pipelines/put` |  |  | `PUT /event-pipeline`<br/>`PUT /event-pipelines/disabled` |
| `/help/contact` | ✅ | ✅ | (menu visibility only) |
| `/help/migrate` | ✅ |  | (menu visibility only) |
| `/help/notification-settings` |  |  | `GET /notify-script`<br/>`GET /notify-channel`<br/>`GET /notify-config` |
| `/help/servers` | ✅ |  | (menu visibility only) |
| `/help/version` | ✅ | ✅ | (menu visibility only) |
| `/job-tasks` | ✅ |  | `GET /busi-groups/tasks`<br/>`GET /busi-group/:id/tasks` |
| `/job-tasks/add` | ✅ |  | `POST /busi-group/:id/tasks` |
| `/job-tasks/put` | ✅ |  | (menu visibility only) |
| `/job-tpls` | ✅ |  | `GET /busi-groups/task-tpls`<br/>`GET /busi-group/:id/task-tpls`<br/>`GET /busi-group/:id/task-tpl/:tid` |
| `/job-tpls/add` | ✅ |  | `POST /busi-group/:id/task-tpls` |
| `/job-tpls/del` | ✅ |  | `DELETE /busi-group/:id/task-tpl/:tid` |
| `/job-tpls/put` | ✅ |  | `POST /busi-group/:id/task-tpls/tags`<br/>`DELETE /busi-group/:id/task-tpls/tags`<br/>`PUT /busi-group/:id/task-tpl/:tid` |
| `/log/explorer` | ✅ | ✅ | (menu visibility only) |
| `/log/index-patterns/add` |  |  | `POST /es-index-pattern` |
| `/log/index-patterns/del` |  |  | `DELETE /es-index-pattern` |
| `/log/index-patterns/put` |  |  | `PUT /es-index-pattern`<br/>`PUT /es-index-patterns/weights` |
| `/metric/explorer` | ✅ | ✅ | (menu visibility only) |
| `/notification-channels` |  |  | `GET /notify-channel-config/:id`<br/>`GET /notify-channel-configs`<br/>`POST /feishu-visible-chats/:id`<br/>`POST /dingtalk-group-list/:id` |
| `/notification-channels/add` |  |  | `POST /notify-channel-configs`<br/>`POST /notify-channel-config/test` |
| `/notification-channels/del` |  |  | `DELETE /notify-channel-configs` |
| `/notification-channels/put` |  |  | `PUT /notify-channel-config/:id` |
| `/notification-rules` |  |  | `GET /notify-rule/:id`<br/>`GET /notify-rules`<br/>`POST /notify-rule/test`<br/>`GET /notify-rule/custom-params` |
| `/notification-rules/add` |  |  | `POST /notify-rules`<br/>`POST /notify-rule/event-pipelines-tryrun` |
| `/notification-rules/del` |  |  | `DELETE /notify-rules` |
| `/notification-rules/put` |  |  | `PUT /notify-rule/:id` |
| `/notification-templates` |  |  | `GET /message-template/:id` |
| `/notification-templates/add` |  |  | `POST /message-templates` |
| `/notification-templates/del` |  |  | `DELETE /message-templates` |
| `/notification-templates/put` |  |  | `PUT /message-template/:id` |
| `/object/explorer` | ✅ | ✅ | (menu visibility only) |
| `/recording-rules` | ✅ |  | `GET /busi-groups/recording-rules`<br/>`GET /busi-group/:id/recording-rules`<br/>`GET /recording-rule/:rrid`<br/>`PUT /recording-rule/:rrid` |
| `/recording-rules/add` | ✅ |  | `POST /busi-group/:id/recording-rules` |
| `/recording-rules/del` | ✅ |  | `DELETE /busi-group/:id/recording-rules` |
| `/recording-rules/put` | ✅ |  | `PUT /busi-group/:id/recording-rules/fields` |
| `/roles` |  |  | `GET /role/:id/ops` |
| `/roles/add` |  |  | `POST /roles` |
| `/roles/del` |  |  | `DELETE /role/:id` |
| `/roles/put` |  |  | `PUT /roles`<br/>`PUT /role/:id/ops` |
| `/system/alerting-engines` |  |  | `GET /servers` |
| `/system/variable-settings` |  |  | `GET /user-variable-configs`<br/>`POST /user-variable-config`<br/>`PUT /user-variable-config/:id`<br/>`DELETE /user-variable-config/:id` |
| `/targets` | ✅ |  | (menu visibility only) |
| `/targets/add` | ✅ |  | (menu visibility only) |
| `/targets/del` | ✅ |  | `DELETE /targets` |
| `/targets/put` | ✅ |  | `POST /targets/tags`<br/>`DELETE /targets/tags`<br/>`PUT /targets/note`<br/>`PUT /targets/bgids` |
| `/trace/dependencies` | ✅ |  | (menu visibility only) |
| `/trace/explorer` | ✅ | ✅ | (menu visibility only) |
| `/user-groups` | ✅ |  | (menu visibility only) |
| `/user-groups/add` | ✅ |  | `POST /user-groups` |
| `/user-groups/del` | ✅ |  | `DELETE /user-group/:id` |
| `/user-groups/put` | ✅ |  | `PUT /user-group/:id`<br/>`POST /user-group/:id/members`<br/>`DELETE /user-group/:id/members` |
| `/users` | ✅ |  | `GET /users` |
| `/users/add` |  |  | `POST /users` |
| `/users/del` |  |  | `DELETE /user/:id` |
| `/users/put` |  |  | `PUT /user/:id/profile`<br/>`PUT /user/:id/password` |
<!-- /generated -->
