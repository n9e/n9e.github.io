# AI and MCP

The built-in assistant, the Skills marketplace, and an MCP endpoint that lets Claude Code or Cursor drive Nightingale with exactly your permissions.

Since v9 the `n9e` process is itself an MCP server. There is no extra component to deploy: the endpoint lives inside the process you already run.

## Connect a client[​](#connect-a-client "Direct link to Connect a client")

Claude Code, Cursor and anything else that speaks MCP connect to `/mcp`:

\~/.claude.json

```
{

  "mcpServers": {

    "nightingale": {

      "type": "http",

      "url": "http://127.0.0.1:17000/mcp",

      "headers": { "X-User-Token": "<your-token>" }

    }

  }

}
```

## What a client can reach[​](#what-a-client-can-reach "Direct link to What a client can reach")

**74 tools across 13 toolsets** — 42 read, 32 write:

`alerts` · `targets` · `datasource` · `mutes` · `busi_groups` · `notify_rules` · `alert_subscribes` · `event_pipelines` · `users` · `metrics` · `logs` · `dashboards` · `roles`

Every tool call is dispatched onto Nightingale's own HTTP API carrying your token, so **a client can never reach anything its token's owner cannot** — the RBAC is identical to that user in the UI.

## Authentication[​](#authentication "Direct link to Authentication")

Personal token, or OAuth 2.1. Nightingale can act as the authorization server itself, which lets hosted clients like Claude and ChatGPT connect with zero pre-registration; it can also act as a resource server in front of an existing Keycloak, Entra ID or Okta.

Write tools are opt-in

The 32 write tools are not registered until you turn them on in config.

## Nightingale AI[​](#nightingale-ai "Direct link to Nightingale AI")

The built-in assistant and its Skills marketplace ship with the product.

## [Nightingale AI overview](https://n9e.github.io/docs/ai/nightingale-ai.md)

[Nightingale AI is the built-in assistant: it answers questions about alerts, metrics and configuration, drafts changes, and sees only what the asking user can see.](https://n9e.github.io/docs/ai/nightingale-ai.md)

## [Configure an LLM provider](https://n9e.github.io/docs/ai/llm-provider.md)

[Point Nightingale at OpenAI-compatible, Anthropic or self-hosted models; keys, base URLs and model selection.](https://n9e.github.io/docs/ai/llm-provider.md)

## [Agents and conversation history](https://n9e.github.io/docs/ai/agents.md)

[Conversation history is stored server-side and can be reviewed or deleted; in the open-source build an agent is an internal binding, not something you create.](https://n9e.github.io/docs/ai/agents.md)

## [Install, manage and write Skills](https://n9e.github.io/docs/ai/skills.md)

[A skill is a procedure in a SKILL.md file: install one from the marketplace or write your own, scope it to teams, and the assistant uses it for matching questions.](https://n9e.github.io/docs/ai/skills.md)

## [Enable the MCP endpoint](https://n9e.github.io/docs/ai/mcp-endpoint.md)

[The /mcp endpoint is built into the n9e process and on by default; list its tools with curl to confirm it is up, and restrict which toolsets it exposes in config.](https://n9e.github.io/docs/ai/mcp-endpoint.md)

## [Connect an MCP client](https://n9e.github.io/docs/ai/mcp-clients.md)

[Claude Code, Cursor and other MCP clients connect with just the /mcp URL and a token; one read-only prompt confirms the connection works.](https://n9e.github.io/docs/ai/mcp-clients.md)

## [Personal token authentication](https://n9e.github.io/docs/ai/token-auth.md)

[Create a token, pass it in X-User-Token, and understand that the client inherits exactly that user's permissions.](https://n9e.github.io/docs/ai/token-auth.md)

## [OAuth 2.1 and external identity](https://n9e.github.io/docs/ai/oauth.md)

[Nightingale as authorization server for hosted clients, or as resource server in front of Keycloak, Entra ID or Okta.](https://n9e.github.io/docs/ai/oauth.md)

## [Read and write toolsets](https://n9e.github.io/docs/ai/toolsets.md)

[The MCP endpoint offers 74 tools in 13 toolsets; six toolsets are entirely read-only, there are no delete tools, and write tools must be enabled separately.](https://n9e.github.io/docs/ai/toolsets.md)

## [Enable write tools safely](https://n9e.github.io/docs/ai/write-tools.md)

[MCP write tools are not registered by default; enable them explicitly under \[HTTP.A2A\], scope them to one token, and every change is traceable in the log.](https://n9e.github.io/docs/ai/write-tools.md)

## [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md)

[Every MCP tool call is an internal API call made as the token's user, so a client never sees or changes more than that user; business groups apply unchanged.](https://n9e.github.io/docs/ai/permissions.md)

## [Common investigation workflows](https://n9e.github.io/docs/ai/workflows.md)

[Paste-ready investigation prompts paired with the built-in skill that answers each: triage active events, find the noisiest rule, explain a metric spike.](https://n9e.github.io/docs/ai/workflows.md)

## [Safe automation patterns](https://n9e.github.io/docs/ai/automation.md)

[Safe AI automation keeps a person in the loop at write time: the assistant proposes and you confirm, one account can write, or AI drafts a script that a human runs.](https://n9e.github.io/docs/ai/automation.md)

## [A2A endpoint](https://n9e.github.io/docs/ai/a2a.md)

[The A2A endpoint exposes Nightingale as an agent that other agent platforms can discover and call; the agent card declares the address and supported methods.](https://n9e.github.io/docs/ai/a2a.md)

## [AI / Skill / MCP troubleshooting](https://n9e.github.io/docs/ai/troubleshooting.md)

[Symptom-by-symptom fixes for the AI features: the assistant stays silent or stops halfway, a skill is ignored or fails to install, an MCP client cannot connect.](https://n9e.github.io/docs/ai/troubleshooting.md)
