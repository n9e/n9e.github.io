# Callback (generic webhook)

POST events to any HTTP endpoint: the URL, headers and body template, the variables they can use, and when a call counts as delivered.

Last reviewed 2026-10-10

Where this page ends: every event a notification rule matches is POSTed to an HTTP endpoint you own — a ticketing system, an internal bot, an automation service — in a body shaped the way that endpoint expects.

The open-source edition **ships a Callback media type, already enabled**. In most cases you do not create a new one; you point a notification rule at it and give it a URL.

## The fastest path: reuse the built-in media type[​](#the-fastest-path-reuse-the-built-in-media-type "Direct link to The fastest path: reuse the built-in media type")

The built-in `Callback` is deliberately generic: its URL is `{{$params.callback_url}}`, so the actual address is supplied **per notification rule**, not on the media type.

1. Open a notification rule (**Alerts & Notifications → Notification rules**) and add a notification config.
2. Pick **Callback** as the media type. Two fields appear: **Callback Url** and **Note**.
3. Put the full endpoint address into **Callback Url**. Note is free text, available to the body template as `$params.note`.
4. Click **Run test** at the top right of that notification config, then save.

One media type, any number of endpoints: each rule (and each notification config within a rule) carries its own Callback Url.

What the endpoint receives by default:

| Item   | Default                                                                                      |
| ------ | -------------------------------------------------------------------------------------------- |
| Method | `POST`                                                                                       |
| Header | `Content-Type: application/json`                                                             |
| Body   | `{{ jsonMarshal $events }}` — a JSON **array** of event objects, even when there is only one |

The event object is the same structure the history table stores; its fields are listed in [Notification variables](https://n9e.github.io/docs/reference/notification-variables.md).

## When you need your own: the fields on the media type[​](#when-you-need-your-own-the-fields-on-the-media-type "Direct link to When you need your own: the fields on the media type")

Create a separate media type (**Alerts & Notifications → Media types → Add → Callback**) when the target wants a fixed address, an auth header, or a body that is not the raw event array.

| Field                        | Notes                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| URL                          | Can contain template variables, e.g. `{{$params.callback_url}}` or `https://hooks.example.com/{{$params.path}}` |
| Method                       | GET / POST / PUT                                                                                                |
| Header                       | Key/value pairs; values may contain variables                                                                   |
| Params                       | Query parameters appended to the URL; values may contain variables                                              |
| Body                         | A Go template; see below                                                                                        |
| Timeout                      | Milliseconds, 10000 by default                                                                                  |
| Concurrency                  | Parallel requests for this media type, 5 by default                                                             |
| Retry times / Retry interval | 3 times, 100 ms apart, by default                                                                               |
| Skip TLS verify              | For endpoints with a self-signed certificate. There is no custom-CA option                                      |
| Proxy                        | When the endpoint is only reachable through a proxy                                                             |

Above those, a **Variable configuration** block holds two more things:

* **Contact** — which contact field to read from the users and teams picked in the rule; see [Contact methods](https://n9e.github.io/docs/security/contacts.md). Leave it empty for a plain webhook.
* **Custom parameters** — fields that appear in the notification rule when this media type is picked. Read them in templates as `$params.<key>`; the built-in media type's Callback Url and Note are exactly this.

## What the templates can see[​](#what-the-templates-can-see "Direct link to What the templates can see")

URL, header values, query parameter values and the body are all rendered with the same variables:

| Variable    | What it holds                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `$events`   | All events in this send, as an array                                                                         |
| `$event`    | The first event — convenient when you know each send carries one                                             |
| `$params`   | The custom parameters filled in on the notification rule, e.g. `$params.callback_url`                        |
| `$tpl`      | The message template picked on the rule, already rendered; each template field is a key, e.g. `$tpl.content` |
| `$sendto`   | One recipient's address (see the next section)                                                               |
| `$sendtos`  | All recipients' addresses, as an array                                                                       |
| `{{.name}}` | A [site variable](https://n9e.github.io/docs/security/variables.md) — the place for tokens and secrets       |

Template functions such as `jsonMarshal` are available everywhere.

### Build JSON with `jsonMarshal`, not quotes[​](#build-json-with-jsonmarshal-not-quotes "Direct link to build-json-with-jsonmarshal-not-quotes")

The body is rendered by Go's `html/template`. Strings you print directly are **HTML-escaped**: a rule called `disk "full" & <slow>` arrives as `disk &#34;full&#34; &amp; &lt;slow&gt;`. Wrapping a value in `jsonMarshal` emits it as a correctly escaped JSON literal instead, quotes included:

```
{

  "title":    {{ jsonMarshal $event.RuleName }},

  "severity": {{ $event.Severity }},

  "status":   {{ if $event.IsRecovered }}"resolved"{{ else }}"firing"{{ end }},

  "labels":   {{ jsonMarshal $event.TagsMap }},

  "note":     {{ jsonMarshal $params.note }}

}
```

Site variables (`{{.name}}`) are the exception: they are inserted verbatim, so a `+` in a token is not rewritten.

## Recipients: one request, or one per person[​](#recipients-one-request-or-one-per-person "Direct link to Recipients: one request, or one per person")

If the media type has a **Contact** set and the rule picks users or teams, Nightingale resolves each person's address for that key. People who have not filled it in are **skipped silently**. Then:

* If `$sendtos` appears anywhere in the media type's configuration, **one request** goes out carrying every address;
* otherwise **one request per recipient**, each with its own `$sendto`.

With no Contact set and no recipients — the usual case for a plain webhook — one request goes out per send.

## When a call counts as delivered[​](#when-a-call-counts-as-delivered "Direct link to When a call counts as delivered")

* **Only HTTP `200` is success.** `201`, `202` and `204` are recorded as failures, with the status code and response body. If you own the endpoint, return `200`.
* **A response that is not 200 is not retried.** Retries only cover failing to connect at all (DNS, refused, timeout), up to the retry count, waiting the retry interval in between.
* Callback sends go through a queue with the media type's concurrency. If the queue is full, the send is recorded as failed with `queue is full`.

The record — target, status code, response body — is in the event's notification records; see [Retries and delivery status](https://n9e.github.io/docs/notifications/delivery.md).

## Common errors[​](#common-errors "Direct link to Common errors")

| Symptom                                  | Cause                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `callback provider requires URL`         | The URL field is empty. With the built-in media type, the rule's Callback Url was left blank |
| Body arrives with `&#34;` in it          | A string was printed directly; wrap it in `jsonMarshal`                                      |
| Status 204, recorded as failed           | Only 200 is success; change the endpoint's response code                                     |
| Every recipient gets a separate request  | `$sendtos` is not used anywhere; reference it in the body if the endpoint wants a list       |
| `failed to parse template` in the record | A template syntax error in the URL, a header or a parameter                                  |

## Next[​](#next "Direct link to Next")

* Wire it into a rule: [Notification rules](https://n9e.github.io/docs/notifications/rules.md)
* Run your own program instead of calling HTTP: [Script media type](https://n9e.github.io/docs/notifications/script.md)
* Callback inside a workflow, before notification: [Rewrite labels and enrich context](https://n9e.github.io/docs/events/relabel-enrich.md)
