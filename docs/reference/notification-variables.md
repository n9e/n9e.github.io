# Notification variables

The event fields and helper functions available inside a message template.

Last reviewed 2026-10-10

Message templates are Go `text/template`.

**The trap that catches everyone: event fields hang off `$event`, not off the template's top-level `.`.** Writing `{{"{{"}}.RuleName{{"}}"}}` silently renders an empty string, and `{{"{{"}}timeformat .TriggerTime{{"}}"}}` fails outright with `invalid value; expected int64`.

```
{{ $event.RuleName }}                    correct

{{ .RuleName }}                          renders empty

{{ timeformat $event.TriggerTime }}      correct
```

For a working example to copy, open the built-in `dingtalk` template — it is the most complete one.

## Commonly used event fields[​](#commonly-used-event-fields "Direct link to Commonly used event fields")

| Field                          | Meaning                                                           |
| ------------------------------ | ----------------------------------------------------------------- |
| `$event.RuleName`              | Rule name                                                         |
| `$event.RuleNote`              | Rule note                                                         |
| `$event.Severity`              | Severity, 1 / 2 / 3                                               |
| `$event.IsRecovered`           | Whether this is a recovery or a trigger                           |
| `$event.TargetIdent`           | Target identifier (host name and so on)                           |
| `$event.TargetNote`            | Target note                                                       |
| `$event.GroupName`             | Business group. **Taken from the rule's group**, not the target's |
| `$event.TriggerValue`          | The value at trigger time                                         |
| `$event.TriggerTime`           | Trigger timestamp, for use with `timeformat`                      |
| `$event.FirstTriggerTime`      | First trigger of a continuing alert — needed to compute duration  |
| `$event.LastEvalTime`          | Last evaluation. A recovery event uses this as its recovery time  |
| `$event.TagsJSON`              | The label set                                                     |
| `$event.AnnotationsJSON.<key>` | Annotations, e.g. `$event.AnnotationsJSON.summary`                |
| `$event.RunbookURL`            | The runbook link set on the rule                                  |
| `$event.Cate`                  | Data source type                                                  |
| `$event.DatasourceId`          | Data source ID                                                    |

## Commonly used helper functions[​](#commonly-used-helper-functions "Direct link to Commonly used helper functions")

| Function                          | Purpose                                         |
| --------------------------------- | ----------------------------------------------- |
| `timeformat`                      | Timestamp to readable time                      |
| `humanizeDurationInterface`       | Seconds to "3m 20s"                             |
| `formatDecimal`                   | Fix decimal places                              |
| `add` `sub` `mul` `div`           | Arithmetic                                      |
| `now`                             | Current time, usually `now.Unix`                |
| `toUpper` `toLower` `title`       | Case                                            |
| `contains` `match` `reReplaceAll` | String tests and replacement                    |
| `split` `join`                    | Split and join                                  |
| `jsonMarshal`                     | To JSON — the workhorse for webhook-style media |
| `humanize` `humanizePercentage`   | Friendlier numbers                              |
| `escape` `unescaped` `safeHtml`   | Escaping control                                |

The standard way to compute duration, copied from the built-in templates:

```
{{ $d := sub now.Unix $event.FirstTriggerTime }}{{ humanizeDurationInterface $d }}
```

For a recovery event use `sub $event.LastEvalTime $event.FirstTriggerTime` instead.

## Some media types do not use templates[​](#some-media-types-do-not-use-templates "Direct link to Some media types do not use templates")

`callback`, `flashduty` and `pagerduty` **bypass message templates** — their request body passes the event JSON straight through, and the UI does not offer a template picker for them. Every other media type **drops the whole notification** when its template is missing, and writes a failed notification record.

## Site variables[​](#site-variables "Direct link to Site variables")

Values such as the site address are `{{"{{"}}$.domain{{"}}"}}` — note the dot. `{{"{{"}}$domain{{"}}"}}` resolves to nothing, and `{{"{{"}}.domain{{"}}"}}` stops working inside a `range` or `with` block.

## Related[​](#related "Direct link to Related")

* [Templates and variables](https://n9e.github.io/docs/notifications/templates.md)
* [Why does notification template rendering fail?](https://n9e.github.io/docs/troubleshooting/template-errors.md)
