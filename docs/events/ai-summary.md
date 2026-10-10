---
title: "AI summary processor"
sidebar_label: "AI summary processor"
description: "Have an LLM write a short summary onto each event before it is notified: model setup, the prompt template, where the result lands, and what happens when the call fails."
---

Where this page ends: every event that passes through a workflow carries an `ai_summary`
annotation written by a large language model, and your notification template puts it at the top
of the message.

It is one of the processors in a workflow (**Alerts & Notifications → Workflows**); add a processor
card and pick **AI summary** under **Enrich**. How workflows run and get attached to rules is in
[Event pipelines](./pipelines.md).

## 1. Point it at a model

Two ways, chosen by the first field:

- **Reuse LLM configuration** — pick a model already set up under **AI Config → LLM Configs**. Its
  provider, model, key and address are used, so any provider supported there works. The config must
  be enabled. See [Configure an LLM provider](../ai/llm-provider.md).
- **Leave it empty** and fill in the fields below it. These call an **OpenAI-compatible chat
  completions** endpoint directly:

| Field | Notes |
|---|---|
| URL | The full endpoint, e.g. `https://api.deepseek.com/v1/chat/completions` |
| API Key | Sent as `Authorization: Bearer <key>` |
| Model name | e.g. `deepseek-chat` |

Under **Advanced configuration** (inline mode only):

| Field | Notes |
|---|---|
| AI model parameters | Extra request fields such as `temperature = 0.7`. Values that look like numbers, booleans or JSON are sent as those types |
| Headers | Added to the request |
| HTTP Proxy | When the model is only reachable through a proxy |
| Timeout | **Milliseconds**, 30000 by default (the placeholder says seconds; the value is milliseconds) |
| TLS InsecureSkipVerify | For an endpoint with a self-signed certificate |

With a reused LLM configuration, the timeout comes from that configuration instead.

## 2. Write the prompt

**Prompt template** is a Go template rendered against the event; the result is sent to the model
as a single user message. `$event` is the event, `$inputs` holds the workflow's variables. A new
card comes with a working default:

```text
Please analyse the following alert event and give a concise summary:
Rule: {{$event.RuleName}}
Severity: {{$event.Severity}}
Status: {{if $event.IsRecovered}}Recovered{{else}}Triggered{{end}}
Trigger time: {{$event.TriggerTime}}
Trigger value: {{$event.TriggerValue}}
Rule note: {{$event.RuleNote}}
Labels: {{$event.Tags}}
Annotations: {{$event.Annotations}}
```

Event fields are listed in [Notification variables](../reference/notification-variables.md). Ask
for the length and language you want; the model's reply is used verbatim.

## 3. Use the result

The reply is written to the event's annotations under the key **`ai_summary`**, replacing any
earlier value. It shows in the event detail page, and in a notification template:

```text
{{ if $event.AnnotationsJSON.ai_summary }}AI summary: {{ $event.AnnotationsJSON.ai_summary }}{{ end }}
```

Put processors that should see the summary — a callback, a drop condition — **after** this one.

## When the call fails

- A failed call (unreachable, non-2xx, timeout, empty answer) marks this node **failed** in the
  [execution records](./execution-records.md). The event **still goes on** to later processors and
  notification, just without `ai_summary` — so guard the template with `if`, as above.
- The call is synchronous: a slow model delays the notification by up to the timeout.
- **Every event is one model call.** Use the workflow's scope to keep low-value events out — for
  example, exclude recovery events or S3.

## Next

- Add, order and attach processors: [Event pipelines](./pipelines.md)
- See what each node did to an event: [Execution records](./execution-records.md)
- Put the summary in a message: [Templates and variables](../notifications/templates.md)
