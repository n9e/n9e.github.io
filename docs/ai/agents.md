# Agents and conversation history

Conversation history is stored server-side and can be reviewed or deleted; in the open-source build an agent is an internal binding, not something you create.

Last reviewed 2026-10-10

Two separate things share this page, and they are worth telling apart up front. **Conversation history is a real, everyday feature.** **"Agent" is an internal binding in the open-source build, not something you create** — the details are in the second half so you do not go looking for a page that is not there.

## Where conversations live[​](#where-conversations-live "Direct link to Where conversations live")

Every turn is written to the database as it happens, so a conversation survives a page reload, a different browser and a restart of `n9e`. Two tables hold it:

| Table                  | What it holds                                                                    |
| ---------------------- | -------------------------------------------------------------------------------- |
| `ai_assistant_chat`    | One row per conversation: its id, its owner, its title, when it was last touched |
| `ai_assistant_message` | One row per turn: your question, the answer, and the tool calls behind it        |

Both bodies are compressed, so the rows are smaller than the transcripts suggest.

**Conversations are strictly per user.** Every read and write checks that the requesting account owns the conversation, with no administrator override, so one person's chats are not visible to anyone else — including through the API.

An `/a2a` conversation is the same object: the `contextId` a caller passes back is the `chat_id`, so an agent talking to Nightingale through [A2A](https://n9e.github.io/docs/ai/a2a.md) appears in that user's list alongside what they typed in the browser.

## What you can do with one[​](#what-you-can-do-with-one "Direct link to What you can do with one")

The **Conversations** section of the Nightingale AI sidebar lists yours, newest first, grouped into Today / Yesterday / older, with a box that filters on title. Hovering a row reveals a menu:

* **Rename** — inline. Titles are generated from the first question otherwise, and renaming pins yours so the automatic title never overwrites it;
* **Share** — copies a link that opens the conversation read-only. The server still checks ownership on every read, so **the link works for you and nobody else**; treat it as a bookmark to a read-only view, not as a way to hand a transcript to a colleague. To do that, copy the text.

## Deleting one[​](#deleting-one "Direct link to Deleting one")

**There is no delete button.** The endpoint exists; nothing in the interface calls it. Until that changes, deleting is an API call with your own token:

```
curl -s --request DELETE \

  -H 'X-User-Token: YOUR_TOKEN' \

  http://127.0.0.1:17000/api/n9e/assistant/chat/YOUR_CHAT_ID
```

The chat id is the last path segment of the conversation's URL. Deleting removes its messages as well, and — the ownership check again — only works on your own conversations.

**There is no retention policy and no TTL.** Nothing expires conversations, so on a busy instance these two tables only grow. If that matters, script the call above; they are also ordinary tables that your backup and archival routine can treat like any other.

## What an "agent" is here[​](#what-an-agent-is-here "Direct link to What an \"agent\" is here")

There is an `ai_agent` table, and rows in it bind a **use case** to an LLM config and a list of skills. In the open-source build that is much less than it sounds:

* **The only use case is `chat`**, and exactly one enabled row for it is ever consulted;
* **A row is created for you at startup** — `default-chat-agent`, bound to no specific model — so the assistant works out of the box;
* **There is no system prompt and no tool selection on the row.** Both are compiled into the product; nothing on an agent changes how the assistant thinks or what it may call;
* **The skills bound to the chat agent are ignored** on the ordinary conversation path. Skills are discovered from the catalogue and loaded on demand instead — see [Install, manage and write Skills](https://n9e.github.io/docs/ai/skills.md);
* **There is no menu entry**, no permission point of its own, and the list page that does exist has had its create button removed. It is administrator-only and reachable by typing the address.

So: do not build a workflow on named agents in the open-source build. If a page or a screenshot elsewhere shows agent management as a feature, it is not this edition.

## What to change instead of an agent[​](#what-to-change-instead-of-an-agent "Direct link to What to change instead of an agent")

| What you actually want                      | Where to do it                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A different model for the assistant         | Mark a different LLM config **Default** — it wins over any agent binding anyway ([Configure an LLM provider](https://n9e.github.io/docs/ai/llm-provider.md)) |
| Different behaviour for a class of question | Write a skill; its description decides when it applies ([Install, manage and write Skills](https://n9e.github.io/docs/ai/skills.md))                         |
| More tools for one procedure                | `builtin_tools` in that skill's frontmatter                                                                                                                  |
| A longer diagnostic chain                   | `max_iterations` in that skill's frontmatter                                                                                                                 |
| Restrict what the assistant can reach       | The asking account's role and business groups ([Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md))                              |

## Next[​](#next "Direct link to Next")

* What the assistant does with a conversation: [Nightingale AI overview](https://n9e.github.io/docs/ai/nightingale-ai.md)
* The skill mechanism that replaces per-agent prompts: [Install, manage and write Skills](https://n9e.github.io/docs/ai/skills.md)
* Conversations that arrive from another agent: [A2A endpoint](https://n9e.github.io/docs/ai/a2a.md)
