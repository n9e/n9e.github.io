---
title: "Try a workflow with a mock event"
sidebar_label: "Try a workflow with a mock event"
description: "Run a pipeline against a hand-written event and see each processor's output before anything is live."
---

Where this page ends: before the workflow is attached to any rule, you can see what it does to
an event — which processor changed which label, and whether the event was dropped along the way.

## Where the test run lives

Two places, with different reach:

- **A single processor**: every processor card has its own test button and runs only that
  processor. Use it while tuning a relabel regex, so you check one thing at a time;
- **The whole workflow**: the test button at the bottom of the form runs every processor top to
  bottom, which is how you check the ordering and whether an earlier processor drops the event
  first.

Both live in the workflow's add/edit drawer and **do not require saving first**. Opening one
validates the form, and a missing required field expands the offending card for you.

## History event or mock event

The first step of the dialog is **Select a test event**, with two tabs:

**History event** lists real alerts from the selected period; tick one. Prefer this: a real event
carries real labels and values, so the run is closest to production. When there are none, the
dialog says "No alert events in this time range" and offers a "Use a mock event instead" button.

**Mock event** is synthesised by the server. It **only exists in memory and is never persisted**,
so a fresh install that has never fired an alert can still validate a configuration. It always
carries these labels:

```
__name__=cpu_usage_idle
ident=mock-host-01
env=prod
service=web
```

plus a `rulename` label. **Severity** and **Recovered** are adjustable — processors often branch
on those ("drop S3", "drop recovery notices"), and only by toggling both do you exercise every
branch.

## Reading the result

Running switches to the **Test result** view, with three parts:

- The banner at the top: **Succeeded** or **Failed**;
- **Per-node results**: one entry per processor with a result message. Event drop reads
  "Condition matched — the event was dropped" or "Condition not matched — the event continues
  downstream"; label rewrite shows the before/after diff;
- **Processed event**: what the event looks like after the whole chain, rendered like an event
  detail page.

If the event was dropped mid-chain you get a notice: **the event was dropped / inhibited at this
step. Downstream processors will not run and no notification is produced.** That is a normal
outcome, not an error — the banner still says Succeeded.

To change something and run again, click **Pick another event** / **Reconfigure mock event** to
return to step one.

## How a test run differs from the real thing

The dialog states it plainly: **a test run uses the API-trigger path and skips some live steps
(such as filter matching), so the result may not exactly match a real alert.**

Concretely:

- **Scope is not evaluated.** A test run does not check applicable labels or attributes, so
  "the test produced output" does not mean the event would actually enter this workflow in
  production. A wrong scope shows up live as no execution records at all;
- **Mock events need extra care.** A mock event has those four fixed labels and nothing else, so
  processors branching on any other label can never be reached here;
- **A whole-workflow test run does write an execution record**, with trigger mode API and your
  username as the trigger. A single-processor test run writes nothing.

So a passing test run is not the last step: attach the workflow to a rule, wait for a real event,
and confirm in [Execution records](./execution-records.md).

## Next

- Attach the workflow: [Event pipelines](./pipelines.md)
- Results for real events: [Inspect workflow execution records](./execution-records.md)
- Tests fine but does nothing live: [A workflow tests fine but does nothing in production](../troubleshooting/workflow-prod-fails.md)
- The notification side has the same idea: [Verify the notification path](../notifications/test.md)
