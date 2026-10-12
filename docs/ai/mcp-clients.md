# Connect Claude Code / Cursor / other clients

Claude Code, Cursor and other MCP clients connect with just the /mcp URL and a token; one read-only prompt confirms the connection works.

Last reviewed 2026-10-10

Where this page ends: an MCP client connected to Nightingale, and a read-only prompt whose answer proves that the address, the token and the permissions are all right.

## A client only needs two things[​](#a-client-only-needs-two-things "Direct link to A client only needs two things")

| What it asks for | Value                                                               |
| ---------------- | ------------------------------------------------------------------- |
| Address          | `https://n9e.example.com/mcp` — root path, **not** under `/api/n9e` |
| Auth             | The header `X-User-Token: <your token>`                             |

Creating a token is covered in [Personal token authentication](https://n9e.github.io/docs/ai/token-auth.md). Testing locally, the address is `http://127.0.0.1:17000/mcp`.

The transport is MCP Streamable HTTP, so **no** local stdio gateway or proxy process is involved. If a client config asks for `command` and `args`, that is the stdio style and does not apply here.

## The common config shape[​](#the-common-config-shape "Direct link to The common config shape")

Claude Code, Claude Desktop and Cursor all take the same JSON structure; only the file location differs:

```
{

  "mcpServers": {

    "nightingale": {

      "type": "http",

      "url": "https://n9e.example.com/mcp",

      "headers": { "X-User-Token": "YOUR_TOKEN" }

    }

  }

}
```

* **Claude Code**: put it in the user config `~/.claude.json`, or add it with `claude mcp add`;
* **Cursor**: `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in the project;
* **Other clients**: look for their "remote / HTTP MCP server" section — anything that accepts a URL plus a custom header will connect.

Restart the client afterwards. Expected result: `nightingale` shows as connected in the client's MCP server list, with **42** tools by default (74 once write tools are on).

## Hosted clients: Claude, ChatGPT[​](#hosted-clients-claude-chatgpt "Direct link to Hosted clients: Claude, ChatGPT")

These run on somebody else's servers and cannot send a custom header — they only take an address. They use OAuth instead: you enable the built-in authorization server, the user clicks "Allow" once inside their client, and you issue no tokens at all.

In the client's "add custom connector" / "Remote MCP server" field, enter `https://n9e.example.com/mcp` and let it discover the rest. The server side has to be prepared first — see [OAuth 2.1 and external identity providers](https://n9e.github.io/docs/ai/oauth.md), which also lists the three conditions the address must satisfy (reachable from the browser, byte-identical to `Issuer`, and HTTPS).

## A first prompt to prove the connection[​](#a-first-prompt-to-prove-the-connection "Direct link to A first prompt to prove the connection")

Once connected, ask for something read-only whose answer you can check at a glance:

> List every business group I can see.

Expected result: exactly the groups you see when logged into the UI as that account. A different count means the token belongs to another account, or the account is not scoped the way you thought — go back to [Permission inheritance and RBAC](https://n9e.github.io/docs/ai/permissions.md).

Then try one that touches data:

> Which alerts are firing right now? Group them by severity.

That one exercises `list_active_alerts`; a useful answer means the tool-call path works end to end.

## When it will not connect[​](#when-it-will-not-connect "Direct link to When it will not connect")

| Symptom                      | Usually                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| 401                          | Wrong or deleted token, or `[HTTP.TokenAuth]` is off                                      |
| 405                          | The client sent `GET /mcp` — stateless mode has no standalone SSE stream, only POST       |
| 415 / 400                    | Missing `Content-Type: application/json` or `Accept: application/json, text/event-stream` |
| 403 mentioning Host          | The reverse proxy does not set `proxy_set_header Host`, tripping DNS-rebinding protection |
| Connects but has no tools    | Every name in `MCPToolsets` was misspelled and dropped                                    |
| Drops after about 60 seconds | nginx is missing `proxy_buffering off` and long timeouts                                  |

Step-by-step fixes are in [AI / Skill / MCP troubleshooting](https://n9e.github.io/docs/ai/troubleshooting.md).

## Next[​](#next "Direct link to Next")

* Let it change things: [Enable write tools safely](https://n9e.github.io/docs/ai/write-tools.md)
* Prompts that work: [Common investigation workflows](https://n9e.github.io/docs/ai/workflows.md)
* The tool list: [MCP tool reference](https://n9e.github.io/docs/reference/mcp-tools.md)
