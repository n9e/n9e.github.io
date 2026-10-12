# Labels, annotations and severity

Attach labels for routing, write annotations that read well in a notification, and choose S1 / S2 / S3 deliberately.

Last reviewed 2026-10-10

Where this page ends: the events your rule produces carry the labels that routing needs, the text a person needs at 3 a.m., and a severity that means the same thing across your whole rule set.

## Three different things you can attach[​](#three-different-things-you-can-attach "Direct link to Three different things you can attach")

They live in different steps and behave differently, and mixing them up is the usual reason a notification rule fails to match:

|                    | Tags                                                            | Annotations                               | Severity                         |
| ------------------ | --------------------------------------------------------------- | ----------------------------------------- | -------------------------------- |
| Where              | Step 1, Basic settings                                          | Step 6, Event processing                  | Step 3, on each query            |
| Shape              | `key=value`                                                     | `key: text`                               | S1 / S2 / S3                     |
| Machine-readable   | **Yes** — mute, subscribe and notification rules match on these | No                                        | Yes                              |
| Rendered per event | No, fixed strings                                               | Yes, template variables are expanded      | No                               |
| Use it for         | Routing and filtering                                           | Context for the human reading the message | Deciding whether to wake someone |

Rule of thumb: **if something has to be matched on, it is a tag. If it only has to be read, it is an annotation.**

## Tags[​](#tags "Direct link to Tags")

**Basic settings → Tags** takes `key=value` entries, separated by Enter or Space. They are appended to every event this rule produces, on top of whatever labels the query returned.

The form enforces the format: `key=value`, the key must start with a letter or underscore and contain only letters, digits and underscores, each entry is at most 64 characters, and a key cannot repeat within the rule. Spaces inside a tag are stripped.

What is worth putting there:

```
team=infra

service=mysql

env=prod
```

These are the things the query cannot know. `ident` and `instance` come from the metric; the owning team does not. Everything downstream matches on labels:

* notification rules pick recipients and channels by them;
* mute rules silence by them;
* subscriptions let another team pick up events by them;
* the event lists filter by them.

Two cautions. Do not encode a value that changes per series — that is what the query's own labels are for. And keep the vocabulary small and shared: `team=infra` and `owner=infra-team` in different rules means every notification rule has to know about both.

## Annotations[​](#annotations "Direct link to Annotations")

**Event processing → Annotations** takes `key: value` entries. They are rendered when the event is generated, shown on the event detail page, and can be pulled into a notification message.

Values support template variables, so they are per-event:

```
summary          {{$labels.ident}} memory at {{$value | printf "%.1f"}}%

dashboard_url    https://grafana.example.com/d/host?var-ident={{$labels.ident}}
```

`$labels.<name>` is any label on the event; `$value` is the trigger value. A variable that does not exist on the event renders as an empty string. A malformed template renders as `failed to parse annotations` — the rule still fires, but fix it.

A value starting with `http` is rendered as a clickable link on the event detail page.

### Four conventional keys[​](#four-conventional-keys "Direct link to Four conventional keys")

The key can be anything, but the form suggests four, and one of them is special:

| Key               | What it is for                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `summary`         | One line of context: what broke, for whom, why it matters                                                                  |
| `runbook_url`     | The document the person on call should open first                                                                          |
| `dashboard_url`   | The chart that shows this problem in context                                                                               |
| `recovery_promql` | **Special.** When the event recovers, this PromQL is executed and the result is written to the `recovery_value` annotation |

`recovery_promql` exists because of a real gap: with a Prometheus-type rule, recovery means the query stopped returning the series, so there is no value to report. Put the bare expression here —

```
recovery_promql    mem_used_percent{ident="{{$labels.ident}}"}
```

— and the recovery notification can say what the value is now. A failed query writes `recovery_promql_error` instead of failing the recovery.

### Using them in a notification[​](#using-them-in-a-notification "Direct link to Using them in a notification")

The event detail page lists annotations automatically. To put one in a message, reference it in the template:

```
Runbook: {{$event.AnnotationsJSON.runbook_url}}
```

See [Templates and variables](https://n9e.github.io/docs/notifications/templates.md) for the full variable list.

## Severity[​](#severity "Direct link to Severity")

Every query in a rule carries a severity, and it is the single most consequential field for whether your alerting is livable.

|                   | Meaning that holds up                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **S1 (Critical)** | Users are affected right now, and a human must act within minutes. It is acceptable for this to ring a phone at 3 a.m. |
| **S2 (Warning)**  | Something will become S1 if nobody acts, but not tonight. Working hours, chat channel                                  |
| **S3 (Info)**     | Worth recording and reviewing, not worth interrupting anyone for                                                       |

Severity does not route anything by itself. It routes because your notification rules match on it — which is exactly why the definitions have to be consistent across the whole rule set. If half your rules use S1 for "urgent" and half for "important", no routing configuration can fix that.

### Choosing one[​](#choosing-one "Direct link to Choosing one")

Two questions, in order:

1. **Is a human required?** No means S3 — record it, chart it, review it weekly. Most disk-usage and certificate-expiry alerts are S3 until they get close.
2. **Is the human required now?** No means S2.

What is left is S1. In a healthy rule set this is a small minority: things that are user-visible or that will be within the hour.

Two habits that keep it honest. Review what actually paged people over the last month and demote whatever nobody acted on immediately — see [Rule design best practices](https://n9e.github.io/docs/alerting/best-practices.md). And when one rule needs two severities, use [several thresholds in one rule](https://n9e.github.io/docs/alerting/metric-rules.md) with inhibit on, rather than two rules that will drift apart.

## Next[​](#next "Direct link to Next")

* Where these fields sit in the form: [Metric rules](https://n9e.github.io/docs/alerting/metric-rules.md)
* What routing does with them: [Notification rules](https://n9e.github.io/docs/notifications/rules.md)
* Rewrite labels after the fact: [Rewrite labels and enrich context](https://n9e.github.io/docs/events/relabel-enrich.md)
* The model behind all this: [Labels and annotations](https://n9e.github.io/docs/concepts/labels-annotations.md)
