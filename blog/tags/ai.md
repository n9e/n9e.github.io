# One post tagged with "AI and MCP"

AI assistants, MCP servers and how they touch production systems.

[View all tags](https://n9e.github.io/blog/tags.md)

## [MCP server for alerting: six design decisions](https://n9e.github.io/blog/mcp-server-for-alerting.md)

November 1, 2026 ·

<!-- -->

7 min read

Eric Qin

![An AI client asking which alerts are firing, connected with a user\&#39;s token to Nightingale\&#39;s MCP endpoint](https://n9e.github.io/assets/images/mcp-server-design-c8e30bb02b115a796a5092ccdd548d47.webp)

Since v9, the Nightingale process is also an MCP server. Claude Code, Cursor or any other MCP client can connect to `/mcp` and ask which alerts are firing, which rules are noisiest, or what a metric did over the last hour.

The tool list was the easy part. The hard questions were about trust. Whose permissions does the AI client have? What can it change? How do you find out afterwards what it did? This post walks through the six decisions we made, and one caveat we haven't solved.

**Tags:**

* [AI and MCP](https://n9e.github.io/blog/tags/ai.md "AI assistants, MCP servers and how they touch production systems.")
* [Alerting](https://n9e.github.io/blog/tags/alerting.md "Designing alert rules that page for the right reasons.")

[**Read more**](https://n9e.github.io/blog/mcp-server-for-alerting.md)
