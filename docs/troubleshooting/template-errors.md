# Notification template rendering fails

A message body that is error text, or a field that is empty, is a template rendering problem that still logs as success; preview against a real event to catch it.

An alert arrives in the chat room and the body is a paragraph of English error text; or the title, or one particular field, is inexplicably empty. Both are template rendering problems, and both **show as success in the notification records** — the HTTP request really was sent, and the far side really did answer 200.

## Symptom: the message body is an error[​](#symptom-the-message-body-is-an-error "Direct link to Symptom: the message body is an error")

When rendering fails the product **does not abort the send**. It puts the error text in that field and sends it. What actually arrives looks like this:

```
{"title": "", "content": "failed to execute template: template: content:1:183: executing &#34;content&#34; at &lt;$event.NoSuchField&gt;: can&#39;t evaluate field NoSuchField in type *models.AlertCurEvent"}
```

(The HTML entities are the escaping at work: `&#34;` is a quote, `&lt;` / `&gt;` are angle brackets.)

Slack-family media types are the exception: the failing field is **dropped entirely** and the downstream treats it as absent, so the symptom there is "a chunk is missing from the message" rather than "an extra paragraph of error".

The server log carries a matching line at the same moment, and it is the best way in:

```
ERROR models/message_tpl.go:3888 failed to render template field content: failed to execute template: template: content:1:183: executing "content" at <$event.NoSuchField>: can't evaluate field NoSuchField in type *models.AlertCurEvent events: [0x14003c2dc08]
```

Grepping `failed to render template field` pulls out every rendering failure at once, and the word after `field` is the template field that broke (`content` / `title` / `subject` …).

## There are only a handful of variables[​](#there-are-only-a-handful-of-variables "Direct link to There are only a handful of variables")

Before rendering, the product **silently prepends a prefix** to whatever you wrote, declaring these:

```
{{ $events := .events }}

{{ $event := index $events 0 }}

{{ $labels := $event.TagsMap }}

{{ $value := $event.TriggerValue }}
```

So a message template has **four and a half top-level variables**, and no more:

| Variable       | Type            | Notes                                                                                       |
| -------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `$event`       | one event       | Almost everything comes from here, e.g. `$event.RuleName`                                   |
| `$events`      | array of events | More than one when notifications are merged; `range` it                                     |
| `$labels`      | label map       | The same thing as `$event.TagsMap`                                                          |
| `$value`       | string          | The same thing as `$event.TriggerValue`                                                     |
| `{{$.domain}}` | string          | The site address. **The `$.` is required**; `{{.domain}}` only works at the outermost level |

**The root object itself has exactly two keys, `events` and `domain`.** Nothing else. Which explains the most common mistake on this page:

* **`{{.RuleName}}` does not error — it renders empty.** The root is a map, and a missing key yields the zero value. The correct form is `{{$event.RuleName}}`.
* **`{{$tpl.xxx}}`, `{{$params.xxx}}` and `{{$sendto}}` do not exist in a message template.** They belong to the request-body layer of a **media type**, not to this layer. The two editors look alike, which is why they get confused.

## Three classes of error, and what each looks like[​](#three-classes-of-error-and-what-each-looks-like "Direct link to Three classes of error, and what each looks like")

### Silently empty: the hardest to notice[​](#silently-empty-the-hardest-to-notice "Direct link to Silently empty: the hardest to notice")

Nothing errors, nothing is logged, the content is simply blank:

* `{{.AnyField}}` — the key is not in the root map, so it renders empty;
* `{{$labels.nosuchtag}}` — the label is not on the event, so it returns an empty string.

**The only way to catch this is comparing against what you expected.** A self-check while writing: send one message with every variable written as `key=value`, and look for the ones with nothing on the right-hand side.

### Execution-time errors: the variable exists but is used wrongly[​](#execution-time-errors-the-variable-exists-but-is-used-wrongly "Direct link to Execution-time errors: the variable exists but is used wrongly")

The syntax is fine and it blows up at run time. The prefix is always `failed to execute template:`. The two most typical:

```
executing "content" at <$event.NoSuchField>: can't evaluate field NoSuchField in type *models.AlertCurEvent
```

— `$event` has no such field. Note that these are **Go struct field names**, not the JSON names from the API: it is `$event.RuleName`, not `$event.rule_name`, and likewise `$event.TargetIdent`, `$event.TriggerTime`, `$event.AnnotationsJSON.summary`.

