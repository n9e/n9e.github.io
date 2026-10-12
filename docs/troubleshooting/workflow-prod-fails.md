# Why does a workflow Try run succeed but production execution fail?

Try run passes, production fails: real events may lack labels the mock had, and the alert process — not the UI — runs the workflow with its own permissions and network.

Last reviewed 2026-10-10

The try-run panel is all green, every node produced output, the labels came out right. You attach it to a rule, a real event arrives, and nothing happens — no execution records at all, or records whose result looks nothing like the try run.

Gauge urgency by what the workflow does. If it only enriches labels or fires a callback, this can wait. **If it contains a drop processor**, it may be swallowing real alerts right now: disable the workflow reference on that rule first, then investigate.

## First: did it not run, or did it run and give the wrong answer[​](#first-did-it-not-run-or-did-it-run-and-give-the-wrong-answer "Direct link to First: did it not run, or did it run and give the wrong answer")

**Workflows → Execution records**, widen the time range (the default is only 6 hours), and search by event ID or workflow name. This splits the problem in two, and the two halves are investigated in completely different places:

| Execution records                                                 | What it means                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| None at all                                                       | The event never entered this workflow — see "scope" and "not attached" below                |
| A record, status Success, message `workflow terminated at node X` | It ran and a node dropped the event. **That is a normal ending, not an error**              |
| A record, status Failed                                           | It ran and a node errored; the detail names the failed node                                 |
| A record whose node results differ from the try run               | It ran, but on an event unlike the one you tested with — see "what a mock event is missing" |

Check the **trigger mode** column too: only **Event trigger** is the live path; **API trigger** is the try run's own record. **A whole-workflow try run writes an API-trigger record**, which is easily mistaken for proof that production works. **A single-processor try run writes no record at all** — it does not go through the workflow engine.

## What actually differs between a try run and production[​](#what-actually-differs-between-a-try-run-and-production "Direct link to What actually differs between a try run and production")

The try-run endpoint lives in the Center process and executes the config you posted to it; production is the alerting engine executing when an event is produced. **The try run passes none of the gates in between:**

| Gate                                       | Production                                                                          | Try run                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| Is the workflow referenced by a rule       | Never runs if not                                                                   | Not checked; runs anyway                           |
| Is that reference enabled on the rule      | A disabled reference is skipped                                                     | Not checked                                        |
| Is the workflow itself disabled            | Skipped, logged `event pipeline is disabled`                                        | Not checked                                        |
| **Scope** (applicable labels / attributes) | Non-matching events skip the whole workflow, logged `event pipeline not applicable` | **Not checked**                                    |
| Where the config comes from                | The **saved** copy in the database                                                  | The **editor's current** copy, in the request body |
| Workflow variables                         | The values saved on the workflow                                                    | Can be overridden ad hoc in the dialog             |
| Where the event comes from                 | A real event                                                                        | A mock event, or the history event you picked      |

Those last three rows are the three main sources of "green in test, red in production".

## What a mock event is missing[​](#what-a-mock-event-is-missing "Direct link to What a mock event is missing")

A mock event is synthesised by the server, **exists only in memory and is never persisted**, and always carries the fixed hash `event-pipeline-test-mock-event`. Its labels are exactly these:

```
rulename=<Event pipeline test mock event>

__name__=cpu_usage_idle

ident=mock-host-01

env=prod

service=web
```

Several other fields are **hard-coded**, so a processor branching on any of them can only ever reach one branch in a try run:

| Field                                    | Always, in a mock event                                      | In a real event                                  |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Data source type                         | `prometheus`                                                 | Whatever the rule actually uses                  |
| Business group                           | `Default Busi Group`                                         | The group that owns the rule                     |
| Annotations (`$event.AnnotationsJSON`)   | **An empty map**                                             | The summary, description and so on from the rule |
| Associated target (`$event.TargetIdent`) | **Empty**                                                    | Set for rules bound to hosts                     |
| Trigger value                            | `6.70`                                                       | The real query result                            |
| Severity / recovered                     | Adjustable in the dialog; **defaults to firing, severity 2** | Decided by the event                             |

Which means these processor configurations can never be validated by a try run:

* anything reading or branching on `$event.AnnotationsJSON.summary` — it is empty in a mock event;
* anything filtering by business group or data source type — both are fixed;
* anything that looks up host labels by `ident` for enrichment — `mock-host-01` does not exist in the host list.

**Severity and recovered must both be exercised.** The two most common drop-processor conditions are `{{ if eq $event.Severity 3 }}true{{ end }}` and `{{ if $event.IsRecovered }}true{{ end }}`, so running once on the defaults tests half of the logic.

To skip this whole section, use **History event** mode and pick a real one: it is read from the historical event table and converted back into a current event, so its shape matches production.

## Common root causes, and how to confirm each[​](#common-root-causes-and-how-to-confirm-each "Direct link to Common root causes, and how to confirm each")

### It is not attached, or attached to the other hook[​](#it-is-not-attached-or-attached-to-the-other-hook "Direct link to It is not attached, or attached to the other hook")

