# Should high CPU load trigger an alert?

Decide CPU alert conditions, severity and delivery from business impact and a concrete response, then attach a runbook.

After this page, you will decide which CPU conditions deserve a notification and describe what the recipient should do.

## Start with an action[​](#actionable "Direct link to Start with an action")

High CPU load may be an expected batch workload or a cause of latency and backlog. A threshold alone cannot determine whether a person should be interrupted. Ask what action follows the alert.

* Business impact already exists: respond immediately.
* Resource exhaustion is approaching: schedule a response, often during working hours.
* The signal is diagnostic context: retain it in events or dashboards without necessarily notifying people.

Every actionable rule needs an owner and a runbook. Alerts that arrive repeatedly without a response need different conditions, severity or recipients.

## Severity and delivery are separate[​](#severity "Direct link to Severity and delivery are separate")

Nightingale v9 uses S1 / S2 / S3. Agree on their meaning within the team, then configure notification rules for channels, recipients and filters.

| Example convention                    | Response                                     |
| ------------------------------------- | -------------------------------------------- |
| S1: business impact, act now          | On-call owner and an urgent channel          |
| S2: needs action during working hours | Team message and follow-up task              |
| S3: information or diagnostic context | Event retention or low-interruption delivery |

This is a convention, not automatic delivery behavior. Marking a rule S3 does not automatically suppress notifications; review attached notification rules and severity filters.

## Choose the CPU signal[​](#signal "Direct link to Choose the CPU signal")

CPU utilization, load average, run queues and container throttling describe different conditions. Load average is not a CPU percentage, and the same load threshold cannot be compared blindly across machines with different core counts.

Understand the metric and its baseline, then correlate it with latency, errors or backlog. Sustained high utilization on a batch worker may be expected. Use a duration that tolerates normal transients. Check actual samples in the [metrics explorer](https://n9e.github.io/docs/query/metric-explorer.md) before enabling a rule.

## Write a usable runbook[​](#runbook "Direct link to Write a usable runbook")

Include:

1. How to confirm business impact and which dashboard to open.
2. How to identify the host, container and process.
3. Who owns the response and when to escalate.
4. Which mitigation actions have been authorized and rehearsed.
5. How to confirm recovery and identify follow-up capacity work.

Put SOP and dashboard URLs in rule annotations so the recipient can reach the context directly. Maintain thresholds with the runbook; a changed workload can make the old threshold obsolete.

## Next[​](#next "Direct link to Next")

* [Labels, annotations and identity](https://n9e.github.io/docs/concepts/labels-annotations.md)
* [Alerting best practices](https://n9e.github.io/docs/alerting/best-practices.md)
* [Notification rules](https://n9e.github.io/docs/notifications/rules.md)
