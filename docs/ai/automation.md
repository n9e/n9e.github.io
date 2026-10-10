---
title: "Safe automation patterns"
sidebar_label: "Safe automation patterns"
description: "Safe AI automation keeps a person in the loop at write time: the assistant proposes and you confirm, one account can write, or AI drafts a script that a human runs."
---

This page is about one boundary: how much you let an AI change, and what stops a wrong change from
becoming an outage. The short answer is that the safe patterns are the ones where a person is still
in the loop at the moment of the write — and Nightingale enforces that on one surface and leaves it
to you on the others.

## Three surfaces, three write postures

| Surface | Can it write? | What stands between the model and the database |
|---|---|---|
| Built-in assistant | Yes, a short list | A server-side confirmation card on every update; a form when a create is missing something |
| `/mcp` | Only after you turn write tools on | Nothing at call time — a write tool writes on the first call |
| `/a2a` | It is the built-in assistant | Same confirmation, but the confirming turn has to come from the calling agent |

One property they share, and it is worth stating plainly: **there is no delete tool anywhere.** Not
in the assistant's toolbox, not among the MCP tools. The worst an AI can do to a rule, a dashboard
or a user is change it — which is why "who changed this" matters more here than "who deleted it".

## Pattern 1 — the assistant proposes, you confirm

This is the default and the one to prefer, because the gate is in the server rather than in a
prompt somebody can talk their way around.

The tools it covers are the ones that modify something that already exists — an alert rule, a
dashboard, a muting rule, a notification rule, a subscription — plus skill authoring. Each works in
two legs:

1. **Propose.** The tool computes the change, stores it under a one-time id, and returns
   **without writing**. The turn ends with a card listing what would change, written by the tool
   itself so the model cannot soften it.
2. **Confirm.** Only your reply in a **later turn** applies it, replayed from what was stored. The
   model is not consulted again, so it cannot quietly alter the payload between showing you the
   diff and writing it.

Three things bound a proposal, all deliberate:

- it expires after **30 minutes**;
- it can be confirmed **once** — a second confirmation finds nothing to apply;
- the object's state is fingerprinted at propose time, and a confirmation is **refused if somebody
  edited it in the meantime** rather than overwriting their work.

Creates are handled differently but with the same intent: when a create tool is missing something
it must not guess — a business group, a team — it does not choose one. It returns a dropdown and
waits for you.

## Pattern 2 — read-only by default, one account that can write

On `/mcp` there is no confirmation card, so the boundary has to be built out of accounts and
config. The pattern that works:

- every client gets its own least-privilege account and its own token, so an incident is traceable
  to one integration ([Personal token authentication](./token-auth.md));
- write tools stay off unless one specific client genuinely needs them, and even then the toolsets
  are narrowed to what that client does — with `users` and `roles` dropped
  ([Enable write tools safely](./write-tools.md));
- the account's business-group membership is the real limit on blast radius, because it applies to
  reads and writes alike ([Permission inheritance and RBAC](./permissions.md)).

If what you actually wanted was "let the AI help me change configuration", note that the built-in
assistant already does that with a confirmation step. Turning MCP write tools on to get the same
outcome trades that away.

## Pattern 3 — the AI drafts the script, a person runs it

Self-healing is the case where automation is most tempting and most dangerous, so it is worth being
precise about what the open-source build does.

**The assistant can read your self-healing scripts and write new ones as text.** It has read access
to the script library, and a built-in skill for authoring them:

> Write a self-healing script for disk cleanup

> How does a self-healing script read alert fields from stdin?

**It cannot create one and it cannot run one.** There is no tool for either. Saving the script and
running it against hosts stays entirely in **Alerts & Notifications → Self-healing**, where the
existing controls apply — see
[Trigger self-healing with ibex / webhook](../events/self-healing.md).

That division is the pattern: the model produces a proposal in a form you can read and review, a
human commits it, and the execution path never has a model in it.

## Guardrails worth setting deliberately

| Guardrail | Where |
|---|---|
| Write tools off on `/mcp` — the default; leave it | `MCPEnableWriteTools` under `[HTTP.A2A]` |
| Drop `users` and `roles` from any client that does write | `MCPToolsets` |
| Drop `logs` if you have SQL datasources registered | `MCPToolsets`, and see [Permission inheritance and RBAC](./permissions.md) |
| Refuse skill scripts rather than running them unisolated | `RequireIsolation` under `[Center.Sandbox]`, see [Install, manage and write Skills](./skills.md) |
| Keep the AI account out of business groups it has no business in | **Organization → Teams** |
| Never give an AI account the `Admin` role | It bypasses the business-group layer entirely |

## How to check what changed

Three trails, in increasing order of effort:

**The object itself.** Anything changed through the assistant or over MCP carries the acting user's
name in its "updated by" field, exactly as a UI edit would. The list pages show it.

**The conversation.** An assistant change leaves the proposal card and your confirmation in the
transcript, which is stored per user and not expired — so "what exactly did I approve" is
answerable months later. See [Agents and conversation history](./agents.md).

**The logs.** Every `/mcp` request is logged with the tool name, arguments and the acting user;
every skill script execution is logged with its isolation level and exit code. Details and a
grep-able example are in [Enable write tools safely](./write-tools.md).

## What it will not do on its own

In the open-source build **every AI action starts with a person in a conversation**. Nothing is
scheduled, nothing runs unattended, and no tool executes a command on a monitored host. A skill
script is the one thing that runs code, it only runs when the model calls it inside a turn you
started, and you can refuse it outright — again, in
[Install, manage and write Skills](./skills.md).

## Next

- The confirmation mechanism in context: [Nightingale AI overview](./nightingale-ai.md)
- The MCP write switch: [Enable write tools safely](./write-tools.md)
- Prompts that keep a session read-only: [Common investigation workflows](./workflows.md)