A workflow **never takes effect on its own** — an alert rule or a notification rule has to reference it. And the two hooks differ: on an alert rule it affects everything downstream; on a notification rule it affects only that rule's send.

**How to confirm**: the **Triggered by** column on an execution record says `Alert rule #id` or `Notification rule #id` outright. No Event-trigger records at all means it is not attached. The log confirms it too — the text after `processor_by_` is either `alert_rule` or `notify_rule`.

**How to fix**: add it on the rule form. The "go and attach it" panel in the workflow drawer exists for exactly this.

### The scope keeps real events out[​](#the-scope-keeps-real-events-out "Direct link to The scope keeps real events out")

**This is the most common reason for "no execution records at all"**, and since a try run does not check the scope at all, a try run can never reveal it.

**How to confirm**: grep the log for `pipeline_id:` — this is the line:

```
INFO dispatch/dispatch.go:265 processor_by_notify_rule_id:1 pipeline_id:1, event pipeline not applicable, event: c1de73eaa86f790d868cde6cc4d5903b
```

**How to fix**: compare the real event's labels against the workflow's applicable labels, item by item. Conditions are AND-ed and an empty one means no restriction. If you cannot pin it down, turn the scope filter switch off — **with it off, every event enters** — confirm the flow works, then add the conditions back one at a time.

### You edited and tried without saving[​](#you-edited-and-tried-without-saving "Direct link to You edited and tried without saving")

A try run executes the config in the request body — **the current contents of your editor**. Production executes the copy saved in the database. So the sequence "tweak, try run, looks right, close the drawer" leaves behind a version that was never saved.

**How to confirm**: reopen the workflow and check the processor config is the version you tested. The **Input variables snapshot** on the execution record detail helps too — it records the values that real execution actually used.

**How to fix**: save it, then look at the execution record for the next real event.

### The target address is unreachable from the alerting process[​](#the-target-address-is-unreachable-from-the-alerting-process "Direct link to The target address is unreachable from the alerting process")

Webhook callback and event update processors make HTTP requests. **The try run sends them from the Center process; production sends them from the alerting engine.** In a single-process deployment those are the same process and there is no difference — but once `n9e-alert` is split out, or the rule runs on `n9e-edge`, a different machine makes the request, with possibly different network policy, DNS and certificates.

**How to confirm**: the node's message on the execution record is the far side's response. Curl the target address by hand **from the machine that actually runs this rule** and compare. Which instance owns the rule is under **System → Alerting engines**.

**How to fix**: open the network policy for where the alerting engine sits, not for where your browser or the Center sits.

### The record says success but the event was dropped[​](#the-record-says-success-but-the-event-was-dropped "Direct link to The record says success but the event was dropped")

Dropping is configured behaviour, so the **overall status stays Success** and the message reads `workflow terminated at node <name>`; only genuinely Failed records render the message in red. There are no node results after the dropping node — later processors never ran.

**How to confirm**: open the record and check whether the last entry under **Node execution results** is the drop processor, and whether its message is "Condition matched — the event was dropped" or "Condition not matched — the event continues downstream".

**How to fix**: if that is not what you wanted, change the drop condition. If it is blocking later nodes while you are still debugging, **move the drop processor further down** — once it matches, you lose all visibility into everything after it.

## Confirming the fix[​](#confirming-the-fix "Direct link to Confirming the fix")

1. Save the workflow, attach it to a rule, and confirm that reference is **enabled**;
2. Wait for a real event, or manufacture one with the rule's **test fire**;
3. Back in **Workflows → Execution records**, widen the time range and confirm a record appears with **trigger mode Event trigger** — that is the only evidence the live path works; API trigger does not count;
4. Open it and check every node's result, especially the before/after diff on a label rewrite;
5. If there is a callback node, confirm the far side really received it.

## Collect this before you ask[​](#collect-this-before-you-ask "Direct link to Collect this before you ask")

1. The workflow's full configuration (processor types, order, scope, variables) and which rule it is attached to;
2. The try-run result and the live execution record **for the same event**, both together;
3. The trigger mode, status, execution message and failed node;
4. The `processor_by_` log lines for that event's hash;
5. The deployment shape: single process, split `n9e-alert`, or the rule running on `n9e-edge`.

**Redacting**: replace callback URLs, tokens in request headers and secrets in the variables snapshot. **Keep the label keys** — the decisions are made on them.

## Next[​](#next "Direct link to Next")

* Using the try-run panel: [Try a workflow with a mock event](https://n9e.github.io/docs/events/try-workflow.md)
* Reading the records column by column: [Inspect workflow execution records](https://n9e.github.io/docs/events/execution-records.md)
* Configuring a workflow: [Event pipelines](https://n9e.github.io/docs/events/pipelines.md)
* It runs but goes to the wrong place: [Why does the event pipeline route to the wrong destination?](https://n9e.github.io/docs/troubleshooting/wrong-routing.md)
* The label mechanics: [Rewrite labels and enrich context](https://n9e.github.io/docs/events/relabel-enrich.md)
