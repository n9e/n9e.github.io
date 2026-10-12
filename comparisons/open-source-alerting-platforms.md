# How to choose an open-source alerting platform

"Alerting platform" means the last layer of monitoring: once the data exists, **who evaluates it, how noise is cut, and who gets told**. Collection and storage are out of scope here, and so is visualization. The open-source choices at this layer are few, but they differ a lot. First the tools are sorted into three kinds, then six questions are asked of each.

## Three kinds of tool[​](#three-kinds-of-tool "Direct link to Three kinds of tool")

| Kind              | What it does                                                                       | Examples                                                 |
| ----------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Alerting engine   | Runs queries itself, evaluates, cuts noise, delivers                               | Prometheus + Alertmanager, Grafana Alerting, Nightingale |
| Aggregation layer | Receives alerts other systems already produced; deduplicates, correlates, delivers | Keep, Alerta                                             |
| On-call delivery  | Schedules, escalations, phone wake-ups                                             | Mostly commercial; Grafana OnCall OSS is archived        |

Step one is deciding which layer you lack. Data with no alerts yet: an engine. Three systems each already alerting: an aggregation layer. Alerts accurate enough but nobody answering the phone: on-call delivery.

## Do rules live in files or in a UI?[​](#do-rules-live-in-files-or-in-a-ui "Direct link to Do rules live in files or in a UI?")

In the Alertmanager world, rules are Prometheus YAML managed by reload and GitOps, with no UI editing and no permission model. Grafana Alerting and Nightingale both configure in the UI and both export and import. Ownership differs: Grafana uses folders and org roles, with fine-grained RBAC in Enterprise; Nightingale uses business groups, which are also the permission boundary and decide who can see, who can edit and where mutes apply. If only SREs maintain rules, files plus GitOps are the leanest option; if product teams configure their own, a UI and a permission boundary are hard requirements.

## Is the data in one place or several?[​](#is-the-data-in-one-place-or-several "Direct link to Is the data in one place or several?")

Alertmanager only handles alerts evaluated by Prometheus (Loki alerts go through its own ruler). Grafana Alerting spans any data source it supports alerting on. Nightingale registers Prometheus, VictoriaMetrics, Elasticsearch, Loki, ClickHouse, MySQL and others, <!-- -->10+<!-- --> types, so metric, log and SQL rules all live in one place. Keep and Alerta do not query data; they only receive alerts.

## What cuts the noise: grouping, inhibition, mutes, subscriptions[​](#what-cuts-the-noise-grouping-inhibition-mutes-subscriptions "Direct link to What cuts the noise: grouping, inhibition, mutes, subscriptions")

This is where the three engines differ most.

* **Alertmanager**: label-based grouping into one message (`group_by`), cross-rule inhibition (`inhibit_rules`), one-off silences, recurring mute intervals on routes. A clean model, all in config files.
* **Grafana Alerting**: embeds an Alertmanager, so grouping and silences match, but Grafana-managed alerts do not support inhibition rules.
* **Nightingale**: no label grouping, one event per notification. Noise is cut by merging at the rule level (one rule covers every series its query returns), fixed and recurring mutes (optionally muting notifications while keeping the event), subscription rules (conditional copies, timeout escalation) and event pipelines (processors that rewrite, drop or call back). Cross-rule inhibition has no declarative form; it is a pipeline rewrite.
* **Keep / Alerta**: deduplication and correlation are their main job, on alerts some other system produced.

If the on-call flow depends on seeing a group of alerts in one message, the Alertmanager family fits better. If events must be routed to different people by business condition and rewritten before delivery, Nightingale fits better.

## How does the on-call person get woken up?[​](#how-does-the-on-call-person-get-woken-up "Direct link to How does the on-call person get woken up?")

Among the open-source engines only Nightingale ships phone and SMS media types, alongside DingTalk, Feishu, WeCom, Slack, Telegram and others, <!-- -->20<!-- --> channels in total. Alertmanager receivers are email, Slack, PagerDuty and webhooks first; Grafana contact points cover the main chat tools and also lack phone and SMS. None of the three has a schedule: on-call rotation in the open-source world is mostly left to commercial products, and Grafana OnCall OSS was archived in March 2026.

## Who can change a rule, and where is the boundary?[​](#who-can-change-a-rule-and-where-is-the-boundary "Direct link to Who can change a rule, and where is the boundary?")

Alertmanager and Prometheus have no authentication or permissions; isolation happens at the deployment level. Grafana OSS has org roles and folder permissions. Nightingale has users, teams and business groups; rules, mutes, subscriptions and targets belong to a business group, and data sources can be granted per group. When several product teams share one alerting platform, this question usually decides.

## What can AI do here?[​](#what-can-ai-do-here "Direct link to What can AI do here?")