```
executing "content" at <.TriggerTime>: invalid value; expected int64
```

— this one is a knock-on effect of the trap in the previous section: `.TriggerTime` reads from the root map, misses, and yields a zero value; handing that zero value to `timeformat`, which wants an `int64`, produces exactly this. The correct form is `{{timeformat $event.TriggerTime}}`.

A relative of the same error: `wrong type for value; expected int64; got time.Time`, meaning you passed `timeformat` a time object instead of a timestamp.

### Parse-time errors: the syntax itself is wrong[​](#parse-time-errors-the-syntax-itself-is-wrong "Direct link to Parse-time errors: the syntax itself is wrong")

The template never compiled at all; the prefix is `failed to parse template:`:

```
failed to parse template: template: content:1: bad character U+007D '}'
```

Unbalanced braces (`{{...}` missing a `}`), an `if` with no `end`, an unclosed quote — all land here. **A parse error means the whole field is never rendered**, so what arrives is that error line itself.

## The line and column numbers do not match your template[​](#the-line-and-column-numbers-do-not-match-your-template "Direct link to The line and column numbers do not match your template")

The `183` in `content:1:183` is an offset **that includes the hidden prefix above**, so it is always a hundred-odd characters further along than the position in your editor, and it drifts by a few characters more between rendering paths.

**Do not count characters against that number.** The useful part is the expression inside the angle brackets — `<$event.NoSuchField>`, `<.TriggerTime>` — which names the construct that broke.

The line number `1` does not mean your template is one line either; the prefix is joined onto the same line.

## Previewing a template against a real event[​](#previewing-a-template-against-a-real-event "Direct link to Previewing a template against a real event")

There are two preview surfaces in the product and **they behave differently**. Picking the wrong one gives you a misleading answer:

1. **Notification rules → Edit → Run test on one notification config.** This uses **exactly the lenient rendering that production uses**: a broken template still returns success from the API, and the error text turns up in the body of the test message you receive. **Read the body, not the API's success.** In **History event** mode the match conditions are evaluated first, and a non-matching event is refused with the specific condition named. In **Mock event** mode every filter is skipped, so it only exercises rendering and the channel.

2. **Media types → Edit → Test at the bottom.** This uses **strict rendering**: any parse or execution failure in any field is **reported as an error** rather than sent as the body. Use this one to check syntax quickly.

The recommended way to preview against a real event: pick an event that genuinely misbehaved in **History event** mode, use **Run test** to send it to a webhook of your own, and read the body verbatim.

## Rendering differs by media type[​](#rendering-differs-by-media-type "Direct link to Rendering differs by media type")

The same template is handled differently depending on where it is going, which matters while you are writing it:

| Media type            | Engine        | Escaping                                                                                                                                   |
| --------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Email                 | text/template | **No escaping**; a newline is a newline                                                                                                    |
| Slack (webhook / bot) | html/template | JSON-escaped, but `&lt;` is turned back into `<` (otherwise the `<url\|text>` link syntax breaks); a rendering failure **drops the field** |
| Everything else       | html/template | JSON-escaped: `"` → `\"`, newline → `\n`                                                                                                   |

Because nearly everything goes through html/template, **`<`, `>`, `&` and `'` in your template are escaped into HTML entities**. That is where the `&#34;` in the error body above came from. To emit raw HTML, use `safeHtml` or `unescaped`.

One more: the template function `printf` **has been redefined by the product and takes exactly one argument** — it is not Go's variadic `printf`. Multi-argument formatting has to be split up.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The **complete source** of the template field that broke (one copy each of `content` and `title`);
2. The message body you actually received — that error text is the single most important piece of evidence, so do not screenshot only the first half of it;
3. The `failed to render template field` line from the log;
4. Which media type this notification config uses.

**Redacting**: if the template references a token or webhook address from `$params`, replace it. The error text itself contains no credentials and can be pasted as is.

## Next[​](#next "Direct link to Next")

* Every variable spelled out: [Message templates and variables](https://n9e.github.io/docs/notifications/templates.md)
* Nothing arrived at all: [Alert event exists but no notification arrives](https://n9e.github.io/docs/troubleshooting/no-notification.md)
* Testing the chain end to end: [Test a notification end to end](https://n9e.github.io/docs/notifications/test.md)
* Reading delivery status: [Retries and delivery status](https://n9e.github.io/docs/notifications/delivery.md)
