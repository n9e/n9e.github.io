# I want to enable Nightingale AI

Configure an LLM provider, turn on the built-in assistant and the MCP endpoint, and connect a client such as Claude Code.

Last reviewed 2026-10-10

Where this path ends: you can ask "which S1 alerts are firing right now" inside Nightingale in plain language, and an MCP client such as Claude Code can ask the same thing. About 10 minutes.

## Before you start[​](#before-you-start "Direct link to Before you start")

* Nightingale is running;
* an API key for a model provider, or an Ollama running locally.

## 1. Configure a model[​](#1-configure-a-model "Direct link to 1. Configure a model")

The entry point lives inside **Nightingale AI** (the top-level item in the sidebar); its own secondary navigation has **LLM configs**. There is no top-level menu for it — visiting `/ai-config/llm-configs` redirects here.

Click **Add LLM config** and fill in:

| Field          | Notes                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Name           | Your own                                                                                                       |
| Provider type  | The form offers three: **OpenAI compatible**, **Anthropic Claude**, **Google Gemini**                          |
| API URL        | OpenAI-compatible services (vLLM, Azure OpenAI, Ollama, Kimi…) all use **OpenAI compatible** with your own URL |
| API key        |                                                                                                                |
| Model          | The model name, e.g. `gpt-4o`, `claude-sonnet-4-5`                                                             |
| Context length |                                                                                                                |

Save it and mark it **default**: anything that has no model of its own falls back to this one.

## 2. Ask it something[​](#2-ask-it-something "Direct link to 2. Ask it something")

Back in **Nightingale AI**, start a chat and ask:

> Which S1 alerts are firing right now?

The assistant queries your event data before answering. A useful answer means both halves — model and data — are wired up.

## 3. The MCP endpoint is already on[​](#3-the-mcp-endpoint-is-already-on "Direct link to 3. The MCP endpoint is already on")

`/mcp` and `/a2a` are **enabled by default**; no config change needed. They reuse `HTTP.TokenAuth`, so a client authenticates with `X-User-Token`. They also accept `Authorization: Bearer` when the built-in authorization server or external-IdP auth is enabled.

**The important part: an MCP client has exactly the permissions of the token's owner, and no more.** Create a dedicated least-privilege account for AI access rather than handing over root's token.

Only **read** tools are registered by default. Write tools (create / update / delete) are an explicit opt-in:

```
[HTTP.A2A]

MCPEnableWriteTools = true
```

You can also expose a subset of toolsets:

```
# empty = all default toolsets

MCPToolsets = ["alerts", "dashboards"]
```

There are 13 toolsets: `alerts`, `targets`, `datasource`, `mutes`, `busi_groups`, `notify_rules`, `alert_subscribes`, `event_pipelines`, `users`, `metrics`, `logs`, `dashboards`, `roles`. Unknown names are ignored — the list never widens by accident.

## 4. Connect a client[​](#4-connect-a-client "Direct link to 4. Connect a client")

Create a token first: avatar menu → personal settings → generate a token. Then point the client at Nightingale's `/mcp` endpoint with that token.

Verify with something read-only, such as "list all alert rules".

## Next[​](#next "Direct link to Next")

* What the assistant can see and do: [AI and MCP](https://n9e.github.io/docs/ai/overview.md)
* Turning on write access safely: [Enable write tools safely](https://n9e.github.io/docs/ai/write-tools.md)
* The tool list: [MCP tool reference](https://n9e.github.io/docs/reference/mcp-tools.md)