Alertmanager has no built-in AI. Grafana Assistant is Cloud-only; OSS relies on the LLM plugin and a separate MCP server. Nightingale runs an AI assistant and <!-- -->74<!-- --> MCP tools in-process across <!-- -->13<!-- --> toolsets, read tools on by default, write tools off, no delete tools; clients such as Claude Code and Cursor connect to the `/mcp` endpoint directly and inherit the user's token permissions. Keep applies AI to alert correlation.

## One table[​](#one-table "Direct link to One table")

| Dimension                 | Prometheus + Alertmanager | Grafana Alerting            | Nightingale                           | Keep                                   | Alerta            |
| ------------------------- | ------------------------- | --------------------------- | ------------------------------------- | -------------------------------------- | ----------------- |
| Kind                      | Engine                    | Engine                      | Engine                                | Aggregation                            | Aggregation       |
| Where rules live          | YAML files                | UI + provisioning           | UI + import/export                    | Does not evaluate                      | Does not evaluate |
| Data sources              | Prometheus                | Any alerting-capable source | 10+<!-- --> types: metrics, logs, SQL | Receives alerts                        | Receives alerts   |
| Grouping into one message | Yes                       | Yes                         | No                                    | Correlation                            | Correlation       |
| Cross-rule inhibition     | Yes                       | No                          | Pipeline rewrite                      | Correlation rules                      | Correlation rules |
| Phone and SMS             | Third party               | Third party                 | Built in                              | Third party                            | Third party       |
| Permission model          | None                      | Roles + folders             | Business-group RBAC                   | Yes                                    | Yes               |
| Built-in AI               | None                      | Cloud only                  | Assistant + MCP                       | Alert correlation                      | None              |
| License                   | Apache-2.0                | AGPL-3.0                    | Apache-2.0                            | Open core with an enterprise directory | Apache-2.0        |

## Recommendations by team profile[​](#recommendations-by-team-profile "Direct link to Recommendations by team profile")

* **Small team, all data in Prometheus, comfortable with GitOps**: Prometheus + Alertmanager. Fewest components, cleanest model.
* **Heavy Grafana users, moderate alert volume, contact points suffice**: Grafana Alerting. One system fewer.
* **Several data sources, product teams configuring their own rules, phone and SMS and chat tools required, AI-assisted investigation wanted**: Nightingale. Full comparisons: [Nightingale vs Prometheus + Alertmanager](https://n9e.github.io/comparisons/prometheus-alertmanager.md) and [Nightingale vs Grafana Alerting](https://n9e.github.io/comparisons/grafana-alerting.md).
* **Three monitoring systems already alerting, want one inbox**: an aggregation layer such as Keep or Alerta. Nightingale is not one.
* **Coming from Zabbix**: start with [Zabbix alternatives](https://n9e.github.io/comparisons/zabbix-alternatives.md), then [Nightingale vs Zabbix](https://n9e.github.io/comparisons/zabbix.md).

## Questions[​](#questions "Direct link to Questions")

**Is an alerting platform the same thing as a monitoring system?**

No. A monitoring system usually has four layers: collection, storage, visualization and alerting. This page is about the last one only: evaluation, noise reduction, delivery. Prometheus is storage plus evaluation, Grafana is visualization plus an alerting module, Nightingale is an engine built for the alerting layer alone.

**Can Nightingale receive alerts from Alertmanager or Zabbix?**

No. Nightingale is an alerting engine that runs its own queries; it has no inbound alert endpoint. To consolidate alerts other systems already produce, look at aggregation layers such as Keep or Alerta.

**Do the open-source editions have phone and SMS?**

Nightingale does; phone and SMS are built-in media types in its open-source edition. Alertmanager and Grafana OSS have neither and rely on third parties such as PagerDuty; Grafana OnCall OSS was archived in March 2026.

***

Based on each project's public documentation and open-source edition as of October 2026; a guide, not a verdict. Nightingale figures come from build-time data. If something here is out of date, open an issue on [GitHub](https://github.com/n9e/n9e.github.io/issues).

On this page

* [Three kinds of tool](#three-kinds-of-tool)
* [Do rules live in files or in a UI?](#do-rules-live-in-files-or-in-a-ui)
* [Is the data in one place or several?](#is-the-data-in-one-place-or-several)
* [What cuts the noise: grouping, inhibition, mutes, subscriptions](#what-cuts-the-noise-grouping-inhibition-mutes-subscriptions)
* [How does the on-call person get woken up?](#how-does-the-on-call-person-get-woken-up)
* [Who can change a rule, and where is the boundary?](#who-can-change-a-rule-and-where-is-the-boundary)
* [What can AI do here?](#what-can-ai-do-here)
* [One table](#one-table)
* [Recommendations by team profile](#recommendations-by-team-profile)
* [Questions](#questions)
