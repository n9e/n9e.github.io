---
title: "Common investigation workflows"
sidebar_label: "Common investigation workflows"
description: "Paste-ready investigation prompts paired with the built-in skill that answers each: triage active events, find the noisiest rule, explain a metric spike."
---

A cookbook. Each section pairs a question you can paste with the built-in skill written to answer
it, so you can see why it lands rather than guessing at phrasing.

:::note Where these came from
Every prompt below is either one the product itself suggests — the starter cards in a new chat and
the per-page recommendations behind the **Nightingale AI** button — or is derived from the declared
scope of one of the 22 built-in skills. They are **not** benchmark results: how good the answer is
depends on the model you configured and on the data you have.
:::

## Where you ask from changes the answer

The same sentence gets a different answer in three places, and it is worth knowing which you are
in.

**Inside a page.** The **Nightingale AI** button in the page header opens a chat that is told which
page you are on. On an event detail page "analyse the root cause" needs no further explanation of
which event; in the workspace it does.

**In the workspace.** No page context, so name the thing: the rule, the host, the business group.
Better for questions that span areas.

**From an MCP client.** Claude Code and Cursor bring their own model and their own toolbox — no
skills, no documentation search, no confirmation card. Prompts that lean on a skill will not behave
the same. Stick to retrieval there: *"List every business group I can see"*, *"Which alerts are
firing right now? Group them by severity."* See
[Connect an MCP client](./mcp-clients.md).

## Triage: what is on fire right now

From the events page, or anywhere once you name the scope:

> Summarize the distribution of currently active alerts

> Which rules or targets have the most active alerts?

> Group current active alerts by severity and business group

Behind these is `query-alert-events`, which knows how to filter and aggregate events rather than
listing them one by one. Expected result: a table, not a wall of individual alerts.

Then narrow to one. On an event detail page:

> Analyze the root cause of this alert event

> Find similar historical alerts on the same target/rule

> Show other active alerts on the same target around this time

`ops-troubleshooting` drives this one and budgets 25 tool calls for it, because the chain is long:
pull the event, pull the rule, run its query over the window, check the neighbours, check whether a
muting rule was in play. What comes back is an evidence chain — you still decide.

For "the heartbeat stopped but I can still ping it", the skill is `host-health-diagnose`, whose
stated position is that **an unreachable agent is not a down host**:

> Why did this host go offline?

## Why this alert fired — and why that rule did not

These are two different questions with two different skills, and saying which you mean gets you the
right one.

> Why did this alert fire?

> Why did a specific alert rule not fire?

The second is `alert-rule-troubleshoot`: it walks the rule definition, the evaluation logs, the
event hash, the processing logs, and the muting rules, in that order. Name the rule. The most
common answers it finds are a datasource that returned nothing, a `for` duration never satisfied,
and a muting rule nobody remembered.

## Find the noise

The starter card in a new chat is exactly this, and it is the shipped wording:

> Review my current alert rules: which have fired most often in the last 7 days, and which have
> never fired?

Both halves matter: the noisy rules cost attention, and rules that have never fired in a year are
usually broken rather than lucky. Follow up in the same conversation:

> Break down current alerts by severity, business group and target

> Which alerts fired most frequently recently? Any scenarios suitable for self-healing?

That last one comes from the self-healing page, and it is a good bridge: a mechanical alert that
recurs weekly is a candidate for a script. See
[Trigger self-healing with ibex / webhook](../events/self-healing.md).

## Explain a spike, or write the query

Beside every PromQL editor — Metrics explorer, alert rule form, recording rules, dashboard panels —
there is a small AI button whose suggestions are query-shaped:

> Generate a query for host CPU usage

`promql-generator` handles these, and it looks up which metrics you actually have rather than
inventing plausible names. `sql-generator` does the same for MySQL, PostgreSQL, ClickHouse and
Doris. Expected result: a query card you can execute in place, not a code block you have to copy.

On a dashboard:

> Analyze this dashboard

> Find panels with abnormal metrics or trends

`analyze-dashboard` reads the panel definitions, runs them over a window, and reports which ones
look wrong — useful when a dashboard has grown to forty panels nobody reads.

## Two more that come up constantly

**A host that never showed up.** From the host list, after installing Categraf somewhere:

> I just installed a host but it does not appear / shows unknown, why?

`host-onboard-diagnose` treats onboarding as a pipeline and walks it — heartbeat, hostname and
`ident`, TLS, token, routing — instead of stopping at the first plausible cause. It is deliberately
separate from `host-health-diagnose`: this one is "never registered", that one is "registered
before, lost contact now".

**Notifications that did not arrive.** From a notification rule or a media type:

> Which events will this rule match after saving?

> Why did my alert not send a notification?

> Why can the test receive but real notifications fail?

The last one is the interesting case — a test send bypasses matching, so "test works, real does
not" is nearly always the rule's conditions rather than the channel. `notify-rule-copilot` and
`notify-channel-copilot` cover the two halves. For the message body itself, from the template
editor:

> Add hostname and severity label to the notification template

> Format `trigger_value` with two decimal places in the template

## Making a prompt work

- **Say which object you mean.** "Why didn't rule 42 fire" beats "why don't I get alerts". The
  assistant will ask, but that costs a round trip.
- **Give it a window.** "In the last 7 days" changes what it queries.
- **Ask for the format.** "As a table, one row per rule" is honoured, and much easier to scan.
- **Stay in the conversation.** Follow-ups reuse everything already fetched; a new chat starts from
  nothing.
- **Say what you do not want.** "Don't change anything, just tell me what you would change" keeps
  a session read-only when you want it to be.
- **Watch the status line.** While it works, a line above the reply names the step it is on. A long
  pause on one step is where to look when an answer comes back thin.

## Next

- Why some of these need a skill: [Install, manage and write Skills](./skills.md)
- Before letting it change anything: [Safe automation patterns](./automation.md)
- When it answers badly or not at all: [AI / Skill / MCP troubleshooting](./troubleshooting.md)
